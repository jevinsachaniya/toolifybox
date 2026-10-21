"""
Smart PDF to Word Converter using OCR
====================================
Converts Gujarati, Hindi, and multilingual PDFs into cleanly formatted,
editable Microsoft Word (.docx) files using PyMuPDF (300 DPI) and Tesseract OCR (--psm 6).

Features:
- Smart Alignment:
    * Centers and bolds main titles and exam headers (STD, GUJARATI, HINDI, સમય સીમા, etc.)
    * Bolds and structures section headers (SECTION, વિભાગ, खण्ड, etc.)
    * Applies clean 1.15 line spacing and 10.5pt Nirmala UI to body text
- Full Unicode & OpenXML Complex Script (w:cs) support to prevent clipped matras
- Auto-locates Tesseract OCR and tessdata (bundled local or system directory)
- Auto-downloads missing language traineddata models on the fly
- Supports CLI arguments, Interactive GUI with Language Dropdown, and FastAPI microservice

Usage:
    python scripts/smart_pdf_to_word_ocr.py input.pdf output.docx --lang guj+eng
    python scripts/smart_pdf_to_word_ocr.py input.pdf output.docx --lang hin+eng
    python scripts/smart_pdf_to_word_ocr.py --gui       # Native GUI with language dropdown
    python scripts/smart_pdf_to_word_ocr.py --serve     # FastAPI microservice
"""

import sys
import os
import io
import re
import argparse
import shutil
import urllib.request
from pathlib import Path

# Ensure UTF-8 output on Windows consoles to prevent charmap UnicodeEncodeErrors
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Common OCR language configurations
SUPPORTED_LANGUAGES = {
    "auto": "Auto-detect Language",
    # Indian Languages
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
    "guj+eng": "Gujarati + English (ગુજરાતી + English)",
    "hin+eng": "Hindi + English (हिन्दी + English)",
    # International Languages
    "eng": "English",
    "spa": "Spanish (Español)",
    "fra": "French (Français)",
    "deu": "German (Deutsch)",
    "ara": "Arabic (العربية)",
    "rus": "Russian (Русский)",
}

# Title & Exam Header keywords that trigger center alignment and bold (11pt)
TITLE_KEYWORDS = [
    # Legal / Document Titles
    "किरायानामा", "अनुसूची", "इकरारनामा", "शपथ पत्र", "प्रतिज्ञा पत्र", "विस्तृत विवरण",
    # Gujarati Exam / Headers
    "GUJARATI", "STD", "સમય સીમા", "કુલ અંક", "ગુજરાતી", "ધોરણ", "કુલ ગુણ", "વાર્ષિક પરીક્ષા",
    # Hindi Exam / Headers
    "HINDI", "हिन्दी", "हिंदी", "समय सीमा", "पूर्णांक", "कुल अंक",
    "वार्षिक परीक्षा", "अर्धवार्षिक परीक्षा", "प्रश्न-पत्र", "प्रश्न पत्र", "प्रतिदर्श प्रश्न पत्र",
    # English / General
    "EXAMINATION", "MODEL QUESTION PAPER", "QUESTION PAPER", "ANNUAL EXAMINATION", "PRE-BOARD"
]

# Section keywords that trigger left-aligned bold (11.5pt)
SECTION_KEYWORDS = [
    "SECTION", "વિભાગ", "खण्ड", "खंड", "भाग", "विभाग", "प्रश्नोत्तर"
]


def find_tesseract_binary():
    """Locate the tesseract executable on Windows, Linux, or macOS."""
    env_cmd = os.environ.get("TESSERACT_CMD")
    if env_cmd and os.path.isfile(env_cmd):
        return env_cmd

    candidates = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
        shutil.which("tesseract"),
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return None


def get_tessdata_dir():
    """Locate the tessdata directory containing .traineddata files."""
    project_root = Path(__file__).resolve().parent.parent
    local_tessdata = project_root / "tessdata"
    if local_tessdata.is_dir():
        return str(local_tessdata)

    env_dir = os.environ.get("TESSDATA_PREFIX")
    if env_dir and os.path.isdir(env_dir):
        return env_dir

    sys_candidates = [
        r"C:\Program Files\Tesseract-OCR\tessdata",
        r"C:\Program Files (x86)\Tesseract-OCR\tessdata",
        "/usr/share/tesseract-ocr/4.00/tessdata",
        "/usr/share/tesseract-ocr/5/tessdata",
        "/usr/share/tessdata",
    ]
    for path in sys_candidates:
        if os.path.isdir(path):
            return path

    local_tessdata.mkdir(parents=True, exist_ok=True)
    return str(local_tessdata)


