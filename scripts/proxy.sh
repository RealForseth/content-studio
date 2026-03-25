#!/bin/bash
# Generate proxy video for large files
# Usage: ./scripts/proxy.sh input.mp4 [output.mp4]
#
# Creates a smaller version for Gemini analysis and faster processing.
# Auto-triggers if file > 20MB (Gemini inline limit).

INPUT="$1"
OUTPUT="${2:-${INPUT%.*}_proxy.mp4}"

if [ -z "$INPUT" ]; then
  echo "Usage: ./scripts/proxy.sh input.mp4 [output.mp4]"
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Error: $INPUT not found"
  exit 1
fi

# Get file size in MB
SIZE_MB=$(du -m "$INPUT" | cut -f1)
echo "Input: $INPUT ($SIZE_MB MB)"

if [ "$SIZE_MB" -lt 20 ]; then
  echo "File is under 20MB — no proxy needed for Gemini."
  echo "Copying as-is..."
  cp "$INPUT" "$OUTPUT"
else
  echo "File is ${SIZE_MB}MB — generating proxy..."
  ffmpeg -y -i "$INPUT" \
    -vf "scale=640:-1,fps=24" \
    -c:v libx264 -preset fast -crf 28 \
    -c:a aac -b:a 96k \
    -movflags +faststart \
    "$OUTPUT" 2>&1 | tail -3
fi

OUTPUT_SIZE=$(du -m "$OUTPUT" | cut -f1)
echo "Output: $OUTPUT ($OUTPUT_SIZE MB)"
