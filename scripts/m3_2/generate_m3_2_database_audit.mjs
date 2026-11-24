import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyFlashTiming,
  FLASH_TIMING_QUALIFIERS
} from '../../engine/flash_timing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const dbPath = path.join(rootDir, 'card_effects_db.json');

console.log('Loading card_effects_db.json...');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const cards = Array.isArray(db) ? db : Object.values(db);
console.log(`Loaded ${cards.length} cards from database.`);

const outCsvPath = path.join(rootDir, 'reports/phase_m3_2_action_gate_and_flash_authority/PHASE_M3_2_DATABASE_TIMING_AUDIT.csv');
const rows = [];
rows.push('cardNumber,cardName,cardType,isFlash,timingQualifier,isGenericFlash,isTriggered,mainStepLegal,attackStepLegal,requiresActiveBattle,sampleTimingClause');

const counts = {
  totalCards: cards.length,
  totalFlash: 0,
  genericFlash: 0,
  yourAttackStep: 0,
  opponentsAttackStep: 0,
  eitherAttackStep: 0,
  duringAttack: 0,
  whenAttacksTrigger: 0,
  flashTimingOnly: 0,
  ambiguous: 0,
  nonFlash: 0
};

function csvEscape(val) {
  if (val == null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

for (const card of cards) {
  const num = card.cardNumber || card.id || 'UNKNOWN';
  const name = card.name || 'UNKNOWN';
  const type = card.type || 'UNKNOWN';
  const text = String(card.raw_effect || card.compiledIr?.originalEffectText || card.effect || '');

  const spec = classifyFlashTiming(card);

  if (spec.isFlash) {
    counts.totalFlash++;
    switch (spec.timingQualifier) {
      case FLASH_TIMING_QUALIFIERS.GENERIC:
        counts.genericFlash++;
        break;
      case FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP:
        counts.yourAttackStep++;
        break;
      case FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP:
        counts.opponentsAttackStep++;
        break;
      case FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP:
        counts.eitherAttackStep++;
        break;
      case FLASH_TIMING_QUALIFIERS.DURING_ATTACK:
        counts.duringAttack++;
        break;
      case FLASH_TIMING_QUALIFIERS.WHEN_ATTACKS:
        counts.whenAttacksTrigger++;
        break;
      case FLASH_TIMING_QUALIFIERS.FLASH_TIMING_ONLY:
        counts.flashTimingOnly++;
        break;
      default:
        counts.ambiguous++;
        break;
    }

    const mainLegal = spec.isGenericFlash;
    const attLegal = !spec.isTriggered;
    const reqBattle = spec.additionalRestrictions.requiresBattle;

    let snippet = '';
    const m = text.match(/(?:Flash|【フラッシュ】)[^\n\r.]{0,80}/i);
    if (m) snippet = m[0];

    rows.push([
      csvEscape(num),
      csvEscape(name),
      csvEscape(type),
      'TRUE',
      csvEscape(spec.timingQualifier),
      spec.isGenericFlash ? 'TRUE' : 'FALSE',
      spec.isTriggered ? 'TRUE' : 'FALSE',
      mainLegal ? 'TRUE' : 'FALSE',
      attLegal ? 'TRUE' : 'FALSE',
      reqBattle ? 'TRUE' : 'FALSE',
      csvEscape(snippet)
    ].join(','));
  } else {
    counts.nonFlash++;
  }
}

fs.writeFileSync(outCsvPath, rows.join('\n'), 'utf8');
console.log(`Wrote ${rows.length} rows to ${outCsvPath}`);
console.log('Flash Timing Audit Breakdown:');
console.log(JSON.stringify(counts, null, 2));

const summaryPath = path.join(rootDir, 'reports/phase_m3_2_action_gate_and_flash_authority/database_audit_summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(counts, null, 2), 'utf8');
