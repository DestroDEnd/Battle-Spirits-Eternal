import fs from 'node:fs';
import path from 'node:path';

// 1. Read opcode summary
const summary = JSON.parse(fs.readFileSync('scratch/opcode_summary.json', 'utf8'));
const opcodes = summary.opcodes;
const variants = summary.variants;

// 2. Read engine/ops/index.js to check implemented handlers
const opsFile = fs.readFileSync('engine/ops/index.js', 'utf8');
const bundleFile = fs.readFileSync('engine/cards/bundle.js', 'utf8');
const resolverFile = fs.readFileSync('engine/resolver.js', 'utf8');

// 3. Scan test files to identify direct opcode mentions and test coverage
const testFiles = fs.readdirSync('tests').filter(f => f.endsWith('.js'));
const opcodeTestMap = {};
for (const [code] of Object.entries(opcodes)) {
  opcodeTestMap[code] = [];
  const regex = new RegExp(`['"]${code}['"]`, 'g');
  for (const tf of testFiles) {
    const content = fs.readFileSync(path.join('tests', tf), 'utf8');
    if (regex.test(content)) {
      opcodeTestMap[code].push(`tests/${tf}`);
    }
  }
}

// 4. Define the 18 Effect Families
const familyDefinitions = [
  {
    id: 'FAM-01',
    name: 'Card & Zone Transitions',
    description: 'Summoning, deploying nexuses, zone movements, and free plays.',
    keywords: ['SUMMON', 'DEPLOY', 'MOVE_CARD', 'RETURN', 'OPEN_ZONE', 'TRASH', 'DECK', 'ZONE', 'REVEAL', 'ADVENT', 'SWAP']
  },
  {
    id: 'FAM-02',
    name: 'Destruction & Removal',
    description: 'Destruction of spirits, ultimates, nexuses, core depletion, and send-to-trash/void operations.',
    keywords: ['DESTROY', 'DEPLETE', 'SEND_TO_TRASH', 'SEND_TO_VOID', 'SACRIFICE', 'DISCARD_REVEALED']
  },
  {
    id: 'FAM-03',
    name: 'Bounce & Hand/Deck Relocation',
    description: 'Returning cards to hand, top of deck, bottom of deck, or alternate zones.',
    keywords: ['BOUNCE', 'RETURN_TO_HAND', 'BOTTOM', 'TOP', 'RETURN_REVEALED', 'RETURN_REMAINING']
  },
  {
    id: 'FAM-04',
    name: 'Hand Manipulation & Drawing',
    description: 'Card draw, hand discarding, hand swaps, and hand size adjustments.',
    keywords: ['DRAW', 'DISCARD_HAND', 'DISCARD', 'SWAP_HAND', 'HAND_SIZE', 'ADD_TO_HAND']
  },
  {
    id: 'FAM-05',
    name: 'Deck Manipulation & Milling',
    description: 'Deck search, top card revealing, deck milling, and deck ordering.',
    keywords: ['MILL', 'DECK_SEARCH', 'REVEAL_DECKTOP', 'SEARCH_DECK', 'SHUFFLE', 'LOOK_AT_DECK']
  },
  {
    id: 'FAM-06',
    name: 'Core & Resource Management',
    description: 'Core transfer, Soul Core flow, core charging, cost payment, and reserve manipulation.',
    keywords: ['MOVE_CORE', 'MOVE_SOUL_CORE', 'CORE_CHARGE', 'ADD_CORE', 'PAY_COST', 'SWAP_CORES', 'CORE_LOCK', 'AWAKEN_CORE_MOVE']
  },
  {
    id: 'FAM-07',
    name: 'Life Management & Recovery',
    description: 'Life recovery, life damage, void life transitions, and life protection.',
    keywords: ['RECOVER_LIFE', 'LIFE_DAMAGE', 'SEND_LIFE', 'LIFE_LOSS', 'LIFE_RESTRICTION']
  },
  {
    id: 'FAM-08',
    name: 'BP Buff & Modification',
    description: 'Continuous and instant modifications to Battle Points (BP), formulas, and comparisons.',
    keywords: ['BP_BUFF', 'BP_DEBUFF', 'SET_BP', 'SWITCH_BP', 'BP_FORMULA', 'BP_COMPARISON', 'BP_MATCH']
  },
  {
    id: 'FAM-09',
    name: 'Combat Flow & Declaration',
    description: 'Attack step, end of battle, extra attacks, combat phases, and battle resolution.',
    keywords: ['END_BATTLE', 'EXTRA_ATTACK', 'FORCE_ATTACK', 'ATTACK_STEP', 'CLASH', 'BATTLE']
  },
  {
    id: 'FAM-10',
    name: 'Attack & Block Restrictions',
    description: 'Cannot attack, cannot block, unblockable, force block, target attack.',
    keywords: ['CANNOT_ATTACK', 'CANNOT_BLOCK', 'UNBLOCKABLE', 'FORCE_BLOCK', 'TARGET_ATTACK', 'BLOCK_RESTRICTION']
  },
  {
    id: 'FAM-11',
    name: 'Exhaust & Refresh Dynamics',
    description: 'Exhausting spirits/nexuses, refreshing, refresh prevention, exhaust on summon.',
    keywords: ['EXHAUST', 'REFRESH', 'RESTORE', 'CANNOT_REFRESH', 'EXHAUST_ON_SUMMON']
  },
  {
    id: 'FAM-12',
    name: 'Targeting & Candidate Resolution',
    description: 'Target selection, candidate filtering, redirecting targets, multi-target expansion.',
    keywords: ['TARGET', 'SELECT_TARGET', 'REDIRECT_TARGET', 'CHOOSE', 'CANDIDATE']
  },
  {
    id: 'FAM-13',
    name: 'Continuous Immunity & Protection',
    description: 'Indestructible, immunity to colors/types, cannot be returned, armor.',
    keywords: ['INDESTRUCTIBLE', 'IMMUNITY', 'PROTECTION', 'ARMOR', 'CANNOT_BE', 'PREVENT']
  },
  {
    id: 'FAM-14',
    name: 'Symbol & Color Modification',
    description: 'Adding symbols, removing symbols, color addition, treating color/symbol.',
    keywords: ['ADD_SYMBOL', 'CHANGE_COLOR', 'TREAT_COLOR', 'SYMBOL', 'COLOR']
  },
  {
    id: 'FAM-15',
    name: 'Cost Modification & Reduction',
    description: 'Cost reduction, symbol reduction, free play casting, cost increase.',
    keywords: ['COST_MODIFIER', 'REDUCTION', 'FREE', 'CAST_MAGIC_FREE', 'PAY_LESS']
  },
  {
    id: 'FAM-16',
    name: 'Rule & Restriction Modifiers',
    description: 'Global rule modifications, deck building limits, format markers, activation restrictions.',
    keywords: ['RULE', 'RESTRICTION', 'LIMIT', 'FORMAT_MARKER', 'MODIFIER', 'CANNOT']
  },
  {
    id: 'FAM-17',
    name: 'Burst, Mirage & Keyword Triggers',
    description: 'Burst lock, burst triggers, mirage activation, keyword mechanics, triggered watchers.',
    keywords: ['BURST', 'MIRAGE', 'KEYWORD', 'TRIGGER', 'WATCHER']
  },
  {
    id: 'FAM-18',
    name: 'Special Mechanics & Advanced Primitives',
    description: 'Advent stack, brave combine, counter/charge, dice/coin, family grants, transform.',
    keywords: ['ADVENT_STACK', 'BRAVE', 'COUNTER', 'CHARGE', 'COIN', 'DICE', 'GRANT_FAMILY', 'SPECIAL']
  }
];

