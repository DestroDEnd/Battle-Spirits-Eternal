import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('server.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = "            '/deck': 'deck.html',\n            '/deck.html': 'deck.html',"
replacement = "            '/deck': 'deck.html',\n            '/deck.html': 'deck.html',\n            '/deck-view': 'deck_view.html',\n            '/deck-view.html': 'deck_view.html',\n            '/deck/view': 'deck_view.html',"

if target in text:
    text = text.replace(target, replacement, 1)
    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("server.py patched successfully (LF)!")
elif target.replace('\n', '\r\n') in text:
    text = text.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'), 1)
    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("server.py patched successfully (CRLF)!")
else:
    print("target not found!")
