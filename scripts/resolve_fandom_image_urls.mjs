import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const det = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));

const unhashedCards = [];
for (const [k, c] of Object.entries(det)) {
  if (c.image_url && c.image_url.includes('static.wikia.nocookie.net') && !c.image_url.match(/\/images\/[0-9a-f]\/[0-9a-f]{2}\//i)) {
    const filename = c.image_url.split('/').pop().split('?')[0];
    unhashedCards.push({ key: k, name: c.name, filename, originalUrl: c.image_url });
  }
}

console.log(`Found ${unhashedCards.length} cards needing hashed URL resolution.`);

async function resolveBatch(cardsBatch) {
  // Try several file title variations: raw filename, card_number.png, card_number.jpg
  const titleToCards = new Map();
  for (const c of cardsBatch) {
    const t1 = `File:${decodeURIComponent(c.filename)}`;
    titleToCards.set(t1.toLowerCase(), c);
  }

  const titles = Array.from(titleToCards.keys()).map(t => encodeURIComponent(t)).join('|');
  const apiUrl = `https://battle-spirits.fandom.com/api.php?action=query&titles=${titles}&prop=imageinfo&iiprop=url&format=json`;

  try {
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BattleSpiritsEternal/2.0' }
    });
    if (!res.ok) {
      console.error(`API response not OK: ${res.status}`);
      return {};
    }
    const data = await res.json();
    const resolved = {};
    if (data && data.query && data.query.pages) {
      for (const [pageId, page] of Object.entries(data.query.pages)) {
        if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
          const directUrl = page.imageinfo[0].url;
          const pageTitle = page.title.toLowerCase();
          resolved[pageTitle] = directUrl;
        }
      }
    }
    return resolved;
  } catch (err) {
    console.error('Fetch error:', err.message);
    return {};
  }
}

async function run() {
  const allResolved = {};
  const batchSize = 40;
  for (let i = 0; i < unhashedCards.length; i += batchSize) {
    const batch = unhashedCards.slice(i, i + batchSize);
    console.log(`Querying batch ${Math.floor(i / batchSize) + 1} (${batch.length} cards)...`);
    const batchResolved = await resolveBatch(batch);
    Object.assign(allResolved, batchResolved);
  }

  console.log(`Total resolved file URLs from Fandom API: ${Object.keys(allResolved).length} / ${unhashedCards.length}`);
  fs.writeFileSync(path.join(ROOT, 'reports', 'card_database_recovery', 'fandom_resolved_urls.json'), JSON.stringify(allResolved, null, 2), 'utf8');
}

run();
