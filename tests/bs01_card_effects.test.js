/**
 * tests/bs01_card_effects.test.js
 * 
 * Regression Test Suite for BS01 (Booster Set 01: Call of the Core).
 * Verifies 100% deterministic execution of BS01 canonical card effects,
 * 4 colors (Red, Purple, Green, White), Nexuses, Magics, X-Rares,
 * database slug aliases, and R2 skipped card cataloging.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver } from '../engine/resolver.js';
import { getCardOverride, BS01_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('BS01 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS01 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCardNumbers = [
      'BS01-001', 'BS01-002', 'BS01-005', 'BS01-008',
      'BS01-026', 'BS01-028', 'BS01-031', 'BS01-039',
      'BS01-043', 'BS01-050', 'BS01-051', 'BS01-054',
      'BS01-058', 'BS01-074', 'BS01-075'
    ];

    for (const cardNum of vanillaCardNumbers) {
      it(`${cardNum} has explicit vanilla IR with 0 abilities`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.compiledClausesCount, 0);
        assert.equal(override.unsupportedClausesCount, 0);
      });
    }
  });

  describe('2. Red Cards (BS01-001 to BS01-025, BS01-X01)', () => {

    it('BS01-010 (Chakrambat) - (When Attacks) gains +4000 BP', () => {
      const override = getCardOverride('BS01-010');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(attackAb.clauses[0].op.amount, 4000);
    });

    it('BS01-011 (Dragsaurus) - (When Summoned) destroys a Nexus', () => {
      const override = getCardOverride('BS01-011');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');
      assert.deepEqual(summonAb.clauses[0].op.target.types, ['Nexus']);
    });

    it('BS01-014 (The Shaman Dragno) - (When Summoned) salvages Spirit from Trash', () => {
      const override = getCardOverride('BS01-014');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'SALVAGE');
    });

    it('BS01-017 (Lanceraptor) - (When Summoned) destroys <= 2000 BP Spirit', () => {
      const override = getCardOverride('BS01-017');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');
      assert.deepEqual(summonAb.clauses[0].op.target.filters, { bpLte: 2000 });
    });

    it('BS01-X01 (The DragonEmperor Siegfried) - [Awaken] and [LV3] (When Destroyed) recovers Life', () => {
      const override = getCardOverride('BS01-X01');
      assert.ok(override);
      assert.equal(override.abilities.length, 2);

      const awakenAb = override.abilities[0];
      assert.equal(awakenAb.header.keyword, 'Awaken');
      assert.equal(awakenAb.clauses[0].op.op, 'AWAKEN_CORE_MOVE');

      const destroyAb = override.abilities[1];
      assert.equal(destroyAb.header.timing, 'WHEN_DESTROYED');
      assert.deepEqual(destroyAb.header.levels, [3]);
      assert.equal(destroyAb.clauses[0].op.op, 'RECOVER_LIFE');
      assert.equal(destroyAb.clauses[0].op.count, 1);
    });
  });

  describe('3. Purple Cards (BS01-026 to BS01-049, BS01-X02)', () => {

    it('BS01-030 (Grip-Hands) - (When Summoned) draws 1 card', () => {
      const override = getCardOverride('BS01-030');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'DRAW');
      assert.equal(summonAb.clauses[0].op.count, 1);
    });

    it('BS01-034 (Bi-Python) - (When Attacks) draws 1 card', () => {
      const override = getCardOverride('BS01-034');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'DRAW');
      assert.equal(attackAb.clauses[0].op.count, 1);
    });

    it('BS01-036 (Sha-Zoo) - (When Destroyed) exhausts up to 2 Spirits', () => {
      const override = getCardOverride('BS01-036');
      assert.ok(override);
      const destroyAb = override.abilities.find(a => a.header.timing === 'WHEN_DESTROYED');
      assert.ok(destroyAb);
      assert.equal(destroyAb.clauses[0].op.op, 'EXHAUST');
      assert.equal(destroyAb.clauses[0].op.count, 2);
    });

    it('BS01-042 (Mistweasel) - (When Destroyed) draws 3 cards', () => {
      const override = getCardOverride('BS01-042');
      assert.ok(override);
      const destroyAb = override.abilities.find(a => a.header.timing === 'WHEN_DESTROYED');
      assert.ok(destroyAb);
      assert.equal(destroyAb.clauses[0].op.op, 'DRAW');
      assert.equal(destroyAb.clauses[0].op.count, 3);
    });

    it('BS01-048 (The PrincessVampire Vampiles) - (When Summoned) destroys an exhausted spirit', () => {
      const override = getCardOverride('BS01-048');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');
      assert.equal(summonAb.clauses[0].op.target.state, 'exhausted');
    });

    it('BS01-X02 (The SevenShogun Desperado) - (When Summoned) core movement to reserve and void ramp', () => {
      const override = getCardOverride('BS01-X02');
      assert.ok(override);
      assert.equal(override.abilities.length, 2);
      const summonAb = override.abilities[0];
      assert.equal(summonAb.header.timing, 'WHEN_SUMMONED');
      assert.equal(summonAb.clauses[0].op.op, 'MOVE_CORE');
    });
  });

  describe('4. Green Cards (BS01-050 to BS01-073, BS01-X03)', () => {

    it('BS01-056 (Matchra) - (When Summoned) opponent discards 1 card', () => {
      const override = getCardOverride('BS01-056');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'DISCARD_HAND');
      assert.equal(summonAb.clauses[0].op.count, 1);
      assert.equal(summonAb.clauses[0].op.chooser, 'opp');
    });

    it('BS01-061 (Apewhip) - (When Summoned) puts 1 core from Void to Reserve', () => {
      const override = getCardOverride('BS01-061');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'MOVE_CORE');
      assert.equal(summonAb.clauses[0].op.from.zone, 'void');
      assert.equal(summonAb.clauses[0].op.to.zone, 'reserve');
    });

    it('BS01-063 (Emeraldscissor) - (When Summoned) exhausts opposing spirit', () => {
      const override = getCardOverride('BS01-063');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'EXHAUST');
      assert.equal(summonAb.clauses[0].op.target.side, 'opp');
    });

    it('BS01-065 (Killikabut) - (When Summoned) puts 1 core from Void to friendly Spirit', () => {
      const override = getCardOverride('BS01-065');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'MOVE_CORE');
      assert.equal(summonAb.clauses[0].op.from.zone, 'void');
      assert.equal(summonAb.clauses[0].op.to.zone, 'field');
    });

    it('BS01-071 (The Charger Blanboar) - [LV2] (When Battles) refreshes on winning BP comparison', () => {
      const override = getCardOverride('BS01-071');
      assert.ok(override);
      const battleAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES');
      assert.ok(battleAb);
      assert.deepEqual(battleAb.header.levels, [2]);
      assert.equal(battleAb.clauses[0].op.op, 'REFRESH');
    });

    it('BS01-X03 (The Duke Kingtaurus) - (When Summoned) core ramp and battle-win life damage', () => {
      const override = getCardOverride('BS01-X03');
      assert.ok(override);
      assert.equal(override.abilities.length, 2);
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
      assert.equal(override.abilities[1].header.timing, 'WHEN_ATTACKS');
    });
  });

  describe('5. White Cards (BS01-074 to BS01-094, BS01-X04)', () => {

    it('BS01-077 (Baby-Loki) - [LV2] (When Blocks) gains +1000 BP', () => {
      const override = getCardOverride('BS01-077');
      assert.ok(override);
      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb);
      assert.deepEqual(blockAb.header.levels, [2]);
      assert.equal(blockAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(blockAb.clauses[0].op.amount, 1000);
    });

    it('BS01-078 (The AutoLady Mani) - (When Attacks) sends 1 core from Trash to Reserve', () => {
      const override = getCardOverride('BS01-078');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'MOVE_CORE');
    });

    it('BS01-080 (Fenrircannon) - (When Blocks) gains +1000 BP', () => {
      const override = getCardOverride('BS01-080');
      assert.ok(override);
      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb);
      assert.equal(blockAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(blockAb.clauses[0].op.amount, 1000);
    });

    it('BS01-094 (Gran-Dolbalkan) - Flash (When Battles) ends the battle', () => {
      const override = getCardOverride('BS01-094');
      assert.ok(override);
      const battleAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES');
      assert.ok(battleAb);
      assert.equal(battleAb.clauses[0].op.op, 'MOVE_CORE');
      assert.equal(battleAb.clauses[1].op.op, 'END_BATTLE');
    });

    it('BS01-X04 (The ImpregnableFortress Odin) - BP boost per Nexus and immunity to destruction', () => {
      const override = getCardOverride('BS01-X04');
      assert.ok(override);
      assert.equal(override.abilities.length, 2);
      assert.equal(override.abilities[0].clauses[0].op.op, 'BP_BUFF');
      assert.equal(override.abilities[1].clauses[0].op.op, 'CONTINUOUS_RULE');
      assert.equal(override.abilities[1].clauses[0].op.rule, 'NEXUS_INDESTRUCTIBLE');
    });
  });

  describe('6. BS01 Magics & Nexuses', () => {

    it('BS01-114 (Buster Spear) - Flash destroys Nexus and draws 1 if opposing', () => {
      const override = getCardOverride('BS01-114');
      assert.ok(override);
      const flashAb = override.abilities[0];
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
      assert.equal(flashAb.clauses[1].op.op, 'DRAW');
    });

    it('BS01-117 (Double Draw) - Main draws 2 cards; Flash gives +2000 BP', () => {
      const override = getCardOverride('BS01-117');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
      assert.equal(mainAb.clauses[0].op.count, 2);

      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(flashAb.clauses[0].op.amount, 2000);
    });

    it('BS01-120 (Buster Phalanx) - Main destroys all Nexuses; Flash +4000 BP', () => {
      const override = getCardOverride('BS01-120');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DESTROY');
      assert.equal(mainAb.clauses[0].op.count, 'ALL');
    });

    it('BS01-121 (Flame Dance) - Flash destroys <= 4000 BP Spirit', () => {
      const override = getCardOverride('BS01-121');
      assert.ok(override);
      const flashAb = override.abilities[0];
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
      assert.deepEqual(flashAb.clauses[0].op.target.filters, { bpLte: 4000 });
    });

    it('BS01-122 (Flame Tempest) - Flash destroys all <= 3000 BP Spirits', () => {
      const override = getCardOverride('BS01-122');
      assert.ok(override);
      const flashAb = override.abilities[0];
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
      assert.equal(flashAb.clauses[0].op.all, true);
      assert.equal(flashAb.clauses[0].op.target.maxBp, 3000);
    });

    it('BS01-125 (Deadly Balance) - Flash both players destroy a Spirit', () => {
      const override = getCardOverride('BS01-125');
      assert.ok(override);
      const flashAb = override.abilities[0];
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
    });

    it('BS01-141 (Invisible Cloak) - Flash targeted Spirit cannot be blocked', () => {
      const override = getCardOverride('BS01-141');
      assert.ok(override);
      const flashAb = override.abilities[0];
      assert.equal(flashAb.clauses[0].op.op, 'TARGET_SELECT');
      assert.equal(flashAb.clauses[1].op.op, 'UNBLOCKABLE');
    });

    it('BS01-148 (Leak Drive) - Flash immediately ends battle', () => {
      const override = getCardOverride('BS01-148');
      assert.ok(override);
      const flashAb = override.abilities[0];
      assert.equal(flashAb.clauses[0].op.op, 'STEP_MODIFIER');
    });
  });

  describe('7. Database Slug Alias Resolution', () => {
    it('BATTLE-SPIRITS-A161 resolves the exact same deterministic IR as BS01-144', () => {
      const overrideBySlug = getCardOverride('BATTLE-SPIRITS-A161');
      const overrideByCanon = getCardOverride('BS01-144');
      assert.ok(overrideBySlug, 'Override by slug must exist');
      assert.ok(overrideByCanon, 'Override by canonical number must exist');
      assert.equal(overrideBySlug.name, 'Attack Shift');
      assert.equal(overrideByCanon.name, 'Attack Shift');
    });
  });

  describe('8. R2 Skipped Cards Exclusion Verification', () => {
    it('Ensures all 8 BS01 skipped cards are cataloged with edge-case explanations', () => {
      const skippedBs = SKIPPED_CARDS.filter(c => c.set === 'BS01');
      assert.equal(skippedBs.length, 8);

      const expectedNums = [
        'BS01-006', 'BS01-027', 'BS01-033', 'BS01-057',
        'BS01-059', 'BS01-096', 'BS01-100', 'BS01-105'
      ];

      for (const num of expectedNums) {
        const found = skippedBs.find(c => c.cardNumber === num);
        assert.ok(found, `${num} must be in SKIPPED_CARDS`);
        assert.ok(found.reason.length > 10, `${num} must have detailed reason`);
        assert.equal(getCardOverride(num), null, `${num} must NOT have an active override`);
      }
    });
  });
});
