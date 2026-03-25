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

Use Perplexity Sonar Pro for real-time web search. The search MUST be specific to the creator niche.

**IMPORTANT context for search:**
- We need sounds that are ACTUALLY trending on TikTok/Instagram Reels RIGHT NOW
- NOT generic "royalty-free vlog music" — those are never trending
- Search for what ENTREPRENEURS, PERSONAL BRAND creators, and PRODUCTIVITY creators are using
- Check TikTok Creative Center, Instagram audio trends, and creator compilations
- The sound will be VERY subtle in the background (5-8% volume) — it's texture, not the focus

```python
resp = requests.post("https://perplexity.claude.gg/v1/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={
        "model": "sonar-pro",
        "messages": [{"role": "user", "content": f"""
Search TikTok Creative Center and Instagram Reels trending audio for {current_month} {current_year}.

I need the ACTUAL trending sounds that entrepreneur/personal brand/productivity creators are using on TikTok and Instagram Reels RIGHT NOW.

Think: Matt Gray, Liam Ottley, Dan Koe, Alex Hormozi style creators. What background music are THEY using in their short-form content?

Search for:
1. Check TikTok Creative Center trending sounds this week/month
2. What sounds are popular entrepreneur/personal branding TikTok creators using?
3. What background audio do productivity/AI content creators use on Reels?
4. Trending sounds in the "build in public" / startup / entrepreneur niche

Requirements:
- Must be currently trending (not old generic lo-fi)
- The kind of subtle, modern sound you hear behind talking-head Reels
- Can be a song snippet, ambient sound, or trending audio clip
- BPM: 90-120 (medium energy, not too chill, not too hype)

Give me 5 specific tracks with:
- Track name + artist
- YouTube search query to find it (e.g. "track name artist official audio")
- Genre / BPM
- Why entrepreneur creators are using it
- How many Reels/TikToks use this sound (if known)
"""}]
    }, timeout=60)
```

### Step 4: Download the Track from YouTube

YouTube blocks bot/AI traffic. **MUST use Cloudflare WARP** to download.

```bash
# Step 1: Connect WARP (required before every yt-dlp download)
warp-cli connect

# Step 2: Wait for connection
sleep 2

# Step 3: Download audio as MP3
yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 \
  -o "music.%(ext)s" "YOUTUBE_URL"

# Step 4: Disconnect WARP immediately after download (don't leave it on)
warp-cli disconnect
```

**IMPORTANT:** Always disconnect WARP after download. Don't leave it running — it routes all traffic through Cloudflare.

If the first recommendation doesn't work, try the next one from the list. Always download as MP3.

### Step 4b: Find the Trending Part of the Song

Most trending sounds on Reels/TikTok use a SPECIFIC part of a song (the hook, drop, or chorus). Find which part:

**Method 1: Sonar Pro (best — knows what's actually trending)**
```python
resp = requests.post("https://perplexity.claude.gg/v1/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={
        "model": "sonar-pro",
        "messages": [{"role": "user", "content": f"What specific part/timestamp of the song '{track_name}' by '{artist}' is trending on TikTok and Instagram Reels right now? What seconds of the song are people using? Give me the exact timestamp range."}]
    })
```

**Method 2: Gemini audio analysis (if Sonar doesn't know)**
```python
# Send the downloaded MP3 to Gemini
with open("music.mp3", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()
resp = requests.post(URL, json={
    "contents": [{"role": "user", "parts": [
        {"inlineData": {"mimeType": "audio/mpeg", "data": b64}},
        {"text": "Find the most catchy/energetic part of this song (hook, chorus, or drop). Give me the EXACT start and end time in seconds. Also suggest the best 15-second and 30-second clips for short-form content."}
    ]}]
})
```

**Then clip it:**
```bash
ffmpeg -i music.mp3 -ss START_SECONDS -to END_SECONDS -c copy music_clip.mp3
```

### API Fallback Chain

If one API is down, try the next. All via beta.vertexapis.com:
1. **Gemini 3.1 Pro Preview** — best quality, deepest analysis
2. **Gemini 2.5 Pro** — backup, strong reasoning
3. **Gemini 2.5 Flash** — fast, reliable fallback
4. **Sonar Pro** (perplexity.claude.gg) — web search, always works for text

Do NOT use api.claude.gg for Gemini (returns empty). Always use beta.vertexapis.com.

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

**Volume Guidelines (SUBTLE — music is texture, not focus):**
- Talking head with voice: music at **5-8% volume** (volume=0.05 to 0.08) — barely audible, just fills silence
- B-roll without voice: music at 20-30% volume (volume=0.20 to 0.30)
- Intro/outro without voice: music at 30-40% volume (volume=0.30 to 0.40)
- **ALWAYS analyze voice volume first** with `volumedetect` and set music at least -25dB below voice

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

---

## Pre-Approved Song Libraries (USE THESE FIRST)

Instead of researching every time, pick from Johannes's curated Spotify playlists. Only do Sonar Pro research if explicitly asked.

### Johannes's Personal List ("CONTENT 26")
**Spotify:** https://open.spotify.com/playlist/0eKpef39CZvPpe2iXyD5ya
**Use when:** Johannes says "ta fra min liste" or "nyeste sang fra min liste"
- You Can Call Me Al — Paul Simon
- Higher Ground (Acoustic) — SKAAR
- Bless the Telephone — Labi Siffre
- Higher Ground — SKAAR

### "Alltid bra valg" — Daniel Dalen-inspired (hip-hop/soulful)
**Spotify:** https://open.spotify.com/playlist/2WgLvrsalF0ueyWbc1v5Us
**Use when:** Confident, soulful, entrepreneur energy. Short-form content.
Top picks for vlogs:
- Summer Reign (feat. Ty Dolla $ign) — Larry June, The Alchemist
- nyc in 1940 — berlioz, Ted Jasper
- deep in it — berlioz, Ted Jasper
- Smooth Arrangements — Klaus Veen
- Show Me — Joey Bada$$
- Homegrown — CARRTOONS
- What You Heard — Sonder
- BEST INTEREST — Tyler, The Creator
- Nikes on My Feet — Mac Miller
- Last Last — Burna Boy

### "Aesthetic YouTube Vlogs" — Lo-fi/chill (talking head + b-roll)
**Spotify:** https://open.spotify.com/playlist/3iJULBUtg3vcmBJOWoamZB
**Use when:** Chill aesthetic vlogs, softer energy, day-in-the-life content.
Top picks:
- Love Mode — Joakim Karud
- Canals — Joakim Karud
- Far Away — Tomppabeats
- 5:32pm — The Deli
- Affection — Jinsang
- sincerely, yours — Nohidea
- Warm — Joey Pecoraro
- Monday Loop — Tomppabeats

### "Ethan Weng Vlogs" — Upbeat/energetic (longer YouTube vlogs)
**Spotify:** https://open.spotify.com/playlist/3VnesqJdx2wqi1xmPqsATL
**Use when:** Higher energy vlogs, travel, montages, longer YouTube videos.
Top picks:
- Tongue Tied — GROUPLOVE
- Jubel — Klingande
- I Got U — Duke Dumont, Jax Jones
- Kids — MGMT
- Pursuit Of Happiness (Nightmare) — Kid Cudi
- Alive — Empire Of The Sun
- Runaway (U & I) — Galantis
- Latch — Disclosure, Sam Smith

### How to pick a track
1. Match video energy to the right playlist
2. Pick a track from the list
3. Download from YouTube: `yt-dlp --extract-audio --audio-format mp3 "ytsearch1:TRACK ARTIST"`
4. No need for Sonar Pro research unless asked

---

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
