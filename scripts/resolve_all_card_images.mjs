import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = process.cwd();
const detPath = path.join(ROOT, 'data', 'cards_detailed.json');
const indexPath = path.join(ROOT, 'data', 'cards_index.json');
const dbPath = path.join(ROOT, 'battle_spirits.db');

const detailed = JSON.parse(fs.readFileSync(detPath, 'utf8'));
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const db = new DatabaseSync(dbPath);

console.log('=== RESOLVING OFFICIAL HASHED ARTWORK URLS FROM FANDOM CDN ===');

// 1. Fetch all BS77 images from Fandom API
console.log('Fetching BS-77 image index from Fandom API...');
async function getBs77Images() {
  const url = 'https://battle-spirits.fandom.com/api.php?action=query&list=allimages&aiprefix=BS77&ailimit=200&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BSE/2.0' } });
  const data = await res.json();
  const map = {};
  if (data && data.query && data.query.allimages) {
    for (const img of data.query.allimages) {
      map[img.name.toLowerCase()] = img.url;
    }
  }
  return map;
}

const bs77Map = await getBs77Images();
console.log(`Fetched ${Object.keys(bs77Map).length} BS-77 images from Fandom.`);

// 2. Build list of unhashed cards
const cardsToResolve = [];
for (const [k, card] of Object.entries(detailed)) {
  const url = card.image_url || '';
  if (url.includes('static.wikia.nocookie.net') && !url.match(/\/images\/[0-9a-f]\/[0-9a-f]{2}\//i)) {
    cardsToResolve.push({ key: k, card });
  }
}
console.log(`Identified ${cardsToResolve.length} cards with unhashed static.wikia URLs.`);

// 3. Resolve BS77 cards directly
let bs77Resolved = 0;
for (const item of cardsToResolve) {
  const k = item.key;
  if (k.startsWith('BS77')) {
    const candidateNames = [
      `${k}.png`.toLowerCase(),
      `${k}.jpg`.toLowerCase(),
      `${k.replace('-', '_')}.png`.toLowerCase()
    ];
    for (const name of candidateNames) {
      if (bs77Map[name]) {
        item.resolvedUrl = bs77Map[name];
        bs77Resolved++;
        break;
      }
    }
  }
}
console.log(`Resolved ${bs77Resolved} / 46 BS-77 cards using allimages prefix.`);

// 4. Resolve remaining cards using MediaWiki query API
const remaining = cardsToResolve.filter(item => !item.resolvedUrl);
console.log(`Resolving remaining ${remaining.length} cards via Fandom query API...`);

async function resolveViaQueryApi(items) {
  const candidateToItem = new Map();
  const allTitles = [];

  for (const { key, card } of items) {
    const rawFilename = (card.image_url || '').split('/').pop().split('?')[0];
    const decoded = decodeURIComponent(rawFilename);
    const withSpaces = decoded.replace(/_/g, ' ');

    const candidates = [
      `File:${decoded}`,
      `File:${withSpaces}`,
      `File:${key}.png`,
      `File:${key}.jpg`,
      `File:${key}_official.png`,
      `File:${key} official.png`
    ];

    for (const c of candidates) {
      candidateToItem.set(c.toLowerCase(), card);
      allTitles.push(encodeURIComponent(c));
    }
  }

  // Chunk in batches of 40 titles
  const batchSize = 40;
  const resolvedMap = new Map();

  for (let i = 0; i < allTitles.length; i += batchSize) {
    const chunk = allTitles.slice(i, i + batchSize).join('|');
    const apiUrl = `https://battle-spirits.fandom.com/api.php?action=query&titles=${chunk}&prop=imageinfo&iiprop=url&format=json`;

    try {
      const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BSE/2.0' } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.query && data.query.pages) {
        for (const [id, page] of Object.entries(data.query.pages)) {
          if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
            resolvedMap.set(page.title.toLowerCase(), page.imageinfo[0].url);
          }
        }
      }
    } catch (e) {
      console.warn('Batch query error:', e.message);
    }
  }

  // Match back to items
  for (const item of items) {
    const rawFilename = (item.card.image_url || '').split('/').pop().split('?')[0];
    const decoded = decodeURIComponent(rawFilename);
    const withSpaces = decoded.replace(/_/g, ' ');

    const candidates = [
      `File:${decoded}`.toLowerCase(),
      `File:${withSpaces}`.toLowerCase(),
      `File:${item.key}.png`.toLowerCase(),
      `File:${item.key}.jpg`.toLowerCase(),
      `File:${item.key}_official.png`.toLowerCase(),
      `File:${item.key} official.png`.toLowerCase()
    ];

    for (const c of candidates) {
      if (resolvedMap.has(c)) {
        item.resolvedUrl = resolvedMap.get(c);
        break;
      }
    }
  }
}

