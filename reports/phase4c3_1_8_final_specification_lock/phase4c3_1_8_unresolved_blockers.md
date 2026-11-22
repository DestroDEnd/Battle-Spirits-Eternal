# Phase 4C.3.1.8 — Unresolved Blockers & Implementation Gate Report

**Document ID:** `BS-GATE-4C318-BLK-01`  
**Phase:** 4C.3.1.8 (Final Specification Lock)  
**Status:** SPECIFICATION LOCKED / GATED FOR IMPLEMENTATION  
**Author:** Battle Spirits Eternal Rules & Compiler Architecture Team  
**Scope:** Governance & blocker tracking only; no production or compiler code modifications.

---

## 1. Executive Summary

Phase 4C.3.1.8 has successfully locked the physical ability identity specification, reconciled official rules evidence against primary Bandai publications, eliminated spurious rule subsection claims, classified all 65 Once per Game abilities, validated all 7 CSV files to zero malformed rows, and preserved the 50-test master matrix.

This document identifies the remaining implementation blockers and technical prerequisites that must be satisfied before Phase 4C.3.2 implementation can be authorized.

---

## 2. Technical Prerequisites & Implementation Gaps (Phase 4C.3.2 Scope)

The following architectural components are fully specified and conditionally approved, but remain **strictly unimplemented** in production code:

| Area | Component | Target Production File | Current Codebase Status | Phase 4C.3.2 Implementation Task |
| :--- | :--- | :--- | :--- | :--- |
| **Compiler** | Approach A Dual-Digest Generator | `compiler/header_parser.js` & AST pipeline | Lines 113-124 / 329-334: Drops 826 restrictions; no RFC 8785 canonical hashing. | Implement RFC 8785 serializer, SHA-256 ($H_1$), SHA-512 slice ($H_2$), and 21-pattern regex engine. |
| **Compiler** | In-Memory Collision Registry | `compiler/header_parser.js` / `compiler/ir_validator.js` | Registry does not exist; duplicate IDs are not deep-compared. | Implement `AbilityIdentityCompiler` with exact descriptor string equality guard ($D_1 === D_2$). |
| **Engine State** | Restrictions Schema | `engine/state.js` | Line 114: Contains only `abilityUses: {}`. `state.restrictions` does not exist. | Add `state.restrictions = { counters: {}, meta: {} }` to `createGameState()`. |
| **Engine Zones** | Placement Identity Lifecycle | `engine/zones.js` | Line 241 (`moveCard`): Preserves `card.id` but assigns zero `placementId`. | Allocate fresh `placementId` (`p_101`) upon entering Field; preserve across Soul State. |
| **Engine Runtime** | Stage 4 Pre-Resolution Commit | `engine/index.js` | Lines 228-242: Consumes limit only after resolver success (line 241); blocks non-field sources (line 225). | Refactor `activateAbility` to commit limits before resolver execution; allow hand/trash/burst sources. |
| **Engine Flow** | Boundary Reset Handlers | `engine/flow.js` | Lines 44-71: Turn transition advances `turnNumber` but never clears `abilityUses` or restriction counters. | Integrate `resetRestrictions(TURN)`, `resetRestrictions(STEP)`, and `resetRestrictions(BATTLE)`. |
| **Legacy Bridge** | Bidirectional Restriction Adapter | `engine/legacy_bridge.js` | Lines 154, 302: Copies only `abilityUses`; drops all structured restriction metadata. | Implement translation adapter between `state.restrictions` and `duelState.abilityUses`. |
| **Test Suite** | 50 Regression Tests | `tests/rules/restrictions_test.js` (to be created) | Zero test files exist for the 50 new test specifications. | Implement and execute all 50 tests under test-first methodology. |

---

## 3. Rules & Evidentiary Boundaries

1. **Intended Project Target:** Battle Spirits Eternal Rules Ver. 17.0 (`engine/rules/eternal.js:9`). The effective date of Ver. 17.0 is April 11, 2026.
2. **Retraction of Misattributed Rule Numbers:** Previous citations of "8-1-3" and "8-1-6" are permanently retracted. Same-name restrictions are grounded in the Official Rule Revision Announcement and Glossary.
3. **Ordinary OPG Classification:** Bandai rules do not track physical card objects across zones for Ordinary OPG. The digital engine models this as an **engine convention** via persistent `card.id` match budget counters.

---

## 4. Final Implementation Gate Verdict

| Acceptance Criterion | Audit Finding | Gate Status |
| :--- | :--- | :---: |
| **Digest Slicing Unambiguous** | 16 raw bytes = 32 hexadecimal characters explicitly specified. | **SATISFIED** |
| **Deterministic Collision Handling** | Unconditional derivation; exact descriptor equality check; zero discovery-order suffixes. | **SATISFIED** |
| **Conservative Cryptographic Rigor** | Rejection of additive 384-bit collision resistance; birthday bound and Poisson analysis stated. | **SATISFIED** |
| **Target Eternal Rules Documented** | Ver. 17.0 established from `engine/rules/eternal.js`; April 11, 2026 effective date verified. | **SATISFIED** |
| **Rules Misattributions Corrected** | Rules 8-1-3 and 8-1-6 retracted; official glossary citations verified. | **SATISFIED** |
| **65 OPG Entries Reconciled** | 18 Officially Verified, 0 Ruling, 47 Engine Convention, 0 Unverified. Total = 65. | **SATISFIED** |
| **Zero Malformed CSV Rows** | All 7 CSV files parsed with RFC 4180 validator; 0 malformed rows across 208 records. | **SATISFIED** |
| **50 Test IDs Preserved & Pending** | 50 specified, 50 pending, 0 executed, 0 unverified rules dependencies. | **SATISFIED** |
| **Zero Production Files Modified** | 0 files modified in `engine/`, `compiler/`, `data/`, or `tests/`. | **SATISFIED** |

### Verdict:
$$\mathbf{SPECIFICATION\ LOCK\ COMPLETE\ —\ READY\ FOR\ PHASE\ 4C.3.2\ AUTHORIZATION}$$

All design and evidentiary blockers are resolved. Implementation must NOT begin until explicit user authorization is provided.
