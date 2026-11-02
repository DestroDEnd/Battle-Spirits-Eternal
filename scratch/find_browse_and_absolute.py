import glob, re

for f in glob.glob('*.html') + glob.glob('*.js'):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        c = fp.read()
    matches = re.findall(r'href=["\'](/[^"\']*)["\']', c)
    if matches:
        print(f, "Absolute hrefs:", matches)
    nav_matches = re.findall(r'href=["\'][^"\']*browse[^"\']*["\']', c)
    if nav_matches:
        print(f, "Browse hrefs:", nav_matches)
