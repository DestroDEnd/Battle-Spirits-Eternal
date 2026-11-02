import re, json

with open('scratch/canva_design.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find script tags containing the bootstrap data
for i, s in enumerate(re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL)):
    if 'Manual of Effect Wordings' in s:
        print(f"Found in script {i}, length: {len(s)}")
        with open('scratch/canva_script.js', 'w', encoding='utf-8') as sf:
            sf.write(s)
        break
