import fs from 'fs';
const shard = JSON.parse(fs.readFileSync('data/ir_shards/26RBS02.json', 'utf8'));
const card = shard['26RBS02-X14'];
console.log('Card 26RBS02-X14:', JSON.stringify(card, null, 2));
