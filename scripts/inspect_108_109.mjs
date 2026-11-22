import fs from 'fs';
import { getDetailedCardMap } from '../tests/helpers/card_e2e_framework.mjs';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const detMap = getDetailedCardMap();

console.log('A11148 in shard:', JSON.stringify(shard['BATTLE-SPIRITS-A11148'], null, 2));
console.log('A11148 in det:', JSON.stringify(detMap.get('BATTLE-SPIRITS-A11148'), null, 2));

console.log('A11637 in shard:', JSON.stringify(shard['BATTLE-SPIRITS-A11637'], null, 2));
console.log('A11637 in det:', JSON.stringify(detMap.get('BATTLE-SPIRITS-A11637'), null, 2));
