/**
 * tests/work_package_hij_real_cards_e2e.test.js
 * Classifications:
 * - CARD_ABILITY_E2E: Full provenance (cards_detailed -> compileCard -> semantic IR match -> AsyncResolver -> exact state/event + negative assertions)
 * - CARD_RULES_E2E: Full provenance + downstream rules engine enforcement
 * - CARD_IR_EXECUTION: Stored IR executed via AsyncResolver with exact assertions; reclassified due to documented compiler-to-IR mismatch.
 */

import test from 'node:test';
import { runCardAbilityE2E, runCardRulesE2E } from './helpers/card_e2e_framework.mjs';

test("HIJ1-E2E-001 [CARD_ABILITY_E2E]: CP14-X01R (The ImmortalDragon Eternal-Dragonis) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "1000.json", cardKey: "CP14-X01R", cardNumber: "CP14-X01R", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-002 [CARD_ABILITY_E2E]: CP14-X14R (The ShiningSwordDragonEmperor Shining-Ryuuman) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "1000.json", cardKey: "CP14-X14R", cardNumber: "CP14-X14R", abIdx: 2, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-003 [CARD_ABILITY_E2E]: 18-1 (The Amusement Paradise) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "18.json", cardKey: "18-1", cardNumber: "18-1", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-004 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A7434 (Revol-Arms) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "2011.json", cardKey: "BATTLE-SPIRITS-A7434", cardNumber: "BATTLE-SPIRITS-A7434", abIdx: 1, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-005 [CARD_ABILITY_E2E]: P14-24 (The FallenKnight Harut) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "2014.json", cardKey: "P14-24", cardNumber: "P14-24", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-006 [CARD_ABILITY_E2E]: P16-02 (The BlackDeathDragon Bloodbone) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "2016.json", cardKey: "P16-02", cardNumber: "P16-02", abIdx: 1, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-007 [CARD_ABILITY_E2E]: P19-05 (The PyroxeneDragonballUser Batrei) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "2019.json", cardKey: "P19-05", cardNumber: "P19-05", abIdx: 2, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-008 [CARD_ABILITY_E2E]: 26RBS01-062 (Aloucast) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-062", cardNumber: "26RBS01-062", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-009 [CARD_ABILITY_E2E]: 26RBS01-082 (Badgernan) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-082", cardNumber: "26RBS01-082", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-010 [CARD_ABILITY_E2E]: 26RBS01-022 (Centicade) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-022", cardNumber: "26RBS01-022", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-011 [CARD_ABILITY_E2E]: 26RBS01-050 (Claydoro) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-050", cardNumber: "26RBS01-050", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-012 [CARD_ABILITY_E2E]: 26RBS01-018 (Dead Laika) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-018", cardNumber: "26RBS01-018", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-013 [CARD_ABILITY_E2E]: 26RBS01-038 (Gaviadile) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-038", cardNumber: "26RBS01-038", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-014 [CARD_ABILITY_E2E]: 26RBS01-048 (Goztaurus) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-048", cardNumber: "26RBS01-048", abIdx: 0, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-015 [CARD_ABILITY_E2E]: 26RBS01-096 (Hunting Tree) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-096", cardNumber: "26RBS01-096", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-016 [CARD_ABILITY_E2E]: 26RBS01-057 (Hopli-Shimmer) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-057", cardNumber: "26RBS01-057", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-017 [CARD_ABILITY_E2E]: 26RBS01-101 (Lamp Line) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-101", cardNumber: "26RBS01-101", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-018 [CARD_ABILITY_E2E]: 26RBS01-086 (Ligeron) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-086", cardNumber: "26RBS01-086", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-019 [CARD_ABILITY_E2E]: 26RBS01-051 (Meztaurus) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-051", cardNumber: "26RBS01-051", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-020 [CARD_ABILITY_E2E]: 26RBS01-060 (Mudoro) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-060", cardNumber: "26RBS01-060", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-021 [CARD_ABILITY_E2E]: 26RBS01-020 (Odonatta) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-020", cardNumber: "26RBS01-020", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-022 [CARD_ABILITY_E2E]: 26RBS01-006 (Pawgriffo) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-006", cardNumber: "26RBS01-006", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-023 [CARD_ABILITY_E2E]: 26RBS01-054 (Pepper's Beast) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-054", cardNumber: "26RBS01-054", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-024 [CARD_ABILITY_E2E]: 26RBS01-032 (Regatracus) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-032", cardNumber: "26RBS01-032", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-025 [CARD_ABILITY_E2E]: 26RBS01-012 (Regulinaz) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-012", cardNumber: "26RBS01-012", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-026 [CARD_ABILITY_E2E]: 26RBS01-104 (The Beast’s Maw Lair) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-104", cardNumber: "26RBS01-104", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-027 [CARD_ABILITY_E2E]: 26RBS01-095 (The High-Rise Tombs) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-095", cardNumber: "26RBS01-095", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-028 [CARD_ABILITY_E2E]: 26RBS01-088 (The Honorable Saintar) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-088", cardNumber: "26RBS01-088", abIdx: 0, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-029 [CARD_ABILITY_E2E]: 26RBS01-055 (The LiquidSilver Fransil) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-055", cardNumber: "26RBS01-055", abIdx: 0, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-030 [CARD_ABILITY_E2E]: 26RBS01-X14 (The MegaThunder Zelotl) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-X14", cardNumber: "26RBS01-X14", abIdx: 1, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-031 [CARD_ABILITY_E2E]: 26RBS01-028 (The MysticPurple Baphomendes) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-028", cardNumber: "26RBS01-028", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-032 [CARD_ABILITY_E2E]: 26RBS01-107 (The Seed-Showering Giant Tree) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-107", cardNumber: "26RBS01-107", abIdx: 0, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-033 [CARD_ABILITY_E2E]: 26RBS01-108 (The Vitality Woods) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-108", cardNumber: "26RBS01-108", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-035 [CARD_ABILITY_E2E]: 26RBS02-023 (Lamenting Larona) resolves ACTIVATE_EFFECT_ACTION", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-023", cardNumber: "26RBS02-023", abIdx: 1, expectedOp: "ACTIVATE_EFFECT_ACTION", requireCompilerMatch: true });
});

