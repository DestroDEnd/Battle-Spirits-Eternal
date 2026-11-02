with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_block = [
    "  discoverPageCardList(cardName) {\n",
    "    const collected = [];\n",
    "    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';\n",
    "\n",
    "    // 0. Priority: Battle Arena Context (Hand or Field or Burst)\n",
    "    if (typeof DuelState !== 'undefined' && DuelState.inDuel) {\n",
    "      const targetNameLow = (cardName || '').trim().toLowerCase();\n",
    "\n",
    "      // Check Player Hand\n",
    "      const pHand = (DuelState.player && DuelState.player.hand) || [];\n",
    "      if (pHand.some(c => (c.name || '').trim().toLowerCase() === targetNameLow)) {\n",
    "        return pHand.map(c => c.name);\n",
    "      }\n",
    "\n",
    "      // Check Player Field (including underlyingCards stacked under Advent spirits)\n",
    "      const pField = (DuelState.player && DuelState.player.field) || [];\n",
    "      const pFieldList = [];\n",
    "      let foundOnPField = false;\n",
    "      pField.forEach(s => {\n",
    "        if (!s) return;\n",
    "        pFieldList.push(s.name);\n",
    "        if ((s.name || '').trim().toLowerCase() === targetNameLow) foundOnPField = true;\n",
    "        if (s.underlyingCards && s.underlyingCards.length > 0) {\n",
    "          s.underlyingCards.forEach(u => {\n",
    "            if (!u) return;\n",
    "            pFieldList.push(u.name);\n",
    "            if ((u.name || '').trim().toLowerCase() === targetNameLow) foundOnPField = true;\n",
    "          });\n",
    "        }\n",
    "      });\n",
    "      if (foundOnPField && pFieldList.length > 0) {\n",
    "        return pFieldList;\n",
    "      }\n",
    "\n",
    "      // Check Opponent Field (including underlyingCards)\n",
    "      const oppField = (DuelState.opponent && DuelState.opponent.field) || [];\n",
    "      const oppFieldList = [];\n",
    "      let foundOnOppField = false;\n",
    "      oppField.forEach(s => {\n",
    "        if (!s) return;\n",
    "        oppFieldList.push(s.name);\n",
    "        if ((s.name || '').trim().toLowerCase() === targetNameLow) foundOnOppField = true;\n",
    "        if (s.underlyingCards && s.underlyingCards.length > 0) {\n",
    "          s.underlyingCards.forEach(u => {\n",
    "            if (!u) return;\n",
    "            oppFieldList.push(u.name);\n",
    "            if ((u.name || '').trim().toLowerCase() === targetNameLow) foundOnOppField = true;\n",
    "          });\n",
    "        }\n",
    "      });\n",
    "      if (foundOnOppField && oppFieldList.length > 0) {\n",
    "        return oppFieldList;\n",
    "      }\n",
    "    }\n",
    "\n",
    "    // 1. If on Deck Builder page (/deck), prioritize current deck cards\n"
]

idx = None
for i, l in enumerate(lines):
    if 'discoverPageCardList(cardName)' in l:
        idx = i
        break

if idx is not None:
    # replace from idx to idx+4 (the "1. If on Deck Builder...")
    lines = lines[:idx] + new_block + lines[idx+5:]
    with open('app.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('SUCCESSFULLY PATCHED app.js')
else:
    print('COULD NOT FIND IDX')