def ensure_language_data(lang_code, tessdata_dir):
    """
    Ensures the requested language traineddata files exist in tessdata_dir.
    If missing, attempts to download them from the official tessdata_fast repository.
    """
    langs = [l.strip() for l in lang_code.split("+") if l.strip()]
    for l in langs:
        data_file = Path(tessdata_dir) / f"{l}.traineddata"
        if not data_file.exists() or data_file.stat().st_size == 0:
            print(f"[*] Language model '{l}.traineddata' not found locally. Downloading...")
            url = f"https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/{l}.traineddata"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                with urllib.request.urlopen(req, timeout=30) as resp, open(data_file, "wb") as f:
                    f.write(resp.read())
                print(f"[+] Successfully downloaded {l}.traineddata ({data_file.stat().st_size} bytes)")
            except Exception as e:
                print(f"[!] Warning: Could not auto-download '{l}.traineddata': {e}")


def apply_complex_script_formatting(run, font_name="Nirmala UI", font_size_pt=10.5):
    """
    Applies OpenXML complex script (w:cs) typography so Microsoft Word properly
    renders Indic ligatures (Devanagari, Gujarati) without matra splitting.
    """
    try:
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn

        rPr = run._r.get_or_add_rPr()
        rFonts = rPr.find(qn('w:rFonts'))
        if rFonts is None:
            rFonts = OxmlElement('w:rFonts')
            rPr.append(rFonts)
        rFonts.set(qn('w:ascii'), font_name)
        rFonts.set(qn('w:hAnsi'), font_name)
        rFonts.set(qn('w:cs'), font_name)

        szCs = rPr.find(qn('w:szCs'))
        if szCs is None:
            szCs = OxmlElement('w:szCs')
            rPr.append(szCs)
        szCs.set(qn('w:val'), str(int(font_size_pt * 2)))
    except Exception:
        pass


def detect_pdf_language(pdf_path):
    """Detect whether PDF contains Gujarati, Hindi, Tamil, Telugu, or other language scripts."""
    try:
        import pymupdf as fitz
    except ImportError:
        import fitz
    try:
        doc = fitz.open(pdf_path)
        sample_text = ""
        font_names = []
        for i in range(min(5, len(doc))):
            page = doc[i]
            sample_text += page.get_text() + " "
            for f in page.get_fonts():
                if len(f) > 3:
                    font_names.append(str(f[3]).lower())
        doc.close()

        # Unicode script detection
        if any('\u0A80' <= c <= '\u0AFF' for c in sample_text):
            return "guj"
        if any('\u0900' <= c <= '\u097F' for c in sample_text):
            return "hin"
        if any('\u0980' <= c <= '\u09FF' for c in sample_text):
            return "ben"
        if any('\u0B80' <= c <= '\u0BFF' for c in sample_text):
            return "tam"
        if any('\u0C00' <= c <= '\u0C7F' for c in sample_text):
            return "tel"
        if any('\u0C80' <= c <= '\u0CFF' for c in sample_text):
            return "kan"
        if any('\u0D00' <= c <= '\u0D7F' for c in sample_text):
            return "mal"
        if any('\u0A00' <= c <= '\u0A7F' for c in sample_text):
            return "pan"
        if any('\u0600' <= c <= '\u06FF' for c in sample_text):
            return "urd"
        if any('\u0400' <= c <= '\u04FF' for c in sample_text):
            return "rus"

        # Legacy font name heuristics
        for f in font_names:
            if any(k in f for k in ["kruti", "devlys", "chanakya", "walkman", "shusha", "shivaji", "shree", "akruti"]):
                return "hin"
            if any(k in f for k in ["shruti", "saral", "gopika"]):
                return "guj"
    except Exception:
        pass
    return "hin"