test("HIJ1-E2E-036 [CARD_ABILITY_E2E]: 26RBS02-X14 (The FlashFuryPrincess Soljuret) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-X14", cardNumber: "26RBS02-X14", abIdx: 1, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-037 [CARD_ABILITY_E2E]: 26RBS02-069 (The Leapfrogger Pediez) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-069", cardNumber: "26RBS02-069", abIdx: 1, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-038 [CARD_ABILITY_E2E]: 26RBS02-X13 (The Puppeteer Marinel) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-X13", cardNumber: "26RBS02-X13", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-040 [CARD_ABILITY_E2E]: 26RBS02-X08 (The TridentSpear Caricoan) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-X08", cardNumber: "26RBS02-X08", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-041 [CARD_ABILITY_E2E]: 26RBS02-085 (War Phase: Surge of Tree Roots) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-085", cardNumber: "26RBS02-085", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-042 [CARD_ABILITY_E2E]: 26RBS03-085 (Flowerwork) resolves DRAW", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS03.json", cardKey: "26RBS03-085", cardNumber: "26RBS03-085", abIdx: 1, expectedOp: "DRAW", requireCompilerMatch: true });
});

test("HIJ1-E2E-043 [CARD_ABILITY_E2E]: 26RBS03-X03 (The PurgatoryPhoenix Zekuga) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS03.json", cardKey: "26RBS03-X03", cardNumber: "26RBS03-X03", abIdx: 1, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-044 [CARD_ABILITY_E2E]: 26RBS03-023 (The Unyielding Salisrola) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS03.json", cardKey: "26RBS03-023", cardNumber: "26RBS03-023", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-045 [CARD_ABILITY_E2E]: 26RBS03-076 (The Venomous Bottomless Swamp) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS03.json", cardKey: "26RBS03-076", cardNumber: "26RBS03-076", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-046 [CARD_ABILITY_E2E]: 26RBS03-083 (War Feat: Blockade of the Abyss) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS03.json", cardKey: "26RBS03-083", cardNumber: "26RBS03-083", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-047 [CARD_ABILITY_E2E]: 26RBS03-082 (War Feat: Occupation of the White Heaven Plain) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS03.json", cardKey: "26RBS03-082", cardNumber: "26RBS03-082", abIdx: 1, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-048 [CARD_ABILITY_E2E]: 26RCB01-008 (Kamen Rider Gaim Jimber Lemon Arms (26RCB01-008)) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-008", cardNumber: "26RCB01-008", abIdx: 0, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-049 [CARD_ABILITY_E2E]: 26RCB01-011 (Kamen Rider Gaim Kachidoki Arms (26RCB01-011)) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-011", cardNumber: "26RCB01-011", abIdx: 1, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-050 [CARD_ABILITY_E2E]: 26RCB01-052 (Kamen Rider Ex-Aid Maximum Gamer Level 99 (26RCB01-052)) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-052", cardNumber: "26RCB01-052", abIdx: 0, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-051 [CARD_ABILITY_E2E]: 26RCB01-050 (Kamen Rider Lazer Turbo Bike Gamer Level 0 (26RCB01-050)) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-050", cardNumber: "26RCB01-050", abIdx: 1, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-052 [CARD_ABILITY_E2E]: 26RCB01-049 (Kamen Rider Para-DX Fighter Gamer Level 50 (26RCB01-049)) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-049", cardNumber: "26RCB01-049", abIdx: 1, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-053 [CARD_ABILITY_E2E]: 26RCB01-021 (Kamen Rider Nox Gun Shadow) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-021", cardNumber: "26RCB01-021", abIdx: 1, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-054 [CARD_ABILITY_E2E]: 26RCB01-019 (Kamen Rider Nox Wolf Shadow) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-019", cardNumber: "26RCB01-019", abIdx: 0, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-055 [CARD_ABILITY_E2E]: 26RCB01-048 (Kamen Rider Para-DX Puzzle Gamer Level 50 (26RCB01-048)) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-048", cardNumber: "26RCB01-048", abIdx: 1, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-056 [CARD_ABILITY_E2E]: 26RCB01-X01 (Kamen Rider Zangetsu-Shin Melon Energy Arms (26RCB01-X01)) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-X01", cardNumber: "26RCB01-X01", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-057 [CARD_ABILITY_E2E]: 26RCB01-024 (Kamen Rider Zeztz Inazuma Plasma) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-024", cardNumber: "26RCB01-024", abIdx: 0, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-058 [CARD_ABILITY_E2E]: 26RDB01-053 (Fortress Stage) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RDB01.json", cardKey: "26RDB01-053", cardNumber: "26RDB01-053", abIdx: 2, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-059 [CARD_ABILITY_E2E]: 26RDB01-049 (Red Stella: The Main Stars Performance) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "26RDB01.json", cardKey: "26RDB01-049", cardNumber: "26RDB01-049", abIdx: 2, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-061 [CARD_ABILITY_E2E]: 26RDB01-030 (［Magic Jewel Origin］Morrigan) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RDB01.json", cardKey: "26RDB01-030", cardNumber: "26RDB01-030", abIdx: 1, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-062 [CARD_ABILITY_E2E]: 26RSD01-006 (Cupell) resolves RETRIEVE_CORES", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD01.json", cardKey: "26RSD01-006", cardNumber: "26RSD01-006", abIdx: 0, expectedOp: "RETRIEVE_CORES", requireCompilerMatch: true });
});

test("HIJ1-E2E-063 [CARD_ABILITY_E2E]: 26RSD02-009 (Utmost Depth: The Bloodrouse Mountain Range) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD02.json", cardKey: "26RSD02-009", cardNumber: "26RSD02-009", abIdx: 1, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-064 [CARD_ABILITY_E2E]: 26RSD04-004 (The HeavyClaw Forclawer) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD04.json", cardKey: "26RSD04-004", cardNumber: "26RSD04-004", abIdx: 1, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-065 [CARD_ABILITY_E2E]: 26RSD04-009 (The Quarry Plain) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD04.json", cardKey: "26RSD04-009", cardNumber: "26RSD04-009", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-066 [CARD_ABILITY_E2E]: 26RSD06-X01 (The ShieldHorn Gigantherion) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD06.json", cardKey: "26RSD06-X01", cardNumber: "26RSD06-X01", abIdx: 1, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-068 [CARD_ABILITY_E2E]: 26RSD07-007 (Kamen Rider Zeztz Esprim Recovery) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD07.json", cardKey: "26RSD07-007", cardNumber: "26RSD07-007", abIdx: 0, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-069 [CARD_ABILITY_E2E]: 26RSD07-X02 (Kamen Rider Zeztz Orderm) resolves BOUNCE", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD07.json", cardKey: "26RSD07-X02", cardNumber: "26RSD07-X02", abIdx: 0, expectedOp: "BOUNCE", requireCompilerMatch: true });
});

