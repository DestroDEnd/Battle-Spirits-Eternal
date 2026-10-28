import pdfplumber
import sys
import os

pdf_path = os.path.join(os.path.dirname(__file__), "..", "..", "nlp", "paper", "Convolutional Neural Networks for Sentence Classification.pdf")
out_path = os.path.join(os.path.dirname(__file__), "nlp_paper_content.txt")

with pdfplumber.open(pdf_path) as pdf:
    with open(out_path, 'w', encoding='utf-8') as out:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                out.write(f"=== PAGE {i+1} ===\n")
                out.write(text + "\n\n")

print("Done! Written to nlp_paper_content.txt")
