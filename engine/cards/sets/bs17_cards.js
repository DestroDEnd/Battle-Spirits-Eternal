/**
 * engine/cards/sets/bs17_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS17_SAGA_CARDS)
 * Total Cards: 88 (82 Effect, 6 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS17_SAGA_CARDS = [
  {
    "cardNumber": "313002-006",
    "name": "Vajranga",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "313002-018",
    "name": "Terimuck",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "313002-045",
    "name": "OryxThievs",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1091",
    "name": "Smokujira",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] When your Cost 3 Spirits are destroyed by the opponent, you can destroy a Cost 3 or less Spirit.",
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
            "rule": "DESTROY",
            "text": "When your Cost 3 Spirits are destroyed by the opponent, you can destroy a Cost 3 or less Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13814",
    "name": "Todorl",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13913",
    "name": "Tsukuyomidragoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) You can reveal three cards from your decktop. Among them, you can activate the burst effect of a card with Burst effect that has the condition: [Burst: After Your Opponent activates a Spirit's/Brave's (When Summoned) effect]. Remaining cards are discarded.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "REVEAL_DECKTOP",
            "text": "You can reveal three cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Among them, you can activate the burst effect of a card with Burst effect that has the condition: [Burst: After Your Opponent activates a Spirit's/Brave's (When Summoned) effect]."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_ACTION",
            "text": "Remaining cards are discarded."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2804",
    "name": "Arjunas",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) When blocked by an opposing Brave Spirit, this Spirit gets +4000 BP.\n\n[LV2][LV3] (When Attacks) While you have a Burst set, you can target and attack an opposing Brave Spirit.",
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
            "amount": 4000
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "While you have a Burst set, you can target and attack an opposing Brave Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2975",
    "name": "Bari-Burn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) At the end of battle, during this turn, give a Spirit you control +3000 BP.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3376",
    "name": "Chainviper",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step) When your Spirit is battling with opposing Spirits with Armor/Heavy Armor, that Spirit you control get +3000 BP.\n\n[LV2][LV3] When cores are put from the Void to the opposing life, for each core put, your opponent must discard 2 cards from their Hand.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 3000,
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
            "rule": "DISCARD_HAND",
            "text": "When cores are put from the Void to the opposing life, for each core put, your opponent must discard 2 cards from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3939",
    "name": "Elestera",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) Put a core from the Void to this Spirit.\n\n[LV2] (Your End Step) By sending 1 core from this Spirit to your Trash, refresh this Spirit.",
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
            "to": "SELF",
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4492",
    "name": "Giraffer",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Your opponent exhaust a Spirit they control.",
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
    "cardNumber": "BATTLE-SPIRITS-A7197",
    "name": "Pixiefalco",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) When this Spirit's attack reduces the opposing life, your opponent can't activate a Burst.",
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
            "rule": "KEYWORD_RULE",
            "text": "When this Spirit's attack reduces the opposing life, your opponent can't activate a Burst."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7441",
    "name": "Rhantegoth",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] When the opponent sets a Burst, put a core from the Void to a Spirit/Nexus you control.",
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
            "op": "CORE_FROM_VOID",
            "to": "TARGET_SPIRIT",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8653",
    "name": "The BattleBeast Camerune",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step) When you control three or less Spirits, this Spirit gets +2000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9821",
    "name": "The Faraway Ground",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step) When an opposing Burst activates, unless the opponent send two cores from their Reserve to the Trash, the effect can't activate.\n\n[LV2] When your \"Machine Beast\" family Spirits are destroyed by the opponent, return one of the destroyed Spirits to your Hand.",
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
            "to": "RESERVE"
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
    "cardNumber": "BS17-005",
    "name": "Drag-Krisnar",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nSummon this Spirit card. Then, if you do not have a Burst set, you can set a card with Burst effect from your Hand.\n\n[LV2][LV3] (Your Attack Step)\nWhile you have a Burst set, when your \"Supreme Hero\"/\"Great General\" family Spirit attacks, draw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "if you do not have a Burst set, you can set a card with Burst effect from your Hand."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "requireFamilyOnField": {
            "family": "Great General",
            "min": 1
          }
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
    "cardNumber": "BS17-008",
    "name": "The RubyDragon Volgand",
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
    "cardNumber": "BS17-009",
    "name": "Swordmaster-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, for each 3000 BP this Spirit has more than the destroyed Spirit, send a core from the opposing Life to their Reserve. (Max. 3)\n\n[LV3] (When Attacks)\nThis Spirit gains +3000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-010",
    "name": "Mudoolo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS17-011",
    "name": "Camelot Knight",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 0] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 0 Spirit is destroyed.\n\n[LV2]\nTreat this Spirit as \"DarkKnight\"-named.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 0"
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
            "text": "Treat this Spirit as \"DarkKnight\"-named."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-012",
    "name": "The DarkKnight Aglovale",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 4] (Either Attack Step)\nThis Spirit card in your Trash can be summoned when your Cost 4 Spirit is destroyed.\n\n[LV2]\nWhen your Cost 3 Spirits are destroyed by the opponent, send a core from any opposing Spirit/Nexus to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 4"
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
    "cardNumber": "BS17-016",
    "name": "The DarkKnight Lancelot",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nBy returning two Purple Spirit cards from your Trash to the Hand, summon this Spirit card.\n\n[Immortality: Cost 6] (Either Attack Step)\nThis Spirit card in your Trash can be summoned when your Cost 6 Spirit is destroyed.\n\n[LV1][LV2] (When Summoned)\nDestroy an opposing exhausted Cost 5 or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "summon this Spirit card."
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 6"
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
            "op": "DESTROY_BY_COST",
            "maxCost": 5,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-017",
    "name": "The HellSoarBeast Fur-Fool",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nWhen you set a Burst, send a core from any opposing Spirit to their Trash.",
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
            "op": "OPPONENT_SEND_CORES_MIN_ONE",
            "count": 1,
            "to": "TRASH"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-018",
    "name": "The AmethystSnake Zaum",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
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
      }
    ]
  },
  {
    "cardNumber": "BS17-022",
    "name": "Tarzania Great",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nSummon this Spirit card without paying the cost.\n\n[LV1][LV2][LV3] (When Attacks)\nYou can reveal a card from your decktop. If that card is a Cost 3 or less Spirit card, you can summon it without paying the cost. If you don't summon it, or it's a different card, discard it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
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
            "op": "PASSIVE_RULE",
            "rule": "REVEAL_DECKTOP",
            "text": "You can reveal a card from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_REVEALED",
            "text": "If you don't summon it, or it's a different card, discard it."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-025",
    "name": "Rai-Shuyu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn two opposing Nexuses to the Hand. For each Nexus returned to the Hand via this effect, exhaust an opposing Spirit.\n\n[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts a Spirit they control.\n\n[LV2] (Your End Step)\nRefresh all your \"Great General\" family Spirits.",
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
          },
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
            "filter": {
              "family": "Great General"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-026",
    "name": "Jadobaljar",
    "cardType": "Spirit",
    "effect": "This Spirit card is summoned in exhausted state.\n\n[LV1][LV2][LV3]\nTreat this Spirit as a Spirit with no printed effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
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
            1,
            2,
            3
          ]
        },
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
    "cardNumber": "BS17-027",
    "name": "The EmeraldBird Aldeed",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.",
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
      }
    ]
  },
  {
    "cardNumber": "BS17-031",
    "name": "The FertileGodess Gefion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Green/White (Opposing Turn)\nWhen the opponent uses a Green/White Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2] (Opposing Attack Step)\nAll your Spirits with [Ice Wall] can block while exhausted.",
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
        "keyword": "Ice Wall"
      }
    ]
  },
  {
    "cardNumber": "BS17-032",
    "name": "Viking-Leiv",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nIf this Burst activates on the opposing Main Step, summon this Spirit card. Then, end the opposing Main Step.\n\n[LV2][LV3] (When Battles)\nFor each White Spirit you control, this Spirit gains +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If this Burst activates on the opposing Main Step, summon this Spirit card."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "END_MAIN_STEP",
            "text": "end the opposing Main Step."
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
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-033",
    "name": "Railgunfish",
    "cardType": "Spirit",
    "effect": "[When Braved] [LV2] (Your End Step)\nYou can return one of this Spirit's Braves to your Hand.",
    "isVanilla": false,
    "abilities": [
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-034",
    "name": "Red-Erik",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nAt the start of the step, you can summon a Brave card from your Hand, without paying the cost. However, any (When Summoned) effects of the Brave can't activate.\n\n[When Braved] [LV2][LV3] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, you can return one of the destroyed Spirits to the opposing decktop.",
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
            "text": "any (When Summoned) effects of the Brave can't activate."
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-035",
    "name": "The DiamondBattleship Drednorg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Heavy Armor: Red/Purple]\nThis Spirit is unaffected by opposing Red/Purple Spirit/Brave/Nexus/Magic effects.",
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
        "keyword": "Heavy Armor: Red/Purple"
      }
    ]
  },
  {
    "cardNumber": "BS17-036",
    "name": "King-Harald",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your single-symbol Brave Spirits can't be blocked.\n\n[When Braved] [LV2]\nWhen braved with a Red/White Brave, all your Brave Spirits are unaffected by opposing Spirit effects.\n\n[When Braved] [LV2]\nWhen braved with a Purple/Green/Yellow/Blue Brave, all your Brave Spirits are unaffected by opposing Magic effects.",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
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
            "text": "When braved with a Red/White Brave, all your Brave Spirits are unaffected by opposing Spirit effects."
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
            "text": "When braved with a Purple/Green/Yellow/Blue Brave, all your Brave Spirits are unaffected by opposing Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-037",
    "name": "Capyppa",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nRefresh a Spirit with [Brilliance]/[Evil Light] you control.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-038",
    "name": "Calmion-Cat",
    "cardType": "Spirit",
    "effect": "[LV2][LV3]\nWhen you use a Magic card, after its effect resolves, during this turn, this Spirit gains +2000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-039",
    "name": "Irus-Bird",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Brilliance] (When Attacks)\nAt the end of battle, return all Magic cards you used during this battle to the Hand.\n\n[LV2][LV3] (When Attacks)\nWhen you use a Magic card, after its effect resolves, exhaust an opposing Spirit.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": true
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-042",
    "name": "Amazonis-Girl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Brilliance] (When Attacks)\nAt the end of battle, return all Magic cards you used during this battle to the Hand.\n\n[LV2][LV3] (When Attacks)\nOnce per turn, when you use a Magic card, after that effects resolves, refresh this Spirit.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": true
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-043",
    "name": "The SacredBeast Seg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhile your Spirit with [Brilliance]/[Evil Light] is attacking, by paying the cost of a Magic card with Burst effect in your Hand during Flash Timing, activate the Burst effect of that card, ignoring the Burst condition.",
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
        "keyword": "Brilliance"
      }
    ]
  },
  {
    "cardNumber": "BS17-044",
    "name": "Amazonis-Queen",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nSummon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nWhen summoned via Burst effect, you can summon a Spirit card with [Brilliance] from your Trash, without paying the cost.\n\n[LV2][LV3] (Your End Step)\nRefresh three Spirits you control with [Brilliance]/[Evil Light].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
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
        "overall": "END_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "turn": "YOUR"
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
    "cardNumber": "BS17-045",
    "name": "The TopazQueen Felneit",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Brilliance] (When Attacks)\nAt the end of battle, return all Magic cards you used during this battle to the Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-048",
    "name": "The BearMan Ratesied",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player can put cores from the Void to their Life.\n\n[LV2] (Opposing Attack Step)\nWhile you control three or less Spirits, all your Spirits gain +2000 BP.",
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
            "text": "Neither player can put cores from the Void to their Life."
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
    "cardNumber": "BS17-049",
    "name": "Roc-Aladdin",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV1][LV2] (When Summoned)\nYou can deploy a Nexus card from your Hand, without paying the cost.\n\n[LV2] (Opposing Start Step)\nBy exhausting a Nexus you control, look at the contents of an opposing Burst.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
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
          "type": "EXHAUST_NEXUS",
          "count": 1
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "look at the contents of an opposing Burst."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-051",
    "name": "The PantherMan Alibaba",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks)\nWhen this Spirit's attack would reduce the opposing Life, instead of doing so, you can send cores from the opposing Life to the Reserve as per the different cases below:\n-If there are seven or more cores in the opposing Life, send cores until four remain.\n-If there are five or six cores, send cores until three remain.\n-If there are three or four cores, send cores until two remain.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "-If there are five or six cores, send cores until three remain."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "-If there are three or four cores, send cores until two remain."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-052",
    "name": "The ArabianKnight Sind-Bird",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your \"Great General\" family Spirits are destroyed, by discarding five cards from your decktop, one of the destroyed Spirits remains on your Field, refreshed.\n\n[LV2]\nWhen the opponent sets a Burst, destroy an opposing Cost 6 or less Spirit.",
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
            "op": "DESTROY_BY_COST",
            "maxCost": 6,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-053",
    "name": "The SapphireHydra Shtrodorm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard cards from the opposing decktop equal to this Spirit's LV.",
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
    "cardNumber": "BS17-054",
    "name": "Majin-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nAll your [Roc-Aladdin] are unaffected by opposing Magic effects.\n\n[LV2] (When Destroyed)\nWhile you control any [Roc-Aladdin], this Spirit remains on your Field, exhausted.",
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
            "text": "All your [Roc-Aladdin] are unaffected by opposing Magic effects."
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
    "cardNumber": "BS17-055",
    "name": "Yasakani-Wing",
    "cardType": "Brave",
    "effect": "[Brave Condition: Supreme Hero/ Great General/ Dragon Warrior]\n\n[LV1] (When Summoned)\nDestroy any number of opposing Spirits up to a total of 4000 BP. If you control any [The SwordHero Sieg-Susano-Fried], instead, destroy any number of opposing Spirits up to a total of 7000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Supreme Hero/ Great General/ Dragon Warrior"
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
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-056",
    "name": "Aroundizar",
    "cardType": "Brave",
    "effect": "[Brave Condition: Supreme Hero/ Great General/ Evil Shadow]\n\n[Burst: After your Life is reduced]\nSend two cores from any opposing Spirits to their Reserve. After this effect activates, summon this Brave card.\n\n[When Braved] (When Brave Attacks)\nDestroy an opposing exhausted Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Supreme Hero/ Great General/ Evil Shadow"
      },
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "After this effect activates, summon this Brave card."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
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
    "cardNumber": "BS17-057",
    "name": "Gyokuzeeg",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 0/1/2]\n\n[Burst: After your Spirit is destroyed by the opponent]\nRefresh a Spirit you control. After this effect resolves, summon this Brave card.\n\n[When Braved] (When Brave Attacks)\nWhile this Spirit has two cores on it, the opponent can't activate Bursts.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 0/1/2"
      },
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
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
            "text": "While this Spirit has two cores on it, the opponent can't activate Bursts."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-058",
    "name": "Osebering",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost of 5 or more]\n\n[Burst: After your Spirit is destroyed by the Opponent]\nDuring this turn, all your Spirits are unaffected by opposing Spirit effects. After this effect resolves, summon this Brave card.\n\n[When Braved] (Opposing Attack Step)\nWhen an opposing Spirit attacks, exhaust an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost of 5 or more"
      },
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "IMMUNITY",
            "text": "During this turn, all your Spirits are unaffected by opposing Spirit effects."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "summon this Brave card."
          }
        ]
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
    "cardNumber": "BS17-059",
    "name": "Horus-Jeter",
    "cardType": "Brave",
    "effect": "[Brave Condition: Supreme Hero/ Great General/ Dark Artes]\n\n[LV1] (When Summoned)\nDuring this turn, treat all opposing Spirits as LV1.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Supreme Hero/ Great General/ Dark Artes"
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
            "rule": "TREAT_RULE",
            "text": "During this turn, treat all opposing Spirits as LV1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-060",
    "name": "Jinn-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Supreme Hero/ Great General/ Creator]\n\n[LV1] (When Summoned)\nDuring this turn, when the opponent uses a Magic card, unless they discard a card from their Hand with a cost equal or higher than the Magic card's, they can't activate its effect.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Supreme Hero/ Great General/ Creator"
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
            "text": "During this turn, when the opponent uses a Magic card, unless they discard a card from their Hand with a cost equal or higher than the Magic card's, they can't activate its effect."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-061",
    "name": "The Divine Flame Takamagahara",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen your \"Supreme Hero\" family Spirit attacks first in the turn, you can target and attack an opposing Spirit.\n\n[LV2]\nWhen your Red \"Supreme Hero\" family Spirit is destroyed by the opponent, by sending a core from your Life to the Void, that Spirit remains on your Field, refreshed.",
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
            "rule": "TARGET_ATTACK",
            "text": "When your \"Supreme Hero\" family Spirit attacks first in the turn, you can target and attack an opposing Spirit."
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
            "text": "When your Red \"Supreme Hero\" family Spirit is destroyed by the opponent, by sending a core from your Life to the Void, that Spirit remains on your Field, refreshed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-062",
    "name": "The Wandering Sky Temple",
    "cardType": "Nexus",
    "effect": "[LV1] (Your Main Step)\nWhen you're summoning an originally Cost 8 or more Spirit card, by exhausting this Nexus, treat up to two costs as being paid from your Reserve. This effect can only be used once per turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1
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
      }
    ]
  },
  {
    "cardNumber": "BS17-063",
    "name": "The Evil Grail",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nOnly up to one core per turn can be put from the opposing Void/Trash to their Life/Field/Reserve via opposing Spirit/Brave/Nexus effects.\n\n[LV2]\nWhen your \"DarkKnight\"-named Spirits are destroyed by opposing Spirit/Magic effects, the opponent destroys a Spirit they control.",
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
            "text": "Only up to one core per turn can be put from the opposing Void/Trash to their Life/Field/Reserve via opposing Spirit/Brave/Nexus effects."
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
            "text": "When your \"DarkKnight\"-named Spirits are destroyed by opposing Spirit/Magic effects, the opponent destroys a Spirit they control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-064",
    "name": "The Lake of the Dead",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (After Your Burst Activates)\nDestroy a Brave on an opposing Brave Spirit.\n\n[LV2] (Either Attack Step)\nWhen your Cost 3 Spirits are exhausted, draw a card.",
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
    "cardNumber": "BS17-065",
    "name": "The Beast Paradise",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your LV1 Spirits get +2000 BP.\n\n[LV2] (Your End Step)\nRefresh all your Spirits.",
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
    "cardNumber": "BS17-066",
    "name": "The Fruit of Saint Tree",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Life is reduced by opposing Spirits, put a core from the Void to your Reserve.\n\n[LV2] (Opposing Main Step)\nWhen the opponent uses Magic cards for two times or more, after the effect resolves, end the opposing Main step.",
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
            "op": "PASSIVE_RULE",
            "rule": "TRIGGERED_WATCHER",
            "text": "When the opponent uses Magic cards for two times or more"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "END_MAIN_STEP",
            "text": "end the opposing Main step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-067",
    "name": "The Freezing Fjord",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen you're summoning a Brave card, this Nexus' symbol becomes two White symbols.\n\n[LV2] (Opposing Attack Step)\nGive all your Brave Spirits: \"[Heavy Armor: Red/Blue] This Spirit is unaffected by opposing Red/Blue Spirit/Brave/Nexus/Magic effects.\"",
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
            "rule": "SET_SYMBOL",
            "text": "When you're summoning a Brave card, this Nexus' symbol becomes two White symbols."
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
        "keyword": "Heavy Armor: Red/Blue"
      }
    ]
  },
  {
    "cardNumber": "BS17-072",
    "name": "The Lamp of Wish",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAt the start of the step, if you control two or less Spirits, the opponent must exhaust their refreshed Spirits until only three are refreshed.\n\n[LV2]\nAll your [Roc-Aladdin] are unaffected by opposing Spirit/Brave effects.",
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
            "rule": "IMMUNITY",
            "text": "All your [Roc-Aladdin] are unaffected by opposing Spirit/Brave effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-073",
    "name": "Ardor Flame",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy an opposing 4000 BP or less Spirit. The Spirit destroyed by this effect can't activate any (When Destroyed) effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS17-074",
    "name": "Burst Sword",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nTarget an opposing Nexus. Destroy all opposing Nexuses with the same name as the targeted Nexus. Then by paying the cost, activate this card's flash effect.\n\n[Flash]\nTarget an opposing Spirit with the same card name as at least one other Spirit on their Field. Destroy all opposing Spirits with the same name as that Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
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
            "op": "PASSIVE_RULE",
            "rule": "TARGET",
            "text": "Target an opposing Spirit with the same card name as at least one other Spirit on their Field."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy all opposing Spirits with the same name as that Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-075",
    "name": "Strangle Fog",
    "cardType": "Magic",
    "effect": "[Flash]\nSend a core from any opposing Spirit to their Reserve. If the opponent has three or more cores in total than you on their Life/Field/Reserve/Trash, also, send three cores from any opposing Spirits to the Void.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
    "cardNumber": "BS17-076",
    "name": "Round Table Knights",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nSummon a Cost 5 or less Spirit card from your Trash. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nFor each \"DarkKnight\"-named Spirit card you control, send a core from any opposing Spirit to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
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
    "cardNumber": "BS17-077",
    "name": "Wild Wing",
    "cardType": "Magic",
    "effect": "[Flash]\nIf the number of your Spirits is equal or superior to that of the opponent's, during this turn, all your Spirits get +3000 BP.",
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
    "cardNumber": "BS17-078",
    "name": "War Cry",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nExhaust all LV1 Spirits. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nExhaust all LV2 Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
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
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ACTIVATE_FLASH",
            "text": "Then by paying the cost, activate this card's Flash effect."
          }
        ]
      },
      {
        "overall": "FLASH",
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
    "cardNumber": "BS17-079",
    "name": "Freezing Parry",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this battle, when your blocking Spirit is destroyed, that Spirit remains on your Field, exhausted.",
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
    "cardNumber": "BS17-080",
    "name": "Kveldúlfr",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nReturn a Brave card from your Trash to your Hand. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nSummon a Red/Green/White Brave card from your Hand, without paying the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "SALVAGE_TRASH",
            "count": 1,
            "filter": {
              "type": "Brave"
            }
          }
        ]
      },
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
    "cardNumber": "BS17-081",
    "name": "Nefer Uarbe",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nTarget a LV. During this turn, opposing Spirits of the targeted LV lose all effects, and can't gain new ones. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, target Spirit gets +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CHOOSE_LEVEL",
            "text": "Target a LV."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "LOSE_EFFECTS",
            "text": "During this turn, opposing Spirits of the targeted LV lose all effects, and can't gain new ones."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ACTIVATE_FLASH",
            "text": "by paying the cost, activate this card's Flash effect."
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
    "cardNumber": "BS17-082",
    "name": "Reversible Spark",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this battle, when BP is compared, switch the BP of your battling Spirit with that of the opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SWITCH_BP",
            "text": "During this battle, when BP is compared, switch the BP of your battling Spirit with that of the opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-083",
    "name": "Abrakadabra",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDuring this turn, the opponent can't use any Magic cards of the same color as the Spirit/Brave who activated its (When Summoned) effect. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nExhaust all Spirits with a (When Summoned) effect.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "During this turn, the opponent can't use any Magic cards of the same color as the Spirit/Brave who activated its (When Summoned) effect."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ACTIVATE_FLASH",
            "text": "Then by paying the cost, activate this card's Flash effect."
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-084",
    "name": "Triangle Ban",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a Cost. During this turn, the opponent can't activate Burst effects with the targeted Cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "Target a Cost."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "During this turn, the opponent can't activate Burst effects with the targeted Cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-X01",
    "name": "The SwordHero Sieg-Susano-Fried",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is at three or less, for each Red Spirit you control, destroy an opposing 6000 BP or less Spirit. After this effect resolves, summon this Spirit card.\n\n[LV2][LV3][LV4] (When Attacks)\nThis Spirit gains +10000 BP.\n\n[LV3][LV4]\nWhile you have a Burst set, this Spirit gains an extra Red Symbol.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
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
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2,
            3,
            4
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 10000
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            3,
            4
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
    "cardNumber": "BS17-X02",
    "name": "The KnightHero Swordius-Arthur",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nWhen your Life is at three or less, summon this Spirit card.\n\n[LV2][LV3] (When Attacks)\nYou can summon a Spirit card with [Immortality] from your Trash, without paying the cost.\n\n[When Braved] [LV3] (When Brave Attacks)\nSend a core from any opposing Spirit to the Void.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When your Life is at three or less, summon this Spirit card."
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
            "op": "REANIMATE_TRASH",
            "count": 1
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-X03",
    "name": "The FangEmperor Byakgalord-Sonken",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nGive all your Spirits with [Windstorm]: \"(When Attacks) The opponent can't activate their Bursts.\"\n\n[LV2] (When Attacks)\nWhen this Spirit is blocked, exhaust two opposing Spirits.",
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
            "text": "Give all your Spirits with [Windstorm]: \"(When Attacks) The opponent can't activate their Bursts.\""
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
            "op": "EXHAUST_SPIRITS",
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS17-X04",
    "name": "The WolfMachineDeity Ragna-Fenrir",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nAll opposing Spirits can't refresh in the next (Opposing Refresh Step).\n\n[When Braved] [LV1][LV2]\nThis Spirit can brave with an extra symbolless Brave.\n\n[When Braved] [LV2] (When Brave Attacks)\nFor each Brave on this Spirit, return an opposing Spirit/Nexus to the Hand.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "This Spirit can brave with an extra symbolless Brave."
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
    "cardNumber": "BS17-X05",
    "name": "The BeautyHero Cleopatras",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is at three or less, summon this card without paying the cost.\n\n[LV1][LV2][LV3] (When Summoned)\nReturn a Magic card from your Trash to the Hand.\n\n[LV2][LV3] [Evil Light] (When Attacks)\nWhen you use a Magic card, after that effect resolves, you can activate the same effect once again. At the end of battle, return all Magic cards that you used in this battle from your Trash to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
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
            "op": "PASSIVE_RULE",
            "rule": "TRIGGERED_WATCHER",
            "text": "When you use a Magic card"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ACTIVATE_CARD_EFFECT",
            "text": "you can activate the same effect once again."
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
    "cardNumber": "BS17-X06",
    "name": "The ArabianNightEmpress Sahrzad",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon a \"Great General\" family Spirit card from your Hand, without paying the cost.\n\n[LV2][LV3] (Your Attack Step)\nWhen your \"Great General\"/\"Supreme Hero\" family Spirits would reduce the opposing Life, instead of doing so, you can send cores from the opposing Life to the Reserve as per the different cases below:\n-If there are seven or more cores in the opposing Life, send cores until four remain.\n-If there are five or six cores, send cores until three remain.\n-If there are three or four cores, send cores until two remain.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "-If there are five or six cores, send cores until three remain."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "-If there are three or four cores, send cores until two remain."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "FENCER-DRAGON2",
    "name": "Fencer-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] This Spirit can't block.\n\n[LV1][LV2] (When Attacks) While you have a Burst set, this Spirit gets +2000 BP.",
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
            "text": "This Spirit can't block."
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
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "LITTLE-BIKKEN2",
    "name": "Little-Bikken",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Only up to three cards can be discarded from either player's deck per turn.\n\n[LV2] Heavy Armor: White/Blue - This Spirit is unaffected by opposing White/Blue Spirit/Brave/Nexus/Magic effects.",
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
            "rule": "RESTRICTION",
            "text": "Only up to three cards can be discarded from either player's deck per turn."
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
            "text": "Heavy Armor: White/Blue - This Spirit is unaffected by opposing White/Blue Spirit/Brave/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SHAMAN-RIO",
    "name": "The Shaman Rio",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "STREAM-CARIBOU2",
    "name": "Stream-Caribou",
    "cardType": "Spirit",
    "effect": "[LV2] (When Blocks) This Spirit gets +4000 BP.",
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-ANGELIA",
    "name": "The Angelia Grayel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your End Step) For each Spirit you control with Brilliance/Evil Light, you can reveal a card from your decktop. Add a Magic card among them to your Hand. Discard the remaining cards.\n\n[LV3] Brilliance (When Attacks) At the end of battle, return all Magic cards you used during this battle to your Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "END_STEP",
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
            "op": "REVEAL_DECKTOP_ADD",
            "count": 1,
            "filter": {}
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
            "rule": "CONTINUOUS_RULE",
            "text": "[LV3] Brilliance (When Attacks) At the end of battle, return all Magic cards you used during this battle to your Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-DARKKNIGHT",
    "name": "The DarkKnight Palomides",
    "cardType": "Spirit",
    "effect": "Immortality: Cost 3 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 3 Spirit is destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "Immortality: Cost 3 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 3 Spirit is destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-OPENED",
    "name": "The Opened Rock Door",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step) Cost 0/3/6 Spirits can't block.\n\n[LV2] (Either Attack Step) When only the opposing Spirits are destroyed by comparing BP with your \"Great General\" family Spirit, put a core from the Void to this Nexus.",
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
            "text": "[LV1][LV2] (Either Attack Step) Cost 0/3/6 Spirits can't block."
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
            "text": "[LV2] (Either Attack Step) When only the opposing Spirits are destroyed by comparing BP with your \"Great General\" family Spirit, put a core from the Void to this Nexus."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-RANGE",
    "name": "The Range of Royal Crypts",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] Flash- (Your Attack Step) By discarding a Magic card from your Hand, during this turn, a Spirit you control gets +3000 BP.\n\n[LV2] (Either Attack Step) When your Spirits with Brilliance/Evil Light are destroyed by the opponent, by exhausting this Nexus, one of the destroyed Spirits remain on your field, exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
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
            "amount": 3000,
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
          "type": "EXHAUST_SELF"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "[LV2] (Either Attack Step) When your Spirits with Brilliance/Evil Light are destroyed by the opponent, by exhausting this Nexus, one of the destroyed Spirits remain on your field, exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-UNEXPLORED",
    "name": "The Unexplored City in Jungle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] When a card with Burst effect is discarded from your deck due to the opponent, add that card to your Hand. Also, during this turn, cards cannot be discarded from your deck.\n\n[LV2] (Your Attack Step) When you use a Magic card, after the effect resolves, draw 1 card from your deck. This effect can only be used once per turn.",
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
            "text": "[LV1][LV2] When a card with Burst effect is discarded from your deck due to the opponent, add that card to your Hand. Also, during this turn, cards cannot be discarded from your deck."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR",
          "oncePerTurn": "opt_1"
        },
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  }
];

for (const spec of BS17_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
