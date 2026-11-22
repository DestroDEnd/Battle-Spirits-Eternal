import fs from 'fs';

console.log('Documenting additional defects discovered during Phase W.1 audit...');

const additionalDefects = [
  {
    defect_id: 'DEF-W1-15',
    title: 'Universal Keyword Misclassification: Prose Mentions Treated as Native Ownership',
    subsystem: 'compiler/keyword_compiler.js -> bindKeywordsToAbilities',
    severity: 'CRITICAL',
    description: 'bindKeywordsToAbilities ran extractKeywords across raw block text (ability.rawText || header.cleanBody). Cards searching, referencing, or granting a keyword were falsely classified as natively possessing that keyword (e.g. BS33-072 and BS33-003 falsely given native Awaken, True-Clash, Showdown, Consecutive Blade).',
    root_cause: 'Failure to restrict native keyword binding strictly to ability headers (header.keyword, header.keywords, header.prefixes, unbracketed armor).',
    impact: 'Compromised card identity and game engine deck validation across thousands of cards.',
    remediation_status: 'REMEDIED_AND_VERIFIED'
  },
  {
    defect_id: 'DEF-W1-16',
    title: '73 Canonical Wiki Keywords Missing from Catalog and Runtime Registry',
    subsystem: 'compiler/keyword_compiler.js and engine/keywords/',
    severity: 'HIGH',
    description: '73 legitimate Battle Spirits Wiki keywords were completely omitted from KEYWORD_CATALOG and KeywordRegistry (including Infinite Blade, Count Break, Manifest, Furious Charge, Twinkle Trace, Dark Esoterica, Pyroxene Esoterica, Return to Prime, Super Boost, etc.).',
    root_cause: 'Incomplete historical keyword cataloging from legacy wave sets.',
    impact: 'Cards with these keywords failed compilation or had abilities dropped.',
    remediation_status: 'REMEDIED_AND_VERIFIED'
  },
  {
    defect_id: 'DEF-W1-17',
    title: 'Multi-Level Range Bracket Mangling [LV1-LV3] -> [LV1-[LV3]',
    subsystem: 'compiler/header_parser.js',
    severity: 'HIGH',
    description: 'Regex .replace(/(?<!\\[)LV(\\d+)\\]/gi, "[LV$1]") matched LV3] inside [LV1-LV3] because the preceding character was a hyphen. This produced malformed bracket syntax [LV1-[LV3], causing subsequent timing and keyword parsing to abort.',
    root_cause: 'Negative lookbehind did not account for hyphenated range brackets.',
    impact: 'Header parser aborted level and keyword extraction on all cards with range headers.',
    remediation_status: 'REMEDIED_AND_VERIFIED'
  },
  {
    defect_id: 'DEF-W1-18',
    title: 'Unbracketed Armor Headers Dropped from Ability Header Keyword',
    subsystem: 'compiler/header_parser.js',
    severity: 'MEDIUM',
    description: 'Cards formatted with unbracketed armor headers like [LV1][LV2] Heavy Armor: Red failed to match bracketed keyword regex in header while-loop, leaving header.keyword as null.',
    root_cause: 'While loop in parseAbilityHeaders only evaluated bracketed patterns [A-Za-z...].',
    impact: 'Required cards to rely on raw string fallbacks rather than structured keyword IR.',
    remediation_status: 'REMEDIED_AND_VERIFIED'
  },
  {
    defect_id: 'DEF-W1-19',
    title: 'Infinite Blade Attacker Unconditionally Exhausted on Attack Declaration',
    subsystem: 'engine/index.js -> declareAttack',
    severity: 'HIGH',
    description: 'declareAttack unconditionally transitioned attacking stack state to EXHAUSTED, ignoring Infinite Blade official ruling that the spirit does not exhaust when target-attacking while holding Soul Core.',
    root_cause: 'Combat declaration flow lacked target attack non-exhaustion exception hooks.',
    impact: 'Infinite Blade spirits were unable to execute consecutive target attacks as intended.',
    remediation_status: 'REMEDIED_AND_VERIFIED'
  },
  {
    defect_id: 'DEF-W1-20',
    title: '11 Armor Family Variants Omitted from isArmorFamily Continuous Immunity',
    subsystem: 'engine/continuous.js',
    severity: 'HIGH',
    description: 'isArmorFamily only checked ["Armor", "Heavy Armor", "Ultra Armor", "Silver Wheel", "Barrage"]. Modern variants (Knight Armor, Contract Armor, Count Armor, Aurora Armor, PS Armor, VPS Armor, TP Armor, MD Armor, G.A.T. Field, Illusive Armor, Illusive Ultra Heavy Armor) were omitted, giving 0 color immunity.',
    root_cause: 'Hardcoded keyword array omitted modern armor variants.',
    impact: 'Cards with modern armor mechanics received zero continuous effect immunity.',
    remediation_status: 'REMEDIED_AND_VERIFIED'
  }
];

fs.writeFileSync('reports/phase_w1/newly_discovered_defects.json', JSON.stringify(additionalDefects, null, 2), 'utf8');

const mdReport = `# NEWLY DISCOVERED DEFECTS REPORT (DEF-W1-15 THROUGH DEF-W1-20)
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** ${new Date().toISOString()}

---

## 1. Executive Summary

Beyond the 14 defects cited in the historical audit, independent static analysis and runtime tracing during Phase W.1 identified **6 additional critical-to-medium architectural defects** in the BSP compiler and engine.

| Defect ID | Title | Subsystem | Severity | Remediation Status |
| :--- | :--- | :--- | :---: | :--- |
${additionalDefects.map(d => `| **${d.defect_id}** | **${d.title}** | \`${d.subsystem}\` | **${d.severity}** | \`${d.remediation_status}\` |`).join('\n')}

---

## 2. In-Depth Technical Defect Analysis

${additionalDefects.map(d => `### ${d.defect_id}: \`${d.title}\`
- **Subsystem:** \`${d.subsystem}\`
- **Severity:** \`${d.severity}\`
- **Detailed Description:** ${d.description}
- **Root Cause:** ${d.root_cause}
- **Architectural Impact:** ${d.impact}
- **Remediation Status:** \`${d.remediation_status}\`
`).join('\n')}
`;

fs.writeFileSync('reports/phase_w1/NEWLY_DISCOVERED_DEFECTS_REPORT.md', mdReport, 'utf8');

console.log('WP-H additional defects discovery completed:');
console.log(' - NEWLY_DISCOVERED_DEFECTS_REPORT.md generated');