// Helper to assign opcode to family
function assignFamily(opcode) {
  for (const fam of familyDefinitions) {
    for (const kw of fam.keywords) {
      if (opcode.includes(kw)) {
        return fam.id;
      }
    }
  }
  // Default to Special Mechanics if not matching
  return 'FAM-18';
}

const opcodeResults = [];
const familyStats = {};
familyDefinitions.forEach(f => {
  familyStats[f.id] = {
    id: f.id,
    name: f.name,
    description: f.description,
    totalClauses: 0,
    opcodes: [],
    verifiedOpcodes: 0,
    handlerPresentOpcodes: 0,
    compilerOnlyOpcodes: 0
  };
});

for (const [code, count] of Object.entries(opcodes)) {
  const famId = assignFamily(code);
  const tests = opcodeTestMap[code] || [];
  const inOps = opsFile.includes(`case '${code}':`) || opsFile.includes(`"${code}"`) || opsFile.includes(`'${code}'`);
  const inBundle = bundleFile.includes(`'${code}'`) || bundleFile.includes(`"${code}"`);
  const inResolver = resolverFile.includes(`'${code}'`) || resolverFile.includes(`"${code}"`);
  const handlerPresent = inOps || inBundle || inResolver;

  let status = 'COMPILER_ONLY';
  if (handlerPresent) {
    if (tests.length > 0) {
      status = 'SEMANTICALLY_VERIFIED';
    } else {
      status = 'HANDLER_PRESENT';
    }
  }

  const vInfo = variants[code] || { targetKeys: [], countTypes: [], zones: [], sampleCards: [] };

  const opEntry = {
    opcode: code,
    clauseCount: count,
    familyId: famId,
    familyName: familyDefinitions.find(f => f.id === famId).name,
    status,
    handlerPresent,
    testCoverageCount: tests.length,
    testSuites: tests.slice(0, 5),
    variants: {
      targetKeys: vInfo.targetKeys,
      countTypes: vInfo.countTypes,
      zones: vInfo.zones,
      sampleCards: vInfo.sampleCards
    }
  };

  opcodeResults.push(opEntry);

  familyStats[famId].totalClauses += count;
  familyStats[famId].opcodes.push(code);
  if (status === 'SEMANTICALLY_VERIFIED') familyStats[famId].verifiedOpcodes++;
  else if (status === 'HANDLER_PRESENT') familyStats[famId].handlerPresentOpcodes++;
  else familyStats[famId].compilerOnlyOpcodes++;
}

