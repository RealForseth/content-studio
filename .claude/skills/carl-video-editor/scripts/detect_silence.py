#!/usr/bin/env python3
"""Detect silence in video for auto-cutting."""

import sys
import subprocess
import re
import json

def detect_silence(video_path, noise_db=-30, min_duration=0.5):
    """Detect silent segments in video.

    Returns list of {start, end, duration} for each silent segment.
    """
    result = subprocess.run([
        "ffmpeg", "-i", video_path,
        "-af", f"silencedetect=noise={noise_db}dB:d={min_duration}",
        "-f", "null", "-"
    ], capture_output=True, text=True)

    stderr = result.stderr
    silences = []
    current_start = None

    for line in stderr.split("\n"):
        start_match = re.search(r"silence_start: ([\d.]+)", line)
        end_match = re.search(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", line)

        if start_match:
            current_start = float(start_match.group(1))
        elif end_match and current_start is not None:
            end = float(end_match.group(1))
            duration = float(end_match.group(2))
            silences.append({
                "start": round(current_start, 3),
                "end": round(end, 3),
                "duration": round(duration, 3)
            })
            current_start = None

    return silences

def get_speech_segments(video_path, total_duration, noise_db=-30, min_silence=0.5, padding=0.1):
    """Get segments where speech is happening (inverse of silence)."""
    silences = detect_silence(video_path, noise_db, min_silence)

    speech = []
    current_start = 0.0

    for silence in silences:
        if silence["start"] - current_start > 0.2:  # min speech duration
            speech.append({
                "start": round(max(0, current_start - padding), 3),
                "end": round(silence["start"] + padding, 3)
            })
        current_start = silence["end"]

    # Add final segment
    if total_duration - current_start > 0.2:
        speech.append({
            "start": round(max(0, current_start - padding), 3),
            "end": round(total_duration, 3)
        })

    return speech

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python detect_silence.py <video_path> [noise_db] [min_duration]")
        sys.exit(1)

    video_path = sys.argv[1]
    noise_db = int(sys.argv[2]) if len(sys.argv) > 2 else -30
    min_dur = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5

    silences = detect_silence(video_path, noise_db, min_dur)

    print(json.dumps({
        "silences": silences,
        "total_silence": round(sum(s["duration"] for s in silences), 2),
        "count": len(silences)
    }, indent=2))
