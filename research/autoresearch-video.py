#!/usr/bin/env python3
"""
Auto-Research Video Loop
========================
Karpathy-inspired self-improving loop for video recreation.

Flow:
1. Gemini analyzes reference video deeply
2. Claude Opus writes Remotion code
3. Render → extract frames
4. Gemini compares reference vs attempt (side-by-side)
5. Claude Opus reads feedback → fixes code
6. Repeat until quality threshold

Usage:
  python3 autoresearch-video.py /path/to/reference.mp4 --max-iterations 10
"""

import os
import sys
import json
import base64
import subprocess
import shutil
import time
import argparse
from pathlib import Path

# ==================== CONFIG ====================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "sk-a5734bbecd6947c3840976e4bfa2fe14")
GEMINI_URL = f"https://beta.vertexapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
GEMINI_HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}

REMOTION_DIR = "/home/main/matt-gray-demo"
WORK_DIR = "/tmp/autoresearch"
COMPOSITION_ID = "AutoResearch"

# ==================== HELPERS ====================
import requests

def gemini(prompt, images=None, max_tokens=8000, timeout=180):
    """Call Gemini with optional images."""
    parts = []
    if images:
        for img_path in images:
            with open(img_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
            mime = "image/jpeg" if img_path.endswith((".jpg", ".jpeg")) else "image/png"
            parts.append({"inlineData": {"mimeType": mime, "data": b64}})
    parts.append({"text": prompt})

    resp = requests.post(GEMINI_URL, json={
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"maxOutputTokens": max_tokens}
    }, headers=GEMINI_HEADERS, timeout=timeout)

    if resp.status_code != 200:
        raise Exception(f"Gemini API error {resp.status_code}: {resp.text[:300]}")

    text = ""
    for part in resp.json()["candidates"][0]["content"]["parts"]:
        if "text" in part and not part.get("thought"):
            text += part["text"]
    return text


def claude_code(prompt, timeout=120):
    """Run claude -p with Opus to generate/fix code."""
    result = subprocess.run(
        ["claude", "-p", "--model", "opus", prompt],
        capture_output=True, text=True, timeout=timeout,
        cwd=REMOTION_DIR
    )
    return result.stdout.strip()


def extract_frames(video_path, output_dir, interval=3, max_frames=10):
    """Extract frames from video at regular intervals."""
    os.makedirs(output_dir, exist_ok=True)
    # Clear old frames
    for f in Path(output_dir).glob("*.jpg"):
        f.unlink()

    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"fps=1/{interval}",
        f"{output_dir}/frame_%03d.jpg"
    ], capture_output=True)

    frames = sorted(Path(output_dir).glob("*.jpg"))
    # Return evenly spaced subset
    if len(frames) > max_frames:
        step = len(frames) // max_frames
        frames = frames[::step][:max_frames]
    return [str(f) for f in frames]


def render_composition(composition_id, output_path, timeout=300):
    """Render Remotion composition."""
    result = subprocess.run(
        ["npx", "remotion", "render", composition_id, output_path, "--concurrency=1"],
        capture_output=True, text=True, timeout=timeout,
        cwd=REMOTION_DIR
    )
    if result.returncode != 0:
        raise Exception(f"Render failed: {result.stderr[-500:]}")
    return output_path


def get_video_duration(path):
    """Get video duration in seconds."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())


# ==================== MAIN LOOP ====================

def analyze_reference(video_path):
    """Step 1: Deep analysis of reference video with Gemini."""
    print("\n📹 Step 1: Analyzing reference video with Gemini...")

    frames_dir = f"{WORK_DIR}/reference_frames"
    frames = extract_frames(video_path, frames_dir, interval=2, max_frames=12)
    duration = get_video_duration(video_path)

    analysis = gemini(
        f"""Analyze this video ({duration:.0f} seconds) for RECREATION in code (React/Remotion).

For EACH frame, describe in EXTREME detail:
1. Layout: positioning of all elements (%, px estimates)
2. Typography: font style, weight, size, color (hex), alignment
3. Colors: background, text, accents — ALL hex codes
4. Effects: blur, glow, grain, texture, displacement
5. Animation: what's moving, how, easing curves
6. Composition: what elements are on screen, z-ordering

Then give a COMPLETE specification:
- Canvas size and FPS
- Full color palette with hex codes
- Font choices and sizes
- Animation timeline (what happens at each second)
- Every visual effect and its parameters
- The overall style/mood

