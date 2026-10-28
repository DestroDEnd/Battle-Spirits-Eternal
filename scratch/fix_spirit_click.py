with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """      } else {
        openCardDetail(spirit.name);
      }
    } else if (side === 'opponent') {
      const spirit = DuelState.opponent.field.find(s => s.uid === uid);
      if (spirit) {
        openCardDetail(spirit.name);
      }
    }"""

replacement = """      } else {
        DuelState.selectedPlayerCard = spirit;
        renderCardInspector();
        openCardDetail(spirit.name);
      }
    } else if (side === 'opponent') {
      const spirit = DuelState.opponent.field.find(s => s.uid === uid);
      if (spirit) {
        DuelState.selectedPlayerCard = spirit;
        renderCardInspector();
        openCardDetail(spirit.name);
      }
    }"""

assert target in code, "target not found"
code = code.replace(target, replacement, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("[OK] Updated handleSpiritClick selectedPlayerCard tracking")