test("HIJ1-E2E-070 [CARD_ABILITY_E2E]: 26RSD08-009 (［Dark Dragon Origin］Tyara Norsauran) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "26RSD08.json", cardKey: "26RSD08-009", cardNumber: "26RSD08-009", abIdx: 2, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-071 [CARD_ABILITY_E2E]: ACK8012034-0001 (The LongswordGeneral Zangekidragon) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "ACK8012034.json", cardKey: "ACK8012034-0001", cardNumber: "ACK8012034-0001", abIdx: 2, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-072 [CARD_ABILITY_E2E]: AL-SAACHEZ (Ali al-Saachez) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "AL.json", cardKey: "AL-SAACHEZ", cardNumber: "AL-SAACHEZ", abIdx: 2, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-073 [CARD_ABILITY_E2E]: ALPINE-BIT (The Second's WhiteKnight Alpine-Bit) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "ALPINE.json", cardKey: "ALPINE-BIT", cardNumber: "ALPINE-BIT", abIdx: 1, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-074 [CARD_ABILITY_E2E]: P25-02 (The CavalierLanceMartialArtist Skeldon) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "AUG.json", cardKey: "P25-02", cardNumber: "P25-02", abIdx: 2, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-075 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A2714 (Arch-Arms) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BATTLE.json", cardKey: "BATTLE-SPIRITS-A2714", cardNumber: "BATTLE-SPIRITS-A2714", abIdx: 1, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-076 [CARD_ABILITY_E2E]: P14-18 (Battle Spirits with Everyone!) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BATTLE.json", cardKey: "P14-18", cardNumber: "P14-18", abIdx: 1, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-077 [CARD_ABILITY_E2E]: SJ13-04 (The SpiralHatchet Gale-Axe) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BATTLE.json", cardKey: "SJ13-04", cardNumber: "SJ13-04", abIdx: 1, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-078 [CARD_ABILITY_E2E]: BONE-SCOUT01 (Bone-Scout) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "BONE.json", cardKey: "BONE-SCOUT01", cardNumber: "BONE-SCOUT01", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-079 [CARD_ABILITY_E2E]: BROS-TIGER (The TwentySeventhBeast Bros-Tiger) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "BROS.json", cardKey: "BROS-TIGER", cardNumber: "BROS-TIGER", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-080 [CARD_ABILITY_E2E]: BS01-120 (Buster Phalanx) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-120", cardNumber: "BS01-120", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-081 [CARD_ABILITY_E2E]: BS01-036 (Sha-Zoo) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-036", cardNumber: "BS01-036", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-082 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A2148 (Dark Coffin) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BATTLE-SPIRITS-A2148", cardNumber: "BATTLE-SPIRITS-A2148", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-083 [CARD_ABILITY_E2E]: BS01-040 (Darkwitch) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-040", cardNumber: "BS01-040", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-084 [CARD_ABILITY_E2E]: BS01-125 (Deadly Balance) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-125", cardNumber: "BS01-125", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-085 [CARD_ABILITY_E2E]: BS01-011 (Dragsaurus) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-011", cardNumber: "BS01-011", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-086 [CARD_ABILITY_E2E]: BS01-122 (Flame Tempest) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-122", cardNumber: "BS01-122", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-087 [CARD_ABILITY_E2E]: BS01-017 (Lanceraptor) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-017", cardNumber: "BS01-017", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-088 [CARD_ABILITY_E2E]: METALDY-BUG2 (Metaldy-Bug) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "METALDY-BUG2", cardNumber: "METALDY-BUG2", abIdx: 0, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-089 [CARD_ABILITY_E2E]: BS01-129 (Poison Shoot) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-129", cardNumber: "BS01-129", abIdx: 0, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-090 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A2212 (Shadow Elixir) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BATTLE-SPIRITS-A2212", cardNumber: "BATTLE-SPIRITS-A2212", abIdx: 0, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-091 [CARD_ABILITY_E2E]: BS01-024 (The CrystalDragon Diamat) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-024", cardNumber: "BS01-024", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-092 [CARD_ABILITY_E2E]: BS01-025 (The DragonicFortress Giga) resolves DESTROY", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-025", cardNumber: "BS01-025", abIdx: 0, expectedOp: "DESTROY", requireCompilerMatch: true });
});

test("HIJ1-E2E-093 [CARD_ABILITY_E2E]: BS01-X03 (The Duke Kingtaurus) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BS01-X03", cardNumber: "BS01-X03", abIdx: 1, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-094 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A2246 (The Hermit Wise Tree) resolves REFRESH", async () => {
  await runCardAbilityE2E({ shardFile: "BS01.json", cardKey: "BATTLE-SPIRITS-A2246", cardNumber: "BATTLE-SPIRITS-A2246", abIdx: 1, expectedOp: "REFRESH", requireCompilerMatch: true });
});

test("HIJ1-E2E-095 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A955 (Mummella) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS02.json", cardKey: "BATTLE-SPIRITS-A955", cardNumber: "BATTLE-SPIRITS-A955", abIdx: 0, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-097 [CARD_ABILITY_E2E]: BS02-079 (The Forest of Amethyst) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS02.json", cardKey: "BS02-079", cardNumber: "BS02-079", abIdx: 0, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-098 [CARD_ABILITY_E2E]: BS02-036 (The Great Kaiseleon) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS02.json", cardKey: "BS02-036", cardNumber: "BS02-036", abIdx: 1, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-099 [CARD_ABILITY_E2E]: BS02-073 (The Kaiser Empereur) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS02.json", cardKey: "BS02-073", cardNumber: "BS02-073", abIdx: 0, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-100 [CARD_ABILITY_E2E]: BS02-077 (The Plateau of Duel) resolves REFRESH", async () => {
  await runCardAbilityE2E({ shardFile: "BS02.json", cardKey: "BS02-077", cardNumber: "BS02-077", abIdx: 1, expectedOp: "REFRESH", requireCompilerMatch: true });
});

test("HIJ1-E2E-101 [CARD_ABILITY_E2E]: BS02-X06 (The SevenShogun Destlord) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS02.json", cardKey: "BS02-X06", cardNumber: "BS02-X06", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-102 [CARD_ABILITY_E2E]: ZO-GOIN2 (The SkullKnight Zo-Goin) resolves MOVE_CORE", async () => {
  await runCardAbilityE2E({ shardFile: "BS02.json", cardKey: "ZO-GOIN2", cardNumber: "ZO-GOIN2", abIdx: 0, expectedOp: "MOVE_CORE", requireCompilerMatch: true });
});

