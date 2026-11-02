import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8', errors='ignore') as fp:
    for idx, line in enumerate(fp):
        if any(term in line for term in ['browse', 'deck', 'arena', 'family', 'sets']):
            if any(action in line for action in ['href', 'onclick', 'location']):
                print(f"{idx+1}: {line.strip()}")
