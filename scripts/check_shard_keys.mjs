import fs from 'fs';
const shard = JSON.parse(fs.readFileSync('data/ir_shards/26RCB01.json', 'utf8'));
const card = shard['26RCB01-008'];
console.log('Shard keys:', Object.keys(card));
console.log('card:', JSON.stringify(card, null, 2).slice(0, 500));
