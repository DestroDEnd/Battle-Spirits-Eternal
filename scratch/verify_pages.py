import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("index.html contains id='battleArena':", "id=\"battleArena\"" in content)
print("index.html contains href='/arena':", "href=\"/arena\"" in content)
print("index.html contains href='/arena?duel=quick':", "href=\"/arena?duel=quick\"" in content)

with open('arena.html', 'r', encoding='utf-8') as f:
    arena = f.read()

print("arena.html contains id='battleArena':", "id=\"battleArena\"" in arena)
print("arena.html contains id='battleLobby':", "id=\"battleLobby\"" in arena)
print("arena.html contains id='battleTable':", "id=\"battleTable\"" in arena)
print("arena.html contains id='stepNavigator':", "id=\"stepNavigator\"" in arena)
print("arena.html contains id='burstCenterTurnSlot':", "id=\"burstCenterTurnSlot\"" in arena)
