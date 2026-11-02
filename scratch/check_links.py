import re, glob

html_files = glob.glob('*.html')
for fn in html_files:
    with open(fn, 'r', encoding='utf-8') as f:
        c = f.read()
    
    # Check leading slash links
    matches = re.findall(r'(?:href|src)=["\'](/[^"\']*)["\']', c)
    print(f"{fn}: {len(matches)} absolute root links (e.g. {matches[:3]})")
