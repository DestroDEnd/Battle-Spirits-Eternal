const titles = [
  'Doom Mercenary', 'Fixer, Izolder', 'No. 14 God Apple River', 'The ApexDragonMarquis Palvisor',
  'The ArtificialVampire Drakstein', 'The ChalkMothership Pannotia', 'The Criminal Sage',
  'The DragonFruitsel Pitajya', "The Dragon Emperor's Pirate Crew Hidden Harbor", 'The EvilGentleman Zerenade',
  'The GodSealingShield Atziluth', 'The GourmetFairy Dolce', 'The MagicMirrorMan Necrog',
  'The MobileMercuryHumanoid Argendid', 'The NightEmperor Voltissimo - Devil Form -', 'The NightEmperor Voltissimo',
  'The PhantomThiefDevil Jeanluc', 'The RagingFireDragon Gamushalander', 'The SacredBeastDragon Gilzash Ritter Stance',
  'The SacredBeastDragon Gilzash Wild Stance', 'The Seventh\'s MonkeyKing Valin', 'The ThunderDragonKing Brightening',
  'The ThunderDragonKing Brightening-Zero', 'The WaterPhantomPrincess La Mer', 'Vampire Dashing in the Night, Miaza'
];

async function main() {
  const url = 'https://battle-spirits.fandom.com/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=' + encodeURIComponent(titles.join('|'));
  const res = await fetch(url);
  const j = await res.json();
  for (const p of Object.values(j.query.pages)) {
    const raw = p.revisions ? p.revisions[0].slots.main['*'] : '';
    const mCard = raw.match(/([A-Z0-9]{2,10}-[A-Z0-9]+)/i);
    const mImg = raw.match(/\|\s*image\s*=\s*([^\n\r|}]+)/i);
    const mSet = raw.match(/\|\s*set\d?\s*=\s*([^\n\r|}]+)/i);
    console.log(p.title, '=> code:', mCard ? mCard[1] : 'NONE', '| img:', mImg ? mImg[1].trim() : 'NONE', '| set:', mSet ? mSet[1].trim() : 'NONE');
  }
}
main();