I need enough detail to write code that produces a PIXEL-PERFECT recreation.""",
        images=frames
    )

    with open(f"{WORK_DIR}/reference_analysis.txt", "w") as f:
        f.write(analysis)

    print(f"   Analysis: {len(analysis)} chars")
    return analysis, frames, duration


def generate_code(analysis, duration, iteration=0, previous_feedback=None):
    """Step 2/5: Claude Opus generates/fixes Remotion code."""

    if iteration == 0:
        print("\n🧠 Step 2: Claude Opus generating initial Remotion code...")
        prompt = f"""Based on this deep analysis of a reference video, write a COMPLETE Remotion composition that recreates it EXACTLY.

ANALYSIS:
{analysis}

REQUIREMENTS:
- File: src/AutoResearch.jsx
- Canvas: 1920x1080, 30fps, {int(duration * 30)} frames ({duration:.0f}s)
- Register in Root.jsx as "AutoResearch"
- Use @remotion/google-fonts for fonts
- Use lightweight CSS effects (no heavy SVG feTurbulence per frame)
- Film grain: static CSS background-image, not animated SVG
- All animations via interpolate() + spring()
- Include ALL visual details from the analysis

Write ONLY the complete JSX file content. No explanation."""
    else:
        print(f"\n🔧 Step {iteration + 2}: Claude Opus fixing code (iteration {iteration})...")
        # Read current code
        with open(f"{REMOTION_DIR}/src/AutoResearch.jsx") as f:
            current_code = f.read()

        prompt = f"""Fix this Remotion composition to better match the reference video.

CURRENT CODE:
{current_code}

GEMINI COMPARISON FEEDBACK:
{previous_feedback}

Fix the TOP 3 issues identified by Gemini. Make specific, targeted changes.
Write ONLY the complete updated JSX file content. No explanation."""

    code = claude_code(prompt, timeout=180)

    # Extract JSX from response (may have markdown)
    if "```jsx" in code:
        code = code.split("```jsx")[1].split("```")[0]
    elif "```" in code:
        code = code.split("```")[1].split("```")[0]

    # Write code
    code_path = f"{REMOTION_DIR}/src/AutoResearch.jsx"
    with open(code_path, "w") as f:
        f.write(code)

    # Ensure it's registered in Root.jsx
    root_path = f"{REMOTION_DIR}/src/Root.jsx"
    with open(root_path) as f:
        root_content = f.read()

    if "AutoResearch" not in root_content:
        # Add import and composition
        root_content = root_content.replace(
            'import { Composition } from "remotion";',
            'import { Composition } from "remotion";\nimport { AutoResearch } from "./AutoResearch";'
        )
        root_content = root_content.replace(
            "    </>",
            f"""      <Composition
        id="AutoResearch"
        component={{AutoResearch}}
        durationInFrames={{{int(duration * 30)}}}
        fps={{30}}
        width={{1920}}
        height={{1080}}
      />
    </>"""
        )
        with open(root_path, "w") as f:
            f.write(root_content)

    print(f"   Code written: {len(code)} chars")
    return code


def render_and_extract(iteration):
    """Step 3: Render and extract frames."""
    print(f"\n🎬 Step 3: Rendering iteration {iteration}...")

    output_path = f"{WORK_DIR}/iterations/iter_{iteration}.mp4"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    try:
        render_composition(COMPOSITION_ID, output_path, timeout=600)
    except Exception as e:
        print(f"   ❌ Render failed: {e}")
        return None, []

    frames_dir = f"{WORK_DIR}/iterations/iter_{iteration}_frames"
    frames = extract_frames(output_path, frames_dir, interval=2, max_frames=10)

    print(f"   ✅ Rendered: {output_path}")
    return output_path, frames


def compare_videos(ref_frames, attempt_frames, iteration):
    """Step 4: Gemini compares reference vs attempt side-by-side."""
    print(f"\n👁 Step 4: Gemini comparing reference vs attempt (iteration {iteration})...")

    # Interleave reference and attempt frames
    images = []
    labels = []
    for i in range(min(len(ref_frames), len(attempt_frames))):
        images.append(ref_frames[i])
        labels.append(f"[REFERENCE frame {i+1}]")
        images.append(attempt_frames[i])
        labels.append(f"[ATTEMPT frame {i+1}]")

    # Build prompt with labels
    parts_text = "\n".join(labels)

    comparison = gemini(
        f"""Compare these pairs of frames. Each pair is REFERENCE then ATTEMPT.
{parts_text}

