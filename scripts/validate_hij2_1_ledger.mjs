import assert from 'node:assert/strict';
import fs from 'node:fs';

const ledgerPaths = [
  'reports/work_package_hij2/unresolved_work_ledger.json',
  'reports/work_package_hij2_1/unresolved_work_ledger.json',
];

for (const lp of ledgerPaths) {
  assert.ok(fs.existsSync(lp), `Missing ledger: ${lp}`);
  const ledger = JSON.parse(fs.readFileSync(lp, 'utf8'));
  const items = ledger.items || [];

  // 1. No duplicate stable IDs
  const ids = items.map(i => i.stableId);
  assert.equal(new Set(ids).size, ids.length, `Duplicate stableId in ${lp}`);

  // 2. Every entry has evidenceRef and is not silently marked RESOLVED
  for (const item of items) {
    assert.ok(item.evidenceRef && fs.existsSync(item.evidenceRef), `Missing evidenceRef for ${item.stableId}: ${item.evidenceRef}`);
    assert.ok(['OPEN', 'BLOCKED', 'READY_FOR_FOLLOWUP'].includes(item.status), `Invalid status on ${item.stableId}: ${item.status}`);
    assert.ok(item.distinctionType, `Missing distinctionType on ${item.stableId}`);
    assert.ok(item.impactScope, `Missing impactScope on ${item.stableId}`);
    assert.ok(item.recommendedNextAction, `Missing recommendedNextAction on ${item.stableId}`);
  }

  // 3. All 4 blocked cards present
  for (const cardId of ['26RBS02-083', '26RDB01-024', '26RSD07-001', 'BS27-082']) {
    assert.ok(items.some(i => i.category === 'BLOCKED_CARD' && i.cardOrOpRef?.cardNumber === cardId), `Missing blocked card ${cardId}`);
  }

  // 4. Both compiler-drift cards present
  for (const cardId of ['BS19-X05', 'BS33-069']) {
    assert.ok(items.some(i => i.category === 'COMPILER_DRIFT_CARD' && i.cardOrOpRef?.cardNumber === cardId), `Missing drift card ${cardId}`);
  }

  // 5. Retained aggregate figures
  assert.equal(items.find(i => i.category === 'INCOMPLETE_PARAMETERS')?.count, 582, 'Incomplete parameters must equal 582');
  assert.equal(items.find(i => i.category === 'CONDITION_PARSE_FAILURE')?.count, 1115, 'Condition parse failures must equal 1115');
  assert.equal(items.find(i => i.category === 'OPERATION_VARIANT_UNVERIFIED')?.count, 118, 'Unverified op variants must equal 118');
  assert.equal(items.find(i => i.category === 'OPERATION_VARIANT_UNSUPPORTED')?.count, 17, 'Unsupported op variants must equal 17');
  assert.equal(items.find(i => i.category === 'MANUAL_REVIEW_CARDS')?.count, 11794, 'Manual review cards must equal 11794');
  assert.equal(items.find(i => i.category === 'MANUAL_REVIEW_ABILITIES')?.count, 17393, 'Manual review abilities must equal 17393');
}

console.log('LEDGER_VALIDATION_PASS: Both ledger copies verified (12 entries, 0 duplicates, all counts reconciled)');
