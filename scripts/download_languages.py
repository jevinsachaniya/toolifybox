# -*- coding: utf-8 -*-
"""
Language Pack Downloader for Tesseract OCR
==========================================
Downloads traineddata files for Indian and major world languages,
placing them into 'tessdata/' and gzipping for 'public/ocr/7.0.0/languages/'.
"""

import os
import sys
import gzip
import urllib.request
from pathlib import Path

if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

LANGUAGES = {
    # Major Indian Languages
    "hin": "Hindi (हिन्दी)",
    "guj": "Gujarati (ગુજરાતી)",
    "mar": "Marathi (मराठी)",
    "ben": "Bengali (বাংলা)",
    "tam": "Tamil (தமிழ்)",
    "tel": "Telugu (తెలుగు)",
    "kan": "Kannada (ಕನ್ನಡ)",
    "mal": "Malayalam (മലയാളം)",
    "pan": "Punjabi (ਪੰਜਾਬੀ)",
    "urd": "Urdu (اردو)",
    "san": "Sanskrit (संस्कृतम्)",
    # Major International Languages
    "eng": "English",
    "spa": "Spanish (Español)",
    "fra": "French (Français)",
    "deu": "German (Deutsch)",
    "ara": "Arabic (العربية)",
    "rus": "Russian (Русский)",
}

ROOT = Path(__file__).resolve().parent.parent
TESSDATA_DIR = ROOT / "tessdata"
PUBLIC_OCR_LANGS = ROOT / "public" / "ocr" / "7.0.0" / "languages"

TESSDATA_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_OCR_LANGS.mkdir(parents=True, exist_ok=True)

def download_and_prepare(lang_code):
    raw_path = TESSDATA_DIR / f"{lang_code}.traineddata"
    gz_path = PUBLIC_OCR_LANGS / f"{lang_code}.traineddata.gz"

    # Step 1: Download .traineddata if missing
    if not raw_path.exists() or raw_path.stat().st_size == 0:
        url = f"https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/{lang_code}.traineddata"
        print(f"[*] Downloading {lang_code}.traineddata ({LANGUAGES.get(lang_code, lang_code)})...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = resp.read()
            with open(raw_path, "wb") as f:
                f.write(data)
            print(f"[+] Downloaded {lang_code}.traineddata ({len(data)} bytes)")
        except Exception as e:
            print(f"[!] Failed to download {lang_code}: {e}")
            return False
    else:
        print(f"[=] Already exists: {lang_code}.traineddata ({raw_path.stat().st_size} bytes)")

    # Step 2: Ensure gzipped version exists for browser OCR
    if not gz_path.exists() or gz_path.stat().st_size == 0:
        try:
            with open(raw_path, "rb") as f_in, gzip.open(gz_path, "wb") as f_out:
                f_out.writelines(f_in)
            print(f"[+] Created browser asset: {lang_code}.traineddata.gz ({gz_path.stat().st_size} bytes)")
        except Exception as e:
            print(f"[!] Failed to gzip {lang_code}: {e}")

    return True

def main():
    print("=== Toolifybox Language Pack Manager ===")
    for lang in LANGUAGES:
        download_and_prepare(lang)
    print("\n[+] All language packs processed successfully!")

if __name__ == "__main__":
    main()
