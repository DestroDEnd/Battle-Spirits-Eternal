/**
 * engine/rules/saga_catalog.js
 *
 * Canonical taxonomy and resolver for the 17 official Battle Spirits generations (sagas),
 * matching the official VASSAL archives and chronological development eras.
 */

export const SAGA_DEFINITIONS = [
  {
    id: 'saga_01',
    name: '01 - Booster Set Saga',
    shortName: 'Booster Set Saga',
    era: '2008–2010',
    description: 'The foundational era of Battle Spirits, introducing Spirits, Nexuses, and Magics.',
    prefixes: ['BS01', 'BS02', 'BS03', 'BS04', 'BS05', 'BS06', 'BS07', 'BS08', 'BS09', 'SD01', 'SD02']
  },
  {
    id: 'saga_02',
    name: '02 - Constellation Saga',
    shortName: 'Constellation Saga',
    era: '2010–2011',
    description: 'Introduction of Braves (combining with Spirits) and the 12 Zodiac Apostles.',
    prefixes: ['BS10', 'BS11', 'BS12', 'BS13', 'SD03', 'SD04', 'SD05', 'BSC05']
  },
  {
    id: 'saga_03',
    name: '03 - Heroes Saga',
    shortName: 'Heroes Saga',
    era: '2011–2012',
    description: 'Introduction of Burst cards, Rush, Charge, and Tribute summoning.',
    prefixes: ['BS14', 'BS15', 'BS16', 'BS17', 'BS18', 'SD06', 'SD07', 'SD08', 'SD09', 'SD10', 'SD11', 'BSC06', 'BSC07', 'BSC08', 'BSC09', 'BSC10', 'BSC11', 'BSC12']
  },
  {
    id: 'saga_04',
    name: '04 - Sword Blade Saga',
    shortName: 'Sword Blade Saga',
    era: '2012–2013',
    description: 'The 12 Sword Braves, dark and light blades, and multi-symbol combos.',
    prefixes: ['BS19', 'BS20', 'BS21', 'BS22', 'BS23', 'SD12', 'SD13', 'SD14', 'SD15', 'SD16', 'SD17', 'BSC13', 'BSC14', 'BSC15', 'BSC16']
  },
  {
    id: 'saga_05',
    name: '05 - Ultimate Saga',
    shortName: 'Ultimate Saga',
    era: '2013–2015',
    description: 'Introduction of golden Ultimates, Ultimate Triggers (U-Trigger), and gold symbols.',
    prefixes: ['BS24', 'BS25', 'BS26', 'BS27', 'BS28', 'BS29', 'SD18', 'SD19', 'SD20', 'SD21', 'SD22', 'SD23', 'SD24', 'SD25', 'SD26', 'SD27', 'BSC17', 'BSC18', 'BSC19']
  },
  {
    id: 'saga_06',
    name: '06 - Soul Saga (Burning Legend)',
    shortName: 'Soul Saga',
    era: '2015–2016',
    description: 'Introduction of the Soul Core, Soul Burst, and Soul Drive mechanics.',
    prefixes: ['BS30', 'BS31', 'BS32', 'BS33', 'BS34', 'SD28', 'SD29', 'SD30', 'SD31', 'SD32', 'BSC20', 'BSC21', 'BSC22']
  },
  {
    id: 'saga_07',
    name: '07 - God King Saga',
    shortName: 'God King Saga',
    era: '2016–2017',
    description: 'The 12 God-Kings, Seal mechanics, and Spurred Acceleration (Z-Drive).',
    prefixes: ['BS35', 'BS36', 'BS37', 'BS38', 'BS39', 'SD33', 'SD34', 'SD35', 'SD36', 'BSC23', 'BSC24', 'BSC25', 'BSC26', 'BSC27']
  },
  {
    id: 'saga_08',
    name: '08 - Advent Saga',
    shortName: 'Advent Saga',
    era: '2017–2018',
    description: 'Introduction of Advent (Kourin) stacking Spirits on top of battle field units.',
    prefixes: ['BS40', 'BS41', 'BS42', 'BS43', 'SD37', 'SD38', 'SD39', 'SD40', 'BSC28', 'BSC29', 'BSC30']
  },
  {
    id: 'saga_09',
    name: '09 - God Advent / Dual Era',
    shortName: 'God Advent Saga',
    era: '2018–2019',
    description: 'Introduction of Grandwalker Nexuses and God Advent (Kami-Kourin).',
    prefixes: ['BS44', 'BS45', 'BS46', 'BS47', 'SD41', 'SD42', 'SD43', 'SD44', 'BSC31', 'BSC32', 'BSC33']
  },
  {
    id: 'saga_10',
    name: '10 - Ultra Advent Saga',
    shortName: 'Ultra Advent Saga',
    era: '2019–2020',
    description: 'GranStone Nexuses, Avatar Spirits, and Super-Advent evolution.',
    prefixes: ['BS48', 'BS49', 'BS50', 'BS51', 'SD45', 'SD46', 'SD47', 'SD48', 'SD49', 'SD50', 'BSC34', 'BSC35']
  },
  {
    id: 'saga_11',
    name: '11 - Rebirth Saga',
    shortName: 'Rebirth Saga',
    era: '2020–2021',
    description: 'Double-sided Rebirth (Tensei) cards flipping when trigger conditions are met.',
    prefixes: ['BS52', 'BS53', 'BS54', 'BS55', 'SD51', 'SD52', 'SD53', 'SD54', 'SD55', 'SD56', 'SD57', 'BSC36', 'BSC37']
  },
  {
    id: 'saga_12',
    name: '12 - True Rebirth Saga',
    shortName: 'True Rebirth Saga',
    era: '2021–2022',
    description: 'Mirage cards played into the Burst/Mirage zone, and Mirage-Rebirth combos.',
    prefixes: ['BS56', 'BS57', 'BS58', 'BS59', 'SD58', 'SD59', 'SD60', 'SD61', 'SD62', 'SD63', 'BSC38', 'BSC39']
  },
  {
    id: 'saga_13',
    name: '13 - Contract Saga',
    shortName: 'Contract Saga',
    era: '2022–2023',
    description: 'Partner Contracts, Count ramping, and Contract Advent mechanics.',
    prefixes: ['BS60', 'BS61', 'BS62', 'BS63', 'SD64', 'SD65', 'BSC40', 'BSC41']
  },
  {
    id: 'saga_14',
    name: '14 - Contract Saga: Realm',
    shortName: 'Contract Realm',
    era: '2023–2024',
    description: 'Realm Era with Ultimate Contracts, Extreme Zone, and Break-through tactics.',
    prefixes: ['BS64', 'BS65', 'BS66', 'BS67', 'SD66', 'SD67', 'BSC42', 'BSC43']
  },
  {
    id: 'saga_15',
    name: '15 - Contract Saga: True',
    shortName: 'Contract True',
    era: '2024+',
    description: 'True Contract era with Manifestation (Kengen), Avatar contracts, and modern meta.',
    prefixes: ['BS68', 'BS69', 'BS70', 'BS71', 'SD68', 'SD69', 'SD70']
  },
  {
    id: 'saga_16',
    name: '16 - Collaboration Sets',
    shortName: 'Collaboration',
    era: 'All',
    prefixes: ['CB01', 'CB02', 'CB03', 'CB04', 'CB05', 'CB06', 'CB07', 'CB08', 'CB09', 'CB10', 'CB11', 'CB12', 'CB13', 'CB14', 'CB15', 'CB16', 'CB17', 'CB18', 'CB19', 'CB20', 'CB21', 'CB22', 'CB23', 'CB24', 'CB25', 'CB26', 'CB27', 'CB28', 'CB29', 'CB30', 'PB']
  },
  {
    id: 'saga_17',
    name: '17 - Special / Promotional',
    shortName: 'Promo & Extra',
    era: 'All',
    prefixes: ['CP', 'P', 'LM', 'EX', 'PX', 'SJ', 'PR']
  }
];

