import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["900"],
  subsets: ["latin"],
});

// Aggressive velocity curve matching Premiere screenshots:
// -271.9/sec at start → 0/sec at end
// This is a very aggressive ease-out (much faster than cubic)
const premiereCurve = (t) => {
  // Quintic ease-out — extremely fast start, very gentle landing
  return 1 - Math.pow(1 - t, 5);
};

// Stickfigure placeholder
const StickFigure = () => (
  <svg width="120" height="280" viewBox="0 0 120 280" fill="none">
    <circle cx="60" cy="40" r="30" stroke="white" strokeWidth="4" fill="none" />
    <circle cx="48" cy="35" r="4" fill="white" />
    <circle cx="72" cy="35" r="4" fill="white" />
    <path d="M45 48 Q60 60 75 48" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    <line x1="60" y1="70" x2="60" y2="170" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <line x1="60" y1="100" x2="20" y2="140" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <line x1="60" y1="100" x2="100" y2="130" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <line x1="60" y1="170" x2="30" y2="260" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <line x1="60" y1="170" x2="90" y2="260" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const Background = () => (
  <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at 50% 40%, #2d1f3d 0%, #1a1a2e 50%, #0d0d1a 100%)",
    }} />
    <div style={{ position: "absolute", top: 80, left: 100, width: 300, height: 8, backgroundColor: "#3a2a1a", borderRadius: 2 }} />
    <div style={{ position: "absolute", top: 60, left: 120, width: 40, height: 20, backgroundColor: "#c4653a", borderRadius: 3 }} />
    <div style={{ position: "absolute", top: 55, left: 200, width: 50, height: 25, backgroundColor: "#457b9d", borderRadius: 3 }} />
    <div style={{ position: "absolute", top: 50, left: 300, width: 35, height: 30, backgroundColor: "#e9c46a", borderRadius: 3 }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, backgroundColor: "#2a1f14", borderTop: "3px solid #4a3520" }} />
    <div style={{ position: "absolute", top: 20, right: 80, width: 60, height: 60, backgroundColor: "rgba(255,180,80,0.15)", borderRadius: "50%", filter: "blur(20px)" }} />
    <div style={{ position: "absolute", top: 100, left: 50, width: 80, height: 80, backgroundColor: "rgba(200,100,200,0.08)", borderRadius: "50%", filter: "blur(30px)" }} />
  </AbsoluteFill>
);

// Inner content that gets zoomed — wrapped in CameraMotionBlur
const ZoomContent = () => {
  const frame = useCurrentFrame();

  // ZOOM: 250% → 100% over 60 frames (2 sec) with aggressive Premiere curve
  const zoomDuration = 60;
  const zoomProgress = Math.min(frame / zoomDuration, 1);
  const easedProgress = premiereCurve(zoomProgress);
  const scale = interpolate(easedProgress, [0, 1], [2.5, 1]);

  // Vignette fades in as zoom settles
  const vignetteOpacity = interpolate(easedProgress, [0, 1], [0, 0.4]);

  // Text appears AFTER zoom settles
  const textDelay = zoomDuration + 10;
  const textProgress = Math.max(0, (frame - textDelay) / 15);
  const textOpacity = Math.min(textProgress, 1);
  const textY = interpolate(Math.min(textProgress, 1), [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Background />
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
        }}>
          <StickFigure />
        </div>
      </div>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
        pointerEvents: "none",
      }} />

      {/* Text after zoom */}
      {frame >= textDelay && (
        <div style={{
          position: "absolute",
          bottom: 250,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}>
          <div style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 72,
            color: "#FFFFFF",
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            letterSpacing: "-2px",
          }}>
            Zoom
          </div>
          <div style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 42,
            color: "#FF8C00",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginTop: 4,
          }}>
            INTRO
          </div>
        </div>
      )}

      {/* Grain */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "256px 256px",
        opacity: 0.04,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};

export const ZoomIntro = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CameraMotionBlur
        shutterAngle={360}
        samples={10}
      >
        <ZoomContent />
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};
