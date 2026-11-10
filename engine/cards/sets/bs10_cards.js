/**
 * engine/cards/sets/bs10_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS10_SAGA_CARDS)
 * Total Cards: 114 (98 Effect, 16 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS10_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS",
    "name": "Angedoll",
    "cardType": "Brave",
    "effect": "[Brave Condition: No printed effects]\n\n[LV1] (When Summoned) During this turn, all your Spirits can't be blocked by opposing LV2 Spirits.\n\n[When Braved] (When this Spirit Brave Attacks) When the battle resolves, compare the LVs instead of the BPs. Spirit with the lower LV is destroyed. If the LVs are the same, both Spirits are destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: No printed effects"
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
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "(When this Spirit Brave Attacks) When the battle resolves, compare the LVs instead of the BPs."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "BP_OR_LEVEL_MODIFIER",
            "text": "Spirit with the lower LV is destroyed."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RULE",
            "text": "If the LVs are the same, both Spirits are destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1026",
    "name": "Anteater",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Destroy an opposing Spirit with \"Antman\" in its name.\n\n[LV1][LV2] When this Spirit is destroyed due to the effects of an opposing Spirit, send all Cores from the Spirit who activated the effect to your opponent's Trash.",
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
        "overall": "WHEN_DESTROYED",
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
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1059",
    "name": "Onigumon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11284",
    "name": "The Lumberjack Gobri-Gobri",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11847",
    "name": "The RedHoodFairy Rouge",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Holy Life (When Attacks) When the opponent's life is decreased by this Spirit's Attack, put one core from the Void to your Life.\n\n[LV3] (When Attacks) When attacking after your Brave Spirit, this Spirit cannot be blocked.",
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
            "to": "LIFE",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A220",
    "name": "Duald",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3804",
    "name": "Djungaree",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4494",
    "name": "Glaakie",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A565",
    "name": "The BigDipperDragon Sieg-Apollodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon a Brave card from your Hand, without paying the cost. When a Brave is summoned with this effect, draw a card.\n\n[When Braved] [LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, destroy an opposing Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6641",
    "name": "Mothpede",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Treat this spirit as a Green Spirit as well as a Purple Spirit.",
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
            "text": "Treat this spirit as a Green Spirit as well as a Purple Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6710",
    "name": "Mushazemi",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8659",
    "name": "The BattleBeast Raygallop",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] This Spirit is also treated as Yellow Spirit.",
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
            "text": "This Spirit is also treated as Yellow Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8994",
    "name": "The CancerBushin Cancerd",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen your \"Galaxian\"/\"Astral Soul\" family Spirit attacks, the opponent can only block if they block with two Spirits, or one Ultimate. When that Spirit you control is blocked, choose one of the two to battle against.\n\n[LV2] (When Attacks)\nWhile you control any Brave Spirit, when this Spirit's attack reduces the opposing Life, send an opposing Life to their Reserve.",
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
            "text": "When your \"Galaxian\"/\"Astral Soul\" family Spirit attacks, the opponent can only block if they block with two Spirits, or one Ultimate."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RULE",
            "text": "When that Spirit you control is blocked, choose one of the two to battle against."
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9423",
    "name": "The DiploDinoman Bracchio",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] While you control any Brave Spirit, treat this Spirit as being [LV3].",
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
            "text": "While you control any Brave Spirit, treat this Spirit as being [LV3]."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-001",
    "name": "Shamcaesar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit is also treated as a White Spirit.",
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
            "text": "This Spirit is also treated as a White Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-003",
    "name": "Shurikeraptor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nDestroy an opposing Spirit with the same BP as this Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "BS10-004",
    "name": "Eusthedea",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-005",
    "name": "Dilophoza",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash Awaken - You can put any number of cores from Spirits you control to this Spirit.\n\n[LV1][LV2][LV3] Clash (When Attacks) The opponent must block if possible.",
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
      }
    ]
  },
  {
    "cardNumber": "BS10-006",
    "name": "Yashium",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn a Spirit card/Brave card from your Trash to the Hand.",
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
    "cardNumber": "BS10-008",
    "name": "The MarsDragonDeity Ares-Dragoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[When Braved] [LV2]\nAt the end of your turn, refresh all your Spirits with [Clash], and your Attack Step and End Step occur each once more in order. This effect can only be used once per turn.",
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
    "cardNumber": "BS10-009",
    "name": "Tornadra",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-013",
    "name": "The MagicFencer Dragonaga",
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
    "cardNumber": "BS10-014",
    "name": "The DarkKnight Maris",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 4] (Either Attack Step)\nWhen your Cost 4 Spirit is destroyed, you can summon this Spirit card from the Trash.\n\n[LV2]\nWhen this Spirit is destroyed by opposing Spirit effects, send all cores from the Spirit who activated the effect to the opposing Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 4"
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-015",
    "name": "Rogan",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-016",
    "name": "Jaw-Scythe",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked this Spirit at the end of battle.\n\n[LV2] (When Attacks)\nDraw a card.",
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
    "cardNumber": "BS10-017",
    "name": "The HellMousquetaire Gaim",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-018",
    "name": "El-Kraken",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nExhaust up to a total of three opposing Spirits/Nexuses.",
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
    "cardNumber": "BS10-019",
    "name": "The SaturnDragonDeity Krono-Bolos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nBy discarding two cards from your Hand, draw three cards.\n\n[When Braved] [LV2][LV3] (When Destroyed)\nThe opponent sends cores from their Field/Reserve/Trash to the Void until they have five or less cores in total remaining. Then, sends cores from your Field/Reserve/Trash to the Void until you have five or less cores in total remaining.",
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
            "count": 3
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
    "cardNumber": "BS10-020",
    "name": "The WaterSnake Hydrogen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nFor each \"Astral Soul\" family Spirit you control, send a core from any opposing Spirit to their Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-023",
    "name": "Luckiwi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Battles)\nPut a core from the Void to this Spirit.",
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
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-025",
    "name": "Herajigusa",
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
    "cardNumber": "BS10-026",
    "name": "The Veteran Nogan",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts a Spirit they control.",
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
    "cardNumber": "BS10-027",
    "name": "The Rookie Unpyoru",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nAt the end of battle, you can separate the Brave from one of your Brave Spirits, and brave it to a Spirit you control.",
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
            "rule": "KEYWORD_RULE",
            "text": "At the end of battle, you can separate the Brave from one of your Brave Spirits, and brave it to a Spirit you control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-028",
    "name": "Matangol",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-029",
    "name": "The JupiterDragonDeity Nobunagard-Zeuses",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon any number of Brave cards from your Hand without paying the costs. However, any (When Summoned) effects of the Braves can't activate.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nFor each Brave Spirit you control, exhaust an opposing Spirit.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of the Braves can't activate."
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
    "cardNumber": "BS10-030",
    "name": "The General Antman",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nFor each \"Shellman\" family Spirit you control, this Spirit gains +2000 BP.",
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
          "family": "Shellman"
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS10-032",
    "name": "Gadphant",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nThis Spirit gains +3000 BP.\n\n[LV2] [Armor: Blue]\nThis Spirit is unaffected by opposing Blue Spirit/Nexus/Magic effects.",
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
            "amount": 3000
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
        "keyword": "Armor: Blue"
      }
    ]
  },
  {
    "cardNumber": "BS10-033",
    "name": "Northernbeard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nPut a core from the Void to this Spirit.",
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
    "cardNumber": "BS10-034",
    "name": "The ArmoredBeast Chimairon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Red/Purple (Opposing Turn)\nWhen the opponent uses any Red/Purple Magic effects, by exhausting this Spirit, negate that effect.\n\n[LV1][LV2] (Opposing Attack Step)\nWhen your Life is reduced, this Spirit refreshes.",
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
    "cardNumber": "BS10-035",
    "name": "The DoctorGoddess Eir",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn one opposing Spirit to the Hand.\n\n[LV2]\nWhen your \"Astral Soul\" family Spirits are destroyed, put a core from the Void to your Life.",
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
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-036",
    "name": "The CrystalFish Crysteel",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-037",
    "name": "Emperordol",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nGive all your \"Machine Beast\" family Spirits: \"[Armor: Red/Blue] This Spirit is unaffected by opposing Red/Blue Spirit/Nexus/Magic effects.\"\n\n[LV2] (When Blocks)\nThis Spirit gains +5000 BP.",
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
        "keyword": "Armor: Red/Blue"
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
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-038",
    "name": "The BlackSpear Bolvelgr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReturn every 4000 BP or less Spirit to the Hand.",
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-039",
    "name": "Bianco-Tiger",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-040",
    "name": "The CarrierWhale Hogale",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit gains +1000 BP for every \"Flying Fish\" family Spirit you control.\n\n[LV2][LV3] (Opposing Attack Step)\nAll your \"Flying Fish\" family Spirits gain +3000 BP.",
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
          "family": "Flying Fish"
        },
        "amount": 1000
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "targetFilter": {
          "family": "Flying Fish"
        },
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BS10-041",
    "name": "Tin-Soldier",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Battles)\nAt the end of battle, destroy this Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-042",
    "name": "Charadrius",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Brilliance] (When Attacks)\nAt the end of battle, return every Magic card you used during this battle to your Hand.\n\n[LV2] (When Destroyed)\nReturn one opposing Spirit with [Assault] to the deckbottom.",
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
            "op": "SALVAGE_TRASH",
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
    "cardNumber": "BS10-043",
    "name": "Kikasaal",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen your Cost 2 Spirits are destroyed, draw a card.",
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
      }
    ]
  },
  {
    "cardNumber": "BS10-044",
    "name": "The ForestElf Pentan",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-046",
    "name": "The DragoonDuchess",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen your Spirits are destroyed, you can discard any number of Magic cards from your Hand. For each Magic card discarded, one of the destroyed Spirits returns to your Field, exhausted.\n\n[LV2] (When Attacks)\nYou can use a Yellow Magic card in your Trash as if it were in your Hand.",
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
            "rule": "DISCARD_HAND",
            "text": "When your Spirits are destroyed, you can discard any number of Magic cards from your Hand."
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-048",
    "name": "The Angelia Power",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-049",
    "name": "The FairyPriest Andromeda",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReturn a Magic card from your Trash to the Hand.\n\n[LV1][LV2][LV3]\nThis Spirit gains +1000 BP for each card in your Hand.",
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
            "op": "SALVAGE_TRASH",
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS10-050",
    "name": "The ThunderSacredBeast Nue",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nWhen the attack of your Spirit with [Holy Life] reduces the opposing Life, send a core from the opposing Life to their Reserve.",
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
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-053",
    "name": "The Guardian Bertram",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nYour Blue Nexuses can't be destroyed by opposing Spirit/Brave/Nexus/Magic effects.",
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
            "text": "Your Blue Nexuses can't be destroyed by opposing Spirit/Brave/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-054",
    "name": "Locomo-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's LV.\n\n[LV2][LV3] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-056",
    "name": "The ApeDeity Mongoku",
    "cardType": "Spirit",
    "effect": "This Spirit card in Trash is treated as [The ApeMan Mongoku].\n\n[LV1][LV2][LV3] (When Summoned)\nDuring this turn, all your Spirits are treated as being at their highest levels.\n\n[LV1][LV2][LV3]\nFor both players, cores can't be put from the Void to the Field/Reserve outside of Core Step.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "This Spirit card in Trash is treated as [The ApeMan Mongoku]."
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "During this turn, all your Spirits are treated as being at their highest levels."
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
            "rule": "COMBAT_RESTRICTION",
            "text": "For both players, cores can't be put from the Void to the Field/Reserve outside of Core Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-057",
    "name": "The Stagman Deard",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-058",
    "name": "The MercuryDragonDeity Mercurius-Serpent",
    "cardType": "Spirit",
    "effect": "(Your Main Step)\nBy returning a Blue Nexus you control to the deckbottom, you can summon this Spirit card from your Hand without paying the cost.\n\n[When Braved] [LV2] (When Brave Attacks)\nChoose a random card from the opposing Hand. Then, look at its content; if it is a Magic card, discard it. Otherwise, return it to their Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "you can summon this Spirit card from your Hand without paying the cost."
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
    "cardNumber": "BS10-059",
    "name": "Fort-Golem",
    "cardType": "Spirit",
    "effect": "While you control any Nexus, this Spirit card in Hand becomes Cost 4.\n\n[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While you control any Nexus, this Spirit card in Hand becomes Cost 4."
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-060",
    "name": "The GiantJaeger Orion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDiscard 12 cards from the opposing decktop.",
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
    "cardNumber": "BS10-062",
    "name": "The GunDragon Phoenix-Cannon",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDestroy two opposing 4000 BP or less Spirits. Or, destroy an opposing 4000 BP or less Spirit and an opposing Nexus.\n\n[When Braved] [Clash] (When Attacks)\nThe opponent must block with their Spirits if possible. However, Ultimates don't have to block.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 2,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
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
    "cardNumber": "BS10-063",
    "name": "The JavelinBeast Balli-Star",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Brave Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, destroy every opposing Spirit with the same family as that destroyed Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-064",
    "name": "The SkullTank Geparberd",
    "cardType": "Brave",
    "effect": "[Brave Condition: No printed effects]\n\n[LV1] (When Summoned)\nDraw a card.\n\n[When Braved] (When Attacks)\nDestroy an opposing exhausted Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: No printed effects"
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
        "overall": "WHEN_ATTACKS",
        "subConditions": {
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
    "cardNumber": "BS10-065",
    "name": "Hedgebolg",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, send all cores on the destroyed Spirit to the Void.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
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
    "cardNumber": "BS10-066",
    "name": "The KnightSnake Pendragon",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nSend two cores from an opposing Spirit to their Reserve. When the number of cores on that Spirit is brought to 0 by this effect, draw a card.\n\n[When Braved] (When Attacks)\nSend a core from any opposing non-braved Spirit to their Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "RESERVE",
            "allMatching": false
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
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
      }
    ]
  },
  {
    "cardNumber": "BS10-067",
    "name": "The KarakuriDog Shiba",
    "cardType": "Brave",
    "effect": "[Brave Condition: No printed effects]\n\n[LV1] (When Summoned)\nPut a core from the Void to your Reserve.\n\n[When Braved] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: No printed effects"
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
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
    "cardNumber": "BS10-068",
    "name": "Beam-Beetle",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nExhaust an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "ATTACK_STEP",
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
    "cardNumber": "BS10-069",
    "name": "The SwordBird Kacrane",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts two Spirits they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "turn": "YOUR"
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
    "cardNumber": "BS10-070",
    "name": "The ArmoredHorse Alfothr",
    "cardType": "Brave",
    "effect": "[Brave Condition: No printed effect]\n\n[LV1] (When Summoned)\nReturn an opposing Spirit to the Hand.\n\n[When Braved] (Opposing Attack Step)\nWhen an opposing non-braved Spirit attacks, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: No printed effect"
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
            "count": 1,
            "allMatching": false
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
    "cardNumber": "BS10-072",
    "name": "Sabershark",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[LV1] (When Summoned)\nDuring this turn, all the (When Blocks) effects of your Spirits now activate as (When Attacks).\n\n[When Braved] (When Blocks)\nWhen only the opposing Spirit is destroyed by comparing BP, send an opposing Life to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
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
            "rule": "CONTINUOUS_RULE",
            "text": "During this turn, all the (When Blocks) effects of your Spirits now activate as (When Attacks)."
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-074",
    "name": "The Kigurumi Kumattar",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Battles)\nExhaust every opposing Nexus. Effects of all exhausted Nexuses can't activate.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {},
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
    "cardNumber": "BS10-075",
    "name": "Oniyurin",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] [Holy Life] (When Brave Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
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
    "cardNumber": "BS10-076",
    "name": "Bazooka-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: No printed effects]\n\n[LV1] (When Summoned)\nYou can deploy a Blue Nexus card from your Hand, without paying the cost.\n\n[When Braved] [Assault: 1] (When Brave Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting a Nexus you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: No printed effects"
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "ASSAULT_REFRESH",
            "maxTimes": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-077",
    "name": "Gyokuryuun",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Battles)\nWhen the opponent would use a Magic effect, unless the opponent pay two extra costs, they can't use it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "When the opponent would use a Magic effect, unless the opponent pay two extra costs, they can't use it."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-078",
    "name": "The SacredArmoredBeast Ammead",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (Your Attack Step)\nTreat this Spirit as being on its highest Level.",
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
            "rule": "TREAT_RULE",
            "text": "Treat this Spirit as being on its highest Level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-079",
    "name": "The Table Mountain Range",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Turn)\nAll your Spirits gain +1000 BP.\n\n[LV2]\nAll your Brave Spirits can't be returned to the Hand from Field by opposing Spirit/Brave/Nexus/Magic effects.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-080",
    "name": "The Flame Crystal",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every Spirit card with no printed effects in your Hand an extra [Red Core] reduction symbol.\n\n[LV2] (Your Main Step)\nWhen your Spirit with no printed effects is summoned, destroy an opposing Spirit with a BP equal or inferior to that Spirit's LV1 BP.",
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
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
    "cardNumber": "BS10-082",
    "name": "The Sextant Observatory",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your End Step)\nReturn a Spirit card with no printed effects from your Trash to the Hand.\n\n[LV2]\nWhen your \"Evil Shadow\" family Spirit is summoned, send cores from an opposing Spirit to the Reserve until one core remains on it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "END_STEP",
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
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "RESERVE",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-083",
    "name": "The Historic Battlefield of Evil Star",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nWhen opposing Spirit becomes exhausted, draw a card.\n\n[LV2]\nGive all your Spirit-condition Braves the effect: \"[Curse] (When Attacks) Destroy an opposing Spirit that blocked this Spirit at the end of battle.\"",
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
    "cardNumber": "BS10-084",
    "name": "The Mouth of False",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your \"Dark Snake\" family Spirit is destroyed, draw a card.\n\n[LV2] (Your End Step)\nYou can summon a Spirit card with [When Braved] effects from your Trash.",
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
        "overall": "END_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR",
          "requireBraved": true
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
    "cardNumber": "BS10-086",
    "name": "The Tree overlooking the Huge Star",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nAll your Braves in Spirit condition get +2000 BP.\n\n[LV2] (Either Attack Step)\nWhen your Brave Spirit battles, at the end of the battle, by separating it, refresh that Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-087",
    "name": "The New Life on the Battlefield",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Core Step)\nBy not putting a core from the Void to your Reserve, draw a card.\n\n[LV2] (Opposing Attack Step)\nWhen your Life is reduced by the opponent, put a core from the Void each to every Brave Spirit you control.",
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
    "cardNumber": "BS10-088",
    "name": "The Tower Castle soaring to Heaven",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Spirit with no printed effects blocks, put a core from the Void to that Spirit.\n\n[LV2] (Opposing Attack Step)\nWhen an opposing Spirit attacks, refresh every Spirit with no printed effects you control.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-089",
    "name": "The Freezing Lake with the Moonlight",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Start Step)\nReturn an opposing Nexus to the Hand.\n\n[LV2] (Opposing Turn)\nWhen the opponent draws cards outside of Draw Step, you can draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-090",
    "name": "The Coral Reef in the Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nAll your Spirits gain +1000 BP.\n\n[LV2] (Your Main Step)\nWhen your \"Flying Fish\" family Spirit is summoned, return an opposing non-Braved Spirit to the Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-091",
    "name": "The Lakeside with Soap bubbles",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Spirits with no printed effects are destroyed, draw a card.\n\n[LV2] (Opposing Turn)\nYour Cost 2 Spirits are unaffected by opposing Spirit effects.",
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
            "op": "PASSIVE_RULE",
            "rule": "IMMUNITY",
            "text": "Your Cost 2 Spirits are unaffected by opposing Spirit effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-092",
    "name": "The Flower Garden with the Daystar",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nIn addition to the symbols on your Field, you can also use the symbols of cards in your Trash for summon cost reduction of Yellow Spirit cards in your Hand.\n\n[LV2] (Your Main Step)\nWhen your \"Astral Deity\"/\"Galaxian\"/\"Astral Soul\" family Spirit is summoned, send a core from your Reserve to your Life.",
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
    "cardNumber": "BS10-093",
    "name": "The Ticking Flower Clock",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Yellow Spirit is destroyed by opposing Spirit effects, during this turn, your Life can't be reduced.\n\n[LV2] (Your Attack Step)\nYour Brave Spirits can't be blocked by opposing Cost 5 or less Spirits.",
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
            "rule": "COMBAT_RESTRICTION",
            "text": "When your Yellow Spirit is destroyed by opposing Spirit effects, during this turn, your Life can't be reduced."
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-094",
    "name": "The Unfinished Ancient Battleship:Keel",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nYour Spirits with no printed effects can block opposing Cost 4 or less Spirits while exhausted.\n\n[LV2]\nTreat all your Spirits with no printed effects as being one Level higher.",
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "Treat all your Spirits with no printed effects as being one Level higher."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-095",
    "name": "The Colosseum with the Speed Star",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nThe opponent can only use Magic cards of the same colors as the symbols on their Field.\n\n[LV2] (Your Attack Step)\nOpposing Spirit/Brave/Nexus/Magic's \"BP+\" effect do not activate.",
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
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
            "rule": "KEYWORD_RULE",
            "text": "Opposing Spirit/Brave/Nexus/Magic's \"BP+\" effect do not activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-096",
    "name": "The Final Championship Flag",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed)\nPut a core from the Void to this Nexus.\n\n[LV2] (Start of Your Main Step)\nBy destroying a Spirit you control, summon a Brave card with the same cost as the destroyed Spirit from your Hand, without paying the cost.",
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
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
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-097",
    "name": "Brave Aura",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all your attacking Spirits gain +1000 BP. Also, all your attacking Brave Spirits gain +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS10-098",
    "name": "Revive Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw two cards. Or, return one Spirit card from your Trash to Hand.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS10-099",
    "name": "Southan Cross Flame",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy every 4000 BP or less Spirit.",
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
    "cardNumber": "BS10-100",
    "name": "Brave Cemetery",
    "cardType": "Magic",
    "effect": "[Main]\nReturn a Brave card from your Trash to the Hand.\n\n[Flash]\nDuring this turn, give a Spirit +1000 BP.",
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
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-101",
    "aliases": [
      "CB33-059"
    ],
    "name": "Hangedman",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, when your Spirits with [Immortality] are destroyed, the opponent destroys a Spirit they control.",
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
    "cardNumber": "BS10-102",
    "name": "Core Steal",
    "cardType": "Magic",
    "effect": "[Flash]\nSend cores from an opposing Spirit to their Reserve until one core remains on it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "RESERVE",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-103",
    "name": "Grawing Sword",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give a Spirit you control +3000 BP. Also, by sending any number of cores from your Field/Reserve to your Trash, for each core sent, give that Spirit +1000 BP.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS10-104",
    "name": "Triangle Trap",
    "cardType": "Magic",
    "effect": "[Flash]\nExhaust an opposing Spirit. Or, exhaust three opposing Cost 4 or less Spirits.",
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
    "cardNumber": "BS10-105",
    "name": "Life Charge",
    "cardType": "Magic",
    "effect": "[Flash]\nBy destroying a Cost 3 or more Spirit you control, put three cores from the Void to your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 3
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-106",
    "name": "Protect Aura",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all your blocking Spirits gain +2000 BP. Also, all your blocking Brave Spirits gain +3000 BP.",
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
    "cardNumber": "BS10-107",
    "name": "Silent Lock",
    "cardType": "Magic",
    "effect": "[Flash]\nWhen the battle of a non-braved Spirit ends, end the Attack Step.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "END_ATTACK_STEP",
            "timing": "IMMEDIATE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-108",
    "name": "Lunatic Seal",
    "cardType": "Magic",
    "effect": "This Magic card in Trash is unaffected by any effect.\n\n[Main]\nUntil (Your End Step) occurs for three times: cards can't be discarded from either decks; Attack Step doesn't occur for both players; and cores from the Void/Reserve can't be put to Life. After this effect resolves, put three cores from the Void next to your deck, and send one core to the Void on each of (Your End Step). Besides via this effect, these cores can't be used.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "Until (Your End Step) occurs for three times: cards can't be discarded from either decks; Attack Step doesn't occur for both players; and cores from the Void/Reserve can't be put to Life."
          },
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "Besides via this effect, these cores can't be used."
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
    "cardNumber": "BS10-109",
    "name": "Shining Arrow",
    "cardType": "Spirit",
    "effect": "[Main]\nReturn a Spirit card with [Holy Life] from your Trash to the Hand.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "to": "LIFE",
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
    "cardNumber": "BS10-110",
    "name": "Knockout",
    "cardType": "Spirit",
    "effect": "[Flash]\nWhen the battle resolves, instead of BP, compare the costs, and the Spirit with a lower cost is destroyed. If the costs are the same, both players' Spirits are destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "When the battle resolves, instead of BP, compare the costs, and the Spirit with a lower cost is destroyed."
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
    "cardNumber": "BS10-111",
    "name": "Hand Typhoon",
    "cardType": "Magic",
    "effect": "[Main]\nBoth players discard their entire Hand. Then, both players draw four cards from their decks.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "count": 4
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
    "cardNumber": "BS10-112",
    "name": "Nexus Extension",
    "cardType": "Magic",
    "effect": "[Main]\nDeploy a Nexus card from your Trash, without paying the cost. Then, return a Nexus card from your Trash to your Hand.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
    "cardNumber": "BS10-113",
    "name": "Orion Power",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when the attack of your \"Fighting Spirit\"/\"Astral Soul\" family Spirit reduces the opposing Life, discard ten cards from the opposing decktop.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
    "cardNumber": "BS10-114",
    "name": "Eridanus Flood",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy an opposing Brave Spirit.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_BRAVE",
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
    "cardNumber": "BS10-X01",
    "name": "The PhantomStarDragon Gai-Asura",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3][LV4]\nNeither player can remove cores from this Spirit.\n\n[LV1][LV2][LV3][LV4] Flash - [Ultra Awaken]\nYou can put any number of cores from your Spirits to this Spirit. When any core is put via this effect, refresh this Spirit.\n\n[LV4] (When Attacks)\nDuring this battle, cores of all opposing destroyed Spirits are sent to the Void, not the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2,
            3,
            4
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
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1,
            2,
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "ULTRA_AWAKEN",
            "maxCores": 2,
            "bpBonus": 3000
          },
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
            4
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
    "cardNumber": "BS10-X05",
    "name": "The FallenDragonDeity Venu-Lucifer",
    "cardType": "Spirit",
    "effect": "This Spirit card in your Hand can use the symbols on your Field as well as in your Trash for summoning cost reduction.\n\n[When Braved] Flash - [LV3] (When Brave Attacks)\nBy discarding a Spirit card from your Hand, discard cards from your decktop until a Magic card is discarded, and immediately activate that Magic card's Flash effect without paying the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "This Spirit card in your Hand can use the symbols on your Field as well as in your Trash for summoning cost reduction."
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "By discarding a Spirit card from your Hand"
          },
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
    "cardNumber": "BS10-X06",
    "name": "The ScorpioKnight Scor-Spear",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nAll your Spirit-condition Braves are treated as Spirit-condition Braves with \"Cost 5/Galaxian\" & \"Fusion Beast\" families/Level 1: 1 core, 7000 BP.\"\n\n[LV2][LV3]\nGive all your \"Galaxian\"/\"Astral Soul\" family Spirits the effect: \"(When Attacks) Destroy an opposing non-braved Spirit with a cost equal or inferior to this Spirit's.\"",
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
            "text": "All your Spirit-condition Braves are treated as Spirit-condition Braves with \"Cost 5/Galaxian\" & \"Fusion Beast\" families/Level 1: 1 core, 7000 BP.\""
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
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "STRIKE-SIEGWURM",
    "name": "The MoonlightDragon Strike-Siegwurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nWhen an opposing Spirit attacks, refresh this Spirit.\n\n[LV2][LV3] (When Blocks)\nWhen only the opposing Spirit is destroyed via BP comparison, return all opposing Spirits with BP inferior to that Spirit's to the Hand.\n\n[When Braved] [LV3] (Opposing Attack Step)\nAt the start of the step, target an opposing non-brave Spirit. That Spirit must attack if possible.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": true
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
            "rule": "KEYWORD_RULE",
            "text": "At the start of the step, target an opposing non-brave Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "That Spirit must attack if possible."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "TYPE-B",
    "name": "Fenrircannon Type-B",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] Armor: Red/Purple- This Spirit is unaffected by opposing Red/Purple Spirit/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "Armor: Red/Purple- This Spirit is unaffected by opposing Red/Purple Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  }
];

for (const spec of BS10_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
