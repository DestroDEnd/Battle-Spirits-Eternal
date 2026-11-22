import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConditionSubsystemInventory } from '../scripts/audit_514_cards_exhaustive.mjs';

test('WFG-INV-01: condition inventory reads parse failures from evidence counts, not parsed types', () => {
  const inventory = buildConditionSubsystemInventory({
    totalConditionInstances: 4940,
    reconciledWithAuthoritativeEnumerator: true,
    byStructuredType: { CONTROL_CARD: 607, COLOR_SYMBOL: 411 },
    evidenceBreakdown: {
      PARSE_FAILURE: 2218,
      PARSED_UNSUPPORTED_TYPE: 0,
      PARSED_EVALUABLE_UNVERIFIED: 1189,
      SEMANTICALLY_VERIFIED: 1533,
      NEEDS_MANUAL_REVIEW: 0
    }
  });

  assert.equal(inventory.parseFailureCount, 2218);
  assert.equal(inventory.byStructuredType.PARSE_FAILURE, undefined);
  assert.equal(inventory.evidenceBreakdown.PARSE_FAILURE, 2218);
});
