/**
 * engine/cards/sets/bs06_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS06_SAGA_CARDS)
 * Total Cards: 102 (89 Effect, 13 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS06_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10352",
    "name": "The GolemCraftEngineer Gatan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Give all your \"Artificial Soldier\" family Spirits +1000 BP.\n\n[LV2] When only the opposing Spirit is destroyed via BP comparison with your \"Artificial Soldier\" family Spirits, put a core from the Void to this Spirit.",
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
          "family": "Artificial Soldier"
        },
        "amount": 1000
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10734",
    "name": "The HellMusician Mur",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Curse (During Your Battle Phase) Each time this spirit is blocked , destroy the spirit that blocked this spirit at the End of Battle Step.\n\n[LV2][LV3] (When Destroyed) Move all but 1 core from target spirit your opponent controls to the owners reserve",
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
            "rule": "KEYWORD_ACTION",
            "text": "Each time this spirit is blocked , destroy the spirit that blocked this spirit at the End of Battle Step."
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1085",
    "name": "Smoggoat",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Send a core from any opposing Spirits to the Reserve. This effect cannot bring the cores on the opposing Spirit to 0.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CARD_RULE_MODIFIER",
            "text": "This effect cannot bring the cores on the opposing Spirit to 0."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10889",
    "name": "The HugeGiant Eurytos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Destroy every Cost 3 or less Spirit.",
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
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11004",
    "name": "The Intentional Scuffle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) \"Fighting Spirit\" family Spirits you control can block opposing Cost 1 or less Spirits while exhausted.\n\n[LV2] (Your Attack Step) When \"Fighting Spirit\" family Spirit you control is blocked, destroy another opposing Spirit with a cost equal to the blocking Spirit's.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11486",
    "name": "The MuscleBraggart Humphrey",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Crush (When Attacks) Discard cards from the opposing decktop equal to this Spirit's level.",
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
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12107",
    "name": "The Scabbardfish Espada",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12303",
    "name": "The ShineDragonPalace Breidhablic",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks) Put a core from the Void to this Spirit.\n\n[LV2][LV3] (When Blocks) This Spirit gains +4000 BP.",
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "turn": "OPPONENT"
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
    "cardNumber": "BATTLE-SPIRITS-A12548",
    "name": "The SnowKiddie Yeti",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) If this spirit is unexhausted, exhaust this spirit.\n\n[LV2] (During Opponent's Battle Phase) Each time your opponent plays a spell, if this spirit is exhausted, refresh this spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A13070",
    "name": "The Tactician Shoujouji",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Main Step) Neither player can use Flash effects of Magic cards.",
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
            "rule": "MAGIC_RESTRICTION",
            "text": "Neither player can use Flash effects of Magic cards."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13827",
    "name": "Tonbeaul",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13901",
    "name": "Tsathoggua",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13907",
    "name": "Tsukushinmoa",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step. In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve.\n\n[LV1][LV2] (When Summoned) Your opponent discards 1 card.",
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
            "rule": "DISCARD_HAND",
            "text": "Your opponent discards 1 card."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14428",
    "name": "White Hole",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Move all nexuses to their owners' hand.\n\n(Flash Step)(Your Main Phase) Target spirit gets +3000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A1591",
    "name": "The SilverWolfEmperor Gagnrathr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks) This spirit gets +1000BP for each spirit you control with Immunity: X until end of turn.\n\n[LV2] (When Blocks) Exhaust 2 target unexhausted spirits your opponent controls.",
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
    "cardNumber": "BATTLE-SPIRITS-A3128",
    "name": "Bloody Coffin",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Destroy target exhausted spirit with a cost of 4 or less.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_EXHAUSTED",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3249",
    "name": "Burial Draw",
    "cardType": "Magic",
    "effect": "(Your Main Phase) During this turn, each time a purple spirit you control is defeated by BP comparing, draw 2 cards.\n\n(Flash Step)(Your Main Phase) Target spirit gets +2000BP until end of turn.",
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
            "count": 2
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
    "cardNumber": "BATTLE-SPIRITS-A3385",
    "name": "Chivalry",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phrase) Refresh all exhausted spirits you control. Non-\"Mounted Warrior\" spirits refreshed by this effect cannot attack this turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {
              "family": "Mounted Warrior"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3514",
    "name": "Counter Curse",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Change the text of Curse on spirits you control to the following until end of turn (the Levels at which Curse is available do not change):\n\nCurse (During Opponent's Battle Phase) Each time this spirit blocks, destroy the spirit that attacked this spirit at End of Battle Step.",
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
            "rule": "CARD_RULE_MODIFIER",
            "text": "Change the text of Curse on spirits you control to the following until end of turn (the Levels at which Curse is available do not change):"
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3679",
    "name": "Demolish",
    "cardType": "Magic",
    "effect": "(Your Main Phrase) During this turn, each time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effect of Crush, increase that number by 3.\n\n(Flash Step)(Your Main Phrase) Target spirit gets +5000BP until end of turn.",
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
            "rule": "KEYWORD_RULE",
            "text": "During this turn, each time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effect of Crush, increase that number by 3."
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
            "amount": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3835",
    "name": "Dolphino",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4691",
    "name": "Gremly",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Destroyed) Refresh target exhausted spirit you control with Brilliance.",
    "isVanilla": false,
    "abilities": [
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6232",
    "name": "Laserpanda",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6250",
    "name": "Lightning Aura",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Attacking spirits you control without Rage get +1000BP until end of turn and those with Rage get +3000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BATTLE-SPIRITS-A6309",
    "name": "Level Drain",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Move cores from target LV 2 or higher spirit your opponent controls to its owner's Trash until the number of cores on it is equal to its LV X cost. X is its current LV minus 1.",
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
            "to": "RESERVE",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "X is its current LV minus 1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6504",
    "name": "Maximum Break",
    "cardType": "Magic",
    "effect": "(Your Main Phase) During this turn, effects of spirits you control that have a limit on the number of cards they can move from the top of the Deck to the Trash have their limit increased by 10.\n\n(Flash Step)(Your Main Phase) Target spirit gets +4000BP until end of turn.",
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
            "count": 2
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
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6546",
    "name": "Mepon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6605",
    "name": "Mistral Core",
    "cardType": "Magic",
    "effect": "Main- During this turn, when opposing Spirits are exhausted due to your Spirits' Windstorm effects, for each Spirit exhausted, put a core from the Void to Spirits you control.\n\nFlash- During this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
    "cardNumber": "BATTLE-SPIRITS-A7121",
    "name": "Ovirapt",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) During this turn, every \"Terra Dragon\" family Spirit you control gains +1000 BP.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7133",
    "name": "Pigeonheadiless",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7322",
    "name": "Reclamation",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Destroy target nexus you control. In that case, you may summon a blue spirit card from your hand with a cost of 4 or less without paying its cost.\n\n(Flash Step)(Your Main Phase) Target spirit gets +2000BP until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_NEXUS",
            "count": 1
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
    "cardNumber": "BATTLE-SPIRITS-A7623",
    "name": "Savage Power",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Target spirit gets +2000BP for each Gem it has until end of turn.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BATTLE-SPIRITS-A7681",
    "name": "Senzangou",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (During Your Battle Phase) This spirit cannot attack.\n\n[LV1][LV1] (Permanent) Each time any Damage is dealt to your Life, if this spirit is exhausted, refresh this spirit.",
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
            "text": "This spirit cannot attack."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1
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
    "cardNumber": "BATTLE-SPIRITS-A7860",
    "name": "Skullgoyle",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8100",
    "name": "Speed Star",
    "cardType": "Magic",
    "effect": "Main- During this turn, when the attack of your Spirit reduces the opposing Life, put two cores from the Void to your Reserve.\n\nFlash- During this turn, give a Spirit +3000 BP.",
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
            "to": "RESERVE",
            "count": 2
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
    "cardNumber": "BATTLE-SPIRITS-A8672",
    "name": "The BattleBeast Zouuchi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) While you control a \"Beast Head\" spirit, this spirit is treated as being at LV2.",
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
            "rule": "TREAT_LEVEL",
            "text": "While you control a \"Beast Head\" spirit, this spirit is treated as being at LV2."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9360",
    "name": "The Decurion Dragron",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9465",
    "name": "The Doom Coffin",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Opponent's Main Phase) Each time a player puts 1 or more cores on a spirit except due to an effect, exhaust that spirit\n\n[LV2] (During Opponent's Battle Phase) Each time a spirit attacks, move 1 core from that spirit to its owner's Trash.",
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
          ],
          "turn": "OPPONENT"
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
    "cardNumber": "BS06-005",
    "name": "The DinosaurPrincess Jura",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nYour \"Terra Dragon\" family Spirits can't be returned to the Hand by opposing Spirit/Nexus/Magic effects.",
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
      }
    ]
  },
  {
    "cardNumber": "BS06-006",
    "name": "Sabecaulus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.\n\n[LV2][LV3] (Your Attack Step)\nAll your Spirits with [Clash] gain +1000 BP",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "AWAKEN",
            "maxCores": 2
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          },
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 1000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-007",
    "name": "The ShamshirDinosaur Parasaur",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nReveal a card from your decktop. If that card is a \"Terra Dragon\" family Spirit card, add it to the Hand. If not, return it to the decktop.\n\n[LV2] (When Attacks)\nFor each \"Terra Dragon\" family Spirit you control, this Spirit gains +1000 BP.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "Reveal a card from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If that card is a \"Terra Dragon\" family Spirit card, add it to the Hand."
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
              "family": "Terra Dragon"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-009",
    "name": "The CloudBladeDragon Swordlagoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nThis Spirit gains +4000 BP.",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-010",
    "name": "The BattleAxe Apollodinos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.\n\n[LV2][LV3] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by your Spirit with [Clash] via BP comparison, refresh this Spirit.",
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
            "rule": "SET_HAND_COST",
            "text": "The cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6."
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "AWAKEN",
            "maxCores": 2
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          },
          {
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-012",
    "name": "The HugeDinosaur Giganoton",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV2][LV3] (When Attacks)\nDestroy an opposing 4000 BP or less Spirit.",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-015",
    "name": "Straysoul",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-016",
    "name": "Bronzemaiden",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDraw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-021",
    "name": "The SnakeEmpress Medousa",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles)\nDraw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            1,
            2,
            3
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
    "cardNumber": "BS06-022",
    "name": "The ChopSword Shadowslicer",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2] (When Attacks)\nReturn a \"Zombie\" family Spirit card from your Trash to the Hand.\n\n[LV2]\nFor each \"Zombie\" family Spirit you control, this Spirit gains +1000 BP.",
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
            "rule": "SET_HAND_COST",
            "text": "The cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6."
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
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
        "targetFilter": {
          "family": "Zombie"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS06-023",
    "name": "The DarkBishop Baculus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nSend cores from every Spirit to its owner's Reserve until only one core remains on each of them.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-024",
    "name": "The HellKnight Andra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nDestroy an opposing Spirit with two cores or less on it.\n\n[LV2][LV3] (Your Attack Step)\nWhen Spirit with [Curse] you control attacks, send a core from any opposing Spirits to their Reserve.\n\n[LV3] (When Destroyed)\nFor each Spirit with [Curse] you control, send a core from any opposing Spirits to their Reserve.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            2,
            3
          ]
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
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            3
          ]
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
    "cardNumber": "BS06-026",
    "name": "Caracalossom",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [High Speed]\nThis Spirit card in Hand can be summoned during Flash Timing. When you do, cores to be put on this Spirit and the cost must be paid from the Reserve.\n\n[LV2][LV3] (When Destroyed)\nDuring this turn, give all your Spirits +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
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
            "op": "BP_BUFF_ALLIES",
            "amount": 1000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-027",
    "name": "Gazellecaid",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS06-028",
    "name": "Gabunohashi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts one Spirit they control.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-029",
    "name": "Maparrot",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nPut a core from the Void to any of your Spirit.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-030",
    "name": "The Worker Antman",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nPut a core from the Void to your Reserve.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-031",
    "name": "Mitsujarashi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void to any Spirit you control.",
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
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-032",
    "name": "Woodykong",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS06-033",
    "name": "The Baron Jacobino",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts the specified number of Spirits they control.\n\n[LV2] (When Attacks)\nThe Spirit gains +1000 BP for each \"Plant Spirit\" family Spirit you control.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
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
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Plant Spirit"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-034",
    "name": "The IronFist Cactusgaroo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2]\nWhile your Life is at three or less, this Spirit gains +3000 BP.\n\n[LV2] (Your Attack Step)\nBesides [The IronFist Cactusgaroo], when the attack of your Spirit with [Windstorm] reduces the opposing Life, refresh this Spirit.",
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
            "rule": "SET_HAND_COST",
            "text": "The cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6."
          }
        ]
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "amount": 3000
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-036",
    "name": "The FangTree Rafflesio",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts the specified number of Spirits they control.\n\n[LV3] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, exhaust an opposing Spirit.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-041",
    "name": "The ArmoredBeast Audhumla",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nPut a core from the Void onto this Spirit.",
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-043",
    "name": "The ShieldSoldier Balder",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nFor each exhausted Spirit you control, this Spirit gains +1000 BP.",
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
    "cardNumber": "BS06-044",
    "name": "Reindeer",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Armor: Red]\nThis Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated color.\n\n[LV2] (When Blocks)\nReturn an opposing \"Flying Fang\" family Spirit that this Spirit blocks to the Hand.",
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
        "keyword": "Armor: Red"
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-046",
    "name": "The KeyMaul Valgrind",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2] (When Summoned)\nReturn an opposing Spirit to the Hand.\n\n[LV2] (When Blocks)\nWhen this Spirit blocks an opposing 4000 BP or more Spirit, it refreshes.",
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
            "rule": "SET_HAND_COST",
            "text": "The cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6."
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-054",
    "name": "The FortuneTeller Pentan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBy putting a Magic card from your Hand face-up onto the Removed Zone, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-056",
    "name": "The CatKnight Cait-Sith",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2][LV3] (Your Turn)\nWhen the opponent uses any Magic effect that includes your Cost 2 Spirits as target, you can change the target of that Magic effect to only this Spirit.\n\n[LV2][LV3]\nThis Spirit gains +1000 BP for each Cost 2 Spirit you control.",
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
            "rule": "SET_HAND_COST",
            "text": "The cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6."
          }
        ]
      },
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
            "rule": "COST_MODIFIER",
            "text": "When the opponent uses any Magic effect that includes your Cost 2 Spirits as target, you can change the target of that Magic effect to only this Spirit."
          }
        ]
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS06-057",
    "name": "ArcanaKing-Charle",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can summon up to four \"Arcana\"-named Spirit cards from your Hand, without paying the costs. However, any (When Summoned) effects of those Spirits can't activate.\n\n[LV2]\nAll your Cost 5 Spirits are treated as \"Arcana\"-named.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of those Spirits can't activate."
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
            "rule": "TREAT_NAME",
            "text": "All your Cost 5 Spirits are treated as \"Arcana\"-named."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-059",
    "name": "The CleverBeast Iberix",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nGive all your Magic card a [Yellow Core] reduction symbol.\n\n[LV2][LV3] [Brilliance] (When Attacks)\nAt the end of battle, return every Magic card you used in this battle to the Hand.",
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-060",
    "name": "The GreatAngelia Fanim",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nExhaust this Spirit.\n\n[LV2][LV3]\nWhile this Spirit is in exhausted state, opposing Spirits are exhausted when they are summoned.",
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
            2,
            3
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
    "cardNumber": "BS06-064",
    "name": "Mantigore",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAll your LV1/LV2 Spirits with no printed effects are treated as being at LV2.",
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
            "rule": "TREAT_LEVEL",
            "text": "All your LV1/LV2 Spirits with no printed effects are treated as being at LV2."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-070",
    "name": "The BlastingGiant Douglas",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards equal to this Spirit's level from opposing decktop.\n\n[LV2][LV3] (When Attacks)\nWhen this Spirit's [Crush] discards any Spirit card, destroy an opposing Cost 3 or less Spirit.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "scaleByLevel": true,
            "perLevel": 1
          },
          {
            "op": "DESTROY_BY_COST",
            "maxCost": 3,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-071",
    "name": "The HeavyJavelin Morgan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2] (When Summoned)\nDestroy every opposing Cost 4 Spirit.\n\n[LV2]\nThis Spirit gains +1000 BP for each \"Fighting Spirit\" family Spirit you control.",
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
            "rule": "SET_HAND_COST",
            "text": "The cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6."
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
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
        "targetFilter": {
          "family": "Fighting Spirit"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS06-073",
    "name": "The Burning Canyon",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Draw Step)\nIncrease the amount of cards you draw by +1. After you draw, discard a card from your Hand.\n\n[LV2] (Your Attack Step)\nEvery Spirit you control gains +1000 BP.",
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
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "After you draw, discard a card from your Hand."
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS06-075",
    "name": "The Deity in the Sacred Mountains",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Spirit with [Clash] is destroyed by opposing Spirits via BP comparison, send all cores from the destroyed Spirit to a Spirit you control.\n\n[LV2] (Your Attack Step)\nWhen your Spirit with [Clash] attacks as the first attack of your turn, refresh that Spirit.",
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
            "keyword": "Clash"
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
            "keyword": "Clash"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-076",
    "name": "The Digged Tombstone",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen your Spirit is destroyed, draw a card.\n\n[LV2]\nOnce per turn, when your \"Zombie\" family Spirits are destroyed, by discarding a card from your Hand, they remain on your Field, refreshed.",
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
        "subCost": {
          "type": "DISCARD_HAND",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "when your \"Zombie\" family Spirits are destroyed, by discarding a card from your Hand, they remain on your Field, refreshed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-077",
    "name": "The Depths of the Nether World",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every \"Infernal Lord\"/\"Zombie\" family Spirit you control: \"[Curse] (When Attacks) Destroy an opposing Spirit that blocked when the battle resolves at the end of battle.\"\n\n[LV2] (Your Attack Step)\nWhen your Spirit with [Curse] attacks, send a core from any opposing Spirit to their Reserve.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-079",
    "name": "The Forest of the Sacred Conifer",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every Spirit card with [High Speed] in your Hand an extra [Green Core] reduction symbol.\n\n[LV2] (Either Attack Step)\nWhen comparing BP in battles, your LV1 Spirits with [High Speed] use their LV2 BP instead.",
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
        "keyword": "High Speed"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "High Speed"
      }
    ]
  },
  {
    "cardNumber": "BS06-080",
    "name": "The Storm Highland",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen your Spirit with [Windstorm] is summoned, put a number of cores from the Void to the summoned Spirit equal to the number specified by that Spirit's [Windstorm].\n\n[LV2]\nWhen only the opposing Spirit is destroyed by comparing BP with your Spirit with [Windstorm], return every opposing Spirit exhausted by [Windstorm] to the deckbottom in any order.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-081",
    "name": "The Fruit of Wise Tree",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Life is reduced by opposing Spirits, put a core from the Void to your Reserve.\n\n[LV2] (Your End Step)\nRefresh all your Spirits.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      },
      {
        "overall": "END_STEP",
        "subConditions": {
          "levels": [
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
    "cardNumber": "BS06-082",
    "name": "The Infinite Mother Ship",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every \"Android\"/\"Machine\" family Spirit you control the \"Armed Machine\" family.\n\n[LV2] (Your Attack Step)\nWhen your \"Armed Machine\" family Spirit is destroyed by opposing Spirit via BP comparison, return it to your Hand.",
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
            "rule": "GRANT_FAMILY",
            "text": "Give every \"Android\"/\"Machine\" family Spirit you control the \"Armed Machine\" family."
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
    "cardNumber": "BS06-083",
    "name": "The Lighthouse of Hope",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen cores are removed from your Spirits via opposing Spirit/Nexus/Magic effects, for each core removed, put a core from the Void to your Reserve.\n\n[LV2] (Opposing Attack Step)\nFor each exhausted Spirit you control, your blocking Spirit gains +1000 BP.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS06-084",
    "name": "The Invaded Castle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Start Step)\nSend all cores from your Trash to your Reserve.\n\n[LV2] (Your Start Step)\nReturn an opposing Spirit to the Hand.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-085",
    "name": "The Chaotic Magic Laboratory",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you use a \"BP+\" Magic effect, during this turn, every Spirit you control that are targeted by that effect gains +2000 BP.\n\n[LV2]\nPut every Magic card discarded from your deck due to opposing Spirit/Nexus/Magic effect face-up on your Removed Zone.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
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
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "Put every Magic card discarded from your deck due to opposing Spirit/Nexus/Magic effect face-up on your Removed Zone."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-086",
    "name": "The Opened Spellbook",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Turn)\nYou can change the target of Magic effects that target both players to target either only you, or only the opponent.\n\n[LV2] (Your Attack Step)\nWhen the opponent would use Magic effects, they must pay the cost from the Reserve.",
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
            "text": "You can change the target of Magic effects that target both players to target either only you, or only the opponent."
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
            "text": "When the opponent would use Magic effects, they must pay the cost from the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-087",
    "name": "The Phantom Paradise",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen any \"Imaginary Beast\" family Spirit is summoned, draw a card.\n\n[LV2] (Your Attack Step)\nWhile the opponent controls one color of symbols only, when your Yellow Spirits are destroyed by opposing Spirit via BP comparison, they remain on the Field, exhausted.",
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
    "cardNumber": "BS06-089",
    "name": "The Battlefield enclosed by the Chains",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nNeither player can return cards from the Trash to their Hand.\n\n[LV2] (Opposing Main Step)\nThe opponent can't use Flash effects of Magic cards.",
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
            "rule": "MAGIC_RESTRICTION",
            "text": "The opponent can't use Flash effects of Magic cards."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-090",
    "name": "The Honorable Fight",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by your Spirit with [Crush] via BP comparison, discard a number of cards from the opposing decktop equal to the cost of the destroyed Spirit.\n\n[LV2] (Your End Step)\nRefresh all Spirits you control with [Crush].",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "scaleByLevel": true,
            "perLevel": 1
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
            "scaleByLevel": true,
            "perLevel": 1
          },
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
    "cardNumber": "BS06-091",
    "name": "Buster Javelin",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy a Nexus. If an opposing Nexus is destroyed, draw a card.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
          },
          {
            "op": "DESTROY_NEXUS",
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
    "cardNumber": "BS06-092",
    "name": "Excavation",
    "cardType": "Magic",
    "effect": "[Main]\nReturn three \"Terra Dragon\" family Spirit cards from your Trash to the Hand.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-100",
    "name": "Thorn Prison",
    "cardType": "Magic",
    "effect": "[Flash]\nThe opponent exhausts two Spirits they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-107",
    "name": "Second Sight",
    "cardType": "Magic",
    "effect": "[Main]\nReveal three cards from your decktop, and return them to the decktop in any order.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "text": "Reveal three cards from your decktop"
          },
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
    "cardNumber": "BS06-108",
    "name": "Discontinue",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, cards can't be discarded from your deck. When this Magic card is discarded from your deck by opposing Spirit/Nexus/Magic effects, activate this effect immediately, without paying the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CAST_MAGIC_FREE",
            "text": "When this Magic card is discarded from your deck by opposing Spirit/Nexus/Magic effects, activate this effect immediately, without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-109",
    "name": "Archaic Smile",
    "cardType": "Magic",
    "effect": "[Flash]\nWhen the battle resolves, end the battle without comparing BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "END_ATTACK_STEP",
            "timing": "END_OF_BATTLE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-110",
    "name": "Imagine Field",
    "cardType": "Magic",
    "effect": "[Flash]\nWhen the battle resolves, instead of comparing BP, compare the number of core on either Spirit, and the one with fewer cores is destroyed. When both have the same number of cores, both Spirits are destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RULE",
            "text": "When the battle resolves, instead of comparing BP, compare the number of core on either Spirit, and the one with fewer cores is destroyed."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RULE",
            "text": "When both have the same number of cores, both Spirits are destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-X21",
    "name": "The Deity Catastrophedragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each \"Ancient Dragon\" family Spirit you control, draw a card.\n\n[LV2][LV3] [Clash] (When Attacks)\nThe opponent must block with Spirits if possible. However, Ultimates can also block.\n\n[LV3] (When Attacks)\nWhen blocked by an opposing Cost 5 or less Spirit, refresh this Spirit.",
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
            "op": "DRAW_CARDS",
            "count": 1,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Ancient Dragon"
            }
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-X22",
    "name": "The SevenShogun Beelzebeat",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon any number of Spirit cards with [Curse] from your Trash, up to a total cost of 13, without paying the costs.\n\n[LV2][LV3] (Your Attack Step)\nWhen the attack of your Spirit with [Curse] reduces the opposing Life, destroy an opposing Spirit.",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            2,
            3
          ]
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
    "cardNumber": "BS06-X23",
    "name": "The Providence Hououga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] 3 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts three Spirits they control.\n\n[LV3] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, by sending a core, besides the [Soul Core], from your Reserve to the Void, refresh this Spirit.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 3,
            "allMatching": false
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-X24",
    "name": "The ArmoredSacred Walhalance",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Armor: ∞]\nThis Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the same color as the symbols on the opposing Field.\n\n[LV2][LV3] (When Battles)\nBy exhausting an \"Armed Machine\" family Spirit you control, this Spirit gains + (the exhausted Spirit's BP) BP.\n\n[LV3] (When Attacks)\nReturn every opposing 4000 BP or less Spirit to the Hand.",
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
            "rule": "IMMUNITY",
            "text": "This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the same color as the symbols on the opposing Field."
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "CANAKNIGHT-HEX2",
    "name": "ArcanaKnight-Hex",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV2] (When Attacks) For each \"Arcana\"-named Spirit you control, this Spirit gains +1000 BP.\n\n[LV3] Brilliance (When Attacks) At the end of the battle, return every Magic card you used during this battle to your Hand.",
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
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Arcana"
            }
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
    "cardNumber": "COTTON-CANDELE2",
    "name": "Cotton-Candele",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "GORON-GARAN2",
    "name": "The WeaponDealer Goron-Garan",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "LOUP-GAWROU2",
    "name": "The Werewolf Loup-Gawrou",
    "cardType": "Spirit",
    "effect": "[LV1] [LV2] (When Summoned) Move all but 1 core from target spirit your opponent controls to it's owner's reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  }
];

for (const spec of BS06_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