test("HIJ1-E2E-103 [CARD_ABILITY_E2E]: BS03-127 (Ivy Cage) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "BS03-127", cardNumber: "BS03-127", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-104 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A6513 (Mikene) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A6513", cardNumber: "BATTLE-SPIRITS-A6513", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-105 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A9188 (The Crossroads of Destiny) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A9188", cardNumber: "BATTLE-SPIRITS-A9188", abIdx: 1, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-106 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A9305 (The DarkReefDiva Seiren) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A9305", cardNumber: "BATTLE-SPIRITS-A9305", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-107 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A10823 (The High Sky Covered by Metal) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A10823", cardNumber: "BATTLE-SPIRITS-A10823", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-108 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A11148 (The Kingdom of Cards) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A11148", cardNumber: "BATTLE-SPIRITS-A11148", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-109 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A11637 (The Outlaw Wasteland) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A11637", cardNumber: "BATTLE-SPIRITS-A11637", abIdx: 1, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-110 [CARD_ABILITY_E2E]: VER-THANDIA2 (Ver-Thandia) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS03.json", cardKey: "VER-THANDIA2", cardNumber: "VER-THANDIA2", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-111 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A184 (Alligade) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS04.json", cardKey: "BATTLE-SPIRITS-A184", cardNumber: "BATTLE-SPIRITS-A184", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-112 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A5282 (Jungle Law) resolves EXHAUST", async () => {
  await runCardAbilityE2E({ shardFile: "BS04.json", cardKey: "BATTLE-SPIRITS-A5282", cardNumber: "BATTLE-SPIRITS-A5282", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
});

test("HIJ1-E2E-113 [CARD_ABILITY_E2E]: BS06-X22 (The SevenShogun Beelzebeat) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "BS06.json", cardKey: "BS06-X22", cardNumber: "BS06-X22", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-114 [CARD_ABILITY_E2E]: BS06-090 (The Honorable Fight) resolves REFRESH", async () => {
  await runCardAbilityE2E({ shardFile: "BS06.json", cardKey: "BS06-090", cardNumber: "BS06-090", abIdx: 1, expectedOp: "REFRESH", requireCompilerMatch: true });
});

test("HIJ1-E2E-115 [CARD_ABILITY_E2E]: BS07-045 (The HolyEmperorBeast Sphin-Cross) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "BS07.json", cardKey: "BS07-045", cardNumber: "BS07-045", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-116 [CARD_ABILITY_E2E]: BS08-013 (Andrealphas) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "BS08.json", cardKey: "BS08-013", cardNumber: "BS08-013", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-117 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A3577 (DarkAnkillersaurus) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "BS08.json", cardKey: "BATTLE-SPIRITS-A3577", cardNumber: "BATTLE-SPIRITS-A3577", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-118 [CARD_ABILITY_E2E]: BS08-062 (The Gravity Dimension Engine) resolves SUMMON", async () => {
  await runCardAbilityE2E({ shardFile: "BS08.json", cardKey: "BS08-062", cardNumber: "BS08-062", abIdx: 0, expectedOp: "SUMMON", requireCompilerMatch: true });
});

test("HIJ1-E2E-119 [CARD_ABILITY_E2E]: BS14-049 (The Butler Pentan) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS14.json", cardKey: "BS14-049", cardNumber: "BS14-049", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-120 [CARD_ABILITY_E2E]: BS15-X06 (The IronHero Saigord-Golem) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS15.json", cardKey: "BS15-X06", cardNumber: "BS15-X06", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-121 [CARD_ABILITY_E2E]: BS17-022 (Tarzania Great) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS17.json", cardKey: "BS17-022", cardNumber: "BS17-022", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-131 [CARD_ABILITY_E2E]: BS24-067 (Ultimate-Trenton) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS24.json", cardKey: "BS24-067", cardNumber: "BS24-067", abIdx: 1, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-132 [CARD_ABILITY_E2E]: BS25-042 (The Paladin Pentan) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS25.json", cardKey: "BS25-042", cardNumber: "BS25-042", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-136 [CARD_ABILITY_E2E]: BS29-X01 (The ArcAngelia Saint d'Arc) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS29.json", cardKey: "BS29-X01", cardNumber: "BS29-X01", abIdx: 0, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-138 [CARD_ABILITY_E2E]: BS29-033 (The Angelia Marchell) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS29.json", cardKey: "BS29-033", cardNumber: "BS29-033", abIdx: 0, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-139 [CARD_ABILITY_E2E]: BS29-031 (The Angelia Misselle) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS29.json", cardKey: "BS29-031", cardNumber: "BS29-031", abIdx: 1, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-140 [CARD_ABILITY_E2E]: BS30-031 (The ConductorAngelia Maestel) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS30.json", cardKey: "BS30-031", cardNumber: "BS30-031", abIdx: 0, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-141 [CARD_ABILITY_E2E]: BS30-027 (The SurvivorAngelia Kuroel) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS30.json", cardKey: "BS30-027", cardNumber: "BS30-027", abIdx: 1, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-142 [CARD_ABILITY_E2E]: BS31-058 (The SengokuPrincess Raika) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS31.json", cardKey: "BS31-058", cardNumber: "BS31-058", abIdx: 0, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-143 [CARD_ABILITY_E2E]: BS32-053 (Hoojiro-Tiger) resolves LOOK_HAND", async () => {
  await runCardAbilityE2E({ shardFile: "BS32.json", cardKey: "BS32-053", cardNumber: "BS32-053", abIdx: 1, expectedOp: "LOOK_HAND", requireCompilerMatch: true });
});

test("HIJ1-E2E-144 [CARD_ABILITY_E2E]: BS32-036 (The CleverMachineFortress Hakugain) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS32.json", cardKey: "BS32-036", cardNumber: "BS32-036", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-146 [CARD_ABILITY_E2E]: BS32-039 (The SengokuPrincess Turel) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS32.json", cardKey: "BS32-039", cardNumber: "BS32-039", abIdx: 0, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-148 [CARD_ABILITY_E2E]: BS33-040 (The GenjiEightKnights Tatenashi Fortress) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS33.json", cardKey: "BS33-040", cardNumber: "BS33-040", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-150 [CARD_ABILITY_E2E]: BS33-030 (The WindDemonGreatShinobi Quetzal) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS33.json", cardKey: "BS33-030", cardNumber: "BS33-030", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-151 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A9626 (The EighthSprintingSoldier King Cheetah) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS35.json", cardKey: "BATTLE-SPIRITS-A9626", cardNumber: "BATTLE-SPIRITS-A9626", abIdx: 1, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-153 [CARD_ABILITY_E2E]: BS35-054 (The GourmetFairy Patissiere) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS35.json", cardKey: "BS35-054", cardNumber: "BS35-054", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-154 [CARD_ABILITY_E2E]: BS35-022 (The OnmyouOgre Tsuchimikado) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS35.json", cardKey: "BS35-022", cardNumber: "BS35-022", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-155 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A13012 (The ThousandBeastsKing Dos-Deimos) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS35.json", cardKey: "BATTLE-SPIRITS-A13012", cardNumber: "BATTLE-SPIRITS-A13012", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-156 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A8297 (The AccelTenthBird AirEraser) resolves TRIGGERED_WATCHER", async () => {
  await runCardAbilityE2E({ shardFile: "BS37.json", cardKey: "BATTLE-SPIRITS-A8297", cardNumber: "BATTLE-SPIRITS-A8297", abIdx: 0, expectedOp: "TRIGGERED_WATCHER", requireCompilerMatch: true });
});

test("HIJ1-E2E-157 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A10383 (The GourmetFairy Kanoko) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS38.json", cardKey: "BATTLE-SPIRITS-A10383", cardNumber: "BATTLE-SPIRITS-A10383", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-158 [CARD_ABILITY_E2E]: BS38-023 (The Second's HoppingBeastEmpress Arley-Queen) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS38.json", cardKey: "BS38-023", cardNumber: "BS38-023", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-159 [CARD_ABILITY_E2E]: BATTLE-SPIRITS-A11124 (The KingBeastTribe Blade Youth) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS41.json", cardKey: "BATTLE-SPIRITS-A11124", cardNumber: "BATTLE-SPIRITS-A11124", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-E2E-160 [CARD_ABILITY_E2E]: BS42-023 (The VioletCorpseBrigade Tanzanite-Bone-Dragon) resolves SUMMON_FREE", async () => {
  await runCardAbilityE2E({ shardFile: "BS42.json", cardKey: "BS42-023", cardNumber: "BS42-023", abIdx: 0, expectedOp: "SUMMON_FREE", requireCompilerMatch: true });
});

test("HIJ1-RULE-001 [CARD_RULES_E2E]: P15-17 (The Minis' Great Athletics Meeting) resolves DECK_BUILDING_RULE", async () => {
  await runCardRulesE2E({ shardFile: "2015.json", cardKey: "P15-17", cardNumber: "P15-17", abIdx: 0, expectedOp: "DECK_BUILDING_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-002 [CARD_RULES_E2E]: 26RBS02-054 (The ThunderClaw Zinoris) resolves BATTLE_RULE_MODIFIER", async () => {
  await runCardRulesE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-054", cardNumber: "26RBS02-054", abIdx: 0, expectedOp: "BATTLE_RULE_MODIFIER", requireCompilerMatch: true });
});

test("HIJ1-RULE-003 [CARD_RULES_E2E]: 26RCB01-X05 (Kamen Rider Ryuki Survive (26RCB01-X05)) resolves UNBLOCKABLE", async () => {
  await runCardRulesE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-X05", cardNumber: "26RCB01-X05", abIdx: 1, expectedOp: "UNBLOCKABLE", requireCompilerMatch: true });
});

test("HIJ1-RULE-004 [CARD_IR_EXECUTION]: 26RCB01-X03 (Kamen Rider Zeztz Exdream) resolves UNBLOCKABLE", async () => {
  await runCardRulesE2E({ shardFile: "26RCB01.json", cardKey: "26RCB01-X03", cardNumber: "26RCB01-X03", abIdx: 1, expectedOp: "UNBLOCKABLE", requireCompilerMatch: false });
});

test("HIJ1-RULE-005 [CARD_RULES_E2E]: 26RSD04-X01 (The ContinentalShip Matanda) resolves UNBLOCKABLE", async () => {
  await runCardRulesE2E({ shardFile: "26RSD04.json", cardKey: "26RSD04-X01", cardNumber: "26RSD04-X01", abIdx: 1, expectedOp: "UNBLOCKABLE", requireCompilerMatch: true });
});

test("HIJ1-RULE-006 [CARD_RULES_E2E]: 26RSD05-X01 (The EruptingThunder Palecoeurl) resolves UNBLOCKABLE", async () => {
  await runCardRulesE2E({ shardFile: "26RSD05.json", cardKey: "26RSD05-X01", cardNumber: "26RSD05-X01", abIdx: 0, expectedOp: "UNBLOCKABLE", requireCompilerMatch: true });
});

test("HIJ1-RULE-007 [CARD_RULES_E2E]: P21-G02 (The EvilDeityEmperor Zera-Phorobia) resolves DECK_CONSTRUCTION_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BATTLE.json", cardKey: "P21-G02", cardNumber: "P21-G02", abIdx: 0, expectedOp: "DECK_CONSTRUCTION_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-008 [CARD_RULES_E2E]: P21-G03 (The IceRideDeity Vibryndi) resolves DECK_CONSTRUCTION_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BATTLE.json", cardKey: "P21-G03", cardNumber: "P21-G03", abIdx: 0, expectedOp: "DECK_CONSTRUCTION_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-009 [CARD_RULES_E2E]: SJ13-03 (The EvilClippers Death-Scissors) resolves REDIRECT_CORE_DESTINATION", async () => {
  await runCardRulesE2E({ shardFile: "BATTLE.json", cardKey: "SJ13-03", cardNumber: "SJ13-03", abIdx: 1, expectedOp: "REDIRECT_CORE_DESTINATION", requireCompilerMatch: true });
});

test("HIJ1-RULE-010 [CARD_RULES_E2E]: P21-G01 (The RainbowDragonEmperor Drag-En-Ciel) resolves DECK_CONSTRUCTION_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BATTLE.json", cardKey: "P21-G01", cardNumber: "P21-G01", abIdx: 0, expectedOp: "DECK_CONSTRUCTION_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-011 [CARD_RULES_E2E]: BRAVE-TIGER (The ArmoredEmperorTigerDeity Brave-Tiger) resolves GLOBAL_RESTRICTION", async () => {
  await runCardRulesE2E({ shardFile: "BRAVE.json", cardKey: "BRAVE-TIGER", cardNumber: "BRAVE-TIGER", abIdx: 1, expectedOp: "GLOBAL_RESTRICTION", requireCompilerMatch: true });
});

test("HIJ1-RULE-012 [CARD_RULES_E2E]: BATTLE-SPIRITS-A161 (Attack Shift) resolves CONTINUOUS_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BATTLE-SPIRITS-A161", cardNumber: "BATTLE-SPIRITS-A161", abIdx: 0, expectedOp: "CONTINUOUS_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-013 [CARD_RULES_E2E]: BS01-035 (Bone-Gladiator) resolves UNBLOCKABLE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BS01-035", cardNumber: "BS01-035", abIdx: 0, expectedOp: "UNBLOCKABLE", requireCompilerMatch: true });
});

test("HIJ1-RULE-014 [CARD_RULES_E2E]: BATTLE-SPIRITS-A265 (Rabicrysta) resolves UNBLOCKABLE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BATTLE-SPIRITS-A265", cardNumber: "BATTLE-SPIRITS-A265", abIdx: 0, expectedOp: "UNBLOCKABLE", requireCompilerMatch: true });
});