Score the attempt on these criteria (0-100 each):
1. LAYOUT — are elements positioned correctly?
2. TYPOGRAPHY — correct fonts, sizes, colors, weights?
3. COLORS — correct palette, backgrounds, accents?
4. EFFECTS — correct grain, glow, texture, displacement?
5. TIMING — are animations at the right point in the video?
6. OVERALL — how close is the attempt to the reference?

Then list the TOP 3 most important differences to fix, in order of impact.

Format:
SCORES:
Layout: XX/100
Typography: XX/100
Colors: XX/100
Effects: XX/100
Timing: XX/100
Overall: XX/100

TOP 3 FIXES:
1. [most impactful fix needed]
2. [second fix]
3. [third fix]

DETAILED DIFFERENCES:
[describe each difference precisely with exact values to change]""",
        images=images
    )

    # Parse overall score
    overall_score = 0
    for line in comparison.split("\n"):
        if "Overall:" in line:
            try:
                overall_score = int(line.split("/")[0].split(":")[-1].strip())
            except:
                pass

    with open(f"{WORK_DIR}/iterations/comparison_{iteration}.txt", "w") as f:
        f.write(comparison)

    print(f"   Overall score: {overall_score}/100")
    return comparison, overall_score


def run_loop(reference_video, max_iterations=10, target_score=80):
    """Main auto-research loop."""
    os.makedirs(WORK_DIR, exist_ok=True)
    os.makedirs(f"{WORK_DIR}/iterations", exist_ok=True)

    print("=" * 60)
    print("🔬 AUTO-RESEARCH VIDEO LOOP")
    print(f"   Reference: {reference_video}")
    print(f"   Max iterations: {max_iterations}")
    print(f"   Target score: {target_score}/100")
    print("=" * 60)

    # Step 1: Analyze reference
    analysis, ref_frames, duration = analyze_reference(reference_video)

    best_score = 0
    best_iteration = 0
    stale_count = 0
    feedback = None

    for iteration in range(max_iterations):
        print(f"\n{'=' * 40}")
        print(f"📍 ITERATION {iteration + 1}/{max_iterations}")
        print(f"{'=' * 40}")

        # Step 2/5: Generate or fix code
        generate_code(analysis, duration, iteration, feedback)

        # Step 3: Render
        video_path, attempt_frames = render_and_extract(iteration)
        if not video_path:
            print("   ⚠️ Render failed, trying to fix...")
            feedback = "RENDER FAILED. The code has syntax or runtime errors. Fix them."
            stale_count += 1
            if stale_count >= 4:
                print("   ❌ Too many failures, stopping.")
                break
            continue

        # Step 4: Compare
        feedback, score = compare_videos(ref_frames, attempt_frames, iteration)

        # Track progress
        if score > best_score:
            best_score = score
            best_iteration = iteration
            stale_count = 0
            # Save best version
            shutil.copy(video_path, f"{WORK_DIR}/best.mp4")
            shutil.copy(f"{REMOTION_DIR}/src/AutoResearch.jsx", f"{WORK_DIR}/best_code.jsx")
            print(f"   🏆 New best! Score: {best_score}/100")
        else:
            stale_count += 1
            print(f"   📊 No improvement ({stale_count} stale rounds)")

        # Check stopping conditions
        if score >= target_score:
            print(f"\n🎉 TARGET REACHED! Score: {score}/100")
            break

        if stale_count >= 4:
            print(f"\n⚠️ Stale for {stale_count} rounds, stopping.")
            break

    print(f"\n{'=' * 60}")
    print(f"🏁 LOOP COMPLETE")
    print(f"   Best score: {best_score}/100 (iteration {best_iteration + 1})")
    print(f"   Best video: {WORK_DIR}/best.mp4")
    print(f"   Best code: {WORK_DIR}/best_code.jsx")
    print(f"{'=' * 60}")

    return best_score, f"{WORK_DIR}/best.mp4", f"{WORK_DIR}/best_code.jsx"


# ==================== CLI ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-research video recreation loop")
    parser.add_argument("reference", help="Path to reference video")
    parser.add_argument("--max-iterations", type=int, default=10)
    parser.add_argument("--target-score", type=int, default=80)

    args = parser.parse_args()

    if not os.path.exists(args.reference):
        print(f"Error: {args.reference} not found")
        sys.exit(1)

    score, video, code = run_loop(
        args.reference,
        max_iterations=args.max_iterations,
        target_score=args.target_score
    )

    print(f"\nDone! Best score: {score}/100")
    print(f"Video: {video}")
    print(f"Code: {code}")
