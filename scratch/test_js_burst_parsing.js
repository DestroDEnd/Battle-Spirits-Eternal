const fs = require('fs');
const path = require('path');

function parseBurstCondition(effect) {
  if (!effect) return { type: 'NONE', label: 'None', raw: '' };

  const m = effect.match(/\[Burst:\s*([^\]]+)\](?:\s*\(([^)]+)\))?/i);
  let raw = '';
  if (m) {
    const p1 = m[1].trim();
    const p2 = m[2] ? m[2].trim() : '';
    raw = (p1.length > 2) ? p1 : (p2 || p1);
  } else {
    const jm = effect.match(/【バースト[：:]([^】]+)】/);
    if (jm) raw = jm[1].trim();
  }

  const rawLower = raw.toLowerCase();
  const effLower = effect.toLowerCase();

  // 1. AFTER_LIFE_DECREASED
  if (
    rawLower.includes('life is reduced') ||
    rawLower.includes('life is decreased') ||
    rawLower.includes('life is reeduced') ||
    rawLower.includes('ライフ減少後') ||
    effLower.includes('自分のライフ減少後') ||
    /\[burst:[^\]]*\]\s*\(?[^)]*life is reduced/i.test(effLower)
  ) {
    return {
      type: 'AFTER_LIFE_DECREASED',
      label: 'After your Life is reduced',
      raw
    };
  }

  // 2. AFTER_OPPONENT_SUMMON_EFFECT
  if (
    rawLower.includes('when summoned') ||
    rawLower.includes('summoned/advents') ||
    rawLower.includes('summoned/deployed') ||
    rawLower.includes('summoned/reborn') ||
    rawLower.includes('summoned/advent') ||
    rawLower.includes('summoned by an opposing effect') ||
    rawLower.includes('summoned via an opposing effect') ||
    rawLower.includes('召喚時') ||
    rawLower.includes('煌臨時') ||
    rawLower.includes('配置時') ||
    /\[burst:[^\]]*\]\s*\(?[^)]*(?:when summoned|召喚時|煌臨時|配置時)/i.test(effLower)
  ) {
    return {
      type: 'AFTER_OPPONENT_SUMMON_EFFECT',
      label: "After an opposing Spirit's (When Summoned) effect resolves",
      raw
    };
  }

  // 3. AFTER_OPPONENT_ATTACKS
  if (
    ((rawLower.includes('attack') || rawLower.includes('attacks')) && (rawLower.includes('opposing') || rawLower.includes('opponent'))) ||
    rawLower.includes('相手のアタック後') ||
    rawLower.includes('相手のスピリットのアタック後') ||
    rawLower.includes('アタック後') ||
    /\[burst:[^\]]*\]\s*\(?[^)]*opposing (?:spirit|ultimate).*attacks/i.test(effLower)
  ) {
    return {
      type: 'AFTER_OPPONENT_ATTACKS',
      label: 'After an opposing Spirit attacks',
      raw
    };
  }

  // 4. AFTER_YOUR_SPIRIT_DESTROYED
  if (
    rawLower.includes('destroyed by the opponent') ||
    rawLower.includes('destroyed by the oopponent') ||
    rawLower.includes('depleted/destroyed') ||
    rawLower.includes('left the field') ||
    rawLower.includes('leaves the field') ||
    rawLower.includes('破壊後') ||
    rawLower.includes('消滅/破壊後') ||
    rawLower.includes('フィールドを離れた後') ||
    /\[burst:[^\]]*\]\s*\(?[^)]*(?:destroyed by the opponent|depleted\/destroyed|left the field)/i.test(effLower)
  ) {
    return {
      type: 'AFTER_YOUR_SPIRIT_DESTROYED',
      label: 'After your Spirit is depleted/destroyed by the Opponent',
      raw
    };
  }

  // 5. AFTER_OPPONENT_HAND_INCREASED
  if (
    rawLower.includes('hand increase') ||
    rawLower.includes('hand increases') ||
    rawLower.includes('hand increased') ||
    rawLower.includes('increases the opposing hand') ||
    rawLower.includes('手札が増加後') ||
    rawLower.includes('手札増加後') ||
    rawLower.includes('手札が増えた後') ||
    /\[burst:[^\]]*\]\s*\(?[^)]*opposing hand increases/i.test(effLower)
  ) {
    return {
      type: 'AFTER_OPPONENT_HAND_INCREASED',
      label: 'After the opposing Hand increases via an opposing effect',
      raw
    };
  }

  // Fallback for generic or unusual burst triggers
  return {
    type: 'GENERIC_BURST',
    label: raw || 'Special Burst Condition',
    raw
  };
}

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'burst_cards.json'), 'utf8'));

const counts = {};
cards.forEach(r => {
  const res = parseBurstCondition(r.effect);
  counts[res.type] = (counts[res.type] || 0) + 1;
});

console.log(`Parsed ${cards.length} cards with Burst in JS:`);
for (const [t, c] of Object.entries(counts)) {
  console.log(`  ${t}: ${c}`);
}

// Check Enchante
const enchante = cards.find(r => r.name.includes('Enchante') || r.name.includes('アンシャンテ'));
if (enchante) {
  console.log('\nEnchante found in DB:');
  console.log('Name:', enchante.name);
  console.log('Parsed burst:', parseBurstCondition(enchante.effect));
} else {
  console.log('\nTesting exact card text of The MakaiSwordDeityDoll †Enchante† from user screenshot:');
  const screenshotText = `(Once per Game: Same Name) When your Life is reduced to three or less, and you have four counters or more, you can immediately activate the following Burst of this card from your Trash.

[BURST: AFTER AN OPPOSING SPIRIT'S (WHEN SUMMONED/ADVENTS) EFFECT RESOLVES]
Summon this card without paying the cost. Then, during this turn, increase the LV cost of two opposing Spirits/Ultimates by +2.

[LV1][LV2][LV3] (When Summoned/Attacks)
You can send up to two cores from one opposing Spirit/Ultimate to the Reserve. When this effect depletes, draw two cards.`;

  const parsed = parseBurstCondition(screenshotText);
  console.log('Parsed screenshot card:', parsed);
}
