# Phase 4C.3.1.8 — Architecture Decisions & Governance Standard

**Document ID:** `BS-GOV-4C318-DEC-01`  
**Phase:** 4C.3.1.8 (Final Specification Lock)  
**Status:** GOVERNANCE LOCKED / AUDIT COMPLIANT  
**Author:** Battle Spirits Eternal Rules & Compiler Architecture Team  
**Scope:** Architectural governance only; no production or compiler code modifications.

---

## 1. Architectural Governance & Evidentiary Standard

In accordance with strict technical auditing standards, the Battle Spirits Eternal engine governance framework distinguishes four distinct categories of architectural propositions:

1. **Sound Technical Proposal:** A robust software engineering design (e.g., RFC 8785 Canonical JSON, dual-digest derivation, bidirectional adapters) that solves digital implementation requirements cleanly and deterministically.
2. **Proposal Consistent with Available Official Rules:** A design choice that aligns with known principles of the physical card game (e.g., cards leaving the field lose status, reprints share latest errata) without having a specific subsection clause explicitly dictating software mechanics.
3. **Behavior Directly Required by an Official Rule:** A game behavior explicitly mandated by official Bandai rules documentation (e.g., `〔ターンに1回：同名〕` and `〔ゲームに1回：同名〕` restricting activations across all copies of the card name for the player).
4. **Behavior That Remains an Engine Convention:** An internal digital engine mechanism (e.g., `placementId` allocation, `Stage 4 Atomic Commit`, persistent `card.id` budget counters for Ordinary OPG) designed to model physical tabletop play in software.

> [!CRITICAL]
> **Audit Rule:** A sound technical proposal is **NEVER** conflated with an official rules requirement. Architectural decisions are approved strictly as software design specifications, while runtime components remain marked `NOT_IMPLEMENTED` until verified code is landed and tested.

---

## 2. Evaluation of the 16 Architecture Areas

### Area 1: Physical Ability Identity
- **Proposal Type:** Sound Technical Proposal.
- **Decision:** **`CONDITIONALLY_APPROVED`**.
- **Evidentiary Basis:** NIST FIPS 180-4 (SHA-256 and SHA-512), RFC 8785 Canonical JSON.
- **Justification & Conditions:** Conditionally approved as a complete, deterministic specification. Unconditional derivation of $H_1$ (SHA-256, 64 hex chars) and $H_2$ (SHA-512 slice, 32 hex chars / 16 bytes) eliminates array-index dependence and parallel cache poisoning. Implementation pending in Phase 4C.3.2.

### Area 2: Collision Handling
- **Proposal Type:** Sound Technical Proposal.
- **Decision:** **`CONDITIONALLY_APPROVED`**.
- **Evidentiary Basis:** Deep AST Canonical Descriptor Equality Guard.
- **Justification & Conditions:** Conditionally approved. Guarantees that any dual-digest collision triggers an exact string comparison of canonical descriptors. Descriptors differing triggers an immediate fatal compilation error. No discovery-order suffixes are permitted.

### Area 3: Semantic Ability Identity
- **Proposal Type:** Sound Technical Proposal.
- **Decision:** **`CONDITIONALLY_APPROVED`**.
- **Evidentiary Basis:** Normalized Descriptor Specification.
- **Justification & Conditions:** Conditionally approved. Strips card numbers, art references, and printing-specific metadata, allowing cross-card and reprint semantic equivalence.

### Area 4: Reprint Matching
- **Proposal Type:** Proposal Consistent with Available Official Rules.
- **Decision:** **`CONDITIONALLY_APPROVED`**.
- **Evidentiary Basis:** Battle Spirits Floor Rules Section 4-2 (Errata across printings).
- **Justification & Conditions:** Conditionally approved. Ensures reprints and errata cards share identical semantic descriptors and limits.

### Area 5: Ordinary Once per Turn (OPT)
- **Proposal Type:** Proposal Consistent with Available Official Rules.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** General Object Principle (cards leaving field reset status).
- **Justification & Conditions:** Specification complete; requires runtime allocation of `placementId` in `engine/zones.js` and validation in `engine/index.js`. Production code not yet written.

### Area 6: Same Name Once per Turn (OPT)
- **Proposal Type:** Behavior Directly Required by an Official Rule.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Official Bandai Rule Revision Announcement & Glossary (`〔ターンに1回：同名〕`).
- **Justification & Conditions:** Specification complete; requires player-scoped pool in `state.restrictions`. Production code not yet written.