test("HIJ1-RULE-015 [CARD_RULES_E2E]: BS01-037 (Illusiona) resolves CONTINUOUS_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BS01-037", cardNumber: "BS01-037", abIdx: 0, expectedOp: "CONTINUOUS_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-016 [CARD_RULES_E2E]: BS01-139 (Feather Barrier) resolves CONTINUOUS_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BS01-139", cardNumber: "BS01-139", abIdx: 0, expectedOp: "CONTINUOUS_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-017 [CARD_RULES_E2E]: BS01-057 (Gularva) resolves CONTINUOUS_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BS01-057", cardNumber: "BS01-057", abIdx: 0, expectedOp: "CONTINUOUS_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-018 [CARD_RULES_E2E]: BATTLE-SPIRITS-A2188 (Killer Telescope) resolves CONTINUOUS_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BATTLE-SPIRITS-A2188", cardNumber: "BATTLE-SPIRITS-A2188", abIdx: 0, expectedOp: "CONTINUOUS_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-019 [CARD_RULES_E2E]: BATTLE-SPIRITS-A2225 (The Ancient Dragon Territory) resolves CONTINUOUS_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS01.json", cardKey: "BATTLE-SPIRITS-A2225", cardNumber: "BATTLE-SPIRITS-A2225", abIdx: 0, expectedOp: "CONTINUOUS_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-020 [CARD_IR_EXECUTION]: BS02-085 (The Topaz Meteor) resolves SYMBOL_MODIFIER", async () => {
  await runCardRulesE2E({ shardFile: "BS02.json", cardKey: "BS02-085", cardNumber: "BS02-085", abIdx: 0, expectedOp: "SYMBOL_MODIFIER", requireCompilerMatch: false });
});

