import { NextRequest } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent";

function createFinalScriptPrompt(videoIdea: string, selectedComponents: any) {
  return `
Create a compelling script for this video idea: "${videoIdea}"

Use these selected components:

Selected Components:
HOOK: ${selectedComponents.hook?.content ?? ""}
BRIDGE: ${selectedComponents.bridge?.content ?? ""}
GOLDEN NUGGET: ${selectedComponents.goldenNugget?.content ?? ""}
CALL TO ACTION: ${selectedComponents.wta?.content ?? ""}

Instructions:
1. Create a cohesive, engaging script that flows naturally
2. Integrate all selected components seamlessly
3. Ensure the script is conversational and engaging
4. Keep the tone appropriate for the target audience
5. Make sure the call-to-action feels natural and not forced

Format the response as a complete script ready for recording.
`;
}

async function callGeminiAPI(prompt: string) {
  console.log('🔑 Using Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  console.log('🌐 Calling Gemini API URL:', GEMINI_API_URL);
  
  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    },
  };

  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify(requestBody),
  });

  console.log('📥 Response status:', response.status);
  console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API error response:', errorText);
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('📄 Response data:', JSON.stringify(data, null, 2));

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('❌ Invalid response structure:', data);
    throw new Error("Invalid response from Gemini API");
  }

  return data.candidates[0].content.parts[0].text;
}

export async function POST(req: NextRequest) {
  console.log('🚀 Starting final script generation...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Gemini API key not configured');
    return Response.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const { videoIdea, selectedComponents } = await req.json();
    console.log('📝 Video idea:', videoIdea);
    console.log('🧩 Selected components:', selectedComponents);

    if (!videoIdea || !selectedComponents) {
      console.error('❌ Missing required parameters');
      return Response.json({ error: "Video idea and selected components are required" }, { status: 400 });
    }

    const prompt = createFinalScriptPrompt(videoIdea, selectedComponents);
    console.log('💭 Generated prompt:', prompt);
    
    const finalScript = await callGeminiAPI(prompt);
    console.log('✅ Final script generated successfully, length:', finalScript.length);

    return Response.json({ finalScript });
  } catch (error) {
    console.error("❌ Error generating final script:", error);
    
    // Return a more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json({ 
      error: "Failed to generate final script", 
      details: errorMessage 
    }, { status: 500 });
  }
}
