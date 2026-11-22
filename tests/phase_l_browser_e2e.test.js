/**
 * tests/phase_l_browser_e2e.test.js
 * Classification: REAL_BROWSER_E2E
 * 
 * Battle Spirits Eternal — Phase L Work Package P:
 * Real Browser E2E Player-Authoritative Interaction Test.
 * 
 * Verifies in real headless Chrome:
 * 1. Single Candidate Target Selection: When exactly 1 legal candidate exists,
 *    the engine MUST NOT auto-select. It renders the modal, requires explicit DOM click
 *    and Confirm button click.
 * 2. Optional Effect Prompt: When an optional effect triggers, the UI renders the prompt.
 *    Clicking "No" explicitly declines the effect (declined: true, accepted: false).
 * 3. Multiple Candidates Target Selection: Renders all candidates, allows selection
 *    via DOM click, highlights chosen target, and resolves on Confirm.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchRealBrowser } from './helpers/real_browser.js';

test('PHASE-L-BROWSER-E2E: Player-Authoritative Decisions in Real Chrome', async () => {
  const dynamicPort = 4600 + Math.floor(Math.random() * 300);
  const harness = await launchRealBrowser({ serverPort: dynamicPort });

  try {
    // 1. Navigate to production arena
    await harness.navigate('/arena.html');
    const title = await harness.evaluate('document.title');
    assert.equal(title, 'Battle Spirits Eternal | Battle Arena', 'Arena page must load');

    // 2. Wait for BattleArena initialization
    await harness.waitForFunction('window.BattleArena && typeof window.BattleArena.promptStructuredDecision === "function"', 20000);

    // -------------------------------------------------------------
    // Test Case 1: Single Candidate Prompt (Zero Auto-Selection)
    // -------------------------------------------------------------
    const singleCandidateResult = await harness.evaluate(`(async function() {
      const card = { id: 'BS01-017', name: 'Lanceraptor' };
      const singleTargetPrompt = {
        interactionId: 'irq-e2e-single-01',
        requestType: 'SELECT_TARGET',
        type: 'SELECT_TARGET',
        title: 'Select Target Spirit',
        description: 'Select exactly 1 spirit to destroy',
        player: 'player',
        candidates: [
          { uid: 'opp_spirit_99', name: 'Dark Blade Dragon', currentBp: 4000, currentCores: 2 }
        ],
        minSelections: 1,
        maxSelections: 1,
        optional: false
      };

      // Start resolution promise (must NOT resolve automatically!)
      let resolved = false;
      let resultVal = null;
      const decisionPromise = window.BattleArena.promptStructuredDecision(singleTargetPrompt, card, 'player')
        .then(res => {
          resolved = true;
          resultVal = res;
        });

      // Wait 300ms to verify engine suspended and did NOT auto-resolve
      await new Promise(r => setTimeout(r, 300));
      const autoSelectedBeforeClick = resolved;

      // Verify modal is rendered in DOM
      const modal = document.querySelector('.universal-target-modal');
      if (!modal) return { success: false, error: 'Modal not rendered in DOM' };

      const candidateRows = modal.querySelectorAll('[data-uid]');
      if (candidateRows.length !== 1) {
        return { success: false, error: 'Expected exactly 1 candidate row in modal' };
      }

      // Candidate row must be explicitly clicked by user
      const targetRow = modal.querySelector('[data-uid="opp_spirit_99"]');
      if (!targetRow) return { success: false, error: 'Target row not found' };
      targetRow.click();

      // Confirm button must be clicked
      const confirmBtn = modal.querySelector('button[data-act="confirm"]');
      if (!confirmBtn) return { success: false, error: 'Confirm button not found' };
      confirmBtn.click();

      // Await the decision promise
      await decisionPromise;

      return {
        success: true,
        autoSelectedBeforeClick,
        resolved,
        resultVal,
        modalClosed: !document.querySelector('.universal-target-modal')
      };
    })()`);

    assert.equal(singleCandidateResult.success, true, `Single candidate prompt error: ${singleCandidateResult.error}`);
    assert.equal(singleCandidateResult.autoSelectedBeforeClick, false, 'Engine must NOT auto-select single candidate');
    assert.equal(singleCandidateResult.resolved, true, 'Promise must resolve after user confirms');
    assert.equal(singleCandidateResult.resultVal?.accepted, true, 'Result must be accepted');
    assert.deepEqual(singleCandidateResult.resultVal?.selected, ['opp_spirit_99'], 'Selected candidate must match clicked row');
    assert.equal(singleCandidateResult.modalClosed, true, 'Modal must close after confirmation');

    // -------------------------------------------------------------
    // Test Case 2: Optional Effect Prompt (Decline via DOM Button)
    // -------------------------------------------------------------
    const optionalDeclineResult = await harness.evaluate(`(async function() {
      const card = { id: 'BS01-094', name: 'Core Theft' };
      const optPrompt = {
        interactionId: 'irq-e2e-opt-02',
        requestType: 'SELECT_OPTIONAL_ACTION',
        type: 'SELECT_OPTIONAL_ACTION',
        title: 'Activate Optional Effect',
        description: 'Do you want to discard 1 card to draw 2 cards?',
        player: 'player',
        optional: true
      };

      let resolved = false;
      let resultVal = null;
      const decisionPromise = window.BattleArena.promptStructuredDecision(optPrompt, card, 'player')
        .then(res => {
          resolved = true;
          resultVal = res;
        });

      await new Promise(r => setTimeout(r, 200));

      const popup = document.querySelector('.optional-effect-popup');
      if (!popup) return { success: false, error: 'Optional effect popup not rendered in DOM' };

      const noBtn = popup.querySelector('button[data-opt="no"]');
      if (!noBtn) return { success: false, error: 'No button not found' };
      noBtn.click();

      await decisionPromise;

      return {
        success: true,
        resolved,
        resultVal,
        popupClosed: !document.querySelector('.optional-effect-popup')
      };
    })()`);

    assert.equal(optionalDeclineResult.success, true, `Optional decline error: ${optionalDeclineResult.error}`);
    assert.equal(optionalDeclineResult.resolved, true, 'Optional decision promise must resolve on click');
    assert.equal(optionalDeclineResult.resultVal?.declined, true, 'Result must be declined');
    assert.equal(optionalDeclineResult.resultVal?.accepted, false, 'Result must not be accepted');
    assert.equal(optionalDeclineResult.popupClosed, true, 'Optional popup must close after clicking No');

    // -------------------------------------------------------------
    // Test Case 3: Multiple Candidates Target Selection
    // -------------------------------------------------------------
    const multiCandidatesResult = await harness.evaluate(`(async function() {
      const card = { id: 'BS02-019', name: 'Twin Horned Dragon' };
      const multiTargetPrompt = {
        interactionId: 'irq-e2e-multi-03',
        requestType: 'SELECT_TARGET',
        type: 'SELECT_TARGET',
        title: 'Select Target Spirit',
        description: 'Select 1 spirit with 3000 or less BP',
        player: 'player',
        candidates: [
          { uid: 'opp_spirit_a', name: 'Goblin Scout', currentBp: 2000, currentCores: 1 },
          { uid: 'opp_spirit_b', name: 'Lizard Man', currentBp: 3000, currentCores: 2 },
          { uid: 'opp_spirit_c', name: 'Dragonling', currentBp: 1000, currentCores: 1 }
        ],
        minSelections: 1,
        maxSelections: 1,
        optional: false
      };

      let resolved = false;
      let resultVal = null;
      const decisionPromise = window.BattleArena.promptStructuredDecision(multiTargetPrompt, card, 'player')
        .then(res => {
          resolved = true;
          resultVal = res;
        });

      await new Promise(r => setTimeout(r, 200));

      const modal = document.querySelector('.universal-target-modal');
      if (!modal) return { success: false, error: 'Modal not rendered in DOM' };

      const candidateRows = modal.querySelectorAll('[data-uid]');
      if (candidateRows.length !== 3) {
        return { success: false, error: 'Expected 3 candidate rows, got ' + candidateRows.length };
      }

      // Explicitly pick the second candidate: opp_spirit_b
      const chosenRow = modal.querySelector('[data-uid="opp_spirit_b"]');
      if (!chosenRow) return { success: false, error: 'Candidate opp_spirit_b not found' };
      chosenRow.click();

      // Click confirm
      const confirmBtn = modal.querySelector('button[data-act="confirm"]');
      if (!confirmBtn) return { success: false, error: 'Confirm button not found' };
      confirmBtn.click();

      await decisionPromise;

      return {
        success: true,
        resolved,
        resultVal,
        modalClosed: !document.querySelector('.universal-target-modal')
      };
    })()`);

    assert.equal(multiCandidatesResult.success, true, `Multi candidate error: ${multiCandidatesResult.error}`);
    assert.equal(multiCandidatesResult.resolved, true, 'Promise must resolve');
    assert.equal(multiCandidatesResult.resultVal?.accepted, true, 'Result must be accepted');
    assert.deepEqual(multiCandidatesResult.resultVal?.selected, ['opp_spirit_b'], 'Selected candidate must be opp_spirit_b');
    assert.equal(multiCandidatesResult.modalClosed, true, 'Modal must close after confirmation');

  } finally {
    if (harness) await harness.close();
  }
});
