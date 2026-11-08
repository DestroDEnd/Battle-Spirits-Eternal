/**
 * compiler/keyword_compiler.js
 * 
 * Recognizes Battle Spirits named keywords, extracts parameters,
 * and maps them to keyword registry hooks.
 * Supports Ver 17.0 keyword stacking (distinct bracketed occurrences preserved).
 */

export const KEYWORD_CATALOG = {
  // Wave 1: Core Combat & Armor Mechanics
  'Clash': { wave: 1, hook: 'clash' },
  'True-Clash': { wave: 1, hook: 'clash' },
  'Supreme Clash': { wave: 1, hook: 'clash' },
  'Ultra Clash': { wave: 1, hook: 'clash' },
  'Clash X': { wave: 1, hook: 'clash' },
  'Crush': { wave: 1, hook: 'crush' },
  'Great Crush': { wave: 1, hook: 'crush' },
  'Wave Crush': { wave: 1, hook: 'crush' },
  'XV Crush': { wave: 1, hook: 'crush' },
  'Curse': { wave: 1, hook: 'curse' },
  'True-Curse': { wave: 1, hook: 'curse' },
  'Grudging Curse': { wave: 1, hook: 'curse' },
  'Holy Life': { wave: 1, hook: 'holy_life' },
  'Ultra Holy Life': { wave: 1, hook: 'holy_life' },
  'Divine Holy Life': { wave: 1, hook: 'holy_life' },
  'Chaotic Holy Life': { wave: 1, hook: 'holy_life' },
  'Heaven Holy Life': { wave: 1, hook: 'holy_life' },
  'Awaken': { wave: 1, hook: 'awaken' },
  'True-Awaken': { wave: 1, hook: 'awaken' },
  'Ultra Awaken': { wave: 1, hook: 'awaken' },
  'Dragon Awaken': { wave: 1, hook: 'awaken' },
  'Sol Awaken': { wave: 1, hook: 'awaken' },
  'Toppa Awaken': { wave: 1, hook: 'awaken' },
  'Twinkle Awaken': { wave: 1, hook: 'twinkle_awaken' },
  'Contract Awaken': { wave: 1, hook: 'awaken' },
  'Crimson Awaken': { wave: 1, hook: 'awaken' },
  'Silver Awaken': { wave: 1, hook: 'awaken' },
  'Assault': { wave: 1, hook: 'assault' },
  'Great Assault': { wave: 1, hook: 'assault' },
  'Grand Assault': { wave: 1, hook: 'assault' },
  'Dark Assault': { wave: 1, hook: 'assault' },
  'Windstorm': { wave: 1, hook: 'windstorm' },
  'Fierce Windstorm': { wave: 1, hook: 'windstorm' },
  'Whirlwind': { wave: 1, hook: 'whirlwind' },
  'Consecutive Blade': { wave: 1, hook: 'consecutive_blade' },
  'True-Consecutive Blade': { wave: 1, hook: 'consecutive_blade' },
  'Rekka Consecutive Blade': { wave: 1, hook: 'consecutive_blade' },
  'Armor': { wave: 1, hook: 'armor' },
  'Heavy Armor': { wave: 1, hook: 'heavy_armor' },
  'Ultra Armor': { wave: 1, hook: 'ultra_armor' },
  'Ultra Heavy Armor': { wave: 1, hook: 'ultra_heavy_armor' },
  'Knight Armor': { wave: 1, hook: 'armor' },
  'Contract Armor': { wave: 1, hook: 'armor' },
  'Count Armor': { wave: 1, hook: 'armor' },
  'Aurora Armor': { wave: 1, hook: 'armor' },

  // Wave 2: Era, Cast & Zone Mechanics
  'Advent': { wave: 2, hook: 'advent' },
  'Contract Advent': { wave: 2, hook: 'contract_advent' },
  'Grand Advent': { wave: 2, hook: 'grand_advent' },
  'Reverse Contract Advent': { wave: 2, hook: 'contract_advent' },
  'Ultra Contract Advent': { wave: 2, hook: 'contract_advent' },
  'Final Contract Advent': { wave: 2, hook: 'contract_advent' },
  'Soul State': { wave: 2, hook: 'soul_state' },
  'Contract Pre-Advent': { wave: 2, hook: 'contract_pre_advent' },
  'Contract': { wave: 2, hook: 'contract' },
  'Burst': { wave: 2, hook: 'burst' },
  'Soul Burst': { wave: 2, hook: 'burst' },
  'Burst Seal': { wave: 2, hook: 'burst' },
  'Mirage': { wave: 2, hook: 'mirage' },
  'Mirage Boost': { wave: 2, hook: 'mirage' },
  'Mirage Drain': { wave: 2, hook: 'mirage' },
  'Mirage Flash': { wave: 2, hook: 'mirage' },
  'Mirage Trance': { wave: 2, hook: 'mirage' },
  'Mirage Synchro': { wave: 2, hook: 'mirage' },
  'Accel': { wave: 2, hook: 'accel' },
  'Change': { wave: 2, hook: 'change' },
  'High Speed': { wave: 2, hook: 'high_speed' },
  'Violent High Speed': { wave: 2, hook: 'violent_high_speed' },
  'Absolute Sound Speed': { wave: 2, hook: 'high_speed' },
  'Sound Speed': { wave: 2, hook: 'sound_speed' },
  'Flashing Swift': { wave: 2, hook: 'high_speed' },
  'Soul Swift': { wave: 2, hook: 'high_speed' },
  'Thunder Swift': { wave: 2, hook: 'high_speed' },
  'Rebirth': { wave: 2, hook: 'rebirth' },
  'Six Heaven Rebirth': { wave: 2, hook: 'rebirth' },
  'Sortie Rebirth': { wave: 2, hook: 'rebirth' },
  'Zero Rebirth': { wave: 2, hook: 'rebirth' },
  'Absolute Rebirth': { wave: 2, hook: 'rebirth' },
  'Illusive Rebirth': { wave: 2, hook: 'rebirth' },
  'Seal': { wave: 2, hook: 'seal' },
  'Super Seal': { wave: 2, hook: 'seal' },
  'Pyroxene Seal': { wave: 2, hook: 'seal' },
  'Constellation Seal': { wave: 2, hook: 'seal' },
  'Twinkle Seal': { wave: 2, hook: 'seal' },
  'Sky Seal': { wave: 2, hook: 'seal' },
  'Moonlight Seal': { wave: 2, hook: 'seal' },
  'Rush': { wave: 2, hook: 'rush' },
  'Six Heaven Rush': { wave: 2, hook: 'rush' },
  'Six Pentan Rush': { wave: 2, hook: 'rush' },
  'Charge': { wave: 2, hook: 'charge' },
  'Catalyze': { wave: 2, hook: 'catalyze' },
  'True Catalyze': { wave: 2, hook: 'catalyze' },
  'War Catalyze': { wave: 2, hook: 'catalyze' },
  'Twinkle Catalyze': { wave: 2, hook: 'catalyze' },
  'Unleash': { wave: 2, hook: 'unleash' },
  'Contract Unleash': { wave: 2, hook: 'contract_unleash' },
  'Celestial Unleash': { wave: 2, hook: 'unleash' },
  'Super Unleash': { wave: 2, hook: 'unleash' },
  'Absolute Unleash': { wave: 2, hook: 'unleash' },
  'Astral Unleash': { wave: 2, hook: 'unleash' },
  'Kamiumi Unleash': { wave: 2, hook: 'unleash' },
  'Yomi Unleash': { wave: 2, hook: 'unleash' },
  'Dark Unleash': { wave: 2, hook: 'unleash' },
  'Nether Unleash': { wave: 2, hook: 'unleash' },
  'Flame Unleash': { wave: 2, hook: 'unleash' },
  'Ice Unleash': { wave: 2, hook: 'unleash' },
  'Moon Unleash': { wave: 2, hook: 'unleash' },
  'Thunder Unleash': { wave: 2, hook: 'unleash' },
  'Chaos Unleash': { wave: 2, hook: 'unleash' },
  'Silver Arm Unleash': { wave: 2, hook: 'unleash' },
  'Time Unleash': { wave: 2, hook: 'unleash' },

  // Wave 3: Ultimates, Braves & Grandwalkers
  'Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'U-Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Double Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Triple Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Quadruple Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Octa Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Count Ultimate Trigger': { wave: 3, hook: 'count_ultimate_trigger' },
  'Double Count Ultimate Trigger': { wave: 3, hook: 'count_ultimate_trigger' },
  'Cross Ultimate Trigger': { wave: 3, hook: 'cross_ultimate_trigger' },
  'Critical Hit': { wave: 3, hook: 'critical_hit' },
  'Double Hit': { wave: 3, hook: 'double_hit' },
  'Triple Hit': { wave: 3, hook: 'triple_hit' },
  'Quadruple Hit': { wave: 3, hook: 'quadruple_hit' },
  'Trigger Counter': { wave: 3, hook: 'trigger_counter' },
  'Soul Drive': { wave: 3, hook: 'soul_drive' },
  'Light-Dark Soul Drive': { wave: 3, hook: 'soul_drive' },
  'Spirit Soul': { wave: 3, hook: 'spirit_soul' },
  'Core Charge': { wave: 3, hook: 'core_charge' },
  'Neo-Core Charge': { wave: 3, hook: 'neo_core_charge' },
  'Release': { wave: 3, hook: 'release' },
  'Grand Skill': { wave: 3, hook: 'grand_skill' },
  'Grand Field': { wave: 3, hook: 'grand_field' },
  'Grandphosis': { wave: 3, hook: 'grandphosis' },
  'Grand Mystery': { wave: 3, hook: 'grand_mystery' },
  'Contract Skill': { wave: 3, hook: 'contract_skill' },
  'Contract Field': { wave: 3, hook: 'contract_field' },
  'Revive': { wave: 3, hook: 'revive' },
  'Brave': { wave: 3, hook: 'brave' },
  'Brave Engage': { wave: 3, hook: 'brave' },
  'Double Drive': { wave: 3, hook: 'double_drive' },
  'Reload': { wave: 3, hook: 'reload' },
  'Contract Reload': { wave: 3, hook: 'reload' },
  'Brilliance': { wave: 3, hook: 'brilliance' },
  'A.T. Field': { wave: 3, hook: 'at_field' },
  'G.A.T. Field': { wave: 3, hook: 'at_field' },
  'PS Armor': { wave: 3, hook: 'ps_armor' },
  'VPS Armor': { wave: 3, hook: 'ps_armor' },
  'TP Armor': { wave: 3, hook: 'ps_armor' },
  'MD Armor': { wave: 3, hook: 'ps_armor' },
  'Type: Song': { wave: 3, hook: 'song' },
  'Type: Field': { wave: 3, hook: 'field_type' },
  'Type: Flower': { wave: 3, hook: 'flower_type' },
  'Type: Vision': { wave: 3, hook: 'vision_type' },

  // Wave 4: Advanced Color Mechanics
  'Immortality': { wave: 4, hook: 'immortality' },
  'Nether Immortality': { wave: 4, hook: 'immortality' },
  'Illusive Immortality': { wave: 4, hook: 'immortality' },
  'Tribute': { wave: 4, hook: 'tribute' },
  'Burst Tribute': { wave: 4, hook: 'tribute' },
  'Unsheathe': { wave: 4, hook: 'unsheathe' },
  'Great Unsheathe': { wave: 4, hook: 'unsheathe' },
  'Ultimate Unsheathe': { wave: 4, hook: 'unsheathe' },
  'Bombardment': { wave: 4, hook: 'bombardment' },
  'Twinkle Bombardment': { wave: 4, hook: 'bombardment' },
  'Grand Bombardment': { wave: 4, hook: 'bombardment' },
  'Thunder God Bombardment': { wave: 4, hook: 'bombardment' },
  'Bombardment-Zero': { wave: 4, hook: 'bombardment' },
  'Bombardment-D': { wave: 4, hook: 'bombardment' },
  'Pursuit': { wave: 4, hook: 'pursuit' },
  'Great Pursuit': { wave: 4, hook: 'pursuit' },
  'Showdown': { wave: 4, hook: 'showdown' },
  'Rekka Showdown': { wave: 4, hook: 'showdown' },
  'Poison Blade': { wave: 4, hook: 'poison_blade' },
  'Spellbind': { wave: 4, hook: 'spellbind' },
  'Twinkle Spellbind': { wave: 4, hook: 'spellbind' },
  'Spell Blight': { wave: 4, hook: 'spell_blight' },
  'Soar': { wave: 4, hook: 'soar' },
  'True-Soar': { wave: 4, hook: 'soar' },
  'Grand Soar': { wave: 4, hook: 'soar' },
  'Grand Twinkle Soar': { wave: 4, hook: 'soar' },
  'Thundering Soar': { wave: 4, hook: 'soar' },
  'Twinkle Soar': { wave: 4, hook: 'soar' },
  'Bunshin': { wave: 4, hook: 'bunshin' },
  'Ice Wall': { wave: 4, hook: 'ice_wall' },
  'Grand Ice Wall': { wave: 4, hook: 'ice_wall' },
  'Kagemusha': { wave: 4, hook: 'kagemusha' },
  'True-Kagemusha': { wave: 4, hook: 'kagemusha' },
  'Tenma-Kagemusha': { wave: 4, hook: 'kagemusha' },
  'Silver Wheel': { wave: 4, hook: 'silver_wheel' },
  'Excite': { wave: 4, hook: 'excite' },
  'Ultra Excite': { wave: 4, hook: 'excite' },
  'Load': { wave: 4, hook: 'load' },
  'Steel Load': { wave: 4, hook: 'load' },
  'Fast Draw': { wave: 4, hook: 'fast_draw' },
  'Dispersion': { wave: 4, hook: 'dispersion' },
  'Disp': { wave: 4, hook: 'dispersion' },
  'Summon Bolt': { wave: 4, hook: 'summon_bolt' },
  'AFO': { wave: 4, hook: 'afo' },
  'Stampede': { wave: 4, hook: 'stampede' },
  'Roaring Stampede': { wave: 4, hook: 'stampede' },
  'Fortress': { wave: 4, hook: 'fortress' },
  'True Fortress': { wave: 4, hook: 'fortress' },
  'Twinkle Fortress': { wave: 4, hook: 'fortress' },
  'Barrier': { wave: 4, hook: 'barrier' },
  'Leap': { wave: 4, hook: 'leap' },
  'Grand Leap': { wave: 4, hook: 'leap' },
  'Enchain': { wave: 4, hook: 'enchain' },
  'Plunder': { wave: 4, hook: 'plunder' },
  'Draw Lock': { wave: 4, hook: 'draw_lock' },
  'God-Army': { wave: 4, hook: 'god_army' },
  'Banner God-Army': { wave: 4, hook: 'god_army' },
  'God Strike': { wave: 4, hook: 'god_strike' },
  'Banner God Strike': { wave: 4, hook: 'god_strike' },
  'Hollow Sky': { wave: 4, hook: 'hollow_sky' },
  'Twinkle Necromancy': { wave: 4, hook: 'twinkle_necromancy' },
  'Evil Light': { wave: 4, hook: 'evil_light' },
  'Heavenly Light': { wave: 4, hook: 'heavenly_light' },
  'Mealtiply': { wave: 4, hook: 'mealtiply' },
  'Twinkle Revolution': { wave: 4, hook: 'twinkle_revolution' },
  'Zero Counter': { wave: 4, hook: 'zero_counter' },

  // Wave 5: Diva & Collaboration Mechanics
  'On Stage': { wave: 5, hook: 'on_stage' },
  'Aikatsu On Stage': { wave: 5, hook: 'on_stage' },
  'Show Up': { wave: 5, hook: 'show_up' },
  'Friend': { wave: 5, hook: 'friend' },
  'Appeal': { wave: 5, hook: 'appeal' },
  'Star Appeal': { wave: 5, hook: 'appeal' },
  'Fever Appeal': { wave: 5, hook: 'appeal' },
  'Constellation Appeal': { wave: 5, hook: 'appeal' },
  'Starlight Appeal': { wave: 5, hook: 'appeal' },
  'My Unit': { wave: 5, hook: 'my_unit' },
  'Solo Part': { wave: 5, hook: 'solo_part' },
  'Duet Part': { wave: 5, hook: 'duet_part' },
  'CoZ12 Part': { wave: 5, hook: 'coz12_part' },
  'Fleur Part': { wave: 5, hook: 'fleur_part' },
  'Contract Duet Part': { wave: 5, hook: 'duet_part' },
  'Diva Rush': { wave: 5, hook: 'diva_rush' },
  'Curtain Call': { wave: 5, hook: 'curtain_call' },
  'Chaos Stage': { wave: 5, hook: 'stage' },
  'Grand Stage': { wave: 5, hook: 'stage' },
  'Solo Stage': { wave: 5, hook: 'stage' },
  'Spellsong': { wave: 5, hook: 'spellsong' },
  'Team': { wave: 5, hook: 'team' },
  'Digivolution': { wave: 5, hook: 'digivolution' },
  'Super Digivolution': { wave: 5, hook: 'digivolution' },
  'DNA Digivolution': { wave: 5, hook: 'digivolution' },
  'Armor Digivolution': { wave: 5, hook: 'digivolution' },
  'Card Slash': { wave: 5, hook: 'card_slash' },
  'Trans-Am': { wave: 5, hook: 'trans_am' },
  'Clock Up': { wave: 5, hook: 'clock_up' },
  'Hyper Clock Up': { wave: 5, hook: 'clock_up' },
  'Cast Off': { wave: 5, hook: 'cast_off' },
  'Hyper Cast Off': { wave: 5, hook: 'cast_off' },
  'Chou Henshin': { wave: 5, hook: 'change' },
  'Form Change': { wave: 5, hook: 'change' },
  'Assemble': { wave: 5, hook: 'assemble' },
  'Funnel': { wave: 5, hook: 'funnel' },
  'Barrage': { wave: 5, hook: 'barrage' },
  'Bushido': { wave: 5, hook: 'bushido' },
  'Armed Intervention': { wave: 5, hook: 'armed_intervention' },
  'Exchange': { wave: 5, hook: 'exchange' },
  'NT-D': { wave: 5, hook: 'nt_d' },
  'Quantum Burst': { wave: 5, hook: 'quantum_burst' },
  'Top Gun': { wave: 5, hook: 'top_gun' },
  'Yata-no-Kagami': { wave: 5, hook: 'armor' },
  'Buddy': { wave: 5, hook: 'buddy' },
  'Time Vent': { wave: 5, hook: 'time_vent' },
  'Type: Driver': { wave: 5, hook: 'driver' },

  // Wave 6: 2026 Eternal & Cross-Format
  'Flag Contract Advent': { wave: 6, hook: 'flag_contract_advent' },
  'Seal Flag Contract Advent': { wave: 6, hook: 'flag_contract_advent' },
  'Legacy': { wave: 6, hook: 'legacy' },
  'Soul Magic': { wave: 6, hook: 'soul_magic' },
  'Amplify': { wave: 6, hook: 'amplify' },
  'Rumble': { wave: 6, hook: 'rumble' },
  'Current': { wave: 6, hook: 'current' },
  'Shamanism': { wave: 6, hook: 'shamanism' },
  'Level Up': { wave: 6, hook: 'level_up' },
  'Fish Troop': { wave: 6, hook: 'fish_troop' },
  'Camouflage': { wave: 6, hook: 'camouflage' },
  'Magirrate': { wave: 6, hook: 'magirrate' },
  'Ringing Charge': { wave: 6, hook: 'charge' },
  'Re Awaken': { wave: 6, hook: 'awaken' },
  'Soul Awaken': { wave: 6, hook: 'awaken' }
};

