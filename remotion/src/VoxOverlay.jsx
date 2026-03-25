import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  OffthreadVideo,
  staticFile,
} from "remotion";

// 9:16 composition with VoxTitle overlay at the bottom
// Overlay is 16:9 aspect ratio, positioned lower third, with faded edges

const OVERLAY_WIDTH_PERCENT = 0.92; // 92% of canvas width
const OVERLAY_BOTTOM = 60; // px from bottom

export const VoxOverlay = () => {
  const frame = useCurrentFrame();

  // Canvas: 1080x1920 (9:16)
  const canvasW = 1080;
  const canvasH = 1920;

  // Overlay dimensions — 16:9 aspect ratio, fitting within canvas width
  const overlayW = canvasW * OVERLAY_WIDTH_PERCENT;
  const overlayH = overlayW * (9 / 16); // 16:9 ratio
  const overlayX = (canvasW - overlayW) / 2;
  const overlayY = canvasH - overlayH - OVERLAY_BOTTOM;

  // Fade in the overlay (frames 0-20) and fade out at end (frames 220-240)
  const overlayOpacity = interpolate(frame, [0, 20, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Unique filter ID
  const filterId = "vox-overlay-fade";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background: 9:16 footage */}
      <OffthreadVideo
        src={staticFile("footage_original_30fps.mp4")}
        style={{
          width: canvasW,
          height: canvasH,
          objectFit: "cover",
        }}
      />

      {/* SVG filter for faded/rounded edges on overlay */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            {/* Gaussian blur on the alpha channel to soften edges */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="0" />
            {/* Create a smaller rect and blur its edges for the mask */}
            <feFlood floodColor="white" result="white" />
            <feFlood floodColor="black" result="black" />
            {/* We'll use CSS mask instead */}
          </filter>
        </defs>
      </svg>

      {/* VoxTitle overlay — lower third with faded edges */}
      <div
        style={{
          position: "absolute",
          left: overlayX,
          top: overlayY,
          width: overlayW,
          height: overlayH,
          opacity: overlayOpacity,
          borderRadius: 20,
          overflow: "hidden",
          // Faded edges using mask — gradient fades out at all edges
          WebkitMaskImage: `
            linear-gradient(to right,
              transparent 0%,
              black 8%,
              black 92%,
              transparent 100%
            )
          `,
          maskImage: `
            linear-gradient(to right,
              transparent 0%,
              black 8%,
              black 92%,
              transparent 100%
            )
          `,
          // Combine horizontal + vertical fade with mask-composite
          // Using a layered approach for corner fading
        }}
      >
        {/* Inner container with vertical fade */}
        <div
          style={{
            width: "100%",
            height: "100%",
            WebkitMaskImage: `
              linear-gradient(to bottom,
                transparent 0%,
                black 12%,
                black 88%,
                transparent 100%
              )
            `,
            maskImage: `
              linear-gradient(to bottom,
                transparent 0%,
                black 12%,
                black 88%,
                transparent 100%
              )
            `,
          }}
        >
          <OffthreadVideo
            src={staticFile("vox_title.mp4")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
