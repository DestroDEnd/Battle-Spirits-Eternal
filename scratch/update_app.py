with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """// ═══════════════════ CARD DETAIL MODAL ═══════════════════
async function openCardDetail(name) {
  const modal = document.getElementById('cardModal');
  if (!modal) return;
  modal.classList.add('open');
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalJpName').textContent = '';
  document.getElementById('modalArt').src = FALLBACK_CARD_ART;
  document.getElementById('modalBadges').innerHTML = '';
  document.getElementById('modalLevels').textContent = '';
  document.getElementById('modalEffect').textContent = '';
  document.getElementById('modalFlavor').style.display = 'none';
  document.getElementById('modalSets').innerHTML = '';

  try {
    const res = await fetch('/api/card?name=' + encodeURIComponent(name));
    const card = await res.json();
    if (card.error) {
      document.getElementById('modalEffect').textContent = card.error;
      return;
    }
    S.currentCard = card;

    document.getElementById('modalTitle').textContent = card.name;
    document.getElementById('modalJpName').textContent = card.kanji || card.jpname || '';
    document.getElementById('modalArt').src = card.image_url || '';
    document.getElementById('modalDownload').href = '/api/download-art?name=' + encodeURIComponent(card.name);
    const wikiHref = 'https://battle-spirits.fandom.com/wiki/' + encodeURIComponent((card.name || '').replace(/ /g, '_'));
    document.getElementById('modalWikiLink').href = wikiHref;
    document.getElementById('modalWikiLinkBottom').href = wikiHref;

    const bb = document.getElementById('modalBadges');
    bb.innerHTML = '';
    if (card.card_number) bb.innerHTML += `<span class="badge badge-number"># ${esc(card.card_number)}</span>`;
    if (card.cost !== null && card.cost !== undefined) bb.innerHTML += `<span class="badge badge-cost">Cost ${esc(card.cost)}</span>`;
    const colors = card.colors || (card.color ? [card.color] : []);
    colors.forEach(c => bb.innerHTML += `<span class="badge badge-color-${esc(c)} badge-color">${esc(c)}</span>`);
    if (card.type) bb.innerHTML += `<span class="badge badge-type">${esc(card.type)}</span>`;
    if (card.rarity) bb.innerHTML += `<span class="badge badge-rarity">${esc(card.rarity)}</span>`;
    const families = card.families || (card.family ? [card.family] : []);
    families.forEach(f => bb.innerHTML += `<a class="badge badge-family" href="/browse?family=${encodeURIComponent(f)}" style="cursor:pointer;text-decoration:none;" title="Explore ${esc(f)} family">${esc(f)} ↗</a>`);

    document.getElementById('modalLevels').textContent = card.levels || 'No level data.';
    document.getElementById('modalEffect').textContent = card.effect || card.summary || 'No effect text.';

    if (card.flavor) {
      const fl = document.getElementById('modalFlavor');
      fl.textContent = '"' + card.flavor + '"';
      fl.style.display = 'block';
    }

    const setsEl = document.getElementById('modalSets');
    const sets = card.sets || [];
    if (sets.length) {
      setsEl.innerHTML = sets.map(s => `<a class="badge badge-set" href="/browse?set=${encodeURIComponent(s)}" style="cursor:pointer;text-decoration:none;" title="Explore set ${esc(s)}">${esc(s)} ↗</a>`).join('');
    } else {
      setsEl.innerHTML = '<span style="color:var(--muted);font-size:0.82rem;">No set data available.</span>';
    }
  } catch (err) {
    document.getElementById('modalEffect').textContent = 'Failed to load card details.';
  }
}"""

