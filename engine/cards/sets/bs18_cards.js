/**
 * engine/cards/sets/bs18_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS18_SAGA_CARDS)
 * Total Cards: 86 (80 Effect, 6 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS18_SAGA_CARDS = [
  {
    "cardNumber": "BASA-RAZAN",
    "name": "Basa-Razan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step) For each \"Emperor Beast\" family Spirit you control, this Spirit gains +1000 BP.",
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
          "family": "Emperor Beast"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10338",
    "name": "The GoldenHero Lord-Dragon-Inty",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is three or less, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nReveal five cards from your decktop. Summon any number of \"Lord-Dragon\"-named Spirit card among them, without paying the cost. Discard any remaining cards. This effect can only be used once per turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If your Life is three or less, summon this Spirit card."
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
            "rule": "REVEAL_DECKTOP",
            "text": "Reveal five cards from your decktop."
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
    "cardNumber": "BATTLE-SPIRITS-A10505",
    "name": "The Great Blue Steppe",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step) All your \"Supreme Hero\"/\"Great General\" family Spirits gain +2000 BP.\n\n[LV2] (Either Attack Step) When only the opposing Spirit is destroyed by comparing BP with your Spirits, exhaust an opposing Spirit.",
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
          "family": "Great General"
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
    "cardNumber": "BATTLE-SPIRITS-A11066",
    "name": "The Islands dotting the Emerald Sea",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn) When opposing Spirit is refreshed, refresh a Spirit you control.\n\n[LV2] Besides the (Opposing Draw Step), when the number of cards in the opposing Hand increases, the opponent must discard 1 card from their Hand.",
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
        "overall": "DRAW_STEP",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "Besides the (Opposing Draw Step), when the number of cards in the opposing Hand increases, the opponent must discard 1 card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12097",
    "name": "The Sapphire Highway",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step) When only the opposing Spirit is destroyed by comparing BP with your Spirits with Assault, put a core from the Void to your Reserve.\n\n[LV2] (Your End Step) For each exhausted Nexus you control, refresh a Spirit you control.",
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
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13480",
    "name": "The War History Monolith",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step) When your \"Dragon Warrior\" family Spirit attacks, draw 1 card from your deck.\n\n[LV2] When your Red Spirit(s) is destroyed by the opponent, destroy an opposing 5000 BP or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A13732",
    "name": "Therizino",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Main Step) When cores are increased from the Void due to opposing Spirit effect, by exhausting this Spirit, destroy the Spirit that activated the effect.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13818",
    "name": "Togarinezumin",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14413",
    "name": "Yaksamori",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2547",
    "name": "The Hero Lord-Dragon-the-World",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is three or less, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nDraw a card. Then, you can set a card with Burst effect from your Hand.\n\n[LV2][LV3] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Lord-Dragon\"-named Spirit, send an opposing Life to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If your Life is three or less, summon this Spirit card."
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2812",
    "name": "Armadidragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] This Spirit is also treated as a Red Spirit.\n\n[LV2] (When Attacks) This Spirit gains +2000 BP.\n\n[LV3] (When Blocks) This Spirit gains +2000 BP.",
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
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Red Spirit."
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
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3341",
    "name": "Assassin-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Cards cannot be discarded from either player's deck.\n\n[LV1][LV2][LV3] (When Attacks) This Spirit gains +3000 BP.\n\n[LV2][LV3] (When Attacks) You can target and attack an opposing Spirit with (When Summoned) effect.",
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
            "rule": "DECK_IMMUNITY",
            "text": "Cards cannot be discarded from either player's deck."
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
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
            "rule": "TARGET_ATTACK",
            "text": "You can target and attack an opposing Spirit with (When Summoned) effect."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A5165",
    "name": "Iron Phalanx",
    "cardType": "Magic",
    "effect": "Flash- Destroy an opposing Spirit with a Cost equal to or less than the total number of Blue symbols on your field.",
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
    "cardNumber": "BATTLE-SPIRITS-A6581",
    "name": "Meyeria",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8991",
    "name": "The Caldron of Destroy and Create",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed) Destroy an opposing Cost 3 or less Spirit.\n\n[LV2] (Your Attack Step) Treat all your Blue Spirits with 4 or more cores on them as having 2 Blue symbols.",
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
            "op": "DESTROY_BY_COST",
            "maxCost": 3,
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
            "text": "Treat all your Blue Spirits with 4 or more cores on them as having 2 Blue symbols."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9878",
    "name": "The FireBeast Hanu-Marg",
    "cardType": "Spirit",
    "effect": "☼<nowiki>[ </nowiki>Burst: After your opponent activates a Spirit/Brave's (When Summoned) effect<nowiki> ]</nowiki>\nSummon this Spirit card.\n\n[LV1][LV2] (When Summoned) Destroy two opposing 4000 BP or less Spirits.\n\n[LV2] (When Attacks) When blocked by an opposing Cost 7 or more Spirit, send a core from the opposing life to the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "☼<nowiki>[ </nowiki>Burst: After your opponent activates a Spirit/Brave's (When Summoned) effect<nowiki> ]</nowiki>"
          },
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
    "cardNumber": "BS18-010",
    "name": "Camelot-Pawn",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS18-012",
    "name": "The DarkKnight Lamorak",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBy discarding up to two cards from your Hand, for each card discarded, send a core from an opposing Spirit to the Trash.",
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
            "to": "TRASH",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-013",
    "name": "Don-Diegod",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nCards can't be discarded from either player's deck.\n\n[LV1][LV2][LV3] (Either Main Step)\nWhen cores are increased from the Void via a Spirit effect, send all the increased cores to the Void. Also, send all cores from the Spirit who activated such effect to the Void.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "Cards can't be discarded from either player's deck."
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
    "cardNumber": "BS18-014",
    "name": "The HellLibrarian Dantalian",
    "cardType": "Spirit",
    "effect": "[LV1][LV2[LV3]\nWhen your Purple Spirits would be exhausted by opposing Spirit/Brave effects, for each Spirit that would be exhausted, by sending a card from your decktop to your Trash, that Spirit won't become exhausted.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-015",
    "name": "Towermingo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nCards can't be discarded from either player's deck.\n\n[LV1][LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked this Spirit at the end of battle.\n\n[LV2] (When Destroyed)\nIf your Hand is five or more, this Spirit remains on the Field, exhausted.",
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
            "text": "Cards can't be discarded from either player's deck."
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-016",
    "name": "The DarkQueen Guinevere",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing End Step)\nIf the opponent didn't attack for at least once during this turn, you can activate your Purple Burst, ignoring its Burst conditions.",
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
            "rule": "KEYWORD_RULE",
            "text": "If the opponent didn't attack for at least once during this turn, you can activate your Purple Burst, ignoring its Burst conditions."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-017",
    "name": "The DarkKnight Perceval",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 3/4] (Either Attack Step)\nYou can summon this Spirit card form the Trash when your Cost 3/4 Spirit is destroyed.\n\n[LV2]\nWhen your \"DarkKnight\"-named Spirits are destroyed by the opponent, exhaust an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 3/4"
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
    "cardNumber": "BS18-018",
    "name": "The HellMask Zorro",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nBy returning a Cost 5 or more Red/Purple Spirit you control to the deckbottom, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nWhen summoned via a Burst effect, besides this Spirit, send one core each from every Spirit to its owner's Reserve. For each Spirit that has the cores on it becomes 0 due to this effect, put a core from the Void to this Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "BS18-020",
    "name": "Bufumot",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Exhaust two opposing 4000 BP or less Spirits.",
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
    "cardNumber": "BS18-021",
    "name": "The SteedGeneral Muqali",
    "cardType": "Spirit",
    "effect": "[LV2] (Your Attack Step)\nWhen your \"Great General\" family Spirit attacks, put a core from the Void to your Reserve.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-022",
    "name": "The SteedGeneral Chilaun",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nWheile your \"Great General\" family Spirit is attacking, the opponent can't activate Bursts with the condition: [Burst Condition] (After an opposing Spirit attacks).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
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
            "text": "Wheile your \"Great General\" family Spirit is attacking, the opponent can't activate Bursts with the condition: [Burst: con] (After an opposing Spirit attacks)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-023",
    "name": "The SteedGeneral Boorchu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWheile your \"Great General\" family Spirit is attacking, the opponent can't activate Bursts with the condition: [Burst Condition] (After your Spirit is Destroyed by the Opponent).",
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
            "rule": "KEYWORD_RULE",
            "text": "Wheile your \"Great General\" family Spirit is attacking, the opponent can't activate Bursts with the condition: [Burst: con] (After your Spirit is Destroyed by the Opponent)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-024",
    "name": "The SteedGeneral Boroqul",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nAll your \"Great General\" family Spirits gain +2000 BP.",
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
          "family": "Great General"
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS18-025",
    "name": "The GreaterIncect Riock",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nCards can't be discarded from either player's deck.\n\n[LV1][LV2] (When Attacks)\nPut a core from the Void to any Spirit you control.",
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
            "text": "Cards can't be discarded from either player's deck."
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
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-026",
    "name": "The BigChief Jamuqa",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Great General\" family Spirit, refresh it.\n\n[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, for each \"Great Generall\" family Spirit you control, exhaust an opposing Spirit.",
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-027",
    "name": "The WingBeast Supa-Ruda",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nBy returning a Green/Blue Cost 5 or more Spirit you control to your deckbottom, summon this Spirit card.\n\n[LV1][LV2] (When Summoned)\nWhen summoned via a Burst effect, exhaust three opposing Spirits. During this turn, Spirits exhausted by this effect can't refresh.",
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
            "count": 3,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-029",
    "name": "Bat-Holliday",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nThis Spirit can't attack.\n\n[LV2][LV3] (Opposing Attack Step)\nThe opponent must attack at least once per turn if possible.",
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
            "text": "This Spirit can't attack."
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
          "oncePerTurn": "opt_1"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "FORCE_ATTACK",
            "text": "The opponent must attack at least once per turn if possible."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-030",
    "name": "Wild-Horn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nPut a core from the Void to any Spirit you control.\n\n[LV2] (When Blocks)\nFor each \"Machine Beast\" family Spirit you control, this Spirit gains +1000 BP.",
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
            "to": "RESERVE",
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
            "op": "BP_BUFF_SELF",
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Machine Beast"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-031",
    "name": "Geronimond",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nCards can't be discarded from either player's deck.\n\n[LV1][LV2] [Heavy Armor: Red/White]\nThis Spirit is unaffected by opposing Red/White Spirit/Brave/Nexus/Magic effects.\n\n[LV2]\nGive all your non-braved Spirits: [Heavy Armor: Red/White].",
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
            "text": "Cards can't be discarded from either player's deck."
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
        "keyword": "Heavy Armor: Red/White"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Heavy Armor: Red/White"
      }
    ]
  },
  {
    "cardNumber": "BS18-033",
    "name": "Outlaw-Kid",
    "cardType": "Spirit",
    "effect": "[LV2] (Opposing Start Step)\nTarget up to two opposing exhausted Spirits. Those targeted Spirit(s) can't refresh during the next (Opposing Refresh Step).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "REFRESH_STEP",
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
    "cardNumber": "BS18-034",
    "name": "Sheriff-Eagle",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nIf this Burst activates when a \"Machine Beast\" family Spirit was destroyed, summon this Spirit card.\n\n[LV2] Flash - (When Blocks)\nBy sending one core from this Spirit to your Trash, send one core from the opposing battling Spirit to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If this Burst activates when a \"Machine Beast\" family Spirit was destroyed, summon this Spirit card."
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
      }
    ]
  },
  {
    "cardNumber": "BS18-035",
    "name": "Buffalong-Bill",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nWhen any opposing Cost 6 or more Spirit attacks, it must target and attack this Spirit.\n\n[LV2][LV3] (When Blocks)\nWhen blocking an opposing Cost 6 or more Spirit, this Spirit gains +10000 BP.",
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
            "rule": "COST_MODIFIER",
            "text": "When any opposing Cost 6 or more Spirit attacks, it must target and attack this Spirit."
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
            "amount": 10000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-036",
    "name": "The HolyGroundGigantBeast Bellroc",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nReturn two opposing Spirits to the Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-037",
    "name": "Homuncu",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS18-038",
    "name": "The Angelia of Grimm Gretel",
    "cardType": "Spirit",
    "effect": "[LV2]\nWhile you control any [The Angelia of Grimm Hansel], when this Spirit is destroyed by the opponent, it can remain on the Field, exhausted.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-039",
    "name": "The Angelia of Grimm Hansel",
    "cardType": "Spirit",
    "effect": "[LV2]\nWhile you control any [The Angelia of Grimm Gratel], when this Spirit is destroyed by the opponent, it can remain on the Field, exhausted.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-040",
    "name": "The Poet Pentan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen cores are increased from the Void due to an opposing Spirit/Nexus effect, you can draw a card for each core increased.\n\n[LV2][LV3] (When Battles)\nOpposing Cost 4 or less Spirits battling with this Spirit are treated as LV1.",
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
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_LEVEL",
            "text": "Opposing Cost 4 or less Spirits battling with this Spirit are treated as LV1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-041",
    "name": "Clock-Lycao",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nWhen core is put on your Life or the opposing Life, refresh this Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "BS18-043",
    "name": "The Creator Grimm-Wilhelm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nThis Spirit and every [The Creator Grimm-Jacob] you control can't be blocked by opposing Cost 0/1/3/5/7 Spirits.\n\n[LV2][LV3]\nThis Spirit and every [The Creator Grimm-Jacob] you control can't be returned from the Field to your Hand by opposing effects.",
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
            "op": "GRANT_UNBLOCKABLE",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-044",
    "name": "The Creator Grimm-Jacob",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nThis Spirit and every [The Creator Grimm-Wilhelm] you control can't be blocked by opposing Cost 0/2/4/6/8 Spirits.\n\n[LV2][LV3]\nWhen this Spirit and every [The Creator Grimm-Wilhelm] you control are destroyed by the opponent, they can remain on the Field, exhausted.",
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
            "op": "GRANT_UNBLOCKABLE",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-045",
    "name": "Doktor-Faust",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nIf a Yellow/White Cost 5 or more Spirit is destroyed when this Burst activates, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nWhen summoned via a Burst effect, you can reveal five cards from your decktop. You can summon a Spirit card among them, without paying the cost. Return the non-summoned and the remaining cards to your deckbottom in any order.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If a Yellow/White Cost 5 or more Spirit is destroyed when this Burst activates, summon this Spirit card."
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
            "rule": "REVEAL_DECKTOP",
            "text": "via a Burst effect, you can reveal five cards from your decktop."
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
    "cardNumber": "BS18-046",
    "name": "Shaggai-Bug",
    "cardType": "Spirit",
    "effect": "[LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your Spirit with two or more symbols, refresh that Spirit you control.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-047",
    "name": "Otherfellom",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player can increase the reduction symbols for cards in their Hand via Spirit/Nexus effects.",
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
      }
    ]
  },
  {
    "cardNumber": "BS18-048",
    "name": "The BraveGeneral Leonidas",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player can increase Hand via Spirit/Brave/Nexus/Magic effects.\n\n[LV1][LV2]\nFor each Nexus you control, this Spirit gains +1000 BP.",
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
            "text": "Neither player can increase Hand via Spirit/Brave/Nexus/Magic effects."
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS18-049",
    "name": "Gladdy-Squalo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS18-050",
    "name": "Augusdos",
    "cardType": "Spirit",
    "effect": "[LV1] (Your Attack Step)\nThis Spirit can't attack.\n\n[LV1][LV2]\nCards can't be discarded from either player's deck.",
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
            "text": "This Spirit can't attack."
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
            "rule": "CONTINUOUS_RULE",
            "text": "Cards can't be discarded from either player's deck."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-051",
    "name": "Meteorite-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-052",
    "name": "The LightningGeneral Hanni-Val",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nEffects of Spirit cards in either player's Hand/Trash can't be activated.\n\n[LV2][LV3] (When Attacks)\nWhen blocked by an opposing Spirit, refresh a \"Supreme Hero\" family Spirit you control.",
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
            "rule": "COMBAT_RESTRICTION",
            "text": "Effects of Spirit cards in either player's Hand/Trash can't be activated."
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
      }
    ]
  },
  {
    "cardNumber": "BS18-053",
    "name": "Tyrantor-Nero",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhile your Spirit with two or more symbols is attacking, the opponent can't use Magic cards from their Hand.",
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
            "text": "While your Spirit with two or more symbols is attacking, the opponent can't use Magic cards from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-054",
    "name": "Dictator-Caesar",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is two or less, summon this Spirit card.\n\n[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, (Opposing Main Step) on the next turn doesn't occur for the opponent.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If your Life is two or less, summon this Spirit card."
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
            "rule": "RESTRICT_MAIN_STEP",
            "text": "When only the opposing Spirit is destroyed by comparing BP, (Opposing Main Step) on the next turn doesn't occur for the opponent."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-055",
    "name": "Drake-Baya",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nReturn a \"Great General\" family Spirit card from your Trash to the Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-056",
    "name": "The HolySwordDragon Ex-Wyvern",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost of 4 or more / Evil Shadow]\n\n[LV1] (When Summoned)\nSend three cores from any opposing Spirits to their Reserve. This effect can't bring the number of cores on opposing Spirits to 0.\n\n[When Braved] (When Brave Attacks)\nYou can target and attack an opposing exhausted Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost of 4 or more / Evil Shadow"
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RESTRICTION",
            "text": "This effect can't bring the number of cores on opposing Spirits to 0."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "You can target and attack an opposing exhausted Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-057",
    "name": "Gearzelle",
    "cardType": "Brave",
    "effect": "[Brave Condition: Two symbols or more]\n\n[LV1] (When Summoned)\nYou can summon a Spirit card with two symbols from your Hand, without paying the cost. However, that Spirit can't activate any (When Summoned) effects.\n\n[When Braved] (When Battles)\nExhaust an opposing Cost 3 or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Two symbols or more"
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
            "rule": "NEGATE_EFFECT",
            "text": "that Spirit can't activate any (When Summoned) effects."
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
    "cardNumber": "BS18-058",
    "name": "Gun-Horse",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 6 or more]\n\n[LV1] (When Summoned)\nReturn an opposing Nexus to the Hand.\n\n[When Braved] (Opposing Attack Step)\nThis Spirit can block opposing Spirits without [Tribute] while exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 6 or more"
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "This Spirit can block opposing Spirits without [Tribute] while exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-059",
    "name": "Zacka-Panzer",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nTreat all the reduction symbols of all Magic cards in your Hand as [Yellow Core].",
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
            "rule": "TREAT_RULE",
            "text": "Treat all the reduction symbols of all Magic cards in your Hand as [Yellow Core]."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-060",
    "name": "Chariot-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nThe cost of cards in either player's Hand becomes Cost 8.",
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
            "rule": "COST_MODIFIER",
            "text": "The cost of cards in either player's Hand becomes Cost 8."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-063",
    "name": "The Spirit Tower in the Sea",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nNeither player can increase cores from the Void via Spirit/Brave effects.\n\n[LV2]\nWhile your Hand is five or less, when your Spirit is destroyed by the opponent, draw a card.",
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
            "text": "Neither player can increase cores from the Void via Spirit/Brave effects."
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
    "cardNumber": "BS18-064",
    "name": "The Twilight Camelot",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Main Step)\nWhen an opposing Spirit is summoned, you can send three cards from your decktop to the Trash.\n\n[LV2] (Your Start Step)\nYou can return a \"Great General\"/\"Evil Shadow\" family Spirit card from your Trash to the Hand.",
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
            "count": 3
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
    "cardNumber": "BS18-067",
    "name": "The Giant Beast Forest",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your \"Giant Beast\"/\"Machine Beast\" family Spirit blocks, put a core from the Void to that Spirit.\n\n[LV2] (Opposing Attack Step)\nAt the start of the step, you can target an opposing Spirit. That Spirit must attack at the start of the step if possible.",
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
            "rule": "TARGET",
            "text": "At the start of the step, you can target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "That Spirit must attack at the start of the step if possible."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-068",
    "name": "The O.K. Corral",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nThe (When Summoned) effects of all Cost 4 or less Spirits/Braves can't activate.\n\n[LV2] (Your Attack Step)\nWhen your Spirits are destroyed by comparing BP, return an opposing Spirit to the Hand.",
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "effects of all Cost 4 or less Spirits/Braves can't activate."
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
    "cardNumber": "BS18-069",
    "name": "The Candy Residence",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Spirit is destroyed by the opponent, once per turn, you can summon a \"Grimm\"-named Spirit card from your Hand, without paying the cost.\n\n[LV2] (Your Attack Step)\nWhen your \"Divine Spirit\" family Spirit is exhausted, draw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "oncePerTurn": "opt_1"
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-073",
    "name": "Heroic Entry",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, the cost of all \"Supreme Hero\" family Spirit cards in your Hand becomes the same as the number of your Life.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "rule": "COST_MODIFIER",
            "text": "During this turn, the cost of all \"Supreme Hero\" family Spirit cards in your Hand becomes the same as the number of your Life."
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
    "cardNumber": "BS18-074",
    "name": "Burst Saviour",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nDestroy any number of opposing Spirits up to a total of 6000 BP. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDraw a card. Then, you can set a Burst card from your Hand.",
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
            "allMatching": true
          }
        ]
      },
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
    "cardNumber": "BS18-075",
    "name": "Mark-of-Zorro",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nDraw a card, and send two cores from any opposing Spirits to their Trash. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nSend a core each from every opposing Cost 5 or less Spirit to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "OPPONENT_SEND_CORES_MIN_ONE",
            "count": 2,
            "to": "TRASH"
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
    "cardNumber": "BS18-076",
    "name": "Crystal Crack",
    "cardType": "Magic",
    "effect": "[Flash]\nSend cores from an opposing Spirit to their Trash until only one core left on it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "TRASH",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-077",
    "name": "Boerte Salkhi",
    "cardType": "Magic",
    "effect": "During (Your End Step), return a [Boerte Salkhi] from your Trash to the Hand. This effect can only be used once per turn.\n\n[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nRefresh a Spirit you control. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS18-078",
    "name": "Thunderstorm",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, for each card in the opposing Hand, give a Spirit you control +1000 BP. Also, while the opponent has six or more cards in their Hand, opposing Burst effects can't activate.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS18-079",
    "name": "Windspout",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nTarget an opposing Spirit. During this turn, that Spirit must attack if possible. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nRefresh a Spirit you control. During this turn, that Spirit gains +2000 BP. The Spirit refreshed by this effect can't attack.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET",
            "text": "Target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "During this turn, that Spirit must attack if possible."
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          },
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
    "cardNumber": "BS18-080",
    "name": "Kidzuna Blade",
    "cardType": "Magic",
    "effect": "[Flash]\nExhaust any number of your non-battling Spirits. During this turn, give a Spirit you control BP+ (Total BP of all the Spirits exhausted by this effect). This effect can't be used during Main Step.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "This effect can't be used during Main Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-081",
    "name": "Verweile",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nYou can activate once and only once the same effect as the (When Summoned) effect of the Spirit/Brave that caused the activation of this Burst, treating as activated by your Spirit. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nTarget an opposing Spirit. During this turn, the targeted Spirit can't attack/block.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "You can activate once and only once the same effect as the (When Summoned) effect of the Spirit/Brave that caused the activation of this Burst, treating as activated by your Spirit."
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
            "rule": "TARGET",
            "text": "Target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this turn, the targeted Spirit can't attack/block."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-082",
    "name": "Panic Voice",
    "cardType": "Magic",
    "effect": "[Flash]\nExhaust an opposing non-attacking Spirit, and block with it. This effect can only be used on the Flash Timing before block during the (Opposing Attack Step).",
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
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "This effect can only be used on the Flash Timing before block during the (Opposing Attack Step)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-084",
    "name": "Dictator Legion",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nPut two cores from the Void to a Nexus you control. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nReveal an opposing set Burst. If that card is a Spirit card, discard it. If not, return it to its original position. This effect can't be used during the Main Step.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
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
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Reveal an opposing set Burst."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "If that card is a Spirit card, discard it."
          },
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RESTRICT_MAIN_STEP",
            "text": "This effect can't be used during the Main Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-X01",
    "name": "The SuperHero Lord-Dragon-Saviour",
    "cardType": "Spirit",
    "effect": "[Burst: tribute] (After your Life is reduced)\nBy sending all cores from a \"Supreme Hero\" family Spirit you control to the Void, summon this card without paying the cost. After this effect resolves, put any number of cores from your Field/Reserve to your Life, until you have at most five Lives.\n\n[LV2][LV3] (When Attacks/Blocks)\nBy sending one of your Lives to this Spirit, during this turn, every Spirit you control gains +5000 BP.\n\n[LV3] (After Your Burst Activates)\nRefresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
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
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
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
            "op": "BP_BUFF_SELF",
            "amount": 5000
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-X02",
    "name": "The KnightsEmperor Avalo-Paladion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can summon any number of \"Supreme Hero\" family Spirit cards from your Trash, without paying the cost. However, those Spirits can't activate any (When Summoned) effects.\n\n[LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your Purple \"Supreme Hero\" family Spirits, send all cores from that destroyed Spirit to the Trash.",
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
    "cardNumber": "BS18-X03",
    "name": "The BlueSkyHero Kung-Wolf",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nIf your Life is at three or less, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nRefresh a \"Blade Beast\" family Spirit you control.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, send an opposing Life to their Reserve, and refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If your Life is at three or less, summon this Spirit card."
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-X04",
    "name": "The GlacialHero Lord-Dragon-Glazar",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf you control any White Spirit, summon this Spirit card.\n\n[LV1][LV2][LV3] [Heavy Armor: ∞]\nThis Spirit is unaffected by opposing Spirit/Brave/Nexus/Magic effects with the same color(s) as the symbols on the opposing Field.\n\n[LV2][LV3] (When Battles)\nWhen this Spirit destroys any opposing Spirit, return to the Hand all opposing Spirits with same family as the destroyed Spirit, except for the destroyed Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If you control any White Spirit, summon this Spirit card."
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
            "rule": "IMMUNITY",
            "text": "This Spirit is unaffected by opposing Spirit/Brave/Nexus/Magic effects with the same color(s) as the symbols on the opposing Field."
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS18-X05",
    "name": "The HolyEvilEmperor Mephisto-Pheles",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nWhen you use a Magic card, after that effect resolves, you can reveal four cards from your decktop. Among them, you can activate the Burst of a card with Burst effect, ignoring the condition. Return the not-activating and remaining cards to your deckbottom in any order.\n\n[LV2][LV3] (Either Attack Step)\nWhen this Spirit is destroyed by the opponent, you can return it to your Hand or decktop.",
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
            "rule": "TRIGGERED_WATCHER",
            "text": "When you use a Magic card"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "REVEAL_DECKTOP",
            "text": "you can reveal four cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Among them, you can activate the Burst of a card with Burst effect, ignoring the condition."
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
    "cardNumber": "BS18-X06",
    "name": "The ChaosEmperor Otherthoth",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each Spirit with two symbols you control, destroy an opposing Spirit with one symbol.\n\n[LV2][LV3] (When Attacks)\nDuring the Flash Timing before block, Cost 4 or more cards in the opposing Hand can't be used.",
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
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "During the Flash Timing before block, Cost 4 or more cards in the opposing Hand can't be used."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "MONK-DRAGON2",
    "name": "Monk-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (After Your Burst Activates) Refresh this Spirit. Also, you can also send a Core from any Spirit you control to this Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "ZOMBIE-SNAKE2",
    "name": "Zombie-Snake",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed) Destroy an opposing \"Ancient Dragon\" family Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  }
];

for (const spec of BS18_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
