/**
 * engine/cards/sets/bs12_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS12_SAGA_CARDS)
 * Total Cards: 90 (84 Effect, 6 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS12_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A1030",
    "name": "Gagamoth",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10364",
    "name": "The GodStarEmperor Strike-Apollodragon",
    "cardType": "Spirit",
    "effect": "[When Braved] [LV1][LV2][LV3] (Opposing Attack Step)\nWhen braved to a Green/White/Yellow Brave, when an opposing Spirit attacks, this Spirit refreshes.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nWhen braved to a Red/Purple/Blue Brave, destroy an opposing 10000 BP or less Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
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
            "op": "DESTROY_BY_BP",
            "maxBp": 10000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11745",
    "name": "The PirateDeity Piscegalleon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBesides this Spirit, send a core each from every Spirit to its owner's Reserve. Draw a card for each Spirit depleted by this effect.\n\n[LV2] (When Destroyed)\nFor each \"Galaxian\"/\"Astral Soul\" family Spirit you control, both players discard a card from their Hand.",
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
            "text": "For each \"Galaxian\"/\"Astral Soul\" family Spirit you control, both players discard a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12308",
    "name": "The ShinobiMaster Udou",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Windstorm: 2 - (When Attacks) When this Spirit is blocked, the opponent exhausts two Spirits they control.\n\n[LV2] When your Spirits are destroyed by opposing Spirit/Brave/Magic effects, refresh all your Spirits with Windstorm.",
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
            "count": 2,
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
    "cardNumber": "BATTLE-SPIRITS-A14207",
    "name": "Uriborg",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1504",
    "name": "The MoonlightDragonDeity Lunatech-Strikewurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Heavy Armor: Variable]\nThis Spirit is unaffected by opposing Spirit/Brave/Nexus/Magic effects of the color(s) this Spirit currently has.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nWhen an opposing Spirit attacks, this Spirit refreshes.\n\n[During Brave] [LV2][LV3] (When Attacks/Blocks)\nReturn an opposing Spirit with BP equal or inferior to this Spirit's to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "keyword": "Heavy Armor: Variable"
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2,
            3
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
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            2,
            3
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
    "cardNumber": "BATTLE-SPIRITS-A5215",
    "name": "Jakonezu",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7847",
    "name": "Shumongo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7948",
    "name": "Stagger",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8503",
    "name": "The ArmoredDinoman Gaston",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Destroy an opposing Spirit/Brave with BP equal or inferior to this Spirit's.",
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
            "op": "DESTROY_BRAVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8543",
    "name": "The Artifact Forseti",
    "cardType": "Brave",
    "effect": "[LV1][LV2] Heavy Armor: Purple/Green - This Spirit is unaffected by opposing Purple/Green Spirit/Brave/Nexus/Magic effects.\n\n[When Braved] [LV2] (Opposing Attack Step) All your White Spirits gain +3000 BP.",
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
            "text": "Heavy Armor: Purple/Green - This Spirit is unaffected by opposing Purple/Green Spirit/Brave/Nexus/Magic effects."
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
          "color": "White"
        },
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BS12-001",
    "name": "Veloci-Harpe",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-004",
    "name": "Dragon-Pheasant",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nFor each Spirit-condition Brave you control, this Spirit gains +2000 BP.\n\n[LV2]\nEvery Spirit-condition Brave you control gains +3000 BP.",
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
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BS12-005",
    "name": "The StarHornBeast Unigaunt",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen your Spirit is destroyed by the opponent, you can summon a Brave card from your Hand in Spirit-condition, without paying the cost.\n\n[LV2][LV3]\nWhen a Brave is summoned via this Spirit's effect, draw a card.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-006",
    "name": "The DragonBrawler Ardi-Baron",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nEvery Spirit-condition Brave with no symbols you control and Brave Spirit with one symbol you control gains an extra Red symbol.\n\n[When Braved] [LV3] (When Brave Attacks)\nThis Spirit gains +10000 BP.",
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
            "rule": "KEYWORD_RULE",
            "text": "Every Spirit-condition Brave with no symbols you control and Brave Spirit with one symbol you control gains an extra Red symbol."
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
            "op": "BP_BUFF_SELF",
            "amount": 10000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-007",
    "name": "The FlameDragonDeity Mars-Dragoon",
    "cardType": "Spirit",
    "effect": "[Tribute: Astral Soul → Void]\nAfter paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nDestroy two opposing Spirits with one symbol.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nDestroy an opposing Spirit with two symbols.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void."
          }
        ]
      },
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-008",
    "name": "Grand-Dragcastle",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can target and attack a Spirit with the highest BP on the opposing Field.\n\n[LV2][LV3] (When Attacks)\nFor each \"Ancient Dragon\" family Spirit you control, this Spirit gains +3000 BP.",
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
            "rule": "COMBAT_RULE",
            "text": "You can target and attack a Spirit with the highest BP on the opposing Field."
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
            "amount": 3000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Ancient Dragon"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-009",
    "name": "Swordoll",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit's color and symbol are also treated as White.",
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
            "rule": "TREAT_COLOR_SYMBOL",
            "text": "This Spirit's color and symbol are also treated as White."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-011",
    "name": "Mummybird",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDiscard every face-up card on the opposing Removed Zone, and for each card discarded, send a core, besides [Soul Core], from the opposing Field/Reserve to the Void.\n\n[LV2]\nWhen this Spirit is exhausted by an opposing Spirit/Brave/Magic effect, send a core from any opposing Spirit to the Trash.",
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
            "text": "Discard every face-up card on the opposing Removed Zone, and for each card discarded, send a core, besides [Soul Core], from the opposing Field/Reserve to the Void."
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-012",
    "name": "The ChariotEmperor Dirgan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nAt the start of the step, by sending any number of cores from this Spirit to your Trash, for each core sent, send a core from an opposing Brave Spirit with two symbols to their Trash.\n\n[LV2][LV3]\nThis Spirit can't be exhausted by opposing Spirit/Brave/Nexus/Magic effects.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
    "cardNumber": "BS12-013",
    "name": "The DarkKnight Kay",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 5/6] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 5/6 Spirit is destroyed.\n\n[LV1][LV2][LV3] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked this Spirit at the end of battle.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 5/6"
      },
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
            "keyword": "Curse"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-014",
    "name": "The CorpseKnight Verium",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen your \"Zombie\" family Spirits are destroyed, for each Spirit destroyed, draw a card.\n\n[When Braved] [LV2] (When Brave Attacks)\nFor each \"Zombie\" family Spirit you control, destroy an opposing exhausted Spirit.",
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-015",
    "name": "The PlutoDragonDeity Krono-Hades",
    "cardType": "Spirit",
    "effect": "[Tribute: Astral Soul → Void]\nAfter paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nBy sending three cores from your Field to the Void, send four cores from the opposing Field to the Void.\n\n[When Braved] [LV2][LV3] (When Destroyed)\nEach player targets one of their Spirits. Destroy all Spirits that aren't targeted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void."
          }
        ]
      },
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
          },
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Each player targets one of their Spirits."
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
    "cardNumber": "BS12-016",
    "name": "The CorpseGiant Gi-Gasha",
    "cardType": "Spirit",
    "effect": "While there are five or more \"Zombie\" family Spirit cards in your Trash, this Spirit card in your Hand becomes Cost 3.\n\n[LV1][LV2] (When Summoned)\nReturn any number of \"Zombie\" family Spirit cards, up to a total cost of 13, from your Trash to the Hand.\n\n[LV2] (When Destroyed)\nExhaust every opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While there are five or more \"Zombie\" family Spirit cards in your Trash, this Spirit card in your Hand becomes Cost 3."
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
            "count": 1
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-019",
    "name": "Kunoichijorou",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2] (When Summoned)\nSeparate a Brave from an opposing battling Brave Spirit, and only the Spirit would continue the battle. However, the opponent decides how to move the core when separates.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_RESERVE_ONLY",
            "text": "This Spirit card in Hand can be summoned by paying the cost with cores in the Reserve."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_RESERVE_ONLY",
            "text": "In this case, cores to be put on this Spirit must also be from the Reserve."
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
            "rule": "CONTINUE_BATTLE",
            "text": "Separate a Brave from an opposing battling Brave Spirit, and only the Spirit would continue the battle."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "the opponent decides how to move the core when separates."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-020",
    "name": "The Spearhead Siberza",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player's life can be reduced by the attacks of Brave Spirits with two symbols.\n\n[LV2] (When Attacks)\nIf this is the first attack of your turn, this Spirit refreshes.",
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
            "rule": "KEYWORD_RULE",
            "text": "Neither player's life can be reduced by the attacks of Brave Spirits with two symbols."
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-021",
    "name": "Kojuu-Kamakirou",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each \"Shellman\" family Spirit you control, put a core from the Void to your Reserve.\n\n[LV1][LV2][LV3]\nAll your \"Parasite\"/\"Shell Insect\"/\"Shellman\" family Spirits gain +1000 BP.",
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
      },
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
          "family": "Shellman"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS12-022",
    "name": "The SunlightMusha Genji-Bolta",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cores on your \"Sun\"-named Spirits can't be removed by opposing Spirit/Brave/Magic effects.\n\n[LV1][LV2]\nAll your \"Parasite\"/\"Shell Insect\"/\"Shellman\" family Spirits gain +1000 BP.",
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
            "rule": "KEYWORD_RULE",
            "text": "The cores on your \"Sun\"-named Spirits can't be removed by opposing Spirit/Brave/Magic effects."
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
        "targetFilter": {
          "family": "Shellman"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS12-024",
    "name": "The EvilJupiterDragon Nobunagard-Sechst",
    "cardType": "Spirit",
    "effect": "[Tribute: Astral Soul → Void]\nAfter paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nYou can summon a Brave card and a Green Spirit card from your Hand, without paying the cost.\n\n[When Braved] [LV2][LV3] (Either Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Astral Deity\"/\"Astral Soul\" family Spirit, refresh that Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void."
          }
        ]
      },
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
            "op": "REANIMATE_TRASH",
            "count": 1
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-025",
    "name": "Zaneegun",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit is also treated as a Red Spirit.\n\n[LV2] [Heavy Armor: Red]\nThis Spirit is unaffected by opposing Red Spirit/Brave/Nexus/Magic effects.",
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
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Red Spirit."
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
        "keyword": "Heavy Armor: Red"
      }
    ]
  },
  {
    "cardNumber": "BS12-027",
    "name": "The ArtifactGuards Chrysanthe MK-VIII",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nEither player's Life can't be reduced by attacks of Cost 0/1/3 Spirits.\n\n[LV1][LV2] [Heavy Armor: Purple]\nThis Spirit is unaffected by opposing Purple Spirit/Brave/Nexus/Magic effects.\n\n[LV2] (Opposing Turn)\nAll your [The MoonlightDragonDeity Lunatech-Strikewurm] are also treated as Purple/Green Spirits.",
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
            "text": "Either player's Life can't be reduced by attacks of Cost 0/1/3 Spirits."
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "keyword": "Heavy Armor: Purple"
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
            "rule": "TREAT_RULE",
            "text": "All your [The MoonlightDragonDeity Lunatech-Strikewurm] are also treated as Purple/Green Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-028",
    "name": "Sailfish",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Heavy Armor: White]\nThis Spirit is unaffected by opposing White Spirit/Brave/Nexus/Magic effects.\n\n[LV2] (Opposing Main Step)\nAll your White Spirits are unaffected by opposing Brave effects.",
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
        "keyword": "Heavy Armor: White"
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
            "rule": "KEYWORD_RULE",
            "text": "All your White Spirits are unaffected by opposing Brave effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-029",
    "name": "The IceLady Snotra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Green/Yellow (Opposing Turn)\nWhen the opponent uses a Green/Yellow Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2] [Armor: Purple/White]\nThis Spirit is unaffected by opposing Purple/White Spirit/Nexus/Magic effects.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
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
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Armor: Purple/White"
      }
    ]
  },
  {
    "cardNumber": "BS12-031",
    "name": "Mechaniffon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Armor: Green]\nThis Spirit is unaffected by opposing Green Spirit/Nexus/Magic effects.\n\n[When Braved] [LV2]\nGive all your Spirits this Spirit's [Armor].",
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
        "keyword": "Armor: Green"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Armor"
      }
    ]
  },
  {
    "cardNumber": "BS12-032",
    "name": "The HeavyBootsEmperor Vidar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Purple/Green/White/Yellow (Opposing Turn)\nWhen the opponent uses a Purple/Green/White/Yellow Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2][LV3]\nWhen you use this Spirit's [Ice Wall] effect, by sending a core from this Spirit to your Trash, refresh this Spirit.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
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
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "keyword": "Ice Wall"
      }
    ]
  },
  {
    "cardNumber": "BS12-033",
    "name": "Kogumaru",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS12-034",
    "name": "The Astronomer Pentan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Start Step)\nDuring this turn, give all your \"Song Bird\" family Spirits the \"Astral Soul\" family.",
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
            "text": "During this turn, give all your \"Song Bird\" family Spirits the \"Astral Soul\" family."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-035",
    "name": "The Angelia of Olimpics Phul",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nYou can send a core from this Spirit to your Life.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-036",
    "name": "The StarDog Pomeran",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks)\nFor each symbol on the opposing battling Brave Spirit, this Spirit gains +3000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-037",
    "name": "The Angelia of Olimpics Bethor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nWhen an opposing Spirit with two symbols attacks, during that battle, treat that Spirit's LV1/LV2/LV3 BP as 2000.\n\n[LV2][LV3] (Either Attack Step)\nWhen your \"Divine Spirit\" family Spirits are destroyed, you can send one core from your Field to your Life.",
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
            "rule": "TREAT_RULE",
            "text": "When an opposing Spirit with two symbols attacks, during that battle, treat that Spirit's LV1/LV2/LV3 BP as 2000."
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-038",
    "name": "The Angelia of Olimpics Phaleg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each \"Divine Spirit\" family Spirit you control, target an opposing Spirit. During this turn, those targeted opposing Spirits can't block.\n\n[LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.",
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
            "rule": "TARGET",
            "text": "For each \"Divine Spirit\" family Spirit you control, target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this turn, those targeted opposing Spirits can't block."
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
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-039",
    "name": "The ClownPrincess Trickster",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw a card, and return a card from your Trash to the Hand.\n\n[LV2] (When Blocks)\nDestroy an opposing battling refreshed Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-040",
    "name": "The UranusDragonDeity Slei-Caelus",
    "cardType": "Spirit",
    "effect": "[Tribute: Astral Soul → Void]\nAfter paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void.\n\n[LV1][LV2][LV3]\nWhen the opponent uses a Magic effect, return an opposing Spirit to the Hand.\n\n[When Braved] [LV2][LV3]\nWhen opposing Spirits are returned to the Hand, for each Spirit returned, put one core from the Void to your Life.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void."
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
            2,
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
    "cardNumber": "BS12-042",
    "name": "Hinoki-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDuring this turn, treat all the reduction symbols of Nexus cards in your Hand as [Blue Core].\n\n[LV2][LV3]\nAll your Nexuses are also treated as Blue Nexuses.",
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
            "rule": "TREAT_RULE",
            "text": "During this turn, treat all the reduction symbols of Nexus cards in your Hand as [Blue Core]."
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
            "rule": "TREAT_RULE",
            "text": "All your Nexuses are also treated as Blue Nexuses."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-043",
    "name": "The Hunter Condrad",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAt the start of the step, by exhausting this Spirit, during this turn, your Life can't be reduced by the attacks of Brave Spirits with two symbols.\n\n[LV2] (Opposing Main Step)\nThe (When Summoned) effects of all Cost 3 or less Spirits can't activate.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
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
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "The (When Summoned) effects of all Cost 3 or less Spirits can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-045",
    "name": "The BlackBeastKing Cepheus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nTreat all your \"Beast Head\" family Spirits as Spirits with no printed effect.\n\n[LV2] (Your Attack Step)\nAll your Spirits with no printed effects are treated as being at their highest levels.",
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
            "text": "Treat all your \"Beast Head\" family Spirits as Spirits with no printed effect."
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
            "rule": "TREAT_RULE",
            "text": "All your Spirits with no printed effects are treated as being at their highest levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-046",
    "name": "Nata-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen the opponent would pay the cost for Magic cards, they can't pay with cores on their Spirits.\n\n[When Braved] [LV2]\nTreat this Spirit as a Spirit without printed effects.",
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
            "text": "When the opponent would pay the cost for Magic cards, they can't pay with cores on their Spirits."
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
            "rule": "TREAT_RULE",
            "text": "Treat this Spirit as a Spirit without printed effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-047",
    "name": "The NeptuneDragonDeity Tri-Mercurius",
    "cardType": "Spirit",
    "effect": "[Tribute: Astral Soul → Void]\nAfter paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nDuring the next (Opposing Refresh Step), the opponent can only return three cores from their Trash to their Reserve.\n\n[When Braved] [LV2][LV3]\nWhen the opponent pays the cost for Magic cards, the cores can't be paid from their Field.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void."
          }
        ]
      },
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
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
            "text": "When the opponent pays the cost for Magic cards, the cores can't be paid from their Field."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-048",
    "name": "Captain-Orcard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy every opposing Cost 11 or less Brave Spirit.",
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
            "op": "DESTROY_BRAVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-049",
    "name": "Amphisbaenar",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/Galaxian/Astral Soul]\n\n[LV1] (When Summoned)\nDestroy an opposing 6000 BP or less Spirit. Or, negate the effect of every opposing active \"Seal\"-named Magic.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/Galaxian/Astral Soul"
      },
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
            "op": "DESTROY_BY_BP",
            "maxBp": 6000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-050",
    "name": "The ChargingMachineDragon Archaelancer",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDraw a card, and destroy an opposing Nexus.\n\n[When Braved] Flash -\nBy exhausting a Spirit you control, during this turn, this Spirit gains +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 3 or more"
      },
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-051",
    "name": "The Exoskeleton Bone-Loader",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/Galaxian/Astral Soul]\n\n[LV1] (When Summoned)\nReturn an \"Astral Deity\"/\"Galaxian\"/ \"Astral Soul\" family Spirit card from your Trash to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/Galaxian/Astral Soul"
      },
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-052",
    "name": "Death-Haze",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nDestroy any number of Spirits you control, and draw a card for each Spirit destroyed. However, any (When Destroyed) effects of those Spirits can't activate.\n\n[When Braved] (When Destroyed)\nBy discarding a card from your Hand, this Spirit returns to the Field, exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {},
        "subCost": {
          "type": "DISCARD_HAND",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "By discarding a card from your Hand"
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-053",
    "name": "Oodsutsunanafushi",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nYou can discard your entire Hand (at least one card). When you've done so, draw cards from your deck equal to the number of cards in the opposing Hand.\n\n[During Brave]\nWhen the opponent draws, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 3 or more"
      },
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
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "You can discard your entire Hand (at least one card)."
          },
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
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
    "cardNumber": "BS12-054",
    "name": "Manekicat",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/ Galaxian / Astral Soul]\n\n[LV1] (When Summoned)\nYou can summon a Green/White Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of the Spirit can't activate.\n\n[When Braved] (When Battles)\nThe opponent exhausts a Spirit they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/ Galaxian / Astral Soul"
      },
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of the Spirit can't activate."
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
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
    "cardNumber": "BS12-055",
    "name": "Gecko-Glider",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/ Galaxian / Astral Soul]\n\n[LV1] (When Summoned)\nDuring this turn, the Spirit braved with this Brave can't be blocked.\n\n[When Braved] [Heavy Armor: Purple/Yellow]\nThis Spirit is unaffected by opposing Purple/Yellow Spirit/Brave/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/ Galaxian / Astral Soul"
      },
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Heavy Armor: Purple/Yellow"
      }
    ]
  },
  {
    "cardNumber": "BS12-056",
    "name": "Jet-Ray",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\nWhen your Life is reduced by opposing Spirit, if your Life is three or less, you can summon this Brave card from the Hand, without paying the cost.\n\n[When Braved] (When Blocks)\nExhaust two opposing Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When your Life is reduced by opposing Spirit, if your Life is three or less, you can summon this Brave card from the Hand, without paying the cost."
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "turn": "OPPONENT"
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
    "cardNumber": "BS12-057",
    "name": "Hydrandea",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 2 or more]\n\n[LV1] (When Summoned)\nSummon three Cost 2 Spirit cards from your Trash, without paying the cost.\n\n[When Braved]\nWhen the number of cores on this Spirit is brought to zero by an opposing Spirit/Brave/Magic effect, this Spirit is treated as being destroyed at its highest level.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 2 or more"
      },
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "When the number of cores on this Spirit is brought to zero by an opposing Spirit/Brave/Magic effect, this Spirit is treated as being destroyed at its highest level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-058",
    "name": "The DivineBird Thunder-Bird",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/Galaxian/Astral Soul]\n\n[LV1] (When Summoned)\nReturn a Magic card from your Trash to the Hand.\n\n[When Braved] (When This Spirit Brave Attacks)\nWhen you use a Magic card, after the effect resolves, during this battle, the LV1/LV2/LV3 BP of the blocking opposing Spirits is treated as 2000.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/Galaxian/Astral Soul"
      },
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
            "op": "SALVAGE_TRASH",
            "count": 1
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "(When This Spirit Brave Attacks)"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TRIGGERED_WATCHER",
            "text": "When you use a Magic card"
          },
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
    "cardNumber": "BS12-059",
    "name": "Shoggoleth",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[When Braved]\nTreat this Spirit as a Spirit with no printed effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 3 or more"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_AS_VANILLA",
            "text": "Treat this Spirit as a Spirit with no printed effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-060",
    "name": "Vulcan-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/Galaxian/Astral Soul]\n\n[LV1] (When Summoned)\nDraw three cards. Then, discard two cards from your Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/Galaxian/Astral Soul"
      },
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
            "op": "DRAW_CARDS",
            "count": 3,
            "thenDiscard": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-061",
    "name": "The Birthplace of the Sword",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you would [Tribute], by exhausting this Nexus, treat all the cores on a Cost 3 \"Astral Soul\" family Spirit you control are sent to the specified area.\n\n[LV2] (Your Main Step)\nWhen Braves are summoned, you draw a card.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-062",
    "name": "The Steam-Breathing Mountains",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Spirit is exhausted by opposing Spirit/Brave/Magic effect, destroy an opposing Spirit with BP equal or inferior to the exhausted Spirit.\n\n[LV2] (Either Attack Step)\nWhile you control two or less Spirits, all your \"Ancient Dragon\" family Spirits are treated as being on their highest LV.",
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
            "op": "DESTROY_BRAVE",
            "count": 1
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "requireFamilyOnField": {
            "family": "Ancient Dragon",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "While you control two or less Spirits, all your \"Ancient Dragon\" family Spirits are treated as being on their highest LV."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-063",
    "name": "The Brigade's Skyscraper",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed)\nDraw a card.\n\n[LV2] (Your Attack Step)\nWhen your \"Zombie\" family Spirit attacks, send a core from any opposing Spirits to the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DEPLOYED",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-064",
    "name": "The House of the Idol",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you would [Tribute], by exhausting this Nexus, treat all the cores on a Cost 3 \"Astral Soul\" family Spirit you control are sent to the specified area.\n\n[LV2]\nWhen your Spirit is exhausted by an opposing Spirit/Brave/Magic effect, for each Spirit exhausted, exhaust an opposing Spirit.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
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
    "cardNumber": "BS12-065",
    "name": "The Wooded Castle Tower",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nThe number of cores on your Green Spirits can't become less than their LV1 cost.\n\n[LV2] (Opposing Attack Step)\nWhen an opposing Spirit attacks, you can reveal a card from your decktop. If the revealed card is a \"Parasite\"/\"Shell Insect\"/\"Shellman\" family Spirit card, you can summon it without paying the cost. Discard any remaining cards.",
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
            "text": "The number of cores on your Green Spirits can't become less than their LV1 cost."
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
            "rule": "REVEAL_DECKTOP",
            "text": "When an opposing Spirit attacks, you can reveal a card from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_REVEALED",
            "text": "Discard any remaining cards."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-066",
    "name": "The Gate of the Giant Trees",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you would [Tribute], by exhausting this Nexus, treat all the cores on a Cost 3 \"Astral Soul\" family Spirit you control are sent to the specified area.\n\n[LV2]\nWhen your \"Astral Deity\"/\"Astral Soul\" family Spirit is destroyed, put a core from the Void to your Reserve.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-067",
    "name": "The Moonlight Gathering Tower",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nYour Hand is unaffected by opposing Spirit/Brave/Magic effects.\n\n[LV2]\nAll your Spirits with [Armor] are unaffected by opposing Brave effects of the same colors as their [Armor].",
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
            "rule": "IMMUNITY",
            "text": "Your Hand is unaffected by opposing Spirit/Brave/Magic effects."
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
        "keyword": "Armor"
      }
    ]
  },
  {
    "cardNumber": "BS12-068",
    "name": "The Light Sacred Sword",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive all your Spirits with [Armor]/[Heavy Armor] the effect: \"Purple/White (Opposing Turn) When the opponent uses a Purple/White Magic effect, by exhausting this Spirit, negate that effect.\"\n\n[LV2]\nWhen your Brave Spirit is destroyed, the Brave of that Brave Spirit remains, and return only the Spirit to your Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
        },
        "subCost": {
          "type": "EXHAUST_SELF"
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "When your Brave Spirit is destroyed, the Brave of that Brave Spirit remains"
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-069",
    "name": "The Ruler Mountains",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen the number of cores on your Spirits become zero due to opposing Spirit/Brave/Magic effect, that Spirit is treated as being destroyed at its highest level.\n\n[LV2] (Opposing Attack Step)\nYour Lives can't be reduced by the attacks of opposing Spirits with two symbols.",
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
            "rule": "KEYWORD_RULE",
            "text": "When the number of cores on your Spirits become zero due to opposing Spirit/Brave/Magic effect, that Spirit is treated as being destroyed at its highest level."
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-070",
    "name": "The Heaven's Stairway",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your \"Divine Spirit\" family Spirit is summoned, return a Cost 4 or less \"Divine Spirit\" family Spirit card from your Trash to the Hand.\n\n[LV2]\nWhile you control five or more \"Divine Spirit\" family Spirits, your Life can't become zero.",
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
          ],
          "requireFamilyOnField": {
            "family": "Divine Spirit",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "While you control five or more \"Divine Spirit\" family Spirits, your Life can't become zero."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-071",
    "name": "The Unfinished Ancient Battleship:Sail",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nSpirits with no printed effects you control are unaffected by opposing Magic effects.\n\n[LV2] (Opposing Main Step)\nThe opponent can only summon one Spirit card with printed effects from their Hand per turn.",
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
            "rule": "IMMUNITY",
            "text": "Spirits with no printed effects you control are unaffected by opposing Magic effects."
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-072",
    "name": "The Pirate King's Treasure Island",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Main Step)\nSpirits/Braves can't be summoned via Spirit/Brave/Nexus/Magic effects.\n\n[LV2] (When Destroyed)\nThe opponent discards a Magic card from their Hand. If nothing can be discarded, the opponent reveals their entire Hand.",
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
            "rule": "KEYWORD_RULE",
            "text": "Spirits/Braves can't be summoned via Spirit/Brave/Nexus/Magic effects."
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
            "text": "The opponent discards a Magic card from their Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "REVEAL_HAND",
            "text": "If nothing can be discarded, the opponent reveals their entire Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-073",
    "name": "Nexus Collapse",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy up to two Nexuses.\n\n[Flash]\nDuring this turn, give a Brave Spirit +5000 BP.",
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
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS12-074",
    "name": "Starry Draw",
    "cardType": "Magic",
    "effect": "[Main]\nReveal three cards from your decktop. Among them, add every \"Galaxian\"/\"Astral Soul\"/\"Astral Dragon\" family Spirit card/Brave card to your Hand. Discard any remaining cards.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "text": "Reveal three cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Among them, add every \"Galaxian\"/\"Astral Soul\"/\"Astral Dragon\" family Spirit card/Brave card to your Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_REVEALED",
            "text": "Discard any remaining cards."
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
    "cardNumber": "BS12-075",
    "name": "Bootes Call",
    "cardType": "Magic",
    "effect": "[Flash]\nBy using the cores on your Reserve to pay for the summoning cost and put on the Spirit for the summon, summon a Spirit card with [Immortality] from your Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS12-076",
    "name": "Brave Break",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy a Brave on an opposing Brave Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BRAVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-077",
    "name": "Insect Aura",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your \"Parasite\"/\"Shell Insect\"/\"Shellman\" family Spirit attacks, put a core from the Void to your Reserve, or that Spirit.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS12-078",
    "name": "Cassiopeia Seal",
    "cardType": "Magic",
    "effect": "This Magic card in Trash is unaffected by any effect.\n\n[Main]\nExhaust an opposing Spirit. Until (Your End Step) occurs five times, that Spirit can't refresh. After this effect resolves, put five cores from the Void beside your deck, and send one core to the Void on each of (Your End Step). Besides via this effect, these cores can't be used.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "rule": "IMMUNITY",
            "text": "This Magic card in Trash is unaffected by any effect."
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
    "cardNumber": "BS12-079",
    "name": "Absolute Strike",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget any number of opposing Spirits as you like. During this turn, the targeted Spirit(s) must attack if possible. This effect can only be used if you control any \"Strike\"-named Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Target any number of opposing Spirits as you like."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this turn, the targeted Spirit(s) must attack if possible."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "This effect can only be used if you control any \"Strike\"-named Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-080",
    "name": "Vacuum Symbol",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a color. During this turn, every opposing Spirit loses a symbol of the targeted color. This effect can't be used during (Your Turn).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CHOOSE_COLOR",
            "text": "Target a color."
          },
          {
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "This effect can't be used during (Your Turn)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-081",
    "name": "Melodious Harp",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, a Spirit loses all its effects, and can't gain any new ones. That Spirit is treated as having no printed effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "LOSE_EFFECTS",
            "text": "During this turn, a Spirit loses all its effects, and can't gain any new ones."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "That Spirit is treated as having no printed effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-082",
    "name": "Seventh Heaven",
    "cardType": "Magic",
    "effect": "This Magic card in Trash is unaffected by all effects.\n\n[Main]\nPut cores from the Void to your Life until it reaches seven. This effect can only be used if you control seven or more \"Divine Spirit\" family Spirits.\n\n[Flash]\nDuring this turn, give a Spirit +5000 BP.",
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
            "rule": "IMMUNITY",
            "text": "This Magic card in Trash is unaffected by all effects."
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR",
          "requireFamilyOnField": {
            "family": "Divine Spirit",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "GRANT_FAMILY",
            "text": "This effect can only be used if you control seven or more \"Divine Spirit\" family Spirits."
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS12-083",
    "name": "Magic Lamp",
    "cardType": "Magic",
    "effect": "[Main]\nReveal three cards from your decktop. You can deploy a Nexus card among them, without paying the cost. Discard any remaining cards.\n\n[Flash]\nDuring this turn, give a Spirit with no printed effects +5000 BP.",
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
            "text": "Reveal three cards from your decktop."
          },
          {
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_REVEALED",
            "text": "Discard any remaining cards."
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS12-084",
    "name": "Mercury Goblet",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy a Spirit with the lowest cost on the opposing Field.",
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
    "cardNumber": "BS12-X01",
    "name": "The BullDragonDeity Dragonic-Taurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nOpposing Spirits must block if possible.\n\n[LV2][LV3] (When Attacks)\nWhen blocked, compare the symbols of the blocking opposing Spirit to this Spirit's, and for each symbol more on this Spirit, send an opposing Life to their Reserve.\n\n[LV3] (When Attacks)\nWhen comparing symbols with this Spirit's effect, this Spirit gains an extra Red symbol for each \"Astral Deity\"/\"Galaxian\" family Spirit you control.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-X02",
    "name": "The EvilCapricornusDeity Stein-Bolg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each \"Galaxian\"/\"Astral Soul\" family Spirit you control, return a Purple card from your Trash to the Hand.\n\n[LV1][LV2][LV3] (Your Attack Step)\nWhen your \"Galaxian\"/\"Astral Soul\" family Spirit attacks, send a core from any opposing Spirit to the Reserve.\n\n[LV2][LV3]\nCores to be sent to the opposing Reserve via Spirit/Brave/Magic effects are sent to the Trash instead.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
            "rule": "KEYWORD_RULE",
            "text": "Cores to be sent to the opposing Reserve via Spirit/Brave/Magic effects are sent to the Trash instead."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-X03",
    "name": "The MonoeyeBushin Mantics-Masamune",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step)\nThe number of cores on each Spirit can't become less than their LV1 cost.\n\n[LV1][LV2] (When Attacks)\nPut two cores from the Void to your Reserve or this Spirit.\n\n[When Braved] [LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by your \"Parasite\"/ \"Shell Insect\"/ \"Shellman\" family Spirits by BP comparison, send an opposing Life to their Reserve.",
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
            "text": "The number of cores on each Spirit can't become less than their LV1 cost."
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-X05",
    "name": "The ValkyrieVirgoDeity Vielje",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nIf your Life is five or less, put a core from the Void to your Life.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nOpposing Cost 2/3/5/7/11 Spirits can't attack.\n\n[LV2][LV3]\nWhen your \"Galaxian\"/\"Divine Spirit\" family Spirits are destroyed by the opponent, return them to the Hand.",
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
            "to": "LIFE",
            "count": 1
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
            "text": "Opposing Cost 2/3/5/7/11 Spirits can't attack."
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-X06",
    "name": "The PirateKing Leviadan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy all opposing Spirits with the same costs as your \"Beast Head\" family Spirits.\n\n[LV2][LV3] (When Attacks)\nAt the end of battle, by destroying one of your Spirits with no printed effects, refresh this Spirit.\n\n[LV3]\nTreat all your Spirits as Spirits with no printed effects.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
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
        "subCost": {
          "type": "SACRIFICE_SPIRIT",
          "count": 1
        },
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
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
            "rule": "TREAT_RULE",
            "text": "Treat all your Spirits as Spirits with no printed effects."
          }
        ]
      }
    ]
  }
];

for (const spec of BS12_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
