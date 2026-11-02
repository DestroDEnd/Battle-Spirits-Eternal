import glob, re, sys
sys.stdout.reconfigure(encoding='utf-8')

for f in glob.glob('*.html'):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        in_nav = False
        nav_lines = []
        for idx, line in enumerate(fp):
            if '<nav' in line:
                in_nav = True
            if in_nav:
                nav_lines.append(f"{idx+1}: {line.strip()}")
            if '</nav>' in line:
                in_nav = False
                print(f"=== {f} ===")
                print("\n".join(nav_lines))
                nav_lines = []
