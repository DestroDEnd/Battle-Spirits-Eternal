const fs = require('fs');

let js = fs.readFileSync('battle_arena.js', 'utf8');

const targetStr = `    DuelState.player.field.push(card);
    DuelState.selectedPlayerCard = null;`;

const targetCrlf = targetStr.replace(/\n/g, '\r\n');

const tributeReplacement = `    // Check Tribute requirement
    const tributeReq = getCardTributeRequirement(card);
    if (tributeReq) {
      const eligible = getEligibleTributeSpirits(tributeReq, DuelState.player.field);
      if (eligible.length === 1) {
        // Direct tribute sole eligible spirit
        executeTribute(card, eligible[0], tributeReq, cost, coresToPlace);
        DuelState.selectedPlayerCard = null;
        return;
      } else if (eligible.length > 1) {
        // Prompt player to choose which spirit to tribute
        openTributeModal(card, tributeReq, cost, coresToPlace, eligible);
        DuelState.selectedPlayerCard = null;
        return;
      }
    }

    DuelState.player.field.push(card);
    DuelState.selectedPlayerCard = null;`.replace(/\n/g, '\r\n');

if (js.includes(targetCrlf)) {
  js = js.replace(targetCrlf, tributeReplacement);
  fs.writeFileSync('battle_arena.js', js, 'utf8');
  console.log('[OK] Integrated Tribute check into summonCard!');
} else {
  console.log('[FAIL] targetCrlf not found in summonCard');
}