replacement = """// ═══════════════════ CARD DETAIL MODAL ═══════════════════
function formatEffectKeywordsInModal(text) {
  if (!text) return '<span style=\"color:var(--muted);font-style:italic;\">No special effects or abilities.</span>';
  let safe = esc(text);
  safe = safe.replace(/\\[(Clash|Curse|Crush|Armor:[^\\]]+|Burst:[^\\]]+|Flash|When Attacks|When Destroyed|When Summoned)\\]/gi, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('clash')) cls = 'kw-clash';
    else if (low.includes('curse')) cls = 'kw-curse';
    else if (low.includes('crush')) cls = 'kw-crush';
    else if (low.includes('burst')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    return `<span class=\"effect-keyword-pill ${cls}\">${match}</span>`;
  });
  return safe.replace(/\\n/g, '<br>');
}

async function openCardDetail(name) {
  const modal = document.getElementById('cardModal');
  if (!modal) return;
  modal.classList.add('open');
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalJpName').textContent = '';
  document.getElementById('modalArt').src = FALLBACK_CARD_ART;
  document.getElementById('modalBadges').innerHTML = '';
  document.getElementById('modalLevels').textContent = '';
  document.getElementById('modalEffect').innerHTML = '';
  document.getElementById('modalFlavor').style.display = 'none';
  document.getElementById('modalSets').innerHTML = '';

  // Setup Duel Action Button vs Deck Builder Button
  const duelBtn = document.getElementById('modalDuelSummonBtn');
  const deckBtn = document.getElementById('modalDeckBtn');
  const isInDuel = typeof DuelState !== 'undefined' && DuelState.inDuel;

  if (isInDuel) {
    if (deckBtn) deckBtn.style.display = 'none';
    if (duelBtn) {
      duelBtn.style.display = 'block';
      const handCard = (DuelState.player.hand || []).find(c => (c.name || '').toLowerCase() === (name || '').toLowerCase());
      if (handCard) {
        const isSpirit = handCard.type === 'Spirit';
        const isMagic = handCard.type === 'Magic';
        const cost = handCard.cost || 0;
        const totalNeeded = isSpirit ? cost + 1 : cost;
        const isPlayerTurn = DuelState.activePlayer === 'player';
        const phase = DuelState.phases[DuelState.phaseIndex];
        const canPlay = isPlayerTurn && (phase === 'MAIN' || phase === 'ATTACK');
        const avail = (typeof BattleArena !== 'undefined' && BattleArena.getPlayerAvailableCores) 
          ? BattleArena.getPlayerAvailableCores() 
          : { reserve: DuelState.player.reserve, total: DuelState.player.reserve };

        if (canPlay && (avail.reserve >= totalNeeded)) {
          duelBtn.textContent = isSpirit ? `⚡ Summon in Duel (Cost ${cost})` : `✨ Cast Magic (Cost ${cost})`;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = isSpirit ? '#10b981' : '#8b5cf6';
          duelBtn.onclick = () => {
            closeModal();
            if (isSpirit) BattleArena.summonCard(handCard.uid);
            else BattleArena.castMagic(handCard.uid);
          };
        } else if (canPlay && (avail.total >= totalNeeded)) {
          duelBtn.textContent = `💀 Sacrifice & Summon (${cost})`;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = '#ea580c';
          duelBtn.onclick = () => {
            closeModal();
            BattleArena.openSacrificeModal(handCard.uid);
          };
        } else {
          duelBtn.textContent = `⚠️ Need ${totalNeeded} Cores`;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;
        }
      } else {
        duelBtn.textContent = '⚔️ Active on Battlefield';
        duelBtn.disabled = true;
        duelBtn.style.opacity = '0.6';
        duelBtn.style.background = '#3b82f6';
        duelBtn.onclick = null;
      }
    }
  } else {
    if (deckBtn) deckBtn.style.display = 'block';
    if (duelBtn) duelBtn.style.display = 'none';
  }

  // Pre-fill immediately if already in duel memory to eliminate latency/flicker
  if (isInDuel) {
    const allCards = [
      ...(DuelState.player.hand || []),
      ...(DuelState.player.field || []),
      ...(DuelState.opponent.field || [])
    ];
    const memCard = allCards.find(c => (c.name || '').toLowerCase() === (name || '').toLowerCase());
    if (memCard) {
      if (memCard.image_url) document.getElementById('modalArt').src = memCard.image_url;
      if (memCard.kanji) document.getElementById('modalJpName').textContent = memCard.kanji;
      if (memCard.raw_levels) {
        document.getElementById('modalLevels').textContent = memCard.raw_levels;
      } else if (memCard.levels && Array.isArray(memCard.levels)) {
        document.getElementById('modalLevels').textContent = memCard.levels.map(l => `Level ${l.level}: ${l.cores} core, ${l.bp} BP`).join('\\n');
      }
      if (memCard.effect) document.getElementById('modalEffect').innerHTML = formatEffectKeywordsInModal(memCard.effect);
      if (memCard.flavor) {
        const fl = document.getElementById('modalFlavor');
        fl.textContent = '"' + memCard.flavor + '"';
        fl.style.display = 'block';
      }
    }
  }

  try {
    const res = await fetch('/api/card?name=' + encodeURIComponent(name));
    const card = await res.json();
    if (card.error) {
      document.getElementById('modalEffect').textContent = card.error;
      return;
    }
    S.currentCard = card;

    document.getElementById('modalTitle').textContent = card.name;
    document.getElementById('modalJpName').textContent = card.kanji || card.jpname || '';
    document.getElementById('modalArt').src = card.image_url || '';
    document.getElementById('modalDownload').href = '/api/download-art?name=' + encodeURIComponent(card.name);
    const wikiHref = 'https://battle-spirits.fandom.com/wiki/' + encodeURIComponent((card.name || '').replace(/ /g, '_'));
    document.getElementById('modalWikiLink').href = wikiHref;
    document.getElementById('modalWikiLinkBottom').href = wikiHref;

    const bb = document.getElementById('modalBadges');
    bb.innerHTML = '';
    if (card.card_number) bb.innerHTML += `<span class=\"badge badge-number\"># ${esc(card.card_number)}</span>`;
    if (card.cost !== null && card.cost !== undefined) bb.innerHTML += `<span class=\"badge badge-cost\">Cost ${esc(card.cost)}</span>`;
    const colors = card.colors || (card.color ? [card.color] : []);
    colors.forEach(c => bb.innerHTML += `<span class=\"badge badge-color-${esc(c)} badge-color\">${esc(c)}</span>`);
    if (card.type) bb.innerHTML += `<span class=\"badge badge-type\">${esc(card.type)}</span>`;
    if (card.rarity) bb.innerHTML += `<span class=\"badge badge-rarity\">${esc(card.rarity)}</span>`;
    const families = card.families || (card.family ? [card.family] : []);
    families.forEach(f => bb.innerHTML += `<a class=\"badge badge-family\" href=\"/browse?family=${encodeURIComponent(f)}\" style=\"cursor:pointer;text-decoration:none;\" title=\"Explore ${esc(f)} family\">${esc(f)} ↗</a>`);

    document.getElementById('modalLevels').textContent = card.levels || 'No level data.';
    document.getElementById('modalEffect').innerHTML = formatEffectKeywordsInModal(card.effect || card.summary || '');

    if (card.flavor) {
      const fl = document.getElementById('modalFlavor');
      fl.textContent = '"' + card.flavor + '"';
      fl.style.display = 'block';
    }

    const setsEl = document.getElementById('modalSets');
    const sets = card.sets || [];
    if (sets.length) {
      setsEl.innerHTML = sets.map(s => `<a class=\"badge badge-set\" href=\"/browse?set=${encodeURIComponent(s)}\" style=\"cursor:pointer;text-decoration:none;\" title=\"Explore set ${esc(s)}\">${esc(s)} ↗</a>`).join('');
    } else {
      setsEl.innerHTML = '<span style=\"color:var(--muted);font-size:0.82rem;\">No set data available.</span>';
    }
  } catch (err) {
    document.getElementById('modalEffect').textContent = 'Failed to load card details.';
  }
}"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm, 'target not found in app.js'
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)
print('Successfully updated app.js')
