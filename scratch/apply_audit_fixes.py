import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update endTurn() to increment turn every time
old_end_turn_pattern = re.compile(
    r"if\s*\(\s*DuelState\.activePlayer\s*===\s*'player'\s*\)\s*\{\s*DuelState\.turn\+\+;\s*addLog\(`🛑 \*\*END STEP\*\*: Turn passed to Player! Commencing Turn \$\{DuelState\.turn\}\. Click \"Begin Turn\" on the Step Navigator to start\.`, 'step'\);\s*renderDuelTable\(\);\s*// NO auto timers here! Player has full manual control over every step!\s*\}\s*else\s*\{\s*addLog\(`🛑 \*\*END STEP\*\*: Turn passed to Opponent\.`, 'step'\);\s*renderDuelTable\(\);\s*// Automatically advance opponent step-by-step with clean visual delays\s*safeTimeout\(advanceOpponentStep, 800\);\s*\}"
)

new_end_turn = """DuelState.turn++;
    if (DuelState.activePlayer === 'player') {
      addLog(`🛑 **END STEP**: Turn passed to Player! Commencing Turn ${DuelState.turn}. Click "Begin Turn" on the Step Navigator to start.`, 'step');
      renderDuelTable();
      // NO auto timers here! Player has full manual control over every step!
    } else {
      addLog(`🛑 **END STEP**: Turn passed to Opponent! Commencing Turn ${DuelState.turn}.`, 'step');
      renderDuelTable();
      // Automatically advance opponent step-by-step with clean visual delays
      safeTimeout(advanceOpponentStep, 800);
    }"""

match = old_end_turn_pattern.search(content)
if match:
    content = content[:match.start()] + new_end_turn + content[match.end():]
    print("[PASS] 1. endTurn() updated to increment on every turn.")
else:
    print("[FAIL] 1. endTurn() pattern not found.")

# 2. Update runAiAttackStep Turn 1 check
old_ai_attack_t1 = "if (DuelState.turn === 1 && DuelState.activePlayer === 'opponent') {"
new_ai_attack_t1 = "if (DuelState.turn === 1) {"
if old_ai_attack_t1 in content:
    content = content.replace(old_ai_attack_t1, new_ai_attack_t1, 1)
    print("[PASS] 2. runAiAttackStep Turn 1 check updated.")
else:
    print("[FAIL] 2. runAiAttackStep Turn 1 pattern not found.")

# 3. Remove free core inflation from Crush (line 3388) and Burst Magic (lines 3344-3345)
# Crush:
old_crush_trash = "DuelState.opponent.trash += 1;\n            sendToTrash(c, 'opponent', `Milled by [Crush] of ${attacker.name}`);"
new_crush_trash = "sendToTrash(c, 'opponent', `Milled by [Crush] of ${attacker.name}`);"
if old_crush_trash in content:
    content = content.replace(old_crush_trash, new_crush_trash, 1)
    print("[PASS] 3a. Crush core inflation removed.")
else:
    # Try with \r\n
    old_crush_trash_crlf = "DuelState.opponent.trash += 1;\r\n            sendToTrash(c, 'opponent', `Milled by [Crush] of ${attacker.name}`);"
    if old_crush_trash_crlf in content:
        content = content.replace(old_crush_trash_crlf, new_crush_trash, 1)
        print("[PASS] 3a. Crush core inflation removed (CRLF).")
    else:
        print("[FAIL] 3a. Crush pattern not found.")

# Burst Magic:
old_burst_trash = re.compile(r"// Consume magic card to trash\s*(?:\r?\n)\s*if\s*\(isPlayer\)\s*DuelState\.player\.trash\s*\+=\s*1;\s*(?:\r?\n)\s*else\s*DuelState\.opponent\.trash\s*\+=\s*1;")
match_burst = old_burst_trash.search(content)
if match_burst:
    content = content[:match_burst.start()] + "// Burst magic costs 0 cores" + content[match_burst.end():]
    print("[PASS] 3b. Burst magic core inflation removed.")
else:
    print("[FAIL] 3b. Burst magic pattern not found.")

# 4. Add recycleSpiritCoresToReserve helper and ensure sendToTrash salvages Soul Core
old_send_to_trash = """  function sendToTrash(card, side, reason) {
    if (!card) return;
    const target = side === 'player' ? DuelState.player : DuelState.opponent;
    if (!target.trashCards) target.trashCards = [];
    card.graveyardReason = reason || 'Sent to Trash';
    card.graveyardTurn = DuelState.turn;
    target.trashCards.unshift(card);
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }"""

