import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  OffthreadVideo,
  staticFile,
} from "remotion";

const zoomEase = (t) => 1 - Math.pow(1 - t, 6);

export const ZoomIntroReal = () => {
  const frame = useCurrentFrame();

  // Zoom: 280% → 100% in ~1 second (30 frames)
  const zoomDuration = 30;
  const zoomProgress = Math.min(frame / zoomDuration, 1);
  const easedProgress = zoomEase(zoomProgress);
  const scale = interpolate(easedProgress, [0, 1], [2.8, 1]);

  // Blur intensity (gaussian on the main layer)
  const mainBlur = interpolate(easedProgress, [0, 0.5, 1], [8, 2, 0]);

  // Chromatic aberration intensity (RGB channel offset)
  const chromaOffset = interpolate(easedProgress, [0, 0.4, 1], [12, 4, 0]);

  // Radial zoom blur — multiple ghost copies at increasing scales
  const radialBlurIntensity = interpolate(easedProgress, [0, 0.5, 1], [1, 0.3, 0]);

  // Vignette — very heavy during zoom
  const vignetteStrength = interpolate(easedProgress, [0, 0.5, 1], [0.85, 0.5, 0.2]);

  // Brightness/exposure bump at start
  const brightness = interpolate(easedProgress, [0, 0.3, 1], [1.4, 1.1, 1]);

  // Saturation slightly boosted during zoom
  const saturation = interpolate(easedProgress, [0, 0.3, 1], [1.3, 1.1, 1]);

  const videoStyle = { width: "100%", height: "100%", objectFit: "cover" };
  const origin = "50% 40%";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>

      {/* LAYER 1: Radial zoom blur ghosts (behind everything) */}
      {radialBlurIntensity > 0.01 && Array.from({ length: 8 }).map((_, i) => {
        const ghostScale = scale + (i + 1) * 0.06 * radialBlurIntensity;
        const ghostOpacity = (1 - i / 8) * 0.12 * radialBlurIntensity;
        const ghostBlur = (i + 1) * 3 * radialBlurIntensity;

        return (
          <div key={`ghost-${i}`} style={{
            position: "absolute", inset: 0,
            transform: `scale(${ghostScale})`,
            transformOrigin: origin,
            opacity: ghostOpacity,
            filter: `blur(${ghostBlur}px) brightness(${brightness})`,
          }}>
            <OffthreadVideo src={staticFile("johannes-clip.mp4")} style={videoStyle} />
          </div>
        );
      })}

      {/* LAYER 2: Red channel (shifted left) — chromatic aberration */}
      {chromaOffset > 0.5 && (
        <div style={{
          position: "absolute", inset: 0,
          transform: `scale(${scale}) translateX(${-chromaOffset}px)`,
          transformOrigin: origin,
          mixBlendMode: "screen",
          opacity: 0.6,
          filter: `blur(${mainBlur * 0.7}px) brightness(${brightness}) saturate(0)`,
        }}>
          <div style={{
            width: "100%", height: "100%",
            backgroundColor: "rgba(255,0,0,0.3)",
            mixBlendMode: "multiply",
          }}>
            <OffthreadVideo src={staticFile("johannes-clip.mp4")} style={{...videoStyle, filter: "saturate(0)"}} />
          </div>
        </div>
      )}

      {/* LAYER 3: Blue channel (shifted right) — chromatic aberration */}
      {chromaOffset > 0.5 && (
        <div style={{
          position: "absolute", inset: 0,
          transform: `scale(${scale}) translateX(${chromaOffset}px)`,
          transformOrigin: origin,
          mixBlendMode: "screen",
          opacity: 0.6,
          filter: `blur(${mainBlur * 0.7}px) brightness(${brightness}) saturate(0)`,
        }}>
          <div style={{
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,255,0.3)",
            mixBlendMode: "multiply",
          }}>
            <OffthreadVideo src={staticFile("johannes-clip.mp4")} style={{...videoStyle, filter: "saturate(0)"}} />
          </div>
        </div>
      )}

      {/* LAYER 4: Main video */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${scale})`,
        transformOrigin: origin,
        filter: `blur(${mainBlur}px) brightness(${brightness}) saturate(${saturation})`,
      }}>
        <OffthreadVideo src={staticFile("johannes-clip.mp4")} style={videoStyle} />
      </div>

      {/* LAYER 5: Heavy vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, transparent 15%, rgba(0,0,0,${vignetteStrength * 0.6}) 50%, rgba(0,0,0,${vignetteStrength}) 80%)`,
        pointerEvents: "none",
      }} />

      {/* LAYER 6: Subtle warm tint overlay during zoom */}
      {easedProgress < 0.8 && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: `rgba(255, 100, 50, ${0.06 * (1 - easedProgress)})`,
          mixBlendMode: "color",
          pointerEvents: "none",
        }} />
      )}
    </AbsoluteFill>
  );
};
