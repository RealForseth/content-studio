---
name: trending-sound
description: Find and add trending background music/sounds to a finished video. Analyzes the video's vibe with Gemini, searches for matching trending sounds with Sonar Pro, downloads the track, and mixes it at the right volume so it doesn't overpower the voice. Use when the user wants to add music, background sound, trending audio, or sound effects to their video.
---

# Trending Sound — Find & Mix Background Music

Analyze a finished video's vibe, find a trending sound that matches, download it, and mix it properly.

## Workflow

### Step 1: Ask the User

- "Which video needs music?" (file path)
- "Any preferences? (genre, energy level, specific vibe?)"
- "Is this for Instagram, YouTube, or TikTok?" (affects what's trending)

### Step 2: Analyze Video Vibe with Gemini

Send the video (or proxy if >20MB) to Gemini to understand the mood:

```python
import requests, base64, os

API_KEY = os.environ.get("GEMINI_API_KEY", "")
URL = f"https://beta.vertexapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
H = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}

# If video > 20MB, create proxy first: ./scripts/proxy.sh video.mp4
with open(video_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

resp = requests.post(URL, json={
    "contents": [{"role": "user", "parts": [
        {"inlineData": {"mimeType": "video/mp4", "data": b64}},
        {"text": """Analyze this video's VIBE and MOOD for music selection:
1. Overall energy level (1-10)
2. Mood (motivational, chill, intense, playful, emotional, etc.)
3. Pacing (fast cuts, slow, medium)
4. Target audience vibe
5. Genre suggestions (lo-fi, electronic, acoustic, hip-hop, cinematic, etc.)
6. BPM range that would work
7. Specific music characteristics (bass-heavy, minimal, vocal, instrumental)
8. Reference: "this video feels like ___" (describe the feeling)"""}
    ]}]
}, headers=H, timeout=120)
```

Also read the user's brand voice from `profile/brand-voice.md` if it exists — the music should match their personal brand.

### Step 3: Search for Trending Sounds with Sonar Pro

Use Perplexity Sonar Pro for real-time web search of trending music:

```python
resp = requests.post("https://perplexity.claude.gg/v1/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={
        "model": "sonar-pro",
        "messages": [{"role": "user", "content": f"""
Find trending background music for a {platform} video with this vibe:
{gemini_vibe_analysis}

Requirements:
- Must be royalty-free or available for content creators
- Should be trending or popular in {current_month} {current_year}
- Match the energy level and mood described
- BPM range: {bpm_range}

Search for:
1. Trending royalty-free music on Epidemic Sound, Artlist, or similar
2. Trending sounds on {platform} right now that match this vibe
3. Specific track names and artists if possible
4. Free alternatives on YouTube Audio Library or Pixabay Music

Give me 5 specific track recommendations with:
- Track name + artist
- Where to find it (URL if possible)
- Why it matches the vibe
- BPM and genre
"""}]
    }, timeout=60)
```

### Step 4: Download the Track

Try these sources in order:

**Option A: YouTube Audio Library (free)**
```bash
# Search and download from YouTube
yt-dlp --extract-audio --audio-format mp3 -o "music.mp3" "YOUTUBE_URL"
```

**Option B: Pixabay Music (free, no attribution)**
```bash
# Download from Pixabay
curl -L -o music.mp3 "PIXABAY_DOWNLOAD_URL"
```

**Option C: Generate with AI (if no good match found)**
Use an AI music generation API if available, or suggest the user find a specific track.

### Step 5: Mix Audio

Mix the background music with the video's existing audio at the right level:

```bash
# Step 1: Extract original audio
ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 44100 original_audio.wav

# Step 2: Analyze voice volume
ffmpeg -i original_audio.wav -af "volumedetect" -f null - 2>&1 | grep mean_volume

# Step 3: Mix music at -15dB to -20dB below voice (so it doesn't overpower)
# Typical: voice at 0dB, music at -18dB
ffmpeg -i video.mp4 -i music.mp3 \
  -filter_complex "[1:a]volume=0.12,afade=t=in:st=0:d=2,afade=t=out:st=DURATION_MINUS_3:d=3[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[out]" \
  -map 0:v -map "[out]" \
  -c:v copy -c:a aac -b:a 192k \
  output_with_music.mp4

# volume=0.12 = about -18dB (music barely audible under voice)
# afade in first 2 seconds, fade out last 3 seconds
# amix with dropout_transition for smooth mixing
```

**Volume Guidelines:**
- Talking head with voice: music at 10-15% volume (volume=0.10 to 0.15)
- B-roll without voice: music at 40-60% volume (volume=0.40 to 0.60)
- Intro/outro without voice: music at 50-70% volume (volume=0.50 to 0.70)

For dynamic mixing (louder during b-roll, quieter during speech), use sidechain-like approach:
```bash
# Detect speech segments via silence detection, then create volume automation
ffmpeg -i original_audio.wav -af "silencedetect=noise=-30dB:d=0.3" -f null - 2>&1 | grep silence
# Use this to create a volume curve for the music track
```

### Step 6: Deliver

- Save the mixed video
- Tell the user: "Added [track name] at [volume]%. Fades in over 2s, fades out over 3s."
- Ask: "Want me to adjust the volume? Louder/quieter?"

## Available APIs

| Service | Base URL | Model | Use For |
|---------|----------|-------|---------|
| Gemini | beta.vertexapis.com | gemini-2.5-flash | Video vibe analysis |
| Sonar Pro | perplexity.claude.gg | sonar-pro | Trending music search |
| Codex | codex.claude.gg | gpt-5.3-codex | Music recommendation reasoning |

All use the same API key from .env (GEMINI_API_KEY).

## Platform-Specific Notes

**Instagram Reels:** Trending sounds change weekly. Search for "instagram trending sounds [month] [year]". Bass-heavy, catchy hooks work best.

**TikTok:** Similar to Instagram. Search "tiktok trending sounds". Often shorter clips of songs.

**YouTube:** More flexibility. Cinematic, lo-fi, and electronic work well. YouTube Audio Library is free and safe.

## Important

- Always check that music is royalty-free or licensed for content creators
- Fade in/out is critical — no abrupt music starts/stops
- Voice should ALWAYS be louder than music during speech
- Match BPM to the video's editing pace
- The music should enhance, not distract
