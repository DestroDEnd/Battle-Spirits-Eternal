/**
 * scripts/evidence_registry.mjs
 *
 * Executable, test-traceable Operation, Variant, and Condition Evidence Registry.
 * Replaces manual allowlists with verifiable references to production handlers
 * and existing reproducible test files/identifiers.
 */

export const VERIFIED_TIMINGS = new Set([
  'WHEN_SUMMONED', 'WHEN_ATTACKS', 'WHEN_BLOCKS', 'WHEN_DESTROYED',
  'BURST', 'FLASH', 'MAIN', 'MAIN_STEP', 'PASSIVE', 'ATTACK_STEP',
  'START_STEP', 'END_STEP', 'WHEN_ADVENTS', 'TURN_TRIGGER', 'NONE'
]);

export const MANUAL_REVIEW_REASONS = {
  AMBIGUOUS_WORDING: 'Ambiguous original wording',
  MISSING_OR_CONTRADICTORY_PARAMS: 'Missing or contradictory IR parameters',
  UNVERIFIED_TRIGGER_TIMING: 'Unverified trigger timing',
  UNVERIFIED_TARGET_SEMANTICS: 'Unverified target semantics',
  UNRESOLVED_REPLACEMENT_INTERACTION: 'Unresolved replacement interaction',
  UNSUPPORTED_CONDITION_FORM: 'Unsupported condition form',
  UNSUPPORTED_OPERATION_VARIANT: 'Unsupported operation variant',
  INCOMPLETE_RULES_INTERPRETATION: 'Incomplete official-rules interpretation',
  MISSING_SEMANTIC_TEST_EVIDENCE: 'Missing semantic test evidence'
};

function hasAnyParamKey(opObj, keys = []) {
  return keys.some(k => opObj[k] !== undefined && opObj[k] !== null && opObj[k] !== '');
}

function makeContract(op, category, spec = {}) {
  return {
    op,
    category,
    requiredParams: spec.requiredParams || [],
    requiredAnyOf: spec.requiredAnyOf || [],
    optionalParams: spec.optionalParams || [],
    paramTypes: spec.paramTypes || {},
    targeting: spec.targeting || 'none',
    conditions: spec.conditions || 'tri_state_required',
    timings: spec.timings || ['ANY'],
    sourceZones: spec.sourceZones || [],
    destinationZones: spec.destinationZones || [],
    events: spec.events || [],
    atomicRollback: Boolean(spec.atomicRollback),
    dependencies: spec.dependencies || ['engine/ops/index.js']
  };
}

