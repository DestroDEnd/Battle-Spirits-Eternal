/**
 * Battle Spirits Eternal - Battle Arena & Duel Simulator Engine
 * Implements official core-based mechanics:
 * 5 Life, Void -> Reserve Core Step, Draw Step, Refresh Step, Main Step (Summon / Move Cores),
 * Attack Step (Exhaust to attack, BP Clash, Block, Flash timing, Life damage), and End Step.
 */

(function () {
  'use strict';
  const FALLBACK_CARD_ART = (typeof window !== 'undefined' && window.FALLBACK_CARD_ART) ? window.FALLBACK_CARD_ART : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='210' height='300' viewBox='0 0 210 300'><rect width='210' height='300' rx='10' fill='%23111827'/><rect x='8' y='8' width='194' height='284' rx='6' fill='%231f2937' stroke='%23374151' stroke-width='2'/><circle cx='105' cy='140' r='40' fill='%23374151'/><text x='105' y='148' font-family='sans-serif' font-size='28' fill='%239ca3af' text-anchor='middle'>⚔️</text><text x='105' y='210' font-family='sans-serif' font-size='12' font-weight='bold' fill='%236b7280' text-anchor='middle'>BATTLE SPIRITS</text></svg>";


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
      mirage: null,
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
      mirage: null,
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
    if (spirit.brave && spirit.brave.bpBonus) {
      spirit.currentBp += spirit.brave.bpBonus;
    }
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
  // ── BRAVE CARD HELPERS & PARSERS ──
  function isBraveCard(card) {
    if (!card) return false;
    return (card.type || '').includes('Brave');
  }

  function parseBraveBonus(levelsStr, effectStr) {
    if (levelsStr && typeof levelsStr === 'string') {
      const m = levelsStr.match(/(?:Brave|Braved)\s*:\s*\d+\s*cores?,\s*\+?(\d+)\s*BP/i);
      if (m) return parseInt(m[1], 10);
    }
    if (effectStr && typeof effectStr === 'string') {
      const mEff = effectStr.match(/(?:give|gains?|\+)\s*(\d{3,5})\s*BP/i) || effectStr.match(/(\d{3,5})\s*BP/i);
      if (mEff) return parseInt(mEff[1], 10);
    }
    return 1000;
  }

  function isEligibleBraveHost(braveCard, hostCard) {
    if (!hostCard) return { eligible: false, reason: 'No host selected' };
    if (hostCard.brave) return { eligible: false, reason: 'Spirit already has a Brave' };
    if (braveCard.uid === hostCard.uid) return { eligible: false, reason: 'Cannot combine onto itself' };
    return { eligible: true };
  }

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
        let data = null;
        try {
          const sRes = await fetch('./ai_weights.json');
          if (sRes.ok) data = await sRes.json();
        } catch (e) {}
        if (!data) {
          try {
            const res = await fetch('/api/ai-weights');
            if (res.ok) {
              const text = await res.text();
              if (text.trim().startsWith('{')) data = JSON.parse(text);
            }
          } catch (e) {}
        }
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          DuelState.aiWeights = data;
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
        let data = null;
        try {
          const sRes = await fetch('./card_effects_db.json');
          if (sRes.ok) data = await sRes.json();
        } catch (e) {}
        if (!data) {
          try {
            const res = await fetch(window.location.origin + '/api/card-effects-db');
            if (res.ok) {
              const text = await res.text();
              if (text.trim().startsWith('{')) data = JSON.parse(text);
            }
          } catch (e) {}
        }
        if (data && typeof data === 'object') {
          CardEffectsDB = data;
          if (typeof window !== 'undefined' && window.BattleArena) window.BattleArena.CardEffectsDB = CardEffectsDB;
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);
        }
      } catch (e) {
        console.warn('[NLP Effects Engine] Failed to load card effects db:', e);
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

  // ── OPTIONAL ("can" / "may") EFFECT CONFIRMATION POPUP ──
  function isOptionalEffectText(text) {
    return /\b(?:you may|may|optional|choose to)\b|\bcan\b(?!['\u2019]t|not)/i.test(text || '');
  }

  const _optQueue = [];
  let _optBusy = false;

  function _optEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function askOptionalEffect(card, description, onYes, onNo) {
    if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      if (onYes) onYes();
      return;
    }
    _optQueue.push({ card, description, onYes, onNo });
    pumpOptionalQueue();
  }

  function pumpOptionalQueue() {
    if (_optBusy || !_optQueue.length) return;
    _optBusy = true;
    const item = _optQueue.shift();
    const box = document.createElement('div');
    box.className = 'optional-effect-popup';
    box.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:100000;width:min(360px,92vw);background:#111827;border:1px solid #a855f7;border-radius:12px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.65);color:#e5e7eb;font-size:.84rem;line-height:1.35;';
    let desc = String(item.description || '').replace(/\s+/g, ' ').trim();
    if (desc.length > 220) desc = desc.slice(0, 217) + '...';
    box.innerHTML =
      '<div style="font-weight:800;color:#c084fc;margin-bottom:6px;">\u2728 ' + _optEsc(item.card && item.card.name) + '</div>' +
      '<div style="margin-bottom:10px;color:#cbd5e1;">' + _optEsc(desc) + '</div>' +
      '<div style="font-weight:700;margin-bottom:10px;">Activate this effect?</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button data-opt="yes" style="flex:1;padding:7px 0;border-radius:8px;border:none;background:#7c3aed;color:#fff;font-weight:800;cursor:pointer;">Yes</button>' +
      '<button data-opt="no" style="flex:1;padding:7px 0;border-radius:8px;border:1px solid #475569;background:#1f2937;color:#e5e7eb;font-weight:800;cursor:pointer;">No</button>' +
      '</div>';
    const finish = (yes) => {
      if (box.parentNode) box.parentNode.removeChild(box);
      _optBusy = false;
      try {
        if (yes) { if (item.onYes) item.onYes(); }
        else { if (item.onNo) item.onNo(); }
      } catch (e) { console.error(e); }
      pumpOptionalQueue();
    };
    const yesBtn = box.querySelector('[data-opt="yes"]');
    const noBtn = box.querySelector('[data-opt="no"]');
    if (!yesBtn || !noBtn) {
      // No usable DOM (headless / mocked environment): resolve automatically.
      _optBusy = false;
      try { if (item.onYes) item.onYes(); } catch (e) { console.error(e); }
      pumpOptionalQueue();
      return;
    }
    yesBtn.onclick = () => finish(true);
    noBtn.onclick = () => finish(false);
    document.body.appendChild(box);
  }

  // Marks which universal action types the legacy text engine already resolves for this
  // card/trigger so the same effect is never executed twice (e.g. double draw).
  function isConditionalLegacyDrawText(bodyLower) {
    return /when this effect depletes|when depleted|by sending|by destroying|by discarding|by returning|by exhausting|by paying|for each card discarded|via bp comparison|comparing bp|destroyed in battle/i.test(bodyLower || '');
  }

  function markLegacyHandled(card, bodyLower) {
    const types = new Set();
    if (/draw\s+(a|an|one|two|three|\d+)\s+cards?/i.test(bodyLower) && !isConditionalLegacyDrawText(bodyLower)) types.add('DRAW_CARDS');
    if (/destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+(?:spirit|ultimate)/i.test(bodyLower) ||
        /destroy\s+(a|an|one|two|three|\d+)\s+opposing\s+one-symbol\s+(?:spirits|ultimates|spirits\/ultimates)/i.test(bodyLower)) types.add('DESTROY_SPIRIT_DIRECT');
    if (/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(?:spirit|ultimate)/i.test(bodyLower) ||
        /destroy\s+(?:up\s+to\s+)?(an?|one|two|three|\d+)?\s*opposing\s+(?:(?:(?:spirits?\/ultimates?|spirits?|ultimates?)\s+(?:with\s+)?(\d+)\s*bp\s+or\s+less)|(?:(\d+)\s*bp\s+or\s+less\s+(?:spirits?\/ultimates?|spirits?|ultimates?)))/i.test(bodyLower) ||
        /destroy any number of opposing (?:spirits|ultimates|spirits\/ultimates) up to a total of/i.test(bodyLower)) types.add('DESTROY_SPIRIT_BP');
    if (/exhaust\s+(an?|one|\d+)?\s*opposing\s+spirit/i.test(bodyLower)) types.add('EXHAUST_ENEMY');
    if (/this spirit can't be blocked|this spirit cannot be blocked|cannot be blocked by opposing|can't be blocked by opposing/i.test(bodyLower)) types.add('CANNOT_BE_BLOCKED');
    if (/(?:discard|send)\s+(?:up to\s+)?(?:a|an|one|two|three|four|five|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?/i.test(bodyLower)) types.add('DECK_DISCARD');
    if (/send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:an|any|one|\d+)?\s*opposing\s+(?:spirit|ultimate|nexus).*?to\s+(?:the\s+|their\s+)?(reserve|trash)/i.test(bodyLower) && !/\bby\s+sending\b/i.test(bodyLower)) types.add('CORE_DRAIN');
    if (/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+(?:this\s+spirit|(?:your\s+)?reserve)/i.test(bodyLower)) types.add('CORE_BOOST');
    if (!types.size) return;
    const prev = (card.__legacyHandled && Date.now() - card.__legacyHandled.ts < 300) ? card.__legacyHandled.types : new Set();
    types.forEach(t => prev.add(t));
    card.__legacyHandled = { types: prev, ts: Date.now() };
  }

  
  // ?? UNIVERSAL INTERACTIVE TARGETING ENGINE (PHASE 2) ??
    // ── CUMULATIVE COST DESTRUCTION TARGETING MODAL ──
  function promptCumulativeCostTargetModal(card, side, candidates, budgetCost, onConfirm) {
    if (typeof document === 'undefined' || !document.body) {
      if (typeof onConfirm === 'function') onConfirm([]);
      return;
    }

    const box = document.createElement('div');
    box.className = 'optional-effect-popup cumulative-cost-modal';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100003;width:min(520px,94vw);background:#0f172a;border:2px solid #ea580c;border-radius:14px;padding:16px 18px;box-shadow:0 20px 50px rgba(0,0,0,.85);color:#e2e8f0;font-size:.86rem;font-family:sans-serif;pointer-events:auto;';

    const selectedUids = new Set();

    const getSelectedCost = () => {
      let sum = 0;
      candidates.forEach(c => {
        if (selectedUids.has(c.item.uid)) sum += c.cost;
      });
      return sum;
    };

    const cleanup = () => {
      if (box && box.parentNode) box.parentNode.removeChild(box);
    };

    const render = () => {
      const curCost = getSelectedCost();
      const listHtml = candidates.map(c => {
        const isSel = selectedUids.has(c.item.uid);
        const wouldExceed = !isSel && (curCost + c.cost > budgetCost);
        const bpText = c.item.currentBp ? ` • ${c.item.currentBp} BP` : '';
        const coreText = c.item.currentCores !== undefined ? ` • ${c.item.currentCores}c` : '';
        const kindLabel = c.kind === 'nexus' ? '🏛️ Nexus' : '⚔️ Spirit';
        return `
          <div class="cct-item" data-uid="${c.item.uid}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;margin:4px 0;background:${isSel ? 'rgba(234,88,12,0.25)' : 'rgba(255,255,255,0.04)'};border:1px solid ${isSel ? '#f97316' : (wouldExceed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)')};border-radius:8px;cursor:${wouldExceed ? 'not-allowed' : 'pointer'};opacity:${wouldExceed ? 0.45 : 1};">
            <div>
              <div style="font-weight:700;color:${isSel ? '#fdba74' : '#fff'};">${isSel ? '☑️ ' : '⬜ '}${c.item.name}</div>
              <div style="font-size:0.75rem;color:#94a3b8;">${kindLabel} • Cost ${c.cost}${bpText}${coreText}</div>
            </div>
            <span style="font-size:0.8rem;font-weight:800;color:#f97316;">Cost ${c.cost}</span>
          </div>
        `;
      }).join('');

      box.innerHTML = `
        <div style="font-weight:800;font-size:1.02rem;color:#fdba74;margin-bottom:4px;">💥 Select Opposing Targets to Destroy</div>
        <div style="font-size:0.82rem;color:#cbd5e1;margin-bottom:10px;">
          "${card.name}": Destroy opposing Spirits/Ultimates/Nexuses up to a total cost of <strong>${budgetCost}</strong>.
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.3);padding:6px 12px;border-radius:6px;margin-bottom:10px;font-size:0.84rem;font-weight:700;">
          <span>Allocated Cost:</span>
          <span style="color:${curCost > 0 ? '#fb923c' : '#94a3b8'};">${curCost} / ${budgetCost}</span>
        </div>
        <div style="max-height:240px;overflow-y:auto;margin-bottom:12px;">${listHtml}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="cct-skip" style="padding:6px 14px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);border-radius:6px;color:#cbd5e1;cursor:pointer;font-weight:700;">Skip</button>
          <button class="cct-confirm" style="padding:6px 16px;background:linear-gradient(135deg,#ea580c,#c2410c);border:1px solid #f97316;border-radius:6px;color:#fff;cursor:pointer;font-weight:800;">
            Destroy Selected (${selectedUids.size})
          </button>
        </div>
      `;

      box.querySelectorAll('.cct-item').forEach(el => {
        el.addEventListener('click', () => {
          const uid = el.getAttribute('data-uid');
          const cand = candidates.find(c => c.item.uid === uid);
          if (!cand) return;
          if (selectedUids.has(uid)) {
            selectedUids.delete(uid);
          } else {
            if (curCost + cand.cost <= budgetCost) {
              selectedUids.add(uid);
            } else {
              if (typeof showToast === 'function') showToast(`Cannot select "${cand.item.name}" (Cost ${cand.cost})! Would exceed total cost limit of ${budgetCost}.`, 'warning');
            }
          }
          render();
        });
      });

      box.querySelector('.cct-skip').addEventListener('click', () => {
        cleanup();
        if (typeof onConfirm === 'function') onConfirm([]);
      });

      box.querySelector('.cct-confirm').addEventListener('click', () => {
        cleanup();
        const chosen = candidates.filter(c => selectedUids.has(c.item.uid));
        if (typeof onConfirm === 'function') onConfirm(chosen);
      });
    };

    render();
    document.body.appendChild(box);
  }

  
  // ── INTERACTIVE CHOICE BRANCH MODAL ──
  function promptChoiceModal(options, onChoice) {
    const { card, side = 'player', title = 'Choose Option', description = '', choices = [] } = options;
    if (side !== 'player' || typeof document === 'undefined' || !document.body) {
      if (typeof onChoice === 'function') onChoice(0);
      return;
    }
    const box = document.createElement('div');
    box.className = 'optional-effect-popup choice-branch-modal';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100005;width:min(480px,94vw);background:#0f172a;border:2px solid #a855f7;border-radius:14px;padding:18px 20px;box-shadow:0 20px 50px rgba(0,0,0,.9);color:#e2e8f0;font-size:.88rem;font-family:sans-serif;pointer-events:auto;';

    // Background overlay with pointer-events: none so user can scroll background and view cards!
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100004;pointer-events:none;';
    document.body.appendChild(overlay);

    const closeBox = () => {
      if (box.parentNode) box.parentNode.removeChild(box);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    box.innerHTML = `
      <div style="font-size:1.05rem;font-weight:700;color:#c084fc;margin-bottom:6px;">${title}</div>
      <div style="font-size:0.82rem;color:#94a3b8;margin-bottom:14px;">${description || 'Select an effect branch to resolve:'}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
        ${choices.map((c, idx) => `
          <button class="choice-opt-btn" data-idx="${idx}" style="background:#1e293b;border:1px solid #475569;border-radius:8px;padding:10px 14px;color:#f8fafc;text-align:left;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:8px;transition:all 0.15s ease;">
            <span style="font-size:1.1rem;">${c.icon || '✨'}</span>
            <div>
              <div style="font-weight:700;color:#e2e8f0;">${c.label}</div>
              ${c.desc ? `<div style="font-size:0.75rem;color:#94a3b8;">${c.desc}</div>` : ''}
            </div>
          </button>
        `).join('')}
      </div>
    `;
    box.querySelectorAll('.choice-opt-btn').forEach(btn => {
      btn.onmouseenter = () => { btn.style.borderColor = '#c084fc'; btn.style.background = '#334155'; };
      btn.onmouseleave = () => { btn.style.borderColor = '#475569'; btn.style.background = '#1e293b'; };
      btn.onclick = () => {
        const chosenIdx = parseInt(btn.getAttribute('data-idx'), 10);
        closeBox();
        if (typeof onChoice === 'function') onChoice(chosenIdx);
      };
    });
    document.body.appendChild(box);
  }

  // ── THE EARTHDEITYSWORD GAIANOHOKO TRIGGER ──
  function checkHandOnUltimateSummon(summonedUltimate, side = 'player') {
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const gaiaIdx = (friendlyState.hand || []).findIndex(c => 
      (c.name || '').includes('Gaianohoko') ||
      (/when your ultimate is summoned.*?(?:you can\s+)?summon this card from (?:the\s+|your\s+)?hand without paying the cost/i.test(c.effect || ''))
    );
    if (gaiaIdx === -1) return;
    const gaiaCard = friendlyState.hand[gaiaIdx];
    if (side === 'player') {
      promptChoiceModal({
        card: gaiaCard,
        side: 'player',
        title: 'The EarthDeitySword Gaianohoko: Free Summon',
        description: `Your Ultimate "${summonedUltimate.name}" was summoned! Summon "${gaiaCard.name}" from Hand without paying the cost?`,
        choices: [
          { icon: '⚔️', label: 'Summon as Spirit (0 Cost)', desc: 'Summon to field for 0 cost (places 1 core to sustain)' },
          { icon: '🔗', label: `Brave onto "${summonedUltimate.name}"`, desc: 'Directly combine onto the summoned Ultimate for 0 cost' },
          { icon: '⏭️', label: 'Do not summon (Skip)', desc: 'Keep Gaianohoko in hand' }
        ]
      }, (choiceIdx) => {
        if (choiceIdx === 0) {
          friendlyState.hand.splice(gaiaIdx, 1);
          const coresToPlace = (friendlyState.reserve > 0) ? 1 : 0;
          if (coresToPlace > 0) friendlyState.reserve -= 1;
          gaiaCard.currentCores = coresToPlace;
          gaiaCard.currentLevel = 1;
          gaiaCard.currentBp = 3000;
          gaiaCard.isExhausted = false;
          friendlyState.field.push(gaiaCard);
          AudioFX.slash();
          addLog(`⚔️ **[GAIANOHOKO FREE SUMMON]**: "${gaiaCard.name}" summoned to field for free!`, 'magic');
          renderDuelTable();
          renderPlayerHand();
        } else if (choiceIdx === 1) {
          friendlyState.hand.splice(gaiaIdx, 1);
          summonedUltimate.brave = gaiaCard;
          summonedUltimate.isBraved = true;
          summonedUltimate.currentBp = (summonedUltimate.currentBp || 0) + 5000;
          AudioFX.magic();
          addLog(`🔗 **[GAIANOHOKO BRAVED]**: Combined onto "${summonedUltimate.name}" (+5000 BP, burst protection active)!`, 'magic');
          renderDuelTable();
          renderPlayerHand();
        }
      });
    } else {
      // Opponent AI braves onto Ultimate
      friendlyState.hand.splice(gaiaIdx, 1);
      summonedUltimate.brave = gaiaCard;
      summonedUltimate.isBraved = true;
      summonedUltimate.currentBp = (summonedUltimate.currentBp || 0) + 5000;
      addLog(`🔗 **[OPPONENT GAIANOHOKO]**: Combined onto "${summonedUltimate.name}"!`, 'magic');
      renderDuelTable();
    }
  }

  // ── SUMMON FROM OPEN (REMOVED) ZONE (ACCEL RECOVERY) ──
  function summonCardFromOpen(cardUid, side = 'player') {
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    if (!friendlyState.openCards) return;
    const cardIdx = friendlyState.openCards.findIndex(c => c.uid === cardUid);
    if (cardIdx === -1) return;
    const card = friendlyState.openCards[cardIdx];

    const isMainStep = (DuelState.activePlayer === side && DuelState.phases[DuelState.phaseIndex] === 'MAIN');
    if (!isMainStep) {
      if (typeof showToast === 'function') showToast("Cards in the Open Zone can only be summoned during the Main Step!", "warning");
      return;
    }

    const cost = getCardEffectiveCost(card, side);
    const totalNeeded = cost + 1;
    if ((friendlyState.reserve || 0) < totalNeeded) {
      if (typeof showToast === 'function') showToast(`Need ${totalNeeded} cores in reserve to summon "${card.name}" from Open Zone!`, "warning");
      return;
    }

    friendlyState.reserve -= totalNeeded;
    friendlyState.trash = (friendlyState.trash || 0) + cost;
    friendlyState.openCards.splice(cardIdx, 1);

    card.currentCores = 1;
    card.currentLevel = 1;
    card.currentBp = (card.levels && card.levels[0]?.bp) || 3000;
    card.isExhausted = false;
    card.hasAttacked = false;
    friendlyState.field.push(card);

    AudioFX.slash();
    addLog(`⚔️ **[OPEN ZONE SUMMON]**: "${card.name}" summoned from Open Zone to the field! Paid ${cost} cores.`, 'step');
    renderDuelTable();
    closeZoneModal();
  }

  function promptUniversalTargetModal(options, onConfirm) {
    const {
      card,
      side = 'player',
      targetSide = 'opponent',
      targetKind = 'spirit', // 'spirit' | 'nexus'
      title = 'Select Target',
      description = '',
      minCount = 1,
      maxCount = 1,
      filter = null,
      allowSkip = true
    } = options;

    const targetPlayerState = targetSide === 'player' ? DuelState.player : DuelState.opponent;
    let pool = targetKind === 'nexus' ? (targetPlayerState.nexus || []) : (targetPlayerState.field || []);

    if (typeof filter === 'function') {
      pool = pool.filter(filter);
    }

    if (!pool.length) {
      if (typeof onConfirm === 'function') onConfirm([]);
      return;
    }

    // AI or headless environment: evaluate target greedily
    if (side !== 'player' || typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      let chosen = [];
      if (targetKind === 'nexus') {
        chosen = pool.slice(0, maxCount);
      } else {
        const sorted = [...pool].sort((a, b) => (b.battleBp || b.currentBp || 0) - (a.battleBp || a.currentBp || 0));
        chosen = sorted.slice(0, maxCount);
      }
      if (typeof onConfirm === 'function') onConfirm(chosen);
      return;
    }

    const box = document.createElement('div');
    box.className = 'optional-effect-popup universal-target-modal';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100002;width:min(480px,94vw);background:#0f172a;border:2px solid #38bdf8;border-radius:14px;padding:16px 18px;box-shadow:0 20px 50px rgba(0,0,0,.85);color:#e2e8f0;font-size:.86rem;font-family:sans-serif;pointer-events:auto;';

    const selectedUids = new Set();
    const isSingle = maxCount === 1;

    const renderModalContent = () => {
      const listHtml = pool.map(item => {
        const isSel = selectedUids.has(item.uid);
        const bpText = item.currentBp ? ` ? ${item.currentBp} BP` : '';
        const coreText = item.currentCores !== undefined ? ` ? ${item.currentCores} Core(s)` : '';
        const costText = item.cost !== undefined ? `Cost ${item.cost}` : '';
        const borderCol = isSel ? '#38bdf8' : '#334155';
        const bgCol = isSel ? 'rgba(56,189,248,0.2)' : '#1e293b';

        return `
          <div data-uid="${_optEsc(item.uid)}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;margin-bottom:6px;border-radius:8px;cursor:pointer;border:1px solid ${borderCol};background:${bgCol};transition:all 0.15s ease;">
            <div>
              <div style="font-weight:700;color:${isSel ? '#bae6fd' : '#f8fafc'};">${isSel ? '?? ' : '? '}${_optEsc(item.name)}</div>
              <div style="font-size:0.75rem;color:#94a3b8;">${costText}${bpText}${coreText}${item.isExhausted ? ' (Exhausted)' : ''}</div>
            </div>
            <span style="font-size:0.75rem;font-weight:700;padding:4px 8px;border-radius:6px;background:${isSel ? '#0284c7' : '#334155'};color:#fff;">
              ${isSel ? 'Selected' : 'Target'}
            </span>
          </div>
        `;
      }).join('');

      box.innerHTML = `
        <div style="font-weight:800;font-size:1rem;color:#38bdf8;margin-bottom:6px;">?? ${_optEsc(title)}</div>
        <div style="margin-bottom:10px;color:#cbd5e1;font-size:0.83rem;">${_optEsc(description || `Select up to ${maxCount} target(s):`)}</div>
        <div style="max-height:240px;overflow-y:auto;margin-bottom:14px;padding-right:4px;">${listHtml}</div>
        <div style="display:flex;gap:10px;">
          <button data-act="confirm" style="flex:1;padding:9px 0;border-radius:8px;border:none;background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;font-weight:800;cursor:pointer;">
            Confirm (${selectedUids.size})
          </button>
          ${allowSkip ? `
            <button data-act="skip" style="flex:1;padding:9px 0;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#cbd5e1;font-weight:700;cursor:pointer;">
              Skip Selection
            </button>
          ` : ''}
        </div>
      `;

      pool.forEach(item => {
        const row = box.querySelector(`[data-uid="${item.uid}"]`);
        if (row) {
          row.onclick = () => {
            if (selectedUids.has(item.uid)) {
              selectedUids.delete(item.uid);
            } else {
              if (isSingle) selectedUids.clear();
              if (selectedUids.size < maxCount) {
                selectedUids.add(item.uid);
              }
            }
            renderModalContent();
          };
        }
      });

      const confirmBtn = box.querySelector('[data-act="confirm"]');
      if (confirmBtn) {
        confirmBtn.onclick = () => {
          if (box.parentNode) box.parentNode.removeChild(box);
          const targets = pool.filter(p => selectedUids.has(p.uid));
          if (typeof onConfirm === 'function') onConfirm(targets);
        };
      }

      const skipBtn = box.querySelector('[data-act="skip"]');
      if (skipBtn) {
        skipBtn.onclick = () => {
          if (box.parentNode) box.parentNode.removeChild(box);
          if (typeof onConfirm === 'function') onConfirm([]);
        };
      }
    };

    renderModalContent();
    document.body.appendChild(box);
  }

  // ?? CONTINUOUS RULES & BOARD AURAS ENGINE (PHASE 3) ??
  function dispatchContinuousRules() {
    if (!DuelState.inDuel) return;
    const currentPhase = DuelState.phases[DuelState.phaseIndex] || 'MAIN';
    const activeSide = DuelState.activePlayer;

    for (const side of ['player', 'opponent']) {
      const state = DuelState[side];
      const enemySide = side === 'player' ? 'opponent' : 'player';
      const enemyState = DuelState[enemySide];
      const nexuses = state.nexus || [];
      const spirits = state.field || [];

      // 1. Evaluate Nexus continuous auras
      for (const n of nexuses) {
        const eff = (n.effect || '').toLowerCase();
        const curLevel = n.currentLevel || 1;

        // BP Boost Aura to friendly spirits
        if (eff.includes('all your spirits get +1000 bp') || eff.includes('all your spirits gain +1000 bp')) {
          for (const s of spirits) {
            s.turnBpBoost = (s.turnBpBoost || 0) + 1000;
            recalculateSpiritBp(s);
          }
        }
        if (eff.includes('all your spirits get +2000 bp') || eff.includes('all your spirits gain +2000 bp')) {
          for (const s of spirits) {
            s.turnBpBoost = (s.turnBpBoost || 0) + 2000;
            recalculateSpiritBp(s);
          }
        }
      }

      // 2. Evaluate Mirage continuous auras
      const mirageCard = state.mirage;
      if (mirageCard) {
        const mEff = (mirageCard.effect || '').toLowerCase();
        if (mEff.includes('[during set]')) {
          // Check mirage static buffs
          if (mEff.includes('all your spirits get +') || mEff.includes('all your spirits gain +')) {
            const bpMatch = mEff.match(/all your spirits (?:get|gain)\s+\+(\d+)\s*bp/i);
            if (bpMatch) {
              const boost = parseInt(bpMatch[1], 10);
              for (const s of spirits) {
                s.turnBpBoost = (s.turnBpBoost || 0) + boost;
                recalculateSpiritBp(s);
              }
            }
          }
        }
      }
    }
  }

  // ?? MIRAGE & ACCEL MECHANICS ENGINE (PHASE 4) ??
  function canSetMirage(card, side = 'player') {
    if (!card || !card.effect) return { allowed: false, cost: 0 };
    const m = card.effect.match(/\[Mirage:\s*Cost\s*(\d+)\]/i);
    if (!m) return { allowed: false, cost: 0 };
    const mirageCost = parseInt(m[1], 10);
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const canAfford = (friendlyState.reserve || 0) >= mirageCost;
    return { allowed: canAfford, cost: mirageCost };
  }

  function setMirage(cardUid, side = 'player') {
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const cardIdx = (friendlyState.hand || []).findIndex(c => c.uid === cardUid);
    if (cardIdx === -1) return;
    const card = friendlyState.hand[cardIdx];

    const check = canSetMirage(card, side);
    if (!check.allowed) {
      if (typeof showToast === 'function') showToast(`Cannot set Mirage: need ${check.cost} cores in reserve!`, 'warning');
      return;
    }

    friendlyState.reserve -= check.cost;
    friendlyState.trash += check.cost;
    friendlyState.hand.splice(cardIdx, 1);

    // If an existing Mirage card was set, send it to Trash
    if (friendlyState.mirage) {
      sendToTrash(friendlyState.mirage, side, 'Replaced by new Mirage card');
    }
    friendlyState.mirage = card;

    AudioFX.magic();
    addLog(`??? **[MIRAGE SET]**: "${card.name}" placed in Mirage Zone! Paid Cost ${check.cost}.`, 'magic');
    if (typeof showToast === 'function') showToast(`?? Set "${card.name}" in Mirage Zone!`, 'success');

    dispatchContinuousRules();
    renderDuelTable();
    if (side === 'player') renderPlayerHand();
  }

  function canCastAccel(card, side = 'player') {
    if (!card || !card.effect) return { allowed: false, cost: 0, baseCost: 0 };
    const m = card.effect.match(/\[Accel:\s*Cost\s*(\d+)(?:\s*\(([^)]+)\))?\]|【アクセル】コスト(\d+)/i);
    if (!m) return { allowed: false, cost: 0, baseCost: 0 };
    const rawCost = parseInt(m[1] || m[3], 10);
    const friendly = (typeof getFriendlySymbols === 'function') ? getFriendlySymbols(side) : { total: 0, byColor: {}, rainbow: 0 };
    const cardColors = (typeof parseCardColors === 'function') ? parseCardColors(card) : ['red'];
    let matchedSymbols = 0;
    for (const col of cardColors) {
      if (friendly.byColor && friendly.byColor[col]) matchedSymbols += friendly.byColor[col];
    }
    matchedSymbols += (friendly.rainbow || 0);

    const redMatch = (m[2] || '').match(/(\d+)/);
    const maxReduction = redMatch ? parseInt(redMatch[1], 10) : Math.min(Math.max(0, rawCost - 1), matchedSymbols);
    const actualReduction = Math.min(matchedSymbols, maxReduction);
    const effCost = Math.max(1, rawCost - actualReduction);

    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const canAfford = (friendlyState.reserve || 0) >= effCost;
    return { allowed: canAfford, cost: effCost, baseCost: rawCost };
  }

  function castAccel(cardUid, side = 'player') {
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const cardIdx = (friendlyState.hand || []).findIndex(c => c.uid === cardUid);
    if (cardIdx === -1) return;
    const card = friendlyState.hand[cardIdx];

    const check = canCastAccel(card, side);
    if (!check.allowed) {
      if (typeof showToast === 'function') showToast(`Need ${check.cost} cores to cast Accel!`, 'warning');
      return;
    }

    friendlyState.reserve -= check.cost;
    friendlyState.trash += check.cost;

    AudioFX.magic();
    addLog(`? **[ACCEL ACTIVATED]**: "${card.name}" activated [Accel: Cost ${check.cost}]!`, 'magic');
    if (typeof showToast === 'function') showToast(`? Cast Accel: "${card.name}"!`, 'success');

    // Extract Accel effect block and execute
    const accelBlockMatch = card.effect.match(/\[Accel:[^\]]+\]([\s\S]*?)(?=\[LV|\(When|$)/i);
    const accelText = accelBlockMatch ? accelBlockMatch[1].trim() : card.effect;

    executeAbilityActions(accelText, card, side, 'MAGIC');
    executeUniversalCardEffect(card, side, 'FLASH');

    // Official Rule: After Accel resolves, card is placed face-up in Open Zone (Removed from Game Zone), NOT Trash!
    friendlyState.hand.splice(cardIdx, 1);
    if (!friendlyState.openCards) friendlyState.openCards = [];
    friendlyState.openCards.push(card);
    addLog(`🎴 **[ACCEL RESOLVED]**: "${card.name}" placed face-up into your Open Zone. You can click "Open: ${friendlyState.openCards.length}" on your HUD to summon it during your Main Step!`, 'magic');
  if (side === 'player' && typeof showToast === 'function') showToast(`🎴 Accel resolved: "${card.name}" moved to Open Zone!`, 'success');

    renderDuelTable();
    if (side === 'player') renderPlayerHand();
  }

  function triggerUTrigger(card, side = 'player') {
    if (!card || !card.effect) return;
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = DuelState[enemySide];

    if (!enemyState.deck || !enemyState.deck.length) {
      addLog(`?? **[U-TRIGGER: ${card.name}]**: Opposing deck is empty! U-Trigger cannot resolve.`, 'step');
      return;
    }

    // Opponent reveals top card of deck to Trash
    const revealed = enemyState.deck.shift();
    sendToTrash(revealed, enemySide, `U-Trigger check for ${card.name}`);

    const ourCost = card.cost || 0;
    const oppCost = revealed.cost || 0;
    const isHit = ourCost > oppCost;
    const isCritical = isHit && oppCost === 0;

    AudioFX.burstIgnite ? AudioFX.burstIgnite() : AudioFX.magic();

    if (isCritical) {
      addLog(`???? **[U-TRIGGER CRITICAL HIT: ${card.name}]**: Revealed "${revealed.name}" (Cost ${oppCost} vs Your Cost ${ourCost})! Critical Hit activated!`, 'damage');
      if (typeof showToast === 'function') showToast(`?? [U-Trigger Critical Hit]: Cost ${ourCost} vs ${oppCost}!`, 'success');
    } else if (isHit) {
      addLog(`?? **[U-TRIGGER HIT: ${card.name}]**: Revealed "${revealed.name}" (Cost ${oppCost} vs Your Cost ${ourCost})! U-Trigger Hit activated!`, 'magic');
      if (typeof showToast === 'function') showToast(`?? [U-Trigger Hit]: Cost ${ourCost} vs ${oppCost}!`, 'success');
    } else {
      addLog(`??? **[U-TRIGGER GUARD: ${card.name}]**: Revealed "${revealed.name}" (Cost ${oppCost} >= Your Cost ${ourCost})! Opponent guarded U-Trigger.`, 'step');
      if (typeof showToast === 'function') showToast(`??? [U-Trigger Guard]: Opponent Cost ${oppCost} guarded.`, 'info');
    }

    renderDuelTable();
  }
const NO_PROMPT_TYPES = new Set(['SPECIAL_EFFECT', 'IMMUNITY', 'ARMOR', 'HEAVY ARMOR', 'DAMAGE_CAP', 'GRANT_SYMBOL', 'HAND_DISCARD_DRAW', 'HAND_DISCARD']);

  function promptHandDiscardModal(card, side, maxDiscard, nameFilter, upTo, onConfirm) {
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const hand = friendlyState.hand || [];
    const filterLow = nameFilter ? nameFilter.toLowerCase() : null;
    const eligible = hand.filter(c => {
      if (!filterLow) return true;
      const cName = (c.name || '').toLowerCase();
      const cFam = ((c.family || '') + ' ' + (Array.isArray(c.families) ? c.families.join(' ') : '')).toLowerCase();
      return cName.includes(filterLow) || cFam.includes(filterLow);
    });

    if (eligible.length === 0) {
      addLog(`ℹ️ **[${card.name}]**: No eligible ${nameFilter ? `"${nameFilter}" ` : ''}cards in Hand to discard.`, 'step');
      if (onConfirm) onConfirm([]);
      return;
    }

    if (side !== 'player' || typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      const autoPick = eligible.slice(0, maxDiscard);
      if (onConfirm) onConfirm(autoPick);
      return;
    }

    const box = document.createElement('div');
    box.className = 'optional-effect-popup hand-discard-modal';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100001;width:min(440px,94vw);background:#111827;border:2px solid #a855f7;border-radius:14px;padding:16px 18px;box-shadow:0 16px 40px rgba(0,0,0,.8);color:#e5e7eb;font-size:.86rem;';
    const selectedUids = new Set();
    const labelStr = upTo ? `up to ${maxDiscard}` : `${Math.min(maxDiscard, eligible.length)}`;
    const filterLabel = nameFilter ? `"${_optEsc(nameFilter)}"-named ` : '';

    const renderChoices = () => {
      const listHtml = eligible.map(c => {
        const isSel = selectedUids.has(c.uid);
        return `<div data-uid="${_optEsc(c.uid)}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;margin-bottom:6px;border-radius:8px;cursor:pointer;border:1px solid ${isSel ? '#c084fc' : '#374151'};background:${isSel ? 'rgba(147,51,234,0.28)' : '#1f2937'};">
          <div>
            <div style="font-weight:800;color:${isSel ? '#f3e8ff' : '#e5e7eb'};">${isSel ? '☑️ ' : '⬜ '}${_optEsc(c.name)}</div>
            <div style="font-size:0.74rem;color:#9ca3af;">Cost ${c.cost || 0} • ${_optEsc(c.type || 'Card')} • ${_optEsc(c.family || '')}</div>
          </div>
          <span style="font-size:0.75rem;font-weight:700;color:${isSel ? '#c084fc' : '#6b7280'};">${isSel ? 'Selected' : 'Select'}</span>
        </div>`;
      }).join('');

      box.innerHTML =
        `<div style="font-weight:800;font-size:0.95rem;color:#c084fc;margin-bottom:6px;">🗑️ ${_optEsc(card.name)} — Discard from Hand</div>` +
        `<div style="margin-bottom:10px;color:#cbd5e1;">Select ${labelStr} ${filterLabel}card(s) from your Hand to discard (${selectedUids.size}/${maxDiscard} selected):</div>` +
        `<div style="max-height:220px;overflow-y:auto;margin-bottom:12px;">${listHtml}</div>` +
        `<div style="display:flex;gap:8px;">` +
        `<button data-act="confirm" style="flex:1;padding:8px 0;border-radius:8px;border:none;background:#7c3aed;color:#fff;font-weight:800;cursor:pointer;">Discard (${selectedUids.size})</button>` +
        (upTo ? `<button data-act="cancel" style="flex:1;padding:8px 0;border-radius:8px;border:1px solid #475569;background:#1f2937;color:#e5e7eb;font-weight:800;cursor:pointer;">Skip (0)</button>` : '') +
        `</div>`;

      const confirmBtn = box.querySelector('[data-act="confirm"]');
      const cancelBtn = box.querySelector('[data-act="cancel"]');
      if (!confirmBtn) {
        if (box.parentNode) box.parentNode.removeChild(box);
        if (onConfirm) onConfirm(eligible.slice(0, maxDiscard));
        return;
      }
      const rows = box.querySelectorAll('[data-uid]');
      if (rows && rows.forEach) {
        rows.forEach(r => {
          r.onclick = () => {
            const u = r.getAttribute('data-uid');
            if (selectedUids.has(u)) {
              selectedUids.delete(u);
            } else {
              if (selectedUids.size >= maxDiscard) {
                if (maxDiscard === 1) {
                  selectedUids.clear();
                  selectedUids.add(u);
                }
              } else {
                selectedUids.add(u);
              }
            }
            renderChoices();
          };
        });
      }

      confirmBtn.onclick = () => {
        if (!upTo && selectedUids.size < Math.min(maxDiscard, eligible.length)) {
          if (typeof showToast === 'function') showToast(`Please select ${Math.min(maxDiscard, eligible.length)} card(s) to discard.`, 'warning');
          return;
        }
        if (box.parentNode) box.parentNode.removeChild(box);
        const chosen = eligible.filter(c => selectedUids.has(c.uid));
        if (onConfirm) onConfirm(chosen);
      };
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          if (box.parentNode) box.parentNode.removeChild(box);
          if (onConfirm) onConfirm([]);
        };
      }
    };

    document.body.appendChild(box);
    renderChoices();
  }

  function checkAndPayByCondition(act, card, side, friendlyState, enemySide, enemyState) {
    const byCond = act && act.canva_rules && act.canva_rules.by_condition;
    if (!byCond || !byCond.is_cost_gated) return true;
    const costType = byCond.cost_type || '';
    const rawCond = (byCond.condition_raw || '').toLowerCase();

    if (costType === 'DRAIN_OPPOSING_CORE' || (rawCond.includes('sending') && rawCond.includes('opposing') && rawCond.includes('core'))) {
      const dest = byCond.dest || (rawCond.includes('trash') ? 'trash' : (rawCond.includes('void') ? 'void' : 'reserve'));
      const candidates = (enemyState.field || []).filter(s => (s.currentCores || 0) >= 1 && !s.isImmuneToOpposingEffects);
      if (candidates.length === 0) {
        addLog(`ℹ️ **[${card.name}]**: Cost condition ("By ${byCond.condition_raw}") could not be fulfilled — no opposing Spirit with cores on field.`, 'step');
        return false;
      }
      candidates.sort((a, b) => (a.currentCores || 1) - (b.currentCores || 1));
      const targetSp = candidates[0];
      targetSp.currentCores -= 1;
      if (dest === 'reserve') enemyState.reserve += 1;
      else if (dest === 'trash') enemyState.trash += 1;
      recalculateSpiritBp(targetSp);
      AudioFX.coreChime();
      addLog(`🔮 **[${card.name}]**: Paid cost — sent 1 Core from opposing "${targetSp.name}" to ${dest}!`, 'magic');
      if (targetSp.currentCores <= 0) {
        const spIdx = enemyState.field.findIndex(s => s.uid === targetSp.uid);
        if (spIdx !== -1) {
          const depleted = enemyState.field.splice(spIdx, 1)[0];
          sendToTrash(depleted, enemySide, `Depleted by ${card.name}`);
          addLog(`💀 **DEPLETED**: Opposing "${depleted.name}" was depleted of cores and sent to Trash!`, 'damage');
        }
      }
      return true;
    }

    if (costType === 'DISCARD_BURST') {
      const bCard = friendlyState.burst || friendlyState.burstCard;
      if (!bCard) return false;
      friendlyState.burst = null;
      friendlyState.burstCard = null;
      sendToTrash(bCard, side, `Discarded Burst for ${card.name}`);
      addLog(`🔮 **[${card.name}]**: Discarded set Burst "${bCard.name}" to pay cost!`, 'step');
      return true;
    }

    if (costType === 'DISCARD_PRE_ADVENT') {
      const under = card.underlyingCards || [];
      if (!under.length) return false;
      const popped = under.shift();
      sendToTrash(popped, side, `Discarded pre-Advent card for ${card.name}`);
      addLog(`🔮 **[${card.name}]**: Discarded pre-Advent card "${popped.name}" to pay cost!`, 'step');
      return true;
    }

    if (costType === 'SEND_CORE_TO_TRASH' || costType === 'SEND_CORE_TO_VOID') {
      const fromReserve = rawCond.includes('reserve');
      const fromLife = rawCond.includes('life');
      if (fromLife) {
        if ((friendlyState.life || 0) < 1) return false;
        friendlyState.life -= 1;
        if (costType === 'SEND_CORE_TO_TRASH') friendlyState.trash += 1;
        return true;
      }
      if (fromReserve || (card.currentCores || 0) <= 1) {
        if ((friendlyState.reserve || 0) < 1) return false;
        friendlyState.reserve -= 1;
        if (costType === 'SEND_CORE_TO_TRASH') friendlyState.trash += 1;
        return true;
      }
      if ((card.currentCores || 0) >= 2) {
        card.currentCores -= 1;
        if (costType === 'SEND_CORE_TO_TRASH') friendlyState.trash += 1;
        recalculateSpiritBp(card);
        return true;
      }
      return false;
    }

    if (costType === 'DESTROY_FRIENDLY') {
      const allies = (friendlyState.field || []).filter(s => s.uid !== card.uid);
      if (!allies.length) return false;
      const sac = allies[0];
      const idx = friendlyState.field.findIndex(s => s.uid === sac.uid);
      if (idx !== -1) friendlyState.field.splice(idx, 1);
      recycleSpiritCoresToReserve(sac, side);
      sendToTrash(sac, side, `Destroyed to pay cost for ${card.name}`);
      return true;
    }

    if (costType === 'EXHAUST_FRIENDLY') {
      const readyAllies = (friendlyState.field || []).filter(s => !s.isExhausted);
      if (!readyAllies.length) return false;
      readyAllies[0].isExhausted = true;
      return true;
    }

    if (costType === 'BOUNCE_FRIENDLY') {
      const allies = (friendlyState.field || []).filter(s => s.uid !== card.uid);
      if (!allies.length) return false;
      const b = allies[0];
      const idx = friendlyState.field.findIndex(s => s.uid === b.uid);
      if (idx !== -1) friendlyState.field.splice(idx, 1);
      recycleSpiritCoresToReserve(b, side);
      friendlyState.hand.push(b);
      return true;
    }

    return true;
  }

  function checkIfConditionMet(act, card, side, friendlyState, enemyState) {
    const ifCond = act && act.canva_rules && act.canva_rules.if_condition;
    if (!ifCond) return true;
    const ct = ifCond.check_type;
    if (ct === 'ANY_NEXUS_ON_FIELD') {
      return ((friendlyState.nexus && friendlyState.nexus.length > 0) || (enemyState.nexus && enemyState.nexus.length > 0));
    }
    if (ct === 'OPPONENT_HAS_NEXUS') {
      return !!(enemyState.nexus && enemyState.nexus.length > 0);
    }
    if (ct === 'PLAYER_HAS_NEXUS') {
      return !!(friendlyState.nexus && friendlyState.nexus.length > 0);
    }
    if (ct === 'HAS_SOUL_CORE') {
      const condRaw = (ifCond.condition_raw || '').toLowerCase();
      if (condRaw.includes('used to pay the cost') || condRaw.includes('paid as cost') || condRaw.includes('paid the cost')) {
        return !!card.paidWithSoulCore;
      }
      return !!(card.hasSoulCore || card.paidWithSoulCore);
    }
    if (ct === 'IS_BRAVED') {
      return !!(card.isBraved || card.brave);
    }

    const condRaw = (ifCond.condition_raw || '').toLowerCase();
    if (condRaw) {
      const parseWordNum = (w, def = 1) => {
        if (!w) return def;
        const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
        const parsed = parseInt(w, 10);
        return isNaN(parsed) ? (map[w.toLowerCase()] || def) : parsed;
      };

      if (condRaw.includes('you control no spirit') || condRaw.includes('control no spirits')) {
        return (friendlyState.field || []).filter(s => s.type === 'Spirit' || (s.type || '').includes('Spirit')).length === 0;
      }
      if (condRaw.includes('used to pay the cost') || condRaw.includes('paid as cost') || condRaw.includes('paid the cost')) {
        return !!card.paidWithSoulCore;
      }
      if (condRaw.includes('soul core')) {
        return !!(card.hasSoulCore || card.paidWithSoulCore);
      }
      const lifeMatch = condRaw.match(/your life is (?:at\s+)?(\w+)\s+or\s+less/i);
      if (lifeMatch) {
        const num = parseWordNum(lifeMatch[1], 3);
        return (friendlyState.life || 0) <= num;
      }
      const oppSpiritsMatch = condRaw.match(/opponent controls (\w+) or more spirits/i);
      if (oppSpiritsMatch) {
        const num = parseWordNum(oppSpiritsMatch[1], 1);
        return (enemyState.field || []).length >= num;
      }
      const countersMatch = condRaw.match(/you have (\w+) or more counters|one counter or more/i);
      if (countersMatch) {
        const num = countersMatch[1] ? parseWordNum(countersMatch[1], 1) : 1;
        return (friendlyState.counters || 0) >= num;
      }
    }

    return true;
  }

  function checkAndRecordOncePerTurnLimit(act, card, friendlyState) {
    const limit = act && act.canva_rules && act.canva_rules.limit;
    if (!limit) return true;
    const curTurn = DuelState.turn || 1;
    const actKey = `${act.type}_${(act.raw_text || '').slice(0, 32)}`;
    if (limit === 'HARD_ONCE_PER_TURN') {
      if (!friendlyState.__hardOptUsed || friendlyState.__hardOptTurn !== curTurn) {
        friendlyState.__hardOptUsed = new Set();
        friendlyState.__hardOptTurn = curTurn;
      }
      const key = `${card.name}::${actKey}`;
      if (friendlyState.__hardOptUsed.has(key)) return false;
      friendlyState.__hardOptUsed.add(key);
      return true;
    }
    if (limit === 'SOFT_ONCE_PER_TURN') {
      if (!card.__softOptUsed || card.__softOptTurn !== curTurn) {
        card.__softOptUsed = new Set();
        card.__softOptTurn = curTurn;
      }
      if (card.__softOptUsed.has(actKey)) return false;
      card.__softOptUsed.add(actKey);
      return true;
    }
    if (limit === 'ONCE_PER_GAME') {
      if (!friendlyState.__oncePerGameUsed) friendlyState.__oncePerGameUsed = new Set();
      const key = `${card.name}::${actKey}`;
      if (friendlyState.__oncePerGameUsed.has(key)) return false;
      friendlyState.__oncePerGameUsed.add(key);
      return true;
    }
    return true;
  }
  const NO_PROMPT_TRIGGERS = new Set(['PASSIVE', 'BURST', 'FLASH', 'GRAND_SKILL', 'GRAND_FIELD']);

  function executeUniversalCardEffect(card, side, trigger, context = {}) {
    if (!card) return;
    const cardData = CardEffectsDB[card.name];
    if (!cardData || !cardData.triggers) return;
    const actions = cardData.triggers[trigger];
    if (!actions || !Array.isArray(actions) || !actions.length) return;

    const skip = new Set(context.__skipTypes || []);
    const legacy = card.__legacyHandled;
    card.__legacyHandled = null;
    if (legacy && Date.now() - legacy.ts < 300) legacy.types.forEach(t => skip.add(t));

    const ctx = Object.assign({}, context, { __skipTypes: skip, __declined: new Set() });
    const curLevel = card.currentLevel || 1;
    const isBravedNow = !!(card.isBraved || card.brave || card.braveCard || context.isBraved);

    const promptable = (side === 'player' && !context.__noPrompt && !NO_PROMPT_TRIGGERS.has(trigger) &&
        typeof document !== 'undefined' && document.body)
      ? actions.filter(a => a && a.canva_rules && a.canva_rules.is_optional &&
          !skip.has(a.type) && !NO_PROMPT_TYPES.has(a.type) &&
          !(a.min_level && curLevel < a.min_level) &&
          !((a.is_braved || a.require_braved) && !isBravedNow))
      : [];

    if (!promptable.length) {
      executeUniversalCardEffectCore(card, side, trigger, ctx);
      return;
    }
    const askNext = (i) => {
      if (i >= promptable.length) {
        executeUniversalCardEffectCore(card, side, trigger, ctx);
        return;
      }
      const act = promptable[i];
      askOptionalEffect(card, act.raw_text || act.desc, () => askNext(i + 1), () => { ctx.__declined.add(act); askNext(i + 1); });
    };
    askNext(0);
  }

  function executeUniversalCardEffectCore(card, side, trigger, context = {}) {
    if (!card) return;
    const cardData = CardEffectsDB[card.name];
    if (!cardData || !cardData.triggers) return;

    const actions = cardData.triggers[trigger];
    if (!actions || !Array.isArray(actions) || !actions.length) return;

    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = side === 'player' ? DuelState.opponent : DuelState.player;
    const curLevel = card.currentLevel || 1;

    for (let i = 0; i < actions.length; i++) {
      const act = actions[i];
      if (actions[i + 1] && /\binstead\b/i.test(actions[i + 1].raw_text || '') &&
          actions[i + 1].canva_rules && actions[i + 1].canva_rules.if_condition) {
        if (checkIfConditionMet(actions[i + 1], card, side, friendlyState, enemyState)) {
          continue;
        }
      }
      if (act.min_level && curLevel < act.min_level) continue;
      if (context.__skipTypes && context.__skipTypes.has(act.type)) continue;
      if (context.__declined && context.__declined.has(act)) continue;
      // Canva Rule: When Braved condition gating
      if ((act.is_braved || act.require_braved) && !card.isBraved && !card.brave && !card.braveCard && !context.isBraved) {
        continue;
      }

      const actType = act.type;
      if (!checkIfConditionMet(act, card, side, friendlyState, enemyState)) continue;
      if (!checkAndRecordOncePerTurnLimit(act, card, friendlyState)) continue;
      if (!checkAndPayByCondition(act, card, side, friendlyState, enemySide, enemyState)) continue;

      if (actType === 'HAND_DISCARD_DRAW') {
        const maxDisc = act.max_discard || 1;
        const nameFilt = act.name_filter || (act.canva_rules && act.canva_rules.name_filter && act.canva_rules.name_filter.value) || null;
        const upTo = act.up_to !== undefined ? act.up_to : true;
        const forEach = act.for_each !== undefined ? act.for_each : true;
        const perDraw = act.draw_count || 1;
        promptHandDiscardModal(card, side, maxDisc, nameFilt, upTo, (discardedCards) => {
          if (!discardedCards || !discardedCards.length) return;
          for (const dc of discardedCards) {
            const hIdx = friendlyState.hand.findIndex(h => h.uid === dc.uid);
            if (hIdx !== -1) {
              const removed = friendlyState.hand.splice(hIdx, 1)[0];
              sendToTrash(removed, side, `Discarded from Hand by ${card.name}`);
            }
          }
          addLog(`🗑️ **[${card.name}]**: Discarded ${discardedCards.length} card(s) from Hand (${discardedCards.map(c => `"${c.name}"`).join(', ')})!`, 'magic');
          const totalDraw = forEach ? discardedCards.length * perDraw : perDraw;
          for (let i = 0; i < totalDraw; i++) {
            const drawn = friendlyState.deck.shift();
            if (drawn) {
              friendlyState.hand.push(drawn);
              if (side === 'player') {
                AudioFX.playTone(390, 'sine', 0.15, 0.08);
                addLog(`🎴 **[${card.name}]**: Drew "${drawn.name}" into your hand!`, 'magic');
              }
            }
          }
          renderDuelTable();
          if (side === 'player') renderPlayerHand();
        });
      } else if (actType === 'HAND_DISCARD') {
        const cnt = act.count || 1;
        const targetSide = act.target === 'opponent' ? enemySide : side;
        const nameFilt = act.name_filter || (act.canva_rules && act.canva_rules.name_filter && act.canva_rules.name_filter.value) || null;
        const upTo = act.up_to !== undefined ? act.up_to : false;
        promptHandDiscardModal(card, targetSide, cnt, nameFilt, upTo, (discardedCards) => {
          if (!discardedCards || !discardedCards.length) return;
          const tState = targetSide === 'player' ? DuelState.player : DuelState.opponent;
          for (const dc of discardedCards) {
            const hIdx = tState.hand.findIndex(h => h.uid === dc.uid);
            if (hIdx !== -1) {
              const removed = tState.hand.splice(hIdx, 1)[0];
              sendToTrash(removed, targetSide, `Discarded from Hand by ${card.name}`);
            }
          }
          addLog(`🗑️ **[${card.name}]**: Discarded ${discardedCards.length} card(s) from ${targetSide === 'player' ? 'your' : "opponent's"} Hand!`, 'magic');
          renderDuelTable();
          if (targetSide === 'player') renderPlayerHand();
        });
      } else if (actType === 'DRAW_CARDS') {
        const count = act.count || 1;
        for (let i = 0; i < count; i++) {
          const drawn = friendlyState.deck.shift();
          if (drawn) {
            friendlyState.hand.push(drawn);
            if (side === 'player') {
              AudioFX.playTone(390, 'sine', 0.15, 0.08);
              addLog(`🎴 **[${card.name}]**: Channeled ability! Drew "${drawn.name}" into your hand.`, 'magic');
              renderPlayerHand();
              renderDuelTable();
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
          let buffTarget = card;
          if (card.type === 'Magic' || !(friendlyState.field || []).some(s => s.uid === card.uid)) {
            buffTarget = (context.targetSpiritUid && friendlyState.field.find(s => s.uid === context.targetSpiritUid)) ||
                         (DuelState.combatEvent && friendlyState.field.find(s => s.uid === DuelState.combatEvent.attacker?.uid || s.uid === DuelState.combatEvent.blocker?.uid)) ||
                         (friendlyState.field && friendlyState.field[0]);
          }
          if (buffTarget) {
            buffTarget.battleBpBoost = (buffTarget.battleBpBoost || 0) + boost;
            buffTarget.battleBp = (buffTarget.baseBp || buffTarget.currentBp) + buffTarget.battleBpBoost;
            buffTarget.currentBp = buffTarget.battleBp;
            addLog(`⚡ **[${card.name}]**: Granted +${boost} BP to "${buffTarget.name}"! (Current BP: ${buffTarget.currentBp})`, 'magic');
          }
        }
      } else if (actType === 'DESTROY_SPIRIT_BP') {
        const rawText = act.raw_text || '';
        const isCumulative = /up to a total of\s+(\d+)\s*bp/i.test(rawText);
        if (isCumulative) {
          const m = rawText.match(/up to a total of\s+(\d+)\s*bp/i);
          const maxBp = m ? parseInt(m[1], 10) : (act.max_bp || 5000);
          let remainingBp = maxBp;
          const destroyedNames = [];
          const candidates = (enemyState.field || [])
            .map(s => ({ spirit: s, bp: s.battleBp || s.currentBp || 0 }))
            .filter(item => item.bp <= remainingBp)
            .sort((a, b) => b.bp - a.bp);

          for (const item of candidates) {
            if (item.bp <= remainingBp) {
              const vIdx = enemyState.field.findIndex(s => s.uid === item.spirit.uid);
              if (vIdx !== -1) {
                const popped = enemyState.field.splice(vIdx, 1)[0];
                remainingBp -= item.bp;
                recycleSpiritCoresToReserve(popped, enemySide);
                sendToTrash(popped, enemySide, `Destroyed by ${card.name} (Total ${maxBp} BP limit)`);
                AudioFX.destroy();
                destroyedNames.push(`"${popped.name}" (${item.bp} BP)`);
              }
            }
          }

          const usedBp = maxBp - remainingBp;
          if (destroyedNames.length > 0) {
            addLog(`💥 **[${card.name}]**: Destroyed ${destroyedNames.join(', ')} (Total ${usedBp}/${maxBp} BP)!`, 'damage');
          } else {
            addLog(`ℹ️ **[${card.name}]**: No opposing Spirits within the ${maxBp} BP limit to destroy.`, 'info');
          }
        } else {
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
        if ((card.effect || '').toLowerCase().includes('twinkle necromancy') || (card.name || '').includes('Siegfried-Necro')) {
          // Handled specifically with interactive choice / one-of-each constraint by Twinkle Necromancy
          continue;
        }
        if (trigger === 'BURST' || act.burst_condition || act.target_desc === 'This Card' || (act.raw_text || '').toLowerCase().includes('summon this card')) {
          // In Battle Spirits, "After this effect resolves, summon this card without paying the cost"
          // refers to the Burst card itself being summoned to the field from the Burst Zone.
          // This is handled by activateBurst directly. Never duplicate/pluck a card from the player's Hand!
          continue;
        }
        const pool = act.source === 'trash' ? (friendlyState.trashCards || friendlyState.trashPile || []) : friendlyState.hand;
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
        const trashList = friendlyState.trashCards || friendlyState.trashPile || [];
        if (trashList.length > 0) {
          let pickedIdx = -1;
          const targetDesc = (act.target_desc || act.desc || '').toLowerCase();
          if (targetDesc.includes('[advent]') || targetDesc.includes('advent')) {
            pickedIdx = trashList.findIndex(c => (c.type === 'Spirit' || (c.type || '').includes('Spirit')) && ((c.effect || '').includes('[Advent') || (c.effect || '').includes('煌臨') || (c.levels && String(c.levels).includes('Advent'))));
          } else if (targetDesc.includes('spirit')) {
            pickedIdx = trashList.findIndex(c => c.type === 'Spirit' || (c.type || '').includes('Spirit'));
          } else if (targetDesc.includes('magic')) {
            pickedIdx = trashList.findIndex(c => c.type === 'Magic');
          } else if (targetDesc.includes('nexus')) {
            pickedIdx = trashList.findIndex(c => (c.type || '').includes('Nexus'));
          } else if (targetDesc.includes('brave')) {
            pickedIdx = trashList.findIndex(c => (c.type || '').includes('Brave'));
          }
          if (pickedIdx === -1) pickedIdx = 0; // fallback to most recently discarded card
          const picked = trashList.splice(pickedIdx, 1)[0];
          if (picked) {
            friendlyState.hand.push(picked);
            AudioFX.magic();
            addLog(`♻️ **[${card.name}]**: Salvaged "${picked.name}" from Trash to Hand!`, 'magic');
            renderDuelTable();
            if (side === 'player') renderPlayerHand();
          }
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
      } else if (actType === 'DECK_DISCARD') {
        const count = act.count || 1;
        const isSelf = (act.target === 'self');
        const targetSide = isSelf ? side : enemySide;
        const targetState = isSelf ? friendlyState : enemyState;
        let discarded = 0;
        for (let i = 0; i < count; i++) {
          if (!targetState.deck || targetState.deck.length === 0) break;
          const milled = targetState.deck.shift();
          sendToTrash(milled, targetSide, `Discarded from decktop by ${card.name}`);
          discarded++;
        }
        if (discarded > 0) {
          AudioFX.magic();
          addLog(`📚 **[${card.name}]**: Sent ${discarded} card(s) from ${isSelf ? 'your' : 'opposing'} decktop to Trash (Graveyard)!`, 'magic');
          renderDuelTable();
          if (targetSide === 'player') renderPlayerHand();
        }
      } else if (actType === 'CRUSH') {
        const millCount = curLevel;
        let discarded = 0;
        for (let i = 0; i < millCount; i++) {
          if (!enemyState.deck || enemyState.deck.length === 0) break;
          const milled = enemyState.deck.shift();
          sendToTrash(milled, enemySide, `Crush by ${card.name}`);
          discarded++;
        }
        if (discarded > 0) {
          AudioFX.destroy();
          addLog(`🔨 **[${card.name}] [Crush LV${curLevel}]**: Smashed ${discarded} card(s) from opposing deck into Trash!`, 'damage');
        }
      } else if (actType === 'BURST_LOCK') {
        const targetRule = (act.canva_rules && act.canva_rules.burst_lock_target) || 'PLAYER';
        if (targetRule === 'PLAYER') {
          enemyState.cannotActivateBurstEffects = true;
          addLog(`🔒 **[${card.name}]**: Absolute Lock! Opposing player cannot activate Burst effects!`, 'step');
        } else {
          enemyState.burstCardsLocked = true;
          addLog(`🔒 **[${card.name}]**: Lock! Opposing Burst cannot activate!`, 'step');
        }
      } else if (actType === 'ARMOR' || actType === 'HEAVY ARMOR') {
        const colors = act.colors || ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
        card.armorColors = (card.armorColors || []).concat(colors);
        AudioFX.shield();
        addLog(`🛡️ **[${card.name}] [${actType}]**: Divine barrier active against [${colors.join(', ')}] effects!`, 'step');
      } else if (actType === 'SPECIAL_EFFECT') {
        const descText = (act.raw_text || act.desc || '').toLowerCase();
        
        // 1. Decktop Mill
        const millMatch = descText.match(/(?:discard|send)\s+(?:up to\s+)?(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?(?:top\s+of\s+(?:your\s+)?)?(opposing\s+)?decktop(?:\s+to\s+(?:the\s+)?trash)?/i);
        if (millMatch) {
          const mCount = parseWordNumber(millMatch[1]);
          const isOpp = Boolean(millMatch[2]) || descText.includes('opposing');
          const targetSide = isOpp ? enemySide : side;
          const targetState = isOpp ? enemyState : friendlyState;
          let discarded = 0;
          for (let i = 0; i < mCount; i++) {
            if (!targetState.deck || targetState.deck.length === 0) break;
            const milled = targetState.deck.shift();
            sendToTrash(milled, targetSide, `Discarded from decktop by ${card.name}`);
            discarded++;
          }
          if (discarded > 0) {
            AudioFX.magic();
            addLog(`?? **[${card.name}]**: Sent ${discarded} card(s) from ${isOpp ? 'opposing' : 'your'} decktop to Trash (Graveyard)!`, 'magic');
            renderDuelTable();
            if (targetSide === 'player') renderPlayerHand();
          }
        }
        // 2. Core Ramp: "put 1/2 cores from Void to your Reserve/Field/Spirit"
        else if (descText.includes('core') && descText.includes('from the void')) {
          const coreMatch = descText.match(/(?:put|send|place|move)\s+(a|an|one|two|three|four|five|\d+)\s+cores?\s+from\s+(?:the\s+)?void/i);
          const coreCount = coreMatch ? parseWordNumber(coreMatch[1], 1) : 1;
          friendlyState.reserve = (friendlyState.reserve || 0) + coreCount;
          AudioFX.coreChime();
          addLog(`?? **[${card.name}]**: Put ${coreCount} core(s) from the Void into your Reserve! (Total Reserve: ${friendlyState.reserve})`, 'magic');
          renderDuelTable();
        }
        // 3. Draw & Filter: "draw X cards" in special effect
        else if (descText.includes('draw') && descText.includes('card')) {
          const drawMatch = descText.match(/draw\s+(a|an|one|two|three|four|\d+)\s+cards?/i);
          const drawCount = drawMatch ? parseWordNumber(drawMatch[1], 1) : 1;
          let drawnCards = 0;
          for (let i = 0; i < drawCount; i++) {
            if (!friendlyState.deck || !friendlyState.deck.length) break;
            const d = friendlyState.deck.shift();
            friendlyState.hand.push(d);
            drawnCards++;
          }
          if (drawnCards > 0) {
            AudioFX.magic();
            addLog(`?? **[${card.name}]**: Drew ${drawnCards} card(s) from your deck!`, 'magic');
            renderDuelTable();
            if (side === 'player') renderPlayerHand();
          }
        }
        // 4. Exhaust enemy spirits
        else if (descText.includes('exhaust') && (descText.includes('opposing') || descText.includes('enemy'))) {
          const exMatch = descText.match(/exhaust\s+(a|an|one|two|three|\d+)?\s*(?:opposing|enemy)?\s*(?:exhausted|ready)?\s*spirits?/i);
          const exCount = exMatch && exMatch[1] ? parseWordNumber(exMatch[1], 1) : 1;
          const readies = (enemyState.field || []).filter(s => !s.isExhausted);
          if (readies.length > 0) {
            promptUniversalTargetModal({
              card,
              side,
              targetSide: enemySide,
              targetKind: 'spirit',
              title: `Exhaust Opposing Spirit (${card.name})`,
              description: `Select up to ${exCount} opposing Spirit(s) to Exhaust:`,
              minCount: 1,
              maxCount: exCount,
              filter: s => !s.isExhausted
            }, (targets) => {
              for (const t of targets) {
                t.isExhausted = true;
                AudioFX.slash();
                addLog(`?? **[${card.name}]**: Exhausted opposing "${t.name}"!`, 'magic');
              }
              renderDuelTable();
            });
          }
        }
        // 5. Bounce enemy spirits: "return an opposing spirit to hand"
        else if (descText.includes('return') && descText.includes('hand') && (descText.includes('opposing') || descText.includes('enemy'))) {
          const bCandidates = enemyState.field || [];
          if (bCandidates.length > 0) {
            promptUniversalTargetModal({
              card,
              side,
              targetSide: enemySide,
              targetKind: 'spirit',
              title: `Return Opposing Spirit to Hand (${card.name})`,
              description: `Select an opposing Spirit to return to its owner's Hand:`,
              minCount: 1,
              maxCount: 1
            }, (targets) => {
              if (targets && targets.length > 0) {
                const target = targets[0];
                const idx = enemyState.field.findIndex(s => s.uid === target.uid);
                if (idx !== -1) {
                  const popped = enemyState.field.splice(idx, 1)[0];
                  recycleSpiritCoresToReserve(popped, enemySide);
                  enemyState.hand.push(popped);
                  AudioFX.magic();
                  addLog(`?? **[${card.name}]**: Returned opposing "${popped.name}" to Hand!`, 'magic');
                  renderDuelTable();
                }
              }
            });
          }
        }
        // 6. Cumulative Cost Destruction (e.g. The SacredEmperor Siegfrieden XV)
        else if (
          descText.includes('destroy') &&
          (descText.includes('total cost') || descText.includes('total of cost'))
        ) {
          executeAbilityActions(act.raw_text || act.desc, card, side, trigger, context);
        }
        // Fallback: informational log
        else if (act.desc && act.desc.length > 3 && !act.desc.startsWith('[LV') && !act.desc.startsWith('(')) {
          addLog(`? **[${card.name}]**: ${act.desc}`, 'step');
        }
      }
    }
  }

  async function initBattleArena() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        let stdData = null;
        try {
          const sRes = await fetch('./standard_decks_data.json');
          if (sRes.ok) stdData = await sRes.json();
        } catch (e) {}
        if (!stdData) {
          try {
            const res = await fetch('/api/standard-decks');
            if (res.ok) {
              const text = await res.text();
              if (text.trim().startsWith('{')) stdData = JSON.parse(text);
            }
          } catch (e) {}
        }
        if (stdData) {
          const list = stdData.decks || (Array.isArray(stdData) ? stdData : []);
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
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('bse_auth_state_change', () => {
        initPvpLobbyView();
      });
      initPvpLobbyView();
    }
  }


  // ── FULLSCREEN ARENA CONTROLLER ──
  function enterFullscreen() {
    try {
      // Prefer document.documentElement so modals (#cardModal, #battleResultModal, etc.) are included in fullscreen
      const fsTarget = (typeof document !== 'undefined' ? document.documentElement : null) || document.getElementById('battleArena');
      if (!fsTarget) return;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (fsTarget.requestFullscreen) {
          fsTarget.requestFullscreen().catch(err => {
            console.log('Fullscreen request bypassed by browser security policy:', err);
          });
        } else if (fsTarget.webkitRequestFullscreen) {
          fsTarget.webkitRequestFullscreen();
        } else if (fsTarget.msRequestFullscreen) {
          fsTarget.msRequestFullscreen();
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
            <a href="./deck.html" class="lobby-goto-builder">🎴 Build / Add Cards in Deck Builder →</a>
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

    function isContractPartnerCard(c) {
    if (!c) return false;
    if (c.is_contract_partner === true || c.isContractPartner === true) return true;

    const name = (c.name || '').toLowerCase();
    const kanji = (c.kanji || c.jpname || '');
    const type = (c.type || '').toLowerCase();
    const rarity = (c.rarity || '').toLowerCase();
    const num = (c.card_number || c.cardNumber || '');

    // Strictly exclude Contract Advent / Evolution cards that are not the partner themselves
    if (name.includes('advent') || name.includes('煌臨')) return false;

    const isContractType = type.startsWith('contract ') || type === 'contract' || type.includes('contractor');
    const hasPartnerName = name.includes('partner') || kanji.includes('相棒') || kanji.includes('契約者');
    const hasContractRarity = rarity.includes('contract') || rarity === 'cx';
    const hasContractNumber = /-(?:cx|cp)\d+/i.test(num);

    if (hasPartnerName && (isContractType || hasContractRarity || hasContractNumber)) return true;
    if (hasContractRarity && isContractType) return true;
    if (hasContractNumber && isContractType) return true;
    if (hasPartnerName && (type.includes('ultimate') || type.includes('spirit') || type.includes('nexus'))) return true;

    return false;
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
              let cInfo = batchData[name] || batchData[name.toLowerCase()];
              if (!cInfo && batchData.cards && Array.isArray(batchData.cards)) {
                cInfo = batchData.cards.find(c => (c.name || '').toLowerCase() === name.toLowerCase());
              }
              if (!cInfo && typeof window !== 'undefined' && window.WasmDB && window.WasmDB.getCardByName) {
                cInfo = window.WasmDB.getCardByName(name);
              }
              if (!cInfo) {
                cInfo = { name, cost: 2, type: 'Spirit', color: userDeck.color || 'Red', image_url: './assets/card_back.png' };
              }
              if (!cInfo.image_url) {
                cInfo.image_url = './assets/card_back.png';
              }
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
            let cInfo = batchData[name] || batchData[name.toLowerCase()];
            if (!cInfo && batchData.cards && Array.isArray(batchData.cards)) {
              cInfo = batchData.cards.find(c => (c.name || '').toLowerCase() === name.toLowerCase());
            }
            if (!cInfo && typeof window !== 'undefined' && window.WasmDB && window.WasmDB.getCardByName) {
              cInfo = window.WasmDB.getCardByName(name);
            }
            if (!cInfo) {
              cInfo = { name, cost: 2, type: 'Spirit', color: 'Red', image_url: './assets/card_back.png' };
            }
            if (!cInfo.image_url) {
              cInfo.image_url = './assets/card_back.png';
            }
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
          image_url: c.image_url || './assets/card_back.png',
          levels: pLevels,
          raw_levels: c.levels || '',
          effect: c.effect || '',
          summary: c.summary || '',
          currentCores: 0,
          currentLevel: 1,
          currentBp: pLevels[0]?.bp || 2000,
          isExhausted: false,
          hasAttacked: false,
          isContractPartner: isContractPartnerCard(c),
          is_contract_partner: isContractPartnerCard(c)
        };
      });
    };



    // Clear any previous running timers to prevent ghost turns/core spikes!
    clearAllTimers();
    const finishedBar = document.getElementById('matchFinishedBar');
    if (finishedBar) finishedBar.style.display = 'none';

    // Deal 4 initial cards each
    // Contract Partner Rule (Eternal Format R39): Extract Contract Partner BEFORE shuffling the rest of deck!
    const pPreparedCards = prepareDeck(pCards);
    const oPreparedCards = prepareDeck(oCards);

    const pContractIdx = pPreparedCards.findIndex(c => isContractPartnerCard(c));
    let pHand = [];
    let pPartnerCard = null;
    let shuffledP = [];
    if (pContractIdx !== -1) {
      pPartnerCard = pPreparedCards.splice(pContractIdx, 1)[0];
      shuffledP = shuffle(pPreparedCards);
      pHand = [pPartnerCard, ...shuffledP.splice(0, 3)];
      addLog(`🃏 **CONTRACT PARTNER**: Guaranteed "${pPartnerCard.name}" as your Contract Partner in your starting hand!`, 'system');
    } else {
      shuffledP = shuffle(pPreparedCards);
      pHand = shuffledP.splice(0, 4);
    }

    const oContractIdx = oPreparedCards.findIndex(c => isContractPartnerCard(c));
    let oHand = [];
    let oPartnerCard = null;
    let shuffledO = [];
    if (oContractIdx !== -1) {
      oPartnerCard = oPreparedCards.splice(oContractIdx, 1)[0];
      shuffledO = shuffle(oPreparedCards);
      oHand = [oPartnerCard, ...shuffledO.splice(0, 3)];
      addLog(`🃏 **CONTRACT PARTNER**: Opponent revealed "${oPartnerCard.name}" as their Contract Partner!`, 'system');
    } else {
      shuffledO = shuffle(oPreparedCards);
      oHand = shuffledO.splice(0, 4);
    }

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
      mirage: null,
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledP,
      hand: pHand,
      field: [],
      contractCard: pPartnerCard || null,
      soulStateCards: [],
      hasConfirmedHand: false,
      hasMulliganed: false
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
      mirage: null,
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledO,
      hand: oHand,
      field: [],
      contractCard: oPartnerCard || null,
      soulStateCards: []
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
      addLog(`▶️ **OPPONENT TURN 1**: Opponent won coin toss and will take Turn 1 once you confirm your starting hand.`, 'step');
      // DO NOT auto-advance opponent yet! Wait for player to confirm hand / mulligan!
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
  // ── MULLIGAN & STARTING HAND ENGINE ──
  function performMulligan() {
    if (!DuelState.inDuel || DuelState.player.hasConfirmedHand || DuelState.player.hasMulliganed) return;
    const hand = DuelState.player.hand || [];
    if (!hand.length) return;

    const returnedCount = hand.length;
    DuelState.player.deck.push(...hand);
    DuelState.player.hand = [];

    // Shuffle deck thoroughly
    DuelState.player.deck = shuffle(DuelState.player.deck);

    // Re-guarantee Contract Partner in the redrawn hand!
    const partnerCardUid = DuelState.player.contractCard ? DuelState.player.contractCard.uid : null;
    const pContractIdx = DuelState.player.deck.findIndex(c => (partnerCardUid && c.uid === partnerCardUid) || isContractPartnerCard(c));
    if (pContractIdx !== -1) {
      const contractCard = DuelState.player.deck.splice(pContractIdx, 1)[0];
      DuelState.player.contractCard = contractCard;
      DuelState.player.hand = [contractCard, ...DuelState.player.deck.splice(0, 3)];
      addLog(`🃏 **CONTRACT PARTNER**: Guaranteed "${contractCard.name}" in your redrawn hand!`, 'system');
    } else {
      DuelState.player.hand = DuelState.player.deck.splice(0, 4);
    }

    DuelState.player.hasMulliganed = true;
    AudioFX.coreChime();
    addLog(`🔄 **[MULLIGAN PERFORMED]**: Returned ${returnedCount} cards to deck, shuffled, and redrew 4 fresh cards!`, 'magic');
    if (typeof showToast === 'function') showToast('Redrew starting hand! (Mulligan used)', 'success');
    confirmStartingHandAndBegin();
  }

  function keepStartingHand() {
    if (!DuelState.inDuel || DuelState.player.hasConfirmedHand) return;
    DuelState.player.hasConfirmedHand = true;
    DuelState.player.hasMulliganed = true;
    addLog('✓ **[STARTING HAND KEPT]**: Player confirmed starting hand for the duel.', 'step');
    confirmStartingHandAndBegin();
  }

  function confirmStartingHandAndBegin() {
    DuelState.player.hasConfirmedHand = true;
    renderDuelTable();
    renderPlayerHand();

    if (DuelState.firstPlayer === 'opponent') {
      addLog(`▶️ **OPPONENT TURN 1**: Hand confirmed. Opponent begins Turn 1 phases.`, 'step');
      safeTimeout(advanceOpponentStep, 800);
    } else {
      addLog(`▶️ **START STEP**: Turn 1 begins! Click "Begin Turn" on the Step Navigator to proceed.`, 'step');
    }
  }

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
            <img src="${n.image_url || '/placeholder.png'}" class="bnz-card-thumb" alt="${n.name}" referrerpolicy="no-referrer" onerror="this.src='/placeholder.png';">
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
        // Render Count & Open Zone counts
    const pCountVal = document.getElementById('playerCountVal');
    if (pCountVal) pCountVal.textContent = DuelState.player.counters || 0;
    const oCountVal = document.getElementById('opponentCountVal');
    if (oCountVal) oCountVal.textContent = DuelState.opponent.counters || 0;

    const pOpenVal = document.getElementById('playerOpenCount');
    if (pOpenVal) pOpenVal.textContent = (DuelState.player.openCards || []).length;
    const oOpenVal = document.getElementById('opponentOpenCount');
    if (oOpenVal) oOpenVal.textContent = (DuelState.opponent.openCards || []).length;

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
                <img src="${b.image_url}" alt="${b.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='./assets/card_back.png';" />
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

  function openCardDetailContext(cardName, zone = 'auto') {
    let contextList = null;
    if (zone === 'hand') {
      contextList = (DuelState.player && DuelState.player.hand ? DuelState.player.hand : []).map(c => c.name);
    } else if (zone === 'field') {
      const list = [];
      const pField = (DuelState.player && DuelState.player.field) || [];
      pField.forEach(s => {
        if (!s) return;
        list.push(s.name);
        if (s.underlyingCards && s.underlyingCards.length > 0) {
          s.underlyingCards.forEach(u => u && list.push(u.name));
        }
      });
      contextList = list;
    } else if (zone === 'opp-field') {
      const list = [];
      const oppField = (DuelState.opponent && DuelState.opponent.field) || [];
      oppField.forEach(s => {
        if (!s) return;
        list.push(s.name);
        if (s.underlyingCards && s.underlyingCards.length > 0) {
          s.underlyingCards.forEach(u => u && list.push(u.name));
        }
      });
      contextList = list;
    }
    if (typeof openCardDetail === 'function') {
      openCardDetail(cardName, contextList);
    }
  }

  function renderFieldSpirit(spirit, side) {
    recalculateSpiritBp(spirit);
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

    let braveFieldBadge = '';
    let braveFieldActionBtn = '';
    if (spirit.brave) {
      braveFieldBadge = `<div class="spirit-brave-badge" title="Braved with ${spirit.brave.name} (+${spirit.brave.bpBonus || 1000} BP)">🔗 +${spirit.brave.bpBonus || 1000} BP</div>`;
      if (isPlayer && isMainStep) {
        braveFieldActionBtn = `<button class="fsc-brave-btn debrave" onclick="event.stopPropagation(); BattleArena.separateBrave('${spirit.uid}')" title="Separate Brave into Spirit form">🔄 De-Brave</button>`;
      }
    } else if (spirit.type === 'Brave' || spirit.isBraveCard) {
      braveFieldBadge = `<div class="spirit-brave-mode-badge" title="Brave in Spirit Form">⚔️ BRAVE (Spirit)</div>`;
      if (isPlayer && isMainStep) {
        braveFieldActionBtn = `<button class="fsc-brave-btn brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${spirit.uid}', 'field')" title="Combine with another Spirit">🔗 Brave</button>`;
      }
    }

    return `
      <div class="${classes}" id="spirit_${spirit.uid}" ${dragAttrs} onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        ${dragHandleHtml}
        ${braveFieldBadge}
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 13)} SOUL CORE</div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('${safeSpName}', 'field')" title="Inspect Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='./assets/card_back.png'; }" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${braveFieldActionBtn}
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

// =========================================================================
  // 🔮 SYMBOL COST REDUCTION & ULTIMATE SUMMON CONDITION ENGINE
  // =========================================================================

  function parseCardSymbols(target) {
    if (target === undefined || target === null) return 1;
    let symStr = '';
    if (typeof target === 'object') {
      symStr = String(target.symbol || '').trim();
      if (!symStr) {
        const type = String(target.type || '').toLowerCase();
        if (type.includes('magic')) return 0;
        return 1;
      }
    } else {
      symStr = String(target).trim();
    }
    if (symStr === '' || symStr === '-' || symStr === '0' || symStr.toLowerCase() === 'none') return 0;
    const px20 = (symStr.match(/20px/g) || []).length;
    const px25 = (symStr.match(/25px/g) || []).length;
    if (px20 + px25 > 0) return px20 + px25;
    if (/^\d+$/.test(symStr)) return parseInt(symStr, 10);
    if (symStr.includes(',') || symStr.includes('/')) {
      const tokens = symStr.split(/[,/]/).map(t => t.trim()).filter(Boolean);
      if (tokens.length > 0) return tokens.length;
    }
    return 1;
  }

  function parseCardColors(card) {
    if (!card) return ['red'];
    const raw = card.colors || card.color || 'red';
    if (Array.isArray(raw)) return raw.map(c => String(c).toLowerCase().trim()).filter(Boolean);
    const str = String(raw).toLowerCase();
    if (str.includes(',')) return str.split(',').map(s => s.trim()).filter(Boolean);
    if (str.includes('/')) return str.split('/').map(s => s.trim()).filter(Boolean);
    return [str.trim()];
  }

  function getFriendlySymbols(side) {
    const friendlyState = (side === 'opponent') ? DuelState.opponent : DuelState.player;
    if (!friendlyState) return { total: 0, byColor: {}, rainbow: 0 };

    const byColor = { red: 0, purple: 0, green: 0, white: 0, yellow: 0, blue: 0 };
    let rainbow = 0;

    // 1. Spirits / Ultimates on field
    const field = friendlyState.field || [];
    for (const s of field) {
      let symCount = parseCardSymbols(s);
      if (s.extraSymbols) symCount += s.extraSymbols;
      if (symCount > 0) {
        const eff = (s.effect || '').toLowerCase();
        const isRainbow = eff.includes('treated as red/purple/green/yellow/blue') ||
                          eff.includes('treated as red/purple/green/white/yellow/blue') ||
                          eff.includes('treated as all colors') ||
                          eff.includes('all-color') ||
                          eff.includes('6 colors');

        if (isRainbow) {
          rainbow += symCount;
        } else {
          const colors = parseCardColors(s);
          for (const col of colors) {
            if (byColor[col] !== undefined) {
              byColor[col] += symCount;
            }
          }
        }
      }

      // Brave attached to spirit
      if (s.brave) {
        let bCount = parseCardSymbols(s.brave);
        if (bCount > 0) {
          const bEff = (s.brave.effect || '').toLowerCase();
          const bIsRainbow = bEff.includes('treated as red/purple/green/yellow/blue') ||
                             bEff.includes('treated as red/purple/green/white/yellow/blue') ||
                             bEff.includes('treated as all colors');
          if (bIsRainbow) {
            rainbow += bCount;
          } else {
            const bColors = parseCardColors(s.brave);
            for (const bCol of bColors) {
              if (byColor[bCol] !== undefined) {
                byColor[bCol] += bCount;
              }
            }
          }
        }
      }
    }

    // 2. Nexuses on field
    const nexuses = friendlyState.nexus || [];
    for (const n of nexuses) {
      let symCount = parseCardSymbols(n);
      if (symCount <= 0 && n.symbol !== '-' && n.symbol !== '0') {
        symCount = 1;
      }
      if (symCount > 0) {
        const nEff = (n.effect || '').toLowerCase();
        const isRainbow = nEff.includes('treated as red/purple/green/yellow/blue') ||
                          nEff.includes('treated as red/purple/green/white/yellow/blue') ||
                          nEff.includes('treated as all colors');

        if (isRainbow) {
          rainbow += symCount;
        } else {
          const colors = parseCardColors(n);
          for (const col of colors) {
            if (byColor[col] !== undefined) {
              byColor[col] += symCount;
            }
          }
        }
      }
    }

    const total = Object.values(byColor).reduce((a, b) => a + b, 0) + rainbow;
    return { total, byColor, rainbow };
  }

  function calculateSymbolReduction(card, side = 'player') {
    if (!card) return { reduction: 0, effectiveCost: 0, baseCost: 0, minCost: 0, maxReduction: 0, matchedSymbols: 0 };
    const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
    if (baseCost <= 1) {
      return { reduction: 0, effectiveCost: baseCost, baseCost, minCost: baseCost, maxReduction: 0, matchedSymbols: 0 };
    }

    // Standard official Battle Spirits reduction curve
    let maxReduction = 0;
    let minCost = 1;
    if (baseCost === 2) {
      maxReduction = 1; minCost = 1;
    } else if (baseCost === 3) {
      maxReduction = 2; minCost = 1;
    } else if (baseCost === 4) {
      maxReduction = 3; minCost = 1; // e.g. Leading Sieg (4 cost, 3 red reduction symbols -> min cost 1)
    } else if (baseCost === 5) {
      maxReduction = 3; minCost = 2;
    } else if (baseCost === 6) {
      maxReduction = 4; minCost = 2;
    } else if (baseCost === 7) {
      maxReduction = 4; minCost = 3;
    } else if (baseCost === 8) {
      maxReduction = 5; minCost = 3; // e.g. Ultimate-Seiryubi (8 cost, 5 reduction symbols -> min cost 3)
    } else if (baseCost >= 9) {
      maxReduction = Math.min(6, Math.floor(baseCost * 0.65));
      minCost = Math.max(1, baseCost - maxReduction);
    }

    // Effect overrides for reduction
    const eff = (card.effect || '').toLowerCase();
    const redMatch = eff.match(/(?:reduction|軽減)(?:シンボル)?[:\s]+(\d+)/i);
    if (redMatch) {
      maxReduction = Math.min(baseCost - 1, parseInt(redMatch[1], 10));
      minCost = Math.max(1, baseCost - maxReduction);
    }
    if (card.reduction !== undefined && card.reduction !== null && !isNaN(Number(card.reduction))) {
      maxReduction = Math.min(baseCost - 1, Number(card.reduction));
      minCost = Math.max(1, baseCost - maxReduction);
    }

    // Card colors
    const cardColors = parseCardColors(card);
    const isCardRainbow = eff.includes('reduction symbols of this card') &&
      (eff.includes('treated as red/purple/green/white/yellow/blue') || eff.includes('all colors') || eff.includes('red/purple/green/yellow/blue'));

    const friendly = getFriendlySymbols(side);

    // Calculate matching friendly symbols
    let matchedSymbols = 0;
    if (isCardRainbow) {
      matchedSymbols = friendly.total;
    } else {
      let specificSymbols = 0;
      for (const col of cardColors) {
        if (friendly.byColor[col]) {
          specificSymbols += friendly.byColor[col];
        }
      }
      matchedSymbols = specificSymbols + friendly.rainbow;
    }

    const actualReduction = Math.min(matchedSymbols, maxReduction, Math.max(0, baseCost - minCost));
    const effectiveCost = Math.max(minCost, baseCost - actualReduction);

    return {
      reduction: actualReduction,
      effectiveCost,
      baseCost,
      minCost,
      maxReduction,
      matchedSymbols
    };
  }

  function getCardEffectiveCost(card, side = 'player') {
    return calculateSymbolReduction(card, side).effectiveCost;
  }

  function validateUltimateSummonCondition(card, side = 'player') {
    if (!card) return { allowed: true };
    const type = String(card.type || '');
    if (type !== 'Ultimate' && !type.includes('Ultimate')) {
      return { allowed: true };
    }

    const eff = card.effect || '';
    const m = eff.match(/(?:\[(?:Summon Condition|SuAdcon):?|【(?:召喚条件|召喚\/煌臨条件)：?)\s*([^\]】\n]+)/i);
    if (!m) return { allowed: true };

    const condText = m[1].trim();
    if (!condText || /^(?:none|なし|無し)\.?$/i.test(condText)) {
      return { allowed: true, condText };
    }

    const friendlyState = (side === 'opponent') ? DuelState.opponent : DuelState.player;
    if (!friendlyState) return { allowed: true, condText };

    const field = friendlyState.field || [];
    const spirits = field.filter(s => s.type === 'Spirit' || (s.type || '').includes('Spirit'));
    const ultimates = field.filter(s => s.type === 'Ultimate' || (s.type || '').includes('Ultimate'));
    const life = friendlyState.life !== undefined ? friendlyState.life : 5;
    const counters = friendlyState.counters || friendlyState.counter || 0;

    const cl = condText.toLowerCase();

    function wordToNum(str) {
      const map = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
        'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      const s = String(str || '').toLowerCase().trim();
      if (map[s] !== undefined) return map[s];
      const n = parseInt(s, 10);
      return isNaN(n) ? 1 : n;
    }

    // 1. Counter conditions
    if (cl.includes('counter') || cl.includes('カウント')) {
      const cMatch = cl.match(/(?:at least|have)\s+(\w+|\d+)\s+counter/i) || cl.match(/(\w+|\d+)\s+or more\s+counter/i) || cl.match(/c(\d+)\s+or\s+more/i);
      const req = cMatch ? wordToNum(cMatch[1]) : 1;
      if (counters < req) {
        return { allowed: false, reason: `Requires ${req} or more Counters (Current: ${counters})`, condText };
      }
      return { allowed: true, condText };
    }

    // 2. Life conditions
    if (cl.includes('life') || cl.includes('ライフ')) {
      const lessMatch = cl.match(/life\s+is\s+(?:at\s+)?(\w+|\d+)\s+or\s+less/i) || cl.match(/(\w+|\d+)\s+lives?\s+or\s+less/i);
      if (lessMatch) {
        const maxLife = wordToNum(lessMatch[1]);
        if (life > maxLife) {
          return { allowed: false, reason: `Requires Life to be ${maxLife} or less (Current: ${life})`, condText };
        }
        return { allowed: true, condText };
      }
      const moreMatch = cl.match(/life\s+is\s+(?:at\s+)?(\w+|\d+)\s+or\s+more/i) || cl.match(/at\s+least\s+(\w+|\d+)\s+lives?/i) || cl.match(/(\w+|\d+)\s+lives?\s+or\s+more/i);
      if (moreMatch) {
        const minLife = wordToNum(moreMatch[1]);
        if (life < minLife) {
          return { allowed: false, reason: `Requires Life to be ${minLife} or more (Current: ${life})`, condText };
        }
        return { allowed: true, condText };
      }
    }

    // 3. Spirits & Trash empty check
    if (cl.includes('no spirits') || cl.includes('0 spirit cards in your trash')) {
      const trashSpirits = (friendlyState.trashCards || friendlyState.trash || []).filter(c => (c.type || '').includes('Spirit'));
      if (spirits.length > 0 || trashSpirits.length > 0) {
        return { allowed: false, reason: 'Requires controlling no Spirits and having 0 Spirits in Trash', condText };
      }
      return { allowed: true, condText };
    }

    // 4. Ultimates on field
    if (cl.includes('one or more ultimates') || cl.includes('1 or more ultimates') || cl.includes('at least one ultimate')) {
      if (ultimates.length < 1) {
        return { allowed: false, reason: 'Requires controlling at least 1 Ultimate on field', condText };
      }
      return { allowed: true, condText };
    }

    // 5. Cost N or higher Spirit / Unit
    const costMatch = cl.match(/cost\s+(\d+)\s+or\s+(?:higher|more)\s+(?:spirit|ultimate)/i);
    if (costMatch) {
      const reqCost = parseInt(costMatch[1], 10);
      const countMatch = cl.match(/(?:control|have)\s+(\w+|\d+)\s+or\s+more\s+cost/i);
      const reqCount = countMatch ? wordToNum(countMatch[1]) : 1;
      const matching = field.filter(u => (u.cost || 0) >= reqCost);
      if (matching.length < reqCount) {
        return { allowed: false, reason: `Requires controlling at least ${reqCount} Cost ${reqCost}+ Spirit/Ultimate`, condText };
      }
      return { allowed: true, condText };
    }

    // 6. Color-specific Spirits
    const colorMatch = cl.match(/(?:have|control)\s+(\w+|\d+)\s+or\s+more\s+(red|purple|green|white|yellow|blue)\s+spirit/i) ||
                       cl.match(/(\w+|\d+)\s+or\s+more\s+(red|purple|green|white|yellow|blue)\s+spirits?\s+on\s+your\s+field/i);
    if (colorMatch) {
      const reqCount = wordToNum(colorMatch[1]);
      const reqColor = colorMatch[2].toLowerCase();
      const matching = spirits.filter(s => (s.color || '').toLowerCase().includes(reqColor));
      if (matching.length < reqCount) {
        return { allowed: false, reason: `Requires controlling ${reqCount} or more ${colorMatch[2]} Spirits on field`, condText };
      }
      return { allowed: true, condText };
    }

    // 7. Family-specific Spirit/Ultimate
    const famMatch = cl.match(/(?:control|have)\s+(\w+|\d+)\s+or\s+more\s+([a-zA-Z\s]+?)\s+(?:spirit|ultimate)/i);
    if (famMatch) {
      const reqCount = wordToNum(famMatch[1]);
      const fam = famMatch[2].trim().toLowerCase();
      if (!['red', 'purple', 'green', 'white', 'yellow', 'blue', 'cost'].includes(fam)) {
        const matching = field.filter(u => {
          const uFam = ((u.family || '') + ' ' + (u.families ? u.families.join(' ') : '')).toLowerCase();
          return uFam.includes(fam);
        });
        if (matching.length < reqCount) {
          return { allowed: false, reason: `Requires controlling ${reqCount}+ "${famMatch[2].trim()}" Spirits/Ultimates`, condText };
        }
        return { allowed: true, condText };
      }
    }

    // 8. Named card / Partner
    const nameMatch = condText.match(/["'“‘]([^"'”’]+)["'”’]/);
    if (nameMatch) {
      const targetName = nameMatch[1].trim().toLowerCase();
      const hasOnField = field.some(u => (u.name || '').toLowerCase().includes(targetName));
      const isContractPartner = (friendlyState.contractCard && (friendlyState.contractCard.name || '').toLowerCase().includes(targetName));
      if (!hasOnField && !isContractPartner) {
        return { allowed: false, reason: `Requires controlling "${nameMatch[1].trim()}" on field or in Soul State`, condText };
      }
      return { allowed: true, condText };
    }

    return { allowed: true, condText };
  }


  // ── CONTRACT PARTNER SELECTION & MODAL CONTROLLERS ──
  function openPartnerSelectionModal() {
    if (!DuelState.player) return;
    const allCards = [...(DuelState.player.hand || []), ...(DuelState.player.deck || [])];
    const partners = allCards.filter(c => isContractPartnerCard(c));
    if (!partners.length) {
      if (typeof showToast === 'function') showToast('No Contract Partner cards found in deck.', 'info');
      return;
    }
    const modal = document.getElementById('battlePartnerModal');
    if (!modal) return;
    const listEl = document.getElementById('partnerModalList');
    if (listEl) {
      listEl.innerHTML = partners.map(p => {
        const isCurrent = DuelState.player.contractCard && DuelState.player.contractCard.uid === p.uid;
        return `
          <div class="partner-select-card ${isCurrent ? 'is-active-partner' : ''}" style="display:flex;align-items:center;justify-content:space-between;background:rgba(30,41,59,0.9);border:1.5px solid ${isCurrent ? '#f59e0b' : '#334155'};border-radius:8px;padding:10px 14px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:1.2rem;">🌟</span>
              <div>
                <div style="font-weight:700;color:#f8fafc;font-size:0.95rem;">${(p.name || '').replace(/</g, '&lt;')}</div>
                <div style="font-size:0.75rem;color:#94a3b8;">${(p.type || 'Contract Card')} • Cost ${p.cost} • ${(p.card_number || '')}</div>
              </div>
            </div>
            <button onclick="BattleArena.selectContractPartner('${p.uid}')" style="background:${isCurrent ? '#10b981' : '#f59e0b'};border:none;color:#fff;font-weight:700;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.8rem;">
              ${isCurrent ? '✓ Designated Partner' : 'Select as Partner'}
            </button>
          </div>
        `;
      }).join('');
    }
    modal.classList.add('active');
  }

  function closePartnerModal() {
    const modal = document.getElementById('battlePartnerModal');
    if (modal) modal.classList.remove('active');
  }

  function selectContractPartner(uid) {
    if (!DuelState.inDuel || DuelState.player.hasConfirmedHand) return;
    const allCards = [...(DuelState.player.hand || []), ...(DuelState.player.deck || [])];
    const chosen = allCards.find(c => c.uid === uid);
    if (!chosen) return;

    // Remove from current position
    const handIdx = (DuelState.player.hand || []).findIndex(c => c.uid === uid);
    if (handIdx !== -1) {
      DuelState.player.hand.splice(handIdx, 1);
    } else {
      const deckIdx = (DuelState.player.deck || []).findIndex(c => c.uid === uid);
      if (deckIdx !== -1) DuelState.player.deck.splice(deckIdx, 1);
    }

    // If there was an old partner in hand[0], send it back to deck
    if (DuelState.player.hand.length >= 4) {
      const old = DuelState.player.hand.shift();
      DuelState.player.deck.push(old);
    }

    // Place newly designated partner at hand[0]
    DuelState.player.hand.unshift(chosen);
    DuelState.player.contractCard = chosen;
    addLog(`🃏 **CONTRACT PARTNER**: Selected "${chosen.name}" as your designated Contract Partner!`, 'system');
    closePartnerModal();
    renderDuelTable();
    renderPlayerHand();
    if (typeof showToast === 'function') showToast(`Contract Partner set to "${chosen.name}"!`, 'success');
  }

  function renderPlayerHand() {
    const handEl = document.getElementById('playerHand');
    if (!handEl) return;
    const isPlayerTurn = DuelState.activePlayer === 'player';
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    const isMainStep = isPlayerTurn && currentPhase === 'MAIN';
    const isAttackStep = isPlayerTurn && currentPhase === 'ATTACK';

    const { reserve, fieldCores, total: totalAvailableCores } = getPlayerAvailableCores();

    let mulliganHtml = '';
    if (!DuelState.player.hasConfirmedHand) {
      const isOppFirst = (DuelState.firstPlayer === 'opponent');
      const subText = isOppFirst 
        ? 'Opponent won coin toss and takes Turn 1. Check your starting hand: Redraw once or Keep Hand to start the duel.'
        : 'Not satisfied with your cards? Redraw 4 fresh cards once!';
      const keepBtnText = isOppFirst ? '✓ Keep Hand & Begin Match' : '✓ Keep Hand';

      const partnerBadgeHtml = DuelState.player.contractCard
        ? `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
             <span style="background:rgba(245,158,11,0.25);border:1px solid #f59e0b;padding:3px 10px;border-radius:6px;color:#fef08a;font-size:0.8rem;font-weight:800;letter-spacing:0.3px;">
               🌟 Contract Partner: ${(DuelState.player.contractCard.name || '').replace(/</g, '&lt;')} (In Starting Hand)
             </span>
             <button onclick="event.stopPropagation(); BattleArena.openPartnerSelectionModal()" style="background:rgba(245,158,11,0.3);border:1px solid #fde047;color:#fff;font-weight:700;padding:3px 9px;border-radius:5px;cursor:pointer;font-size:0.75rem;">🔄 Choose Partner</button>
           </div>`
        : '';

      mulliganHtml = `
        <div class="mulligan-prompt-bar" style="grid-column:1/-1;width:100%;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,rgba(30,58,138,0.95),rgba(88,28,135,0.95));border:1.5px solid #818cf8;border-radius:10px;padding:10px 16px;margin-bottom:10px;box-shadow:0 6px 18px rgba(99,102,241,0.35);flex-wrap:wrap;gap:10px;">
          <div>
            <div style="font-size:0.86rem;font-weight:700;color:#e0e7ff;">🃏 <strong>Starting Hand:</strong> ${subText}</div>
            ${partnerBadgeHtml}
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            ${!DuelState.player.hasMulliganed ? `<button onclick="event.stopPropagation(); BattleArena.performMulligan()" style="background:#4f46e5;border:1px solid #a5b4fc;color:#fff;font-weight:700;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.82rem;">🔄 Redraw 4 Cards</button>` : ''}
            <button onclick="event.stopPropagation(); BattleArena.keepStartingHand()" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);color:#fff;font-weight:700;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.82rem;">${keepBtnText}</button>
          </div>
        </div>
      `;
    }

    handEl.innerHTML = mulliganHtml + DuelState.player.hand.map(card => {
      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
      const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
      const isMagic = card.type === 'Magic';
      const isNexus = (card.type || '').includes('Nexus');
      const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
      const reductionInfo = calculateSymbolReduction(card, 'player');
      const cost = reductionInfo.effectiveCost;
      const isReduced = cost < baseCost;
      const reductionText = isReduced ? ` [Reduced from ${baseCost}]` : '';
      const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

      // Strict Battle Spirits Rule: Attack step ONLY permits Flash cards!
      const canPlayStep = canPlayCardInCurrentPhase(card);
      const tributeReq = getCardTributeRequirement(card);
      const eligibleTributes = tributeReq ? getEligibleTributeSpirits(tributeReq, DuelState.player.field) : [];
      const hasTributeCondition = !tributeReq || (eligibleTributes.length > 0);

      // Ultimate summon condition check
      const ultCheck = isUltimate ? validateUltimateSummonCondition(card, 'player') : { allowed: true };
      const meetsCondition = ultCheck.allowed;

      const canAfford = canPlayStep && hasTributeCondition && meetsCondition && (totalAvailableCores >= totalNeeded);
      const canAffordDirect = canPlayStep && meetsCondition && (reserve >= totalNeeded);
      const needsSacrifice = canAfford && !canAffordDirect;

      let cls = `hand-card-item card-theme-${(card.color || 'red').toLowerCase()}`;
      if (isSelected) cls += ' selected-hand-card';
      if (!canPlayStep) cls += ' cannot-play-step';
      else if (!meetsCondition) cls += ' cannot-play-condition';
      else if (!canAfford) cls += ' cannot-afford';

      let actionBtnHtml = '';
      // Burst can only be set during the MAIN step (or replaced if one is already set)
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isMainStep && isBurstCard;
      // Advent Action Button - ONLY active when step/turn timing requirements are met (Official Rule: Attack Step only, never Main Step)
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = canPerformAdvent(card, 'player');
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';

      const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">${burstBtnLabel}</button>` : '';

      // Mirage Action Button
      const mirageCheck = canSetMirage(card, 'player');
      const mirageBtnHtml = (isMainStep && mirageCheck.allowed) ? `<button class="btn-quick-mirage" style="background:linear-gradient(135deg, #06b6d4, #0891b2); border-color:#22d3ee; margin-top:4px;" onclick="event.stopPropagation(); BattleArena.setMirage('${card.uid}')">?? Set Mirage (${mirageCheck.cost})</button>` : '';

      // Accel Action Button
      const accelCheck = canCastAccel(card, 'player');
      const accelBtnHtml = (canPlayStep && accelCheck.allowed) ? `<button class="btn-quick-accel" style="background:linear-gradient(135deg, #f59e0b, #d97706); border-color:#fbbf24; margin-top:4px;" onclick="event.stopPropagation(); BattleArena.castAccel('${card.uid}')">? Accel (${accelCheck.cost})</button>` : '';

      if (isUltimate && !meetsCondition) {
        actionBtnHtml = `<button class="btn-quick-disabled" disabled title="Summon Condition: ${ultCheck.reason}">🔒 ${ultCheck.reason || 'Summon Condition Not Met'}</button>`;
      } else if (canPlayStep && isBrave && isMainStep) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let braveBtns = '';
        if (canAffordDirect) {
          braveBtns += `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonBraveAsSpirit('${card.uid}')" title="Summon as Spirit (Cost ${cost} + 1 Core)">⚔️ Spirit (${cost})</button>`;
        } else if (needsSacrifice) {
          braveBtns += `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sac (${cost})</button>`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          braveBtns += `<button class="btn-quick-brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${card.uid}', 'hand')" title="Combine with field Spirit (Cost ${cost})">🔗 Brave (${cost})</button>`;
        }
        actionBtnHtml = `<div class="brave-actions-duo">${braveBtns}</div>`;
      } else if (canPlayStep && (isSpirit || isUltimate)) {
        const btnLabel = isAttackStep
          ? (isUltimate ? '⚡ Flash Summon' : '⚡ Flash Summon')
          : (isUltimate ? '⚔️ Summon' : '⚡ Summon');
        const btnStyle = isUltimate ? 'style="background:linear-gradient(135deg, #eab308, #ca8a04); border-color:#fde047;"' : '';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" ${btnStyle} onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sac &amp; ${isAttackStep ? 'Flash Summon' : 'Summon'} (${cost})</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const eff = card.effect || '';
        const hasMainTiming = /\[(?:Main|MAIN)\]|【メイン】/i.test(eff);
        const hasFlashTimingInCard = /\[(?:Flash|FLASH)\]|【フラッシュ】/i.test(eff);

        if (isAttackStep) {
          // Attack Step only permits Flash timing
          if (canAffordDirect) {
            actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}', null, null, 'flash')">⚡ Flash (${cost})</button>`;
          } else if (needsSacrifice) {
            actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}', 'flash')">💀 Sac &amp; Flash (${cost})</button>`;
          }
        } else if (isMainStep && hasMainTiming && hasFlashTimingInCard) {
          // Main Step with both Main and Flash options: render TWO distinct buttons!
          let mainBtn = '';
          let flashBtn = '';
          if (canAffordDirect) {
            mainBtn = `<button class="btn-quick-magic" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8; font-size:0.75rem; padding:4px 6px;" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}', null, null, 'main')">📜 Main (${cost})</button>`;
            flashBtn = `<button class="btn-quick-magic" style="background:linear-gradient(135deg, #f59e0b, #d97706); border-color:#fbbf24; font-size:0.75rem; padding:4px 6px;" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}', null, null, 'flash')">⚡ Flash (${cost})</button>`;
          } else if (needsSacrifice) {
            mainBtn = `<button class="btn-quick-sacrifice" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8; font-size:0.72rem; padding:4px 6px;" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}', 'main')">💀 Main (${cost})</button>`;
            flashBtn = `<button class="btn-quick-sacrifice" style="background:linear-gradient(135deg, #f59e0b, #d97706); border-color:#fbbf24; font-size:0.72rem; padding:4px 6px;" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}', 'flash')">💀 Flash (${cost})</button>`;
          }
          actionBtnHtml = `<div style="display:flex; gap:3px; width:100%; margin-top:3px;">${mainBtn}${flashBtn}</div>`;
        } else {
          // Single timing magic card
          const timingLabel = hasFlashTimingInCard ? `⚡ Flash (${cost})` : `📜 Cast (${cost})`;
          const mode = hasFlashTimingInCard ? 'flash' : 'main';
          if (canAffordDirect) {
            actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}', null, null, '${mode}')">${timingLabel}</button>`;
          } else if (needsSacrifice) {
            actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}', '${mode}')">💀 Sac &amp; Cast (${cost})</button>`;
          }
        }
      } else if (canPlayStep && isNexus && isMainStep) {
        const btnLabel = '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sac &amp; ${btnLabel} (${cost})</button>`;
        }
      }

      const costBadgeHtml = isReduced
        ? `<div class="hc-cost-badge hc-cost-badge-reduced" title="Reduced from ${baseCost} to ${cost} by field symbols">${cost}</div>`
        : `<div class="hc-cost-badge">${baseCost}</div>`;

      const safeCardName = (card.name || '').replace(/'/g, "\\'");
      return `
        <div class="${cls}" onclick="BattleArena.selectHandCard('${card.uid}')">
          <button class="hc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('${safeCardName}', 'hand')" title="View Full Card Details">🔍</button>
          ${costBadgeHtml}
          ${(card.isContractPartner || (DuelState.player && DuelState.player.contractCard && DuelState.player.contractCard.uid === card.uid)) ? `<div class="hc-partner-badge" title="Designated Contract Partner" style="position:absolute;top:6px;left:6px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:0.6rem;font-weight:900;padding:2px 6px;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.6);z-index:3;letter-spacing:0.5px;">🌟 PARTNER</div>` : ''}
          <div class="hc-img-wrap">
            <img src="${card.image_url || FALLBACK_CARD_ART}" alt="${card.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src=FALLBACK_CARD_ART;" />
          </div>
          <div class="hc-info">
            <div class="hc-name">${card.name}</div>
            <div class="hc-type">${card.type} • ${card.color}</div>
          </div>
          ${actionBtnHtml}
          ${adventBtnHtml}${burstBtnHtml}${mirageBtnHtml}${accelBtnHtml}
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

    // 2. Spirits can only be summoned from Hand during Flash timing if they have Swift (神速), Violent High Speed (烈神速), Accel, or an explicit Flash-summon ability
    if (cardType.includes('spirit')) {
      if (eff.includes('swift') || eff.includes('神速') || eff.includes('violent high speed') || eff.includes('烈神速')) return true;
      if (/flash[\s\S]*?(?:you can\s+)?summon this (?:spirit\s+|ultimate\s+|brave\s+)?card from (?:the\s+|your\s+)?hand/i.test(card.effect)) return true;
      if (eff.includes('[accel:') && /flash/i.test(eff)) return true;
      return false;
    }

    // 3. Magic cards have Flash timing if they have [Flash], (Flash), Flash:, or Flash -
    if (cardType === 'magic') {
      return eff.includes('[flash]') || eff.includes('(flash)') || eff.includes('flash:') || eff.includes('flash -');
    }

    // 4. Braves / Ultimates
    if (eff.includes('swift') || eff.includes('神速') || eff.includes('violent high speed') || eff.includes('烈神速')) return true;
    if (/flash[\s\S]*?(?:you can\s+)?summon this (?:spirit\s+|ultimate\s+|brave\s+)?card from (?:the\s+|your\s+)?hand/i.test(card.effect)) return true;
    if (eff.includes('[accel:') && /flash/i.test(eff)) return true;

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

    // 5. Card Name References: Make referenced card names in quotes clickable!
    safe = safe.replace(/(?:&quot;|"|[“”「」])([A-Za-z0-9\s,'\-\.]+?)(?:&quot;|"|[”"」])/gu, (match, cardName) => {
      const trimmed = cardName.trim();
      const exclude = new Set([
        'Ancient Dragon', 'Astral Dragon', 'Ogre Wizard', 'Evil God', 'DemonLord',
        'Hell Contract', 'Purple', 'Red', 'Green', 'White', 'Yellow', 'Blue',
        'Your Turn', "Opponent's Turn", 'Either Attack Step', 'Your Attack Step', "Opponent's Attack Step"
      ]);
      if (exclude.has(trimmed)) return match;
      const isKnownCard = trimmed.startsWith('The ') ||
        (typeof CardEffectsDB !== 'undefined' && CardEffectsDB[trimmed]) ||
        (typeof WasmDB !== 'undefined' && WasmDB.getCardByName && WasmDB.getCardByName(trimmed));
      if (isKnownCard) {
        const safeJs = trimmed.replace(/'/g, "\\'");
        return `"<span class="card-ref-link" onclick="event.stopPropagation(); if (typeof openCardDetail === 'function') openCardDetail('${safeJs}')" style="color:#60a5fa; text-decoration:underline; font-weight:700; cursor:pointer;" title="Click to inspect ${trimmed}">${trimmed}</span>"`;
      }
      return match;
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

    const isBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
    const isUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
    const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');

    const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
    const reductionInfo = calculateSymbolReduction(card, 'player');
    const cost = reductionInfo.effectiveCost;
    const isReduced = cost < baseCost;
    const reductionText = isReduced ? ` [Reduced from ${baseCost}]` : '';
    const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = canPlayCardInCurrentPhase(card);

    const isInspectUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
    const ultCheck = isInspectUltimate ? validateUltimateSummonCondition(card, 'player') : { allowed: true };
    const meetsCondition = ultCheck.allowed;

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && meetsCondition && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && meetsCondition && (available.total >= totalNeeded);

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
    const canSetBurst = isInHand && isPlayerTurn && isMainStep && isBurstCard;
    const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
    const burstBtnHtml = canSetBurst ? `
      <button class="btn-inspector-action btn-inspect-burst" onclick="BattleArena.setBurst('${card.uid}')">
        ${burstBtnLabel}
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
      const isInspectBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isInspectSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isInspectBrave && !isInspectUltimate;
      const isInspectUnit = isInspectSpirit || isInspectUltimate;
      if (isInspectUltimate && !meetsCondition) {
        actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Summon Condition: ${ultCheck.reason}">🔒 ${ultCheck.reason || 'Summon Condition Not Met'}</button>`;
      } else if (canPlayStep && isInspectBrave) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let bBtns = '';
        if (canAffordDirect) {
          bBtns += `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonBraveAsSpirit('${card.uid}')">⚔️ Summon as Spirit (Cost ${cost} + 1 Core)</button>`;
        } else if (canAffordWithSacrifice) {
          bBtns += `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon</button>`;
        } else {
          bBtns += `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          bBtns += `<button class="btn-inspector-action btn-inspect-brave" onclick="BattleArena.openBraveCombineModal('${card.uid}', 'hand')">🔗 Brave onto Spirit (Cost ${cost})</button>`;
        }
        actionBtnHtml = bBtns;
      } else if (canPlayStep && isInspectUnit) {
        const btnText = (phase === 'ATTACK')
          ? `⚡ Flash Summon (${cost})`
          : (isInspectUltimate ? `⚔️ Summon Ultimate (Cost ${cost})` : `⚡ Summon Spirit (Cost ${cost})`);
        const btnStyle = isInspectUltimate ? 'style="background:linear-gradient(135deg, #eab308, #ca8a04); border-color:#fde047;"' : '';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" ${btnStyle} onclick="BattleArena.summonCard('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const eff = card.effect || '';
        const hasMain = /\[(?:Main|MAIN)\]|【メイン】/i.test(eff);
        const hasFlash = /\[(?:Flash|FLASH)\]|【フラッシュ】/i.test(eff);

        if (phase === 'ATTACK') {
          if (canAffordDirect) {
            actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" style="background:linear-gradient(135deg, #f59e0b, #d97706); border-color:#fbbf24;" onclick="BattleArena.castMagic('${card.uid}', null, null, 'flash')">⚡ Flash Cast (${cost})</button>`;
          } else if (canAffordWithSacrifice) {
            actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}', 'flash')">💀 Sacrifice &amp; Flash (${cost})</button>`;
          } else {
            actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
          }
        } else if (isMainStep && hasMain && hasFlash) {
          let mainBtn = canAffordDirect
            ? `<button class="btn-inspector-action btn-inspect-magic" style="flex:1; background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="BattleArena.castMagic('${card.uid}', null, null, 'main')">📜 Cast Main (${cost})</button>`
            : (canAffordWithSacrifice ? `<button class="btn-inspector-action btn-inspect-sac" style="flex:1;" onclick="BattleArena.openSacrificeModal('${card.uid}', 'main')">💀 Main (${cost})</button>` : `<button class="btn-inspector-action btn-inspect-disabled" disabled style="flex:1;">Need ${cost}c</button>`);
          let flashBtn = canAffordDirect
            ? `<button class="btn-inspector-action btn-inspect-magic" style="flex:1; background:linear-gradient(135deg, #f59e0b, #d97706); border-color:#fbbf24;" onclick="BattleArena.castMagic('${card.uid}', null, null, 'flash')">⚡ Flash Cast (${cost})</button>`
            : (canAffordWithSacrifice ? `<button class="btn-inspector-action btn-inspect-sac" style="flex:1;" onclick="BattleArena.openSacrificeModal('${card.uid}', 'flash')">💀 Flash (${cost})</button>` : `<button class="btn-inspector-action btn-inspect-disabled" disabled style="flex:1;">Need ${cost}c</button>`);
          actionBtnHtml = `<div style="display:flex; gap:6px; width:100%;">${mainBtn}${flashBtn}</div>`;
        } else {
          const mode = hasFlash ? 'flash' : 'main';
          const btnText = hasFlash ? `⚡ Flash Cast (${cost})` : `📜 Cast Magic (${cost})`;
          if (canAffordDirect) {
            actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}', null, null, '${mode}')">${btnText}</button>`;
          } else if (canAffordWithSacrifice) {
            actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}', '${mode}')">💀 Sacrifice &amp; Cast (${cost})</button>`;
          } else {
            actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
          }
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
      let braveInspectorBtn = '';
      if (isPlayerSpirit && isMainStep) {
        if (card.brave) {
          braveInspectorBtn = `<button class="btn-inspector-action btn-inspect-debrave" onclick="BattleArena.separateBrave('${card.uid}')">🔄 Separate Brave (${card.brave.name})</button>`;
        } else if (card.type === 'Brave' || card.isBraveCard) {
          braveInspectorBtn = `<button class="btn-inspector-action btn-inspect-brave" onclick="BattleArena.openBraveCombineModal('${card.uid}', 'field')">🔗 Combine Brave onto Spirit</button>`;
        }
      }
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
          ${card.brave ? ` • <span style="color:#c084fc;font-weight:800;">🔗 BRAVED (+${card.brave.bpBonus || 1000} BP)</span>` : ''}
        </div>
        ${braveInspectorBtn}
        ${scBtn}
      `;
    }

    const cardColor = (card.color || 'Red').toLowerCase();

    inspectorEl.innerHTML = `
      <div class="inspector-card-view card-theme-${cardColor}">
        <!-- Left: Card Artwork Thumbnail & Enlarge -->
        <div class="inspector-art-col">
          <div class="inspector-art-wrap">
            <img src="${card.image_url || FALLBACK_CARD_ART}" alt="${card.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src=FALLBACK_CARD_ART;" />
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
    const rawBlocks = cardEffect.split(/(?=\n\s*(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?(?:\[LV\d+\]|LV\d+))/i);
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

  function extractMagicTimingBlock(effectText, phase, mode = 'hand', forcedEffectType = null) {
    if (!effectText || typeof effectText !== 'string') return '';
    const text = effectText.trim();

    if (forcedEffectType === 'main') {
      const mMatch = text.match(/\[(?:Main|MAIN)\]([\s\S]*?)(?=\[(?:Flash|FLASH)\]|$)/i);
      if (mMatch) return mMatch[1].trim();
    } else if (forcedEffectType === 'flash') {
      const fMatch = text.match(/\[(?:Flash|FLASH)\]([\s\S]*?)$/i);
      if (fMatch) return fMatch[1].trim();
    }

    if (mode === 'burst') {
      const burstMatch = text.match(/(\[(?:Burst|BURST)[^\]]*\][\s\S]*?)(?=\[(?:Main|MAIN|Flash|FLASH)\]|$)/i);
      if (burstMatch) return burstMatch[1].trim();
      const bAltMatch = text.match(/((?:Burst|BURST):[\s\S]*?)(?=\[(?:Main|MAIN|Flash|FLASH)\]|$)/i);
      if (bAltMatch) return bAltMatch[1].trim();
      return text;
    }

    // mode === 'hand'
    let nonBurst = text.replace(/\[(?:Burst|BURST)[^\]]*\][\s\S]*?(?=\[(?:Main|MAIN|Flash|FLASH)\])/gi, '').trim();
    if (nonBurst.startsWith('[Burst') || nonBurst.startsWith('[BURST')) {
      nonBurst = nonBurst.replace(/^\[(?:Burst|BURST)[^\]]*\][^\n]*\n?/i, '').trim();
    }

    const hasMain = /\[(?:Main|MAIN)\]/i.test(nonBurst);
    const hasFlash = /\[(?:Flash|FLASH)\]/i.test(nonBurst);

    if (phase === 'MAIN') {
      if (hasMain) {
        const mMatch = nonBurst.match(/\[(?:Main|MAIN)\]([\s\S]*?)(?=\[(?:Flash|FLASH)\]|$)/i);
        return mMatch ? mMatch[1].trim() : nonBurst;
      }
      if (hasFlash) {
        const fMatch = nonBurst.match(/\[(?:Flash|FLASH)\]([\s\S]*?)$/i);
        return fMatch ? fMatch[1].trim() : nonBurst;
      }
      return nonBurst;
    }

    // phase === 'ATTACK' (Flash)
    if (hasFlash) {
      const fMatch = nonBurst.match(/\[(?:Flash|FLASH)\]([\s\S]*?)$/i);
      return fMatch ? fMatch[1].trim() : nonBurst;
    }

    return nonBurst;
  }

  // ── UNIVERSAL CARD ABILITY DISPATCHER ──
  // Resolves core abilities across all 14,500+ cards for all triggers: SUMMON, ATTACK, BLOCK, DESTROYED, ADVENT, MAGIC
  function executeAbilityActions(bodyText, card, side = 'player', triggerName = 'SUMMON', context = {}) {
    if (!bodyText || !card) return;
    const bodyLower = bodyText.toLowerCase();

    // STRICT LEVEL CHECK: If ability block explicitly requires a level higher than current, DO NOT execute!
    const lvlMatch = bodyText.match(/(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
    if (lvlMatch && lvlMatch[1]) {
      const curLvl = card.currentLevel || 1;
      if (!isEffectLevelMet(lvlMatch[1], curLvl)) {
        return;
      }
    }

    // STRICT BRAVE GATING: [When Braved], [During Brave], or 合体時 abilities are strictly inactive unless the card is Braved!
    const isBraveAbility = /\[(?:when|during)\s+braved?\]|合体時|合体中/i.test(bodyText);
    if (isBraveAbility && !card.isBraved && !card.brave) {
      return;
    }

    // TIMING RESTRICTION: (When Attacks) or (When Brave Attacks) can NEVER trigger on SUMMON or MAGIC!
    if (/\(When (?:Brave )?Attacks(?:\/[^)]+)?\)/i.test(bodyText)) {
      const isBlocksTrigger = /\(When [^)]*Blocks[^)]*\)/i.test(bodyText);
      const isBpDestruction = /destroyed by comparing BP|BPを比べ/i.test(bodyText);
      if (isBlocksTrigger && triggerName === 'BLOCK') {
        // Allowed during BLOCK step
      } else if (!isBpDestruction && triggerName !== 'ATTACK') {
        return;
      } else if (isBpDestruction && triggerName !== 'ATTACK' && triggerName !== 'BP_DESTRUCTION' && triggerName !== 'DESTROY') {
        return;
      }
    }

    // DESTRUCTION RESTRICTION: (When Destroyed) or "destroyed by comparing BP" can NEVER trigger on SUMMON or MAGIC!
    if (/(?:When (?:only )?this (?:Spirit|Ultimate|Brave) is destroyed|\(When Destroyed(?:\/[^)]+)?\))/i.test(bodyText) && !triggerName.startsWith('DESTROY') && triggerName !== 'BP_DESTRUCTION') {
      return;
    }
    if (!context.__confirmed) markLegacyHandled(card, bodyLower);
    if (side === 'player' && !context.__confirmed && !context.__noPrompt && isOptionalEffectText(bodyText) &&
        typeof document !== 'undefined' && document.body) {
      askOptionalEffect(card, bodyText.replace(/\[[^\]]*\]|\([^)]*\)/g, ' '), () => {
        executeAbilityActions(bodyText, card, side, triggerName, Object.assign({}, context, { __confirmed: true }));
      }, null);
      return;
    }
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
    // 4A2. CUMULATIVE COST DESTRUCTION (e.g. The SacredEmperor Siegfrieden XV, BS66-XV02)
    // "Once per turn, ignoring the cost of Braves, you can destroy any number of opposing Spirits/Ultimates/Nexuses up to a total cost of 9"
    // "Destroy any number of opposing Spirits up to a total of cost 5"
    else if (
      /destroy\s+(?:any number of\s+)?opposing\s+(?:(?:spirits?\/ultimates?\/nexuses?|spirits?\/ultimates?|spirits?|ultimates?|nexuses?)\s+)?up to a total\s+(?:of\s+)?(?:cost\s+)?(\d+)/i.test(bodyLower) ||
      /destroy any number of opposing (?:spirits|ultimates|nexuses|spirits\/ultimates|spirits\/ultimates\/nexuses) up to a total cost of (\d+)/i.test(bodyLower) ||
      /destroy any number of opposing (?:spirits|ultimates|nexuses|spirits\/ultimates|spirits\/ultimates\/nexuses) up to a total of cost (\d+)/i.test(bodyLower)
    ) {
      const match = bodyLower.match(/up to a total\s+(?:of\s+)?(?:cost\s+)?(\d+)/i) ||
                    bodyLower.match(/up to a total cost of (\d+)/i) ||
                    bodyLower.match(/up to a total of cost (\d+)/i);
      const budgetCost = match ? parseInt(match[1], 10) : 9;

      const includesNexus = bodyLower.includes('nexus') || bodyLower.includes('nexuses');
      const enemyUnits = enemyField.map(s => ({ item: s, kind: 'spirit', cost: s.cost || 0 }));
      const enemyNexuses = includesNexus ? (enemyReserve.nexus || []).map(n => ({ item: n, kind: 'nexus', cost: n.cost || 0 })) : [];
      const allCandidates = [...enemyUnits, ...enemyNexuses].filter(c => c.cost <= budgetCost);

      if (!allCandidates.length) {
        addLog(`ℹ️ **[${card.name}]**: No opposing Spirits${includesNexus ? '/Ultimates/Nexuses' : ''} with Cost ≤ ${budgetCost} to destroy.`, 'info');
      } else if (isPlayer && typeof document !== 'undefined' && document.body) {
        promptCumulativeCostTargetModal(card, side, allCandidates, budgetCost, (selectedItems) => {
          if (!selectedItems || !selectedItems.length) return;
          const destroyedNames = [];
          for (const cand of selectedItems) {
            if (cand.kind === 'nexus') {
              const nIdx = (enemyReserve.nexus || []).findIndex(n => n.uid === cand.item.uid);
              if (nIdx !== -1) {
                const popped = enemyReserve.nexus.splice(nIdx, 1)[0];
                enemyReserve.reserve = (enemyReserve.reserve || 0) + (popped.currentCores || 0);
                sendToTrash(popped, enemySide, `Destroyed by ${card.name} (Total Cost ≤ ${budgetCost})`);
                destroyedNames.push(`"${popped.name}" (Nexus Cost ${cand.cost})`);
              }
            } else {
              const sIdx = enemyField.findIndex(s => s.uid === cand.item.uid);
              if (sIdx !== -1) {
                const popped = enemyField.splice(sIdx, 1)[0];
                enemyReserve.reserve = (enemyReserve.reserve || 0) + (popped.currentCores || 0);
                handleDestroyedSpiritCores(popped, enemySide);
                sendToTrash(popped, enemySide, `Destroyed by ${card.name} (Total Cost ≤ ${budgetCost})`);
                destroyedNames.push(`"${popped.name}" (Cost ${cand.cost})`);
              }
            }
          }
          if (destroyedNames.length > 0) {
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Destroyed ${destroyedNames.join(', ')} (Total Cost limit: ${budgetCost})! Cores returned to enemy reserve.`, 'kill');
            if (typeof showToast === 'function') showToast(`Destroyed ${destroyedNames.length} target(s) (Cost ≤ ${budgetCost})!`, 'success');
            renderDuelTable();
          }
        });
      } else {
        // AI greedy resolution: destroy highest cost eligible targets within budget
        allCandidates.sort((a, b) => b.cost - a.cost);
        let remBudget = budgetCost;
        const destroyedNames = [];
        for (const cand of allCandidates) {
          if (cand.cost <= remBudget) {
            remBudget -= cand.cost;
            if (cand.kind === 'nexus') {
              const nIdx = (enemyReserve.nexus || []).findIndex(n => n.uid === cand.item.uid);
              if (nIdx !== -1) {
                const popped = enemyReserve.nexus.splice(nIdx, 1)[0];
                enemyReserve.reserve = (enemyReserve.reserve || 0) + (popped.currentCores || 0);
                sendToTrash(popped, enemySide, `Destroyed by ${card.name} (Total Cost ≤ ${budgetCost})`);
                destroyedNames.push(`"${popped.name}" (Nexus Cost ${cand.cost})`);
              }
            } else {
              const sIdx = enemyField.findIndex(s => s.uid === cand.item.uid);
              if (sIdx !== -1) {
                const popped = enemyField.splice(sIdx, 1)[0];
                enemyReserve.reserve = (enemyReserve.reserve || 0) + (popped.currentCores || 0);
                handleDestroyedSpiritCores(popped, enemySide);
                sendToTrash(popped, enemySide, `Destroyed by ${card.name} (Total Cost ≤ ${budgetCost})`);
                destroyedNames.push(`"${popped.name}" (Cost ${cand.cost})`);
              }
            }
          }
        }
        if (destroyedNames.length > 0) {
          AudioFX.destroy();
          addLog(`💥 **[${card.name}]**: Destroyed ${destroyedNames.join(', ')} (Total Cost limit: ${budgetCost})! Cores returned to enemy reserve.`, 'kill');
          renderDuelTable();
        }
      }
    }
    // 4A. CUMULATIVE BP DESTRUCTION (e.g. Evil Flame Flash effect)
    else if (/destroy any number of opposing (?:spirits|ultimates|spirits\/ultimates) up to a total of (\d+)\s*bp/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy any number of opposing (?:spirits|ultimates|spirits\/ultimates) up to a total of (\d+)\s*bp/i);
      let budget = parseInt(match[1], 10);
      const insteadMatch = bodyLower.match(/if you control no spirits,\s*instead,\s*destroy any number of opposing (?:spirits|ultimates|spirits\/ultimates) up to a total of (\d+)\s*bp/i);
      const friendlySpiritCount = myField.filter(s => s.type === 'Spirit' || (s.type || '').includes('Spirit')).length;
      if (insteadMatch && friendlySpiritCount === 0) {
        budget = parseInt(insteadMatch[1], 10);
      }
      let remainingBp = budget;
      const destroyedList = [];
      const candidates = [...enemyField].filter(s => (s.currentBp || 0) <= remainingBp).sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
      for (const candidate of candidates) {
        const bp = candidate.currentBp || 0;
        if (bp <= remainingBp) {
          const tIdx = enemyField.findIndex(s => s.uid === candidate.uid);
          if (tIdx !== -1) {
            const dest = enemyField.splice(tIdx, 1)[0];
            remainingBp -= bp;
            enemyReserve.reserve += dest.currentCores;
            handleDestroyedSpiritCores(dest, enemySide);
            sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName} - Cumulative ${budget} BP)`);
            destroyedList.push(`"${dest.name}" (${bp} BP)`);
          }
        }
      }
      AudioFX.slash();
      const usedBp = budget - remainingBp;
      if (destroyedList.length > 0) {
        addLog(`💥 **[${card.name}]**: Destroyed ${destroyedList.join(', ')} (Total ${usedBp}/${budget} BP)! Cores returned to enemy reserve.`, 'kill');
        if (typeof showToast === 'function') showToast(`Destroyed ${destroyedList.length} spirit(s) (${usedBp}/${budget} BP)!`, 'success');
      } else {
        addLog(`ℹ️ **[${card.name}]**: No opposing Spirits within the ${budget} BP limit to destroy.`, 'info');
      }
    }
    // 4B. ONE-SYMBOL DESTRUCTION (e.g. Evil Flame Burst effect)
    else if (/destroy\s+(a|an|one|two|three|\d+)\s+opposing\s+one-symbol\s+(?:spirits|ultimates|spirits\/ultimates)/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\s+(a|an|one|two|three|\d+)\s+opposing\s+one-symbol\s+(?:spirits|ultimates|spirits\/ultimates)/i);
      const count = parseWordNumber(match[1], 1);
      const eligible = enemyField.filter(s => (s.symbol === undefined || s.symbol === null || s.symbol === 1 || (typeof s.symbol === 'number' && s.symbol === 1)));
      eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
      const toDestroy = eligible.slice(0, count);
      const destroyedList = [];
      for (const target of toDestroy) {
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) {
          const dest = enemyField.splice(tIdx, 1)[0];
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName} - One-Symbol)`);
          destroyedList.push(`"${dest.name}" (${dest.currentBp} BP)`);
        }
      }
      if (destroyedList.length > 0) {
        AudioFX.slash();
        addLog(`💀 **[SYMBOL DESTRUCTION: ${card.name}]**: Destroyed opposing one-symbol ${destroyedList.join(', ')}! Cores returned to enemy reserve.`, 'kill');
        if (typeof showToast === 'function') showToast(`Destroyed ${destroyedList.length} one-symbol Spirit(s)!`, 'success');
      }
    }
    // 4C. DESTROY OPPOSING SPIRIT BY BP (Broadened regex)
    else if (/destroy\s+(?:up\s+to\s+)?(an?|one|two|three|\d+)?\s*opposing\s+(?:(?:(?:spirits?\/ultimates?|spirits?|ultimates?)\s+(?:with\s+)?(\d+)\s*bp\s+or\s+less)|(?:(\d+)\s*bp\s+or\s+less\s+(?:spirits?\/ultimates?|spirits?|ultimates?)))/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\s+(?:up\s+to\s+)?(an?|one|two|three|\d+)?\s*opposing\s+(?:(?:(?:spirits?\/ultimates?|spirits?|ultimates?)\s+(?:with\s+)?(\d+)\s*bp\s+or\s+less)|(?:(\d+)\s*bp\s+or\s+less\s+(?:spirits?\/ultimates?|spirits?|ultimates?)))/i);
      const count = match[1] ? parseWordNumber(match[1], 1) : 1;
      const maxBp = parseInt(match[2] || match[3], 10);
      const eligible = enemyField.filter(s => (s.currentBp || 0) <= maxBp);
      if (eligible.length > 0) {
        if (side === 'player' && typeof promptUniversalTargetModal === 'function') {
          promptUniversalTargetModal({
            card,
            side: 'player',
            targetSide: enemySide,
            targetKind: 'spirit',
            title: `${card.name}: Destroy Spirit/Ultimate`,
            description: `Select up to ${count} opposing Spirit(s)/Ultimate(s) with ${maxBp} BP or less to destroy:`,
            filter: s => (s.currentBp || s.battleBp || 0) <= maxBp,
            minCount: 1,
            maxCount: count,
            allowSkip: false
          }, (selectedSpirits) => {
            if (!selectedSpirits || !selectedSpirits.length) return;
            const destroyedList = [];
            for (const dest of selectedSpirits) {
              const tIdx = enemyField.findIndex(s => s.uid === dest.uid);
              if (tIdx !== -1) {
                enemyField.splice(tIdx, 1);
                enemyReserve.reserve += (dest.currentCores || 0);
                handleDestroyedSpiritCores(dest, enemySide);
                sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
                destroyedList.push(`"${dest.name}" (${dest.currentBp} BP)`);
              }
            }
            if (destroyedList.length > 0) {
              AudioFX.slash();
              addLog(`💀 **[BP DESTRUCTION: ${card.name}]**: Destroyed opposing ${destroyedList.join(', ')} (≤ ${maxBp} BP)! Cores returned to enemy reserve.`, 'kill');
              if (typeof showToast === 'function') showToast(`Destroyed ${destroyedList.length} spirit(s) (≤ ${maxBp} BP)!`, 'success');
              renderDuelTable();
            }
          });
        } else {
          eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
          const toDestroy = eligible.slice(0, count);
          const destroyedList = [];
          for (const dest of toDestroy) {
            const tIdx = enemyField.findIndex(s => s.uid === dest.uid);
            if (tIdx !== -1) {
              enemyField.splice(tIdx, 1);
              enemyReserve.reserve += (dest.currentCores || 0);
              handleDestroyedSpiritCores(dest, enemySide);
              sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
              destroyedList.push(`"${dest.name}" (${dest.currentBp} BP)`);
            }
          }
          if (destroyedList.length > 0) {
            AudioFX.slash();
            addLog(`💀 **[BP DESTRUCTION: ${card.name}]**: Destroyed opposing ${destroyedList.join(', ')} (≤ ${maxBp} BP)! Cores returned to enemy reserve.`, 'kill');
            renderDuelTable();
          }
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

    if (/send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:an|any|one|\d+)?\s*opposing\s+(?:spirit|ultimate|nexus).*?to\s+(?:the\s+|their\s+)?(reserve|trash)/i.test(bodyLower) && !/\bby\s+sending\b/i.test(bodyLower)) {
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
    if (/draw\s+(a|an|one|two|three|\d+)\s+cards?/i.test(bodyLower) && !isConditionalLegacyDrawText(bodyLower)) {
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
        if (side === 'player') {
          renderPlayerHand();
          renderDuelTable();
        }
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

        // 28. COUNTERS / COUNT INCREMENT (e.g. your counter +1, your counters +2, カウント+)
    if (/your counter(?:s)?\s*\+(\d+)|your count\s*\+(\d+)|カウント\+(\d+)/i.test(bodyLower)) {
      const match = bodyLower.match(/your counter(?:s)?\s*\+(\d+)|your count\s*\+(\d+)|カウント\+(\d+)/i);
      const amt = match ? parseInt(match[1] || match[2] || match[3], 10) : 1;
      const friendlyState = isPlayer ? DuelState.player : DuelState.opponent;
      friendlyState.counters = (friendlyState.counters || 0) + amt;
      AudioFX.coreChime();
      addLog(`💠 **[${card.name}]**: Count +${amt}! (Total Count: ${friendlyState.counters})`, 'step');
      renderDuelTable();
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

    function hasWhenSummonedEffect(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect;
    if (!/\(When (?:[^)]*\/)?Summoned(?:\/[^)]*)?\)/i.test(eff) && !/召喚時/i.test(eff)) {
      return false;
    }
    const blocks = getCardAbilityBlocks(eff);
    const eligibleBlocks = blocks.filter(b => /\(When (?:[^)]*\/)?Summoned(?:\/[^)]*)?\)/i.test(b) || /召喚時/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (!levelTag || isEffectLevelMet(levelTag, spirit.currentLevel)) {
        return true;
      }
    }
    return false;
  }

  function executeWhenSummonedEffects(spirit, side = 'player') {
    // The Hellwind Searcher Kagerou-Seeker (BS38-CP05) / Soul Core Searcher:
    if (/Kagerou-Seeker/i.test(spirit.name || '') || /If \[Soul Core\] was used to pay the summon cost, reveal three cards from your decktop/i.test(spirit.effect || '')) {
      if (spirit.usedSoulCore || spirit.paidWithSoulCore) {
        const friendlyDeck = DuelState[side].deck || [];
        const revealCount = Math.min(3, friendlyDeck.length);
        if (revealCount > 0) {
          const revealed = friendlyDeck.splice(0, revealCount);
          addLog(`🎴 **[KAGEROU-SEEKER: When Summoned]**: Revealed ${revealCount} cards: ${revealed.map(c => `"${c.name}"`).join(', ')}!`, 'magic');
          const ultIdx = revealed.findIndex(c => (c.type || '').includes('Ultimate'));
          if (ultIdx !== -1) {
            const chosenUlt = revealed.splice(ultIdx, 1)[0];
            DuelState[side].hand.push(chosenUlt);
            addLog(`✨ **[KAGEROU-SEEKER]**: Added Ultimate card "${chosenUlt.name}" to Hand!`, 'step');
          } else {
            addLog(`ℹ️ **[KAGEROU-SEEKER]**: No Ultimate cards found among revealed cards.`, 'info');
          }
          // Discard remaining revealed cards to Trash
          for (const rem of revealed) {
            sendToTrash(rem, side, 'Discarded by Kagerou-Seeker');
          }
          renderDuelTable();
          if (side === 'player') renderPlayerHand();
        }
      } else {
        addLog(`ℹ️ **[Kagerou-Seeker]**: Soul Core was not used for summon payment; search effect does not trigger.`, 'info');
      }
    }

    // Birgoyle (SD36-001) branch choice: Destroy 5000 BP spirit OR put core from Void
    if ((spirit.name || '').includes('Birgoyle') && /Destroy an opposing 5000 BP or less Spirit\. Or, put a core from the Void/i.test(spirit.effect || '')) {
      if (side === 'player') {
        promptChoiceModal({
          card: spirit,
          side: 'player',
          title: 'Birgoyle: (When Summoned) Choice',
          description: 'Select which effect to activate:',
          choices: [
            { icon: '💀', label: 'Destroy Opposing Spirit (≤ 5000 BP)', desc: 'Choose an opposing Spirit with 5000 BP or less to destroy' },
            { icon: '🔮', label: 'Put Core from Void to this Ultimate', desc: 'Place 1 core from Void onto Birgoyle' }
          ]
        }, (choiceIdx) => {
          if (choiceIdx === 0) {
            promptUniversalTargetModal({
              card: spirit,
              side: 'player',
              targetSide: 'opponent',
              targetKind: 'spirit',
              title: 'Birgoyle: Destroy Spirit',
              description: 'Select an opposing Spirit with 5000 BP or less to destroy:',
              filter: s => (s.battleBp || s.currentBp || 0) <= 5000,
              minCount: 1,
              maxCount: 1,
              allowSkip: false
            }, (selectedSpirits) => {
              if (selectedSpirits && selectedSpirits.length > 0) {
                const target = selectedSpirits[0];
                const oppField = DuelState.opponent.field || [];
                const sIdx = oppField.findIndex(s => s.uid === target.uid);
                if (sIdx !== -1) {
                  const dest = oppField.splice(sIdx, 1)[0];
                  DuelState.opponent.reserve = (DuelState.opponent.reserve || 0) + (dest.currentCores || 0);
                  handleDestroyedSpiritCores(dest, 'opponent');
                  sendToTrash(dest, 'opponent', `Destroyed by Birgoyle (When Summoned)`);
                  AudioFX.destroy();
                  addLog(`💀 **[BP DESTRUCTION: Birgoyle]**: Destroyed opposing "${dest.name}" (${dest.currentBp} BP ≤ 5000 BP)! Cores returned to opponent reserve.`, 'kill');
                  renderDuelTable();
                }
              } else {
                addLog(`ℹ️ **[Birgoyle]**: No opposing Spirit ≤ 5000 BP destroyed.`, 'info');
              }
            });
          } else {
            spirit.currentCores = (spirit.currentCores || 0) + 1;
            recalculateSpiritBp(spirit);
            AudioFX.coreChime();
            addLog(`🔮 **[CORE BOOST: Birgoyle]**: Put 1 core from Void onto "${spirit.name}"!`, 'magic');
            renderDuelTable();
          }
        });
        return;
      } else {
        // Opponent AI choice
        const victims = (DuelState.player.field || []).filter(s => (s.battleBp || s.currentBp || 0) <= 5000);
        if (victims.length > 0) {
          victims.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
          const dest = victims[0];
          const pIdx = DuelState.player.field.findIndex(s => s.uid === dest.uid);
          if (pIdx !== -1) {
            DuelState.player.field.splice(pIdx, 1);
            DuelState.player.reserve = (DuelState.player.reserve || 0) + (dest.currentCores || 0);
            handleDestroyedSpiritCores(dest, 'player');
            sendToTrash(dest, 'player', `Destroyed by Birgoyle (When Summoned)`);
            AudioFX.destroy();
            addLog(`💀 **[OPPONENT BIRGOYLE]**: Destroyed your "${dest.name}" (${dest.currentBp} BP ≤ 5000 BP)!`, 'kill');
            renderDuelTable();
          }
        } else {
          spirit.currentCores = (spirit.currentCores || 0) + 1;
          recalculateSpiritBp(spirit);
          addLog(`🔮 **[OPPONENT BIRGOYLE]**: Put 1 core from Void onto "${spirit.name}"!`, 'magic');
          renderDuelTable();
        }
        return;
      }
    }

    if (!spirit) return;

    if (spirit.effect) {
      const blocks = getCardAbilityBlocks(spirit.effect);
      const eligibleBlocks = blocks.filter(b => /\(When Summoned(?:[^)]*)\)|\(When [^)]*\/Summoned(?:[^)]*)\)|\(When Summoned\/[^\)]*\)/i.test(b));
      for (const b of eligibleBlocks) {
        const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
        const levelTag = lvlMatch ? lvlMatch[1] : '';
        if (isEffectLevelMet(levelTag, spirit.currentLevel)) {
          executeAbilityActions(b, spirit, side, 'SUMMON');
        }
      }
    }
    executeUniversalCardEffect(spirit, side, 'WHEN_SUMMONED');

    // Allied Field triggers on summon (e.g. Shugraus):
    const myField = side === 'player' ? DuelState.player.field : DuelState.opponent.field;
    const oppField = side === 'player' ? DuelState.opponent.field : DuelState.player.field;
    const oppTarget = side === 'player' ? DuelState.opponent : DuelState.player;
    for (const ally of myField) {
      if (!ally || ally.uid === spirit.uid) continue;
      const allyEff = (ally.effect || '').toLowerCase();
      const isMakaiSummoned = (spirit.name || '').toLowerCase().includes('makai') || (spirit.family || '').toLowerCase().includes('makai');
      if (isMakaiSummoned && ((ally.name || '').includes('Shugraus') || (allyEff.includes('when your "makai"-named spirits') && allyEff.includes('other than this spirit')))) {
        const targets = oppField.filter(s => s && (s.currentCores || 0) > 0);
        if (targets.length > 0) {
          const oppSp = targets[0];
          oppSp.currentCores -= 1;
          oppTarget.reserve = (oppTarget.reserve || 0) + 1;
          recalculateSpiritBp(oppSp);
          AudioFX.coreChime();
          addLog(`🔮 **[${ally.name}]**: Sent 1 core from opposing "${oppSp.name}" to their Reserve upon summoning "${spirit.name}"!`, 'magic');
          if (oppSp.currentCores <= 0) {
            addLog(`💀 "${oppSp.name}" was depleted to 0 Cores by ${ally.name}!`, 'destroy');
            sendToTrash(oppSp, side === 'player' ? 'opponent' : 'player', `Depleted by ${ally.name}`);
            const oppIdx = oppField.indexOf(oppSp);
            if (oppIdx !== -1) oppField.splice(oppIdx, 1);
          }
        } else {
          addLog(`🔮 **[${ally.name}]**: Triggered upon summoning "${spirit.name}", but opponent controls no Spirits with cores!`, 'info');
        }
      }
    }


    renderDuelTable();
    if (side === 'player') renderPlayerHand();

    const enemySide = side === 'player' ? 'opponent' : 'player';
    if (hasWhenSummonedEffect(spirit)) { checkBurstTrigger(enemySide, "AFTER_OPPONENT_SUMMON_EFFECT", { spirit }); }
    const sideNexuses = (side === 'player' ? DuelState.player.nexus : DuelState.opponent.nexus) || [];
    for (const n of sideNexuses) {
      executeCoreCharge(n, side, 'SUMMON', { spirit });
    }
  }

  function executeWhenAttacksEffects(attacker, side = 'player') {
    // The Four Towers of Limbo trigger on Evil God Ultimate attack:
    const attackingSideNexuses = (side === 'player' ? DuelState.player.nexus : DuelState.opponent.nexus) || [];
    const limbo = attackingSideNexuses.find(n => (n.name || '').includes('Four Towers of Limbo'));
    const isEvilGodAttacker = ((attacker.family || '') + ' ' + (attacker.families ? attacker.families.join(' ') : '')).toLowerCase().includes('evil god');
    const isAttackerUlt = attacker.type === 'Ultimate' || (attacker.type || '').includes('Ultimate');
    if (limbo && isEvilGodAttacker && isAttackerUlt) {
      const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
      friendlyState.counters = (friendlyState.counters || 0) + 1;
      addLog(`💠 **[The Four Towers of Limbo]**: Count +1 upon "${attacker.name}" attack! (Total Count: ${friendlyState.counters})`, 'step');
      if (side === 'player') {
        promptChoiceModal({
          card: limbo,
          side: 'player',
          title: 'The Four Towers of Limbo: Choose Effect',
          description: 'Once per turn, choose one of the following:',
          choices: [
            { icon: '🎴', label: 'Draw a Card', desc: 'Draw 1 card from your deck' },
            { icon: '🔮', label: `Core Boost to "${attacker.name}"`, desc: `Put 1 core from Void onto "${attacker.name}"` }
          ]
        }, (choiceIdx) => {
          if (choiceIdx === 0) {
            const drawn = DuelState.player.deck.shift();
            if (drawn) {
              DuelState.player.hand.push(drawn);
              AudioFX.magic();
              addLog(`🎴 **[The Four Towers of Limbo]**: Drew "${drawn.name}"!`, 'magic');
              renderPlayerHand();
            }
          } else {
            attacker.currentCores = (attacker.currentCores || 0) + 1;
            recalculateSpiritBp(attacker);
            AudioFX.coreChime();
            addLog(`🔮 **[The Four Towers of Limbo]**: Put 1 core from Void onto "${attacker.name}"!`, 'magic');
            renderDuelTable();
          }
        });
      } else {
        const drawn = DuelState.opponent.deck.shift();
        if (drawn) DuelState.opponent.hand.push(drawn);
      }
    }

    if (!attacker || !attacker.effect) return;

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

    // 3. Ability blocks (run BEFORE executeUniversalCardEffect so markLegacyHandled prevents duplicate execution!)
    const blocks = getCardAbilityBlocks(attacker.effect);
    const eligibleBlocks = blocks.filter(b => /\(When Attacks(?:[^)]*)\)|\(When [^)]*\/Attacks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)|\(When Brave Attacks(?:[^)]*)\)/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/(?:(?:^\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, attacker.currentLevel)) {
        executeAbilityActions(b, attacker, side, 'ATTACK');
      }
    }

    executeUniversalCardEffect(attacker, side, 'WHEN_ATTACKS');
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
      const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
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
      const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, destroyedSpirit.currentLevel)) {
        executeAbilityActions(b, destroyedSpirit, side, 'DESTROYED');
      }
    }
    executeUniversalCardEffect(destroyedSpirit, side, 'WHEN_DESTROYED');
    renderDuelTable();
  }

    function isViolentHighSpeedCard(card) {
    if (!card || !card.effect) return false;
    const eff = card.effect.toLowerCase();
    return eff.includes('violent high speed') || eff.includes('烈神速');
  }

  function canActivateViolentHighSpeed(card, side = 'player') {
    if (!isViolentHighSpeedCard(card)) return false;
    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    return (friendlyState.trash || 0) >= 5;
  }


  // ── BRAVE RULES (Rule 7.2): Uncombined Braves in Spirit Form cannot Attack or Block ──
  function canUnitAttack(unit) {
    if (!unit || unit.isExhausted) return false;
    const isBrave = unit.isBraveCard || unit.type === 'Brave' || (unit.type || '').includes('Brave');
    if (isBrave && !unit.isBraved && !unit.braveHost) {
      const eff = (unit.effect || '').toLowerCase();
      if (!eff.includes('can attack') && !eff.includes('can also attack')) {
        return false;
      }
    }
    return true;
  }

  function canUnitBlock(unit) {
    if (!unit || unit.isExhausted) return false;
    const isBrave = unit.isBraveCard || unit.type === 'Brave' || (unit.type || '').includes('Brave');
    if (isBrave && !unit.isBraved && !unit.braveHost) {
      const eff = (unit.effect || '').toLowerCase();
      if (!eff.includes('can block') && !eff.includes('can also block')) {
        return false;
      }
    }
    return true;
  }

  function summonCard(uid, customCoresToPlace, useSoulCore = null) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot summon during opponent's turn!", 'warning');
      return;
    }
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Spirits & Ultimates can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: Normal Spirits & Ultimates cannot be summoned during the Attack Step! "${card.name}" does not have [Flash] timing.`, 'warning');
      return;
    }

    const isUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
        // Violent High Speed check: If Ultimate-Seiryubi / Violent High Speed and trash >= 5, summon for 0 cost using Trash cores!
    const isVhs = isViolentHighSpeedCard(card) && canActivateViolentHighSpeed(card, 'player') && (phase === 'ATTACK');
    if (isVhs) {
      const trashCount = DuelState.player.trash || 0;
      DuelState.player.hand.splice(cardIdx, 1);
      // Place 1 core on Seiryubi to sustain it, remaining cores return to Reserve
      card.currentCores = 1;
      card.currentLevel = 3;
      card.currentBp = 10000;
      card.isExhausted = false;
      card.hasAttacked = false;
      DuelState.player.field.push(card);
      DuelState.player.reserve = (DuelState.player.reserve || 0) + (trashCount - 1);
      DuelState.player.trash = 0;
      AudioFX.slash();
      addLog(`⚡ **[VIOLENT HIGH SPEED]**: "${card.name}" Flash-summoned from Hand for 0 cost! Moved all ${trashCount} cores from Trash to Field/Reserve!`, 'magic');
      executeWhenSummonedEffects(card, 'player');
      checkHandOnUltimateSummon(card, 'player');
      renderDuelTable();
      renderPlayerHand();
      return;
    }

    if (isUltimate) {
      const ultCheck = validateUltimateSummonCondition(card, 'player');
      if (!ultCheck.allowed) {
        if (typeof showToast === 'function') {
          showToast(`Official Rule: Cannot summon Ultimate "${card.name}"! Condition not met: ${ultCheck.reason}`, 'warning');
        }
        return;
      }
    }

    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const isCostReduced = cost < baseCost;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const hasScInReserve = (DuelState.player.soulCoreLocation === 'reserve');

    // Soul Core Payment Option (e.g. Kagerou-Seeker or general Soul Core payment):
    const hasSoulCoreBonus = /if \[soul core\] was used to pay the summon cost|\[soul core\] was used to pay/i.test(card.effect || '');
    if (cost > 0 && hasScInReserve && useSoulCore === null) {
      if (hasSoulCoreBonus) {
        askOptionalEffect(
          card,
          `Pay summon cost using [Soul Core] from Reserve to activate bonus effect? ("${card.name}")`,
          () => summonCard(uid, customCoresToPlace, true),
          () => summonCard(uid, customCoresToPlace, false)
        );
        return;
      }
    }

    const payingWithSoulCore = (useSoulCore === true) && hasScInReserve;
    const availableReserve = DuelState.player.reserve + (hasScInReserve ? 1 : 0);
    const totalNeeded = cost + coresToPlace;

    if (payingWithSoulCore ? (availableReserve < totalNeeded) : (DuelState.player.reserve < totalNeeded)) {
      if (availableReserve >= totalNeeded && !payingWithSoulCore) {
        // Must use Soul Core to meet total cores
        return summonCard(uid, customCoresToPlace, true);
      }
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(uid);
        return;
      }
      showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost} + ${coresToPlace} on Spirit), but only have ${total} across Reserve and Field Spirits.`, 'warning');
      return;
    }

    let usedSoulCoreFromReserve = false;
    if (payingWithSoulCore) {
      usedSoulCoreFromReserve = true;
      card.usedSoulCore = true;
      card.paidWithSoulCore = true;
      DuelState.player.soulCoreLocation = 'trash';
      // Soul Core paid as 1 cost core to Trash, remaining (cost - 1) cores to Trash, plus coresToPlace to card
      const regularCostToPay = Math.max(0, cost - 1);
      DuelState.player.reserve -= (regularCostToPay + coresToPlace);
      DuelState.player.trash += cost;
      DuelState.player.hand.splice(cardIdx, 1);
      addLog(`🔮 **[SOUL CORE PAID]**: Used [Soul Core] from Reserve to pay summon cost for "${card.name}"!`, 'magic');
    } else {
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
    const cardKind = card.type || 'Spirit';
    addLog(`✨ **SUMMONED**: "${card.name}" (${cardKind}) placed on field! Paid ${cost} cores${isCostReduced ? ` (reduced from ${baseCost} via field symbols)` : ''}, allocated ${coresToPlace} core (Lv${level}, ${bp} BP).`, 'step');
    executeWhenSummonedEffects(card, 'player');
    const isSummonedUlt = (card.type === 'Ultimate' || (card.type || '').includes('Ultimate'));
    if (isSummonedUlt) {
      checkHandOnUltimateSummon(card, 'player');
    }
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

    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const isCostReduced = cost < baseCost;
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
    addLog(`🏛️ **DEPLOYED**: Nexus "${card.name}" placed in the Center Field Nexus Zone! Paid ${cost} cores${isCostReduced ? ` (reduced from ${baseCost} via field symbols)` : ''} (Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');
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
      const readyBlockers = (DuelState.player.field || []).filter(s => canUnitBlock(s));
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

    // Contract Soul State Rule: If a Contract Partner would be sent to Trash, it transitions to Soul State!
    if (card.isContractPartner || (target.contractCard && target.contractCard.uid === card.uid)) {
      if (!target.soulStateCards) target.soulStateCards = [];
      card.isSoulState = true;
      if (target.contractCard) target.contractCard.inSoulState = true;
      if (!target.soulStateCards.some(c => c.uid === card.uid)) {
        target.soulStateCards.push(card);
      }
      addLog(`✨ **[SOUL STATE TRANSITION]**: Contract Partner "${card.name}" placed in Soul State instead of Trash!`, 'system');
      renderDuelTable();
      return;
    }

    if (!target.trashCards) target.trashCards = [];
    // If a Braved host is destroyed, Brave can remain on field in Spirit form with 1 Core!
    if (card.brave) {
      const braveCard = card.brave;
      card.brave = null;
      card.isBraved = false;
      braveCard.isBraved = false;
      braveCard.hostSpiritUid = null;

      if (target.reserve >= 1) {
        target.reserve -= 1;
        braveCard.currentCores = 1;
        braveCard.currentLevel = 1;
        const parsed = parseLevels(braveCard.levels);
        braveCard.lv1Bp = parsed[0]?.bp || 1000;
        braveCard.currentBp = braveCard.lv1Bp;
        braveCard.isBraveCard = true;
        target.field.push(braveCard);
        addLog(`🛡️ **[BRAVE PRESERVED]**: "${braveCard.name}" remained on field in Spirit Form with 1 Core!`, 'info');
      } else {
        sendToTrash(braveCard, side, `Host spirit "${card.name}" destroyed`);
      }
    }

    card.graveyardReason = reason || 'Sent to Trash';
    executeUniversalCardEffect(card, side, 'WHEN_DESTROYED', { reason });
    card.graveyardTurn = DuelState.turn;
    target.trashCards.unshift(card);

    // Send all pre-advent cards stacked under an Advent spirit to Trash
    if (card.underlyingCards && card.underlyingCards.length > 0) {
      const stacked = card.underlyingCards;
      card.underlyingCards = [];
      stacked.forEach(u => {
        u.graveyardReason = `Pre-Advent card under fallen ${card.name}`;
        u.graveyardTurn = DuelState.turn;
        target.trashCards.unshift(u);
        addLog(`🪦 **[PRE-ADVENT TRASHED]**: "${u.name}" stacked under "${card.name}" sent to Trash.`, 'info');
      });
    }

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
    const isSelfInflicted = rLower.includes('core sacrifice') || rLower.includes('self-sacrifice') || rLower.includes('for summon') || rLower.includes('tribute') || rLower.includes('friendly') || rLower.includes('paid cost') || rLower.includes('cost payment');
    const isByOpponent = !isSelfInflicted && (
      rLower.includes('opponent') || rLower.includes('opposing') || rLower.includes('combat') || rLower.includes('fell in battle') || rLower.includes('curse') || rLower.includes('destroyed by') || (DuelState.activePlayer !== side)
    );
    if (card.type === 'Spirit' && isByOpponent) {
      checkBurstTrigger(side, 'AFTER_YOUR_SPIRIT_DESTROYED', { destroyedSpirit: card, reason });
    }

    // Check Shugraus LV2: When your "Makai"-named Spirits are destroyed by the opponent, draw one card from your deck.
    if (isByOpponent && ((card.name || '').toLowerCase().includes('makai') || (card.family || '').toLowerCase().includes('makai'))) {
      const allies = (side === 'player' ? DuelState.player.field : DuelState.opponent.field) || [];
      for (const ally of allies) {
        if (!ally || ally.uid === card.uid) continue;
        if ((ally.name || '').includes('Shugraus') && (ally.currentLevel || 1) >= 2) {
          if (target.deck && target.deck.length > 0) {
            const drawn = target.deck.shift();
            if (target.hand) target.hand.push(drawn);
            AudioFX.draw();
            addLog(`🔮 **[${ally.name} Lv2]**: Drew "${drawn.name}" because allied Makai "${card.name}" was destroyed by opponent!`, 'draw');
            if (side === 'player') renderPlayerHand();
          }
        }
      }
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

    // 5. Trigger (When Advents) / [Twinkle ...] effects
    executeWhenAdventsEffects(targetSpirit, side);

    // 5b. Trigger allied Nexus / Spirit ON_ALLY_ADVENT effects (e.g. The SevenShogun Resting Mausoleum LV2)
    for (const nex of (st.nexus || [])) {
      executeUniversalCardEffect(nex, side, 'ON_ALLY_ADVENT', { adventSpirit: targetSpirit });
      executeCoreCharge(nex, side, 'SUMMON', { spirit: targetSpirit });
    }
    for (const ally of (st.field || [])) {
      if (ally.uid !== targetSpirit.uid) {
        executeUniversalCardEffect(ally, side, 'ON_ALLY_ADVENT', { adventSpirit: targetSpirit });
      }
    }

    // 6. Also trigger any general (When Summoned) effects
    executeWhenSummonedEffects(targetSpirit, side);

    renderDuelTable();
    if (isPlayer) renderPlayerHand();

    // 7. Check opponent Burst: [Burst: After an opposing Spirit's (When Summoned/Advents) effect resolves]
    const enemySide = isPlayer ? 'opponent' : 'player';
    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit: targetSpirit, isAdvent: true });
  }

  function promptTwinkleNecromancyModal(spirit, side, costGroups, onConfirm) {
    if (side !== 'player' || typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      const selected = [];
      for (const cost of [0, 1, 3, 6, 9]) {
        if (costGroups[cost] && costGroups[cost].length > 0) {
          const sorted = [...costGroups[cost]].sort((a, b) => (b.lv1Bp || b.currentBp || 0) - (a.lv1Bp || a.currentBp || 0));
          selected.push(sorted[0]);
        }
      }
      if (onConfirm) onConfirm(selected);
      return;
    }

    const box = document.createElement('div');
    box.className = 'optional-effect-popup twinkle-necromancy-modal';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100001;width:min(480px,94vw);max-height:85vh;overflow-y:auto;background:#111827;border:2px solid #ec4899;border-radius:14px;padding:18px 20px;box-shadow:0 16px 45px rgba(0,0,0,.85);color:#e5e7eb;font-size:.88rem;';

    const selections = {};
    for (const cost of [0, 1, 3, 6, 9]) {
      if (costGroups[cost] && costGroups[cost].length > 0) {
        selections[cost] = costGroups[cost][0].uid;
      }
    }

    const render = () => {
      let costSectionsHtml = '';
      for (const cost of [0, 1, 3, 6, 9]) {
        const cards = costGroups[cost];
        if (!cards || !cards.length) continue;
        costSectionsHtml += `
          <div style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid #374151;border-radius:8px;padding:10px;">
            <div style="font-weight:800;color:#f472b6;font-size:0.85rem;margin-bottom:6px;display:flex;justify-content:space-between;">
              <span>COST ${cost} SPIRIT (Pick at most 1)</span>
              <span style="font-size:0.75rem;color:#9ca3af;">${cards.length} available</span>
            </div>
            ${cards.map(c => {
              const isSel = selections[cost] === c.uid;
              return `
                <div class="twinkle-opt-row" data-cost="${cost}" data-uid="${_optEsc(c.uid)}" style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;margin-bottom:4px;border-radius:6px;cursor:pointer;background:${isSel ? 'rgba(236,72,153,0.22)' : 'rgba(0,0,0,0.2)'};border:1px solid ${isSel ? '#ec4899' : '#374151'};">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid ${isSel ? '#ec4899' : '#6b7280'};background:${isSel ? '#ec4899' : 'transparent'};"></span>
                    <span style="font-weight:700;color:${isSel ? '#fdf2f8' : '#e5e7eb'};font-size:0.84rem;">${_optEsc(c.name)}</span>
                  </div>
                  <span style="font-size:0.75rem;color:#cbd5e1;">Lv1 ${c.lv1Bp || 1000} BP</span>
                </div>
              `;
            }).join('')}
            <div class="twinkle-opt-none" data-cost="${cost}" style="display:flex;align-items:center;gap:8px;padding:4px 10px;cursor:pointer;font-size:0.75rem;color:${selections[cost] === null ? '#ec4899' : '#9ca3af'};">
              <span style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid ${selections[cost] === null ? '#ec4899' : '#4b5563'};background:${selections[cost] === null ? '#ec4899' : 'transparent'};"></span>
              <span>Do not summon Cost ${cost}</span>
            </div>
          </div>
        `;
      }

      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-weight:900;font-size:1.05rem;color:#f472b6;">🌟 Twinkle Necromancy</div>
          <span style="font-size:0.75rem;background:#831843;color:#fbcfe8;padding:2px 8px;border-radius:10px;">[When Advents]</span>
        </div>
        <div style="font-size:0.8rem;color:#cbd5e1;line-height:1.35;margin-bottom:12px;">
          You can summon Cost 0/1/3/6/9 Spirit cards, <strong>one of each</strong>, from your Trash without paying cost:
        </div>
        ${costSectionsHtml}
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;">
          <button id="btnTwinkleSkip" style="padding:7px 14px;background:#374151;color:#e5e7eb;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.82rem;">Skip All</button>
          <button id="btnTwinkleConfirm" style="padding:7px 16px;background:linear-gradient(135deg,#db2777,#ec4899);color:#fff;border:none;border-radius:6px;font-weight:800;cursor:pointer;font-size:0.82rem;box-shadow:0 0 10px rgba(236,72,153,0.4);">Confirm Summon</button>
        </div>
      `;

      box.querySelectorAll('.twinkle-opt-row').forEach(row => {
        row.onclick = () => {
          const cost = row.dataset.cost;
          const uid = row.dataset.uid;
          selections[cost] = uid;
          render();
        };
      });

      box.querySelectorAll('.twinkle-opt-none').forEach(row => {
        row.onclick = () => {
          const cost = row.dataset.cost;
          selections[cost] = null;
          render();
        };
      });

      const btnSkip = box.querySelector('#btnTwinkleSkip');
      if (btnSkip) btnSkip.onclick = () => {
        if (box.parentNode) box.parentNode.removeChild(box);
        if (onConfirm) onConfirm([]);
      };

      const btnConfirm = box.querySelector('#btnTwinkleConfirm');
      if (btnConfirm) btnConfirm.onclick = () => {
        if (box.parentNode) box.parentNode.removeChild(box);
        const selectedCards = [];
        for (const cost of [0, 1, 3, 6, 9]) {
          const selUid = selections[cost];
          if (selUid) {
            const card = costGroups[cost].find(c => c.uid === selUid);
            if (card) selectedCards.push(card);
          }
        }
        if (onConfirm) onConfirm(selectedCards);
      };
    };

    render();
    document.body.appendChild(box);
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
      const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
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
      const costGroups = { 0: [], 1: [], 3: [], 6: [], 9: [] };
      myTrash.forEach(c => {
        if ((c.type === 'Spirit' || !c.type) && costGroups[c.cost] !== undefined) {
          costGroups[c.cost].push(c);
        }
      });

      const hasAny = allowedCosts.some(cost => costGroups[cost] && costGroups[cost].length > 0);
      if (!hasAny) {
        addLog(`ℹ️ **[TWINKLE NECROMANCY: ${spirit.name}]**: No Cost 0/1/3/6/9 Spirits found in Trash to reanimate.`, 'step');
      } else {
        promptTwinkleNecromancyModal(spirit, side, costGroups, (selectedSpirits) => {
          if (!selectedSpirits || !selectedSpirits.length) return;
          const reanimated = [];
          for (const card of selectedSpirits) {
            const tIdx = myTrash.findIndex(c => c.uid === card.uid);
            if (tIdx !== -1) {
              myTrash.splice(tIdx, 1);
            }
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
            reanimated.push(`${spiritInstance.name} (Cost ${card.cost})`);
            executeWhenSummonedEffects(spiritInstance, side);
          }

          if (reanimated.length > 0) {
            AudioFX.summon();
            addLog(`💀 **[TWINKLE NECROMANCY: ${spirit.name}]**: Reanimated ${reanimated.length} Spirit(s) from Trash (one per cost tier): ${reanimated.join(', ')}!`, 'magic');
            if (typeof showToast === 'function') {
              showToast(`💀 [Twinkle Necromancy]: Reanimated ${reanimated.length} Spirits!`, 'success');
            }
            renderDuelTable();
            if (side === 'player') renderPlayerHand();
          }
        });
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

  function isSingleTargetBpBuff(card, castMode = null) {
    if (!card) return false;
    const name = card.name || '';
    if (name.includes('Defensive Aura')) return false; // Defensive Aura affects all blocking spirits
    
    // Strict timing isolation: when casting specifically in 'main' or 'flash' mode, ONLY check that specific timing block!
    const phase = (DuelState && DuelState.phases && DuelState.phases[DuelState.phaseIndex]) || 'MAIN';
    const textToCheck = extractMagicTimingBlock(card.effect || '', phase, 'hand', castMode);
    const eff = (textToCheck || card.effect || '').toLowerCase();
    
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

  // =========================================================================
  // 🗡️ BRAVE CARD MECHANICS ENGINE (DUAL FORM: SPIRIT & COMBINED BRAVE)
  // =========================================================================
  function summonBraveAsSpirit(uid, customCoresToPlace = 1) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot summon during opponent's turn!", 'warning');
      return;
    }
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      if (typeof showToast === 'function') showToast("Braves can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }
    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: "${card.name}" does not have [Flash] timing!`, 'warning');
      return;
    }

    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const coresToPlace = customCoresToPlace || 1;
    const totalNeeded = cost + coresToPlace;

    if (DuelState.player.reserve < totalNeeded) {
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') {
        showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost} + ${coresToPlace} on Brave), but only have ${total} available!`, 'warning');
      }
      return;
    }

    DuelState.player.reserve -= totalNeeded;
    DuelState.player.trash += cost;
    DuelState.player.hand.splice(cardIdx, 1);

    card.currentCores = coresToPlace;
    card.currentLevel = 1;
    const parsed = parseLevels(card.levels);
    card.lv1Bp = parsed[0]?.bp || 1000;
    card.currentBp = card.lv1Bp;
    card.bpBonus = parseBraveBonus(card.levels, card.effect);
    card.isExhausted = false;
    card.hasAttacked = false;
    card.isBraveCard = true;
    card.isBraved = false;

    DuelState.player.field.push(card);
    DuelState.selectedPlayerCard = null;

    AudioFX.summon();
    addLog(`⚔️ **SUMMONED (SPIRIT FORM)**: Brave "${card.name}" summoned as a Spirit! Paid ${cost} cores, allocated ${coresToPlace} core(s) (${card.currentBp} BP).`, 'summon');
    if (typeof showToast === 'function') {
      showToast(`⚔️ Summoned Brave: ${card.name} in Spirit Form!`, 'success');
    }

    executeWhenSummonedEffects(card, 'player');
    renderDuelTable();
    renderPlayerHand();
  }

  function openBraveCombineModal(braveUid, source = 'hand') {
    let braveCard = null;
    if (source === 'hand') {
      braveCard = DuelState.player.hand.find(c => c.uid === braveUid);
    } else {
      braveCard = DuelState.player.field.find(c => c.uid === braveUid);
    }
    if (!braveCard) return;

    const eligibleSpirits = DuelState.player.field.filter(s => s.uid !== braveCard.uid && !s.brave);

    if (eligibleSpirits.length === 0) {
      if (source === 'hand') {
        if (typeof showToast === 'function') {
          showToast(`No allied Spirits on battlefield to Brave with! You can summon "${braveCard.name}" in Spirit Form first.`, 'warning');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast(`No other allied Spirits on battlefield to combine with "${braveCard.name}"!`, 'warning');
        }
      }
      return;
    }

    if (eligibleSpirits.length === 1) {
      braveOntoSpirit(braveUid, eligibleSpirits[0].uid, source);
      return;
    }

    openTargetModal(braveCard, source === 'hand' ? 'brave_hand' : 'brave_field');
  }

  function braveOntoSpirit(braveUid, targetSpiritUid, source = 'hand') {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot Brave during opponent's turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Official Rule: Braves can only be combined during the MAIN step!", 'warning');
      return;
    }

    let braveCard = null;
    let cardIdx = -1;

    if (source === 'hand') {
      cardIdx = DuelState.player.hand.findIndex(c => c.uid === braveUid);
      if (cardIdx === -1) return;
      braveCard = DuelState.player.hand[cardIdx];
    } else {
      cardIdx = DuelState.player.field.findIndex(c => c.uid === braveUid);
      if (cardIdx === -1) return;
      braveCard = DuelState.player.field[cardIdx];
    }

    const targetSpirit = DuelState.player.field.find(s => s.uid === targetSpiritUid);
    if (!targetSpirit) {
      if (typeof showToast === 'function') showToast("Target Spirit not found on field!", 'warning');
      return;
    }

    if (targetSpirit.brave) {
      if (typeof showToast === 'function') showToast(`"${targetSpirit.name}" already has a Brave attached!`, 'warning');
      return;
    }

    const bpBonus = parseBraveBonus(braveCard.levels, braveCard.effect);
    braveCard.bpBonus = bpBonus;

    if (source === 'hand') {
      const baseCost = braveCard.cost || 0;
      const cost = getCardEffectiveCost(braveCard, 'player');
      if (DuelState.player.reserve < cost) {
        const { total } = getPlayerAvailableCores();
        if (total >= cost) {
          openSacrificeModal(braveUid);
          return;
        }
        if (typeof showToast === 'function') showToast(`Need ${cost} cores to Brave "${braveCard.name}"!`, 'warning');
        return;
      }
      DuelState.player.reserve -= cost;
      DuelState.player.trash += cost;
      DuelState.player.hand.splice(cardIdx, 1);
    } else {
      // From field: cores on the brave spirit move onto the target spirit
      const fieldCores = braveCard.currentCores || 0;
      targetSpirit.currentCores = (targetSpirit.currentCores || 0) + fieldCores;
      DuelState.player.field.splice(cardIdx, 1);
    }

    targetSpirit.brave = braveCard;
    targetSpirit.isBraved = true;
    braveCard.isBraved = true;
    braveCard.hostSpiritUid = targetSpirit.uid;

    recalculateSpiritBp(targetSpirit);

    AudioFX.summon();
    addLog(`🔗 **BRAVED**: "${braveCard.name}" combined with "${targetSpirit.name}"! Granted +${bpBonus} BP bonus (Now ${targetSpirit.currentBp} BP)!`, 'summon');
    if (typeof showToast === 'function') {
      showToast(`🔗 Braved "${braveCard.name}" onto "${targetSpirit.name}" (+${bpBonus} BP)!`, 'success');
    }

    executeWhenBravedEffects(braveCard, targetSpirit, 'player');
    renderDuelTable();
    renderPlayerHand();
  }

  function separateBrave(hostSpiritUid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("You can only separate Braves on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Braves can only be separated during the MAIN step!", 'warning');
      return;
    }

    const hostSpirit = DuelState.player.field.find(s => s.uid === hostSpiritUid);
    if (!hostSpirit || !hostSpirit.brave) {
      if (typeof showToast === 'function') showToast("No Brave attached to this Spirit!", 'warning');
      return;
    }

    let coreSource = null;
    if (DuelState.player.reserve >= 1) {
      DuelState.player.reserve -= 1;
      coreSource = 'Reserve';
    } else if (hostSpirit.currentCores > 1) {
      hostSpirit.currentCores -= 1;
      coreSource = hostSpirit.name;
    } else {
      if (typeof showToast === 'function') showToast("Need at least 1 Core in Reserve or on Spirit to separate Brave into Spirit form!", 'warning');
      return;
    }

    const braveCard = hostSpirit.brave;
    hostSpirit.brave = null;
    hostSpirit.isBraved = false;
    braveCard.isBraved = false;
    braveCard.hostSpiritUid = null;

    recalculateSpiritBp(hostSpirit);

    braveCard.currentCores = 1;
    braveCard.currentLevel = 1;
    const parsed = parseLevels(braveCard.levels);
    braveCard.lv1Bp = parsed[0]?.bp || 1000;
    braveCard.currentBp = braveCard.lv1Bp;
    braveCard.isExhausted = hostSpirit.isExhausted;
    braveCard.hasAttacked = hostSpirit.hasAttacked;
    braveCard.isBraveCard = true;

    DuelState.player.field.push(braveCard);

    AudioFX.coreChime();
    addLog(`🔄 **DE-BRAVED**: "${braveCard.name}" separated from "${hostSpirit.name}" into Spirit Form (Allocated 1 Core from ${coreSource}, ${braveCard.currentBp} BP).`, 'info');
    if (typeof showToast === 'function') {
      showToast(`🔄 "${braveCard.name}" separated into Spirit Form!`, 'info');
    }

    renderDuelTable();
    renderPlayerHand();
  }

  function executeWhenBravedEffects(braveCard, hostSpirit, side = 'player') {
    if (!braveCard || !braveCard.effect) return;
    const blocks = getCardAbilityBlocks(braveCard.effect);
    const bravedBlocks = blocks.filter(b => /\(When Braved(?:[^)]*)\)|\(When Braved\/[^)]*\)|合体時/i.test(b) && !/\(When (?:Brave )?Attacks\)/i.test(b));
    for (const b of bravedBlocks) {
      executeAbilityActions(b, hostSpirit, side, 'BRAVED', { braveCard });
    }
  }

  function executeBpComparisonDefeatEffects(loser, winner, loserSide, winnerSide) {
    if (!loser) return;
    const winnerField = winnerSide === 'player' ? DuelState.player.field : DuelState.opponent.field;

    // 1. Check if loser has a Brave attached (e.g. The PoisonSnakeScythe Alphard)
    const braveCard = loser.brave;
    if (braveCard && braveCard.effect) {
      const bEff = braveCard.effect;
      if (bEff.includes('destroyed by comparing BP') || bEff.includes('BPを比べ')) {
        if (bEff.includes('destroy an opposing') || bEff.includes('破壊する')) {
          const wIdx = winnerField.findIndex(s => s.uid === winner.uid);
          if (wIdx !== -1) {
            const dest = winnerField.splice(wIdx, 1)[0];
            recycleSpiritCoresToReserve(dest, winnerSide);
            sendToTrash(dest, winnerSide, `Destroyed by [When Braved] BP comparison effect of ${braveCard.name}`);
            AudioFX.slash();
            addLog(`🗡️ **[WHEN BRAVED: ${braveCard.name}]**: Revenge destruction! Destroyed opposing "${winner.name}" that defeated it in BP comparison!`, 'kill');
            if (typeof showToast === 'function') {
              showToast(`🗡️ [${braveCard.name}]: Destroyed opposing "${winner.name}"!`, 'success');
            }
          }
        }
      }
    }

    // 2. Check loser's own effect
    if (loser.effect && (loser.effect.includes('destroyed by comparing BP') || loser.effect.includes('BPを比べ'))) {
      if (loser.effect.includes('destroy an opposing') || loser.effect.includes('破壊する')) {
        const wIdx = winnerField.findIndex(s => s.uid === winner.uid);
        if (wIdx !== -1) {
          const dest = winnerField.splice(wIdx, 1)[0];
          recycleSpiritCoresToReserve(dest, winnerSide);
          sendToTrash(dest, winnerSide, `Destroyed by BP comparison revenge of ${loser.name}`);
          AudioFX.slash();
          addLog(`💥 **[BP REVENGE: ${loser.name}]**: Destroyed opposing "${winner.name}" that defeated it in BP comparison!`, 'kill');
        }
      }
    }
  }

  function openTargetModal(card, mode = 'magic', attackerUid = null, castMode = null) {
    pendingTargetSelection = { card, mode, attackerUid, castMode };
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

    const titleEl = document.getElementById('targetModalTitle');
    const descEl = document.getElementById('targetModalDesc');
    const choicesEl = document.getElementById('targetSpiritChoices');

    if (mode === 'brave_hand' || mode === 'brave_field') {
      const bpBonus = parseBraveBonus(card.levels, card.effect);
      if (titleEl) titleEl.textContent = `🔗 Combine Brave: ${card.name}`;
      if (descEl) descEl.innerHTML = `Select which allied Spirit or Ultimate combines with <strong>${card.name}</strong> (+${bpBonus} BP):`;
      if (choicesEl) {
        const eligible = DuelState.player.field.filter(s => s.uid !== card.uid && !s.brave);
        choicesEl.innerHTML = eligible.map(s => `
          <div class="target-choice-card" onclick="BattleArena.selectTargetSpirit('${s.uid}')">
            <div class="tcc-info">
              <span class="tcc-name">${s.name}</span>
              <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores === 1 ? '' : 's'}${s.isExhausted ? ' (Exhausted)' : ' (Ready)'}</span>
            </div>
            <button class="target-choice-btn" style="background:linear-gradient(135deg, #a855f7, #6366f1); border-color:#c084fc;">🔗 Brave (+${bpBonus} BP)</button>
          </div>
        `).join('');
      }
    } else {
      const bpAmount = getMagicBpBoostAmount(card);
      if (titleEl) titleEl.textContent = `Target Spirit: ${card.name}`;
      if (descEl) descEl.innerHTML = `Select which allied Spirit receives <strong>+${bpAmount} BP</strong> this turn:`;
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
    }

    modalEl.classList.add('active');
  }

  function selectTargetSpirit(spiritUid) {
    if (!pendingTargetSelection) return;
    const { card, mode, attackerUid } = pendingTargetSelection;
    closeTargetModal();

    if (mode === 'flash_battle') {
      castFlashInBattle(card.uid, attackerUid, spiritUid);
    } else if (mode === 'brave_hand') {
      braveOntoSpirit(card.uid, spiritUid, 'hand');
    } else if (mode === 'brave_field') {
      braveOntoSpirit(card.uid, spiritUid, 'field');
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
        const readyBlockers = (DuelState.player.field || []).filter(s => canUnitBlock(s));
        showBlockPrompt(attacker, readyBlockers);
      }
    }
  }

  function castFlashInBattle(cardUid, attackerUid, targetSpiritUid = null) {
    const card = DuelState.player.hand.find(c => c.uid === cardUid);
    if (!card) return;

    const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid) || DuelState.selectedAttacker;
    const isSpirit = card.type === 'Spirit';
    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
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
    const readyBlockers = (DuelState.player.field || []).filter(s => canUnitBlock(s));
    if (attacker) {
      showBlockPrompt(attacker, readyBlockers);
    }
  }

  function applyMagicEffect(card, side = 'player', contextAttacker = null, targetSpiritUid = null, forcedEffectType = null) {
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
    const isFlashTiming = (forcedEffectType === 'flash') || (!forcedEffectType && isCombat);
    const activeEffectText = extractMagicTimingBlock(card.effect || '', currentPhase, 'hand', forcedEffectType);

    if (name.includes('Evil Draw')) {
      if (isFlashTiming) {
        // Flash: During this turn, give a Spirit/Ultimate +2000 BP.
        const bpAmount = 2000;
        let target = null;
        if (targetSpiritUid) {
          target = myField.find(s => s.uid === targetSpiritUid);
        }
        if (!target) {
          if (DuelState.combatEvent) {
            if (DuelState.combatEvent.attacker && myField.some(s => s.uid === DuelState.combatEvent.attacker.uid)) {
              target = DuelState.combatEvent.attacker;
            } else if (DuelState.combatEvent.blocker && myField.some(s => s.uid === DuelState.combatEvent.blocker.uid)) {
              target = DuelState.combatEvent.blocker;
            }
          }
          if (!target && contextAttacker && myField.some(s => s.uid === contextAttacker.uid)) {
            target = contextAttacker;
          }
          if (!target && myField.length > 0) {
            target = [...myField].sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0))[0];
          }
        }
        if (target) {
          target.currentBp += bpAmount;
          target.battleBp = (target.battleBp || target.currentBp);
          effectDesc = `Granted +${bpAmount} BP to "${target.name}" (now ${target.currentBp} BP)!`;
        } else {
          effectDesc = `Activated Flash timing, but no allied Spirits or Ultimates were on the field.`;
        }
      } else {
        // Main: Draw two cards. Also, if [Soul Core] was used to pay the cost, destroy an opposing 4000 BP or less Spirit.
        const d1 = myDeck.shift();
        const d2 = myDeck.shift();
        if (d1) myHand.push(d1);
        if (d2) myHand.push(d2);
        effectDesc = `${isPlayer ? 'You drew' : 'Opponent drew'} 2 cards from deck!`;

        if (card.paidWithSoulCore) {
          const target = enemyField.find(s => (s.battleBp || s.currentBp || 0) <= 4000);
          if (target) {
            const idx = enemyField.indexOf(target);
            enemyField.splice(idx, 1);
            recycleSpiritCoresToReserve(target, isPlayer ? 'opponent' : 'player');
            sendToTrash(target, isPlayer ? 'opponent' : 'player', `Destroyed by ${card.name} [Soul Core Paid]`);
            AudioFX.destroy();
            effectDesc += ` Also, Soul Core was used to pay the cost: destroyed opposing "${target.name}" (${target.currentBp} BP)!`;
          } else {
            effectDesc += ` Soul Core was used to pay the cost, but there was no opposing Spirit with 4000 BP or less to destroy.`;
          }
        }
      }
    } else if (name.includes('Blizzard Wall')) {
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
    } else if (name.includes('Flame Dance')) {
      const target = enemyField.find(s => s.currentBp <= 4000);
      if (target) {
        const idx = enemyField.indexOf(target);
        enemyField.splice(idx, 1);
        recycleSpiritCoresToReserve(target, isPlayer ? 'opponent' : 'player');
        sendToTrash(target, isPlayer ? 'opponent' : 'player', `Destroyed by ${card.name}`);
        effectDesc = `Destroyed enemy "${target.name}" (${target.currentBp} BP)! Cores returned to reserve.`;
      } else {
        effectDesc = 'No enemy spirit with 4000 BP or less to destroy.';
      }
    } else if (name.includes('Flame Tempest')) {
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
      const activeLower = activeEffectText.toLowerCase();
      const hasBpBoost = /(?:\+|plus\s*)\d+\s*bp/i.test(activeLower) || /bp\s*(?:\+|plus\s*)\d+/i.test(activeLower);
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
        const trigger = (forcedEffectType === 'flash') ? 'FLASH' : ((forcedEffectType === 'main') ? 'MAIN' : (isCombat ? 'FLASH' : (/\b\[main\]/i.test(card.effect || '') ? 'MAIN' : 'FLASH')));
        executeAbilityActions(activeEffectText, card, side, 'MAGIC', { contextAttacker, targetSpiritUid });
        executeUniversalCardEffect(card, side, trigger, { contextAttacker, targetSpiritUid });
        const cleanSummary = activeEffectText.replace(/^\s*\[(Main|Flash)\]\s*/i, '').trim();
        effectDesc = cleanSummary ? `Activated: "${cleanSummary.length > 90 ? cleanSummary.slice(0, 87) + '...' : cleanSummary}"` : `Cast "${card.name}" and unleashed its magical effects!`;
      }
    }

    return effectDesc;
  }

  function castMagic(uid, targetSpiritUid = null, useSoulCore = null, castMode = null) {
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    // STRICT RULE ENFORCEMENT: Only Magic cards can be cast via castMagic!
    if (card.type !== 'Magic' && !(card.type || '').includes('Magic')) {
      if (typeof showToast === 'function') {
        showToast(`Official Rule: "${card.name}" is a ${card.type}, not a Magic card!`, 'warning');
      }
      return;
    }

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

    // Single-target BP buff check: ONLY check if the CURRENT cast mode actually grants a single-target BP buff!
    if (isSingleTargetBpBuff(card, castMode) && DuelState.player.field.length > 1 && !targetSpiritUid) {
      openTargetModal(card, 'magic', null, castMode);
      return;
    }

    // Check if card has a "[Soul Core] was used to pay the cost" bonus effect
    const hasSoulCoreBonus = /\[soul core\] was used to pay the cost|if \[soul core\] was used to pay the cost/i.test(card.effect || '');
    const hasSoulCoreInReserve = (DuelState.player.soulCoreLocation === 'reserve');

    if (hasSoulCoreBonus && hasSoulCoreInReserve && useSoulCore === null) {
      askOptionalEffect(
        card,
        `Pay cost using [Soul Core] from Reserve to activate bonus effect? ("${card.name}")`,
        () => castMagic(uid, targetSpiritUid, true, castMode),
        () => castMagic(uid, targetSpiritUid, false, castMode)
      );
      return;
    }

    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const payingWithSc = (useSoulCore === true) && hasSoulCoreInReserve;
    const availableReserve = DuelState.player.reserve + (hasSoulCoreInReserve ? 1 : 0);

    if ((payingWithSc ? availableReserve : DuelState.player.reserve) < cost) {
      const { total } = getPlayerAvailableCores();
      if (total >= cost) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') showToast(`Need ${cost} cores to cast "${card.name}"${cost < baseCost ? ` (reduced from ${baseCost})` : ''}, but only have ${total} across Reserve and Field!`, 'warning');
      return;
    }

    if (payingWithSc) {
      DuelState.player.soulCoreLocation = 'trash';
      card.paidWithSoulCore = true;
      const regularCost = Math.max(0, cost - 1);
      DuelState.player.reserve -= regularCost;
      DuelState.player.trash += cost;
      DuelState.player.hand.splice(cardIdx, 1);
      addLog(`🔥 **[SOUL CORE PAID]**: Paid [Soul Core] as part of cost for "${card.name}"!`, 'magic');
    } else {
      card.paidWithSoulCore = false;
      DuelState.player.reserve -= cost;
      DuelState.player.trash += cost;
      DuelState.player.hand.splice(cardIdx, 1);
    }
    
    // Check if card is banished from game after resolving (e.g. Purple Flash's Extreme)
    const isBanished = /banished from the game after its effect resolves|除外される/i.test(card.effect || '');
    if (isBanished) {
      sendToVoid(card, 'player', 'Banished from game after resolving');
      addLog(`🌌 **[EXCLUDED FROM GAME]**: "${card.name}" was banished from the game after its effect resolved!`, 'magic');
    } else {
      sendToTrash(card, 'player', 'Cast Magic from Hand');
    }

    AudioFX.coreChime();
    const effectDesc = applyMagicEffect(card, 'player', null, targetSpiritUid, castMode);
    addLog(`🔮 **MAGIC CAST**: "${card.name}" activated! ${effectDesc}`, 'magic');
    renderDuelTable();
  }

    // ── CORE SACRIFICE MODAL CONTROLLER ──
  function openSacrificeModal(uid, castMode = null) {
    const card = DuelState.player.hand.find(c => c.uid === uid);
    if (!card) return;

    if (!canPlayCardInCurrentPhase(card)) {
      const phase = DuelState.phases[DuelState.phaseIndex];
      if (typeof showToast === 'function') showToast(`Official Rule: Cannot summon "${card.name}" during ${phase} Step! Normal cards cannot be played in Attack Step.`, 'warning');
      return;
    }

    const { reserve, fieldCores, total: totalAvailable } = getPlayerAvailableCores();
    const isUnit = card.type === 'Spirit' || card.type === 'Ultimate' || (card.type || '').includes('Spirit') || (card.type || '').includes('Ultimate') || (card.type || '').includes('Brave');
    const cost = getCardEffectiveCost(card, 'player');
    const totalNeeded = isUnit ? cost + 1 : cost;

    if (totalAvailable < totalNeeded) {
      showToast(`Need ${totalNeeded} total cores (Cost ${cost} + ${isUnit ? '1 on Unit' : '0'}), but you only have ${totalAvailable} across Reserve and Field!`, 'warning');
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
      isSpirit: isUnit,
      cost,
      totalNeeded,
      reserveUsed,
      fieldNeeded,
      allocations,
      castMode
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
      const isSacUlt = (card.type === 'Ultimate' || (card.type || '').includes('Ultimate'));
      if (isSacUlt) {
        checkHandOnUltimateSummon(card, 'player');
      }
    } else {
      const effectDesc = applyMagicEffect(card, 'player', null, null, pendingSacrifice?.castMode || null);
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

    // 1b. Brave symbols addition: if spirit.brave, parse and add the Brave card's symbol count
    if (spirit.brave) {
      const bSymStr = String(spirit.brave.symbol || '').trim();
      let braveSymbols = 0;
      if (bSymStr === '-' || bSymStr.toLowerCase() === 'none' || bSymStr === '0') {
        braveSymbols = 0;
      } else {
        const bPx20 = (bSymStr.match(/20px/g) || []).length;
        const bPx25 = (bSymStr.match(/25px/g) || []).length;
        if (bPx20 + bPx25 > 0) {
          braveSymbols = bPx20 + bPx25;
        } else if (/^\d+$/.test(bSymStr)) {
          braveSymbols = parseInt(bSymStr, 10);
        } else if (bSymStr.includes(',') || bSymStr.includes('/')) {
          braveSymbols = bSymStr.split(/[,/]/).map(t => t.trim()).filter(Boolean).length;
        } else if (spirit.brave.symbol !== undefined && spirit.brave.symbol !== null && !isNaN(Number(spirit.brave.symbol))) {
          braveSymbols = Number(spirit.brave.symbol);
        } else {
          braveSymbols = 1;
        }
      }
      total += braveSymbols;
    }

    const eff = spirit.effect || '';
    const level = spirit.currentLevel || 1;

    // 2. Self-granted additional symbols from spirit.effect
    if (eff) {
      const blocks = getCardAbilityBlocks(eff);
      for (const b of blocks) {
        const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
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
    const idx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (idx === -1) return;

    // Official Rule: Player can replace an existing set Burst during Main Step.
    // The previous Burst card is sent to the Trash (Graveyard).
    if (DuelState.player.burst) {
      const oldBurst = DuelState.player.burst;
      sendToTrash(oldBurst, 'player', 'Replaced by setting a new Burst');
      addLog(`♻️ **[BURST REPLACED]**: Previous Burst "${oldBurst.name}" sent to Trash to set new Burst!`, 'step');
      if (typeof showToast === 'function') {
        showToast(`♻️ Replaced Burst: "${oldBurst.name}" sent to Trash.`, 'info');
      }
    }

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
      else {
        const firstLine = effect.split('\n')[0] || '';
        if (/burst/i.test(firstLine)) raw = firstLine.trim();
      }
    }

    const rawLower = raw.toLowerCase();

    // 1. AFTER_YOUR_SPIRIT_DESTROYED (Strict check on raw condition: depleted or destroyed)
    if (
      rawLower.includes('destroyed by the opponent') ||
      rawLower.includes('destroyed by the oopponent') ||
      rawLower.includes('depleted/destroyed') ||
      rawLower.includes('depleted / destroyed') ||
      rawLower.includes('destroyed or depleted') ||
      rawLower.includes('left the field') ||
      rawLower.includes('leaves the field') ||
      rawLower.includes('破壊後') ||
      rawLower.includes('消滅/破壊後') ||
      rawLower.includes('フィールドを離れた後')
    ) {
      return {
        type: 'AFTER_YOUR_SPIRIT_DESTROYED',
        label: 'After your Spirit is depleted/destroyed by the Opponent',
        raw: raw || 'After your Spirit is depleted/destroyed by the Opponent'
      };
    }

    // 2. AFTER_LIFE_DECREASED
    if (
      rawLower.includes('life is reduced') ||
      rawLower.includes('life is decreased') ||
      rawLower.includes('life is reeduced') ||
      rawLower.includes('ライフ減少後')
    ) {
      return {
        type: 'AFTER_LIFE_DECREASED',
        label: 'After your Life is reduced',
        raw: raw || 'After your Life is reduced'
      };
    }

    // 3. AFTER_OPPONENT_ATTACKS
    if (
      ((rawLower.includes('attack') || rawLower.includes('attacks')) && (rawLower.includes('opposing') || rawLower.includes('opponent') || rawLower.includes('spirit') || rawLower.includes('ultimate'))) ||
      rawLower.includes('相手のアタック後') ||
      rawLower.includes('相手のスピリットのアタック後') ||
      rawLower.includes('アタック後')
    ) {
      return {
        type: 'AFTER_OPPONENT_ATTACKS',
        label: 'After an opposing Spirit attacks',
        raw: raw || 'After an opposing Spirit attacks'
      };
    }

    // 4. AFTER_OPPONENT_SUMMON_EFFECT
    if (
      rawLower.includes('when summoned') ||
      rawLower.includes('summoned/advents') ||
      rawLower.includes('summoned/deployed') ||
      rawLower.includes('summoned/reborn') ||
      rawLower.includes('summoned/advent') ||
      rawLower.includes('summoned by an opposing') ||
      rawLower.includes('summoned via an opposing') ||
      rawLower.includes('召喚時') ||
      rawLower.includes('煌臨時') ||
      rawLower.includes('配置時')
    ) {
      return {
        type: 'AFTER_OPPONENT_SUMMON_EFFECT',
        label: "After an opposing Spirit's (When Summoned) effect resolves",
        raw: raw || "After an opposing Spirit's (When Summoned) effect resolves"
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
      rawLower.includes('手札が増えた後')
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
          <img src="${card.image_url}" alt="${card.name}" referrerpolicy="no-referrer" style="width:72px; height:101px; object-fit:cover; border-radius:0.4rem; border:1px solid rgba(234,88,12,0.5); box-shadow:0 0 10px rgba(234,88,12,0.3);" onerror="this.onerror=null; this.src='./assets/card_back.png';" />
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
    const resume = DuelState.pendingBurstResume;
    DuelState.pendingBurstResume = null;
    if (DuelState.activeBurstTrigger && DuelState.activeBurstTrigger.side === 'player') {
      activateBurst('player', true);
    }
    if (typeof resume === 'function') {
      safeTimeout(resume, 700);
    }
  }

  function declineBurstTrigger() {
    closeBurstPromptModal();
    const resume = DuelState.pendingBurstResume;
    DuelState.pendingBurstResume = null;
    if (DuelState.activeBurstTrigger) {
      const cardName = DuelState.activeBurstTrigger.card?.name || 'Burst';
      addLog(`🛡️ **[BURST HELD]**: Player chose not to trigger "${cardName}" this time. Card remains safely set in Burst Area.`, 'step');
      DuelState.activeBurstTrigger = null;
      renderBurstZones();
    }
    if (typeof resume === 'function') {
      safeTimeout(resume, 300);
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
    if (burstCard.type === 'Spirit' || burstCard.type === 'Ultimate') {
      const targetField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
      const targetState = isPlayer ? DuelState.player : DuelState.opponent;

      // First, resolve the Burst Effect itself!
      let burstEffectResolved = false;

      if ((burstCard.name || '').includes('Renegada') || /summon up to two Cost 6 or less Purple Spirit cards from your Trash/i.test(burstCard.effect || '')) {
        // Renegada Burst Effect:
        // "You can summon up to two Cost 6 or less Purple Spirit cards from your Trash, paying one cost each, and during this turn, treat their LV1 cost as 0. Every Spirit summoned by this effect is destroyed during this turn's End Step."
        const trash = targetState.trashCards || [];
        const eligible = trash.filter(c => (c.type === 'Spirit' || !c.type) && (c.color === 'Purple' || !c.color) && (c.cost <= 6));
        let summonedCount = 0;
        for (const reanimCard of [...eligible]) {
          if (summonedCount >= 2) break;
          const hasCost = (targetState.reserve >= 1 || targetState.cores >= 1 || !isPlayer);
          if (hasCost) {
            if (targetState.reserve >= 1) targetState.reserve -= 1;
            else if (targetState.cores >= 1) targetState.cores -= 1;
            const idx = trash.indexOf(reanimCard);
            if (idx !== -1) trash.splice(idx, 1);
            const reanimatedSpirit = {
              ...reanimCard,
              uid: 'sp_' + Math.random().toString(36).slice(2, 9),
              currentCores: 1,
              hasSoulCore: false,
              isExhausted: false,
              hasAttacked: false,
              battleBp: 0,
              destroyAtEndStep: true
            };
            const { level, bp } = calculateBpAndLevel(reanimatedSpirit.levels, 1, false, reanimatedSpirit.effect);
            reanimatedSpirit.currentLevel = level;
            reanimatedSpirit.currentBp = bp;
            targetField.push(reanimatedSpirit);
            summonedCount++;
            AudioFX.summon();
            addLog(`💀 **[RENEGADA REANIMATION]**: Summoned "${reanimatedSpirit.name}" from Trash (Cost ${reanimCard.cost}, 1 Core paid)! Will be destroyed at End Step.`, 'magic');
            executeWhenSummonedEffects(reanimatedSpirit, side);
          }
        }
        burstEffectResolved = true;
      } else if ((burstCard.name || '').includes('BurguHearts') || /Send two cores each from every non-"Makai"-named Spirits to the Reserve/i.test(burstCard.effect || '')) {
        // BurguHearts Burst Effect:
        let depletedCount = 0;
        const allSpirits = [...(DuelState.player.field || []), ...(DuelState.opponent.field || [])];
        for (const sp of allSpirits) {
          const spMakai = (sp.name || '').toLowerCase().includes('makai') || (sp.family || '').toLowerCase().includes('makai');
          if (!spMakai && (sp.currentCores || 0) > 0) {
            const drain = Math.min(2, sp.currentCores);
            sp.currentCores -= drain;
            const spOwner = (DuelState.player.field || []).includes(sp) ? DuelState.player : DuelState.opponent;
            spOwner.reserve = (spOwner.reserve || 0) + drain;
            recalculateSpiritBp(sp);
            if (sp.currentCores <= 0) {
              depletedCount++;
              const spSide = (DuelState.player.field || []).includes(sp) ? 'player' : 'opponent';
              sendToTrash(sp, spSide, `Depleted by ${burstCard.name}`);
              const fld = spSide === 'player' ? DuelState.player.field : DuelState.opponent.field;
              const idx = fld.indexOf(sp);
              if (idx !== -1) fld.splice(idx, 1);
            }
          }
        }
        addLog(`💥 **[${burstCard.name} BURST]**: Drained 2 cores each from non-Makai spirits to their Reserve!`, 'magic');
        if (DuelState.activePlayer === side && depletedCount > 0) {
          targetState.reserve = (targetState.reserve || 0) + depletedCount;
          addLog(`✨ **[${burstCard.name}]**: Placed +${depletedCount} Core(s) from Void to Reserve for depleted spirits!`, 'magic');
        }
        burstEffectResolved = true;
      } else {
        // Generic Spirit Burst effects
        executeUniversalCardEffect(burstCard, side, 'BURST');
        const burstBlocks = getCardAbilityBlocks(burstCard.effect).filter(b => /\[Burst:/i.test(b) || /^Burst:/i.test(b));
        for (const b of burstBlocks) {
          executeAbilityActions(b, burstCard, side, 'BURST');
        }
        burstEffectResolved = true;
      }

      // Battle Spirits Rule: "After this effect resolves, summon this card without paying the cost."
      const canSummonFree = /summon this (?:spirit|ultimate)?\s*card without paying the cost/i.test(burstCard.effect || '') ||
                            /after this effect resolves/i.test(burstCard.effect || '') ||
                            burstCard.type === 'Spirit' || burstCard.type === 'Ultimate';

      if (canSummonFree && burstEffectResolved) {
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
          addLog(`✨ **BURST SUMMON**: "${burstCard.name}" (${burstCard.type || 'Spirit'}) summoned to the battle line for free (Lv${level}, ${bp} BP)!`, 'step');
          executeWhenSummonedEffects(burstCard, side);
        }
      } else {
        sendToTrash(burstCard, side, 'Burst resolved without summon');
        addLog(`🪦 **[BURST RESOLVED]**: "${burstCard.name}" sent to Trash after resolving effect.`, 'info');
      }
    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const currentPhase = (DuelState.phases && DuelState.phases[DuelState.phaseIndex]) || 'MAIN';
      const burstText = extractMagicTimingBlock(burstCard.effect || '', currentPhase, 'burst');
      executeAbilityActions(burstText, burstCard, side, 'BURST');
      executeUniversalCardEffect(burstCard, side, 'BURST');
      sendToTrash(burstCard, side, `${isPlayer ? 'Player' : 'Opponent'} Burst Magic Activated`);
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its burst effect!`, 'magic');

      if (/then,\s*by paying the cost,\s*activate this card's flash effect/i.test(burstText || burstCard.effect || '')) {
        const cost = burstCard.cost || 0;
        const targetState = isPlayer ? DuelState.player : DuelState.opponent;
        if (isPlayer) {
          if ((targetState.reserve || 0) >= cost) {
            askOptionalEffect(
              burstCard,
              `Pay ${cost} core${cost === 1 ? '' : 's'} from Reserve to activate "${burstCard.name}"'s [Flash] effect?`,
              () => {
                targetState.reserve -= cost;
                targetState.trash += cost;
                addLog(`💎 **[${burstCard.name}]**: Paid ${cost} core(s) from Reserve to activate [Flash] effect from Burst!`, 'magic');
                const flashText = extractMagicTimingBlock(burstCard.effect || '', currentPhase, 'hand');
                executeAbilityActions(flashText, burstCard, side, 'FLASH');
                executeUniversalCardEffect(burstCard, side, 'FLASH');
                renderDuelTable();
              },
              null
            );
          } else {
            addLog(`ℹ️ **[${burstCard.name}]**: Not enough cores in Reserve (${targetState.reserve || 0}/${cost}) to pay cost for Flash effect.`, 'info');
          }
        } else {
          // Opponent AI
          if ((targetState.reserve || 0) >= cost) {
            targetState.reserve -= cost;
            targetState.trash += cost;
            addLog(`💎 **[${burstCard.name}]**: Opponent paid ${cost} core(s) to activate [Flash] effect from Burst!`, 'magic');
            const flashText = extractMagicTimingBlock(burstCard.effect || '', currentPhase, 'hand');
            executeAbilityActions(flashText, burstCard, side, 'FLASH');
            executeUniversalCardEffect(burstCard, side, 'FLASH');
          }
        }
      }
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
        const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
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

  function checkBurstTrigger(side, eventType = 'AFTER_LIFE_DECREASED', eventContext = {}, onResume = null) {
    const isPlayer = side === 'player';
    const burstCard = isPlayer ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) return false;

    const cond = parseBurstCondition(burstCard.effect);

    // Strict validation: eventType must match the card's specific condition
    const matches = (cond.type === eventType);
    if (!matches) {
      // Condition does NOT match: card remains securely set in Burst Area
      return false;
    }

    if (isPlayer) {
      DuelState.pendingBurstResume = onResume || null;
      openBurstPromptModal(burstCard, cond, eventType, eventContext);
      return true;
    } else {
      // Opponent AI automatically resolves
      addLog(`🃏 Opponent's Burst Trap met condition [${cond.label}]!`, 'magic');
      safeTimeout(() => {
        activateBurst('opponent', true);
        if (typeof onResume === 'function') onResume();
      }, 500);
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
    executeUltimateTrigger(attacker, 'player');

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
    const readyBlockers = (DuelState.opponent.field || []).filter(s => canUnitBlock(s));
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

      // Check BP comparison defeat revenge (e.g. Alphard [When Braved] (When Brave Attacks))
      executeBpComparisonDefeatEffects(att, blk, attSide, defSide);

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
      DuelState.player.hasMulliganed = true;
      DuelState.player.hasConfirmedHand = true;
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
    dispatchContinuousRules();
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

    // Destroy spirits with destroyAtEndStep (e.g. Renegada reanimation)
    for (const side of ['player', 'opponent']) {
      const fld = DuelState[side].field || [];
      for (let i = fld.length - 1; i >= 0; i--) {
        const s = fld[i];
        if (s && s.destroyAtEndStep) {
          fld.splice(i, 1);
          addLog(`💀 **[END STEP DESTRUCTION]**: "${s.name}" was destroyed at End Step as required by Renegada's effect!`, 'destroy');
          sendToTrash(s, side, 'Destroyed at End Step by Renegada effect');
        }
      }
    }

    DuelState.turn++;
    dispatchContinuousRules();
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
    const readyBlockers = (playerField || []).filter(s => canUnitBlock(s));
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
        const isUlt = c.type === 'Ultimate' || (c.type || '').includes('Ultimate');
        if (isUlt) {
          const ultCheck = validateUltimateSummonCondition(c, 'opponent');
          if (!ultCheck.allowed) return false;
        } else if (c.type !== 'Spirit' && !(c.type || '').includes('Spirit')) {
          return false;
        }
        const effCost = getCardEffectiveCost(c, 'opponent');
        if (availableReserve < (effCost + 1)) return false;
        const req = getCardTributeRequirement(c);
        if (req && !getEligibleTributeSpirits(req, DuelState.opponent.field).length) return false;
        return true;
      });
      if (!summonable.length) break;

      let bestCard = null;
      let bestScore = -999999;
      let bestCoresToPlace = 1;

      for (const c of summonable) {
        const cost = getCardEffectiveCost(c, 'opponent');
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

      const baseCost = bestCard.cost || 0;
      const cost = getCardEffectiveCost(bestCard, 'opponent');
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
    executeUltimateTrigger(attacker, 'opponent');

    const fallbackBoost = getWhenAttacksBpBoost(attacker);
    if (fallbackBoost > 0 && !attacker.battleBpBoost) {
      attacker.battleBpBoost = fallbackBoost;
      const base = attacker.baseBp !== undefined ? attacker.baseBp : (attacker.currentBp || 0);
      attacker.battleBp = base + fallbackBoost;
      attacker.currentBp = attacker.battleBp;
    }

    const battleBp = attacker.battleBp || attacker.currentBp;
    addLog(`⚔️ **OPPONENT ATTACK** [Expectimax EV +${bestScore.toFixed(2)}]: "${attacker.name}" (${battleBp} BP) attacks your Life!${(attacker.battleBpBoost || 0) > 0 ? ` (+${attacker.battleBpBoost} BP When Attacks bonus)` : ''}`, 'damage');

    const proceedToDefenseStep = () => {
      // Defending field triggers (e.g. Strike-Siegwurm refresh)
      checkOpposingAttackDeclarationEffects('opponent');

      // Check player blockers
      const playerBlockers = DuelState.player.field.filter(s => !s.isExhausted);

      // Always show block/flash prompt if player has ready blockers or playable flash options!
      if (playerBlockers.length > 0 || playerHasFlashOptions()) {
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
          const continueAfterDamage = () => {
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
          };

          const burstTriggered = checkBurstTrigger('player', 'AFTER_LIFE_DECREASED', {}, continueAfterDamage);
          if (!burstTriggered) {
            continueAfterDamage();
          }
        }
      }, 900);
    }
    };

    // If Burst triggers on opponent attack, pause and wait for burst resolution before defense!
    const burstTriggered = checkBurstTrigger('player', 'AFTER_OPPONENT_ATTACKS', { attacker }, proceedToDefenseStep);
    if (!burstTriggered) {
      proceedToDefenseStep();
    }
  }

  function playerHasFlashOptions() {
    try {
      const nexusFlash = (DuelState.player.nexus || []).some(n => canActivateGrandSkill(n, 'player').allowed);
      if (nexusFlash) return true;
      const { total } = getPlayerAvailableCores();
      return DuelState.player.hand.some(c => {
        if (!hasFlashTiming(c)) return false;
        if (!checkCardUsageRestriction(c, 'player').allowed) return false;
        const need = getCardEffectiveCost(c, 'player') + (c.type === 'Spirit' ? 1 : 0);
        return total >= need;
      });
    } catch (e) {
      return false;
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
      const cost = getCardEffectiveCost(c, 'player');
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

      const finishBlockDamage = () => {
        if (isAttackerAlive) {
          checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
            if (attacker) endOfBattleBpReset(attacker);
            continueOpponent();
          });
        } else {
          if (attacker) endOfBattleBpReset(attacker);
          continueOpponent();
        }
      };

      const burstTriggered = checkBurstTrigger('player', 'AFTER_LIFE_DECREASED', {}, finishBlockDamage);
      if (!burstTriggered) {
        finishBlockDamage();
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
        const card = DuelState.player.hand.find(c => c.type === 'Spirit' && DuelState.player.reserve >= (getCardEffectiveCost(c, 'player') + 1));
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
      window.location.href = './arena.html?duel=quick';
      return;
    }
    startDuel('red', 'purple');
  }

  function scrollToBattleArena(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isArenaPage()) {
      window.location.href = './arena.html';
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

        const pOpenCards = DuelState.player.openCards || [];
    const oOpenCards = DuelState.opponent.openCards || [];
    const pOpenCountEl = document.getElementById('tabCountPlayerOpen');
    if (pOpenCountEl) pOpenCountEl.textContent = pOpenCards.length;
    const btnPO = document.getElementById('tabPlayerOpen');
    if (btnPO) btnPO.classList.toggle('active', tab === 'player-open');
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
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" referrerpolicy="no-referrer" onerror="this.src='/placeholder.png';">
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
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" referrerpolicy="no-referrer" onerror="this.src='/placeholder.png';">
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
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" referrerpolicy="no-referrer" onerror="this.src='/placeholder.png';">
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
        } else if (tab === 'player-open') {
      if (titleEl) titleEl.textContent = '🎴 Your Open Zone (Removed from Game)';
      if (subEl) subEl.textContent = `Cards placed face-up in the Open Zone (e.g. from Accel abilities). Can be summoned normally during your Main Step! (${pOpenCards.length} Open Card${pOpenCards.length === 1 ? '' : 's'})`;
      if (!pOpenCards.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🎴</div>
            <div class="zone-empty-text">Your Open Zone is Empty</div>
            <div class="zone-empty-subtext">When Spirit or Brave cards activate their [Accel] abilities from hand, they are placed face-up in the Open Zone instead of Trash.</div>
          </div>
        `;
      } else {
        const isMain = DuelState.activePlayer === 'player' && DuelState.phases[DuelState.phaseIndex] === 'MAIN';
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${pOpenCards.map(c => {
              const effCost = getCardEffectiveCost(c, 'player');
              const canAfford = (DuelState.player.reserve || 0) >= (effCost + 1);
              const actionBtn = isMain
                ? (canAfford
                    ? `<button onclick="event.stopPropagation(); BattleArena.summonCardFromOpen('${c.uid}')" style="margin-top:6px;width:100%;background:linear-gradient(135deg,#f59e0b,#d97706);border:1px solid #fbbf24;color:#fff;border-radius:6px;padding:5px 8px;font-size:0.75rem;cursor:pointer;font-weight:700;">⚔️ Summon (${effCost})</button>`
                    : `<button disabled style="margin-top:6px;width:100%;background:#334155;border:1px solid #475569;color:#94a3b8;border-radius:6px;padding:5px 8px;font-size:0.72rem;">⚠️ Need ${effCost + 1} Cores</button>`)
                : `<span style="font-size:0.72rem;color:#94a3b8;display:block;margin-top:6px;text-align:center;">Main Step Only</span>`;
              return `
                <div class="zone-card-item" style="border:1.5px solid #f59e0b;">
                  <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" referrerpolicy="no-referrer" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" onerror="this.src='/placeholder.png';">
                  <div class="zone-card-info">
                    <div class="zone-card-name" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')">${c.name}</div>
                    <div class="zone-card-sub">
                      <span>${c.type || 'Card'}</span>
                      <span style="color:#fbbf24;font-weight:700;">Cost ${c.cost ?? 0}</span>
                    </div>
                    ${actionBtn}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
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
                <img src="${n.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${n.name}" referrerpolicy="no-referrer" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')" onerror="this.src='/placeholder.png';">
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
                <img src="${n.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${n.name}" referrerpolicy="no-referrer" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')" onerror="this.src='/placeholder.png';">
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
        const lvlMatch = b.match(/(?:(?:^|\s)(?:\[(?:During Advent|When Braved|During Brave|During Set)\]\s*)?((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+))/i);
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


  // ── ONLINE 1v1 MULTIPLAYER & 8-DIGIT DUELIST ID CONTROLLER ──
  let activeArenaMode = 'ai';
  let trackedDuelistId = null;

  function switchArenaMode(mode) {
    activeArenaMode = mode;
    const tabAi = document.getElementById('tabModeAi');
    const tabPvp = document.getElementById('tabModePvp');
    const lobbyAi = document.getElementById('battleLobby');
    const lobbyPvp = document.getElementById('onlinePvpLobby');

    if (mode === 'pvp') {
      if (tabAi) tabAi.classList.remove('active');
      if (tabPvp) tabPvp.classList.add('active');
      if (lobbyAi) lobbyAi.style.display = 'none';
      if (lobbyPvp) lobbyPvp.classList.add('active');
      initPvpLobbyView();
    } else {
      if (tabPvp) tabPvp.classList.remove('active');
      if (tabAi) tabAi.classList.add('active');
      if (lobbyPvp) lobbyPvp.classList.remove('active');
      if (lobbyAi) lobbyAi.style.display = 'block';
    }
  }

  function initPvpLobbyView() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const myIdEl = document.getElementById('myDuelistIdVal');
    const myNameEl = document.getElementById('pvpDuelistName');
    const authBtn = document.getElementById('btnGoogleAuth');
    const badgeEl = document.getElementById('pvpAuthStatusBadge');

    if (window.FirebaseService) {
      const user = window.FirebaseService.getUser();
      if (user && myNameEl) {
        myNameEl.textContent = user.displayName || user.email || 'Duelist Challenger';
      }
      const dId = window.FirebaseService.getFormattedDuelistId();
      if (dId && myIdEl) myIdEl.textContent = dId;

      if (authBtn) {
        if (user && !user.isAnonymous) {
          authBtn.textContent = '🚪 Sign Out';
          authBtn.title = `Signed in as ${user.email || user.displayName}`;
        } else {
          authBtn.textContent = '🔑 Google Sign-In';
          authBtn.title = 'Link your account with Google';
        }
      }

      if (badgeEl) {
        badgeEl.textContent = '🟢 Online';
        badgeEl.style.background = 'rgba(34,197,94,0.2)';
        badgeEl.style.color = '#4ade80';
      }
    }
    populatePvpDeckSelects();
  }

  async function handleAuthClick() {
    if (!window.FirebaseService) return;
    const user = window.FirebaseService.getUser();
    if (user && !user.isAnonymous) {
      if (confirm(`Currently signed in as ${user.displayName || user.email}.\nDo you want to sign out?`)) {
        await window.FirebaseService.logout();
        if (typeof showToast === 'function') showToast('Signed out successfully.', 'info');
      }
    } else {
      try {
        if (typeof showToast === 'function') showToast('Connecting Google Sign-In...', 'info');
        await window.FirebaseService.loginWithGoogle();
        if (typeof showToast === 'function') showToast('✨ Successfully connected Google Account!', 'success');
      } catch (e) {
        if (typeof showToast === 'function') showToast(`Sign-in note: ${e.message}`, 'error');
      }
    }
  }

  function populatePvpDeckSelects() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function' || typeof document.createElement !== 'function') return;
    const hostSel = document.getElementById('pvpHostDeckSelect');
    const joinSel = document.getElementById('pvpJoinDeckSelect');
    const registered = (window.DeckManager && window.DeckManager.getRegisteredDecks) ? window.DeckManager.getRegisteredDecks() : [];

    [hostSel, joinSel].forEach(sel => {
      if (!sel || typeof sel.appendChild !== 'function') return;
      sel.innerHTML = '';
      if (registered && registered.length > 0) {
        registered.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = `🃏 ${d.name} (${d.cardCount || 40} Cards)`;
          sel.appendChild(opt);
        });
      } else {
        const stdOptions = [
          { val: 'deck_std_red', label: '🔴 Red: Hero Dragon (Standard)' },
          { val: 'deck_std_purple', label: '🟣 Purple: Netherworld (Standard)' },
          { val: 'deck_std_green', label: '🟢 Green: Emerald Gale (Standard)' },
          { val: 'deck_std_white', label: '⚪ White: Armed Fortress (Standard)' },
          { val: 'deck_std_yellow', label: '🟡 Yellow: Celestial Symphony (Standard)' },
          { val: 'deck_std_blue', label: '🔵 Blue: Colosseum Titans (Standard)' }
        ];
        stdOptions.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.val;
          opt.textContent = s.label;
          sel.appendChild(opt);
        });
      }
    });
  }

  function copyMyDuelistId() {
    let id = '8492-0153';
    if (window.FirebaseService) {
      id = window.FirebaseService.getFormattedDuelistId() || id;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        if (typeof showToast === 'function') showToast(`📋 Copied Duelist ID #${id} to clipboard!`, 'success');
      });
    }
  }

  let trackedDuelistObj = null;

  async function findDuelist() {
    const input = document.getElementById('trackerInputId');
    if (!input || !input.value.trim()) return;
    const rawId = input.value.trim().replace(/[^0-9]/g, '');
    if (rawId.length !== 8) {
      if (typeof showToast === 'function') showToast('Please enter an 8-digit Duelist ID (e.g. 8492-0153)', 'warning');
      return;
    }

    let duelist = null;
    if (window.FirebaseService && window.FirebaseService.lookupDuelist) {
      try {
        const res = await window.FirebaseService.lookupDuelist(rawId);
        if (res.success && res.duelist) {
          duelist = res.duelist;
        }
      } catch (e) {}
    }

    const formatted = rawId.slice(0, 4) + '-' + rawId.slice(4);
    if (!duelist) {
      duelist = {
        id: rawId,
        formattedId: formatted,
        username: `Duelist #${formatted}`,
        avatar: '⚔️'
      };
    }

    trackedDuelistId = duelist.id;
    trackedDuelistObj = duelist;

    const resBox = document.getElementById('trackerResultBox');
    const nameEl = document.getElementById('trackResultName');
    const statsEl = document.getElementById('trackResultStats');

    if (nameEl) nameEl.textContent = `${duelist.username} (#${duelist.formattedId || formatted})`;
    if (statsEl) statsEl.textContent = '🟢 Ready to Duel';
    if (resBox) resBox.style.display = 'block';
    if (typeof showToast === 'function') showToast(`Found Duelist ${duelist.username}!`, 'success');
  }

  function addTrackedFriend() {
    if (!trackedDuelistObj) return;
    if (window.DuelistSocial) {
      const res = window.DuelistSocial.addFriend({
        id: trackedDuelistObj.id,
        formattedId: trackedDuelistObj.formattedId,
        name: trackedDuelistObj.username,
        avatar: trackedDuelistObj.avatar || '⚔️'
      });
      if (res.success) {
        if (typeof showToast === 'function') showToast(`🤝 Added ${trackedDuelistObj.username} to your friends!`, 'success');
      } else {
        if (typeof showToast === 'function') showToast(res.error || 'Could not add friend', 'warning');
      }
    }
  }

  function challengeTrackedDuelist() {
    if (!trackedDuelistId) return;
    hostOnlineDuel(trackedDuelistId);
  }

  async function hostOnlineDuel(targetId = null) {
    const sel = document.getElementById('pvpHostDeckSelect');
    const deckId = sel ? sel.value : 'deck_std_red';
    const deck = (window.DeckManager && window.DeckManager.getDeckById) ? window.DeckManager.getDeckById(deckId) : { name: 'Standard Red' };

    if (window.MultiplayerService) {
      try {
        const { roomId } = await window.MultiplayerService.createRoom(deck, targetId);
        const modal = document.getElementById('pvpWaitingModal');
        const codeEl = document.getElementById('pvpWaitingRoomCode');
        if (codeEl) codeEl.textContent = roomId;
        if (modal) modal.style.display = 'flex';

        window.addEventListener('bse_opponent_joined', (e) => {
          if (modal) modal.style.display = 'none';
          if (typeof showToast === 'function') showToast(`⚔️ Opponent "${e.detail.name}" joined the duel!`, 'success');
          startOnlineDuelMatch(deckId, e.detail.deck, true);
        }, { once: true });
      } catch (err) {
        if (typeof showToast === 'function') showToast(`Failed to host room: ${err.message}`, 'error');
      }
    }
  }

  async function joinOnlineDuel() {
    const codeInput = document.getElementById('pvpJoinRoomCode');
    const sel = document.getElementById('pvpJoinDeckSelect');
    if (!codeInput || !codeInput.value.trim()) {
      if (typeof showToast === 'function') showToast('Please enter a 6-letter room code (e.g. BSE-7492)', 'warning');
      return;
    }
    const roomCode = codeInput.value.trim().toUpperCase();
    const deckId = sel ? sel.value : 'deck_std_blue';
    const deck = (window.DeckManager && window.DeckManager.getDeckById) ? window.DeckManager.getDeckById(deckId) : { name: 'Standard Blue' };

    if (window.MultiplayerService) {
      try {
        const { roomId, host } = await window.MultiplayerService.joinRoom(roomCode, deck);
        if (typeof showToast === 'function') showToast(`Connected to ${host.name}'s room! Entering battle...`, 'success');
        startOnlineDuelMatch(deckId, host.deck, false);
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'error');
      }
    }
  }

  function cancelHostRoom() {
    const modal = document.getElementById('pvpWaitingModal');
    if (modal) modal.style.display = 'none';
    if (window.MultiplayerService) window.MultiplayerService.leaveRoom();
    if (typeof showToast === 'function') showToast('Cancelled duel room.', 'info');
  }

  function copyRoomLink() {
    const codeEl = document.getElementById('pvpWaitingRoomCode');
    const code = codeEl ? codeEl.textContent : '';
    const link = `${window.location.origin}/arena?room=${encodeURIComponent(code)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        if (typeof showToast === 'function') showToast('📋 Copied direct room link to clipboard!', 'success');
      });
    }
  }

  function startOnlineDuelMatch(playerDeckId, opponentDeckOrId, isHostRole) {
    DuelState.isOnline = true;
    DuelState.isHost = isHostRole;

    startDuel(playerDeckId, opponentDeckOrId);

    if (window.MultiplayerService) {
      window.MultiplayerService.onOpponentAction((action) => {
        handleIncomingMultiplayerAction(action);
      });
    }
  }

  function handleIncomingMultiplayerAction(action) {
    if (!action || !action.type) return;
    const { type, payload } = action;

    if (type === 'ATTACK_DECLARE') {
      const attackerName = payload.attackerName || 'Opposing Spirit';
      addLog(`⚔️ **ONLINE OPPONENT STRIKE**: Opponent declared attack with "${attackerName}"!`, 'damage');
      if (typeof AudioFX !== 'undefined' && AudioFX.slash) AudioFX.slash();
      if (typeof openBlockPromptModal === 'function') {
        openBlockPromptModal(payload.attacker);
      }
    } else if (type === 'BLOCK_DECLARE') {
      const blockerName = payload.blockerName || 'Opposing Spirit';
      addLog(`🛡️ **ONLINE OPPONENT BLOCK**: Opponent blocked with "${blockerName}"!`, 'damage');
    } else if (type === 'FLASH_CAST') {
      addLog(`✨ **ONLINE OPPONENT FLASH**: Opponent channeled "${payload.magicName}"!`, 'magic');
      if (typeof AudioFX !== 'undefined' && AudioFX.magic) AudioFX.magic();
    } else if (type === 'STEP_ADVANCE') {
      addLog(`⏩ **STEP ADVANCE**: Opponent advanced to ${payload.step} Step.`, 'step');
    } else if (type === 'LIFE_DAMAGE') {
      DuelState.opponent.life = payload.remainingLife;
      if (typeof AudioFX !== 'undefined' && AudioFX.lifeDamage) AudioFX.lifeDamage();
      renderDuelTable();
      checkGameOver();
    }
  }

  window.BattleArena = {
    switchMode: switchArenaMode,
    copyMyDuelistId,
    trackDuelist: findDuelist,
    findDuelist,
    addTrackedFriend,
    challengeTrackedDuelist,
    hostOnlineDuel,
    joinOnlineDuel,
    cancelHostRoom,
    copyRoomLink,
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
    calculateSymbolReduction,
        promptChoiceModal,
    summonCardFromOpen,
    checkHandOnUltimateSummon,
    isContractPartnerCard,
    promptUniversalTargetModal,
    dispatchContinuousRules,
    canSetMirage,
    setMirage,
    canCastAccel,
    castAccel,
    triggerUTrigger,
    getCardEffectiveCost,
    validateUltimateSummonCondition,
    getFriendlySymbols,
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
    summonBraveAsSpirit,
    openBraveCombineModal,
    braveOntoSpirit,
    separateBrave,
    isBraveCard,
    parseBraveBonus,
    isEligibleBraveHost,
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
    openCardDetailContext,
    sendToTrash,
    executeWhenSummonedEffects,
    executeAbilityActions,
    activateBurst,
    confirmStartingHandAndBegin,
    performMulligan,
    openPartnerSelectionModal,
    closePartnerModal,
    selectContractPartner,
    executeUltimateTrigger,
    canUnitAttack,
    canUnitBlock,
    keepStartingHand,
    executeMulligan: performMulligan,
    confirmOpeningHand: keepStartingHand,
    promptCumulativeCostTargetModal,
    endTurn,
    renderPlayerHand,
    loadCardEffectsDB,
    safeEndOpponentTurn,
    handleAuthClick
};

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBattleArena);
  } else {
    initBattleArena();
  // Check if opened with ?duelWith=
  if (typeof window !== 'undefined' && window.location && window.location.search && typeof URLSearchParams !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const duelWithParam = urlParams.get('duelWith');
    if (duelWithParam) {
      setTimeout(() => {
        const input = document.getElementById('trackerInputId');
        if (input) {
          input.value = duelWithParam.slice(0, 4) + '-' + duelWithParam.slice(4);
          findDuelist();
        }
      }, 400);
    }
  }
  }

})();