await resolveViaQueryApi(remaining);

// 5. Update data/cards_detailed.json, data/cards_index.json, and SQLite
let updatedCount = 0;
let fallbackCount = 0;

for (const item of cardsToResolve) {
  const k = item.key;
  const card = item.card;
  let finalUrl = item.resolvedUrl;

  if (!finalUrl) {
    // If wiki doesn't have the image, use clean standard card back
    finalUrl = './assets/card_back.png';
    fallbackCount++;
  } else {
    updatedCount++;
  }

  // Update in memory
  detailed[k].image_url = finalUrl;
  if (index[k]) {
    index[k].image_url = finalUrl;
  }
}

console.log(`Resolution results: ${updatedCount} official hashed CDN URLs resolved, ${fallbackCount} set to fallback card back.`);

// Save JSON files
fs.writeFileSync(detPath, JSON.stringify(detailed), 'utf8');
fs.writeFileSync(indexPath, JSON.stringify(index), 'utf8');
console.log('Saved data/cards_detailed.json and data/cards_index.json.');

// Update SQLite tables
db.exec('BEGIN TRANSACTION;');
const updateCardsStmt = db.prepare('UPDATE cards SET image_url = ? WHERE card_number = ?');
const updateV2Stmt = db.prepare('UPDATE cards_v2 SET image_url = ? WHERE card_number = ?');

for (const item of cardsToResolve) {
  const k = item.key;
  const url = detailed[k].image_url;
  updateCardsStmt.run(url, k);
  updateV2Stmt.run(url, k);
}
db.exec('COMMIT;');
console.log('SQLite cards and cards_v2 tables updated with official CDN URLs.');

// Specifically verify Ubataman, Ultimate-Saviour, and BS77-001
console.log('\n--- VERIFYING HIGH-PRIORITY TARGET ARTWORK URLS ---');
console.log('Ubataman (BS30-015):', detailed['BS30-015'].image_url);
console.log('Ultimate-Saviour (BS27-X03):', detailed['BS27-X03'].image_url);
console.log('BS77-001 (Gyaivern):', detailed['BS77-001'].image_url);
console.log('BS77-002 (Akame Frog):', detailed['BS77-002'].image_url);
console.log('BS77-010 (Murasaki Oomuchi):', detailed['BS77-010'].image_url);

// Test HTTP status for these 5
const testUrls = [
  detailed['BS30-015'].image_url,
  detailed['BS27-X03'].image_url,
  detailed['BS77-001'].image_url,
  detailed['BS77-002'].image_url,
  detailed['BS77-010'].image_url
];

console.log('\nTesting direct browser fetch for sample resolved URLs...');
for (const u of testUrls) {
  try {
    const res = await fetch(u);
    console.log(`Fetch ${u.split('/').pop().split('?')[0]} -> Status ${res.status}`);
  } catch (e) {
    console.error(`Fetch ${u} error:`, e.message);
  }
}

console.log('\n=== ARTWORK RESOLUTION COMPLETE ===');
