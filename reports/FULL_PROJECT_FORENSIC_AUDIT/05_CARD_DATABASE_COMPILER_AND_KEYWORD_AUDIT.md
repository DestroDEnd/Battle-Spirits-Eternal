# BATTLE SPIRITS ETERNAL — FULL PROJECT FORENSIC AUDIT
## 05. CARD DATABASE, COMPILER, AND KEYWORD AUDIT

**Subsystem:** Card Database, Compiler Patterns, IR Shards, and Keyword Registry  
**Audit Status:** **MAJOR KEYWORD DECOUPLING & ORPHANED IMPLEMENTATION DEFECTS IDENTIFIED**

---

### 1. Card Database Corpus Metrics

The Battle Spirits Eternal card corpus is stored in `data/`:
- [data/cards_detailed.json](file:///c:/Users/namis/Downloads/BSP/data/cards_detailed.json): 18.19 MB, 14,443 individual card records.
- [data/cards_index.json](file:///c:/Users/namis/Downloads/BSP/data/cards_index.json): 7.58 MB, 14,443 indexed cards.
- [data/rebirth_catalog.json](file:///c:/Users/namis/Downloads/BSP/data/rebirth_catalog.json): 530 reversible / double-sided card pairs.
- [data/card_effects_db.json](file:///c:/Users/namis/Downloads/BSP/data/card_effects_db.json): 348 MB compiled intermediate representation (IR) database.
- [data/ir_shards/](file:///c:/Users/namis/Downloads/BSP/data/ir_shards): 514 JSON shard files for fast on-demand card loading.

#### Corpus Distribution by Card Type:
- **Spirits:** 8,247 cards (57.1%)
- **Brave:** 1,218 cards (8.4%)
- **Magic:** 2,981 cards (20.6%)
- **Nexus:** 1,264 cards (8.8%)
- **Ultimate:** 733 cards (5.1%)
- **Total:** 14,443 cards

#### Keyword Mentions in Card Text:
- **Flash (フラッシュ):** 4,311 cards
- **Burst (バースト):** 1,831 cards
- **Accel (アクセル):** 432 cards

---

### 2. Compiler Subsystem Architecture

The card compiler in `compiler/` parses raw Japanese and English card text into structured Intermediate Representation (IR):
- [compiler/clause_patterns.js](file:///c:/Users/namis/Downloads/BSP/compiler/clause_patterns.js): 318 KB regex pattern dictionary mapping text phrases to structured operations (`DESTROY`, `BOUNCE`, `CORE_BOOST`, `DRAW`, `REFRESH`, `EXHAUST`).
- [compiler/keyword_compiler.js](file:///c:/Users/namis/Downloads/BSP/compiler/keyword_compiler.js): Catalog containing **354 recognized keyword definitions**. Extracts keyword name, wave, levels, and bracketed qualifiers.
- [compiler/header_parser.js](file:///c:/Users/namis/Downloads/BSP/compiler/header_parser.js): Delimits timing windows (`WHEN_SUMMONED`, `WHEN_ATTACKS`, `WHEN_DESTROYED`, `FLASH`, `BURST`) and level constraints.

**Compiler Audit Result:** VERIFIED. The compiler accurately maps card clauses to structured IR.

---

### 3. Forensic Keyword Registry Audit: The Reality Behind 364 Keywords

Previous project milestones (Phase W.1 and Phase W.2) claimed that **364 keywords were discovered, compiled, registered, and verified in runtime execution**.

A rigorous forensic code analysis revealed a starkly different reality:

#### Forensic Breakdown of the 364 Registered Keywords:
1. **Total Registered Keywords in [engine/keywords/registry.js](file:///c:/Users/namis/Downloads/BSP/engine/keywords/registry.js):** 364
2. **Keywords with Active Lifecycle Hooks:** **99 (27.2%)**
3. **Keywords with Empty or No Lifecycle Hooks (`hooks: {}`):** **265 (72.8%)** [BSP-AUD-013]
4. **Keywords Completely Lacking Any Executable Functions:** **110 (30.2%)** [BSP-AUD-014] (Pure data stubs consisting only of `{ id, name, wave }`)
5. **Keywords with Custom Methods on Object:** 155 keywords define custom functions (e.g. `executeWhirlwind`, `executeSoulDrive`, `executeUTrigger`, `executeBunshin`).
6. **Custom Keyword Methods Actually Called by the Game Engine:** **6 out of 46 methods** (`executeAccel`, `setMirage`, `executeChange`, `executeHighSpeedSummon`, `flipCard`, `isProtected`).
7. **Custom Keyword Methods NEVER CALLED ANYWHERE in Engine:** **40 out of 46 methods (87.0%)** [BSP-AUD-015]!

#### The 40 Orphaned Keyword Methods:
The following 40 methods exist as dead code on keyword objects in `engine/keywords/wave*.js` and are **never called by engine/index.js, flow.js, resolver.js, or response_window.js**:
`executeWhirlwind`, `executeTrueAwaken`, `executeToppaAwaken`, `executeViolentHighSpeedSummon`, `executeSeal`, `executeUnleash`, `executeSoulDrive`, `hasRushActive`, `hasSixHeavenRushActive`, `executeCatalyze`, `executeUTrigger`, `executeBunshin`, `executeLoad`, `canReviveOnDestruction`, `executeRevival`, `executeTribute`, `executeUnsheathe`, `executePoisonBlade`, `executeSpellBlight`, `executeKagemusha`, `executeSummonBolt`, `executeLeap`, `executeZeroCounter`, `hasChainActive`, `executeEnchainSkipStep`, `executePlunder`, `executeDrawLock`, `executeGodArmy`, `isGodStrikeActive`, `executeGodStrikeBlockCost`, `executeMealtiply`, `executeOnStage`, `executeShowUp`, `executeFriend`, `executeMyUnit`, `executeDigivolution`, `executeFunnel`, `executeFlagContractAdvent`, `executeSoulMagic`, `executeLevelUp`.

#### Why Did Previous Tests Pass?
Unit tests in `tests/keyword_registry.test.js` and `tests/keywords_waves4_5_6.test.js` imported the keyword objects directly and called:
```javascript
await SoulDriveKeyword.executeSoulDrive(state, p, events);
```
The tests verified the isolated function in a synthetic sandbox, **never testing whether the game engine actually invokes it when a card is played in a match**.

---

### 4. Engine Keyword Registry Decoupling [BSP-AUD-016]

At line 316 of [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js):
```javascript
const keywords = options.keywordRegistry || createDefaultKeywordRegistry();
...
game.keywords = keywords;
```
A full search across the entire `engine/` directory confirmed:
- `game.keywords` is **never queried by any engine method**.
- When core keywords resolve during combat (Clash, Curse, Holy Life, Burst), [engine/index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js) uses hardcoded ad-hoc string checks:
  ```javascript
  // Line 1195
  const hasCurse = getActiveStackKeywords(attackerStack, state).some(k => k === 'Curse' || k?.name === 'Curse');
  // Line 1211
  if (hasCurse && blockerStack && blockerStack.top) {
    await moveCard(state, blockerStack.top, 'grave', ...);
  }
  ```
- The 364 registered runtime keywords are completely decoupled from game flow.

---

### 5. Summary of Keyword Classification

See full details in [reports/FULL_PROJECT_FORENSIC_AUDIT/KEYWORD_SUPPORT_MATRIX.csv](file:///c:/Users/namis/Downloads/BSP/reports/FULL_PROJECT_FORENSIC_AUDIT/KEYWORD_SUPPORT_MATRIX.csv):
- **Fully Implemented in Flow:** 10 keywords (Clash, Curse, Crush, Holy Life, Accel, Mirage, Change, High Speed, Heavy Armor, Armor).
- **Partial (Lifecycle Hook Only):** 89 keywords.
- **Disconnected / Orphaned Methods:** 155 keywords.
- **Pure Data Stubs (Zero Functions):** 110 keywords.
