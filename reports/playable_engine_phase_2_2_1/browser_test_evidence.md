# Browser Test Evidence

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** 2.2.1 Real Browser Verification  
**Date:** 2026-11-21  

---

## 1. Visual Capture Evidence

During the execution of \`tests/real_browser_arena.test.js\`, real Google Chrome rendered the production arena interface at 1280x800 resolution. The screenshot captured upon successful summon of DarkGoradon and resolution of the interactive UI workflow is archived at:

- **Screenshot File Path:** \`reports/playable_engine_phase_2_2_1/browser_real_gameplay_screenshot.png\`
- **File Format:** PNG (Portable Network Graphics)
- **File Size:** ~157 KB (157,843 bytes)
- **Timestamp:** 2026-11-21

---

## 2. DOM State Evidence

At the moment of capture, the genuine Chromium DOM state exhibited:
- **Body Class:** \`arena-page-body\`
- **Player Field (\`#playerField\`):** Present, containing 1 active Spirit stack (\`DarkGoradon\`, LV1 3000 BP) with active core counters.
- **Player Reserve Display:** 2 normal cores remaining after payment of summon cost and field placement.
- **Player Life Counter:** 5 Life cores intact.
- **Opponent Zones:** Opponent hand (4 cards facedown), Opponent life (5 cores), Opponent reserve (4 cores).
- **Navigation & Header:** Full navbar with brand icon \`⚔️ Battle Spirits Eternal\`, turn indicator, step banners.

---

## 3. CDP Event Stream Log Summary

\`\`\`text
[CDP] Page.enable -> OK
[CDP] Runtime.enable -> OK
[CDP] DOM.enable -> OK
[CDP] Page.navigate -> http://127.0.0.1:3777/arena.html
[CDP] Page.loadEventFired -> OK
[CDP] Runtime.evaluate -> BattleArena.startDuel('red', 'purple', 'player')
[CDP] Runtime.evaluate -> inDuel === true
[CDP] Runtime.evaluate -> BattleArena.openSummonModal('c_11')
[DOM] #battleSummonPaymentModal.classList.add('active')
[CDP] Runtime.evaluate -> BattleArena.confirmSummonPayment()
[Engine] Action: SUMMON card BS01-002 DarkGoradon (Cost: 2, Cores: 1)
[Engine] Cores moved: 2 to Trash, 1 to Field Spirit
[Engine] Event: CARD_SUMMONED { card: 'BS01-002', side: 'player' }
[CDP] Runtime.evaluate -> BattleArena.promptStructuredDecision(...)
[DOM] Append element: div.universal-target-modal
[CDP] DOM.click -> div[data-uid="target_spirit_1"]
[CDP] DOM.click -> button[data-act="confirm"]
[Engine] Interaction resolved: { accepted: true, selected: ['target_spirit_1'] }
[DOM] Remove element: div.universal-target-modal
[CDP] Page.captureScreenshot -> binary PNG data
\`\`\`
