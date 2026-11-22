# KEYWORD SEMANTIC DEFECTS REPORT

## Overview
This report documents all **14** confirmed mechanical defects discovered during the source code and rules execution audit.
Each entry includes reproduction conditions, affected source code files, exact line numbers, severity, and required behavior according to the official rules.

### Curse [Severity: CRITICAL]
- **Issue**: Curse blocker target never destroyed at battle end
- **Source Location**: `engine/keywords/wave1.js:31 & engine/flow.js`
- **Detailed Finding**: Curse hook sets state.combat.curseTargetStackId on block declaration, but curseTargetStackId is never checked or read anywhere in combat, flow, resolver, SBA, or zones. Curse never destroys the blocker.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### True-Curse [Severity: HIGH]
- **Issue**: Timing filter WHEN_DESTROYED discards attack-timed True-Curse
- **Source Location**: `engine/keywords/registry.js:115 & engine/keywords/wave1.js:48`
- **Detailed Finding**: True-Curse is an attack ability [LV1][LV2] (When Attacks) [True-Curse]. On unit destruction, registry.getActiveKeywords checks { timing: "WHEN_DESTROYED" }, which mismatches WHEN_ATTACKS and filters out True-Curse. Additionally falls back silently to oppField[0].
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Ultra Heavy Armor [Severity: HIGH]
- **Issue**: Ultra Heavy Armor omitted from isArmorFamily continuous check
- **Source Location**: `engine/continuous.js:658`
- **Detailed Finding**: isArmorFamily in isImmune explicitly checks ["Armor", "Heavy Armor", "Ultra Armor", "Silver Wheel", "Barrage"], omitting Ultra Heavy Armor. Cards with Ultra Heavy Armor receive zero immunity.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Wave Crush [Severity: HIGH]
- **Issue**: Wave Crush mechanics cloned from Crush (Cost vs Level, Grave vs Banish, Missing 0 Symbol)
- **Source Location**: `engine/keywords/wave1.js:521`
- **Detailed Finding**: Wave Crush is registered as {...CrushKeyword, id: "Wave Crush"}. In official rules, Wave Crush looks at Cost (not Level), banishes to Removed Zone (not Grave), and fixes Spirit symbol to zero.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### XV Crush [Severity: HIGH]
- **Issue**: XV Crush mechanics cloned from Great Crush (Summon vs Attack timing, incorrect milling & destruction)
- **Source Location**: `engine/keywords/wave1.js:522`
- **Detailed Finding**: XV Crush is registered as {...GreatCrushKeyword, id: "XV Crush"}. In official rules, XV Crush activates (When Summoned), discards 10 cards, and destroys opposing Spirits/Ultimates up to total cost 15 if any opposing card is banished.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Heaven Holy Life [Severity: MEDIUM]
- **Issue**: Heaven Holy Life only triggers on attacking spirit instead of any friendly spirit
- **Source Location**: `engine/keywords/registry.js:89 & engine/keywords/wave1.js:534`
- **Detailed Finding**: Heaven Holy Life is registered as {...HolyLifeKeyword}. In official rules, Heaven Holy Life supports all Spirits on field during Your Attack Step when any spirit deals life damage. Registry only checks attacker stack.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Chaotic Holy Life [Severity: MEDIUM]
- **Issue**: Chaotic Holy Life triggers on damage instead of on block and at battle end
- **Source Location**: `engine/keywords/registry.js:84 & engine/keywords/wave1.js:525`
- **Detailed Finding**: Chaotic Holy Life is registered as {...HolyLifeKeyword}. In official rules, Chaotic Holy Life recovers life when blocked and at battle end, not on unblocked combat damage.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Dark Assault [Severity: MEDIUM]
- **Issue**: Dark Assault expects Nexus exhaustion instead of sending 3 cards to Trash
- **Source Location**: `engine/keywords/wave1.js:529`
- **Detailed Finding**: Dark Assault is registered as {...AssaultKeyword}. In official rules, Dark Assault refreshes by sending a total of 3 cards from Hand and decktop to Trash and increases opposing LV cost +3, rather than exhausting a friendly Nexus.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Clash [Severity: HIGH]
- **Issue**: Clash mustBlockIfAble only evaluated by AI heuristic, unenforced in player flow
- **Source Location**: `engine/keywords/wave1.js:19 & engine/ai.js:122`
- **Detailed Finding**: Clash sets state.combat.mustBlockIfAble = true. However, engine/flow.js and engine/windows.js never enforce this flag during human player block windows. Players can pass without blocking.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Type: Driver [Severity: MEDIUM]
- **Issue**: Bracket regex splits at colon preventing compiler catalog match
- **Source Location**: `compiler/keyword_compiler.js:296`
- **Detailed Finding**: extractKeywords regex splits bracket content at first colon. [Type: Driver] parses rawName as "Type" and param as "Driver", failing to match catalog key "Type: Driver".
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Type: Song [Severity: MEDIUM]
- **Issue**: Bracket regex splits at colon preventing compiler catalog match
- **Source Location**: `compiler/keyword_compiler.js:296`
- **Detailed Finding**: extractKeywords regex splits bracket content at first colon. [Type: Song] parses rawName as "Type", failing catalog lookup.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Type: Field [Severity: MEDIUM]
- **Issue**: Bracket regex splits at colon preventing compiler catalog match
- **Source Location**: `compiler/keyword_compiler.js:296`
- **Detailed Finding**: extractKeywords regex splits bracket content at first colon. [Type: Field] parses rawName as "Type", failing catalog lookup.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Type: Flower [Severity: MEDIUM]
- **Issue**: Bracket regex splits at colon preventing compiler catalog match
- **Source Location**: `compiler/keyword_compiler.js:296`
- **Detailed Finding**: extractKeywords regex splits bracket content at first colon. [Type: Flower] parses rawName as "Type", failing catalog lookup.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
### Type: Vision [Severity: MEDIUM]
- **Issue**: Bracket regex splits at colon preventing compiler catalog match
- **Source Location**: `compiler/keyword_compiler.js:296`
- **Detailed Finding**: extractKeywords regex splits bracket content at first colon. [Type: Vision] parses rawName as "Type", failing catalog lookup.
- **Mechanical Impact**: Prevents cards featuring this keyword from functioning according to Battle Spirits official rules.

---
