#!/usr/bin/env python3
"""Analyze video content with Gemini for editing decisions."""

import sys
import json
import base64
import subprocess
import os
import requests

API_KEY = os.environ.get("GEMINI_API_KEY", "sk-a5734bbecd6947c3840976e4bfa2fe14")
URL = f"https://beta.vertexapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}

def extract_frames(video_path, interval=3, output_dir="/tmp/carl_frames"):
    """Extract frames at regular intervals."""
    os.makedirs(output_dir, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"fps=1/{interval}",
        f"{output_dir}/frame_%03d.jpg"
    ], capture_output=True)

    frames = sorted([
        os.path.join(output_dir, f) for f in os.listdir(output_dir)
        if f.endswith(".jpg")
    ])
    return frames

def analyze_frames(frames, transcription_text=""):
    """Send frames to Gemini for analysis."""
    parts = []

    # Add frames (max 8 to stay under payload limits)
    step = max(1, len(frames) // 8)
    for i, frame_path in enumerate(frames[::step][:8]):
        with open(frame_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        parts.append({"inlineData": {"mimeType": "image/jpeg", "data": b64}})
        parts.append({"text": f"[Frame at {i * step * 3}s]"})

    prompt = f"""Analyze these video frames from a personal brand video. The frames are taken every few seconds.

Transcription of what's being said:
{transcription_text}

Provide a JSON response with:
1. "scenes": array of scene descriptions with timestamps
2. "key_moments": array of moments that deserve b-roll text slides (with the exact phrase and timestamp)
3. "suggested_order": if clips seem out of order, suggest reordering
4. "cuts": array of segments to cut (silence, bad takes, etc.)
5. "broll_suggestions": array of b-roll text suggestions with style ("big"/"small", "accent"/normal)
6. "overall_vibe": description of the video's mood/energy

Respond ONLY with valid JSON."""

    parts.append({"text": prompt})

    resp = requests.post(URL, json={
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"maxOutputTokens": 4000}
    }, headers=HEADERS, timeout=120)

    if resp.status_code == 200:
        text = ""
        for part in resp.json()["candidates"][0]["content"]["parts"]:
            if "text" in part and not part.get("thought"):
                text += part["text"]
        # Try to parse JSON from response
        try:
            # Strip markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw_analysis": text}
    else:
        return {"error": f"Gemini API returned {resp.status_code}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_video.py <video_path> [transcription.json]")
        sys.exit(1)

    video_path = sys.argv[1]

    transcription_text = ""
    if len(sys.argv) > 2:
        with open(sys.argv[2]) as f:
            data = json.load(f)
            transcription_text = "\n".join(
                f"[{s['start']:.1f}-{s['end']:.1f}] {s['text']}"
                for s in data.get("segments", [])
            )

    print("Extracting frames...", file=sys.stderr)
    frames = extract_frames(video_path)

    print(f"Analyzing {len(frames)} frames with Gemini...", file=sys.stderr)
    result = analyze_frames(frames, transcription_text)

    print(json.dumps(result, ensure_ascii=False, indent=2))
