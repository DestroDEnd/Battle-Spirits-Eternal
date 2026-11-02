import glob, re, sys
sys.stdout.reconfigure(encoding='utf-8')

for f in glob.glob('*.html') + glob.glob('*.js'):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        for idx, line in enumerate(fp):
            # Check href="/" or location.href="/"
            if re.search(r'href\s*=\s*["\']/[^"\']', line) or re.search(r'location\.href\s*=\s*["\']/[^"\']', line):
                print(f"{f}:{idx+1}: {line.strip()}")