export const OPERATION_CONTRACTS = {
  // Core existing operations
  DRAW: makeContract('DRAW', 'runtime_action', { optionalParams: ['count', 'side', 'amount'], paramTypes: { count: 'number', side: 'string' }, sourceZones: ['deck'], destinationZones: ['hand'], events: ['CARD_DRAWN'], dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  BP_BUFF: makeContract('BP_BUFF', 'modifier', { optionalParams: ['amount', 'target', 'duration', 'all', 'forEach'], targeting: 'target_spec', events: ['MODIFIER_ADDED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  BP_DEBUFF: makeContract('BP_DEBUFF', 'modifier', { optionalParams: ['amount', 'target', 'duration', 'all'], targeting: 'target_spec', events: ['MODIFIER_ADDED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  DESTROY: makeContract('DESTROY', 'runtime_action', { optionalParams: ['target', 'filter', 'count', 'allowProtectionBypass', 'destination'], paramTypes: { count: 'number' }, targeting: 'target_spec', sourceZones: ['field'], destinationZones: ['grave', 'banished'], events: ['CARD_DESTROYED', 'CARD_MOVED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/selectors.js', 'engine/zones.js', 'engine/continuous.js'] }),
  BOUNCE: makeContract('BOUNCE', 'runtime_action', { optionalParams: ['target', 'destination', 'to', 'count'], paramTypes: { destination: 'string', count: 'number' }, targeting: 'target_spec', sourceZones: ['field'], destinationZones: ['hand', 'deck', 'grave'], events: ['CARD_BOUNCED', 'CARD_MOVED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  EXHAUST: makeContract('EXHAUST', 'runtime_action', { optionalParams: ['target', 'count', 'isHeavy'], targeting: 'target_spec', events: ['CARD_EXHAUSTED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/selectors.js', 'engine/continuous.js'] }),
  REFRESH: makeContract('REFRESH', 'runtime_action', { optionalParams: ['target', 'count'], targeting: 'target_spec', events: ['CARD_REFRESHED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/selectors.js', 'engine/continuous.js'] }),
  MOVE_CORE: makeContract('MOVE_CORE', 'runtime_action', { optionalParams: ['count', 'from', 'to', 'isSoulCore', 'side', 'source', 'destination'], sourceZones: ['void', 'reserve', 'field', 'life', 'trash'], destinationZones: ['reserve', 'field', 'trash', 'void', 'life'], events: ['CORE_MOVED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  SUMMON: makeContract('SUMMON', 'runtime_action', { optionalParams: ['from', 'target', 'filter', 'cost', 'count', 'ignoreCost'], targeting: 'target_spec', sourceZones: ['hand', 'grave', 'deck', 'banished', 'soul'], destinationZones: ['field'], events: ['CARD_SUMMONED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/payment.js', 'engine/zones.js'] }),
  SUMMON_FREE: makeContract('SUMMON_FREE', 'runtime_action', { optionalParams: ['from', 'target', 'filter', 'count'], targeting: 'target_spec', sourceZones: ['hand', 'grave', 'deck', 'soul'], destinationZones: ['field'], events: ['CARD_SUMMONED'], atomicRollback: true }),
  REVEAL_CARDS: makeContract('REVEAL_CARDS', 'runtime_action', { requiredAnyOf: ['count', 'from'], optionalParams: ['side', 'keepZone'], sourceZones: ['deck', 'hand'], events: ['CARDS_REVEALED'] }),
  REPLACEMENT_EFFECT: makeContract('REPLACEMENT_EFFECT', 'persistent_rule', { requiredAnyOf: ['replaces', 'replacementZone'], optionalParams: ['target', 'duration', 'condition', 'count'], events: ['REPLACEMENT_EFFECT_REGISTERED'], dependencies: ['engine/zones.js', 'engine/continuous.js'] }),

  // Group A: Effect activation and trigger systems
  ACTIVATE_EFFECT_ACTION: makeContract('ACTIVATE_EFFECT_ACTION', 'trigger_registration', { requiredAnyOf: ['keyword', 'action', 'effectName', 'timing'], optionalParams: ['target', 'filter', 'side', 'ignoreCost', 'ignoreCondition'], targeting: 'target_spec', events: ['EFFECT_ACTIVATED', 'KEYWORD_ACTIVATED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/resolver.js', 'engine/triggers.js'] }),
  ACTIVATE_EFFECT_SPECIAL: makeContract('ACTIVATE_EFFECT_SPECIAL', 'modifier', { requiredAnyOf: ['per', 'repeatPer', 'multiplier', 'condition', 'mode', 'count'], optionalParams: ['threshold', 'maxRepeats', 'target'], events: ['SPECIAL_ACTIVATION_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/resolver.js'] }),
  ACTIVATE_TRIGGER: makeContract('ACTIVATE_TRIGGER', 'trigger_registration', { requiredAnyOf: ['trigger', 'timing', 'effectType'], optionalParams: ['target', 'filter', 'side', 'oncePerTurn'], targeting: 'target_spec', events: ['TRIGGER_ACTIVATED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/triggers.js', 'engine/resolver.js'] }),
  TRIGGERED_WATCHER: makeContract('TRIGGERED_WATCHER', 'trigger_registration', { requiredAnyOf: ['watchEvent', 'event', 'trigger', 'action', 'cardType'], optionalParams: ['side', 'duration', 'filter', 'effect'], events: ['WATCHER_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/triggers.js'] }),
  TRIGGER_CONDITION: makeContract('TRIGGER_CONDITION', 'trigger_registration', { requiredAnyOf: ['event', 'condition', 'trigger', 'timing'], optionalParams: ['side', 'location', 'effect'], events: ['TRIGGER_CONDITION_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/conditions.js', 'engine/triggers.js'] }),
  TRIGGER_COUNTER: makeContract('TRIGGER_COUNTER', 'trigger_registration', { requiredAnyOf: ['counterTiming', 'when', 'trigger', 'zone'], optionalParams: ['side', 'effect', 'cost'], sourceZones: ['hand', 'field'], events: ['COUNTER_TRIGGER_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/triggers.js'] }),
  CROSS_TRIGGER: makeContract('CROSS_TRIGGER', 'trigger_registration', { requiredAnyOf: ['lifeThreshold', 'condition', 'triggerMode'], optionalParams: ['afterTrigger', 'effect'], sourceZones: ['deck'], events: ['CROSS_ULTIMATE_TRIGGER'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/triggers.js'] }),
  BRAVE_EFFECT_ACTIVATION: makeContract('BRAVE_EFFECT_ACTIVATION', 'trigger_registration', { requiredAnyOf: ['when', 'timing', 'effect', 'trigger'], optionalParams: ['target', 'side'], targeting: 'target_spec', events: ['BRAVE_EFFECT_ACTIVATED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  ACTIVATE_KEYWORD: makeContract('ACTIVATE_KEYWORD', 'runtime_action', { requiredAnyOf: ['keyword'], optionalParams: ['target', 'side', 'filter', 'level', 'amount'], targeting: 'target_spec', events: ['KEYWORD_ACTIVATED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  ON_BP_DESTROY: makeContract('ON_BP_DESTROY', 'trigger_registration', { requiredAnyOf: ['whoseDestroyed', 'when', 'effect', 'condition'], optionalParams: ['side', 'clauses'], events: ['ON_BP_DESTROY_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/triggers.js'] }),

  // Group B: Advent, stack, and underneath-card systems
  CONTRACT_ADVENT_RULE: makeContract('CONTRACT_ADVENT_RULE', 'persistent_rule', { requiredAnyOf: ['zone', 'adventType', 'rule'], optionalParams: ['timing', 'targetFilter', 'cost'], sourceZones: ['soul', 'hand', 'banished'], events: ['ADVENT_RULE_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  ADVENT_RULE_MODIFIER: makeContract('ADVENT_RULE_MODIFIER', 'modifier', { requiredAnyOf: ['fromZone', 'adventType', 'modifier', 'rule', 'ignoreCondition'], optionalParams: ['target', 'duration'], events: ['ADVENT_MODIFIER_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  ADVENT_RULE: makeContract('ADVENT_RULE', 'persistent_rule', { requiredAnyOf: ['when', 'fromZone', 'adventType', 'rule'], optionalParams: ['target', 'timing'], events: ['ADVENT_RULE_REGISTERED'], dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  ADVENT: makeContract('ADVENT', 'runtime_action', { requiredAnyOf: ['from', 'target', 'filter', 'adventType'], optionalParams: ['cost', 'side'], targeting: 'target_spec', sourceZones: ['hand', 'soul', 'banished'], destinationZones: ['field'], events: ['CARD_ADVENTED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  ADVENT_COST: makeContract('ADVENT_COST', 'cost_payment', { requiredAnyOf: ['from', 'target'], optionalParams: ['filter'], targeting: 'target_spec', sourceZones: ['hand'], destinationZones: ['field'], events: ['ADVENT_COST_PAID'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  PUT_UNDERNEATH: makeContract('PUT_UNDERNEATH', 'runtime_action', { requiredAnyOf: ['from', 'count', 'target'], optionalParams: ['facedown', 'side', 'filter'], targeting: 'target_spec', sourceZones: ['deck', 'hand', 'grave', 'field'], destinationZones: ['underneath'], events: ['CARD_PUT_UNDERNEATH'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  ATTACH_CARD_UNDERNEATH: makeContract('ATTACH_CARD_UNDERNEATH', 'runtime_action', { requiredAnyOf: ['from', 'target', 'count'], optionalParams: ['facedown', 'filter', 'side'], targeting: 'target_spec', sourceZones: ['deck', 'hand', 'grave', 'field'], destinationZones: ['underneath'], events: ['CARD_PUT_UNDERNEATH'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  ATTACH_PRE_ADVENT_CARD: makeContract('ATTACH_PRE_ADVENT_CARD', 'runtime_action', { requiredAnyOf: ['from', 'target', 'count'], optionalParams: ['upTo', 'filter'], targeting: 'target_spec', sourceZones: ['field', 'hand', 'grave'], destinationZones: ['underneath'], events: ['PRE_ADVENT_ATTACHED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  CARD_UNDERNEATH: makeContract('CARD_UNDERNEATH', 'runtime_action', { requiredAnyOf: ['action', 'from', 'target', 'count'], optionalParams: ['facedown', 'destination'], targeting: 'target_spec', sourceZones: ['deck', 'underneath', 'hand'], destinationZones: ['underneath', 'grave', 'field'], events: ['CARD_UNDERNEATH_UPDATED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  DISCARD_UNDERNEATH_COST: makeContract('DISCARD_UNDERNEATH_COST', 'cost_payment', { requiredAnyOf: ['count', 'target', 'facedownOnly'], optionalParams: ['filter', 'source'], targeting: 'target_spec', sourceZones: ['underneath'], destinationZones: ['grave'], events: ['UNDERNEATH_CARD_DISCARDED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  STACK_CARD: makeContract('STACK_CARD', 'runtime_action', { requiredAnyOf: ['target', 'from'], optionalParams: ['facedown', 'preserveState', 'count'], targeting: 'target_spec', sourceZones: ['hand', 'field', 'soul'], destinationZones: ['field'], events: ['CARD_STACKED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  SWAP_CARD: makeContract('SWAP_CARD', 'runtime_action', { requiredAnyOf: ['target', 'filter', 'from'], optionalParams: ['preserveState', 'destination', 'side'], targeting: 'target_spec', sourceZones: ['hand', 'field'], destinationZones: ['field', 'hand'], events: ['CARDS_SWAPPED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  SWAP_CARDS: makeContract('SWAP_CARDS', 'runtime_action', { requiredAnyOf: ['from', 'to', 'filter', 'count'], optionalParams: ['side', 'upTo'], targeting: 'card_filter', sourceZones: ['revealed', 'hand', 'field'], destinationZones: ['hand', 'revealed', 'field'], events: ['CARDS_SWAPPED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),

  // Group C: Mirage systems
  MIRAGE_OPERATION: makeContract('MIRAGE_OPERATION', 'runtime_action', { requiredAnyOf: ['action', 'operation', 'mode'], optionalParams: ['side', 'target', 'cost'], sourceZones: ['mirage', 'hand'], destinationZones: ['grave', 'hand', 'mirage'], events: ['MIRAGE_UPDATED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  DISCARD_MIRAGE_COST: makeContract('DISCARD_MIRAGE_COST', 'cost_payment', { requiredAnyOf: ['count', 'filter', 'zone'], optionalParams: ['side'], sourceZones: ['mirage'], destinationZones: ['grave'], events: ['MIRAGE_DISCARDED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),

  // Group D: Effect copying and redirection
  COPY_EFFECT: makeContract('COPY_EFFECT', 'runtime_action', { requiredAnyOf: ['source', 'timing', 'target', 'from'], optionalParams: ['filter', 'replaces', 'recursive', 'ignoreLevels'], targeting: 'target_spec', events: ['EFFECT_COPIED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/resolver.js'] }),
  COPY_PRE_ADVENT_EFFECT: makeContract('COPY_PRE_ADVENT_EFFECT', 'modifier', { requiredAnyOf: ['filter', 'ignoreLevels', 'scope'], optionalParams: ['target', 'duration'], events: ['PRE_ADVENT_EFFECTS_GRANTED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  COPY_ABILITY: makeContract('COPY_ABILITY', 'modifier', { requiredAnyOf: ['abilityType', 'keyword', 'filter', 'from'], optionalParams: ['target', 'duration'], targeting: 'target_spec', events: ['ABILITY_COPIED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  MULTIPLY_EFFECT: makeContract('MULTIPLY_EFFECT', 'modifier', { requiredAnyOf: ['per', 'multiplier', 'countSource'], optionalParams: ['filter', 'maxCount'], events: ['EFFECT_MULTIPLIED'], dependencies: ['engine/ops/index.js', 'engine/resolver.js'] }),
  MODIFY_DESTINATION: makeContract('MODIFY_DESTINATION', 'modifier', { requiredAnyOf: ['destination', 'replaces', 'fromEffect'], optionalParams: ['target', 'duration'], destinationZones: ['banished', 'hand', 'deck', 'grave'], events: ['DESTINATION_MODIFIED'], dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  REDIRECT_TARGET: makeContract('REDIRECT_TARGET', 'modifier', { requiredAnyOf: ['newTarget', 'filter', 'bpMax', 'mode'], optionalParams: ['target', 'side', 'duration'], targeting: 'target_spec', events: ['TARGET_REDIRECTED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/selectors.js'] }),
  REDIRECT_CORE_DESTINATION: makeContract('REDIRECT_CORE_DESTINATION', 'modifier', { requiredAnyOf: ['destination', 'fromZone', 'cause'], optionalParams: ['side', 'filter', 'duration'], events: ['CORE_DESTINATION_REDIRECTED'], dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  LIFE_OR_CORE_MODIFICATION: makeContract('LIFE_OR_CORE_MODIFICATION', 'runtime_action', { requiredAnyOf: ['count', 'amount', 'destination', 'targetZone'], optionalParams: ['side', 'upTo', 'fromZone'], sourceZones: ['life', 'field', 'reserve'], destinationZones: ['grave', 'void', 'reserve', 'life'], events: ['CORE_MOVED', 'LIFE_CHANGED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),

  // Group E: Hand, deck, reveal, discard, and zone operations
  LOOK_HAND: makeContract('LOOK_HAND', 'runtime_action', { requiredAnyOf: ['side', 'target'], optionalParams: ['count', 'reveal'], sourceZones: ['hand'], events: ['HAND_LOOKED_AT'] }),
  LOOK_AT_HAND: makeContract('LOOK_AT_HAND', 'runtime_action', { requiredAnyOf: ['side', 'target'], optionalParams: ['count'], sourceZones: ['hand'], events: ['HAND_LOOKED_AT'] }),
  REVEAL_HAND: makeContract('REVEAL_HAND', 'runtime_action', { optionalParams: ['side', 'target'], sourceZones: ['hand'], events: ['HAND_REVEALED'] }),
  LOOK_AT_DECK: makeContract('LOOK_AT_DECK', 'runtime_action', { requiredAnyOf: ['count', 'position'], optionalParams: ['side', 'destination'], sourceZones: ['deck'], events: ['DECK_LOOKED_AT'] }),
  LOOK_DECKTOP: makeContract('LOOK_DECKTOP', 'runtime_action', { requiredAnyOf: ['count'], optionalParams: ['side', 'destination'], sourceZones: ['deck'], events: ['DECK_LOOKED_AT'] }),
  REVEAL_INTERACTION: makeContract('REVEAL_INTERACTION', 'trigger_registration', { requiredAnyOf: ['onRevealBy', 'destination', 'action'], optionalParams: ['side', 'filter', 'cost'], events: ['REVEAL_INTERACTION_TRIGGERED'], atomicRollback: true }),
  DISCARD_ZONE: makeContract('DISCARD_ZONE', 'runtime_action', { requiredAnyOf: ['zone', 'cardType', 'side'], optionalParams: ['count', 'filter', 'upTo'], targeting: 'card_filter', sourceZones: ['field', 'hand', 'mirage', 'burst'], destinationZones: ['grave'], events: ['CARD_DISCARDED'], atomicRollback: true }),
  DISCARD_AMONG: makeContract('DISCARD_AMONG', 'runtime_action', { requiredAnyOf: ['filter', 'color', 'count'], optionalParams: ['side', 'fromRevealed'], sourceZones: ['revealed'], destinationZones: ['grave'], events: ['CARD_DISCARDED'], atomicRollback: true }),
  DISCARD_FIELD: makeContract('DISCARD_FIELD', 'runtime_action', { requiredAnyOf: ['side', 'cardType', 'filter'], optionalParams: ['count'], targeting: 'card_filter', sourceZones: ['field'], destinationZones: ['grave'], events: ['CARD_DISCARDED'], atomicRollback: true }),
  DISCARD_FIELD_MAGIC: makeContract('DISCARD_FIELD_MAGIC', 'cost_payment', { requiredAnyOf: ['family', 'count', 'side'], optionalParams: ['filter'], sourceZones: ['field'], destinationZones: ['grave'], events: ['FIELD_MAGIC_DISCARDED'], atomicRollback: true }),
  DISCARD_FROM_FIELD_COST: makeContract('DISCARD_FROM_FIELD_COST', 'cost_payment', { requiredAnyOf: ['family', 'count', 'cardType'], optionalParams: ['side'], sourceZones: ['field'], destinationZones: ['grave'], events: ['FIELD_MAGIC_DISCARDED'], atomicRollback: true }),
  SEND_TO_TRASH: makeContract('SEND_TO_TRASH', 'runtime_action', { requiredAnyOf: ['target', 'from', 'count'], optionalParams: ['side', 'filter'], targeting: 'target_spec', sourceZones: ['field', 'hand', 'deck'], destinationZones: ['grave'], events: ['CARD_SENT_TO_TRASH'], atomicRollback: true }),
  PUT_CARD_ON_FIELD: makeContract('PUT_CARD_ON_FIELD', 'runtime_action', { requiredAnyOf: ['from', 'cardType', 'filter'], optionalParams: ['facedown', 'count', 'keyword', 'side'], sourceZones: ['hand', 'deck', 'grave', 'banished'], destinationZones: ['field'], events: ['CARD_PLACED_ON_FIELD'], atomicRollback: true }),
  PUT_FACEDOWN_FIELD: makeContract('PUT_FACEDOWN_FIELD', 'cost_payment', { requiredAnyOf: ['from', 'family', 'filter', 'count'], optionalParams: ['side'], sourceZones: ['hand', 'deck'], destinationZones: ['field'], events: ['FACEDOWN_CARD_PLACED'], atomicRollback: true }),
  USE_FROM_HAND: makeContract('USE_FROM_HAND', 'runtime_action', { requiredAnyOf: ['cardType', 'timing', 'filter'], optionalParams: ['ignoreCost', 'side'], sourceZones: ['hand'], destinationZones: ['field', 'grave'], events: ['CARD_USED_FROM_HAND'], atomicRollback: true }),
  CAST_FROM_TRASH: makeContract('CAST_FROM_TRASH', 'persistent_rule', { requiredAnyOf: ['condition', 'scope', 'zone'], optionalParams: ['ignoreCost'], sourceZones: ['grave'], events: ['CAST_FROM_TRASH_ENABLED'] }),
  LIMIT_DECK_DISCARD: makeContract('LIMIT_DECK_DISCARD', 'modifier', { requiredAnyOf: ['maxPerTurn', 'limit'], optionalParams: ['sourceSide', 'duration', 'targetSide'], events: ['DECK_DISCARD_LIMIT_SET'] }),
  MILL: makeContract('MILL', 'runtime_action', { requiredAnyOf: ['count', 'amount'], optionalParams: ['side'], sourceZones: ['deck'], destinationZones: ['grave'], events: ['DECK_MILLED'], atomicRollback: true }),
  SHUFFLE_DECK: makeContract('SHUFFLE_DECK', 'runtime_action', { optionalParams: ['side', 'seed'], sourceZones: ['deck'], destinationZones: ['deck'], events: ['DECK_SHUFFLED'] }),

  // Group F: Combat and battle operations
  CHOOSE_BLOCKER: makeContract('CHOOSE_BLOCKER', 'runtime_action', { requiredAnyOf: ['when', 'mode', 'target', 'filter'], optionalParams: ['side', 'count'], targeting: 'target_spec', events: ['BLOCKER_CHOSEN'] }),
  FORCE_ATTACK: makeContract('FORCE_ATTACK', 'modifier', { requiredAnyOf: ['side', 'minAttacks', 'target'], optionalParams: ['duration', 'filter'], events: ['FORCED_ATTACK_SET'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  PIERCING_RULE: makeContract('PIERCING_RULE', 'modifier', { requiredAnyOf: ['allowedPrevention', 'bypasses', 'effectType'], optionalParams: ['duration', 'side'], events: ['PIERCING_RULE_SET'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  BATTLE_RULE_MODIFIER: makeContract('BATTLE_RULE_MODIFIER', 'modifier', { requiredAnyOf: ['rule', 'mode', 'effect'], optionalParams: ['side', 'duration'], events: ['BATTLE_RULE_MODIFIED'], dependencies: ['engine/ops/index.js', 'engine/index.js'] }),
  BATTLE_MODIFIER: makeContract('BATTLE_MODIFIER', 'modifier', { requiredAnyOf: ['maxBattles', 'rule', 'mode'], optionalParams: ['target', 'duration'], events: ['BATTLE_MODIFIED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  FLASH_PRIORITY: makeContract('FLASH_PRIORITY', 'timing_instruction', { optionalParams: ['side', 'duration', 'step'], events: ['FLASH_PRIORITY_SET'] }),
  RESTRICT_MAIN_STEP: makeContract('RESTRICT_MAIN_STEP', 'persistent_rule', { optionalParams: ['scope', 'action'], events: ['MAIN_STEP_RESTRICTION_SET'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  DESTROY_ON_BP_ZERO: makeContract('DESTROY_ON_BP_ZERO', 'runtime_action', { optionalParams: ['side', 'scope', 'allowProtectionBypass'], destinationZones: ['grave'], events: ['BP_ZERO_DESTRUCTION_APPLIED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),

  // Group G & remaining operations
  GLOBAL_RESTRICTION: makeContract('GLOBAL_RESTRICTION', 'persistent_rule', { requiredAnyOf: ['restriction', 'action', 'cannot'], optionalParams: ['side', 'duration', 'cause', 'filter'], events: ['RESTRICTION_SET'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  DECK_BUILDING_RULE: makeContract('DECK_BUILDING_RULE', 'compiler_metadata', { requiredAnyOf: ['maxCopies', 'rule'], optionalParams: ['cardNumber'], events: ['DECK_RULE_ATTACHED'], dependencies: ['engine/ops/index.js', 'engine/rules/eternal.js'] }),
  DECK_CONSTRUCTION_RULE: makeContract('DECK_CONSTRUCTION_RULE', 'compiler_metadata', { requiredAnyOf: ['maxCopies', 'rule'], optionalParams: ['cardNumber'], events: ['DECK_RULE_ATTACHED'], dependencies: ['engine/ops/index.js', 'engine/rules/eternal.js'] }),
  DECK_RULE: makeContract('DECK_RULE', 'compiler_metadata', { requiredAnyOf: ['maxCopies', 'rule'], optionalParams: ['cardNumber'], events: ['DECK_RULE_ATTACHED'], dependencies: ['engine/ops/index.js', 'engine/rules/eternal.js'] }),
  GAIN_TEAM: makeContract('GAIN_TEAM', 'modifier', { requiredAnyOf: ['teams', 'scope', 'allTeams'], optionalParams: ['target', 'duration'], events: ['TEAM_GRANTED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  TEAM_RULE: makeContract('TEAM_RULE', 'modifier', { requiredAnyOf: ['teams', 'scope', 'allTeams'], optionalParams: ['target', 'duration'], events: ['TEAM_GRANTED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  BUNSHIN_SUMMON: makeContract('BUNSHIN_SUMMON', 'runtime_action', { requiredAnyOf: ['count', 'from', 'coresMin'], optionalParams: ['facedown', 'side'], sourceZones: ['deck', 'reserve'], destinationZones: ['field'], events: ['BUNSHIN_SUMMONED'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  CREATE_BUNSHIN: makeContract('CREATE_BUNSHIN', 'runtime_action', { requiredAnyOf: ['count'], optionalParams: ['from', 'coresMin', 'upTo'], sourceZones: ['deck', 'reserve'], destinationZones: ['field'], events: ['BUNSHIN_SUMMONED'], atomicRollback: true }),
  FLIP_BUNSHIN: makeContract('FLIP_BUNSHIN', 'runtime_action', { optionalParams: ['target', 'count'], targeting: 'target_spec', events: ['BUNSHIN_FLIPPED'], atomicRollback: true }),
  TARGET_FAMILY: makeContract('TARGET_FAMILY', 'runtime_action', { requiredAnyOf: ['families', 'mode', 'count'], optionalParams: ['side'], events: ['FAMILY_CHOSEN'] }),
  CHOOSE_FAMILY: makeContract('CHOOSE_FAMILY', 'runtime_action', { requiredAnyOf: ['families', 'options'], optionalParams: ['side'], events: ['FAMILY_CHOSEN'] }),
  DECK_IMMUNITY: makeContract('DECK_IMMUNITY', 'modifier', { optionalParams: ['side', 'duration'], events: ['DECK_IMMUNITY_SET'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  ENTER_SOUL_STATE: makeContract('ENTER_SOUL_STATE', 'runtime_action', { optionalParams: ['target', 'onDepleted'], targeting: 'target_spec', sourceZones: ['field', 'grave'], destinationZones: ['soul'], events: ['ENTERED_SOUL_STATE'], atomicRollback: true, dependencies: ['engine/ops/index.js', 'engine/zones.js'] }),
  USE_FROM_SOUL_STATE: makeContract('USE_FROM_SOUL_STATE', 'persistent_rule', { optionalParams: ['cardType', 'timing'], sourceZones: ['soul'], events: ['USE_FROM_SOUL_STATE_ENABLED'] }),
  ACTIVATE_REBIRTH: makeContract('ACTIVATE_REBIRTH', 'runtime_action', { optionalParams: ['target', 'side'], events: ['REBIRTH_ACTIVATED'], atomicRollback: true }),
  ACTIVATE_SOUL_DRIVE: makeContract('ACTIVATE_SOUL_DRIVE', 'runtime_action', { requiredAnyOf: ['target', 'scope', 'filter'], optionalParams: ['side'], targeting: 'target_spec', events: ['SOUL_DRIVE_ACTIVATED'], atomicRollback: true }),
  RETRIEVE_CORES: makeContract('RETRIEVE_CORES', 'runtime_action', { requiredAnyOf: ['count', 'from', 'to'], optionalParams: ['excludeSoulCore', 'upTo', 'side'], sourceZones: ['grave', 'field'], destinationZones: ['reserve', 'field'], events: ['CORE_MOVED'], atomicRollback: true }),
  SYMBOL_MODIFIER: makeContract('SYMBOL_MODIFIER', 'modifier', { requiredAnyOf: ['cardType', 'symbols', 'color'], optionalParams: ['side', 'duration'], events: ['SYMBOL_MODIFIER_APPLIED'], dependencies: ['engine/ops/index.js', 'engine/payment.js'] }),
  COUNT_MODIFIER: makeContract('COUNT_MODIFIER', 'modifier', { requiredAnyOf: ['multiplier', 'countAs', 'cardType'], optionalParams: ['filter', 'forScope', 'duration'], events: ['COUNT_MODIFIER_APPLIED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  COUNT_AS_MULTIPLE: makeContract('COUNT_AS_MULTIPLE', 'modifier', { requiredAnyOf: ['countAs', 'cardType'], optionalParams: ['filter', 'duration'], events: ['COUNT_MODIFIER_APPLIED'] }),
  BP_FORMULA: makeContract('BP_FORMULA', 'modifier', { requiredAnyOf: ['per', 'multiplier', 'amountPerCore'], optionalParams: ['target', 'duration'], events: ['BP_FORMULA_APPLIED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] }),
  END_STEP: makeContract('END_STEP', 'timing_instruction', { optionalParams: ['targetStep', 'immediate'], events: ['STEP_ENDED'] }),
  SPECIAL_WIN: makeContract('SPECIAL_WIN', 'runtime_action', { requiredAnyOf: ['winner', 'condition', 'reason'], optionalParams: ['side'], events: ['GAME_ENDED'] }),
  WIN_GAME: makeContract('WIN_GAME', 'runtime_action', { optionalParams: ['winner', 'loser', 'reason'], events: ['GAME_ENDED'] }),
  LOSE_EFFECTS: makeContract('LOSE_EFFECTS', 'modifier', { requiredAnyOf: ['target', 'cannotGainNew', 'scope'], optionalParams: ['duration', 'filter'], targeting: 'target_spec', events: ['EFFECTS_LOST'], dependencies: ['engine/ops/index.js', 'engine/continuous.js', 'engine/resolver.js'] }),
  TREAT_AS_VANILLA: makeContract('TREAT_AS_VANILLA', 'modifier', { optionalParams: ['target', 'duration'], targeting: 'target_spec', events: ['EFFECTS_LOST'], dependencies: ['engine/ops/index.js', 'engine/resolver.js'] }),
  ADD_FAMILY: makeContract('ADD_FAMILY', 'modifier', { requiredAnyOf: ['families', 'family'], optionalParams: ['target', 'duration'], targeting: 'target_spec', events: ['FAMILY_ADDED'], dependencies: ['engine/ops/index.js', 'engine/continuous.js'] })
};

export function inferOpVariant(opObj) {
  if (!opObj || !opObj.op) return 'UNKNOWN';
  const op = String(opObj.op);
  if (op === 'BOUNCE') {
    const dest = String(opObj.destination || opObj.to || 'hand').toLowerCase();
    if (dest.includes('bottom')) return 'BOUNCE:deck_bottom';
    if (dest.includes('top')) return 'BOUNCE:deck_top';
    if (dest === 'grave' || dest === 'trash') return 'BOUNCE:grave';
    if (dest === 'deck') return 'BOUNCE:deck_ambiguous';
    return 'BOUNCE:hand';
  }
  if (op === 'SUMMON' || op === 'SUMMON_FREE') {
    const from = String(opObj.from || 'HAND').toUpperCase();
    return `${op}:from_${from}`;
  }
  if (op === 'REVEAL_CARDS') {
    if (!opObj.count && !opObj.from) return 'REVEAL_CARDS:bare_stub';
    const from = String(opObj.from || 'DECK').toUpperCase();
    const side = String(opObj.side || 'self').toLowerCase();
    return `REVEAL_CARDS:${from}_${side}`;
  }
  if (op === 'REPLACEMENT_EFFECT') {
    if (!opObj.replaces && !opObj.replacementZone) return 'REPLACEMENT_EFFECT:bare_stub';
    return `REPLACEMENT_EFFECT:${opObj.replaces || 'GENERIC'}_to_${opObj.replacementZone || 'unknown'}`;
  }

  const contract = OPERATION_CONTRACTS[op];
  if (contract) {
    if (contract.requiredParams.some(k => !hasAnyParamKey(opObj, [k]))) {
      return `${op}:bare_stub`;
    }
    if (contract.requiredAnyOf.length > 0 && !hasAnyParamKey(opObj, contract.requiredAnyOf)) {
      return `${op}:bare_stub`;
    }
    if (op === 'ACTIVATE_EFFECT_ACTION') {
      return `ACTIVATE_EFFECT_ACTION:${opObj.keyword || opObj.action || opObj.timing || 'parameterized'}`;
    }
    if (op === 'ACTIVATE_TRIGGER') {
      return `ACTIVATE_TRIGGER:${opObj.trigger || opObj.timing || 'parameterized'}`;
    }
    if (op === 'MODIFY_DESTINATION') {
      return `MODIFY_DESTINATION:${opObj.destination || opObj.replaces || 'parameterized'}`;
    }
    if (op === 'GLOBAL_RESTRICTION') {
      return `GLOBAL_RESTRICTION:${opObj.restriction || opObj.action || 'parameterized'}`;
    }
    if (op === 'DISCARD_ZONE' || op === 'DISCARD_FIELD') {
      return `${op}:${opObj.cardType || opObj.zone || 'parameterized'}_${opObj.side || 'self'}`;
    }
    if (op === 'DISCARD_FIELD_MAGIC' || op === 'DISCARD_FROM_FIELD_COST') {
      return `${op}:${opObj.family || opObj.cardType || 'Magic'}`;
    }
    if (op === 'MILL') {
      return 'MILL:decktop';
    }
    if (op === 'PUT_UNDERNEATH' || op === 'ATTACH_CARD_UNDERNEATH' || op === 'CARD_UNDERNEATH') {
      return `${op}:from_${opObj.from || opObj.action || 'decktop'}`;
    }
    if (op === 'ADD_FAMILY') {
      return 'ADD_FAMILY:families';
    }
    if (op === 'TREAT_NAME') {
      return 'TREAT_NAME:alias';
    }
  }
  return `${op}:default`;
}

export const OPERATION_EVIDENCE_REGISTRY = {
  DRAW: {
    supportedParamSchema: { required: [], optional: ['count', 'side', 'amount'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DRAW\'',
    variants: {
      'DRAW:default': {
        testFile: 'tests/effect_execution_targeting_conditions.test.js',
        testIds: ['OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports grave/deck_bottom, DRAW emits CARD_DRAWN'],
        testedSuccessBehavior: 'Draws N cards from deck to hand and emits CARD_DRAWN',
        testedRejectionBehavior: 'Handles empty deck / deck-out without inventing cards',
        stateInvariantsAsserted: ['card_conservation', 'zone_exclusivity'],
        eventBehaviorAsserted: ['CARD_DRAWN']
      }
    }
  },
  DESTROY: {
    supportedParamSchema: { required: ['target'], optional: ['count', 'filter', 'isCost'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DESTROY\'',
    variants: {
      'DESTROY:default': {
        testFile: 'tests/effect_execution_targeting_conditions.test.js',
        testIds: ['OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports grave/deck_bottom, DRAW emits CARD_DRAWN', 'PERF-TARGET-01: 200-candidate resolveTargets, multi-target DESTROY, and 1,000 BP recalculations finish quickly'],
        testedSuccessBehavior: 'Destroys legal targets, respects IMMUNITY/PROTECTION, sends stack+cores properly',
        testedRejectionBehavior: 'Skips protected targets, returns NO_LEGAL_TARGETS when empty',
        stateInvariantsAsserted: ['card_conservation', 'core_conservation', 'protection_check'],
        eventBehaviorAsserted: ['DESTROYED', 'CARD_MOVED']
      }
    }
  },
  BOUNCE: {
    supportedParamSchema: { required: ['target'], optional: ['destination', 'to', 'count'] },
    explicitlyUnsupportedVariants: ['BOUNCE:deck_ambiguous'],
    productionHandlerRef: 'engine/ops/index.js:case \'BOUNCE\'',
    variants: {
      'BOUNCE:hand': {
        testFile: 'tests/phase4b2_destroy_bounce.test.js',
        testIds: ['9.1 BOUNCE with all: true bounces all matching spirits simultaneously without prompting'],
        testedSuccessBehavior: 'Returns target Spirit to owner hand and cores to reserve',
        testedRejectionBehavior: 'Fails closed on protected targets or missing target',
        stateInvariantsAsserted: ['card_conservation', 'core_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      },
      'BOUNCE:deck_bottom': {
        testFile: 'tests/effect_execution_targeting_conditions.test.js',
        testIds: ['OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports grave/deck_bottom, DRAW emits CARD_DRAWN'],
        testedSuccessBehavior: 'Returns target to bottom of owner deck',
        testedRejectionBehavior: 'Rejects ambiguous DECK without top/bottom',
        stateInvariantsAsserted: ['card_conservation', 'core_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      },
      'BOUNCE:grave': {
        testFile: 'tests/effect_execution_targeting_conditions.test.js',
        testIds: ['OPS-PRIORITY-01: DESTROY excludes protected targets, BOUNCE supports grave/deck_bottom, DRAW emits CARD_DRAWN'],
        testedSuccessBehavior: 'Sends target to owner grave',
        testedRejectionBehavior: 'Fails closed when no legal targets',
        stateInvariantsAsserted: ['card_conservation', 'core_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      },
      'BOUNCE:deck_top': {
        testFile: 'tests/phase4b2_destroy_bounce.test.js',
        testIds: ['5.1 BOUNCE to deck_top places single card at index 0 of owner deck'],
        testedSuccessBehavior: 'Returns target to top of owner deck',
        testedRejectionBehavior: 'Fails closed when no legal targets',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  MOVE_CORE: {
    supportedParamSchema: { required: ['count'], optional: ['from', 'to', 'isSoulCore', 'side'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'MOVE_CORE\'',
    variants: {
      'MOVE_CORE:default': {
        testFile: 'tests/core_game_rules_integrity_corrective.test.js',
        testIds: ['CORR-CORE-01: moveCore rejects unavailable Void normal/Soul cores and preserves all counts', 'CORR-CORE-02: moveCore rejects Life overdraw, enforces deduction === credit, and validates replacement destinations'],
        testedSuccessBehavior: 'Transfers cores with exact deduction === credit and Soul Core rules',
        testedRejectionBehavior: 'Rejects Void overdraw, Life overdraw, and illegal Soul Core to Void',
        stateInvariantsAsserted: ['core_conservation', 'soul_core_exclusivity'],
        eventBehaviorAsserted: ['CORE_MOVED']
      }
    }
  },
  SUMMON: {
    supportedParamSchema: { required: [], optional: ['from', 'initialCores', 'free', 'cost'] },
    explicitlyUnsupportedVariants: ['SUMMON:from_BURST'],
    productionHandlerRef: 'engine/ops/index.js:case \'SUMMON\'',
    variants: {
      'SUMMON:from_HAND': {
        testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
        testIds: ['C1-REG-03: SUMMON rejects invalid initialCores (0, negative, non-integer) before mutating card id', 'C1-REG-05: SUMMON rollback atomicity restores card to hand and preserves core total on CORE_PLACEMENT_FAILED'],
        testedSuccessBehavior: 'Pays cost, creates field stack, places LV1 cores, emits SUMMONED',
        testedRejectionBehavior: 'Rejects invalid initialCores before id mutation; rolls back on CORE_PLACEMENT_FAILED',
        stateInvariantsAsserted: ['core_conservation', 'card_conservation', 'no_partial_mutation'],
        eventBehaviorAsserted: ['CORE_MOVED', 'SUMMONED']
      }
    }
  },
  SUMMON_FREE: {
    supportedParamSchema: { required: [], optional: ['from', 'target', 'initialCores', 'filter'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SUMMON_FREE\'',
    variants: {
      'SUMMON_FREE:from_HAND': {
        testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
        testIds: ['C1-REG-04: SUMMON_FREE rejects CARD_ALREADY_ON_FIELD, DUPLICATE_CARD_OCCURRENCE, and INVALID_SOURCE_ZONE (from BURST)'],
        testedSuccessBehavior: 'Summons without paying cost and places LV1 cores',
        testedRejectionBehavior: 'Rejects CARD_ALREADY_ON_FIELD, DUPLICATE_CARD_OCCURRENCE, INVALID_SOURCE_ZONE',
        stateInvariantsAsserted: ['core_conservation', 'zone_exclusivity'],
        eventBehaviorAsserted: ['SUMMONED', 'CORE_MOVED']
      },
      'SUMMON_FREE:from_BURST': {
        testFile: 'tests/phase4b3_reveal_burst_replace_summon.test.js',
        testIds: ['3.1 Real Shard IR: BS60-034 (Eclair-Tiger) ACTIVATE_BURST resolves via AsyncResolver'],
        testedSuccessBehavior: 'Summons active burst card onto field with LV1 core',
        testedRejectionBehavior: 'Rejects if card not in burst or insufficient LV1 cores',
        stateInvariantsAsserted: ['core_conservation', 'zone_exclusivity'],
        eventBehaviorAsserted: ['SUMMONED']
      }
    }
  },
  REVEAL_CARDS: {
    supportedParamSchema: { required: ['count', 'from'], optional: ['side', 'isOptional'] },
    explicitlyUnsupportedVariants: ['REVEAL_CARDS:bare_stub'],
    productionHandlerRef: 'engine/ops/index.js:case \'REVEAL_CARDS\'',
    variants: {
      'REVEAL_CARDS:DECK_self': {
        testFile: 'tests/work_package_c2_evidence_and_compiler.test.js',
        testIds: ['WPC2-REV-01: BS69-036 (Medis) compiles structured REVEAL_CARDS and reveals exact 3 decktop cards', 'WPC2-REV-03: Structured REVEAL_CARDS handles undersized/empty deck and bare stub fails closed'],
        testedSuccessBehavior: 'Reveals exact count from self decktop, handles undersized/empty deck cleanly',
        testedRejectionBehavior: 'Bare REVEAL_CARDS without count/from fails closed as UNSUPPORTED',
        stateInvariantsAsserted: ['card_conservation', 'revealed_context_populated'],
        eventBehaviorAsserted: ['CARDS_REVEALED']
      },
      'REVEAL_CARDS:DECK_both': {
        testFile: 'tests/work_package_c2_evidence_and_compiler.test.js',
        testIds: ['WPC2-REV-02: BS64-X04 (Gefan-Gnis) compiles structured REVEAL_CARDS for both players'],
        testedSuccessBehavior: 'Reveals exact count from both players decktop',
        testedRejectionBehavior: 'Handles undersized/empty decks cleanly',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARDS_REVEALED']
      },
      'REVEAL_CARDS:HAND_self': {
        testFile: 'tests/work_package_c2_evidence_and_compiler.test.js',
        testIds: ['WPC2-REV-04: Structured REVEAL_CARDS from HAND preserves hand membership and populates context'],
        testedSuccessBehavior: 'Reveals from hand without removing cards from hand',
        testedRejectionBehavior: 'Handles empty hand cleanly',
        stateInvariantsAsserted: ['card_conservation', 'hand_preserved'],
        eventBehaviorAsserted: ['CARDS_REVEALED']
      }
    }
  },
  REPLACEMENT_EFFECT: {
    supportedParamSchema: { required: ['replaces', 'replacementZone'], optional: ['targetStackId', 'side', 'duration', 'trigger', 'target', 'cost'] },
    explicitlyUnsupportedVariants: ['REPLACEMENT_EFFECT:bare_stub'],
    productionHandlerRef: 'engine/ops/index.js:case \'REPLACEMENT_EFFECT\'',
    variants: {
      'REPLACEMENT_EFFECT:LIFE_CORE_to_void': {
        testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
        testIds: ['C1-REG-06: REPLACEMENT_EFFECT registers explicit replacement spec, rejects missing spec, and conserves cores on LIFE_CORE redirect'],
        testedSuccessBehavior: 'Redirects opposing life core reduction to Void instead of Reserve',
        testedRejectionBehavior: 'Bare REPLACEMENT_EFFECT without spec returns UNSUPPORTED/MISSING_REPLACEMENT_SPEC',
        stateInvariantsAsserted: ['core_conservation'],
        eventBehaviorAsserted: ['CORE_MOVED', 'REPLACEMENT_EFFECT_APPLIED']
      },
      'REPLACEMENT_EFFECT:CORE_ADDITION_to_life': {
        testFile: 'tests/work_package_c2_evidence_and_compiler.test.js',
        testIds: ['WPC2-REP-01: BS42-052 compiles CORE_ADDITION->life replacement, redirects with Void core conservation & LIFE_RECOVERED'],
        testedSuccessBehavior: 'Redirects opposing Void core addition to player Life and emits LIFE_RECOVERED',
        testedRejectionBehavior: 'Rejects when Void has 0 cores',
        stateInvariantsAsserted: ['core_conservation'],
        eventBehaviorAsserted: ['LIFE_RECOVERED', 'CORE_MOVED']
      },
      'REPLACEMENT_EFFECT:CORE_ADDITION_to_field': {
        testFile: 'tests/work_package_c2_evidence_and_compiler.test.js',
        testIds: ['WPC2-REP-02: BS24-013 compiles CORE_ADDITION->field replacement and validates targetStackId'],
        testedSuccessBehavior: 'Redirects Void core addition to valid targetStackId on field',
        testedRejectionBehavior: 'Rejects missing/invalid targetStackId with zero partial mutation',
        stateInvariantsAsserted: ['core_conservation', 'no_partial_mutation'],
        eventBehaviorAsserted: ['REPLACEMENT_EFFECT_APPLIED', 'CORE_MOVED']
      }
    }
  },
  BP_BUFF: {
    supportedParamSchema: { required: [], optional: ['amount', 'target', 'duration', 'all', 'forEach'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BP_BUFF\'',
    variants: {
      'BP_BUFF:default': {
        testFile: 'tests/real_card_semantic_validation.test.js',
        testIds: ['REAL-CARD-04: BS01-077 Baby-Loki (Spirit, White) WHEN_BLOCKS boosts effective BP during battle'],
        testedSuccessBehavior: 'Registers BP_BUFF modifier consumed by computeEffectiveBP',
        testedRejectionBehavior: 'Respects duration expiration',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  BP_DEBUFF: {
    supportedParamSchema: { required: [], optional: ['amount', 'target', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BP_DEBUFF\'',
    variants: {
      'BP_DEBUFF:default': {
        testFile: 'tests/work_package_fg_targeting_conditions_continuous.test.js',
        testIds: ['WPFG-INT: Continuous BP debuff enables threshold DESTROY and FlowController respects CANNOT_REFRESH'],
        testedSuccessBehavior: 'Registers BP_DEBUFF modifier reducing opposing effective BP',
        testedRejectionBehavior: 'Returns false when no opposing candidates exist',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  EXHAUST: {
    supportedParamSchema: { required: ['target'], optional: ['count', 'isHeavy'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'EXHAUST\'',
    variants: {
      'EXHAUST:default': {
        testFile: 'tests/work_package_de_operations_and_cards.test.js',
        testIds: ['WPDE-D3: EXHAUST, REFRESH, RESTORE, and CANNOT_REFRESH enforce locks, HEAVY_EXHAUSTED downgrade, and FlowController integration'],
        testedSuccessBehavior: 'Exhausts or heavy-exhausts target stack',
        testedRejectionBehavior: 'Respects protection and empty candidate pool',
        stateInvariantsAsserted: ['stack_state_transition'],
        eventBehaviorAsserted: []
      }
    }
  },
  REFRESH: {
    supportedParamSchema: { required: [], optional: ['target', 'count'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'REFRESH\'',
    variants: {
      'REFRESH:default': {
        testFile: 'tests/work_package_de_operations_and_cards.test.js',
        testIds: ['WPDE-D3: EXHAUST, REFRESH, RESTORE, and CANNOT_REFRESH enforce locks, HEAVY_EXHAUSTED downgrade, and FlowController integration'],
        testedSuccessBehavior: 'Refreshes target stack (or downgrades HEAVY_EXHAUSTED -> EXHAUSTED)',
        testedRejectionBehavior: 'Respects CANNOT_REFRESH modifier',
        stateInvariantsAsserted: ['stack_state_transition'],
        eventBehaviorAsserted: []
      }
    }
  },
  SET_LEVEL: {
    supportedParamSchema: { required: ['value'], optional: ['targetStackId', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SET_LEVEL\'',
    variants: {
      'SET_LEVEL:default': {
        testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
        testIds: ['C1-REG-01: SET_LEVEL creates SET_LEVEL modifier and computeLevel reflects effective level'],
        testedSuccessBehavior: 'Creates SET_LEVEL modifier reflected by computeLevel',
        testedRejectionBehavior: 'Clamped to valid card levels [1..maxLevel]',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  COMPARE_LEVELS: {
    supportedParamSchema: { required: [], optional: ['target', 'targetStackId'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'COMPARE_LEVELS\'',
    variants: {
      'COMPARE_LEVELS:default': {
        testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
        testIds: ['C1-REG-02: COMPARE_LEVELS destroys opposing Spirit with strictly lower effective level'],
        testedSuccessBehavior: 'Compares computeLevel and destroys defeated opposing Spirit',
        testedRejectionBehavior: 'Does not destroy if opposing level is higher',
        stateInvariantsAsserted: ['card_conservation', 'core_conservation'],
        eventBehaviorAsserted: ['DESTROYED', 'CARD_MOVED']
      }
    }
  },
  SET_BP: {
    supportedParamSchema: { required: ['value'], optional: ['targetStackId', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SET_BP\'',
    variants: {
      'SET_BP:default': {
        testFile: 'tests/phase2b_state_and_modifiers.test.js',
        testIds: ['9. SET_BP, SET_LEVEL, and BP_OR_LEVEL_MODIFIER are consumed by computeEffectiveBP and computeLevel'],
        testedSuccessBehavior: 'Creates SET_BP modifier consumed by computeEffectiveBP',
        testedRejectionBehavior: 'Expires at duration boundary',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  RECOVER_LIFE: {
    supportedParamSchema: { required: [], optional: ['count', 'side'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'RECOVER_LIFE\'',
    variants: {
      'RECOVER_LIFE:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.9 - RECOVER_LIFE'],
        testedSuccessBehavior: 'Moves core from void to life and emits LIFE_RECOVERED',
        testedRejectionBehavior: 'Rejects when void cores insufficient',
        stateInvariantsAsserted: ['core_conservation'],
        eventBehaviorAsserted: ['LIFE_RECOVERED', 'CORE_MOVED']
      }
    }
  },
  PREVENT_LIFE_LOSS: {
    supportedParamSchema: { required: [], optional: ['duration', 'side'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'PREVENT_LIFE_LOSS\'',
    variants: {
      'PREVENT_LIFE_LOSS:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.10 - PREVENT_LIFE_LOSS'],
        testedSuccessBehavior: 'Blocks combat and effect life reduction for duration',
        testedRejectionBehavior: 'Expires at turn/battle boundary',
        stateInvariantsAsserted: ['core_conservation'],
        eventBehaviorAsserted: []
      }
    }
  },
  MILL_DECK: {
    supportedParamSchema: { required: [], optional: ['count', 'side'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'MILL_DECK\'',
    variants: {
      'MILL_DECK:default': {
        testFile: 'tests/real_card_semantic_validation.test.js',
        testIds: ['REAL-CARD-29'],
        testedSuccessBehavior: 'Moves top N cards from target deck to trash',
        testedRejectionBehavior: 'Handles undersized deck without error',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  DISCARD_HAND: {
    supportedParamSchema: { required: [], optional: ['count', 'side'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_HAND\'',
    variants: {
      'DISCARD_HAND:default': {
        testFile: 'tests/real_card_semantic_validation.test.js',
        testIds: ['REAL-CARD-15'],
        testedSuccessBehavior: 'Discards card from target hand to grave',
        testedRejectionBehavior: 'Handles empty hand cleanly',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  REVEAL_DECKTOP: {
    supportedParamSchema: { required: [], optional: ['count'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'REVEAL_DECKTOP\'',
    variants: {
      'REVEAL_DECKTOP:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.1 - REVEAL_DECKTOP'],
        testedSuccessBehavior: 'Reveals top N cards to revealed array and emits CARDS_REVEALED',
        testedRejectionBehavior: 'Handles empty deck cleanly',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARDS_REVEALED']
      }
    }
  },
  ADD_TO_HAND: {
    supportedParamSchema: { required: [], optional: ['count', 'filter', 'target'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ADD_TO_HAND\'',
    variants: {
      'ADD_TO_HAND:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.2 - ADD_TO_HAND'],
        testedSuccessBehavior: 'Moves matching revealed card to hand and removes from revealed',
        testedRejectionBehavior: 'Returns false if no matching revealed cards',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  DISCARD_REVEALED: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_REVEALED\'',
    variants: {
      'DISCARD_REVEALED:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.3 - DISCARD_REVEALED'],
        testedSuccessBehavior: 'Moves unchosen revealed cards to grave',
        testedRejectionBehavior: 'No-ops cleanly when revealed is empty',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  RETURN_REVEALED_BOTTOM: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'RETURN_REVEALED_BOTTOM\'',
    variants: {
      'RETURN_REVEALED_BOTTOM:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.4 - RETURN_REVEALED_BOTTOM'],
        testedSuccessBehavior: 'Returns unchosen revealed cards to bottom of deck',
        testedRejectionBehavior: 'No-ops cleanly when revealed is empty',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  DEPLOY_NEXUS: {
    supportedParamSchema: { required: [], optional: ['from', 'free'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DEPLOY_NEXUS\'',
    variants: {
      'DEPLOY_NEXUS:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.7 - DEPLOY_NEXUS'],
        testedSuccessBehavior: 'Deploys Nexus to field and nexus list with 0 core base',
        testedRejectionBehavior: 'Rejects when card missing',
        stateInvariantsAsserted: ['card_conservation', 'zone_exclusivity'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  IMMUNITY: {
    supportedParamSchema: { required: [], optional: ['immuneTo', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'IMMUNITY\'',
    variants: {
      'IMMUNITY:default': {
        testFile: 'tests/real_card_semantic_validation.test.js',
        testIds: ['REAL-CARD-10'],
        testedSuccessBehavior: 'Grants protection from opposing effects matching scope',
        testedRejectionBehavior: 'Expires at duration boundary',
        stateInvariantsAsserted: ['protection_check'],
        eventBehaviorAsserted: []
      }
    }
  },
  ADD_SYMBOL: {
    supportedParamSchema: { required: [], optional: ['color', 'count', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ADD_SYMBOL\'',
    variants: {
      'ADD_SYMBOL:default': {
        testFile: 'tests/real_card_semantic_validation.test.js',
        testIds: ['REAL-CARD-37'],
        testedSuccessBehavior: 'Adds symbol modifier reflected by computeSymbols',
        testedRejectionBehavior: 'Expires at duration boundary',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  GRANT_FAMILY: {
    supportedParamSchema: { required: ['family'], optional: ['target', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'GRANT_FAMILY\'',
    variants: {
      'GRANT_FAMILY:default': {
        testFile: 'tests/real_card_semantic_validation.test.js',
        testIds: ['REAL-CARD-27'],
        testedSuccessBehavior: 'Grants family modifier reflected by target matching',
        testedRejectionBehavior: 'Expires at duration boundary',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  SALVAGE: {
    supportedParamSchema: { required: [], optional: ['filter', 'count'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SALVAGE\'',
    variants: {
      'SALVAGE:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.11 - SALVAGE'],
        testedSuccessBehavior: 'Retrieves matching card from grave into hand',
        testedRejectionBehavior: 'Returns false when no matching card in grave',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  DISCARD_BURST: {
    supportedParamSchema: { required: [], optional: ['side'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_BURST\'',
    variants: {
      'DISCARD_BURST:default': {
        testFile: 'tests/m2_core_ops.test.js',
        testIds: ['M2.12 - DISCARD_BURST'],
        testedSuccessBehavior: 'Discards opposing set burst card to grave',
        testedRejectionBehavior: 'Returns false when no burst set',
        stateInvariantsAsserted: ['card_conservation'],
        eventBehaviorAsserted: ['CARD_MOVED']
      }
    }
  },
  ACTIVATE_BURST: {
    supportedParamSchema: { required: [], optional: ['isOptional'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ACTIVATE_BURST\'',
    variants: {
      'ACTIVATE_BURST:default': {
        testFile: 'tests/phase4b3_reveal_burst_replace_summon.test.js',
        testIds: ['3.1 Real Shard IR: BS60-034 (Eclair-Tiger) ACTIVATE_BURST resolves via AsyncResolver', '3.9 ACTIVATE_BURST: Optional decline retains card in Burst slot', '3.10 Real Shard IR: SD42-011 (Decade Kiva) ACTIVATE_BURST destroys spirits and summons'],
        testedSuccessBehavior: 'Clears burst slot, resolves burst ability, routes unplaced burst to grave',
        testedRejectionBehavior: 'Respects BURST_LOCK, optional decline, missing burst, and unsupported burst effects',
        stateInvariantsAsserted: ['card_conservation', 'zone_exclusivity'],
        eventBehaviorAsserted: ['BURST_ACTIVATED', 'CARD_MOVED']
      }
    }
  },
  SET_RESTRICTION: {
    supportedParamSchema: { required: ['restriction'], optional: ['side', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SET_RESTRICTION\'',
    variants: {
      'SET_RESTRICTION:default': {
        testFile: 'tests/real_card_semantic_validation.test.js',
        testIds: ['REAL-CARD-24'],
        testedSuccessBehavior: 'Registers SET_RESTRICTION modifier enforced by engine gates',
        testedRejectionBehavior: 'Expires at duration boundary',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  UNPREVENTABLE: {
    supportedParamSchema: { required: [], optional: ['scope', 'duration'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'UNPREVENTABLE\'',
    variants: {
      'UNPREVENTABLE:default': {
        testFile: 'tests/work_package_c_ops_conditions_compiler.test.js',
        testIds: ['WPC-4C4-OPS: implements UNPREVENTABLE, CONTINUE_BATTLE, CHANGE, COUNT_OPERATION, TOKEN_DEPLOYMENT, FORMAT_MARKER, CAST_MAGIC_FREE, and fails closed on bare stubs'],
        testedSuccessBehavior: 'Sets unpreventable context and modifier',
        testedRejectionBehavior: 'Respects scope and duration',
        stateInvariantsAsserted: ['modifier_layering'],
        eventBehaviorAsserted: []
      }
    }
  },
  CONTINUE_BATTLE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CONTINUE_BATTLE\'',
    variants: {
      'CONTINUE_BATTLE:default': {
        testFile: 'tests/work_package_c_ops_conditions_compiler.test.js',
        testIds: ['WPC-4C4-OPS: implements UNPREVENTABLE, CONTINUE_BATTLE, CHANGE, COUNT_OPERATION, TOKEN_DEPLOYMENT, FORMAT_MARKER, CAST_MAGIC_FREE, and fails closed on bare stubs'],
        testedSuccessBehavior: 'Marks battle continuation state on active combat',
        testedRejectionBehavior: 'Rejects outside active combat',
        stateInvariantsAsserted: ['combat_state'],
        eventBehaviorAsserted: []
      }
    }
  },
  PREVENT_LOSS: {
    supportedParamSchema: { required: [], optional: ['duration', 'side'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'PREVENT_LOSS\'',
    variants: {
      'PREVENT_LOSS:default': {
        testFile: 'tests/phase2b_state_and_modifiers.test.js',
        testIds: ['12. PREVENT_LOSS prevents game loss at 0 life and deck-out until modifier expires'],
        testedSuccessBehavior: 'Prevents life-0 and deck-out loss until modifier expires',
        testedRejectionBehavior: 'Expires cleanly at duration boundary',
        stateInvariantsAsserted: ['sba_win_loss'],
        eventBehaviorAsserted: []
      }
    }
  },
  FORMAT_MARKER: {
    supportedParamSchema: { required: [], optional: ['marker', 'format'] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'FORMAT_MARKER\'',
    variants: {
      'FORMAT_MARKER:default': {
        testFile: 'tests/work_package_c_ops_conditions_compiler.test.js',
        testIds: ['WPC-4C4-OPS: implements UNPREVENTABLE, CONTINUE_BATTLE, CHANGE, COUNT_OPERATION, TOKEN_DEPLOYMENT, FORMAT_MARKER, CAST_MAGIC_FREE, and fails closed on bare stubs'],
        testedSuccessBehavior: 'Attaches format marker to sourceCard',
        testedRejectionBehavior: 'No-ops safely without sourceCard',
        stateInvariantsAsserted: ['card_metadata'],
        eventBehaviorAsserted: []
      }
    }
  },
  ACTIVATE_EFFECT_ACTION: {
    supportedParamSchema: { required: ["keyword","action","effectName","timing"], optional: ["target","filter","side","ignoreCost","ignoreCondition"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ACTIVATE_EFFECT_ACTION\'',
    variants: {
          "ACTIVATE_EFFECT_ACTION:ACTIVATE_EFFECT": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_EFFECT_ACTION (ACTIVATE_EFFECT_ACTION:ACTIVATE_EFFECT) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_ACTIVATED",
                      "KEYWORD_ACTIVATED"
                ]
          },
          "ACTIVATE_EFFECT_ACTION:ULTIMATE_TRIGGER": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_EFFECT_ACTION (ACTIVATE_EFFECT_ACTION:ULTIMATE_TRIGGER) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_ACTIVATED",
                      "KEYWORD_ACTIVATED"
                ]
          },
          "ACTIVATE_EFFECT_ACTION:WHEN_ATTACKS": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_EFFECT_ACTION (ACTIVATE_EFFECT_ACTION:WHEN_ATTACKS) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_ACTIVATED",
                      "KEYWORD_ACTIVATED"
                ]
          },
          "ACTIVATE_EFFECT_ACTION:WHEN_MANIFESTS": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_EFFECT_ACTION (ACTIVATE_EFFECT_ACTION:WHEN_MANIFESTS) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_ACTIVATED",
                      "KEYWORD_ACTIVATED"
                ]
          },
          "ACTIVATE_EFFECT_ACTION:WHEN_SET": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_EFFECT_ACTION (ACTIVATE_EFFECT_ACTION:WHEN_SET) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_ACTIVATED",
                      "KEYWORD_ACTIVATED"
                ]
          },
          "ACTIVATE_EFFECT_ACTION:WHEN_SUMMONED": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_EFFECT_ACTION (ACTIVATE_EFFECT_ACTION:WHEN_SUMMONED) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_ACTIVATED",
                      "KEYWORD_ACTIVATED"
                ]
          }
    }
  },
  ACTIVATE_EFFECT_SPECIAL: {
    supportedParamSchema: { required: ["per","repeatPer","multiplier","condition","mode","count"], optional: ["threshold","maxRepeats","target"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ACTIVATE_EFFECT_SPECIAL\'',
    variants: {
          "ACTIVATE_EFFECT_SPECIAL:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_EFFECT_SPECIAL (ACTIVATE_EFFECT_SPECIAL:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "SPECIAL_ACTIVATION_REGISTERED"
                ]
          }
    }
  },
  ACTIVATE_KEYWORD: {
    supportedParamSchema: { required: ["keyword"], optional: ["target","side","filter","level","amount"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ACTIVATE_KEYWORD\'',
    variants: {
          "ACTIVATE_KEYWORD:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_KEYWORD (ACTIVATE_KEYWORD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "KEYWORD_ACTIVATED"
                ]
          }
    }
  },
  ACTIVATE_REBIRTH: {
    supportedParamSchema: { required: [], optional: ["target","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ACTIVATE_REBIRTH\'',
    variants: {
          "ACTIVATE_REBIRTH:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_REBIRTH (ACTIVATE_REBIRTH:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "REBIRTH_ACTIVATED"
                ]
          }
    }
  },
  ACTIVATE_TRIGGER: {
    supportedParamSchema: { required: ["trigger","timing","effectType"], optional: ["target","filter","side","oncePerTurn"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ACTIVATE_TRIGGER\'',
    variants: {
          "ACTIVATE_TRIGGER:WHEN_SUMMONED": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ACTIVATE_TRIGGER (ACTIVATE_TRIGGER:WHEN_SUMMONED) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "TRIGGER_ACTIVATED"
                ]
          }
    }
  },
  ADD_FAMILY: {
    supportedParamSchema: { required: ["families","family"], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ADD_FAMILY\'',
    variants: {
          "ADD_FAMILY:families": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes ADD_FAMILY (ADD_FAMILY:families) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "FAMILY_ADDED"
                ]
          }
    }
  },
  ADVENT_COST: {
    supportedParamSchema: { required: ["from","target"], optional: ["filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ADVENT_COST\'',
    variants: {
          "ADVENT_COST:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes ADVENT_COST (ADVENT_COST:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "ADVENT_COST_PAID"
                ]
          }
    }
  },
  ADVENT_RULE: {
    supportedParamSchema: { required: ["when","fromZone","adventType","rule"], optional: ["target","timing"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ADVENT_RULE\'',
    variants: {
          "ADVENT_RULE:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes ADVENT_RULE (ADVENT_RULE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "ADVENT_RULE_REGISTERED"
                ]
          }
    }
  },
  ADVENT_RULE_MODIFIER: {
    supportedParamSchema: { required: ["fromZone","adventType","modifier","rule","ignoreCondition"], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ADVENT_RULE_MODIFIER\'',
    variants: {
          "ADVENT_RULE_MODIFIER:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes ADVENT_RULE_MODIFIER (ADVENT_RULE_MODIFIER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "ADVENT_MODIFIER_REGISTERED"
                ]
          }
    }
  },
  ATTACH_CARD_UNDERNEATH: {
    supportedParamSchema: { required: ["from","target","count"], optional: ["facedown","filter","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ATTACH_CARD_UNDERNEATH\'',
    variants: {
          "ATTACH_CARD_UNDERNEATH:from_decktop": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes ATTACH_CARD_UNDERNEATH (ATTACH_CARD_UNDERNEATH:from_decktop) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_PUT_UNDERNEATH"
                ]
          },
          "ATTACH_CARD_UNDERNEATH:from_field": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes ATTACH_CARD_UNDERNEATH (ATTACH_CARD_UNDERNEATH:from_field) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_PUT_UNDERNEATH"
                ]
          },
          "ATTACH_CARD_UNDERNEATH:from_hand": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes ATTACH_CARD_UNDERNEATH (ATTACH_CARD_UNDERNEATH:from_hand) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_PUT_UNDERNEATH"
                ]
          }
    }
  },
  ATTACH_PRE_ADVENT_CARD: {
    supportedParamSchema: { required: ["from","target","count"], optional: ["upTo","filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ATTACH_PRE_ADVENT_CARD\'',
    variants: {
          "ATTACH_PRE_ADVENT_CARD:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes ATTACH_PRE_ADVENT_CARD (ATTACH_PRE_ADVENT_CARD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "PRE_ADVENT_ATTACHED"
                ]
          }
    }
  },
  ATTACK_RULE_MODIFIER: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ATTACK_RULE_MODIFIER\'',
    variants: {
          "ATTACK_RULE_MODIFIER:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes ATTACK_RULE_MODIFIER (ATTACK_RULE_MODIFIER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  BANISH_COST: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BANISH_COST\'',
    variants: {
          "BANISH_COST:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes BANISH_COST (BANISH_COST:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  BANISH_DESTINATION_RULE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BANISH_DESTINATION_RULE\'',
    variants: {
          "BANISH_DESTINATION_RULE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes BANISH_DESTINATION_RULE (BANISH_DESTINATION_RULE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  BANISH_SOUL_CORE_VOID: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BANISH_SOUL_CORE_VOID\'',
    variants: {
          "BANISH_SOUL_CORE_VOID:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes BANISH_SOUL_CORE_VOID (BANISH_SOUL_CORE_VOID:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  BATTLE_MODIFIER: {
    supportedParamSchema: { required: ["maxBattles","rule","mode"], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BATTLE_MODIFIER\'',
    variants: {
          "BATTLE_MODIFIER:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes BATTLE_MODIFIER (BATTLE_MODIFIER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BATTLE_MODIFIED"
                ]
          }
    }
  },
  BATTLE_MULTIPLE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BATTLE_MULTIPLE\'',
    variants: {
          "BATTLE_MULTIPLE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes BATTLE_MULTIPLE (BATTLE_MULTIPLE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  BATTLE_RULE_MODIFIER: {
    supportedParamSchema: { required: ["rule","mode","effect"], optional: ["side","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BATTLE_RULE_MODIFIER\'',
    variants: {
          "BATTLE_RULE_MODIFIER:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPF-01: Group F combat ops integrate PIERCING_RULE, BATTLE_RULE_MODIFIER, FLASH_PRIORITY, RESTRICT_MAIN_STEP, and DESTROY_ON_BP_ZERO"
                ],
                "testedSuccessBehavior": "Executes BATTLE_RULE_MODIFIER (BATTLE_RULE_MODIFIER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BATTLE_RULE_MODIFIED"
                ]
          }
    }
  },
  BEFORE_ADVENT_TRIGGER: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BEFORE_ADVENT_TRIGGER\'',
    variants: {
          "BEFORE_ADVENT_TRIGGER:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes BEFORE_ADVENT_TRIGGER (BEFORE_ADVENT_TRIGGER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  BOUNCE_TO_DECKBOTTOM: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BOUNCE_TO_DECKBOTTOM\'',
    variants: {
          "BOUNCE_TO_DECKBOTTOM:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes BOUNCE_TO_DECKBOTTOM (BOUNCE_TO_DECKBOTTOM:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  BP_FORMULA: {
    supportedParamSchema: { required: ["per","multiplier","amountPerCore"], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BP_FORMULA\'',
    variants: {
          "BP_FORMULA:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes BP_FORMULA (BP_FORMULA:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BP_FORMULA_APPLIED"
                ]
          }
    }
  },
  BRAVE_EFFECT_ACTIVATION: {
    supportedParamSchema: { required: ["when","timing","effect","trigger"], optional: ["target","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'BRAVE_EFFECT_ACTIVATION\'',
    variants: {
          "BRAVE_EFFECT_ACTIVATION:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes BRAVE_EFFECT_ACTIVATION (BRAVE_EFFECT_ACTIVATION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BRAVE_EFFECT_ACTIVATED"
                ]
          }
    }
  },
  CAN_ATTACK: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CAN_ATTACK\'',
    variants: {
          "CAN_ATTACK:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes CAN_ATTACK (CAN_ATTACK:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  CARD_PLAY_PERMISSION: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CARD_PLAY_PERMISSION\'',
    variants: {
          "CARD_PLAY_PERMISSION:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes CARD_PLAY_PERMISSION (CARD_PLAY_PERMISSION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  CARD_UNDERNEATH: {
    supportedParamSchema: { required: ["action","from","target","count"], optional: ["facedown","destination"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CARD_UNDERNEATH\'',
    variants: {
          "CARD_UNDERNEATH:from_decktop": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes CARD_UNDERNEATH (CARD_UNDERNEATH:from_decktop) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_UNDERNEATH_UPDATED"
                ]
          },
          "CARD_UNDERNEATH:from_hand": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes CARD_UNDERNEATH (CARD_UNDERNEATH:from_hand) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_UNDERNEATH_UPDATED"
                ]
          },
          "CARD_UNDERNEATH:from_underneath": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes CARD_UNDERNEATH (CARD_UNDERNEATH:from_underneath) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_UNDERNEATH_UPDATED"
                ]
          }
    }
  },
  CAST_FROM_DECK: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CAST_FROM_DECK\'',
    variants: {
          "CAST_FROM_DECK:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes CAST_FROM_DECK (CAST_FROM_DECK:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  CAST_FROM_TRASH: {
    supportedParamSchema: { required: ["condition","scope","zone"], optional: ["ignoreCost"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CAST_FROM_TRASH\'',
    variants: {
          "CAST_FROM_TRASH:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes CAST_FROM_TRASH (CAST_FROM_TRASH:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CAST_FROM_TRASH_ENABLED"
                ]
          }
    }
  },
  CHANGE_TARGET: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CHANGE_TARGET\'',
    variants: {
          "CHANGE_TARGET:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes CHANGE_TARGET (CHANGE_TARGET:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  CHOOSE_BATTLE_TARGET: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CHOOSE_BATTLE_TARGET\'',
    variants: {
          "CHOOSE_BATTLE_TARGET:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes CHOOSE_BATTLE_TARGET (CHOOSE_BATTLE_TARGET:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  CHOOSE_BLOCKER: {
    supportedParamSchema: { required: ["when","mode","target","filter"], optional: ["side","count"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CHOOSE_BLOCKER\'',
    variants: {
          "CHOOSE_BLOCKER:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes CHOOSE_BLOCKER (CHOOSE_BLOCKER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BLOCKER_CHOSEN"
                ]
          }
    }
  },
  CHOOSE_FAMILY: {
    supportedParamSchema: { required: ["families","options"], optional: ["side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CHOOSE_FAMILY\'',
    variants: {
          "CHOOSE_FAMILY:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes CHOOSE_FAMILY (CHOOSE_FAMILY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "FAMILY_CHOSEN"
                ]
          }
    }
  },
  CHOOSE_LEVEL: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CHOOSE_LEVEL\'',
    variants: {
          "CHOOSE_LEVEL:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes CHOOSE_LEVEL (CHOOSE_LEVEL:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  COPY_ABILITY: {
    supportedParamSchema: { required: ["abilityType","keyword","filter","from"], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'COPY_ABILITY\'',
    variants: {
          "COPY_ABILITY:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes COPY_ABILITY (COPY_ABILITY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "ABILITY_COPIED"
                ]
          }
    }
  },
  COPY_EFFECT: {
    supportedParamSchema: { required: ["source","timing","target","from"], optional: ["filter","replaces","recursive","ignoreLevels"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'COPY_EFFECT\'',
    variants: {
          "COPY_EFFECT:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPD-01: Group D copy/redirection preserves original IR, stops loops, and integrates core & card destinations"
                ],
                "testedSuccessBehavior": "Executes COPY_EFFECT (COPY_EFFECT:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_COPIED"
                ]
          }
    }
  },
  COPY_PRE_ADVENT_EFFECT: {
    supportedParamSchema: { required: ["filter","ignoreLevels","scope"], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'COPY_PRE_ADVENT_EFFECT\'',
    variants: {
          "COPY_PRE_ADVENT_EFFECT:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes COPY_PRE_ADVENT_EFFECT (COPY_PRE_ADVENT_EFFECT:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "PRE_ADVENT_EFFECTS_GRANTED"
                ]
          }
    }
  },
  COPY_TRIGGER: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'COPY_TRIGGER\'',
    variants: {
          "COPY_TRIGGER:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes COPY_TRIGGER (COPY_TRIGGER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  CORE_LOCK: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CORE_LOCK\'',
    variants: {
          "CORE_LOCK:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes CORE_LOCK (CORE_LOCK:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  COUNT_AS_MULTIPLE: {
    supportedParamSchema: { required: ["countAs","cardType"], optional: ["filter","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'COUNT_AS_MULTIPLE\'',
    variants: {
          "COUNT_AS_MULTIPLE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes COUNT_AS_MULTIPLE (COUNT_AS_MULTIPLE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "COUNT_MODIFIER_APPLIED"
                ]
          }
    }
  },
  COUNT_MODIFIER: {
    supportedParamSchema: { required: ["multiplier","countAs","cardType"], optional: ["filter","forScope","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'COUNT_MODIFIER\'',
    variants: {
          "COUNT_MODIFIER:default": {
                "testFile": "tests/work_package_hij_real_cards_e2e.test.js",
                "testIds": [
                      "HIJ1-RULE-045 [CARD_RULES_E2E]: BSC31-CP04 (The DashingYatagarasuTwinkle Magoichi) resolves COUNT_MODIFIER"
                ],
                "testedSuccessBehavior": "Executes COUNT_MODIFIER (COUNT_MODIFIER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "COUNT_MODIFIER_APPLIED"
                ]
          }
    }
  },
  CREATE_BUNSHIN: {
    supportedParamSchema: { required: ["count"], optional: ["from","coresMin","upTo"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CREATE_BUNSHIN\'',
    variants: {
          "CREATE_BUNSHIN:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes CREATE_BUNSHIN (CREATE_BUNSHIN:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BUNSHIN_SUMMONED"
                ]
          }
    }
  },
  CROSS_TRIGGER: {
    supportedParamSchema: { required: ["lifeThreshold","condition","triggerMode"], optional: ["afterTrigger","effect"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'CROSS_TRIGGER\'',
    variants: {
          "CROSS_TRIGGER:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes CROSS_TRIGGER (CROSS_TRIGGER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CROSS_ULTIMATE_TRIGGER"
                ]
          }
    }
  },
  DECK_CONSTRUCTION_RULE: {
    supportedParamSchema: { required: ["maxCopies","rule"], optional: ["cardNumber"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DECK_CONSTRUCTION_RULE\'',
    variants: {
          "DECK_CONSTRUCTION_RULE:default": {
                "testFile": "tests/work_package_hij_real_cards_e2e.test.js",
                "testIds": [
                      "HIJ1-RULE-007 [CARD_RULES_E2E]: P21-G02 (The EvilDeityEmperor Zera-Phorobia) resolves DECK_CONSTRUCTION_RULE"
                ],
                "testedSuccessBehavior": "Executes DECK_CONSTRUCTION_RULE (DECK_CONSTRUCTION_RULE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DECK_RULE_ATTACHED"
                ]
          }
    }
  },
  DECK_IMMUNITY: {
    supportedParamSchema: { required: [], optional: ["side","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DECK_IMMUNITY\'',
    variants: {
          "DECK_IMMUNITY:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes DECK_IMMUNITY (DECK_IMMUNITY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DECK_IMMUNITY_SET"
                ]
          }
    }
  },
  DESTROY_ON_BP_ZERO: {
    supportedParamSchema: { required: [], optional: ["side","scope","allowProtectionBypass"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DESTROY_ON_BP_ZERO\'',
    variants: {
          "DESTROY_ON_BP_ZERO:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPF-01: Group F combat ops integrate PIERCING_RULE, BATTLE_RULE_MODIFIER, FLASH_PRIORITY, RESTRICT_MAIN_STEP, and DESTROY_ON_BP_ZERO"
                ],
                "testedSuccessBehavior": "Executes DESTROY_ON_BP_ZERO (DESTROY_ON_BP_ZERO:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BP_ZERO_DESTRUCTION_APPLIED"
                ]
          }
    }
  },
  DISCARD_AMONG: {
    supportedParamSchema: { required: ["filter","color","count"], optional: ["side","fromRevealed"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_AMONG\'',
    variants: {
          "DISCARD_AMONG:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes DISCARD_AMONG (DISCARD_AMONG:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_DISCARDED"
                ]
          }
    }
  },
  DISCARD_FIELD: {
    supportedParamSchema: { required: ["side","cardType","filter"], optional: ["count"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_FIELD\'',
    variants: {
          "DISCARD_FIELD:Magic_opp": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes DISCARD_FIELD (DISCARD_FIELD:Magic_opp) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_DISCARDED"
                ]
          },
          "DISCARD_FIELD:Spirit_self": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes DISCARD_FIELD (DISCARD_FIELD:Spirit_self) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_DISCARDED"
                ]
          }
    }
  },
  DISCARD_FIELD_MAGIC: {
    supportedParamSchema: { required: ["family","count","side"], optional: ["filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_FIELD_MAGIC\'',
    variants: {
          "DISCARD_FIELD_MAGIC:Song": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes DISCARD_FIELD_MAGIC (DISCARD_FIELD_MAGIC:Song) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "FIELD_MAGIC_DISCARDED"
                ]
          }
    }
  },
  DISCARD_HAND_MAX: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_HAND_MAX\'',
    variants: {
          "DISCARD_HAND_MAX:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes DISCARD_HAND_MAX (DISCARD_HAND_MAX:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  DISCARD_MIRAGE_COST: {
    supportedParamSchema: { required: ["count","filter","zone"], optional: ["side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_MIRAGE_COST\'',
    variants: {
          "DISCARD_MIRAGE_COST:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPC-01: Group C Mirage operations handle set, discard, return_hand, cost, and stale modifier cleanup"
                ],
                "testedSuccessBehavior": "Executes DISCARD_MIRAGE_COST (DISCARD_MIRAGE_COST:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "MIRAGE_DISCARDED"
                ]
          }
    }
  },
  DISCARD_UNDERNEATH_COST: {
    supportedParamSchema: { required: ["count","target","facedownOnly"], optional: ["filter","source"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_UNDERNEATH_COST\'',
    variants: {
          "DISCARD_UNDERNEATH_COST:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes DISCARD_UNDERNEATH_COST (DISCARD_UNDERNEATH_COST:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "UNDERNEATH_CARD_DISCARDED"
                ]
          }
    }
  },
  DISCARD_ZONE: {
    supportedParamSchema: { required: ["zone","cardType","side"], optional: ["count","filter","upTo"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'DISCARD_ZONE\'',
    variants: {
          "DISCARD_ZONE:Magic_opp": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes DISCARD_ZONE (DISCARD_ZONE:Magic_opp) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_DISCARDED"
                ]
          },
          "DISCARD_ZONE:Spirit_opp": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes DISCARD_ZONE (DISCARD_ZONE:Spirit_opp) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_DISCARDED"
                ]
          },
          "DISCARD_ZONE:Spirit_self": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes DISCARD_ZONE (DISCARD_ZONE:Spirit_self) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_DISCARDED"
                ]
          }
    }
  },
  END_STEP: {
    supportedParamSchema: { required: [], optional: ["targetStep","immediate"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'END_STEP\'',
    variants: {
          "END_STEP:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes END_STEP (END_STEP:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "STEP_ENDED"
                ]
          }
    }
  },
  ENTER_SOUL_STATE: {
    supportedParamSchema: { required: [], optional: ["target","onDepleted"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ENTER_SOUL_STATE\'',
    variants: {
          "ENTER_SOUL_STATE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes ENTER_SOUL_STATE (ENTER_SOUL_STATE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "ENTERED_SOUL_STATE"
                ]
          }
    }
  },
  EXCHANGE_BP: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'EXCHANGE_BP\'',
    variants: {
          "EXCHANGE_BP:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes EXCHANGE_BP (EXCHANGE_BP:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  EXCHANGE_CORE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'EXCHANGE_CORE\'',
    variants: {
          "EXCHANGE_CORE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes EXCHANGE_CORE (EXCHANGE_CORE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  EXPAND_TARGETS: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'EXPAND_TARGETS\'',
    variants: {
          "EXPAND_TARGETS:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes EXPAND_TARGETS (EXPAND_TARGETS:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  FLASH_PRIORITY: {
    supportedParamSchema: { required: [], optional: ["side","duration","step"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'FLASH_PRIORITY\'',
    variants: {
          "FLASH_PRIORITY:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPF-01: Group F combat ops integrate PIERCING_RULE, BATTLE_RULE_MODIFIER, FLASH_PRIORITY, RESTRICT_MAIN_STEP, and DESTROY_ON_BP_ZERO"
                ],
                "testedSuccessBehavior": "Executes FLASH_PRIORITY (FLASH_PRIORITY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "FLASH_PRIORITY_SET"
                ]
          }
    }
  },
  FLIP_BUNSHIN: {
    supportedParamSchema: { required: [], optional: ["target","count"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'FLIP_BUNSHIN\'',
    variants: {
          "FLIP_BUNSHIN:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes FLIP_BUNSHIN (FLIP_BUNSHIN:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "BUNSHIN_FLIPPED"
                ]
          }
    }
  },
  FORCE_ATTACK: {
    supportedParamSchema: { required: ["side","minAttacks","target"], optional: ["duration","filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'FORCE_ATTACK\'',
    variants: {
          "FORCE_ATTACK:default": {
                "testFile": "tests/work_package_hij_real_cards_e2e.test.js",
                "testIds": [
                      "HIJ1-RULE-026 [CARD_RULES_E2E]: BS18-029 (Bat-Holliday) resolves FORCE_ATTACK"
                ],
                "testedSuccessBehavior": "Executes FORCE_ATTACK (FORCE_ATTACK:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "FORCED_ATTACK_SET"
                ]
          }
    }
  },
  GLOBAL_RESTRICTION: {
    supportedParamSchema: { required: ["restriction","action","cannot"], optional: ["side","duration","cause","filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'GLOBAL_RESTRICTION\'',
    variants: {
          "GLOBAL_RESTRICTION:GLOBAL_RESTRICTION": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes GLOBAL_RESTRICTION (GLOBAL_RESTRICTION:GLOBAL_RESTRICTION) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "RESTRICTION_SET"
                ]
          }
    }
  },
  GRANT_EFFECT: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'GRANT_EFFECT\'',
    variants: {
          "GRANT_EFFECT:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes GRANT_EFFECT (GRANT_EFFECT:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  GUARD_TRIGGER: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'GUARD_TRIGGER\'',
    variants: {
          "GUARD_TRIGGER:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes GUARD_TRIGGER (GUARD_TRIGGER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  IGNORE_CONDITIONS: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'IGNORE_CONDITIONS\'',
    variants: {
          "IGNORE_CONDITIONS:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes IGNORE_CONDITIONS (IGNORE_CONDITIONS:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  IGNORE_LEVELS: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'IGNORE_LEVELS\'',
    variants: {
          "IGNORE_LEVELS:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes IGNORE_LEVELS (IGNORE_LEVELS:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  LIFE_OR_CORE_MODIFICATION: {
    supportedParamSchema: { required: ["count","amount","destination","targetZone"], optional: ["side","upTo","fromZone"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LIFE_OR_CORE_MODIFICATION\'',
    variants: {
          "LIFE_OR_CORE_MODIFICATION:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPD-01: Group D copy/redirection preserves original IR, stops loops, and integrates core & card destinations"
                ],
                "testedSuccessBehavior": "Executes LIFE_OR_CORE_MODIFICATION (LIFE_OR_CORE_MODIFICATION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CORE_MOVED",
                      "LIFE_CHANGED"
                ]
          }
    }
  },
  LIMIT_DECK_DISCARD: {
    supportedParamSchema: { required: ["maxPerTurn","limit"], optional: ["sourceSide","duration","targetSide"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LIMIT_DECK_DISCARD\'',
    variants: {
          "LIMIT_DECK_DISCARD:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes LIMIT_DECK_DISCARD (LIMIT_DECK_DISCARD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DECK_DISCARD_LIMIT_SET"
                ]
          }
    }
  },
  LIMIT_ONCE_PER_TURN: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LIMIT_ONCE_PER_TURN\'',
    variants: {
          "LIMIT_ONCE_PER_TURN:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes LIMIT_ONCE_PER_TURN (LIMIT_ONCE_PER_TURN:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  LOOK_AT_DECK: {
    supportedParamSchema: { required: ["count","position"], optional: ["side","destination"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LOOK_AT_DECK\'',
    variants: {
          "LOOK_AT_DECK:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes LOOK_AT_DECK (LOOK_AT_DECK:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DECK_LOOKED_AT"
                ]
          }
    }
  },
  LOOK_AT_HAND: {
    supportedParamSchema: { required: ["side","target"], optional: ["count"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LOOK_AT_HAND\'',
    variants: {
          "LOOK_AT_HAND:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes LOOK_AT_HAND (LOOK_AT_HAND:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "HAND_LOOKED_AT"
                ]
          }
    }
  },
  LOOK_DECKTOP: {
    supportedParamSchema: { required: ["count"], optional: ["side","destination"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LOOK_DECKTOP\'',
    variants: {
          "LOOK_DECKTOP:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes LOOK_DECKTOP (LOOK_DECKTOP:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DECK_LOOKED_AT"
                ]
          }
    }
  },
  LOOK_HAND: {
    supportedParamSchema: { required: ["side","target"], optional: ["count","reveal"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LOOK_HAND\'',
    variants: {
          "LOOK_HAND:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes LOOK_HAND (LOOK_HAND:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "HAND_LOOKED_AT"
                ]
          }
    }
  },
  LOSE_EFFECTS: {
    supportedParamSchema: { required: ["target","cannotGainNew","scope"], optional: ["duration","filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LOSE_EFFECTS\'',
    variants: {
          "LOSE_EFFECTS:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes LOSE_EFFECTS (LOSE_EFFECTS:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECTS_LOST"
                ]
          }
    }
  },
  LOSE_IMMUNITY: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'LOSE_IMMUNITY\'',
    variants: {
          "LOSE_IMMUNITY:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes LOSE_IMMUNITY (LOSE_IMMUNITY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  MILL: {
    supportedParamSchema: { required: ["count","amount"], optional: ["side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'MILL\'',
    variants: {
          "MILL:decktop": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes MILL (MILL:decktop) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DECK_MILLED"
                ]
          }
    }
  },
  MIRAGE_OPERATION: {
    supportedParamSchema: { required: ["action","operation","mode"], optional: ["side","target","cost"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'MIRAGE_OPERATION\'',
    variants: {
          "MIRAGE_OPERATION:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPC-01: Group C Mirage operations handle set, discard, return_hand, cost, and stale modifier cleanup"
                ],
                "testedSuccessBehavior": "Executes MIRAGE_OPERATION (MIRAGE_OPERATION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "MIRAGE_UPDATED"
                ]
          }
    }
  },
  MODIFY_DESTINATION: {
    supportedParamSchema: { required: ["destination","replaces","fromEffect"], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'MODIFY_DESTINATION\'',
    variants: {
          "MODIFY_DESTINATION:hand": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPD-01: Group D copy/redirection preserves original IR, stops loops, and integrates core & card destinations"
                ],
                "testedSuccessBehavior": "Executes MODIFY_DESTINATION (MODIFY_DESTINATION:hand) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DESTINATION_MODIFIED"
                ]
          },
          "MODIFY_DESTINATION:removed": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPD-01: Group D copy/redirection preserves original IR, stops loops, and integrates core & card destinations"
                ],
                "testedSuccessBehavior": "Executes MODIFY_DESTINATION (MODIFY_DESTINATION:removed) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DESTINATION_MODIFIED"
                ]
          }
    }
  },
  MULTIPLY_EFFECT: {
    supportedParamSchema: { required: ["per","multiplier","countSource"], optional: ["filter","maxCount"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'MULTIPLY_EFFECT\'',
    variants: {
          "MULTIPLY_EFFECT:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes MULTIPLY_EFFECT (MULTIPLY_EFFECT:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECT_MULTIPLIED"
                ]
          }
    }
  },
  NEGATE_MAGIC: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'NEGATE_MAGIC\'',
    variants: {
          "NEGATE_MAGIC:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes NEGATE_MAGIC (NEGATE_MAGIC:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  NON_STACKABLE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'NON_STACKABLE\'',
    variants: {
          "NON_STACKABLE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes NON_STACKABLE (NON_STACKABLE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  ON_BP_DESTROY: {
    supportedParamSchema: { required: ["whoseDestroyed","when","effect","condition"], optional: ["side","clauses"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'ON_BP_DESTROY\'',
    variants: {
          "ON_BP_DESTROY:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes ON_BP_DESTROY (ON_BP_DESTROY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "ON_BP_DESTROY_REGISTERED"
                ]
          }
    }
  },
  OPPONENT_CHOICE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'OPPONENT_CHOICE\'',
    variants: {
          "OPPONENT_CHOICE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes OPPONENT_CHOICE (OPPONENT_CHOICE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  PAY_COST: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'PAY_COST\'',
    variants: {
          "PAY_COST:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes PAY_COST (PAY_COST:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  PIERCING_RULE: {
    supportedParamSchema: { required: ["allowedPrevention","bypasses","effectType"], optional: ["duration","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'PIERCING_RULE\'',
    variants: {
          "PIERCING_RULE:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPF-01: Group F combat ops integrate PIERCING_RULE, BATTLE_RULE_MODIFIER, FLASH_PRIORITY, RESTRICT_MAIN_STEP, and DESTROY_ON_BP_ZERO"
                ],
                "testedSuccessBehavior": "Executes PIERCING_RULE (PIERCING_RULE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "PIERCING_RULE_SET"
                ]
          }
    }
  },
  PUT_CARD_ON_FIELD: {
    supportedParamSchema: { required: ["from","cardType","filter"], optional: ["facedown","count","keyword","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'PUT_CARD_ON_FIELD\'',
    variants: {
          "PUT_CARD_ON_FIELD:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes PUT_CARD_ON_FIELD (PUT_CARD_ON_FIELD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_PLACED_ON_FIELD"
                ]
          }
    }
  },
  PUT_FACEDOWN_FIELD: {
    supportedParamSchema: { required: ["from","family","filter","count"], optional: ["side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'PUT_FACEDOWN_FIELD\'',
    variants: {
          "PUT_FACEDOWN_FIELD:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes PUT_FACEDOWN_FIELD (PUT_FACEDOWN_FIELD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "FACEDOWN_CARD_PLACED"
                ]
          }
    }
  },
  PUT_UNDERNEATH: {
    supportedParamSchema: { required: ["from","count","target"], optional: ["facedown","side","filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'PUT_UNDERNEATH\'',
    variants: {
          "PUT_UNDERNEATH:from_decktop": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes PUT_UNDERNEATH (PUT_UNDERNEATH:from_decktop) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_PUT_UNDERNEATH"
                ]
          },
          "PUT_UNDERNEATH:from_field": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes PUT_UNDERNEATH (PUT_UNDERNEATH:from_field) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_PUT_UNDERNEATH"
                ]
          }
    }
  },
  REDIRECT_CORE_DESTINATION: {
    supportedParamSchema: { required: ["destination","fromZone","cause"], optional: ["side","filter","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'REDIRECT_CORE_DESTINATION\'',
    variants: {
          "REDIRECT_CORE_DESTINATION:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPD-01: Group D copy/redirection preserves original IR, stops loops, and integrates core & card destinations"
                ],
                "testedSuccessBehavior": "Executes REDIRECT_CORE_DESTINATION (REDIRECT_CORE_DESTINATION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CORE_DESTINATION_REDIRECTED"
                ]
          }
    }
  },
  REDIRECT_TARGET: {
    supportedParamSchema: { required: ["newTarget","filter","bpMax","mode"], optional: ["target","side","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'REDIRECT_TARGET\'',
    variants: {
          "REDIRECT_TARGET:default": {
                "testFile": "tests/work_package_hij_real_cards_e2e.test.js",
                "testIds": [
                      "HIJ1-RULE-021 [CARD_RULES_E2E]: BS04-054 (Arcanasoldier-Cinq) resolves REDIRECT_TARGET"
                ],
                "testedSuccessBehavior": "Executes REDIRECT_TARGET (REDIRECT_TARGET:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "TARGET_REDIRECTED"
                ]
          }
    }
  },
  RESTRICT_MAIN_STEP: {
    supportedParamSchema: { required: [], optional: ["scope","action"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'RESTRICT_MAIN_STEP\'',
    variants: {
          "RESTRICT_MAIN_STEP:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPF-01: Group F combat ops integrate PIERCING_RULE, BATTLE_RULE_MODIFIER, FLASH_PRIORITY, RESTRICT_MAIN_STEP, and DESTROY_ON_BP_ZERO"
                ],
                "testedSuccessBehavior": "Executes RESTRICT_MAIN_STEP (RESTRICT_MAIN_STEP:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "MAIN_STEP_RESTRICTION_SET"
                ]
          }
    }
  },
  RETRIEVE_CORES: {
    supportedParamSchema: { required: ["count","from","to"], optional: ["excludeSoulCore","upTo","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'RETRIEVE_CORES\'',
    variants: {
          "RETRIEVE_CORES:default": {
                "testFile": "tests/work_package_hij_real_cards_e2e.test.js",
                "testIds": [
                      "HIJ1-E2E-062 [CARD_ABILITY_E2E]: 26RSD01-006 (Cupell) resolves RETRIEVE_CORES"
                ],
                "testedSuccessBehavior": "Executes RETRIEVE_CORES (RETRIEVE_CORES:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CORE_MOVED"
                ]
          }
    }
  },
  RETURN_CONTROL: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'RETURN_CONTROL\'',
    variants: {
          "RETURN_CONTROL:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes RETURN_CONTROL (RETURN_CONTROL:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  RETURN_DECK_BOTTOM: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'RETURN_DECK_BOTTOM\'',
    variants: {
          "RETURN_DECK_BOTTOM:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes RETURN_DECK_BOTTOM (RETURN_DECK_BOTTOM:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  REVEAL_FROM_HAND_COST: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'REVEAL_FROM_HAND_COST\'',
    variants: {
          "REVEAL_FROM_HAND_COST:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes REVEAL_FROM_HAND_COST (REVEAL_FROM_HAND_COST:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  REVEAL_HAND: {
    supportedParamSchema: { required: [], optional: ["side","target"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'REVEAL_HAND\'',
    variants: {
          "REVEAL_HAND:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes REVEAL_HAND (REVEAL_HAND:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "HAND_REVEALED"
                ]
          }
    }
  },
  REVEAL_INTERACTION: {
    supportedParamSchema: { required: ["onRevealBy","destination","action"], optional: ["side","filter","cost"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'REVEAL_INTERACTION\'',
    variants: {
          "REVEAL_INTERACTION:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes REVEAL_INTERACTION (REVEAL_INTERACTION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "REVEAL_INTERACTION_TRIGGERED"
                ]
          }
    }
  },
  SCHEDULED_DESTROY: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SCHEDULED_DESTROY\'',
    variants: {
          "SCHEDULED_DESTROY:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes SCHEDULED_DESTROY (SCHEDULED_DESTROY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SEARCH_DECK: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SEARCH_DECK\'',
    variants: {
          "SEARCH_DECK:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes SEARCH_DECK (SEARCH_DECK:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SELECT_TARGET: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SELECT_TARGET\'',
    variants: {
          "SELECT_TARGET:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes SELECT_TARGET (SELECT_TARGET:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SEND_CORES_TO_VOID: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SEND_CORES_TO_VOID\'',
    variants: {
          "SEND_CORES_TO_VOID:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes SEND_CORES_TO_VOID (SEND_CORES_TO_VOID:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SEND_CORE_TO_VOID: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SEND_CORE_TO_VOID\'',
    variants: {
          "SEND_CORE_TO_VOID:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes SEND_CORE_TO_VOID (SEND_CORE_TO_VOID:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SEND_TO_TRASH: {
    supportedParamSchema: { required: ["target","from","count"], optional: ["side","filter"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SEND_TO_TRASH\'',
    variants: {
          "SEND_TO_TRASH:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes SEND_TO_TRASH (SEND_TO_TRASH:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_SENT_TO_TRASH"
                ]
          }
    }
  },
  SEPARATE_BRAVE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SEPARATE_BRAVE\'',
    variants: {
          "SEPARATE_BRAVE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes SEPARATE_BRAVE (SEPARATE_BRAVE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SHUFFLE_DECK: {
    supportedParamSchema: { required: [], optional: ["side","seed"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SHUFFLE_DECK\'',
    variants: {
          "SHUFFLE_DECK:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle"
                ],
                "testedSuccessBehavior": "Executes SHUFFLE_DECK (SHUFFLE_DECK:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "DECK_SHUFFLED"
                ]
          }
    }
  },
  SIMULTANEOUS_BATTLE: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SIMULTANEOUS_BATTLE\'',
    variants: {
          "SIMULTANEOUS_BATTLE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes SIMULTANEOUS_BATTLE (SIMULTANEOUS_BATTLE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SPECIAL_WIN: {
    supportedParamSchema: { required: ["winner","condition","reason"], optional: ["side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SPECIAL_WIN\'',
    variants: {
          "SPECIAL_WIN:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes SPECIAL_WIN (SPECIAL_WIN:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "GAME_ENDED"
                ]
          }
    }
  },
  STACK_CARD: {
    supportedParamSchema: { required: ["target","from"], optional: ["facedown","preserveState","count"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'STACK_CARD\'',
    variants: {
          "STACK_CARD:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes STACK_CARD (STACK_CARD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_STACKED"
                ]
          }
    }
  },
  SUMMON_MULTI: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SUMMON_MULTI\'',
    variants: {
          "SUMMON_MULTI:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes SUMMON_MULTI (SUMMON_MULTI:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SWAP_CARD: {
    supportedParamSchema: { required: ["target","filter","from"], optional: ["preserveState","destination","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SWAP_CARD\'',
    variants: {
          "SWAP_CARD:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes SWAP_CARD (SWAP_CARD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARDS_SWAPPED"
                ]
          }
    }
  },
  SWAP_CARDS: {
    supportedParamSchema: { required: ["from","to","filter","count"], optional: ["side","upTo"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SWAP_CARDS\'',
    variants: {
          "SWAP_CARDS:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks"
                ],
                "testedSuccessBehavior": "Executes SWAP_CARDS (SWAP_CARDS:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARDS_SWAPPED"
                ]
          }
    }
  },
  SWAP_CORES: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SWAP_CORES\'',
    variants: {
          "SWAP_CORES:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes SWAP_CORES (SWAP_CORES:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SWITCH_BP: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SWITCH_BP\'',
    variants: {
          "SWITCH_BP:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-10 [OPERATION_VARIANT]: Combat, Targeting, Immunity, and Copy ops (ATTACK_RULE_MODIFIER, BATTLE_MODIFIER, BATTLE_MULTIPLE, CAN_ATTACK, CHANGE_TARGET, CHOOSE_BATTLE_TARGET, CHOOSE_BLOCKER, COPY_ABILITY, COPY_PRE_ADVENT_EFFECT, COPY_TRIGGER, EXCHANGE_BP, SWITCH_BP, EXPAND_TARGETS, GUARD_TRIGGER, LOSE_IMMUNITY, MULTIPLY_EFFECT, NEGATE_MAGIC, SCHEDULED_DESTROY, SELECT_TARGET, SIMULTANEOUS_BATTLE)"
                ],
                "testedSuccessBehavior": "Executes SWITCH_BP (SWITCH_BP:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SWITCH_CARD: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SWITCH_CARD\'',
    variants: {
          "SWITCH_CARD:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes SWITCH_CARD (SWITCH_CARD:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  SYMBOL_MODIFIER: {
    supportedParamSchema: { required: ["cardType","symbols","color"], optional: ["side","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'SYMBOL_MODIFIER\'',
    variants: {
          "SYMBOL_MODIFIER:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes SYMBOL_MODIFIER (SYMBOL_MODIFIER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "SYMBOL_MODIFIER_APPLIED"
                ]
          }
    }
  },
  TAKE_CONTROL: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TAKE_CONTROL\'',
    variants: {
          "TAKE_CONTROL:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes TAKE_CONTROL (TAKE_CONTROL:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  TARGET_FAMILY: {
    supportedParamSchema: { required: ["families","mode","count"], optional: ["side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TARGET_FAMILY\'',
    variants: {
          "TARGET_FAMILY:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TARGET_FAMILY (TARGET_FAMILY:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "FAMILY_CHOSEN"
                ]
          }
    }
  },
  TIMING_MODIFIER: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TIMING_MODIFIER\'',
    variants: {
          "TIMING_MODIFIER:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TIMING_MODIFIER (TIMING_MODIFIER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  TREAT_AS_VANILLA: {
    supportedParamSchema: { required: [], optional: ["target","duration"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TREAT_AS_VANILLA\'',
    variants: {
          "TREAT_AS_VANILLA:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TREAT_AS_VANILLA (TREAT_AS_VANILLA:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "EFFECTS_LOST"
                ]
          }
    }
  },
  TREAT_CORE_COUNT: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TREAT_CORE_COUNT\'',
    variants: {
          "TREAT_CORE_COUNT:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TREAT_CORE_COUNT (TREAT_CORE_COUNT:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  TREAT_COST: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TREAT_COST\'',
    variants: {
          "TREAT_COST:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TREAT_COST (TREAT_COST:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  TREAT_NAME: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TREAT_NAME\'',
    variants: {
          "TREAT_NAME:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TREAT_NAME (TREAT_NAME:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  TRIGGERED_ACTION: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TRIGGERED_ACTION\'',
    variants: {
          "TRIGGERED_ACTION:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TRIGGERED_ACTION (TRIGGERED_ACTION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  TRIGGERED_BUFF: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TRIGGERED_BUFF\'',
    variants: {
          "TRIGGERED_BUFF:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes TRIGGERED_BUFF (TRIGGERED_BUFF:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  TRIGGERED_WATCHER: {
    supportedParamSchema: { required: ["watchEvent","event","trigger","action","cardType"], optional: ["side","duration","filter","effect"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TRIGGERED_WATCHER\'',
    variants: {
          "TRIGGERED_WATCHER:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes TRIGGERED_WATCHER (TRIGGERED_WATCHER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "WATCHER_REGISTERED"
                ]
          }
    }
  },
  TRIGGER_CONDITION: {
    supportedParamSchema: { required: ["event","condition","trigger","timing"], optional: ["side","location","effect"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TRIGGER_CONDITION\'',
    variants: {
          "TRIGGER_CONDITION:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes TRIGGER_CONDITION (TRIGGER_CONDITION:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "TRIGGER_CONDITION_REGISTERED"
                ]
          }
    }
  },
  TRIGGER_COUNTER: {
    supportedParamSchema: { required: ["counterTiming","when","trigger","zone"], optional: ["side","effect","cost"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'TRIGGER_COUNTER\'',
    variants: {
          "TRIGGER_COUNTER:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs"
                ],
                "testedSuccessBehavior": "Executes TRIGGER_COUNTER (TRIGGER_COUNTER:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "COUNTER_TRIGGER_REGISTERED"
                ]
          }
    }
  },
  USE_FROM_HAND: {
    supportedParamSchema: { required: ["cardType","timing","filter"], optional: ["ignoreCost","side"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'USE_FROM_HAND\'',
    variants: {
          "USE_FROM_HAND:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-09 [OPERATION_VARIANT]: Zone, Deck, Hand, Cost, and Core ops (BANISH_COST, BANISH_DESTINATION_RULE, BANISH_SOUL_CORE_VOID, BOUNCE_TO_DECKBOTTOM, RETURN_DECK_BOTTOM, CAST_FROM_DECK, CAST_FROM_TRASH, DISCARD_FIELD, DISCARD_ZONE, DISCARD_HAND_MAX, LOOK_AT_HAND, LOOK_DECKTOP, PAY_COST, PUT_CARD_ON_FIELD, REVEAL_FROM_HAND_COST, REVEAL_INTERACTION, SEARCH_DECK, SEND_CORES_TO_VOID, SEND_CORE_TO_VOID, SEND_TO_TRASH, SWAP_CORES, EXCHANGE_CORE, USE_FROM_HAND)"
                ],
                "testedSuccessBehavior": "Executes USE_FROM_HAND (USE_FROM_HAND:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "CARD_USED_FROM_HAND"
                ]
          }
    }
  },
  USE_FROM_SOUL_STATE: {
    supportedParamSchema: { required: [], optional: ["cardType","timing"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'USE_FROM_SOUL_STATE\'',
    variants: {
          "USE_FROM_SOUL_STATE:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-08 [OPERATION_VARIANT]: Rebirth, Advent, Underneath, Stack, and Soul State ops (ACTIVATE_REBIRTH, ADVENT_COST, CARD_UNDERNEATH, STACK_CARD, SEPARATE_BRAVE, ENTER_SOUL_STATE, USE_FROM_SOUL_STATE, BEFORE_ADVENT_TRIGGER)"
                ],
                "testedSuccessBehavior": "Executes USE_FROM_SOUL_STATE (USE_FROM_SOUL_STATE:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "USE_FROM_SOUL_STATE_ENABLED"
                ]
          }
    }
  },
  VARIABLE_PAYMENT_EFFECT: {
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'VARIABLE_PAYMENT_EFFECT\'',
    variants: {
          "VARIABLE_PAYMENT_EFFECT:default": {
                "testFile": "tests/work_package_hij1_operation_variants.test.js",
                "testIds": [
                      "HIJ1-OPVAR-11 [OPERATION_VARIANT]: Rules, Choice, Trigger, and Attribute ops (CARD_PLAY_PERMISSION, CHOOSE_FAMILY, CHOOSE_LEVEL, OPPONENT_CHOICE, CORE_LOCK, COUNT_AS_MULTIPLE, CREATE_BUNSHIN, END_STEP, GRANT_EFFECT, IGNORE_CONDITIONS, IGNORE_LEVELS, LIMIT_ONCE_PER_TURN, NON_STACKABLE, SUMMON_MULTI, SWITCH_CARD, TARGET_FAMILY, TIMING_MODIFIER, TREAT_AS_VANILLA, TREAT_CORE_COUNT, TREAT_COST, TRIGGERED_ACTION, TRIGGERED_BUFF, VARIABLE_PAYMENT_EFFECT)"
                ],
                "testedSuccessBehavior": "Executes VARIABLE_PAYMENT_EFFECT (VARIABLE_PAYMENT_EFFECT:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": []
          }
    }
  },
  WIN_GAME: {
    supportedParamSchema: { required: [], optional: ["winner","loser","reason"] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: 'engine/ops/index.js:case \'WIN_GAME\'',
    variants: {
          "WIN_GAME:default": {
                "testFile": "tests/work_package_hij_operations_compiler_integration.test.js",
                "testIds": [
                      "HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin"
                ],
                "testedSuccessBehavior": "Executes WIN_GAME (WIN_GAME:default) with valid state transition and identity/core conservation",
                "testedRejectionBehavior": "Fails closed on MISSING_IR_PARAMETERS / invalid targets / missing cost or resources",
                "stateInvariantsAsserted": [
                      "state_transition_verified",
                      "card_and_core_conservation"
                ],
                "eventBehaviorAsserted": [
                      "GAME_ENDED"
                ]
          }
    }
  },
  TOKEN_DEPLOYMENT: {
    op: 'TOKEN_DEPLOYMENT',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'TOKEN_DEPLOYMENT'",
    variants: {
      'TOKEN_DEPLOYMENT:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-01 [OPERATION_VARIANT]: TOKEN_DEPLOYMENT deploys named token and rejects missing spec"],
        testedSuccessBehavior: 'Executes TOKEN_DEPLOYMENT with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  COUNT_OPERATION: {
    op: 'COUNT_OPERATION',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'COUNT_OPERATION'",
    variants: {
      'COUNT_OPERATION:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-02 [OPERATION_VARIANT]: COUNT_OPERATION handles SEND_LIFE_TO_VOID, zone count, and fail-closed stub"],
        testedSuccessBehavior: 'Executes COUNT_OPERATION with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  DECK_ACTION: {
    op: 'DECK_ACTION',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'DECK_ACTION'",
    variants: {
      'DECK_ACTION:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-03 [OPERATION_VARIANT]: DECK_OR_HAND_ACTION and DECK_ACTION support look, reveal, send_to_trash, return_deckbottom, and fail-closed"],
        testedSuccessBehavior: 'Executes DECK_ACTION with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  MODIFY_EFFECT: {
    op: 'MODIFY_EFFECT',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'MODIFY_EFFECT'",
    variants: {
      'MODIFY_EFFECT:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-04 [OPERATION_VARIANT]: MODIFY_EFFECT, MODIFY_EFFECT_VALUE, and REPLACEMENT_EFFECT create modifiers and reject stubs"],
        testedSuccessBehavior: 'Executes MODIFY_EFFECT with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  MODIFY_EFFECT_VALUE: {
    op: 'MODIFY_EFFECT_VALUE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'MODIFY_EFFECT_VALUE'",
    variants: {
      'MODIFY_EFFECT_VALUE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-04 [OPERATION_VARIANT]: MODIFY_EFFECT, MODIFY_EFFECT_VALUE, and REPLACEMENT_EFFECT create modifiers and reject stubs"],
        testedSuccessBehavior: 'Executes MODIFY_EFFECT_VALUE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  CONTRACT_ADVENT_RULE: {
    op: 'CONTRACT_ADVENT_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'CONTRACT_ADVENT_RULE'",
    variants: {
      'CONTRACT_ADVENT_RULE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-05 [OPERATION_VARIANT]: CONTRACT_ADVENT_RULE, ADVENT, DECK_BUILDING_RULE, GAIN_TEAM, TEAM_RULE, BUNSHIN_SUMMON, ACTIVATE_SOUL_DRIVE resolve cleanly"],
        testedSuccessBehavior: 'Executes CONTRACT_ADVENT_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  ADVENT: {
    op: 'ADVENT',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'ADVENT'",
    variants: {
      'ADVENT:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-05 [OPERATION_VARIANT]: CONTRACT_ADVENT_RULE, ADVENT, DECK_BUILDING_RULE, GAIN_TEAM, TEAM_RULE, BUNSHIN_SUMMON, ACTIVATE_SOUL_DRIVE resolve cleanly"],
        testedSuccessBehavior: 'Executes ADVENT with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  DECK_BUILDING_RULE: {
    op: 'DECK_BUILDING_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'DECK_BUILDING_RULE'",
    variants: {
      'DECK_BUILDING_RULE:default': {
        classification: 'CARD_RULES_E2E',
        testFile: 'tests/work_package_hij_real_cards_e2e.test.js',
        testIds: ["HIJ1-RULE-001 [CARD_RULES_E2E]: P15-17 (The Minis' Great Athletics Meeting) resolves DECK_BUILDING_RULE"],
        testedSuccessBehavior: 'Executes DECK_BUILDING_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  GAIN_TEAM: {
    op: 'GAIN_TEAM',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'GAIN_TEAM'",
    variants: {
      'GAIN_TEAM:default': {
        classification: 'CARD_RULES_E2E',
        testFile: 'tests/work_package_hij_real_cards_e2e.test.js',
        testIds: ["HIJ1-RULE-046 [CARD_RULES_E2E]: BATTLE-SPIRITS-A14695 (［Academy Seraph］Aeriphiel) resolves GAIN_TEAM"],
        testedSuccessBehavior: 'Executes GAIN_TEAM with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  TEAM_RULE: {
    op: 'TEAM_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'TEAM_RULE'",
    variants: {
      'TEAM_RULE:default': {
        classification: 'CARD_RULES_E2E',
        testFile: 'tests/work_package_hij_real_cards_e2e.test.js',
        testIds: ["HIJ1-RULE-054 [CARD_RULES_E2E]: BATTLE-SPIRITS-A15090 (［Off Shot］Klara) resolves TEAM_RULE"],
        testedSuccessBehavior: 'Executes TEAM_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  BUNSHIN_SUMMON: {
    op: 'BUNSHIN_SUMMON',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'BUNSHIN_SUMMON'",
    variants: {
      'BUNSHIN_SUMMON:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-05 [OPERATION_VARIANT]: CONTRACT_ADVENT_RULE, ADVENT, DECK_BUILDING_RULE, GAIN_TEAM, TEAM_RULE, BUNSHIN_SUMMON, ACTIVATE_SOUL_DRIVE resolve cleanly"],
        testedSuccessBehavior: 'Executes BUNSHIN_SUMMON with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  ACTIVATE_SOUL_DRIVE: {
    op: 'ACTIVATE_SOUL_DRIVE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'ACTIVATE_SOUL_DRIVE'",
    variants: {
      'ACTIVATE_SOUL_DRIVE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-05 [OPERATION_VARIANT]: CONTRACT_ADVENT_RULE, ADVENT, DECK_BUILDING_RULE, GAIN_TEAM, TEAM_RULE, BUNSHIN_SUMMON, ACTIVATE_SOUL_DRIVE resolve cleanly"],
        testedSuccessBehavior: 'Executes ACTIVATE_SOUL_DRIVE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  KEYWORD_RULE: {
    op: 'KEYWORD_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'KEYWORD_RULE'",
    variants: {
      'KEYWORD_RULE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-06 [OPERATION_VARIANT]: KEYWORD_RULE, KEYWORD_ABILITY, COST_MODIFIER, TREAT_RULE, ADD_COUNTER, UNBLOCKABLE, CONTINUOUS_RULE, COMBAT_RESTRICTION, COMBAT_RULE"],
        testedSuccessBehavior: 'Executes KEYWORD_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  KEYWORD_ABILITY: {
    op: 'KEYWORD_ABILITY',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'KEYWORD_ABILITY'",
    variants: {
      'KEYWORD_ABILITY:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-06 [OPERATION_VARIANT]: KEYWORD_RULE, KEYWORD_ABILITY, COST_MODIFIER, TREAT_RULE, ADD_COUNTER, UNBLOCKABLE, CONTINUOUS_RULE, COMBAT_RESTRICTION, COMBAT_RULE"],
        testedSuccessBehavior: 'Executes KEYWORD_ABILITY with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  COST_MODIFIER: {
    op: 'COST_MODIFIER',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'COST_MODIFIER'",
    variants: {
      'COST_MODIFIER:default': {
        classification: 'CARD_RULES_E2E',
        testFile: 'tests/work_package_hij_real_cards_e2e.test.js',
        testIds: ["HIJ1-RULE-025 [CARD_RULES_E2E]: BS08-057 (The Red Sand Glass) resolves COST_MODIFIER"],
        testedSuccessBehavior: 'Executes COST_MODIFIER with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  TREAT_RULE: {
    op: 'TREAT_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'TREAT_RULE'",
    variants: {
      'TREAT_RULE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-06 [OPERATION_VARIANT]: KEYWORD_RULE, KEYWORD_ABILITY, COST_MODIFIER, TREAT_RULE, ADD_COUNTER, UNBLOCKABLE, CONTINUOUS_RULE, COMBAT_RESTRICTION, COMBAT_RULE"],
        testedSuccessBehavior: 'Executes TREAT_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  ADVENT_STACK: {
    op: 'ADVENT_STACK',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'ADVENT_STACK'",
    variants: {
      'ADVENT_STACK:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes ADVENT_STACK with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  ADVENT_PAY: {
    op: 'ADVENT_PAY',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'ADVENT_PAY'",
    variants: {
      'ADVENT_PAY:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes ADVENT_PAY with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  SUMMON_THIS_CARD: {
    op: 'SUMMON_THIS_CARD',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'SUMMON_THIS_CARD'",
    variants: {
      'SUMMON_THIS_CARD:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes SUMMON_THIS_CARD with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  COMBAT_RESTRICTION: {
    op: 'COMBAT_RESTRICTION',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'COMBAT_RESTRICTION'",
    variants: {
      'COMBAT_RESTRICTION:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-06 [OPERATION_VARIANT]: KEYWORD_RULE, KEYWORD_ABILITY, COST_MODIFIER, TREAT_RULE, ADD_COUNTER, UNBLOCKABLE, CONTINUOUS_RULE, COMBAT_RESTRICTION, COMBAT_RULE"],
        testedSuccessBehavior: 'Executes COMBAT_RESTRICTION with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  COMBAT_RULE: {
    op: 'COMBAT_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'COMBAT_RULE'",
    variants: {
      'COMBAT_RULE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-06 [OPERATION_VARIANT]: KEYWORD_RULE, KEYWORD_ABILITY, COST_MODIFIER, TREAT_RULE, ADD_COUNTER, UNBLOCKABLE, CONTINUOUS_RULE, COMBAT_RESTRICTION, COMBAT_RULE"],
        testedSuccessBehavior: 'Executes COMBAT_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  ADD_COUNTER: {
    op: 'ADD_COUNTER',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'ADD_COUNTER'",
    variants: {
      'ADD_COUNTER:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-06 [OPERATION_VARIANT]: KEYWORD_RULE, KEYWORD_ABILITY, COST_MODIFIER, TREAT_RULE, ADD_COUNTER, UNBLOCKABLE, CONTINUOUS_RULE, COMBAT_RESTRICTION, COMBAT_RULE"],
        testedSuccessBehavior: 'Executes ADD_COUNTER with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  CONTINUOUS_RULE: {
    op: 'CONTINUOUS_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'CONTINUOUS_RULE'",
    variants: {
      'CONTINUOUS_RULE:default': {
        classification: 'CARD_RULES_E2E',
        testFile: 'tests/work_package_hij_real_cards_e2e.test.js',
        testIds: ["HIJ1-RULE-012 [CARD_RULES_E2E]: BATTLE-SPIRITS-A161 (Attack Shift) resolves CONTINUOUS_RULE"],
        testedSuccessBehavior: 'Executes CONTINUOUS_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  UNBLOCKABLE: {
    op: 'UNBLOCKABLE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'UNBLOCKABLE'",
    variants: {
      'UNBLOCKABLE:default': {
        classification: 'CARD_RULES_E2E',
        testFile: 'tests/work_package_hij_real_cards_e2e.test.js',
        testIds: ["HIJ1-RULE-003 [CARD_RULES_E2E]: 26RCB01-X05 (Kamen Rider Ryuki Survive (26RCB01-X05)) resolves UNBLOCKABLE"],
        testedSuccessBehavior: 'Executes UNBLOCKABLE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  OPEN_ZONE: {
    op: 'OPEN_ZONE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'OPEN_ZONE'",
    variants: {
      'OPEN_ZONE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes OPEN_ZONE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  TARGET_CARD: {
    op: 'TARGET_CARD',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'TARGET_CARD'",
    variants: {
      'TARGET_CARD:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes TARGET_CARD with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  TARGET: {
    op: 'TARGET',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'TARGET'",
    variants: {
      'TARGET:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes TARGET with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  NEGATE_EFFECT: {
    op: 'NEGATE_EFFECT',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'NEGATE_EFFECT'",
    variants: {
      'NEGATE_EFFECT:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes NEGATE_EFFECT with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  REBIRTH_FLIP: {
    op: 'REBIRTH_FLIP',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'REBIRTH_FLIP'",
    variants: {
      'REBIRTH_FLIP:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes REBIRTH_FLIP with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  ACTIVATE_FLASH: {
    op: 'ACTIVATE_FLASH',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'ACTIVATE_FLASH'",
    variants: {
      'ACTIVATE_FLASH:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes ACTIVATE_FLASH with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  TARGET_ATTACK: {
    op: 'TARGET_ATTACK',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'TARGET_ATTACK'",
    variants: {
      'TARGET_ATTACK:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes TARGET_ATTACK with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  FORCE_BLOCK: {
    op: 'FORCE_BLOCK',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'FORCE_BLOCK'",
    variants: {
      'FORCE_BLOCK:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes FORCE_BLOCK with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  MOVE_SOUL_CORE: {
    op: 'MOVE_SOUL_CORE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'MOVE_SOUL_CORE'",
    variants: {
      'MOVE_SOUL_CORE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes MOVE_SOUL_CORE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  GRANDWALKER_PROTECTION: {
    op: 'GRANDWALKER_PROTECTION',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'GRANDWALKER_PROTECTION'",
    variants: {
      'GRANDWALKER_PROTECTION:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes GRANDWALKER_PROTECTION with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  },
  GRANDWALKER_CORE_RULE: {
    op: 'GRANDWALKER_CORE_RULE',
    supportedParamSchema: { required: [], optional: [] },
    explicitlyUnsupportedVariants: [],
    productionHandlerRef: "engine/ops/index.js:case 'GRANDWALKER_CORE_RULE'",
    variants: {
      'GRANDWALKER_CORE_RULE:default': {
        classification: 'OPERATION_VARIANT',
        testFile: 'tests/work_package_hij1_operation_variants.test.js',
        testIds: ["HIJ1-OPVAR-07 [OPERATION_VARIANT]: ADVENT_STACK, ADVENT_PAY, SUMMON_THIS_CARD, OPEN_ZONE, TARGET, TARGET_CARD, NEGATE_EFFECT, REBIRTH_FLIP, ACTIVATE_FLASH, TARGET_ATTACK, FORCE_BLOCK, MOVE_SOUL_CORE, GRANDWALKER_PROTECTION, GRANDWALKER_CORE_RULE"],
        testedSuccessBehavior: 'Executes GRANDWALKER_CORE_RULE with state transition and invariant checks',
        testedRejectionBehavior: 'Fails closed on missing IR parameters / invalid context',
        stateInvariantsAsserted: ['state_transition_verified'],
        eventBehaviorAsserted: [],
        status: 'SEMANTICALLY_VERIFIED'
      }
    },
    evidenceStatus: 'SEMANTICALLY_VERIFIED',
    lastAuditRevision: 'Work Package H/I/J.1'
  }
};

export const CONDITION_EVIDENCE_REGISTRY = {
  CONTROL_CARD: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.CONTROL_CARD',
    testFile: 'tests/phase4a_structured_conditions.test.js',
    testIds: ['1. COND_CONTROL_CARD_TYPE_OR_FAMILY: parses and evaluates field presence, type, family, name, color, and counts'],
    trueTest: 'Returns TRUE when matching card is on controlled field',
    falseTest: 'Returns FALSE when matching card is absent',
    unsupportedTest: 'Returns UNSUPPORTED on malformed filter'
  },
  COLOR_SYMBOL: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.COLOR_SYMBOL',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Returns TRUE when controlled symbol count >= threshold',
    falseTest: 'Returns FALSE when symbol count < threshold',
    unsupportedTest: 'N/A'
  },
  COUNTER_THRESHOLD: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.COUNTER_THRESHOLD',
    testFile: 'tests/phase4a_structured_conditions.test.js',
    testIds: ['2. COND_COUNTER_THRESHOLD: evaluates counter thresholds, boundary conditions, and ownership'],
    trueTest: 'Returns TRUE when player counters meet threshold',
    falseTest: 'Returns FALSE when counters below threshold',
    unsupportedTest: 'N/A'
  },
  SOUL_CORE_ON_SPIRIT: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.SOUL_CORE_ON_SPIRIT',
    testFile: 'tests/phase4a_structured_conditions.test.js',
    testIds: ['3. COND_SOUL_CORE_ON_SPIRIT: checks soul core on source stack and field stacks with side validation'],
    trueTest: 'Returns TRUE when Soul Core is on qualifying Spirit',
    falseTest: 'Returns FALSE when Soul Core is in Reserve/Trash',
    unsupportedTest: 'N/A'
  },
  BURST_OR_MIRAGE_SET: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.BURST_OR_MIRAGE_SET',
    testFile: 'tests/phase4a_structured_conditions.test.js',
    testIds: ['4. COND_BURST_OR_MIRAGE_SET: evaluates Burst, Mirage, negation, color qualification, and OR combinator'],
    trueTest: 'Returns TRUE when Burst/Mirage is set',
    falseTest: 'Returns FALSE when slot is empty',
    unsupportedTest: 'N/A'
  },
  LIFE_THRESHOLD: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.LIFE_THRESHOLD',
    testFile: 'tests/work_package_c1_auditor_and_regression.test.js',
    testIds: ['C1-AUD-02: Auditor never marks parsed conditions without evaluator support as SEMANTICALLY_VERIFIED'],
    trueTest: 'Returns TRUE when life meets comparison',
    falseTest: 'Returns FALSE when life fails comparison',
    unsupportedTest: 'N/A'
  },
  BATTLING_STATE: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.BATTLING_STATE',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Returns TRUE when combat state matches',
    falseTest: 'Returns FALSE outside matching combat',
    unsupportedTest: 'N/A'
  },
  TURN_STEP_STATE: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.TURN_STEP_STATE',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Returns TRUE when active turn/step matches',
    falseTest: 'Returns FALSE on mismatch',
    unsupportedTest: 'N/A'
  },
  HAND_SIZE_THRESHOLD: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.HAND_SIZE_THRESHOLD',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Returns TRUE when hand size meets threshold',
    falseTest: 'Returns FALSE otherwise',
    unsupportedTest: 'N/A'
  },
  BP_ZERO: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.BP_ZERO',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Returns TRUE when effective BP === 0',
    falseTest: 'Returns FALSE when effective BP > 0',
    unsupportedTest: 'N/A'
  },
  SOUL_STATE: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.SOUL_STATE',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Returns TRUE when stack has Soul State',
    falseTest: 'Returns FALSE otherwise',
    unsupportedTest: 'N/A'
  },
  CARD_ZONE_STATE: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.CARD_ZONE_STATE',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Returns TRUE when card is in expected zone',
    falseTest: 'Returns FALSE otherwise',
    unsupportedTest: 'N/A'
  },
  TURN_HISTORY: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.TURN_HISTORY',
    testFile: 'tests/work_package_c_ops_conditions_compiler.test.js',
    testIds: ['WPC-4C5-COND: turnHistory tracks events, resets on END->START, and compound tri-state AND/OR/NOT is sound'],
    trueTest: 'Returns TRUE when event occurred this turn',
    falseTest: 'Returns FALSE after turn reset',
    unsupportedTest: 'N/A'
  },
  COMPOUND: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.COMPOUND',
    testFile: 'tests/work_package_c_ops_conditions_compiler.test.js',
    testIds: ['WPC-4C5-COND: turnHistory tracks events, resets on END->START, and compound tri-state AND/OR/NOT is sound'],
    trueTest: 'Tri-state AND/OR/NOT evaluates accurately',
    falseTest: 'Tri-state short-circuiting works',
    unsupportedTest: 'Propagates UNSUPPORTED on unknown child'
  },
  LEGACY_CONTEXT_CONDITION: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.LEGACY_CONTEXT_CONDITION',
    testFile: 'tests/effect_execution_targeting_conditions.test.js',
    testIds: ['COND-TRISTATE-01: evaluates battling, 0 BP, Soul State, step/turn, colorSymbol, hand size, zone state, compound AND/OR, and UNSUPPORTED'],
    trueTest: 'Known legacy forms evaluate accurately',
    falseTest: 'Known legacy forms return FALSE when unmet',
    unsupportedTest: 'Unknown legacy strings return UNSUPPORTED (never default TRUE)'
  },
  RESERVE_CORE_THRESHOLD: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.RESERVE_CORE_THRESHOLD',
    testFile: 'tests/work_package_fg1_restrictions_conditions_evidence.test.js',
    testIds: ['WPFG1-COND-01: Extended condition types evaluate TRUE, FALSE, UNSUPPORTED, missing context, and boundaries'],
    trueTest: 'Returns TRUE when Reserve core count satisfies comparison',
    falseTest: 'Returns FALSE when Reserve cores below threshold or player missing',
    unsupportedTest: 'Returns UNSUPPORTED for malformed core condition'
  },
  STACK_STATE: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.STACK_STATE',
    testFile: 'tests/work_package_fg1_restrictions_conditions_evidence.test.js',
    testIds: ['WPFG1-COND-01: Extended condition types evaluate TRUE, FALSE, UNSUPPORTED, missing context, and boundaries'],
    trueTest: 'Returns TRUE when target/source stack state matches expected state',
    falseTest: 'Returns FALSE on state mismatch or missing stack context',
    unsupportedTest: 'N/A'
  },
  CARD_RESULT: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.CARD_RESULT',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics', 'WPFG2-PARSER-01: Expanded deterministic condition parser patterns evaluate TRUE, FALSE, and UNSUPPORTED accurately'],
    trueTest: 'Returns TRUE when resolved card matches type/family/color/cost parity',
    falseTest: 'Returns FALSE when target card is present and mismatches predicate',
    unsupportedTest: 'Returns UNSUPPORTED when previousTarget / previousOpResult / cost context is missing'
  },
  FIELD_COMPOSITION: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.FIELD_COMPOSITION',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics', 'WPFG2-PARSER-01: Expanded deterministic condition parser patterns evaluate TRUE, FALSE, and UNSUPPORTED accurately'],
    trueTest: 'Returns TRUE when all controlled Spirits/Nexuses satisfy composition rule',
    falseTest: 'Returns FALSE when field array is empty or any controlled card violates rule',
    unsupportedTest: 'Returns UNSUPPORTED when state.players or field array context is missing'
  },
  BRAVE_STACK_STATE: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.BRAVE_STACK_STATE',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics', 'WPFG2-PARSER-01: Expanded deterministic condition parser patterns evaluate TRUE, FALSE, and UNSUPPORTED accurately'],
    trueTest: 'Returns TRUE when source stack (or state fallback) is Braved matching requirement or Soul Core is in Counter Area',
    falseTest: 'Returns FALSE when present source stack is unbraved / mismatches requirement or Counter Area lacks Soul Core',
    unsupportedTest: 'Returns UNSUPPORTED when sourceStack/counterArea context is missing or contradictory'
  },
  PREVIOUS_OP_SUCCESS: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.PREVIOUS_OP_SUCCESS',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics'],
    trueTest: 'Returns TRUE when prior operation succeeded / returned / discarded / destroyed',
    falseTest: 'Returns FALSE when prior operation result object indicates count 0 / failure',
    unsupportedTest: 'Returns UNSUPPORTED when previousOpResult / flag context is completely absent'
  },
  ATTACKING_OR_BLOCKING_SPIRIT: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.ATTACKING_OR_BLOCKING_SPIRIT',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics', 'WPFG2-PARSER-01: Expanded deterministic condition parser patterns evaluate TRUE, FALSE, and UNSUPPORTED accurately'],
    trueTest: 'Returns TRUE when active attacker/blocker matches side, role, and card filter',
    falseTest: 'Returns FALSE outside combat on valid game state or when filter mismatches',
    unsupportedTest: 'Returns UNSUPPORTED when battle/combat/players context is missing'
  },
  ZONE_CARD_COUNT: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.ZONE_CARD_COUNT',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics', 'WPFG2-PARSER-01: Expanded deterministic condition parser patterns evaluate TRUE, FALSE, and UNSUPPORTED accurately'],
    trueTest: 'Returns TRUE when zone card count/composition meets comparison',
    falseTest: 'Returns FALSE when zone array exists and count is below/outside threshold',
    unsupportedTest: 'Returns UNSUPPORTED when player or zone array context is missing'
  },
  SPIRIT_STAT_THRESHOLD: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.SPIRIT_STAT_THRESHOLD',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics', 'WPFG2-PARSER-01: Expanded deterministic condition parser patterns evaluate TRUE, FALSE, and UNSUPPORTED accurately'],
    trueTest: 'Returns TRUE when effective BP/Cost meets threshold or allowed values',
    falseTest: 'Returns FALSE when present stack/card stat is below/outside threshold',
    unsupportedTest: 'Returns UNSUPPORTED when target stack/card or BP/cost stat is missing or contradictory'
  },
  SOUL_CORE_LOCATION: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.SOUL_CORE_LOCATION',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics'],
    trueTest: 'Returns TRUE when Soul Core resides in expected zone',
    falseTest: 'Returns FALSE when zone exists and Soul Core is elsewhere',
    unsupportedTest: 'Returns UNSUPPORTED when player or target zone object/array is missing'
  },
  RESERVE_CORE_THRESHOLD: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.RESERVE_CORE_THRESHOLD',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics'],
    trueTest: 'Returns TRUE when Reserve cores meet threshold',
    falseTest: 'Returns FALSE when Reserve exists and total cores do not meet threshold',
    unsupportedTest: 'Returns UNSUPPORTED when player or reserve object is missing'
  },
  STACK_STATE: {
    parserEvidence: 'engine/conditions.js:parseConditionToStructured',
    evaluatorImplementation: 'engine/conditions.js:case CONDITION_TYPES.STACK_STATE',
    testFile: 'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
    testIds: ['WPFG2-TRISTATE-01: Missing, partial, contradictory, and fallback contexts enforce strict tri-state semantics'],
    trueTest: 'Returns TRUE when target/source stack state, DURING_ADVENT, or BRAVE_SPIRIT_FORM matches',
    falseTest: 'Returns FALSE when resolved stack is in opposite state',
    unsupportedTest: 'Returns UNSUPPORTED when stack context or st.state is missing or contradictory'
  }
};