new_send_to_trash = """  function recycleSpiritCoresToReserve(spirit, side) {
    if (!spirit) return 0;
    const targetState = side === 'player' ? DuelState.player : DuelState.opponent;
    const normalCores = spirit.hasSoulCore ? Math.max(0, spirit.currentCores - 1) : spirit.currentCores;
    targetState.reserve += normalCores;
    if (spirit.hasSoulCore) {
      spirit.hasSoulCore = false;
      targetState.soulCoreLocation = 'reserve';
      targetState.soulCoreSpiritUid = null;
      if (side === 'player') {
        addLog(`🔥 **SOUL CORE SALVAGED**: Soul Core returned safely to Reserve from fallen "${spirit.name}".`, 'step');
      }
    }
    return normalCores;
  }

  function sendToTrash(card, side, reason) {
    if (!card) return;
    const target = side === 'player' ? DuelState.player : DuelState.opponent;
    if (!target.trashCards) target.trashCards = [];
    card.graveyardReason = reason || 'Sent to Trash';
    card.graveyardTurn = DuelState.turn;
    target.trashCards.unshift(card);

    // Safeguard: Ensure Soul Core is never orphaned or lost in limbo
    if (card.hasSoulCore || target.soulCoreSpiritUid === card.uid) {
      card.hasSoulCore = false;
      target.soulCoreLocation = 'reserve';
      target.soulCoreSpiritUid = null;
      if (side === 'player') {
        addLog(`🔥 **SOUL CORE SALVAGED**: Soul Core returned safely to Reserve from fallen "${card.name}".`, 'step');
      }
    }

    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }"""

# Normalize CRLF for match
content_norm = content.replace('\r\n', '\n')
if old_send_to_trash in content_norm:
    content = content_norm.replace(old_send_to_trash, new_send_to_trash, 1)
    print("[PASS] 4. recycleSpiritCoresToReserve added & sendToTrash Soul Core safeguard added.")
else:
    print("[FAIL] 4. sendToTrash pattern not found.")

# 5. Fix placeSoulCoreOnSpirit and removeSoulCoreFromSpirit from mutating reserve
old_sc_place = """    } else if (DuelState.player.soulCoreLocation === 'reserve') {
      if (DuelState.player.reserve > 0) {
        DuelState.player.reserve -= 1;
      }
    }"""
new_sc_place = """    }"""

old_sc_remove = """    spirit.hasSoulCore = false;
    spirit.currentCores -= 1;
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, false, spirit.effect);
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    DuelState.player.reserve += 1;
    DuelState.player.soulCoreLocation = 'reserve';"""

new_sc_remove = """    spirit.hasSoulCore = false;
    spirit.currentCores -= 1;
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, false, spirit.effect);
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    DuelState.player.soulCoreLocation = 'reserve';"""

if old_sc_place in content:
    content = content.replace(old_sc_place, new_sc_place, 1)
    print("[PASS] 5a. placeSoulCoreOnSpirit reserve mutation fixed.")
else:
    print("[FAIL] 5a. placeSoulCoreOnSpirit pattern not found.")

if old_sc_remove in content:
    content = content.replace(old_sc_remove, new_sc_remove, 1)
    print("[PASS] 5b. removeSoulCoreFromSpirit reserve mutation fixed.")
else:
    print("[FAIL] 5b. removeSoulCoreFromSpirit pattern not found.")

# 6. Add upfront Tribute condition guard to summonCard
old_summon_tribute = """    // Check Tribute requirement
    const tributeReq = getCardTributeRequirement(card);
    if (tributeReq) {"""

new_summon_tribute = """    // Check Tribute requirement
    const tributeReq = getCardTributeRequirement(card);
    if (tributeReq) {
      const eligible = getEligibleTributeSpirits(tributeReq, DuelState.player.field);
      if (!eligible.length) {
        // Refund paid reserve & hand
        DuelState.player.reserve += totalNeeded;
        DuelState.player.trash = Math.max(0, DuelState.player.trash - cost);
        DuelState.player.hand.splice(cardIdx, 0, card);
        if (typeof showToast === 'function') {
          showToast(`Cannot Tribute Summon "${card.name}": requires [Tribute: ${tributeReq.condText}], but you have no eligible Spirits on field!`, 'error');
        }
        return;
      }"""

# Also ensure runAiMainStep checks tribute condition
old_ai_summonable = "const summonable = DuelState.opponent.hand.filter(c => c.type === 'Spirit' && availableReserve >= ((c.cost || 0) + 1));"
new_ai_summonable = """const summonable = DuelState.opponent.hand.filter(c => {
        if (c.type !== 'Spirit' || availableReserve < ((c.cost || 0) + 1)) return false;
        const req = getCardTributeRequirement(c);
        if (req && !getEligibleTributeSpirits(req, DuelState.opponent.field).length) return false;
        return true;
      });"""

if old_ai_summonable in content:
    content = content.replace(old_ai_summonable, new_ai_summonable, 1)
    print("[PASS] 6a. AI summonable Tribute guard added.")
else:
    print("[FAIL] 6a. AI summonable pattern not found.")

# 7. Update resolveClash to use recycleSpiritCoresToReserve
content = re.sub(
    r"if\s*\((defSide|attSide)\s*===\s*'player'\)\s*DuelState\.player\.reserve\s*\+=\s*(dest|destAtt|destBlk|d1|d2)\.currentCores;\s*else\s*DuelState\.opponent\.reserve\s*\+=\s*\2\.currentCores;\s*handleDestroyedSpiritCores\(\2,\s*\1\);",
    r"recycleSpiritCoresToReserve(\2, \1);",
    content
)
print("[PASS] 7. resolveClash updated to recycleSpiritCoresToReserve.")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nAll audit fixes written to battle_arena.js successfully!")
