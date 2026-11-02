import glob, re, sys
sys.stdout.reconfigure(encoding='utf-8')

patterns = [r"['\"]/deck\b", r"['\"]/arena\b", r"['\"]/family\b", r"['\"]/sets\b"]

for f in glob.glob('*.js') + glob.glob('*.html'):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        for idx, line in enumerate(fp):
            for pat in patterns:
                if re.search(pat, line):
                    print(f"{f}:{idx+1}: {line.strip()}")
