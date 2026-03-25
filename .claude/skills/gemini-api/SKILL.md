---
name: gemini-api
description: Use Google Gemini API models (3.x and 2.5) via beta.vertexapis.com. Trigger when user mentions Gemini, Google AI, image generation with Gemini, video analysis, multimodal AI, or wants to use Gemini 3.1 Flash/Pro/Lite models. Covers text generation, image generation, image analysis, video analysis, and audio transcription via Gemini.
---

# Gemini API via beta.vertexapis.com

Access Google Gemini models through the beta.vertexapis.com proxy. Supports text, image generation, image analysis, video analysis, and audio processing.

## API Configuration

```python
API_KEY = "sk-a5734bbecd6947c3840976e4bfa2fe14"  # From assistant/.env
BASE_URL = "https://beta.vertexapis.com/v1beta/models"
```

**CRITICAL rules:**
1. Always include `"role": "user"` in contents — omitting causes 400 error
2. Use `requests` library with `User-Agent: Mozilla/5.0` header — `urllib` gets 403 from Cloudflare
3. Image generation requires `"generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}`

## Available Models (tested 2026-03-24)

### Text / Multimodal Models

| Model ID | Status | Speed | Best For |
|----------|--------|-------|----------|
| `gemini-3.1-flash-lite-preview` | ✅ Works | Fastest | Cheap bulk tasks, classification, simple Q&A |
| `gemini-3-flash-preview` | ✅ Works | Fast | Pro-level intelligence at Flash speed |
| `gemini-3.1-pro-preview` | ⚠️ Slow/Timeout | Slow | Deep reasoning, complex analysis (may timeout) |
| `gemini-2.5-flash` | ✅ Works | Fast | Reliable workhorse, thinking model |
| `gemini-2.5-pro` | ✅ Works | Medium | High quality reasoning |

### Image Generation Models

| Model ID | Status | Best For |
|----------|--------|----------|
| `gemini-3.1-flash-image-preview` | ✅ Works | Fast image generation + text |
| `gemini-3-pro-image-preview` | ✅ Works | Highest quality image generation |
| `imagen-3.0-generate-002` | ✅ Works | Best quality (via predict endpoint) |
| `imagen-3.0-fast-generate-001` | ✅ Works | Faster generation |

## Quick Start

### Text Generation

```python
import requests

API_KEY = "sk-a5734bbecd6947c3840976e4bfa2fe14"
HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}

def gemini(prompt, model="gemini-2.5-flash", max_tokens=4000):
    resp = requests.post(
        f"https://beta.vertexapis.com/v1beta/models/{model}:generateContent?key={API_KEY}",
        json={
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens}
        },
        headers=HEADERS, timeout=120
    )
    text = ""
    for part in resp.json()["candidates"][0]["content"]["parts"]:
        if "text" in part and not part.get("thought"):
            text += part["text"]
    return text

# Usage
result = gemini("Explain quantum computing in 3 sentences")
result_fast = gemini("Quick answer", model="gemini-3.1-flash-lite-preview")
```

### Image Analysis (send image to Gemini)

```python
import base64

def analyze_image(image_path, prompt, model="gemini-2.5-flash"):
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    mime = "image/jpeg" if image_path.endswith((".jpg",".jpeg")) else "image/png"

    resp = requests.post(
        f"https://beta.vertexapis.com/v1beta/models/{model}:generateContent?key={API_KEY}",
        json={
            "contents": [{"role": "user", "parts": [
                {"inlineData": {"mimeType": mime, "data": b64}},
                {"text": prompt}
            ]}]
        },
        headers=HEADERS, timeout=120
    )
    # Extract text from response (same as above)
```

### Image Generation (Gemini 3.x)

```python
def generate_image(prompt, model="gemini-3.1-flash-image-preview"):
    resp = requests.post(
        f"https://beta.vertexapis.com/v1beta/models/{model}:generateContent?key={API_KEY}",
        json={
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
        },
        headers=HEADERS, timeout=90
    )

    for part in resp.json()["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            import base64
            return base64.b64decode(part["inlineData"]["data"])
    return None

# Usage
img_bytes = generate_image("A minimalist logo for a tech startup, white background")
with open("output.png", "wb") as f:
    f.write(img_bytes)
```

### Image Generation (Imagen 3.0 — highest quality)

```python
def generate_imagen(prompt, model="imagen-3.0-generate-002"):
    resp = requests.post(
        f"https://beta.vertexapis.com/v1beta/models/{model}:predict?key={API_KEY}",
        json={
            "instances": [{"prompt": prompt}],
            "parameters": {"sampleCount": 1}
        },
        headers=HEADERS, timeout=60
    )

    data = resp.json()
    import base64
    return base64.b64decode(data["predictions"][0]["bytesBase64Encoded"])
```

### Audio Transcription

```python
def transcribe_audio(audio_path, model="gemini-2.5-flash"):
    with open(audio_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    resp = requests.post(
        f"https://beta.vertexapis.com/v1beta/models/{model}:generateContent?key={API_KEY}",
        json={
            "contents": [{"role": "user", "parts": [
                {"inlineData": {"mimeType": "audio/wav", "data": b64}},
                {"text": "Transkriber denne lydfilen nøyaktig med tidskoder. Format: [start-slutt] tekst"}
            ]}]
        },
        headers=HEADERS, timeout=120
    )
    # Extract text
```

### Video Frame Analysis

```python
import subprocess, os

def analyze_video_frames(video_path, prompt, interval=3, model="gemini-2.5-flash"):
    """Extract frames and send to Gemini for analysis."""
    os.makedirs("/tmp/frames", exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-i", video_path, "-vf", f"fps=1/{interval}",
                    "/tmp/frames/frame_%03d.jpg"], capture_output=True)

    parts = []
    frames = sorted(os.listdir("/tmp/frames"))
    for i, fname in enumerate(frames[::max(1, len(frames)//8)][:8]):
        with open(f"/tmp/frames/{fname}", "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        parts.append({"inlineData": {"mimeType": "image/jpeg", "data": b64}})
        parts.append({"text": f"[Frame at {i * interval}s]"})

    parts.append({"text": prompt})

    resp = requests.post(
        f"https://beta.vertexapis.com/v1beta/models/{model}:generateContent?key={API_KEY}",
        json={"contents": [{"role": "user", "parts": parts}]},
        headers=HEADERS, timeout=120
    )
    # Extract text
```

## Model Selection Guide

| Task | Recommended Model | Why |
|------|-------------------|-----|
| Quick text tasks | `gemini-3.1-flash-lite-preview` | Cheapest, fastest |
| General text/analysis | `gemini-2.5-flash` | Most reliable, thinking model |
| Deep reasoning | `gemini-2.5-pro` | Best quality text |
| Image understanding | `gemini-2.5-flash` | Reliable with images |
| Fast image generation | `gemini-3.1-flash-image-preview` | Quick, decent quality |
| Best image generation | `gemini-3-pro-image-preview` or `imagen-3.0-generate-002` | Highest quality |
| Audio/transcription | `gemini-2.5-flash` | Good with audio |
| Bulk/cheap tasks | `gemini-3.1-flash-lite-preview` | Most cost-efficient |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 400 "Please use a valid role" | Add `"role": "user"` to contents |
| 403 "error code: 1010" | Use `requests` with `User-Agent` header, not `urllib` |
| Timeout | Try a lighter model (flash-lite), or increase timeout |
| 404 "model not found" | Check exact model ID spelling above |
| Image gen returns only text | Add `"responseModalities": ["IMAGE", "TEXT"]` to generationConfig |
