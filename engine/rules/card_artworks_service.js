import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BSP_DIR = path.resolve(__dirname, '..', '..');
const ARTWORKS_FILE = path.join(BSP_DIR, 'data', 'card_artworks.json');

let cachedArtworksMap = null;

export function loadArtworksCache() {
  if (cachedArtworksMap) return cachedArtworksMap;
  try {
    if (fs.existsSync(ARTWORKS_FILE)) {
      const raw = fs.readFileSync(ARTWORKS_FILE, 'utf8');
      cachedArtworksMap = JSON.parse(raw);
    } else {
      cachedArtworksMap = {};
    }
  } catch (err) {
    console.error('[CardArtworksService] Failed to load artworks cache:', err);
    cachedArtworksMap = {};
  }
  return cachedArtworksMap;
}

export function saveArtworksCache() {
  if (!cachedArtworksMap) return;
  try {
    fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(cachedArtworksMap, null, 2), 'utf8');
  } catch (err) {
    console.error('[CardArtworksService] Failed to save artworks cache:', err);
  }
}

export function getCachedArtworks(cardName, cardNumber) {
  const cache = loadArtworksCache();
  if (cardNumber) {
    const byNum = cache[cardNumber.toLowerCase().trim()];
    if (byNum && Array.isArray(byNum) && byNum.length > 0) return byNum;
  }
  if (cardName) {
    const byName = cache[cardName.toLowerCase().trim()];
    if (byName && Array.isArray(byName) && byName.length > 0) return byName;
  }
  return null;
}

export async function resolveCardArtworks(cardName, cardNumber, defaultImageUrl = '') {
  // Check memory / file cache first
  const cached = getCachedArtworks(cardName, cardNumber);
  if (cached) return cached;

  const fallbackStandard = [
    {
      name: 'Standard',
      image_url: defaultImageUrl || '',
      is_alternate: false
    }
  ];

  const searchTarget = cardName || cardNumber;
  if (!searchTarget) return fallbackStandard;

  try {
    const pageTitle = searchTarget.trim().replace(/ /g, '_');
    const parseUrl = 'https://battle-spirits.fandom.com/api.php?action=parse&page=' + encodeURIComponent(pageTitle) + '&prop=wikitext&format=json';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const parseRes = await (await fetch(parseUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal
    })).json();
    clearTimeout(timer);

    if (!parseRes.parse || !parseRes.parse.wikitext) {
      // Cache the standard fallback so we don't repeat failed requests
      cacheArtworks(cardName, cardNumber, fallbackStandard);
      return fallbackStandard;
    }

    const wikitext = parseRes.parse.wikitext['*'];
    const galleryMatches = [...wikitext.matchAll(/<gallery[^>]*>([\s\S]*?)<\/gallery>/gi)];

    const altFiles = [];
    for (const g of galleryMatches) {
      const lines = g[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('<!--'));
      for (const line of lines) {
        const parts = line.split('|');
        const file = parts[0].trim();
        let caption = parts.slice(1).join('|').trim();
        caption = caption.replace(/<[^>]+>/g, '').replace(/https?:\/\/\S+/g, '').replace(/\([^)]*https?:[^)]*\)/g, '').trim();
        // Ignore wiki core and UI markers
        if (/core\.png|main\d*\.png|flash\d*\.png|soulcore/i.test(file)) continue;
        if (/\.(png|jpe?g|webp)$/i.test(file)) {
          altFiles.push({ file, caption: caption || 'Alternate Art' });
        }
      }
    }

    if (altFiles.length === 0) {
      cacheArtworks(cardName, cardNumber, fallbackStandard);
      return fallbackStandard;
    }

    // Batch resolve image URLs via MediaWiki imageinfo
    const titles = altFiles.map(f => 'File:' + f.file).join('|');
    const infoUrl = 'https://battle-spirits.fandom.com/api.php?action=query&titles=' + encodeURIComponent(titles) + '&prop=imageinfo&iiprop=url&format=json';
    const infoRes = await (await fetch(infoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })).json();

    const urlMap = {};
    if (infoRes.query && infoRes.query.pages) {
      for (const p of Object.values(infoRes.query.pages)) {
        if (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) {
          const rawTitle = p.title.replace(/^File:/i, '').trim().toLowerCase();
          urlMap[rawTitle] = p.imageinfo[0].url;
        }
      }
    }

    const artworks = [
      {
        name: 'Standard',
        image_url: defaultImageUrl || '',
        is_alternate: false
      }
    ];

    for (const af of altFiles) {
      const u = urlMap[af.file.toLowerCase()];
      if (u) {
        artworks.push({
          name: af.caption,
          image_url: u,
          is_alternate: true
        });
      }
    }

    cacheArtworks(cardName, cardNumber, artworks);
    return artworks;
  } catch (err) {
    console.warn(`[CardArtworksService] Could not dynamically resolve artworks for "${searchTarget}":`, err.message);
    return fallbackStandard;
  }
}

export function cacheArtworks(cardName, cardNumber, artworks) {
  const cache = loadArtworksCache();
  if (cardName) cache[cardName.toLowerCase().trim()] = artworks;
  if (cardNumber) cache[cardNumber.toLowerCase().trim()] = artworks;
  saveArtworksCache();
}
