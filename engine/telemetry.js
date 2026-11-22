/**
 * engine/telemetry.js
 * 
 * Production Runtime Opcode Telemetry & Semantic Evidence System.
 * Records actual execution instances, arguments, state mutations, and outcomes.
 */

const isNode = typeof process !== 'undefined' && process.env;
let _enabled = isNode ? process.env.ENABLE_OPCODE_TELEMETRY === '1' : false;
const _records = [];
let _idCounter = 1;

export function isTelemetryEnabled() {
  return _enabled;
}

export function setTelemetryEnabled(flag) {
  _enabled = Boolean(flag);
}

export function recordOpcodeExecution(entry) {
  if (!_enabled) return;
  const id = `EVID-${entry.opcode}-${Date.now()}-${_idCounter++}`;
  const record = {
    evidenceId: id,
    timestamp: new Date().toISOString(),
    opcode: entry.opcode,
    cardId: entry.cardId || null,
    abilityId: entry.abilityId || null,
    clauseId: entry.clauseId || null,
    testSuite: process.env.CURRENT_TEST_SUITE || entry.testSuite || null,
    inputParams: entry.inputParams ? JSON.parse(JSON.stringify(entry.inputParams)) : {},
    preconditions: entry.preconditions || {},
    resultStatus: entry.resultStatus || 'UNKNOWN',
    executionSuccess: Boolean(entry.executionSuccess),
    stateDeltas: entry.stateDeltas || {},
    durationMs: entry.durationMs || 0
  };
  _records.push(record);
}

export function getRecordedTelemetry() {
  return _records;
}

export function clearRecordedTelemetry() {
  _records.length = 0;
  _idCounter = 1;
}
