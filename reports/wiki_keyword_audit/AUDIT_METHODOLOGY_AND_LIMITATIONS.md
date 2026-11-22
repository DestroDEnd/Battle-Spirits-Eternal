# AUDIT METHODOLOGY AND LIMITATIONS

## 1. Primary Sources & Scope
- **Wiki Source**: Official Battle Spirits Wiki (`battle-spirits.fandom.com`), capturing `Template:Keywords_Nav` and `Category:Keywords`.
- **Compiler Scope**: `compiler/keyword_compiler.js` and imported parsers.
- **Runtime Scope**: `engine/keywords/index.js`, `registry.js`, `wave1.js` through `wave6.js`.
- **Corpus Scope**: `data/cards_detailed.json` (14,443 unique cards) and `data/ir_shards/*.json` (514 shards, 15,398 card instances).
- **Test Scope**: All 244 test suites in `tests/`.

## 2. Classification Criteria (Phase J)
1. **FULLY_VERIFIED**: Compiler extraction + runtime registration + correct handler & timing window + verified semantic logic + genuine real-card T4 test assertions + zero blocking defects.
2. **PARTIALLY_IMPLEMENTED**: Executable mechanics exist, but exhibit confirmed defects, incomplete rules coverage, or incorrect cloning.
3. **HANDLER_ONLY**: Handler exists (or empty hooks stub), but lacks demonstrated executable mechanics or is untested in game flow.
4. **COMPILER_ONLY**: Compiler recognizes keyword, but runtime registry has no handler.
5. **CARD_DATA_ONLY**: Keyword appears in card corpus effect texts, but compiler and runtime support are absent.
6. **MISSING**: Absent from compiler catalog, runtime registry, and card data.
7. **UNVERIFIED**: Contradictory or unconfirmed evidence.
8. **NOT_IN_CURRENT_CARD_CORPUS**: Secondary flag indicating zero card instances found in current dataset.

## 3. Test Evidence Quality Tiers (Phase G)
- **T0**: Zero test evidence.
- **T1**: Recognition only (asserting presence in catalog/registry).
- **T2**: Handler test (direct unit invocation with synthetic state).
- **T3**: Engine integration (production execution path with synthetic cards).
- **T4**: Real-card end-to-end (sharded real card through compiler, activation, targeting, and resolution).

## 4. Limitations
- Offline evaluation of Wiki wikitext is based on the snapshot captured from the official wiki API on 2026-11-22.
- Static scanning alone cannot prove semantic validity; all classifications are cross-checked with manual semantic inspection of engine ops and hooks.
- No project source files or card databases were modified during this audit phase.
