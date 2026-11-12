/**
 * engine/cards/sets/bs04_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS04_SAGA_CARDS)
 * Total Cards: 107 (88 Effect, 19 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS04_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10467",
    "name": "The GreatAngelia Seraphy",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) You may move any number of cores from your Reserve to your Trash to summon an equal number of \"Divine Spirit\" spirit cards with a cost of 6 or less from your hand without paying their costs. In that case (When Summoned) effects of those spirits are negated when they are summoned.\n\n[LV2][LV3] Brilliance (During Your Battle Phase) While this spirit is battling, each time you play a spell card, at End of Battle Step, move that spell card from your Trash to your hand.",
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
            "rule": "MOVE_CORE",
            "text": "You may move any number of cores from your Reserve to your Trash to summon an equal number of \"Divine Spirit\" spirit cards with a cost of 6 or less from your hand without paying their costs."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_EFFECT",
            "text": "In that case (When Summoned) effects of those spirits are negated when they are summoned."
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11139",
    "name": "The King Snake Nest",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Draw Step) If you control three or more \"Dark Snake\"/\"Zombie\" family Spirits, increase the number of cards you draw by +1.\n\n[LV2] (Your Start Step) For each \"Dark Snake\" family Spirit you control, send a core from an opposing Spirit to the Reserve. (This effect can't bring the number of cores on the opposing Spirit down to 0.)",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "requireFamilyOnField": {
            "family": "Zombie",
            "min": 1
          }
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
            "to": "RESERVE",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11193",
    "name": "The LegendaryGiant Jude",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Crush (When Attacks) Move cards from the top of your opponent's Deck to their Trash equal to this spirit's LV.\n\n[LV2][LV3] (During Your Battle Phase) Each time 1 or more nexus cards are moved from the top of your opponent's Deck to their Trash due to the effect of this spirit's Crush, if this spirit is exhausted at End of Battle Step, refresh this spirit.",
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11430",
    "name": "The Miraculous Hill",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) \"Divine Spirit\" spirits you control get +1000BP.\n\n[LV2] (During Your Battle Phase) Each time a \"Divine Spirit\" spirit you control is defeated, it is moved to your hand instead of their Trash.",
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
    "cardNumber": "BATTLE-SPIRITS-A11443",
    "name": "The MobileFortress Castle-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nFor each Nexus you control, discard five cards from the opposing decktop (Max 15).\n\n[LV2] (When Attacks)\nFor each Blue symbol you control, discard a card from the opposing decktop.",
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
    "cardNumber": "BATTLE-SPIRITS-A11715",
    "name": "The Pharmacist Girmamarl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Gain 1 core on target nexus you control.",
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
            "rule": "MOVE_CORE",
            "text": "Gain 1 core on target nexus you control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11841",
    "name": "The RatMan Zurich",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) While you control a \"Fighting Beast\" spirit, this spirit is treated as being LV2.",
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
            "text": "While you control a \"Fighting Beast\" spirit, this spirit is treated as being LV2."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12581",
    "name": "The Soldier Gustav",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12720",
    "name": "The Spinner Harfelicite",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] During Your Main Phase) At start of phase, you may discard a nexus card from your hand. In that case, gain 1 core on this spirit.\n\n(When Destroyed) You may deploy target nexus card from your Trash without paying its cost.",
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
            "text": "During Your Main Phase) At start of phase, you may discard a nexus card from your hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "In that case, gain 1 core on this spirit."
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A12739",
    "name": "The Spring of Full Magical Powers",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Opponent's Main Phase) While you control 3 or more \"Magician\" spirits, spirit cards your opponent summons cost 1 more to summon.\n\n[LV2] (During Opponent's Battle Phase) While you control 3 or more \"Magician\" spirits, each time a spirit your opponent controls attacks, they must move 1 core from a card they control or their Reserve to their Trash.",
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
    "cardNumber": "BATTLE-SPIRITS-A12756",
    "name": "The Steel Forest",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Start Step) Move target \"Armored Beast\" spirit card from your Trash to your hand.\n\n[LV2] (During Your Main Phase) Each time you summon an \"Armored Beast\" or \"Giant Beast\" spirit, move target spirit your opponent controls with BP less than or equal to the summoned spirit's BP to its owner's hand.",
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
            "op": "SALVAGE_TRASH",
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
    "cardNumber": "BATTLE-SPIRITS-A13296",
    "name": "The Two-Sword Ambrose",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Crush (When Attacks) Discard cards from the opposing decktop equal to this Spirit's level.\n\n[LV2][LV3] (When Attacks) For each Spirit card discarded by this Spirit's Crush effect, this Spirit gains +1000 BP.",
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
    "cardNumber": "BATTLE-SPIRITS-A13302",
    "name": "The Tyrant Fuhjaus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Destroy every Nexus on the opposing Field.\n\n[LV2][LV3] (When Attacks) Refresh a \"Winged Dragon\" family Spirit you control, other than \"The Tyrant Fuhjaus\".\n\n[LV3] (When Attacks) When only the opposing Spirit is destroyed by BP comparison, destroy an opposing Cost 3 or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A13496",
    "name": "The WaterSnake Seaserpenta",
    "cardType": "Spirit",
    "effect": "[LV1] (Opponent's Start Step) If you have 10 or more cards in your hand, move target spirit your opponent controls to its owner's hand.\n\n[LV2] (Opponent's Start Step) If you have 8 or more cards in your hand, move target spirit your opponent controls to its owner's hand.\n\n[LV3] (Opponent's Start Step) If you have 6 or more cards in your hand, move target spirit your opponent controls to its owner's hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13589",
    "name": "The Whirlwind Ravine",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During the Main Phase) While a player controls 4 or more spirits, that player cannot summon spirits\n\n[LV2] (During Your Battle Phase) Change the text of High Speed on spirit cards in your hand to the following (the Levels do not change):\n\n\"High Speed (Flash Step) This spirit card may be summoned from your hand.\"",
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Change the text of High Speed on spirit cards in your hand to the following (the Levels do not change):"
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
    "cardNumber": "BATTLE-SPIRITS-A13894",
    "name": "Ugarurum",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14247",
    "name": "Venom Shot",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Remove 1 core from target spirit your opponent controls.\n\n(Flash Step)(Your Main Phase) Target spirit gets +1000BP until end of turn.",
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
            "text": "Remove 1 core from target spirit your opponent controls."
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
    "cardNumber": "BATTLE-SPIRITS-A1555",
    "name": "The Reconnaissance Magni",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A184",
    "name": "Alligade",
    "cardType": "Spirit",
    "effect": "[LV2] (During Your Turn) Each time 5 or more cards are moved from the top of your opponent's Deck to their Trash at once due to your effect, exhaust target unexhausted spirit your opponent controls.",
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
    "cardNumber": "BATTLE-SPIRITS-A189",
    "name": "Banshee",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A191",
    "name": "BlackMachG",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A197",
    "name": "Chamelewhip",
    "cardType": "Spirit",
    "effect": "[LV1] (Opposing Attack Step) This Spirit can't block.\n\n[LV2] (When Attacks) This Spirit gains +1000 BP.",
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
            "text": "This Spirit can't block."
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
    "cardNumber": "BATTLE-SPIRITS-A203",
    "name": "DarkPiyon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A207",
    "name": "Duckle",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) If this is the first attack this turn, this spirit gets +2000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A212",
    "name": "Forest Aura",
    "cardType": "Magic",
    "effect": "Flash - During this turn, each time a \"Winged Beast\" or \"Plant Spirit\" spirit you control attacks, it gets +3000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A213",
    "name": "Giraffen",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A214",
    "name": "Glacial Breath",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Return 2 target spirits you control to the bottom of your Deck in any order. In that case, return 2 target spirits your opponent controls to the bottom of their Deck in any order. This effect cannot be used unless you control a spirit with 2 or more Gems.\n\n(Flash Step)(Your Main Phase) Target spirit with 2 or more Gems gets +5000BP until end of turn.",
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
            "position": "BOTTOM",
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
            "amount": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A215",
    "name": "Gleam Hope",
    "cardType": "Magic",
    "effect": "Main - Target spirit you control gets Brilliance until end of turn.\n\n[Any LV] Brilliance (During Your Battle Phase) While this spirit is battling, each time you play a spell card, at End of Battle Step, move that spell card from your Trash to your hand.\n\nFlash - Target spirit gets +2000BP until end of turn.",
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
            "text": "Target spirit you control gets Brilliance until end of turn."
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
    "cardNumber": "BATTLE-SPIRITS-A4057",
    "name": "Euthanasia",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) (When Destroyed) effects of spirits your opponent controls are negated until end of turn.",
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
            "rule": "NEGATE_EFFECT",
            "text": "effects of spirits your opponent controls are negated until end of turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4393",
    "name": "Full Add",
    "cardType": "Magic",
    "effect": "[Main]\nPut cores from the Void to a Nexus you control until it reaches [LV2].\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
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
            "text": "Put cores from the Void to a Nexus you control until it reaches [LV2]."
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
    "cardNumber": "BATTLE-SPIRITS-A4705",
    "name": "Ground Howling",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Exhaust all unexhausted spirits your opponent controls with 4000BP or more. This effect cannot be used unless you control a spirit with 2 or more gems.\n\n(Flash Step)(Your Main Phase) Target spirit with 2 or more gems gets +5000BP until end of turn.",
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
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "This effect cannot be used unless you control a spirit with 2 or more gems."
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
    "cardNumber": "BATTLE-SPIRITS-A4818",
    "name": "Headless Carriage",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4894",
    "name": "Hellwitch",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks) Destroy target exhausted spirit your opponent controls with a cost of 6 or less.\n\n[LV3] (When Attacks) Destroy target exhausted spirit your opponent controls with a cost of 1 or less.",
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A5048",
    "name": "High Ether",
    "cardType": "Magic",
    "effect": "Flash - Refresh 3 exhausted \"Giant Beast\" and or \"Armored Beast\" spirits you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A5233",
    "name": "Judgment Lights",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Spirits your opponent controls are treated as being at LV1 until end of turn. This effect can only be used if you control a spirit with 2 or more Gems.\n\n(Flash Step)(Your Main Phase) Target spirit with 2 or more Gems gets +5000BP until end of turn.",
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
            "text": "Spirits your opponent controls are treated as being at LV1 until end of turn."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "This effect can only be used if you control a spirit with 2 or more Gems."
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
    "cardNumber": "BATTLE-SPIRITS-A5282",
    "name": "Jungle Law",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Exhaust all unexhausted LV1 spirits.\n\n(Flash Step)(Your Main Phase) Target spirit gets +4000BP until end of turn.",
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
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6236",
    "name": "Lead Wall",
    "cardType": "Magic",
    "effect": "(Flash) During this turn, all of your spirits can block the spirit with \"Cannot be blocked\" effect.",
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
    "cardNumber": "BATTLE-SPIRITS-A6382",
    "name": "Magic Drill",
    "cardType": "Magic",
    "effect": "Main- For each card in the opposing Hand, discard a card from the opposing decktop.\n\nFlash- During this turn, give a Spirit +2000 BP.",
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6457",
    "name": "Massive Up",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Target blue spirit with 3 Levels is treated as being at LV3 until end of turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "levels": [
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_LEVEL",
            "text": "Target blue spirit with 3 Levels is treated as being at LV3 until end of turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6568",
    "name": "Mist Curtain",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Select 1 spirit your opponent controls. Until end of turn, your Life cannot receive any Damage from the selected spirit's attack due to Showdown Step.",
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
            "rule": "TARGET_CARD",
            "text": "Select 1 spirit your opponent controls."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_DAMAGE",
            "text": "Until end of turn, your Life cannot receive any Damage from the selected spirit's attack due to Showdown Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6953",
    "name": "Oddsay",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (During Your Battle Phase) This spirit cannot attack.\n\n[LV1][LV2] (Permanent) Each time any damage is dealt to your Life, if this spirit is exhausted, refresh this spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A6958",
    "name": "Nexus Repair",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Deploy target nexus card from your Trash without paying its cost.\n\n(Flash Step)(Your Main Phase) Target spirit gets +3000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A7404",
    "name": "Rabirabi",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7807",
    "name": "Shadowjuggler",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Draw a card.\n\n[LV2] Curse (When Attacks) Destroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7858",
    "name": "Skulldemon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Curse (When Attacks) Destroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
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
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8077",
    "name": "Straight Flush",
    "cardType": "Magic",
    "effect": "Main - If you control 5 or more \"Magician\" spirits, destroy all of them. In that case, destroy all spirits your opponent controls.\n\nFlash - Target spirit gets +4000BP until end of turn.",
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
            "text": "If you control 5 or more \"Magician\" spirits, destroy all of them."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "In that case, destroy all spirits your opponent controls."
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
    "cardNumber": "BATTLE-SPIRITS-A8116",
    "name": "Switch Hitter",
    "cardType": "Magic",
    "effect": "Main- During this turn, every \"Artificial Soldier\" family Spirit you control is also treated as Spirits with no printed effects.\n\nFlash- During this turn, give a Spirit +3000 BP.",
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
            "text": "During this turn, every \"Artificial Soldier\" family Spirit you control is also treated as Spirits with no printed effects."
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
    "cardNumber": "BATTLE-SPIRITS-A8291",
    "name": "The Ancient Arena",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) The effects of cards your opponent controls that increase the BP of 1 or more spirits are negated.\n\n[LV2] (During Opponent's Main Phase) (When Summoned) effects of spirits your opponent controls are negated when they are summoned.",
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
            "text": "The effects of cards your opponent controls that increase the BP of 1 or more spirits are negated."
          }
        ]
      },
      {
        "overall": "WHEN_DEPLOYED",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_EFFECT",
            "text": "(During Opponent's Main Phase) (When Summoned) effects of spirits your opponent controls are negated when they are summoned."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8376",
    "name": "The Angelia Throne",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (Your Start Step) 2 target spirits your opponent controls must exchange all cores on them.\n\n[LV3] (Permanent) This spirit is also treated as a purple spirit.",
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
            "rule": "MOVE_CORE",
            "text": "2 target spirits your opponent controls must exchange all cores on them."
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
            "text": "This spirit is also treated as a purple spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8655",
    "name": "The BattleBeast Diatryma",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8657",
    "name": "The BattleBeast Jacker",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) Each time a nexus you control would be destroyed, you may move all cores from this spirit to your Trash. In that case, that nexus remains on your Field instead.",
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
            "text": "Each time a nexus you control would be destroyed, you may move all cores from this spirit to your Trash."
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
    "cardNumber": "BATTLE-SPIRITS-A8740",
    "name": "The BlackFairy Ti-Tanya",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Permanent) While you control 3 or more yellow spirits, spell cards in your hand get 1 additional yellow Cost Reduction.",
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
            "text": "While you control 3 or more yellow spirits, spell cards in your hand get 1 additional yellow Cost Reduction."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8965",
    "name": "The CatLady Abyssinia",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9194",
    "name": "The CrustaceanFighter Longhorn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Gain 1 core on each spirit you control with High Speed.\n\n[LV2][LV3] (During Your Battle Phase) Cores on this spirit can be used to summon a spirit card with High Speed and/or put on a Spirit with High Speed as though they were in your Reserve.",
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
            "rule": "MOVE_CORE",
            "text": "Gain 1 core on each spirit you control with High Speed."
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9385",
    "name": "The Devil Shadow Street",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) Each time a spirit your opponent controls is destroyed due to the effect of Curse, remove 1 core from that spirit.\n\n[LV2] (During Opponent's Main Phase) Each time a player puts 1 or more cores on a spirit except due to an effect, exhaust that spirit.",
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
            "text": "Each time a spirit your opponent controls is destroyed due to the effect of Curse, remove 1 core from that spirit."
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
    "cardNumber": "BATTLE-SPIRITS-A9921",
    "name": "The FlameEmperor Kujaraku",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BERSERKER-MAGNUM2",
    "name": "Berserker-Magnum",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS04-003",
    "name": "DarkGoradon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS04-004",
    "name": "DarkDinohound",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, besides [DarkDinohound], refresh a Spirit with [Awaken] you control.",
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
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "AWAKEN",
            "maxCores": 2
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
    "cardNumber": "BS04-006",
    "name": "The ZombieDragon Zom-Sauru",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nAll your Purple Spirits gain +1000 BP.\n\n[LV3] (When Attacks)\nDestroy an exhausted Spirit.",
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
          "color": "Purple"
        },
        "amount": 1000
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-007",
    "name": "The Guardsman Dragno",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nThe (When Attacks) effects of all \"Dragon\" family Spirits activate as (When Blocks) effects.\n\n[LV2] (When Attacks)\nThis Spirit gains +2000 BP.",
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
            "rule": "GRANT_FAMILY",
            "text": "The (When Attacks) effects of all \"Dragon\" family Spirits activate as (When Blocks) effects."
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
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-008",
    "name": "The AncientDragon Ba-Gaw",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nThis Spirit gains +5000 BP.\n\n[LV2][LV3] (Your Attack Step)\nWhen only the opposing Spirit is destroyed via BP comparison with your \"Dragon\"/\"Ancient Dragon\" family Spirits, draw a card.",
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
            "amount": 5000
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
    "cardNumber": "BS04-010",
    "name": "The ThunderDragon El-Clair",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-015",
    "name": "Cyclo-Winder",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS04-020",
    "name": "The DarkDragon Ops-Curite",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-021",
    "name": "The Vampire Dampeel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nSend one core each from every opposing Cost 4 or less Spirit to their Trash.\n\n[LV2][LV3] (When Attacks)\nThis Spirit gains +1000 BP for each core in the opposing Trash.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-022",
    "name": "The KingSnake Quetzalcoatl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDraw two cards.\n\n[LV2][LV3] (When Attacks)\nBy discarding any number of cards from your Hand, send one core each from a number of opposing Spirits equal to the number of cards you discarded to their Trash.",
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
            "count": 2
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
            "rule": "DISCARD_HAND",
            "text": "By discarding any number of cards from your Hand"
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
    "cardNumber": "BS04-028",
    "name": "Sevenspot",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV2]\nWhen putting cores onto this Spirit via Spirit/Nexus/Magic effects, put +1 core.",
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
            "text": "When putting cores onto this Spirit via Spirit/Nexus/Magic effects, put +1 core."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-029",
    "name": "BlackMonoqueiroz",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDuring this turn, every \"Shellman\"/\"Shell Insect\" family Spirit you control gains +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-031",
    "name": "The GroundDragon Fon-Daxion",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-032",
    "name": "The SpearBeetle Lucanidos",
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
    "cardNumber": "BS04-039",
    "name": "The JewelBug Scaraveil",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your Spirits with [High Speed] gain +1000 BP.\n\n[LV2] (Your Attack Step)\nWhen your Spirits with [High Speed] is destroyed by opposing Spirits via BP comparison, by sending a core from your Field/Reserve to your Trash, return that Spirit to the Hand.",
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
          "keyword": "High Speed"
        },
        "amount": 1000
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
    "cardNumber": "BS04-040",
    "name": "The ArmoredBeast Gullin-Bullsty",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS04-043",
    "name": "The Valkyrie-Hildr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit is unaffected by opposing Spirit/Magic effects.\n\n[LV2]\nWhen your Life is reduced, refresh this Spirit.",
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
            "text": "This Spirit is unaffected by opposing Spirit/Magic effects."
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
    "cardNumber": "BS04-044",
    "name": "The SkyDragon Le-Ciel",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-046",
    "name": "The Fairy Dorothy",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS04-047",
    "name": "Wiseless-Scarecrow",
    "cardType": "Spirit",
    "effect": "[LV2] [Brilliance] (When Attacks)\nAt the end of battle, return every Magic card you used in this battle to the Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-050",
    "name": "Heartless-Tin",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAll your White Spirits gain +1000 BP.\n\n[LV2] (Opposing End Step)\nIf there is a total of three or more White symbols on your Field, and the opponent didn't attack for at least once this turn, draw a card.",
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
          "color": "White"
        },
        "amount": 1000
      },
      {
        "overall": "END_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
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
    "cardNumber": "BS04-051",
    "name": "Arcanabeast-Hart",
    "cardType": "Spirit",
    "effect": "[LV3]\nGive all your \"Arcana\"-named Spirits the effect: \"(When Attacks) This Spirit gains +2000 BP.\"",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {
              "family": "Arcana"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-052",
    "name": "The Postman Pentan",
    "cardType": "Spirit",
    "effect": "[LV3] (Your Draw Step)\nIf you control a total of three or more \"Pentan\"/\"Empereur\"-named Spirits, you draw +1 card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
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
    "cardNumber": "BS04-054",
    "name": "Arcanasoldier-Cinq",
    "cardType": "Spirit",
    "effect": "[LV2] (Opposing Turn)\nWhen the opponent uses any Magic effect that includes this Spirit as target, you can change the target of that Magic effect to only this Spirit.",
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
            "rule": "REDIRECT_TARGET",
            "text": "When the opponent uses any Magic effect that includes this Spirit as target, you can change the target of that Magic effect to only this Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-055",
    "name": "The LightDragon Lumiere",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-056",
    "name": "Braveless-Leo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS04-073",
    "name": "The SeaDragon Courant-Marin",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-074",
    "name": "The ChimeraDragon Hydrus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nEither player can only use Magic effects once per turn.\n\n[LV2][LV3]\nUnless the opponent pay the cost, they can't use Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "oncePerTurn": "opt_1"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MAGIC_RESTRICTION",
            "text": "Either player can only use Magic effects once per turn."
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
            "text": "Unless the opponent pay the cost, they can't use Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-077",
    "name": "The Seven Dragons' Throne",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit card in your Hand a [Red Core] reduction symbol.\n\n[LV2] (Your Main Step)\nWhen your \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit is summoned, destroy an opposing Spirit with BP equal or inferior to the summoned Spirit's.",
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
            "rule": "DESTROY",
            "text": "When your \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit is summoned, destroy an opposing Spirit with BP equal or inferior to the summoned Spirit's."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-082",
    "name": "The Inviolable Sanctuary",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every Cost 8 or more Spirit you control: \"[Armor: Purple/Green/White/Yellow/Blue] This Spirit is unaffected by opposing Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects.\"\n\n[LV2]\nOnly up to five cards can be discarded from your deck per turn due to opposing Spirit/Nexus/Magic effects.",
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
        "keyword": "Armor: Purple/Green/White/Yellow/Blue"
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
            "rule": "LIMIT_DECK_DISCARD",
            "text": "Only up to five cards can be discarded from your deck per turn due to opposing Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-087",
    "name": "The Heart-Buster Huge Slope",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Start Step)\nDiscard a card from the opposing decktop.\n\n[LV2]\nEvery Spirit with no printed effects you control is treated as at its highest level during the turn it's summoned.",
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "Every Spirit with no printed effects you control is treated as at its highest level during the turn it's summoned."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-088",
    "name": "The Victory Stand of the Glory",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen you are paying the cost for deploying Nexus, you can discard a card from your decktop for each cost to be paid instead.\n\n[LV2]\nWhen your Nexus is deployed, put a core from the Void to your Reserve.",
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
    "cardNumber": "BS04-089",
    "name": "Great Link",
    "cardType": "Magic",
    "effect": "[Flash]\nSend every core from your Trash to a Spirit with [Awaken] you control. This effect can't be used in Main Step.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS04-090",
    "name": "Der Ring des Nibelungen",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, when only the opposing Spirit is destroyed by BP comparison with your \"Sieg\"-named Spirit, destroy every opposing Spirit with the same family as the destroyed Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "During this turn, when only the opposing Spirit is destroyed by BP comparison with your \"Sieg\"-named Spirit, destroy every opposing Spirit with the same family as the destroyed Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-092",
    "name": "Dragons' Rush",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when only the opposing Spirit is destroyed by comparing BP with your \"Winged Dragon\"/\"Dragon\"/\"Ancient Dragon\" family Spirits, refresh that Spirit you control.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "scope": "TARGET"
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
    "cardNumber": "BS04-094",
    "name": "Danse Macabre",
    "cardType": "Magic",
    "effect": "[Flash]\nDiscard any number of cards from your Hand. For each card discarded, send a core from a single opposing Spirit to the Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "Discard any number of cards from your Hand."
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
    "cardNumber": "BS04-096",
    "name": "Inferno Eyes",
    "cardType": "Magic",
    "effect": "[Main]\nEach player sends four cores from their Spirits/Nexuses to the Void. This effect can't be used unless you control a Spirit with two or more symbols.\n\n[Flash]\nDuring this turn, give a Spirit with two or more symbols +5000 BP.",
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
            "text": "Each player sends four cores from their Spirits/Nexuses to the Void."
          },
          {
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
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
    "cardNumber": "BS04-102",
    "name": "Dream Hand",
    "cardType": "Magic",
    "effect": "[Flash]\nReturn every Cost 1 or less Spirit to its owner's Hand.",
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
    "cardNumber": "BS04-105",
    "name": "Trick Prank",
    "cardType": "Magic",
    "effect": "[Main]\nChoose five Spirit cards from your Trash and return them to the deckbottom in any order.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS04-114",
    "name": "Tidal Tide",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy any number of Nexuses you control. For each Nexus destroyed, the opponent destroys a Spirit they control. This effect can only be used if you control a Spirit with two or more symbols.\n\n[Flash]\nDuring this turn, a Spirit with two or more symbols gain +5000 BP.",
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
            "op": "DESTROY_NEXUS",
            "count": 1
          },
          {
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
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
    "cardNumber": "BS04-X13",
    "name": "The DarkDragonEmperor Siegfried",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all core from a Cost 6 or more Spirit you control to the Void.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, draw a card.\n\n[LV3] (When Attacks)\nDestroy every non-Red 4000 BP or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirit you control to the Void."
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
            "maxBp": 4000,
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-X14",
    "name": "The SevenShogun Pandemium",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nWhen any opposing Spirit is destroyed, draw a card.\n\n[LV2][LV3] (Either Attack Step)\nWhen your Spirit is destroyed by opposing Spirits via BP comparison, exhaust an opposing Spirit.\n\n[LV3] (When Destroyed)\nBoth players discard five cards from the Hand.",
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
            "op": "DRAW_CARDS",
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
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "Both players discard five cards from the Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-X15",
    "name": "The Emperor Kaiseratlas",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, by sending a core from your Reserve to the Void, send two opposing Lives to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void."
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
            "to": "VOID"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "CHAIN-DRAGON2",
    "name": "Chain-Dragon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "DRA-GOLEM2",
    "name": "Dra-Golem",
    "cardType": "Spirit",
    "effect": "[LV2] (During Your Battle Phase) Spirits you control with Evolution are treated as being at the following LV depending on the number of cores they have on them\n1 core = LV1\n2 cores = LV2\n3 or more cores = the highest LV they have",
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
            "rule": "TREAT_RULE",
            "text": "Spirits you control with Evolution are treated as being at the following LV depending on the number of cores they have on them"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "1 core = LV1"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "2 cores = LV2"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "3 or more cores = the highest LV they have"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "FAL-CONDOR2",
    "name": "Fal-Condor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (During Your Battle Phase) Each time this spirit defeats a spirit, gain 1 core in your Reserve.\n\n[LV2] (During the Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit.",
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
            "text": "Each time this spirit defeats a spirit, gain 1 core in your Reserve."
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
    "cardNumber": "HEITH-RUNE2",
    "name": "The ArmoredBeast Heith-Rune",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) while the opponent controls no Red Spirits, this Spirit can't attack.\n\n[LV1][LV2] (Opposing Attack Step) When an opposing Cost 1 or less Spirit attacks, this Spirit refreshes.",
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
            "rule": "SET_RESTRICTION",
            "text": "while the opponent controls no Red Spirits, this Spirit can't attack."
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
    "cardNumber": "IRCANNONMK-II2",
    "name": "Fenrircannon Mk-II",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks) When blocking a Spirit at the same Lv, this Spirit gains +3000 BP.\n\n[LV2][LV3] Armor:Red/Green - This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated colors.",
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
            "rule": "IMMUNITY",
            "text": "Armor:Red/Green - This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated colors."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "IRON-GOLEM2",
    "name": "Iron-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks) By discarding a Nexus card from your Hand, this Spirit gains +4000 BP.\n\n[LV2] (When Attacks) By discarding a Nexus card from your Hand, this Spirit gains +4000 BP.",
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
    "cardNumber": "STRONG-DOMINATEDEARTH2",
    "name": "The Strong-Dominated Earth",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) Each time a spirit you control with 6000BP or more would be defeated, it may remain on your Field exhausted instead.\n\n[LV2] (During your Battle Phase) At start of Phase, select a spirit you control with 10000BP or more. In that case, the next time that spirit attacks this turn, that spirit cannot be blocked.",
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
            "text": "Each time a spirit you control with 6000BP or more would be defeated, it may remain on your Field exhausted instead."
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
  }
];

for (const spec of BS04_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