test("HIJ1-RULE-021 [CARD_IR_EXECUTION]: BS04-054 (Arcanasoldier-Cinq) resolves REDIRECT_TARGET", async () => {
  await runCardRulesE2E({ shardFile: "BS04.json", cardKey: "BS04-054", cardNumber: "BS04-054", abIdx: 0, expectedOp: "REDIRECT_TARGET", requireCompilerMatch: false });
});

test("HIJ1-RULE-022 [CARD_RULES_E2E]: BS04-082 (The Inviolable Sanctuary) resolves LIMIT_DECK_DISCARD", async () => {
  await runCardRulesE2E({ shardFile: "BS04.json", cardKey: "BS04-082", cardNumber: "BS04-082", abIdx: 1, expectedOp: "LIMIT_DECK_DISCARD", requireCompilerMatch: true });
});

test("HIJ1-RULE-023 [CARD_RULES_E2E]: BS05-076 (Eternal Shield) resolves LIMIT_DECK_DISCARD", async () => {
  await runCardRulesE2E({ shardFile: "BS05.json", cardKey: "BS05-076", cardNumber: "BS05-076", abIdx: 0, expectedOp: "LIMIT_DECK_DISCARD", requireCompilerMatch: true });
});

test("HIJ1-RULE-024 [CARD_IR_EXECUTION]: BS05-040 (The Princess-Snowwhite) resolves REDIRECT_TARGET", async () => {
  await runCardRulesE2E({ shardFile: "BS05.json", cardKey: "BS05-040", cardNumber: "BS05-040", abIdx: 0, expectedOp: "REDIRECT_TARGET", requireCompilerMatch: false });
});

test("HIJ1-RULE-025 [CARD_RULES_E2E]: BS08-057 (The Red Sand Glass) resolves COST_MODIFIER", async () => {
  await runCardRulesE2E({ shardFile: "BS08.json", cardKey: "BS08-057", cardNumber: "BS08-057", abIdx: 1, expectedOp: "COST_MODIFIER", requireCompilerMatch: true });
});

test("HIJ1-RULE-026 [CARD_RULES_E2E]: BS18-029 (Bat-Holliday) resolves FORCE_ATTACK", async () => {
  await runCardRulesE2E({ shardFile: "BS18.json", cardKey: "BS18-029", cardNumber: "BS18-029", abIdx: 1, expectedOp: "FORCE_ATTACK", requireCompilerMatch: true });
});

test("HIJ1-RULE-027 [CARD_RULES_E2E]: BS26-053 (The BirdAstralArmored Shisobird) resolves REDIRECT_TARGET", async () => {
  await runCardRulesE2E({ shardFile: "BS26.json", cardKey: "BS26-053", cardNumber: "BS26-053", abIdx: 2, expectedOp: "REDIRECT_TARGET", requireCompilerMatch: true });
});

test("HIJ1-RULE-028 [CARD_RULES_E2E]: BS28-020 (The FourShellSky Kamejuuji) resolves DECK_BUILDING_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS28.json", cardKey: "BS28-020", cardNumber: "BS28-020", abIdx: 0, expectedOp: "DECK_BUILDING_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-029 [CARD_RULES_E2E]: BS30-063 (The AstralLyreFan Vega) resolves LOSE_EFFECTS", async () => {
  await runCardRulesE2E({ shardFile: "BS30.json", cardKey: "BS30-063", cardNumber: "BS30-063", abIdx: 1, expectedOp: "LOSE_EFFECTS", requireCompilerMatch: true });
});

test("HIJ1-RULE-030 [CARD_RULES_E2E]: BS31-048 (The GiantArmCleverMachineMusha Rakan) resolves FORCE_ATTACK", async () => {
  await runCardRulesE2E({ shardFile: "BS31.json", cardKey: "BS31-048", cardNumber: "BS31-048", abIdx: 2, expectedOp: "FORCE_ATTACK", requireCompilerMatch: true });
});

test("HIJ1-RULE-031 [CARD_RULES_E2E]: BS39-042 (Hammerheadman) resolves COST_MODIFIER", async () => {
  await runCardRulesE2E({ shardFile: "BS39.json", cardKey: "BS39-042", cardNumber: "BS39-042", abIdx: 0, expectedOp: "COST_MODIFIER", requireCompilerMatch: true });
});

