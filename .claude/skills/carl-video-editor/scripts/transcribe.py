#!/usr/bin/env python3
"""Transcribe video/audio with word-level timestamps using faster-whisper."""

import sys
import json
import subprocess

def extract_audio(video_path, audio_path="/tmp/carl_audio.wav"):
    """Extract audio from video file."""
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000",
        audio_path
    ], capture_output=True)
    return audio_path

def transcribe(audio_path, language="no"):
    """Transcribe audio with word-level timestamps."""
    from faster_whisper import WhisperModel

    model = WhisperModel("medium", device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_path, language=language, word_timestamps=True)

    result = {
        "language": info.language,
        "language_probability": info.language_probability,
        "segments": [],
        "words": []
    }

    for seg in segments:
        segment_data = {
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip()
        }
        result["segments"].append(segment_data)

        if seg.words:
            for w in seg.words:
                result["words"].append({
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "word": w.word.strip()
                })

    return result

def group_words(words, max_words=4):
    """Group words into subtitle chunks of max_words."""
    groups = []
    current = []

    for word in words:
        current.append(word)
        if len(current) >= max_words:
            groups.append({
                "start": current[0]["start"],
                "end": current[-1]["end"],
                "text": " ".join(w["word"] for w in current)
            })
            current = []

    if current:
        groups.append({
            "start": current[0]["start"],
            "end": current[-1]["end"],
            "text": " ".join(w["word"] for w in current)
        })

    return groups

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <video_or_audio_path> [language]")
        sys.exit(1)

    input_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "no"

    # Extract audio if video
    if input_path.endswith((".mp4", ".mov", ".avi", ".mkv", ".webm")):
        audio_path = extract_audio(input_path)
    else:
        audio_path = input_path

    result = transcribe(audio_path, language)
    result["subtitle_groups"] = group_words(result["words"], max_words=4)

    # Output JSON
    print(json.dumps(result, ensure_ascii=False, indent=2))
