/**
 * BATTLE SPIRITS ETERNAL - ARENA V2 CONTROLLER
 * 
 * Provides modern battle table rendering, circular moving phase tracking,
 * cyan diamond gemstones, and interactive priority passing.
 */

(function() {
  'use strict';

  // SVG Helper for Brilliant Cut Cyan Diamond Gem
  function getDiamondGemSvg(isActive = true, size = 16) {
    if (!isActive) {
      return `<svg class="v2-gem-diamond empty" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Shattered Core">
        <polygon points="6,4 18,4 23,10 12,22 1,10" fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="2,2"/>
      </svg>`;
    }
    return `<svg class="v2-gem-diamond" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Cyan Core Gem">
      <defs>
        <linearGradient id="v2CyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="35%" stop-color="#38bdf8"/>
          <stop offset="75%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
      </defs>
      <polygon points="6,4 18,4 23,10 12,22 1,10" fill="url(#v2CyanGrad)" stroke="#7dd3fc" stroke-width="1"/>
      <polygon points="6,4 18,4 15,10 9,10" fill="#bae6fd" fill-opacity="0.85"/>
      <polygon points="1,10 9,10 12,22" fill="#0284c7" fill-opacity="0.6"/>
      <polygon points="9,10 15,10 12,22" fill="#38bdf8" fill-opacity="0.95"/>
      <polygon points="15,10 23,10 12,22" fill="#0369a1" fill-opacity="0.75"/>
    </svg>`;
  }

  function getSoulCoreGemSvg(size = 18) {
    return `<svg class="v2-soul-core-badge-mini" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Soul Core">
      <polygon points="6,4 18,4 23,10 12,22 1,10" fill="#dc2626" stroke="#fbbf24" stroke-width="1.2"/>
      <polygon points="6,4 18,4 15,10 9,10" fill="#fef08a" fill-opacity="0.9"/>
      <circle cx="12" cy="14" r="2.2" fill="#ffffff"/>
    </svg>`;
  }

  const BattleArenaV2 = {
    priority: 'player', // 'player' | 'opponent'
    manualOpponentPass: false,
    priorityCallback: null,
    priorityMessage: '',
    currentPhaseIndex: 4, // default MAIN
    phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'FLASH', 'END'],

    init() {
      // Listen to BattleArena events if available
      this.bindUiEvents();
      this.updateLobbySelectors();

      // Hook into existing BattleArena render loop if active
      if (typeof BattleArena !== 'undefined') {
        const origRender = BattleArena.renderDuelTable;
        BattleArena.renderDuelTable = () => {
          if (typeof origRender === 'function') origRender();
          this.render();
        };

        const origLog = BattleArena.addLog;
        if (typeof origLog === 'function') {
          BattleArena.addLog = (msg, type) => {
            origLog(msg, type);
            this.updateStatusFromLog(msg);
          };
        }
      }
    },

    bindUiEvents() {
      const btnPass = document.getElementById('v2BtnPassPriority');
      if (btnPass) {
        btnPass.addEventListener('click', () => this.handlePlayerPass());
      }
      const btnOppPass = document.getElementById('v2BtnOpponentPass');
      if (btnOppPass) {
        btnOppPass.addEventListener('click', () => this.handleOpponentPass());
      }
    },

    toggleManualPassMode() {
      this.manualOpponentPass = !this.manualOpponentPass;
      const btn = document.getElementById('v2BtnTogglePassMode');
      if (btn) {
        btn.textContent = `Priority Mode: ${this.manualOpponentPass ? 'Manual (Test)' : 'Auto AI'}`;
      }
      this.renderCenterConsole();
    },

    updateLobbySelectors() {
      const pSel = document.getElementById('v2PlayerDeckSelect');
      const oSel = document.getElementById('v2OpponentDeckSelect');
      if (!pSel || !oSel) return;

      const decks = (typeof BattleArena !== 'undefined' && BattleArena.standardDecks) 
        ? Object.entries(BattleArena.standardDecks)
        : [
            ['deck_std_red', { name: 'Standard Red (Siegfried)' }],
            ['deck_std_purple', { name: 'Standard Purple (Javad)' }],
            ['deck_std_green', { name: 'Standard Green (Kingtaurus)' }],
            ['deck_std_white', { name: 'Standard White (White Machine)' }],
            ['deck_std_yellow', { name: 'Standard Yellow (Lulu)' }],
            ['deck_std_blue', { name: 'Standard Blue (Alexander)' }]
          ];

      const html = decks.map(([k, d]) => `<option value="${k}">${d.name}</option>`).join('');
      pSel.innerHTML = html;
      oSel.innerHTML = html;
      if (oSel.children.length > 1) oSel.selectedIndex = 1;
    },

    startMatch(pDeckKey, oDeckKey) {
      const pKey = pDeckKey || document.getElementById('v2PlayerDeckSelect')?.value || 'deck_std_red';
      const oKey = oDeckKey || document.getElementById('v2OpponentDeckSelect')?.value || 'deck_std_purple';

      const lobby = document.getElementById('v2LobbyOverlay');
      if (lobby) lobby.style.display = 'none';

      if (typeof BattleArena !== 'undefined') {
        BattleArena.startDuel(pKey, oKey);
      }
      this.priority = 'player';
      this.priorityMessage = "Player's turn (Main Step)";
      this.render();
    },

    backToLobby() {
      const lobby = document.getElementById('v2LobbyOverlay');
      if (lobby) lobby.style.display = 'flex';
      if (typeof BattleArena !== 'undefined' && BattleArena.state) {
        BattleArena.state.inDuel = false;
      }
    },

    getDuelState() {
      if (typeof DuelState !== 'undefined') return DuelState;
      if (typeof BattleArena !== 'undefined' && BattleArena.state) return BattleArena.state;
      return null;
    },

    // ── INTERACTIVE PRIORITY PASSING ENGINE ──
    passPriorityToOpponent(actionDescription, onContinue) {
      this.priority = 'opponent';
      this.priorityCallback = onContinue;
      this.priorityMessage = `Opponent Priority: Responding to ${actionDescription}...`;
      this.renderCenterConsole();

      if (!this.manualOpponentPass) {
        // Realistic decision timing
        setTimeout(() => {
          if (this.priority === 'opponent') {
            this.handleOpponentPass();
          }
        }, 900);
      }
    },

    handleOpponentPass() {
      if (this.priority !== 'opponent') return;
      this.priority = 'player';
      this.priorityMessage = 'Opponent passed priority. Continuing...';
      this.renderCenterConsole();

      if (typeof this.priorityCallback === 'function') {
        const cb = this.priorityCallback;
        this.priorityCallback = null;
        cb();
      }
      this.render();
    },

    passPriorityToPlayer(actionDescription, onContinue) {
      this.priority = 'player';
      this.priorityCallback = onContinue;
      this.priorityMessage = `Flash Window: Opponent ${actionDescription}. Your Priority to respond!`;
      this.renderCenterConsole();
    },

    handlePlayerPass() {
      if (this.priority !== 'player') return;
      this.priority = 'opponent';
      this.priorityMessage = 'You passed priority.';
      this.renderCenterConsole();

      if (typeof this.priorityCallback === 'function') {
        const cb = this.priorityCallback;
        this.priorityCallback = null;
        cb();
      } else {
        // If no pending action, advance step or yield turn
        if (typeof BattleArena !== 'undefined') {
          const ds = this.getDuelState();
          if (ds && ds.activePlayer === 'player') {
            const phase = ds.phases[ds.phaseIndex];
            if (phase === 'MAIN') {
              BattleArena.nextPhase();
            } else if (phase === 'ATTACK') {
              BattleArena.nextPhase();
            }
          }
        }
      }
      this.render();
    },

    // ── MAIN RENDER CONTROLLER ──
    render() {
      const ds = this.getDuelState();
      if (!ds) return;

      this.renderPhaseTrack(ds);
      this.renderCenterConsole(ds);
      this.renderOpponentZone(ds);
      this.renderPlayerZone(ds);
    },

    renderPhaseTrack(ds) {
      const currentPhase = ds.phases ? ds.phases[ds.phaseIndex] : 'MAIN';
      const phaseIndex = this.phases.indexOf(currentPhase);
      const track = document.getElementById('v2PhaseTrack');
      if (!track) return;

      track.innerHTML = this.phases.map((p, idx) => {
        let cls = 'v2-phase-node';
        if (p === currentPhase) cls += ' active';
        else if (idx < phaseIndex) cls += ' passed';

        return `
          <div class="${cls}" onclick="BattleArenaV2.selectPhase('${p}')" title="${p} STEP">
            <div class="v2-phase-circle"></div>
            <span class="v2-phase-label">${p}</span>
          </div>
        `;
      }).join('');
    },

    selectPhase(phaseName) {
      const ds = this.getDuelState();
      if (!ds || ds.activePlayer !== 'player') return;
      if (typeof BattleArena !== 'undefined' && BattleArena.manualStep) {
        BattleArena.manualStep(phaseName);
        this.passPriorityToOpponent(`entering ${phaseName} Step`, () => {});
      }
    },

    renderCenterConsole(ds) {
      ds = ds || this.getDuelState();
      const currentPhase = ds ? (ds.phases ? ds.phases[ds.phaseIndex] : 'MAIN') : 'MAIN';
      const turn = ds ? (ds.turn || 1) : 1;
      const isPlayerTurn = ds ? (ds.activePlayer === 'player') : true;

      const phaseBadge = document.getElementById('v2CenterPhaseBadge');
      if (phaseBadge) {
        phaseBadge.innerHTML = `<span>${currentPhase}</span> <span class="v2-pill-turn-tag">turn ${turn}</span>`;
      }

      const statusEl = document.getElementById('v2CenterStatus');
      if (statusEl) {
        if (this.priority === 'opponent') {
          statusEl.innerHTML = `<span class="v2-priority-indicator v2-priority-opp">⏳ Opponent Priority</span> ${this.priorityMessage || 'Thinking...'}`;
        } else {
          statusEl.innerHTML = `<span class="v2-priority-indicator v2-priority-player">🟢 Player Priority</span> ${isPlayerTurn ? "Your Turn" : "Opponent's Turn"}`;
        }
      }

      const btnPass = document.getElementById('v2BtnPassPriority');
      if (btnPass) {
        btnPass.style.display = (this.priority === 'player') ? 'inline-block' : 'none';
      }

      const btnOppPass = document.getElementById('v2BtnOpponentPass');
      if (btnOppPass) {
        btnOppPass.style.display = (this.priority === 'opponent' && this.manualOpponentPass) ? 'inline-block' : 'none';
      }
    },

    renderOpponentZone(ds) {
      const opp = ds.opponent;
      if (!opp) return;

      // Opponent Life Cluster (4 in top row, 1 in bottom row)
      const lifeEl = document.getElementById('v2OppLifeCluster');
      if (lifeEl) {
        const life = opp.life || 0;
        const topGems = [0, 1, 2, 3].map(i => getDiamondGemSvg(i < life, 16)).join('');
        const btmGem = getDiamondGemSvg(4 < life, 16);
        lifeEl.innerHTML = `
          <div class="row-top">${topGems}</div>
          <div class="row-bottom">${btmGem}</div>
        `;
      }

      // Opponent Reserve Gems
      const resGemsEl = document.getElementById('v2OppReserveGems');
      if (resGemsEl) {
        const count = Math.min(opp.reserve || 0, 8);
        resGemsEl.innerHTML = Array.from({ length: count }).map(() => getDiamondGemSvg(true, 14)).join('');
      }
      const resValEl = document.getElementById('v2OppReserveVal');
      if (resValEl) resValEl.textContent = opp.reserve || 0;

      // Opponent Trash Count & Gems
      const trashCountEl = document.getElementById('v2OppTrashCount');
      if (trashCountEl) trashCountEl.textContent = (opp.trashCards || []).length;
      const trashGemsEl = document.getElementById('v2OppTrashGems');
      if (trashGemsEl) {
        const count = Math.min((opp.trashCards || []).length || 0, 5);
        trashGemsEl.innerHTML = Array.from({ length: count }).map(() => getDiamondGemSvg(true, 13)).join('');
      }

      // Opponent Hand Backs
      const handEl = document.getElementById('v2OppHandTrack');
      if (handEl) {
        handEl.innerHTML = (opp.hand || []).map(() => `<div class="v2-hand-card-opp" title="Opponent Card"></div>`).join('');
      }

      // Opponent Field Spirits
      const fieldEl = document.getElementById('v2OppFieldSpirits');
      if (fieldEl) {
        const spirits = (opp.field || []).filter(s => !s.isSoulState);
        fieldEl.innerHTML = spirits.map(s => this.renderFieldSpiritHtml(s, 'opponent')).join('');
      }
    },

    renderPlayerZone(ds) {
      const p = ds.player;
      if (!p) return;

      // Player Life Cluster (4 in top row, 1 in bottom row)
      const lifeEl = document.getElementById('v2PlayerLifeCluster');
      if (lifeEl) {
        const life = p.life || 0;
        const topGems = [0, 1, 2, 3].map(i => getDiamondGemSvg(i < life, 16)).join('');
        const btmGem = getDiamondGemSvg(4 < life, 16);
        lifeEl.innerHTML = `
          <div class="row-top">${topGems}</div>
          <div class="row-bottom">${btmGem}</div>
        `;
      }

      // Player Reserve Gems
      const resGemsEl = document.getElementById('v2PlayerReserveGems');
      if (resGemsEl) {
        const count = Math.min(p.reserve || 0, 8);
        resGemsEl.innerHTML = Array.from({ length: count }).map(() => getDiamondGemSvg(true, 14)).join('');
      }
      const resValEl = document.getElementById('v2PlayerReserveVal');
      if (resValEl) resValEl.textContent = p.reserve || 0;

      // Player Deck Count
      const deckCountEl = document.getElementById('v2PlayerDeckCount');
      if (deckCountEl) deckCountEl.textContent = (p.deck || []).length;

      // Player Trash Count & Gems
      const trashCountEl = document.getElementById('v2PlayerTrashCount');
      if (trashCountEl) trashCountEl.textContent = (p.trashCards || []).length;
      const trashGemsEl = document.getElementById('v2PlayerTrashGems');
      if (trashGemsEl) {
        const count = Math.min((p.trashCards || []).length || 0, 5);
        trashGemsEl.innerHTML = Array.from({ length: count }).map(() => getDiamondGemSvg(true, 13)).join('');
      }

      // Player Field Spirits
      const fieldEl = document.getElementById('v2PlayerFieldSpirits');
      if (fieldEl) {
        const spirits = (p.field || []).filter(s => !s.isSoulState);
        fieldEl.innerHTML = spirits.map(s => this.renderFieldSpiritHtml(s, 'player')).join('');
      }

      // Player Hand
      const handEl = document.getElementById('v2PlayerHandTrack');
      if (handEl) {
        const reserve = p.reserve || 0;
        handEl.innerHTML = (p.hand || []).map((card, idx) => {
          const cost = card.cost || 0;
          const isPlayable = (reserve >= cost);
          return `
            <div class="v2-hand-card-player ${isPlayable ? 'playable' : ''}" onclick="BattleArenaV2.playPlayerCard(${idx})" title="${card.name} (Cost: ${cost})">
              <span class="v2-hand-card-cost">${cost}</span>
              <img src="${card.image_url || '/assets/card_back.png'}" alt="${card.name}" onerror="this.src='/assets/card_back.png';">
            </div>
          `;
        }).join('');
      }
    },

    renderFieldSpiritHtml(spirit, side) {
      const isExhausted = Boolean(spirit.isExhausted);
      const level = spirit.currentLevel || 1;
      const bp = spirit.currentBp || (spirit.levels && spirit.levels[0] ? spirit.levels[0].bp : 2000);
      const cores = spirit.currentCores || 1;
      const hasSoulCore = Boolean(spirit.hasSoulCore);

      // Determine Aura styling
      let auraHtml = '';
      if (level >= 2 || bp >= 5000) {
        auraHtml = `<div class="v2-aura-water"></div>`;
      } else if (spirit.color === 'Purple' || (spirit.name && spirit.name.includes('Demon'))) {
        auraHtml = `<div class="v2-aura-purple"></div>`;
      } else if (hasSoulCore) {
        auraHtml = `<div class="v2-aura-gold"></div>`;
      }

      // Cores on Card
      const coresOnCardHtml = Array.from({ length: Math.min(cores, 5) })
        .map(() => getDiamondGemSvg(true, 13))
        .join('');

      return `
        <div class="v2-field-spirit-wrap ${isExhausted ? 'exhausted' : ''}" onclick="BattleArenaV2.handleSpiritClick('${spirit.uid}', '${side}')">
          <div class="v2-field-card">
            ${auraHtml}
            ${hasSoulCore ? getSoulCoreGemSvg(16) : ''}
            <div class="v2-card-cores-overlay">${coresOnCardHtml}</div>
            <img src="${spirit.image_url || '/assets/card_back.png'}" alt="${spirit.name}" onerror="this.src='/assets/card_back.png';">
          </div>
          <div class="v2-spirit-stats-label">
            <span>Lv${level}</span>
            <span class="v2-stats-bp">${bp} BP</span>
          </div>
        </div>
      `;
    },

    handleSpiritClick(uid, side) {
      const ds = this.getDuelState();
      if (!ds) return;

      if (side === 'player') {
        const spirit = (ds.player.field || []).find(s => s.uid === uid);
        if (!spirit) return;

        const currentPhase = ds.phases ? ds.phases[ds.phaseIndex] : 'MAIN';
        if (currentPhase === 'ATTACK' && !spirit.isExhausted) {
          // Declare attack
          if (typeof BattleArena !== 'undefined' && BattleArena.handleSpiritClick) {
            this.passPriorityToOpponent(`Attack Declaration with ${spirit.name}`, () => {
              BattleArena.handleSpiritClick(uid, side);
            });
          }
        } else {
          // Inspect details or add core
          if (typeof BattleArena !== 'undefined' && BattleArena.openCardDetailContext) {
            BattleArena.openCardDetailContext(spirit.name, 'field', spirit.uid);
          }
        }
      } else {
        // Opponent spirit inspection
        const spirit = (ds.opponent.field || []).find(s => s.uid === uid);
        if (spirit && typeof BattleArena !== 'undefined' && BattleArena.openCardDetailContext) {
          BattleArena.openCardDetailContext(spirit.name, 'opponent-field', spirit.uid);
        }
      }
    },

    playPlayerCard(handIndex) {
      const ds = this.getDuelState();
      if (!ds || ds.activePlayer !== 'player') return;

      const card = ds.player.hand[handIndex];
      if (!card) return;

      if (typeof BattleArena !== 'undefined' && BattleArena.playCardFromHand) {
        this.passPriorityToOpponent(`Summoning ${card.name}`, () => {
          BattleArena.playCardFromHand(handIndex);
        });
      }
    },

    updateStatusFromLog(msg) {
      if (!msg) return;
      const clean = msg.replace(/\*\*/g, '').replace(/<[^>]*>?/gm, '');
      this.priorityMessage = clean.slice(0, 70);
      this.renderCenterConsole();
    }
  };

  window.BattleArenaV2 = BattleArenaV2;

  // Auto initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    BattleArenaV2.init();
  });
})();
