/**
 * engine/cards/sets/bs53_cards.js
 *
 * Rebirth Saga (転醒編 / Rebirth Era) — Deterministic Two-Tier Per-Card Handlers for Booster 53 (Rebirth Chapter 2: The Resonant Miracle)
 * Total Cards: 126
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS53_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10229",
    "name": "The GenesisOrb Hexa-Talisman",
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
          },
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
    "cardNumber": "BATTLE-SPIRITS-A10737",
    "name": "The HellRouseKing Luciferd",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13019",
    "name": "The ThreeDisasterBeasts EarthDisaster Behemodth",
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
    "cardNumber": "BATTLE-SPIRITS-A4597",
    "name": "Grandwalker Lakshmi",
    "cardType": "Nexus",
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
              "maxBp": 7000
            }
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
    "cardNumber": "BS53-001",
    "name": "Futargo Lizard",
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
    "cardNumber": "BS53-002",
    "name": "Fizard X",
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
    "cardNumber": "BS53-003",
    "name": "Ignite Dragon",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-004",
    "name": "The VolcanoAzureDragon Vurgannon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
            }
          },
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
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-004-A13422",
    "name": "The VolcanoDinosaur Vurgannon",
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
    "cardNumber": "BS53-005",
    "name": "The ImaginaryFlameDragon Crimson-Mirage",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-006",
    "name": "The HeavyTrooper Dragno",
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
    "cardNumber": "BS53-007",
    "name": "The ImperialRouseWarlord OujinDragon -Type Xuanwu-",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
        "subConditions": {
          "levels": [
            1,
            2
          ]
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
    "cardNumber": "BS53-007-A11024",
    "name": "The ImperialRouseWarlord OujinDragon -Type Zhuque-",
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
    "cardNumber": "BS53-008",
    "name": "The SixSwordsDragon Val-de-Roc",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-009",
    "name": "The MachineCatalystGreatGeneral Muramasa-Dragon",
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
    "cardNumber": "BS53-010",
    "name": "Green Flash Dragon",
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
    "cardNumber": "BS53-011",
    "name": "Night Bladra",
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
    "cardNumber": "BS53-012",
    "name": "Camelot Rook",
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
    "cardNumber": "BS53-013",
    "name": "Camelot Knight X",
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
    "cardNumber": "BS53-014",
    "name": "Pioneer Vampire Angie",
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
    "cardNumber": "BS53-015",
    "name": "The NetherNecromancer Dominus",
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
    "cardNumber": "BS53-016",
    "name": "The BladeVampire Shredder",
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
    "cardNumber": "BS53-017",
    "name": "The DemonDragon Schwarzione",
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
              "maxBp": 7000
            }
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
    "cardNumber": "BS53-017-A12692",
    "name": "The SteamDemonDragon Schwarzione",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
    "cardNumber": "BS53-018",
    "name": "The AzureDuke Vernhard",
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
      }
    ]
  },
  {
    "cardNumber": "BS53-019",
    "name": "The DarkKnight Lancelot X",
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
    "cardNumber": "BS53-020",
    "name": "The NetherKnight L'Evangile",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-021",
    "name": "The PurpleSmokeWatchdog Cerberusmog",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-021-A13417",
    "name": "The VisionaryFlameWatchdog Cerberussa",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-022",
    "name": "The DragonKnight Albert",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-023",
    "name": "The StaveBeast Alpascore",
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
    "cardNumber": "BS53-024",
    "name": "Shield Beetle",
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
    "cardNumber": "BS53-025",
    "name": "Pioneer TreeSpirit Happa",
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
    "cardNumber": "BS53-026",
    "name": "Racket Hummingbird",
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
    "cardNumber": "BS53-027",
    "name": "Bat-Eared Fox",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-028",
    "name": "The FlameBeastPrince Leonedge",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-028-A12040",
    "name": "The RouseBeastPrince Leonedge",
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
    "cardNumber": "BS53-029",
    "name": "The EighthToneBeast NoteKangaroo",
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
    "cardNumber": "BS53-030",
    "name": "Jisaidori",
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
    "cardNumber": "BS53-031",
    "name": "The ShellRouseSwordsman Rhinoceros",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-032",
    "name": "The ShellWarrior Gakuhi-Hopper",
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
    "cardNumber": "BS53-033",
    "name": "The DeathWingsKing Death-Condor",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-034",
    "name": "The RagingBeast BlackPanther",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-035",
    "name": "Jammer Owl",
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
    "cardNumber": "BS53-036",
    "name": "Shield Badger",
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
    "cardNumber": "BS53-037",
    "name": "Diamond Betta",
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
    "cardNumber": "BS53-038",
    "name": "The UnicornMachineBeast Amdus-Cias",
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
    "cardNumber": "BS53-039",
    "name": "ShiningHeavenCleverMachine SixthPlace Ishikoridome",
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
    "cardNumber": "BS53-040",
    "name": "The HeavyArmorMobile Shieldias",
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
    "cardNumber": "BS53-041",
    "name": "The WanderingSteelKnight Deucalion",
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
    "cardNumber": "BS53-042",
    "name": "Big Coconut Crab",
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
    "cardNumber": "BS53-043",
    "name": "The IceSorceress Alistesia",
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
    "cardNumber": "BS53-044",
    "name": "The MagicianWarMachine Lughaid",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-044-A12805",
    "name": "The StoutArmWarMachine Lughaid Type-G",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
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
              "maxBp": 7000
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
    "cardNumber": "BS53-045",
    "name": "Past Pom",
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
    "cardNumber": "BS53-046",
    "name": "The DruidSleepingWitch Chelsea",
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
    "cardNumber": "BS53-047",
    "name": "Pioneer AngeliaOfVirtues Fanael",
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
    "cardNumber": "BS53-048",
    "name": "The JadeBirdWitch Rirura",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
    "cardNumber": "BS53-048-A12341",
    "name": "The ShyDruidMonk Rirura",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-049",
    "name": "Amabie",
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
    "cardNumber": "BS53-050",
    "name": "Capricornus",
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
    "cardNumber": "BS53-051",
    "name": "The FireSpirit Salamander",
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
              "maxBp": 7000
            }
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
    "cardNumber": "BS53-052",
    "name": "The MagicalLightHunter Janeway",
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
    "cardNumber": "BS53-053",
    "name": "The DruidSuperhumanPriestess Bernelita",
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
    "cardNumber": "BS53-054",
    "name": "The ImaginaryDragonKing Juran",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-054-A13423",
    "name": "The VolcanoDragonKing Juran",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
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
              "maxBp": 7000
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
    "cardNumber": "BS53-055",
    "name": "The WBS Wrestler Clyde",
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
      }
    ]
  },
  {
    "cardNumber": "BS53-056",
    "name": "Godseeker WBS ExclusiveCommentator Vihan",
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
    "cardNumber": "BS53-057",
    "name": "The WBS RookieWrestler Aarush",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-058",
    "name": "Smaragd-Golem",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-059",
    "name": "The WBS Wrestler Mask-The-Mysterio",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-060",
    "name": "The WBS Wrestler Syria",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-061",
    "name": "The WBS Legend TigerMaster",
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
    "cardNumber": "BS53-062",
    "name": "The WBS Wrestler Gabiah",
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
              "maxBp": 7000
            }
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
    "cardNumber": "BS53-063",
    "name": "The ShellMaskedKing Zeophirider-WBS",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
        "subConditions": {
          "levels": [
            1,
            2
          ]
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
    "cardNumber": "BS53-063-A13452",
    "name": "The WBS King Zeophilus",
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
    "cardNumber": "BS53-064",
    "name": "The DivineOrb Puruna-Karasha",
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
    "cardNumber": "BS53-065",
    "name": "The Dragon's Holy Sword",
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
    "cardNumber": "BS53-066",
    "name": "Lakshmi's Muscle Temple",
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
    "cardNumber": "BS53-066-A13461",
    "name": "The WBS Trainer McGard",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
            }
          },
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
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-067",
    "name": "Nexus Hazard",
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
    "cardNumber": "BS53-068",
    "name": "Burning Dust",
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
    "cardNumber": "BS53-069",
    "name": "Demon's Finger",
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
    "cardNumber": "BS53-070",
    "name": "Dragoon Shoot",
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
    "cardNumber": "BS53-071",
    "name": "Binding Noise",
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
    "cardNumber": "BS53-072",
    "name": "Leaf Jammer",
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
    "cardNumber": "BS53-073",
    "name": "Mist Shield",
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
    "cardNumber": "BS53-074",
    "name": "Dream Spark",
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
    "cardNumber": "BS53-075",
    "name": "Pom Pom Pom Pom",
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
    "cardNumber": "BS53-076",
    "name": "Mertipressure",
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
    "cardNumber": "BS53-077",
    "name": "Azure Stream Beam",
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
            "op": "BP_BUFF_SELF",
            "amount": 4000
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
    "cardNumber": "BS53-078",
    "name": "Spartan Throw",
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
    "cardNumber": "BS53-CP01",
    "name": "Arondai - Origins 02",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-CP02",
    "name": "Belphegor - King of Sorrow",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-CP03",
    "name": "Cedar Treewalker - The Chiliad",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-CP04",
    "name": "Vicerave - The King",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-CP05",
    "name": "Aoba - Lord of the Skies",
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
    "cardNumber": "BS53-CP06",
    "name": "Alezan - King of the Deep",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-CP07",
    "name": "Lachesis - Decider of Fate",
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
    "cardNumber": "BS53-CP08",
    "name": "Lord Alabaster - The Embattled",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-CP09",
    "name": "Eilietta Lash",
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
    "cardNumber": "BS53-CP10",
    "name": "Ash Claude",
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
    "cardNumber": "BS53-CP11",
    "name": "Nonoin Nillon",
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
    "cardNumber": "BS53-CP12",
    "name": "Hinaria Darkend",
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
    "cardNumber": "BS53-TCP01",
    "name": "Future Apollon",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
            }
          },
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-TCP01-A7054",
    "name": "Past Apollon",
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
              "maxBp": 7000
            }
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
    "cardNumber": "BS53-TCP02",
    "name": "Future Athena",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
    "cardNumber": "BS53-TCP02-A7057",
    "name": "Past Athena",
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
    "cardNumber": "BS53-TCP03",
    "name": "Future Poseidon",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
            }
          },
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-TCP03-A7066",
    "name": "Past Poseidon",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-TX02",
    "name": "The Purple Evil Deity",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
    "cardNumber": "BS53-TX02-A11873",
    "name": "The Purple World",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DEPLOYED",
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
    "cardNumber": "BS53-TX03",
    "name": "The Green Nature Deity",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-TX03-A10560",
    "name": "The Green World",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DEPLOYED",
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
    "cardNumber": "BS53-TX04",
    "name": "The Yellow Dream Deity",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-TX04-A13711",
    "name": "The Yellow World",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DEPLOYED",
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
    "cardNumber": "BS53-X01",
    "name": "The EtherRouseFleetDragon Teazerola",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-X03",
    "name": "The RouseBeastKing Leo-Ziven",
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
    "cardNumber": "BS53-X04",
    "name": "The ZeroRideEmpress Queen-Flawless",
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
    "cardNumber": "BS53-X05",
    "name": "The RousePope Mertiana",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS53-X06",
    "name": "The AbyssalRouseDragon Bashlomu",
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
    "cardNumber": "BS53-X07",
    "name": "The WBS Ace FortuneGoddess Lokamata",
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
    "cardNumber": "BS53-XX02",
    "name": "The ThreeDisasterBeasts SeaDisaster Desirathan",
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
    "cardNumber": "BS53-XX03",
    "name": "The ThreeDisasterBeasts SkyDisaster Dest-Ziz",
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
    "cardNumber": "DRAGONIC-ARTHUR-A2658",
    "name": "The DragonRideEmperor Dragonic-Arthur",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_REBORN",
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
              "maxCost": 6
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
              "maxBp": 7000
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
    "cardNumber": "SWORDIUS-DRAGOON",
    "name": "The DragonKnight Swordius-Dragoon",
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
            "amount": 4000
          }
        ]
      }
    ]
  }
];

for (const spec of BS53_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