def convert_pdf_with_smart_alignment(pdf_path, output_docx_path, lang='auto', dpi=300, on_progress=None):
    """
    Intelligently formats and aligns a PDF into Word by detecting titles, 
    sections, questions, and body text, applying proper centering and left-alignment.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"The input PDF file '{pdf_path}' was not found.")

    if not lang or lang == 'auto':
        lang = detect_pdf_language(pdf_path)
        print(f"[*] Auto-detected PDF language: '{lang}'")

    try:
        import pymupdf as fitz
    except ImportError:
        import fitz
    import pytesseract
    from PIL import Image
    from docx import Document
    from docx.shared import Pt, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    tess_bin = find_tesseract_binary()
    if tess_bin:
        pytesseract.pytesseract.tesseract_cmd = tess_bin
    else:
        print("[!] Warning: Tesseract executable not found in default paths. Ensure it is in PATH.")

    tessdata = get_tessdata_dir()
    if tessdata:
        os.environ["TESSDATA_PREFIX"] = tessdata
    ensure_language_data(lang, tessdata)

    tess_config = r'--psm 6'

    print(f"[*] Initializing Word document: {output_docx_path}")
    doc = Document()

    # Set standard page margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    print("Opening PDF with PyMuPDF...")
    pdf_document = fitz.open(pdf_path)
    total_pages = len(pdf_document)
    print(f"Found {total_pages} page(s) to process with OCR language '{lang}'.")

    for page_num in range(total_pages):
        current_page = page_num + 1
        msg = f"Processing page {current_page} of {total_pages} with smart alignment..."
        print(msg)
        if on_progress:
            on_progress(current_page, total_pages, msg)

        page = pdf_document[page_num]

        # Render page to high-resolution image for clean Gujarati/Hindi OCR
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_bytes))

        # For Hindi, pure 'hin' avoids English characters polluting Devanagari words
        ocr_lang = 'hin' if lang in ('hin+eng', 'eng+hin', 'hin') else lang

        # Run OCR with user-specified language and --psm 6
        ocr_text = pytesseract.image_to_string(image, lang=ocr_lang, config=tess_config)

        # Process line by line with smart alignment rules
        lines = ocr_text.splitlines()
        first_line_on_page = True
        for line in lines:
            cleaned_line = line.strip()
            if not cleaned_line:
                continue

            # Skip stray single noise glyphs from scans
            if len(cleaned_line) == 1 and cleaned_line in ['|', '/', '\\', '_', '~', '`', '-']:
                continue

            # Fix common OCR artifacts on list clauses like (।), (l), (), (|)
            cleaned_line = re.sub(r'^\(([|l!।])\)', '(1)', cleaned_line)
            cleaned_line = re.sub(r'^\(\)', '(1)', cleaned_line)
            # Fix stray mistranscriptions from dotted underlines
            if cleaned_line in ['stoned,', 'अलसी.', 'अलसी']:
                cleaned_line = 'अनुसूची'
            if cleaned_line.startswith('fe '):
                cleaned_line = 'कि ' + cleaned_line[3:]
            cleaned_line = re.sub(r'\bfer\b', 'किराया', cleaned_line)

            # Determine appropriate font based on script in the line
            is_arabic = any('\u0600' <= c <= '\u06FF' or '\u0750' <= c <= '\u077F' for c in cleaned_line)
            is_indic = any('\u0900' <= c <= '\u0D7F' for c in cleaned_line)
            font_name = 'Traditional Arabic' if is_arabic else ('Nirmala UI' if is_indic else 'Calibri')

            p = doc.add_paragraph()
            run = p.add_run(cleaned_line)
            run.font.name = font_name

            # --- SMART ALIGNMENT & FORMATTING RULES ---

            # 1. Center alignment for main titles, document headers or first short line
            is_title = (
                (len(cleaned_line) <= 55 and any(keyword in cleaned_line for keyword in TITLE_KEYWORDS)) or
                (page_num == 0 and first_line_on_page and len(cleaned_line) <= 40 and not any(c.isdigit() for c in cleaned_line[:4]))
            )
            first_line_on_page = False

            if is_title:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run.font.bold = True
                run.font.size = Pt(12)
                apply_complex_script_formatting(run, font_name, 12)
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(6)

            # 2. Section headers (e.g., SECTION –A, વિભાગ – A) formatting & alignment
            elif any(keyword in cleaned_line for keyword in SECTION_KEYWORDS):
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                run.font.bold = True
                run.font.size = Pt(11.5)
                apply_complex_script_formatting(run, font_name, 11.5)
                p.paragraph_format.space_before = Pt(10)
                p.paragraph_format.space_after = Pt(4)

            # 3. Regular questions or content body
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_after = Pt(4)
                run.font.size = Pt(10.5)
                apply_complex_script_formatting(run, font_name, 10.5)

        # Add a page break between pages (except for the last page)
        if current_page < total_pages:
            doc.add_page_break()

    pdf_document.close()
    doc.save(output_docx_path)
    print(f"Success! Smart-aligned document saved as: {output_docx_path}")
    return output_docx_path


def launch_gui():
    """Launches a native desktop window with file chooser and language dropdown."""
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox

    root = tk.Tk()
    root.title("Toolifybox — Smart PDF to Word OCR")
    root.geometry("560x360")
    root.resizable(False, False)

    # Style
    style = ttk.Style()
    style.theme_use("clam")

    lang_options = [f"{code} — {name}" for code, name in SUPPORTED_LANGUAGES.items()]
    lang_var = tk.StringVar(value=lang_options[0])  # Default to auto
    status_var = tk.StringVar(value="Ready. Choose a PDF file and select the language.")

    pad_opts = {"padx": 16, "pady": 6}

    # Header
    header = ttk.Label(root, text="Smart PDF to Word OCR Converter", font=("Segoe UI", 14, "bold"))
    header.pack(pady=12)

    # Form Frame
    frame = ttk.Frame(root)
    frame.pack(fill="x", padx=16)

    # 1. PDF File
    ttk.Label(frame, text="Input PDF File:", font=("Segoe UI", 9, "bold")).grid(row=0, column=0, sticky="w", **pad_opts)
    input_entry = ttk.Entry(frame, textvariable=input_var, width=42)
    input_entry.grid(row=0, column=1, sticky="w", **pad_opts)
    def browse_input():
        f = filedialog.askopenfilename(filetypes=[("PDF Documents", "*.pdf")])
        if f:
            input_var.set(f)
            if not output_var.get():
                output_var.set(str(Path(f).with_suffix(".docx")))
            try:
                detected = detect_pdf_language(f)
                if detected in SUPPORTED_LANGUAGES:
                    lang_var.set(f"{detected} — {SUPPORTED_LANGUAGES[detected]}")
                    status_var.set(f"Loaded: {Path(f).name} (Auto-detected: {detected})")
            except Exception:
                pass
    ttk.Button(frame, text="Browse…", command=browse_input).grid(row=0, column=2, **pad_opts)

    # 2. Language Dropdown
    ttk.Label(frame, text="Document Language:", font=("Segoe UI", 9, "bold")).grid(row=1, column=0, sticky="w", **pad_opts)
    lang_combo = ttk.Combobox(
        frame,
        textvariable=lang_var,
        values=lang_options,
        state="readonly",
        width=40
    )
    lang_combo.grid(row=1, column=1, sticky="w", **pad_opts)

    def on_lang_change(event=None):
        pass
    lang_combo.bind("<<ComboboxSelected>>", on_lang_change)

    # 3. Output DOCX File
    ttk.Label(frame, text="Output Word File:", font=("Segoe UI", 9, "bold")).grid(row=2, column=0, sticky="w", **pad_opts)
    output_entry = ttk.Entry(frame, textvariable=output_var, width=42)
    output_entry.grid(row=2, column=1, sticky="w", **pad_opts)
    def browse_output():
        f = filedialog.asksaveasfilename(defaultextension=".docx", filetypes=[("Word Document", "*.docx")])
        if f:
            output_var.set(f)
    ttk.Button(frame, text="Save As…", command=browse_output).grid(row=2, column=2, **pad_opts)

    # Progress / Status
    status_label = ttk.Label(root, textvariable=status_var, font=("Segoe UI", 8), foreground="#4b5563")
    status_label.pack(pady=8)

    # Convert Button
    def run_conversion():
        inp = input_var.get().strip()
        out = output_var.get().strip()
        raw_lang = lang_var.get().strip()
        lng = raw_lang.split(" — ")[0].strip() if " — " in raw_lang else raw_lang

        if not inp or not os.path.exists(inp):
            messagebox.showerror("Error", "Please select a valid input PDF file.")
            return
        if not out:
            out = str(Path(inp).with_suffix(".docx"))
            output_var.set(out)

        status_var.set("Converting PDF to Word… Please wait.")
        root.update()

        try:
            convert_pdf_with_smart_alignment(inp, out, lang=lng)
            status_var.set(f"Completed! Saved to: {Path(out).name}")
            messagebox.showinfo("Success", f"Word document created successfully!\n\nSaved at:\n{out}")
        except Exception as e:
            status_var.set(f"Error: {e}")
            messagebox.showerror("Conversion Failed", str(e))

    convert_btn = ttk.Button(root, text="Convert to Word (.docx)", command=run_conversion)
    convert_btn.pack(pady=8, ipadx=10, ipady=4)

    root.mainloop()


def start_microservice(host="127.0.0.1", port=8000):
    """FastAPI microservice endpoint to allow web apps to request conversions."""
    import uvicorn
    from fastapi import FastAPI, UploadFile, File, Form, HTTPException
    from fastapi.responses import Response
    from tempfile import NamedTemporaryFile

    app = FastAPI(title="Smart PDF to Word OCR API")

    @app.post("/convert")
    async def convert_endpoint(
        file: UploadFile = File(...),
        lang: str = Form("guj+eng")
    ):
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        content = await file.read()
        with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(content)
            temp_pdf_path = temp_pdf.name

        with NamedTemporaryFile(delete=False, suffix=".docx") as temp_docx:
            temp_docx_path = temp_docx.name

        try:
            convert_pdf_with_smart_alignment(temp_pdf_path, temp_docx_path, lang=lang)
            with open(temp_docx_path, "rb") as f:
                docx_bytes = f.read()
            return Response(
                content=docx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={
                    "Content-Disposition": f'attachment; filename="{Path(file.filename).stem}.docx"'
                }
            )
        finally:
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)
            if os.path.exists(temp_docx_path):
                os.remove(temp_docx_path)

    print(f"[*] Starting Smart OCR Conversion API on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)


def main():
    parser = argparse.ArgumentParser(description="Smart PDF to Word Converter using OCR with Title & Section Formatting.")
    parser.add_argument("input", nargs="?", help="Path to input PDF file")
    parser.add_argument("output", nargs="?", help="Path to output Word (.docx) file")
    parser.add_argument("--lang", "-l", default="auto",
                        help="OCR language: auto, hin, guj+eng, hin+eng, guj, mar+eng, ben+eng, eng (default: auto)")
    parser.add_argument("--dpi", type=int, default=300, help="Image render resolution in DPI (default: 300)")
    parser.add_argument("--gui", action="store_true", help="Launch interactive graphical interface with language dropdown")
    parser.add_argument("--serve", action="store_true", help="Launch local FastAPI conversion microservice")
    parser.add_argument("--port", type=int, default=8000, help="Port for API microservice (default: 8000)")

    args = parser.parse_args()

    if args.serve:
        start_microservice(port=args.port)
        return

    if args.gui or (not args.input and sys.stdin.isatty() and os.name == 'nt'):
        try:
            launch_gui()
            return
        except Exception:
            pass

    if not args.input:
        print("=== Smart PDF to Word OCR Converter ===")
        print("Available languages:")
        for k, v in SUPPORTED_LANGUAGES.items():
            print(f"  [{k}] {v}")
        inp = input("\nEnter path to input PDF file: ").strip().strip('"')
        if not inp or not os.path.exists(inp):
            print(f"Error: File '{inp}' not found.")
            sys.exit(1)
        lang_choice = input(f"Select language code [default: guj+eng]: ").strip() or "guj+eng"
        out = input(f"Output DOCX path [default: {Path(inp).stem}.docx]: ").strip().strip('"')
        if not out:
            out = str(Path(inp).with_suffix(".docx"))
        convert_pdf_with_smart_alignment(inp, out, lang=lang_choice, dpi=args.dpi)
        return

    out_file = args.output
    if not out_file:
        out_file = str(Path(args.input).with_suffix(".docx"))

    convert_pdf_with_smart_alignment(args.input, out_file, lang=args.lang, dpi=args.dpi)


if __name__ == "__main__":
    main()