### Area 7: Ordinary Once per Game (OPG)
- **Proposal Type:** Behavior That Remains an Engine Convention.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Engine Convention (digital `card.id` budget counter).
- **Justification & Conditions:** Specification complete; requires persistent `card.id` tracking in `state.restrictions` to model physical tabletop play. Production code not yet written.

### Area 8: Same Name Once per Game (OPG)
- **Proposal Type:** Behavior Directly Required by an Official Rule.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Official Bandai Rule Revision Announcement & Glossary (`〔ゲームに1回：同名〕`).
- **Justification & Conditions:** Specification complete; requires match-wide player pool in `state.restrictions`. Production code not yet written.

### Area 9: Non-Field Activation Identity
- **Proposal Type:** Sound Technical Proposal.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Zone-Scoped Instance Key Architecture (`${zone}:${cardId}:${abilityId}`).
- **Justification & Conditions:** Specification complete; requires modifying `engine/index.js:225` to permit hand, trash, and burst sources. Production code not yet written.

### Area 10: Granted Ability Identity
- **Proposal Type:** Sound Technical Proposal.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Composite Key Architecture (`GRANT:${granterId}:${abilityId}`).
- **Justification & Conditions:** Specification complete; requires resolver modifier tracking. Production code not yet written.

### Area 11: Zone Lifecycle & Placement IDs
- **Proposal Type:** Sound Technical Proposal Consistent with Official Rule Principles.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Contract Soul State & Pre-Advent Under-card mechanics.
- **Justification & Conditions:** Specification complete; requires lifecycle allocation in `engine/zones.js`. Production code not yet written.

### Area 12: Activation Consumption Timing
- **Proposal Type:** Sound Technical Proposal / Engine Convention.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Internal Engine Design (Stage 4 Pre-Resolution Atomic Commit).
- **Justification & Conditions:** Specification complete; requires refactoring `engine/index.js:228-242` to commit limits before resolver execution. Production code not yet written.

### Area 13: Reset Lifecycle
- **Proposal Type:** Proposal Consistent with Available Official Rules.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Official Turn Structure (Step/Turn transitions).
- **Justification & Conditions:** Specification complete; requires integrating boundary resets into `engine/flow.js`. Production code not yet written.

### Area 14: Legacy Bridge Persistence
- **Proposal Type:** Sound Technical Proposal.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** Bidirectional Adapter Architecture.
- **Justification & Conditions:** Specification complete; requires translation logic between `state.restrictions` and `duelState.abilityUses` in `engine/legacy_bridge.js`. Production code not yet written.

### Area 15: Compiler Restriction Preservation
- **Proposal Type:** Sound Technical Proposal.
- **Decision:** **`NOT_IMPLEMENTED`**.
- **Evidentiary Basis:** 21-Pattern Compiler Specification.
- **Justification & Conditions:** Specification complete; requires regex engine in `compiler/header_parser.js`. Production code not yet written.

### Area 16: Test Architecture
- **Proposal Type:** Sound Technical Specification.
- **Decision:** **`CONDITIONALLY_APPROVED`**.
- **Evidentiary Basis:** 50-Test Master Matrix Specification.
- **Justification & Conditions:** Conditionally approved. Complete suite of 50 tests specified with concrete inputs, execution sequences, and expected assertions; pending implementation in Phase 4C.3.2.

---

## 3. Summary of Governance Classifications

| Governance Classification | Count | Areas |
| :--- | :---: | :--- |
| **`CONDITIONALLY_APPROVED`** | **5** | Physical ability identity, Collision handling, Semantic ability identity, Reprint matching, Test architecture |
| **`NOT_IMPLEMENTED`** | **11** | Ordinary OPT, Same Name OPT, Ordinary OPG, Same Name OPG, Non-field identity, Granted identity, Zone lifecycle, Activation timing, Reset lifecycle, Legacy bridge, Compiler preservation |
| **`APPROVED` (Unconditional)** | **0** | Strictly zero; no production implementation exists in the current codebase |
| **TOTAL** | **16** | All 16 areas accounted for |

All 16 areas are fully resolved with transparent distinctions between technical design, official rules, and implementation status.
