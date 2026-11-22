import fs from 'fs';
const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const cards = [
  { key: 'BATTLE-SPIRITS-A6513', ab: 0 },
  { key: 'BATTLE-SPIRITS-A9188', ab: 1 },
  { key: 'BATTLE-SPIRITS-A9305', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11148', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11637', ab: 1 },
  { key: 'VER-THANDIA2', ab: 0 }
];

for (const c of cards) {
  const card = shard[c.key];
  const ab = card?.abilities?.[c.ab];
  console.log(`=== Card: ${c.key} (${card?.name}) abIdx: ${c.ab} ===`);
  console.log('Clause rawText:', ab?.clauses?.[0]?.rawText);
  console.log('Clause op:', JSON.stringify(ab?.clauses?.[0]?.op, null, 2));
}
