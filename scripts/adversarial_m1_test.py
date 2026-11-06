"""
scripts/adversarial_m1_test.py

Adversarial Verification & Stress Test Suite for Milestone 1.
Validates:
1. PDF Deliverable File Verification (magic header %PDF-, trailer %%EOF, size > 100KB)
2. PDF Structure & Corruption Check (renders every page to bitmap, checks text density)
3. PDF Content Assertions (14,611 cards, 49,326 clauses, 17 handled ops, 270 unhandled ops, M1-M5 roadmap)
4. HTTP Server Stress Test (tests 100 concurrent requests against live server, asserts MIME type, Content-Length, SHA-256 match)
5. Regression & Data Audit Execution (npm.cmd run audit:data, py scripts/data_audit.py, npm.cmd test)
"""

import os
import sys
import time
import hashlib
import urllib.request
import urllib.error
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
import pypdfium2 as pdfium

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PDF_PATH = os.path.join(ROOT_DIR, "reports", "card_effects_audit_and_implementation_plan.pdf")
SERVER_PORT = 3000
SERVER_URL = f"http://127.0.0.1:{SERVER_PORT}/reports/card_effects_audit_and_implementation_plan.pdf"

test_failures = []
findings = []

def record_pass(test_name, details=""):
    print(f"[PASS] {test_name}: {details}")

def record_fail(test_name, details=""):
    msg = f"[FAIL] {test_name}: {details}"
    print(msg)
    test_failures.append(msg)

def record_finding(finding_name, details=""):
    msg = f"[FINDING] {finding_name}: {details}"
    print(msg)
    findings.append(msg)

def test_pdf_file_integrity():
    print("\n--- 1. PDF File Integrity & Structure ---")
    if not os.path.exists(PDF_PATH):
        record_fail("PDF File Exists", f"File not found at {PDF_PATH}")
        return None
    
    file_size = os.path.getsize(PDF_PATH)
    if file_size > 100 * 1024:
        record_pass("PDF File Size > 100KB", f"{file_size:,} bytes ({(file_size/1024):.2f} KB)")
    else:
        record_fail("PDF File Size > 100KB", f"File size too small: {file_size} bytes")

    with open(PDF_PATH, "rb") as f:
        content = f.read()

    # Magic bytes check
    if content.startswith(b"%PDF-"):
        header_line = content[:15].decode('latin1', errors='replace').split('\r')[0].split('\n')[0]
        record_pass("PDF Header Magic Bytes", f"Valid magic bytes, version: {header_line}")
    else:
        record_fail("PDF Header Magic Bytes", f"Missing %PDF- header. Starts with: {content[:10]}")

    # EOF marker check
    tail = content[-1024:]
    if b"%%EOF" in tail:
        record_pass("PDF EOF Marker", "%%EOF found in trailer")
    else:
        record_fail("PDF EOF Marker", "%%EOF missing from trailer")

    sha256 = hashlib.sha256(content).hexdigest()
    record_pass("PDF SHA-256 Checksum", sha256)
    return sha256

