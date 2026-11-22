import fs from 'fs';
const files = fs.readdirSync('engine');
for (const f of files) {
  if (f.endsWith('.js')) {
    const c = fs.readFileSync(`engine/${f}`, 'utf8');
    if (c.includes('DECK_OUT') || c.includes('DECKOUT') || c.includes('deck_out')) {
      console.log(`Found in engine/${f}`);
    }
  }
}
