import os

routes = [
    ('browse', '../browse.html'),
    ('arena', '../arena.html'),
    ('deck', '../deck.html'),
    ('deck_view', '../deck_view.html'),
    ('family', '../family.html'),
    ('sets', '../sets.html'),
    ('login', '../login.html'),
    ('register', '../register.html')
]

for folder, target in routes:
    os.makedirs(folder, exist_ok=True)
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url={target}">
  <title>Loading...</title>
  <script>
    window.location.replace('{target}' + window.location.search + window.location.hash);
  </script>
</head>
<body style="background:#090d16;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div>Loading...</div>
</body>
</html>
"""
    with open(os.path.join(folder, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Created {folder}/index.html -> {target}")
