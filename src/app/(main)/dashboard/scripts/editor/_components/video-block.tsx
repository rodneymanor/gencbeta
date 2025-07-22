"use client";

import { useState } from "react";

import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { Play, Video, Settings, ExternalLink } from "lucide-react";

// Bunny Video Block
export const BunnyVideoBlock = createReactBlockSpec(
  {
    type: "bunnyVideo",
    propSchema: {
      ...defaultProps,
      videoId: {
        default: "",
      },
      libraryId: {
        default: "",
      },
      autoplay: {
        default: false,
      },
      muted: {
        default: false,
      },
      loop: {
        default: false,
      },
      preload: {
        default: true,
      },
      responsive: {
        default: true,
      },
      caption: {
        default: "",
      },
      width: {
        default: "100%",
      },
      height: {
        default: "400px",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { block } = props;
      const { videoId, libraryId, autoplay, muted, loop, preload, responsive, caption, width, height } = block.props;

      const [isEditing, setIsEditing] = useState(false);
      const [localVideoId, setLocalVideoId] = useState(videoId);
      const [localLibraryId, setLocalLibraryId] = useState(libraryId);
      const [localCaption, setLocalCaption] = useState(caption);

      // Show configuration form if no video configured or in edit mode
      if (!videoId || !libraryId || isEditing) {
        return (
          <div className="my-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-medium text-gray-900">
                {isEditing ? "Edit Video Settings" : "Configure Video"}
              </span>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Library ID</label>
                <input
                  type="text"
                  value={localLibraryId}
                  onChange={(e) => setLocalLibraryId(e.target.value)}
                  placeholder="e.g., 459811"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Video ID</label>
                <input
                  type="text"
                  value={localVideoId}
                  onChange={(e) => setLocalVideoId(e.target.value)}
                  placeholder="e.g., 5fea560b-b73a-4556-824a-b6a6428028dd"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Caption (optional)</label>
                <input
                  type="text"
                  value={localCaption}
                  onChange={(e) => setLocalCaption(e.target.value)}
                  placeholder="Video caption or description"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (localVideoId && localLibraryId) {
                      props.editor.updateBlock(block, {
                        props: {
                          ...block.props,
                          videoId: localVideoId,
                          libraryId: localLibraryId,
                          caption: localCaption,
                        },
                      });
                      setIsEditing(false);
                    }
                  }}
                  disabled={!localVideoId || !localLibraryId}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400"
                >
                  {isEditing ? "Update Video" : "Add Video"}
                </button>

                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>
                <strong>Library ID:</strong> Found in your Bunny.net Stream library settings
              </p>
              <p>
                <strong>Video ID:</strong> The unique identifier for your video (GUID format)
              </p>
            </div>
          </div>
        );
      }

      // Construct Bunny.net iframe URL
      const queryParams = new URLSearchParams({
        autoplay: autoplay.toString(),
        muted: muted.toString(),
        loop: loop.toString(),
        preload: preload.toString(),
        responsive: responsive.toString(),
      });

      const bunnyUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${queryParams.toString()}`;
      const playerUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`;

      return (
        <div className="my-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          {/* Video Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" style={{ display: "none" }}>
              <Play className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-900">Video Player</span>
            </div>
            <div className="flex gap-2" style={{ display: "none" }}>
              <button
                onClick={() => window.open(playerUrl, "_blank")}
                className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                title="Open in new tab"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                title="Edit video settings"
              >
                <Settings className="h-3 w-3" />
                Edit
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative overflow-hidden rounded-md bg-black" style={{ width: "200px", height: "356px" }}>
            <iframe
              src={bunnyUrl}
              loading="lazy"
              style={{
                border: 0,
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "100%",
              }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen={true}
              title={caption || `Video ${videoId}`}
            />
          </div>

          {/* Caption */}
          {caption && <div className="mt-3 text-sm text-gray-600">{caption}</div>}
        </div>
      );
    },

    // Handle iframe parsing when pasting Bunny.net URLs or iframes
    parse: (element) => {
      if (element.tagName === "IFRAME") {
        const src = element.getAttribute("src");
        if (src && src.includes("iframe.mediadelivery.net")) {
          const match = src.match(/embed\/(\d+)\/([a-f0-9-]+)/);
          if (match) {
            return {
              libraryId: match[1],
              videoId: match[2],
            };
          }
        }
      }

      // Also handle plain text URLs
      if (element.tagName === "P" || element.tagName === "DIV") {
        const text = element.textContent || "";
        const urlMatch = text.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/);
        if (urlMatch) {
          return {
            libraryId: urlMatch[1],
            videoId: urlMatch[2],
          };
        }
      }

      return undefined;
    },
  },
);