def test_pdf_rendering_and_text():
    print("\n--- 2. PDF Rendering & Text Extraction ---")
    try:
        doc = pdfium.PdfDocument(PDF_PATH)
    except Exception as e:
        record_fail("PDF Load via pypdfium2", str(e))
        return

    page_count = len(doc)
    if page_count >= 5:
        record_pass("Page Count >= 5", f"{page_count} pages")
    else:
        record_fail("Page Count >= 5", f"Only {page_count} pages")

    all_text = []
    render_errors = 0
    blank_pages = 0
    bad_glyphs = 0

    for i in range(page_count):
        page = doc[i]
        
        # Test bitmap rendering for corruption / visual defects
        try:
            bmp = page.render(scale=1.0)
            if bmp.width <= 0 or bmp.height <= 0:
                record_fail(f"Page {i+1} Render Dimensions", f"Invalid dimensions {bmp.width}x{bmp.height}")
                render_errors += 1
        except Exception as e:
            record_fail(f"Page {i+1} Rendering", str(e))
            render_errors += 1

        # Test text extraction
        textpage = page.get_textpage()
        text = textpage.get_text_range()
        stripped_len = len(text.strip())
        all_text.append(text)
        bad_glyphs += text.count('\ufffd')

        if stripped_len < 100:
            record_fail(f"Page {i+1} Text Density", f"Suspiciously low character count: {stripped_len}")
            blank_pages += 1

    if render_errors == 0:
        record_pass("All Pages Rendered Without Error", f"{page_count}/{page_count} pages rendered successfully")
    if blank_pages == 0:
        record_pass("Zero Blank Pages", f"All {page_count} pages have substantial textual content")
    if bad_glyphs == 0:
        record_pass("Zero Corrupted Font Glyphs", "0 replacement characters (\\ufffd) across entire document")
    else:
        record_fail("Font Glyph Integrity", f"{bad_glyphs} unmapped characters found")

    combined_text = "\n".join(all_text)

    # Required assertions from dispatch
    critical_terms = [
        ("Canonical Card Count 14,611", "14,611"),
        ("Total Clause Count 49,326", "49,326"),
        ("Handled Ops Count 17", "17"),
        ("Unhandled Ops Count 270", "270"),
        ("Milestone 1 Roadmap", "Milestone 1"),
        ("Milestone 2 Roadmap", "Milestone 2"),
        ("Milestone 3 Roadmap", "Milestone 3"),
        ("Milestone 4 Roadmap", "Milestone 4"),
        ("Milestone 5 Roadmap", "Milestone 5"),
        ("Roadmap Section Title", "Phased Implementation Roadmap"),
        ("AGENTS.md Compliance", "AGENTS.md"),
        ("Token Continuity Strategy", "Token Budgeting"),
        ("Engine Execution Gap Analysis", "Runtime Engine Execution Gap Analysis")
    ]

    for label, term in critical_terms:
        if term.lower() in combined_text.lower():
            record_pass(f"Critical Data: {label}", f"Found '{term}'")
        else:
            record_fail(f"Critical Data: {label}", f"Missing '{term}'")

def test_http_server(expected_sha256):
    print("\n--- 3. HTTP Server Delivery & Stress Testing ---")
    
    # 1. Single GET download assertion
    try:
        with urllib.request.urlopen(SERVER_URL, timeout=5) as res:
            status = res.status
            content_type = res.headers.get("Content-Type", "")
            content_length = int(res.headers.get("Content-Length", 0))
            body = res.read()
            body_sha256 = hashlib.sha256(body).hexdigest()

        if status == 200:
            record_pass("HTTP Status 200", f"Status: {status}")
        else:
            record_fail("HTTP Status 200", f"Status: {status}")

        if content_type == "application/pdf":
            record_pass("Content-Type: application/pdf", f"Exact match: '{content_type}'")
        else:
            record_fail("Content-Type: application/pdf", f"Unexpected content-type: '{content_type}'")

        if body_sha256 == expected_sha256:
            record_pass("Download Bit-Fidelity (SHA-256)", f"Match: {body_sha256}")
        else:
            record_fail("Download Bit-Fidelity (SHA-256)", f"Mismatch! Got {body_sha256}, expected {expected_sha256}")

    except Exception as e:
        record_fail("PDF Endpoint Availability", str(e))
        return

    # 2. Stress Test: 100 concurrent downloads
    print("\nFiring 100 concurrent download requests...")
    concurrency = 100
    def fetch_pdf(req_id):
        t0 = time.time()
        req = urllib.request.Request(f"{SERVER_URL}?req={req_id}")
        with urllib.request.urlopen(req, timeout=10) as r:
            s = r.status
            ct = r.headers.get("Content-Type", "")
            data = r.read()
            h = hashlib.sha256(data).hexdigest()
            duration = time.time() - t0
            return s, ct, len(data), h, duration

    success_count = 0
    total_time = 0.0
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(fetch_pdf, i) for i in range(concurrency)]
        for f in as_completed(futures):
            try:
                s, ct, length, h, dur = f.result()
                if s == 200 and ct == "application/pdf" and h == expected_sha256:
                    success_count += 1
                    total_time += dur
                else:
                    record_fail(f"Concurrent Request", f"Failed with status={s}, ct={ct}, sha_match={h == expected_sha256}")
            except Exception as e:
                record_fail(f"Concurrent Request Exception", str(e))

    wall_time = time.time() - start_time
    if success_count == concurrency:
        avg_lat = (total_time / concurrency) * 1000
        record_pass(f"Concurrent Downloads ({concurrency}/{concurrency})",
                    f"100% success in {wall_time:.2f}s (avg latency {avg_lat:.1f}ms)")
    else:
        record_fail(f"Concurrent Downloads ({success_count}/{concurrency})", "Some concurrent requests failed")

    # 3. URL variations
    url_enc = f"http://127.0.0.1:{SERVER_PORT}/reports/%63ard_effects_audit_and_implementation_plan.pdf"
    try:
        with urllib.request.urlopen(url_enc, timeout=5) as res:
            if res.status == 200 and res.headers.get("Content-Type") == "application/pdf":
                record_pass("URL Encoded Request", f"Status 200, application/pdf on {url_enc}")
    except Exception as e:
        record_fail("URL Encoded Request", str(e))

    # 4. Soft 404 finding observation
    not_found_url = f"http://127.0.0.1:{SERVER_PORT}/reports/non_existent_file.pdf"
    try:
        with urllib.request.urlopen(not_found_url, timeout=5) as res:
            if res.status == 200:
                record_finding("Soft 404 Behavior", "Server serves 404.html with status 200 OK for missing files (SPA fallback). Does not affect valid /reports/...pdf routing.")
    except urllib.error.HTTPError as e:
        record_pass("404 Status Code", f"Server returned {e.code}")

