with open('wasm_db.js', 'r', encoding='utf-8') as f:
    c = f.read()
import re
print("api matches in wasm_db.js:", re.findall(r'/api/[a-z0-9_-]+', c))