test("HIJ1-RULE-032 [CARD_RULES_E2E]: BS40-023 (Carebara Antman) resolves DECK_BUILDING_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS40.json", cardKey: "BS40-023", cardNumber: "BS40-023", abIdx: 0, expectedOp: "DECK_BUILDING_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-033 [CARD_RULES_E2E]: BATTLE-SPIRITS-A7749 (Set's Stout Arm Temple) resolves ADVENT_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS45.json", cardKey: "BATTLE-SPIRITS-A7749", cardNumber: "BATTLE-SPIRITS-A7749", abIdx: 1, expectedOp: "ADVENT_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-034 [CARD_RULES_E2E]: BATTLE-SPIRITS-A9610 (The EgytianGreatAngelia Nefeliel) resolves ADVENT_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS45.json", cardKey: "BATTLE-SPIRITS-A9610", cardNumber: "BATTLE-SPIRITS-A9610", abIdx: 2, expectedOp: "ADVENT_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-035 [CARD_RULES_E2E]: BS58-026 (The Priest Grizzrianus) resolves GLOBAL_RESTRICTION", async () => {
  await runCardRulesE2E({ shardFile: "BS58.json", cardKey: "BS58-026", cardNumber: "BS58-026", abIdx: 1, expectedOp: "GLOBAL_RESTRICTION", requireCompilerMatch: true });
});

test("HIJ1-RULE-036 [CARD_RULES_E2E]: BS58-065 (The San-Erophant Cathedral) resolves GLOBAL_RESTRICTION", async () => {
  await runCardRulesE2E({ shardFile: "BS58.json", cardKey: "BS58-065", cardNumber: "BS58-065", abIdx: 1, expectedOp: "GLOBAL_RESTRICTION", requireCompilerMatch: true });
});

test("HIJ1-RULE-037 [CARD_RULES_E2E]: BS63-005 (Hiba-Swallow) resolves REDIRECT_CORE_DESTINATION", async () => {
  await runCardRulesE2E({ shardFile: "BS63.json", cardKey: "BS63-005", cardNumber: "BS63-005", abIdx: 1, expectedOp: "REDIRECT_CORE_DESTINATION", requireCompilerMatch: true });
});

test("HIJ1-RULE-038 [CARD_RULES_E2E]: BS68-024 (Gaudy Trooper G) resolves DECK_BUILDING_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS68.json", cardKey: "BS68-024", cardNumber: "BS68-024", abIdx: 0, expectedOp: "DECK_BUILDING_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-039 [CARD_RULES_E2E]: BS69-021 (The SorcererShielder Der-Schutzen) resolves REDIRECT_TARGET", async () => {
  await runCardRulesE2E({ shardFile: "BS69.json", cardKey: "BS69-021", cardNumber: "BS69-021", abIdx: 1, expectedOp: "REDIRECT_TARGET", requireCompilerMatch: true });
});

test("HIJ1-RULE-040 [CARD_RULES_E2E]: BS75-021 (Mosquito-Gun) resolves DECK_BUILDING_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BS75.json", cardKey: "BS75-021", cardNumber: "BS75-021", abIdx: 0, expectedOp: "DECK_BUILDING_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-041 [CARD_RULES_E2E]: BS75-036 (The ArgentTwinkleShielder Balder) resolves REDIRECT_TARGET", async () => {
  await runCardRulesE2E({ shardFile: "BS75.json", cardKey: "BS75-036", cardNumber: "BS75-036", abIdx: 0, expectedOp: "REDIRECT_TARGET", requireCompilerMatch: true });
});

test("HIJ1-RULE-042 [CARD_RULES_E2E]: BSC05-017 (The Old Devil's Castle) resolves REDIRECT_TARGET", async () => {
  await runCardRulesE2E({ shardFile: "BSC05.json", cardKey: "BSC05-017", cardNumber: "BSC05-017", abIdx: 0, expectedOp: "REDIRECT_TARGET", requireCompilerMatch: true });
});

test("HIJ1-RULE-043 [CARD_RULES_E2E]: BSC16-031 (Kigurumi Pentan) resolves ADD_FAMILY", async () => {
  await runCardRulesE2E({ shardFile: "BSC16.json", cardKey: "BSC16-031", cardNumber: "BSC16-031", abIdx: 1, expectedOp: "ADD_FAMILY", requireCompilerMatch: true });
});

test("HIJ1-RULE-044 [CARD_RULES_E2E]: BSC19-001 (Destoroyah (Juvenile Form)) resolves DECK_BUILDING_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BSC19.json", cardKey: "BSC19-001", cardNumber: "BSC19-001", abIdx: 0, expectedOp: "DECK_BUILDING_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-045 [CARD_RULES_E2E]: BSC31-CP04 (The DashingYatagarasuTwinkle Magoichi) resolves COUNT_MODIFIER", async () => {
  await runCardRulesE2E({ shardFile: "BSC31.json", cardKey: "BSC31-CP04", cardNumber: "BSC31-CP04", abIdx: 2, expectedOp: "COUNT_MODIFIER", requireCompilerMatch: true });
});

test("HIJ1-RULE-046 [CARD_RULES_E2E]: BATTLE-SPIRITS-A14695 (［Academy Seraph］Aeriphiel) resolves GAIN_TEAM", async () => {
  await runCardRulesE2E({ shardFile: "BSC33.json", cardKey: "BATTLE-SPIRITS-A14695", cardNumber: "BATTLE-SPIRITS-A14695", abIdx: 0, expectedOp: "GAIN_TEAM", requireCompilerMatch: true });
});

test("HIJ1-RULE-047 [CARD_RULES_E2E]: BATTLE-SPIRITS-A14696 (［Academy Seraph］Araphiel) resolves GAIN_TEAM", async () => {
  await runCardRulesE2E({ shardFile: "BSC33.json", cardKey: "BATTLE-SPIRITS-A14696", cardNumber: "BATTLE-SPIRITS-A14696", abIdx: 1, expectedOp: "GAIN_TEAM", requireCompilerMatch: true });
});

test("HIJ1-RULE-048 [CARD_RULES_E2E]: BATTLE-SPIRITS-A14697 (［Academy Seraph］Mirediel) resolves GAIN_TEAM", async () => {
  await runCardRulesE2E({ shardFile: "BSC33.json", cardKey: "BATTLE-SPIRITS-A14697", cardNumber: "BATTLE-SPIRITS-A14697", abIdx: 0, expectedOp: "GAIN_TEAM", requireCompilerMatch: true });
});

