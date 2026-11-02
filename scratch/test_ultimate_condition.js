const fs = require('fs');

const cards = JSON.parse(fs.readFileSync('scratch/sample_ultimates.json', 'utf8'));

function wordToNum(str) {
  const map = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  const s = String(str || '').toLowerCase().trim();
  if (map[s] !== undefined) return map[s];
  const n = parseInt(s, 10);
  return isNaN(n) ? 1 : n;
}

function validateUltimateSummonCondition(card, side, mockState) {
  if (!card) return { allowed: true };
  const type = String(card.type || '');
  if (type !== 'Ultimate' && !type.includes('Ultimate')) {
    return { allowed: true };
  }

  const eff = card.effect || '';
  const m = eff.match(/(?:\[(?:Summon Condition|SuAdcon):?|【(?:召喚条件|召喚\/煌臨条件)：?)\s*([^\]】\n]+)/i);
  if (!m) return { allowed: true };

  const condText = m[1].trim();
  if (!condText || /^(?:none|なし|無し)\.?$/i.test(condText)) {
    return { allowed: true, condText };
  }

  const friendlyState = mockState || {
    field: [],
    nexus: [],
    life: 5,
    counters: 0,
    trashCards: []
  };

  const field = friendlyState.field || [];
  const spirits = field.filter(s => s.type === 'Spirit' || (s.type || '').includes('Spirit'));
  const ultimates = field.filter(s => s.type === 'Ultimate' || (s.type || '').includes('Ultimate'));
  const life = friendlyState.life !== undefined ? friendlyState.life : 5;
  const counters = friendlyState.counters || friendlyState.counter || 0;

  const cl = condText.toLowerCase();

  // 1. Counter conditions
  if (cl.includes('counter') || cl.includes('カウント')) {
    const cMatch = cl.match(/(?:at least|have)\s+(\w+|\d+)\s+counter/i) || cl.match(/(\w+|\d+)\s+or more\s+counter/i) || cl.match(/c(\d+)\s+or\s+more/i);
    const req = cMatch ? wordToNum(cMatch[1]) : 1;
    if (counters < req) {
      return { allowed: false, reason: `Requires ${req} or more Counters (Current: ${counters})`, condText };
    }
    return { allowed: true, condText };
  }

  // 2. Life conditions
  if (cl.includes('life') || cl.includes('ライフ')) {
    const lessMatch = cl.match(/life\s+is\s+(?:at\s+)?(\w+|\d+)\s+or\s+less/i) || cl.match(/(\w+|\d+)\s+lives?\s+or\s+less/i);
    if (lessMatch) {
      const maxLife = wordToNum(lessMatch[1]);
      if (life > maxLife) {
        return { allowed: false, reason: `Requires Life to be ${maxLife} or less (Current: ${life})`, condText };
      }
      return { allowed: true, condText };
    }
    const moreMatch = cl.match(/life\s+is\s+(?:at\s+)?(\w+|\d+)\s+or\s+more/i) || cl.match(/at\s+least\s+(\w+|\d+)\s+lives?/i) || cl.match(/(\w+|\d+)\s+lives?\s+or\s+more/i);
    if (moreMatch) {
      const minLife = wordToNum(moreMatch[1]);
      if (life < minLife) {
        return { allowed: false, reason: `Requires Life to be ${minLife} or more (Current: ${life})`, condText };
      }
      return { allowed: true, condText };
    }
  }

  // 3. Spirits & Trash empty check: "control no Spirits & have 0 Spirit cards in your Trash"
  if (cl.includes('no spirits') || cl.includes('0 spirit cards in your trash')) {
    const trashSpirits = (friendlyState.trashCards || friendlyState.trash || []).filter(c => (c.type || '').includes('Spirit'));
    if (spirits.length > 0 || trashSpirits.length > 0) {
      return { allowed: false, reason: 'Requires controlling no Spirits and having 0 Spirits in Trash', condText };
    }
    return { allowed: true, condText };
  }

  // 4. Ultimates on field: "one or more Ultimates"
  if (cl.includes('one or more ultimates') || cl.includes('1 or more ultimates') || cl.includes('at least one ultimate')) {
    if (ultimates.length < 1) {
      return { allowed: false, reason: 'Requires controlling at least 1 Ultimate on field', condText };
    }
    return { allowed: true, condText };
  }

  // 5. Cost N or higher Spirit / Unit: "Cost N or higher Spirits" / "Cost N or more Spirits"
  const costMatch = cl.match(/cost\s+(\d+)\s+or\s+(?:higher|more)\s+(?:spirit|ultimate)/i);
  if (costMatch) {
    const reqCost = parseInt(costMatch[1], 10);
    const countMatch = cl.match(/(?:control|have)\s+(\w+|\d+)\s+or\s+more\s+cost/i);
    const reqCount = countMatch ? wordToNum(countMatch[1]) : 1;
    const matching = field.filter(u => (u.cost || 0) >= reqCost);
    if (matching.length < reqCount) {
      return { allowed: false, reason: `Requires controlling at least ${reqCount} Cost ${reqCost} or higher Spirit/Ultimate on field`, condText };
    }
    return { allowed: true, condText };
  }

  // 6. Color-specific Spirits: "1 or more [Color] Spirits"
  const colorMatch = cl.match(/(?:have|control)\s+(\w+|\d+)\s+or\s+more\s+(red|purple|green|white|yellow|blue)\s+spirit/i) ||
                     cl.match(/(\w+|\d+)\s+or\s+more\s+(red|purple|green|white|yellow|blue)\s+spirits?\s+on\s+your\s+field/i);
  if (colorMatch) {
    const reqCount = wordToNum(colorMatch[1]);
    const reqColor = colorMatch[2].toLowerCase();
    const matching = spirits.filter(s => (s.color || '').toLowerCase().includes(reqColor));
    if (matching.length < reqCount) {
      return { allowed: false, reason: `Requires controlling ${reqCount} or more ${colorMatch[2]} Spirits on field`, condText };
    }
    return { allowed: true, condText };
  }

  // 7. Family-specific Spirit/Ultimate: "one or more [Family] Spirit/Ultimate"
  const famMatch = cl.match(/(?:control|have)\s+(\w+|\d+)\s+or\s+more\s+([a-zA-Z\s]+?)\s+(?:spirit|ultimate)/i);
  if (famMatch) {
    const reqCount = wordToNum(famMatch[1]);
    const fam = famMatch[2].trim().toLowerCase();
    if (!['red', 'purple', 'green', 'white', 'yellow', 'blue', 'cost'].includes(fam)) {
      const matching = field.filter(u => {
        const uFam = ((u.family || '') + ' ' + (u.families ? u.families.join(' ') : '')).toLowerCase();
        return uFam.includes(fam);
      });
      if (matching.length < reqCount) {
        return { allowed: false, reason: `Requires controlling ${reqCount} or more "${famMatch[2].trim()}" Spirits/Ultimates on field`, condText };
      }
      return { allowed: true, condText };
    }
  }

  // 8. Named card / Partner: e.g. "The Extreme Partner, Zetter" / "The PartnerDemonLord Javad"
  const nameMatch = condText.match(/["'“‘]([^"'”’]+)["'”’]/);
  if (nameMatch) {
    const targetName = nameMatch[1].trim().toLowerCase();
    const hasOnField = field.some(u => (u.name || '').toLowerCase().includes(targetName));
    const isContractPartner = (friendlyState.contractCard && (friendlyState.contractCard.name || '').toLowerCase().includes(targetName));
    if (!hasOnField && !isContractPartner) {
      return { allowed: false, reason: `Requires controlling "${nameMatch[1].trim()}" on field or in Soul State`, condText };
    }
    return { allowed: true, condText };
  }

  // Default fallback: allow if unparsed, but record condText
  return { allowed: true, condText };
}

// Test against mock state
let parsedCount = 0;
for (const c of cards) {
  // Test with empty field
  const resEmpty = validateUltimateSummonCondition(c, 'player', { field: [], life: 5, counters: 0 });
  // Test with full field (Red Lv1 spirit Cost 3, etc.)
  const resFull = validateUltimateSummonCondition(c, 'player', {
    field: [
      { name: 'Red Spirit', type: 'Spirit', color: 'Red', cost: 3, family: 'Winged Beast' },
      { name: 'The Extreme Partner, Zetter', type: 'Contract Spirit', color: 'Red', cost: 1 }
    ],
    life: 3,
    counters: 2
  });

  if (resEmpty.condText) parsedCount++;
}

console.log(`Parsed conditions for ${parsedCount} / ${cards.length} cards.`);
// Show some examples of failed conditions on empty field:
const samples = cards.slice(0, 5).map(c => {
  const res = validateUltimateSummonCondition(c, 'player', { field: [], life: 5, counters: 0 });
  return { name: c.name, cond: res.condText, allowedOnEmptyField: res.allowed, reason: res.reason };
});
console.log('Sample validations on empty field:', JSON.stringify(samples, null, 2));
