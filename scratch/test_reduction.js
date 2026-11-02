// Symbol Cost Reduction Engine Test

function parseSymbolCount(symbolVal) {
  if (symbolVal === undefined || symbolVal === null) return 1;
  const symStr = String(symbolVal).trim();
  if (symStr === '' || symStr === '-' || symStr === '0' || symStr.toLowerCase() === 'none') return 0;
  const px20 = (symStr.match(/20px/g) || []).length;
  const px25 = (symStr.match(/25px/g) || []).length;
  if (px20 + px25 > 0) return px20 + px25;
  if (/^\d+$/.test(symStr)) return parseInt(symStr, 10);
  if (symStr.includes(',') || symStr.includes('/')) {
    const tokens = symStr.split(/[,/]/).map(t => t.trim()).filter(Boolean);
    if (tokens.length > 0) return tokens.length;
  }
  return 1;
}

function parseCardColors(card) {
  if (!card) return ['red'];
  const raw = card.colors || card.color || 'red';
  if (Array.isArray(raw)) return raw.map(c => String(c).toLowerCase().trim());
  const str = String(raw).toLowerCase();
  if (str.includes(',')) return str.split(',').map(s => s.trim()).filter(Boolean);
  if (str.includes('/')) return str.split('/').map(s => s.trim()).filter(Boolean);
  return [str.trim()];
}

function getFriendlySymbols(side, customState = null) {
  const state = customState || (typeof DuelState !== 'undefined' ? DuelState[side] : null);
  if (!state) return { total: 0, byColor: {}, rainbow: 0 };

  const byColor = { red: 0, purple: 0, green: 0, white: 0, yellow: 0, blue: 0 };
  let rainbow = 0;

  // 1. Spirits on field
  const field = state.field || [];
  for (const s of field) {
    let symCount = parseSymbolCount(s.symbol);
    if (s.extraSymbols) symCount += s.extraSymbols;
    if (symCount <= 0) continue;

    const eff = (s.effect || '').toLowerCase();
    const isRainbow = eff.includes('treated as red/purple/green/yellow/blue') ||
                      eff.includes('treated as red/purple/green/white/yellow/blue') ||
                      eff.includes('treated as all colors') ||
                      eff.includes('all-color') ||
                      eff.includes('6 colors');

    if (isRainbow) {
      rainbow += symCount;
    } else {
      const colors = parseCardColors(s);
      for (const col of colors) {
        if (byColor[col] !== undefined) {
          byColor[col] += symCount;
        }
      }
    }

    // Brave attached to spirit
    if (s.brave) {
      const bSymStr = String(s.brave.symbol || '').trim();
      let bCount = 0;
      if (bSymStr === '-' || bSymStr.toLowerCase() === 'none' || bSymStr === '0') {
        bCount = 0;
      } else {
        bCount = parseSymbolCount(s.brave.symbol);
      }

      if (bCount > 0) {
        const bEff = (s.brave.effect || '').toLowerCase();
        const bIsRainbow = bEff.includes('treated as red/purple/green/yellow/blue') ||
                           bEff.includes('treated as red/purple/green/white/yellow/blue') ||
                           bEff.includes('treated as all colors');
        if (bIsRainbow) {
          rainbow += bCount;
        } else {
          const bColors = parseCardColors(s.brave);
          for (const bCol of bColors) {
            if (byColor[bCol] !== undefined) {
              byColor[bCol] += bCount;
            }
          }
        }
      }
    }
  }

  // 2. Nexuses on field
  const nexuses = state.nexus || [];
  for (const n of nexuses) {
    let symCount = parseSymbolCount(n.symbol);
    if (symCount <= 0) continue;

    const nEff = (n.effect || '').toLowerCase();
    const isRainbow = nEff.includes('treated as red/purple/green/yellow/blue') ||
                      nEff.includes('treated as red/purple/green/white/yellow/blue') ||
                      nEff.includes('treated as all colors');

    if (isRainbow) {
      rainbow += symCount;
    } else {
      const colors = parseCardColors(n);
      for (const col of colors) {
        if (byColor[col] !== undefined) {
          byColor[col] += symCount;
        }
      }
    }
  }

  const total = Object.values(byColor).reduce((a, b) => a + b, 0) + rainbow;
  return { total, byColor, rainbow };
}

