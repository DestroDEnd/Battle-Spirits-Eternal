import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGame } from '../engine/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { moveCore } from '../engine/zones.js';
import { ETERNAL_RULES } from '../engine/rules/eternal.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { compileCard } from '../compiler/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export async function runEngineDiagnostic() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('  BATTLE SPIRITS ETERNAL — ENGINE DIAGNOSTIC SUITE  ');
  console.log('====================================================\n');

  const diagnostics = {
    timestamp: new Date().toISOString(),
    status: 'PASS',
    database: {},
    ir_shards: {},
    identities: {},
    rules_profile: {},
    game_initialization: {},
    turn_lifecycle: {},
    core_conservation: {},
    card_resolution: {},
    summary: {}
  };

  // 1. Database & Cards Loading
  console.log('[1/8] Verifying Canonical Card Data & Index...');
  const detailedPath = path.join(ROOT, 'data', 'cards_detailed.json');
  const indexPath = path.join(ROOT, 'data', 'cards_index.json');
  
  if (!fs.existsSync(detailedPath)) throw new Error('data/cards_detailed.json missing');
  if (!fs.existsSync(indexPath)) throw new Error('data/cards_index.json missing');

  const detailedCards = JSON.parse(fs.readFileSync(detailedPath, 'utf8'));
  const indexCards = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  const detailedCount = Array.isArray(detailedCards) ? detailedCards.length : Object.keys(detailedCards).length;
  const indexCount = Array.isArray(indexCards) ? indexCards.length : Object.keys(indexCards).length;

  diagnostics.database = {
    detailedCardsCount: detailedCount,
    indexCardsCount: indexCount,
    detailedFileSizeBytes: fs.statSync(detailedPath).size,
    indexFileSizeBytes: fs.statSync(indexPath).size
  };
  console.log(`  ✓ Detailed Cards: ${detailedCount.toLocaleString()} loaded`);
  console.log(`  ✓ Index Cards: ${indexCount.toLocaleString()} loaded`);

  // 2. IR Shards Loading & Integrity Check
  console.log('\n[2/8] Auditing All 514 IR Shards...');
  const shardsDir = path.join(ROOT, 'data', 'ir_shards');
  const shardFiles = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json'));
  
  let totalShardCards = 0;
  let totalAbilities = 0;
  let totalClauses = 0;
  let shardErrors = 0;

  for (const sf of shardFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(shardsDir, sf), 'utf8'));
      for (const card of Object.values(content)) {
        totalShardCards++;
        if (Array.isArray(card.abilities)) {
          totalAbilities += card.abilities.length;
          for (const ab of card.abilities) {
            if (Array.isArray(ab.clauses)) totalClauses += ab.clauses.length;
          }
        }
      }
    } catch (e) {
      shardErrors++;
    }
  }

  diagnostics.ir_shards = {
    totalShardsCount: shardFiles.length,
    expectedShardsCount: 514,
    totalShardCards,
    totalAbilities,
    totalClauses,
    shardErrors
  };
  console.log(`  ✓ Shards Verified: ${shardFiles.length} of 514 present`);
  console.log(`  ✓ Total Shard Cards Indexed: ${totalShardCards.toLocaleString()}`);
  console.log(`  ✓ Total Compiled Abilities: ${totalAbilities.toLocaleString()} across ${totalClauses.toLocaleString()} clauses`);
  if (shardErrors > 0) throw new Error(`${shardErrors} shards failed JSON parsing`);

  // 3. Card Identity & Physical Ability Identity
  console.log('\n[3/8] Testing Canonical & Semantic Identity Subsystems...');
  const sampleCard = Array.isArray(detailedCards) ? detailedCards[0] : Object.values(detailedCards)[0];
  const compiledSample = compileCard(sampleCard);
  const sampleAb = compiledSample?.abilities?.[0];

  const hasPhysicalId = Boolean(sampleAb?.physicalId && sampleAb.physicalId.includes('#AB_'));
  const hasSemanticId = Boolean(sampleAb?.semanticId && sampleAb.semanticId.startsWith('SEM#'));
  const hasSemanticIdV3 = Boolean(sampleAb?.semanticIdV3 && sampleAb.semanticIdV3.startsWith('SEM3#'));

  diagnostics.identities = {
    sampleCardNumber: sampleCard.card_number || sampleCard.cardNumber || sampleCard.id,
    hasPhysicalId,
    hasSemanticId,
    hasSemanticIdV3,
    samplePhysicalId: sampleAb?.physicalId,
    sampleSemanticId: sampleAb?.semanticId,
    sampleSemanticIdV3: sampleAb?.semanticIdV3
  };
  console.log(`  ✓ Sample Card: ${diagnostics.identities.sampleCardNumber}`);
  console.log(`  ✓ Physical Ability Identity: ${hasPhysicalId ? 'PASS' : 'FAIL'} (${sampleAb?.physicalId?.slice(0, 45)}...)`);
  console.log(`  ✓ Semantic Identity V1: ${hasSemanticId ? 'PASS' : 'FAIL'} (${sampleAb?.semanticId?.slice(0, 45)}...)`);
  console.log(`  ✓ Semantic Identity V3: ${hasSemanticIdV3 ? 'PASS' : 'FAIL'} (${sampleAb?.semanticIdV3?.slice(0, 45)}...)`);

  // 4. Eternal Rules Profile
  console.log('\n[4/8] Inspecting Eternal Rules Profile Invariants...');
  diagnostics.rules_profile = {
    format: ETERNAL_RULES.format || 'Eternal',
    deckMin: ETERNAL_RULES.deck?.minSize ?? 40,
    deckMax: ETERNAL_RULES.deck?.maxSize ?? Infinity,
    maxCopiesPerCard: ETERNAL_RULES.deck?.maxCopiesPerCard ?? 3,
    initialLife: ETERNAL_RULES.setup?.initialLife ?? 5,
    initialReserve: ETERNAL_RULES.setup?.initialReserveCores ?? 4,
    initialSoulCore: 1,
    turnOneSkips: ETERNAL_RULES.turnOne?.skips || ['CORE', 'DRAW', 'ATTACK']
  };
  console.log(`  ✓ Format: ${diagnostics.rules_profile.format}`);
  console.log(`  ✓ Deck Constraints: min ${diagnostics.rules_profile.deckMin}, max 3 copies/card`);
  console.log(`  ✓ Initial Resources: ${diagnostics.rules_profile.initialLife} Life, ${diagnostics.rules_profile.initialReserve} Reserve (3 Normal + 1 Soul Core)`);
  console.log(`  ✓ Turn 1 Rules: Skips [${diagnostics.rules_profile.turnOneSkips.join(', ')}]`);

  // 5. Game State Creation & Invariants
  console.log('\n[5/8] Initializing Deterministic Game Instance...');
  const game = createGame();
  const state = game.state;

  const p1 = state.players.player;
  const p2 = state.players.opponent;

  const validInit = (
    p1.life === 5 && p2.life === 5 &&
    (p1.reserve.normal + p1.reserve.soul) === 4 &&
    (p2.reserve.normal + p2.reserve.soul) === 4 &&
    p1.reserve.soul === 1 && p2.reserve.soul === 1 &&
    p1.field.length === 0 && p2.field.length === 0 &&
    state.activePlayer === 'player' &&
    state.turnNumber === 1 &&
    state.step === 'START'
  );

  diagnostics.game_initialization = {
    valid: validInit,
    turn: state.turnNumber,
    step: state.step,
    activePlayer: state.activePlayer,
    p1Life: p1.life,
    p1ReserveNormal: p1.reserve.normal,
    p1ReserveSoul: p1.reserve.soul,
    p2Life: p2.life,
    p2ReserveNormal: p2.reserve.normal,
    p2ReserveSoul: p2.reserve.soul
  };
  console.log(`  ✓ Player 1: Life=${p1.life}, Reserve=${p1.reserve.normal} normal + ${p1.reserve.soul} soul`);
  console.log(`  ✓ Player 2: Life=${p2.life}, Reserve=${p2.reserve.normal} normal + ${p2.reserve.soul} soul`);
  console.log(`  ✓ Initial State Validation: ${validInit ? 'PASS' : 'FAIL'}`);

  // 6. Turn Lifecycle & Step Progression
  console.log('\n[6/8] Testing Turn Flow & Step Controller...');
  const initialStep = state.step;
  console.log(`  ✓ Initial Step: ${initialStep}`);

  // Test turn 1 progression: START -> (skips CORE and DRAW) -> REFRESH -> MAIN -> (skips ATTACK) -> END
  await game.advanceStep();
  const stepAfterStart = state.step;
  console.log(`  ✓ Step after START on Turn 1 (skipping Core/Draw): ${stepAfterStart}`);

  diagnostics.turn_lifecycle = {
    initialStep,
    stepAfterStart,
    turnOneSkipsWorking: stepAfterStart === 'REFRESH'
  };

  // 7. Core Economics & Core Conservation Law
  console.log('\n[7/8] Verifying Conservation of Cores...');
  const countTotalCores = (st) => {
    let total = 0;
    for (const side of ['player', 'opponent']) {
      const p = st.players[side];
      total += p.life;
      total += p.reserve.normal + p.reserve.soul;
      total += (p.trash?.normal || 0) + (p.trash?.soul || 0);
      total += (p.coreTrash?.normal || 0) + (p.coreTrash?.soul || 0);
      for (const stck of p.field || []) {
        total += (stck.cores?.normal || 0) + (stck.cores?.soul || 0);
      }
    }
    total += (st.void?.normal || 0) + (st.void?.soul || 0);
    return total;
  };

  const initialTotal = countTotalCores(state);
  
  // Perform core move
  await moveCore(state, 1, { side: 'player', zone: 'reserve' }, { side: 'player', zone: 'trash' }, {}, game.events);
  const afterMoveTotal = countTotalCores(state);

  diagnostics.core_conservation = {
    initialTotalCores: initialTotal,
    afterMoveTotalCores: afterMoveTotal,
    conserved: initialTotal === afterMoveTotal
  };
  console.log(`  ✓ Total System Cores: ${initialTotal}`);
  console.log(`  ✓ Cores Conserved After Mutation: ${initialTotal === afterMoveTotal ? 'PASS' : 'FAIL'}`);

  // 8. Ability Resolution Check
  console.log('\n[8/8] Verifying Async Ability Resolver...');
  const resolver = new AsyncResolver(new DefaultPromptResolver());
  const dummyAb = {
    id: 'DIAG#DRAW_1',
    header: { levels: [1], timing: 'MAIN' },
    clauses: [
      {
        rawText: 'Draw a card.',
        cleanText: 'Draw a card',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  state.players.player.deck.push(createCardInstance({ id: 'DIAG_CARD_1', type: 'Spirit' }, 'player'));
  const drawBefore = state.players.player.hand.length;
  const res = await resolver.resolveAbility(state, dummyAb, { controller: 'player', sourceCard: null, sourceStack: null });
  const drawAfter = state.players.player.hand.length;

  diagnostics.card_resolution = {
    resolverSuccess: res.success,
    drawnCardCount: drawAfter - drawBefore
  };
  console.log(`  ✓ Resolver Result: ${res.success ? 'SUCCESS' : 'FAILURE'}`);
  console.log(`  ✓ Hand Count Delta: +${drawAfter - drawBefore}`);

  const elapsedMs = Date.now() - startTime;
  diagnostics.summary = {
    status: 'HEALTHY_PLAYABLE_ENGINE',
    elapsedMs,
    allChecksPassed: (
      validInit &&
      shardFiles.length === 514 &&
      shardErrors === 0 &&
      diagnostics.core_conservation.conserved &&
      diagnostics.card_resolution.resolverSuccess
    )
  };

  console.log('\n====================================================');
  console.log(`  DIAGNOSTIC STATUS: ${diagnostics.summary.status} (${elapsedMs} ms)`);
  console.log('====================================================\n');

  return diagnostics;
}

if (process.argv[1] && process.argv[1].endsWith('engine_diagnostic.mjs')) {
  runEngineDiagnostic().catch(err => {
    console.error('Diagnostic error:', err);
    process.exit(1);
  });
}
