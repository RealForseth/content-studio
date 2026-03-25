---
name: zoom-intro
description: Add a cinematic zoom intro effect to a video — starts zoomed in (250%) with motion blur and smoothly zooms out to 100%. Use when the user wants a zoom intro, zoom-in opening, cinematic intro, or punch-in effect on their video. Inspired by Premiere Pro's transform + shutter angle technique.
---

# Zoom Intro — Cinematic Zoom-In Opening Effect

A punchy zoom intro that starts zoomed in at 250% with heavy motion blur and decelerates smoothly to 100%. Used as a video opener to grab attention.

## The Effect

- **Start:** 250% scale, centered on the subject, heavy motion blur
- **Over ~2 seconds:** Zooms out to 100% with aggressive deceleration
- **Easing:** Quintic ease-out — very fast start, ultra smooth landing
- **Motion blur:** Shutter angle 360 (maximum blur during fast movement)
- **End result:** Subject is in frame, motion blur clears, video continues

## Remotion Implementation

### The Easing Curve (matches Premiere Pro velocity curves)

From the reference: -271.9/sec velocity at start → 0.0/sec at landing.

```jsx
// Quintic ease-out — aggressive start, gentle landing
const zoomEase = (t) => 1 - Math.pow(1 - t, 5);
```

### Core Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Start scale | 2.5 (250%) | How zoomed in at the start |
| End scale | 1.0 (100%) | Normal view |
| Duration | 60 frames (2 sec at 30fps) | How long the zoom takes |
| transformOrigin | "50% 45%" | Slightly above center (face position) |
| shutterAngle | 360 | Maximum motion blur |
| samples | 10 | Motion blur quality (more = smoother but slower to render) |

### Using with @remotion/motion-blur

```jsx
import { CameraMotionBlur } from "@remotion/motion-blur";

// Wrap your zooming content in CameraMotionBlur
<CameraMotionBlur shutterAngle={360} samples={10}>
  <YourZoomingContent />
</CameraMotionBlur>
```

Inside `YourZoomingContent`, apply the scale transform:

```jsx
const frame = useCurrentFrame();
const zoomDuration = 60;
const zoomProgress = Math.min(frame / zoomDuration, 1);
const easedProgress = 1 - Math.pow(1 - zoomProgress, 5); // quintic ease-out
const scale = interpolate(easedProgress, [0, 1], [2.5, 1]);

<div style={{
  transform: `scale(${scale})`,
  transformOrigin: "50% 45%",
}}>
  {/* Your video or content here */}
</div>
```

### With an Actual Video (OffthreadVideo)

```jsx
import { OffthreadVideo, staticFile } from "remotion";

<div style={{
  transform: `scale(${scale})`,
  transformOrigin: "50% 45%",
}}>
  <OffthreadVideo
    src={staticFile("my-video.mp4")}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
</div>
```

### Reference Composition

A working example is at `remotion/src/ZoomIntro.jsx` in the matt-gray-demo project. It uses a stickfigure placeholder but the zoom + motion blur logic is production-ready.

## Important Notes

- **Always re-encode video to constant 30fps** before using in Remotion
- **Always use OffthreadVideo**, never Video component
- **@remotion/motion-blur must be installed:** `npm install @remotion/motion-blur`
- **Rendering is slower** with motion blur (10 samples = 10x render per frame). Reduce samples to 5 for faster preview.
- **transformOrigin** should be where the subject's face is — "50% 45%" works for center-frame talking head
