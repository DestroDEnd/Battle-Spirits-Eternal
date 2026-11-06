"""
scripts/verify_pdf.py

Verification script for reports/card_effects_audit_and_implementation_plan.pdf
Validates file existence, file size, page count (>=5 pages), text content integrity,
and presence of key audit and roadmap sections using Python 3.13 and pypdfium2.
"""

import os
import sys
import pypdfium2 as pdfium

def verify_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(script_dir, ".."))
    pdf_path = os.path.join(root_dir, "reports", "card_effects_audit_and_implementation_plan.pdf")

    print("==================================================================")
    print("  BATTLE SPIRITS ETERNAL — PDF AUDIT & PLAN VERIFICATION")
    print("==================================================================")
    print(f"Target PDF Path: {pdf_path}")

    # 1. Existence check
    if not os.path.isfile(pdf_path):
        print(f"[FAIL] Target PDF does not exist at {pdf_path}")
        sys.exit(1)
    
    file_size = os.path.getsize(pdf_path)
    print(f"[OK] File exists. Size: {file_size:,} bytes ({(file_size / 1024):.2f} KB)")
    if file_size < 10000:
        print(f"[FAIL] File size is suspiciously small: {file_size} bytes")
        sys.exit(1)

    # 2. PDF Structure and Page Count via pypdfium2
    try:
        doc = pdfium.PdfDocument(pdf_path)
    except Exception as e:
        print(f"[FAIL] pypdfium2 failed to parse PDF document: {e}")
        sys.exit(1)

    page_count = len(doc)
    print(f"[OK] PDF parsed successfully by pypdfium2. Total Pages: {page_count}")
    
    if page_count < 5:
        print(f"[FAIL] PDF page count {page_count} is less than required minimum of 5 pages.")
        sys.exit(1)
    else:
        print(f"[PASS] Page count validation satisfied: {page_count} >= 5 styled pages.")

    # 3. Content and Text Stream Extraction
    all_text = []
    print("\n--- Page by Page Inspection ---")
    for i in range(page_count):
        page = doc[i]
        textpage = page.get_textpage()
        text = textpage.get_text_range()
        text_len = len(text.strip())
        print(f"Page {i + 1}: {text_len} characters extracted.")
        if text_len < 100:
            print(f"[FAIL] Page {i + 1} has insufficient text ({text_len} characters). Rendering defect suspected.")
            sys.exit(1)
        all_text.append(text)

    combined_text = "\n".join(all_text)

    # 4. Mandatory Section and Keyword Verification
    required_keywords = [
        ("Document Title", "BATTLE SPIRITS ETERNAL"),
        ("Executive Summary", "Executive Summary"),
        ("Database Audit", "Full Card Database & Asset Audit"),
        ("Canonical Card Count", "14,611"),
        ("IR Compiler Section", "IR Compiler & Sharding Architecture"),
        ("Engine Execution Gap", "Runtime Engine Execution Gap Analysis"),
        ("Implemented Primitives Count", "17"),
        ("Roadmap Section", "Phased Implementation Roadmap"),
        ("Milestone 1", "MILESTONE 1"),
        ("Milestone 2", "MILESTONE 2"),
        ("Milestone 3", "MILESTONE 3"),
        ("Milestone 4", "MILESTONE 4"),
        ("Milestone 5", "MILESTONE 5"),
        ("Token Budget Strategy", "Token Budgeting & Session Continuity Strategy"),
        ("Architectural Rules", "AGENTS.md"),
        ("Verification Protocol", "Verification & Reproduction Protocol"),
    ]

    print("\n--- Keyword and Section Assertions ---")
    all_passed = True
    for label, kw in required_keywords:
        if kw.lower() in combined_text.lower():
            print(f"[PASS] Found: '{kw}' ({label})")
        else:
            print(f"[FAIL] Missing: '{kw}' ({label})")
            all_passed = False

    if not all_passed:
        print("\n[FAIL] One or more required sections were not found in the rendered PDF.")
        sys.exit(1)

    print("\n==================================================================")
    print("  ALL PDF VERIFICATION CHECKS PASSED SUCCESSFULLY (0 ERRORS)")
    print(f"  Valid PDF: {page_count} pages | {file_size:,} bytes | pypdfium2 verified")
    print("==================================================================\n")

if __name__ == "__main__":
    verify_pdf()
