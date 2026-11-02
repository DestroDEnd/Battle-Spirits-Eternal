/**
 * compiler/keyword_compiler.js
 * 
 * Recognizes Battle Spirits named keywords, extracts parameters,
 * and maps them to keyword registry hooks.
 */

export const KEYWORD_CATALOG = {
  // Wave 1: Core Mechanics
  'Advent': { wave: 1, hook: 'advent' },
  'Contract Advent': { wave: 1, hook: 'contract_advent' },
  'Final Contract Advent': { wave: 1, hook: 'final_contract_advent' },
  'Burst': { wave: 1, hook: 'burst' },
  'Brave': { wave: 1, hook: 'brave' },
  'Clash': { wave: 1, hook: 'clash' },
  'True-Clash': { wave: 1, hook: 'clash' },
  'Supreme Clash': { wave: 1, hook: 'clash' },
  'Ultra Clash': { wave: 1, hook: 'clash' },
  'Crush': { wave: 1, hook: 'crush' },
  'Great Crush': { wave: 1, hook: 'crush' },
  'Wave Crush': { wave: 1, hook: 'crush' },
  'XV Crush': { wave: 1, hook: 'crush' },
  'Curse': { wave: 1, hook: 'curse' },
  'True-Curse': { wave: 1, hook: 'curse' },
  'Holy Life': { wave: 1, hook: 'holy_life' },
  'Ultra Holy Life': { wave: 1, hook: 'holy_life' },
  'Divine Holy Life': { wave: 1, hook: 'holy_life' },
  'Awaken': { wave: 1, hook: 'awaken' },
  'True-Awaken': { wave: 1, hook: 'awaken' },
  'Dragon Awaken': { wave: 1, hook: 'awaken' },
  'Twinkle Awaken': { wave: 1, hook: 'twinkle_awaken' },
  'Assault': { wave: 1, hook: 'assault' },
  'Great Assault': { wave: 1, hook: 'assault' },
  'Grand Assault': { wave: 1, hook: 'assault' },
  'Windstorm': { wave: 1, hook: 'windstorm' },
  'Fierce Windstorm': { wave: 1, hook: 'windstorm' },
  'Whirlwind': { wave: 1, hook: 'windstorm' },
  'Consecutive Blade': { wave: 1, hook: 'consecutive_blade' },
  'Rekka Consecutive Blade': { wave: 1, hook: 'consecutive_blade' },
  'Immortality': { wave: 1, hook: 'immortality' },
  'Tribute': { wave: 1, hook: 'tribute' },
  'Rush': { wave: 1, hook: 'rush' },
  'Charge': { wave: 1, hook: 'charge' },
  'Armor': { wave: 1, hook: 'armor' },
  'Heavy Armor': { wave: 1, hook: 'heavy_armor' },
  'Ultra Armor': { wave: 1, hook: 'ultra_armor' },

  // Wave 2: Modern Mechanics
  'Accel': { wave: 2, hook: 'accel' },
  'Mirage': { wave: 2, hook: 'mirage' },
  'Change': { wave: 2, hook: 'change' },
  'Core Charge': { wave: 2, hook: 'core_charge' },
  'Grand Skill': { wave: 2, hook: 'grand_skill' },
  'Grand Field': { wave: 2, hook: 'grand_field' },
  'Release': { wave: 2, hook: 'release' },
  'Contract': { wave: 2, hook: 'contract' },
  'Soul State': { wave: 2, hook: 'soul_state' },
  'Contract Pre-Advent': { wave: 2, hook: 'contract_pre_advent' },
  'Contract Field': { wave: 2, hook: 'contract_field' },
  'Contract Skill': { wave: 2, hook: 'contract_skill' },
  'Contract Unleash': { wave: 2, hook: 'contract_unleash' },
  'Rebirth': { wave: 2, hook: 'rebirth' },
  'High Speed': { wave: 2, hook: 'high_speed' },
  'Violent High Speed': { wave: 2, hook: 'violent_high_speed' },
  'Show Up': { wave: 2, hook: 'show_up' },

  // Wave 3: Ultimate Triggers & Collab Mechanics
  'Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'U-Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Double Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Triple Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Quadruple Ultimate Trigger': { wave: 3, hook: 'ultimate_trigger' },
  'Critical Hit': { wave: 3, hook: 'critical_hit' },
  'Double Hit': { wave: 3, hook: 'double_hit' },
  'Triple Hit': { wave: 3, hook: 'triple_hit' },
  'Quadruple Hit': { wave: 3, hook: 'quadruple_hit' },
  'Brilliance': { wave: 3, hook: 'brilliance' },
  'A.T. Field': { wave: 3, hook: 'at_field' },
  'PS Armor': { wave: 3, hook: 'ps_armor' },
  'Song': { wave: 3, hook: 'song' },
  'Vision': { wave: 3, hook: 'vision' },
  'Seal': { wave: 3, hook: 'seal' },
  'Unleash': { wave: 3, hook: 'unleash' }
};

export function extractKeywords(text) {
  if (!text) return [];

  const found = [];
  const seen = new Set();

  // 1. Bracketed keyword pattern: [Keyword: Param] or [Keyword]
  const bracketRegex = /\[([A-Za-z0-9\.\-\s]+?)(?::\s*([^\]]+))?\]/g;
  let match;
  while ((match = bracketRegex.exec(text))) {
    const rawName = match[1].trim();
    const param = match[2] ? match[2].trim() : null;

    // Check if rawName matches any catalog entry
    for (const [kwName, meta] of Object.entries(KEYWORD_CATALOG)) {
      if (rawName.toLowerCase() === kwName.toLowerCase() || rawName.toLowerCase().startsWith(kwName.toLowerCase())) {
        const key = `${kwName}:${param || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({
            name: kwName,
            parameter: param,
            wave: meta.wave,
            hook: meta.hook,
            bracketed: true
          });
        }
      }
    }
  }

  // 2. Armor / Heavy Armor special check: "Heavy Armor: Red", "Armor: Purple/White"
  const armorRegex = /\b(Heavy Armor|Ultra Armor|Armor):\s*([A-Za-z\/]+)\b/gi;
  while ((match = armorRegex.exec(text))) {
    const kwName = match[1].trim();
    const colors = match[2].trim();
    const key = `${kwName}:${colors}`;
    if (!seen.has(key)) {
      seen.add(key);
      const meta = KEYWORD_CATALOG[kwName] || { wave: 1, hook: 'armor' };
      found.push({
        name: kwName,
        parameter: colors,
        wave: meta.wave,
        hook: meta.hook,
        bracketed: false
      });
    }
  }

  return found;
}
