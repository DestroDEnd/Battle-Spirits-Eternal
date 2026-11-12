import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BSP_DIR = path.resolve(__dirname, '..');
const ARTWORKS_FILE = path.join(BSP_DIR, 'data', 'card_artworks.json');

async function main() {
  console.log('[Build Artworks] Starting cards artwork crawler...');
  let cache = {};
  if (fs.existsSync(ARTWORKS_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(ARTWORKS_FILE, 'utf8'));
    } catch (e) {}
  }

  // Get search hits for <gallery>
  let titles = [];
  let cont = '';
  for (let i = 0; i < 4; i++) {
    const url = 'https://battle-spirits.fandom.com/api.php?action=query&generator=search&gsrsearch=%22%3Cgallery%3E%22&gsrlimit=50&gsrnamespace=0&prop=info&format=json' + (cont ? '&' + cont : '');
    try {
      const res = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
      if (res.query && res.query.pages) {
        titles.push(...Object.values(res.query.pages).map(p => p.title));
      }
      if (res.continue && res.continue.gsroffset) {
        cont = 'gsroffset=' + res.continue.gsroffset + '&continue=' + encodeURIComponent(res.continue.continue);
      } else {
        break;
      }
    } catch (e) {
      break;
    }
  }

  // Also include popular and iconic cards
  const priorityCards = [
    'Gate Open, Release',
    'The DragonEmperor Siegfried',
    'The SevenShogun Beelzebeat',
    'Double Draw',
    'Strong Draw',
    'The DarkExaltedDragon Grand-Sieg-Suspend',
    'The SacredSwordsman Grand-Lancelot',
    'The Absolute Dragon Emperor Amaterasu-Dragon',
    'The MoonBowDragon Striker-Apollodragon',
    'The SuperHollowHero Big-Bang-Golemu',
    'The GodSeeker Angelia Aset-Kite',
    'The ArcanaBeast King Grand-Cerberus',
    'The EvilEmperor Beldegor'
  ];

  const allTargets = Array.from(new Set([...priorityCards, ...titles]));
  console.log(`[Build Artworks] Processing ${allTargets.length} potential gallery cards...`);

  let addedCount = 0;
  for (const cardName of allTargets) {
    const key = cardName.toLowerCase().trim();
    if (cache[key] && cache[key].length > 1) continue;

    try {
      const pageTitle = cardName.trim().replace(/ /g, '_');
      const parseUrl = 'https://battle-spirits.fandom.com/api.php?action=parse&page=' + encodeURIComponent(pageTitle) + '&prop=wikitext|images&format=json';
      const parseRes = await (await fetch(parseUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
      if (!parseRes.parse || !parseRes.parse.wikitext) continue;

      const wikitext = parseRes.parse.wikitext['*'];
      const galleryMatches = [...wikitext.matchAll(/<gallery[^>]*>([\s\S]*?)<\/gallery>/gi)];
      if (galleryMatches.length === 0) continue;

      const altFiles = [];
      for (const g of galleryMatches) {
        const lines = g[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('<!--'));
        for (const line of lines) {
          const parts = line.split('|');
          const file = parts[0].trim();
          let caption = parts.slice(1).join('|').trim();
          caption = caption.replace(/<[^>]+>/g, '').replace(/https?:\/\/\S+/g, '').replace(/\([^)]*https?:[^)]*\)/g, '').trim();
          if (/core\.png|main\d*\.png|flash\d*\.png|soulcore/i.test(file)) continue;
          if (/\.(png|jpe?g|webp)$/i.test(file)) {
            altFiles.push({ file, caption: caption || 'Alternate Art' });
          }
        }
      }

      if (altFiles.length === 0) continue;

      // Extract main image if available
      const mainImgMatch = wikitext.match(/\|\s*image\s*=\s*([^\r\n\|\}]+)/i);
      const mainFile = mainImgMatch ? mainImgMatch[1].trim() : null;

      const allFilesToResolve = mainFile ? [mainFile, ...altFiles.map(a => a.file)] : altFiles.map(a => a.file);
      const fileTitles = allFilesToResolve.slice(0, 50).map(f => 'File:' + f).join('|');
      const infoUrl = 'https://battle-spirits.fandom.com/api.php?action=query&titles=' + encodeURIComponent(fileTitles) + '&prop=imageinfo&iiprop=url&format=json';
      const infoRes = await (await fetch(infoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();

      const urlMap = {};
      if (infoRes.query && infoRes.query.pages) {
        for (const p of Object.values(infoRes.query.pages)) {
          if (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) {
            const rawTitle = p.title.replace(/^File:/i, '').trim().toLowerCase();
            urlMap[rawTitle] = p.imageinfo[0].url;
          }
        }
      }

      let standardUrl = mainFile ? urlMap[mainFile.toLowerCase()] : null;
      if (!standardUrl && altFiles.length > 0) {
        standardUrl = urlMap[altFiles[0].file.toLowerCase()];
      }

      const artworks = [
        {
          name: 'Standard',
          image_url: standardUrl || '',
          is_alternate: false
        }
      ];

      for (const af of altFiles) {
        const u = urlMap[af.file.toLowerCase()];
        if (u && u !== standardUrl) {
          artworks.push({
            name: af.caption,
            image_url: u,
            is_alternate: true
          });
        }
      }

      if (artworks.length > 1) {
        cache[key] = artworks;
        addedCount++;
        console.log(`[Build Artworks] + ${cardName}: ${artworks.length} artworks`);
      }
    } catch (err) {
      // Skip on error
    }
  }

  fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`[Build Artworks] Done! Cached artworks for ${Object.keys(cache).length} cards (+${addedCount} newly added).`);
}

main().catch(console.error);