/**
 * Returns the Saga definition object matching the given saga ID, short name, or name substring.
 */
export function getSagaById(idOrName) {
  if (!idOrName) return null;
  const raw = String(idOrName).trim();
  const target = raw.toLowerCase();
  if (target === 'all') return null;

  const norm = target.replace(/[·_]/g, '-').replace(/\s+/g, ' ');

  return SAGA_DEFINITIONS.find(s => {
    const sNameNorm = s.name.toLowerCase().replace(/[·_]/g, '-').replace(/\s+/g, ' ');
    const sShortNorm = s.shortName.toLowerCase().replace(/[·_]/g, '-').replace(/\s+/g, ' ');
    const num = s.id.replace('saga_', '');
    const numInt = parseInt(num, 10);
    return s.id === target ||
      num === target ||
      String(numInt) === target ||
      sShortNorm === norm ||
      sNameNorm === norm ||
      sNameNorm.includes(norm) ||
      norm.includes(sShortNorm) ||
      s.id === `saga_${target.padStart(2, '0')}`;
  }) || null;
}

/**
 * Resolves which Saga a card belongs to based on its canonical card number or set JSON string.
 */
export function resolveCardSaga(cardOrCardNumber) {
  if (!cardOrCardNumber) return null;

  let num = '';
  let setsJson = '';

  if (typeof cardOrCardNumber === 'string') {
    num = cardOrCardNumber.toUpperCase().trim();
  } else {
    num = String(cardOrCardNumber.card_number || cardOrCardNumber.id || '').toUpperCase().trim();
    setsJson = String(cardOrCardNumber.sets_json || cardOrCardNumber.set_name || '');
  }

  // Extract set prefix (e.g. "BS14" from "BS14-001" or "SD06" from "SD06-X01")
  const m = num.match(/^([A-Z0-9]+)[-_]/);
  const prefix = m ? m[1] : '';

  for (const saga of SAGA_DEFINITIONS) {
    if (prefix && saga.prefixes.some(p => p.toUpperCase() === prefix)) {
      return saga;
    }
    // Fallback: check setsJson or raw number match
    if (setsJson) {
      for (const p of saga.prefixes) {
        if (setsJson.includes(`"${p}"`) || setsJson.includes(`[${p}]`) || setsJson.includes(p)) {
          return saga;
        }
      }
    }
  }

  // Fallback for promotional / other
  if (num.startsWith('P') || num.startsWith('CP') || num.startsWith('EX') || num.startsWith('PX') || num.startsWith('LM') || num.startsWith('BATTLE-SPIRITS')) {
    return SAGA_DEFINITIONS.find(s => s.id === 'saga_17') || null;
  }

  return null;
}

if (typeof window !== 'undefined') {
  window.SAGA_DEFINITIONS = SAGA_DEFINITIONS;
  window.getSagaById = getSagaById;
  window.resolveCardSaga = resolveCardSaga;
}

if (typeof globalThis !== 'undefined') {
  globalThis.SAGA_DEFINITIONS = SAGA_DEFINITIONS;
  globalThis.getSagaById = getSagaById;
  globalThis.resolveCardSaga = resolveCardSaga;
}
