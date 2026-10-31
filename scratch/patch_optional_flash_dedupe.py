import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    c = f.read()

def rep(old, new, label, count=1):
    global c
    if old not in c:
        print('MISSING:', label)
        return False
    c = c.replace(old, new, count)
    print('OK:', label)
    return True

# ---------- A. helpers + wrapper for universal engine ----------
helpers = r"""  // ── OPTIONAL ("can" / "may") EFFECT CONFIRMATION POPUP ──
  function isOptionalEffectText(text) {
    return /\b(?:you may|may|optional|choose to)\b|\bcan\b(?!['\u2019]t|not)/i.test(text || '');
  }

  const _optQueue = [];
  let _optBusy = false;

  function _optEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function askOptionalEffect(card, description, onYes, onNo) {
    if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      if (onYes) onYes();
      return;
    }
    _optQueue.push({ card, description, onYes, onNo });
    pumpOptionalQueue();
  }

  function pumpOptionalQueue() {
    if (_optBusy || !_optQueue.length) return;
    _optBusy = true;
    const item = _optQueue.shift();
    const box = document.createElement('div');
    box.className = 'optional-effect-popup';
    box.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:100000;width:min(360px,92vw);background:#111827;border:1px solid #a855f7;border-radius:12px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.65);color:#e5e7eb;font-size:.84rem;line-height:1.35;';
    let desc = String(item.description || '').replace(/\s+/g, ' ').trim();
    if (desc.length > 220) desc = desc.slice(0, 217) + '...';
    box.innerHTML =
      '<div style="font-weight:800;color:#c084fc;margin-bottom:6px;">\u2728 ' + _optEsc(item.card && item.card.name) + '</div>' +
      '<div style="margin-bottom:10px;color:#cbd5e1;">' + _optEsc(desc) + '</div>' +
      '<div style="font-weight:700;margin-bottom:10px;">Activate this effect?</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button data-opt="yes" style="flex:1;padding:7px 0;border-radius:8px;border:none;background:#7c3aed;color:#fff;font-weight:800;cursor:pointer;">Yes</button>' +
      '<button data-opt="no" style="flex:1;padding:7px 0;border-radius:8px;border:1px solid #475569;background:#1f2937;color:#e5e7eb;font-weight:800;cursor:pointer;">No</button>' +
      '</div>';
    const finish = (yes) => {
      if (box.parentNode) box.parentNode.removeChild(box);
      _optBusy = false;
      try {
        if (yes) { if (item.onYes) item.onYes(); }
        else { if (item.onNo) item.onNo(); }
      } catch (e) { console.error(e); }
      pumpOptionalQueue();
    };
    box.querySelector('[data-opt="yes"]').onclick = () => finish(true);
    box.querySelector('[data-opt="no"]').onclick = () => finish(false);
    document.body.appendChild(box);
  }

  // Marks which universal action types the legacy text engine already resolves for this
  // card/trigger so the same effect is never executed twice (e.g. double draw).
  function markLegacyHandled(card, bodyLower) {
    const types = new Set();
    if (/draw\s+(a|an|one|two|three|\d+)\s+cards?/i.test(bodyLower) && !/when this effect depletes/i.test(bodyLower)) types.add('DRAW_CARDS');
    if (/destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+(?:spirit|ultimate)/i.test(bodyLower)) types.add('DESTROY_SPIRIT_DIRECT');
    if (/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(?:spirit|ultimate)/i.test(bodyLower)) types.add('DESTROY_SPIRIT_BP');
    if (/exhaust\s+(an?|one|\d+)?\s*opposing\s+spirit/i.test(bodyLower)) types.add('EXHAUST_ENEMY');
    if (/this spirit can't be blocked|this spirit cannot be blocked|cannot be blocked by opposing|can't be blocked by opposing/i.test(bodyLower)) types.add('CANNOT_BE_BLOCKED');
    if (!types.size) return;
    const prev = (card.__legacyHandled && Date.now() - card.__legacyHandled.ts < 300) ? card.__legacyHandled.types : new Set();
    types.forEach(t => prev.add(t));
    card.__legacyHandled = { types: prev, ts: Date.now() };
  }

  const NO_PROMPT_TYPES = new Set(['SPECIAL_EFFECT', 'IMMUNITY', 'ARMOR', 'HEAVY ARMOR', 'DAMAGE_CAP', 'GRANT_SYMBOL']);
  const NO_PROMPT_TRIGGERS = new Set(['PASSIVE', 'BURST', 'FLASH', 'GRAND_SKILL', 'GRAND_FIELD']);

  function executeUniversalCardEffect(card, side, trigger, context = {}) {
    if (!card) return;
    const cardData = CardEffectsDB[card.name];
    if (!cardData || !cardData.triggers) return;
    const actions = cardData.triggers[trigger];
    if (!actions || !Array.isArray(actions) || !actions.length) return;

    const skip = new Set(context.__skipTypes || []);
    const legacy = card.__legacyHandled;
    card.__legacyHandled = null;
    if (legacy && Date.now() - legacy.ts < 300) legacy.types.forEach(t => skip.add(t));

    const ctx = Object.assign({}, context, { __skipTypes: skip, __declined: new Set() });
    const curLevel = card.currentLevel || 1;
    const isBravedNow = !!(card.isBraved || card.brave || card.braveCard || context.isBraved);

    const promptable = (side === 'player' && !context.__noPrompt && !NO_PROMPT_TRIGGERS.has(trigger) &&
        typeof document !== 'undefined' && document.body)
      ? actions.filter(a => a && a.canva_rules && a.canva_rules.is_optional &&
          !skip.has(a.type) && !NO_PROMPT_TYPES.has(a.type) &&
          !(a.min_level && curLevel < a.min_level) &&
          !((a.is_braved || a.require_braved) && !isBravedNow))
      : [];

    if (!promptable.length) {
      executeUniversalCardEffectCore(card, side, trigger, ctx);
      return;
    }
    const askNext = (i) => {
      if (i >= promptable.length) {
        executeUniversalCardEffectCore(card, side, trigger, ctx);
        return;
      }
      const act = promptable[i];
      askOptionalEffect(card, act.raw_text || act.desc, () => askNext(i + 1), () => { ctx.__declined.add(act); askNext(i + 1); });
    };
    askNext(0);
  }

  function executeUniversalCardEffectCore(card, side, trigger, context = {}) {"""

