/**
 * engine/cards/sets/bs03_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS03_SAGA_CARDS)
 * Total Cards: 155 (127 Effect, 28 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS03_SAGA_CARDS = [
  {
    "cardNumber": "ARMA-DILLO2",
    "name": "Arma-Dillo",
    "cardType": "Spirit",
    "effect": "[LV2] (Opposing Attack Step) All your White Spirits gain +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "targetFilter": {
          "color": "White"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BARAN-BARAN2",
    "name": "The Repairer Baran-Baran",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (During the Battle Phase) While you control a green nexus, each time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effect of Crush, gain 1 core on this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "requireNexus": {
            "color": "green",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BAT-BAT2",
    "name": "Bat-Bat",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) If this spirit is blocked, you may move 1 core from the blocking spirit to its owner's reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "If this spirit is blocked, you may move 1 core from the blocking spirit to its owner's reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1003",
    "name": "The LavaDragon Plesios",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) When both players control three or more colors of Nexuses in total, each player targets a color of Nexuses on their Field, and destroy every Nexus without that color.\n\n[LV3] (When Attacks) If the opponent controls two or more colors of Nexuses, when this Spirit's attack reduces the opposing Life, send an extra core from the opposing Life to the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CHOOSE_COLOR",
            "text": "When both players control three or more colors of Nexuses in total, each player targets a color of Nexuses on their Field"
          },
          {
            "op": "DESTROY_NEXUS",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1009",
    "name": "The PreciousBeast Carbulc",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed) Gain 1 core in your Reserve for each \"Imaginary Beast\" spirit you control.\n\n[LV2][LV3] (When Destroyed) Draw 1 card for each \"Imaginary Beast\" spirit you control.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Gain 1 core in your Reserve for each \"Imaginary Beast\" spirit you control."
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Imaginary Beast"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1025",
    "name": "Xscissors",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Start Step) The number of cores on target nexus you control is treated as the same as the number of cores on this spirit until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_CORE_COUNT",
            "text": "The number of cores on target nexus you control is treated as the same as the number of cores on this spirit until end of turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10250",
    "name": "The GiantCat Blynx",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) Each player draws 1 card.\n\n[LV2] (When Destroyed) Your opponent randomly discards 1 card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DRAW",
            "text": "Each player draws 1 card."
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "Your opponent randomly discards 1 card."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10254",
    "name": "The GiantCentaurusSoldier Danston",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10463",
    "name": "The GreatAngelia Exsia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Brilliance (During Your Battle Phase) While this spirit is battling, each time you play a spell card, at the End of Battle Step, move that spell card from your Trash to your hand.\n\n[LV2][LV3] (When Attacks) If you control a purple nexus, draw 1 card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10553",
    "name": "The GroundSupporter Francis",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks) You may discard a nexus card from your hand. In that case, this spirit gets +5000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
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
    "cardNumber": "BATTLE-SPIRITS-A10823",
    "name": "The High Sky Covered by Metal",
    "cardType": "Nexus",
    "effect": "[LV1] (Opponent's Battle Phase) At start of Phase, refresh target exhausted spirit you control with no printed effects.\n\n[LV2] (Opponent's Battle Phase) At start of Phase, refresh all exhausted spirits you control with no printed effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11035",
    "name": "The IronFist Tiga",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11148",
    "name": "The Kingdom of Cards",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phrase) All \"Magician\" spirits you control cannot be exhausted by the effects of a card your opponent controls.\n\n[LV2] (During Your Battle Phrase) Each time a Yellow spirit you control is destroyed or depleted, refresh target exhausted \"Magician\" spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11399",
    "name": "The Middle of Hard Battle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opponent's Battle Phase) At start of Phase, destroy target spirit your opponent controls with 1000 BP or less.\n\n[LV2] (During Your Battle Phase) Each time a spirit you control with Evolution defeats a spirit, destroy target spirit your opponent controls with the same BP as the defeated spirits BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 1000,
            "count": 1,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Each time a spirit you control with Evolution defeats a spirit, destroy target spirit your opponent controls with the same BP as the defeated spirits BP."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11637",
    "name": "The Outlaw Wasteland",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) All spirits you control with no printed effects get +2000BP.\n\n[LV2] (During Your Battle Phase) Each time a spirit you control with no printed effects would be defeated, it remains on your Field exhausted instead.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "amount": 2000
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12032",
    "name": "The RoseLady Barossa",
    "cardType": "Spirit",
    "effect": "[LV2] (During Your Battle Phase) You may play yellow spell cards from your hand without paying their cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CAST_MAGIC_FREE",
            "text": "You may play yellow spell cards from your hand without paying their cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12155",
    "name": "The SeaCreature Dugong",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12255",
    "name": "The Sea of Trees in Dark Green",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) Each time a spirit you control with no printed effects defeats a spirit, gain 1 core on this nexus.\n\n[LV2] (During Your Battle Phase) Each time a spirit you control with no printed effects is defeated, it is moved to your hand instead of your Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Each time a spirit you control with no printed effects defeats a spirit, gain 1 core on this nexus."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13392",
    "name": "The Unicorn Einhorn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks) This spirit gets +1000BP for each nexus you control until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
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
    "cardNumber": "BATTLE-SPIRITS-A13525",
    "name": "The Weaponsmith Bagin",
    "cardType": "Spirit",
    "effect": "[LV1] (When Attacks) This spirit gets +1000BP for each nexus you control until end of turn.\n\n[LV2] (When Attacks) This spirit gets +1000BP for each nexus players control until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
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
    "cardNumber": "BATTLE-SPIRITS-A13677",
    "name": "The WoodenSpirit Dryadena",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14198",
    "name": "United Power",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Exhaust an unexhausted spirit you control. In that case, target spirit you control gets + X BP until end of turn where X is equal to the exhausted spirits BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14357",
    "name": "Weakness",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Move all but 1 core from target spirit to its owner's reserve.\n\n(Flash Step)(Your Main Phase) Target spirit gets +3000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Move all but 1 core from target spirit to its owner's reserve."
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2675",
    "name": "Angelafish",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3193",
    "name": "Brontrident",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) While you control a spirit with Evolution, this spirit gets +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3454",
    "name": "Chihuahl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Permanent) \"Imp\" spirits you control get +1000BP.\n\n[LV2][LV3] (Permanent) Each time a \"Toy Beast\" spirit you control is destroyed, move it to your hand instead.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "amount": 1000
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "REPLACEMENT_EFFECT",
            "text": "Each time a \"Toy Beast\" spirit you control is destroyed, move it to your hand instead."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3725",
    "name": "Delta Crash",
    "cardType": "Magic",
    "effect": "Flash- If you control three or more \"Fighting Spirit\" family Spirits, destroy an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "requireFamilyOnField": {
            "family": "Fighting Spirit",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "If you control three or more \"Fighting Spirit\" family Spirits, destroy an opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3841",
    "name": "Dongurin",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4014",
    "name": "Enchu",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4184",
    "name": "Flame Cyclone",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Destroy target spirit with 5000BP or less.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4203",
    "name": "Fall Down",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Move all cores from all nexuses to their owner's Trash.\n\n(Flash Step)(Your Main Phase) Target spirit gets +1000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Move all cores from all nexuses to their owner's Trash."
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4284",
    "name": "Four Cards",
    "cardType": "Magic",
    "effect": "(Your Main Phrase) If you control 4 or more \"Magician\" spirits, all spirits your opponent controls are treated as LV1 until end of turn.\n\n(Flash Step)(Your Main Phrase) Target spirit gets +2000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "levels": [
            1
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_LEVEL",
            "text": "If you control 4 or more \"Magician\" spirits, all spirits your opponent controls are treated as LV1 until end of turn."
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4292",
    "name": "Forthros",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4380",
    "name": "Froger",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4421",
    "name": "Fullmingo",
    "cardType": "Spirit",
    "effect": "[LV2] (Permanent) All spirit cards with High Speed in your hand get 1 additional green Reduction Cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "All spirit cards with High Speed in your hand get 1 additional green Reduction Cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4611",
    "name": "Golem Craft",
    "cardType": "Magic",
    "effect": "(Your Main Phase) All nexuses you control with a core on them lose their effects and are treated as spirits (Cost of 1/\"Artificial Soldier\" characteristic/[1] LV1:2000BP/No printed effects/1 Blue Gem) instead until end of turn.\n\n(Flash Step)(Your Main Phase) Target spirit gets +2000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "levels": [
            1
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "All nexuses you control with a core on them lose their effects and are treated as spirits (Cost of 1/\"Artificial Soldier\" characteristic/[1] LV1:2000BP/No printed effects/1 Blue Gem) instead until end of turn."
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A5242",
    "name": "Jellfy",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) If you control any Purple Spirit, draw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6294",
    "name": "Machfly",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6513",
    "name": "Mikene",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Refresh target exhausted spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6644",
    "name": "Mogrunner",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step. In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve.\n\n[LV2] (Permanent) Each time your opponent draws 1 or more cards, if this spirit is exhausted, refresh this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6951",
    "name": "Ochogo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) If you control a green spirit, gain 1 core on this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "If you control a green spirit, gain 1 core on this spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7211",
    "name": "Poison Mist",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Move any number of cores from your Reserve to your Trash. Then, move the same number of cores from your opponent's Reserve to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Move any number of cores from your Reserve to your Trash."
          },
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7220",
    "name": "Ponysus",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7353",
    "name": "Puppet String",
    "cardType": "Magic",
    "effect": "(Your Main Phase) All yellow spirits you control get \"Magician\" characteristic and are treated as spirits that have \"Arcana\" in their names until end of turn.\n\n(Flash Step)(Your Main Phase) Target spirit gets +1000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "All yellow spirits you control get \"Magician\" characteristic and are treated as spirits that have \"Arcana\" in their names until end of turn."
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7538",
    "name": "Rumpkin",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7573",
    "name": "Salvage",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Reveal the top 5 cards of your Deck. If there are 1 or more nexus cards among them, select 1 of them and move it to your hand. Then, return the rest to the bottom of your Deck in any order. If not, return them in the same order.\n\n(Flash Step)(Your Main Phase) Target spirit gets +3000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "REVEAL_DECKTOP",
            "text": "Reveal the top 5 cards of your Deck."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If there are 1 or more nexus cards among them, select 1 of them and move it to your hand."
          },
          {
            "op": "BOUNCE_TO_DECK",
            "position": "BOTTOM",
            "count": 1
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7575",
    "name": "Same Tired",
    "cardType": "Magic",
    "effect": "Flash- Exhaust opposing Spirits until they control the same number of exhausted Spirits as you do.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7696",
    "name": "Sharkhammer",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] When your nexuses are destroyed, refresh this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7949",
    "name": "Stagscissor",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8193",
    "name": "Teleport Change",
    "cardType": "Magic",
    "effect": "Flash - Treat one of your battling Spirits as not battling, and target an exhausted Spirit you control to continue the battle.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "Treat one of your battling Spirits as not battling"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUE_BATTLE",
            "text": "target an exhausted Spirit you control to continue the battle."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8354",
    "name": "The Angelia Archre",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) All yellow spell cards in your hand get 2 additional yellow Cost Reduction.\n\n[LV2] (Permanent) All yellow spirit cards in your hand get 2 additional yellow Cost Reduction.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "All yellow spell cards in your hand get 2 additional yellow Cost Reduction."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "All yellow spirit cards in your hand get 2 additional yellow Cost Reduction."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8534",
    "name": "The ArmoredSnake Mithgarth",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks) This spirit gets +1000BP for each \"Giant Beast\" spirit you control until end of turn.\n\n[LV2] (During Opponent's Battle Phase) When this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Giant Beast"
            }
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8570",
    "name": "The AssaultSoldier Norman",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) You may deploy a blue nexus card from your hand without paying its cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8680",
    "name": "The BattleDragon Wyvern",
    "cardType": "Spirit",
    "effect": "[LV1] (During Opponent's Battle Phase) This spirit cannot block\n\n[LV1][LV2] (When Attacks) This spirit cannot be blocked by LV1 spirits this turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "(During Opponent's Battle Phase) This spirit cannot block"
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8718",
    "name": "The BearMan Beard",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8767",
    "name": "The BlackWind Panther",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) This spirit gets +1000BP for each core in your Reserve until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
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
    "cardNumber": "BATTLE-SPIRITS-A8791",
    "name": "The BirdMan Hawkeye",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (During Your Battle Phase) Each time this spirit deals any damage to your opponent's life, move the top 5 cards of your opponent's Deck to their Trash.\n\n[LV2] (When Attacks) If you control a purple nexus, this spirit cannot be blocked this turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MILL",
            "text": "Each time this spirit deals any damage to your opponent's life, move the top 5 cards of your opponent's Deck to their Trash."
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9188",
    "name": "The Crossroads of Destiny",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During the Battle Phase) Each time a spirit you control with no printed effects is defeated, draw 1 card.\n\n[LV2] (During the Battle Phase) Each time a spirit you control with no printed effects defeats a spirit, exhaust target unexhuasted spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9305",
    "name": "The DarkReefDiva Seiren",
    "cardType": "Spirit",
    "effect": "[LV2] (During the Battle Phase) When this spirit defeats a spirit, exhaust target unexhausted spirit your opponent controls.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A931",
    "name": "Bathopper",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) Gain 1 core on this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Gain 1 core on this spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A934",
    "name": "Caprihorn",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) This spirit gets +1000 BP for each unexhausted spirit your opponent controls until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
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
    "cardNumber": "BATTLE-SPIRITS-A935",
    "name": "Cast Off (Card)",
    "cardType": "Magic",
    "effect": "(Your Main Phrase) Destroy target \"Parasite\" spirit you control. In that case, summon a spirit card from your hand with a cost of five without paying the cost.\n\n(Flash Step)(Your Main Phrase) Target spirit gets +2000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy target \"Parasite\" spirit you control."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A936",
    "name": "Chagamaru",
    "cardType": "Spirit",
    "effect": "[LV3] (Opponent's Attack Step) When this Spirit is destroyed by opposing Spirit/Magic/Nexus effects, by sending all but one core on this Spirit to the Trash, it returns to the field, refreshed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A937",
    "name": "Chauw",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) Each time 1 or more cores are put on this spirit due to an effect, increase the number by 1.\n\n[LV2] (Permanent) Each time 1 or more cores are moved from a spirit to its owner's Reserve, due to an effect, increase that number by 1.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "Each time 1 or more cores are put on this spirit due to an effect, increase the number by 1."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "Each time 1 or more cores are moved from a spirit to its owner's Reserve, due to an effect, increase that number by 1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A949",
    "name": "Liorider",
    "cardType": "Spirit",
    "effect": "[LV2] (During Opponent's Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A954",
    "name": "Mind Flare",
    "cardType": "Magic",
    "effect": "Main- If the opponent controls two or more Spirits with the same name, leaving off one Spirit for each different name, and destroy all the other Spirits.\n\nFlash- During this turn, give a Spirit gets +4000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "If the opponent controls two or more Spirits with the same name, leaving off one Spirit for each different name"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "destroy all the other Spirits."
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A955",
    "name": "Mummella",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Move 1 core from target spirit your opponent controls to its owner's Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Move 1 core from target spirit your opponent controls to its owner's Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A959",
    "name": "Phantasma",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A960",
    "name": "Piyon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A961",
    "name": "Porkne",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (Permanent) All \"Drifting Spirits\" you control are unaffected by the effects of spells your opponent controls.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "All \"Drifting Spirits\" you control are unaffected by the effects of spells your opponent controls."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A963",
    "name": "Rom",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9653",
    "name": "The Earth of Aurora",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Permanent) Each time one or more cores are moved from a spirit you control to your Reserve or Trash by the effects of a card your opponent controls, gain 1 core in your Reserve.\n\n[LV2] (Your Core Step) If you control an \"Armed Machine\" spirit, gain 1 core in your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Each time one or more cores are moved from a spirit you control to your Reserve or Trash by the effects of a card your opponent controls, gain 1 core in your Reserve."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "If you control an \"Armed Machine\" spirit, gain 1 core in your Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A966",
    "name": "Scorpede",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) You may deploy target white or green nexus card from your Trash without paying its cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9674",
    "name": "The EvilGrass Mindragora",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed) Move 1 core from target spirit your opponent controls to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Move 1 core from target spirit your opponent controls to their Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A968",
    "name": "Sheeple",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A969",
    "name": "Skuldia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Refresh Step) This spirit cannot be refreshed.\n\n[LV2][LV3] (When Exhausted) Select an exhausted spirit your opponent controls. In that case, while this spirit is exhausted, that spirit cannot be refreshed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "This spirit cannot be refreshed."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Select an exhausted spirit your opponent controls."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "In that case, while this spirit is exhausted, that spirit cannot be refreshed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9753",
    "name": "The Endless Horizon",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) The BP of each LV1 spirits you control is treated as their LV2 BP in the Showdown Step.\n\n[LV2] (During Your Battle Phase) Each time a spirit you control with High Speed is defeated, you may move more 1 core from your Reserve to your Trash. In that case, the defeated spirit is moved to your hand instead of your Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "BP_BUFF",
            "text": "The BP of each LV1 spirits you control is treated as their LV2 BP in the Showdown Step."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Each time a spirit you control with High Speed is defeated, you may move more 1 core from your Reserve to your Trash."
          },
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A978",
    "name": "The BalloonMan Barball",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A981",
    "name": "The BlossomChild Lip",
    "cardType": "Spirit",
    "effect": "[LV2] (During Your Battle Phase) Each time a spirit your opponent controls blocks a yellow spirit you control, if you control a combination of three yellow spirits or yellow nexuses, that blocking spirit is treated as being at LV1 until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_LEVEL",
            "text": "Each time a spirit your opponent controls blocks a yellow spirit you control, if you control a combination of three yellow spirits or yellow nexuses, that blocking spirit is treated as being at LV1 until end of turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A984",
    "name": "The CavalryBeast Sleiphorse",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (During Your Battle Phase) Each time this spirit gets an addition to its BP due to the effects of a green spell, this spirit gets an addition +2000BP until end of turn.\n\n[LV3] (During Your Battle Phase) Each time another green spirit you control gets an addition to its BP due to the effect of a green spell, it gets an additional +2000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "amount": 2000
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A987",
    "name": "The Conqueror Cendragos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Each player selects 1 color among the spirits they control. Then, each player destroys all of their spirits except the ones with the selected color(s).\n\n[LV2] (When Attacks) This spirit gets +4000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CHOOSE_COLOR",
            "text": "Each player selects 1 color among the spirits they control."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "each player destroys all of their spirits except the ones with the selected color(s)."
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
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
    "cardNumber": "BATTLE-SPIRITS-A988",
    "name": "The Corridor of Mirrors",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During the Battle Phase) Each time a spirit you control with Immunity: X would be defeated by an X color spirit, that spirit may remain on your Field exhausted instead.\n\n[LV2] (During the Battle Phase) Each time your opponent plays a spell, negate that effect. Then, remove 2 cores from this nexus. This effect can be applied only once per turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "REMAIN_ON_FIELD_EXHAUSTED",
            "text": "(During the Battle Phase) Each time a spirit you control with Immunity: X would be defeated by an X color spirit, that spirit may remain on your Field exhausted instead."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "oncePerTurn": "opt_1"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_MAGIC",
            "text": "(During the Battle Phase) Each time your opponent plays a spell, negate that effect."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "remove 2 cores from this nexus."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "LIMIT_ONCE_PER_TURN",
            "text": "This effect can be applied only once per turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A990",
    "name": "The DarkFeather Yatagross",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed) Gain cores in your Reserve equal to the number of cores that were on this spirit when it was destroyed.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Gain cores in your Reserve equal to the number of cores that were on this spirit when it was destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9906",
    "name": "The FortressCrasher Dennis",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) You may discard a nexus card from your hand. In that case, this spirit gets +5000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
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
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A992",
    "name": "The DragonBuster Archeorni",
    "cardType": "Spirit",
    "effect": "[LV2] When Nexuses on your Field or the opposing Field are destroyed, for each Nexus destroyed, draw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-003",
    "name": "The Assassin Dragno",
    "cardType": "Spirit",
    "effect": "[LV1] (When Attacks)\nThis Spirit can't be blocked by Spirits with [High Speed].\n\n[LV2] (When Attacks)\nThis Spirit can't be blocked by Spirits with [Curse] / [High Speed].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          },
          {
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-008",
    "name": "The BladeDragon Stegorasaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nWhen this Spirit is blocked by a Spirit with the same LV, this Spirit gains +3000 BP.",
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
          "turn": "YOUR"
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
    "cardNumber": "BS03-010",
    "name": "The BlackDragon Vritra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy every 2000 BP or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 2000,
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-011",
    "name": "The DinoCavalry Diridalus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nYou can destroy an opposing 2000 BP or less Spirit.\n\n[LV2] (Your Attack Step)\nAll your Spirits with only one core on them gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 2000,
            "count": 1,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS03-012",
    "name": "The GrandBishop Levia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can destroy a Spirit with three cores or less on it.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, return a Spirit card from your Trash to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "You can destroy a Spirit with three cores or less on it."
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-013",
    "name": "Hellscorpio",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS03-014",
    "name": "Skull-Fish",
    "cardType": "Spirit",
    "effect": "[LV1] (Opposing Attack Step)\nThis Spirit can't block opposing Spirits.\n\n[LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked at the end of battle.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "This Spirit can't block opposing Spirits."
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-016",
    "name": "The InvisibleMan Eclear",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDiscard every face-up card in the opposing Removed Zone, and destroy an opposing Spirit for each of those cards.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "Discard every face-up card in the opposing Removed Zone"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "destroy an opposing Spirit for each of those cards."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-017",
    "name": "The GhostCaptain Silvershark",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked at the end of battle.\n\n[LV2] (When Destroyed)\nYou can destroy a Spirit with two cores on it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "You can destroy a Spirit with two cores on it."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-018",
    "name": "Darkwraith",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS03-020",
    "name": "Mega-Humpdump",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS03-021",
    "name": "The Count Wyhl",
    "cardType": "Spirit",
    "effect": "[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, exhaust every Spirit with the same LV as that destroyed Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-023",
    "name": "The ArtificialCreature No.44",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked at the end of battle.\n\n[LV2] (When Blocks)\nWhen only the opposing Spirit is destroyed via BP comparison, exhaust an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-024",
    "name": "The VampireKnight Nosferat",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nThis Spirit can't be blocked by LV1 Spirits.\n\n[LV2]\nAll your Spirits with [Curse] can't be blocked by LV1 Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          },
          {
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-030",
    "name": "The BeastMaster Rainer Bros.",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nFor each Nexus you control, put a core from the Void to this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-035",
    "name": "The GoldenFlower Zonne-Bloem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void each to every \"Plant Spirit\"/\"Winged Beast\" family Spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put a core from the Void each to every \"Plant Spirit\"/\"Winged Beast\" family Spirit you control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-036",
    "name": "The GodBird Peagod",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Battles)\nWhen this Spirit is destroyed by opposing Spirits via BP comparison, put four cores from the Void to your Reserve.\n\n[LV2] (When Attacks)\nThis Spirit gain +1000 BP for each \"Winged Beast\" family Spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 4
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Winged Beast"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-041",
    "name": "The Artifact Asc",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS03-045",
    "name": "The SilverFox Hati",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nThis Spirit gains +5000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
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
    "cardNumber": "BS03-050",
    "name": "Kinokonoko",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nWhenever you use a Magic effect, this Spirit gains +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
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
    "cardNumber": "BS03-053",
    "name": "The HundredFaces Flatface",
    "cardType": "Spirit",
    "effect": "[LV2]\nThis Spirit is also treated as a White Spirit.\n\n[LV3]\nThis Spirit is also treated as a Purple Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a White Spirit."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Purple Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-054",
    "name": "Arcanadoll-Tria",
    "cardType": "Spirit",
    "effect": "[LV2] [Brilliance] (When Attacks)\nAt the end of battle, return every Magic card you used during this battle to your Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-058",
    "name": "The Fairy Tinguly",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDuring this turn, all your Spirits are also treated as Yellow Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "During this turn, all your Spirits are also treated as Yellow Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-059",
    "name": "Arcanabeast-Paira",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] [Brilliance] (When Attacks)\nAt the end of battle, return every Magic card you used during this battle to your Hand.\n\n[LV3] (Your Attack Step)\nAll your \"Arcana\"-named Spirits gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS03-061",
    "name": "The StrawberryGirl Strawberi",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed)\nRefresh a Spirit with [Brilliance] you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-071",
    "name": "The BattleBeast Bulltop",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS03-072",
    "name": "The Pikeman Jeffrey",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS03-076",
    "name": "The ClawSword Lazarus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards equal to this Spirit's level from opposing decktop.",
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
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "scaleByLevel": true,
            "perLevel": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-078",
    "name": "The Berserker Troll",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS03-093",
    "name": "The BuffaloMan Bulltania",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nThis Spirits gains +2000 BP.",
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
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-101",
    "name": "Volcano-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, put a core from the Void each to every Blue Nexus you control.",
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
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-110",
    "name": "The Sacred Place in Falling Stars",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAll your Spirits with [Brilliance] gain +2000 BP.\n\n[LV2] (Opposing Attack Step)\nThe [Brilliance] effects of your Spirits also activate at (When Blocks).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "targetFilter": {
          "keyword": "Brilliance"
        },
        "amount": 2000
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "The [Brilliance] effects of your Spirits also activate at (When Blocks)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-111",
    "name": "The Child's Room in Midnight",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Spirit with no printed effects is destroyed by an opposing LV1 Spirit via BP comparison, it returns to your Field, exhausted.\n\n[LV2] (Opposing Attack Step)\nWhen your Spirit with no printed effects is destroyed by an opposing LV3 Spirit via BP comparison, it returns to your Field, exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-113",
    "name": "The Absorption Triumphal Arch",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nThe opponent can't use Magic cards that don't share the same colors as the symbols on their Field.\n\n[LV2]\nThe opponent can't use Magic cards unless they pay the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "The opponent can't use Magic cards that don't share the same colors as the symbols on their Field."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "The opponent can't use Magic cards unless they pay the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-114",
    "name": "The Rampart of Sapphire",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nFor your Spirits with no printed effects, if there is one core on them, treat them as LV1; If there are two cores, treat them as LV2; If there are three cores or more, treat them as being on their highest level.\n\n[LV2]\nWhile you control three or more Spirits with no printed effects, all your Nexuses can't be destroyed by opposing Spirit/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "For your Spirits with no printed effects, if there is one core on them, treat them as LV1; If there are two cores, treat them as LV2; If there are three cores or more, treat them as being on their highest level."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "INDESTRUCTIBLE",
            "text": "While you control three or more Spirits with no printed effects, all your Nexuses can't be destroyed by opposing Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-115",
    "name": "The Collapse of Battle Line",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen discarding cards from the opposing deck via [Crush] effects, discard +2 cards.\n\n[LV2] (Your Attack Step)\nEvery Spirit with [Crush] you control is treated as being on its highest level.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "keyword": "Crush"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Crush"
      }
    ]
  },
  {
    "cardNumber": "BS03-116",
    "name": "The Loss of Heroes",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Main Step)\nWhen cards are added to the opposing Hand, for each card added, discard a card from the opposing decktop.\n\n[LV2] (Either Attack Step)\nWhen your \"Soldier\" family Spirit is destroyed by opposing Spirits via BP comparison, discard five cards from the opposing decktop.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-117",
    "name": "The H.Q. filled with Fighting Spirits",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nYour Spirits' [Crush] effects also activate at (When Blocks).\n\n[LV2] (Either Attack Step)\nWhen cards are discarded from the opposing deck via [Crush] effects, put a core from the Void to your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "scaleByLevel": true,
            "perLevel": 1
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Crush"
      }
    ]
  },
  {
    "cardNumber": "BS03-118",
    "name": "Fourth Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw until you have four cards in Hand.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-119",
    "name": "Buster Lance",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy every LV1 Nexus.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "levels": [
            1
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_NEXUS",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-121",
    "name": "Double Hearts",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a Spirit you or the opponent controls. During this turn, give it an extra symbol with the same color as the symbol it originally has.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Target a Spirit you or the opponent controls."
          },
          {
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-123",
    "name": "Necromancy",
    "cardType": "Magic",
    "effect": "[Main]\nReturn every \"Zombie\" family Spirit card from your Trash to the Hand.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-126",
    "name": "Potion Berry",
    "cardType": "Magic",
    "effect": "[Flash]\nPut a core from the Void to a Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "TARGET_SPIRIT",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-127",
    "name": "Ivy Cage",
    "cardType": "Magic",
    "effect": "[Main]\nExhaust every 2000 BP or less Spirit.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-128",
    "name": "Multiple Cores",
    "cardType": "Magic",
    "effect": "[Flash]\nFor each exhausted Spirit you control, put a core from the Void to your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-129",
    "name": "Flock Recovery",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a family. Refresh three Spirits of the target family you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_FAMILY",
            "text": "Target a family."
          },
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-130",
    "name": "Möbius Loop",
    "cardType": "Magic",
    "effect": "[Main]\nReturn a Nexus to its owner's Hand. If an opposing Nexus is returned to the Hand, put a core from the Void to your Trash.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "TRASH",
            "count": 1
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-132",
    "name": "Perfect Guard",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your Spirits with [Armor] is destroyed by opposing Spirits via BP comparison, they return to the Field, exhausted.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-133",
    "name": "High Elixir",
    "cardType": "Magic",
    "effect": "[Flash]\nSend two cores from your Reserve to your Life. (This effect can only be used once per turn.)",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Send two cores from your Reserve to your Life."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-135",
    "name": "Escape Route",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your Spirits with two or more families are destroyed by opposing Spirits via BP comparison, return them to your Hand.\n\n[Flash]\nTarget a Spirit you or the opponent controls. During this turn, give it +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-136",
    "name": "Focus Light",
    "cardType": "Magic",
    "effect": "[Main]\nFor each Spirit with [Brilliance] you control, draw a card.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-140",
    "name": "Shining Magic",
    "cardType": "Magic",
    "effect": "[Main]\nChoose and return a Magic card from your Trash to the Hand.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-141",
    "name": "Build Up",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a Spirit you or the opponent controls. During this turn, it is treated as being one LV higher.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Target a Spirit you or the opponent controls."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "During this turn, it is treated as being one LV higher."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-143",
    "name": "Blitz",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your Spirit with [Crush] attacks, put a core from the Void to your Trash.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "scaleByLevel": true,
            "perLevel": 1
          },
          {
            "op": "CORE_FROM_VOID",
            "to": "TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-145",
    "name": "Scramble",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, give all your \"Fighting Spirit\" family Spirits +3000 BP.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 3000,
            "filter": {
              "family": "Fighting Spirit"
            }
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-146",
    "name": "Nexus Register",
    "cardType": "Magic",
    "effect": "[Main]\nDiscard any number of Nexus cards from your Hand. For each Nexus card you discarded, draw a card.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-148",
    "name": "Construction",
    "cardType": "Magic",
    "effect": "[Main]\nDeploy every Red/Green/Blue Nexus cards from your Trash, without paying the costs.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-X09",
    "name": "The SavageKnight Hercules",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Flash - [High Speed]\nThis Spirit card in Hand can be summoned during the Flash Timing. When you do, cores to be put on this Spirit and its cost must be paid from the Reserve.\n\n[LV1][LV2] (When Summoned)\nRefresh all Spirits with [High Speed].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "When you do, cores to be put on this Spirit and its cost must be paid from the Reserve."
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-X10",
    "name": "The IceBeast Mam-Morl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nGive all your White Spirits the effect: \"(When Blocks) This Spirit gains +2000 BP.\"\n\n[LV2]\nGive all your Spirits the effect: \"[Armor: Red/Purple/Green] This Spirit is unaffected by opposing Red/Purple/Green Spirit/Nexus/Magic effects.\"\n\n[LV3]\nGive all your Spirits: [Armor: Red/Purple/Green/Yellow/Blue].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {
              "family": "(When Blocks) This Spirit gains +2000 BP.",
              "color": "White"
            }
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Armor: Red/Purple/Green"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "keyword": "Armor: Red/Purple/Green/Yellow/Blue"
      }
    ]
  },
  {
    "cardNumber": "BS03-X11",
    "name": "The ArcAngelia Valiero",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nTarget a color between Green/Yellow. Return every Magic card with the targeted color from the Trash to your Hand.\n\n[LV2][LV3] [Brilliance] (When Attacks)\nAt the end of the battle, return every Magic card you used during this battle to your Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CHOOSE_COLOR",
            "text": "Target a color between Green/Yellow."
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS03-X12",
    "name": "The GiantHero Titus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDiscard ten cards from the opposing decktop.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed by BP comparison, discard ten cards from the opposing decktop.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BUN-FFALO2",
    "name": "The BattleBeast Bun-Ffalo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "DEEP-ARNOLD2",
    "name": "Deep-Arnold",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "FLAME-ELK2",
    "name": "Flame-Elk",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Destroy all nexuses with a core on them.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "NAPRINCESS-UN2",
    "name": "Arcanaprincess-Un",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) For each \"Arcana\"-named Spirit you control, this Spirit gains +1000 BP.\n\n[LV2][LV3] All Cost 3 Spirits you control are treated as \"Arcana\"-named.",
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
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Arcana"
            }
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "All Cost 3 Spirits you control are treated as \"Arcana\"-named."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "RHINO-CEROS2",
    "name": "The BattleBeast Rhino-Ceros",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed) Move cards from the top of your opponent's Deck to their Trash equal to the number of cores on this spirit.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "STONE-STATUE2",
    "name": "Stone-Statue",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Move the top card of your opponent's Deck to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "TI-TANYA2",
    "name": "The FairyQueen Ti-Tanya",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (Opponent's Battle Phase) At start of the Phase, you may move 2 cores from your Trash to this spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "VER-THANDIA2",
    "name": "Ver-Thandia",
    "cardType": "Spirit",
    "effect": "[LV2][LV2] (When Blocks) Refresh target exhausted \"Giant Beast\" spirit you control.\n\n[LV3] (Your Core Step) If you control \"Ur-Dine\", \"Ver-Thandia\" and \"Skuldia\", gain 1 core in your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "If you control \"Ur-Dine\", \"Ver-Thandia\" and \"Skuldia\", gain 1 core in your Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "ZO-GOIN2",
    "name": "The SkullKnight Zo-Goin",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) Move 1 core from target spirit your opponent controls to its owner's Reserve.\n\n[LV3] (When Attacks) Randomly discard 1 card from your opponent's hand.",
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
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Move 1 core from target spirit your opponent controls to its owner's Reserve."
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "Randomly discard 1 card from your opponent's hand."
          }
        ]
      }
    ]
  }
];

for (const spec of BS03_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
