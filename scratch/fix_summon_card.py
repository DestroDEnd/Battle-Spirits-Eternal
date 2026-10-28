with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  function summonCard(uid, customCoresToPlace) {
    if (DuelState.activePlayer !== 'player') {
      showToast("Cannot summon during opponent's turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Spirits can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      showToast(`Official Rule: Normal Spirits cannot be summoned during the Attack Step! "${card.name}" does not have [Flash] timing.`, 'warning');
      return;
    }

    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];"""

replacement = """  function summonCard(uid, customCoresToPlace) {
    if (DuelState.activePlayer !== 'player') {
      showToast("Cannot summon during opponent's turn!", 'warning');
      return;
    }
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Spirits can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      showToast(`Official Rule: Normal Spirits cannot be summoned during the Attack Step! "${card.name}" does not have [Flash] timing.`, 'warning');
      return;
    }"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Fixed summonCard card declaration")
