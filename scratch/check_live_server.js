async function checkServer() {
  try {
    const res = await fetch('http://localhost:8000/');
    const html = await res.text();
    console.log('Server status:', res.status);
    console.log('Contains battleZoneModal:', html.includes('id="battleZoneModal"'));
    console.log('Contains tabPlayerTrash:', html.includes('id="tabPlayerTrash"'));
    console.log('Contains tabOpponentTrash:', html.includes('id="tabOpponentTrash"'));
    console.log('Contains tabVoid:', html.includes('id="tabVoid"'));
    console.log('Contains View Grave button:', html.includes('View Grave'));
    console.log('Contains View Void button:', html.includes('View Void'));
    console.log('Contains clickable-zone-pill:', html.includes('clickable-zone-pill'));

    const resJs = await fetch('http://localhost:8000/battle_arena.js');
    const js = await resJs.text();
    console.log('battle_arena.js status:', resJs.status);
    console.log('battle_arena.js has openZoneModal:', js.includes('openZoneModal'));
    console.log('battle_arena.js has sendToTrash:', js.includes('sendToTrash'));
    console.log('battle_arena.js has sendToVoid:', js.includes('sendToVoid'));

    const resCss = await fetch('http://localhost:8000/styles.css');
    const css = await resCss.text();
    console.log('styles.css status:', resCss.status);
    console.log('styles.css has zone-modal-card:', css.includes('.zone-modal-card'));
    console.log('styles.css has void-cosmic-banner:', css.includes('.void-cosmic-banner'));
  } catch (err) {
    console.error('Error connecting to server:', err);
  }
}
checkServer();
