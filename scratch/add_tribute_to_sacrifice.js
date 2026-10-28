const fs = require('fs');

let js = fs.readFileSync('battle_arena.js', 'utf8');

const target = "let newLevel = 1;\n    let newBp = 2000;\n    if (isSpirit) {\n      const coresToPlace = 1;";
const replacement = `let newLevel = 1;
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
      }`;

if (js.includes(target)) {
  js = js.replace(target, replacement);
  fs.writeFileSync('battle_arena.js', js, 'utf8');
  console.log('[OK] Integrated Tribute check into executeSacrificeSummon');
} else {
  console.log('[WARN] target not found in executeSacrificeSummon');
}
