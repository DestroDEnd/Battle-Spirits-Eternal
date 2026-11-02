import glob, re

for f in glob.glob('*.html') + glob.glob('*.js'):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        c = fp.read()
    matches = re.findall(r'fetch\([\'\"][^\'\"]+[\'\"]\)', c)
    if matches:
        print(f, matches)
