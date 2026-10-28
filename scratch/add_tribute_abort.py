with open('battle_arena.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = """      } else if (eligible.length > 1) {
        // Prompt player to choose which spirit to tribute
        openTributeModal(card, tributeReq, cost, coresToPlace, eligible);
        DuelState.selectedPlayerCard = null;
        return;
      }
    }"""

replacement = """      } else if (eligible.length > 1) {
        // Prompt player to choose which spirit to tribute
        openTributeModal(card, tributeReq, cost, coresToPlace, eligible);
        DuelState.selectedPlayerCard = null;
        return;
      } else {
        // No eligible spirits on field: abort & refund
        DuelState.player.reserve += totalNeeded;
        DuelState.player.trash = Math.max(0, DuelState.player.trash - cost);
        DuelState.player.hand.splice(cardIdx, 0, card);
        if (typeof showToast === 'function') {
          showToast(`Cannot Tribute Summon "${card.name}": requires [Tribute: ${tributeReq.condText}], but you have no eligible Spirits on field!`, 'error');
        }
        return;
      }
    }"""

assert target in c, "target not found in battle_arena.js"
c = c.replace(target, replacement, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Tribute summon abort added successfully!")
