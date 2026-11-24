import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const outFile = path.join(ROOT, 'backups', 'card_database_pre_recovery_20261124', 'pre_deletion_battle_spirits.db');
const writeStream = fs.createWriteStream(outFile);

console.log('Extracting pre-deletion battle_spirits.db cleanly as binary stream...');
const git = spawn('git', ['show', '352b919~1:battle_spirits.db'], { cwd: ROOT });

git.stdout.pipe(writeStream);

git.stderr.on('data', (d) => console.error('git stderr:', d.toString()));

git.on('close', (code) => {
  if (code === 0) {
    console.log('Successfully extracted pre_deletion_battle_spirits.db!');
    // Verify it with sqlite
    import('node:sqlite').then(({ DatabaseSync }) => {
      const db = new DatabaseSync(outFile);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('Tables in pre-deletion db:', tables.map(t => t.name));
      const cardsCount = db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
      console.log('Cards count in pre-deletion cards table:', cardsCount);
      const v2Count = tables.some(t => t.name === 'cards_v2') ? db.prepare('SELECT COUNT(*) as c FROM cards_v2').get().c : 'N/A';
      console.log('Cards count in pre-deletion cards_v2 table:', v2Count);
    });
  } else {
    console.error('git exited with code', code);
  }
});
