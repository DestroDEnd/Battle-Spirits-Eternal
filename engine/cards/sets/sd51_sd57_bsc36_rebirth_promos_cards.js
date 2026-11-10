/**
 * engine/cards/sets/sd51_sd57_bsc36_rebirth_promos_cards.js
 *
 * Rebirth Saga (転醒編 / Rebirth Era) — Deterministic Two-Tier Per-Card Handlers for Rebirth Starter Decks & BSC Promos (SD51-SD57, BSC36)
 * Total Cards: 199
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10137",
    "name": "The GalaxianDeity Zodiac-Piooze",
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
    "cardNumber": "BATTLE-SPIRITS-A10290",
    "name": "The GiantPrince Lakshmana",
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
    "cardNumber": "BATTLE-SPIRITS-A10328",
    "name": "The GlacialHero Lord-Dragon-Glazar X",
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
    "cardNumber": "BATTLE-SPIRITS-A10793",
    "name": "The HeroBeast OldGeneral Tiger-Nestor",
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
    "cardNumber": "BATTLE-SPIRITS-A10798",
    "name": "The HeroDragon Lord-Dragon X",
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
    "cardNumber": "BATTLE-SPIRITS-A11580",
    "name": "The New World",
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
    "cardNumber": "BATTLE-SPIRITS-A12163",
    "name": "The SeaDragon Cima-Creek II",
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
    "cardNumber": "BATTLE-SPIRITS-A12448",
    "name": "The SixthArtifact Sheperdoll",
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
    "cardNumber": "BATTLE-SPIRITS-A12870",
    "name": "The SuperHero Lord-Dragon-Saviour X",
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
    "cardNumber": "BATTLE-SPIRITS-A12924",
    "name": "The SuperstarApostle Cordelia",
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
    "cardNumber": "BATTLE-SPIRITS-A12926",
    "name": "The SuperstarApostle Spitzer Dragon",
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
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13244",
    "name": "The TwinkleDragonGunblade Guns-Balmung -Gun Mode-",
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
    "cardNumber": "BATTLE-SPIRITS-A13278",
    "name": "The TwinkleStarFirstApostle Asgardia",
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
    "cardNumber": "BATTLE-SPIRITS-A13281",
    "name": "The TwinkleStarNinthApostle Phoebe",
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
    "cardNumber": "BATTLE-SPIRITS-A13285",
    "name": "The TwinkleStarThirdApostle Ganymede",
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
    "cardNumber": "BATTLE-SPIRITS-A13534",
    "name": "The WhiteSuperstarApostle Whitewurm",
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
    "cardNumber": "BATTLE-SPIRITS-A14299",
    "name": "Wandering Grandwalker Lolo",
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
    "cardNumber": "BATTLE-SPIRITS-A2372",
    "name": "Soul Crunch",
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
    "cardNumber": "BATTLE-SPIRITS-A2546",
    "name": "The Hero Hinobori Hajime",
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
    "cardNumber": "BATTLE-SPIRITS-A2622",
    "name": "The SpacetimeDragonEmperor Chronobirth-Dragoon",
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
    "cardNumber": "BATTLE-SPIRITS-A2781",
    "name": "The SpacetimeDragon Chrono-Dragon",
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
    "cardNumber": "BATTLE-SPIRITS-A3764",
    "name": "Diamond Wall",
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
    "cardNumber": "BATTLE-SPIRITS-A4604",
    "name": "Godseeker Lolodra",
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
    "cardNumber": "BATTLE-SPIRITS-A4605",
    "name": "Grandwalker Apollon",
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
    "cardNumber": "BATTLE-SPIRITS-A4627",
    "name": "Godseeker SuperstarApostle Perdita",
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
    "cardNumber": "BATTLE-SPIRITS-A4630",
    "name": "Godseeker SuperstarApostle Tarvos",
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
    "cardNumber": "BATTLE-SPIRITS-A4832",
    "name": "Hanasaka Dragon",
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
    "cardNumber": "BATTLE-SPIRITS-A4862",
    "name": "Gundam Exia",
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
    "cardNumber": "BATTLE-SPIRITS-A8760",
    "name": "The BlackSuperstarApostle Blackwurm",
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
          },
          {
            "op": "REFRESH_SELF"
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
    "cardNumber": "BATTLE-SPIRITS-A8953",
    "name": "The BuraiMan Oni-Dragon",
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
    "cardNumber": "BATTLE-SPIRITS-A9049",
    "name": "The CherubAngelia Jophiel",
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
    "cardNumber": "BATTLE-SPIRITS-A9069",
    "name": "The ClownDeity Polluc&Castar",
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
    "cardNumber": "BATTLE-SPIRITS-A9255",
    "name": "The DarkSnakeGodKing Shenmadou",
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
    "cardNumber": "BATTLE-SPIRITS-A9550",
    "name": "The Dragon Palace",
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
    "cardNumber": "BATTLE-SPIRITS-A9658",
    "name": "The ElegantDragon Elea-Ragoon",
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
    "cardNumber": "BATTLE-SPIRITS-A9775",
    "name": "The ExplosionHero Lord-Dragon-Bazzel X",
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
    "cardNumber": "BATTLE-SPIRITS-A9861",
    "name": "The Fifth's FourDragonHorsemen White Rider",
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
    "cardNumber": "BS01-061",
    "name": "Apewhip",
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
    "cardNumber": "BS06-087",
    "name": "The Phantom Paradise",
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
    "cardNumber": "BS08-X32",
    "name": "The WingDeity Grand-Woden",
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
    "cardNumber": "BS10-062",
    "name": "The GunDragon Phoenix-Cannon",
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
    "cardNumber": "BS10-098",
    "name": "Revive Draw",
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
    "cardNumber": "BS11-069",
    "name": "The Golden Belfry",
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
    "cardNumber": "BS11-080",
    "name": "Delta Barrier",
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
    "cardNumber": "BS11-X02",
    "name": "The StarSlayerDragon Darkwurm-Nova",
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
    "cardNumber": "BS12-X06",
    "name": "The PirateKing Leviadan",
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
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-X01",
    "name": "The DragonHero Sieg-Yamato-Fried",
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
    "cardNumber": "BS18-010",
    "name": "Camelot-Pawn",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS19-088",
    "name": "The Beast's Ice Cavern",
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
    "cardNumber": "BS20-030",
    "name": "The IceShieldGuardian Ohshin",
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
    "cardNumber": "BS27-075",
    "name": "The Military Port City Ostia",
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
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS28-071",
    "name": "The Treasures of the Ocean Empire",
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
    "cardNumber": "BS28-082",
    "name": "Swallow Tail",
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
      }
    ]
  },
  {
    "cardNumber": "BS30-083",
    "name": "Greed Thunder",
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
    "cardNumber": "BS31-049",
    "name": "One-Eyed Priest",
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
    "cardNumber": "BS31-XX02",
    "name": "The SixAbsoluteDeities Impenetrable-Chrome-Riservar",
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
    "cardNumber": "BS32-039",
    "name": "The SengokuPrincess Turel",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS33-071",
    "name": "The Amida Nyorai Statue",
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
    "cardNumber": "BS33-082",
    "name": "Brimming Summon Seas",
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
    "cardNumber": "BS34-044",
    "name": "Don Nurarihyon",
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
              "maxBp": 7000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS34-XX02",
    "name": "The HeavenlyDemonKing God-Sechs -Type Destroy-",
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
    "cardNumber": "BS35-084",
    "name": "Forest of the Giant Faced Stones",
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
    "cardNumber": "BS35-XX02",
    "name": "The HeavenlyDemonKing God-Sechs -Type The End-",
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
    "cardNumber": "BS37-033",
    "name": "The CleverMachineMusha E-Naomasa",
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
    "cardNumber": "BS37-074",
    "name": "Kabuto Demon-God",
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
    "cardNumber": "BS38-XX02",
    "name": "The YellowOriginDragon Delphinyute",
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
    "cardNumber": "BS40-042",
    "name": "The GiganticBeast Fasolt",
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
    "cardNumber": "BS40-063",
    "name": "The GiantKing Aion",
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
    "cardNumber": "BS40-077",
    "name": "The Blue Holy Relic",
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
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS40-088",
    "name": "Extinction Wall",
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
    "cardNumber": "BS41-010",
    "name": "The ExplosiveStarDragon Gammaray-Burst-Dragon",
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
    "cardNumber": "BS41-011",
    "name": "The TwinkleStarSecondApostle Stargaze",
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
    "cardNumber": "BS41-042",
    "name": "The TwilightDarknessSnakeKing Alberich",
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
    "cardNumber": "BS41-047",
    "name": "The NobleGod Grace-Order",
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
    "cardNumber": "BS41-070",
    "name": "The DragonEmperor'sPirateCrew Captain Whitejack",
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
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS42-007",
    "name": "The TwinkleStarDragon SpiculeDragon",
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
    "cardNumber": "BS42-008",
    "name": "The ElectricBoulderDragon Dynamo Dragon",
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
    "cardNumber": "BS42-019",
    "name": "The VioletCorpseBrigade Deathrib Dragon",
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
    "cardNumber": "BS42-XX01",
    "name": "The ClownDeity Lady-Frankelly",
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
    "cardNumber": "BS43-023",
    "name": "The ArmoredMothShinobi Genmakogane",
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
    "cardNumber": "BS43-055",
    "name": "The Wonderland Pumpty Dandy",
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
    "cardNumber": "BS43-068",
    "name": "The DragonEmperor'sPirateCrew Artillery Shirobanni",
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
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS43-071",
    "name": "The ChosenSearcher Alex",
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
    "cardNumber": "BS43-073",
    "name": "The TwinkleStarGun Wurmshooter",
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
    "cardNumber": "BS43-084",
    "name": "The Frozen Volcano",
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
    "cardNumber": "BS43-085",
    "name": "The NobleBattleship Batiment-de-Gale -Battleship Form-",
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
    "cardNumber": "BS43-X05",
    "name": "The EarthSeraph Ramdiel",
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
    "cardNumber": "BS44-017",
    "name": "Flightfeather Snake",
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
    "cardNumber": "BS44-074",
    "name": "Olym's Conical Mountain",
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
    "cardNumber": "BS44-078",
    "name": "The Grassland Ruins",
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
    "cardNumber": "BS44-X05",
    "name": "The WaterSeraph Mirediel",
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
    "cardNumber": "BS44-X06",
    "name": "The DarkStones SandseaPirateDeity Pharaom",
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
    "cardNumber": "BSC25-X02",
    "name": "The DemonGodDragonRider Gardea",
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
    "cardNumber": "BSC32-031",
    "name": "The Card I Picked Up Was Weak After All",
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
    "cardNumber": "BSSD55-006M",
    "name": "The TimeSandDragling Sandraglass",
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
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "DARKWURM-NOVA",
    "name": "The StarSlayerDragon Darkwurm-Nova X",
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
    "cardNumber": "LM17-01",
    "name": "The JanuaryYoungPrimalGod Dianus-Kid",
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
    "cardNumber": "SD01-039",
    "name": "Blizzard Wall",
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
    "cardNumber": "SD02-017",
    "name": "Strong Draw",
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
    "cardNumber": "SD06-013",
    "name": "Burst Draw",
    "cardType": "Magic",
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
    "cardNumber": "SD24-012",
    "name": "The Gate of Gargando",
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
    "cardNumber": "SD27-002",
    "name": "Wyvern-Vela",
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
    "cardNumber": "SD32-001",
    "name": "The Wandering Armor",
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
    "cardNumber": "SD32-002",
    "name": "Ichibanspear",
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
    "cardNumber": "SD32-X02",
    "name": "The HeavenlyDemonKing God-Sechs",
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
    "cardNumber": "SD39-005",
    "name": "The WhiteSearcher WG-7",
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
              "maxBp": 7000
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
  },
  {
    "cardNumber": "SD41-006",
    "name": "The MakaiDragonOgre Darkwurm",
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
    "cardNumber": "SD41-007",
    "name": "The MakaiEmperorDragon Darkwurm-Regalia",
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
    "cardNumber": "SD41-X01",
    "name": "The MakaiPhantomDragon Siegfried-Necro",
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
    "cardNumber": "SD51-008",
    "name": "The Grandstar Laniakea",
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
    "cardNumber": "SD51-009",
    "name": "Nova Draw",
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
      }
    ]
  },
  {
    "cardNumber": "SD51-CP01",
    "name": "Viole Mai -Mazoku Side-",
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
    "cardNumber": "SD52-001",
    "name": "Skygrasper",
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
    "cardNumber": "SD52-002",
    "name": "Duel Gundam",
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
    "cardNumber": "SD52-004",
    "name": "Strike Gundam ［Deactive Mode］",
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
    "cardNumber": "SD52-005",
    "name": "Strike Gundam",
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
    "cardNumber": "SD52-006",
    "name": "Aile Strike Gundam",
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
    "cardNumber": "SD52-007",
    "name": "Sword Strike Gundam",
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
    "cardNumber": "SD52-008",
    "name": "Launcher Strike Gundam",
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
    "cardNumber": "SD52-009",
    "name": "Aegis Gundam",
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
    "cardNumber": "SD52-010",
    "name": "Buster Gundam",
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
    "cardNumber": "SD52-011",
    "name": "Athrun Zala",
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
              "maxBp": 7000
            }
          },
          {
            "op": "REFRESH_SELF"
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
    "cardNumber": "SD52-012",
    "name": "Kira Yamato",
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
              "maxBp": 7000
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
    "cardNumber": "SD52-014",
    "name": "Archangel",
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
    "cardNumber": "SD52-015",
    "name": "I'll Protect You",
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
    "cardNumber": "SD52-016",
    "name": "The Descending Sword",
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
    "cardNumber": "SD52-X01",
    "name": "Freedom Gundam",
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
    "cardNumber": "SD52-X01-A5223",
    "name": "Justice Gundam",
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
    "cardNumber": "SD53-001",
    "name": "Gundam Kyrios",
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
    "cardNumber": "SD53-002",
    "name": "Gundam Virtue",
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
    "cardNumber": "SD53-003",
    "name": "Gundam Dynames",
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
    "cardNumber": "SD53-004",
    "name": "Gundam Nadleeh",
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
    "cardNumber": "SD53-005",
    "name": "Gundam Kyrios ［Trans-Am］",
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
    "cardNumber": "SD53-006",
    "name": "Gundam Virtue ［Trans-Am］",
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
    "cardNumber": "SD53-007",
    "name": "Gundam Dynames ［Trans-Am］",
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
    "cardNumber": "SD53-008",
    "name": "Allelujah Haptism",
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
    "cardNumber": "SD53-009",
    "name": "Setsuna F. Seiei",
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
            "amount": 2
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
    "cardNumber": "SD53-010",
    "name": "Tieria Erde",
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
            "amount": 2
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
    "cardNumber": "SD53-011",
    "name": "Lockon Stratos ［Neil Dylandy］",
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
            "amount": 2
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
    "cardNumber": "SD53-012",
    "name": "GN Arms Type-E",
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
            "op": "REFRESH_SELF"
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
    "cardNumber": "SD53-014",
    "name": "Ptolemaios",
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
    "cardNumber": "SD53-015",
    "name": "Can't be stopped",
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
    "cardNumber": "SD53-016",
    "name": "We are Celestial Being",
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
    "cardNumber": "SD53-X02",
    "name": "Gundam Exia ［Trans-Am］",
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
    "cardNumber": "SD54-001",
    "name": "Loto",
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
    "cardNumber": "SD54-002",
    "name": "Geara Zulu",
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
    "cardNumber": "SD54-003",
    "name": "Stark Jegan",
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
    "cardNumber": "SD54-004",
    "name": "Jegan",
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
    "cardNumber": "SD54-005",
    "name": "ReZEL",
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
    "cardNumber": "SD54-006",
    "name": "Delta Plus",
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
    "cardNumber": "SD54-007",
    "name": "Unicorn Gundam ［Unicorn Mode］",
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
    "cardNumber": "SD54-008",
    "name": "Unicorn Gundam 02 Banshee ［Unicorn Mode］",
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
    "cardNumber": "SD54-009",
    "name": "Kshatriya",
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
    "cardNumber": "SD54-010",
    "name": "Banagher Links",
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
    "cardNumber": "SD54-011",
    "name": "Marida Cruz",
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
              "maxBp": 7000
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
    "cardNumber": "SD54-012",
    "name": "Haro",
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
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD54-013",
    "name": "Garanciere",
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
    "cardNumber": "SD54-014",
    "name": "Nahel Argama (UC)",
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
    "cardNumber": "SD54-015",
    "name": "Universal Century Charter",
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
      }
    ]
  },
  {
    "cardNumber": "SD54-016",
    "name": "Beam Magnum",
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
    "cardNumber": "SD54-X01",
    "name": "Unicorn Gundam［Destroy Mode］",
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
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD54-X02",
    "name": "Unicorn Gundam 02 Banshee［Destroy Mode］",
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
    "cardNumber": "SD55-002",
    "name": "The ClownDragon Melt Dragon",
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
    "cardNumber": "SD55-003",
    "name": "The ClownDragon Dvergr Dragon",
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
    "cardNumber": "SD55-004",
    "name": "The ClownDragon Drago-Frankelly",
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
    "cardNumber": "SD55-005",
    "name": "The ClownDragon Poldra&Castardra",
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
    "cardNumber": "SD55-007",
    "name": "The ClownDragon Trickster Dragon",
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
    "cardNumber": "SD55-008",
    "name": "The ClownDragon Gingar Dragon",
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
    "cardNumber": "SD55-009",
    "name": "The ClownDragon Fool-Joker Dragon",
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
    "cardNumber": "SD55-010",
    "name": "The Bookshelf Canyon Where Sage Lives",
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
    "cardNumber": "SD55-010-A8932",
    "name": "The CanyonLord Wisdomble",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD55-012",
    "name": "Cremation Flame",
    "cardType": "Magic",
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
    "cardNumber": "SD55-013",
    "name": "Fourth Bright Draw",
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
    "cardNumber": "SD57-001",
    "name": "The Six Heaven Soldier",
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
    "cardNumber": "SD57-002",
    "name": "The Six Heaven Falcon",
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
    "cardNumber": "SD57-003",
    "name": "The Six Heaven Head",
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
    "cardNumber": "SD57-004",
    "name": "The Six Heaven Conjurer",
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
    "cardNumber": "SD57-005",
    "name": "The HeavenlyDemonKing Weapons",
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
    "cardNumber": "SD57-006",
    "name": "The HeavenlyDemonKing God-Sechs -Type Final-",
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
    "cardNumber": "SD57-CP01",
    "name": "Tenma Nobunaga",
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
    "cardNumber": "SD57-TX01",
    "name": "The HeavenlyDemonKing God-Sechs -Type Earth-",
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
    "cardNumber": "SD57-TX01-A10706",
    "name": "The HeavenlyDemonKing God-Sechs -Type Heaven-",
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
    "cardNumber": "SD57-X01",
    "name": "Queen Oichi",
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
    "cardNumber": "SD57-X02",
    "name": "The HeavenlyDemonKing God-Sechs -Type Shadow-",
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
    "cardNumber": "SIEGWURM-NOVA",
    "name": "The SupernovaDragon Siegwurm-Nova X",
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
  }
];

for (const spec of SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
