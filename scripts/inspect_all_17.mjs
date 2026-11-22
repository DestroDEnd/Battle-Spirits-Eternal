import fs from 'fs';

const failures = [
  { test: '036', shard: '26RBS02.json', key: '26RBS02-X14', ab: 0, op: 'BOUNCE' },
  { test: '048', shard: '26RCB01.json', key: '26RCB01-008', ab: 0, op: 'BOUNCE' },
  { test: '049', shard: '26RCB01.json', key: '26RCB01-011', ab: 1, op: 'BOUNCE' },
  { test: '050', shard: '26RCB01.json', key: '26RCB01-052', ab: 0, op: 'BOUNCE' },
  { test: '052', shard: '26RCB01.json', key: '26RCB01-049', ab: 1, op: 'BOUNCE' },
  { test: '053', shard: '26RCB01.json', key: '26RCB01-021', ab: 1, op: 'BOUNCE' },
  { test: '054', shard: '26RCB01.json', key: '26RCB01-019', ab: 0, op: 'BOUNCE' },
  { test: '055', shard: '26RCB01.json', key: '26RCB01-048', ab: 1, op: 'BOUNCE' },
  { test: '057', shard: '26RCB01.json', key: '26RCB01-024', ab: 0, op: 'BOUNCE' },
  { test: '068', shard: '26RSD07.json', key: '26RSD07-007', ab: 0, op: 'BOUNCE' },
  { test: '069', shard: '26RSD07.json', key: '26RSD07-X02', ab: 0, op: 'BOUNCE' },
  { test: '104', shard: 'BATTLE.json', key: 'BATTLE-SPIRITS-A6513', ab: 0, op: 'EXHAUST' },
  { test: '105', shard: 'BATTLE.json', key: 'BATTLE-SPIRITS-A9188', ab: 0, op: 'EXHAUST' },
  { test: '106', shard: 'BATTLE.json', key: 'BATTLE-SPIRITS-A9305', ab: 0, op: 'EXHAUST' },
  { test: '108', shard: 'BATTLE.json', key: 'BATTLE-SPIRITS-A11148', ab: 0, op: 'EXHAUST' },
  { test: '109', shard: 'BATTLE.json', key: 'BATTLE-SPIRITS-A11637', ab: 0, op: 'EXHAUST' },
  { test: '110', shard: 'VER.json', key: 'VER-THANDIA2', ab: 0, op: 'EXHAUST' }
];

for (const item of failures) {
  const shardPath = `data/ir_shards/${item.shard}`;
  if (!fs.existsSync(shardPath)) {
    console.log(`Shard missing: ${shardPath}`);
    continue;
  }
  const shard = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  const card = shard[item.key];
  if (!card) {
    console.log(`Card not found in ${item.shard}: ${item.key}`);
    continue;
  }
  const ab = card.abilities[item.ab];
  console.log(`=== Test ${item.test}: ${item.key} (${card.name}) abIdx=${item.ab} op=${item.op} ===`);
  console.log(`Card Type: ${card.type}, Cost: ${card.cost}`);
  console.log(`Clause rawText: ${ab?.clauses?.[0]?.rawText}`);
  console.log(`Clause op:`, JSON.stringify(ab?.clauses?.[0]?.op, null, 2));
}