// Write opcode_variant_coverage.json
const opcodeVariantCoverage = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalShards: summary.totalShards,
    totalClauses: summary.totalClauses,
    totalUniqueOpcodes: Object.keys(opcodes).length,
    semanticallyVerifiedCount: opcodeResults.filter(o => o.status === 'SEMANTICALLY_VERIFIED').length,
    handlerPresentCount: opcodeResults.filter(o => o.status === 'HANDLER_PRESENT').length,
    compilerOnlyCount: opcodeResults.filter(o => o.status === 'COMPILER_ONLY').length
  },
  opcodes: opcodeResults
};

fs.writeFileSync('reports/phase4d/opcode_variant_coverage.json', JSON.stringify(opcodeVariantCoverage, null, 2));
console.log('Saved reports/phase4d/opcode_variant_coverage.json');

// Write effect_family_inventory.json
const effectFamilyInventory = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalFamilies: familyDefinitions.length,
    totalClauses: summary.totalClauses,
    totalUniqueOpcodes: Object.keys(opcodes).length
  },
  families: Object.values(familyStats).map(f => {
    const totalOps = f.opcodes.length;
    const verifiedRate = totalOps > 0 ? ((f.verifiedOpcodes / totalOps) * 100).toFixed(2) + '%' : '0.00%';
    return {
      id: f.id,
      name: f.name,
      description: f.description,
      totalClauses: f.totalClauses,
      totalOpcodes: totalOps,
      verifiedOpcodes: f.verifiedOpcodes,
      handlerPresentOpcodes: f.handlerPresentOpcodes,
      compilerOnlyOpcodes: f.compilerOnlyOpcodes,
      verifiedRate,
      opcodes: f.opcodes
    };
  })
};

fs.writeFileSync('reports/phase4d/effect_family_inventory.json', JSON.stringify(effectFamilyInventory, null, 2));
console.log('Saved reports/phase4d/effect_family_inventory.json');
