# Unresolved Limitations & Known Boundaries (Phase 4D — Work Package L)
**Generated At:** 2026-11-21T09:45:00.000Z  
**Project:** Battle Spirits Eternal (BSP)  
**Standard:** Phase 4D Engineering Boundary Disclosure  

---

## 1. Executive Summary

This report transparently details the known technical boundaries, unsupported mechanics, and post-release roadmap items following the completion of Phase 4D. No known bugs exist in release-critical (P0) gameplay systems; all unsupported mechanics fail-closed deterministically.

---

## 2. Card Support & Mechanic Boundaries

| Category | Population | Impact / Rationale | Resolution Timeline |
|---|---|---|---|
| **Unsupported Cards** | 3,100 (21.22%) | Complex crossover mechanics (e.g., niche Gundam/Kamen Rider transformation sub-games, complex multi-card physical overlays) | P2 — Post-release expansions |
| **Partially Supported Cards** | 6,996 (47.89%) | Cards having primary abilities (Summon, Attack, BP, Draw, Destroy) fully operational, with secondary clauses awaiting specialized keyword handler tests | P1 / P2 — Incremental batch verification |
| **Vanilla Cards** | 374 (2.56%) | Cards with 0 abilities (stat sticks); 100% playable with full core, level, and combat mechanics | **Fully Playable Baseline** |
| **Fully Supported Cards** | 4,139 (28.33%) | 100% of compiled abilities and clauses operational and verified | **Release Ready (P0)** |

---

## 3. Engine & Environment Boundaries

1. **Headless Chrome Audio:**
   - In headless Chrome CDP runs, Web Audio contexts are suspended by default without an active audio output device. Browser tests intentionally run without audio assertions.
2. **Match Formats:**
   - Standard 1v1 Eternal Format (Life 5, Reserve 4, Deck 40-60) is fully supported and verified.
   - Tag battles, 3-4 player multiplayer, and draft/sealed deck pools are not yet implemented in the engine UI.
3. **Network Multiplayer:**
   - Current release focuses strictly on local playability (Player vs Headless AI / Hotseat) and single-client browser arena. WebSocket/WebRTC P2P netcode is decoupled from local match rules.
4. **Adversarial Input Protection:**
   - Client interaction responses are strictly validated against candidate pools. Malformed or replayed interaction IDs fail closed with explicit diagnostic errors (`ILLEGAL_CANDIDATE_SELECTED`, `INTERACTION_ALREADY_RESOLVED`).
