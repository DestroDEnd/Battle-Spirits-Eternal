import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

firebase_block = """  <!-- Firebase Client SDK (Compat CDN for GitHub Pages) -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics-compat.js"></script>
  <script src="./firebase_service.js?v=1.1"></script>
"""

target_files = ['browse.html', 'family.html', 'sets.html', 'deck_view.html', 'login.html', 'register.html']

for fname in target_files:
    if not os.path.exists(fname): continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'firebase_service.js' in content:
        print(f"{fname}: already has firebase_service.js")
        continue
    # Insert right before <script src="./app.js
    pattern = r'(\s*<script src="(?:\./)?app\.js)'
    if re.search(pattern, content):
        content = re.sub(pattern, "\n" + firebase_block + r'\1', content, count=1)
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"{fname}: successfully injected Firebase scripts!")
    else:
        print(f"{fname}: pattern not found!")
