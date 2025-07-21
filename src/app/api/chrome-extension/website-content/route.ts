import { NextRequest, NextResponse } from "next/server";

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { adminDb } from "@/lib/firebase-admin";

interface WebsiteContentRequest {
  url: string;
  title?: string;
  html?: string;
  content?: string;
  selectedText?: string;
  saveAsNote?: boolean;
  extractSummary?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  markdown: string;
  excerpt?: string;
  byline?: string;
  length: number;
  dir?: string;
  siteName?: string;
  publishedTime?: string;
}

/**
 * Extract readable content from HTML using Mozilla's Readability.js
 */
function extractReadableContent(html: string, url: string): ExtractedContent | null {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return null;
    }

    // Convert HTML to Markdown using Turndown
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });

    // Configure Turndown rules for better markdown conversion
    turndownService.addRule("removeComments", {
      filter: (node) => node.nodeType === 8, // Comment node
      replacement: () => "",
    });

    turndownService.addRule("preserveLineBreaks", {
      filter: "br",
      replacement: () => "\n",
    });

    const markdown = turndownService.turndown(article.content);

    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      markdown,
      excerpt: article.excerpt,
      byline: article.byline,
      length: article.length,
      dir: article.dir,
      siteName: article.siteName,
      publishedTime: article.publishedTime,
    };
  } catch (error) {
    console.error("Error extracting content with Readability:", error);
    return null;
  }
}

/**
 * Fetch webpage content from URL
 */
async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GenC-Bot/1.0; +https://gencapp.pro)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Error fetching webpage:", error);
    throw error;
  }
}

/**
 * Save extracted content as a note
 */
async function saveAsNote(
  userId: string,
  extractedContent: ExtractedContent,
  url: string,
  selectedText?: string,
  userTags: string[] = [],
  userMetadata: Record<string, any> = {},
): Promise<string> {
  try {
    const noteData = {
      title: extractedContent.title || "Webpage Content",
      content: selectedText || extractedContent.markdown,
      url,
      type: "webpage",
      tags: ["webpage", "article", ...userTags],
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        domain: new URL(url).hostname,
        originalTitle: extractedContent.title,
        byline: extractedContent.byline,
        excerpt: extractedContent.excerpt,
        length: extractedContent.length,
        siteName: extractedContent.siteName,
        publishedTime: extractedContent.publishedTime,
        extractedAt: new Date().toISOString(),
        hasSelectedText: !!selectedText,
        ...userMetadata,
      },
    };

    const docRef = await adminDb.collection("chrome_extension_notes").add(noteData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving note:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const { userId } = authResult;
    const body: WebsiteContentRequest = await request.json();

    // Validate required fields
    if (!body.url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 });
    }

    console.log(`[WEBSITE CONTENT] Processing ${body.url} for user ${userId}`);

    let html = body.html;
    let extractedContent: ExtractedContent | null = null;

    // If HTML not provided, fetch it from the URL
    if (!html) {
      try {
        console.log(`[WEBSITE CONTENT] Fetching content from ${body.url}`);
        html = await fetchWebpageContent(body.url);
      } catch (error) {
        console.error("Failed to fetch webpage:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch webpage content",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    }

    // Extract readable content using Readability
    if (html) {
      console.log(`[WEBSITE CONTENT] Extracting readable content`);
      extractedContent = extractReadableContent(html, body.url);
    }

    // Fallback to provided content if extraction fails
    if (!extractedContent && body.content) {
      console.log(`[WEBSITE CONTENT] Using provided content as fallback`);
      const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
      });

      extractedContent = {
        title: body.title || "Webpage Content",
        content: body.content,
        textContent: body.content.replace(/<[^>]*>/g, ""), // Strip HTML tags
        markdown: turndownService.turndown(body.content),
        length: body.content.length,
      };
    }

    if (!extractedContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to extract readable content from webpage",
        },
        { status: 400 },
      );
    }

    let noteId: string | undefined;
    let editUrl: string | undefined;

    // Save as note if requested
    if (body.saveAsNote) {
      console.log(`[WEBSITE CONTENT] Saving content as note`);
      noteId = await saveAsNote(userId, extractedContent, body.url, body.selectedText, body.tags, body.metadata);
      editUrl = `/dashboard/capture/notes/new?noteId=${noteId}`;
    }

    const response = {
      success: true,
      extractedContent: {
        title: extractedContent.title,
        markdown: extractedContent.markdown,
        textContent: extractedContent.textContent,
        excerpt: extractedContent.excerpt,
        byline: extractedContent.byline,
        length: extractedContent.length,
        siteName: extractedContent.siteName,
        publishedTime: extractedContent.publishedTime,
      },
      metadata: {
        url: body.url,
        domain: parsedUrl.hostname,
        extractedAt: new Date().toISOString(),
        hasSelectedText: !!body.selectedText,
      },
      ...(noteId && { noteId, editUrl }),
    };

    console.log(`[WEBSITE CONTENT] Successfully processed content (${extractedContent.length} chars)`);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing website content:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process website content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ success: false, error: "URL parameter is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 });
    }

    console.log(`[WEBSITE CONTENT] Quick extraction for ${url}`);

    // Fetch and extract content
    const html = await fetchWebpageContent(url);
    const extractedContent = extractReadableContent(html, url);

    if (!extractedContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to extract readable content from webpage",
        },
        { status: 400 },
      );
    }

    const parsedUrl = new URL(url);
    const response = {
      success: true,
      extractedContent: {
        title: extractedContent.title,
        markdown: extractedContent.markdown,
        textContent: extractedContent.textContent,
        excerpt: extractedContent.excerpt,
        byline: extractedContent.byline,
        length: extractedContent.length,
        siteName: extractedContent.siteName,
        publishedTime: extractedContent.publishedTime,
      },
      metadata: {
        url,
        domain: parsedUrl.hostname,
        extractedAt: new Date().toISOString(),
      },
    };

    console.log(`[WEBSITE CONTENT] Successfully extracted content (${extractedContent.length} chars)`);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error extracting website content:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract website content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