test("HIJ1-RULE-049 [CARD_RULES_E2E]: BATTLE-SPIRITS-A14698 (［Academy Seraph］Ramdiel) resolves GAIN_TEAM", async () => {
  await runCardRulesE2E({ shardFile: "BSC33.json", cardKey: "BATTLE-SPIRITS-A14698", cardNumber: "BATTLE-SPIRITS-A14698", abIdx: 0, expectedOp: "GAIN_TEAM", requireCompilerMatch: true });
});

test("HIJ1-RULE-050 [CARD_RULES_E2E]: BATTLE-SPIRITS-A15353 (［Twin Stars Divas］Gemina & Nizel) resolves COUNT_MODIFIER", async () => {
  await runCardRulesE2E({ shardFile: "BSC35.json", cardKey: "BATTLE-SPIRITS-A15353", cardNumber: "BATTLE-SPIRITS-A15353", abIdx: 2, expectedOp: "COUNT_MODIFIER", requireCompilerMatch: true });
});

test("HIJ1-RULE-051 [CARD_RULES_E2E]: BSC37-X03 (［Everyone's Diva］Trickster) resolves GAIN_TEAM", async () => {
  await runCardRulesE2E({ shardFile: "BSC37.json", cardKey: "BSC37-X03", cardNumber: "BSC37-X03", abIdx: 0, expectedOp: "GAIN_TEAM", requireCompilerMatch: true });
});

test("HIJ1-RULE-052 [CARD_RULES_E2E]: BSC37-008 (［Winter Attire］Saclaire Metum) resolves MODIFY_DESTINATION", async () => {
  await runCardRulesE2E({ shardFile: "BSC37.json", cardKey: "BSC37-008", cardNumber: "BSC37-008", abIdx: 2, expectedOp: "MODIFY_DESTINATION", requireCompilerMatch: true });
});

test("HIJ1-RULE-053 [CARD_RULES_E2E]: BATTLE-SPIRITS-A14865 (［Dancing Wings in the Skies］Lady Windy-Behemoth) resolves GAIN_TEAM", async () => {
  await runCardRulesE2E({ shardFile: "BSC39.json", cardKey: "BATTLE-SPIRITS-A14865", cardNumber: "BATTLE-SPIRITS-A14865", abIdx: 0, expectedOp: "GAIN_TEAM", requireCompilerMatch: true });
});

test("HIJ1-RULE-054 [CARD_RULES_E2E]: BATTLE-SPIRITS-A15090 (［Off Shot］Klara) resolves TEAM_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BSC39.json", cardKey: "BATTLE-SPIRITS-A15090", cardNumber: "BATTLE-SPIRITS-A15090", abIdx: 0, expectedOp: "TEAM_RULE", requireCompilerMatch: true });
});

test("HIJ1-RULE-055 [CARD_RULES_E2E]: BSC39-049 (［Off Shot］Trickster) resolves TEAM_RULE", async () => {
  await runCardRulesE2E({ shardFile: "BSC39.json", cardKey: "BSC39-049", cardNumber: "BSC39-049", abIdx: 0, expectedOp: "TEAM_RULE", requireCompilerMatch: true });
});

test("HIJ1-E2E-161 [CARD_ABILITY_E2E]: 26RBS01-068 (Snakrowley) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-068", cardNumber: "26RBS01-068", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-162 [CARD_ABILITY_E2E]: 26RBS01-056 (Stelgatgun) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-056", cardNumber: "26RBS01-056", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-163 [CARD_ABILITY_E2E]: 26RBS01-061 (Stodol) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-061", cardNumber: "26RBS01-061", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-164 [CARD_ABILITY_E2E]: 26RBS01-021 (Spectrous) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-021", cardNumber: "26RBS01-021", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-165 [CARD_ABILITY_E2E]: 26RBS01-065 (Terra-Cotta) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-065", cardNumber: "26RBS01-065", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-166 [CARD_ABILITY_E2E]: 26RBS01-X11 (The ArgentIronDuke Lars-Beriberg) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-X11", cardNumber: "26RBS01-X11", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-167 [CARD_ABILITY_E2E]: 26RBS01-069 (The BreakingThunder Spinoblurt) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-069", cardNumber: "26RBS01-069", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-168 [CARD_ABILITY_E2E]: 26RBS01-105 (The Charging Pyramid) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-105", cardNumber: "26RBS01-105", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-169 [CARD_ABILITY_E2E]: 26RBS01-083 (The CyanBud Anelna) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-083", cardNumber: "26RBS01-083", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-170 [CARD_ABILITY_E2E]: 26RBS01-106 (The Cyanlight Thorn Garden) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-106", cardNumber: "26RBS01-106", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-171 [CARD_ABILITY_E2E]: 26RBS01-100 (The Dual Flow Desert) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-100", cardNumber: "26RBS01-100", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-172 [CARD_ABILITY_E2E]: 26RBS01-X16 (The GreatAbsolute Panjang) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-X16", cardNumber: "26RBS01-X16", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-173 [CARD_ABILITY_E2E]: 26RBS01-074 (The HeavyThunder Enurai) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-074", cardNumber: "26RBS01-074", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-174 [CARD_ABILITY_E2E]: 26RBS01-059 (The HollowRadiance Pepper's Dragon) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-059", cardNumber: "26RBS01-059", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-175 [CARD_ABILITY_E2E]: 26RBS01-097 (The Hydro Catapult) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-097", cardNumber: "26RBS01-097", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-176 [CARD_ABILITY_E2E]: 26RBS01-094 (The Penetrating Mountain Range) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-094", cardNumber: "26RBS01-094", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-177 [CARD_ABILITY_E2E]: 26RBS01-009 (The RedGuide Shaniel) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-009", cardNumber: "26RBS01-009", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-178 [CARD_ABILITY_E2E]: 26RBS01-X07 (The WaterBlade Wheelca) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-X07", cardNumber: "26RBS01-X07", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-179 [CARD_ABILITY_E2E]: 26RBS01-037 (Waltar) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS01.json", cardKey: "26RBS01-037", cardNumber: "26RBS01-037", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-180 [CARD_ABILITY_E2E]: 26RBS02-027 (Alufrost) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-027", cardNumber: "26RBS02-027", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-181 [CARD_ABILITY_E2E]: 26RBS02-007 (Charcoaler) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-007", cardNumber: "26RBS02-007", abIdx: 0, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});

test("HIJ1-E2E-182 [CARD_ABILITY_E2E]: 26RBS02-072 (Gnutarius) resolves BP_BUFF", async () => {
  await runCardAbilityE2E({ shardFile: "26RBS02.json", cardKey: "26RBS02-072", cardNumber: "26RBS02-072", abIdx: 1, expectedOp: "BP_BUFF", requireCompilerMatch: true });
});
