/**
 * engine/cards/sets/bs14_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS14_SAGA_CARDS)
 * Total Cards: 109 (95 Effect, 14 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS14_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10799",
    "name": "The HeroEmperor Lord-Dragon-Dominion",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nBy setting a card with Burst effect from your Hand, draw a card.\n\n[LV3] (Your Attack Step)\nWhile you have a Burst set, this Spirit gains +3000 BP.",
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
            "op": "DRAW_CARDS",
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
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1106",
    "name": "The SmokeWolf Noroshi",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13017",
    "name": "The Thousand Knowledge Canyon",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step) All your \"Supreme Hero\"/ \"Ancient Dragon\" family Spirit cards in your Hand gain 1 extra [Red Core] reduction.\n\n[LV2] (Your Draw Step) Increase the number of cards you draw by +1.",
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
            "text": "All your \"Supreme Hero\"/ \"Ancient Dragon\" family Spirit cards in your Hand gain 1 extra [Red Core] reduction."
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
    "cardNumber": "BATTLE-SPIRITS-A13024",
    "name": "The SwallowtailFairy Nami",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1589",
    "name": "The Shooter Vali",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3369",
    "name": "Chacopecca",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3524",
    "name": "Cuelebrei",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3683",
    "name": "Deepfisher",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) If you have a set burst, you can deploy a Blue Nexus card from your Trash, without paying the cost.",
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3801",
    "name": "Diyadokari",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] This brave cannot attack when it is in spirit condition.\n\n[When Braved] (When Blocks) This Spirit gets +5000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
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
            "rule": "SET_RESTRICTION",
            "text": "This brave cannot attack when it is in spirit condition."
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
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4013",
    "name": "Dream Spiral",
    "cardType": "Magic",
    "effect": "Flash- During this turn, when your Spirits are destroyed, for each Spirit destroyed, return an opposing Spirit to the decktop.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A4849",
    "name": "Gurangatch",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks) Destroy an opposing Cost 3 or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A6181",
    "name": "Labolas",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6300",
    "name": "Lesser-Dragsaurus",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) While you have a set Burst, destroy one opposing Nexus.",
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
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6347",
    "name": "Last Stand",
    "cardType": "Magic",
    "effect": "☼<nowiki>[ </nowiki>Burst: After your Spirit is destroyed by the opponent<nowiki>]</nowiki>\nPut a core from the void to your Reserve. Then, by paying the cost, activate this card's flash effect.\n\nFlash - Target a Green Spirit you control. During this turn, that Spirit can block all opposing Spirits even when exhausted.",
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
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Target a Green Spirit you control."
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
    "cardNumber": "BATTLE-SPIRITS-A6423",
    "name": "Martiusagi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) You can summon a Cost 2 or less Spirit card from your hand, without paying the cost. However, it cannot activate any (When Summoned) effect.",
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
            "rule": "ACTIVATE_EFFECT_ACTION",
            "text": "it cannot activate any (When Summoned) effect."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6614",
    "name": "Monshiroran",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6679",
    "name": "Mushamega",
    "cardType": "Spirit",
    "effect": "High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step. In that case, the cost of this spirit and the cores to be put on this spirit must be paid or moved from your reserve.\n\n[LV1][LV2] (When Summoned) During this turn, all your Spirits get +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "In that case, the cost of this spirit and the cores to be put on this spirit must be paid or moved from your reserve."
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
            "op": "BP_BUFF_ALLIES",
            "amount": 1000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6688",
    "name": "Nasuno-Archer",
    "cardType": "Spirit",
    "effect": "☼<nowiki>[ </nowiki>Burst: After Your Life is Decreased<nowiki> ]</nowiki>\nWhen you have four or more Purple cards in your Trash, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Destroyed) Destroy an opposing exhausted Spirit.\n\n[LV3] (When Destroyed) Return this Spirit to your Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "☼<nowiki>[ </nowiki>Burst: After Your Life is Decreased<nowiki> ]</nowiki>"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When you have four or more Purple cards in your Trash, summon this Spirit card."
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7134",
    "name": "Pentaceratop",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7407",
    "name": "Repairing-Ceros",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) Discard a card from the opposing decktop. While you have a burst set, also, put 1 core from the void to this Spirit.",
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
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7421",
    "name": "Revelation Aura",
    "cardType": "Magic",
    "effect": "Flash- During this turn, all your attacking Spirits gain +2000 BP. Also, while you have a set Burst, all your attacking Spirits gain +2000 BP.",
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
    "cardNumber": "BATTLE-SPIRITS-A7549",
    "name": "Ruriruri",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Exhaust all Cost 3 or less Spirits.",
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
    "cardNumber": "BATTLE-SPIRITS-A7586",
    "name": "Ryzard",
    "cardType": "Spirit",
    "effect": "[LV2](When Attacks) This Spirit gets +1000 BP for each Red Spirit you control.",
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
    "cardNumber": "BATTLE-SPIRITS-A7636",
    "name": "Scartooth",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step) While there are only Red cards in your Trash, this Spirit gains +3000 BP.",
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
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8169",
    "name": "Taranty",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or above]\n\n[When Braved] (When Brave Attacks) When only the opposing Spirit is destroyed by comparing BP, put a core from the void to this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or above"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A8712",
    "name": "The BattledogBeast Siderope",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9762",
    "name": "The Exploding Submarine Volcano",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing End Step) When you have five or more cards in your Hand, discard cards from your Hand until you have four cards in your Hand. When the opponent has five or more cards in their Hand, the opponent discard cards from their hand until there are four cards in their Hand.\n\n[LV2] (Opposing Turn) Treat all the opposing Magic cards in Hand as having no reduction symbols.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "END_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When you have five or more cards in your Hand, discard cards from your Hand until you have four cards in your Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When the opponent has five or more cards in their Hand, the opponent discard cards from their hand until there are four cards in their Hand."
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
            "text": "Treat all the opposing Magic cards in Hand as having no reduction symbols."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BOTH-HANDS",
    "name": "Both-Hands",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed) Draw 2 cards from your deck.",
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
            "op": "DRAW_CARDS",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-005",
    "name": "Hinoshishi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReturn a Cost 4 or less Spirit card, or a Spirit card with Burst effect from your Trash to the Hand.",
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
      }
    ]
  },
  {
    "cardNumber": "BS14-007",
    "name": "Kagutsuchidragoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nDraw a card.\n\n[LV2] [Clash] (When Attacks)\nOpposing Spirits must block if possible.",
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
    "cardNumber": "BS14-010",
    "name": "The FangBeastEmperor Kintarogue-Bear",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDestroy two opposing 4000 BP or less Spirits. Then, draw a card.\n\n[LV1]LV2][LV3] (When Summoned)\nDestroy two opposing 4000 BP or less Spirits.\n\n[LV2][LV3] (Your Attack Step)\nWhen your \"Emperor Beast\" family Spirit attacks, destroy an opposing Spirit with BP equal or inferior to that Spirit's.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW_CARDS",
            "count": 1
          },
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 2,
            "allMatching": false
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
            "maxBp": 4000,
            "count": 2,
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "When your \"Emperor Beast\" family Spirit attacks, destroy an opposing Spirit with BP equal or inferior to that Spirit's."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-011",
    "name": "The FlameDragonDevil Ma-Gwo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nAt the start of the step, you can send as many cores as you like from your Trash to this Spirit.\n\n[LV1][LV2][LV3] (Your Attack Step)\nAll your \"Dragon\"/ \"Ancient Dragon\" family Spirits gain +3000 BP.\n\n[LV2][LV3]\nAll your \"Ancient Dragon\" family Spirits gain an extra Red symbol.",
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
            "rule": "MOVE_CORE",
            "text": "At the start of the step, you can send as many cores as you like from your Trash to this Spirit."
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
          "family": "Ancient Dragon"
        },
        "amount": 3000
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-016",
    "name": "Shikitsuru",
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
    "cardNumber": "BS14-019",
    "name": "Shuten-Doga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can summon a Cost 3 or less \"Evil Shadow\" family Spirit card from your Trash, without paying the cost.\n\n[LV1][LV2]\nYour Burst effects send +1 core from opposing Spirits to their Reserve/Trash.\n\n[LV2]\nWhile you have a set burst, for each \"Evil Shadow\" family Spirit you control, this Spirit gains +2000 BP.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2
          ],
          "requireFamilyOnField": {
            "family": "Evil Shadow",
            "min": 1
          }
        },
        "targetFilter": {
          "family": "Evil Shadow"
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS14-021",
    "name": "The VioletPhoenix Fognix",
    "cardType": "Spirit",
    "effect": "Immortality: Cost 4/5 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed.\n\n[LV1][LV2][LV3] (When Summoned) Draw from your deck the same amount of cards as this Spirit's level.",
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
    "cardNumber": "BS14-022",
    "name": "The TwinPhantomDragon Sheyron",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Send cores from all opposing Spirits to the Reserve until only 1 core is left on each of them.\n\n[LV2] (After Your Burst Activates) Send cores from two opposing Spirits to the Reserve until only 1 core is left on each of them.",
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
    "cardNumber": "BS14-026",
    "name": "Tamamush",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a number of cores from the Void to this Spirit equal to the level of this Spirit.",
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
            "text": "Put a number of cores from the Void to this Spirit equal to the level of this Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-029",
    "name": "Musha-Geo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS14-030",
    "name": "Grant-Benkei",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nThe opponent discards a card from their Hand. Then, return this card to the Hand.\n\n[LV1][LV2] (When Summoned)\nThe opponent discards a card from their Hand.\n\n[LV2] (Either Attack Step)\nWhen your \"Shell Insect\" family Spirit battles against an opposing 7000 BP or less Spirit, refresh that Spirit of yours.",
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
    "cardNumber": "BS14-031",
    "name": "Musha-Apewhip",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nIf you have a Burst set, put two cores from the Void to your Reserve.\n\n[LV2] (Your Attack Step)\nWhile you have a Burst set, for each core in your Reserve, this Spirit gains +1000 BP.",
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
            "count": 2
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
    "cardNumber": "BS14-032",
    "name": "Yatsunokanzo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts two Spirits they control.\n\n[LV2] (Your Attack Step)\nGive all your Spirits with [Windstorm]: \"(When Attacks) When this Spirit is destroyed, return to the Hand every opposing Spirit exhausted by this Spirit's [Windstorm].\"",
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-033",
    "name": "The GreatTreeGuardian Blanboar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles)\nWhen the battling opposing Spirit is destroyed, refresh this Spirit.\n\n[LV3] (When Attacks)\nWhen the battling opposing Spirit is destroyed, send a core from the opposing Life to the Reserve.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
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
    "cardNumber": "BS14-036",
    "name": "Icemaiden Mk-II",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS14-037",
    "name": "Ezono-Owl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nWhen an opposing Spirit attacks, refresh this Spirit.\n\n[LV1][LV2][LV3] (When Blocks)\nIf you have a set Burst, put a core from the Void to this Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "BS14-039",
    "name": "Mibrock-Soldier",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn an opposing Spirit to the Hand.\n\n[LV2] (Either Attack Step)\nWhile you have a set burst, all your \"Mibrock\"-named Spirits gain +2000 BP.",
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
    "cardNumber": "BS14-040",
    "name": "The BraveArtifact Ryudroid",
    "cardType": "Spirit",
    "effect": "When this Spirit card is discarded from your Hand due to the opponent, you can summon it without paying the cost.\n\n[LV1][LV2] (Opposing Attack Step)\nWhen the attack of an opposing Spirit with BP equal or inferior to this Spirit's isn't blocked, your Life won't be reduced by that Spirit's attack.\n\n[LV2] Purple/Yellow (Opposing Turn)\nWhen the opponent uses a Purple/Yellow Magic effect, by exhausting this Spirit, negate that effect.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When this Spirit card is discarded from your Hand due to the opponent, you can summon it without paying the cost."
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 0,
            "preventAllLifeLoss": true
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-041",
    "name": "Buster-Fenrircannon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks)\nFor each White Spirit you control, this Spirit gains +2000 BP.\n\n[LV2][LV3] (Your Attack Step)\nWhile you have a Burst set, the (When Blocks) effects of all your \"Machine Beast\" family Spirits also activate as (When Attacks).",
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
            "amount": 2000
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
          "turn": "YOUR",
          "requireFamilyOnField": {
            "family": "Machine Beast",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "GRANT_FAMILY",
            "text": "While you have a Burst set, the (When Blocks) effects of all your \"Machine Beast\" family Spirits also activate as (When Attacks)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-042",
    "name": "The IronArtifact Modi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Heavy Armor: Green/Blue]\nThis Spirit is unaffected by opposing Green/Blue Spirit/Brave/Nexus/Magic effects.\n\n[LV2] (When Blocks)\nWhen this Spirit is the destroyed via BP comparison by opposing Spirits with the same color as stated in this Spirit's [Heavy Armor], this Spirit remains on the Field, refreshed.",
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
        "keyword": "Heavy Armor: Green/Blue"
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
    "cardNumber": "BS14-043",
    "name": "The MoonLightPrincess Mani",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Red/Green/White/Blue (Opposing Turn)\nWhen the opponent uses a Red/Green/White/Blue Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2] (Opposing Attack Step)\nAt the beginning of the step, by exhausting this Spirit, target an opposing Spirit. During this turn, that Spirit can't activate its (When Attacks) and (When Brave Attacks) effects.",
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
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subCost": {
          "type": "EXHAUST_SELF"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET",
            "text": "At the beginning of the step, by exhausting this Spirit, target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "During this turn, that Spirit can't activate its (When Attacks) and (When Brave Attacks) effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-044",
    "name": "The GlacialDragon Glaceus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhile you have a set burst, this Spirit is unaffected by opposing Spirit effects.\n\n[LV2] (When Attacks)\nThis Spirit can't be blocked by non-Cost 8 Spirits.",
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
            "text": "While you have a set burst, this Spirit is unaffected by opposing Spirit effects."
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
    "cardNumber": "BS14-045",
    "name": "Goristal",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles)\nWhen only the opposing Spirit is destroyed via BP comparison, destroy this Spirit.\n\n[LV3] (When Destroyed)\nDraw a card.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "When only the opposing Spirit is destroyed via BP comparison, destroy this Spirit."
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-046",
    "name": "Pam",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS14-049",
    "name": "The Butler Pentan",
    "cardType": "Spirit",
    "effect": "When this Spirit card is discarded by an opposing \"deck discarding effect\", during this turn, cards can't be discarded from your deck, and you can summon this Spirit card, without paying the cost.\n\n[LV1][LV2] (Either Attack Step)\nWhen your \"Pentan\"-named Spirits are destroyed, draw a card.",
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
    "cardNumber": "BS14-050",
    "name": "Yaley",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS14-051",
    "name": "Arcanabeastqueen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can reveal four cards from your decktop. Return them to your decktop in any order.\n\n[LV2][LV3] Flash - (Either Attack Step)\nBy exhausting a \"Magician\" family Spirit you control, during this turn, treat an opposing Spirit as being LV1.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "You can reveal four cards from your decktop."
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      },
      {
        "overall": "FLASH",
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "during this turn, treat an opposing Spirit as being LV1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-052",
    "name": "Tamamonoin",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Holy Life (When Attacks) When the opposing life is decreased by this Spirit's Attack, put one core from the Void to your Life.\n\n[LV2][LV3] (Your Attack Step) All your Spirits with Holy Life cannot be blocked by opposing Lv1 Spirits.",
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
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
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
    "cardNumber": "BS14-053",
    "name": "The Angelia of Olimpics Hagith",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can reveal one of your Bursts. If that card is a Magic card, return it to your Hand. If not, discard it.\n\n[LV2] (Opposing Attack Step)\nOpposing Cost 2/4/6/8 Spirits can't attack.",
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
            "rule": "KEYWORD_RULE",
            "text": "You can reveal one of your Bursts."
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "If not, discard it."
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
            "text": "Opposing Cost 2/4/6/8 Spirits can't attack."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-054",
    "name": "The GreatAngelia Angu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.\n\n[LV2][LV3] (Your End Step)\nRefresh a Spirit with [Holy Life] you control.\n\n[LV3]\nGive all your \"Divine Spirit\" family Spirits: [Holy Life].",
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
          },
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
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
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-055",
    "name": "Mystic-Himiko",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf there are three or more Magic cards in your Trash, summon this Spirit card.\n\n[LV2][LV3] (Your Attack Step)\nAll your \"Dark Artes\" family Spirits can't be blocked by opposing Spirits without the \"Supreme Hero\" family.\n\n[LV3] (When Battles)\nYou can use one Yellow Magic during the Flash Timing, without paying the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If there are three or more Magic cards in your Trash, summon this Spirit card."
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
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
            "op": "PASSIVE_RULE",
            "rule": "CAST_MAGIC_FREE",
            "text": "You can use one Yellow Magic during the Flash Timing, without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-060",
    "name": "Tindalo-Hound",
    "cardType": "Spirit",
    "effect": "When your Nexus is deployed, you can summon this Spirit card from the Hand, without paying the cost.\n\n[LV2] (Your Attack Step)\nWhen only the opposing Cost 3 or less Spirit is destroyed by comparing BP with your Spirit, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When your Nexus is deployed, you can summon this Spirit card from the Hand, without paying the cost."
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
    "cardNumber": "BS14-061",
    "name": "Yagyurd-Jubei",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nIf a Blue Spirit is destroyed when this Burst activates, summon this Spirit card.\n\n[LV2] (Your Attack Step)\nAll your \"Supreme Hero\" family Spirits are treated as being on their highest levels.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If a Blue Spirit is destroyed when this Burst activates, summon this Spirit card."
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
            "text": "All your \"Supreme Hero\" family Spirits are treated as being on their highest levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-062",
    "name": "Rock-Golem-Custom",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to the level of this Spirit.\n\n[LV1][LV2][LV3] (Your Attack Step)\nWhile you have a Burst set, every Spirit with [Crush]/[Great Crush] you control gets + 2000 BP.",
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
    "cardNumber": "BS14-064",
    "name": "Revoluting-Zeyon",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nYou can deploy Red/Purple/Green/Blue Nexus cards, one of each, from your Trash. Then, if you control three or more Nexuses, summon this Spirit card.\n\n[LV2] (Either Attack Step)\nWhen your Spirits are destroyed by the opponent, by exhausting a Nexus you control, one of your destroyed Spirits remains on the Field, exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "if you control three or more Nexuses, summon this Spirit card."
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-065",
    "name": "Kurofune-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's LV.\n\n[LV2][LV3] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your Spirit with [Crush], discard cards from the opposing decktop equal to the cost of the destroyed opposing Spirit.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-066",
    "name": "The FistMaster Tiga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Assault: 2] (When Attacks)\nThis Spirit can, twice per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nThis Spirit's [Assault] also activates at (When Blocks).",
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 2
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
            "rule": "CONTINUOUS_RULE",
            "text": "This Spirit's [Assault] also activates at (When Blocks)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-067",
    "name": "Lagian",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] Flash - [Awaken]\nYou can put any number of cores from Spirits you control to this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS14-071",
    "name": "Trumpn",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved]\nWhen destroyed by an opposing Spirit effect, this Spirit remains on the Field, exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "WHEN_DESTROYED",
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
    "cardNumber": "BS14-075",
    "name": "The Fortified City of Flame Dragon",
    "cardType": "Nexus",
    "effect": "[LV1] (Your Attack Step)\nWhen opposing Spirits are destroyed, draw a card for each Spirit destroyed.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-077",
    "name": "The Leaning Tower of Corpse",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Main Step)\nExhaust any opposing Spirit that has core placed on them except via Spirit/Brave/Nexus/Magic effects.\n\n[LV2] (Either Attack Step)\nWhen an opposing Spirit is exhausted, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-080",
    "name": "The Ancient Forest",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nFor each opposing Spirit, all your Green Spirits gain +1000 BP.\n\n[LV2] (Your End Step)\nRefresh all your Green Spirits.",
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
          "color": "Green"
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
    "cardNumber": "BS14-081",
    "name": "The Stumpcity of God Tree",
    "cardType": "Nexus",
    "effect": "[LV1] (Your End Step)\nYou can reveal a card from your decktop. If that card is a Green Spirit card, you can summon it. If you're not summoning it, or it's some other card, return it to the decktop.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "END_STEP",
        "subConditions": {
          "levels": [
            1
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-082",
    "name": "The Pentagon Stronghold",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nYour Hand is unaffected by opposing Spirit/Brave/Nexus/Magic effects.\n\n[LV2] (Opposing Turn)\nWhen the opponent draws outside of Draw Step, you can draw a card.",
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
            "text": "Your Hand is unaffected by opposing Spirit/Brave/Nexus/Magic effects."
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
    "cardNumber": "BS14-083",
    "name": "The Freezing WaterFalls",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nAt the end of the battle of a 3000 BP or less Spirit, end the Attack Step.\n\n[LV2] (Your Start Step)\nReturn an opposing Nexus to their Hand.",
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
            "op": "END_ATTACK_STEP",
            "timing": "END_OF_BATTLE"
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
    "cardNumber": "BS14-084",
    "name": "The Permafrost Capital",
    "cardType": "Nexus",
    "effect": "This Nexus card in the Trash is unaffected by any effects.\n\n[LV1]\nWhen your Life would be brought to zero, by sending this Nexus to the Trash, your Life won't become zero. Then, put a core from the Void to your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "IMMUNITY",
            "text": "This Nexus card in the Trash is unaffected by any effects."
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-085",
    "name": "The Admiring Pipe Organ",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nCards from either players' deck can't be discarded during the Main Step.\n\n[LV2] (Opposing Turn)\nDestroy all Red/Green/White/Blue Spirits refreshed by a Spirit/Magic effect.",
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
            "text": "Cards from either players' deck can't be discarded during the Main Step."
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
            "text": "Destroy all Red/Green/White/Blue Spirits refreshed by a Spirit/Magic effect."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-086",
    "name": "The Destiny Roulette",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Life is reduced, you can reveal a card from your decktop. If it's a Yellow Magic card, refresh a Spirit you control. Add the revealed card to the Hand.\n\n[LV2] (Your End Step)\nYou can reveal three cards from your decktop. Return the reveled cards to your decktop.",
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
            "scope": "TARGET",
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
            "op": "PASSIVE_RULE",
            "rule": "REVEAL_DECKTOP",
            "text": "You can reveal three cards from your decktop."
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
    "cardNumber": "BS14-087",
    "name": "The Empire of Pentan:the Capital Empereur",
    "cardType": "Nexus",
    "effect": "[LV1] Flash - (Either Attack Step)\nBy sending two cores from this Nexus to your Trash, when the battle resolves, compare LV instead of BP, and the Spirit with the lower level is destroyed. If the LVs are the same, both Spirits are destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "By sending two cores from this Nexus to your Trash"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RULE",
            "text": "when the battle resolves, compare LV instead of BP, and the Spirit with the lower level is destroyed."
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
    "cardNumber": "BS14-090",
    "name": "The Fearless City on the Ship",
    "cardType": "Nexus",
    "effect": "[LV1]\nTreat the \"BP+ When Braved\" of all Brave Spirits as 0.",
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
            "rule": "KEYWORD_RULE",
            "text": "Treat the \"BP+ When Braved\" of all Brave Spirits as 0."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-091",
    "name": "Double Blaster",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nDraw two cards. Then by paying the cost, activate this card's flash effect.\n\n[Flash]\nDestroy a Brave on an opposing Brave Spirit. Or, destroy an opposing Nexus.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
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
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-094",
    "name": "Critical Burst",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDestroy two opposing Nexuses. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy an opposing 6000 BP or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_NEXUS",
            "count": 2
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
    "cardNumber": "BS14-095",
    "name": "Violet Funeral",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nBy sending three cores from any of your Spirits to your Trash, the opponent send three cores from any of their Spirits to their Trash. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nSend all cores from one opposing Nexus to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "By sending three cores from any of your Spirits to your Trash"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "the opponent send three cores from any of their Spirits to their Trash."
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-096",
    "name": "Curse of Hades",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nDestroy an opposing exhausted Cost 5 or less Spirit. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nBy destroying one of your Spirits, the opponent destroy one of their Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_COST",
            "maxCost": 5,
            "count": 1
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
        "subCost": {
          "type": "SACRIFICE_SPIRIT",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "By destroying one of your Spirits"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "the opponent destroy one of their Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-097",
    "name": "Instantaneous Shoot",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nSend a core from any opposing Spirits to their Reserve. Then, by paying the cost, activate this card's Main effect.\n\n[Main]\nSummon a Cost 4 or less Spirit card from your Trash, without paying the cost. However, any (When Summoned) effect of the Spirit can't activate.",
    "isVanilla": false,
    "abilities": [
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
            "rule": "CAST_MAGIC_FREE",
            "text": "by paying the cost, activate this card's Main effect."
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-099",
    "name": "Arms Shock",
    "cardType": "Magic",
    "effect": "[Burst: After an oppposing Spirit/Brave's (When Summoned) effect resolves]\nExhaust an opposing Spirit. Then by paying the cost, activate this card's Main effect.\n\n[Main]\nPut a core from the Void to any Spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put a core from the Void to any Spirit you control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-100",
    "name": "Storm Attack",
    "cardType": "Magic",
    "effect": "[Flash]\nExhaust an opposing Spirit. Then, refresh a Spirit you control.",
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
          },
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
    "cardNumber": "BS14-103",
    "name": "Crystallize Illusion",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nReturn a Spirit card which was destroyed when this Burst was activated from your Trash to your Hand. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nTarget an opposing Spirit. During this turn, your Life can't be reduced by the unblocked attack of that Spirit.",
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
              "type": "Spirit"
            }
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
            "text": "Target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this turn, your Life can't be reduced by the unblocked attack of that Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-105",
    "name": "Glacial Slash",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nReturn an opposing Spirit to the decktop. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nRefresh all your Spirits. During this turn, your Spirits refreshed via this effect can't attack.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-106",
    "name": "Recovered Core",
    "cardType": "Magic",
    "effect": "[Main]\nPut one core each from the Void to your Life and a White Spirit you control.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "text": "Put one core each from the Void to your Life and a White Spirit you control."
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
    "cardNumber": "BS14-107",
    "name": "Dream Prayer",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nPut a core from the Void to your Life. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy an opposing attacking Spirit that is in refreshed state.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy an opposing attacking Spirit that is in refreshed state."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-108",
    "name": "Magical Light",
    "cardType": "Magic",
    "effect": "[Main]\nReveal four cards from your decktop. If there is any Magic card among them, add one to your Hand. Discard any remaining cards.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "text": "Reveal four cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If there is any Magic card among them, add one to your Hand."
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
    "cardNumber": "BS14-109",
    "name": "Altar Mirage",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, when your Cost 3 or more Spirits are destroyed by opposing Spirits via BP comparison, they remain on your Field, refreshed. This effect can't be used during (Your Turn).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
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
    "cardNumber": "BS14-110",
    "name": "Disaster Wind",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDuring this turn, all opposing Spirits are treated as LV1. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, neither player's Life would be reduced by attacks of LV1 Spirits.",
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_LEVEL",
            "text": "During this turn, all opposing Spirits are treated as LV1."
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
            1
          ]
        },
        "subEffects": [
          {
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 0,
            "preventAllLifeLoss": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-111",
    "name": "Execution Destroy",
    "cardType": "Magic",
    "effect": "[Main]\nDiscard a card from the opposing decktop. If the discarded card is a Spirit card/Brave card, the opponent destroys a Spirit they control. If the discarded card is a Nexus card/Magic card, the opponent destroys a Nexus they control.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
          },
          {
            "op": "DESTROY_BRAVE",
            "count": 1
          },
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-112",
    "name": "Sealing Maelstrom",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDuring this turn, the opponent can't use Magic cards. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, treat a Spirit you control as being one level higher.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "During this turn, the opponent can't use Magic cards."
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "During this turn, treat a Spirit you control as being one level higher."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-113",
    "name": "Exclusion Horn",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nDiscard five cards from the opposing decktop. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nReturn a card from the opposing Trash to their deckbottom.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-114",
    "name": "Thunder Burst",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nTarget a cost equal or inferior to 4. Destroy all opposing Spirits with the target cost. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy an opposing Cost 5 or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "Target a cost equal or inferior to 4."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy all opposing Spirits with the target cost."
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
            "op": "DESTROY_BY_COST",
            "maxCost": 5,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-X01",
    "name": "The DragonHero Sieg-Yamato-Fried",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nWhen your Life is at three or less, destroy an opposing 15000 BP or less Spirit. After this effect resolves, summon this Spirit card without paying the cost.\n\n[LV2][LV3][LV4] (When Attacks)\nYou can target and attack an opposing Spirit.\n\n[LV3][LV4] (When Attacks)\nIf you have a Burst set, destroy an opposing Spirit with BP equal or inferior to this Spirit's.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 15000,
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
            "op": "PASSIVE_RULE",
            "rule": "TARGET_ATTACK",
            "text": "You can target and attack an opposing Spirit."
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "If you have a Burst set, destroy an opposing Spirit with BP equal or inferior to this Spirit's."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-X02",
    "name": "The CurseHero Chaotic-Seimei",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nSend a core from any opposing Spirit to their Trash. Also, if this Burst is activated when a Purple Spirit is destroyed, draw a card. Then, return this card to your Hand.\n\n[LV3] [Spell Blight] (When Destroyed by the Opponent)\nBy sending an opposing Life to their Trash, this Spirit remains on the Field, refreshed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "OPPONENT_SEND_CORES_MIN_ONE",
            "count": 1,
            "to": "TRASH"
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
    "cardNumber": "BS14-X03",
    "name": "The WindHero Dorcus-Ushiwaka",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nExhaust two opposing Spirits. Then, if you have at least 8 cores total in your Field/Reserve/Trash, summon this Spirit card.\n\nFlash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2][LV3] (When Battles)\nAt the end of the battle, by returning this Spirit to your Hand, during this turn, a Spirit you control gains +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 2,
            "allMatching": false
          }
        ]
      },
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-X04",
    "name": "The IceHero Mibrock-Baragan",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV1][LV2][LV3] (After Your Burst Activates)\nIf you don't have a Burst set, you can set a card with Burst effect from your Hand.\n\n[LV2][LV3] (Opposing Attack Step)\nAt the start of the step, by returning a Spirit you control to the Hand, return any number of opposing Spirits with a total cost up to (the cost of the Spirit returned) to the Hand.",
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
            "text": "If you don't have a Burst set, you can set a card with Burst effect from your Hand."
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
    "cardNumber": "BS14-X05",
    "name": "The SacredBird An-Zur",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can discard a card from your decktop. If that card is an \"Imaginary Beast\" family Spirit card, refresh this Spirit.\n\n[LV1][LV2][LV3] (When Destroyed)\nBy discarding one of your Bursts, this Spirit remains on the Field, refreshed.\n\n[LV3] (After Your Burst Activates)\nRefresh all your \"Imaginary Beast\" family Spirits.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "By discarding one of your Bursts"
          },
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
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {
              "family": "Imaginary Beast"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS14-X06",
    "name": "The MalevolentDeity Nyarla-Trap",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can reveal five cards from the opposing decktop. Among them, return a card to the opposing deckbottom. Return any remaining cards to the opposing decktop in any order.\n\n[LV1][LV2]\nAll (When Destroyed) effects of opposing Spirits can't activate.\n\n[LV2] (When Destroyed)\nDestroy an opposing Spirit with a cost equal or inferior to this Spirit's.",
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
            "text": "You can reveal five cards from the opposing decktop."
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          },
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
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_EFFECT",
            "text": "effects of opposing Spirits can't activate."
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
            "text": "Destroy an opposing Spirit with a cost equal or inferior to this Spirit's."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KEYHOLE-SHAPED",
    "name": "The Red Keyhole-Shaped Tumulus",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step) All your Red Spirits gain +1000 BP. Also, while you have a Burst set, all your Red Spirits gain +1000 BP.\n\n[LV2] (Your Attack Step) When only the opposing Spirit is destroyed by comparing BP, send all the cores on the destroyed Spirit to the Trash.",
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
        "targetFilter": {
          "color": "Red"
        },
        "amount": 1000
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "[LV2] (Your Attack Step) When only the opposing Spirit is destroyed by comparing BP, send all the cores on the destroyed Spirit to the Trash."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KING-GORADON",
    "name": "King-Goradon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SHA-ZOO",
    "name": "The Rogue Sha-Zoo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Exhaust an opposing Spirit.",
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
    "cardNumber": "THE-PENTAGRAM",
    "name": "The Pentagram Castle",
    "cardType": "Nexus",
    "effect": "[Lv1][Lv2] (Your Start Step) Send all cores from the opposing Reserve to their Trash.\n\n[Lv2] (Opposing Attack Step) At the start of the step, separate an opposing Brave Spirit, the opponent will decide how the cores will be moved for the separation.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "START_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "[Lv1][Lv2] (Your Start Step) Send all cores from the opposing Reserve to their Trash."
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "[Lv2] (Opposing Attack Step) At the start of the step, separate an opposing Brave Spirit, the opponent will decide how the cores will be moved for the separation."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-WRAITH",
    "name": "The Wraith's Ruins",
    "cardType": "Nexus",
    "effect": "[LV1] (Your Attack Step) When your Spirits are destroyed by the opponent, by discarding four cards from your decktop, one of the destroyed Spirits remains on your field, exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
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
            "text": "[LV1] (Your Attack Step) When your Spirits are destroyed by the opponent, by discarding four cards from your decktop, one of the destroyed Spirits remains on your field, exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THREE-LEGGER",
    "name": "Three-Legger",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] This Spirit cannot attack.\n\n[LV1][LV2] While you have a Burst set, this Spirit gains +3000 BP.",
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
            "text": "[LV1][LV2] This Spirit cannot attack."
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
      }
    ]
  },
  {
    "cardNumber": "WARRIOR-DRAGON",
    "name": "Warrior-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash- Awaken - You can put any number of cores from Spirits you control to this Spirit.\n\n[LV2][LV3] (Your Attack Step) While you have a set Burst, this Spirit gains +4000 BP.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Awaken - You can put any number of cores from Spirits you control to this Spirit."
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
        "amount": 4000
      }
    ]
  }
];

for (const spec of BS14_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
