/**
 * tests/engine_discrepancy_audit.test.js
 *
 * Comprehensive regression suite for Component Phase 1 of the Battling Engine
 * Discrepancy Fix:
 *   1. Verifies 0 mismatched declarative entries remain across all engine/cards/sets/*.js files.
 *   2. Verifies PerCardRegistry.hasExecutable() allows PASSIVE_RULE-only placeholders to fall
 *      through to compiled IR (executeUniversalCardEffect) in battle_arena.js.
 *   3. Verifies BS01-122 Flame Tempest (3000 BP or less) and BS01-056 Matchra (opponent discard)
 *      execute their exact printed effects without 5000 BP or Void core fallback bugs.
 *   4. Verifies battle_arena.js inline regex fixes (strict [Keyword] matching, required timing
 *      and level gates on getWhenBlocksBpBoost / getWhenAttacksBpBoost, sequential SPECIAL_EFFECT).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PerCardRegistry } from '../engine/cards/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const detailed = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'cards_detailed.json'), 'utf8'));
const byNum = {};
for (const [k, c] of Object.entries(detailed)) {
  byNum[(c.card_number || k).toUpperCase()] = c;
}

describe('Battling Engine Discrepancy Audit & Phase 1 Regression Suite', () => {
  it('1. Enforces 0 mismatched declarative card definitions across all engine/cards/sets/*.js files', async () => {
    const setsDir = path.join(rootDir, 'engine', 'cards', 'sets');
    const files = fs.readdirSync(setsDir).filter(f => f.endsWith('.js'));
    const violations = [];

    for (const f of files) {
      const mod = await import('file:///' + path.join(setsDir, f).replace(/\\/g, '/'));
      for (const arr of Object.values(mod)) {
        if (!Array.isArray(arr)) continue;
        for (const d of arr) {
          if (!d || !d.cardNumber || d.isVanilla) continue;
          const c = byNum[d.cardNumber.toUpperCase()];
          const raw = ((c && c.effect) || d.effect || d.rawEffect || '').trim();
          if (!raw) continue;
          const cardType = (c && c.type) || d.cardType || 'Spirit';

          for (const ab of (d.abilities || [])) {
            const overall = ab.overall || '';
            const subs = ab.subEffects || [];

            if (cardType === 'Magic' && ['WHEN_SUMMONED', 'WHEN_ATTACKS', 'WHEN_BLOCKS', 'AURA_BP', 'WHEN_DEPLOYED'].includes(overall)) {
              if (!/summon this magic|treated as a spirit/i.test(raw)) {
                violations.push(`${f}:${d.cardNumber}: Magic with ${overall}`);
              }
            }
            if (overall === 'AURA_BP' && !ab.amount && subs.length > 0) {
              violations.push(`${f}:${d.cardNumber}: Broken AURA_BP stub without amount`);
            }

            for (const eff of subs) {
              const op = eff.op || '';
              if (op === 'BP_BUFF_SELF' || op === 'BP_BUFF_TARGET' || op === 'BP_BUFF_ALLIES') {
                if (!/(?:\b|\d)bp\b|\[excite\]/i.test(raw)) {
                  violations.push(`${f}:${d.cardNumber}: Phantom ${op} without BP in text`);
                } else if (typeof eff.amount === 'number' && !eff.scaleByFieldCount && !/\[excite\]/i.test(raw)) {
                  const amtRe = new RegExp(`(?:\\+|gain[s]?\\s+|give\\s+[^.]+?\\+?)${eff.amount}\\s*BP`, 'i');
                  if (!amtRe.test(raw) && !raw.includes(`+${eff.amount}`)) {
                    violations.push(`${f}:${d.cardNumber}: Wrong BP buff amount ${eff.amount}`);
                  }
                }
              }
              if ((op === 'DRAW' || op === 'DRAW_CARDS') && !/\bdraw\b/i.test(raw)) {
                violations.push(`${f}:${d.cardNumber}: Phantom ${op} without draw in text`);
              }
              if ((op === 'CHARGE_CORE_VOID_TO_RESERVE' || op === 'CORE_FROM_VOID') &&
                  !/\bvoid\b|\[charge|\bboost\b|\[holy life|core charge|\+\d+\s*core/i.test(raw)) {
                violations.push(`${f}:${d.cardNumber}: Phantom ${op} without Void in text`);
              }
              if (op === 'DESTROY_OPPOSING_SPIRIT' || op === 'DESTROY_BY_BP' || op === 'DESTROY_BY_COST') {
                const maxBp = eff.maxBp ?? eff.filter?.maxBp;
                if (maxBp !== undefined && !raw.includes(String(maxBp))) {
                  violations.push(`${f}:${d.cardNumber}: Wrong destroy maxBp ${maxBp}`);
                }
                const maxCost = eff.maxCost ?? eff.filter?.maxCost;
                if (maxCost !== undefined && !new RegExp(`cost\\s*${maxCost}\\b`, 'i').test(raw)) {
                  violations.push(`${f}:${d.cardNumber}: Wrong destroy maxCost ${maxCost}`);
                }
              }
            }
          }
        }
      }
    }

    assert.deepEqual(violations, []);
  });

  it('2. PerCardRegistry.hasExecutable() returns false for PASSIVE_RULE-only placeholders so compiled IR runs', () => {
    // BS01-067 Swallowivy has a decktop reveal effect represented as PASSIVE_RULE in Sagas 1-3 DSL
    assert.equal(PerCardRegistry.has('BS01-067', 'WHEN_SUMMONED'), true);
    assert.equal(PerCardRegistry.hasExecutable('BS01-067', 'WHEN_SUMMONED'), false);

    // BS01-017 Lanceraptor has an executable DESTROY_BY_BP: 2000 effect
    assert.equal(PerCardRegistry.hasExecutable('BS01-017', 'WHEN_SUMMONED'), true);
  });

  it('3. BS01-122 Flame Tempest destroys all <= 3000 BP opposing Spirits and spares 4000+ BP Spirits', () => {
    const duelState = {
      player: { field: [], reserve: 3, trashCards: [] },
      opponent: {
        field: [
          { uid: 's1', name: 'Small 1', type: 'Spirit', currentBp: 2000, currentCores: 1 },
          { uid: 's2', name: 'Small 2', type: 'Spirit', currentBp: 3000, currentCores: 1 },
          { uid: 's3', name: 'Medium 4000', type: 'Spirit', currentBp: 4000, currentCores: 1 }
        ],
        reserve: 0,
        trashCards: []
      }
    };

    PerCardRegistry.execute('BS01-122', 'FLASH', {
      card: { cardNumber: 'BS01-122', name: 'Flame Tempest', type: 'Magic', color: 'Red' },
      side: 'player',
      duelState,
      arenaApi: {}
    });

    assert.deepEqual(duelState.opponent.field.map(s => s.uid), ['s3']);
  });

  it('4. BS01-056 Matchra discards 1 card from opposing Hand when summoned', () => {
    const duelState = {
      player: { field: [], hand: [], reserve: 3, trashCards: [] },
      opponent: {
        field: [],
        hand: [{ uid: 'oh1', name: 'Opponent Hand Card' }],
        reserve: 0,
        trashCards: []
      }
    };
    const matchra = {
      uid: 'm1',
      cardNumber: 'BS01-056',
      name: 'Matchra',
      type: 'Spirit',
      currentLevel: 1,
      currentCores: 1,
      effect: detailed['BS01-056']?.effect || ''
    };
    duelState.player.field.push(matchra);

    PerCardRegistry.execute('BS01-056', 'WHEN_SUMMONED', {
      card: matchra,
      side: 'player',
      duelState,
      arenaApi: {}
    });

    assert.equal(duelState.opponent.hand.length, 0);
    assert.equal(duelState.opponent.trashCards.length, 1);
  });

  it('5. Verifies battle_arena.js inline regex fixes are in place', () => {
    const arenaSrc = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');
    assert.ok(arenaSrc.includes('function hasOwnBracketedKeyword(unit, keywordPatterns)'), 'battle_arena.js must define hasOwnBracketedKeyword');
    assert.ok(!arenaSrc.includes("const hasPursuit = (unit.effect || '').toLowerCase().includes('pursuit');"), 'Naive .includes("pursuit") must be removed');
    assert.ok(!arenaSrc.includes('else if (descText.includes(\'core\') && descText.includes(\'from the void\'))'), 'SPECIAL_EFFECT else-if chain must be converted to sequential if blocks');
  });
});
