const fs = require('fs');

let js = fs.readFileSync('battle_arena.js', 'utf8');

const targetStr = `let newLevel = 1;
    let newBp = 2000;
    if (isSpirit) {
      const coresToPlace = 1;`;

const targetCrlf = targetStr.replace(/\n/g, '\r\n');

const additionCrlf = `let newLevel = 1;
    let newBp = 2000;
    if (isSpirit) {
      const coresToPlace = 1;

      // Check Tribute requirement on Sacrifice Summon
      const tributeReq = getCardTributeRequirement(card);
      if (tributeReq) {
        const eligible = getEligibleTributeSpirits(tributeReq, DuelState.player.field);
        if (eligible.length === 1) {
          closeSacrificeModal();
          executeTribute(card, eligible[0], tributeReq, cost, coresToPlace);
          return;
        } else if (eligible.length > 1) {
          closeSacrificeModal();
          openTributeModal(card, tributeReq, cost, coresToPlace, eligible);
          return;
        }
      }`.replace(/\n/g, '\r\n');

if (js.includes(targetCrlf)) {
  js = js.replace(targetCrlf, additionCrlf);
  fs.writeFileSync('battle_arena.js', js, 'utf8');
  console.log('[OK] Integrated Tribute check into executeSacrificeSummon successfully!');
} else {
  console.log('[FAIL] targetCrlf not found');
}