function calculateSymbolReduction(card, side, customState = null) {
  if (!card) return { reduction: 0, effectiveCost: 0, baseCost: 0, minCost: 0, maxReduction: 0 };
  const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
  if (baseCost <= 1) {
    return { reduction: 0, effectiveCost: baseCost, baseCost, minCost: baseCost, maxReduction: 0 };
  }

  // Official Battle Spirits standard reduction curve:
  let maxReduction = 0;
  let minCost = 1;
  if (baseCost === 2) {
    maxReduction = 1; minCost = 1;
  } else if (baseCost === 3) {
    maxReduction = 2; minCost = 1;
  } else if (baseCost === 4) {
    maxReduction = 2; minCost = 2;
  } else if (baseCost === 5) {
    maxReduction = 3; minCost = 2;
  } else if (baseCost === 6) {
    maxReduction = 3; minCost = 3;
  } else if (baseCost === 7) {
    maxReduction = 4; minCost = 3;
  } else if (baseCost === 8) {
    maxReduction = 4; minCost = 4;
  } else if (baseCost >= 9) {
    maxReduction = Math.min(6, Math.floor(baseCost * 0.55));
    minCost = Math.max(3, baseCost - maxReduction);
  }

  // Effect overrides for reduction
  const eff = (card.effect || '').toLowerCase();
  const redMatch = eff.match(/(?:reduction|軽減)(?:シンボル)?[:\s]+(\d+)/i);
  if (redMatch) {
    maxReduction = Math.min(baseCost - 1, parseInt(redMatch[1], 10));
    minCost = Math.max(1, baseCost - maxReduction);
  }
  if (card.reduction !== undefined && card.reduction !== null && !isNaN(Number(card.reduction))) {
    maxReduction = Math.min(baseCost - 1, Number(card.reduction));
    minCost = Math.max(1, baseCost - maxReduction);
  }

  // Check card colors
  const cardColors = parseCardColors(card);
  const isCardRainbow = eff.includes('reduction symbols of this card') &&
    (eff.includes('treated as red/purple/green/white/yellow/blue') || eff.includes('all colors') || eff.includes('red/purple/green/yellow/blue'));

  const friendly = getFriendlySymbols(side, customState);

  // Calculate matching friendly symbols
  let matchedSymbols = 0;
  if (isCardRainbow) {
    // Any friendly symbol matches
    matchedSymbols = friendly.total;
  } else {
    // Add symbols from card's colors
    let specificSymbols = 0;
    for (const col of cardColors) {
      if (friendly.byColor[col]) {
        specificSymbols += friendly.byColor[col];
      }
    }
    // Plus rainbow symbols
    matchedSymbols = specificSymbols + friendly.rainbow;
  }

  // Reduction is capped by maxReduction and cannot reduce below minCost
  const actualReduction = Math.min(matchedSymbols, maxReduction, Math.max(0, baseCost - minCost));
  const effectiveCost = Math.max(minCost, baseCost - actualReduction);

  return {
    reduction: actualReduction,
    effectiveCost,
    baseCost,
    minCost,
    maxReduction,
    matchedSymbols
  };
}

function getCardEffectiveCost(card, side, customState = null) {
  return calculateSymbolReduction(card, side, customState).effectiveCost;
}

// Test cases
console.log("--- TEST 1: Empty field ---");
const card5 = { name: 'Dragon', color: 'Red', cost: 5 };
console.log('Cost 5 Red with empty field:', calculateSymbolReduction(card5, 'player', { field: [], nexus: [] }));

console.log("--- TEST 2: Friendly Red Spirits on field ---");
const state2 = {
  field: [
    { name: 'Red Spirit 1', color: 'Red', symbol: '20px' },
    { name: 'Red Spirit 2', color: 'Red', symbol: '20px' },
    { name: 'Red Spirit 3 with Brave', color: 'Red', symbol: '20px', brave: { name: 'Red Sword', color: 'Red', symbol: '20px' } }
  ],
  nexus: [
    { name: 'Red Nexus', color: 'Red', symbol: '20px' }
  ]
};
console.log('Friendly symbols:', getFriendlySymbols('player', state2));
console.log('Cost 5 Red with 5 friendly Red symbols (maxReduction 3, minCost 2):', calculateSymbolReduction(card5, 'player', state2));

console.log("--- TEST 3: Different Color field ---");
const state3 = {
  field: [
    { name: 'White Spirit', color: 'White', symbol: '20px' }
  ],
  nexus: []
};
console.log('Cost 5 Red with White field:', calculateSymbolReduction(card5, 'player', state3));

console.log("--- TEST 4: Rainbow Spirit on field ---");
const state4 = {
  field: [
    { name: 'Siegfried-Alex', color: 'Red', symbol: '20px', effect: 'The symbol/reduction symbols of this card/Spirit are also treated as Red/Purple/Green/Yellow/Blue.' }
  ],
  nexus: []
};
console.log('Cost 5 Red with Alex (rainbow):', calculateSymbolReduction(card5, 'player', state4));
console.log('Cost 3 White with Alex (rainbow):', calculateSymbolReduction({ name: 'White Spirit', color: 'White', cost: 3 }, 'player', state4));
