import fs from 'fs';
import { getDetailedCardMap } from '../tests/helpers/card_e2e_framework.mjs';

const detMap = getDetailedCardMap();
for (const id of ['26RBS03-076', 'BS01-120', 'BS01-011', 'BS01-017', 'BS03-127', 'BATTLE-SPIRITS-A11148', 'BATTLE-SPIRITS-A5282']) {
  const det = detMap.get(id);
  console.log(`=== ${id} (${det?.name}) ===`);
  console.log('type:', det?.type);
  console.log('effect:', det?.effect);
}
