with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    selectedPlayerCard: null,
    selectedAttacker: null,
    combatEvent: null, // Active clash info
    pendingTimers: [],
    logs: []
  };"""

replacement = """    selectedPlayerCard: null,
    selectedAttacker: null,
    combatEvent: null, // Active clash info
    pendingTimers: [],
    logs: []
  };
  window.DuelState = DuelState;"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm, 'target not found in battle_arena.js'
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)
print("Successfully exposed window.DuelState")