// Sort catalog keys by length descending so multi-word variants match before base names
const SORTED_CATALOG_KEYS = Object.keys(KEYWORD_CATALOG).sort((a, b) => b.length - a.length);

export function extractKeywords(text) {
  if (!text) return [];

  const found = [];

  // 1. Bracketed keyword pattern: [Keyword:: Param], [Keyword: Param], or [Keyword]
  const bracketRegex = /\[([A-Za-z0-9\.\-\s]+?)(?:::\s*([^\]]+)|:\s*([^\]]+))?\]/g;
  let match;
  while ((match = bracketRegex.exec(text))) {
    const rawName = match[1].trim();
    const param = (match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : null);
    const cleanedParam = param ? param.trim() : null;

    // Check against sorted catalog keys to match longest specific prefix/exact
    let matchedName = null;
    let meta = null;

    for (const kwName of SORTED_CATALOG_KEYS) {
      if (rawName.toLowerCase() === kwName.toLowerCase() || rawName.toLowerCase().startsWith(kwName.toLowerCase())) {
        matchedName = kwName;
        meta = KEYWORD_CATALOG[kwName];
        break;
      }
    }

    if (matchedName && meta) {
      found.push({
        name: matchedName,
        parameter: cleanedParam,
        wave: meta.wave,
        hook: meta.hook,
        bracketed: true,
        index: match.index
      });
    }
  }

  // 2. Armor / Heavy Armor unbracketed check: "Heavy Armor: Red", "Armor: Purple/White"
  const armorRegex = /\b(Heavy Armor|Ultra Heavy Armor|Ultra Armor|Armor):\s*([A-Za-z\/]+)\b/gi;
  while ((match = armorRegex.exec(text))) {
    const kwName = match[1].trim();
    const colors = match[2].trim();
    const idx = match.index;

    // Only add if not already captured at this exact text position
    const alreadyCaptured = found.some(f => Math.abs(f.index - idx) < 5);
    if (!alreadyCaptured) {
      const meta = KEYWORD_CATALOG[kwName] || { wave: 1, hook: 'armor' };
      found.push({
        name: kwName,
        parameter: colors,
        wave: meta.wave,
        hook: meta.hook,
        bracketed: false,
        index: idx
      });
    }
  }

  return found;
}

