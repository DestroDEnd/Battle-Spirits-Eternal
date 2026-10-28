import pdfplumber
import sys

pdf_path = r"C:\Users\namis\OneDrive\Documents\nlp\paper\Convolutional Neural Networks for Sentence Classification.pdf"
out_path = r"C:\Users\namis\OneDrive\Documents\BSP\scratch\nlp_paper_content.txt"

with pdfplumber.open(pdf_path) as pdf:
    with open(out_path, 'w', encoding='utf-8') as out:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                out.write(f"=== PAGE {i+1} ===\n")
                out.write(text + "\n\n")

print("Done! Written to nlp_paper_content.txt")
