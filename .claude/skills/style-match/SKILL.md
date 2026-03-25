---
name: style-match
description: Recreate any video's visual style using Remotion. Takes a reference video, analyzes it deeply with Gemini, builds a Remotion composition, then iterates with autoresearch (Gemini compares → Claude fixes) until the output matches the reference. Use when the user wants to copy, recreate, match, or learn from a video's editing style, visual effects, motion graphics, or overall look.
---

# Style Match — Autoresearch Video Style Recreation

Recreate any video's visual style in Remotion through an iterative Gemini analysis + Claude Code improvement loop.

## How It Works

1. User provides a reference video
2. Gemini deeply analyzes it (whole video + multiple focused passes)
3. Claude builds the first Remotion composition
4. Autoresearch loop: Gemini compares reference vs attempt → Claude fixes → render → repeat
5. When quality is good enough, save the style as a reusable template

## Step-by-Step Workflow

### Step 1: Gather Input

Ask the user:
- "Which video should we recreate the style of?" (accept file path or URL)
- "Any changes or extras? (different topic, colors, text content?)"
- "What aspect to focus on? (full video, just subtitles, just b-roll, just transitions?)"

### Step 2: Prepare the Reference

If the file is a URL, download it:
```bash
# YouTube — needs WARP proxy on VPS
ALL_PROXY=socks5://127.0.0.1:40000 yt-dlp --js-runtimes deno -f "worst[ext=mp4]/worst" -o reference.mp4 "URL"
```

If the file is >20MB, create a proxy for Gemini:
```bash
./scripts/proxy.sh reference.mp4 reference_proxy.mp4
```

### Step 3: Deep Gemini Analysis (3 passes)

Send the ENTIRE video (or proxy) to Gemini. Do 3 separate API calls for depth:

**Pass 1 — Visual Breakdown:**
```
Analyze this video second by second. For EVERY moment describe:
- What's on screen (text, images, graphics, video)
- Text: exact words, font style, color, size, position, animation
- Background: color, texture, gradient
- Effects: grain, blur, glow, displacement
- Transitions: how scenes change
- Animation: what moves, direction, speed, easing
Give complete color palette (hex codes), all fonts, all effects.
```

**Pass 2 — Asset List:**
```
List EVERY visual asset needed to recreate this video:
- Type (illustration, photo, icon, texture)
- Description (exactly what it depicts)
- Style (flat vector, photo, vintage, etc.)
- When it appears (timestamps)
Include AI generation prompts for each asset.
```

**Pass 3 — Motion & Timing:**
```
Analyze the MOTION DESIGN in detail:
- How does each element enter/exit? (slide, scale, fade, pop)
- What easing curves are used? (linear, ease-out, spring, bounce)
- What's the editing rhythm? (cuts per second, pacing)
- Any speed ramps, zoom effects, camera movement?
- How are transitions between scenes handled?
Give specific timing in frames/seconds.
```

Save all 3 analyses to a working directory.

### Step 4: Generate Assets (if needed)

Use Gemini image generation for any needed assets:
```python
# Gemini 3-Pro Image (highest quality)
resp = requests.post(
    f"https://beta.vertexapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key={API_KEY}",
    json={
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
    },
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
)
```

### Step 5: Build First Remotion Composition

Based on the 3 Gemini analyses, write a complete Remotion JSX file.

Rules:
- Use `OffthreadVideo` (never `Video`) for embedded video
- Re-encode any video to constant 30fps before using
- Load fonts via `@remotion/google-fonts`
- Use CSS effects (not SVG feTurbulence per frame) for rendering speed
- Film grain: static CSS noise tile, not per-frame SVG
- Professional easing curves (cubic, back-ease, spring)
- Match the reference's exact color palette, typography, and layout

### Step 6: Autoresearch Loop

Iterate automatically until quality threshold is met:

```
for each iteration (max 10):
    1. Render the composition
    2. Extract frames from both reference and attempt
    3. Send side-by-side frames to Gemini with STRICT scoring prompt
    4. Parse score (0-100)
    5. If score >= target (80): stop, save
    6. If score < target: read Gemini's top 3 fixes
    7. Apply fixes to the composition code (targeted edits, NOT full rewrite)
    8. Go to step 1
```

**Strict scoring prompt for Gemini:**
```
Compare REFERENCE vs ATTEMPT frames. Be EXTREMELY critical.
Score 0-100 (only 80+ if genuinely close):
- Layout, Typography, Colors, Animation, Effects, Overall

Give TOP 3 fixes with EXACT CSS/code values to change.
For each: WHAT is wrong, WHAT it should be, exact CODE change.
```

**Important:** Apply fixes via Edit tool (targeted changes), NOT by rewriting the entire file. This prevents regression.

### Step 7: Save the Style

When the user is satisfied, save the style:
1. Copy the final JSX composition to `remotion/src/`
2. Create a style document in `styles/` describing the style
3. Commit and push to GitHub

## Technical Notes

### Gemini API
- Base URL: `https://beta.vertexapis.com/v1beta/models`
- Key: from .env `GEMINI_API_KEY`
- Always include `"role": "user"` in contents
- Always use `requests` library with `User-Agent: Mozilla/5.0`
- For images: `{"inlineData": {"mimeType": "image/jpeg", "data": base64}}`
- For video: `{"inlineData": {"mimeType": "video/mp4", "data": base64}}`

### Remotion Rendering
- Project at `remotion/` — run `npx remotion render` from there
- For VPS: keep effects lightweight (CSS over SVG)
- For local MacBook: can use heavier effects
- Always re-encode video to constant 30fps before Remotion use

### Existing Styles (for reference)
Read `styles/` folder for examples of documented styles:
- johannes-broll-v1.md — b-roll text slides
- mapal-title-card-v1.md — editorial title cards
- vox-title-v1.md — scrolling list with highlight box

### Proxy Script
For large videos: `./scripts/proxy.sh input.mp4 output_proxy.mp4`
Creates 640px, CRF 28 version suitable for Gemini API.