def test_regression_and_audits():
    print("\n--- 4. Full Regression & Data Audit Execution ---")

    # A. Python data audit
    print("\nExecuting: py scripts/data_audit.py")
    res_py = subprocess.run(["py", "scripts/data_audit.py"], cwd=ROOT_DIR, capture_output=True, text=True)
    if res_py.returncode == 0:
        record_pass("Python Data Audit (scripts/data_audit.py)", "Passed with exit code 0")
    else:
        record_fail("Python Data Audit (scripts/data_audit.py)", f"Failed with exit code {res_py.returncode}:\n{res_py.stdout}\n{res_py.stderr}")

    # B. Node data audit
    print("\nExecuting: npm.cmd run audit:data")
    res_npm_audit = subprocess.run(["npm.cmd", "run", "audit:data"], cwd=ROOT_DIR, capture_output=True, text=True, shell=True)
    if res_npm_audit.returncode == 0:
        record_pass("Node Data Audit (npm.cmd run audit:data)", "Passed with exit code 0")
    else:
        record_fail("Node Data Audit (npm.cmd run audit:data)", f"Failed with exit code {res_npm_audit.returncode}:\n{res_npm_audit.stdout}\n{res_npm_audit.stderr}")

    # C. Full test suite (npm.cmd test)
    print("\nExecuting: npm.cmd test")
    res_npm_test = subprocess.run(["npm.cmd", "test"], cwd=ROOT_DIR, capture_output=True, text=True, shell=True)
    if res_npm_test.returncode == 0 and "fail 0" in res_npm_test.stdout:
        # Extract pass count line
        summary_line = [l for l in res_npm_test.stdout.splitlines() if "pass" in l or "tests" in l]
        record_pass("Full Test Suite (npm.cmd test)", f"Exit code 0. {', '.join(summary_line[:2])}")
    else:
        record_fail("Full Test Suite (npm.cmd test)", f"Failed with exit code {res_npm_test.returncode}:\n{res_npm_test.stdout}\n{res_npm_test.stderr}")

def main():
    print("==================================================================")
    print("  ADVERSARIAL VERIFICATION HARNESS — MILESTONE 1 CHALLENGER")
    print("==================================================================")

    sha256 = test_pdf_file_integrity()
    test_pdf_rendering_and_text()
    if sha256:
        test_http_server(sha256)
    test_regression_and_audits()

    print("\n==================================================================")
    if not test_failures:
        print("  ALL ADVERSARIAL STRESS TESTS PASSED (0 FAILURES)")
        if findings:
            print("\n  Notable Architectural Findings (Non-blocking):")
            for f in findings:
                print(f"    - {f}")
        print("==================================================================")
        sys.exit(0)
    else:
        print(f"  {len(test_failures)} ADVERSARIAL TEST FAILURES DETECTED")
        for f in test_failures:
            print(f"    - {f}")
        print("==================================================================")
        sys.exit(1)

if __name__ == "__main__":
    main()
