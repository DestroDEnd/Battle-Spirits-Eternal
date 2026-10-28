with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = "    recalculateSpiritBp,\n    endOfBattleBpReset,\n    getWhenBlocksBpBoost\n};"

replacement = """    recalculateSpiritBp,
    endOfBattleBpReset,
    getWhenBlocksBpBoost,
    deployNexus,
    addCoreToNexus,
    removeCoreFromNexus,
    executeWhenDeployedEffects,
    viewBoardAsIs,
    reopenResultModal,
    executeUniversalCardEffect,
    CardEffectsDB,
    loadCardEffectsDB,
    safeEndOpponentTurn
};"""

code_norm = code.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
if target_norm in code_norm:
    code_norm = code_norm.replace(target_norm, replacement)
    code = code_norm.replace('\n', '\r\n')
    print("Replaced via normalization!")
else:
    print("Target still not found!")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)
