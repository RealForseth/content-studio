#!/usr/bin/env python3
"""Test all Gemini models on beta.vertexapis.com and report status."""

import requests
import time
import sys

API_KEY = "sk-a5734bbecd6947c3840976e4bfa2fe14"
BASE = "https://beta.vertexapis.com/v1beta/models"
H = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}

MODELS = {
    "Text/Multimodal": [
        "gemini-3.1-pro-preview",
        "gemini-3.1-flash-lite-preview",
        "gemini-3-flash-preview",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
    ],
    "Image Generation": [
        "gemini-3.1-flash-image-preview",
        "gemini-3-pro-image-preview",
    ],
    "Imagen (predict endpoint)": [
        "imagen-3.0-generate-002",
        "imagen-3.0-generate-001",
        "imagen-3.0-fast-generate-001",
    ],
}

def test_text_model(model, timeout=30):
    try:
        start = time.time()
        resp = requests.post(
            f"{BASE}/{model}:generateContent?key={API_KEY}",
            json={"contents": [{"role": "user", "parts": [{"text": "Say hello in one word"}]}]},
            headers=H, timeout=timeout
        )
        elapsed = time.time() - start
        if resp.status_code == 200:
            return f"✅ OK ({elapsed:.1f}s)"
        else:
            err = resp.json().get("error", {}).get("message", "")[:50]
            return f"❌ {resp.status_code}: {err}"
    except requests.exceptions.Timeout:
        return "⏱ Timeout"
    except Exception as e:
        return f"💥 Error: {str(e)[:40]}"

def test_imagen(model, timeout=30):
    try:
        start = time.time()
        resp = requests.post(
            f"{BASE}/{model}:predict?key={API_KEY}",
            json={"instances": [{"prompt": "A red circle"}], "parameters": {"sampleCount": 1}},
            headers=H, timeout=timeout
        )
        elapsed = time.time() - start
        if resp.status_code == 200 and "predictions" in resp.json():
            size = len(resp.json()["predictions"][0].get("bytesBase64Encoded", ""))
            return f"✅ OK ({elapsed:.1f}s, {size//1024}KB)"
        else:
            err = resp.json().get("error", {}).get("message", "")[:50]
            return f"❌ {resp.status_code}: {err}"
    except requests.exceptions.Timeout:
        return "⏱ Timeout"
    except Exception as e:
        return f"💥 Error: {str(e)[:40]}"

if __name__ == "__main__":
    timeout = int(sys.argv[1]) if len(sys.argv) > 1 else 30

    print(f"Testing Gemini models on beta.vertexapis.com (timeout={timeout}s)\n")

    for category, models in MODELS.items():
        print(f"=== {category} ===")
        for model in models:
            if "imagen" in model:
                status = test_imagen(model, timeout)
            else:
                status = test_text_model(model, timeout)
            print(f"  {model:40s} {status}")
        print()

    print("Done.")
