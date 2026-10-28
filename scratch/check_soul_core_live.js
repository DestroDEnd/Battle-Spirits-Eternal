async function checkSoulCoreLive() {
  try {
    const res = await fetch('http://localhost:8000/');
    const html = await res.text();
    console.log('playerSoulCorePill in HTML:', html.includes('id="playerSoulCorePill"'));
    console.log('opponentSoulCorePill in HTML:', html.includes('id="opponentSoulCorePill"'));
    console.log('stepCard_REFRESH Return Cores text in HTML:', html.includes('Return all used Cores from Trash to Reserve'));

    const resJs = await fetch('http://localhost:8000/battle_arena.js?v=2.2');
    const js = await resJs.text();
    console.log('battle_arena.js has placeSoulCoreOnSpirit:', js.includes('placeSoulCoreOnSpirit'));
    console.log('battle_arena.js has removeSoulCoreFromSpirit:', js.includes('removeSoulCoreFromSpirit'));
    console.log('battle_arena.js has soulCoreIgnite:', js.includes('soulCoreIgnite'));

    const resCss = await fetch('http://localhost:8000/styles.css');
    const css = await resCss.text();
    console.log('styles.css has soul-core-pill:', css.includes('.soul-core-pill'));
    console.log('styles.css has spirit-soul-core-badge:', css.includes('.spirit-soul-core-badge'));
  } catch (err) {
    console.error(err);
  }
}
checkSoulCoreLive();
