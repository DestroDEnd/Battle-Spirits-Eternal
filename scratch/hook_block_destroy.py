with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, blocker.currentLevel)) {
        executeAbilityActions(b, blocker, defSide, 'BLOCK', { attacker });
      }
    }
    renderDuelTable();"""

repl1 = """    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, blocker.currentLevel)) {
        executeAbilityActions(b, blocker, defSide, 'BLOCK', { attacker });
      }
    }
    executeUniversalCardEffect(blocker, defSide, 'WHEN_BLOCKS', { attacker });
    renderDuelTable();"""

target2 = """    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, destroyedSpirit.currentLevel)) {
        executeAbilityActions(b, destroyedSpirit, side, 'DESTROYED');
      }
    }
    renderDuelTable();"""

repl2 = """    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, destroyedSpirit.currentLevel)) {
        executeAbilityActions(b, destroyedSpirit, side, 'DESTROYED');
      }
    }
    executeUniversalCardEffect(destroyedSpirit, side, 'WHEN_DESTROYED');
    renderDuelTable();"""

content_norm = content.replace('\r\n', '\n')
if target1 in content_norm and target2 in content_norm:
    content_norm = content_norm.replace(target1, repl1, 1)
    content_norm = content_norm.replace(target2, repl2, 1)
    with open('battle_arena.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(content_norm)
    print("SUCCESS: Added universal hooks to WHEN_BLOCKS and WHEN_DESTROYED")
else:
    print("ERROR: Targets not found")
