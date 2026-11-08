/**
 * scripts/build_sharded_ir.mjs
 * 
 * Compiles all cards in Phases 1-5 (2008-2012) into explicit structured IR (compiledIr)
 * and writes them directly into data/effects/<SET>.json and data/ir_shards/<SET>.json.
 * 
 * Verifies zero unsupported clauses across all audited phases and outputs a markdown report.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { getCardOverride } from '../compiler/overrides/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EFFECTS_DIR = path.join(ROOT, 'data', 'effects');
const IR_SHARDS_DIR = path.join(ROOT, 'data', 'ir_shards');
const REPORTS_DIR = path.join(ROOT, 'reports');

if (!fs.existsSync(IR_SHARDS_DIR)) {
  fs.mkdirSync(IR_SHARDS_DIR, { recursive: true });
}
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function safeWriteFileSync(filePath, content, options = 'utf8', retries = 10) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      fs.writeFileSync(filePath, content, options);
      return;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const wait = Math.min(2000, 200 * Math.pow(1.5, attempt));
      const start = Date.now();
      while (Date.now() - start < wait) {}
    }
  }
}

export const PHASES = {
  1: {
    year: 2008,
    name: 'Original Series Launch',
    sets: ['BS01', 'BS02', 'SD01', 'SD02']
  },
  2: {
    year: 2009,
    name: 'Gekiha / Clash Era',
    sets: ['BS03', 'BS04', 'BS05', 'BS06', 'SD03']
  },
  3: {
    year: 2010,
    name: 'Brave Era Part 1',
    sets: ['BS07', 'BS08', 'BS09', 'BS10', 'SD04', 'BSC01']
  },
  4: {
    year: 2011,
    name: 'Heroes (Haoh) & Burst Era',
    sets: ['BS11', 'BS12', 'BS13', 'BS14', 'BS15', 'SD06', 'SD09', 'BSC05', 'BSC09', 'BSC10', '2011']
  },
  5: {
    year: 2012,
    name: 'Sword Eyes — Charge & Rush Era',
    sets: ['BS16', 'BS17', 'BS18', 'BS19', 'BS20', 'SD10', 'SD11', 'SD13', 'SD14', 'SD15', 'SD16', 'SD17', 'BSC12', 'SJ12']
  },
  6: {
    year: 2013,
    name: 'Ultimate Zero — Ultimate Series Part 1',
    sets: ['BS21', 'BS22', 'BS23', 'BS24', 'BS25', 'SD19', 'SD20', 'SD21', 'SD22', 'SD23', 'BSC14', 'BSC15', 'EX13', 'P13', 'PX13', 'SJ13', 'X13']
  },
  7: {
    year: 2014,
    name: 'Ultimate Zero — Ultimate Series Part 2',
    sets: ['BS26', 'BS27', 'BS28', 'BS29', 'SD24', 'SD25', 'SD26', 'SD27', 'SD28', 'BSC16', 'BSC17', 'BSC18', '2014', 'LM14', 'P14', 'SJ14']
  },
  8: {
    year: 2015,
    name: 'Burning Soul — Soul Core & Sengoku Era',
    sets: ['BS30', 'BS31', 'BS32', 'BS33', 'SD29', 'SD30', 'SD31', 'SD32', 'BSC19', 'BSC20', 'BSC21', 'BSC22', 'CB01', '2015', 'LM15']
  },
  9: {
    year: 2016,
    name: 'Double Drive — Seal & Accel Era',
    sets: ['BS34', 'BS35', 'BS36', 'BS37', 'BS38', 'SD33', 'SD34', 'SD35', 'SD36', 'SD37', 'BSC23', 'BSC24', 'BSC25', 'BSC26', 'BSC27', 'BSC28', 'CB02', '2016', 'LM16', 'P16']
  },
  10: {
    year: 2017,
    name: 'Evolving — Advent (Kourin) Era',
    sets: ['BS39', 'BS40', 'BS41', 'BS42', 'SD38', 'SD39', 'SD40', 'SD41', 'SD42', 'BSC29', 'BSC30', 'CB03', 'CB04', 'LM17', 'P17', 'SJ17']
  },
  11: {
    year: 2018,
    name: 'Grandwalker Nexus Era',
    sets: ['BS43', 'BS44', 'BS45', 'BS46', 'SD43', 'SD44', 'SD45', 'SD46', 'SD47', 'BSC31', 'BSC32', 'CB05', 'CB06', 'CB07', 'LM18', 'LM18G']
  },
  12: {
    year: 2019,
    name: 'Ultra Advent Era',
    sets: ['BS47', 'BS48', 'BS49', 'BS50', 'SD48', 'SD49', 'SD50', 'SD51', 'SD52', 'BSC33', 'BSC34', 'BSC35', 'CB08', 'CB09', 'CB10', 'CB11', 'PB01', 'PB02', '2019', 'LM19', 'LM19U', 'P19', 'PX19', 'SJ19']
  },
  13: {
    year: 2020,
    name: 'Rebirth (Tensei) Era',
    sets: ['BS51', 'BS52', 'BS53', 'BS54', 'SD53', 'SD54', 'SD55', 'SD56', 'SD57', 'SD58', 'BSC37', 'CB12', 'CB13', 'CB14', 'CB15', 'CB16', 'PB05', 'PB06', 'PB08', 'PB09', 'P20', 'PX20']
  },
  14: {
    year: 2021,
    name: 'True Rebirth & Mirage Era',
    sets: ['BS55', 'BS56', 'BS57', 'BS58', 'SD59', 'SD60', 'SD61', 'SD62', 'BSC38', 'BSC39', 'CB17', 'CB18', 'CB19', 'CB20', 'CB21', 'PB12', 'PB13', 'PB14', 'PB15', 'PB16', 'P21', 'PX21']
  },
  15: {
    year: 2022,
    name: 'Rise of Rivals — Contract Spirit Era',
    sets: ['BS59', 'BS60', 'BS61', 'BS62', 'SD63', 'SD64', 'SD65', 'BSC40', 'CB22', 'CB23', 'CB24', 'CB25', 'CB26', 'PB17', 'PB18', 'P22', 'PX22']
  },
  16: {
    year: 2023,
    name: 'Beyond Evolution Era',
    sets: ['BS63','BS64','BS65','BS66','SD66','SD67','BSC42','CB27','CB28','CB29','PB27','PB29','PB33','PC01','PC02','PC03','PC04','PC05','PC06','PC07','PC08','PC09','PC10','PC11','PC12']
  },
  17: {
    year: 2024,
    name: 'Contract Grandwalker Era',
    sets: ['BS67','BS68','BS69','BS70','SD68','SD69','SD70','BSC43','BSC44','BSC45','CB30','CB31','CB32','PB35','PB38']
  },
  18: {
    year: 2025,
    name: 'Late Contract & Eternal Transition Era',
    sets: ['BS71','BS72','BS73','BS74','BS75','BSC46','BSC47','BSC48','BSC49','BSC50','CB33','CB34','PB39','PB41','PB42','PB44','PB46','PB48']
  },
  19: {
    year: 2026,
    name: 'Cross-Format Eternal & Standard Era',
    sets: ['BS76','BS77','BSC51','26RCB01','26RCB02','26RDB01','26RSD01','26RSD02','26RSD03','26RSD04','26RSD05','26RSD06','26RSD07','26RSD08','26RSD09','26RSD10']
  },
  20: {
    year: 'Promos',
    name: 'Special Promos & Supplementary Sets',
    sets: ['10','1000','24TH','7','AUG','AUGUST','BATTLE','BATTLERS','BOX','CBX01','COST','DEC','DOUBLE','DS','EXTREME','FEB','FRIENDLY','GLADIATOR','GOD','GODZILLA','HIGH','JAN','KEROKERO','KERORO','KFC','LIMITED','LORD','MANGA','MARCH','MAY','MISC','NOV','OCT','REVIVE','SAIKYO','SAIKYOU','SEP','SHOP','SIX','SJ','STRONGEST','STRUCTURE','SUN','TWELVE','ULTIMATE','V','X005','ZOMBIE','2011','2014','2015','2016','EX13','LM14','LM15','SJ12','SJ13','SJ14','SJ17','X13']
  }
};

export function buildShardedIR() {
  console.log('Starting Sharded IR Build for All Phases 1-20...');

  const phaseResults = {};
  let totalCardsAll = 0;
  let totalEffectCardsAll = 0;
  let totalClausesAll = 0;
  let totalUnsupportedAll = 0;

  for (const [phaseNum, info] of Object.entries(PHASES)) {
    console.log(`\nProcessing Phase ${phaseNum} (${info.year}): ${info.name}...`);
    const setStats = {};
    let phaseTotalCards = 0;
    let phaseEffectCards = 0;
    let phaseVanillaCards = 0;
    let phaseTotalClauses = 0;
    let phaseCompiledClauses = 0;
    let phaseUnsupportedClauses = 0;
    let phaseFullySupportedCards = 0;

    for (const setCode of info.sets) {
      const filePath = path.join(EFFECTS_DIR, `${setCode}.json`);
      if (!fs.existsSync(filePath)) {
        console.warn(`  Warning: Set file ${setCode}.json not found at ${filePath}`);
        continue;
      }

      const raw = fs.readFileSync(filePath, 'utf8');
      const setData = JSON.parse(raw);
      const setCardCount = Object.keys(setData).length;

      let setEffectCards = 0;
      let setVanillaCards = 0;
      let setTotalClauses = 0;
      let setCompiledClauses = 0;
      let setUnsupportedClauses = 0;
      let setFullySupported = 0;

      const irShardData = {};

      for (const [cardId, card] of Object.entries(setData)) {
        phaseTotalCards++;
        const override = getCardOverride(cardId, card);

        if (override) {
          card.compiledIr = JSON.parse(JSON.stringify(override));
          if (override.isVanilla) {
            phaseVanillaCards++;
            setVanillaCards++;
          } else {
            phaseEffectCards++;
            setEffectCards++;
            const cardClauses = override.compiledClausesCount + override.unsupportedClausesCount;
            setTotalClauses += cardClauses;
            setCompiledClauses += override.compiledClausesCount;
            setUnsupportedClauses += override.unsupportedClausesCount;
            phaseTotalClauses += cardClauses;
            phaseCompiledClauses += override.compiledClausesCount;
            phaseUnsupportedClauses += override.unsupportedClausesCount;

            if (override.isFullySupported) {
              setFullySupported++;
              phaseFullySupportedCards++;
            }
          }
        } else {
          const isVanilla = !!card.is_vanilla || (!card.effect && !card.burstEffect);

          if (isVanilla) {
            phaseVanillaCards++;
            setVanillaCards++;
            card.compiledIr = {
              cardNumber: cardId,
              name: card.name,
              isFullySupported: true,
              isVanilla: true,
              compiledClausesCount: 0,
              unsupportedClausesCount: 0,
              abilities: [],
              keywords: []
            };
          } else {
            phaseEffectCards++;
            setEffectCards++;
            const compiled = compileCard({ id: cardId, ...card });
            card.compiledIr = compiled;

            const cardClauses = compiled.compiledClausesCount + compiled.unsupportedClausesCount;
            setTotalClauses += cardClauses;
            setCompiledClauses += compiled.compiledClausesCount;
            setUnsupportedClauses += compiled.unsupportedClausesCount;
            phaseTotalClauses += cardClauses;
            phaseCompiledClauses += compiled.compiledClausesCount;
            phaseUnsupportedClauses += compiled.unsupportedClausesCount;

            if (compiled.isFullySupported) {
              setFullySupported++;
              phaseFullySupportedCards++;
            }
          }
        }

        irShardData[cardId] = card.compiledIr;
      }

      // Write updated setData with explicit compiledIr if changed
      const updatedSetJson = JSON.stringify(setData, null, 2);
      if (raw !== updatedSetJson) {
        safeWriteFileSync(filePath, updatedSetJson, 'utf8');
      }

      // Also sync to ir_shards if changed
      const shardPath = path.join(IR_SHARDS_DIR, `${setCode}.json`);
      const updatedShardJson = JSON.stringify(irShardData, null, 2);
      if (!fs.existsSync(shardPath) || fs.readFileSync(shardPath, 'utf8') !== updatedShardJson) {
        safeWriteFileSync(shardPath, updatedShardJson, 'utf8');
      }

      setStats[setCode] = {
        totalCards: setCardCount,
        effectCards: setEffectCards,
        vanillaCards: setVanillaCards,
        totalClauses: setTotalClauses,
        compiledClauses: setCompiledClauses,
        unsupportedClauses: setUnsupportedClauses,
        fullySupportedCards: setFullySupported
      };

      console.log(`  Set ${setCode}: ${setEffectCards} effect cards (${setVanillaCards} vanilla), ${setTotalClauses} clauses, ${setUnsupportedClauses} unsupported`);
    }

    phaseResults[phaseNum] = {
      ...info,
      totalCards: phaseTotalCards,
      effectCards: phaseEffectCards,
      vanillaCards: phaseVanillaCards,
      totalClauses: phaseTotalClauses,
      compiledClauses: phaseCompiledClauses,
      unsupportedClauses: phaseUnsupportedClauses,
      fullySupportedCards: phaseFullySupportedCards,
      setStats
    };

    totalCardsAll += phaseTotalCards;
    totalEffectCardsAll += phaseEffectCards;
    totalClausesAll += phaseTotalClauses;
    totalUnsupportedAll += phaseUnsupportedClauses;

    console.log(`Phase ${phaseNum} Summary: ${phaseEffectCards} effect cards, ${phaseTotalClauses} clauses, ${phaseUnsupportedClauses} unsupported clauses (100% target met: ${phaseUnsupportedClauses === 0})`);
  }

  // Generate Report
  let report = `# Chronological Card Effects Compilation Report (Phases 0-20)
Generated on: ${new Date().toISOString()}

## Executive Summary
- **Audited Phases**: 0 through 20 (Foundational Core + Years 2008–2026 + Promos & Special Sets)
- **Total Cards Processed**: ${totalCardsAll}
- **Total Effect Cards**: ${totalEffectCardsAll}
- **Total Clauses**: ${totalClausesAll}
- **Total Unsupported Clauses**: ${totalUnsupportedAll}
- **Audit Gate Status**: ${totalUnsupportedAll === 0 ? 'PASSED (Zero Unsupported Clauses Across All Eras)' : 'FAILED'}

## Phase Breakdown

| Phase | Year | Name | Sets | Total Cards | Effect Cards | Total Clauses | Unsupported Clauses | Fully Supported % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

  for (const [phaseNum, r] of Object.entries(phaseResults)) {
    const pct = r.effectCards > 0 ? ((r.fullySupportedCards / r.effectCards) * 100).toFixed(1) : '100.0';
    report += `| **Phase ${phaseNum}** | ${r.year} | ${r.name} | ${r.sets.join(', ')} | ${r.totalCards} | ${r.effectCards} | ${r.totalClauses} | ${r.unsupportedClauses} | **${pct}%** |\n`;
  }

  report += `\n## Per-Set Breakdown\n\n`;
  for (const [phaseNum, r] of Object.entries(phaseResults)) {
    report += `### Phase ${phaseNum}: ${r.name} (${r.year})\n\n`;
    report += `| Set | Total Cards | Effect Cards | Vanilla Cards | Total Clauses | Compiled Clauses | Unsupported | Status |\n`;
    report += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const [setCode, s] of Object.entries(r.setStats)) {
      const status = s.unsupportedClauses === 0 ? '✅ 100%' : `❌ ${s.unsupportedClauses} unsupp`;
      report += `| **${setCode}** | ${s.totalCards} | ${s.effectCards} | ${s.vanillaCards} | ${s.totalClauses} | ${s.compiledClauses} | ${s.unsupportedClauses} | ${status} |\n`;
    }
    report += `\n`;
  }

  const reportPath = path.join(REPORTS_DIR, 'sharded_ir_coverage_all_phases.md');
  safeWriteFileSync(reportPath, report, 'utf8');
  safeWriteFileSync(path.join(REPORTS_DIR, 'sharded_ir_coverage_phases_0_20.md'), report, 'utf8');
  safeWriteFileSync(path.join(REPORTS_DIR, 'sharded_ir_coverage_phases_0_15.md'), report, 'utf8');
  safeWriteFileSync(path.join(REPORTS_DIR, 'sharded_ir_coverage_phases_0_10.md'), report, 'utf8');
  safeWriteFileSync(path.join(REPORTS_DIR, 'sharded_ir_coverage_phases_0_5.md'), report, 'utf8');
  console.log(`\nReport written to ${reportPath}`);

  return { phaseResults, totalCardsAll, totalEffectCardsAll, totalClausesAll, totalUnsupportedAll };
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('build_sharded_ir.mjs')) {
  buildShardedIR();
}
