import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

target_rule_5_inner = """          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[DESTRUCTION: ${card.name}]**: Destroyed opposing "${dest.name}" (Cost ${dest.cost}, ${dest.currentBp} BP)! Cores returned to enemy reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed "${dest.name}"!`, 'success');
        }
      }
    }"""

repl_rule_5_inner = """          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[DESTRUCTION: ${card.name}]**: Destroyed opposing "${dest.name}" (Cost ${dest.cost}, ${dest.currentBp} BP)! Cores returned to enemy reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed "${dest.name}"!`, 'success');

          // Alexander / Cost-based deck mill
          if (/discard a number of cards from the opposing decktop equal to the cost/i.test(bodyLower) || card.name.includes('Alexander')) {
            const destCost = dest.cost !== undefined ? dest.cost : 1;
            let milled = 0;
            const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
            for (let m = 0; m < destCost; m++) {
              const c = enemyDeck.shift();
              if (c) {
                sendToTrash(c, enemySide, `Milled by ${card.name} equal to destroyed cost (${destCost})`);
                milled++;
              }
            }
            if (milled > 0) {
              addLog(`🌊 **[ALEXANDER CRUSH: ${card.name}]**: Discarded ${milled} card(s) from enemy decktop equal to destroyed spirit's cost!`, 'kill');
            }
          }
        }
      }
    }"""

if target_rule_5_inner in text:
    text = text.replace(target_rule_5_inner, repl_rule_5_inner, 1)
    with open('battle_arena.js', 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    print("Successfully integrated Alexander cost-based mill into Rule 5!")
else:
    print("target_rule_5_inner not found!")
