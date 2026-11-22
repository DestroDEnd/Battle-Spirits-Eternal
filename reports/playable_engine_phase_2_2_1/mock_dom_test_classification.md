# Mock-DOM Test Classification & Boundary Audit

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** 2.2.1 Stabilization & Audit Integrity  
**Date:** 2026-11-21  

---

## 1. Executive Summary

An independent audit of Phase 2.2 noted that \`tests/browser_arena_gameplay.test.js\` was described as a browser gameplay test, but executed inside a mock-DOM environment using \`MockDOMElement\` (\`tests/helpers/browser_harness.js\`) and simulated portions of the interaction lifecycle.

In compliance with Phase 2.2.1 directives:
1. **Preservation:** \`tests/browser_arena_gameplay.test.js\` is strictly preserved to prevent test regression.
2. **Reclassification:** It is formally and explicitly classified as \`Classification: MOCK_DOM_INTEGRATION\`.
3. **Real Browser Separation:** Genuine browser verification is implemented in \`tests/real_browser_arena.test.js\` using headless Google Chrome via Chrome DevTools Protocol.

---

## 2. Distinction Between Test Suites

| Attribute | Mock-DOM Test (\`tests/browser_arena_gameplay.test.js\`) | Genuine Browser Test (\`tests/real_browser_arena.test.js\`) |
|---|---|---|
| **Runtime Environment** | Node.js process with simulated \`window\`, \`document\`, \`localStorage\` | Real Google Chrome (v157+) running via CDP |
| **DOM Engine** | Custom \`MockDOMElement\` stub class | Genuine Blink/Chromium DOM engine |
| **Rendering** | No CSS rendering, layout engine, or painting | Real layout, CSS parsing, z-index calculation, and rasterization |
| **Server Interaction** | Static in-memory imports | Live HTTP requests to \`server.js\` on localhost |
| **Event Loop** | Node.js microtask/macrotask queue | Chromium browser event loop with real click/pointer events |
| **State Transitions** | Driven via engine adapter with simulated UI hooks | Driven exclusively through browser UI controls and modal buttons |
| **Direct State Mutation** | Permitted in unit-style fixtures | **Strictly Forbidden** (zero splice, zero core overrides) |
| **Evidence Output** | In-memory assertion logs | High-resolution PNG screenshot and full DOM verification |

---

## 3. Analysis of \`tests/browser_arena_gameplay.test.js\`

### Role & Purpose
\`tests/browser_arena_gameplay.test.js\` exercises the 16-step integration pipeline between \`BSEngineAdapter\`, \`PromptManager\`, and UI event listeners without requiring external browser binary availability. This makes it an ideal fast-path continuous integration test.

### Why It Remains Valuable
- Verifies that UI-bound callbacks correctly invoke adapter APIs.
- Asserts that \`INTERACTION_REQUESTED\` events emit expected payload schemas.
- Ensures \`resolveInteraction\` passes structured decisions back to the engine.
- Fast execution (~85ms), suitable for rapid feedback loops.

### Classification Status
- **Old Claim:** "Browser Arena Gameplay E2E"
- **Corrected Status:** \`MOCK_DOM_INTEGRATION\`
- **Master Inventory Category:** \`Integration / Mock-DOM\`
