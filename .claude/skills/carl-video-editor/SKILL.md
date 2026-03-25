---
name: carl-video-editor
description: AI video editing with Carl — edit videos, add b-roll text slides, apply visual styles (Mapal, Johannes b-roll), transcribe, cut silence, reorder clips, add subtitles, grain/texture/effects, and render with Remotion. Use this skill whenever the user mentions video editing, Carl, making a video, rendering clips, b-roll, title cards, subtitles, video styles, cutting video, silence removal, or any video production task. Also trigger for requests about video analysis, transcription, or applying visual effects to video content.
---

# Carl AI Video Editor

Carl is an AI-powered video editing pipeline that combines Gemini video analysis, faster-whisper transcription, intelligent editing decisions, and Remotion-based rendering with professional visual effects.

## How Carl Works

Carl takes raw video footage and produces polished, styled video output. The pipeline:

1. **Ingest** — Accept video files (local paths, or URLs)
2. **Prepare** — Re-encode to constant 30fps for frame-perfect editing
3. **Transcribe** — Word-level timestamps via faster-whisper
4. **Analyze** — Gemini analyzes visual content, suggests structure
5. **Edit** — Cut silence, reorder clips, identify b-roll moments
6. **Style** — Apply visual style (text overlays, effects, grain, etc.)
7. **Render** — Remotion outputs final video

## Step-by-Step Workflow

### Step 1: Prepare Video

CRITICAL: Always re-encode input video to constant 30fps. Mobile videos are often variable framerate which causes stuttering in Remotion.

```bash
ffmpeg -i input.mp4 \
  -vf "fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -crf 15 -g 30 -bf 2 \
  -movflags +faststart \
  -c:a aac -b:a 192k \
  output_30fps.mp4
```

Also extract audio for transcription:
```bash
ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 audio.wav
```

### Step 2: Transcribe

Use faster-whisper with the medium model for word-level timestamps:

```python
from faster_whisper import WhisperModel
model = WhisperModel("medium", device="cpu", compute_type="int8")
segments, info = model.transcribe("audio.wav", language="no", word_timestamps=True)

for seg in segments:
    for word in seg.words:
        print(f"{word.start:.2f}-{word.end:.2f} «{word.word.strip()}»")
```

This gives precise start/end times for every word — essential for subtitle sync and b-roll timing.

### Step 3: Detect Silence (for auto-cutting)

```bash
ffmpeg -i input.mp4 -af "silencedetect=noise=-30dB:d=0.5" -f null - 2>&1 | grep silence
```

Parse the output to get silence start/end times, then cut those segments.

### Step 4: Analyze with Gemini

Use `gemini-2.5-flash` via beta.vertexapis.com. IMPORTANT: Always include `"role": "user"` in contents, and use `requests` library with `User-Agent` header (urllib gets 403'd by Cloudflare).

```python
import requests, base64
API_KEY = "sk-a5734bbecd6947c3840976e4bfa2fe14"
URL = f"https://beta.vertexapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"

# For text analysis
resp = requests.post(URL, json={
    "contents": [{"role": "user", "parts": [{"text": "prompt"}]}]
}, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})

# For image analysis (send video frames)
with open("frame.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()
parts = [
    {"inlineData": {"mimeType": "image/jpeg", "data": b64}},
    {"text": "Describe this frame"}
]
```

Ask Gemini to:
- Analyze content and suggest clip ordering
- Identify key moments for b-roll text slides
- Suggest which phrases deserve visual emphasis
- Rate content quality for each segment

### Step 5: Build Remotion Composition

Generate a JSX composition file that assembles the final video. Key rules:

- **ALWAYS use `OffthreadVideo`** — never `Video` component (causes stuttering)
- **Load fonts** via `@remotion/google-fonts`
- Use `Sequence` for timing each segment
- Use `staticFile()` for video assets in `public/` directory
- Frame math: `seconds * 30 = frames` (at 30fps)

### Step 6: Render

```bash
cd /path/to/remotion-project
npx remotion render CompositionId out/final.mp4 --concurrency=2
```

## Available Video Styles

Read the full style documentation before applying. Each style file contains exact colors, fonts, animation settings, and component usage.

### Style 1: Johannes B-roll (`johannes-broll-v1`)
**File:** `assistant/styles/johannes-broll-v1.md`
**Use for:** Short-form talking head videos with b-roll text slides

Key settings:
- Background: `#F6F6F6` (light grey-white)
- Text: `#2B2B2B` (dark grey), Accent: `#FF8C00` (orange)
- Font: Inter Black (900)
- Subtitles: 3-4 words, instant, white on video with shadow
- B-roll: text on light bg, instant cuts, edge-only displacement shimmer
- Displacement: baseFrequency 0.003, scale 5, erode 0.6, drift every 4 frames

### Style 2: Mapal Title Card (`mapal-title-card-v1`)
**File:** `assistant/styles/mapal-title-card-v1.md`
**Use for:** Title cards, intros, editorial b-roll, premium feel

Key settings:
- Background: `#1a1714` (warm near-black)
- Text: `#f5f0e8` (cream), Accent: `#c4653a` (terracotta), Gold: `#c9a84c`
- Fonts: Playfair Display (serif) + Space Grotesk (mono) + Inter (sans)
- Animations: mask reveals, wiggle expression, camera shake
- Overlays: film grain (animated), paper texture, light flicker, vignette
- All components defined in `MapalDemo.jsx`

## Remotion Components Reference

Located in `/home/main/matt-gray-demo/src/`:

**From MapalDemo.jsx:**
- `FilmGrain` — Animated SVG noise overlay (change seed every frame)
- `PaperTexture` — Dual-layer fractal noise (coarse + fine)
- `Vignette` — Radial gradient dark edges
- `LightFlicker` — Multi-sine brightness variation
- `CameraShake` — Organic position + rotation wiggle on wrapper
- `WiggleText` — Constant subtle movement on text elements
- `MaskReveal` — Text slides up from behind overflow:hidden mask
- `DecorativeLine` — Animated width horizontal rule
- `DisplacementFilter` — SVG edge-only shimmer

**From JohannesVideo.jsx:**
- `ShimmerFilter` — Edge-only displacement for b-roll slides
- `Subtitle` — Simple instant word overlay on talking head
- `BrollSlide` — Text on light background with shimmer

## Gemini Image Generation

For AI-generated b-roll images:
```python
resp = requests.post(
    f"https://beta.vertexapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key={API_KEY}",
    json={
        "contents": [{"role": "user", "parts": [{"text": "prompt"}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
    },
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
)
# Decode: base64.b64decode(part["inlineData"]["data"])
```

Also available: `imagen-3.0-generate-002` via predict endpoint for high-quality images.

## Important Technical Notes

1. **VFR videos MUST be re-encoded** to constant 30fps before Remotion use
2. **Gemini API needs `requests` library** with User-Agent header (urllib gets 403)
3. **Gemini contents need `"role": "user"`** — omitting it causes 400 errors
4. **Subtitle timing** should use word-level timestamps, not sentence-level
5. **B-roll should cut in on keywords** — match the exact word timestamp
6. **Film grain must animate** — static grain looks fake
7. **Remotion canvas size** should match source video (e.g., 464x848 for vertical, 1920x1080 for 16:9)
