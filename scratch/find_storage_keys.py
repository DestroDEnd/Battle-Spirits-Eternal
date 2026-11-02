import glob, re

keys = set()
for f in glob.glob('*.js') + glob.glob('*.html'):
    txt = open(f, encoding='utf-8', errors='ignore').read()
    # find localStorage.getItem('...'), localStorage.setItem('...', etc.
    matches = re.findall(r'localStorage\s*\.\s*(?:getItem|setItem|removeItem)\s*\(\s*[\'"]([^\'"]+)[\'"]', txt)
    keys.update(matches)
    matches_s = re.findall(r'sessionStorage\s*\.\s*(?:getItem|setItem|removeItem)\s*\(\s*[\'"]([^\'"]+)[\'"]', txt)
    keys.update(matches_s)

print('Found storage keys:')
for k in sorted(keys):
    print('  ', k)
