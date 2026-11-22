import { compileCard } from '../compiler/index.js';
import { getDetailedCardMap } from '../tests/helpers/card_e2e_framework.mjs';

const detMap = getDetailedCardMap();
const cardA6513 = detMap.get('BATTLE-SPIRITS-A6513');
console.log('A6513 text:', cardA6513?.effect);
const compiled = compileCard(cardA6513);
console.log('Compiled abilities:', JSON.stringify(compiled?.abilities, null, 2));
