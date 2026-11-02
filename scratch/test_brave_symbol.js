// Test Brave symbol addition in getAttackSymbols

function parseCardSymbols(card) {
  if (!card) return 0;
  const symStr = String(card.symbol || '').trim();
  if (symStr === '-' || symStr === '0' || symStr.toLowerCase() === 'none') return 0;
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

function getAttackSymbols(spirit, attackingSide = null) {
  if (!spirit) return 1;

  // 1. Base symbols from card symbol property
  let base = parseCardSymbols(spirit);
  if (base === 0 && (!spirit.symbol || spirit.symbol === '')) {
    base = 1;
  }

  let total = base + (spirit.extraSymbols || 0);

  // 1b. Brave symbols addition: if spirit.brave, add brave's symbol count
  if (spirit.brave) {
    const braveSymbols = parseCardSymbols(spirit.brave);
    total += braveSymbols;
  }

  return Math.max(1, total);
}

const unbraved = { name: 'Dragon', symbol: '20px' };
console.log('Unbraved symbols:', getAttackSymbols(unbraved)); // should be 1

const bravedWith1 = {
  name: 'Dragon',
  symbol: '20px',
  brave: { name: 'Flaming Sword', symbol: '20px' }
};
console.log('Braved with 1-symbol brave:', getAttackSymbols(bravedWith1)); // should be 2!

const bravedWith0 = {
  name: 'Dragon',
  symbol: '20px',
  brave: { name: 'Symbolless Brave', symbol: '-' }
};
console.log('Braved with 0-symbol brave:', getAttackSymbols(bravedWith0)); // should be 1!

const bravedDouble = {
  name: 'Double Symbol Dragon',
  symbol: '20px20px',
  brave: { name: 'Flaming Sword', symbol: '20px' }
};
console.log('Braved double-symbol spirit:', getAttackSymbols(bravedDouble)); // should be 3!
