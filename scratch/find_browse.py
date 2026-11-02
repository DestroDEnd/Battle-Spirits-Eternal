import glob, re, sys
sys.stdout.reconfigure(encoding='utf-8')

for f in glob.glob('*.js') + glob.glob('*.html'):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        for idx, line in enumerate(fp):
            if re.search(r'[\'"]/browse', line):
                print(f"{f}:{idx+1}: {line.strip()}")
