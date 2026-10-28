with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

bad = """    } else {
      blockerHtml += `
        const attSymbols = getAttackSymbols(attacker, 'opponent');
      if (attSymbols > 1) {
        blockerHtml = `
          <div style="padding:0.5rem; background:rgba(239,68,68,0.2); border:1px solid #ef4444; border-radius:0.4rem; color:#fca5a5; font-size:0.8rem; font-weight:800; text-align:center; margin-bottom:0.6rem;">
            ⚡ [MULTI-SYMBOL THREAT]: "${attacker.name}" attacks with ${attSymbols} Symbols! Passing will inflict ${attSymbols} Life Damage!
          </div>
        ` + blockerHtml;
      }
      blockerHtml += `
        <button class="btn-pass-block" onclick="BattleArena.takeLifeDamage('${attacker.uid}')">💥 Take ${attSymbols} Life Damage (${attSymbols} Symbol${attSymbols > 1 ? 's' : ''})</button>
      `;
      `;
    }"""

good = """    } else {
      const attSymbols = getAttackSymbols(attacker, 'opponent');
      if (attSymbols > 1) {
        blockerHtml = `
          <div style="padding:0.5rem; background:rgba(239,68,68,0.2); border:1px solid #ef4444; border-radius:0.4rem; color:#fca5a5; font-size:0.8rem; font-weight:800; text-align:center; margin-bottom:0.6rem;">
            ⚡ [MULTI-SYMBOL THREAT]: "${attacker.name}" attacks with ${attSymbols} Symbols! Passing will inflict ${attSymbols} Life Damage!
          </div>
        ` + blockerHtml;
      }
      blockerHtml += `
        <button class="btn-pass-block" onclick="BattleArena.takeLifeDamage('${attacker.uid}')">💥 Take ${attSymbols} Life Damage (${attSymbols} Symbol${attSymbols > 1 ? 's' : ''})</button>
      `;
    }"""

# Normalize newlines
bad_norm = bad.replace('\r\n', '\n')
good_norm = good.replace('\r\n', '\n')
text_norm = text.replace('\r\n', '\n')

if bad_norm in text_norm:
    text_norm = text_norm.replace(bad_norm, good_norm, 1)
    with open('battle_arena.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text_norm)
    print("Replaced successfully!")
else:
    print("Not found in text_norm")