rep("  function executeUniversalCardEffect(card, side, trigger, context = {}) {", helpers, 'universal wrapper + helpers')

# ---------- B. core skip / declined ----------
rep("""      if (act.min_level && curLevel < act.min_level) continue;
      // Canva Rule: When Braved condition gating""",
"""      if (act.min_level && curLevel < act.min_level) continue;
      if (context.__skipTypes && context.__skipTypes.has(act.type)) continue;
      if (context.__declined && context.__declined.has(act)) continue;
      // Canva Rule: When Braved condition gating""", 'core skip/declined')

# ---------- C. legacy engine: dedupe + prompt ----------
rep("""    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myDeck""",
"""    if (!context.__confirmed) markLegacyHandled(card, bodyLower);
    if (side === 'player' && !context.__confirmed && !context.__noPrompt && isOptionalEffectText(bodyText) &&
        typeof document !== 'undefined' && document.body) {
      askOptionalEffect(card, bodyText.replace(/\\[[^\\]]*\\]|\\([^)]*\\)/g, ' '), () => {
        executeAbilityActions(bodyText, card, side, triggerName, Object.assign({}, context, { __confirmed: true }));
      }, null);
      return;
    }
    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myDeck""", 'legacy dedupe + prompt')

# ---------- D. flash window on opponent attack ----------
rep("""    // Check player blockers
    const playerBlockers = DuelState.player.field.filter(s => !s.isExhausted);

    if (playerBlockers.length > 0) {
      showBlockPrompt(attacker, playerBlockers);""",
"""    // Check player blockers
    const playerBlockers = DuelState.player.field.filter(s => !s.isExhausted);

    // Pause the game so the player can use Flash effects, even with no blockers available.
    if (playerBlockers.length > 0 || playerHasFlashOptions()) {
      showBlockPrompt(attacker, playerBlockers);""", 'flash window')

rep("  function showBlockPrompt(attacker, readyBlockers) {",
"""  function playerHasFlashOptions() {
    try {
      const nexusFlash = (DuelState.player.nexus || []).some(n => canActivateGrandSkill(n, 'player').allowed);
      if (nexusFlash) return true;
      const { total } = getPlayerAvailableCores();
      return DuelState.player.hand.some(c => {
        if (!hasFlashTiming(c)) return false;
        if (!checkCardUsageRestriction(c, 'player').allowed) return false;
        const need = (c.cost || 0) + (c.type === 'Spirit' ? 1 : 0);
        return total >= need;
      });
    } catch (e) {
      return false;
    }
  }

  function showBlockPrompt(attacker, readyBlockers) {""", 'playerHasFlashOptions')

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(c)
print('saved')
