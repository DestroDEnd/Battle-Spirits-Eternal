# KEYWORD ARCHITECTURE GAPS REPORT

## Overview
This document evaluates the existing BSP engine architecture against the complete rules requirements of all 348 Wiki keywords.

## 1. Compiler Subsystem (compiler/keyword_compiler.js & header_parser.js)
- **Strengths**: Header parser successfully isolates level restrictions, timing steps, and bracketed header keywords.
- **Architectural Gaps**:
  1. `bindKeywordsToAbilities` incorrectly ran regex extraction across body text clauses, binding reference-only keywords to cards natively.
  2. Bracket regex `/\[([A-Za-z0-9\.\-\s]+?)(?:::s*([^\]]+)|:s*([^\]]+))?\]/g` split at the first colon, destroying keywords containing internal colons (`[Type: Driver]`, `[Type: Song]`, `[Type: Field]`, `[Type: Flower]`, `[Type: Vision]`).
  3. 73 Wiki keywords were omitted from `KEYWORD_CATALOG`.

## 2. Runtime Event Subsystem (engine/keywords/registry.js)
- **Strengths**: Event bus provides comprehensive lifecycle hooks: `ATTACK_DECLARED`, `BLOCK_DECLARED`, `LIFE_REDUCED`, `DESTROYED`, `BATTLE_END`, `MAGIC_USED`, `BP_COMPARE`, `STEP_START`.
- **Architectural Gaps**:
  1. `DESTROYED` event handler filters active keywords strictly using `{ timing: 'WHEN_DESTROYED' }`, which drops attack-timed keywords like True-Curse.
  2. Curse sets `curseTargetStackId` on block declaration, but no listener or step handler in `engine/flow.js` ever reads it.
  3. 66 handlers were registered as empty stubs with `hooks: {}`.

## 3. Continuous Immunity & Protection (engine/continuous.js)
- **Strengths**: Robust color and source type filtering under `isImmune`.
- **Architectural Gaps**:
  1. `isArmorFamily` array omitted `Ultra Heavy Armor`.
  2. Custom armor types (`Knight Armor`, `Contract Armor`, `PS Armor`) are not whitelisted in continuous immunity evaluation.

## 4. Player Decision Controller (engine/prompt_manager.js & interaction.js)
- **Strengths**: Asynchronous promise-based prompt resolution with replay protection and candidate validation.
- **Architectural Gaps**:
  1. True-Curse falls back silently to `oppField[0]` instead of respecting player choices.
  2. Waves 2 through 6 completely lack prompt controller integration.

## 5. Combat Flow (engine/flow.js & battle_arena.js)
- **Strengths**: Clean step transitions (Attack Declaration -> Flash 1 -> Block Declaration -> Flash 2 -> BP Comparison / Life Reduction -> Battle End).
- **Architectural Gaps**:
  1. Mandatory block enforcement (`mustBlockIfAble`) was only checked by AI heuristic, leaving human PvP flow unenforced.
  2. Infinite Blade target attack without exhaustion requires direct flow integration.
