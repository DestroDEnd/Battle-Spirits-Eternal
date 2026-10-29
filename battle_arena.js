/**
 * Battle Spirits Eternal - Battle Arena & Duel Simulator Engine
 * Implements official core-based mechanics:
 * 5 Life, Void -> Reserve Core Step, Draw Step, Refresh Step, Main Step (Summon / Move Cores),
 * Attack Step (Exhaust to attack, BP Clash, Block, Flash timing, Life damage), and End Step.
 */

(function () {
  'use strict';

  // ── SOUND FX SYNTHESIS (Zero External Audio Files) ──
  const _RawAudioFX = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
      }
    },
    playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
      if (!this.ctx) return;
      try {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch(e){}
    },
    buttonTick() {
      this.init();
      this.playTone(480, 'triangle', 0.08, 0.06);
    },
    coreChime() {
      this.init();
      this.playTone(587.33, 'triangle', 0.12, 0.08); // D5
      setTimeout(() => this.playTone(880, 'triangle', 0.2, 0.09), 80); // A5
    },
    summon() {
      this.init();
      this.playTone(329.63, 'sine', 0.2, 0.1); // E4
      setTimeout(() => this.playTone(493.88, 'sine', 0.2, 0.12), 90); // B4
      setTimeout(() => this.playTone(659.25, 'sine', 0.35, 0.14), 180); // E5
    },
    slash() {
      this.init();
      this.playTone(220, 'sawtooth', 0.12, 0.12);
      this.playTone(150, 'sawtooth', 0.18, 0.14);
    },
    shield() {
      this.init();
      this.playTone(180, 'square', 0.25, 0.08);
      setTimeout(() => this.playTone(260, 'triangle', 0.2, 0.08), 80);
    },
    coinFlip() {
      this.init();
      if (!this.ctx) return;
      for (let i = 0; i < 9; i++) {
        setTimeout(() => {
          this.playTone(550 + (i * 70), 'triangle', 0.04, 0.05);
        }, i * 90);
      }
      setTimeout(() => {
        this.playTone(1046.5, 'sine', 0.4, 0.12);
        this.playTone(1318.5, 'triangle', 0.35, 0.08);
      }, 950);
    },
    lifeDamage() {
      this.init();
      this.playTone(120, 'sawtooth', 0.3, 0.18);
      setTimeout(() => this.playTone(90, 'sawtooth', 0.4, 0.15), 100);
    },
    burstIgnite() {
      this.init();
      this.playTone(280, 'sawtooth', 0.25, 0.15);
      setTimeout(() => this.playTone(420, 'square', 0.2, 0.12), 70);
      setTimeout(() => this.playTone(560, 'sawtooth', 0.35, 0.16), 140);
    },
    exhaust() {
      this.init();
      this.playTone(196, 'triangle', 0.18, 0.08);
      setTimeout(() => this.playTone(146.83, 'sine', 0.22, 0.08), 60);
    },
    soulCoreIgnite() {
      this.init();
      this.playTone(220, 'sawtooth', 0.25, 0.15);
      setTimeout(() => this.playTone(440, 'triangle', 0.25, 0.15), 60);
      setTimeout(() => this.playTone(660, 'sawtooth', 0.3, 0.18), 120);
    },
    victory() {
      this.init();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.4, 0.12), i * 140);
      });
    }
  };

  // Safe AudioFX proxy so unhandled audio effect names never throw exceptions
  const AudioFX = (typeof Proxy !== 'undefined') ? new Proxy(_RawAudioFX, {
    get(target, prop) {
      if (prop in target) {
        return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
      }
      return () => {}; // Safe no-op fallback
    }
  }) : _RawAudioFX;

  // ── TRAINED ARCHETYPE HEURISTICS (PARADOXES ENGINE / GADT MULTI-STEP LOOKAHEAD) ──
  const DEFAULT_AI_WEIGHTS = {
    red: {
      name: "Hero Dragon Aggro (Red)",
      w_life: 2.8,
      w_field_bp: 1.4,
      w_core_advantage: 0.8,
      w_hand_advantage: 1.0,
      w_burst_value: 1.5,
      w_soul_core: 1.2,
      flash_reserve_buffer: 1,
      aggro_threshold: 0.35
    },
    green: {
      name: "Emerald Ramp (Green - Kingtaurus)",
      w_life: 2.47,
      w_field_bp: 1.75,
      w_core_advantage: 2.64,
      w_hand_advantage: 1.2,
      w_burst_value: 1.2,
      w_soul_core: 1.5,
      flash_reserve_buffer: 2,
      aggro_threshold: 0.47
    },
    purple: {
      name: "Netherworld Control (Purple)",
      w_life: 2.88,
      w_field_bp: 1.22,
      w_core_advantage: 1.63,
      w_hand_advantage: 1.8,
      w_burst_value: 2.0,
      w_soul_core: 1.3,
      flash_reserve_buffer: 2,
      aggro_threshold: 0.50
    },
    white: {
      name: "Armed Fortress (White)",
      w_life: 3.3,
      w_field_bp: 1.35,
      w_core_advantage: 1.13,
      w_hand_advantage: 1.1,
      w_burst_value: 1.8,
      w_soul_core: 1.4,
      flash_reserve_buffer: 2,
      aggro_threshold: 0.58
    },
    yellow: {
      name: "Celestial Symphony (Yellow)",
      w_life: 3.11,
      w_field_bp: 1.5,
      w_core_advantage: 1.51,
      w_hand_advantage: 1.6,
      w_burst_value: 1.7,
      w_soul_core: 1.2,
      flash_reserve_buffer: 1,
      aggro_threshold: 0.47
    },
    blue: {
      name: "Colosseum Titans (Blue)",
      w_life: 3.29,
      w_field_bp: 2.07,
      w_core_advantage: 1.51,
      w_hand_advantage: 1.0,
      w_burst_value: 1.3,
      w_soul_core: 1.3,
      flash_reserve_buffer: 1,
      aggro_threshold: 0.38
    }
  };

  // ── DUEL STATE ──
  const DuelState = {
    standardDecks: {},
    aiWeights: { ...DEFAULT_AI_WEIGHTS },
    playerDeckData: null,
    opponentDeckData: null,
    
    // In-match runtime state
    inDuel: false,
    autoPlay: false,
    autoPlayTimer: null,
    turn: 1,
    activePlayer: 'player', // 'player' | 'opponent'
    phaseIndex: 0, // 0: Start, 1: Core, 2: Draw, 3: Refresh, 4: Main, 5: Attack, 6: End
    phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
    
    player: {
      name: 'Player',
      color: 'Red',
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve', // 'reserve' | 'field' | 'trash' | 'void'
      soulCoreSpiritUid: null,
      burst: null,
      deck: [],
      hand: [],
      field: [] // { uid, name, cost, type, color, image_url, levels, currentCores, currentLevel, currentBp, hasSoulCore, isExhausted, hasAttacked }
    },
    
    opponent: {
      name: 'AI Champion',
      color: 'Purple',
      life: 5,
      reserve: 5,
      trash: 0,
      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: [],
      hand: [],
      field: []
    },
    currentZoneTab: 'player-trash',

    selectedPlayerCard: null,
    selectedAttacker: null,
    combatEvent: null, // Active clash info
    activeBurstTrigger: null, // Active trigger window when Burst condition is satisfied
    pendingTimers: [],
    logs: []
  };
  window.DuelState = DuelState;

  // Helper to parse levels
  function parseLevels(levelsStr) {
    if (!levelsStr || typeof levelsStr !== 'string') {
      return [{ level: 1, cores: 1, bp: 2000 }];
    }
    const results = [];
    const re = /Level\s*(\d+)[:\s]+(\d+)\s*cores?,\s*(\d+)\s*BP/gi;
    let m;
    while ((m = re.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: parseInt(m[3], 10)
      });
    }
    if (results.length) return results;

    const reNoBp = /Level\s*(\d+)[:\s]+(\d+)\s*cores?/gi;
    while ((m = reNoBp.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: 0
      });
    }
    return results.length ? results : [{ level: 1, cores: 0, bp: 0 }];
  }

  // ── HEXAGONAL CORE RENDERING ENGINE (ANIME & GAME ACCURATE) ──
  function getHexCoreSvg(type = 'blue', size = 18) {
    const height = Math.round(size * 1.16);
    if (type === 'life-active') {
      return `<svg class="hex-core-svg hex-life-active" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Life Core">
        <defs>
          <linearGradient id="hexLifeGrad_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="30%" stop-color="#fbbf24" />
            <stop offset="70%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
          <linearGradient id="hexLifeSheen_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#fef08a" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexLifeGrad_${size})" stroke="#fef08a" stroke-width="1.2" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#b45309" fill-opacity="0.5" stroke="#fef08a" stroke-width="0.8" />
        <line x1="12" y1="1" x2="12" y2="6.8" stroke="#fef08a" stroke-width="0.8" />
        <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#fef08a" stroke-width="0.8" />
        <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#92400e" stroke-width="0.8" />
        <line x1="12" y1="27" x2="12" y2="21.2" stroke="#92400e" stroke-width="0.8" />
        <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#92400e" stroke-width="0.8" />
        <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#fef08a" stroke-width="0.8" />
        <polygon points="12,2 22,8 17.5,10.4 12,7.5 6.5,10.4 2,8" fill="url(#hexLifeSheen_${size})" />
        <circle cx="12" cy="14" r="2.2" fill="#ffffff" />
      </svg>`;
    } else if (type === 'life-empty') {
      return `<svg class="hex-core-svg hex-life-empty" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Shattered Core">
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="rgba(30,41,59,0.35)" stroke="#475569" stroke-width="1.2" stroke-dasharray="2,2" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="transparent" stroke="#334155" stroke-width="0.6" />
      </svg>`;
    } else if (type === 'soul') {
      return `<svg class="hex-core-svg hex-soul-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Soul Core">
        <defs>
          <linearGradient id="hexSoulGrad_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fca5a5" />
            <stop offset="25%" stop-color="#ef4444" />
            <stop offset="60%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#881337" />
          </linearGradient>
          <radialGradient id="hexSoulCenter_${size}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="35%" stop-color="#fef08a" />
            <stop offset="70%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#ef4444" />
          </radialGradient>
        </defs>
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexSoulGrad_${size})" stroke="#f59e0b" stroke-width="1.3" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#881337" fill-opacity="0.6" stroke="#fbbf24" stroke-width="0.9" />
        <line x1="12" y1="1" x2="12" y2="6.8" stroke="#fbbf24" stroke-width="0.8" />
        <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
        <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#4c0519" stroke-width="0.8" />
        <line x1="12" y1="27" x2="12" y2="21.2" stroke="#4c0519" stroke-width="0.8" />
        <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#4c0519" stroke-width="0.8" />
        <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
        <polygon points="12,8.5 16,14 12,19.5 8,14" fill="url(#hexSoulCenter_${size})" stroke="#ffffff" stroke-width="0.6" />
        <circle cx="12" cy="14" r="1.8" fill="#ffffff" />
      </svg>`;
    } else {
      // Default: Blue Hexagonal Crystal Core
      return `<svg class="hex-core-svg hex-blue-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Core">
        <defs>
          <linearGradient id="hexBlueGrad_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#bae6fd" />
            <stop offset="25%" stop-color="#38bdf8" />
            <stop offset="65%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#0369a1" />
          </linearGradient>
          <linearGradient id="hexBlueSheen_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexBlueGrad_${size})" stroke="#7dd3fc" stroke-width="1.2" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#0369a1" fill-opacity="0.55" stroke="#bae6fd" stroke-width="0.8" />
        <line x1="12" y1="1" x2="12" y2="6.8" stroke="#bae6fd" stroke-width="0.8" />
        <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
        <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#075985" stroke-width="0.8" />
        <line x1="12" y1="27" x2="12" y2="21.2" stroke="#075985" stroke-width="0.8" />
        <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#075985" stroke-width="0.8" />
        <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
        <polygon points="12,2 22,8 17.5,10.4 12,7.5 6.5,10.4 2,8" fill="url(#hexBlueSheen_${size})" />
        <circle cx="12" cy="14" r="2" fill="#ffffff" />
      </svg>`;
    }
  }

  // Calculate BP given allocated cores and Soul Core empowerment

  // ── SPIRIT BP LIFECYCLE MANAGEMENT ──
  function recalculateSpiritBp(spirit) {
    if (!spirit) return 0;
    let lvls = spirit.parsed_levels;
    if (!lvls && Array.isArray(spirit.levels)) lvls = spirit.levels;
    if (!lvls && typeof spirit.levels === 'string') lvls = parseLevels(spirit.levels);

    if (spirit.currentCores !== undefined && !isNaN(spirit.currentCores)) {
      const { level, bp: baseBp } = calculateBpAndLevel(lvls, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
      spirit.currentLevel = level;
      spirit.baseBp = baseBp;
    } else {
      if (spirit.currentLevel && lvls && lvls.length) {
        const matchingLvl = lvls.find(l => l.level === spirit.currentLevel);
        if (matchingLvl && matchingLvl.bp) {
          spirit.baseBp = matchingLvl.bp;
        }
      }
      if (spirit.baseBp === undefined) {
        spirit.baseBp = spirit.currentBp || 2000;
      }
      if (!spirit.currentLevel) {
        spirit.currentLevel = 1;
      }
    }

    spirit.currentBp = (spirit.baseBp || 0) + (spirit.turnBpBoost || 0);
    if (spirit.battleBpBoost) {
      spirit.battleBp = spirit.currentBp + spirit.battleBpBoost;
    } else {
      delete spirit.battleBp;
    }
    return spirit.currentBp;
  }

  function getWhenBlocksBpBoost(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*(?:\(When Blocks\)|『このスピリットのブロック時』)?[^\.]*?(?:gains|gets|\+)\s*(\d+)[\s]*BP/i);
    if (m && m[2]) {
      const levelTag = m[1] || '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {
        return parseInt(m[2], 10);
      }
    }
    return 0;
  }

  function endOfBattleBpReset(spirit) {
    if (!spirit) return;
    spirit.battleBpBoost = 0;
    delete spirit.battleBp;
    recalculateSpiritBp(spirit);
  }

  function calculateBpAndLevel(parsedLevels, cores, hasSoulCore = false, cardEffect = '') {
    if (typeof parsedLevels === 'string') {
      parsedLevels = parseLevels(parsedLevels);
    }
    if (!parsedLevels || !Array.isArray(parsedLevels) || !parsedLevels.length) {
      let bp = 2000;
      if (hasSoulCore) bp += 1000;
      return { level: 1, bp };
    }
    const sorted = [...parsedLevels].sort((a, b) => a.cores - b.cores);
    let best = sorted[0];
    const coreCount = (cores !== undefined && !isNaN(cores)) ? cores : (best ? best.cores : 1);
    for (const lvl of sorted) {
      if (coreCount >= lvl.cores) {
        best = lvl;
      }
    }
    let bp = (best && best.bp !== undefined) ? best.bp : 2000;
    if (hasSoulCore) {
      let bonus = 1000;
      const eff = (cardEffect || '').toLowerCase();
      if (eff.includes('soul core') && (eff.includes('+5000 bp') || eff.includes('+5000bp'))) bonus = 5000;
      else if (eff.includes('soul core') && (eff.includes('+4000 bp') || eff.includes('+4000bp'))) bonus = 4000;
      else if (eff.includes('soul core') && (eff.includes('+3000 bp') || eff.includes('+3000bp'))) bonus = 3000;
      else if (eff.includes('soul core') && (eff.includes('+2000 bp') || eff.includes('+2000bp'))) bonus = 2000;
      bp += bonus;
    }
    return { level: (best && best.level) ? best.level : 1, bp };
  }

  // Fisher-Yates Shuffle
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  
  // ── TIMER SAFETY HELPERS (Prevents Runaway Background Timers) ──
  function safeTimeout(fn, delay) {
    const id = setTimeout(() => {
      DuelState.pendingTimers = DuelState.pendingTimers.filter(t => t !== id);
      fn();
    }, delay);
    DuelState.pendingTimers.push(id);
    return id;
  }

  function clearAllTimers() {
    if (DuelState.pendingTimers && DuelState.pendingTimers.length) {
      DuelState.pendingTimers.forEach(id => clearTimeout(id));
      DuelState.pendingTimers = [];
    }
    if (DuelState.autoPlayTimer) {
      clearTimeout(DuelState.autoPlayTimer);
      DuelState.autoPlayTimer = null;
    }
    if (aiWatchdogTimer) {
      clearTimeout(aiWatchdogTimer);
      aiWatchdogTimer = null;
    }
  }

  // ── SAFE END OPPONENT TURN HELPER (Guarantees turn is NEVER ended on player's behalf) ──
  function safeEndOpponentTurn(delay = 800) {
    safeTimeout(() => {
      if (DuelState.activePlayer === 'opponent') {
        endTurn();
      }
    }, delay);
  }

  // ── AI TURN WATCHDOG (Prevents Opponent Hangs/Freezes without interrupting player) ──
  let aiWatchdogTimer = null;
  function resetAiWatchdog() {
    if (aiWatchdogTimer) {
      clearTimeout(aiWatchdogTimer);
      aiWatchdogTimer = null;
    }
    if (DuelState.activePlayer === 'opponent') {
      const stepAtCheck = DuelState.phaseIndex;
      const turnAtCheck = DuelState.turn;
      aiWatchdogTimer = setTimeout(() => {
        if (DuelState.activePlayer === 'opponent' && DuelState.turn === turnAtCheck && DuelState.phaseIndex === stepAtCheck) {
          const hasModal = typeof document !== 'undefined' && document.querySelector && 
            (document.querySelector('.battle-modal-overlay.active, .battle-modal-overlay[style*="display: flex"]') ||
             document.getElementById('battleBlockModal')?.classList.contains('active') ||
             document.getElementById('battleBurstPromptModal')?.classList.contains('active'));
          if (hasModal || DuelState.combatEvent || DuelState.activeBurstTrigger) {
            resetAiWatchdog();
            return;
          }
          console.warn(`[AI Watchdog] Opponent AI delayed at phase ${DuelState.phases[stepAtCheck]} (Turn ${turnAtCheck}). Resuming flow...`);
          if (stepAtCheck >= 5) {
            safeEndOpponentTurn(200);
          } else {
            DuelState.phaseIndex = Math.min(6, stepAtCheck + 1);
            renderDuelTable();
            safeTimeout(advanceOpponentStep, 400);
          }
        }
      }, 12000);
    }
  }

  // ── STORAGE & PERSISTENCE HELPERS ──
  function safeGetStorage(key, def = null) {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        return val !== null ? val : def;
      }
    } catch (e) {}
    return def;
  }

  function safeSetStorage(key, val) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, String(val));
      }
    } catch (e) {}
  }

  // ── TRAINED AI PROFILE LOADING & RETRIEVAL ──
  async function loadTrainedAiWeights() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        const res = await fetch('/api/ai-weights');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            DuelState.aiWeights = data;
          }
        }
      }
    } catch (e) {
      // Graceful fallback to embedded DEFAULT_AI_WEIGHTS
    }
  }

  function getActiveAiProfile(playerSide = 'opponent') {
    const color = (DuelState[playerSide]?.color || 'red').toLowerCase();
    const weights = DuelState.aiWeights || DEFAULT_AI_WEIGHTS;
    return weights[color] || weights['red'] || DEFAULT_AI_WEIGHTS.red;
  }

// ── INITIALIZATION & DECK LOADING ──

  // ── UNIVERSAL NLP CARD EFFECT EXECUTION ENGINE (14,529 CARDS DATABASE) ──
  let CardEffectsDB = {};
  async function loadCardEffectsDB() {
    if (typeof fetch === 'function' && typeof window !== 'undefined' && window.location && window.location.origin) {
      try {
        const res = await fetch(window.location.origin + '/api/card-effects-db');
        if (res.ok) {
          CardEffectsDB = await res.json();
          if (typeof window !== 'undefined' && window.BattleArena) window.BattleArena.CardEffectsDB = CardEffectsDB;
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);
        }
      } catch (e) {
        console.warn('[NLP Effects Engine] Failed to fetch /api/card-effects-db:', e);
      }
    } else if (typeof require === 'function') {
      try {
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.resolve(__dirname, 'card_effects_db.json');
        if (fs.existsSync(dbPath)) {
          CardEffectsDB = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        }
      } catch (e) {}
    }
  }

  function executeUniversalCardEffect(card, side, trigger, context = {}) {
    if (!card) return;
    const cardData = CardEffectsDB[card.name];
    if (!cardData || !cardData.triggers) return;

    const actions = cardData.triggers[trigger];
    if (!actions || !Array.isArray(actions) || !actions.length) return;

    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = side === 'player' ? DuelState.opponent : DuelState.player;
    const curLevel = card.currentLevel || 1;

    for (const act of actions) {
      if (act.min_level && curLevel < act.min_level) continue;

      const actType = act.type;
      if (actType === 'DRAW_CARDS') {
        const count = act.count || 1;
        for (let i = 0; i < count; i++) {
          const drawn = friendlyState.deck.shift();
          if (drawn) {
            friendlyState.hand.push(drawn);
            if (side === 'player') {
              AudioFX.playTone(390, 'sine', 0.15, 0.08);
              addLog(`🎴 **[${card.name}]**: Channeled ability! Drew "${drawn.name}" into your hand.`, 'magic');
            }
          }
        }
      } else if (actType === 'CORE_BOOST') {
        const count = act.count || 1;
        const src = act.source || 'void';
        const dst = act.destination || 'reserve';
        if (dst === 'life') {
          if (friendlyState.life < 5) {
            friendlyState.life = Math.min(5, friendlyState.life + count);
            AudioFX.coreChime();
            addLog(`✨ **[${card.name}]**: Restored +${count} Life Core from the Void!`, 'magic');
          }
        } else if (dst === 'spirit' && card.uid) {
          card.currentCores = (card.currentCores || 1) + count;
          recalculateSpiritBp(card);
          AudioFX.coreChime();
          addLog(`🔮 **[${card.name}]**: Placed +${count} Core onto this Spirit (Total: ${card.currentCores}).`, 'step');
        } else {
          friendlyState.reserve += count;
          AudioFX.coreChime();
          addLog(`🔮 **[${card.name}]**: Added +${count} Core from ${src} to Reserve (Reserve: ${friendlyState.reserve}).`, 'step');
        }
      } else if (actType === 'CORE_DRAIN') {
        const count = act.count || 1;
        const dest = act.destination || 'reserve';
        const targetKind = act.target || 'spirit';
        if (targetKind === 'nexus' && enemyState.nexus && enemyState.nexus.length > 0) {
          const targetNex = enemyState.nexus.find(n => (n.currentCores || 0) >= 1) || enemyState.nexus[0];
          if (targetNex && targetNex.currentCores > 0) {
            const num = Math.min(count, targetNex.currentCores);
            targetNex.currentCores -= num;
            if (dest === 'reserve') enemyState.reserve += num;
            else if (dest === 'trash') enemyState.trash += num;
            addLog(`🔮 **[${card.name}]**: Sent ${num} Core from opposing Nexus "${targetNex.name}" to ${dest}!`, 'magic');
          }
        } else if (enemyState.field && enemyState.field.length > 0) {
          const targetSp = enemyState.field.find(s => (s.currentCores || 0) >= 1) || enemyState.field[0];
          if (targetSp && targetSp.currentCores > 0) {
            const num = Math.min(count, targetSp.currentCores);
            targetSp.currentCores -= num;
            if (dest === 'reserve') enemyState.reserve += num;
            else if (dest === 'trash') enemyState.trash += num;
            recalculateSpiritBp(targetSp);
            addLog(`🔮 **[${card.name}]**: Drained ${num} Core from opposing "${targetSp.name}" to ${dest}!`, 'magic');
            if (targetSp.currentCores <= 0) {
              const spIdx = enemyState.field.findIndex(s => s.uid === targetSp.uid);
              if (spIdx !== -1) {
                const depleted = enemyState.field.splice(spIdx, 1)[0];
                sendToTrash(depleted, enemySide, `Depleted by ${card.name}`);
                addLog(`💀 **DEPLETED**: Opposing "${depleted.name}" depleted of cores and sent to Trash!`, 'damage');
              }
            }
          }
        }
      } else if (actType === 'BP_BUFF') {
        const boost = act.amount || 1000;
        if (act.target === 'all') {
          for (const s of friendlyState.field || []) {
            s.battleBpBoost = (s.battleBpBoost || 0) + boost;
            s.battleBp = (s.baseBp || s.currentBp) + s.battleBpBoost;
            s.currentBp = s.battleBp;
          }
          addLog(`⚡ **[${card.name}]**: Granted +${boost} BP to all friendly Spirits!`, 'magic');
        } else {
          card.battleBpBoost = (card.battleBpBoost || 0) + boost;
          card.battleBp = (card.baseBp || card.currentBp) + card.battleBpBoost;
          card.currentBp = card.battleBp;
          addLog(`⚡ **[${card.name}]**: Powered up with +${boost} BP! (Current BP: ${card.currentBp})`, 'magic');
        }
      } else if (actType === 'DESTROY_SPIRIT_BP') {
        const maxBp = act.max_bp || 5000;
        const count = act.count || 1;
        let destroyed = 0;
        const victims = (enemyState.field || []).filter(s => (s.battleBp || s.currentBp || 0) <= maxBp);
        for (const vic of victims) {
          if (destroyed >= count) break;
          const vIdx = enemyState.field.findIndex(s => s.uid === vic.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name} (${maxBp} BP or less)`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Obliterated opposing "${popped.name}" (${popped.currentBp} BP <= ${maxBp} BP limit)!`, 'damage');
            destroyed++;
          }
        }
      } else if (actType === 'DESTROY_SPIRIT_DIRECT') {
        const count = act.count || 1;
        const requireExhausted = act.require_exhausted || false;
        let destroyed = 0;
        const candidates = (enemyState.field || []).filter(s => !requireExhausted || s.isExhausted);
        for (const vic of candidates) {
          if (destroyed >= count) break;
          const vIdx = enemyState.field.findIndex(s => s.uid === vic.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name}`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Destroyed opposing "${popped.name}"!`, 'damage');
            destroyed++;
          }
        }
      } else if (actType === 'DESTROY_NEXUS') {
        if (enemyState.nexus && enemyState.nexus.length > 0) {
          const popped = enemyState.nexus.shift();
          sendToTrash(popped, enemySide, `Nexus destroyed by ${card.name}`);
          AudioFX.destroy();
          addLog(`💥 **[${card.name}]**: Smashed opposing Nexus "${popped.name}"!`, 'damage');
        }
      } else if (actType === 'RETURN_TO_HAND') {
        const count = act.count || 1;
        for (let i = 0; i < count; i++) {
          if (!enemyState.field || !enemyState.field.length) break;
          const popped = enemyState.field.shift();
          recycleSpiritCoresToReserve(popped, enemySide);
          enemyState.hand.push(popped);
          AudioFX.magic();
          addLog(`🍃 **[${card.name}]**: Bounced opposing "${popped.name}" back to opponent's Hand!`, 'magic');
        }
      } else if (actType === 'EXHAUST_ENEMY') {
        const count = act.count || 1;
        const readyEnemies = (enemyState.field || []).filter(s => !s.isExhausted);
        for (let i = 0; i < Math.min(count, readyEnemies.length); i++) {
          readyEnemies[i].isExhausted = true;
          AudioFX.slash();
          addLog(`💤 **[${card.name}]**: Forced opposing "${readyEnemies[i].name}" into Exhausted rest state!`, 'step');
        }
      } else if (actType === 'REFRESH_SELF') {
        card.isExhausted = false;
        AudioFX.shield();
        addLog(`🔄 **[${card.name}]**: Refreshed to Ready state!`, 'step');
      } else if (actType === 'REFRESH_ALLIES') {
        for (const s of friendlyState.field || []) {
          s.isExhausted = false;
        }
        AudioFX.shield();
        addLog(`🔄 **[${card.name}]**: Refreshed all friendly Spirits to Ready state!`, 'step');
      } else if (actType === 'LIFE_BURN') {
        if (enemyState.life > 0) {
          enemyState.life = Math.max(0, enemyState.life - 1);
          enemyState.reserve += 1;
          AudioFX.lifeDamage();
          addLog(`💥 **[${card.name}]**: Inflicted 1 direct Life Damage to opponent! (Opponent Life: ${enemyState.life})`, 'damage');
          checkGameOver();
        }
      } else if (actType === 'CANNOT_BE_BLOCKED') {
        card.cannotBeBlocked = true;
        addLog(`💨 **[${card.name}]**: Became Unblockable for this battle!`, 'step');
      } else if (actType === 'BP_DEBUFF') {
        const amount = act.amount || 3000;
        const targetSp = (enemyState.field || [])[0];
        if (targetSp) {
          targetSp.battleBpBoost = (targetSp.battleBpBoost || 0) - amount;
          targetSp.battleBp = Math.max(0, (targetSp.baseBp || targetSp.currentBp) + targetSp.battleBpBoost);
          targetSp.currentBp = targetSp.battleBp;
          AudioFX.magic();
          addLog(`🔻 **[${card.name}]**: Weakened opposing "${targetSp.name}" by -${amount} BP (Current: ${targetSp.currentBp} BP).`, 'damage');
          if (targetSp.currentBp <= 0) {
            const spIdx = enemyState.field.findIndex(s => s.uid === targetSp.uid);
            if (spIdx !== -1) {
              const popped = enemyState.field.splice(spIdx, 1)[0];
              recycleSpiritCoresToReserve(popped, enemySide);
              sendToTrash(popped, enemySide, `BP reduced to 0 by ${card.name}`);
              AudioFX.destroy();
              addLog(`💥 **0-BP DEPLETED**: Opposing "${popped.name}" had its BP reduced to 0 and was destroyed to Trash!`, 'damage');
            }
          }
        }
      } else if (actType === 'DESTROY_SPIRIT_COST') {
        const maxCost = act.max_cost || 4;
        const count = act.count || 1;
        let destroyed = 0;
        const victims = (enemyState.field || []).filter(s => (s.cost || 0) <= maxCost);
        for (const vic of victims) {
          if (destroyed >= count) break;
          const vIdx = enemyState.field.findIndex(s => s.uid === vic.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name} (Cost ${maxCost} or less)`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Smashed opposing "${popped.name}" (Cost ${popped.cost} <= ${maxCost} limit)!`, 'damage');
            destroyed++;
          }
        }
      } else if (actType === 'DESTROY_SPIRIT_EXTREME_BP') {
        if (enemyState.field && enemyState.field.length > 0) {
          let chosen = enemyState.field[0];
          for (const s of enemyState.field) {
            const bp = s.battleBp || s.currentBp || 0;
            const chosenBp = chosen.battleBp || chosen.currentBp || 0;
            if (act.mode === 'lowest' ? bp < chosenBp : bp > chosenBp) {
              chosen = s;
            }
          }
          const vIdx = enemyState.field.findIndex(s => s.uid === chosen.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name} (${act.mode || 'highest'} BP)`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Obliterated opposing "${popped.name}" with the ${act.mode || 'highest'} BP (${popped.currentBp} BP)!`, 'damage');
          }
        }
      } else if (actType === 'RETURN_TO_DECKBOTTOM') {
        const count = act.count || 1;
        for (let i = 0; i < count; i++) {
          if (!enemyState.field || !enemyState.field.length) break;
          const popped = enemyState.field.shift();
          recycleSpiritCoresToReserve(popped, enemySide);
          enemyState.deck.push(popped);
          AudioFX.magic();
          addLog(`🌀 **[${card.name}]**: Banished opposing "${popped.name}" to the bottom of opponent's Deck!`, 'magic');
        }
      } else if (actType === 'HOLY_LIFE_HEAL') {
        const heal = act.amount || 1;
        if (friendlyState.life < 5) {
          friendlyState.life = Math.min(5, friendlyState.life + heal);
          AudioFX.coreChime();
          addLog(`✨ **[${card.name}]**: Channeled Holy Light! Restored +${heal} Life core from the Void! (Current Life: ${friendlyState.life})`, 'magic');
        } else {
          addLog(`✨ **[${card.name}]**: Holy Light shone, but Life is already at maximum (5).`, 'step');
        }
      } else if (actType === 'SEARCH_DECK') {
        const revealCount = act.count || 3;
        const revealed = [];
        for (let i = 0; i < revealCount && friendlyState.deck.length > 0; i++) {
          revealed.push(friendlyState.deck.shift());
        }
        if (revealed.length > 0) {
          const matchIdx = revealed.findIndex(c => (c.type || '').toLowerCase() === 'spirit' || (c.type || '').toLowerCase() === 'magic');
          const picked = matchIdx !== -1 ? revealed.splice(matchIdx, 1)[0] : revealed.shift();
          if (picked) {
            friendlyState.hand.push(picked);
            if (side === 'player') {
              AudioFX.playTone(440, 'sine', 0.2, 0.1);
              addLog(`🔍 **[${card.name}]**: Scried decktop! Added "${picked.name}" to hand.`, 'magic');
            }
          }
          for (const rem of revealed) {
            friendlyState.deck.push(rem);
          }
        }
      } else if (actType === 'SUMMON_FREE') {
        const pool = act.source === 'trash' ? (friendlyState.trashPile || []) : friendlyState.hand;
        const candIdx = pool.findIndex(c => (c.type || '').toLowerCase() === 'spirit' && c.uid !== card.uid);
        if (candIdx !== -1) {
          const summonedCard = pool.splice(candIdx, 1)[0];
          summonedCard.currentCores = 1;
          friendlyState.field = friendlyState.field || [];
          friendlyState.field.push(summonedCard);
          recalculateSpiritBp(summonedCard);
          AudioFX.summon();
          addLog(`⚡ **[${card.name}]**: Free Summon activation! Summoned "${summonedCard.name}" from ${act.source || 'hand'} without paying cost!`, 'magic');
          executeUniversalCardEffect(summonedCard, side, 'WHEN_SUMMONED');
        }
      } else if (actType === 'IMMUNITY') {
        card.isImmuneToOpposingEffects = true;
        AudioFX.shield();
        addLog(`🛡️ **[${card.name}]**: Divine Ward active! This card is completely unaffected by opposing effects.`, 'step');
      } else if (actType === 'BURST_DISCARD_REFRESH') {
        if (friendlyState.burstCard) {
          const disc = friendlyState.burstCard;
          friendlyState.burstCard = null;
          sendToTrash(disc, side, `Discarded to refresh ${card.name}`);
          card.isExhausted = false;
          AudioFX.shield();
          addLog(`🔄 **[${card.name}]**: Discarded Burst "${disc.name}" to refresh to Ready state!`, 'step');
        }
      } else if (actType === 'OPPONENT_CANNOT_ATTACK') {
        enemyState.cannotAttackThisTurn = true;
        AudioFX.shield();
        addLog(`🚫 **[${card.name}]**: Battle Stance! Opposing Spirits cannot declare attacks during this turn.`, 'step');
      } else if (actType === 'OPPONENT_CANNOT_BLOCK') {
        card.cannotBeBlocked = true;
        AudioFX.slash();
        addLog(`💨 **[${card.name}]**: Unstoppable Surge! Opposing Spirits cannot block this strike!`, 'step');
      } else if (actType === 'DRAW_UNTIL') {
        const targetHand = act.target_hand || 4;
        let drawnCount = 0;
        while (friendlyState.hand.length < targetHand && friendlyState.deck.length > 0) {
          const drawn = friendlyState.deck.shift();
          friendlyState.hand.push(drawn);
          drawnCount++;
        }
        if (drawnCount > 0) {
          AudioFX.playTone(390, 'sine', 0.15, 0.08);
          addLog(`🎴 **[${card.name}]**: Refilled Hand! Drew ${drawnCount} card(s) (Hand: ${friendlyState.hand.length}/${targetHand}).`, 'magic');
        }
      } else if (actType === 'SALVAGE') {
        const trashPile = friendlyState.trashPile || [];
        if (trashPile.length > 0) {
          const picked = trashPile.pop();
          friendlyState.hand.push(picked);
          AudioFX.magic();
          addLog(`♻️ **[${card.name}]**: Salvaged "${picked.name}" from Trash to Hand!`, 'magic');
        }
      } else if (actType === 'COUNTER_PLUS') {
        const amt = act.count || 1;
        friendlyState.counters = (friendlyState.counters || 0) + amt;
        AudioFX.coreChime();
        addLog(`💠 **[${card.name}]**: Counter +${amt}! (Total Counters: ${friendlyState.counters})`, 'step');
      } else if (actType === 'DAMAGE_CAP') {
        friendlyState.damageCap = 1;
        AudioFX.shield();
        addLog(`🛡️ **[${card.name}]**: Sacred Aegis! During this turn, your Life cannot be reduced by more than 1!`, 'step');
      } else if (actType === 'GRANT_SYMBOL') {
        card.bonusSymbols = (card.bonusSymbols || 0) + 1;
        AudioFX.coreChime();
        addLog(`💎 **[${card.name}]**: Empowered! Gained +1 ${act.color || ''} Symbol!`, 'step');
      }
    }
  }

  async function initBattleArena() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        const res = await fetch('/api/standard-decks');
        if (res.ok) {
          const data = await res.json();
          const list = data.decks || [];
          list.forEach(d => {
            DuelState.standardDecks[d.color.toLowerCase()] = d;
          });
        }
      }
    } catch (e) {
      // Graceful fallback in test or offline environment
    }
    await loadTrainedAiWeights();
    await loadCardEffectsDB();
    renderArenaLobby();
    renderAiDashboard();
  }


  // ── FULLSCREEN ARENA CONTROLLER ──
  function enterFullscreen() {
    try {
      const arenaEl = document.getElementById('battleArena') || (typeof document !== 'undefined' ? document.documentElement : null);
      if (!arenaEl) return;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (arenaEl.requestFullscreen) {
          arenaEl.requestFullscreen().catch(err => {
            console.log('Fullscreen request bypassed by browser security policy:', err);
          });
        } else if (arenaEl.webkitRequestFullscreen) {
          arenaEl.webkitRequestFullscreen();
        } else if (arenaEl.msRequestFullscreen) {
          arenaEl.msRequestFullscreen();
        }
      }
    } catch (e) {
      console.log('Fullscreen error:', e);
    }
  }

  function exitFullscreen() {
    try {
      if (typeof document === 'undefined') return;
      if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (e) {}
  }

  function toggleFullscreen() {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }

  function updateFullscreenButtonState() {
    if (typeof document === 'undefined') return;
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    const btn = document.getElementById('btnDuelFullscreen');
    if (btn) {
      btn.innerHTML = isFs ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
      btn.title = isFs ? 'Exit Fullscreen Mode (Esc)' : 'Enter Immersive Fullscreen Mode';
      btn.classList.toggle('active-fullscreen', isFs);
    }
    const arenaEl = document.getElementById('battleArena');
    if (arenaEl) {
      arenaEl.classList.toggle('is-fullscreen-arena', isFs);
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', updateFullscreenButtonState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtonState);
  }

  // ── LOBBY RENDERER ──
  function renderArenaLobby() {
    const lobbyEl = document.getElementById('battleLobby');
    const duelEl = document.getElementById('battleDuelTable');
    if (!lobbyEl) return;

    if (DuelState.inDuel) {
      lobbyEl.style.display = 'none';
      if (duelEl) duelEl.style.display = 'block';
      return;
    }

    lobbyEl.style.display = 'block';
    if (duelEl) duelEl.style.display = 'none';

    // Populate Selectors if not done
    const pSelect = document.getElementById('arenaPlayerDeckSelect');
    const oSelect = document.getElementById('arenaOpponentDeckSelect');
    if (!pSelect || !oSelect) return;

    // 1. CHALLENGER (PLAYER 1): ONLY SHOW USER'S REGISTERED DECKS
    const decksData = window.DeckManager ? window.DeckManager.getAllData() : { decks: [] };
    const registeredDecks = decksData.decks || [];
    const battleDeckId = window.DeckManager ? window.DeckManager.getBattleDeckId() : null;

    // Retrieve previously selected deck cursor from localStorage
    const savedP1DeckId = safeGetStorage('colosseum_p1_deck_id', battleDeckId);

    let pOptions = '';
    if (registeredDecks.length === 0) {
      pOptions = `<option value="" disabled selected>No registered decks found — add one below</option>`;
    } else {
      pOptions = registeredDecks.map(d => {
        const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
        const colorIcons = { red: '🔴', purple: '🟣', green: '🟢', white: '⚪', yellow: '🟡', blue: '🔵' };
        const icon = colorIcons[(d.color || 'red').toLowerCase()] || '🃏';
        const isBattle = d.id === battleDeckId;
        const battleTag = isBattle ? ' ⚔️ [Battle Deck]' : '';
        if (count < 40) {
          return `<option value="${d.id}" data-count="${count}">⚠️ ${d.name} (${count}/40 min Cards - Incomplete)${battleTag}</option>`;
        }
        return `<option value="${d.id}" data-count="${count}">${icon} ${d.name} (${count} Cards)${battleTag}</option>`;
      }).join('');
    }
    pSelect.innerHTML = pOptions;

    // Set cursor on previously chosen deck!
    if (savedP1DeckId && registeredDecks.some(d => d.id === savedP1DeckId)) {
      pSelect.value = savedP1DeckId;
    } else if (registeredDecks[0]) {
      pSelect.value = registeredDecks[0].id;
    }

    // 2. OPPONENT (AI CHAMPION): ALL COLOSSEUM REALMS AVAILABLE
    const savedOppDeckId = safeGetStorage('colosseum_opponent_deck_id', 'purple');
    let oOptions = `
      <option value="purple">🟣 Purple: Netherworld Curse & Seven Shoguns (40 Cards)</option>
      <option value="red">🔴 Red: Hero Dragon's Blazing Soul (40 Cards)</option>
      <option value="green">🟢 Green: Emerald Gale of Insect Sovereigns (40 Cards)</option>
      <option value="white">⚪ White: Armed Fortress & Mobile Machine Deity (40 Cards)</option>
      <option value="yellow">🟡 Yellow: Celestial Symphony of Seraphs (40 Cards)</option>
      <option value="blue">🔵 Blue: Colosseum Titans & Golem Mill (40 Cards)</option>
    `;
    oSelect.innerHTML = oOptions;

    // Set cursor on previously chosen opponent realm!
    if (savedOppDeckId && ['purple', 'red', 'green', 'white', 'yellow', 'blue'].includes(savedOppDeckId)) {
      oSelect.value = savedOppDeckId;
    } else {
      oSelect.value = 'purple';
    }

    // Hook listeners to persist cursor on change
    pSelect.onchange = () => {
      safeSetStorage('colosseum_p1_deck_id', pSelect.value);
      if (window.DeckManager) window.window.DeckManager.setBattleDeckId(pSelect.value);
      updateLobbyPreviews();
    };

    oSelect.onchange = () => {
      safeSetStorage('colosseum_opponent_deck_id', oSelect.value);
      updateLobbyPreviews();
    };

    updateLobbyPreviews();
  }

  function updateLobbyPreviews() {
    const pKey = document.getElementById('arenaPlayerDeckSelect')?.value;
    const oKey = document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';

    const pCardEl = document.getElementById('lobbyPlayerDeckCard');
    const oCardEl = document.getElementById('lobbyOpponentDeckCard');

    if (pCardEl) {
      const userDeck = window.DeckManager ? window.DeckManager.getDeck(pKey) : null;
      if (userDeck) {
        const color = (userDeck.color || 'Red').toLowerCase();
        let totalCount = 40;
        if (!userDeck.isStandard || (userDeck.cards && Object.keys(userDeck.cards).length > 0)) {
          totalCount = Object.values(userDeck.cards || {}).reduce((a, b) => a + b, 0);
        }

        let desc = userDeck.isStandard && userDeck.standardKey && DuelState.standardDecks[userDeck.standardKey]
          ? DuelState.standardDecks[userDeck.standardKey].desc
          : `Custom registered deck configured in Deck Builder with ${totalCount} cards.`;

        let aces = [];
        if (userDeck.isStandard && userDeck.standardKey && DuelState.standardDecks[userDeck.standardKey]) {
          aces = (DuelState.standardDecks[userDeck.standardKey].validated_cards || []).slice(7, 10).map(c => c.name);
        } else if (userDeck.cards) {
          aces = Object.keys(userDeck.cards).slice(0, 3);
        }

        const warningHtml = totalCount < 40 ? `
          <div class="lobby-deck-warning-box">
            ⚠️ <strong>Incomplete Deck (${totalCount} / 40 Min Cards)</strong><br>
            Battle Spirits rules require at least 40 cards (no upper limit) to enter battle.<br>
            <a href="/deck" class="lobby-goto-builder">🎴 Build / Add Cards in Deck Builder →</a>
          </div>
        ` : '';

        pCardEl.innerHTML = `
          <div class="deck-preview-badge color-badge-${color}">${userDeck.color.toUpperCase()} • ${totalCount} CARDS</div>
          <div class="deck-preview-name">${userDeck.name}</div>
          <div class="deck-preview-desc">${desc}</div>
          <div class="deck-preview-aces">
            ${aces.map(name => `<span class="preview-ace-pill">${name}</span>`).join('')}
          </div>
          ${warningHtml}
        `;

        const startBtn = document.getElementById('btnEnterColosseum') || document.querySelector('.btn-start-duel');
        if (startBtn) {
          if (totalCount < 40) {
            startBtn.classList.add('btn-blocked');
            startBtn.innerHTML = `⚠️ Deck Incomplete (${totalCount}/40 Min Cards)`;
            startBtn.title = 'Cannot enter battle with less than 40 cards (minimum 40 cards required, no upper limit)!';
          } else {
            startBtn.classList.remove('btn-blocked');
            startBtn.innerHTML = '🔥 ENTER BATTLE';
            startBtn.title = 'Enter the Colosseum Arena!';
          }
        }
      } else {
        const pDeck = DuelState.standardDecks[pKey];
        if (pDeck) {
          pCardEl.innerHTML = `
            <div class="deck-preview-badge color-badge-${pDeck.color.toLowerCase()}">${pDeck.badge || pDeck.color}</div>
            <div class="deck-preview-name">${pDeck.name}</div>
            <div class="deck-preview-desc">${pDeck.desc}</div>
            <div class="deck-preview-aces">
              ${(pDeck.validated_cards || []).slice(7, 10).map(c => `<span class="preview-ace-pill">${c.name}</span>`).join('')}
            </div>
          `;
        }
      }
    }

    if (oCardEl) {
      const oDeck = DuelState.standardDecks[oKey];
      if (oDeck) {
        oCardEl.innerHTML = `
          <div class="deck-preview-badge color-badge-${oDeck.color.toLowerCase()}">${oDeck.badge || oDeck.color}</div>
          <div class="deck-preview-name">${oDeck.name}</div>
          <div class="deck-preview-desc">${oDeck.desc}</div>
          <div class="deck-preview-aces">
            ${(oDeck.validated_cards || []).slice(7, 10).map(c => `<span class="preview-ace-pill">${c.name}</span>`).join('')}
          </div>
        `;
      }
    }
  }

  async function addStandardDeckToRegistered(colorKey) {
    if (!colorKey) return;
    if (window.DeckManager) {
      const stdData = DuelState.standardDecks[colorKey.toLowerCase()];
      const registered = await window.DeckManager.registerStandardDeck(colorKey, stdData);
      safeSetStorage('colosseum_p1_deck_id', registered.id);
      window.DeckManager.setBattleDeckId(registered.id);
      renderArenaLobby();
      if (typeof showToast === 'function') {
        showToast(`⚡ Registered "${registered.name}" to your decks! Ready for battle.`, 'success');
      }
    }
  }

  
  function triggerToast(msg, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else if (typeof alert === 'function') {
      alert(msg);
    } else {
      console.warn(msg);
    }
  }

  // ── COIN FLIP (FIRST TURN DETERMINATION) CONTROLLER ──
  let pendingDuelDecks = null;
  let coinFlipWinner = null;
  let coinFlipAutoTimer = null;

  function launchCoinFlip(pDeckKey, oDeckKey) {
    pDeckKey = pDeckKey || document.getElementById('arenaPlayerDeckSelect')?.value || 'red';
    oDeckKey = oDeckKey || document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';

    const userDeck = window.DeckManager ? window.DeckManager.getDeck(pDeckKey) : null;
    const pCount = userDeck ? Object.values(userDeck.cards || {}).reduce((a, b) => a + b, 0) : 0;
    if (pCount < 40) {
      triggerToast(`⚠️ Cannot battle! "${userDeck ? userDeck.name : 'Deck'}" only has ${pCount}/40 cards. Battle Spirits requires at least 40 cards (no upper limit)!`, 'error');
      return;
    }

    pendingDuelDecks = { pDeckKey, oDeckKey };

    const modalEl = document.getElementById('battleCoinModal');
    if (!modalEl) {
      // Fallback if modal not present: 50/50 flip directly
      const fp = Math.random() < 0.5 ? 'player' : 'opponent';
      executeStartDuel(pDeckKey, oDeckKey, fp);
      return;
    }

    // Reset coin modal elements
    const coinEl = document.getElementById('coinFlipCoin');
    if (coinEl) {
      coinEl.className = 'coin-3d-disc';
    }
    const resultBox = document.getElementById('coinFlipResultBox');
    if (resultBox) {
      resultBox.style.display = 'none';
      resultBox.innerHTML = '';
    }
    const choiceRow = document.getElementById('coinChoiceRow');
    if (choiceRow) {
      choiceRow.style.display = 'none';
      choiceRow.innerHTML = '';
    }
    const triggerBtn = document.getElementById('btnTriggerCoinFlip');
    if (triggerBtn) {
      triggerBtn.style.display = 'inline-flex';
      triggerBtn.disabled = false;
      triggerBtn.textContent = '🪙 Flip Coin for First Turn!';
    }
    const proceedBtn = document.getElementById('btnCoinProceed');
    if (proceedBtn) {
      proceedBtn.style.display = 'none';
    }

    modalEl.classList.add('active');
  }

  function flipCoin() {
    const triggerBtn = document.getElementById('btnTriggerCoinFlip');
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.textContent = 'Spinning in the air...';
    }

    const coinEl = document.getElementById('coinFlipCoin');
    const isHeads = Math.random() < 0.5; // Heads = player, Tails = opponent
    coinFlipWinner = isHeads ? 'player' : 'opponent';

    AudioFX.coinFlip();

    if (coinEl) {
      coinEl.classList.remove('is-flipping', 'lands-heads', 'lands-tails');
      void coinEl.offsetWidth; // trigger reflow
      coinEl.classList.add('is-flipping');
    }

    setTimeout(() => {
      if (coinEl) {
        coinEl.classList.remove('is-flipping');
        coinEl.classList.add(isHeads ? 'lands-heads' : 'lands-tails');
      }

      const resultBox = document.getElementById('coinFlipResultBox');
      const choiceRow = document.getElementById('coinChoiceRow');
      const proceedBtn = document.getElementById('btnCoinProceed');
      if (triggerBtn) triggerBtn.style.display = 'none';

      if (isHeads) {
        // Player won the coin toss! Player gets to choose who goes first!
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.className = 'coin-result-banner heads';
          resultBox.innerHTML = `
            <div class="crb-icon">🎉</div>
            <div class="crb-title">HEADS — YOU WON THE COIN TOSS!</div>
            <div class="crb-sub">Official rules: As the toss winner, you choose who takes Turn 1:</div>
          `;
        }
        if (choiceRow) {
          choiceRow.style.display = 'grid';
          choiceRow.innerHTML = `
            <button class="btn-coin-choice btn-choice-first" onclick="BattleArena.selectFirstPlayer('player')">
              <span>⚔️ I'll Go First</span>
              <span class="btn-choice-tag">Take Turn 1 (Opening Initiative)</span>
            </button>
            <button class="btn-coin-choice btn-choice-second" onclick="BattleArena.selectFirstPlayer('opponent')">
              <span>🛡️ Opponent Goes First</span>
              <span class="btn-choice-tag">Take Turn 2 (Core & Flash Advantage)</span>
            </button>
          `;
        }
        if (proceedBtn) proceedBtn.style.display = 'none';
      } else {
        // Opponent won the toss! Opponent AI decides who goes first
        const oppChoosesFirst = Math.random() < 0.8;
        const chosenFirstPlayer = oppChoosesFirst ? 'opponent' : 'player';

        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.className = 'coin-result-banner tails';
          resultBox.innerHTML = `
            <div class="crb-icon">👑</div>
            <div class="crb-title">TAILS — OPPONENT WON THE COIN TOSS!</div>
            <div class="crb-sub">${oppChoosesFirst ? 'Opponent elected to take <strong>Turn 1</strong>!' : 'Opponent elected to have <strong>YOU</strong> take Turn 1!'}</div>
          `;
        }
        if (choiceRow) {
          choiceRow.style.display = 'none';
        }
        if (proceedBtn) {
          proceedBtn.style.display = 'inline-flex';
          proceedBtn.textContent = chosenFirstPlayer === 'player' ? '⚔️ Begin Duel (Your Turn 1) →' : '⚔️ Begin Duel (Opponent Turn 1) →';
          proceedBtn.onclick = () => selectFirstPlayer(chosenFirstPlayer);
        }

        // Auto proceed after 3s if player doesn't click
        coinFlipAutoTimer = setTimeout(() => {
          selectFirstPlayer(chosenFirstPlayer);
        }, 3000);
      }

    }, 1400);
  }

  async function selectFirstPlayer(chosenFirstPlayer) {
    if (coinFlipAutoTimer) {
      clearTimeout(coinFlipAutoTimer);
      coinFlipAutoTimer = null;
    }
    const modalEl = document.getElementById('battleCoinModal');
    if (modalEl) modalEl.classList.remove('active');

    const pDeckKey = pendingDuelDecks ? pendingDuelDecks.pDeckKey : null;
    const oDeckKey = pendingDuelDecks ? pendingDuelDecks.oDeckKey : null;
    return await executeStartDuel(pDeckKey, oDeckKey, chosenFirstPlayer);
  }

  function proceedWithDuel() {
    return selectFirstPlayer(coinFlipWinner || 'player');
  }

  function isArenaPage() {
    if (typeof window === 'undefined' || !window.location) return true;
    const path = (window.location.pathname || '').toLowerCase();
    return path.includes('arena') || path.includes('battle') || !!document.getElementById('battleArena');
  }

  // ── STARTING A DUEL (WITH COIN TOSS) ──
  async function startDuel(pDeckKey, oDeckKey, firstPlayer = null) {
    if (!isArenaPage()) {
      const p = pDeckKey || 'deck_std_red';
      const o = oDeckKey || 'purple';
      window.location.href = `/arena?start=1&deck=${encodeURIComponent(p)}&opp=${encodeURIComponent(o)}`;
      return false;
    }
    pDeckKey = pDeckKey || document.getElementById('arenaPlayerDeckSelect')?.value || (window.DeckManager ? window.DeckManager.getBattleDeckId() : null) || 'deck_std_red';
    oDeckKey = oDeckKey || document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';

    const userDeck = window.DeckManager ? window.DeckManager.getDeck(pDeckKey) : null;
    const pCount = userDeck ? Object.values(userDeck.cards || {}).reduce((a, b) => a + b, 0) : 0;
    if (pCount < 40) {
      triggerToast(`⚠️ Cannot battle! "${userDeck ? userDeck.name : 'Deck'}" only has ${pCount}/40 cards. Battle Spirits requires at least 40 cards (no upper limit)!`, 'error');
      return false;
    }

    if (!firstPlayer) {
      launchCoinFlip(pDeckKey, oDeckKey);
      return;
    }
    return await executeStartDuel(pDeckKey, oDeckKey, firstPlayer);
  }

  async function executeStartDuel(pDeckKey, oDeckKey, firstPlayer = 'player') {
    pDeckKey = pDeckKey || document.getElementById('arenaPlayerDeckSelect')?.value || (window.DeckManager ? window.DeckManager.getBattleDeckId() : null) || 'deck_std_red';
    oDeckKey = oDeckKey || document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';

    // Persist previous deck cursor selections
    if (pDeckKey) safeSetStorage('colosseum_p1_deck_id', pDeckKey);
    if (oDeckKey) safeSetStorage('colosseum_opponent_deck_id', oDeckKey);

    // Retrieve or fetch Player Deck
    let pCards = [];
    let pName = 'Hero Dragon Aggro';
    let pColor = 'Red';

    // 1. Check DeckManager registered decks
    const userDeck = window.DeckManager ? window.DeckManager.getDeck(pDeckKey) : null;
    if (userDeck) {
      const userDeckCount = Object.values(userDeck.cards || {}).reduce((a, b) => a + b, 0);
      if (userDeckCount < 40) {
        triggerToast(`⚠️ Cannot start battle! Deck "${userDeck.name}" has only ${userDeckCount}/40 cards. Minimum 40 cards required (no upper limit)!`, 'error');
        return false;
      }
      pName = userDeck.name;
      pColor = userDeck.color || 'Red';

      // If standard deck with no overrides, load standard deck cards
      if (userDeck.isStandard && userDeck.standardKey && DuelState.standardDecks[userDeck.standardKey] && (!userDeck.cards || Object.keys(userDeck.cards).length === 0)) {
        const std = DuelState.standardDecks[userDeck.standardKey];
        pName = std.name;
        pColor = std.color;
        (std.validated_cards || []).forEach(c => {
          for (let i = 0; i < c.count; i++) {
            pCards.push({ ...c });
          }
        });
      } else if (userDeck.cards && Object.keys(userDeck.cards).length > 0) {
        const names = Object.keys(userDeck.cards);
        if (typeof window !== 'undefined' && window.location && window.location.origin) {
          try {
            const res = await fetch('/api/cards-batch?names=' + encodeURIComponent(names.join('|')));
            const batchData = await res.json();
            for (const [name, count] of Object.entries(userDeck.cards)) {
              const cInfo = batchData[name] || { name, cost: 2, type: 'Spirit', color: userDeck.color || 'Red' };
              for (let i = 0; i < count; i++) {
                pCards.push({ ...cInfo });
              }
            }
          } catch (e) {
            console.warn('Failed to load card batch for user deck:', e);
          }
        }
        if (!pCards.length) {
          for (const [name, count] of Object.entries(userDeck.cards)) {
            const cInfo = { name, cost: 2, type: 'Spirit', color: userDeck.color || 'Red' };
            for (let i = 0; i < count; i++) {
              pCards.push({ ...cInfo });
            }
          }
        }
      }
    }

    if (!pCards.length && pDeckKey === 'custom') {
      try {
        const saved = JSON.parse(safeGetStorage('battle_spirits_deck_v1', '{}') || '{}');
        const names = Object.keys(saved);
        if (names.length) {
          const res = await fetch('/api/cards-batch?names=' + encodeURIComponent(names.join('|')));
          const batchData = await res.json();
          for (const [name, count] of Object.entries(saved)) {
            const cInfo = batchData[name] || { name, cost: 2, type: 'Spirit', color: 'Red' };
            for (let i = 0; i < count; i++) {
              pCards.push({ ...cInfo });
            }
          }
          pName = 'Custom Arena Deck';
        }
      } catch (e) {
        console.warn('Failed to load custom deck, falling back to red:', e);
      }
    }

    if (!pCards.length) {
      const std = DuelState.standardDecks[pDeckKey] || DuelState.standardDecks['red'];
      if (std) {
        pName = std.name;
        pColor = std.color;
        (std.validated_cards || []).forEach(c => {
          for (let i = 0; i < c.count; i++) {
            pCards.push({ ...c });
          }
        });
      }
    }

    // Retrieve Opponent Deck
    let oCards = [];
    let oName = 'Seven Shoguns Control';
    let oColor = 'Purple';
    const oStd = DuelState.standardDecks[oDeckKey] || DuelState.standardDecks['purple'];
    if (oStd) {
      oName = oStd.name;
      oColor = oStd.color;
      (oStd.validated_cards || []).forEach(c => {
        for (let i = 0; i < c.count; i++) {
          oCards.push({ ...c });
        }
      });
    }

    // Prepare card instances with UIDs and parsed levels
    let uidCounter = 1;
    const prepareDeck = (cardsList) => {
      return cardsList.map(c => {
        const pLevels = c.parsed_levels || parseLevels(c.levels);
        return {
          uid: 'c_' + (uidCounter++),
          name: c.name,
          kanji: c.kanji || c.jpname || '',
          cost: c.cost !== undefined ? c.cost : 2,
          type: c.type || 'Spirit',
          color: c.color || 'Red',
          family: c.family || (c.families ? c.families.join(', ') : ''),
          rarity: c.rarity || '',
          flavor: c.flavor || '',
          card_number: c.card_number || '',
          image_url: c.image_url || '/assets/card_back.png',
          levels: pLevels,
          raw_levels: c.levels || '',
          effect: c.effect || '',
          summary: c.summary || '',
          currentCores: 0,
          currentLevel: 1,
          currentBp: pLevels[0]?.bp || 2000,
          isExhausted: false,
          hasAttacked: false
        };
      });
    };

    const shuffledP = shuffle(prepareDeck(pCards));
    const shuffledO = shuffle(prepareDeck(oCards));

    // Clear any previous running timers to prevent ghost turns/core spikes!
    clearAllTimers();
    const finishedBar = document.getElementById('matchFinishedBar');
    if (finishedBar) finishedBar.style.display = 'none';

    // Deal 4 initial cards each
    const pHand = shuffledP.splice(0, 4);
    const oHand = shuffledO.splice(0, 4);

    DuelState.inDuel = true;
    DuelState.turn = 1;
    DuelState.firstPlayer = firstPlayer || 'player';
    DuelState.activePlayer = DuelState.firstPlayer;
    DuelState.phaseIndex = 0; // START STEP - player manually clicks through each step!
    DuelState.combatEvent = null;
    DuelState.selectedPlayerCard = null;
    DuelState.selectedAttacker = null;
    DuelState.activeBurstTrigger = null;
    closeBurstPromptModal();
    DuelState.logs = [];

    // Official Starting Reserve: Both players begin with 4 cores from Void.
    // Opponent takes Core step on their Turn 1 to reach 5 cores.
    DuelState.player = {
      name: pName,
      color: pColor,
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledP,
      hand: pHand,
      field: []
    };

    DuelState.opponent = {
      name: oName,
      color: oColor,
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledO,
      hand: oHand,
      field: []
    };
    DuelState.currentZoneTab = 'player-trash';

    addLog(`⚔️ **DUEL COMMENCED!** ${pName} vs ${oName}.`, 'system');
    const aiProf = getActiveAiProfile('opponent');
    addLog(`🧠 **AI ENGINE ACTIVATED**: Opponent loaded archetype **${aiProf.name}** [Aggro Thresh: ${(aiProf.aggro_threshold || 0.45).toFixed(2)}, Flash Buffer: ${aiProf.flash_reserve_buffer || 1} Cores, Expectimax Lookahead Ready].`, 'system');
    addLog(`🪙 **COIN FLIP RESULT**: Landed on **${firstPlayer === 'player' ? 'HEADS (Challenger First)' : 'TAILS (Champion First)'}**!`, 'step');
    addLog(`💎 Turn 1: Both Duelists start with 5 Life, 4 cards in Hand, and 4 Cores in Reserve.`, 'system');
    addLog(`▶️ **START STEP**: Turn 1 begins! Click "Begin Turn" on the right panel to proceed.`, 'step');

    AudioFX.coreChime();
    renderArenaLobby();
    renderDuelTable();

    // Scroll smoothly to battlefield
    // Enter fullscreen mode on entering battle
    enterFullscreen();
    const arenaEl = document.getElementById('battleArena');
    if (arenaEl && typeof arenaEl.scrollIntoView === 'function') arenaEl.scrollIntoView({ behavior: 'smooth' });

    if (firstPlayer === 'opponent') {
      addLog(`▶️ **OPPONENT TURN 1**: Opponent won coin toss and begins Turn 1 phases.`, 'step');
      safeTimeout(advanceOpponentStep, 1000);
    } else {
      addLog(`▶️ **START STEP**: Turn 1 begins! Click "Begin Turn" on the Step Navigator to proceed.`, 'step');
    }
  }

  function addLog(text, type = 'normal') {
    DuelState.logs.unshift({ text, type, time: new Date().toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' }) });
    if (DuelState.logs.length > 50) DuelState.logs.pop();
    updateLogView();
  }

  function updateLogView() {
    const listEl = document.getElementById('battleLogList');
    if (!listEl) return;
    listEl.innerHTML = DuelState.logs.map(l => {
      let cls = 'log-item';
      if (l.type === 'system') cls += ' log-sys';
      if (l.type === 'step') cls += ' log-step';
      if (l.type === 'damage') cls += ' log-dmg';
      if (l.type === 'kill') cls += ' log-kill';
      if (l.type === 'magic') cls += ' log-magic';
      return `<div class="${cls}"><span class="log-time">${l.time}</span> ${l.text}</div>`;
    }).join('');
  }

  // ── DUEL TABLE RENDERER ──
  function renderDuelTable() {
    if (!DuelState.inDuel) return;

    // Render Burst Zones (Battlefield & HUDs)
    renderBurstZones();

    // Ensure Void Reservoir visual shows 5 animated Hexagonal Crystals
    const voidVisual = document.getElementById('voidCoresVisual');
    if (voidVisual && voidVisual.dataset && !voidVisual.dataset.renderedHex) {
      voidVisual.dataset.renderedHex = '1';
      voidVisual.innerHTML = [0, 1, 2, 3, 4].map(i => `
        <span class="void-hex-core" style="animation-delay: ${i * 0.4}s;" title="Void Core #${i+1}">
          ${getHexCoreSvg('blue', 20)}
        </span>
      `).join('');
    }

    // Render Center Nexus Zone (Field Hub)
    const nexusZoneContent = document.getElementById('battleNexusZoneContent');
    const pNexusBadge = document.getElementById('playerNexusCountBadge');
    const pNexuses = DuelState.player.nexus || [];
    const oNexuses = DuelState.opponent.nexus || [];

    if (pNexusBadge) {
      pNexusBadge.textContent = `${pNexuses.length} Active`;
    }

    if (nexusZoneContent) {
      if (pNexuses.length === 0) {
        nexusZoneContent.innerHTML = `
          <div class="bnz-empty-state">
            <span class="bnz-empty-icon">🏛️</span>
            <span class="bnz-empty-text">No Nexuses on Field</span>
            <span class="bnz-empty-hint">Click to inspect Nexus Zone</span>
          </div>
        `;
      } else {
        nexusZoneContent.innerHTML = pNexuses.map(n => `
          <div class="bnz-nexus-mini" onclick="event.stopPropagation(); BattleArena.openZoneModal('player-nexus');" title="${n.name} (Lv${n.currentLevel || 1} • ${n.currentCores || 0} Cores) - Click to inspect">
            <img src="${n.image_url || '/placeholder.png'}" class="bnz-card-thumb" alt="${n.name}" onerror="this.src='/placeholder.png';">
            <div class="bnz-nexus-info">
              <span class="bnz-nexus-name">${n.name}</span>
              <div class="bnz-nexus-stats">
                <span>LV${n.currentLevel || 1}</span>
                <span>🔮 ${n.currentCores || 0}c</span>
                ${(() => {
                  const check = canActivateGrandSkill(n, 'player');
                  if (check.allowed && check.gs) {
                    return `<button class="btn-grand-skill" onclick="event.stopPropagation(); BattleArena.activateGrandSkill('${n.uid}')" title="Activate [Grand Skill: ${check.gs.cost}] Flash">⚡ GS:${check.gs.cost}</button>`;
                  }
                  return '';
                })()}
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Phase Indicator
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    document.querySelectorAll('.phase-step').forEach(el => {
      const p = el.dataset.phase;
      if (p === currentPhase) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    const turnLabel = document.getElementById('duelTurnLabel');
    if (turnLabel) {
      const isPlayer = DuelState.activePlayer === 'player';
      const activeText = isPlayer ? "Player's Turn" : "Opponent's Turn";
      turnLabel.innerHTML = `
        <div class="turn-badge-label">TURN ${DuelState.turn}</div>
        <div class="turn-badge-player">${activeText}</div>
        <div class="turn-badge-step">[${currentPhase} STEP]</div>
      `;
      turnLabel.className = isPlayer ? 'turn-badge turn-player' : 'turn-badge turn-opponent';

      if (turnLabel.dataset) {

        turnLabel.dataset.turn = DuelState.turn;

      } else if (typeof turnLabel.setAttribute === 'function') {

        turnLabel.setAttribute('data-turn', DuelState.turn);

      }
    }

    renderLifeCores('opponentLifeContainer', DuelState.opponent.life);
    const oResEl = document.getElementById('opponentReserveCores');
    if (oResEl) oResEl.textContent = DuelState.opponent.reserve;
    const oTrashEl = document.getElementById('opponentTrashCores');
    if (oTrashEl) {
      const oScInTrash = (DuelState.opponent.soulCoreLocation === 'trash');
      oTrashEl.textContent = oScInTrash ? `${DuelState.opponent.trash} (+1 🔥)` : DuelState.opponent.trash;
    }
    const oGraveEl = document.getElementById('opponentGraveCount');
    if (oGraveEl) {
      oGraveEl.textContent = (DuelState.opponent.trashCards || []).length;
    }
    const oTrashPill = document.getElementById('opponentTrashPill');
    if (oTrashPill) {
      oTrashPill.title = `Opponent's Cores in Trash: ${DuelState.opponent.trash} Cores${DuelState.opponent.soulCoreLocation === 'trash' ? ' + 1 Soul Core' : ''}`;
    }
    const oGravePill = document.getElementById('opponentGravePill');
    if (oGravePill) {
      oGravePill.title = `Opponent's Graveyard: ${(DuelState.opponent.trashCards || []).length} Defeated Cards (Click to view Graveyard)`;
    }

    // Render Opponent Soul Core Status
    const oScLabel = document.getElementById('opponentSoulCoreLabel');
    const oScPill = document.getElementById('opponentSoulCorePill');
    if (oScLabel && oScPill) {
      const loc = DuelState.opponent.soulCoreLocation || 'reserve';
      if (loc === 'reserve') {
        oScLabel.textContent = 'Soul Core: Reserve';
        oScPill.className = 'soul-core-pill in-reserve';
        oScPill.title = "Opponent's Soul Core is in Reserve";
      } else if (loc === 'field') {
        const sp = DuelState.opponent.field.find(s => s.uid === DuelState.opponent.soulCoreSpiritUid);
        const spName = sp ? sp.name : 'Spirit';
        oScLabel.textContent = `Soul Core: On ${spName}`;
        oScPill.className = 'soul-core-pill on-field';
        oScPill.title = `Opponent's Soul Core is empowering "${spName}"!`;
      } else if (loc === 'trash') {
        oScLabel.textContent = 'Soul Core: Trash';
        oScPill.className = 'soul-core-pill in-trash';
        oScPill.title = "Opponent's Soul Core is in Trash";
      }
    }
    const oDeckCount = document.getElementById('opponentDeckCount');
    if (oDeckCount) oDeckCount.textContent = `${(DuelState.opponent.deck || []).length} in Deck`;

    // Render Opponent Hand Backs
    const oHandEl = document.getElementById('opponentHandBacks');
    if (oHandEl) {
      oHandEl.innerHTML = DuelState.opponent.hand.map(() => `
        <div class="hand-card-back" title="Opponent Card"></div>
      `).join('');
    }

    // Render Opponent Field Spirits
    const oFieldEl = document.getElementById('opponentField');
    if (oFieldEl) {
      if (!DuelState.opponent.field.length) {
        oFieldEl.innerHTML = `<div class="field-empty-prompt">No Spirits on Opponent's Field</div>`;
      } else {
        oFieldEl.innerHTML = DuelState.opponent.field.map(s => renderFieldSpirit(s, 'opponent')).join('');
      }
    }

    // Render Player Field Spirits
    const pFieldEl = document.getElementById('playerField');
    if (pFieldEl) {
      if (!DuelState.player.field.length) {
        pFieldEl.innerHTML = `<div class="field-empty-prompt">Your Battle Line is empty. Summon a Spirit from your hand below!</div>`;
      } else {
        pFieldEl.innerHTML = DuelState.player.field.map(s => renderFieldSpirit(s, 'player')).join('');
      }
    }

    // Render Player Life & Cores
    renderLifeCores('playerLifeContainer', DuelState.player.life);
    const pResEl = document.getElementById('playerReserveCores');
    if (pResEl) pResEl.textContent = DuelState.player.reserve;
    const pTrashEl = document.getElementById('playerTrashCores');
    if (pTrashEl) {
      const pScInTrash = (DuelState.player.soulCoreLocation === 'trash');
      pTrashEl.textContent = pScInTrash ? `${DuelState.player.trash} (+1 🔥)` : DuelState.player.trash;
    }
    const pGraveEl = document.getElementById('playerGraveCount');
    if (pGraveEl) {
      pGraveEl.textContent = (DuelState.player.trashCards || []).length;
    }
    const pTrashPill = document.getElementById('playerTrashPill');
    if (pTrashPill) {
      pTrashPill.title = `Your Cores in Trash: ${DuelState.player.trash} Cores${DuelState.player.soulCoreLocation === 'trash' ? ' + 1 Soul Core' : ''} (Refreshes to Reserve at Refresh Step)`;
    }
    const pGravePill = document.getElementById('playerGravePill');
    if (pGravePill) {
      pGravePill.title = `Your Graveyard: ${(DuelState.player.trashCards || []).length} Defeated Cards (Click to view Graveyard)`;
    }

    // Render Player Soul Core Status
    const pScLabel = document.getElementById('playerSoulCoreLabel');
    const pScPill = document.getElementById('playerSoulCorePill');
    if (pScLabel && pScPill) {
      const loc = DuelState.player.soulCoreLocation || 'reserve';
      if (loc === 'reserve') {
        pScLabel.textContent = 'Soul Core: Reserve';
        pScPill.className = 'soul-core-pill in-reserve';
        pScPill.title = 'Your Soul Core is in Reserve! Available to place on a Spirit or pay costs.';
      } else if (loc === 'field') {
        const sp = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
        const spName = sp ? sp.name : 'Spirit';
        pScLabel.textContent = `Soul Core: On ${spName}`;
        pScPill.className = 'soul-core-pill on-field';
        pScPill.title = `Soul Core is empowering "${spName}"!`;
      } else if (loc === 'trash') {
        pScLabel.textContent = 'Soul Core: Trash 🪦';
        pScPill.className = 'soul-core-pill in-trash';
        pScPill.title = 'Soul Core is in Trash. Will return to Reserve during Refresh Step!';
      } else {
        pScLabel.textContent = 'Soul Core: Void 🌌';
        pScPill.className = 'soul-core-pill in-void';
      }
    }
    const pDeckCount = document.getElementById('playerDeckCount');
    if (pDeckCount) pDeckCount.textContent = `${(DuelState.player.deck || []).length} in Deck`;

    // Render Player Hand Cards
    renderPlayerHand();

    // Render In-Duel Card Details Inspector
    renderCardInspector();

    // Render Clash Banner if combat active
    renderClashZone();

    // Update Action Buttons State
    updateActionButtons();

    // Update Right Column Step Navigator
    renderStepNavigator();

    // Reset AI Watchdog timer during opponent turn
    resetAiWatchdog();
  }

  function renderBurstZones() {
    // 1. Render Player Battlefield Burst Zone
    const pZone = document.getElementById('playerBurstZone');
    if (pZone) {
      if (DuelState.player.burst) {
        const b = DuelState.player.burst;
        const cond = parseBurstCondition(b.effect);
        const isReady = DuelState.activeBurstTrigger && DuelState.activeBurstTrigger.side === 'player';
        const colorLower = (b.color || 'Red').toLowerCase();
        pZone.className = `burst-field-zone player-burst-zone has-burst ${isReady ? 'has-burst-ready' : ''}`;
        pZone.innerHTML = `
          <div class="burst-zone-inner active ${isReady ? 'ready' : ''}">
            <div class="burst-zone-header">
              <span class="burst-zone-badge">${isReady ? '⚡ BURST READY!' : 'BURST SET'}</span>
              <span class="burst-pulse-dot ${isReady ? 'ready-pulse' : ''}"></span>
            </div>
            <div class="burst-card-display">
              <div class="burst-card-thumb card-theme-${colorLower}">
                <img src="${b.image_url}" alt="${b.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='/assets/card_back.png';" />
                <div class="burst-card-overlay">
                  <span class="burst-lock-tag">${isReady ? '⚡ READY' : '🔒 SET'}</span>
                </div>
              </div>
            </div>
            <div class="burst-info-block">
              <div class="burst-card-name" title="${b.name}">${b.name}</div>
              <div class="burst-card-type" title="${cond.label}">${isReady ? '⚡ Condition Met!' : '🔒 ' + cond.label}</div>
            </div>
            <div class="burst-btn-group">
              <button class="btn-burst-view" onclick="event.stopPropagation(); BattleArena.inspectBurst();" title="Inspect card details">👁️ View</button>
              ${isReady
                ? `<button class="btn-burst-trigger btn-burst-active" onclick="event.stopPropagation(); BattleArena.confirmBurstTrigger();" title="Condition Met! Click to activate now">⚡ Trigger</button>`
                : `<button class="btn-burst-trigger btn-burst-locked" disabled title="Locked: Trigger condition is &quot;${cond.label}&quot;. Only activates when this condition occurs in battle.">🔒 Locked</button>`
              }
            </div>
          </div>
        `;
      } else {
        pZone.className = 'burst-field-zone player-burst-zone empty';
        pZone.innerHTML = `
          <div class="burst-zone-inner empty">
            <div class="burst-zone-badge empty">BURST ZONE</div>
            <div class="burst-empty-icon">🔒</div>
            <div class="burst-empty-title">Burst Slot</div>
            <div class="burst-empty-sub">Empty (Set [Burst:] here)</div>
          </div>
        `;
      }
    }

    // 2. Render Opponent Battlefield Burst Zone
    const oZone = document.getElementById('opponentBurstZone');
    if (oZone) {
      if (DuelState.opponent.burst) {
        oZone.className = 'burst-field-zone opponent-burst-zone has-burst';
        oZone.innerHTML = `
          <div class="burst-zone-inner active opponent">
            <div class="burst-zone-header">
              <span class="burst-zone-badge opponent">OPPONENT BURST</span>
              <span class="burst-pulse-dot opp"></span>
            </div>
            <div class="burst-card-display">
              <div class="burst-card-thumb opp-back">
                <div class="burst-card-back-sigil">💥</div>
                <div class="burst-lock-tag">🔒 SECRET</div>
              </div>
            </div>
            <div class="burst-info-block">
              <div class="burst-card-name">Face-Down Trap</div>
              <div class="burst-card-type">Secret Trigger Condition</div>
            </div>
          </div>
        `;
      } else {
        oZone.className = 'burst-field-zone opponent-burst-zone empty';
        oZone.innerHTML = `
          <div class="burst-zone-inner empty">
            <div class="burst-zone-badge empty">BURST ZONE</div>
            <div class="burst-empty-icon">🔒</div>
            <div class="burst-empty-title">Opponent Slot</div>
            <div class="burst-empty-sub">Empty</div>
          </div>
        `;
      }
    }

    // 3. Keep HUD pills in sync as well
    const pBurstEl = document.getElementById('playerBurstSlot');
    if (pBurstEl) {
      if (DuelState.player.burst) {
        const b = DuelState.player.burst;
        const cond = parseBurstCondition(b.effect);
        const isReady = DuelState.activeBurstTrigger && DuelState.activeBurstTrigger.side === 'player';
        pBurstEl.className = `burst-slot-pill has-burst ${isReady ? 'has-burst-ready' : ''}`;
        pBurstEl.innerHTML = isReady ? `⚡ Burst Ready: [${b.name}]` : `🔒 Burst: [${b.name}]`;
        pBurstEl.title = `Your Set Burst: "${b.name}" (Trigger: ${cond.label})`;
      } else {
        pBurstEl.className = 'burst-slot-pill';
        pBurstEl.innerHTML = `🔒 Burst: Empty`;
        pBurstEl.title = 'No Burst card currently set';
      }
    }
    const oBurstEl = document.getElementById('opponentBurstSlot');
    if (oBurstEl) {
      if (DuelState.opponent.burst) {
        oBurstEl.className = 'burst-slot-pill has-burst';
        oBurstEl.innerHTML = `🚨 Burst: [SET 💥]`;
        oBurstEl.title = 'Opponent has set a secret Burst card!';
      } else {
        oBurstEl.className = 'burst-slot-pill';
        oBurstEl.innerHTML = `🔒 Burst: Empty`;
        oBurstEl.title = 'Opponent Burst Slot is empty';
      }
    }

    // Enable horizontal mouse wheel scrolling across Battle Lines without full-page shift
    if (typeof document !== 'undefined') {
      ['playerField', 'opponentField'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.dataset && typeof el.addEventListener === 'function' && !el.dataset.wheelBound) {
          el.dataset.wheelBound = '1';
          el.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.preventDefault();
              el.scrollLeft += e.deltaY;
            }
          }, { passive: false });
        }
      });
    }
  }

  function renderLifeCores(containerId, lifeCount) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let html = '';
    const count = (typeof lifeCount === 'number') ? lifeCount : 0;
    const totalSlots = Math.max(5, count);
    for (let i = 0; i < totalSlots; i++) {
      if (i < count) {
        html += `<span class="life-hex-gem gem-active" title="Life Core ${i+1}">${getHexCoreSvg('life-active', 22)}</span>`;
      } else {
        html += `<span class="life-hex-gem gem-empty" title="Shattered Core">${getHexCoreSvg('life-empty', 22)}</span>`;
      }
    }
    el.innerHTML = html;
  }

  function renderFieldSpirit(spirit, side) {
    const isAttacker = DuelState.selectedAttacker && DuelState.selectedAttacker.uid === spirit.uid;
    let classes = `field-spirit-card card-color-${(spirit.color || "Red").toLowerCase()}`;
    if (spirit.isExhausted) classes += ' is-exhausted';
    if (isAttacker) classes += ' is-selected-attacker';
    const hasSC = !!spirit.hasSoulCore;
    if (hasSC) classes += ' has-soul-core';

    const safeSpName = (spirit.name || '').replace(/'/g, "\\'");

    const isPlayer = side === 'player';
    const isMainStep = DuelState.activePlayer === 'player' && DuelState.phases[DuelState.phaseIndex] === 'MAIN';
    let soulCoreActionBtn = '';
    if (isPlayer && isMainStep) {
      if (hasSC) {
        soulCoreActionBtn = `<button class="fsc-sc-btn remove" onclick="event.stopPropagation(); BattleArena.removeSoulCoreFromSpirit('${spirit.uid}')" title="Return Soul Core to Reserve">🔥 Remove SC</button>`;
      } else if (DuelState.player.soulCoreLocation === 'reserve') {
        soulCoreActionBtn = `<button class="fsc-sc-btn place" onclick="event.stopPropagation(); BattleArena.placeSoulCoreOnSpirit('${spirit.uid}')" title="Place Soul Core on this Spirit">🔥 Place SC</button>`;
      } else if (DuelState.player.soulCoreLocation === 'field') {
        soulCoreActionBtn = `<button class="fsc-sc-btn place" onclick="event.stopPropagation(); BattleArena.placeSoulCoreOnSpirit('${spirit.uid}')" title="Transfer Soul Core to this Spirit">🔥 Transfer SC</button>`;
      }
    }

    const normalCores = hasSC ? Math.max(0, spirit.currentCores - 1) : spirit.currentCores;
    const canAddCore = isPlayer && isMainStep && (DuelState.player.reserve > 0);
    const canRemoveCore = isPlayer && isMainStep && (normalCores > 0);

    const coresDisplay = hasSC
      ? `<span class="fsc-hex-group">${getHexCoreSvg('blue', 13)} <span class="fsc-core-num">${normalCores}</span> + ${getHexCoreSvg('soul', 13)} <span class="fsc-sc-tag">SC</span></span>`
      : `<span class="fsc-hex-group">${getHexCoreSvg('blue', 14)} <span class="fsc-core-num">${spirit.currentCores}</span></span>`;

    let coreStepperHtml = '';
    if (isPlayer && isMainStep) {
      coreStepperHtml = `
        <div class="fsc-core-stepper">
          <button class="fsc-step-btn minus" onclick="event.stopPropagation(); BattleArena.removeCoreFromSpirit('${spirit.uid}')" ${canRemoveCore ? '' : 'disabled'} title="${canRemoveCore ? (spirit.currentCores <= 1 ? 'Deplete: Remove last core & send to Trash' : 'Return 1 normal core to Reserve') : 'No normal cores on spirit'}">−</button>
          <div class="fsc-cores-display" title="${spirit.currentCores} Total Cores (${normalCores} Normal + ${hasSC ? '1 Soul Core' : '0'})">${coresDisplay}</div>
          <button class="fsc-step-btn plus" onclick="event.stopPropagation(); BattleArena.addCoreToSpirit('${spirit.uid}')" ${canAddCore ? '' : 'disabled'} title="${canAddCore ? 'Add 1 normal core from Reserve' : 'No cores left in Reserve'}">+</button>
        </div>
      `;
    } else {
      coreStepperHtml = `
        <div class="fsc-core-stepper readonly">
          <div class="fsc-cores-display full" title="${spirit.currentCores} Cores on Spirit">${coresDisplay}</div>
        </div>
      `;
    }

    const dragAttrs = isPlayer
      ? `draggable="true" data-spirit-uid="${spirit.uid}" ondragstart="BattleArena.handleFieldDragStart(event, '${spirit.uid}')" ondragover="BattleArena.handleFieldDragOver(event, '${spirit.uid}')" ondragleave="BattleArena.handleFieldDragLeave(event, '${spirit.uid}')" ondrop="BattleArena.handleFieldDrop(event, '${spirit.uid}')" ondragend="BattleArena.handleFieldDragEnd(event)"`
      : '';

    const dragHandleHtml = isPlayer
      ? `<div class="fsc-drag-handle" title="Click and drag to reposition card on the board">⋮⋮</div>`
      : '';

    const reorderButtonsHtml = isPlayer
      ? `<div class="fsc-reorder-bar">
          <button class="fsc-move-btn" onclick="event.stopPropagation(); BattleArena.moveFieldSpirit('${spirit.uid}', -1)" title="Move Spirit Left">◀</button>
          <button class="fsc-move-btn" onclick="event.stopPropagation(); BattleArena.moveFieldSpirit('${spirit.uid}', 1)" title="Move Spirit Right">▶</button>
        </div>`
      : '';

    return `
      <div class="${classes}" id="spirit_${spirit.uid}" ${dragAttrs} onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        ${dragHandleHtml}
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 13)} SOUL CORE</div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${soulCoreActionBtn}
        ${reorderButtonsHtml}
      </div>
    `;
  }

  // ── FIELD CARD REORDERING & DRAG-AND-DROP CONTROLLER ──
  let draggedSpiritUid = null;

  function handleFieldDragStart(event, spiritUid) {
    if (DuelState.activePlayer !== 'player') return;
    draggedSpiritUid = spiritUid;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', spiritUid);
      event.dataTransfer.effectAllowed = 'move';
    }
    const el = document.getElementById(`spirit_${spiritUid}`);
    if (el) el.classList.add('is-dragging');
  }

  function handleFieldDragOver(event, targetUid) {
    if (!draggedSpiritUid || draggedSpiritUid === targetUid) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const targetEl = document.getElementById(`spirit_${targetUid}`);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const relX = event.clientX - rect.left;
      if (relX < rect.width / 2) {
        targetEl.classList.add('drag-over-left');
        targetEl.classList.remove('drag-over-right');
      } else {
        targetEl.classList.add('drag-over-right');
        targetEl.classList.remove('drag-over-left');
      }
    }
  }

  function handleFieldDragLeave(event, targetUid) {
    const targetEl = document.getElementById(`spirit_${targetUid}`);
    if (targetEl) {
      targetEl.classList.remove('drag-over-left', 'drag-over-right');
    }
  }

  function handleFieldDrop(event, targetUid) {
    event.preventDefault();
    const sourceUid = draggedSpiritUid || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : null);
    handleFieldDragEnd();
    if (!sourceUid || sourceUid === targetUid) return;

    const sourceIdx = DuelState.player.field.findIndex(s => s.uid === sourceUid);
    const targetIdx = DuelState.player.field.findIndex(s => s.uid === targetUid);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const [moved] = DuelState.player.field.splice(sourceIdx, 1);
    DuelState.player.field.splice(targetIdx, 0, moved);

    AudioFX.coreChime();
    renderDuelTable();
    if (typeof showToast === 'function') {
      showToast(`↔️ Repositioned "${moved.name}" to slot ${targetIdx + 1}!`, 'info');
    }
  }

  function handleFieldDragEnd() {
    draggedSpiritUid = null;
    document.querySelectorAll('.field-spirit-card').forEach(el => {
      el.classList.remove('is-dragging', 'drag-over-left', 'drag-over-right');
    });
  }

  function moveFieldSpirit(spiritUid, delta) {
    if (DuelState.activePlayer !== 'player') return;
    const curIdx = DuelState.player.field.findIndex(s => s.uid === spiritUid);
    if (curIdx === -1) return;
    const newIdx = curIdx + delta;
    if (newIdx < 0 || newIdx >= DuelState.player.field.length) return;

    const [moved] = DuelState.player.field.splice(curIdx, 1);
    DuelState.player.field.splice(newIdx, 0, moved);

    AudioFX.coreChime();
    renderDuelTable();
  }

  let pendingSacrifice = null;

  function getPlayerAvailableCores() {
    const regularReserve = DuelState.player.reserve || 0;
    const hasSoulCoreInReserve = (DuelState.player.soulCoreLocation === 'reserve');
    const reserve = regularReserve + (hasSoulCoreInReserve ? 1 : 0);
    const fieldCores = DuelState.player.field.reduce((sum, s) => sum + (s.currentCores || 0), 0);
    return {
      reserve,
      regularReserve,
      hasSoulCoreInReserve,
      fieldCores,
      total: reserve + fieldCores
    };
  }

  function renderPlayerHand() {
    const handEl = document.getElementById('playerHand');
    if (!handEl) return;
    const isPlayerTurn = DuelState.activePlayer === 'player';
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    const isMainStep = isPlayerTurn && currentPhase === 'MAIN';
    const isAttackStep = isPlayerTurn && currentPhase === 'ATTACK';

    const { reserve, fieldCores, total: totalAvailableCores } = getPlayerAvailableCores();

    handEl.innerHTML = DuelState.player.hand.map(card => {
      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isSpirit = card.type === 'Spirit' || (card.type || '').includes('Spirit');
      const isMagic = card.type === 'Magic';
      const isNexus = (card.type || '').includes('Nexus');
      const cost = card.cost || 0;
      const totalNeeded = isSpirit ? cost + 1 : cost;

      // Strict Battle Spirits Rule: Attack step ONLY permits Flash cards!
      const canPlayStep = canPlayCardInCurrentPhase(card);
      const tributeReq = getCardTributeRequirement(card);
      const eligibleTributes = tributeReq ? getEligibleTributeSpirits(tributeReq, DuelState.player.field) : [];
      const hasTributeCondition = !tributeReq || (eligibleTributes.length > 0);
      const canAfford = canPlayStep && hasTributeCondition && (totalAvailableCores >= totalNeeded);
      const canAffordDirect = canPlayStep && (reserve >= totalNeeded);
      const needsSacrifice = canAfford && !canAffordDirect;

      let cls = `hand-card-item card-theme-${(card.color || 'red').toLowerCase()}`;
      if (isSelected) cls += ' selected-hand-card';
      if (!canPlayStep) cls += ' cannot-play-step';
      else if (!canAfford) cls += ' cannot-afford';

      let actionBtnHtml = '';
      // Burst can only be set during the MAIN step
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isMainStep && !DuelState.player.burst && isBurstCard;
      // Advent Action Button - ONLY active when step/turn timing requirements are met (Official Rule: Attack Step only, never Main Step)
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = canPerformAdvent(card, 'player');
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';

      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">🔒 Set as Burst</button>` : '';

      if (canPlayStep && isSpirit) {
        const btnLabel = isAttackStep ? '⚡ Flash Summon' : '⚡ Summon';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel}</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Summon' : 'Summon'} (${cost})</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Cast' : 'Cast'} (${cost})</button>`;
        }
      } else if (canPlayStep && isNexus && isMainStep) {
        const btnLabel = '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${btnLabel} (${cost})</button>`;
        }
      }

      const safeCardName = (card.name || '').replace(/'/g, "\\'");
      return `
        <div class="${cls}" onclick="BattleArena.selectHandCard('${card.uid}')">
          <button class="hc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeCardName}')" title="View Full Card Details">🔍</button>
          <div class="hc-cost-badge">${card.cost}</div>
          <div class="hc-img-wrap">
            <img src="${card.image_url}" alt="${card.name}" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
          </div>
          <div class="hc-info">
            <div class="hc-name">${card.name}</div>
            <div class="hc-type">${card.type} • ${card.color}</div>
          </div>
          ${actionBtnHtml}
          ${adventBtnHtml}${burstBtnHtml}
        </div>
      `;
    }).join('');
  }

  function renderClashZone() {
    const clashEl = document.getElementById('battleClashCenter');
    if (!clashEl) return;
    if (!DuelState.combatEvent) {
      clashEl.innerHTML = `
        <div class="clash-idle">
          <span class="clash-idle-icon">⚔️</span>
          <span class="clash-idle-text">${DuelState.activePlayer === 'player' ? 'Attack Step: Click a Ready Spirit on your field to strike!' : 'Opponent is preparing actions…'}</span>
        </div>
      `;
      return;
    }

    const { attacker, targetType, targetSpirit, blocker, result } = DuelState.combatEvent;
    clashEl.innerHTML = `
      <div class="clash-active-banner animate-clash">
        <div class="clash-fighter">
          <div class="cf-tag">ATTACKER</div>
          <div class="cf-name">${attacker.name}</div>
          <div class="cf-bp">${attacker.currentBp} BP (Lv${attacker.currentLevel})</div>
        </div>
        <div class="clash-vs-sword">⚔️</div>
        <div class="clash-fighter">
          <div class="cf-tag">${blocker ? 'BLOCKER' : 'TARGET'}</div>
          <div class="cf-name">${blocker ? blocker.name : (targetSpirit ? targetSpirit.name : 'Direct Life')}</div>
          <div class="cf-bp">${blocker ? `${blocker.currentBp} BP (Lv${blocker.currentLevel})` : (targetSpirit ? `${targetSpirit.currentBp} BP` : '5 Life Crystals')}</div>
        </div>
      </div>
      ${result ? `<div class="clash-result-badge">${result}</div>` : ''}
    `;
  }

  function updateActionButtons() {
    const isPlayer = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];

    const nextBtn = document.getElementById('btnNextPhase');
    if (nextBtn) {
      if (!isPlayer) {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Opponent Turn in Progress…';
      } else {
        nextBtn.disabled = false;
        if (phase === 'START') {
          nextBtn.textContent = '▶️ Begin Turn';
        } else if (phase === 'CORE') {
          nextBtn.innerHTML = `<span class="btn-hex-icon">${getHexCoreSvg('blue', 14)}</span> Take +1 Core from Void`;
        } else if (phase === 'DRAW') {
          nextBtn.textContent = '🎴 Draw 1 Card';
        } else if (phase === 'REFRESH') {
          const tCores = DuelState.player.trash;
          const hasScTrash = DuelState.player.soulCoreLocation === 'trash';
          if (tCores > 0 && hasScTrash) {
            nextBtn.textContent = `🔄 Return ${tCores} Cores + 🔥 Soul Core & Ready Spirits`;
          } else if (tCores > 0) {
            nextBtn.textContent = `🔄 Return ${tCores} Core(s) from Trash & Ready Spirits`;
          } else {
            nextBtn.textContent = '🔄 Ready All Spirits';
          }
        } else if (phase === 'MAIN') {
          if (DuelState.turn === 1) {
            nextBtn.textContent = '🛑 End Turn (Turn 1: No Attacks) →';
          } else {
            nextBtn.textContent = '⚔️ Enter Attack Step →';
          }
        } else if (phase === 'ATTACK') {
          nextBtn.textContent = '🛑 Done Attacking →';
        } else if (phase === 'END') {
          nextBtn.textContent = '🛑 Pass Turn to Opponent';
        } else {
          nextBtn.textContent = '⚡ Advance Step →';
        }
      }
    }
  }

  // ── STEP NAVIGATOR HELPERS ──
  function getPlayerStepLabel(p) {
    if (p === 'START') {
      return '✨ Begin Turn';
    } else if (p === 'CORE') {
      return `<span class="btn-hex-icon">${getHexCoreSvg('blue', 14)}</span> Take +1 Core from Void`;
    } else if (p === 'DRAW') {
      return '🎴 Draw 1 Card';
    } else if (p === 'REFRESH') {
      const tCores = (DuelState.player && DuelState.player.trash) || 0;
      const hasScTrash = DuelState.player && DuelState.player.soulCoreLocation === 'trash';
      if (tCores > 0 && hasScTrash) {
        return `🔄 Return ${tCores} Cores + 🔥 SC & Ready`;
      } else if (tCores > 0) {
        return `🔄 Return ${tCores} Core(s) & Ready Spirits`;
      } else if (hasScTrash) {
        return `🔄 Return 🔥 Soul Core & Ready`;
      } else {
        return '🔄 Ready All Spirits';
      }
    } else if (p === 'MAIN') {
      if (DuelState.turn === 1) {
        return '🛑 End Turn (Turn 1: No Attacks) →';
      } else {
        return '⚔️ Proceed to Attack Step →';
      }
    } else if (p === 'ATTACK') {
      return '🛑 Done Attacking →';
    } else if (p === 'END') {
      return '🏁 Pass Turn to Opponent';
    }
    return 'Awaiting Step...';
  }

  function getPlayerStepActionClass(p) {
    if (p === 'START') {
      return 'btn-step-action btn-step-start';
    } else if (p === 'CORE') {
      return 'btn-step-action btn-step-core';
    } else if (p === 'DRAW') {
      return 'btn-step-action btn-step-draw';
    } else if (p === 'REFRESH') {
      return 'btn-step-action btn-step-refresh';
    } else if (p === 'MAIN') {
      return DuelState.turn === 1 ? 'btn-step-action btn-step-pass' : 'btn-step-action btn-step-proceed';
    } else if (p === 'ATTACK') {
      return 'btn-step-action btn-step-proceed';
    } else if (p === 'END') {
      return 'btn-step-action btn-step-pass';
    }
    return 'btn-step-action';
  }

  function setStepButtonContent(btnEl, labelHtml, actionClass, isDisabled) {
    if (!btnEl) return;
    btnEl.disabled = isDisabled;
    if (labelHtml.includes('<')) {
      btnEl.innerHTML = labelHtml;
      if (typeof HTMLElement === 'undefined' || !(btnEl instanceof HTMLElement)) {
        btnEl.textContent = labelHtml.replace(/<[^>]*>/g, '');
      }
    } else {
      btnEl.textContent = labelHtml;
      btnEl.innerHTML = labelHtml;
    }
    btnEl.className = actionClass;
  }

  // ── STEP NAVIGATOR RENDERER ──
  function renderStepNavigator() {
    const isPlayer = DuelState.activePlayer === 'player';
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    const currentIdx = DuelState.phaseIndex;

    const navTurnTitle = document.getElementById('navTurnTitle');
    const navSubtitle = document.getElementById('navStepSubtitle');
    if (navTurnTitle) {
      navTurnTitle.textContent = isPlayer ? `Turn ${DuelState.turn} • Your Turn` : `Turn ${DuelState.turn} • Opponent's Turn`;
      navTurnTitle.style.color = isPlayer ? '#fff' : '#f87171';
    }
    if (navSubtitle) {
      navSubtitle.textContent = isPlayer ? 'Execute steps in order to advance the duel.' : 'Opponent is carrying out turn phases.';
    }

    DuelState.phases.forEach((p, idx) => {
      const cardEl = document.getElementById(`stepCard_${p}`);
      const statusEl = document.getElementById(`stepStatus_${p}`);
      const btnEl = document.getElementById(`btnStep_${p}`);
      if (!cardEl) return;

      if (isPlayer) {
        if (idx < currentIdx) {
          // Completed step in player's turn
          cardEl.className = 'step-card is-completed-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-done';
            statusEl.textContent = 'Done ✓';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, 'Step Complete ✓', 'btn-step-action btn-step-done', true);
          }
        } else if (idx === currentIdx) {
          // Currently active step in player's turn (e.g. Start Step on Turn 2)
          cardEl.className = 'step-card is-active-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-active';
            statusEl.textContent = 'Active';
          }
          if (btnEl) {
            const label = getPlayerStepLabel(p);
            const cls = getPlayerStepActionClass(p);
            setStepButtonContent(btnEl, label, cls, false);
          }
        } else {
          // Future / Pending step in player's turn (Reset cleanly from any previous turn)
          cardEl.className = 'step-card is-locked-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-pending';
            statusEl.textContent = 'Pending';
          }
          if (btnEl) {
            const label = getPlayerStepLabel(p);
            setStepButtonContent(btnEl, label, 'btn-step-action btn-step-pending', true);
          }
        }
      } else {
        // Opponent turn active
        if (idx < currentIdx) {
          cardEl.className = 'step-card is-completed-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-done';
            statusEl.textContent = 'Done ✓';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, 'Step Complete ✓', 'btn-step-action btn-step-done', true);
          }
        } else if (idx === currentIdx) {
          cardEl.className = 'step-card is-active-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-active';
            statusEl.textContent = 'AI Active';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, '⏳ Opponent AI Thinking...', 'btn-step-action btn-step-ai-thinking', true);
          }
        } else {
          cardEl.className = 'step-card is-locked-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-pending';
            statusEl.textContent = 'Pending';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, 'Awaiting Phase...', 'btn-step-action btn-step-pending', true);
          }
        }
      }
    });

    const oppControls = document.getElementById('navOpponentControls');
    if (oppControls) {
      oppControls.style.display = isPlayer ? 'none' : 'block';
    }
  }

  // ── STEP TIMING & FLASH VERIFICATION ──
  function hasFlashTiming(card) {
    if (!card || !card.effect) return false;
    const cardType = (card.type || '').toLowerCase();
    const eff = card.effect.toLowerCase();

    // 1. Nexuses NEVER have Flash timing to be deployed from Hand!
    // A Nexus can only be deployed during the MAIN step.
    // Any Flash effect on a Nexus (such as Grand Skill) is an ON-FIELD ability usable only when the Nexus is played on the field.
    if (cardType.includes('nexus')) {
      return false;
    }

    // 2. Spirits can only be summoned from Hand during Flash timing if they have Swift (神速) or an explicit Flash-summon ability
    if (cardType.includes('spirit')) {
      if (eff.includes('swift') || eff.includes('神速')) return true;
      if (/flash.*?(?:you can\s+)?summon this (?:spirit\s+)?card from (?:your\s+)?hand/i.test(card.effect)) return true;
      return false;
    }

    // 3. Magic cards have Flash timing if they have [Flash], (Flash), Flash:, or Flash -
    if (cardType === 'magic') {
      return eff.includes('[flash]') || eff.includes('(flash)') || eff.includes('flash:') || eff.includes('flash -');
    }

    // 4. Braves / Ultimates
    if (eff.includes('swift') || eff.includes('神速')) return true;
    if (/flash.*?(?:you can\s+)?summon this card from (?:your\s+)?hand/i.test(card.effect)) return true;

    return false;
  }

  function checkCardUsageRestriction(card, side = 'player') {
    if (!card || !card.effect) return { allowed: true };
    const text = (card.effect || '').toLowerCase();
    const isOurTurn = (DuelState.activePlayer === side);
    const phase = DuelState.phases[DuelState.phaseIndex];

    // 1. "can't be used on Your Turn" / "cannot be used on Your Turn" / "自分のターンでは使用できず"
    // e.g. Purple Flash's Extreme, Distant Sea's Extreme, Forbidden Extreme, Rich Harvest's Extreme, etc.
    if (text.includes("can't be used on your turn") || 
        text.includes("cannot be used on your turn") ||
        text.includes("can't be used during your turn") ||
        text.includes("cannot be used during your turn") ||
        text.includes("自分のターンでは使用できず") ||
        text.includes("usable only on opponent's turn") ||
        text.includes("usable only during opponent's turn") ||
        text.includes("can only be used on opponent's turn") ||
        text.includes("can only be used during opponent's turn") ||
        text.includes("usable only during opposing turn")) {
      if (isOurTurn) {
        return { 
          allowed: false, 
          reason: "Cannot be used on Your Turn (Opponent's Turn only)" 
        };
      }
    }

    // 2. "can only be used on your turn" / "usable only on your turn"
    if (text.includes("can only be used on your turn") ||
        text.includes("can only be used during your turn") ||
        text.includes("usable only on your turn")) {
      if (!isOurTurn) {
        return { 
          allowed: false, 
          reason: "Can only be used on Your Turn" 
        };
      }
    }

    // 3. "can't be used in Main Step" / "cannot be used in Main Step" / "Attack Step only"
    // e.g. Great Link, Abyss Break, Balmung Shot, Burst Break, God Speed, Kidzuna Blade, Thunder Branch
    if (text.includes("can't be used in main step") ||
        text.includes("cannot be used in main step") ||
        text.includes("can't be used during main step") ||
        text.includes("cannot be used during main step") ||
        text.includes("usable only in attack step") ||
        text.includes("can only be used in attack step") ||
        text.includes("can only be used during attack step")) {
      if (phase === 'MAIN') {
        return { 
          allowed: false, 
          reason: "Cannot be used in Main Step (Attack Step only)" 
        };
      }
    }

    // 4. "can't be used in Attack Step" / "cannot be used in Attack Step" / "Main Step only"
    if (text.includes("can't be used in attack step") ||
        text.includes("cannot be used in attack step") ||
        text.includes("can't be used during attack step") ||
        text.includes("cannot be used during attack step") ||
        text.includes("can only be used in main step") ||
        text.includes("usable only in main step") ||
        text.includes("can only be used during main step")) {
      if (phase === 'ATTACK') {
        return { 
          allowed: false, 
          reason: "Cannot be used in Attack Step (Main Step only)" 
        };
      }
    }

    // 5. "can only be used during Opponent's Attack Step" / "Opposing Attack Step"
    if (text.includes("only be used during opponent's attack step") ||
        text.includes("only be used in opponent's attack step") ||
        text.includes("only be used in opposing attack step") ||
        text.includes("usable only in opposing attack step") ||
        text.includes("usable only in opponent's attack step")) {
      if (phase !== 'ATTACK' || isOurTurn) {
        return { 
          allowed: false, 
          reason: "Can only be used in Opponent's Attack Step" 
        };
      }
    }

    // 6. "can only be used during your Attack Step"
    if (text.includes("only be used during your attack step") ||
        text.includes("only be used in your attack step") ||
        text.includes("usable only in your attack step")) {
      if (phase !== 'ATTACK' || !isOurTurn) {
        return { 
          allowed: false, 
          reason: "Can only be used in Your Attack Step" 
        };
      }
    }

    return { allowed: true };
  }

  function canPlayCardInCurrentPhase(card, side = 'player') {
    if (!card) return false;
    const isOurTurn = (DuelState.activePlayer === side);
    const currentPhase = DuelState.phases[DuelState.phaseIndex];

    // Check card-specific text restrictions first!
    const rest = checkCardUsageRestriction(card, side);
    if (!rest.allowed) return false;

    if (currentPhase === 'MAIN') {
      if (!isOurTurn) return false;
      return true; // Main step allows summoning spirits & casting magic
    }
    if (currentPhase === 'ATTACK') {
      // Official Rule: Attack Step ONLY allows cards with [Flash] timing!
      return hasFlashTiming(card);
    }
    return false; // Other steps (Start, Core, Draw, Refresh, End) do not allow card plays
  }

  // ── PLAYER ACTIONS & CARD INSPECTION ──
  function formatEffectKeywords(text) {
    if (!text) return '<span style="color:var(--muted);font-style:italic;">No special abilities or keywords.</span>';
    let safe = (window.esc ? window.esc(text) : String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;'));

    // 1. Highlight Level tags like [LV1], [LV2][LV3], LV1-LV3
    safe = safe.replace(/\[(LV\d+(?:[-~]LV\d+)*)\]/gi, '<span class="effect-keyword-pill kw-level">[$1]</span>');

    // 2. Highlight Timing and Step triggers like (When Attacks), (When Summoned), (When Advents), etc.
    safe = safe.replace(/\((When Attacks(?:\/[^)]+)?|When Summoned(?:\/[^)]+)?|When Advents(?:\/[^)]+)?|When Battles(?:\/[^)]+)?|When Blocks(?:\/[^)]+)?|When Manifests(?:\/[^)]+)?|When Reborn(?:\/[^)]+)?|When Destroyed(?:\/[^)]+)?|When Brave Attacks(?:\/[^)]+)?|After Your Burst Activates|After a Burst Activates|After your Burst activates|After an? opposing [^)]+|Twinkle Necromancy|Your Attack Step|Opponent's Attack Step|Opposing Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\)/gi, (match) => {
      return `<span class="effect-keyword-pill kw-timing">${match}</span>`;
    });

    // 3. Highlight Flash - [Advent: ...]
    safe = safe.replace(/Flash\s*-\s*\[Advent:\s*([^\]]+)\]/gi, (match) => {
      return `<span class="effect-keyword-pill kw-advent">${match}</span>`;
    });

    // 4. Highlight all 102 Official Battle Spirits Wiki Keywords + bracketed effects
    const allKwPattern = /\[(A\.T\.\s*Field|Accel|Advent(?::[^\]]+)?|Amplify|Appeal|Armed Intervention|Armor(?::[^\]]+)?|Assault(?::\s*\d+)?|Assemble|Awaken|Barrage|Bombardment|Brilliance|Buddy|Bunshin|Burst(?::[^\]]+)?|Bushido|Cast Off|Catalyze|Change|Charge|Clash|Clock Up|Consecutive Blade|Contract Armor|Contract Awaken|Contract Unleash|Core Charge|Count Break|Crush|Curse|Dispersion|Diva Rush|Double Drive|Draw Lock|Emperor Road|Fast Draw|Fierce Windstorm|Flashing Swift|Fortress|Friend|God Strike|Grand Assault|Grand Field|Grand Ice Wall|Grand Skill|Grandphosis|Great Assault|Great Crush|Heavenly Light|Heavy Armor(?::[^\]]+)?|High Speed|Holy Life|Ice Wall(?::[^\]]+)?|Immortality(?::[^\]]+)?|Infinite Blade|Infinite Flame|Kagemusha|Leap|Level Up|Manifest|Mirage(?::[^\]]+)?|My Unit|NT-D|On Stage|Plunder|Poison Blade|PS Armor|Pursuit|Rebirth|Reload|Resonance|Revive|Rush|Seal|Shamanism|Show Up|Six Heaven Rush|Soar|Solo Part|Soul Awaken|Soul Drive|Soul Magic|Sound Speed|Spellbind|Spirit Soul|Stampede|Super Boost|Super Unleash|Supreme Clash|Tribute(?::[^\]]+)?|Trigger Counter|True-Awaken|True-Clash|True-Curse|Twinkle(?::[^\]]+)?|Ultra Armor(?::[^\]]+)?|Ultra Holy Life|Unleash|Unsheathe|Windstorm(?::\s*\d+)?|Zero Counter|Soul Core(?::[^\]]+)?|Flash|Twinkle Necromancy)\]/gi;

    safe = safe.replace(allKwPattern, (match) => {
      let cls = 'kw-generic';
      const low = match.toLowerCase();
      if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
      else if (low.includes('clash')) cls = 'kw-clash';
      else if (low.includes('curse')) cls = 'kw-curse';
      else if (low.includes('crush')) cls = 'kw-crush';
      else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
      else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
      else if (low.includes('assault')) cls = 'kw-assault';
      else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
      else if (low.includes('awaken')) cls = 'kw-awaken';
      else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
      else if (low.includes('soul drive')) cls = 'kw-souldrive';
      else if (low.includes('soul core')) cls = 'kw-soul-core';
      else if (low.includes('ice wall')) cls = 'kw-icewall';
      else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
      else if (low.includes('burst')) cls = 'kw-burst';
      else if (low.includes('flash')) cls = 'kw-flash';
      else if (low.includes('tribute')) cls = 'kw-tribute';
      else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
      else if (low.includes('mirage')) cls = 'kw-mirage';
      else if (low.includes('spellbind')) cls = 'kw-spellbind';
      else if (low.includes('accel')) cls = 'kw-accel';
      else if (low.includes('change')) cls = 'kw-change';
      else if (low.includes('charge')) cls = 'kw-charge';
      else if (low.includes('rush')) cls = 'kw-rush';
      else if (low.includes('rebirth')) cls = 'kw-rebirth';
      else if (low.includes('unleash')) cls = 'kw-unleash';
      else if (low.includes('grand')) cls = 'kw-grand';
      return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
    });
    return safe;
  }

  function renderCardInspector() {
    const inspectorEl = document.getElementById('cardInspectorTray');
    if (!inspectorEl) return;

    const card = DuelState.selectedPlayerCard;
    if (!card) {
      inspectorEl.innerHTML = `
        <div class="inspector-placeholder">
          <div class="inspector-placeholder-icon">🎴</div>
          <div class="inspector-placeholder-text">
            <div class="inspector-placeholder-title">Card Details Inspector</div>
            <div class="inspector-placeholder-desc">Click any card in your hand or spirit on the battlefield to inspect complete effects, level requirements, BP, and keywords.</div>
          </div>
        </div>
      `;
      return;
    }

    const isSpirit = card.type === 'Spirit' || (card.type || '').includes('Spirit');
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');
    const cost = card.cost !== undefined ? card.cost : 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;

    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = canPlayCardInCurrentPhase(card);

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && (available.total >= totalNeeded);

    // Levels breakdown HTML
    let levelsHtml = '';
    if (card.levels && Array.isArray(card.levels) && card.levels.length) {
      levelsHtml = `
        <div class="inspector-levels-table">
          ${card.levels.map(l => `
            <div class="inspector-level-pill">
              <span class="ilp-lvl">LV${l.level}</span>
              <span class="ilp-cores">🔮 ${l.cores} ${l.cores === 1 ? 'core' : 'cores'}</span>
              <span class="ilp-bp">⚡ ${l.bp} BP</span>
            </div>
          `).join('')}
        </div>
      `;
    } else if (card.raw_levels) {
      levelsHtml = `<div class="inspector-level-pill" style="margin:0.2rem 0;font-size:0.7rem;">${card.raw_levels}</div>`;
    }

    const safeName = (card.name || '').replace(/'/g, "\\'");
    const effectHtml = formatEffectKeywords(card.effect || card.summary || '');

    // Action button
    let actionBtnHtml = '';
    const isInHand = (DuelState.player.hand || []).some(c => c.uid === card.uid);
    const isSetBurst = DuelState.player.burst && card.uid === DuelState.player.burst.uid;
    const isBurstCard = card.effect && card.effect.includes('[Burst:');
    const canSetBurst = isInHand && isPlayerTurn && !DuelState.player.burst && isBurstCard;
    const burstBtnHtml = canSetBurst ? `
      <button class="btn-inspector-action btn-inspect-burst" onclick="BattleArena.setBurst('${card.uid}')">
        🔒 Set as Burst
      </button>
    ` : '';

    if (isSetBurst) {
      const cond = parseBurstCondition(card.effect);
      const isReady = DuelState.activeBurstTrigger && DuelState.activeBurstTrigger.side === 'player';
      if (isReady) {
        actionBtnHtml = `
          <button class="btn-inspector-action btn-inspect-burst-trigger" onclick="BattleArena.confirmBurstTrigger()">
            ⚡ Trigger Burst Now (${cond.label})
          </button>
        `;
      } else {
        actionBtnHtml = `
          <button class="btn-inspector-action btn-inspect-disabled" disabled title="Locked: Trigger condition is &quot;${cond.label}&quot;. Only activates when this condition occurs in battle.">
            🔒 Burst Locked: ${cond.label}
          </button>
        `;
      }
    } else if (isInHand) {
      if (canPlayStep && isSpirit) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Summon (${cost})` : `⚡ Summon Spirit (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonCard('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnText = (phase === 'ATTACK') ? `✨ Flash Cast (${cost})` : `✨ Cast Magic (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Cast (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
        }
      } else if (canPlayStep && isNexus) {
        const btnText = (phase === 'ATTACK') ? `🏛️ Flash Deploy Nexus (${cost})` : `🏛️ Deploy Nexus (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="BattleArena.deployNexus('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Deploy (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
        }
      } else if (!canPlayStep) {
        const rest = checkCardUsageRestriction(card, 'player');
        if (!rest.allowed) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="${rest.reason}">🚫 ${rest.reason}</button>`;
        } else if (phase === 'ATTACK') {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Normal cards without [Flash] cannot be played in Attack Step">⚔️ Main Step Only (No Flash)</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Cannot Play in ${phase} Step</button>`;
        }
      }

      // Check Advent in inspector
      const adventReq = getCardAdventRequirement(card);
      if (adventReq) {
        if (canPerformAdvent(card, 'player')) {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-advent" onclick="BattleArena.openAdventPrompt('${card.uid}')">🌟 Advent (${adventReq.timingLabel})</button>`;
        } else if (!isAdventTimingValid(adventReq, 'player')) {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Advent timing is ${adventReq.timingLabel}">⚔️ Advent: ${adventReq.timingLabel} Only</button>`;
        } else if (DuelState.player.soulCoreLocation === 'trash') {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Advent requires your [Soul Core], but it is in Trash">⚠️ Advent: Soul Core in Trash</button>`;
        } else {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-disabled" disabled title="No eligible field Spirit satisfies [Advent: ${adventReq.condText}]">⚠️ Advent: No Target (${adventReq.condText})</button>`;
        }
      }
    } else {
      // On battlefield spirit
      const isPlayerSpirit = (DuelState.player.field || []).some(s => s.uid === card.uid);
      const isMainStep = isPlayerTurn && phase === 'MAIN';
      let scBtn = '';
      if (isPlayerSpirit && isMainStep) {
        if (card.hasSoulCore) {
          scBtn = `<button class="btn-inspector-action btn-remove-soul-core" onclick="BattleArena.removeSoulCoreFromSpirit('${card.uid}')">🔥 Return Soul Core to Reserve</button>`;
        } else if (DuelState.player.soulCoreLocation === 'reserve') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Place Soul Core on this Spirit</button>`;
        } else if (DuelState.player.soulCoreLocation === 'field') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Transfer Soul Core to this Spirit</button>`;
        }
      }
      actionBtnHtml = `
        <div style="font-size:0.75rem;text-align:center;color:#60a5fa;font-weight:700;padding:0.2rem 0;">
          ⚔️ Current BP: ${card.currentBp || card.bp || '—'} BP (LV${card.currentLevel || 1})
          ${card.hasSoulCore ? ' • <span style="color:#f59e0b;font-weight:800;">🔥 SOUL CORE ACTIVE</span>' : ''}
        </div>
        ${scBtn}
      `;
    }

    const cardColor = (card.color || 'Red').toLowerCase();

    inspectorEl.innerHTML = `
      <div class="inspector-card-view card-theme-${cardColor}">
        <!-- Left: Card Artwork Thumbnail & Enlarge -->
        <div class="inspector-art-col">
          <div class="inspector-art-wrap">
            <img src="${card.image_url}" alt="${card.name}" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
          </div>
          <button class="btn-inspector-zoom" onclick="openCardDetail('${safeName}')" title="Open Fullscreen Card Modal">
            🔍 Enlarge
          </button>
        </div>

        <!-- Middle: Card Metadata, Levels & Effect -->
        <div class="inspector-info-col">
          <div class="inspector-header">
            <div class="inspector-title-row">
              <span class="inspector-card-name">${card.name}</span>
              ${card.kanji ? `<span class="inspector-jp-name">${card.kanji}</span>` : ''}
            </div>
            <button class="btn-inspector-close" onclick="BattleArena.deselectCard()" title="Close details tray">&times;</button>
          </div>

          <div class="inspector-badges-row">
            <span class="badge badge-cost">Cost ${cost}</span>
            <span class="badge badge-color-${cardColor} badge-color">${card.color || 'Neutral'}</span>
            <span class="badge badge-type">${card.type || 'Spirit'}</span>
            ${card.family ? `<span class="badge badge-family">${card.family}</span>` : ''}
            ${card.card_number ? `<span class="badge badge-number"># ${card.card_number}</span>` : ''}
            ${card.rarity ? `<span class="badge badge-rarity">${card.rarity}</span>` : ''}
          </div>

          ${levelsHtml}

          <div class="inspector-effect-wrapper">
            <div class="inspector-section-label">Effect &amp; Abilities:</div>
            <div class="inspector-effect-content">${effectHtml}</div>
          </div>

          ${card.flavor ? `
            <div class="inspector-flavor-content">"${card.flavor}"</div>
          ` : ''}
        </div>

        <!-- Right: Action Buttons -->
        <div class="inspector-actions-col">
          <div class="inspector-actions-title">Duel Actions</div>
          ${actionBtnHtml}
          ${burstBtnHtml}
          <button class="btn-inspector-action btn-inspect-modal" onclick="openCardDetail('${safeName}')">
            📖 Card Details Modal
          </button>
          <button class="btn-inspector-action btn-inspect-cancel" onclick="BattleArena.deselectCard()">
            ✕ Dismiss
          </button>
        </div>
      </div>
    `;
  }

  function selectHandCard(uid) {
    const card = DuelState.player.hand.find(c => c.uid === uid);
    if (!card) return;
    DuelState.selectedPlayerCard = card;
    AudioFX.buttonTick();
    renderPlayerHand();
    renderCardInspector();
    openCardDetail(card.name);
  }

  function deselectCard() {
    DuelState.selectedPlayerCard = null;
    renderPlayerHand();
    renderCardInspector();
  }


  // ==========================================================================
  // UNIVERSAL CARD EFFECT ENGINE (TRIGGERS & ACTIONS)
  // Handles (When Summoned), (When Attacks), (When Blocks), (When Destroyed),
  // and BP Comparison across all 14,000+ Battle Spirits cards.
  // ==========================================================================

  function parseEffectLevelRequirement(tagStr) {
    if (!tagStr) return [1, 2, 3, 4, 5];
    const matches = tagStr.match(/\[LV(\d+)\]/gi);
    if (matches && matches.length) {
      return matches.map(m => parseInt(m.replace(/\D/g, ''), 10));
    }
    const rangeM = tagStr.match(/LV(\d+)[-~]LV(\d+)/i);
    if (rangeM) {
      const start = parseInt(rangeM[1], 10);
      const end = parseInt(rangeM[2], 10);
      const res = [];
      for (let i = start; i <= end; i++) res.push(i);
      return res;
    }
    const singleM = tagStr.match(/LV(\d+)/i);
    if (singleM) {
      return [parseInt(singleM[1], 10)];
    }
    return [1, 2, 3, 4, 5];
  }

  function isEffectLevelMet(tagStr, currentLevel) {
    const req = parseEffectLevelRequirement(tagStr);
    return req.includes(currentLevel);
  }

  function getCardAbilityBlocks(cardEffect) {
    if (!cardEffect) return [];
    const rawBlocks = cardEffect.split(/(?=\n\s*(?:\[LV\d+\]|LV\d+))/i);
    return rawBlocks.map(b => b.trim()).filter(Boolean);
  }

  function parseWordNumber(val, defaultVal = 1) {
    if (!val) return defaultVal;
    const s = val.toLowerCase().trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const map = {
      'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    return map[s] !== undefined ? map[s] : defaultVal;
  }

  // ── UNIVERSAL CARD ABILITY DISPATCHER ──
  // Resolves core abilities across all 14,500+ cards for all triggers: SUMMON, ATTACK, BLOCK, DESTROYED, ADVENT, MAGIC
  function executeAbilityActions(bodyText, card, side = 'player', triggerName = 'SUMMON', context = {}) {
    if (!bodyText || !card) return;
    const bodyLower = bodyText.toLowerCase();
    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const myTrash = (isPlayer ? (DuelState.player.trashCards || DuelState.player.trash) : (DuelState.opponent.trashCards || DuelState.opponent.trash)) || [];

    // 1. UNBLOCKABLE STATUS
    if (/this spirit can't be blocked|this spirit cannot be blocked|cannot be blocked by opposing|can't be blocked by opposing/i.test(bodyLower)) {
      card.cantBeBlocked = true;
      addLog(`⚡ **[UNBLOCKABLE: ${card.name}]**: This Spirit cannot be blocked!`, 'damage');
    }

    // 2. OPPONENT SACRIFICE DESTRUCTION
    if (/the opponent destroys a (?:spirit|ultimate)(?:\s+they\s+control)?|opponent destroys a (?:spirit|ultimate)/i.test(bodyLower)) {
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
        const sacrificed = enemyField.shift();
        enemyReserve.reserve += sacrificed.currentCores;
        handleDestroyedSpiritCores(sacrificed, enemySide);
        sendToTrash(sacrificed, enemySide, `Sacrificed due to ${card.name} (${triggerName})`);
        AudioFX.slash();
        addLog(`💀 **[SACRIFICE RESOLUTION: ${card.name}]**: Opponent was forced to destroy their own "${sacrificed.name}" (${sacrificed.currentBp} BP)! Cores moved to reserve.`, 'kill');
        if (typeof showToast === 'function') {
          showToast(`💀 Opponent sacrificed "${sacrificed.name}"!`, 'success');
        }
      }
    }

    // 3. DESTROY EXHAUSTED OPPOSING SPIRIT
    if (/destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+(?:spirit|ultimate)/i.test(bodyLower)) {
      const exhausted = enemyField.filter(s => s.isExhausted);
      if (exhausted.length > 0) {
        exhausted.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = exhausted[0];
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) {
          const dest = enemyField.splice(tIdx, 1)[0];
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[EXHAUSTED DESTRUCTION: ${card.name}]**: Destroyed opposing exhausted "${dest.name}" (${dest.currentBp} BP)! Cores returned to reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed exhausted "${dest.name}"!`, 'success');
        }
      }
    }
    // 4. DESTROY OPPOSING SPIRIT BY BP
    else if (/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(?:spirit|ultimate)/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(?:spirit|ultimate)/i);
      const maxBp = parseInt(match[1], 10);
      const eligible = enemyField.filter(s => (s.currentBp || 0) <= maxBp);
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const dest = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === dest.uid);
        if (tIdx !== -1) {
          enemyField.splice(tIdx, 1);
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[BP DESTRUCTION: ${card.name}]**: Destroyed opposing "${dest.name}" (${dest.currentBp} BP <= ${maxBp} BP)! Cores returned to enemy reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed "${dest.name}" (<= ${maxBp} BP)!`, 'success');
        }
      }
    }
    // 5. DESTROY OPPOSING SPIRIT BY COST OR UNCONDITIONAL
    else if (/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(?:cost\s*(\d+)\s*or\s*(less|more)\s+)?(?:spirit|ultimate)/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(?:cost\s*(\d+)\s*or\s*(less|more)\s+)?(?:spirit|ultimate)/i);
      const targetCost = match[1] ? parseInt(match[1], 10) : null;
      const isLess = match[2] ? match[2].toLowerCase() === 'less' : true;

      let eligible = enemyField;
      if (targetCost !== null) {
        eligible = enemyField.filter(s => isLess ? (s.cost || 0) <= targetCost : (s.cost || 0) >= targetCost);
      }
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const dest = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === dest.uid);
        if (tIdx !== -1) {
          enemyField.splice(tIdx, 1);
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[DESTRUCTION: ${card.name}]**: Destroyed opposing "${dest.name}" (Cost ${dest.cost}, ${dest.currentBp} BP)! Cores returned to enemy reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed "${dest.name}"!`, 'success');

          // Alexander / Cost-based deck mill
          if (/discard a number of cards from the opposing decktop equal to the cost/i.test(bodyLower) || card.name.includes('Alexander')) {
            const destCost = dest.cost !== undefined ? dest.cost : 1;
            let milled = 0;
            const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
            for (let m = 0; m < destCost; m++) {
              const c = enemyDeck.shift();
              if (c) {
                sendToTrash(c, enemySide, `Milled by ${card.name} equal to destroyed cost (${destCost})`);
                milled++;
              }
            }
            if (milled > 0) {
              addLog(`🌊 **[ALEXANDER CRUSH: ${card.name}]**: Discarded ${milled} card(s) from enemy decktop equal to destroyed spirit's cost!`, 'kill');
            }
          }
        }
      }
    }

    // 6. CORE REMOVAL TO RESERVE OR TRASH (DEPLETION)
    // 28. SEND ALL CORES FROM EVERY OPPOSING SPIRIT/ULTIMATE TO RESERVE (e.g. Purple Flash's Extreme)
    if (/send all cores from every opposing (?:spirit|ultimate|spirit\/ultimate).*?to (?:the|their) reserve/i.test(bodyLower)) {
      let totalCoresMoved = 0;
      const depletedSpirits = [];
      for (let i = enemyField.length - 1; i >= 0; i--) {
        const s = enemyField[i];
        const coresOnS = s.currentCores;
        s.currentCores = 0;
        enemyReserve.reserve += coresOnS;
        totalCoresMoved += coresOnS;
        depletedSpirits.push(s.name);
        enemyField.splice(i, 1);
        handleDestroyedSpiritCores(s, enemySide);
        sendToTrash(s, enemySide, `Depleted to 0 cores by ${card.name} (${triggerName})`);
      }
      AudioFX.slash();
      addLog(`🔮💥 **[VOID EXTINCTION: ${card.name}]**: Sent all ${totalCoresMoved} core(s) from every opposing Spirit/Ultimate to their Reserve! Depleted and destroyed: ${depletedSpirits.join(', ')}!`, 'kill');
      if (typeof showToast === 'function') {
        showToast(`🔮 Sent all ${totalCoresMoved} enemy cores to Reserve!`, 'success');
      }
    }

    // 29. DISCARD PRE-ADVENT CARD TO SEND OPPOSING CORES TO VOID (e.g. The MakaiKnight Shazworth)
    if (/discarding one of this spirit's ["']?([^"']+)["']?-named pre-advent cards.*?send (?:two|\d+) cores.*?to the void/i.test(bodyLower)) {
      const matchFam = bodyLower.match(/discarding one of this spirit's ["']?([^"']+)["']?-named pre-advent cards/i);
      const reqName = matchFam ? matchFam[1].toLowerCase() : 'sevenshogun';
      const underlying = card.underlyingCards || [];
      const matchIdx = underlying.findIndex(u => (u.name || '').toLowerCase().includes(reqName) || (u.family || '').toLowerCase().includes(reqName));
      if (matchIdx !== -1) {
        const discarded = underlying.splice(matchIdx, 1)[0];
        myTrash.push(discarded);
        let voided = 0;
        for (let i = enemyField.length - 1; i >= 0 && voided < 2; i--) {
          const s = enemyField[i];
          if (s.currentCores > 0) {
            const take = Math.min(2 - voided, s.currentCores);
            s.currentCores -= take;
            voided += take;
            if (s.currentCores <= 0) {
              enemyField.splice(i, 1);
              handleDestroyedSpiritCores(s, enemySide);
              sendToTrash(s, enemySide, `Depleted by ${card.name}`);
            }
          }
        }
        AudioFX.coreChime();
        addLog(`🌌 **[VOID SENT: ${card.name}]**: Discarded pre-advent "${discarded.name}" and sent ${voided} opposing core(s) to the Void!`, 'magic');
      }
    }

    if (/send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:an|any|one|\d+)?\s*opposing\s+(?:spirit|ultimate|nexus).*?to\s+(?:the\s+|their\s+)?(reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:an|any|one|\d+)?\s*opposing\s+(?:spirit|ultimate|nexus).*?to\s+(?:the\s+|their\s+)?(reserve|trash)/i);
      const count = parseWordNumber(match[1]);
      const dest = match[2].toLowerCase();

      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = enemyField[0];
        const coresToRemove = Math.min(count, target.currentCores);
        target.currentCores -= coresToRemove;

        if (dest === 'trash') {
          enemyReserve.trashCores = (enemyReserve.trashCores || 0) + coresToRemove;
        } else {
          enemyReserve.reserve += coresToRemove;
        }

        AudioFX.coreChime();
        addLog(`🔮 **[CORE DEPLETION: ${card.name}]**: Sent ${coresToRemove} core(s) from opposing "${target.name}" to their ${dest}!`, 'magic');

        if (target.currentCores <= 0) {
          const tIdx = enemyField.findIndex(s => s.uid === target.uid);
          if (tIdx !== -1) enemyField.splice(tIdx, 1);
          handleDestroyedSpiritCores(target, enemySide);
          sendToTrash(target, enemySide, `Depleted by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[DEPLETED!]**: Opposing "${target.name}" was left with 0 cores and sent to Trash!`, 'kill');

          if (/when this effect depletes|when depleted/i.test(bodyLower) && /draw\s+(a|an|one|two|three|\d+)\s+cards?/i.test(bodyLower)) {
            const mDraw = bodyLower.match(/draw\s+(a|an|one|two|three|\d+)\s+cards?/i);
            const numDraw = parseWordNumber(mDraw[1]);
            let bonusDrawn = 0;
            for (let d = 0; d < numDraw; d++) {
              const c = myDeck.shift();
              if (c) { myHand.push(c); bonusDrawn++; }
            }
            if (bonusDrawn > 0) {
              addLog(`🎴 **[DEPLETION BONUS: ${card.name}]**: Drew +${bonusDrawn} card(s) from deck!`, 'step');
              if (typeof showToast === 'function') showToast(`Drew +${bonusDrawn} cards on depletion!`, 'info');
            }
          }
        } else {
          const { level: tLvl, bp: tBp } = calculateBpAndLevel(target.levels, target.currentCores, !!target.hasSoulCore, target.effect);
          target.currentLevel = tLvl;
          target.currentBp = tBp;
        }
      }
    }

    // 7. VOID CORE BOOST TO THIS SPIRIT (or Kingtaurus aura)
    if (/for each other spirit you control.*?put a core from the void to this spirit/i.test(bodyLower)) {
      const otherSpirits = myField.filter(s => s.uid !== card.uid).length;
      if (otherSpirits > 0) {
        card.currentCores += otherSpirits;
        const { level: newLvl, bp: newBp } = calculateBpAndLevel(card.levels, card.currentCores, !!card.hasSoulCore, card.effect);
        card.currentLevel = newLvl;
        card.currentBp = newBp;
        AudioFX.summon();
        addLog(`⚡ **[VOID BOOST: ${card.name}]**: Channeled presence of ${otherSpirits} allied Spirit(s)! Added +${otherSpirits} Void Cores to "${card.name}" (now Lv${newLvl}, ${newBp} BP)!`, 'magic');
      }
    } else if (/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+this\s+spirit/i.test(bodyLower) && !/for each (?:spirit|other spirit) depleted/i.test(bodyLower)) {
      const match = bodyLower.match(/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+this\s+spirit/i);
      const count = parseWordNumber(match[1]);
      card.currentCores = (card.currentCores || 0) + count;
      const { level: newLvl, bp: newBp } = calculateBpAndLevel(card.levels, card.currentCores, !!card.hasSoulCore, card.effect);
      card.currentLevel = newLvl;
      card.currentBp = newBp;
      AudioFX.summon();
      addLog(`✨ **[VOID BOOST: ${card.name}]**: Claimed +${count} Core(s) from the Void onto "${card.name}" (now Lv${newLvl}, ${newBp} BP)!`, 'magic');
      if (typeof showToast === 'function') showToast(`+${count} Core(s) from Void onto ${card.name}!`, 'success');
    }

    // 8. VOID CORE BOOST TO RESERVE
    if (/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+(?:your\s+)?reserve/i.test(bodyLower)) {
      const match = bodyLower.match(/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+(?:your\s+)?reserve/i);
      const count = parseWordNumber(match[1]);
      myReserve.reserve += count;
      AudioFX.coreChime();
      addLog(`✨ **[VOID BOOST: ${card.name}]**: Placed +${count} Core(s) from Void to Reserve!`, 'magic');
      if (typeof showToast === 'function') showToast(`+${count} Core(s) to Reserve!`, 'success');
    }

    // 9. LIFE RECOVERY / HOLY LIFE
    if (/put\s+(a|an|one|two|\d+)?\s*cores?\s+from\s+(?:the\s+)?(?:void|reserve)\s+to\s+(?:your\s+)?life/i.test(bodyLower)) {
      const match = bodyLower.match(/put\s+(a|an|one|two|\d+)?\s*cores?\s+from\s+(?:the\s+)?(?:void|reserve)\s+to\s+(?:your\s+)?life/i);
      const count = match && match[1] ? parseWordNumber(match[1]) : 1;
      const healed = Math.min(count, 5 - myReserve.life);
      if (healed > 0) {
        myReserve.life += healed;
        AudioFX.coreChime();
        addLog(`💖 **[LIFE RECOVERY: ${card.name}]**: Recovered +${healed} Life Core(s) (Life: ${myReserve.life})!`, 'magic');
        if (typeof showToast === 'function') showToast(`+${healed} Life Core(s) Recovered!`, 'success');
      }
    }

    // 10. DRAW CARDS (when not part of unfulfilled condition)
    if (/draw\s+(a|an|one|two|three|\d+)\s+cards?/i.test(bodyLower) && !/when this effect depletes/i.test(bodyLower)) {
      const match = bodyLower.match(/draw\s+(a|an|one|two|three|\d+)\s+cards?/i);
      const count = parseWordNumber(match[1]);
      let drawn = 0;
      for (let i = 0; i < count; i++) {
        const c = myDeck.shift();
        if (c) { myHand.push(c); drawn++; }
      }
      if (drawn > 0) {
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🎴 **[DRAW EFFECT: ${card.name}]**: Drew ${drawn} card(s) from deck into Hand!`, 'step');
        if (typeof showToast === 'function') showToast(`Drew ${drawn} card(s)!`, 'info');
      }
    }

    // 11. EXHAUST OPPOSING SPIRIT
    if (/exhaust\s+(an?|one|\d+)?\s*opposing\s+spirit/i.test(bodyLower)) {
      const ready = enemyField.filter(s => !s.isExhausted);
      if (ready.length > 0) {
        ready.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        ready[0].isExhausted = true;
        AudioFX.shield();
        addLog(`🛡️ **[EXHAUST EFFECT: ${card.name}]**: Exhausted opposing "${ready[0].name}"!`, 'magic');
        if (typeof showToast === 'function') showToast(`Exhausted "${ready[0].name}"!`, 'info');
      }
    }

    // 12. REFRESH SPIRIT
    if (/refresh\s+(this\s+spirit|a\s+spirit\s+you\s+control|an?\s+allied\s+spirit|one\s+spirit)/i.test(bodyLower)) {
      if (/refresh\s+this\s+spirit/i.test(bodyLower)) {
        card.isExhausted = false;
        AudioFX.shield();
        addLog(`🔄 **[REFRESH: ${card.name}]**: Refreshed "${card.name}" to Ready!`, 'magic');
      } else {
        const exhausted = myField.filter(s => s.isExhausted);
        if (exhausted.length > 0) {
          exhausted[0].isExhausted = false;
          AudioFX.shield();
          addLog(`🔄 **[REFRESH: ${card.name}]**: Refreshed allied "${exhausted[0].name}" to Ready!`, 'magic');
        }
      }
    }

    // 13. BOUNCE TO HAND
    if (/return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?hand/i.test(bodyLower)) {
      const enemyHand = enemySide === 'player' ? DuelState.player.hand : DuelState.opponent.hand;
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.cost || 0) - (a.cost || 0));
        const target = enemyField.shift();
        enemyReserve.reserve += target.currentCores;
        target.currentCores = 0;
        enemyHand.push(target);
        AudioFX.slash();
        addLog(`↩️ **[BOUNCE TO HAND: ${card.name}]**: Returned opposing "${target.name}" to their Hand! Cores moved to reserve.`, 'magic');
        if (typeof showToast === 'function') showToast(`Returned "${target.name}" to Hand!`, 'info');
      }
    }

    // 14. BOUNCE TO DECK
    if (/return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?(?:top|bottom\s+of\s+the\s+)?deck/i.test(bodyLower)) {
      const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.cost || 0) - (a.cost || 0));
        const target = enemyField.shift();
        enemyReserve.reserve += target.currentCores;
        target.currentCores = 0;
        enemyDeck.push(target);
        AudioFX.slash();
        addLog(`🌀 **[BOUNCE TO DECK: ${card.name}]**: Sent opposing "${target.name}" to the bottom of their Deck!`, 'magic');
        if (typeof showToast === 'function') showToast(`Sent "${target.name}" to Deck!`, 'info');
      }
    }

    // 15. BP BOOST
    if (/(?:this spirit\s+)?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i.test(bodyLower) ||
        /for each.*?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i.test(bodyLower) ||
        /(?:gets?|gains?)\s*\+(\d+)[\s]*bp.*?for each/i.test(bodyLower) ||
        /during this battle.*?\+(\d+)[\s]*bp/i.test(bodyLower) ||
        /\+(\d+)[\s]*bp.*?during this battle/i.test(bodyLower)) {
      
      let boost = 0;
      const famMatch = bodyLower.match(/for each\s+["']?(\w+)["']?\s+(?:family\s+)?spirit.*?gains?\s*\+(\d+)[\s]*bp/i);
      const oppUnexMatch = bodyLower.match(/(?:gets?|gains?)\s*\+(\d+)[\s]*bp\s+for each\s+unexhausted spirit/i);
      const arcanaMatch = bodyLower.match(/for each\s+["']?arcana["']?-named spirit.*?gains?\s*\+(\d+)[\s]*bp/i);
      
      if (famMatch) {
        const famName = famMatch[1].toLowerCase();
        const perCount = parseInt(famMatch[2], 10);
        const matchingSpirits = myField.filter(s => ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '')).toLowerCase().includes(famName));
        boost = matchingSpirits.length * perCount;
      } else if (oppUnexMatch) {
        const perCount = parseInt(oppUnexMatch[1], 10);
        const unexCount = enemyField.filter(s => !s.isExhausted).length;
        boost = unexCount * perCount;
      } else if (arcanaMatch) {
        const arcanaCount = myField.filter(s => (s.name || '').toLowerCase().includes('arcana')).length;
        const perCount = parseInt(arcanaMatch[1] || '1000', 10);
        boost = arcanaCount * perCount;
      } else {
        const match = bodyLower.match(/(?:this spirit\s+)?(?:gets?|gains?|\+)\s*(\d+)[\s]*bp/i);
        boost = match ? parseInt(match[1], 10) : 0;
      }

      if (boost > 0) {
        if (triggerName === 'ATTACK' || triggerName === 'BLOCK' || /during this battle/i.test(bodyLower)) {
          // Battle-duration BP boost: active during battle, reset at end of battle
          card.battleBpBoost = (card.battleBpBoost || 0) + boost;
          const base = card.baseBp !== undefined ? card.baseBp : (card.currentBp || 0);
          card.battleBp = base + card.battleBpBoost;
          card.currentBp = card.battleBp;
          AudioFX.shield();
          addLog(`💥 **[BP BOOST: ${card.name}]**: Temporarily gained +${boost} BP for battle (fighting with ${card.battleBp} BP)!`, 'damage');
        } else {
          // Turn-duration or permanent boost
          card.turnBpBoost = (card.turnBpBoost || 0) + boost;
          recalculateSpiritBp(card);
          AudioFX.shield();
          addLog(`💥 **[BP BOOST: ${card.name}]**: Gained +${boost} BP (now ${card.currentBp} BP)!`, 'damage');
        }
      }
    }

    // 16. DIRECT LIFE BURN
    if (/send\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+opposing|your\s+opponent'?s?)\s*life\s+to\s+(?:their\s+)?(?:reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+opposing|your\s+opponent'?s?)\s*life\s+to\s+(?:their\s+)?(?:reserve|trash)/i);
      const count = parseWordNumber(match[1]);
      const burn = Math.min(count, enemyReserve.life);
      if (burn > 0) {
        enemyReserve.life -= burn;
        enemyReserve.reserve += burn;
        AudioFX.slash();
        addLog(`🔥 **[LIFE BURN: ${card.name}]**: Burned ${burn} Life from opponent directly to Reserve! (Opponent Life: ${enemyReserve.life})`, 'damage');
        if (typeof showToast === 'function') showToast(`Inflicted ${burn} Direct Life Damage!`, 'warning');
        checkBurstTrigger(enemySide, 'AFTER_LIFE_DECREASED', { attacker: card });
        checkGameOver();
      }
    }

    // 17. TRASH REANIMATION (Evil Deity / Family / Cost)
    if (/summon an?\s+["']?(\w+)["']?\s+family\s+spirit.*?from\s+(?:your\s+)?trash/i.test(bodyLower)) {
      const famMatch = bodyLower.match(/summon an?\s+["']?(\w+)["']?\s+family\s+spirit.*?from\s+(?:your\s+)?trash/i);
      const targetFamily = famMatch ? famMatch[1].toLowerCase() : '';
      const tIdx = myTrash.findIndex(c => ((c.family || '') + ' ' + (c.families ? c.families.join(' ') : '')).toLowerCase().includes(targetFamily));
      if (tIdx !== -1 && (myReserve.reserve >= 1 || isPlayer === false)) {
        const reanimatedCard = myTrash.splice(tIdx, 1)[0];
        const reanimatedSpirit = {
          ...reanimatedCard,
          uid: 'sp_' + Math.random().toString(36).slice(2, 9),
          currentCores: 1,
          hasSoulCore: false,
          isExhausted: false,
          hasAttacked: false,
          battleBp: 0
        };
        const { level, bp } = calculateBpAndLevel(reanimatedSpirit.levels, 1, false, reanimatedSpirit.effect);
        reanimatedSpirit.currentLevel = level;
        reanimatedSpirit.currentBp = bp;
        myField.push(reanimatedSpirit);
        card.cantBeBlocked = true;
        AudioFX.summon();
        addLog(`💀 **[REANIMATION: ${card.name}]**: Summoned "${reanimatedSpirit.name}" from Trash! "${card.name}" cannot be blocked this attack!`, 'magic');
        executeWhenSummonedEffects(reanimatedSpirit, side);
      }
    }

// 18. DESPERADO CORE STRIP & VOID HARVEST (When Summoned)
    if (/send all cores on every other spirit to each respective player's reserve/i.test(bodyLower) || (card.name.includes('Desperado') && triggerName === 'SUMMON')) {
      let depletedCount = 0;
      const allOtherSpirits = [
        ...DuelState.player.field.filter(s => s.uid !== card.uid),
        ...DuelState.opponent.field.filter(s => s.uid !== card.uid)
      ];
      for (const sp of allOtherSpirits) {
        const spSide = DuelState.player.field.some(s => s.uid === sp.uid) ? 'player' : 'opponent';
        const res = DuelState[spSide];
        res.reserve += sp.currentCores;
        sp.currentCores = 0;
        const list = DuelState[spSide].field;
        const idx = list.findIndex(s => s.uid === sp.uid);
        if (idx !== -1) list.splice(idx, 1);
        sendToTrash(sp, spSide, `Depleted by ${card.name} core strip`);
        depletedCount++;
      }
      if (depletedCount > 0) {
        card.currentCores += depletedCount;
        recalculateSpiritBp(card);
        AudioFX.slash();
        addLog(`💀 **[DESPERADO SWEEP: ${card.name}]**: Sent all cores from ${depletedCount} spirits to reserves! Claimed +${depletedCount} cores from Void to "${card.name}"!`, 'kill');
        if (typeof showToast === 'function') showToast(`Desperado claimed +${depletedCount} cores!`, 'success');
      }
    }

    // 19. DECK DISCARD / MILL (Titus, Titus XV, Golem Mill)
    if (/discard\s+(\d+|ten)\s+cards?\s+from\s+the\s+opposing\s+decktop/i.test(bodyLower) || (card.name.includes('Titus') && triggerName === 'SUMMON')) {
      const match = bodyLower.match(/discard\s+(\d+|ten)\s+cards?\s+from\s+the\s+opposing\s+decktop/i);
      const millCount = match ? parseWordNumber(match[1]) : 10;
      let milled = 0;
      const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
      for (let m = 0; m < millCount; m++) {
        const milledCard = enemyDeck.shift();
        if (milledCard) {
          sendToTrash(milledCard, enemySide, `Milled by ${card.name}`);
          milled++;
        }
      }
      if (milled > 0) {
        AudioFX.slash();
        addLog(`🌊 **[DECK MILL: ${card.name}]**: Discarded ${milled} card(s) from opponent's decktop to Trash!`, 'kill');
        if (typeof showToast === 'function') showToast(`Milled ${milled} cards from enemy deck!`, 'info');
        if (!enemyDeck.length) {
          DuelState[enemySide].life = 0;
          checkGameOver();
        }
      }
    }

    // 20. ALEXANDER DESTROY & MILL (When Attacks)
    if (card.name.includes('Alexander') && /destroy an opposing cost 4 or less spirit/i.test(bodyLower)) {
      const eligible = enemyField.filter(s => (s.cost || 0) <= 4);
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.cost || 0) - (a.cost || 0));
        const target = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) enemyField.splice(tIdx, 1);
        enemyReserve.reserve += target.currentCores;
        sendToTrash(target, enemySide, `Destroyed by ${card.name}`);
        const targetCost = target.cost || 1;
        let milled = 0;
        const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
        for (let m = 0; m < targetCost; m++) {
          const c = enemyDeck.shift();
          if (c) { sendToTrash(c, enemySide, `Milled by Alexander`); milled++; }
        }
        AudioFX.slash();
        addLog(`⚔️ **[ALEXANDER CRUSH: ${card.name}]**: Destroyed opposing "${target.name}" and milled ${milled} cards from enemy deck!`, 'kill');
      }
    }

    // 21. BAZZEL BURST TRIGGER (When Attacks)
    if (card.name.includes('Bazzel') && /reveal one of your bursts/i.test(bodyLower)) {
      const setBurst = DuelState[side].burst;
      if (setBurst) {
        addLog(`⚡ **[BAZZEL BURST ACTIVATION: ${card.name}]**: Revealed set Burst "${setBurst.name}"!`, 'magic');
        const cond = parseBurstCondition(setBurst.effect);
        if (cond.type === 'AFTER_OPPONENT_SUMMON_EFFECT' || cond.type === 'GENERIC_BURST' || (setBurst.effect && setBurst.effect.includes('When Summoned'))) {
          activateBurst(side, true);
        } else {
          addLog(`ℹ️ **[BAZZEL: ${card.name}]**: Set Burst "${setBurst.name}" condition [${cond.label}] is not a (When Summoned) burst.`, 'step');
        }
      }
    }

    // 22. BURNING-SOULDRAGON TRUE-CONSECUTIVE BLADE (When Attacks)
    if (/true-consecutive blade/i.test(bodyLower) || card.name.includes('Burning-Souldragon')) {
      if (card.hasSoulCore) {
        card.hasSoulCore = false;
        DuelState[side].soulCoreLocation = 'trash';
        AudioFX.slash();
        addLog(`🔥 **[TRUE-CONSECUTIVE BLADE: ${card.name}]**: Sent Soul Core to Trash to unleash full devastating power across opposing lines!`, 'damage');
        card._trueConsecutiveActive = true;
      }
    }

    // 23. ALDIUS-VIPER 2-CORE REMOVAL TO TRASH (When Summoned)
    if (/send two cores from two opposing spirits to the trash/i.test(bodyLower) || (card.name.includes('Aldius-Viper') && triggerName === 'SUMMON')) {
      for (let i = 0; i < 2; i++) {
        if (enemyField.length > i) {
          const target = enemyField[i];
          const toRemove = Math.min(2, target.currentCores);
          target.currentCores -= toRemove;
          enemyReserve.trashCores = (enemyReserve.trashCores || 0) + toRemove;
          addLog(`💀 **[ALDIUS-VIPER: ${card.name}]**: Sent ${toRemove} core(s) from "${target.name}" directly to Trash!`, 'kill');
          if (target.currentCores <= 0) {
            const tIdx = enemyField.findIndex(s => s.uid === target.uid);
            if (tIdx !== -1) enemyField.splice(tIdx, 1);
            sendToTrash(target, enemySide, `Depleted by Aldius-Viper`);
          } else {
            recalculateSpiritBp(target);
          }
        }
      }
    }

    // 24. ANGELIA ARCHIEL BP REDUCTION (When Attacks)
    if (/give an opposing spirit -(\d+)[\s]*bp/i.test(bodyLower)) {
      const match = bodyLower.match(/give an opposing spirit -(\d+)[\s]*bp/i);
      const minusBp = parseInt(match[1], 10);
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = enemyField[0];
        target.currentBp = Math.max(0, (target.currentBp || 0) - minusBp);
        AudioFX.slash();
        addLog(`✨ **[BP REDUCTION: ${card.name}]**: Decreased opposing "${target.name}" by -${minusBp} BP (now ${target.currentBp} BP)!`, 'magic');
        if (target.currentBp <= 0) {
          const tIdx = enemyField.findIndex(s => s.uid === target.uid);
          if (tIdx !== -1) enemyField.splice(tIdx, 1);
          enemyReserve.reserve += target.currentCores;
          sendToTrash(target, enemySide, `Reduced to 0 BP by ${card.name}`);
          addLog(`💀 **[BP 0 DESTRUCTION]**: "${target.name}" was reduced to 0 BP and destroyed!`, 'kill');
        }
      }
    }

    // 25. TZAPHKIEL 2-LIFE BURN ON MAGIC USE
    if (/when you use a magic card.*?send two opposing lives to the reserve/i.test(bodyLower)) {
      card._tzaphkielLifeBurn = true;
    }

    // 26. PUPPET SOLDIER MAKAI REANIMATION (When Depleted/Destroyed)
    if (/return a\s+["']?makai["']?-named spirit card from your trash to the hand/i.test(bodyLower)) {
      const mIdx = myTrash.findIndex(c => (c.name || '').toLowerCase().includes('makai') || (c.family || '').toLowerCase().includes('makai'));
      if (mIdx !== -1) {
        const recovered = myTrash.splice(mIdx, 1)[0];
        myHand.push(recovered);
        addLog(`💀 **[PUPPET SOLDIER: ${card.name}]**: Returned "${recovered.name}" from Trash to Hand!`, 'magic');
      }
    }

    // 27. ZOMBIE-SNAKE ANCIENT DRAGON REVENGE (When Destroyed)
    if (/destroy an opposing\s+["']?ancient dragon["']?\s+family spirit/i.test(bodyLower)) {
      const target = enemyField.find(s => ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '')).toLowerCase().includes('ancient dragon'));
      if (target) {
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) enemyField.splice(tIdx, 1);
        enemyReserve.reserve += target.currentCores;
        sendToTrash(target, enemySide, `Destroyed by Zombie-Snake revenge`);
        addLog(`🐍 **[ZOMBIE-SNAKE REVENGE: ${card.name}]**: Destroyed opposing "${target.name}" (Ancient Dragon)!`, 'kill');
      }
    }
  }

  function executeWhenSummonedEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;

    const blocks = getCardAbilityBlocks(spirit.effect);
    const eligibleBlocks = blocks.filter(b => /\(When Summoned(?:[^)]*)\)|\(When [^)]*\/Summoned(?:[^)]*)\)|\(When Summoned\/[^\)]*\)/i.test(b));
    if (!eligibleBlocks.length) return;

    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {
        executeAbilityActions(b, spirit, side, 'SUMMON');
      }
    }
    executeUniversalCardEffect(spirit, side, 'WHEN_SUMMONED');

    // Allied Field triggers on summon (e.g. Shugraus):
    const myField = side === 'player' ? DuelState.player.field : DuelState.opponent.field;
    for (const ally of myField) {
      if (!ally || ally.uid === spirit.uid) continue;
      const allyEff = (ally.effect || '').toLowerCase();
      if ((allyEff.includes('when your "makai"-named spirits') || allyEff.includes('when your makai-named spirits')) && ((spirit.name || '').toLowerCase().includes('makai') || (spirit.family || '').toLowerCase().includes('makai'))) {
        ally.currentCores = (ally.currentCores || 0) + 1;
        recalculateSpiritBp(ally);
        AudioFX.coreChime();
        addLog(`🔮 **[MAURICE HARVEST: ${ally.name}]**: Harvested +1 Core from Void upon summoning "${spirit.name}"!`, 'magic');
      }
    }


    renderDuelTable();
    if (side === 'player') renderPlayerHand();

    const enemySide = side === 'player' ? 'opponent' : 'player';
    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit });
    const sideNexuses = (side === 'player' ? DuelState.player.nexus : DuelState.opponent.nexus) || [];
    for (const n of sideNexuses) {
      executeCoreCharge(n, side, 'SUMMON', { spirit });
    }
  }

  function executeWhenAttacksEffects(attacker, side = 'player') {
    if (!attacker || !attacker.effect) return;
    executeUniversalCardEffect(attacker, side, 'WHEN_ATTACKS');

    // 1. Windstorm
    const windCount = hasWindstorm(attacker);
    if (windCount > 0) {
      const enemyField = side === 'player' ? DuelState.opponent.field : DuelState.player.field;
      const readyEnemies = enemyField.filter(s => !s.isExhausted);
      if (readyEnemies.length > 0) {
        readyEnemies.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const toExhaust = readyEnemies.slice(0, windCount);
        toExhaust.forEach(s => { s.isExhausted = true; });
        AudioFX.shield();
        const names = toExhaust.map(s => `"${s.name}"`).join(', ');
        addLog(`🌪️ **[WINDSTORM ACTIVATED: ${attacker.name}]**: Tempest exhausted ${toExhaust.length} opposing defense Spirit(s): ${names}!`, 'damage');
        if (side === 'player' && typeof showToast === 'function') {
          showToast(`🌪️ [Windstorm]: Exhausted ${names}!`, 'info');
        }
      }
    }

    // 2. Assault
    const assaultTier = hasAssault(attacker);
    if (assaultTier > 0 && !(attacker._assaultCount >= assaultTier)) {
      const myField = side === 'player' ? DuelState.player.field : DuelState.opponent.field;
      const allies = myField.filter(s => s.uid !== attacker.uid && !s.isExhausted);
      if (allies.length > 0) {
        const ally = allies[0];
        ally.isExhausted = true;
        attacker.isExhausted = false;
        attacker.hasAttacked = false;
        attacker._assaultCount = (attacker._assaultCount || 0) + 1;
        AudioFX.slash();
        addLog(`⚔️ **[ASSAULT ACTIVATED: ${attacker.name}]**: Exhausted allied "${ally.name}" to re-ready and prepare a second assault!`, 'magic');
        if (side === 'player' && typeof showToast === 'function') {
          showToast(`⚔️ [Assault]: "${attacker.name}" re-readied for another strike!`, 'success');
        }
      }
    }

    // 3. Ability blocks
    const blocks = getCardAbilityBlocks(attacker.effect);
    const eligibleBlocks = blocks.filter(b => /\(When Attacks(?:[^)]*)\)|\(When [^)]*\/Attacks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)|\(When Brave Attacks(?:[^)]*)\)/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, attacker.currentLevel)) {
        executeAbilityActions(b, attacker, side, 'ATTACK');
      }
    }

    renderDuelTable();
  }

  function executeBpComparisonEffects(att, blk, attSide, defSide) {
    if (!att || !att.effect) return;
    const eff = att.effect;

    if (!eff.toLowerCase().includes('bp comparison') && !eff.includes('BPを比べ')) return;

    // Isolate the ability block containing BP comparison
    const blocks = getCardAbilityBlocks(eff);
    const bpBlock = blocks.find(b => /bp comparison|BPを比べ/i.test(b));
    if (!bpBlock) return;

    const lvlMatch = bpBlock.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
    const levelTag = lvlMatch ? lvlMatch[1] : '';

    // Check level requirement (e.g. Kingtaurus requires [LV2][LV3])
    if (!isEffectLevelMet(levelTag, att.currentLevel)) {
      return;
    }

    const bodyLower = bpBlock.toLowerCase();
    const defState = defSide === 'player' ? DuelState.player : DuelState.opponent;
    const isPlayerAttacking = attSide === 'player';

    // 1. THE DUKE KINGTAURUS: "When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve."
    if (/when only the opposing spirit is destroyed via bp comparison.*?send an opposing life to their reserve/i.test(bodyLower) ||
        /BPを比べ相手のスピリットだけを破壊したとき.*?相手のライフにあるコア1個を相手のリザーブに置く/i.test(bpBlock)) {
      if (defState.life > 0) {
        defState.life -= 1;
        defState.reserve += 1;
        AudioFX.lifeDamage();
        addLog(`👑💥 **[BP COMPARISON VICTORY: ${att.name}]**: "Gae Bolg" pierced through opposing defense! Sent 1 opposing Life directly to their Reserve! (${defSide === 'player' ? 'Player' : 'Opponent'} Life remaining: ${defState.life})`, 'damage');
        if (typeof showToast === 'function') {
          showToast(`👑 ${att.name}: Life Burn triggered! Opposing Life -1`, 'error');
        }
        renderDuelTable();
        checkGameOver();
      }
    }
    // 2. THE EMPEROR KAISERATLAS: "When only the opposing Spirit is destroyed via BP comparison, by sending a core from your Reserve to the Void, send two opposing Lives to their Reserve."
    else if (/when only the opposing spirit is destroyed via bp comparison.*?by sending a core from your reserve to the void.*?send two opposing lives to their reserve/i.test(bodyLower)) {
      const attReserve = isPlayerAttacking ? DuelState.player : DuelState.opponent;
      if (attReserve.reserve >= 1 && defState.life > 0) {
        attReserve.reserve -= 1; // sent to void
        const dmg = Math.min(2, defState.life);
        defState.life -= dmg;
        defState.reserve += dmg;
        AudioFX.lifeDamage();
        addLog(`👑💥 **[BP COMPARISON VICTORY: ${att.name}]**: Kaiseratlas channeled 1 core to the Void and shattered 2 opposing Lives to their Reserve! (${defSide === 'player' ? 'Player' : 'Opponent'} Life remaining: ${defState.life})`, 'damage');
        renderDuelTable();
        checkGameOver();
      }
    }
    // 3. THE DARKDRAGONEMPEROR SIEGFRIED: "When only the opposing Spirit is destroyed via BP comparison, draw a card."
    else if (/when only the opposing spirit is destroyed via bp comparison.*?draw a card/i.test(bodyLower)) {
      const attDeck = isPlayerAttacking ? DuelState.player.deck : DuelState.opponent.deck;
      const attHand = isPlayerAttacking ? DuelState.player.hand : DuelState.opponent.hand;
      const card = attDeck.shift();
      if (card) {
        attHand.push(card);
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🎴 **[BP COMPARISON VICTORY: ${att.name}]**: Drew 1 card from deck for victory in BP comparison!`, 'step');
        renderDuelTable();
      }
    }
  }

  function executeWhenBlocksEffects(blocker, defSide = 'player', attacker = null) {
    if (!blocker || !blocker.effect) return;

    const blocks = getCardAbilityBlocks(blocker.effect);
    const eligibleBlocks = blocks.filter(b => /\(When Blocks(?:[^)]*)\)|\(When Attacks\/Blocks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, blocker.currentLevel)) {
        executeAbilityActions(b, blocker, defSide, 'BLOCK', { attacker });
      }
    }
    executeUniversalCardEffect(blocker, defSide, 'WHEN_BLOCKS', { attacker });
    renderDuelTable();
  }

  function executeWhenDestroyedEffects(destroyedSpirit, side = 'player') {
    if (!destroyedSpirit || !destroyedSpirit.effect) return;

    const blocks = getCardAbilityBlocks(destroyedSpirit.effect);
    const eligibleBlocks = blocks.filter(b => /\(When (?:(?:Depleted\/)?Destroyed(?:[^)]*)|[^)]*\/Destroyed(?:[^)]*))\)/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, destroyedSpirit.currentLevel)) {
        executeAbilityActions(b, destroyedSpirit, side, 'DESTROYED');
      }
    }
    executeUniversalCardEffect(destroyedSpirit, side, 'WHEN_DESTROYED');
    renderDuelTable();
  }

  function summonCard(uid, customCoresToPlace) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot summon during opponent's turn!", 'warning');
      return;
    }
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Spirits can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: Normal Spirits cannot be summoned during the Attack Step! "${card.name}" does not have [Flash] timing.`, 'warning');
      return;
    }

    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const totalNeeded = cost + coresToPlace;
    const hasScInReserve = (DuelState.player.soulCoreLocation === 'reserve');
    const totalReserveWithSc = DuelState.player.reserve + (hasScInReserve ? 1 : 0);

    let usedSoulCoreFromReserve = false;

    if (DuelState.player.reserve < totalNeeded) {
      if (totalReserveWithSc >= totalNeeded) {
        // Can afford directly by using the Soul Core in Reserve!
        usedSoulCoreFromReserve = true;
        const regularNeeded = totalNeeded - 1;
        DuelState.player.reserve -= regularNeeded;
        DuelState.player.trash += cost;
        DuelState.player.hand.splice(cardIdx, 1);
      } else {
        const { total } = getPlayerAvailableCores();
        if (total >= totalNeeded) {
          openSacrificeModal(uid);
          return;
        }
        showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost} + ${coresToPlace} on Spirit), but only have ${total} across Reserve and Field Spirits.`, 'warning');
        return;
      }
    } else {
      // Direct summon from regular Reserve
      DuelState.player.reserve -= totalNeeded;
      DuelState.player.trash += cost;
      DuelState.player.hand.splice(cardIdx, 1);
    }

    if (usedSoulCoreFromReserve) {
      card.hasSoulCore = true;
      DuelState.player.soulCoreLocation = 'field';
      DuelState.player.soulCoreSpiritUid = card.uid;
    }
    const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace, !!card.hasSoulCore, card.effect);
    card.currentCores = coresToPlace;
    card.currentLevel = level;
    card.currentBp = bp;
    card.isExhausted = false;
    card.hasAttacked = false;

    // Check Tribute requirement
    const tributeReq = getCardTributeRequirement(card);
    if (tributeReq) {
      const eligible = getEligibleTributeSpirits(tributeReq, DuelState.player.field);
      if (eligible.length === 1) {
        // Direct tribute sole eligible spirit
        executeTribute(card, eligible[0], tributeReq, cost, coresToPlace);
        DuelState.selectedPlayerCard = null;
        return;
      } else if (eligible.length > 1) {
        // Prompt player to choose which spirit to tribute
        openTributeModal(card, tributeReq, cost, coresToPlace, eligible);
        DuelState.selectedPlayerCard = null;
        return;
      } else {
        // No eligible spirits on field: abort & refund
        DuelState.player.reserve += totalNeeded;
        DuelState.player.trash = Math.max(0, DuelState.player.trash - cost);
        DuelState.player.hand.splice(cardIdx, 0, card);
        if (typeof showToast === 'function') {
          showToast(`Cannot Tribute Summon "${card.name}": requires [Tribute: ${tributeReq.condText}], but you have no eligible Spirits on field!`, 'error');
        }
        return;
      }
    }

    DuelState.player.field.push(card);
    DuelState.selectedPlayerCard = null;

    AudioFX.summon();
    addLog(`✨ **SUMMONED**: "${card.name}" placed on field! Paid ${cost} cores, allocated ${coresToPlace} core (Lv${level}, ${bp} BP).`, 'step');
    executeWhenSummonedEffects(card, 'player');
    renderDuelTable();
  }

  // ── NEXUS MANAGEMENT ENGINE (Center Field Zone & Cores) ──
  function deployNexus(uid, customCoresToPlace = 0) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot deploy during opponent's turn!", 'warning');
      return;
    }
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast(`Official Rule: Nexuses can only be deployed during the Main Step! Flash effects on "${card.name}" can only be used once the Nexus is played on the field.`, 'warning');
      return;
    }

    const cost = card.cost || 0;
    const coresOnNexus = customCoresToPlace || (card.levels && card.levels[0]?.cores !== undefined ? card.levels[0].cores : 0);
    const totalNeeded = cost + coresOnNexus;

    if (DuelState.player.reserve < totalNeeded) {
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(uid);
        return;
      }
      showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost}), but only have ${total} available across Reserve and Field.`, 'warning');
      return;
    }

    // Direct deploy from Reserve
    DuelState.player.reserve -= totalNeeded;
    DuelState.player.trash += cost;
    DuelState.player.hand.splice(cardIdx, 1);

    if (!DuelState.player.nexus) DuelState.player.nexus = [];
    DuelState.player.nexusCards = DuelState.player.nexus;

    card.currentCores = coresOnNexus;
    const pLevels = card.levels || parseLevels(card.levels || card.raw_levels);
    card.levels = pLevels;
    const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
    card.currentLevel = (coresOnNexus >= lv2req) ? 2 : 1;
    card.isExhausted = false;

    DuelState.player.nexus.push(card);
    DuelState.selectedPlayerCard = null;

    AudioFX.summon();
    addLog(`🏛️ **DEPLOYED**: Nexus "${card.name}" placed in the Center Field Nexus Zone! Paid ${cost} cores (Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');
    if (typeof showToast === 'function') {
      showToast(`🏛️ Deployed Nexus: ${card.name}!`, 'success');
    }

    executeWhenDeployedEffects(card, 'player');
    renderDuelTable();
  }

  function addCoreToNexus(uid) {
    if (DuelState.activePlayer !== 'player') return;
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Cores can only be reallocated during the MAIN step!", 'warning');
      return;
    }
    const card = (DuelState.player.nexus || []).find(n => n.uid === uid);
    if (!card) return;
    if (DuelState.player.reserve < 1) {
      showToast("No cores available in Reserve to move to this Nexus!", 'warning');
      return;
    }
    DuelState.player.reserve -= 1;
    card.currentCores = (card.currentCores || 0) + 1;
    const lv2req = (card.levels && card.levels[1] && card.levels[1].cores !== undefined) ? card.levels[1].cores : 999;
    card.currentLevel = (card.currentCores >= lv2req) ? 2 : 1;
    AudioFX.coreChime();
    addLog(`🔮 **CORE ALLOCATED**: Moved 1 Core from Reserve to Nexus "${card.name}" (Now Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');
    renderDuelTable();
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }

  function removeCoreFromNexus(uid) {
    if (DuelState.activePlayer !== 'player') return;
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Cores can only be reallocated during the MAIN step!", 'warning');
      return;
    }
    const card = (DuelState.player.nexus || []).find(n => n.uid === uid);
    if (!card) return;
    if ((card.currentCores || 0) <= 0) {
      showToast("No cores on this Nexus to remove!", 'warning');
      return;
    }
    card.currentCores = Math.max(0, card.currentCores - 1);
    DuelState.player.reserve += 1;
    const lv2req = (card.levels && card.levels[1] && card.levels[1].cores !== undefined) ? card.levels[1].cores : 999;
    card.currentLevel = (card.currentCores >= lv2req) ? 2 : 1;
    AudioFX.coreChime();
    addLog(`🔮 **CORE RETRIEVED**: Returned 1 Core from Nexus "${card.name}" to Reserve (Now Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');
    renderDuelTable();
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }


  // ── GRAND SKILL & ON-FIELD NEXUS FLASH ENGINE ──
  function parseGrandSkill(card) {
    if (!card || !card.effect) return null;
    const m = card.effect.match(/\[Grand Skill:\s*(\d+)\]\s*(?:\[LV\d+\]\s*)*Flash(?:\s*-\s*\(([^)]+)\))?/i);
    if (!m) return null;
    const cost = parseInt(m[1], 10);
    const timing = m[2] ? m[2].trim().toLowerCase() : 'either';

    let timingLabel = 'Flash';
    let timingType = 'either';
    if (timing.includes('your turn') || timing.includes('your attack step')) {
      timingLabel = 'Your Turn Flash';
      timingType = 'your_turn';
    } else if (timing.includes('opposing') || timing.includes("opponent's")) {
      timingLabel = "Opponent's Turn Flash";
      timingType = 'opposing_turn';
    }

    return {
      cost,
      timingLabel,
      timingType,
      effectText: card.effect
    };
  }

  function canActivateGrandSkill(nexus, side = 'player') {
    if (!nexus) return { allowed: false, reason: 'No card' };
    const gs = parseGrandSkill(nexus);
    if (!gs) return { allowed: false, reason: 'No Grand Skill' };

    const isOurTurn = (DuelState.activePlayer === side);
    const phase = DuelState.phases[DuelState.phaseIndex];

    const currentCores = nexus.currentCores || 0;
    if (currentCores < gs.cost) {
      return { 
        allowed: false, 
        reason: `Need ${gs.cost} cores on ${nexus.name} (currently has ${currentCores})`,
        gs
      };
    }

    if (gs.timingType === 'your_turn' && !isOurTurn) {
      return { 
        allowed: false, 
        reason: `Grand Skill timing is [${gs.timingLabel}], but it is currently Opponent's Turn`,
        gs
      };
    }
    if (gs.timingType === 'opposing_turn' && isOurTurn) {
      return { 
        allowed: false, 
        reason: `Grand Skill timing is [${gs.timingLabel}], but it is currently Your Turn`,
        gs
      };
    }

    if (phase !== 'ATTACK' && phase !== 'MAIN') {
      return { 
        allowed: false, 
        reason: `Grand Skills can only activate during Main or Attack Step`,
        gs
      };
    }

    return { allowed: true, gs };
  }

  function activateGrandSkill(nexusUid, side = 'player') {
    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = side === 'player' ? DuelState.opponent : DuelState.player;

    const nexus = (sideState.nexus || []).find(n => n.uid === nexusUid);
    if (!nexus) {
      if (typeof showToast === 'function') showToast("Nexus not found on field!", 'error');
      return;
    }

    const check = canActivateGrandSkill(nexus, side);
    if (!check.allowed) {
      if (typeof showToast === 'function') showToast(check.reason, 'warning');
      return;
    }

    const gs = check.gs;
    nexus.currentCores -= gs.cost;
    const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
    const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
    nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;

    AudioFX.burstIgnite ? AudioFX.burstIgnite() : AudioFX.coreChime();

    const effLower = nexus.effect.toLowerCase();
    if (effLower.includes('destroy an opposing exhausted spirit') || effLower.includes('destroy 1 opposing exhausted spirit') || effLower.includes('destroy an opposing spirit')) {
      const exhaustedEnemies = (enemyState.field || []).filter(s => s.isExhausted);
      const targetList = exhaustedEnemies.length > 0 ? exhaustedEnemies : (enemyState.field || []);

      if (targetList.length > 0) {
        targetList.sort((a, b) => (b.battleBp || b.currentBp || 0) - (a.battleBp || a.currentBp || 0));
        const victim = targetList[0];
        const vIdx = enemyState.field.findIndex(s => s.uid === victim.uid);
        if (vIdx !== -1) {
          const popped = enemyState.field.splice(vIdx, 1)[0];
          recycleSpiritCoresToReserve(popped, enemySide);
          sendToTrash(popped, enemySide, `Destroyed by ${nexus.name}'s [Grand Skill: ${gs.cost}]`);
          AudioFX.destroy();
          addLog(`⚡🏛️ **[GRAND SKILL: ${gs.cost} ACTIVATED: ${nexus.name}]**: Sent ${gs.cost} Cores from Nexus to Void! Destroyed opposing exhausted Spirit "${popped.name}"!`, 'damage');
          if (typeof showToast === 'function') {
            showToast(`⚡ [Grand Skill: ${gs.cost}]: Destroyed opposing "${popped.name}"!`, 'success');
          }
        }
      } else {
        addLog(`⚡🏛️ **[GRAND SKILL: ${gs.cost} ACTIVATED: ${nexus.name}]**: Sent ${gs.cost} Cores from Nexus to Void! (No opposing exhausted spirits on field).`, 'magic');
      }
    } else {
      executeUniversalCardEffect(nexus, side, 'FLASH');
      addLog(`⚡🏛️ **[GRAND SKILL: ${gs.cost} ACTIVATED: ${nexus.name}]**: Sent ${gs.cost} Cores from Nexus to Void! Triggered Flash effect.`, 'magic');
    }

    renderDuelTable();
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }

    const blockModal = document.getElementById('battleBlockModal');
    if (blockModal && blockModal.classList.contains('active')) {
      const attacker = DuelState.selectedAttacker || (DuelState.opponent.field || [])[0];
      const readyBlockers = (DuelState.player.field || []).filter(s => !s.isExhausted);
      if (attacker) {
        showBlockPrompt(attacker, readyBlockers);
      }
    }
  }

  function cardMatchesCoreCharge(card, nexusEffect) {
    if (!card || !nexusEffect) return false;
    const m = nexusEffect.match(/\[Core Charge:\s*([^\]]+)\]/i);
    if (!m) return false;
    const condStr = m[1];
    const parts = condStr.split('&').map(s => s.trim());

    const cFam = ((card.family || '') + ' ' + (Array.isArray(card.families) ? card.families.join(' ') : '')).toLowerCase();
    const cName = (card.name || '').toLowerCase();
    const cType = (card.type || '').toLowerCase();
    const cCost = card.cost || 0;

    for (const part of parts) {
      const pLower = part.toLowerCase();
      // Cost requirement: e.g. "cost 3 or more", "cost 4 or more"
      const costMatch = pLower.match(/cost\s*(\d+)\s*(?:or more|\+)/i);
      if (costMatch) {
        const minCost = parseInt(costMatch[1], 10);
        if (cCost < minCost) return false;
        continue;
      }

      // Family / Name keywords
      const cleanPart = part.replace(/[()"]/g, '');
      const tokens = cleanPart.split(/[\/,]/).map(t => t.trim().toLowerCase()).filter(Boolean);

      let tokenMatched = false;
      for (const token of tokens) {
        if (token === 'spirit' && cType === 'spirit') { tokenMatched = true; break; }
        if (token === 'ultimate' && cType === 'ultimate') { tokenMatched = true; break; }
        if (token === 'brave' && cType === 'brave') { tokenMatched = true; break; }
        if (cFam.includes(token) || cName.includes(token)) { tokenMatched = true; break; }
      }
      if (!tokenMatched) return false;
    }

    return true;
  }

  // ── CORE CHARGE ENGINE (Grandwalker Nexuses) ──
  function executeCoreCharge(nexus, side = 'player', trigger = 'DEPLOY', context = {}) {
    if (!nexus || !nexus.effect) return;
    const eff = nexus.effect;
    if (!eff.includes('[Core Charge:')) return;

    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;

    if (trigger === 'DEPLOY') {
      if (sideState.deck && sideState.deck.length > 0) {
        const milled = sideState.deck.splice(0, Math.min(3, sideState.deck.length));
        let chargedCores = 0;

        milled.forEach(c => {
          sendToTrash(c, side, `Milled for [Core Charge] by ${nexus.name}`);
          if (cardMatchesCoreCharge(c, eff)) {
            chargedCores++;
          }
        });

        if (chargedCores > 0) {
          nexus.currentCores = (nexus.currentCores || 0) + chargedCores;
          const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
          const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
          nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
          AudioFX.coreChime();
          addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Sent 3 cards to Trash. Charged +${chargedCores} Core(s) from Void onto this Nexus! (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel})`, 'magic');
          if (side === 'player' && typeof showToast === 'function') {
            showToast(`✨ [Core Charge]: +${chargedCores} Core(s) onto ${nexus.name}!`, 'success');
          }
        }
      }
    } else if (trigger === 'SUMMON') {
      const summonedSpirit = context.spirit;
      if (summonedSpirit && cardMatchesCoreCharge(summonedSpirit, eff)) {
        nexus.currentCores = (nexus.currentCores || 0) + 1;
        const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
        const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
        nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
        AudioFX.coreChime();
        addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Channeled summon of "${summonedSpirit.name}"! Added +1 Core from Void onto this Nexus (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel}).`, 'magic');
        if (side === 'player' && typeof showToast === 'function') {
          showToast(`✨ [Core Charge]: +1 Core onto ${nexus.name}!`, 'success');
        }
      }
    }
  }

  // ── GRAND FIELD PASSIVE TRIGGERS ──
  function checkGrandFieldOnOpponentExhaust(side = 'opponent') {
    const friendlySide = side === 'opponent' ? 'player' : 'opponent';
    const friendlyState = DuelState[friendlySide];
    if (!friendlyState || !friendlyState.nexus) return;

    for (const n of friendlyState.nexus) {
      if (!n || !n.effect) continue;
      // Suiren: [Grand Field] [LV2] (Opposing Turn) When an opposing Spirit/Ultimate is exhausted, you can draw a card.
      if (n.effect.includes('[Grand Field]') && (n.currentLevel || 1) >= 2) {
        if (/when an opposing spirit\/ultimate is exhausted.*?(?:you can\s+)?draw/i.test(n.effect)) {
          if (friendlyState.deck && friendlyState.deck.length > 0) {
            const drawn = friendlyState.deck.shift();
            if (drawn) {
              friendlyState.hand.push(drawn);
              AudioFX.magic();
              addLog(`✨🎴 **[GRAND FIELD: ${n.name}]**: Opposing Spirit was exhausted! Channeled sacred domain and drew "${drawn.name}"!`, 'magic');
              if (friendlySide === 'player' && typeof showToast === 'function') {
                showToast(`✨ [Grand Field]: Drew "${drawn.name}"!`, 'success');
              }
            }
          }
        }
      }
    }
  }

  function executeWhenDeployedEffects(nexusCard, side = 'player') {
    if (!nexusCard || !nexusCard.effect) return;
    const eff = nexusCard.effect;
    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = side === 'player' ? DuelState.opponent : DuelState.player;

    if (/when deployed/i.test(eff)) {
      const coreMatch = eff.match(/place\s+(\d+|a|an|one|two)\s+cores?\s+from\s+(?:the\s+)?(void|trash)\s+(?:onto|to)\s+(?:this\s+nexus|your\s+reserve)/i);
      if (coreMatch) {
        const count = parseWordNumber(coreMatch[1]);
        if (/this nexus/i.test(coreMatch[0])) {
          nexusCard.currentCores = (nexusCard.currentCores || 0) + count;
          addLog(`✨ **[WHEN DEPLOYED: ${nexusCard.name}]**: Placed ${count} Core from Void onto this Nexus!`, 'step');
        } else {
          sideState.reserve += count;
          addLog(`✨ **[WHEN DEPLOYED: ${nexusCard.name}]**: Placed ${count} Core from Void into Reserve!`, 'step');
        }
        AudioFX.coreChime();
      }

      if (/draw\s+(\d+|a|an|one|two)\s+cards?/i.test(eff)) {
        const m = eff.match(/draw\s+(\d+|a|an|one|two)\s+cards?/i);
        const count = parseWordNumber(m[1]);
        for (let i = 0; i < count; i++) {
          const c = sideState.deck.shift();
          if (c) {
            sideState.hand.push(c);
            addLog(`✨ **[WHEN DEPLOYED: ${nexusCard.name}]**: Drew "${c.name}" from deck!`, 'magic');
          }
        }
        AudioFX.magic();
      }

      if (/destroy\s+(?:an|one|\d+)?\s*opposing\s+spirit/i.test(eff)) {
        if (enemyState.field && enemyState.field.length > 0) {
          const popped = enemyState.field.shift();
          recycleSpiritCoresToReserve(popped, enemySide);
          sendToTrash(popped, enemySide, `Destroyed by ${nexusCard.name}`);
          AudioFX.destroy();
          addLog(`💥 **[WHEN DEPLOYED: ${nexusCard.name}]**: Obliterated opposing "${popped.name}"!`, 'damage');
        }
      }
    }

    executeCoreCharge(nexusCard, side, 'DEPLOY');
    if (typeof executeUniversalCardEffect === 'function') {
      executeUniversalCardEffect(nexusCard, side, 'WHEN_DEPLOYED');
    }
  }


  // ── GRAVEYARD & VOID CARD TRACKING HELPERS ──
  function recycleSpiritCoresToReserve(spirit, side) {
    if (!spirit) return 0;
    const targetState = side === 'player' ? DuelState.player : DuelState.opponent;
    const normalCores = spirit.hasSoulCore ? Math.max(0, spirit.currentCores - 1) : spirit.currentCores;
    targetState.reserve += normalCores;
    if (spirit.hasSoulCore) {
      spirit.hasSoulCore = false;
      targetState.soulCoreLocation = 'reserve';
      targetState.soulCoreSpiritUid = null;
      if (side === 'player') {
        addLog(`🔥 **SOUL CORE SALVAGED**: Soul Core returned safely to Reserve from fallen "${spirit.name}".`, 'step');
      }
    }
    return normalCores;
  }

  function sendToTrash(card, side, reason) {
    if (!card) return;
    const target = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyTarget = DuelState[enemySide];

    // Check Axemoth effect: "When this Spirit is destroyed by an opposing effect, return it to your Hand"
    const rLower = (reason || '').toLowerCase();
    if ((card.name || '').includes('Axemoth') && (rLower.includes('effect') || rLower.includes('revenge') || rLower.includes('destroyed by'))) {
      if (target.hand) target.hand.push(card);
      AudioFX.magic();
      addLog(`🍃 **[AXEMOTH RECOVERY: ${card.name}]**: Returned to Hand upon destruction by opposing effect!`, 'magic');
      return;
    }

    if (!target.trashCards) target.trashCards = [];
    card.graveyardReason = reason || 'Sent to Trash';
    executeUniversalCardEffect(card, side, 'WHEN_DESTROYED', { reason });
    card.graveyardTurn = DuelState.turn;
    target.trashCards.unshift(card);

    // Check Shadow Yatagarasu: "When an opposing Spirit is depleted, this card in your Trash can return to your Hand"
    if (rLower.includes('deplet') && enemyTarget) {
      const enemyTrash = enemyTarget.trashCards || enemyTarget.trash;
      if (Array.isArray(enemyTrash)) {
        const yIdx = enemyTrash.findIndex(c => (c.name || '').includes('Shadow Yatagarasu') || /when an opposing spirit is depleted.*?return.*?to.*?hand/i.test(c.effect || ''));
        if (yIdx !== -1) {
          const yCard = enemyTrash.splice(yIdx, 1)[0];
          if (enemyTarget.hand) enemyTarget.hand.push(yCard);
          AudioFX.magic();
          addLog(`🦅 **[SHADOW YATAGARASU: ${yCard.name}]**: Returned from Trash to Hand on opposing spirit depletion!`, 'magic');
        }
      }
    }

    // Safeguard: Ensure Soul Core is never orphaned or lost in limbo
    if (card.hasSoulCore || target.soulCoreSpiritUid === card.uid) {
      card.hasSoulCore = false;
      target.soulCoreLocation = 'reserve';
      target.soulCoreSpiritUid = null;
      if (side === 'player') {
        addLog(`🔥 **SOUL CORE SALVAGED**: Soul Core returned safely to Reserve from fallen "${card.name}".`, 'step');
      }
    }

    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }

    // Trigger Burst: [After your Spirit is depleted/destroyed by the Opponent]
    if (card.type === 'Spirit' && (rLower.includes('destroy') || rLower.includes('curse') || rLower.includes('deplet') || rLower.includes('combat') || rLower.includes('fell in battle'))) {
      checkBurstTrigger(side, 'AFTER_YOUR_SPIRIT_DESTROYED', { destroyedSpirit: card, reason });
    }
  }

  function sendToVoid(card, side, reason) {
    if (!card) return;
    const target = side === 'player' ? DuelState.player : DuelState.opponent;
    if (!target.voidCards) target.voidCards = [];
    card.voidReason = reason || 'Banished to The Void';
    card.voidTurn = DuelState.turn;
    target.voidCards.unshift(card);
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }

    // Trigger Burst: [After your Spirit is depleted/destroyed by the Opponent]
    if (card.type === 'Spirit' && (rLower.includes('destroy') || rLower.includes('curse') || rLower.includes('deplet') || rLower.includes('combat') || rLower.includes('fell in battle'))) {
      checkBurstTrigger(side, 'AFTER_YOUR_SPIRIT_DESTROYED', { destroyedSpirit: card, reason });
    }
  }

  
  // ── ADVENT (煌臨 / TWINKLE) MECHANICS ENGINE ──
  function getCardAdventRequirement(card) {
    if (!card || !card.effect) return null;
    const m = card.effect.match(/\[Advent:\s*([^\]]+)\]|【煌臨：([^】]+)】/i);
    if (!m) return null;
    const rawCond = (m[1] || m[2]).trim();

    // Parse timing in parentheses following [Advent: ...]
    // e.g. "((Either Attack Step))", "(Your Attack Step)", "(Opposing Attack Step)", "(Your Main Step)"
    let timing = 'either_attack_step';
    let timingLabel = 'Either Attack Step';
    
    const timeMatch = card.effect.match(/(?:\[Advent:[^\]]+\]|【煌臨:[^】]+】)\s*(?:\(?\s*\(([^)]+)\)\)?|\(([^)]+)\)|『([^』]+)』)/i);
    let rawTime = timeMatch ? (timeMatch[1] || timeMatch[2] || timeMatch[3] || '').trim().toLowerCase() : '';
    if (!rawTime) {
      const beforeMatch = card.effect.match(/(?:\(?\s*\(([^)]+)\)\)?|\(([^)]+)\)|『([^』]+)』)\s*(?:\[Advent:|【煌臨:)/i);
      if (beforeMatch) {
        rawTime = (beforeMatch[1] || beforeMatch[2] || beforeMatch[3] || '').trim().toLowerCase();
      }
    }

    if (rawTime.includes('your main step')) {
      timing = 'your_main_step';
      timingLabel = 'Your Main Step';
    } else if (rawTime.includes('start of your attack step')) {
      timing = 'start_your_attack_step';
      timingLabel = 'Start of Your Attack Step';
    } else if (rawTime.includes('start of either attack step')) {
      timing = 'start_either_attack_step';
      timingLabel = 'Start of Either Attack Step';
    } else if (rawTime.includes('your attack step') || rawTime.includes('your turn')) {
      timing = 'your_attack_step';
      timingLabel = 'Your Attack Step';
    } else if (rawTime.includes('opposing attack step') || rawTime.includes("opponent's attack step") || rawTime.includes('相手のアタックステップ')) {
      timing = 'opposing_attack_step';
      timingLabel = "Opponent's Attack Step";
    } else {
      timing = 'either_attack_step';
      timingLabel = 'Either Attack Step';
    }

    // Parse sub-conditions separated by & or , or and
    const parts = rawCond.split(/[,&]|\band\b/i).map(s => s.trim()).filter(Boolean);
    const parsed = {
      raw: m[0],
      condText: rawCond,
      timing,
      timingLabel,
      minCost: null,
      maxCost: null,
      colors: [],
      families: []
    };

    const validColors = ['red', 'purple', 'green', 'white', 'yellow', 'blue'];
    for (const p of parts) {
      const moreM = p.match(/cost\s*(\d+)\s*or\s*more/i);
      const lessM = p.match(/cost\s*(\d+)\s*or\s*less/i);
      if (moreM) {
        parsed.minCost = parseInt(moreM[1], 10);
      } else if (lessM) {
        parsed.maxCost = parseInt(lessM[1], 10);
      } else if (validColors.includes(p.toLowerCase())) {
        parsed.colors.push(p.toLowerCase());
      } else {
        parsed.families.push(p.replace(/[\[\]"']/g, '').trim());
      }
    }
    return parsed;
  }

  function getEligibleAdventTargets(adventReq, fieldSpirits) {
    if (!adventReq || !fieldSpirits || !fieldSpirits.length) return [];
    return fieldSpirits.filter(s => {
      // Cost check
      if (adventReq.minCost !== null && (s.cost || 0) < adventReq.minCost) return false;
      if (adventReq.maxCost !== null && (s.cost || 0) > adventReq.maxCost) return false;
      // Color check
      if (adventReq.colors.length > 0) {
        const sColor = (s.color || '').toLowerCase();
        if (!adventReq.colors.includes(sColor)) return false;
      }
      // Family check
      if (adventReq.families.length > 0) {
        const famStr = ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '') + ' ' + s.name).toLowerCase();
        const matchesFamily = adventReq.families.some(f => famStr.includes(f.toLowerCase()));
        if (!matchesFamily) return false;
      }
      return true;
    });
  }

  function isAdventTimingValid(adventReq, side = 'player') {
    if (!adventReq) return false;
    const isOurTurn = (DuelState.activePlayer === side);
    const currentPhase = DuelState.phases[DuelState.phaseIndex];

    if (adventReq.timing === 'your_main_step') {
      return isOurTurn && currentPhase === 'MAIN';
    }

    // Official Battle Spirits Rule: Advent is a Flash timing keyword exclusively for the ATTACK step!
    // Under NO circumstances can Advent be used in MAIN, START, CORE, DRAW, REFRESH, or END steps!
    if (currentPhase !== 'ATTACK') {
      return false;
    }

    if (adventReq.timing === 'your_attack_step') {
      return isOurTurn;
    }
    if (adventReq.timing === 'opposing_attack_step') {
      return !isOurTurn;
    }
    if (adventReq.timing === 'either_attack_step' || adventReq.timing === 'start_either_attack_step' || adventReq.timing === 'start_your_attack_step') {
      return true;
    }
    return false;
  }

  function canPerformAdvent(card, side = 'player') {
    if (!card) return false;
    const req = getCardAdventRequirement(card);
    if (!req) return false;
    if (!isAdventTimingValid(req, side)) return false;
    const st = DuelState[side];
    if (!st || st.soulCoreLocation === 'trash') return false; // Soul Core required
    const eligible = getEligibleAdventTargets(req, st.field);
    return eligible.length > 0;
  }

  let pendingAdvent = null;

  function openAdventPrompt(cardUid) {
    const card = DuelState.player.hand.find(c => c.uid === cardUid);
    if (!card) return;
    const req = getCardAdventRequirement(card);
    if (!req) {
      if (typeof showToast === 'function') showToast('Card does not have [Advent] ability!', 'warning');
      return;
    }
    if (!isAdventTimingValid(req, 'player')) {
      const currentPhase = DuelState.phases[DuelState.phaseIndex];
      const isOurTurn = (DuelState.activePlayer === 'player');
      if (typeof showToast === 'function') {
        showToast(`Official Rule: [Advent] for "${card.name}" can only be used during ${req.timingLabel}! (Currently in ${currentPhase} Step of ${isOurTurn ? 'Your' : "Opponent's"} Turn)`, 'warning');
      }
      return;
    }
    if (DuelState.player.soulCoreLocation === 'trash') {
      if (typeof showToast === 'function') showToast('Official Rule: [Advent] requires your [Soul Core], but it is currently in Trash!', 'warning');
      return;
    }
    const eligible = getEligibleAdventTargets(req, DuelState.player.field);
    if (!eligible.length) {
      if (typeof showToast === 'function') showToast(`No eligible field Spirit satisfies [Advent: ${req.condText}]!`, 'warning');
      return;
    }

    if (eligible.length === 1) {
      executeAdvent(card, eligible[0], 'player');
      return;
    }

    pendingAdvent = { card, req, eligible };
    const modalEl = document.getElementById('battleAdventModal');
    if (!modalEl) {
      executeAdvent(card, eligible[0], 'player');
      return;
    }

    const titleEl = document.getElementById('adventModalTitle');
    if (titleEl) titleEl.textContent = `Flash - [Advent]: ${card.name}`;

    const descEl = document.getElementById('adventModalDesc');
    if (descEl) {
      descEl.innerHTML = `Stack <strong>${card.name}</strong> onto an eligible Spirit matching [<strong>${req.condText}</strong>]. Your <strong>[Soul Core]</strong> will ignite and be sent to the Trash!`;
    }

    const choicesEl = document.getElementById('adventSpiritChoices');
    if (choicesEl) {
      choicesEl.innerHTML = eligible.map(s => `
        <div class="tribute-choice-card" onclick="BattleArena.selectAdventTarget('${s.uid}')" style="border-color:#a855f7; background:rgba(147,51,234,0.12); margin-bottom:0.5rem; padding:0.6rem; border-radius:0.5rem; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
          <div class="tcc-info">
            <span class="tcc-name" style="color:#e9d5ff; font-weight:800;">🌟 ${s.name}</span>
            <div class="tcc-meta" style="font-size:0.75rem; color:#cbd5e1;">Cost ${s.cost} • ${s.currentCores} Core(s) (${s.currentBp} BP, Lv${s.currentLevel}) • ${s.family || 'Spirit'}</div>
          </div>
          <button class="tcc-btn" style="background:linear-gradient(135deg, #7e22ce, #9333ea); border:1px solid #c084fc; color:#fff; padding:0.35rem 0.75rem; border-radius:0.4rem; font-weight:800; cursor:pointer;">🌟 Stack [Advent]</button>
        </div>
      `).join('');
    }

    modalEl.classList.add('active');
  }

  function selectAdventTarget(spiritUid) {
    if (!pendingAdvent) return;
    const { card, eligible } = pendingAdvent;
    const chosen = eligible.find(s => s.uid === spiritUid);
    if (!chosen) return;
    closeAdventModal();
    executeAdvent(card, chosen, 'player');
  }

  function closeAdventModal() {
    pendingAdvent = null;
    const modalEl = document.getElementById('battleAdventModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  function cancelAdvent() {
    closeAdventModal();
    if (typeof showToast === 'function') showToast('Advent cancelled.', 'info');
  }

  function executeAdvent(adventCard, targetSpirit, side = 'player') {
    const isPlayer = side === 'player';
    const st = DuelState[side];

    // 1. Remove adventCard from Hand
    const hIdx = st.hand.findIndex(c => c.uid === adventCard.uid);
    if (hIdx !== -1) st.hand.splice(hIdx, 1);

    // 2. Send Soul Core to Trash as the Advent summoning cost
    if (targetSpirit.hasSoulCore) {
      targetSpirit.hasSoulCore = false;
      targetSpirit.currentCores = Math.max(1, targetSpirit.currentCores - 1);
    } else if (st.soulCoreLocation === 'reserve') {
      st.reserve = Math.max(0, st.reserve - 1);
    } else {
      const holder = st.field.find(s => s.hasSoulCore);
      if (holder) {
        holder.hasSoulCore = false;
        holder.currentCores = Math.max(1, holder.currentCores - 1);
      }
    }
    st.soulCoreLocation = 'trash';
    st.trashCores = (st.trashCores || 0) + 1;

    // 3. Stack adventCard onto targetSpirit (preserve underlying card history & cores)
    const prevName = targetSpirit.name;
    targetSpirit.underlyingCards = (targetSpirit.underlyingCards || []).concat([{
      name: targetSpirit.name,
      cost: targetSpirit.cost,
      levels: targetSpirit.levels,
      effect: targetSpirit.effect,
      image_url: targetSpirit.image_url
    }]);

    targetSpirit.name = adventCard.name;
    targetSpirit.cost = adventCard.cost;
    targetSpirit.color = adventCard.color;
    targetSpirit.family = adventCard.family;
    targetSpirit.symbol = adventCard.symbol;
    targetSpirit.levels = adventCard.levels;
    targetSpirit.effect = adventCard.effect;
    targetSpirit.image_url = adventCard.image_url || '';
    targetSpirit.image_filename = adventCard.image_filename || '';
    targetSpirit.isAdvent = true;
    targetSpirit.currentCores = Math.max(1, targetSpirit.currentCores || 1);

    // Recalculate BP & Level
    const { level: newLvl, bp: newBp } = calculateBpAndLevel(targetSpirit.levels, targetSpirit.currentCores, false, targetSpirit.effect);
    targetSpirit.currentLevel = newLvl;
    targetSpirit.currentBp = newBp;

    // 4. Audio & Visuals
    AudioFX.soulCoreIgnite();
    AudioFX.summon();

    addLog(`🌟 **[ADVENT / 煌臨 ACCOMPLISHED!]**: ${isPlayer ? 'You' : 'Opponent'} sent [Soul Core] to Trash! Stacked "${adventCard.name}" onto "${prevName}" (elevated to Lv${newLvl}, ${newBp} BP)!`, 'magic');
    if (typeof showToast === 'function') {
      showToast(`🌟 [Advent]: "${adventCard.name}" stacked onto ${prevName}!`, 'success');
    }

    renderDuelTable();
    if (isPlayer) renderPlayerHand();

    // 5. Trigger (When Advents) / [Twinkle ...] effects
    executeWhenAdventsEffects(targetSpirit, side);

    // 6. Also trigger any general (When Summoned) effects
    executeWhenSummonedEffects(targetSpirit, side);

    // 7. Check opponent Burst: [Burst: After an opposing Spirit's (When Summoned/Advents) effect resolves]
    const enemySide = isPlayer ? 'opponent' : 'player';
    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit: targetSpirit, isAdvent: true });
  }

  function executeWhenAdventsEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;
    const effLower = spirit.effect.toLowerCase();
    const isPlayer = side === 'player';
    const myTrash = (isPlayer ? (DuelState.player.trashCards || DuelState.player.trash) : (DuelState.opponent.trashCards || DuelState.opponent.trash)) || [];
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;

    // 1. Universal (When Advents) / (When Advents/Summoned) / 煌臨時 ability blocks (e.g. The MakaiKnight Shazworth: Draw two cards)
    const blocks = getCardAbilityBlocks(spirit.effect);
    const adventBlocks = blocks.filter(b => /(?:When Advents|When [^)]*\/Advents|When Advents\/[^\)]*|煌臨時)/i.test(b));
    for (const b of adventBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel || 1)) {
        executeAbilityActions(b, spirit, side, 'ADVENT');
      }
    }
    executeUniversalCardEffect(spirit, side, 'WHEN_ADVENTS');

    // 2. THE MAKAI PHANTOM DRAGON SIEGFRIED-NECRO: [Twinkle Necromancy] (When Advents)
    // "You can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost."
    if (effLower.includes('twinkle necromancy') || (effLower.includes('when advents') && /cost\s*(?:0\/1\/3\/6\/9|[\d\/]+)\s*spirit\s*cards/i.test(effLower))) {
      const allowedCosts = [0, 1, 3, 6, 9];
      const reanimated = [];

      for (const targetCost of allowedCosts) {
        const tIdx = myTrash.findIndex(c => (c.type === 'Spirit' || !c.type) && (c.cost === targetCost));
        if (tIdx !== -1) {
          const card = myTrash.splice(tIdx, 1)[0];
          const spiritInstance = {
            ...card,
            uid: 'sp_' + Math.random().toString(36).slice(2, 9),
            currentCores: 1,
            hasSoulCore: false,
            isExhausted: false,
            hasAttacked: false,
            battleBp: 0
          };
          if (myReserve.reserve > 0) {
            myReserve.reserve -= 1;
          }
          const { level, bp } = calculateBpAndLevel(spiritInstance.levels, spiritInstance.currentCores, false, spiritInstance.effect);
          spiritInstance.currentLevel = level;
          spiritInstance.currentBp = bp;
          myField.push(spiritInstance);
          reanimated.push(`${spiritInstance.name} (Cost ${targetCost})`);
          executeWhenSummonedEffects(spiritInstance, side);
        }
      }

      if (reanimated.length > 0) {
        AudioFX.summon();
        addLog(`💀 **[TWINKLE NECROMANCY: ${spirit.name}]**: Reanimated ${reanimated.length} Spirit(s) from Trash onto the battlefield: ${reanimated.join(', ')}!`, 'magic');
        if (typeof showToast === 'function') {
          showToast(`💀 [Twinkle Necromancy]: Reanimated ${reanimated.length} Spirits from Trash!`, 'success');
        }
        renderDuelTable();
      } else {
        addLog(`ℹ️ **[TWINKLE NECROMANCY: ${spirit.name}]**: No Cost 0/1/3/6/9 Spirits found in Trash to reanimate.`, 'step');
      }
    }
  }

  // Helper to test if spirit has unblockable status
  function hasCantBeBlocked(spirit) {
    if (!spirit) return false;
    if (spirit.cantBeBlocked) return true;
    if (!spirit.effect) return false;
    return /this spirit can't be blocked|this spirit cannot be blocked|ブロックされない/i.test(spirit.effect);
  }

  // Block Restriction: Siegfried-Necro [LV2][LV3]
  // "When your Ancient Dragon / Astral Dragon / Ogre Wizard attacks, opponent can't block unless they destroy one of their Spirits"
  function getBlockSacrificeRequirement(attacker, attackingSide) {
    if (!attacker) return null;
    const attackField = attackingSide === 'player' ? DuelState.player.field : DuelState.opponent.field;
    for (const s of attackField) {
      if (!s.effect) continue;
      const effLower = s.effect.toLowerCase();
      if (!effLower.includes("can't block unless they destroy one of their spirits") &&
          !effLower.includes("cannot block unless they destroy one of their spirits") &&
          !effLower.includes("ブロックするには、自分のスピリット1体を破壊")) {
        continue;
      }
      // Check level requirement (e.g. LV2+)
      const blocks = getCardAbilityBlocks(s.effect);
      const reqBlock = blocks.find(b => /can't block unless|cannot block unless/i.test(b));
      if (reqBlock) {
        const lvlMatch = reqBlock.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
        if (lvlMatch && !isEffectLevelMet(lvlMatch[1], s.currentLevel)) {
          continue;
        }
      }
      // Check attacker family/condition
      const famStr = ((attacker.family || '') + ' ' + (attacker.families ? attacker.families.join(' ') : '') + ' ' + attacker.name).toLowerCase();
      const mFam = s.effect.match(/When your\s+((?:["'][^"']+["']\/?)+)\s+family/i);
      if (mFam) {
        const rawFams = mFam[1].replace(/["']/g, '').split('/').map(f => f.trim().toLowerCase());
        const matchesFam = rawFams.some(f => famStr.includes(f));
        if (!matchesFam) continue;
      }
      return {
        sourceSpirit: s,
        ruleText: `The opponent can't block unless they destroy one of their Spirits.`
      };
    }
    return null;
  }

  // ── TRIBUTE (供物) MECHANICS ENGINE ──
  function getCardTributeRequirement(card) {
    if (!card || !card.effect) return null;
    const m = card.effect.match(/\[Tribute:\s*([^→\->\]]+)(?:→|->)\s*([^\]]+)\]/i);
    if (!m) return null;
    const rawCond = m[1].trim();
    const rawDest = m[2].trim().toLowerCase();
    const dest = rawDest.includes('void') ? 'void' : 'trash';

    const costM = rawCond.match(/cost\s*(\d+)\s*or\s*more/i);
    if (costM) {
      return {
        raw: m[0],
        type: 'cost',
        minCost: parseInt(costM[1], 10),
        condText: `Cost ${costM[1]}+ Spirit`,
        dest: dest,
        destLabel: dest === 'void' ? 'The Void' : 'Trash'
      };
    } else {
      return {
        raw: m[0],
        type: 'family',
        family: rawCond,
        condText: `"${rawCond}" family Spirit`,
        dest: dest,
        destLabel: dest === 'void' ? 'The Void' : 'Trash'
      };
    }
  }

  function getEligibleTributeSpirits(tributeReq, fieldSpirits) {
    if (!tributeReq || !fieldSpirits || !fieldSpirits.length) return [];
    return fieldSpirits.filter(s => {
      if (tributeReq.type === 'cost') {
        return (s.cost || 0) >= tributeReq.minCost;
      } else if (tributeReq.type === 'family') {
        const fam = ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '')).toLowerCase();
        return fam.includes(tributeReq.family.toLowerCase());
      }
      return false;
    });
  }

  let pendingTribute = null;

  function openTributeModal(card, tributeReq, cost, coresToPlace, eligibleSpirits) {
    pendingTribute = { card, tributeReq, cost, coresToPlace, eligibleSpirits };
    const modalEl = document.getElementById('battleTributeModal');
    if (!modalEl) {
      // Fallback: direct tribute first eligible
      if (eligibleSpirits.length > 0) {
        executeTribute(card, eligibleSpirits[0], tributeReq, cost, coresToPlace);
      }
      return;
    }

    const titleEl = document.getElementById('tributeModalTitle');
    if (titleEl) {
      titleEl.textContent = `Tribute Summon: ${card.name}`;
    }
    const descEl = document.getElementById('tributeModalDesc');
    if (descEl) {
      descEl.innerHTML = `To complete summoning <strong>${card.name}</strong>, select 1 <strong>${tributeReq.condText}</strong> to Tribute. All cores on it will be sent to <strong>${tributeReq.destLabel}</strong>!`;
    }

    const choicesEl = document.getElementById('tributeSpiritChoices');
    if (choicesEl) {
      choicesEl.innerHTML = eligibleSpirits.map(s => `
        <div class="tribute-choice-card" onclick="BattleArena.selectTributeSpirit('${s.uid}')">
          <div class="tcc-info">
            <span class="tcc-name">${s.name}</span>
            <span class="tcc-meta">Cost ${s.cost} • ${s.currentCores} Cores (${s.currentBp} BP, Lv${s.currentLevel})</span>
          </div>
          <button class="tcc-btn">👑 Tribute (Send Cores to ${tributeReq.destLabel})</button>
        </div>
      `).join('');
    }

    modalEl.classList.add('active');
  }

  function selectTributeSpirit(spiritUid) {
    if (!pendingTribute) return;
    const { card, tributeReq, cost, coresToPlace, eligibleSpirits } = pendingTribute;
    const chosen = eligibleSpirits.find(s => s.uid === spiritUid);
    if (!chosen) return;

    closeTributeModal();
    executeTribute(card, chosen, tributeReq, cost, coresToPlace);
  }

  function closeTributeModal() {
    pendingTribute = null;
    const modalEl = document.getElementById('battleTributeModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  function cancelTributeSummon() {
    if (!pendingTribute) return;
    const { card, cost, coresToPlace } = pendingTribute;
    // Refund paid cost
    DuelState.player.reserve += (cost + coresToPlace);
    DuelState.player.trash = Math.max(0, DuelState.player.trash - cost);
    DuelState.player.hand.push(card);
    closeTributeModal();
    renderDuelTable();
    renderPlayerHand();
    if (typeof showToast === 'function') showToast(`Cancelled Tribute Summon of "${card.name}". Cores refunded.`, 'info');
  }

  function executeTribute(card, tributedSpirit, tributeReq, cost, coresToPlace) {
    const tCores = tributedSpirit.currentCores || 0;
    const hasSc = !!tributedSpirit.hasSoulCore;

    // Send cores to destination
    if (tributeReq.dest === 'void') {
      // Cores dissipate into Void
      const voidEl = document.getElementById('battleVoidZone');
      if (voidEl) {
        voidEl.classList.remove('void-pulse-active');
        void voidEl.offsetWidth;
        voidEl.classList.add('void-pulse-active');
        setTimeout(() => voidEl.classList.remove('void-pulse-active'), 1200);
      }
      if (hasSc) {
        DuelState.player.soulCoreLocation = 'void';
        DuelState.player.soulCoreSpiritUid = null;
      }
    } else {
      // Cores go to Trash
      DuelState.player.trash += tCores;
      if (hasSc) {
        DuelState.player.soulCoreLocation = 'trash';
        DuelState.player.soulCoreSpiritUid = null;
      }
    }

    // Remove tributed spirit from field & send card to Trash
    const spIdx = DuelState.player.field.findIndex(s => s.uid === tributedSpirit.uid);
    if (spIdx !== -1) {
      DuelState.player.field.splice(spIdx, 1);
    }
    sendToTrash(tributedSpirit, 'player', `Tributed for ${card.name} (${tributeReq.condText} -> ${tributeReq.destLabel})`);

    // Place summoned spirit on field
    const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace);
    card.currentCores = coresToPlace;
    card.currentLevel = level;
    card.currentBp = bp;
    card.isExhausted = false;
    card.hasAttacked = false;
    DuelState.player.field.push(card);

    AudioFX.summon();
    addLog(`👑 **[TRIBUTE SUMMON COMPLETED]**: Tributed "${tributedSpirit.name}"! Sent all ${tCores} Core(s) to ${tributeReq.destLabel}. "**${card.name}**" descended to the battlefield (Lv${level}, ${bp} BP)!`, 'step');
    if (typeof showToast === 'function') showToast(`👑 Tribute Summoned "${card.name}"!`, 'success');

    executeWhenSummonedEffects(card, 'player');
    if (card.name.includes('Grand-Woden')) {
      addLog(`⚡ **[MAGIC NEGATION ACTIVE]**: Grand-Woden stands ready to negate opposing Magic effects by exhausting!`, 'step');
    }

    renderDuelTable();
    renderPlayerHand();
  }

  // ── FLASH TIMING EFFECT SUMMARIZER & ENGINE ──
  function getFlashEffectSummary(card) {
    if (!card) return 'Flash effect';
    const name = card.name || '';
    if (name.includes('Blizzard Wall')) return 'Ends Attack Step & prevents further life damage';
    if (name.includes('Defensive Aura')) return '+3000 BP to all defending/blocking Spirits';
    if (name.includes('Ice Age Shield')) return 'Prevents Life damage from the attacking Spirit';
    if (name.includes('Co-op Barrier')) return 'Refreshes 1 Spirit & erects life shield';
    if (name.includes('Insect Aura')) return '+2000 BP to a Spirit during this turn';
    if (name.includes('Carry Cores')) return '+1 Core from Void to Reserve & +1000 BP to a Spirit';
    if (name.includes('Buster Phalanx')) return '+4000 BP to a Spirit during this turn';
    if (name.includes('Double Draw')) return 'Grants +2000 BP to a Spirit';
    if (name.includes('Flame Dance')) return 'Destroys a 4000 BP or less Spirit';
    if (name.includes('Flame Tempest')) return 'Destroys all 3000 BP or less Spirits';
    if (name.includes('Brave Cemetery')) return 'Returns Brave from Trash or +1000 BP to a Spirit';
    if (name.includes('Lead Wall')) return 'Enables blocking unblockable Spirits';

    const bpMatch = (card.effect || '').match(/(?:\+|plus\s*)(\d+)\s*bp/i) || (card.effect || '').match(/bp\s*(?:\+|plus\s*)(\d+)/i);
    if (bpMatch) {
      const isTeam = (card.effect || '').toLowerCase().includes('all');
      return `+${bpMatch[1]} BP to ${isTeam ? 'all Spirits' : 'a Spirit'}`;
    }
    return card.summary || (card.effect ? card.effect.substring(0, 50) + '...' : 'Flash Timing');
  }

  function isSingleTargetBpBuff(card) {
    if (!card) return false;
    const name = card.name || '';
    if (name.includes('Defensive Aura')) return false; // Defensive Aura affects all blocking spirits
    const eff = (card.effect || '').toLowerCase();
    const hasBpBoost = /(?:\+|plus\s*)\d+\s*bp/i.test(eff) || /bp\s*(?:\+|plus\s*)\d+/i.test(eff);
    if (!hasBpBoost) return false;
    if (eff.includes('all your spirits') || eff.includes('all spirits') || eff.includes('all your blocking') || eff.includes('すべてのスピリット') || eff.includes('全スピリット')) {
      return false;
    }
    return true;
  }

  function getMagicBpBoostAmount(card) {
    if (!card || !card.effect) return 2000;
    const eff = card.effect.toLowerCase();
    const m = eff.match(/(?:\+|plus\s*)(\d+)\s*bp/i) || eff.match(/bp\s*(?:\+|plus\s*)(\d+)/i);
    return m ? parseInt(m[1], 10) : 2000;
  }

  // ── TARGET SPIRIT SELECTION CONTROLLER ──
  let pendingTargetSelection = null;

  function openTargetModal(card, mode = 'magic', attackerUid = null) {
    pendingTargetSelection = { card, mode, attackerUid };
    const modalEl = document.getElementById('battleTargetModal');
    if (!modalEl) {
      // Fallback: smart default target
      if (mode === 'flash_battle') {
        const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid) || DuelState.selectedAttacker;
        castFlashInBattle(card.uid, attackerUid, DuelState.player.field[0]?.uid);
      } else {
        castMagic(card.uid, DuelState.player.field[0]?.uid);
      }
      return;
    }

    const bpAmount = getMagicBpBoostAmount(card);
    const titleEl = document.getElementById('targetModalTitle');
    if (titleEl) {
      titleEl.textContent = `Target Spirit: ${card.name}`;
    }
    const descEl = document.getElementById('targetModalDesc');
    if (descEl) {
      descEl.innerHTML = `Select which allied Spirit receives <strong>+${bpAmount} BP</strong> this turn:`;
    }

    const choicesEl = document.getElementById('targetSpiritChoices');
    if (choicesEl) {
      choicesEl.innerHTML = DuelState.player.field.map(s => `
        <div class="target-choice-card" onclick="BattleArena.selectTargetSpirit('${s.uid}')">
          <div class="tcc-info">
            <span class="tcc-name">${s.name}</span>
            <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores === 1 ? '' : 's'}${s.isExhausted ? ' (Exhausted)' : ' (Ready)'}</span>
          </div>
          <button class="target-choice-btn">🎯 Target (+${bpAmount} BP)</button>
        </div>
      `).join('');
    }

    modalEl.classList.add('active');
  }

  function selectTargetSpirit(spiritUid) {
    if (!pendingTargetSelection) return;
    const { card, mode, attackerUid } = pendingTargetSelection;
    closeTargetModal();

    if (mode === 'flash_battle') {
      castFlashInBattle(card.uid, attackerUid, spiritUid);
    } else {
      castMagic(card.uid, spiritUid);
    }
  }

  function closeTargetModal() {
    pendingTargetSelection = null;
    const modalEl = document.getElementById('battleTargetModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  function cancelTargetSelection() {
    const saved = pendingTargetSelection;
    closeTargetModal();
    if (saved && saved.mode === 'flash_battle' && saved.attackerUid) {
      const attacker = DuelState.opponent.field.find(s => s.uid === saved.attackerUid);
      if (attacker) {
        const readyBlockers = DuelState.player.field.filter(s => !s.isExhausted);
        showBlockPrompt(attacker, readyBlockers);
      }
    }
  }

  function castFlashInBattle(cardUid, attackerUid, targetSpiritUid = null) {
    const card = DuelState.player.hand.find(c => c.uid === cardUid);
    if (!card) return;

    const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid) || DuelState.selectedAttacker;
    const isSpirit = card.type === 'Spirit';
    const cost = card.cost || 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;

    // Check affordability
    if (DuelState.player.reserve < totalNeeded) {
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(cardUid);
        return;
      }
      if (typeof showToast === 'function') showToast(`Need ${totalNeeded} cores to cast "${card.name}"!`, 'warning');
      return;
    }

    // Single-target BP buff check: if player has > 1 spirit and no target specified yet, open target selector!
    if (!isSpirit && isSingleTargetBpBuff(card) && DuelState.player.field.length > 1 && !targetSpiritUid) {
      openTargetModal(card, 'flash_battle', attackerUid);
      return;
    }

    // Direct pay from reserve
    DuelState.player.reserve -= totalNeeded;
    DuelState.player.trash += cost;
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === cardUid);
    if (cardIdx !== -1) DuelState.player.hand.splice(cardIdx, 1);

    AudioFX.coreChime();

    if (isSpirit) {
      // Swift / Flash Spirit summon
      const coresToPlace = 1;
      const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace);
      card.currentCores = coresToPlace;
      card.currentLevel = level;
      card.currentBp = bp;
      card.isExhausted = false;
      card.hasAttacked = false;
      DuelState.player.field.push(card);
      AudioFX.summon();
      addLog(`⚡ **[SWIFT FLASH SUMMON]**: "${card.name}" Flash-summoned onto the battlefield during combat (Lv${level}, ${bp} BP)!`, 'magic');
      if (typeof showToast === 'function') showToast(`⚡ Flash Summoned "${card.name}"! Ready to block.`, 'success');
      executeWhenSummonedEffects(card, 'player');
    } else {
      // Magic Flash effect execution
      sendToTrash(card, 'player', 'Cast Flash Magic in Battle');
      const effectDesc = applyMagicEffect(card, 'player', attacker, targetSpiritUid);
      addLog(`✨ **[FLASH MAGIC CAST]**: "${card.name}" activated during Flash timing! ${effectDesc}`, 'magic');
      if (typeof showToast === 'function') showToast(`✨ "${card.name}" Activated!`, 'success');

      // Specific check: Blizzard Wall ends attack step!
      if (card.name.includes('Blizzard Wall')) {
        closeBlockModal();
        DuelState.combatEvent = null;
        renderDuelTable();
        addLog(`❄️ **[ATTACK STEP TERMINATED]**: Blizzard Wall extinguished all enemy attacks!`, 'step');
        safeTimeout(endTurn, 1000);
        return;
      }
    }

    renderDuelTable();

    // Re-render the block prompt so updated BP or newly summoned Swift spirit appears!
    const readyBlockers = DuelState.player.field.filter(s => !s.isExhausted);
    if (attacker) {
      showBlockPrompt(attacker, readyBlockers);
    }
  }

  function applyMagicEffect(card, side = 'player', contextAttacker = null, targetSpiritUid = null) {
    let effectDesc = '';
    const isPlayer = side === 'player';
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;

    const name = card.name || '';
    const eff = (card.effect || '').toLowerCase();
    const currentPhase = DuelState.phases[DuelState.phaseIndex] || 'MAIN';
    const isCombat = (currentPhase === 'ATTACK') || (DuelState.combatEvent !== null);

    if (name.includes('Blizzard Wall')) {
      effectDesc = 'Ended the Attack Step! No further life damage can be inflicted this turn.';
    } else if (name.includes('Defensive Aura') || (eff.includes('all your blocking spirits') && eff.includes('+3000 bp'))) {
      // Team-wide blocking buff (official text: "give all your blocking Spirits +3000 BP")
      myField.forEach(s => {
        s.currentBp += 3000;
        s.battleBp = (s.battleBp || s.currentBp) + 3000;
      });
      effectDesc = 'Granted +3000 BP to all allied defending spirits!';
    } else if (name.includes('Double Draw') && !isCombat) {
      // Main Step: Draw 2 cards
      const d1 = myDeck.shift();
      const d2 = myDeck.shift();
      if (d1) myHand.push(d1);
      if (d2) myHand.push(d2);
      effectDesc = `${isPlayer ? 'You drew' : 'Opponent drew'} 2 cards from deck!`;
    } else if ((name.includes('Burst Draw') || eff.includes('draw two cards')) && !eff.includes('give a spirit') && !isCombat) {
      const d1 = myDeck.shift();
      const d2 = myDeck.shift();
      if (d1) myHand.push(d1);
      if (d2) myHand.push(d2);
      effectDesc = `${isPlayer ? 'You drew' : 'Opponent drew'} 2 cards from deck!`;
    } else if (name.includes('Flame Dance') || (eff.includes('destroy') && eff.includes('4000 bp or less'))) {
      const target = enemyField.find(s => s.currentBp <= 4000);
      if (target) {
        const idx = enemyField.indexOf(target);
        enemyField.splice(idx, 1);
        enemyReserve.reserve += target.currentCores;
        sendToTrash(target, isPlayer ? 'opponent' : 'player', `Destroyed by ${card.name}`);
        effectDesc = `Destroyed enemy "${target.name}" (${target.currentBp} BP)! Cores returned to reserve.`;
      } else {
        effectDesc = 'No enemy spirit with 4000 BP or less to destroy.';
      }
    } else if (name.includes('Flame Tempest') || (eff.includes('destroy all') && eff.includes('3000 bp or less'))) {
      const destroyed = [];
      for (let i = enemyField.length - 1; i >= 0; i--) {
        if (enemyField[i].currentBp <= 3000) {
          const s = enemyField.splice(i, 1)[0];
          enemyReserve.reserve += s.currentCores;
          sendToTrash(s, isPlayer ? 'opponent' : 'player', `Incinerated by ${card.name}`);
          destroyed.push(s.name);
        }
      }
      effectDesc = destroyed.length ? `Incinerated ${destroyed.join(', ')} (<= 3000 BP)!` : 'No enemy spirits <= 3000 BP.';
    } else if (name.includes('Ice Age Shield') || name.includes('Co-op Barrier')) {
      if (myField.length) {
        myField[0].isExhausted = false; // Refresh spirit
      }
      effectDesc = 'Refreshed an allied spirit and erected a protective shield against life damage!';
    } else {
      // Dynamic BP Boost or general effect resolution
      const hasBpBoost = /(?:\+|plus\s*)\d+\s*bp/i.test(eff) || /bp\s*(?:\+|plus\s*)\d+/i.test(eff) || name.includes('Double Draw') || name.includes('Insect Aura');
      const isTeamWide = eff.includes('all your spirits') || eff.includes('all spirits') || eff.includes('all your blocking') || eff.includes('すべてのスピリット') || eff.includes('全スピリット');

      if (hasBpBoost) {
        const bpMatch = eff.match(/(?:\+|plus\s*)(\d+)\s*bp/i) || eff.match(/bp\s*(?:\+|plus\s*)(\d+)/i);
        const bpAmount = bpMatch ? parseInt(bpMatch[1], 10) : 2000;

        if (isTeamWide) {
          myField.forEach(s => {
            s.currentBp += bpAmount;
            s.battleBp = (s.battleBp || s.currentBp) + bpAmount;
          });
          effectDesc = `Granted +${bpAmount} BP to all allied spirits!`;
        } else {
          // SINGLE-TARGET BP BUFF (e.g. Insect Aura, Double Draw flash, Carry Cores, etc.)
          if (!myField.length) {
            effectDesc = `Magic activated, but no allied Spirits were on the field to receive +${bpAmount} BP.`;
          } else {
            let target = null;
            if (targetSpiritUid) {
              target = myField.find(s => s.uid === targetSpiritUid);
            }
            if (!target) {
              // Smart resolution:
              // 1. If in combat, prioritize the battling spirit
              if (DuelState.combatEvent) {
                if (DuelState.combatEvent.attacker && myField.some(s => s.uid === DuelState.combatEvent.attacker.uid)) {
                  target = DuelState.combatEvent.attacker;
                } else if (DuelState.combatEvent.blocker && myField.some(s => s.uid === DuelState.combatEvent.blocker.uid)) {
                  target = DuelState.combatEvent.blocker;
                }
              }
              // 2. If contextAttacker provided and on friendly field
              if (!target && contextAttacker && myField.some(s => s.uid === contextAttacker.uid)) {
                target = contextAttacker;
              }
              // 3. Fallback: highest BP spirit
              if (!target) {
                target = [...myField].sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0))[0];
              }
            }

            if (target) {
              target.currentBp += bpAmount;
              if (target.battleBp !== undefined) {
                target.battleBp += bpAmount;
              } else {
                target.battleBp = target.currentBp;
              }

              // Handle Carry Cores extra effect if present
              if (name.includes('Carry Cores') || eff.includes('void to your reserve')) {
                (isPlayer ? DuelState.player : DuelState.opponent).reserve += 1;
                effectDesc = `Transferred 1 Core from Void to Reserve and granted +${bpAmount} BP to "${target.name}" (now ${target.currentBp} BP)!`;
              } else {
                effectDesc = `Granted +${bpAmount} BP to "${target.name}" (now ${target.currentBp} BP)!`;
              }
            }
          }
        }
      } else {
        executeAbilityActions(card.effect, card, side, 'MAGIC', { contextAttacker, targetSpiritUid });
        effectDesc = `Cast "${card.name}" and unleashed its magical effects!`;
      }
    }

    return effectDesc;
  }

  function castMagic(uid, targetSpiritUid = null) {
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Magic can only be cast during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    const rest = checkCardUsageRestriction(card, 'player');
    if (!rest.allowed) {
      if (typeof showToast === 'function') showToast(`Official Restriction: "${card.name}" ${rest.reason}`, 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: "${card.name}" does not have [Flash] timing and can only be cast during the MAIN step!`, 'warning');
      return;
    }

    // Single-target BP buff check: if player has > 1 spirit and no target specified yet, open target selector!
    if (isSingleTargetBpBuff(card) && DuelState.player.field.length > 1 && !targetSpiritUid) {
      openTargetModal(card, 'magic');
      return;
    }

    if (DuelState.player.reserve < card.cost) {
      const { total } = getPlayerAvailableCores();
      if (total >= card.cost) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') showToast(`Need ${card.cost} cores to cast "${card.name}", but only have ${total} across Reserve and Field!`, 'warning');
      return;
    }

    DuelState.player.reserve -= card.cost;
    DuelState.player.trash += card.cost;
    DuelState.player.hand.splice(cardIdx, 1);
    
    // Check if card is banished from game after resolving (e.g. Purple Flash's Extreme)
    const isBanished = /banished from the game after its effect resolves|除外される/i.test(card.effect || '');
    if (isBanished) {
      sendToVoid(card, 'player', 'Banished from game after resolving');
      addLog(`🌌 **[EXCLUDED FROM GAME]**: "${card.name}" was banished from the game after its effect resolved!`, 'magic');
    } else {
      sendToTrash(card, 'player', 'Cast Magic from Hand');
    }

    AudioFX.coreChime();
    const effectDesc = applyMagicEffect(card, 'player', null, targetSpiritUid);
    addLog(`🔮 **MAGIC CAST**: "${card.name}" activated! ${effectDesc}`, 'magic');
    renderDuelTable();
  }

    // ── CORE SACRIFICE MODAL CONTROLLER ──
  function openSacrificeModal(uid) {
    const card = DuelState.player.hand.find(c => c.uid === uid);
    if (!card) return;

    if (!canPlayCardInCurrentPhase(card)) {
      const phase = DuelState.phases[DuelState.phaseIndex];
      if (typeof showToast === 'function') showToast(`Official Rule: Cannot summon "${card.name}" during ${phase} Step! Normal cards cannot be played in Attack Step.`, 'warning');
      return;
    }

    const { reserve, fieldCores, total: totalAvailable } = getPlayerAvailableCores();
    const isSpirit = card.type === 'Spirit';
    const cost = card.cost || 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;

    if (totalAvailable < totalNeeded) {
      showToast(`Need ${totalNeeded} total cores (Cost ${cost} + ${isSpirit ? '1 on Spirit' : '0'}), but you only have ${totalAvailable} across Reserve and Field!`, 'warning');
      return;
    }

    const reserveUsed = Math.min(reserve, totalNeeded);
    const fieldNeeded = totalNeeded - reserveUsed;

    // Optimal greedy pre-allocation: lowest BP spirits sacrificed first to preserve strongest cards
    const sortedSpirits = [...DuelState.player.field].sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
    const allocations = {};
    let collected = 0;

    sortedSpirits.forEach(s => {
      allocations[s.uid] = 0;
    });

    for (const s of sortedSpirits) {
      if (collected >= fieldNeeded) break;
      const neededFromThis = fieldNeeded - collected;
      const take = Math.min(s.currentCores, neededFromThis);
      allocations[s.uid] = take;
      collected += take;
    }

    pendingSacrifice = {
      card,
      isSpirit,
      cost,
      totalNeeded,
      reserveUsed,
      fieldNeeded,
      allocations
    };

    renderSacrificeModal();
    const modalEl = document.getElementById('battleSacrificeModal');
    if (modalEl) modalEl.classList.add('active');
  }

  function renderSacrificeModal() {
    if (!pendingSacrifice) return;
    const { card, isSpirit, cost, totalNeeded, reserveUsed, fieldNeeded, allocations } = pendingSacrifice;

    const currentFieldSelected = Object.values(allocations).reduce((sum, v) => sum + v, 0);
    const isComplete = currentFieldSelected === fieldNeeded;

    const titleEl = document.getElementById('sacrificeModalTitle');
    if (titleEl) {
      titleEl.textContent = isSpirit ? `Sacrifice Field Cores to Summon ${card.name}` : `Sacrifice Field Cores to Cast ${card.name}`;
    }

    const summaryBox = document.getElementById('sacrificeSummaryBox');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <span style="font-weight:700; color:#fff;">Total Required Cores:</span>
          <span style="font-weight:900; color:#fbbf24; font-size:1.05rem;">${totalNeeded} Cores <span style="font-size:0.75rem; color:#94a3b8;">(${cost} Cost + ${isSpirit ? '1 on Spirit' : '0'})</span></span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-bottom:0.25rem;">
          <span style="color:#94a3b8;">• Cores Paid from Reserve:</span>
          <span style="color:#38bdf8; font-weight:800;">${reserveUsed} Cores</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
          <span style="color:#94a3b8;">• Cores Needed from Field:</span>
          <span style="color:${isComplete ? '#34d399' : '#f87171'}; font-weight:800;">${currentFieldSelected} / ${fieldNeeded} Selected ${isComplete ? '✓' : ''}</span>
        </div>
      `;
    }

    const choicesEl = document.getElementById('sacrificeSpiritChoices');
    if (choicesEl) {
      choicesEl.innerHTML = DuelState.player.field.map(s => {
        const allocated = allocations[s.uid] || 0;
        const remaining = s.currentCores - allocated;
        const isDepleted = remaining <= 0;
        const cardCls = isDepleted ? 'sacrifice-spirit-card is-depleted' : (allocated > 0 ? 'sacrifice-spirit-card is-surviving' : 'sacrifice-spirit-card');

        return `
          <div class="${cardCls}">
            <div class="ssc-info">
              <div class="ssc-name">${s.name}</div>
              <div class="ssc-meta">Current: ${s.currentCores} Cores • LV${s.currentLevel} (${s.currentBp} BP)</div>
            </div>
            <div class="ssc-stepper">
              <button class="ssc-btn-step" onclick="BattleArena.adjustSacrificeCore('${s.uid}', -1)" ${allocated <= 0 ? 'disabled' : ''}>−</button>
              <span class="ssc-core-count">${getHexCoreSvg('blue', 14)} ${allocated} / ${s.currentCores}</span>
              <button class="ssc-btn-step" onclick="BattleArena.adjustSacrificeCore('${s.uid}', 1)" ${allocated >= s.currentCores || currentFieldSelected >= fieldNeeded ? 'disabled' : ''}>+</button>
            </div>
            <div class="ssc-status-badge ${isDepleted ? 'ssb-depleted' : 'ssb-survives'}">
              ${isDepleted ? '💀 Depletes to Trash' : `🛡️ Survives (${remaining} Core${remaining > 1 ? 's' : ''})`}
            </div>
          </div>
        `;
      }).join('');
    }

    const btnConfirm = document.getElementById('btnConfirmSacrifice');
    if (btnConfirm) {
      btnConfirm.disabled = !isComplete;
      btnConfirm.style.opacity = isComplete ? '1' : '0.4';
      btnConfirm.textContent = isComplete ? `⚡ Confirm Sacrifice & ${isSpirit ? 'Summon' : 'Cast'}` : `Select ${fieldNeeded - currentFieldSelected} More Field Core${(fieldNeeded - currentFieldSelected) > 1 ? 's' : ''}`;
    }
  }

  function adjustSacrificeCore(spiritUid, delta) {
    if (!pendingSacrifice) return;
    const { fieldNeeded, allocations } = pendingSacrifice;
    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit) return;

    const currentVal = allocations[spiritUid] || 0;
    const currentTotal = Object.values(allocations).reduce((sum, v) => sum + v, 0);

    if (delta > 0) {
      if (currentVal < spirit.currentCores && currentTotal < fieldNeeded) {
        allocations[spiritUid] = currentVal + 1;
      }
    } else if (delta < 0) {
      if (currentVal > 0) {
        allocations[spiritUid] = currentVal - 1;
      }
    }
    renderSacrificeModal();
  }

  function closeSacrificeModal() {
    pendingSacrifice = null;
    const modalEl = document.getElementById('battleSacrificeModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  function executeSacrificeSummon() {
    if (!pendingSacrifice) return;
    const { card, isSpirit, cost, totalNeeded, reserveUsed, fieldNeeded, allocations } = pendingSacrifice;

    const currentFieldSelected = Object.values(allocations).reduce((sum, v) => sum + v, 0);
    if (currentFieldSelected !== fieldNeeded) {
      if (typeof showToast === 'function') showToast(`Please allocate exactly ${fieldNeeded} cores from field spirits!`, 'warning');
      return;
    }

    // 1. Remove card from hand
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === card.uid);
    if (cardIdx !== -1) {
      DuelState.player.hand.splice(cardIdx, 1);
    }

    // 2. Deduct Reserve cores (including Soul Core if used)
    const regReserve = DuelState.player.reserve || 0;
    if (reserveUsed > regReserve) {
      DuelState.player.reserve = 0;
      if (DuelState.player.soulCoreLocation === 'reserve') {
        DuelState.player.soulCoreLocation = 'trash';
      }
    } else {
      DuelState.player.reserve -= reserveUsed;
    }

    // 3. Deduct cores from field spirits & track depleted spirits
    const sacrificedSpirits = [];
    const survivingSpirits = [];

    DuelState.player.field.forEach(spirit => {
      const take = allocations[spirit.uid] || 0;
      spirit.currentCores -= take;
      if (spirit.currentCores <= 0) {
        if (spirit.hasSoulCore) {
          spirit.hasSoulCore = false;
          if (DuelState.player.soulCoreSpiritUid === spirit.uid) {
            DuelState.player.soulCoreLocation = 'trash';
            DuelState.player.soulCoreSpiritUid = null;
          }
        }
        sacrificedSpirits.push(spirit);
      } else {
        const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
        spirit.currentLevel = level;
        spirit.currentBp = bp;
        survivingSpirits.push(spirit);
      }
    });

    DuelState.player.field = survivingSpirits;
    DuelState.player.trash += cost;
    if (sacrificedSpirits.length > 0) {
      sacrificedSpirits.forEach(s => {
        sendToTrash(s, 'player', `Depleted cores for ${card.name} summon`);
      });
    }
    if (!isSpirit) {
      sendToTrash(card, 'player', 'Cast Magic from Hand (Field Sacrifice)');
    }

    let newLevel = 1;
    let newBp = 2000;
    if (isSpirit) {
      const coresToPlace = 1;

      // Check Tribute requirement on Sacrifice Summon
      const tributeReq = getCardTributeRequirement(card);
      if (tributeReq) {
        const eligible = getEligibleTributeSpirits(tributeReq, DuelState.player.field);
        if (eligible.length === 1) {
          closeSacrificeModal();
          executeTribute(card, eligible[0], tributeReq, cost, coresToPlace);
          return;
        } else if (eligible.length > 1) {
          closeSacrificeModal();
          openTributeModal(card, tributeReq, cost, coresToPlace, eligible);
          return;
        }
      }
      const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace);
      newLevel = level;
      newBp = bp;
      card.currentCores = coresToPlace;
      card.currentLevel = level;
      card.currentBp = bp;
      card.isExhausted = false;
      card.hasAttacked = false;
      DuelState.player.field.push(card);
    }

    closeSacrificeModal();

    AudioFX.slash();
    setTimeout(() => {
      if (isSpirit) AudioFX.summon();
      else AudioFX.coreChime();
    }, 150);

    if (sacrificedSpirits.length > 0) {
      const names = sacrificedSpirits.map(s => `"${s.name}"`).join(', ');
      addLog(`💀 **CORE SACRIFICE**: ${names} depleted to 0 cores and sent to Trash to pay ${fieldNeeded} Cores!`, 'damage');
    }
    if (isSpirit) {
      addLog(`✨ **SUMMONED**: "${card.name}" entered the battlefield with 1 Core (Lv${newLevel}, ${newBp} BP)!`, 'step');
      executeWhenSummonedEffects(card, 'player');
    } else {
      const effectDesc = applyMagicEffect(card);
      addLog(`🔮 **MAGIC CAST**: "${card.name}" activated using field cores! ${effectDesc}`, 'magic');
    }

    renderDuelTable();
  }

  function handleSpiritClick(uid, side) {
    if (side === 'player') {
      const spirit = DuelState.player.field.find(s => s.uid === uid);
      if (!spirit) return;

      const phase = DuelState.phases[DuelState.phaseIndex];
      if (DuelState.activePlayer === 'player' && phase === 'ATTACK') {
        if (DuelState.turn === 1) {
          if (typeof showToast === 'function') showToast('Official Rule: The first player cannot attack on Turn 1!', 'warning');
          return;
        }
        if (spirit.isExhausted) {
          if (typeof showToast === 'function') showToast(`"${spirit.name}" is EXHAUSTED and cannot attack this turn!`, 'warning');
          return;
        }
        executePlayerAttack(spirit);
      } else {
        DuelState.selectedPlayerCard = spirit;
        renderCardInspector();
        openCardDetail(spirit.name);
      }
    } else if (side === 'opponent') {
      const spirit = DuelState.opponent.field.find(s => s.uid === uid);
      if (spirit) {
        DuelState.selectedPlayerCard = spirit;
        renderCardInspector();
        openCardDetail(spirit.name);
      }
    }
  }

  // ── BATTLE SPIRITS KEYWORD MECHANICS ENGINE ──
  function hasClash(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('clash') || eff.includes('confront') || eff.includes('true-clash') || eff.includes('supreme clash') || eff.includes('ultra clash') || eff.includes('激突') || eff.includes('真・激突');
  }

  function hasCurse(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('curse') || eff.includes('true-curse') || eff.includes('grudging curse') || eff.includes('jugeki') || eff.includes('呪撃') || eff.includes('真・呪撃');
  }

  function hasCrush(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('crush') || eff.includes('great crush') || eff.includes('wave crush') || eff.includes('xv crush') || eff.includes('funsai') || eff.includes('粉砕') || eff.includes('大粉砕');
  }

  function hasArmor(spirit, color) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    const col = (color || '').toLowerCase();
    return eff.includes(`armor: ${col}`) || eff.includes(`heavy armor: ${col}`) || eff.includes(`ultra armor: ${col}`) || eff.includes('armor: all') || eff.includes('a.t. field') || eff.includes('ps armor');
  }

  function hasHolyLife(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('holy life') || eff.includes('ultra holy life') || eff.includes('heavenly light') || eff.includes('divine holy life') || eff.includes('聖命') || eff.includes('極聖命');
  }

  function hasWindstorm(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/\[(?:Windstorm|Fierce Windstorm|Whirlwind)(?:[:：]\s*(\d+))?\]/i) ||
              spirit.effect.match(/【?暴風(?:[:：]\s*(\d+))?】?/i);
    if (m) return parseInt(m[1] || '1', 10);
    return 0;
  }

  function hasAssault(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/\[(?:Assault|Great Assault|Grand Assault)(?:[:：]\s*(\d+))?\]/i) ||
              spirit.effect.match(/【?強襲(?:[:：]\s*(\d+))?】?/i);
    if (m) return parseInt(m[1] || '1', 10);
    return 0;
  }

  function hasAwaken(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('awaken') || eff.includes('true-awaken') || eff.includes('dragon awaken') || eff.includes('覚醒') || eff.includes('真・覚醒');
  }

  function hasConsecutiveBlade(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('consecutive blade') || eff.includes('rekka consecutive blade') || eff.includes('連刃') || eff.includes('烈火連刃');
  }

  function getWhenAttacksBpBoost(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*(?:\(When Attacks\)|『このスピリットのアタック時』)?[^\.]*?(?:gains|gets|\+)\s*(\d+)[\s]*BP/i);
    if (m && m[2]) {
      const levelTag = m[1] || '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {
        return parseInt(m[2], 10);
      }
    }
    return 0;
  }

  function getAttackSymbols(spirit, attackingSide = null) {
    if (!spirit) return 1;

    // 1. Base symbols from card symbol property
    const symStr = String(spirit.symbol || '').trim();
    let base = 1;
    const px20 = (symStr.match(/20px/g) || []).length;
    const px25 = (symStr.match(/25px/g) || []).length;
    if (px20 + px25 > 0) {
      base = px20 + px25;
    } else if (/^\d+$/.test(symStr)) {
      base = parseInt(symStr, 10);
    } else if (symStr.includes(',') || symStr.includes('/')) {
      const tokens = symStr.split(/[,/]/).map(t => t.trim()).filter(Boolean);
      if (tokens.length > 1) base = tokens.length;
    }

    let total = base + (spirit.extraSymbols || 0);
    const eff = spirit.effect || '';
    const level = spirit.currentLevel || 1;

    // 2. Self-granted additional symbols from spirit.effect
    if (eff) {
      const blocks = getCardAbilityBlocks(eff);
      for (const b of blocks) {
        const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
        if (lvlMatch && !isEffectLevelMet(lvlMatch[1], level)) {
          continue;
        }
        // Check Soul Core condition
        if (/while this spirit has (?:\[soul core\]|soul core)/i.test(b) && !spirit.hasSoulCore) {
          continue;
        }

        // Check additions: gains / gets +N symbols
        if (/this spirit (?:gains|gets)\s+(?:an?|one|\+?1)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?/i.test(b) ||
            /シンボル(?:1つ|\+1|を\+1)を追加/i.test(b)) {
          total += 1;
        } else if (/this spirit (?:gains|gets)\s+(?:two|\+?2)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?/i.test(b) ||
                   /シンボル2つを追加/i.test(b)) {
          total += 2;
        } else if (/this spirit (?:gains|gets)\s+(?:three|\+?3)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?/i.test(b)) {
          total += 3;
        }

        // Check direct symbol overrides: "this spirit has two symbols"
        if (/(?:has|becomes)\s+two\s+(?:[a-zA-Z]+\s+)?symbols/i.test(b)) {
          total = Math.max(total, 2);
        } else if (/(?:has|becomes)\s+three\s+(?:[a-zA-Z]+\s+)?symbols/i.test(b)) {
          total = Math.max(total, 3);
        } else if (/(?:has|becomes)\s+four\s+(?:[a-zA-Z]+\s+)?symbols/i.test(b)) {
          total = Math.max(total, 4);
        }
      }
    }

    // 3. Team / allied field auras granting additional symbols
    if (attackingSide && DuelState[attackingSide]) {
      const field = DuelState[attackingSide].field || [];
      for (const ally of field) {
        if (ally.uid === spirit.uid || !ally.effect) continue;
        const allyBlocks = getCardAbilityBlocks(ally.effect);
        for (const ab of allyBlocks) {
          const lvlMatch = ab.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
          if (lvlMatch && !isEffectLevelMet(lvlMatch[1], ally.currentLevel || 1)) {
            continue;
          }
          // Match: all your "Ancient Dragon" family Spirits gain an extra Red symbol
          const mFam = ab.match(/all your\s+((?:["'][^"']+["']\/?)+)\s+family spirits (?:gain|get)\s+(?:an?|one|\+?1)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?/i);
          if (mFam) {
            const fams = mFam[1].replace(/["']/g, '').split('/').map(f => f.trim().toLowerCase());
            const spiritFam = ((spirit.family || '') + ' ' + (spirit.families ? spirit.families.join(' ') : '') + ' ' + spirit.name).toLowerCase();
            if (fams.some(f => spiritFam.includes(f))) {
              total += 1;
            }
          }
          // Match: all your spirits gain an extra symbol
          if (/all your spirits (?:gain|get)\s+(?:an?|one|\+?1)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?/i.test(ab)) {
            total += 1;
          }
        }
      }
    }

    return Math.max(1, total);
  }

  function grantExtraSymbols(spirit, count = 1) {
    if (!spirit) return;
    spirit.extraSymbols = (spirit.extraSymbols || 0) + count;
    AudioFX.coreChime();
    addLog(`✨ **[SYMBOL EMPOWERMENT: ${spirit.name}]**: Gained +${count} Symbol(s)! (Current Attack Symbols: ${getAttackSymbols(spirit)})`, 'magic');
    renderDuelTable();
  }

  // ── BURST SYSTEM (DEDICATED BURST ZONE & SINGLE-USE ACTIVATION) ──
  function setBurst(uid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot set Burst on opponent's turn!", 'warning');
      return;
    }
    if (DuelState.player.burst) {
      if (typeof showToast === 'function') showToast("You already have a Burst set in your Burst Zone! Only 1 Burst allowed.", 'warning');
      return;
    }
    const idx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (idx === -1) return;
    const card = DuelState.player.hand.splice(idx, 1)[0];
    DuelState.player.burst = card;

    // Immediately update inspector to the set burst card so it reflects its new status
    DuelState.selectedPlayerCard = card;

    AudioFX.shield();
    addLog(`🔒 **BURST SET**: Set "${card.name}" face-down in your Burst Zone!`, 'step');
    renderDuelTable();
  }

  // ── BURST CONDITION CLASSIFICATION & PARSER ──
  function parseBurstCondition(effect) {
    if (!effect) return { type: 'NONE', label: 'None', raw: '' };

    const m = effect.match(/\[Burst:\s*([^\]]+)\](?:\s*\(([^)]+)\))?/i);
    let raw = '';
    if (m) {
      const p1 = m[1].trim();
      const p2 = m[2] ? m[2].trim() : '';
      raw = (p1.length > 2) ? p1 : (p2 || p1);
    } else {
      const jm = effect.match(/【バースト[：:]([^】]+)】/);
      if (jm) raw = jm[1].trim();
    }

    const rawLower = raw.toLowerCase();
    const effLower = effect.toLowerCase();

    // 1. AFTER_LIFE_DECREASED
    if (
      rawLower.includes('life is reduced') ||
      rawLower.includes('life is decreased') ||
      rawLower.includes('life is reeduced') ||
      rawLower.includes('ライフ減少後') ||
      effLower.includes('自分のライフ減少後') ||
      /\[burst:[^\]]*\]\s*\(?[^)]*life is reduced/i.test(effLower)
    ) {
      return {
        type: 'AFTER_LIFE_DECREASED',
        label: 'After your Life is reduced',
        raw: raw || 'After your Life is reduced'
      };
    }

    // 2. AFTER_OPPONENT_SUMMON_EFFECT
    if (
      rawLower.includes('when summoned') ||
      rawLower.includes('summoned/advents') ||
      rawLower.includes('summoned/deployed') ||
      rawLower.includes('summoned/reborn') ||
      rawLower.includes('summoned/advent') ||
      rawLower.includes('summoned by an opposing effect') ||
      rawLower.includes('summoned via an opposing effect') ||
      rawLower.includes('召喚時') ||
      rawLower.includes('煌臨時') ||
      rawLower.includes('配置時') ||
      /\[burst:[^\]]*\]\s*\(?[^)]*(?:when summoned|召喚時|煌臨時|配置時)/i.test(effLower)
    ) {
      return {
        type: 'AFTER_OPPONENT_SUMMON_EFFECT',
        label: "After an opposing Spirit's (When Summoned) effect resolves",
        raw: raw || "After an opposing Spirit's (When Summoned) effect resolves"
      };
    }

    // 3. AFTER_OPPONENT_ATTACKS
    if (
      ((rawLower.includes('attack') || rawLower.includes('attacks')) && (rawLower.includes('opposing') || rawLower.includes('opponent'))) ||
      rawLower.includes('相手のアタック後') ||
      rawLower.includes('相手のスピリットのアタック後') ||
      rawLower.includes('アタック後') ||
      /\[burst:[^\]]*\]\s*\(?[^)]*opposing (?:spirit|ultimate).*attacks/i.test(effLower)
    ) {
      return {
        type: 'AFTER_OPPONENT_ATTACKS',
        label: 'After an opposing Spirit attacks',
        raw: raw || 'After an opposing Spirit attacks'
      };
    }

    // 4. AFTER_YOUR_SPIRIT_DESTROYED
    if (
      rawLower.includes('destroyed by the opponent') ||
      rawLower.includes('destroyed by the oopponent') ||
      rawLower.includes('depleted/destroyed') ||
      rawLower.includes('left the field') ||
      rawLower.includes('leaves the field') ||
      rawLower.includes('破壊後') ||
      rawLower.includes('消滅/破壊後') ||
      rawLower.includes('フィールドを離れた後') ||
      /\[burst:[^\]]*\]\s*\(?[^)]*(?:destroyed by the opponent|depleted\/destroyed|left the field)/i.test(effLower)
    ) {
      return {
        type: 'AFTER_YOUR_SPIRIT_DESTROYED',
        label: 'After your Spirit is depleted/destroyed by the Opponent',
        raw: raw || 'After your Spirit is depleted/destroyed by the Opponent'
      };
    }

    // 5. AFTER_OPPONENT_HAND_INCREASED
    if (
      rawLower.includes('hand increase') ||
      rawLower.includes('hand increases') ||
      rawLower.includes('hand increased') ||
      rawLower.includes('increases the opposing hand') ||
      rawLower.includes('手札が増加後') ||
      rawLower.includes('手札増加後') ||
      rawLower.includes('手札が増えた後') ||
      /\[burst:[^\]]*\]\s*\(?[^)]*opposing hand increases/i.test(effLower)
    ) {
      return {
        type: 'AFTER_OPPONENT_HAND_INCREASED',
        label: 'After the opposing Hand increases via an opposing effect',
        raw: raw || 'After the opposing Hand increases via an opposing effect'
      };
    }

    return {
      type: 'GENERIC_BURST',
      label: raw || 'Special Burst Condition',
      raw: raw || 'Special Burst Condition'
    };
  }

  function inspectBurst() {
    if (!DuelState.player.burst) {
      if (typeof showToast === 'function') showToast("Your Burst Zone is empty. Set a card with [Burst:] here!", 'info');
      return;
    }
    const b = DuelState.player.burst;
    DuelState.selectedPlayerCard = b;
    renderCardInspector();
    openCardDetail(b.name);
  }

  function inspectOpponentBurst() {
    if (!DuelState.opponent.burst) {
      if (typeof showToast === 'function') showToast("Opponent's Burst Zone is currently empty.", 'info');
      return;
    }
    const oppCond = parseBurstCondition(DuelState.opponent.burst.effect);
    if (typeof showToast === 'function') {
      showToast(`🔒 Opponent has set a secret face-down Burst trap! (Trigger: ${oppCond.label})`, 'warning');
    }
  }

  function openBurstPromptModal(card, cond, eventType, eventContext = {}) {
    DuelState.activeBurstTrigger = { side: 'player', card, cond, eventType, eventContext };
    AudioFX.burstIgnite();

    const modal = document.getElementById('battleBurstPromptModal');
    if (!modal) {
      activateBurst('player', true);
      return;
    }

    const titleEl = document.getElementById('burstPromptTitle');
    const descEl = document.getElementById('burstPromptDesc');
    const previewEl = document.getElementById('burstPromptCardPreview');

    if (titleEl) titleEl.textContent = `⚡ Trigger Burst: "${card.name}"?`;
    if (descEl) {
      descEl.innerHTML = `Condition Met: <strong style="color:#fdba74;">${cond.label}</strong>! Do you want to activate your set Burst trap now?`;
    }

    if (previewEl) {
      previewEl.innerHTML = `
        <div style="display:flex; gap:1rem; align-items:center;">
          <img src="${card.image_url}" alt="${card.name}" style="width:72px; height:101px; object-fit:cover; border-radius:0.4rem; border:1px solid rgba(234,88,12,0.5); box-shadow:0 0 10px rgba(234,88,12,0.3);" onerror="this.onerror=null; this.src='/assets/card_back.png';" />
          <div style="flex:1;">
            <div style="font-weight:800; font-size:1rem; color:#fff; margin-bottom:0.25rem;">${card.name}</div>
            <div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:0.4rem;">${card.type} • ${card.color} • Cost ${card.cost}</div>
            <div style="font-size:0.78rem; color:#fed7aa; background:rgba(234,88,12,0.15); border:1px solid rgba(234,88,12,0.3); padding:0.35rem 0.5rem; border-radius:0.35rem; line-height:1.35;">
              <strong style="color:#fb923c;">[BURST CONDITION MET]:</strong> ${cond.raw || cond.label}
            </div>
          </div>
        </div>
      `;
    }

    modal.classList.add('active');
    renderBurstZones();
  }

  function confirmBurstTrigger() {
    closeBurstPromptModal();
    if (DuelState.activeBurstTrigger && DuelState.activeBurstTrigger.side === 'player') {
      activateBurst('player', true);
    }
  }

  function declineBurstTrigger() {
    closeBurstPromptModal();
    if (DuelState.activeBurstTrigger) {
      const cardName = DuelState.activeBurstTrigger.card?.name || 'Burst';
      addLog(`🛡️ **[BURST HELD]**: Player chose not to trigger "${cardName}" this time. Card remains safely set in Burst Area.`, 'step');
      DuelState.activeBurstTrigger = null;
      renderBurstZones();
    }
  }

  function closeBurstPromptModal() {
    const modal = document.getElementById('battleBurstPromptModal');
    if (modal) modal.classList.remove('active');
  }

  function activateBurst(side = 'player', isConfirmed = false) {
    const isPlayer = side === 'player';
    const burstCard = isPlayer ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) {
      if (isPlayer && typeof showToast === 'function') showToast("No Burst card is currently set!", 'info');
      return;
    }

    const cond = parseBurstCondition(burstCard.effect);

    // Official Rule Protection: Player cannot manually activate Burst unless the trigger condition has been met!
    if (isPlayer && !isConfirmed && !DuelState.activeBurstTrigger) {
      if (typeof showToast === 'function') {
        showToast(`🔒 Cannot trigger Burst! Condition not met: "${cond.label}". Bursts can only activate when their specific trigger condition occurs in battle.`, 'warning');
      }
      return;
    }

    // Clear active trigger state and close modal
    DuelState.activeBurstTrigger = null;
    closeBurstPromptModal();

    // 1. Immediately consume from Burst Zone to guarantee it cannot be duplicated or re-triggered
    if (isPlayer) DuelState.player.burst = null;
    else DuelState.opponent.burst = null;

    if (DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === burstCard.uid) {
      DuelState.selectedPlayerCard = null;
    }

    AudioFX.burstIgnite();
    addLog(`🚨 **[BURST ACTIVATED]**: "${burstCard.name}" triggered by ${isPlayer ? 'Player' : 'Opponent'} [Condition: ${cond.label}]!`, 'magic');

    // 2. Resolve effect based on card type without duplicating
    if (burstCard.type === 'Spirit') {
      const targetField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
      // Prevent duplicate spirits if already on field
      if (!targetField.some(s => s.uid === burstCard.uid)) {
        const coresToPlace = 1;
        const { level, bp } = calculateBpAndLevel(burstCard.levels, coresToPlace);
        burstCard.currentCores = coresToPlace;
        burstCard.currentLevel = level;
        burstCard.currentBp = bp;
        burstCard.isExhausted = false;
        burstCard.hasAttacked = false;
        targetField.push(burstCard);
        setTimeout(() => AudioFX.summon(), 180);
        addLog(`✨ **BURST SUMMON**: "${burstCard.name}" summoned to the battle line for free (Lv${level}, ${bp} BP)!`, 'step');
        executeWhenSummonedEffects(burstCard, side);
      }
    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      sendToTrash(burstCard, side, `${isPlayer ? 'Player' : 'Opponent'} Burst Magic Activated`);
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }

    // Trigger universal (After Your Burst Activates) across all allied Spirits on field!
    checkAfterBurstEffects(side, burstCard);

    renderDuelTable();
  }

  function checkAfterBurstEffects(side, activatedBurstCard) {
    if (!activatedBurstCard) return;
    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    if (!myField || !myField.length) return;

    for (const spirit of [...myField]) {
      if (!spirit || !spirit.effect) continue;
      const blocks = getCardAbilityBlocks(spirit.effect);
      const eligibleBlocks = blocks.filter(b => /(?:After Your Burst Activates|After a Burst Activates)/i.test(b));
      if (!eligibleBlocks.length) continue;

      for (const b of eligibleBlocks) {
        const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
        const levelTag = lvlMatch ? lvlMatch[1] : '';
        if (!isEffectLevelMet(levelTag, spirit.currentLevel)) continue;

        // Check Cost condition (e.g. "If the card activated was Cost 5 or less")
        const costMatch = b.match(/If the card activated was Cost\s*(\d+)\s*or\s*(less|more)/i);
        if (costMatch) {
          const reqCost = parseInt(costMatch[1], 10);
          const isLess = costMatch[2].toLowerCase() === 'less';
          const cardCost = activatedBurstCard.cost !== undefined ? activatedBurstCard.cost : 0;
          if (isLess && cardCost > reqCost) continue;
          if (!isLess && cardCost < reqCost) continue;
        }

        // Check Family condition (e.g. "if the activated Burst was a 'Primordial'/'Cloudbuilt' family card")
        const famMatch = b.match(/if the activated Burst was a\s+["']?([^"']+)["']?\s+family/i);
        if (famMatch) {
          const reqFam = famMatch[1].toLowerCase();
          const cardFams = (activatedBurstCard.family || '').toLowerCase();
          if (!cardFams.includes(reqFam)) continue;
        }

        addLog(`⚡ **[AFTER BURST ACTIVATES: ${spirit.name}]**: Resonating with activated Burst "${activatedBurstCard.name}"!`, 'magic');
        executeAbilityActions(b, spirit, side, 'AFTER_BURST_ACTIVATES', { burstCard: activatedBurstCard });
      }
    }
  }

  function checkBurstTrigger(side, eventType = 'AFTER_LIFE_DECREASED', eventContext = {}) {
    const isPlayer = side === 'player';
    const burstCard = isPlayer ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) return false;

    const cond = parseBurstCondition(burstCard.effect);

    // Strict validation: eventType must match the card's specific condition
    const matches = (cond.type === eventType) || (cond.type === 'GENERIC_BURST');
    if (!matches) {
      // Condition does NOT match: card remains securely set in Burst Area
      return false;
    }

    if (isPlayer) {
      openBurstPromptModal(burstCard, cond, eventType, eventContext);
      return true;
    } else {
      // Opponent AI automatically resolves
      addLog(`🃏 Opponent's Burst Trap met condition [${cond.label}]!`, 'magic');
      safeTimeout(() => activateBurst('opponent', true), 500);
      return true;
    }
  }

  function checkOpposingAttackDeclarationEffects(attackingSide) {
    const defendingSide = attackingSide === 'player' ? 'opponent' : 'player';
    const defField = defendingSide === 'player' ? DuelState.player.field : DuelState.opponent.field;
    for (const s of defField) {
      if (!s || !s.effect) continue;
      const effLower = s.effect.toLowerCase();
      // Strike-Siegwurm: "When an opposing Spirit attacks, refresh this Spirit"
      if ((effLower.includes('when an opposing spirit attacks') || effLower.includes('when opposing spirit attacks')) && effLower.includes('refresh this spirit')) {
        if (s.isExhausted) {
          s.isExhausted = false;
          AudioFX.refresh();
          addLog(`🛡️ **[OPPOSING ATTACK REFRESH: ${s.name}]**: Readied and refreshed for defense against incoming strike!`, 'magic');
          if (defendingSide === 'player' && typeof showToast === 'function') {
            showToast(`🛡️ "${s.name}" refreshed on opposing attack!`, 'info');
          }
        }
      }
    }
  }

  function checkLifeDecreasedEffects(damagedSide) {
    const myField = damagedSide === 'player' ? DuelState.player.field : DuelState.opponent.field;
    for (const s of myField) {
      if (!s || !s.effect) continue;
      const effLower = s.effect.toLowerCase();
      // Oozuchi: "When your Life is reduced by opposing Spirits, refresh a White Spirit you control"
      if (effLower.includes('when your life is reduced') && effLower.includes('refresh')) {
        const whiteSpirits = myField.filter(ally => ((ally.color || '').toLowerCase() === 'white') && ally.isExhausted);
        const targetToRefresh = whiteSpirits.length > 0 ? whiteSpirits[0] : (s.isExhausted ? s : null);
        if (targetToRefresh) {
          targetToRefresh.isExhausted = false;
          AudioFX.refresh();
          addLog(`🛡️ **[LIFE DAMAGE REFRESH: ${s.name}]**: Refreshed "${targetToRefresh.name}" upon Life reduction!`, 'magic');
          if (damagedSide === 'player' && typeof showToast === 'function') {
            showToast(`🛡️ Refreshed "${targetToRefresh.name}"!`, 'info');
          }
        }
      }
    }
  }

  // ── COMBAT RESOLUTION ──
  function executePlayerAttack(attacker) {
    if (DuelState.turn === 1 && DuelState.activePlayer === 'player') {
      if (typeof showToast === 'function') showToast('Official Rule: The first player cannot attack on Turn 1!', 'warning');
      return;
    }
    attacker.isExhausted = true;
    attacker.hasAttacked = true;
    checkGrandFieldOnOpponentExhaust('opponent');

    // Reset battle BP boost before attack resolution
    attacker.battleBpBoost = 0;
    delete attacker.battleBp;
    recalculateSpiritBp(attacker);

    AudioFX.slash();
    executeWhenAttacksEffects(attacker, 'player');

    // Fallback if not processed via ability blocks
    const fallbackBoost = getWhenAttacksBpBoost(attacker);
    if (fallbackBoost > 0 && !attacker.battleBpBoost) {
      attacker.battleBpBoost = fallbackBoost;
      const base = attacker.baseBp !== undefined ? attacker.baseBp : (attacker.currentBp || 0);
      attacker.battleBp = base + fallbackBoost;
      attacker.currentBp = attacker.battleBp;
    }

    const battleBp = attacker.battleBp || attacker.currentBp;
    addLog(`⚔️ **ATTACK DECLARED**: "${attacker.name}" attacks with ${battleBp} BP!${(attacker.battleBpBoost || 0) > 0 ? ` (+${attacker.battleBpBoost} BP When Attacks bonus)` : ''}`, 'damage');

    // Trigger Opponent Burst: [After an opposing Spirit attacks]
    checkBurstTrigger('opponent', 'AFTER_OPPONENT_ATTACKS', { attacker });

    // Defending field triggers (e.g. Strike-Siegwurm refresh)
    checkOpposingAttackDeclarationEffects('player');

    // Check Crush: Mill top card(s) of opponent deck
    if (hasCrush(attacker)) {
      const mill = Math.min(attacker.currentLevel || 1, DuelState.opponent.deck.length);
      if (mill > 0) {
        for (let m = 0; m < mill; m++) {
          const c = DuelState.opponent.deck.shift();
          if (c) {
            sendToTrash(c, 'opponent', `Milled by [Crush] of ${attacker.name}`);
          }
        }
        addLog(`🌊 **[CRUSH ACTIVATED]**: "${attacker.name}" milled ${mill} card(s) from opponent's deck to Trash!`, 'damage');
        if (!DuelState.opponent.deck.length) {
          DuelState.opponent.life = 0;
          checkGameOver();
          return;
        }
      }
    }

    // AI chooses to Block or take Life Damage
    const isClash = hasClash(attacker);
    const readyBlockers = DuelState.opponent.field.filter(s => !s.isExhausted);
    let chosenBlocker = null;

    // Check Unblockable status
    if (hasCantBeBlocked(attacker)) {
      addLog(`⚡ **[UNBLOCKABLE ATTACK: ${attacker.name}]**: This Spirit cannot be blocked! Interception blocked!`, 'damage');
    } else {
      if (isClash && readyBlockers.length > 0) {
        addLog(`⚔️ **[CLASH ACTIVATED]**: "${attacker.name}" forces opposing defense to intercept!`, 'damage');
        readyBlockers.sort((a, b) => b.currentBp - a.currentBp);
        chosenBlocker = readyBlockers[0];
      } else {
        const winBlocker = readyBlockers.find(s => s.currentBp > battleBp);
        if (winBlocker) {
          chosenBlocker = winBlocker;
        } else if (DuelState.opponent.life <= 1 && readyBlockers.length) {
          readyBlockers.sort((a, b) => a.currentBp - b.currentBp);
          chosenBlocker = readyBlockers[0];
        } else if (readyBlockers.length && Math.random() < 0.4) {
          chosenBlocker = readyBlockers[0];
        }
      }

      // Check Siegfried-Necro block sacrifice restriction:
      // "When your Ancient Dragon / Astral Dragon / Ogre Wizard attacks, opponent can't block unless they destroy one of their Spirits"
      const blockSacrificeReq = getBlockSacrificeRequirement(attacker, 'player');
      if (blockSacrificeReq && chosenBlocker) {
        // Opponent MUST destroy another Spirit they control to block!
        const otherSpirits = DuelState.opponent.field.filter(s => s.uid !== chosenBlocker.uid);
        if (otherSpirits.length > 0) {
          // AI sacrifices its lowest-BP other spirit
          otherSpirits.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
          const sacrificed = otherSpirits[0];
          const sIdx = DuelState.opponent.field.findIndex(s => s.uid === sacrificed.uid);
          if (sIdx !== -1) {
            DuelState.opponent.field.splice(sIdx, 1);
            DuelState.opponent.reserve += sacrificed.currentCores;
            handleDestroyedSpiritCores(sacrificed, 'opponent');
            sendToTrash(sacrificed, 'opponent', `Sacrificed to block under ${blockSacrificeReq.sourceSpirit.name}`);
            AudioFX.slash();
            addLog(`⚡ **[BLOCK SACRIFICE: ${blockSacrificeReq.sourceSpirit.name}]**: Opponent sacrificed and destroyed their own "${sacrificed.name}" (${sacrificed.currentBp} BP) in order to block with "${chosenBlocker.name}"!`, 'damage');
            if (typeof showToast === 'function') {
              showToast(`⚡ Opponent sacrificed "${sacrificed.name}" to declare block!`, 'info');
            }
          }
        } else {
          // Opponent has NO OTHER spirits to sacrifice! Block is ILLEGAL!
          addLog(`⚡ **[BLOCK RESTRICTION: ${blockSacrificeReq.sourceSpirit.name}]**: Opponent controls no other Spirit to sacrifice! Block denied; attack strikes Opponent Life directly!`, 'damage');
          chosenBlocker = null;
        }
      }
    }

    if (chosenBlocker) {
      chosenBlocker.isExhausted = true;
      AudioFX.shield();
      addLog(`🛡️ **BLOCK DECLARED**: Opponent blocks with "${chosenBlocker.name}" (${chosenBlocker.currentBp} BP)!`, 'damage');
      executeWhenBlocksEffects(chosenBlocker, 'opponent', attacker);

      DuelState.combatEvent = {
        attacker,
        targetType: 'spirit',
        blocker: chosenBlocker,
        result: ''
      };
      renderDuelTable();

      setTimeout(() => {
        resolveClash(attacker, chosenBlocker, 'player', 'opponent');
      }, 1000);
    } else {
      // Direct Life Attack!
      DuelState.combatEvent = {
        attacker,
        targetType: 'life',
        blocker: null,
        result: 'DIRECT HIT! Opponent Life -1'
      };
      renderDuelTable();

      setTimeout(() => {
        AudioFX.lifeDamage();
        const symbols = getAttackSymbols(attacker, 'player');
        const damageToDeal = Math.min(symbols, DuelState.opponent.life);
        for (let s = 0; s < damageToDeal; s++) {
          DuelState.opponent.life = Math.max(0, DuelState.opponent.life - 1);
          DuelState.opponent.reserve += 1;
        }

        if (symbols > 1) {
          const symName = symbols === 2 ? 'DOUBLE SYMBOL' : (symbols === 3 ? 'TRIPLE SYMBOL' : `${symbols}-SYMBOL`);
          addLog(`💥💥 **[${symName}: ${attacker.name}]**: Direct attack with ${symbols} Symbols inflicts ${damageToDeal} Life Damage! (Opponent Life: ${DuelState.opponent.life})`, 'damage');
          if (typeof showToast === 'function') {
            showToast(`💥 ${symName}: Inflicted ${damageToDeal} Life Damage!`, 'success');
          }
        } else {
          addLog(`💥 **DIRECT HIT**: Opponent loses 1 Life! (Life remaining: ${DuelState.opponent.life})`, 'damage');
        }

        // [Holy Life / 聖命]: When this Spirit's attack reduces opponent's Life, put 1 Core from Void to your Life!
        if (hasHolyLife(attacker)) {
          if (DuelState.player.life < 5) {
            DuelState.player.life += 1;
            AudioFX.coreChime();
            addLog(`✨ **[HOLY LIFE ACTIVATED: ${attacker.name}]**: Channeled sacred light from the Void! Restored +1 Core to your Life! (Current Life: ${DuelState.player.life})`, 'magic');
            if (typeof showToast === 'function') {
              showToast(`✨ [Holy Life]: +1 Life Restored from Void!`, 'success');
            }
          } else {
            addLog(`✨ **[HOLY LIFE: ${attacker.name}]**: Life is already at maximum (5); divine radiance protects your boundary.`, 'step');
          }
        }
        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.opponent.life > 0) {
          checkLifeDecreasedEffects('opponent');
          checkBurstTrigger('opponent', 'AFTER_LIFE_DECREASED');
        }

        const isAttackerAlive = DuelState.player.field.some(s => s.uid === attacker.uid);
        if (isAttackerAlive) {
          checkEndOfBattleEffects([attacker], 'player', 'opponent', () => {
            endOfBattleBpReset(attacker);
            renderDuelTable();
          });
        } else {
          endOfBattleBpReset(attacker);
        }
      }, 900);
    }
  }

  function handleDestroyedSpiritCores(spirit, side) {
    executeWhenDestroyedEffects(spirit, side);
    if (!spirit) return;
    checkBurstTrigger(side, 'AFTER_YOUR_SPIRIT_DESTROYED', { destroyedSpirit: spirit });
    const isPlayer = side === 'player';
    const targetState = isPlayer ? DuelState.player : DuelState.opponent;
    if (spirit.hasSoulCore) {
      spirit.hasSoulCore = false;
      targetState.soulCoreLocation = 'reserve';
      targetState.soulCoreSpiritUid = null;
      if (isPlayer) {
        addLog(`🔥 **SOUL CORE SALVAGED**: Soul Core returned safely to Reserve from fallen "${spirit.name}".`, 'step');
      }
    }
  }

  function resolveClash(att, blk, attSide, defSide) {
    const attList = attSide === 'player' ? DuelState.player.field : DuelState.opponent.field;
    const defList = defSide === 'player' ? DuelState.player.field : DuelState.opponent.field;

    const attBp = att.battleBp || att.currentBp;
    const blkBp = blk.currentBp;
    let resultMsg = '';

    if (attBp > blkBp) {
      resultMsg = `VICTORY! ${att.name} destroyed ${blk.name}!`;
      const idx = defList.findIndex(s => s.uid === blk.uid);
      if (idx !== -1) {
        const dest = defList.splice(idx, 1)[0];
        recycleSpiritCoresToReserve(dest, defSide);
        sendToTrash(dest, defSide, `Destroyed in combat by ${att.name} (${attBp} vs ${blkBp} BP)`);
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${blk.name}" fell in battle!`, 'kill');

      // BP Comparison victory resolution
      executeBpComparisonEffects(att, blk, attSide, defSide);

      if (hasCurse(blk)) {
        addLog(`💀 **[CURSE TRIGGERED]**: "${blk.name}" activates Curse! Dragged "${att.name}" into the grave with it!`, 'kill');
        const attIdx = attList.findIndex(s => s.uid === att.uid);
        if (attIdx !== -1) {
          const destAtt = attList.splice(attIdx, 1)[0];
          recycleSpiritCoresToReserve(destAtt, attSide);
          sendToTrash(destAtt, attSide, `Dragged to Trash by [Curse] of ${blk.name}`);
        }
      }
    } else if (blkBp > attBp) {
      resultMsg = `DEFENDED! ${blk.name} defeated ${att.name}!`;
      const idx = attList.findIndex(s => s.uid === att.uid);
      if (idx !== -1) {
        const dest = attList.splice(idx, 1)[0];
        recycleSpiritCoresToReserve(dest, attSide);
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${att.name}" fell in battle!`, 'kill');

      if (hasCurse(att)) {
        addLog(`💀 **[CURSE TRIGGERED]**: "${att.name}" activates Curse! Dragged "${blk.name}" into the grave with it!`, 'kill');
        const blkIdx = defList.findIndex(s => s.uid === blk.uid);
        if (blkIdx !== -1) {
          const destBlk = defList.splice(blkIdx, 1)[0];
          recycleSpiritCoresToReserve(destBlk, defSide);
          sendToTrash(destBlk, defSide, `Dragged to Trash by [Curse] of ${att.name}`);
        }
      }
    } else {
      resultMsg = `MUTUAL CLASH! Both spirits fell!`;
      const idx1 = attList.findIndex(s => s.uid === att.uid);
      if (idx1 !== -1) {
        const d1 = attList.splice(idx1, 1)[0];
        recycleSpiritCoresToReserve(d1, attSide);
        sendToTrash(d1, attSide, `Mutual destruction in clash with ${blk.name}`);
      }
      const idx2 = defList.findIndex(s => s.uid === blk.uid);
      if (idx2 !== -1) {
        const d2 = defList.splice(idx2, 1)[0];
        recycleSpiritCoresToReserve(d2, defSide);
        sendToTrash(d2, defSide, `Mutual destruction in clash with ${att.name}`);
      }
      addLog(`💥 **DOUBLE KNOCKOUT**: Both "${att.name}" and "${blk.name}" destroyed each other!`, 'kill');
    }

    if (DuelState.combatEvent) {
      DuelState.combatEvent.result = resultMsg;
    }
    renderDuelTable();

    setTimeout(() => {
      const attAlive = (attSide === 'player' ? DuelState.player.field : DuelState.opponent.field).some(s => s.uid === att.uid);
      const blkAlive = (defSide === 'player' ? DuelState.player.field : DuelState.opponent.field).some(s => s.uid === blk.uid);
      const survivors = [];
      if (attAlive) survivors.push(att);
      if (blkAlive) survivors.push(blk);

      checkEndOfBattleEffects(survivors, attSide, defSide, () => {
        endOfBattleBpReset(att);
        endOfBattleBpReset(blk);
        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.activePlayer === 'opponent' && DuelState.player.life > 0 && DuelState.opponent.life > 0) {
          const profile = getActiveAiProfile('opponent');
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 800);
          } else {
            safeTimeout(endTurn, 700);
          }
        }
      });
    }, 1200);
  }

  // ── MANUAL STEP CONTROLLER (Right Column) ──
  function manualStep(stepName) {
    if (!DuelState.inDuel) return;
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("It is currently the Opponent's turn!", 'warning');
      return;
    }

    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    if (stepName && stepName !== currentPhase) {
      const targetIdx = DuelState.phases.indexOf(stepName);
      if (targetIdx < DuelState.phaseIndex) {
        if (typeof showToast === 'function') showToast(`The ${stepName} Step has already been completed this turn!`, 'info');
        return;
      } else if (targetIdx > DuelState.phaseIndex) {
        if (typeof showToast === 'function') showToast(`Please complete the current [${currentPhase} STEP] first!`, 'warning');
        return;
      }
    }

    const step = currentPhase;
    if (step === 'START') {
      AudioFX.init();
      AudioFX.playTone(330, 'triangle', 0.15, 0.08);
      addLog(`▶️ **START STEP**: Turn ${DuelState.turn} commenced! Next: Claim your Core from the Void.`, 'step');
      DuelState.phaseIndex = 1; // to CORE
      renderDuelTable();
    } else if (step === 'CORE') {
      // 1. Cosmic pulse on Central Void Reservoir
      const voidEl = document.getElementById('battleVoidZone');
      if (voidEl) {
        voidEl.classList.remove('void-pulse-active');
        void voidEl.offsetWidth;
        voidEl.classList.add('void-pulse-active');
        setTimeout(() => voidEl.classList.remove('void-pulse-active'), 900);
      }

      // 2. Claim +1 Core from Void into Player Reserve
      DuelState.player.reserve += 1;
      AudioFX.coreChime();

      // Trigger visual pulse on Reserve HUD counter
      const pResEl = document.getElementById('playerReserveCores');
      if (pResEl) {
        pResEl.classList.remove('core-pulse-active');
        void pResEl.offsetWidth; // trigger CSS animation reflow
        pResEl.classList.add('core-pulse-active');
        setTimeout(() => pResEl.classList.remove('core-pulse-active'), 800);
      }

      addLog(`🌌 **FROM THE VOID**: You claimed +1 Core from the infinite Void into your Reserve! (Total Reserve: ${DuelState.player.reserve})`, 'step');
      DuelState.phaseIndex = 2; // to DRAW
      renderDuelTable();
    } else if (step === 'DRAW') {
      const card = DuelState.player.deck.shift();
      if (!card) {
        DuelState.player.life = 0;
        addLog(`💀 **DECK OUT**: No cards left in Player's deck!`, 'damage');
        renderDuelTable();
        checkGameOver();
        return;
      }
      DuelState.player.hand.push(card);
      AudioFX.playTone(440, 'sine', 0.15, 0.1);
      addLog(`🎴 **DRAW STEP**: You drew "${card.name}" from your deck into your hand.`, 'step');
      DuelState.phaseIndex = 3; // to REFRESH
      renderDuelTable();
    } else if (step === 'REFRESH') {
      let count = 0;
      DuelState.player.field.forEach(s => {
        if (s.isExhausted) count++;
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      let coresReturned = 0;
      if (DuelState.player.trash > 0) {
        coresReturned = DuelState.player.trash;
        DuelState.player.reserve += coresReturned;
        DuelState.player.trash = 0;
      }
      let scReturned = false;
      if (DuelState.player.soulCoreLocation === 'trash') {
        DuelState.player.soulCoreLocation = 'reserve';
        DuelState.player.soulCoreSpiritUid = null;
        scReturned = true;
      }

      AudioFX.coreChime();
      setTimeout(() => AudioFX.shield(), 150);

      const pResEl = document.getElementById('playerReserveCores');
      if (pResEl) {
        pResEl.classList.remove('core-pulse-active');
        void pResEl.offsetWidth;
        pResEl.classList.add('core-pulse-active');
        setTimeout(() => pResEl.classList.remove('core-pulse-active'), 900);
      }

      let returnMsg = '';
      if (coresReturned > 0 && scReturned) {
        returnMsg = ` and returned ${coresReturned} Core(s) + 🔥 Soul Core from Trash to Reserve`;
      } else if (coresReturned > 0) {
        returnMsg = ` and returned ${coresReturned} Core(s) from Trash to Reserve`;
      } else if (scReturned) {
        returnMsg = ` and returned your 🔥 Soul Core from Trash to Reserve`;
      }

      addLog(`🔄 **REFRESH STEP**: Refreshed ${count} Spirit(s) to Ready${returnMsg}. (Reserve: ${DuelState.player.reserve})`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();
    } else if (step === 'MAIN') {
      if (DuelState.turn === 1) {
        addLog(`📜 **OFFICIAL RULE**: The First Player cannot attack on Turn 1. Skipping directly to End Step.`, 'system');
        DuelState.phaseIndex = 6; // to END
      } else {
        addLog(`⚔️ **ATTACK STEP**: You may click any Ready Spirit on your field to strike!`, 'step');
        DuelState.phaseIndex = 5; // to ATTACK
      }
      renderDuelTable();
    } else if (step === 'ATTACK') {
      addLog(`🛑 **ATTACK STEP COMPLETED**: Concluding attack phase. Moving to End Step.`, 'step');
      DuelState.phaseIndex = 6; // to END
      renderDuelTable();
    } else if (step === 'END') {
      endTurn();
    }
  }

  function nextPhase() {
    if (DuelState.activePlayer !== 'player') return;
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    manualStep(currentPhase);
  }

  function endTurn() {
    clearAllTimers();
    const prevSide = DuelState.activePlayer;
    DuelState.activePlayer = prevSide === 'player' ? 'opponent' : 'player';
    DuelState.phaseIndex = 0;
    DuelState.combatEvent = null;
    DuelState.selectedPlayerCard = null;
    DuelState.selectedAttacker = null;
    DuelState.activeBurstTrigger = null;
    closeBurstPromptModal();

    // Reset all turn and battle BP boosts for all spirits across both fields
    const allSpirits = [...(DuelState.player.field || []), ...(DuelState.opponent.field || [])];
    for (const s of allSpirits) {
      s.turnBpBoost = 0;
      s.battleBpBoost = 0;
      delete s.battleBp;
      recalculateSpiritBp(s);
    }

    DuelState.turn++;
    if (DuelState.activePlayer === 'player') {
      addLog(`🛑 **END STEP**: Turn passed to Player! Commencing Turn ${DuelState.turn}. Click "Begin Turn" on the Step Navigator to start.`, 'step');
      renderDuelTable();
      // NO auto timers here! Player has full manual control over every step!
    } else {
      addLog(`🛑 **END STEP**: Turn passed to Opponent! Commencing Turn ${DuelState.turn}.`, 'step');
      renderDuelTable();
      // Automatically advance opponent step-by-step with clean visual delays
      safeTimeout(advanceOpponentStep, 800);
    }
  }

  // ── OPPONENT STEP CONTROLLER ──
  function advanceOpponentStep() {
    if (DuelState.activePlayer !== 'opponent') return;
    const currentPhase = DuelState.phases[DuelState.phaseIndex];

    if (currentPhase === 'START') {
      AudioFX.playTone(280, 'sine', 0.15, 0.08);
      addLog(`▶️ **START STEP**: Opponent begins Turn ${DuelState.turn}.`, 'step');
      DuelState.phaseIndex = 1; // to CORE
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 800);
    } else if (currentPhase === 'CORE') {
      const voidEl = document.getElementById('battleVoidZone');
      if (voidEl) {
        voidEl.classList.remove('void-pulse-active');
        void voidEl.offsetWidth;
        voidEl.classList.add('void-pulse-active');
        setTimeout(() => voidEl.classList.remove('void-pulse-active'), 900);
      }
      DuelState.opponent.reserve += 1;
      AudioFX.coreChime();
      const oResEl = document.getElementById('opponentReserveCores');
      if (oResEl) {
        oResEl.classList.remove('core-pulse-active');
        void oResEl.offsetWidth;
        oResEl.classList.add('core-pulse-active');
        setTimeout(() => oResEl.classList.remove('core-pulse-active'), 800);
      }
      addLog(`🌌 **FROM THE VOID**: Opponent drew +1 Core from the infinite Void into Reserve (Reserve: ${DuelState.opponent.reserve}).`, 'step');
      DuelState.phaseIndex = 2; // to DRAW
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 800);
    } else if (currentPhase === 'DRAW') {
      const card = DuelState.opponent.deck.shift();
      if (!card) {
        DuelState.opponent.life = 0;
        addLog(`💀 **DECK OUT**: Opponent has no cards left in deck!`, 'damage');
        renderDuelTable();
        checkGameOver();
        return;
      }
      DuelState.opponent.hand.push(card);
      AudioFX.playTone(390, 'sine', 0.15, 0.08);
      addLog(`🎴 **DRAW STEP**: Opponent drew 1 card into hand.`, 'step');
      DuelState.phaseIndex = 3; // to REFRESH
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 800);
    } else if (currentPhase === 'REFRESH') {
      DuelState.opponent.field.forEach(s => {
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      let coresReturned = 0;
      if (DuelState.opponent.trash > 0) {
        coresReturned = DuelState.opponent.trash;
        DuelState.opponent.reserve += coresReturned;
        DuelState.opponent.trash = 0;
      }
      if (DuelState.opponent.soulCoreLocation === 'trash') {
        DuelState.opponent.soulCoreLocation = 'reserve';
        DuelState.opponent.soulCoreSpiritUid = null;
      }
      AudioFX.shield();
      addLog(`🔄 **REFRESH STEP**: Opponent refreshed all Spirits to Ready${coresReturned > 0 ? ` and returned ${coresReturned} Core(s) from Trash to Reserve` : ''}.`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 800);
    } else if (currentPhase === 'MAIN') {
      try {
        runAiMainStep();
      } catch (err) {
        console.error('Error during AI MAIN step:', err);
      }
      DuelState.phaseIndex = 5; // to ATTACK
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 1000);
    } else if (currentPhase === 'ATTACK') {
      try {
        runAiAttackStep();
      } catch (err) {
        console.error('Error during AI ATTACK step:', err);
        safeTimeout(endTurn, 700);
      }
      // runAiAttackStep handles attack clash or calls safeTimeout(endTurn) if no attackers
    } else if (currentPhase === 'END') {
      endTurn();
    }
  }

  function toggleOpponentAuto() {
    // Allows pausing or advancing opponent
    advanceOpponentStep();
  }

  // ── EXPECTIMAX MULTI-STEP COMBAT EVALUATION (GADT ARCHITECTURE) ──
  function evaluateAiAttackExpectimax(att, playerField = [], playerLife = 5, profile = null) {
    if (!att) return -999;
    if (!profile) profile = getActiveAiProfile('opponent');

    const attBp = att.battleBp || att.currentBp || 2000;
    const readyBlockers = (playerField || []).filter(s => !s.isExhausted);
    const wLife = profile.w_life !== undefined ? profile.w_life : 2.5;
    const wBp = profile.w_field_bp !== undefined ? profile.w_field_bp : 1.4;

    // SCENARIO 1: No ready blockers -> Guaranteed Direct Hit to Player Life
    if (readyBlockers.length === 0) {
      let ev = 1.5 * wLife;
      if (playerLife <= 1) ev += 3.0; // Lethal game-ending attack
      else if (playerLife <= 2) ev += 1.5;
      return ev;
    }

    // SCENARIO 2: Lethal threats (player has ready spirits with strictly higher BP)
    const lethalThreats = readyBlockers.filter(b => (b.battleBp || b.currentBp) > attBp);
    if (lethalThreats.length > 0) {
      // Threat exists: protect valuable boss spirits
      const isBoss = (att.cost || 0) >= 6 || (att.name || '').toLowerCase().includes('kingtaurus');
      if (isBoss) {
        return -2.5; // Strictly protect high-cost / key boss spirits
      }
      // If player is down to 1 Life and only has 1 blocker, sacrificing a 1-cost spirit to tap it can seal victory
      if (playerLife <= 1 && readyBlockers.length === 1) {
        return 0.5;
      }
      return -0.8; // Bad trade
    }

    // SCENARIO 3: Attacker BP is higher than or equal to all ready blockers
    const favorableTrades = readyBlockers.filter(b => (b.battleBp || b.currentBp) < attBp);
    const ties = readyBlockers.filter(b => (b.battleBp || b.currentBp) === attBp);

    let ev = 1.0 + (attBp / 5000.0) * wBp;

    // Check if attacker has BP comparison life burn (e.g. Kingtaurus at LV2+)
    const effLower = (att.effect || '').toLowerCase();
    const isKingtaurusBpBurn = (att.name.toLowerCase().includes('kingtaurus') || effLower.includes('bp comparison')) && (att.currentLevel >= 2);
    if (isKingtaurusBpBurn) {
      ev += 2.5; // Huge bonus: attacker destroys blocker AND burns opponent life!
    }

    if (favorableTrades.length === readyBlockers.length) {
      // Attacker cleanses any defending spirit without dying
      ev += 1.2;
    } else if (ties.length > 0) {
      // Possible mutual destruction
      ev -= 0.4;
    }

    return ev;
  }

  // ── AI MAIN STEP LOGIC (TACTICAL SUMMONING & BURST TRAPS) ──
  function runAiMainStep() {
    if (DuelState.activePlayer !== 'opponent') return;

    // 1. Covertly set Burst Trap from hand if Burst zone is empty
    if (!DuelState.opponent.burst && DuelState.opponent.hand.length > 0) {
      const burstIdx = DuelState.opponent.hand.findIndex(c => /\[burst:|【バースト/i.test(c.effect || ''));
      if (burstIdx !== -1) {
        const burstCard = DuelState.opponent.hand.splice(burstIdx, 1)[0];
        DuelState.opponent.burst = burstCard;
        addLog(`🃏 Opponent set a card facedown in their **Burst Area**!`, 'step');
        AudioFX.exhaust();
      }
    }

    // 2. Retrieve trained archetype profile & flash reserve buffer
    const profile = getActiveAiProfile('opponent');
    const buffer = profile.flash_reserve_buffer !== undefined ? profile.flash_reserve_buffer : 1;

    // 3. Iterative candidate summoning with State-Action utility evaluation
    let summonedCount = 0;
    while (summonedCount < 3) {
      const availableReserve = DuelState.opponent.reserve;
      const summonable = DuelState.opponent.hand.filter(c => {
        if (c.type !== 'Spirit' || availableReserve < ((c.cost || 0) + 1)) return false;
        const req = getCardTributeRequirement(c);
        if (req && !getEligibleTributeSpirits(req, DuelState.opponent.field).length) return false;
        return true;
      });
      if (!summonable.length) break;

      let bestCard = null;
      let bestScore = -999999;
      let bestCoresToPlace = 1;

      for (const c of summonable) {
        const cost = c.cost || 0;
        const maxCoresAffordable = availableReserve - cost;
        if (maxCoresAffordable < 1) continue;

        const levels = (c.levels && c.levels.length) ? c.levels : [{ level: 1, cores: 1, bp: 2000 }];
        for (const lvlObj of levels) {
          const coresNeeded = lvlObj.cores;
          if (coresNeeded > maxCoresAffordable) continue;

          const reserveRemaining = availableReserve - (cost + coresNeeded);
          let bufferPenalty = 0;
          if (reserveRemaining < buffer && DuelState.opponent.hand.some(h => hasFlashTiming(h))) {
            bufferPenalty = (buffer - reserveRemaining) * 0.75;
          }

          const { level, bp } = calculateBpAndLevel(c.levels, coresNeeded);
          let utility = (cost * 1.5) + (bp / 1000.0) * (profile.w_field_bp || 1.4) - bufferPenalty;

          const effLower = (c.effect || '').toLowerCase();
          // Priority for Kingtaurus and When Summoned Void ramping
          if (effLower.includes('kingtaurus') || effLower.includes('(when summoned)') || (c.effect || '').includes('『このスピリットの召喚時』')) {
            utility += 3.5;
          }
          // Priority for unlocking LV2+ BP comparison Life burn or attack effects
          if (lvlObj.level >= 2 && (effLower.includes('bp comparison') || effLower.includes('when only the opposing spirit is destroyed') || effLower.includes('when attacks'))) {
            utility += 2.5;
          }

          if (utility > bestScore) {
            bestScore = utility;
            bestCard = c;
            bestCoresToPlace = coresNeeded;
          }
        }
      }

      if (!bestCard) break;

      // Execute Summon
      const idx = DuelState.opponent.hand.findIndex(c => c.uid === bestCard.uid);
      if (idx === -1) break;
      DuelState.opponent.hand.splice(idx, 1);

      const cost = bestCard.cost || 0;
      DuelState.opponent.reserve -= (cost + bestCoresToPlace);
      DuelState.opponent.trash += cost;

      const { level, bp } = calculateBpAndLevel(bestCard.levels, bestCoresToPlace);
      bestCard.currentCores = bestCoresToPlace;
      bestCard.currentLevel = level;
      bestCard.currentBp = bp;
      bestCard.isExhausted = false;
      bestCard.hasAttacked = false;

      DuelState.opponent.field.push(bestCard);
      executeWhenSummonedEffects(bestCard, 'opponent');
      AudioFX.summon();
      addLog(`💀 Opponent summoned "${bestCard.name}" [Lv${level}, ${bp} BP] (Paid ${cost} cores, placed ${bestCoresToPlace}. Reserve: ${DuelState.opponent.reserve})!`, 'step');
      summonedCount++;
    }

    // 4. Soul Core Placement onto optimal field Spirit
    if (DuelState.opponent.soulCoreLocation === 'reserve' && DuelState.opponent.field.length > 0) {
      const eligible = DuelState.opponent.field.filter(s => !s.hasSoulCore);
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const topSpirit = eligible[0];
        topSpirit.hasSoulCore = true;
        topSpirit.currentCores += 1;
        const { level: scLvl, bp: scBp } = calculateBpAndLevel(topSpirit.levels, topSpirit.currentCores, true, topSpirit.effect);
        topSpirit.currentLevel = scLvl;
        topSpirit.currentBp = scBp;
        DuelState.opponent.soulCoreLocation = 'field';
        DuelState.opponent.soulCoreSpiritUid = topSpirit.uid;
        addLog(`🔥 Opponent equipped their **Soul Core** onto "${topSpirit.name}" (Empowered to Lv${scLvl}, ${scBp} BP)!`, 'step');
      }
    }

    renderDuelTable();
  }

  // ── AI ATTACK STEP LOGIC (EXPECTIMAX LOOKAHEAD) ──
  function runAiAttackStep() {
    if (DuelState.activePlayer !== 'opponent') return;

    // Official Rule: Player who goes first cannot attack on Turn 1!
    if (DuelState.turn === 1 && DuelState.firstPlayer === 'opponent') {
      addLog(`🛡️ Official Rule: The First Turn player cannot declare attacks. Opponent holds position.`, 'step');
      safeTimeout(endTurn, 700);
      return;
    }

    // Look for ready spirits that can attack
    const readyAttackers = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);

    if (!readyAttackers.length) {
      safeTimeout(endTurn, 700);
      return;
    }

    const profile = getActiveAiProfile('opponent');
    const aggroThreshold = profile.aggro_threshold !== undefined ? profile.aggro_threshold : 0.45;

    // Evaluate each ready attacker with Expectimax lookahead
    let bestAttacker = null;
    let bestScore = -999999;

    for (const att of readyAttackers) {
      const score = evaluateAiAttackExpectimax(att, DuelState.player.field, DuelState.player.life, profile);
      if (score > bestScore) {
        bestScore = score;
        bestAttacker = att;
      }
    }

    // If highest score is below archetype aggro threshold, AI holds defensive formation
    if (!bestAttacker || bestScore < aggroThreshold) {
      addLog(`🛡️ Opponent AI evaluates battlefield: Defensive hold with ${readyAttackers.length} ready spirit(s) (Expectimax EV: ${bestScore.toFixed(2)} < Threshold ${aggroThreshold.toFixed(2)}).`, 'step');
      safeTimeout(endTurn, 800);
      return;
    }

    const attacker = bestAttacker;
    attacker.isExhausted = true;
    attacker.hasAttacked = true;

    attacker.battleBpBoost = 0;
    delete attacker.battleBp;
    recalculateSpiritBp(attacker);

    AudioFX.slash();
    executeWhenAttacksEffects(attacker, 'opponent');

    const fallbackBoost = getWhenAttacksBpBoost(attacker);
    if (fallbackBoost > 0 && !attacker.battleBpBoost) {
      attacker.battleBpBoost = fallbackBoost;
      const base = attacker.baseBp !== undefined ? attacker.baseBp : (attacker.currentBp || 0);
      attacker.battleBp = base + fallbackBoost;
      attacker.currentBp = attacker.battleBp;
    }

    const battleBp = attacker.battleBp || attacker.currentBp;
    addLog(`⚔️ **OPPONENT ATTACK** [Expectimax EV +${bestScore.toFixed(2)}]: "${attacker.name}" (${battleBp} BP) attacks your Life!${(attacker.battleBpBoost || 0) > 0 ? ` (+${attacker.battleBpBoost} BP When Attacks bonus)` : ''}`, 'damage');
    checkBurstTrigger('player', 'AFTER_OPPONENT_ATTACKS', { attacker });

    // Defending field triggers (e.g. Strike-Siegwurm refresh)
    checkOpposingAttackDeclarationEffects('opponent');

    // Check player blockers
    const playerBlockers = DuelState.player.field.filter(s => !s.isExhausted);

    if (playerBlockers.length > 0) {
      showBlockPrompt(attacker, playerBlockers);
    } else {
      // Unblocked direct hit to Player Life!
      DuelState.combatEvent = {
        attacker,
        targetType: 'life',
        blocker: null,
        result: 'DIRECT HIT TO PLAYER LIFE!'
      };
      renderDuelTable();

      setTimeout(() => {
        AudioFX.lifeDamage();
        const symbols = getAttackSymbols(attacker, 'opponent');
        const damageToDeal = Math.min(symbols, DuelState.player.life);
        for (let s = 0; s < damageToDeal; s++) {
          DuelState.player.life = Math.max(0, DuelState.player.life - 1);
          DuelState.player.reserve += 1;
        }

        if (symbols > 1) {
          const symName = symbols === 2 ? 'DOUBLE SYMBOL' : (symbols === 3 ? 'TRIPLE SYMBOL' : `${symbols}-SYMBOL`);
          addLog(`💥💥 **[${symName}: ${attacker.name}]**: Opponent attacked with ${symbols} Symbols inflicting ${damageToDeal} Life Damage! (Your Life: ${DuelState.player.life})`, 'damage');
          if (typeof showToast === 'function') {
            showToast(`⚠️ Took ${damageToDeal} Life Damage from ${symName}!`, 'warning');
          }
        } else {
          addLog(`💥 **DIRECT HIT**: Player loses 1 Life! (Remaining Life: ${DuelState.player.life})`, 'damage');
        }

        // [Holy Life / 聖命]: Opponent Trigger
        if (hasHolyLife(attacker)) {
          if (DuelState.opponent.life < 5) {
            DuelState.opponent.life += 1;
            AudioFX.coreChime();
            addLog(`✨ **[HOLY LIFE ACTIVATED: ${attacker.name}]**: Opponent channeled sacred light from the Void! Restored +1 Core to their Life! (Opponent Life: ${DuelState.opponent.life})`, 'magic');
          }
        }
        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.player.life > 0) {
          checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
          const isAttackerAlive = DuelState.opponent.field.some(s => s.uid === attacker.uid);
          const finishAiTurn = () => {
            const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
            const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= aggroThreshold);
            if (viable.length > 0) {
              safeTimeout(runAiAttackStep, 1000);
            } else {
              safeTimeout(endTurn, 900);
            }
          };

          if (isAttackerAlive) {
            checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
              endOfBattleBpReset(attacker);
              finishAiTurn();
            });
          } else {
            endOfBattleBpReset(attacker);
            finishAiTurn();
          }
        }
      }, 900);
    }
  }

  function showBlockPrompt(attacker, readyBlockers) {
    const modalEl = document.getElementById('battleBlockModal');
    if (!modalEl) {
      // Fallback: auto resolve
      AudioFX.lifeDamage();
      DuelState.player.life = Math.max(0, DuelState.player.life - 1);
      renderDuelTable();
      checkGameOver();
      if (DuelState.player.life > 0) {
        checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
      }
      safeTimeout(endTurn, 900);
      return;
    }

    const isUnblockable = hasCantBeBlocked(attacker);
    const blockSacrificeReq = getBlockSacrificeRequirement(attacker, 'opponent');
    const isClash = hasClash(attacker);
    const attNameEl = document.getElementById('blockAttackerName');
    if (attNameEl) {
      attNameEl.textContent = `${attacker.name} (${attacker.battleBp || attacker.currentBp} BP)`;
    }

    // Identify playable on-field Nexuses with Grand Skill Flash
    const fieldFlashNexuses = (DuelState.player.nexus || []).filter(n => {
      const check = canActivateGrandSkill(n, 'player');
      return check.allowed;
    });

    // Identify playable Flash cards in hand (both Magic & Swift spirits)
    const { total: totalAvailableCores } = getPlayerAvailableCores();
    const flashCards = DuelState.player.hand.filter(c => {
      if (!hasFlashTiming(c)) return false;
      const cost = c.cost || 0;
      const isSpirit = c.type === 'Spirit';
      const totalNeeded = isSpirit ? cost + 1 : cost;
      return totalAvailableCores >= totalNeeded;
    });

    // Render Flash Timing section
    const flashSectionEl = document.getElementById('blockFlashSection');
    if (flashSectionEl) {
      if (flashCards.length > 0) {
        flashSectionEl.innerHTML = `
          <div class="flash-spells-container">
            <div class="flash-spells-title">⚡ FLASH TIMING WINDOW (Cast spells or activate on-field Grand Skills):</div>
            ${fieldFlashNexuses.map(n => {
              const gs = parseGrandSkill(n);
              return `
                <button class="flash-spell-btn flash-nexus-btn" onclick="BattleArena.activateGrandSkill('${n.uid}')" title="${n.effect}">
                  <div class="fsb-left">
                    <span class="fsb-name">🏛️ ${n.name} [Grand Skill: ${gs ? gs.cost : 4}]</span>
                    <span class="fsb-desc">Send ${gs ? gs.cost : 4} Cores from Nexus to Void → Destroy an opposing exhausted Spirit</span>
                  </div>
                  <span class="fsb-cost">🔮 ${n.currentCores}c on Nexus</span>
                </button>
              `;
            }).join('')}
            ${flashCards.map(c => `
              <button class="flash-spell-btn" onclick="BattleArena.castFlashInBattle('${c.uid}', '${attacker.uid}')" title="${c.effect}">
                <div class="fsb-left">
                  <span class="fsb-name">✨ ${c.name}</span>
                  <span class="fsb-desc">${c.type === 'Spirit' ? 'Swift Spirit Summon' : getFlashEffectSummary(c)}</span>
                </div>
                <span class="fsb-cost">Cost ${c.cost}</span>
              </button>
            `).join('')}
          </div>
        `;
      } else {
        flashSectionEl.innerHTML = '';
      }
    }

    const choicesEl = document.getElementById('blockerChoices');
    let blockerHtml = '';
    if (isUnblockable) {
      blockerHtml = `
        <div style="padding:0.75rem; background:rgba(239,68,68,0.18); border:1px solid #ef4444; border-radius:0.5rem; color:#fca5a5; font-size:0.82rem; font-weight:800; text-align:center; margin-bottom:0.75rem;">
          ⚡ [UNBLOCKABLE ATTACK]: "${attacker.name}" cannot be intercepted! You must take Life damage.
        </div>
      `;
    } else if (blockSacrificeReq && DuelState.player.field.length < 2) {
      blockerHtml = `
        <div style="padding:0.75rem; background:rgba(168,85,247,0.18); border:1px solid #a855f7; border-radius:0.5rem; color:#e9d5ff; font-size:0.82rem; font-weight:800; text-align:center; margin-bottom:0.75rem;">
          ⚠️ [BLOCK RESTRICTION]: ${blockSacrificeReq.sourceSpirit.name} requires you to destroy 1 of your Spirits to block! You have no other Spirit to sacrifice.
        </div>
      `;
    } else {
      let sacrificeNotice = '';
      if (blockSacrificeReq) {
        sacrificeNotice = `
          <div style="padding:0.6rem; background:rgba(168,85,247,0.15); border:1px solid #a855f7; border-radius:0.5rem; color:#e9d5ff; font-size:0.78rem; font-weight:800; margin-bottom:0.6rem;">
            ⚠️ [BLOCK SACRIFICE REQUIREMENT]: ${blockSacrificeReq.sourceSpirit.name} requires destroying one of your Spirits! Blocking will sacrifice your lowest-cost allied Spirit.
          </div>
        `;
      }
      blockerHtml = sacrificeNotice + readyBlockers.map(s => `
        <div class="blocker-choice-card" onclick="BattleArena.chooseBlocker('${s.uid}', '${attacker.uid}')">
          <div class="bc-name">${s.name}</div>
          <div class="bc-bp">${s.currentBp} BP (Lv${s.currentLevel})</div>
          <button class="btn-block-action">🛡️ Block With This Spirit</button>
        </div>
      `).join('');
    }

    if (isClash && readyBlockers.length > 0) {
      blockerHtml += `
        <div style="padding:0.75rem; background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:0.5rem; color:#fca5a5; font-size:0.8rem; font-weight:800; text-align:center; margin-top:0.5rem;">
          ⚠️ [CLASH ACTIVE]: "${attacker.name}" forces you to block! You cannot take Life damage while you control Ready Spirits.
        </div>
      `;
    } else {
      const attSymbols = getAttackSymbols(attacker, 'opponent');
      if (attSymbols > 1) {
        blockerHtml = `
          <div style="padding:0.5rem; background:rgba(239,68,68,0.2); border:1px solid #ef4444; border-radius:0.4rem; color:#fca5a5; font-size:0.8rem; font-weight:800; text-align:center; margin-bottom:0.6rem;">
            ⚡ [MULTI-SYMBOL THREAT]: "${attacker.name}" attacks with ${attSymbols} Symbols! Passing will inflict ${attSymbols} Life Damage!
          </div>
        ` + blockerHtml;
      }
      blockerHtml += `
        <button class="btn-pass-block" onclick="BattleArena.takeLifeDamage('${attacker.uid}')">💥 Take ${attSymbols} Life Damage (${attSymbols} Symbol${attSymbols > 1 ? 's' : ''})</button>
      `;
    }
    choicesEl.innerHTML = blockerHtml;

    document.getElementById('blockAttackerName').textContent = `${attacker.name} (${attacker.currentBp} BP)`;
    modalEl.classList.add('active');
  }

  function chooseBlocker(blockerUid, attackerUid) {
    closeBlockModal();
    const blocker = DuelState.player.field.find(s => s.uid === blockerUid);
    const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid);
    if (!blocker || !attacker) return;

    blocker.isExhausted = true;
    blocker.battleBpBoost = 0;
    delete blocker.battleBp;
    recalculateSpiritBp(blocker);

    // Check Siegfried-Necro block sacrifice
    const blockSacrificeReq = getBlockSacrificeRequirement(attacker, 'opponent');
    if (blockSacrificeReq) {
      const otherAllies = DuelState.player.field.filter(s => s.uid !== blocker.uid);
      if (otherAllies.length > 0) {
        otherAllies.sort((a, b) => (a.cost || 0) - (b.cost || 0));
        const sacrificed = otherAllies[0];
        const sIdx = DuelState.player.field.findIndex(s => s.uid === sacrificed.uid);
        if (sIdx !== -1) {
          DuelState.player.field.splice(sIdx, 1);
          DuelState.player.reserve += sacrificed.currentCores;
          handleDestroyedSpiritCores(sacrificed, 'player');
          sendToTrash(sacrificed, 'player', `Sacrificed to block under ${blockSacrificeReq.sourceSpirit.name}`);
          addLog(`⚡ **[BLOCK SACRIFICE: ${blockSacrificeReq.sourceSpirit.name}]**: You sacrificed your own "${sacrificed.name}" to declare a block!`, 'damage');
        }
      }
    }

    executeWhenBlocksEffects(blocker, 'player', attacker);

    const fallbackBoost = getWhenBlocksBpBoost(blocker);
    if (fallbackBoost > 0 && !blocker.battleBpBoost) {
      blocker.battleBpBoost = fallbackBoost;
      const base = blocker.baseBp !== undefined ? blocker.baseBp : (blocker.currentBp || 0);
      blocker.battleBp = base + fallbackBoost;
      blocker.currentBp = blocker.battleBp;
    }

    const fightingBp = blocker.battleBp || blocker.currentBp;
    AudioFX.shield();
    addLog(`🛡️ **YOU BLOCKED** with "${blocker.name}" (${fightingBp} BP)!`, 'damage');

    DuelState.combatEvent = {
      attacker,
      targetType: 'spirit',
      blocker,
      result: ''
    };
    renderDuelTable();

    setTimeout(() => {
      resolveClash(attacker, blocker, 'opponent', 'player');
    }, 900);
  }

  function takeLifeDamage(attackerUid) {
    closeBlockModal();
    const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid);

    AudioFX.lifeDamage();
    const symbols = getAttackSymbols(attacker, 'opponent');
    const damageToDeal = Math.min(symbols, DuelState.player.life);
    for (let s = 0; s < damageToDeal; s++) {
      DuelState.player.life = Math.max(0, DuelState.player.life - 1);
      DuelState.player.reserve += 1;
    }

    if (symbols > 1) {
      const symName = symbols === 2 ? 'DOUBLE SYMBOL' : (symbols === 3 ? 'TRIPLE SYMBOL' : `${symbols}-SYMBOL`);
      addLog(`💥💥 **[${symName}: ${attacker ? attacker.name : 'Opponent'}]**: Direct attack with ${symbols} Symbols inflicts ${damageToDeal} Life Damage! (Your Life: ${DuelState.player.life})`, 'damage');
      if (typeof showToast === 'function') {
        showToast(`⚠️ Took ${damageToDeal} Life Damage (${symbols} Symbols)!`, 'warning');
      }
    } else {
      addLog(`💥 **DIRECT HIT**: Player loses 1 Life! (Remaining Life: ${DuelState.player.life})`, 'damage');
    }

    if (attacker && hasHolyLife(attacker)) {
      if (DuelState.opponent.life < 5) {
        DuelState.opponent.life += 1;
        AudioFX.coreChime();
        addLog(`✨ **[HOLY LIFE ACTIVATED: ${attacker.name}]**: Opponent restored +1 Life from Void!`, 'magic');
      }
    }

    DuelState.combatEvent = null;
    renderDuelTable();
    checkGameOver();

    if (DuelState.player.life > 0) {
      checkLifeDecreasedEffects('player');
      checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
      const isAttackerAlive = attacker && DuelState.opponent.field.some(s => s.uid === attacker.uid);
      const continueOpponent = () => {
        if (DuelState.activePlayer === 'opponent') {
          const profile = getActiveAiProfile('opponent');
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 1000);
          } else {
            safeEndOpponentTurn(900);
          }
        }
      };

      if (isAttackerAlive) {
        checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
          if (attacker) endOfBattleBpReset(attacker);
          continueOpponent();
        });
      } else {
        if (attacker) endOfBattleBpReset(attacker);
        continueOpponent();
      }
    }
  }

  function closeBlockModal() {
    const modalEl = document.getElementById('battleBlockModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  // ── WIN / LOSS RESOLUTION ──
  function checkGameOver() {
    if (DuelState.opponent.life <= 0) {
      // Victory!
      DuelState.inDuel = false;
      AudioFX.victory();
      showGameOverModal(true);
    } else if (DuelState.player.life <= 0) {
      // Defeat!
      DuelState.inDuel = false;
      AudioFX.lifeDamage();
      showGameOverModal(false);
    }
  }

  function showGameOverModal(isVictory) {
    const modal = document.getElementById('battleResultModal');
    if (!modal) return;
    const titleEl = document.getElementById('resultModalTitle');
    const descEl = document.getElementById('resultModalDesc');
    const badgeEl = document.getElementById('resultModalBadge');

    if (isVictory) {
      badgeEl.className = 'result-badge result-win';
      badgeEl.textContent = '🏆 VICTORY ACHIEVED';
      titleEl.textContent = 'You Shattered The Colosseum Champion!';
      descEl.textContent = `Magnificent play! You dominated the battlefield, drained the opponent's 5 Life cores, and claimed supreme glory in the Colosseum!`;
    } else {
      badgeEl.className = 'result-badge result-lose';
      badgeEl.textContent = '💀 DEFEAT IN THE ARENA';
      titleEl.textContent = 'Your Life Cores Were Depleted!';
      descEl.textContent = `The opponent broke through your defenses and wiped your Life to zero. Refine your deck, re-balance your mana curve, and return for vengeance!`;
    }

    modal.classList.add('active');
  }

  function closeResultModal() {
    clearAllTimers();
    const modal = document.getElementById('battleResultModal');
    if (modal) modal.classList.remove('active');
    DuelState.inDuel = false;
    renderArenaLobby();
  }

  // ── VIEW BOARD AS IS (Inspect field after match end) ──
  function viewBoardAsIs() {
    const modal = document.getElementById('battleResultModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    const bar = document.getElementById('matchFinishedBar');
    if (bar) bar.style.display = 'flex';
    if (typeof showToast === 'function') {
      showToast('Inspecting final board state. Click "Show Results" or "Rematch" when done.', 'info');
    }
  }

  function reopenResultModal() {
    const modal = document.getElementById('battleResultModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
    }
    const bar = document.getElementById('matchFinishedBar');
    if (bar) bar.style.display = 'none';
  }


  // ── AUTO DUEL / FAST SIM ──
  function toggleAutoDuel() {
    DuelState.autoPlay = !DuelState.autoPlay;
    const btn = document.getElementById('btnAutoDuel');
    if (btn) {
      btn.textContent = DuelState.autoPlay ? '⏸️ Pause Auto' : '⚡ Auto Duel';
      btn.classList.toggle('auto-active', DuelState.autoPlay);
    }

    if (DuelState.autoPlay) {
      runAutoDuelStep();
    } else if (DuelState.autoPlayTimer) {
      clearTimeout(DuelState.autoPlayTimer);
    }
  }

  function runAutoDuelStep() {
    if (!DuelState.autoPlay || !DuelState.inDuel) return;

    if (DuelState.activePlayer === 'player') {
      const phase = DuelState.phases[DuelState.phaseIndex];
      if (phase === 'MAIN') {
        // Try summon
        const card = DuelState.player.hand.find(c => c.type === 'Spirit' && DuelState.player.reserve >= (c.cost + 1));
        if (card) {
          summonCard(card.uid, 1);
        } else {
          nextPhase();
        }
      } else if (phase === 'ATTACK') {
        const attacker = DuelState.player.field.find(s => !s.isExhausted && !s.hasAttacked);
        if (attacker) {
          executePlayerAttack(attacker);
        } else {
          nextPhase();
        }
      } else {
        nextPhase();
      }
    }

    DuelState.autoPlayTimer = setTimeout(runAutoDuelStep, 1000);
  }

  // ── QUICK LAUNCH & ARENA REDIRECT ──
  function quickLaunchDuel() {
    if (!isArenaPage()) {
      window.location.href = '/arena?duel=quick';
      return;
    }
    startDuel('red', 'purple');
  }

  function scrollToBattleArena(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isArenaPage()) {
      window.location.href = '/arena';
      return;
    }
    const arenaEl = document.getElementById('battleArena');
    if (arenaEl) {
      if (arenaEl && typeof arenaEl.scrollIntoView === 'function') arenaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }


  // ── ZONE VIEWER MODAL CONTROLLERS (TRASH & VOID) ──
  function openZoneModal(tab = 'player-trash') {
    DuelState.currentZoneTab = tab;
    renderZoneModal();
    const modalEl = document.getElementById('battleZoneModal');
    if (modalEl) modalEl.style.display = 'flex';
    AudioFX.buttonTick();
  }

  function closeZoneModal() {
    const modalEl = document.getElementById('battleZoneModal');
    if (modalEl) modalEl.style.display = 'none';
    AudioFX.buttonTick();
  }

  function closeZoneModalBg(e) {
    if (e.target && e.target.id === 'battleZoneModal') {
      closeZoneModal();
    }
  }

  function switchZoneTab(tab) {
    DuelState.currentZoneTab = tab;
    AudioFX.buttonTick();
    renderZoneModal();
  }

  function inspectZoneCard(cardName) {
    const decoded = decodeURIComponent(cardName);
    openCardDetail(decoded);
  }

  function renderZoneModal() {
    const tab = DuelState.currentZoneTab || 'player-trash';
    const pTrash = DuelState.player.trashCards || [];
    const oTrash = DuelState.opponent.trashCards || [];
    const pVoid = DuelState.player.voidCards || [];
    const oVoid = DuelState.opponent.voidCards || [];
    const totalVoidCards = pVoid.length + oVoid.length;

    // Update tab count badges
    const pNexuses = DuelState.player.nexus || [];
    const oNexuses = DuelState.opponent.nexus || [];
    const pNexCountEl = document.getElementById('tabCountPlayerNexus');
    if (pNexCountEl) pNexCountEl.textContent = pNexuses.length;
    const oNexCountEl = document.getElementById('tabCountOpponentNexus');
    if (oNexCountEl) oNexCountEl.textContent = oNexuses.length;

    const btnPN = document.getElementById('tabPlayerNexus');
    if (btnPN) btnPN.classList.toggle('active', tab === 'player-nexus');
    const btnON = document.getElementById('tabOpponentNexus');
    if (btnON) btnON.classList.toggle('active', tab === 'opponent-nexus');

    const pCountEl = document.getElementById('tabCountPlayerTrash');
    if (pCountEl) pCountEl.textContent = pTrash.length;
    const oCountEl = document.getElementById('tabCountOpponentTrash');
    if (oCountEl) oCountEl.textContent = oTrash.length;
    const vCountEl = document.getElementById('tabCountVoid');
    if (vCountEl) vCountEl.textContent = totalVoidCards;

    // Update active tab buttons
    const btnPT = document.getElementById('tabPlayerTrash');
    if (btnPT) btnPT.classList.toggle('active', tab === 'player-trash');
    const btnOT = document.getElementById('tabOpponentTrash');
    if (btnOT) btnOT.classList.toggle('active', tab === 'opponent-trash');
    const btnV = document.getElementById('tabVoid');
    if (btnV) btnV.classList.toggle('active', tab === 'void');

    // Update Title & Subtitle
    const titleEl = document.getElementById('zoneModalTitle');
    const subEl = document.getElementById('zoneModalSubtitle');
    const bodyEl = document.getElementById('zoneModalBody');
    if (!bodyEl) return;

    if (tab === 'player-trash') {
      if (titleEl) titleEl.textContent = '🪦 Your Trash (Graveyard)';
      if (subEl) subEl.textContent = `Cards and spirits sent to your graveyard (${pTrash.length} Card${pTrash.length === 1 ? '' : 's'} • ${DuelState.player.trash} Core${DuelState.player.trash === 1 ? '' : 's'} currently in Trash)`;
      if (!pTrash.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🪦</div>
            <div class="zone-empty-text">Your Trash is Empty</div>
            <div class="zone-empty-subtext">Spirits destroyed in battle, depleted of cores by sacrifices, or used magic spells will be placed here.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${pTrash.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect full details of ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.graveyardReason ? `<div class="zone-card-reason" title="${c.graveyardReason}">🪦 ${c.graveyardReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'opponent-trash') {
      if (titleEl) titleEl.textContent = `💀 Opponent's Trash (Graveyard)`;
      if (subEl) subEl.textContent = `Cards and spirits sent to opponent's graveyard (${oTrash.length} Card${oTrash.length === 1 ? '' : 's'} • ${DuelState.opponent.trash} Core${DuelState.opponent.trash === 1 ? '' : 's'} currently in Trash)`;
      if (!oTrash.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">💀</div>
            <div class="zone-empty-text">Opponent's Trash is Empty</div>
            <div class="zone-empty-subtext">No enemy spirits have fallen or been milled to the graveyard yet.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${oTrash.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect full details of ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.graveyardReason ? `<div class="zone-card-reason" title="${c.graveyardReason}">🪦 ${c.graveyardReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'void') {
      if (titleEl) titleEl.textContent = '🌌 The Void (Cosmic Reservoir & Removed Zone)';
      if (subEl) subEl.textContent = 'Infinite source of Cores and the dimensional void for banished cards';
      const allVoidCards = [...pVoid, ...oVoid];
      
      let voidHtml = `
        <div class="void-cosmic-overview">
          <div class="void-cosmic-banner">
            <div class="void-cosmic-icon">🌌</div>
            <div class="void-cosmic-text">
              <div class="void-cosmic-title">Cosmic Void Reservoir (ボイド)</div>
              <div class="void-cosmic-desc">
                In official Battle Spirits rules, The Void is the boundless reservoir of universal energy from which all Cores materialize. At each player's <strong>Core Step</strong>, 1 Core is transferred from the Void directly into their Reserve.
              </div>
            </div>
          </div>

          <div class="void-stats-grid">
            <div class="void-stat-box">
              <div class="void-stat-num" style="display:flex;align-items:center;justify-content:center;gap:6px;">${getHexCoreSvg('blue', 22)} <span>∞</span></div>
              <div class="void-stat-lbl">Void Cores Remaining</div>
            </div>
            <div class="void-stat-box">
              <div class="void-stat-num">${DuelState.turn}</div>
              <div class="void-stat-lbl">Duel Round / Turn</div>
            </div>
            <div class="void-stat-box">
              <div class="void-stat-num">${totalVoidCards}</div>
              <div class="void-stat-lbl">Cards Banished to Void</div>
            </div>
          </div>
      `;

      if (allVoidCards.length > 0) {
        voidHtml += `
          <div class="void-cards-section-header">🌌 Cards Banished to The Void (${allVoidCards.length})</div>
          <div class="zone-cards-grid">
            ${allVoidCards.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.voidReason ? `<div class="zone-card-reason" style="border-left-color:#c084fc;">🌌 ${c.voidReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        voidHtml += `
          <div class="zone-empty-state" style="padding: 1.5rem 1rem;">
            <div class="zone-empty-icon" style="font-size:2.5rem;">✨</div>
            <div class="zone-empty-text">No Cards Currently Banished in The Void</div>
            <div class="zone-empty-subtext">Cards removed completely from the game by Void banishment effects will be held here.</div>
          </div>
        `;
      }

      voidHtml += `</div>`;
      bodyEl.innerHTML = voidHtml;
    } else if (tab === 'player-nexus') {
      if (titleEl) titleEl.textContent = '🏛️ Your Active Nexuses';
      if (subEl) subEl.textContent = `Continuous field facilities providing persistent symbols and effects (${pNexuses.length} Active Nexus${pNexuses.length === 1 ? '' : 'es'})`;
      if (!pNexuses.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🏛️</div>
            <div class="zone-empty-text">No Nexuses Deployed</div>
            <div class="zone-empty-subtext">Deploy Nexus cards from your hand during the Main Step to activate ongoing abilities and establish continuous battle presence.</div>
          </div>
        `;
      } else {
        const isMain = DuelState.activePlayer === 'player' && DuelState.phases[DuelState.phaseIndex] === 'MAIN';
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${pNexuses.map(n => `
              <div class="zone-card-item" style="border:1.5px solid #38bdf8;">
                <img src="${n.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${n.name}" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')">${n.name}</div>
                  <div class="zone-card-sub">
                    <span style="color:#38bdf8;font-weight:700;">LV${n.currentLevel || 1}</span>
                    <span>Cost ${n.cost ?? 0}</span>
                    <span style="color:#bae6fd;">🔮 ${n.currentCores || 0} Core${n.currentCores === 1 ? '' : 's'}</span>
                  </div>
                  <div style="font-size:0.75rem; color:#cbd5e1; margin-top:0.35rem; line-height:1.3;">
                    ${formatEffectKeywords(n.effect || n.summary || '')}
                  </div>
                  ${isMain ? `
                    <div style="display:flex; gap:0.4rem; margin-top:0.5rem;">
                      <button class="btn-duel-tool" style="padding:0.25rem 0.6rem; font-size:0.7rem;" onclick="event.stopPropagation(); BattleArena.addCoreToNexus('${n.uid}')">+1 Core</button>
                      <button class="btn-duel-tool" style="padding:0.25rem 0.6rem; font-size:0.7rem;" onclick="event.stopPropagation(); BattleArena.removeCoreFromNexus('${n.uid}')">-1 Core</button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'opponent-nexus') {
      if (titleEl) titleEl.textContent = `🏛️ Opponent's Active Nexuses`;
      if (subEl) subEl.textContent = `Opponent's continuous field cards (${oNexuses.length} Active Nexus${oNexuses.length === 1 ? '' : 'es'})`;
      if (!oNexuses.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🏛️</div>
            <div class="zone-empty-text">Opponent Has No Nexuses Deployed</div>
            <div class="zone-empty-subtext">The opponent has not placed any Nexus structures on the battlefield.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${oNexuses.map(n => `
              <div class="zone-card-item" style="border:1.5px solid #c084fc;">
                <img src="${n.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${n.name}" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')">${n.name}</div>
                  <div class="zone-card-sub">
                    <span style="color:#c084fc;font-weight:700;">LV${n.currentLevel || 1}</span>
                    <span>Cost ${n.cost ?? 0}</span>
                    <span style="color:#e9d5ff;">🔮 ${n.currentCores || 0} Core${n.currentCores === 1 ? '' : 's'}</span>
                  </div>
                  <div style="font-size:0.75rem; color:#cbd5e1; margin-top:0.35rem; line-height:1.3;">
                    ${formatEffectKeywords(n.effect || n.summary || '')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  }

  // ── SOUL CORE (ソウルコア) LOGIC & CONTROLS ──
  function placeSoulCoreOnSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Can only move Soul Core on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Soul Core can only be moved during the MAIN Step!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit) return;

    // If Soul Core was on another spirit, detach it
    if (DuelState.player.soulCoreLocation === 'field' && DuelState.player.soulCoreSpiritUid) {
      const prev = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
      if (prev && prev.uid !== spirit.uid) {
        prev.hasSoulCore = false;
        prev.currentCores -= 1;
        if (prev.currentCores <= 0) {
          // Official Rule: Spirit with 0 cores CANNOT survive! Depletes to Trash.
          const pIdx = DuelState.player.field.findIndex(s => s.uid === prev.uid);
          if (pIdx !== -1) {
            const depleted = DuelState.player.field.splice(pIdx, 1)[0];
            sendToTrash(depleted, 'player', 'Depleted to 0 cores upon Soul Core transfer');
            AudioFX.destroy ? AudioFX.destroy() : AudioFX.slash();
            addLog(`💀 **[DEPLETED TO TRASH]**: "${depleted.name}" had 0 cores remaining after Soul Core was transferred and was sent to Trash!`, 'damage');
            if (typeof showToast === 'function') {
              showToast(`💀 "${depleted.name}" had 0 cores left and depleted to Trash!`, 'warning');
            }
          }
        } else {
          const { level, bp } = calculateBpAndLevel(prev.levels, prev.currentCores, false, prev.effect);
          prev.currentLevel = level;
          prev.currentBp = bp;
        }
      }
    }

    spirit.hasSoulCore = true;
    spirit.currentCores += 1;
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, true, spirit.effect);
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    DuelState.player.soulCoreLocation = 'field';
    DuelState.player.soulCoreSpiritUid = spirit.uid;

    AudioFX.soulCoreIgnite();
    addLog(`🔥 **SOUL CORE ATTACHED**: Placed Soul Core onto "${spirit.name}"! Empowered to Lv${level} with ${bp} BP.`, 'step');
    renderDuelTable();
  }

  function removeSoulCoreFromSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Can only move Soul Core on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Soul Core can only be moved during the MAIN Step!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit || !spirit.hasSoulCore) return;

    spirit.hasSoulCore = false;
    spirit.currentCores -= 1;
    DuelState.player.soulCoreLocation = 'reserve';
    DuelState.player.soulCoreSpiritUid = null;

    if (spirit.currentCores <= 0) {
      // Depletes spirit with 0 cores to Trash!
      const pIdx = DuelState.player.field.findIndex(s => s.uid === spirit.uid);
      if (pIdx !== -1) {
        const depleted = DuelState.player.field.splice(pIdx, 1)[0];
        sendToTrash(depleted, 'player', 'Depleted to 0 cores upon Soul Core return');
        AudioFX.destroy ? AudioFX.destroy() : AudioFX.slash();
        addLog(`💀 **[DEPLETED TO TRASH]**: "${depleted.name}" had 0 cores remaining after Soul Core returned to Reserve and was sent to Trash!`, 'damage');
        if (typeof showToast === 'function') {
          showToast(`💀 "${depleted.name}" had 0 cores left and depleted to Trash!`, 'warning');
        }
      }
    } else {
      const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, false, spirit.effect);
      spirit.currentLevel = level;
      spirit.currentBp = bp;
    }

    AudioFX.coreChime();
    addLog(`🔥 **SOUL CORE RETURNED**: Removed Soul Core from "${spirit.name}" back to Reserve.`, 'step');
    renderDuelTable();
  }

  
  // ── CORE MANAGEMENT ON FIELD SPIRITS (MAIN STEP) ──
  function addCoreToSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("You can only move cores on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Cores can only be moved between Reserve and Spirits during MAIN Step!", 'warning');
      return;
    }
    if (DuelState.player.reserve <= 0) {
      if (typeof showToast === 'function') showToast("No cores left in Reserve to add!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit) return;

    DuelState.player.reserve -= 1;
    spirit.currentCores += 1;

    // Recalculate level and BP
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
    const oldLevel = spirit.currentLevel;
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    AudioFX.coreChime();
    if (level > oldLevel) {
      AudioFX.summon();
      addLog(`✨ **LEVEL UP!** "${spirit.name}" gained +1 Core (Total: ${spirit.currentCores}) and ascended to **LV${level}** (${bp} BP)!`, 'step');
      showToast(`✨ ${spirit.name} Level Up! Now LV${level} (${bp} BP)`, 'success');
    } else {
      addLog(`💎 Moved +1 Core from Reserve to "${spirit.name}" (Total: ${spirit.currentCores} Cores, ${bp} BP).`, 'normal');
    }

    renderDuelTable();
    renderPlayerHand();
  }

  function removeCoreFromSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("You can only move cores on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Cores can only be moved between Reserve and Spirits during MAIN Step!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit) return;

    const normalCores = spirit.hasSoulCore ? Math.max(0, spirit.currentCores - 1) : spirit.currentCores;
    if (normalCores <= 0) {
      if (typeof showToast === 'function') showToast(`No normal cores on "${spirit.name}" to remove! Only Soul Core remains.`, 'warning');
      return;
    }

    // Official BS Rule: A spirit with 0 cores is destroyed by depletion
    if (spirit.currentCores <= 1) {
      const confirmDeplete = (typeof window !== 'undefined' && window.confirm)
        ? window.confirm(`Removing the last core from "${spirit.name}" will deplete it (0 cores) and send it to the Trash.\n\nDo you want to deplete "${spirit.name}"?`)
        : true;
      if (!confirmDeplete) return;

      // Send to Trash and return the core to reserve
      DuelState.player.reserve += 1;
      const idx = DuelState.player.field.indexOf(spirit);
      if (idx !== -1) {
        DuelState.player.field.splice(idx, 1);
        sendToTrash(spirit, 'player', 'Depleted (0 cores on field)');
      }
      AudioFX.coreChime();
      addLog(`💀 "${spirit.name}" was depleted of all cores and sent to Trash. 1 Core returned to Reserve.`, 'kill');
      renderDuelTable();
      renderPlayerHand();
      return;
    }

    // Normal core removal
    spirit.currentCores -= 1;
    DuelState.player.reserve += 1;

    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
    const oldLevel = spirit.currentLevel;
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    AudioFX.coreChime();
    if (level < oldLevel) {
      addLog(`⚠️ "${spirit.name}" lost a core and dropped to **LV${level}** (${bp} BP). 1 Core returned to Reserve.`, 'warning');
    } else {
      addLog(`💎 Returned 1 Core from "${spirit.name}" to Reserve (${spirit.currentCores} Cores remaining).`, 'normal');
    }

    renderDuelTable();
    renderPlayerHand();
  }

  function inspectSoulCore() {
    const loc = DuelState.player.soulCoreLocation || 'reserve';
    let locStr = 'in Reserve';
    if (loc === 'field') {
      const sp = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
      locStr = `placed on "${sp ? sp.name : 'Spirit'}"`;
    } else if (loc === 'trash') {
      locStr = 'in Trash (returns to Reserve at Refresh Step)';
    }
    if (typeof showToast === 'function') showToast(`🔥 Soul Core: Currently ${locStr}. Counts as 1 Core and awakens enhanced BP & abilities on Spirits!`, 'info');
  }

  // ── AI HEURISTICS & TRAINING DASHBOARD (PARADOXES ENGINE) ──
  function renderAiDashboard() {
    const gridEl = document.getElementById('aiArchetypesGrid');
    if (!gridEl) return;

    const weights = DuelState.aiWeights || DEFAULT_AI_WEIGHTS;
    const colorBadges = {
      red: { bg: '#ef4444', icon: '🔴', title: 'Red (Hero Dragon Aggro)' },
      green: { bg: '#10b981', icon: '🟢', title: 'Green (Emerald Ramp / Kingtaurus)' },
      purple: { bg: '#a855f7', icon: '🟣', title: 'Purple (Netherworld Control)' },
      white: { bg: '#e2e8f0', icon: '⚪', title: 'White (Armed Fortress)' },
      yellow: { bg: '#eab308', icon: '🟡', title: 'Yellow (Celestial Symphony)' },
      blue: { bg: '#3b82f6', icon: '🔵', title: 'Blue (Colosseum Titans)' }
    };

    gridEl.innerHTML = Object.entries(weights).map(([colorKey, prof]) => {
      const meta = colorBadges[colorKey] || { bg: '#64748b', icon: '⚡', title: prof.name || colorKey };
      return `
        <div class="ai-archetype-card" style="border-top: 3px solid ${meta.bg};">
          <div class="ai-card-top">
            <span class="ai-color-dot" style="background:${meta.bg};"></span>
            <div class="ai-card-title">${prof.name || meta.title}</div>
          </div>
          <div class="ai-metrics-table">
            <div class="ai-metric-item" title="Valuation of preserving and damaging Life">
              <span class="ai-metric-lbl">W_Life</span>
              <span class="ai-metric-val">${(prof.w_life || 2.5).toFixed(2)}</span>
            </div>
            <div class="ai-metric-item" title="Valuation of Board BP dominance">
              <span class="ai-metric-lbl">W_Field_BP</span>
              <span class="ai-metric-val">${(prof.w_field_bp || 1.4).toFixed(2)}</span>
            </div>
            <div class="ai-metric-item" title="Valuation of Core Ramp and Void channeling">
              <span class="ai-metric-lbl">W_Cores</span>
              <span class="ai-metric-val">${(prof.w_core_advantage || 1.0).toFixed(2)}</span>
            </div>
            <div class="ai-metric-item" title="Valuation of Burst cards & traps">
              <span class="ai-metric-lbl">W_Burst</span>
              <span class="ai-metric-val">${(prof.w_burst_value || 1.5).toFixed(2)}</span>
            </div>
            <div class="ai-metric-item" title="Cores kept in reserve for Flash / Counter timing">
              <span class="ai-metric-lbl">Flash Buffer</span>
              <span class="ai-metric-val">${prof.flash_reserve_buffer || 1} Core(s)</span>
            </div>
            <div class="ai-metric-item" title="Expectimax threshold to declare attacks">
              <span class="ai-metric-lbl">Aggro Thresh</span>
              <span class="ai-metric-val">${(prof.aggro_threshold || 0.45).toFixed(2)}</span>
            </div>
          </div>
          <div class="ai-card-footer">
            <span class="ai-engine-status">⚡ GADT Lookahead Active</span>
          </div>
        </div>
      `;
    }).join('');
  }

  async function triggerAiTraining(games = 120) {
    const btn = document.getElementById('btnTrainAi');
    const statusEl = document.getElementById('aiTrainStatus');
    if (btn) btn.disabled = true;
    if (statusEl) {
      statusEl.className = 'ai-train-status training';
      statusEl.innerHTML = `⏳ Simulating ${games} Tournament Matches across all 6 archetypes via Headless Monte Carlo Engine...`;
    }

    try {
      const res = await fetch('/api/train-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games: parseInt(games, 10) || 120 })
      });
      const data = await res.json();
      const isSuccess = data.success || data.status === 'ok';
      if (isSuccess) {
        DuelState.aiWeights = data.trained_profiles || data.profiles;
        const count = data.games_played || (data.generations ? data.generations * 60 : 60);
        if (statusEl) {
          statusEl.className = 'ai-train-status ready';
          statusEl.innerHTML = `🏆 <b>Tournament Complete</b>: Successfully simulated ${count} matches! Archetype heuristic weights updated.`;
        }
        renderAiDashboard();
        if (typeof showToast === 'function') {
          showToast(`🧠 AI Heuristics trained across ${count} tournament matches!`, 'success');
        }
      } else {
        if (statusEl) {
          statusEl.className = 'ai-train-status error';
          statusEl.textContent = `❌ Training failed: ${data.message || 'Unknown error'}`;
        }
      }
    } catch (e) {
      if (statusEl) {
        statusEl.className = 'ai-train-status error';
        statusEl.textContent = `❌ Network error connecting to /api/train-ai: ${e.message}`;
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ── EXPOSE PUBLIC API ──

  // ── UNIVERSAL END OF BATTLE RESOLUTION ──
  function checkEndOfBattleEffects(spirits, attSide, defSide, onComplete) {
    if (!spirits || !spirits.length) {
      if (onComplete) onComplete();
      return;
    }

    const queue = [...spirits];

    function processNext() {
      if (!queue.length) {
        if (onComplete) onComplete();
        return;
      }

      const spirit = queue.shift();
      const isPlayer = (DuelState.player.field || []).some(s => s.uid === spirit.uid);
      const isOpponent = (DuelState.opponent.field || []).some(s => s.uid === spirit.uid);
      if (!isPlayer && !isOpponent) {
        processNext();
        return;
      }

      const side = isPlayer ? 'player' : 'opponent';
      const eff = spirit.effect || '';
      const effLower = eff.toLowerCase();

      if (!effLower.includes('end of battle') && !effLower.includes('when battles')) {
        processNext();
        return;
      }

      const blocks = getCardAbilityBlocks(eff);
      const battleBlocks = blocks.filter(b => 
        /\(When Battles(?:[^)]*)\)/i.test(b) || 
        /At the end of battle/i.test(b)
      );

      if (!battleBlocks.length) {
        processNext();
        return;
      }

      let handledAsync = false;

      for (const b of battleBlocks) {
        const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
        const levelTag = lvlMatch ? lvlMatch[1] : '';
        if (!isEffectLevelMet(levelTag, spirit.currentLevel)) continue;

        const bLower = b.toLowerCase();

        // 1. By discarding one of your Bursts, refresh this Spirit
        if (/discarding\s+(?:one\s+of\s+your\s+bursts|your\s+set\s+burst|a\s+burst).*?refresh\s+this\s+spirit/i.test(bLower) ||
            /discard.*burst.*refresh/i.test(bLower)) {
          
          const setBurst = DuelState[side].burst;
          const hand = DuelState[side].hand || [];
          const handBursts = hand.filter(c => c && c.effect && c.effect.includes('[Burst:'));

          const totalBursts = [];
          if (setBurst) {
            totalBursts.push({ source: 'set', card: setBurst, label: `🔒 Set Burst: ${setBurst.name} (Cost ${setBurst.cost || 0})` });
          }
          for (const hb of handBursts) {
            totalBursts.push({ source: 'hand', card: hb, label: `🎴 Hand Burst: ${hb.name} (Cost ${hb.cost || 0})` });
          }

          if (totalBursts.length > 0 && spirit.isExhausted) {
            if (side === 'player' && !DuelState.autoPlay) {
              handledAsync = true;
              openBurstDiscardModal(spirit, totalBursts, (chosenOpt) => {
                executeBurstDiscardRefresh(spirit, chosenOpt, 'player');
                processNext();
              }, () => {
                addLog(`ℹ️ **[WHEN BATTLES: ${spirit.name}]**: Chose not to discard a Burst. Spirit remains exhausted.`, 'step');
                processNext();
              });
              return; // Halt sync loop until player responds
            } else {
              // AI or Auto-play picks first available Burst
              const chosen = totalBursts[0];
              executeBurstDiscardRefresh(spirit, chosen, side);
            }
          }
        }

        // 2. Unconditional end of battle refresh
        else if (/at the end of battle.*?this spirit refreshes/i.test(bLower)) {
          if (spirit.isExhausted) {
            spirit.isExhausted = false;
            spirit.hasAttacked = false;
            AudioFX.summon();
            addLog(`🔄 **[END OF BATTLE: ${spirit.name}]**: Refreshed to Ready stance!`, 'magic');
            if (side === 'player' && typeof showToast === 'function') {
              showToast(`🔄 [${spirit.name}]: Refreshed at end of battle!`, 'success');
            }
          }
        }

        // 3. Life reduction at end of battle
        else if (/at the end of battle.*?send\s+(?:an?|one|\d+)?\s*opposing\s+life\s+to\s+the\s+reserve/i.test(bLower)) {
          const enemySide = side === 'player' ? 'opponent' : 'player';
          if (DuelState[enemySide].life > 0) {
            DuelState[enemySide].life = Math.max(0, DuelState[enemySide].life - 1);
            DuelState[enemySide].reserve += 1;
            AudioFX.lifeDamage();
            addLog(`💥 **[END OF BATTLE: ${spirit.name}]**: Drained 1 opposing Life to Reserve! (${enemySide === 'player' ? 'Player' : 'Opponent'} Life: ${DuelState[enemySide].life})`, 'damage');
            checkGameOver();
          }
        }

        // 4. Life recovery at end of battle
        else if (/at the end of battle.*?put\s+a\s+core\s+from\s+the\s+void\s+to\s+your\s+life/i.test(bLower)) {
          if (DuelState[side].life < 5) {
            DuelState[side].life += 1;
            AudioFX.coreChime();
            addLog(`✨ **[END OF BATTLE: ${spirit.name}]**: Restored +1 Life from Void! (Life: ${DuelState[side].life})`, 'magic');
            if (side === 'player' && typeof showToast === 'function') {
              showToast(`✨ [${spirit.name}]: +1 Life from Void!`, 'success');
            }
          }
        }

        // 5. General abilities
        else {
          executeAbilityActions(b, spirit, side, 'END_OF_BATTLE');
        }
      }

      if (!handledAsync) {
        processNext();
      }
    }

    processNext();
  }

  function executeBurstDiscardRefresh(spirit, chosenOpt, side) {
    const isPlayer = side === 'player';
    const card = chosenOpt.card;

    if (chosenOpt.source === 'set') {
      DuelState[side].burst = null;
      sendToTrash(card, side, `Discarded from Burst Zone for [When Battles] of ${spirit.name}`);
      renderBurstZones();
    } else if (chosenOpt.source === 'hand') {
      const hand = DuelState[side].hand || [];
      const idx = hand.findIndex(c => c.uid === card.uid);
      if (idx !== -1) hand.splice(idx, 1);
      sendToTrash(card, side, `Discarded from Hand for [When Battles] of ${spirit.name}`);
      if (isPlayer) renderPlayerHand();
    }

    spirit.isExhausted = false;
    spirit.hasAttacked = false;
    AudioFX.burstIgnite();
    addLog(`⚔️ **[WHEN BATTLES: ${spirit.name}]**: Discarded Burst "${card.name}" to refresh this Spirit! Ready for combat!`, 'magic');
    if (isPlayer && typeof showToast === 'function') {
      showToast(`⚔️ [${spirit.name}]: Discarded Burst "${card.name}" and Refreshed!`, 'success');
    }
    renderDuelTable();
  }

  let pendingBurstDiscardState = null;

  function openBurstDiscardModal(spirit, options, onConfirm, onDecline) {
    pendingBurstDiscardState = { spirit, options, onConfirm, onDecline };
    const modal = document.getElementById('battleBurstDiscardModal');
    if (!modal) {
      if (onConfirm && options.length > 0) onConfirm(options[0]);
      return;
    }

    const titleEl = document.getElementById('burstDiscardTitle');
    const descEl = document.getElementById('burstDiscardDesc');
    const optsEl = document.getElementById('burstDiscardOptions');

    if (titleEl) titleEl.textContent = `⚔️ Trigger [When Battles] for "${spirit.name}"?`;
    if (descEl) {
      descEl.innerHTML = `At the end of battle, by discarding one of your Bursts, refresh <strong>"${spirit.name}"</strong>. Select an available Burst card to discard:`;
    }

    if (optsEl) {
      optsEl.innerHTML = options.map((opt, i) => `
        <button class="burst-discard-opt" onclick="BattleArena.confirmBurstDiscard(${i})">
          <div>
            <div class="burst-discard-opt-title">${opt.label}</div>
            <div class="burst-discard-opt-sub">${opt.source === 'set' ? 'Currently face-down in your Burst Zone' : 'In your hand'}</div>
          </div>
          <span style="font-size:1.1rem; color:#f97316;">🔥 Discard &amp; Refresh</span>
        </button>
      `).join('');
    }

    modal.classList.add('active');
  }

  function confirmBurstDiscard(index) {
    const state = pendingBurstDiscardState;
    closeBurstDiscardModal();
    if (state && state.options[index] && state.onConfirm) {
      state.onConfirm(state.options[index]);
    }
  }

  function declineBurstDiscard() {
    const state = pendingBurstDiscardState;
    closeBurstDiscardModal();
    if (state && state.onDecline) {
      state.onDecline();
    }
  }

  function closeBurstDiscardModal() {
    pendingBurstDiscardState = null;
    const modal = document.getElementById('battleBurstDiscardModal');
    if (modal) modal.classList.remove('active');
  }

  window.BattleArena = {
    init: initBattleArena,
    startDuel,
    renderDuelTable,
    renderPlayerHand,
    nextPhase,
    manualStep,
    advanceOpponentStep,
    toggleOpponentAuto,
    getState: () => DuelState,
    getPlayerAvailableCores,
    openSacrificeModal,
    adjustSacrificeCore,
    closeSacrificeModal,
    executeSacrificeSummon,
    setBurst,
    inspectBurst,
    inspectOpponentBurst,
    activateBurst,
    renderBurstZones,
    hasClash,
    hasCurse,
    hasCrush,
    hasArmor,
    getWhenAttacksBpBoost,
    getAttackSymbols,
    selectHandCard,
    deselectCard,
    renderCardInspector,
    formatEffectKeywords,
    hasFlashTiming,
    canPlayCardInCurrentPhase,
    summonCard,
    castMagic,
    handleSpiritClick,
    chooseBlocker,
    takeLifeDamage,
    closeBlockModal,
    closeResultModal,
    toggleAutoDuel,
    quickLaunchDuel,
    scrollToBattleArena,
    updateLobbyPreviews,
    openZoneModal,
    closeZoneModal,
    closeZoneModalBg,
    switchZoneTab,
    inspectZoneCard,
    renderZoneModal,
    sendToTrash,
    sendToVoid,
    recycleSpiritCoresToReserve,
    placeSoulCoreOnSpirit,
    removeSoulCoreFromSpirit,
    addCoreToSpirit,
    removeCoreFromSpirit,
    getCardTributeRequirement,
    getEligibleTributeSpirits,
    selectTributeSpirit,
    cancelTributeSummon,
    castFlashInBattle,
    launchCoinFlip,
    selectFirstPlayer,
    flipCoin,
    proceedWithDuel,
    inspectSoulCore,
    getHexCoreSvg,
    isSingleTargetBpBuff,
    getMagicBpBoostAmount,
    openTargetModal,
    selectTargetSpirit,
    closeTargetModal,
    cancelTargetSelection,
    applyMagicEffect,
    executeWhenSummonedEffects,
    executeWhenAttacksEffects,
    executeBpComparisonEffects,
    executeWhenBlocksEffects,
    executeWhenDestroyedEffects,
    parseEffectLevelRequirement,
    isEffectLevelMet,
    evaluateAiAttackExpectimax,
    getActiveAiProfile,
    loadTrainedAiWeights,
    renderAiDashboard,
    triggerAiTraining,
    addStandardDeckToRegistered,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    hasHolyLife,
    hasWindstorm,
    hasAssault,
    hasAwaken,
    hasConsecutiveBlade,
    parseBurstCondition,
    checkBurstTrigger,
    openBurstPromptModal,
    confirmBurstTrigger,
    declineBurstTrigger,
    closeBurstPromptModal,
    AudioFX
  ,
    openAdventPrompt,
    selectAdventTarget,
    cancelAdvent,
    getCardAdventRequirement,
    getEligibleAdventTargets,
    executeAdvent,
    executeWhenAdventsEffects,
    checkCardUsageRestriction,
    isAdventTimingValid,
    canPerformAdvent,
    hasCantBeBlocked,
    getBlockSacrificeRequirement,
    executePlayerAttack,
    runAiAttackStep
,
    grantExtraSymbols,
    checkAfterBurstEffects,
    checkEndOfBattleEffects,
    openBurstDiscardModal,
    confirmBurstDiscard,
    declineBurstDiscard,
    closeBurstDiscardModal,
    executeBurstDiscardRefresh,
    recalculateSpiritBp,
    endOfBattleBpReset,
    getWhenBlocksBpBoost,
    deployNexus,
    addCoreToNexus,
    removeCoreFromNexus,
    handleFieldDragStart,
    handleFieldDragOver,
    handleFieldDragLeave,
    handleFieldDrop,
    handleFieldDragEnd,
    moveFieldSpirit,
    executeWhenDeployedEffects,
    parseGrandSkill,
    canActivateGrandSkill,
    activateGrandSkill,
    executeCoreCharge,
    checkGrandFieldOnOpponentExhaust,
    viewBoardAsIs,
    reopenResultModal,
    executeUniversalCardEffect,
    CardEffectsDB,
    getCardEffectsDB: () => CardEffectsDB,
    loadCardEffectsDB,
    safeEndOpponentTurn
};

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBattleArena);
  } else {
    initBattleArena();
  }

})();
