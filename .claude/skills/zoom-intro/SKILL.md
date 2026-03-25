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

### The Technique (v3 — proven, looks great)

NOT using @remotion/motion-blur (too slow, wrong look). Instead: **layered ghost copies + chromatic aberration + heavy vignette**.

### Easing Curve
```jsx
// Sextic ease-out — extremely aggressive start, ultra smooth landing
const zoomEase = (t) => 1 - Math.pow(1 - t, 6);
```

### Core Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Start scale | 2.8 (280%) | How zoomed in at the start |
| End scale | 1.0 (100%) | Normal view |
| Duration | 30 frames (1 sec at 30fps) | Fast! |
| transformOrigin | "50% 40%" | Slightly above center (face) |
| Ghost layers | 8 | For radial zoom blur streaks |
| Chromatic offset | 12px → 0px | RGB split during motion |
| Vignette | 0.85 → 0.2 | Very heavy at start |

### Effect Layers (bottom to top)

1. **Radial zoom blur ghosts** — 8 copies at increasing scale + blur, low opacity. Creates directional streaks.
2. **Chromatic aberration RED** — video shifted left, red tinted, screen blend
3. **Chromatic aberration BLUE** — video shifted right, blue tinted, screen blend
4. **Main video** — scaled with gaussian blur + brightness boost
5. **Heavy vignette** — radial gradient, nearly black corners at start
6. **Warm tint** — subtle warm overlay during motion

### Working Reference

See `remotion/src/ZoomIntroReal.jsx` — production-ready component that implements all 6 layers.

### Usage with Your Video

```jsx
// Just change the video source in ZoomIntroReal.jsx:
<OffthreadVideo src={staticFile("your-video.mp4")} style={videoStyle} />
```

## Important Notes

- **Re-encode to constant 30fps** before Remotion
- **Use OffthreadVideo**, never Video
- **transformOrigin** = where the face is (adjust Y% for your framing)
- **No @remotion/motion-blur needed** — the ghost layer technique is faster and looks more like Premiere
- Renders fast since it's pure CSS transforms + filters
