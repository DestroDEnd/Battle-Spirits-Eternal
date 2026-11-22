import fs from 'fs';
const files = fs.readdirSync('data/ir_shards');
const target = 'BATTLE-SPIRITS-A6513';
for (const file of files) {
  const content = fs.readFileSync(`data/ir_shards/${file}`, 'utf8');
  if (content.includes(target)) {
    console.log(`Found ${target} in ${file}`);
  }
}
