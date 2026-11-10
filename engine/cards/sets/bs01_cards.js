/**
 * engine/cards/sets/bs01_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS01_SAGA_CARDS)
 * Total Cards: 160 (137 Effect, 23 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS01_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A12353",
    "name": "The SilverBrave Shield-Dragon",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] [Armor: White]\nThis Spirit is unaffected by opposing White Spirit/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Armor: White"
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1247",
    "name": "Gatlingstand",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14326",
    "name": "Volgenodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nAll your \"Terra Dragon\" family Spirits get +1000 BP.",
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
        "targetFilter": {
          "family": "Terra Dragon"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A161",
    "name": "Attack Shift",
    "cardType": "Magic",
    "effect": "Main- During this turn, all (When Blocks) effects of Spirits activate as (When Attacks) effects.\n\nFlash- During this turn, give a Spirit +3000 BP.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "During this turn, all (When Blocks) effects of Spirits activate as (When Attacks) effects."
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
    "cardNumber": "BATTLE-SPIRITS-A162",
    "name": "Awaken (Card)",
    "cardType": "Magic",
    "effect": "Flash- Send up to three cores from your Reserve to a Spirit you control, and draw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A167",
    "name": "Binding Thorn",
    "cardType": "Magic",
    "effect": "Flash- Exhaust an opposing Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A168",
    "name": "Binding Woods",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Select 1 color. Then, exhaust all unexhausted spirits with the selected color.\n\n(Flash Step)(Your Main Phase) Target spirit gets +5000BP until end of turn.",
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
            "rule": "CHOOSE_COLOR",
            "text": "Select 1 color."
          },
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
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
    "cardNumber": "BATTLE-SPIRITS-A170",
    "name": "Burst Fire",
    "cardType": "Magic",
    "effect": "Flash- Negate the \"cannot block\" effect of a Spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "Negate the \"cannot block\" effect of a Spirit you control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A173",
    "name": "Call of Lost",
    "cardType": "Magic",
    "effect": "Main- Choose and return a Spirit card from the Trash to your Hand.\n\nFlash- During this turn, give a Spirit +2000 BP.",
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2145",
    "name": "Changing Cores",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Move all but 1 core from target spirit to other spirits that have the same controller as it.\n\n(Flash Step)(Your Main Phase) Target spirit gets +3000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A2148",
    "name": "Dark Coffin",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Destroy target exhausted spirit.\n\n(Flash Step)(Your Main Phase) Target spirit gets +4000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A2160",
    "name": "Elephantite",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks) This spirit gets +2000BP until end of turn.",
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
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2163",
    "name": "Evil Aura",
    "cardType": "Magic",
    "effect": "Flash- Put four cores from the Void to a Spirit. At the End Step, send four of your cores to the Void.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "TARGET_SPIRIT",
            "count": 4
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2171",
    "name": "Gather Forces",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Gain 1 core in your reserve.\n\n(Flash Step)(Your Main Phase) Target spirit gets +1000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A2188",
    "name": "Killer Telescope",
    "cardType": "Magic",
    "effect": "(Your Main Phase) During this turn, spirits you control may attack exhausted spirits your opponent's control.\n\n(Flash Step)(Your Main Phase) Target spirit gets +2000BP until end of turn.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "During this turn, spirits you control may attack exhausted spirits your opponent's control."
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
    "cardNumber": "BATTLE-SPIRITS-A2202",
    "name": "Power Aura",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Draw 1 card. Additionally, all spirits you control get +1000BP until end of turn.",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 1000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2203",
    "name": "Pure Elixir",
    "cardType": "Magic",
    "effect": "Flash- Refresh all exhausted Spirits you control. During this turn, the Spirit refreshed by this effect cannot attack.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A2205",
    "name": "Rainbowpapillon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhile you control any Green spirit, this Spirit gains +1000 BP.",
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2207",
    "name": "Relation Soul",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Target spirit gets +1000 BP for each exhausted spirit your opponent controls until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A2208",
    "name": "Return Draw",
    "cardType": "Magic",
    "effect": "Main- During this turn, when Spirits you control would return to your Hand, for each Spirit that would return, draw a card.\n\nFlash- During this turn, give a Spirit +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "SET_FLOATING_RETURN_DRAW"
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A2212",
    "name": "Shadow Elixir",
    "cardType": "Magic",
    "effect": "Flash- Send a core from your Reserve to your Life.",
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
    "cardNumber": "BATTLE-SPIRITS-A2220",
    "name": "Storm Draw",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Draw 3 cards, then discard 2 cards.\n\n(Flash Step)(Your Main Phase) Target spirit gets +3000BP until end of turn.",
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
            "count": 3
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
    "cardNumber": "BATTLE-SPIRITS-A2225",
    "name": "The Ancient Dragon Territory",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Turn) When a Spirit is destroyed, send the cores on that Spirit to its owner's Trash, instead of the Reserve.\n\n[LV2] (Your Attack Step) When only the opposing Spirit is destroyed by BP comparison, draw a card.",
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
            "text": "When a Spirit is destroyed, send the cores on that Spirit to its owner's Trash, instead of the Reserve."
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2226",
    "name": "The Anthill",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) When only the opposing attacking Spirit is destroyed by comparing BP during battle, refresh the blocking Spirit you control.\n\n[LV2] (Your Attack Step) When only the opposing blocking Spirit is destroyed by comparing BP, refresh the attacking Spirit you control.",
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
            "scope": "TARGET"
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
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2233",
    "name": "The Burning Battlefield",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step) All attacking Spirits you control gain +1000 BP.\n\n[LV2] (Your Attack Step) The opponents must block your first attack this turn.",
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
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "The opponents must block your first attack this turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2235",
    "name": "The Castle of Eternal Snow",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Start Step) Return an opposing Nexus to the Hand.\n\n[LV2] (Your Start Step) Return a Spirit to its owner's Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2244",
    "name": "The Fruit of Life",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] When your Life is reduced by the opponent, draw a card.\n\n[LV2] When your Life is reduced by the opponent, put a core from the void to your Reserve.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2246",
    "name": "The Hermit Wise Tree",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step) For each exhausted Spirit you control, all attacking/blocking Spirits you control gain +1000 BP.\n\n[LV2] (Your End Step) Refresh all Spirits you control.",
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
        "amount": 1000
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
    "cardNumber": "BATTLE-SPIRITS-A2248",
    "name": "The Historic Battlefield of the Cursed",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] Whenever an opposing Spirit is exhausted, draw a card.\n\n[LV2] (Your Attack Step) By sending a core from this Nexus to your Trash, destroy an opposing Spirit that blocked after this battle ends.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
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
    "cardNumber": "BATTLE-SPIRITS-A2250",
    "name": "The Invaded Silver Snow",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) At the start of the step, send all cores from the Trash to your Reserve.\n\n[LV2] (Opposing Attack Step) When your Spirit is destroyed, put a core from the Void to your Reserve.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2267",
    "name": "The Swamp of Drain Life",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Start Step) Send all cores from the opposing Reserve to their Trash.\n\n[LV2] (Your Start Step) Exhaust an opposing Spirit.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "TRASH"
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
    "cardNumber": "BATTLE-SPIRITS-A2273",
    "name": "Wild Power",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Target spirit gets +2000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A242",
    "name": "Dream Chest",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Move target spirit to the top of its owner's deck.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_DECK",
            "position": "TOP",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A244",
    "name": "Dream Ribbon",
    "cardType": "Magic",
    "effect": "Flash - Return an opposing Spirit to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A262",
    "name": "Offensive Aura",
    "cardType": "Magic",
    "effect": "Flash- During this turn, all your attacking Spirits gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A265",
    "name": "Rabicrysta",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nThis Spirit can't be blocked by Red Spirits.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A285",
    "name": "The SilverScale Nithhoggr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nThis Spirit gains +4000 BP.",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A288",
    "name": "Towermittcrab",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) This spirit gets +1000BP for each nexus you control.",
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4968",
    "name": "Ice Lance",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nReturn an opposing Spirit to the Hand. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nReturn an opposing Nexus to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6516",
    "name": "Metalangler",
    "cardType": "Spirit",
    "effect": "[LV2] (Opposing Attack Step)\nAll your \"Flying Fish\" family Spirits get +1000 BP.",
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
          "family": "Flying Fish"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7657",
    "name": "SealedBeast Marco",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8069",
    "name": "Storm Strike",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nExhaust all opposing Spirits with one core on them. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nPut a core from the Void to any Spirit you control. Also, put a core from the Void to your [The WindHero Dorcus-Ushiwaka], or [Grant-Benkei].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": true
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
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
    "cardNumber": "BATTLE-SPIRITS-A9103",
    "name": "The Commander Dragno",
    "cardType": "Spirit",
    "effect": "[LV2] (Your Attack Step)\nAll your \"Dragon\"/\"Winged Dragon\" family Spirits gain +1000 BP.",
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
          "family": "Winged Dragon"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BEAR-GELMIR2",
    "name": "The ArmoredBeast Bear-Gelmir",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (During Your Battle Phase) While your opponent controls no red spirits, this spirit cannot attack.\n\n[LV2] (Permanent) All green spirits you control get +1000BP.",
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
            "text": "While your opponent controls no red spirits, this spirit cannot attack."
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
          "color": "green"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS01-001",
    "name": "Goradon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-002",
    "name": "Rokceratops",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-003",
    "name": "Teranosaber",
    "cardType": "Spirit",
    "effect": "[LV1] (Opposing Attack Step)\nThis Spirit can't block opposing Spirits.",
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
      }
    ]
  },
  {
    "cardNumber": "BS01-004",
    "name": "The Scout Dragno",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nThis Spirit gains +2000 BP.",
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
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-005",
    "name": "Eyeburn",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-006",
    "name": "Merat",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Start Step)\nSend a core from this Spirit to the Reserve. Besides via Spirit/Nexus/Magic effects, when cores are put onto this Spirit, it can't attack that turn.",
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
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "Besides via Spirit/Nexus/Magic effects, when cores are put onto this Spirit, it can't attack that turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-007",
    "name": "Hummerdrake",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nSend a core from your Field or your Trash to the Void.",
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
    "cardNumber": "BS01-008",
    "name": "Metalburn",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-009",
    "name": "Volc-Baboon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nThis Spirit can't block opposing Spirits.",
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
            "text": "This Spirit can't block opposing Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-010",
    "name": "Chakrambat",
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
    "cardNumber": "BS01-011",
    "name": "Dragsaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy a Nexus.",
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
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-012",
    "name": "Tryswordon",
    "cardType": "Spirit",
    "effect": "[LV2] (Opposing Attack Step)\nThis Spirit can't block Spirits with BP inferior to this Spirit's.",
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
            "rule": "SET_RESTRICTION",
            "text": "This Spirit can't block Spirits with BP inferior to this Spirit's."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-013",
    "name": "Taurusknight",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "BS01-014",
    "name": "The Shaman Dragno",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn a Spirit card from your Trash to the Hand.",
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-015",
    "name": "Spinoaxe",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nThis Spirit can't be blocked by Spirits with [High Speed].",
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
      }
    ]
  },
  {
    "cardNumber": "BS01-016",
    "name": "Skelton-Jaw",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nThis Spirit can't block opposing Spirits.\n\n[LV2][LV3] (When Attacks)\nFor each opposing Spirit in refreshed state, this Spirit gains +1000 BP.",
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
            "rule": "SET_RESTRICTION",
            "text": "This Spirit can't block opposing Spirits."
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
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-017",
    "name": "Lanceraptor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can destroy a 2000 BP or less Spirit.",
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
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-018",
    "name": "Lizardman",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nThis Spirit can't block Spirits with BP inferior to this Spirit's.",
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
            "rule": "SET_RESTRICTION",
            "text": "This Spirit can't block Spirits with BP inferior to this Spirit's."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-019",
    "name": "Jurassickle",
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
    "cardNumber": "BS01-020",
    "name": "The BladeDragon Steelanodon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.",
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
            "op": "AWAKEN",
            "maxCores": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-021",
    "name": "The FlameDragon Ma-Gwo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nFor each \"Dragon\" family Spirit on your Field, this Spirit gains +1000 BP.",
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
        "targetFilter": {
          "family": "Dragon"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS01-022",
    "name": "The Sickle Fool-Joker",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nYou can destroy a 3000 BP or less Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-023",
    "name": "The Fire LithoGraphica Phoenixious",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy every 3000 BP or less Spirit.\n\n[LV2] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, put a core from the Void to this Spirit.",
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-024",
    "name": "The CrystalDragon Diamat",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can destroy a Spirit with [High Speed].",
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
    "cardNumber": "BS01-025",
    "name": "The DragonicFortress Giga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can destroy an opposing 6000 BP or less Spirit.\n\n[LV2] (When Battles)\nWhen only the opposing Spirit is destroyed via BP comparison, you can send any number of cores from this Spirit to other Spirits/Nexuses you control.",
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
            "maxBp": 6000,
            "count": 1,
            "allMatching": false
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-026",
    "name": "Foger",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-027",
    "name": "Will-Orb",
    "cardType": "Spirit",
    "effect": "[LV1]\nIf this Spirit can attack, it must attack.",
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
            "text": "If this Spirit can attack, it must attack."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-028",
    "name": "Skulldevil",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-029",
    "name": "Rib-Reaper",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhile there is any Red Spirit/Nexus on your Field, this Spirit gains +1000 BP.",
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS01-030",
    "name": "Grip-Hands",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw a card.",
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
    "cardNumber": "BS01-031",
    "name": "Death-Haides",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-032",
    "name": "Gawrm",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed)\nReturn this Spirit to your Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-033",
    "name": "Disaster",
    "cardType": "Spirit",
    "effect": "[LV2][LV3]\nIf this Spirit can attack, it must attack.",
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
            "rule": "SET_RESTRICTION",
            "text": "If this Spirit can attack, it must attack."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-034",
    "name": "Bi-Python",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nDraw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-035",
    "name": "Bone-Gladiator",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nThis Spirit can't be blocked by Green Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-036",
    "name": "Sha-Zoo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nExhaust up to two Spirits.",
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
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-037",
    "name": "Illusiona",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks)\nYou can target an opposing exhausted Spirit and attack it.",
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "You can target an opposing exhausted Spirit and attack it."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-038",
    "name": "Skel-Viper",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw a card.",
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
    "cardNumber": "BS01-039",
    "name": "The Mysteryman Dionaeman",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-040",
    "name": "Darkwitch",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks)\nDestroy an exhausted Spirit you or the opponent controls.",
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-041",
    "name": "Cobraiga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nLeaving only one core on a Spirit, and send every other core from it to its owner's Reserve.",
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
          },
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
    "cardNumber": "BS01-042",
    "name": "Mistweasel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nDraw three cards.",
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
            "op": "DRAW_CARDS",
            "count": 3
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-043",
    "name": "Draculious",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-044",
    "name": "The PhantomBull Smowg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can target an opposing Spirit with only one core on it and attack it.",
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
            "rule": "TARGET",
            "text": "You can target an opposing Spirit with only one core on it and attack it."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-045",
    "name": "The Ripper Headiless",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nReturn this Spirit to your Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-046",
    "name": "The PhantomDragon Sheyron",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nLeaving only one core each on every Spirit, and send all other cores from them to their owner's Reserve.\n\n[LV2] (When Attacks)\nThis Spirit can't be blocked by Spirits with only one core on them.",
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
          },
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-047",
    "name": "The Witch Naja",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, exhaust an opposing Spirit.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-048",
    "name": "The PrincessVampire Vampiles",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy an exhausted Spirit you or the opponent controls.",
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-049",
    "name": "The PhantomKnight Nightrider",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks)\nDestroy an exhausted Spirit you or the opponent controls.",
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-050",
    "name": "Beatbeetle",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-051",
    "name": "Flyingmirage",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-052",
    "name": "Pelileaf",
    "cardType": "Spirit",
    "effect": "[LV2]\nWhile there is any core in your Reserve, this Spirit gains +2000 BP.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS01-053",
    "name": "Leavwolf",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Flash - [High Speed]\nThis Spirit card can be summoned from the Hand during Flash Timing. When you do, cores to be put on this Spirit and its cost must be paid from the Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "This Spirit card can be summoned from the Hand during Flash Timing."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "When you do, cores to be put on this Spirit and its cost must be paid from the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-054",
    "name": "Shockeater",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-055",
    "name": "Emeant",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nDuring this turn, give all your Spirits +1000 BP.",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 1000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-056",
    "name": "Matchra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nThe opponent discards a card from their Hand.",
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
            "rule": "DISCARD_HAND",
            "text": "The opponent discards a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-057",
    "name": "Gularva",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen cores would be put onto this Spirit via a Spirit/Nexus/Magic effect, puts +1 core.",
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
            "text": "When cores would be put onto this Spirit via a Spirit/Nexus/Magic effect, puts +1 core."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-058",
    "name": "Hercules-Geo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-059",
    "name": "Shidafukurou",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen the opponent would draw cards from the deck, refresh this Spirit.",
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
    "cardNumber": "BS01-060",
    "name": "Eagrass",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed)\nDuring this turn, all your Spirits gain +2000 BP.",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-061",
    "name": "Apewhip",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void to your Reserve.",
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
    "cardNumber": "BS01-062",
    "name": "Hungrytree",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nThe opponent discards a card from their Hand.",
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
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "The opponent discards a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-063",
    "name": "Emeraldscissor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nExhaust an opposing Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "BS01-064",
    "name": "Ziga-Wasp",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Flash - [High Speed]\nThis Spirit card can be summoned from the Hand during Flash Timing. When you do, cores to be put on this Spirit and its cost must be paid from the Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "This Spirit card can be summoned from the Hand during Flash Timing."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "When you do, cores to be put on this Spirit and its cost must be paid from the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-065",
    "name": "Killikabut",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nPut a core from the Void to a Spirit you control.",
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
            "to": "TARGET_SPIRIT",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-066",
    "name": "Stagrove",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nPut a core from the Void to another Spirit.",
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
            "to": "TARGET_SPIRIT",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-067",
    "name": "Swallowivy",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReveal five cards from your decktop. If there is any Nexus card among them, choose one and add it to the Hand. Return any remaining cards to the deckbottom in any order.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "Reveal five cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If there is any Nexus card among them, choose one and add it to the Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RETURN_REVEALED_BOTTOM",
            "text": "Return any remaining cards to the deckbottom in any order."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-068",
    "name": "The BlastTiger Tigald",
    "cardType": "Spirit",
    "effect": "[LV2] Flash - [High Speed]\nThis Spirit card can be summoned from the Hand during Flash Timing. When you do, cores to be put on this Spirit and its cost must be paid from the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "This Spirit card can be summoned from the Hand during Flash Timing."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "When you do, cores to be put on this Spirit and its cost must be paid from the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-069",
    "name": "The AirMaster Aquilers",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void to one of your Spirits.",
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
            "to": "TARGET_SPIRIT",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-070",
    "name": "The MeteoriteArmor Monoqueiroz",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDuring this turn, all your Spirits gain +2000 BP.",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-071",
    "name": "The Charger Blanboar",
    "cardType": "Spirit",
    "effect": "[LV2] (When Battles)\nWhen only the opposing Spirit is destroyed by BP comparison, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BATTLES",
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
    "cardNumber": "BS01-072",
    "name": "Gowsilvia",
    "cardType": "Spirit",
    "effect": "[LV2][LV3]\nThis Spirit gains +1000 BP for each core in your Reserve.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS01-073",
    "name": "The GaudyFeather Vulpelture",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Flash - [High Speed]\nThis Spirit card can be summoned from the Hand during Flash Timing. When you do, cores to be put on this Spirit and its cost must be paid from the Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "This Spirit card can be summoned from the Hand during Flash Timing."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "When you do, cores to be put on this Spirit and its cost must be paid from the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-074",
    "name": "Berserker-Gun",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-075",
    "name": "Icemaiden",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-076",
    "name": "Ray-Bullet",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhile you control any \"Armored Dragon\" family Spirit, this Spirit gains +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "requireFamilyOnField": {
            "family": "Armored Dragon",
            "min": 1
          }
        },
        "targetFilter": {
          "family": "Armored Dragon"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS01-077",
    "name": "Baby-Loki",
    "cardType": "Spirit",
    "effect": "[LV2] (When Blocks)\nThis Spirit gains +1000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-078",
    "name": "The AutoLady Mani",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nSend a core from your Trash to your Reserve.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-080",
    "name": "Fenrircannon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nThis Spirit gains +1000 BP.",
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
    "cardNumber": "BS01-081",
    "aliases": [
      "UR-DINE2"
    ],
    "name": "Ur-Dine",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-082",
    "aliases": [
      "HELL-BLINDI2"
    ],
    "name": "Hell-Blindi",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-085",
    "aliases": [
      "BEAR-GELMIR2"
    ],
    "name": "The ArmoredBeast Bear-Gelmir",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-086",
    "aliases": [
      "METALDY-BUG2"
    ],
    "name": "Metaldy-Bug",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-091",
    "name": "The Artifact Laguna",
    "cardType": "Spirit",
    "effect": "[LV2]\nAll your White Spirits gain +1000 BP.",
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
    "cardNumber": "BS01-093",
    "name": "The ShieldSpirit Dis",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nWhen the opponent declares block, exhaust a Spirit except the one blocking this Spirit.\n\n[LV2] (When Destroyed)\nRefresh a Spirit you control.",
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
    "cardNumber": "BS01-094",
    "name": "Gran-Dolbalkan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - (When Battles)\nBy sending one core from your Reserve to your Trash, immediately end the battle.",
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
        "subCost": {
          "type": "PAY_RESERVE_CORES",
          "count": 1
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
          {
            "op": "END_ATTACK_STEP",
            "timing": "END_OF_BATTLE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-096",
    "name": "The AutoEmpress Sol",
    "cardType": "Spirit",
    "effect": "[LV1] (When Destroyed)\nIf it is the opposing turn, skip the Attack Step. Or end it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "subEffects": [
          {
            "op": "END_ATTACK_STEP",
            "timing": "END_OF_BATTLE"
          },
          {
            "op": "END_ATTACK_STEP",
            "timing": "END_OF_BATTLE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-099",
    "name": "The Canyon Where Sage lives",
    "cardType": "Nexus",
    "effect": "[LV1] (Your Draw Step)\nYou draw +1 card. After you draw, discard a card from your Hand.\n\n[LV2] (Your Draw Step)\nYou draw +1 card.",
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
    "cardNumber": "BS01-100",
    "name": "The Ruby Sun",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen using a White card, unless the player pay one extra cost, it can't be used.\n\n[LV2]\nBesides via Spirit/Nexus/Magic effects, when cores are put onto, or removed from a White Spirit, exhaust it.",
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
            "text": "When using a White card, unless the player pay one extra cost, it can't be used."
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
    "cardNumber": "BS01-102",
    "name": "The Lost of Old Castle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nAll your Purple Spirits gain +1000 BP.\n\n[LV2] (Your Start Step)\nIf both players have the same number of cards in Hand, or the opponent has more cards than you, draw a card.",
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
          "color": "Purple"
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-105",
    "name": "The Shackles of Doom",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nSpirits with only one core on them can't attack/block.\n\n[LV2] (Either Attack Step)\nAfter attack declaration, a core must be sent from the Spirit that attacks to the Trash.",
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
            "text": "Spirits with only one core on them can't attack/block."
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
            "text": "After attack declaration, a core must be sent from the Spirit that attacks to the Trash."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-109",
    "name": "The Hill of Violent Wind",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opponent's Start Step)\nRefresh target exhausted spirit you control with High Speed.\n\n[LV2] (Permanent)\nEach time you summon a spirit it gets +1000BP until end of turn.",
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
            "scope": "TARGET"
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
    "cardNumber": "BS01-111",
    "name": "The Diamond Moon",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen blocked by opposing Red Spirits, or when blocking an opposing Spirit, your Spirits get +1000 BP.\n\n[LV2] (Either Attack Step)\nDestroy the opposing Red Spirit that battled with your Spirit at the end of the battle.",
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
            "amount": 1000,
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-114",
    "name": "Buster Spear",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy a Nexus. If an opposing Nexus is destroyed, draw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
      }
    ]
  },
  {
    "cardNumber": "BS01-117",
    "name": "Double Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw two cards.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS01-120",
    "name": "Buster Phalanx",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy all Nexuses.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
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
            "count": 1,
            "allMatching": true
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
    "cardNumber": "BS01-121",
    "name": "Flame Dance",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy a 4000 BP or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-122",
    "name": "Flame Tempest",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy all 3000 BP or less Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS01-125",
    "name": "Deadly Balance",
    "cardType": "Magic",
    "effect": "[Flash]\nBoth players destroy a Spirit they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS01-128",
    "name": "Chaos Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw a card for each opposing exhausted Spirit.\n\n[Flash]\nTarget a Spirit you or the opponent controls. During this turn, give it +3000 BP.",
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
    "cardNumber": "BS01-129",
    "name": "Poison Shoot",
    "cardType": "Magic",
    "effect": "[Flash]\nSend a core from a Spirit to its owner's Reserve.",
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
    "cardNumber": "BS01-138",
    "name": "Hand Reverse",
    "cardType": "Magic",
    "effect": "[Main]\nDiscard your entire Hand. Then, draw a card for each card in the opposing Hand.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
    "cardNumber": "BS01-139",
    "name": "Feather Barrier",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, a blocking Spirit you control is unaffected by opposing cards' effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "During this turn, a blocking Spirit you control is unaffected by opposing cards' effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-141",
    "name": "Invisible Cloak",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a Spirit. During this turn, the targeted Spirit can't be blocked.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS01-143",
    "name": "Divine Chain",
    "cardType": "Magic",
    "effect": "[Flash]\nUntil the end of this battle, the opponent can't use any cards from the Hand during Flash Timing.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "Until the end of this battle, the opponent can't use any cards from the Hand during Flash Timing."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-144",
    "aliases": [
      "BATTLE-SPIRITS-A161"
    ],
    "name": "Attack Shift",
    "cardType": "Magic",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-145",
    "name": "Defensive Aura",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give all your blocking Spirits +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 3000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-148",
    "name": "Leak Drive",
    "cardType": "Magic",
    "effect": "[Flash]\nImmediately end the current battle.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "STEP_MODIFIER",
            "text": "Immediately end the current battle."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-X01",
    "aliases": [
      "26RBS03-X02"
    ],
    "name": "The DragonEmperor Siegfried",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.\n\n[LV3] (When Destroyed)\nPut a core from the Void to your Life.",
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
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-X02",
    "aliases": [
      "26RBS03-X06"
    ],
    "name": "The SevenShogun Desperado",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBesides this Spirit, send a core each from every Spirit to the owner's Reserve. For each Spirit destroyed by this effect, put a core from the Void to this Spirit.\n\n[LV2] (When Attacks)\nSend cores from a Spirit to its owner's Reserve until only one core left.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-X03",
    "name": "The Duke Kingtaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each other Spirit you control, put a core from the Void to this Spirit.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve.",
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
            "to": "SELF",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-X04",
    "name": "The ImpregnableFortress Odin",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nFor each Nexus either player controls, this Spirit gains +1000 BP.\n\n[LV2][LV3]\nAll Nexuses can't be destroyed.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "All Nexuses can't be destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "DUALCANNON-BELL2",
    "name": "Dualcannon-Bell",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "HELL-BLINDI2",
    "name": "Hell-Blindi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Return a Spirit to its owner's Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "METALDY-BUG2",
    "name": "Metaldy-Bug",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Each player moves 1 core from a spirit they control to the trash.",
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
    "cardNumber": "UR-DINE2",
    "name": "Ur-Dine",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nPut a core from the Void to your Reserve.",
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
      }
    ]
  }
];

for (const spec of BS01_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