/**
 * Binds keywords to cards and their individual ability blocks,
 * attaching level gating, timing windows, faces, and conditions.
 */
export function bindKeywordsToAbilities(card, rawEffect = '', abilities = []) {
  const cardNumber = card.card_number || card.cardNumber || card.id || 'UNKNOWN';
  const defaultFace = card.face || (cardNumber.includes('-A') ? 'B' : cardNumber.endsWith('B') ? 'B' : 'A');

  const boundCardKeywords = [];

  for (let idx = 0; idx < abilities.length; idx++) {
    const ability = abilities[idx];
    const header = ability.header || {};
    const blockText = ability.rawText || header.cleanBody || '';

    // Extract keywords in this ability block
    const blockKeywords = extractKeywords(blockText);

    // If header has a recognized keyword that was stripped during header parsing
    if (header.keyword) {
      const headerKwRaw = header.keyword.split(':')[0].trim();
      const headerParam = header.keyword.includes(':') ? header.keyword.split(':').slice(1).join(':').trim() : null;
      const alreadyCaptured = blockKeywords.some(bk => bk.name.toLowerCase() === headerKwRaw.toLowerCase());
      if (!alreadyCaptured) {
        const meta = KEYWORD_CATALOG[headerKwRaw] || { wave: 1, hook: headerKwRaw.toLowerCase().replace(/[\s\-]+/g, '_') };
        blockKeywords.unshift({
          name: headerKwRaw,
          parameter: headerParam,
          wave: meta.wave,
          hook: meta.hook,
          bracketed: true,
          index: 0
        });
      }
    }

    // Also check prefixes for recognized keywords (e.g. Soul State, Contract Pre-Advent, etc.)
    if (Array.isArray(header.prefixes)) {
      for (const prefix of header.prefixes) {
        const prefixKwRaw = prefix.split(':')[0].trim();
        const prefixParam = prefix.includes(':') ? prefix.split(':').slice(1).join(':').trim() : null;
        for (const kwName of SORTED_CATALOG_KEYS) {
          if (prefixKwRaw.toLowerCase() === kwName.toLowerCase() || prefixKwRaw.toLowerCase().startsWith(kwName.toLowerCase())) {
            const alreadyCaptured = blockKeywords.some(bk => bk.name.toLowerCase() === kwName.toLowerCase());
            if (!alreadyCaptured) {
              const meta = KEYWORD_CATALOG[kwName];
              blockKeywords.unshift({
                name: kwName,
                parameter: prefixParam,
                wave: meta.wave,
                hook: meta.hook,
                bracketed: true,
                index: 0
              });
            }
            break;
          }
        }
      }
    }

    const prefixes = header.prefixes || [];
    const isRebornBlock = prefixes.some(p => /reborn|during rebirth/i.test(p)) || /when reborn|during rebirth/i.test(blockText);
    const blockFace = isRebornBlock ? 'B' : defaultFace;

    const abilityBoundKeywords = blockKeywords.map(kw => ({
      ...kw,
      abilityId: ability.id || `${cardNumber}#a${idx}`,
      cardNumber,
      levels: header.levels || [1, 2, 3],
      levelExplicit: Boolean(header.levelExplicit),
      timing: header.timing || 'PASSIVE',
      timingLabel: header.timingLabel || '',
      timingStep: header.timingStep || 'ANY',
      face: blockFace,
      prefixes,
      isSoulState: prefixes.some(p => /soul state/i.test(p)) || /\[soul state\]/i.test(blockText),
      duringAdvent: prefixes.some(p => /during advent/i.test(p)) || /\[during advent\]/i.test(blockText),
      duringSeal: prefixes.some(p => /during seal|when sealed/i.test(p)) || /\[during seal\]/i.test(blockText),
      burstCondition: header.burstCondition || null,
      limit: header.limit || null,
      isFlash: Boolean(header.isFlash),
      isMain: Boolean(header.isMain)
    }));

    ability.keywords = abilityBoundKeywords;
    boundCardKeywords.push(...abilityBoundKeywords);
  }

  return boundCardKeywords;
}
