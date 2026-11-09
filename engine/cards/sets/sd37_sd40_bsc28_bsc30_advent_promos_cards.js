/**
 * engine/cards/sets/sd37_sd40_bsc28_bsc30_advent_promos_cards.js
 *
 * Advent Saga (煌臨編 / Advent Era) — Deterministic Two-Tier Per-Card Handlers for Advent Starter Decks & BSC Promos (SD37-SD40, BSC28-BSC30)
 * Total Cards: 248
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10630",
    "name": "The Heated Sports Festival",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11376",
    "name": "The Memorable Field Trip",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11592",
    "name": "The NovaCannonEmperor Evol-Tiger",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11864",
    "name": "The Red Holy Relic",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12135",
    "name": "The SengokuPrincess Makina",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12310",
    "name": "The Shinobigatana Reverse Summer-Sun",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12426",
    "name": "The ShieldBeast Shieldertel",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12862",
    "name": "The StrangeFangShinobi Kurokiba",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13122",
    "name": "The Tiger's Lair",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13253",
    "name": "The TwinkleFlameFox Threetailed Fox",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13289",
    "name": "The TwinkleWingsBird Gerygale",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13613",
    "name": "The WindTwinkleBird Peregriff",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1377",
    "name": "The CleverMachineNinja Urakage",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14701",
    "name": "［Academy Uniform］Fongneena",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14705",
    "name": "［Academy Uniform］Frieda Laifa",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14712",
    "name": "［Academy's Witch Quartet］Flamme Sandria",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14725",
    "name": "［Academy Uniform］Hokuto Apollonia",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14729",
    "name": "［Academy Uniform］Seina Ryumin",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14732",
    "name": "［Academy Uniform］Candy-Cerd",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14733",
    "name": "［Academy Uniform］Senri Taiga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14738",
    "name": "［Academy Uniform］Sephi Aries",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14750",
    "name": "［Academy Uniform］Loria Sheeps",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14751",
    "name": "［Academy Uniform］Sierra Murceine",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14753",
    "name": "［Academy Uniform］Sonia-A-Wasp",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14763",
    "name": "［Academy Uniform］Marimo Edith",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14772",
    "name": "［Academy Uniform］Noa Fleur",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14783",
    "name": "［Academy Uniform］Rei-Ohba",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14786",
    "name": "［Academy Uniform］Rias Urovorun",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14788",
    "name": "［Academy Uniform］Riolu Tida",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14791",
    "name": "［Academy Uniform］Yellow-Merlin",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14793",
    "name": "［Academy Uniform］Zexia Tenma",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14799",
    "name": "［Blitz Girl］Riolu Tida",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14830",
    "name": "［Burning Sengoku Princess］Banri-Sora",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14835",
    "name": "［Cheer Ambassador］Marimo Edith",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14890",
    "name": "［Diva God］Zexia Tenma",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14894",
    "name": "［Diva War Princess］Sierra Murceine",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14911",
    "name": "［Fire Princess］Senri Taiga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14934",
    "name": "［Hop Step］Misty Lylebit",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A15052",
    "name": "［Mysterious Transfer Student］Sawael",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A15151",
    "name": "［Rainbow Colored Wits］Kirika",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A15231",
    "name": "［Shy Girl］Loria Sheeps",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A15243",
    "name": "［Sonic Speed Diva］Sonia-A-Wasp",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1548",
    "name": "The PatrioticWarrior PatriAuto",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1622",
    "name": "The Valkyrie Schwertlaute",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3004",
    "name": "Binding Petal",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6619",
    "name": "Mizuno-san of the Toilet",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6985",
    "name": "Ninja Gale Storm",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A74",
    "name": "The WingDragonEmperor Siegfried-Vert",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8858",
    "name": "The BombardmentGodKing Revol-Tiger-Zero",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9429",
    "name": "The Diva Academy",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9927",
    "name": "The FlowerMonarch Chikaya",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-138",
    "name": "Hand Reverse",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-029",
    "name": "The WindDemon Ninkouchou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-030",
    "name": "The StrangeFangShinobi Rappanther",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-040",
    "name": "The CleverMachineMusha Saiun",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-061",
    "name": "The GreenBird Douji",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-070",
    "name": "The BlueSeas WisdomKing",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-092",
    "name": "The Castle of Clever Machines",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-100",
    "name": "Shikigami of the Dead",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-107",
    "name": "Impregnable Wall",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-109",
    "name": "Yellow Recover",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-112",
    "name": "Mantra Draw",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-X03",
    "name": "The ArmoredMothHead Kuwagaslayer",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS31-X04",
    "name": "The GreatCleverMachineMusha Kongou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-002",
    "name": "The WesternMusha Hakurai",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-005",
    "name": "The SwordsWarDragon Muramasa-Dragon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-011",
    "name": "Onmyou Child",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-017",
    "name": "The Necromancer Yakumo",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-021",
    "name": "The WindDemon Sasakunai",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-029",
    "name": "The CleverMachineDog Kishudog",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-045",
    "name": "The SengokuPrincess Kuon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-054",
    "name": "The IronFist WisdomKing",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-063",
    "name": "No. 32 Island Root",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-068",
    "name": "The Flowering Yellow Castle Gates",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-071",
    "name": "No. 26 Capital Capital",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-072",
    "name": "Flame Slash",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-078",
    "name": "Limited Barrier",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-CP01",
    "name": "The SoulMusha Ryuga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-X01",
    "name": "The SengokuHero Gyuumonji",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS32-X03",
    "name": "The WindDemonHead Shinobiou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-001",
    "name": "Dramaru",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-004",
    "name": "The ResplendentCommander Hyoujindragon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-020",
    "name": "The DragonMaskOgre Biranba",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-023",
    "name": "The ArmoredMothShinobi Hyakude",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-028",
    "name": "The ArmorWindDemon Yoroizumo",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-040",
    "name": "The GenjiEightKnights Tatenashi Fortress",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-050",
    "name": "Kyuubi Fox",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-061",
    "name": "The Great Dragon Castle Honmaru",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-063",
    "name": "The Rocky Ogre Fortress",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-078",
    "name": "Light Wings Sword",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-020",
    "name": "The WindDemon Yabusame",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-035",
    "name": "The CleverMachineNinja Shiomaneki",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-039",
    "name": "The GenjiEightKnights Hachiryou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-054",
    "name": "The SeadragonMusha Ikkaku",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-055",
    "name": "The Devil Conqueror WisdomKing",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-058",
    "name": "The FlameDragonKatana Onimaru-Shin'uchi",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-069",
    "name": "The Dawn Temple Fortress Arun",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-081",
    "name": "Hyakki Yakou",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-X01",
    "name": "The SengokuDragonEmperor Burning-Souldragon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-X03",
    "name": "The StrangeFangShinobiHead Toudou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-X06",
    "name": "The SevenSeasDaimyo Shironagasu",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS35-069",
    "name": "Shinobi Demon-God",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC20-001",
    "name": "The BattleArrowDragon Byouha",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC20-009",
    "name": "The ArmoredMothShinobi Tobikage",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC20-012",
    "name": "The CleverMachineMusha Shiranui",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC21-009",
    "name": "Himetsuruichimonji",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC21-012",
    "name": "The WaterSupremeBlade Juzumaru",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC21-X03",
    "name": "The SwordMasterPrincess Tsuru",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC21-X04",
    "name": "The GroundDeityBlade Ootenta",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC23-051",
    "name": "Kneel Down Everyone",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-002",
    "name": "［Academy Uniform］Griffiar d'Arc",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-003",
    "name": "［Academy Uniform］Rabbey Darling",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-004",
    "name": "［Academy Uniform］Emma Jean",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-005",
    "name": "［Big Sis to All］Emma Jean",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-006",
    "name": "［Academy Uniform］Banri-Sora",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-010",
    "name": "［Red Star］Hokuto Apollonia",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-011",
    "name": "［Academy Uniform］Rize Chromwell",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-014",
    "name": "［Academy Uniform］Delis Pertio",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-016",
    "name": "［Next Diva］Frieda Laifa",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-020",
    "name": "［Academy Uniform］Nanaka Shironaga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-021",
    "name": "［Grand Blue］Nanaka Shironaga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-022",
    "name": "［Academy Uniform］Nei-Lanetail",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-023",
    "name": "［Academy Uniform］Jeanne Doraniece",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-024",
    "name": "［Academy Uniform］Cassy Leim",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-031",
    "name": "［Academy Uniform］Flamme Sandria",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-033",
    "name": "［Academy Uniform］Daiya Lune",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-035",
    "name": "［Academy Uniform］An",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-036",
    "name": "［Academy Uniform］Choco",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-037",
    "name": "［Academy Uniform］Muu",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-038",
    "name": "［Academy Uniform］Fuuga Rin",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-039",
    "name": "［Cute Ringing］Fuuga Rin",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-042",
    "name": "［Academy Uniform］Misty Lylebit",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-045",
    "name": "［Academy Uniform］Fromage",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-047",
    "name": "［Academy Uniform］Raquel with Pentan Backpack",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-048",
    "name": "The Diva Academy Student Handbook",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-049",
    "name": "The Diva Academy Designated Jersey",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-050",
    "name": "The Diva Academy Designated School Bag",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-052",
    "name": "Welcome to the School Festival",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-055",
    "name": "Romantic Flight",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-056",
    "name": "Soul Refrain",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-057",
    "name": "EZ Dance",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-058",
    "name": "Love Wins",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC28-X04",
    "name": "［Fleeting Dark Princess］Rias Urovorun",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-001",
    "name": "The FortyFourthMachine Glorious-Racoon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-002",
    "name": "The FiftySeventhMonkeyMaster Onkot-Merlin",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-003",
    "name": "The SixtiethKid Calamity-Uri",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-004",
    "name": "The Mogami Family's Dinner",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-005",
    "name": "Daybreak",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-006",
    "name": "Nothing Ventured, Nothing Gained",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-007",
    "name": "His Cards",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-008",
    "name": "The Purple Talk",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-009",
    "name": "The Light and Dark Sacred Sword",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-010",
    "name": "The Beginning Card",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-011",
    "name": "The Distressing Decision",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-012",
    "name": "Professor Battle Usagi's BS Course!",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-013",
    "name": "The Ultimate Power",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-014",
    "name": "The God-King Clock Tower",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-015",
    "name": "Crimson Strike",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-016",
    "name": "V-V-Victory!!",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-017",
    "name": "Rising Sun",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-018",
    "name": "Obsession With Victory",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-019",
    "name": "Beloved Person",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-020",
    "name": "Violet Needle",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-021",
    "name": "Rabbit-Usagi's Trial",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-022",
    "name": "Emerald Breath",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-023",
    "name": "A Keen and Clear Conquest!!",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-024",
    "name": "Parental Bond",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-025",
    "name": "White Return",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-026",
    "name": "Subtract Points",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-027",
    "name": "Yellow Hold",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-028",
    "name": "Blue Impact",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-029",
    "name": "Revelation",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC29-030",
    "name": "...",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-001",
    "name": "The CatalyzeMusha Hokushin",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-002",
    "name": "The HeroicGeneral Senryo",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-003",
    "name": "The SummonedDinosaur Suteiragou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-004",
    "name": "The MakaiDemonBlade Agon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          },
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-005",
    "name": "Thunder Cloud Nue",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-006",
    "name": "The MakaiFistOgre Namu",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-007",
    "name": "The MakaiWarrior Shikijou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-008",
    "name": "The WindDemon Tsubakura-Crow",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-010",
    "name": "The 9thGenerationArmoredMothHead ScarletKuwaga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-012",
    "name": "Satori Monkey",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-013",
    "name": "The SengokuPrincess Nagisa",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-014",
    "name": "The SengokuPrincess Hibana",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-015",
    "name": "The Advent Douji",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-016",
    "name": "The PirateChief Murakami-Kiri",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-017",
    "name": "The Advent Wisdom King",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-018",
    "name": "The TwinGun Revol-Tigun",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-019",
    "name": "The MakaiGun Sowaka",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-020",
    "name": "The WingGun Tsubasamaru",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-021",
    "name": "The ArmorGun Bison-Blaster",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-022",
    "name": "The CleverMachineCannon Kunikuzushi",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-023",
    "name": "The PrincessGun -Miyabi-",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-024",
    "name": "The GiantWeapon Titus-Bazooka",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-X01",
    "name": "The SengokuCommander Siegfried-Kai",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-X02",
    "name": "The 1stGenerationArmoredMothHead KuwagaOkina",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC30-X03",
    "name": "The GenjiCommander Muryou",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "CADEMY-TRICKSTER",
    "name": "［Academy Uniform］Trickster",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "OBLI-GUARD",
    "name": "The NobleOrder Obli-Guard",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "PX15-03",
    "name": "The CancerNinja Cancerd",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD06-016",
    "name": "Burst Wall",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD31-007",
    "name": "The WindDemon Benimatoi",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD31-009",
    "name": "The WindDemonGreatShinobi Highwind",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD31-010",
    "name": "The ShinobiCommander Kurohagane",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD31-012",
    "name": "Teppounanafushi",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-001",
    "name": "Draw Genet",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-002",
    "name": "Pile-Puma",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-003",
    "name": "Heatedge Wolf",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-004",
    "name": "Royal Tiger Kid",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-006",
    "name": "Rubyclaw Jaguar",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-009",
    "name": "The TwinkleLion Divaleon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-012",
    "name": "Advent Draw",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-013",
    "name": "Red Lightning",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD37-014",
    "name": "Evolution Attack",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-001",
    "name": "Shiroena",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-002",
    "name": "Ohayashi Bird",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-003",
    "name": "Bluelegge",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-004",
    "name": "Glasswallow",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-005",
    "name": "Silver Leaf Eagle",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-007",
    "name": "The StrikerBird Bruce-Kei",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-009",
    "name": "The TribalBird Tyranbird",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-010",
    "name": "The TwinkleEmperor Simurgh",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-011",
    "name": "The Phoenix's Tailfeathers",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-012",
    "name": "Bird Kick",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD38-013",
    "name": "Sonic Wind",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-001",
    "name": "SD0-L9",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-003",
    "name": "The NobleOrder Soldier-Azure",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-005",
    "name": "The WhiteSearcher WG-7",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-007",
    "name": "The NobleOrder WhiteFlameMachineGod Loge",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-008",
    "name": "The ProtectionGodKing Glorious-Sheep Type-F",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-009",
    "name": "The GloryWarrior O-Superia",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-010",
    "name": "Glorious-Flugel",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-011",
    "name": "The TwinkleDragonGunblade Guns-Balmung",
    "cardType": "Brave",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-012",
    "name": "Das Rheingold",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-013",
    "name": "Rampart Wall",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-014",
    "name": "Balmung Shot",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD39-X01",
    "name": "The NobleDragoon Nu-Siegfried",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "requireAdvent": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-001",
    "name": "The FlameSannin Saizo of the WickedHeart",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-002",
    "name": "The FlameSannin Kayaku of the Explosion",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          },
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-003",
    "name": "The FlameSannin Izayoi of the GreatShuriken",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-004",
    "name": "The ArmoredMothShinobi Barakiri",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-005",
    "name": "The WindDemon Kakitsuburi",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-006",
    "name": "The WindDemon Ikaruga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-007",
    "name": "The StrangeFangShinobi Tachikage",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-X01",
    "name": "The NinjaHead Souldragon-Hokage",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "DRAW",
            "amount": 1
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-X02",
    "name": "The 44thGenerationStrangeFangShinobiHead Shishinobi",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD40-X03",
    "name": "The 33rdGenerationWindDemonHead Yatagarai",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  }
];

for (const spec of SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
