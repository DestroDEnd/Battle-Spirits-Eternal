/**
 * engine/cards/sets/bs16_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS16_SAGA_CARDS)
 * Total Cards: 86 (78 Effect, 8 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS16_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A1041",
    "name": "Ginroukaku",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) You can summon a \"Kinkokaku\" from your Trash, without paying the cost.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1048",
    "name": "Kinkokaku",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) You can summon a \"Ginroukaku\" from your Trash, without paying the cost.\n\n[LV1][LV2][LV3] (Your Attack Step) Spirits can't be returned to the Hand.",
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
            1,
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
    "cardNumber": "BATTLE-SPIRITS-A1050",
    "name": "Kouenko",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) For each \"Spiritual Beast\" family Spirit you control, send a core from one opposing Spirit to the Reserve.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14447",
    "name": "Yanadokugar",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) Exhaust an opposing Spirit with 1 core on it.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14568",
    "name": "Zougaomushi",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2575",
    "name": "The Hanged Gogyo Mountain",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed) When deployed from your hand, send cores from 2 opposing Spirits to the Reserve, until only 1 core remains on each Spirit.\n\n[LV2] When your Cost 5 or less Spirits with (When Summoned) effect are destroyed, you can return one of those Spirits to your Hand.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3026",
    "name": "Boatrictor",
    "cardType": "Spirit",
    "effect": "Immortality: Cost 3/4 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 3/4 Spirit is destroyed.\n\n[LV1][LV2] (When Destroyed) Draw 2 cards from your deck.",
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
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4727",
    "name": "Gugalannar",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) Destroy an opposing Cost 3 or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A4978",
    "name": "Humbabar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) For each card in the opposing Hand, this Spirit gets +1000 BP.",
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
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A5088",
    "name": "Illuyankash",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A5283",
    "name": "Kamapagos",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks) You can target and attack an opposing refreshed Spirit.",
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
            "text": "You can target and attack an opposing refreshed Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7140",
    "name": "Piledraco",
    "cardType": "Spirit",
    "effect": "When this Spirit card is discarded from your deck due to opposing Spirit effect, destroy that Spirit. Also, during this turn, cards cannot be discarded from your deck.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "When this Spirit card is discarded from your deck due to opposing Spirit effect, destroy that Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_IMMUNITY",
            "text": "during this turn, cards cannot be discarded from your deck."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7559",
    "name": "Sakebibird",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7821",
    "name": "Shifgator",
    "cardType": "Brave",
    "effect": "[Brave Condition: Supreme Hero/Great General]\n\n[LV1] (When Summoned) Send 1 core each from all opposing Spirits to the Reserve.\n\n[When Braved] (When This Spirit Brave Attacks) Destroy an opposing Spirit with 2 or less cores on it.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Supreme Hero/Great General"
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
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
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
    "cardNumber": "BATTLE-SPIRITS-A7844",
    "name": "Shuddomell",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) You can reveal four cards from your decktop. Among them, add a Nexus card to your Hand. Discard the remaining cards.",
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
            "text": "You can reveal four cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "Among them, add a Nexus card to your Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "Discard the remaining cards."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8167",
    "name": "Tarandows",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS16-001",
    "name": "Nodeppo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) When you have a Burst set, destroy an opposing 3000 BP or less Spirit.",
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
            "maxBp": 3000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-004",
    "name": "Ashigaryu",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS16-005",
    "name": "Goemon-Thief-Dragon",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nIf you control any \"Supreme Hero\"/\"Great General\" family Spirit, summon this Spirit card.\n\n[LV2][LV3] Flash - (Your Attack Step)\nBy discarding a Red card from your Hand, during this battle, the symbol of a \"Supreme Hero\"/\"Great General\" family Spirit you control becomes two Red symbols.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {
          "requireFamilyOnField": {
            "family": "Great General",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If you control any \"Supreme Hero\"/\"Great General\" family Spirit, summon this Spirit card."
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
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "By discarding a Red card from your Hand"
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
    "cardNumber": "BS16-006",
    "name": "Archer-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from Spirits you control to this Spirit.\n\n[LV2][LV3] Flash - (Either Attack Step)\nBy sending two cores from this Spirit to your Trash, destroy an opposing 4000 BP or less Spirit.",
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
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            2,
            3
          ]
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
    "cardNumber": "BS16-007",
    "name": "Ogre-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can reveal three cards from your decktop. Among them, add a card with Burst effect to your Hand. Return any remaining cards to the deckbottom in any order.\n\n[LV2] (Your Attack Step)\nAll your \"Dragon\"-named Spirits gain +2000 BP.",
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
            "text": "You can reveal three cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Among them, add a card with Burst effect to your Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RETURN_REVEALED_BOTTOM",
            "text": "Return any remaining cards to the deckbottom in any order."
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
    "cardNumber": "BS16-008",
    "name": "DarkKnight-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nBy sending a core from your Life to the Void, destroy an opposing 6000 BP or less Spirit.",
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
            "maxBp": 6000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-009",
    "name": "The ReptileMaster Momochidile",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nBesides [The ReptileMaster Momochidile], all your \"Reptile Beast\" family Spirits have their LV1/LV2/LV3 BP become the same as this Spirit's.\n\n[LV2][LV3] (After Your Burst Activates)\nSummon any number of \"Reptile Beast\" family Spirit cards from your Trash, without paying the cost.",
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
            "rule": "GRANT_FAMILY",
            "text": "Besides [The ReptileMaster Momochidile], all your \"Reptile Beast\" family Spirits have their LV1/LV2/LV3 BP become the same as this Spirit's."
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
    "cardNumber": "BS16-013",
    "name": "The DarkKnight Florence",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 4/5] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 4/5 Spirit is destroyed.\n\n[LV1][LV2] (When Summoned)\nWhen summoned via [Immortality], destroy a Brave on an opposing Brave Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 4/5"
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
            "op": "DESTROY_BRAVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-014",
    "name": "Okapien",
    "cardType": "Spirit",
    "effect": "When this Spirit card is discarded from your deck due to the opponent, send an opposing Life to the Void.\n\n[LV1][LV2][LV3] (When Blocks)\nSend two cores from the opposing attacking Spirit to their Reserve.",
    "isVanilla": false,
    "abilities": [
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-015",
    "name": "Kotsugaizi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw until your Hand has three cards.\n\n[LV2] (When Destroyed)\nReturn a \"Great General\"/\"Zombie\" family Spirit card from your Trash to your Hand.",
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
            "op": "SALVAGE_TRASH",
            "count": 1,
            "filter": {
              "type": "Spirit"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-018",
    "name": "Taikotsubo",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nDestroy an exhausted opposing Spirit. After this effect resolves, if this Burst activated when a Purple Spirit was destroyed, summon this Spirit card.\n\n[LV1][LV2][LV3] Flash - (When Battles)\nBy discarding a \"Supreme Hero\"/\"Great General\" family Spirit card from your Hand, destroy an opposing exhausted Cost 6 or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_EXHAUSTED",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "if this Burst activated when a Purple Spirit was destroyed, summon this Spirit card."
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
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "By discarding a \"Supreme Hero\"/\"Great General\" family Spirit card from your Hand"
          },
          {
            "op": "DESTROY_BY_COST",
            "maxCost": 6,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-021",
    "name": "Nouzenserval",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen summoning Spirit cards from your Hand via [High Speed], by exhausting this Spirit, treat up to two costs as being paid from your Reserve.",
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
      }
    ]
  },
  {
    "cardNumber": "BS16-022",
    "name": "Ma-Bachou",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2] (When Summoned)\nWhen summoned during (Either Attack Step), put a core from the Void to your Reserve.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-023",
    "name": "Konohazukuro",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, exhaust an opposing Spirit.",
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
    "cardNumber": "BS16-024",
    "name": "Barbary-Chouhi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nFor each core on this Spirit, it gains +1000 BP.\n\n[LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Supreme Hero\"/\"Great General\" family Spirit, refresh that Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-026",
    "name": "Kumatakanwu",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV2] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, by returning a Spirit you control with [High Speed]/[Violent High Speed] to your Hand, put two cores from the Void to your Reserve.",
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
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-027",
    "name": "Caucasus-Ryohu-Beetle",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nIf the opponent controls any \"Supreme Hero\"/\"Great General\" family Spirit, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Attacks)\nThis Spirit gains +10000 BP.\n\n[LV2][LV3] (When Attacks)\nWhen an opposing Spirit is destroyed, exhaust all opposing Spirits in the same family as that Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If the opponent controls any \"Supreme Hero\"/\"Great General\" family Spirit, summon this Spirit card."
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
            "amount": 10000
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
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-028",
    "name": "Flow-Zacco",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS16-029",
    "name": "Mibrock-Patrol",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Mibrock\"-named Spirit, put a core from the Void to any of your Spirits.",
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
      }
    ]
  },
  {
    "cardNumber": "BS16-030",
    "name": "Serizawand-Duck",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nReturn an opposing Spirit to the Hand.",
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-031",
    "name": "Gilles-de-Rais",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Red/Blue (Opposing Turn)\nWhen the opponent uses a Red/Blue Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2] (When Blocks)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh this Spirit.",
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
    "cardNumber": "BS16-032",
    "name": "La-Hire",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] White/Yellow (Opposing Turn)\nWhen the opponent uses a White/Yellow Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2]\nAll your White Spirits get +1000 BP.",
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
    "cardNumber": "BS16-033",
    "name": "Mibrock-the-One",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon a Brave card from your Hand, without paying the cost.\n\n[When Braved] [LV2][LV3] [Heavy Armor: Red/White/Yellow]\nThis Spirit is unaffected by opposing Red/White/Yellow Spirit/Brave/Nexus/Magic effects.",
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
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "keyword": "Heavy Armor: Red/White/Yellow"
      }
    ]
  },
  {
    "cardNumber": "BS16-036",
    "name": "The IceSaint Jeanne-da-Arc",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV1][LV2][LV3] Red/Purple/Green/White (Opposing Turn)\nWhen the opponent uses a Red/Purple/Green/White Magic effect, by exhausting this Spirit, negate that effect.\n\n[When Braved] [LV2][LV3] (Your Attack Step)\nWhen your Spirit with [Ice Wall] attacks, return to the Hand an opposing Spirit with the same color as that Spirit's [Ice Wall].",
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
    "cardNumber": "BS16-038",
    "name": "ClubSorcerer-Scarecrow",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen your \"Magician\" family Spirit is destroyed by the opponent, draw a card.\n\n[LV2] [Brilliance] (When Attacks)\nAt the end of the battle, return all Magic card you used during this battle to the Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-039",
    "name": "The Angelia of Grimm Rapunzel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe number of cores of all your Spirits can't become less than their Lv1 cost due to the opponent.\n\n[LV2]\nWhen ten or more cards are discarded from your deck at once due to an opposing Spirit effect, return up to five discarded cards to your decktop in any order.",
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
            "text": "The number of cores of all your Spirits can't become less than their Lv1 cost due to the opponent."
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
    "cardNumber": "BS16-040",
    "name": "HeartKnight-Tin",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed)\nFor each \"Magician\" family Spirit you control, draw a card. (Max.4)",
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
            "count": 1,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Magician"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-041",
    "name": "The Angelia of Grimm Redhood",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nThe effects of all opposing LV1 Nexuses can't activate.",
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
            "rule": "NEGATE_EFFECT",
            "text": "The effects of all opposing LV1 Nexuses can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-042",
    "name": "The Angelia of Grimm Cinderella",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf you control any \"Divine Spirit\" family Spirit, summon this Spirit card.\n\n[LV2][LV3] (Your Attack Step)\nWhen the opposing Life is reduced, return a Magic card from your Trash to the Hand.\n\n[LV3] (When Attacks)\nBy discarding one of your Bursts, during this battle, this Spirit can't be blocked.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {
          "requireFamilyOnField": {
            "family": "Divine Spirit",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If you control any \"Divine Spirit\" family Spirit, summon this Spirit card."
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
    "cardNumber": "BS16-043",
    "name": "SpadeBeast-Leo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS16-044",
    "name": "DiamondPrincess-Dorothy",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can reveal six cards from your decktop. Among them, you can summon up to two \"Magician\" family Spirit cards, without paying the cost. However, any (When Summoned) effects of those Spirits can't activate. Discard any remaining cards.\n\n[LV2][LV3] (After Your Burst Activates)\nDraw a card.",
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
            "rule": "DECK_OR_HAND_ACTION",
            "text": "You can reveal six cards from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of those Spirits can't activate."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_REVEALED",
            "text": "Discard any remaining cards."
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
    "cardNumber": "BS16-045",
    "name": "The GreatAngelia of Olimpics Ophiel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nBy discarding one of your Bursts, put cores from the Void to your Life until you have five Life.\n\n[LV3]\nGive all your \"Olimpics\"-named Spirits: \"(When Battles) Treat every opposing Spirit as LV1.\"",
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
            "rule": "KEYWORD_RULE",
            "text": "By discarding one of your Bursts"
          },
          {
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
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
            "rule": "TREAT_RULE",
            "text": "Give all your \"Olimpics\"-named Spirits: \"(When Battles) Treat every opposing Spirit as LV1.\""
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-050",
    "name": "Guymail-Hydra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Main Step)\nWhen the opponent sets a Burst, you can deploy a Nexus card from your Trash, without paying the cost.\n\n[LV2] (Your End Step)\nBy destroying a Nexus you control, put a core from the Void to your Reserve.",
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-052",
    "name": "Enkidu-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, destroy an opposing non-\"Supreme Hero\"/\"Great General\" family Spirit.",
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
            "text": "When only the opposing Spirit is destroyed by comparing BP, destroy an opposing non-\"Supreme Hero\"/\"Great General\" family Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-054",
    "name": "The AncientBeastKing Gilgamesh",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is three or less, summon this Spirit card.\n\n[LV1][LV2][LV3] (When Summoned)\nDestroy an opposing \"Supreme Hero\" family Spirit.\n\n[LV2][LV3] (Your Attack Step)\nWhen your \"Supreme Hero\"/\"Great General\" family Spirit attacks, the opponent can't block unless they send two cores from their Reserve to their Trash.",
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
            "rule": "DESTROY",
            "text": "Destroy an opposing \"Supreme Hero\" family Spirit."
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
            "rule": "MOVE_CORE",
            "text": "When your \"Supreme Hero\"/\"Great General\" family Spirit attacks, the opponent can't block unless they send two cores from their Reserve to their Trash."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-057",
    "name": "Kotetsu-Tiger",
    "cardType": "Brave",
    "effect": "[Brave Condition: A cost of 5 or more]\n\nHigh Speed (Flash) This Brave card may be summoned from your hand during the Flash Step. In that case, the cost of this Brave and cores to be put on this Brave must be paid or moved from your reserve.\n\n[When Braved] (When Battles) When only the opposing Spirit is destroyed by comparing BP, send a core from the opposing life to the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: A cost of 5 or more"
      },
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
            "rule": "KEYWORD_RULE",
            "text": "In that case, the cost of this Brave and cores to be put on this Brave must be paid or moved from your reserve."
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
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
    "cardNumber": "BS16-058",
    "name": "Satellide-Bird",
    "cardType": "Brave",
    "effect": "[Brave Condition: A cost of 5 or more]\n\n[LV1] (When Summoned) During this turn, neither player can summon a Spirit through Burst effects.\n\n[When Braved] Heavy Armor: Red/Green/White- This Spirit is unaffected by opposing Spirit/Brave/Nexus/Magic effects of the listed colors.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: A cost of 5 or more"
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
            "rule": "IMMUNITY",
            "text": "Heavy Armor: Red/Green/White- This Spirit is unaffected by opposing Spirit/Brave/Nexus/Magic effects of the listed colors."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-059",
    "name": "Kaimeiju",
    "cardType": "Brave",
    "effect": "[Brave Condition: A cost of 5 or more]\n\n[When Braved] (When This Spirit Brave Attacks) Target an opposing Spirit. During this battle, that Spirit can't block.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: A cost of 5 or more"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET",
            "text": "(When This Spirit Brave Attacks) Target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this battle, that Spirit can't block."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-060",
    "name": "Technohyude",
    "cardType": "Brave",
    "effect": "[Brave Condition: Supreme Hero/Great General]\n\n[LV1] (When Summoned)\nDiscard five cards from your decktop. Then, you can deploy a Nexus card from your Trash, without paying the cost.\n\n[When Braved] (When Brave Attacks)\nBy destroying a Nexus you control, discard cards from the opposing decktop, equal to the cost of the destroyed Nexus.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Supreme Hero/Great General"
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
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_NEXUS",
            "count": 1
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
    "cardNumber": "BS16-061",
    "name": "The Dark Clowdy Ogre Island",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you would destroy opposing Spirits via your Spirit/Magic effects, increase the BP of Spirits that can be destroyed by that effect by +1000 BP.\n\n[LV2]\nWhen your \"Dragon Warrior\" family Spirit attacks, you can target and attack an opposing Spirit.",
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
            "op": "PASSIVE_RULE",
            "rule": "TARGET_ATTACK",
            "text": "When your \"Dragon Warrior\" family Spirit attacks, you can target and attack an opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-062",
    "name": "The Grand Sight Gate",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed)\nWhen deployed from the Hand, destroy an opposing 5000 BP or less Spirit.\n\n[LV2] (Your Draw Step)\nIncrease the number of cards your draw by +1.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
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
    "cardNumber": "BS16-065",
    "name": "The Peach Garden of Oath",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen summoning Spirit cards from your Hand via [High Speed], you can also use the cores from the Field to pay for the summon cost and put onto the Spirit.\n\n[LV2]\nGive all your [The RetsuHero Seiryubi]/[Kumatakanwu]/[Barbary-Chouhi]: \"(When Battles) The opponent can't activate their Burst.\"",
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
        "overall": "WHEN_BATTLES",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Give all your [The RetsuHero Seiryubi]/[Kumatakanwu]/[Barbary-Chouhi]: \"(When Battles) The opponent can't activate their Burst.\""
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-066",
    "name": "The Flying Barrier",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed)\nWhen deployed from the Hand, exhaust two opposing Spirits.\n\n[LV2] (Your End Step)\nBy returning a Spirit with [High Speed] you control to the Hand, put a core from the Void to your Reserve.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 2,
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-067",
    "name": "The Tower of Ice Saint",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive all your \"Supreme Hero\"/\"Great General\" family Spirits: \"Purple/Yellow/Blue (Opposing Turn) When the opponent uses a Purple/Yellow/Blue Magic effect, by exhausting this Spirit, negate that effect.\"\n\n[LV2] (Opposing Main Step)\nUnless the opponent sends two cores from their Reserve to their Trash, they can't set Bursts.",
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
            "text": "Unless the opponent sends two cores from their Reserve to their Trash, they can't set Bursts."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-068",
    "name": "The Stairway Mountains",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed)\nWhen deployed from the Hand, at the end of this turn, refresh all your Spirits.\n\n[LV2] (Your Main Step)\nWhen you're summoning a Spirit card/Brave card, this Nexus' symbol becomes three White symbols.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {}
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
            "rule": "SET_SYMBOL",
            "text": "When you're summoning a Spirit card/Brave card, this Nexus' symbol becomes three White symbols."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-069",
    "name": "The Seven Bridge",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Draw Step)\nAt the start of the step, by discarding a Yellow Spirit card from your Hand, increase the number of cards your draw by +1.\n\n[LV2]\nWhen your \"Magician\" family Spirits are destroyed, you can return one of those destroyed Spirits to your decktop.",
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
            "text": "At the start of the step, by discarding a Yellow Spirit card from your Hand, increase the number of cards your draw by +1."
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
    "cardNumber": "BS16-073",
    "name": "Aggressive Rage",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give a Spirit you control: \"[Clash] (When Attacks) The opponent must block if possible.\"",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS16-074",
    "name": "Explosion Sword",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDraw a card, and destroy an opposing 6000 BP or less Spirit. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, give a \"Supreme Hero\" family Spirit you control: \"(When Attacks) When only the opposing Spirit is destroyed by comparing BP, send cores from the opposing Life to their Reserve equal to the number of symbols on this Spirit.\"",
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
            "maxBp": 6000,
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-075",
    "name": "Scapegoat",
    "cardType": "Magic",
    "effect": "[Flash]\nSummon a Purple Spirit card from your Trash, without paying the cost. However, any (When Summoned) effects can't activate. At the end of the battle, destroy the Spirit summoned via this effect. This effect can only be used during (Opposing Turn).",
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
    "cardNumber": "BS16-076",
    "name": "Beat Burst",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nSend cores from an opposing Spirit to their Reserve until one core remains. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy an opposing Brave Spirit. Or, destroy a Brave on an opposing Brave Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "RESERVE",
            "allMatching": false
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BRAVE",
            "count": 1
          },
          {
            "op": "DESTROY_BRAVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-077",
    "name": "Toughness Recovery",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give a Spirit +2000 BP. Then, if the target has 10000 BP or more, refresh that target.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS16-078",
    "name": "Descent Burst",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is at two or less, summon a Green Spirit card from your Hand. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, all your Spirits gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-079",
    "name": "Moonbow Cloak",
    "cardType": "Magic",
    "effect": "[Main]\nTarget a Spirit with [Ice Wall] you control. During this turn, the targeted Spirit can't be blocked by opposing Spirits with the same color as its [Ice Wall].\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
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
    "cardNumber": "BS16-080",
    "name": "Dimension Sword",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nReturn an opposing Spirit to the Hand. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy an opposing Spirit that reduced your Life during this battle. Or, destroy an opposing Spirit that reduced your Life when this Burst activates.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit that reduced your Life during this battle."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "destroy an opposing Spirit that reduced your Life when this Burst activates."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-081",
    "name": "Magic-of-Oz",
    "cardType": "Magic",
    "effect": "[Main]\nBy discarding your entire Hand, draw three cards.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
    "cardNumber": "BS16-082",
    "name": "Magia Geflüster",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nTarget a family. Refresh all your Spirits in the targeted family. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, when resolving battles, compare the levels instead of BP. The Spirit with the lower level is destroyed. If both Spirits have the same level, both are destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COMPARE_LV_INSTEAD_OF_BP",
            "text": "During this turn, when resolving battles, compare the levels instead of BP."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMPARE_LV_INSTEAD_OF_BP",
            "text": "The Spirit with the lower level is destroyed."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMPARE_LV_INSTEAD_OF_BP",
            "text": "If both Spirits have the same level, both are destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-083",
    "name": "Clash-the-Babylon",
    "cardType": "Magic",
    "effect": "[Burst: After Your Spirit is Destroyed by the Opponent]\nDestroy any number of opposing Spirits up to a total cost of the Spirit you control which was destroyed when this Burst activated. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDuring this turn, give all your \"Supreme Hero\"/\"Great General\" family Spirits +4000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy any number of opposing Spirits up to a total cost of the Spirit you control which was destroyed when this Burst activated."
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
            "op": "BP_BUFF_ALLIES",
            "amount": 4000,
            "filter": {
              "family": "Supreme Hero"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-084",
    "name": "Exhausted Guard",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all your Spirits with two or more symbols can block while exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "EXHAUSTED_BLOCK",
            "text": "During this turn, all your Spirits with two or more symbols can block while exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-X01",
    "name": "The ExplosionHero Lord-Dragon-Bazzel",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this card without paying the cost.\n\n[LV2][LV3] (When Attacks)\nYou can reveal one of your Bursts. If that card's Burst condition is [Burst Condition] (After an opposing Spirit/Brave's (When Summoned) effect resolves), activate it. If it is of other conditions, return it to the deckbottom.\n\n[LV3] (After Your Burst Activates)\nRefresh this Spirit.",
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
        "overall": "BURST",
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
            "text": "You can reveal one of your Bursts."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ACTIVATE_BURST",
            "text": "If that card's Burst condition is [Burst: con] (After an opposing Spirit/Brave's (When Summoned) effect resolves), activate it."
          },
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-X02",
    "name": "Gyukotsumaou",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nFor each \"Supreme Hero\"/\"Great General\" family Spirit you control, send a core from any opposing Spirits to their Reserve.\n\n[LV2][LV3] (When Destroyed)\nBy discarding a card from your Hand, this Spirit remains on your Field, exhausted.",
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
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2,
            3
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
            "text": "By discarding a card from your Hand"
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
    "cardNumber": "BS16-X03",
    "name": "The RetsuHero Seiryubi",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is at three or less, summon this Spirit card.\n\nFlash- [Violent High Speed] (Either Attack Step)\nWhen there are five or more cores in your Trash, by putting all cores from your Trash to your Field/Reserve in any way you like, summon this Spirit card from your Hand, without paying the cost.",
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
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When there are five or more cores in your Trash, by putting all cores from your Trash to your Field/Reserve in any way you like, summon this Spirit card from your Hand, without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-X04",
    "name": "The CharismaHero Mibrock-Braver",
    "cardType": "Spirit",
    "effect": "<nowiki>[ </nowiki>Burst: After your Spirit is destroyed by the opponent<nowiki> ]</nowiki>\nIf this Burst activated when a White Spirit is destroyed, summon this Spirit card.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nAt the end of the step, if the opponent did not attack at least once during this turn, send an opposing Life to the Reserve. This effect cannot bring the opposing Life to zero. This effect can only be used once per turn.\n\n[When Braved] [LV2][LV3] (Opposing Attack Step)\nWhen the number of cards in the opposing Hand is increased, discard an opposing Burst.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "<nowiki>[ </nowiki>Burst: After your Spirit is destroyed by the opponent<nowiki> ]</nowiki>"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If this Burst activated when a White Spirit is destroyed, summon this Spirit card."
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
          },
          {
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
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
            "rule": "DISCARD_BURST",
            "text": "When the number of cards in the opposing Hand is increased, discard an opposing Burst."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-X05",
    "name": "Arcanamaster-Oz",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nIf you control six or more \"Magician\" family Spirits, return every opposing Spirit to the decktop in any order.\n\n[LV2][LV3]\nWhen this Spirit is destroyed by the opponent, you can summon up to three Yellow Spirit cards, besides [Arcanamaster-Oz], from your Hand/Trash, without paying the cost. However, any (When Summoned) effects of the Spirits can't activate.",
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
          "turn": "YOUR",
          "requireFamilyOnField": {
            "family": "Magician",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of the Spirits can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS16-X06",
    "name": "The MountainsDragon Yamatanohydra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Assault: 8] (When Attacks)\nThis Spirit can, up to eight times per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV2][LV3] (When Attacks)\nAt the end of battle, you can deploy a Nexus card from your Trash, without paying the cost.\n\n[LV3] (When Attacks)\nThe opponent can't use Magic cards.",
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
            "maxTimes": 8
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
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
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "The opponent can't use Magic cards."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SILVER-RIME",
    "name": "The FrostedTreeDragon Silver-Rime",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "THE-GUARDMAN",
    "name": "The Guardman Pug",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] When your Nexuses are destroyed, by sending a core from this Spirit to your Trash, one of the Nexuses destroyed remains on your field in the same state.",
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
            "text": "[LV2][LV3] When your Nexuses are destroyed, by sending a core from this Spirit to your Trash, one of the Nexuses destroyed remains on your field in the same state."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-ISLAND",
    "name": "The Island of Ocean Master",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Destroyed) You can deploy a Nexus card from your Trash, without paying the cost.\n\n[LV2] (Either Attack Step) Treat all your \"Ocean Emperor\" family Spirits as being 1 Lv higher.",
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
            "text": "[LV2] (Either Attack Step) Treat all your \"Ocean Emperor\" family Spirits as being 1 Lv higher."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-KINGDOM",
    "name": "The Kingdom between Two Rivers",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed) When deployed from your Hand, you can target a Nexus you control. Destroy an opposing Spirit with the same cost as that Nexus.\n\n[LV2] (Either Attack Step) All Spirits can't be refreshed by Nexus/Magic effects.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "[LV1][LV2] (When Deployed) When deployed from your Hand, you can target a Nexus you control. Destroy an opposing Spirit with the same cost as that Nexus."
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
            "text": "[LV2] (Either Attack Step) All Spirits can't be refreshed by Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-SOUL",
    "name": "The Soul Fishing Place",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] While you have a Burst set, this Nexus gains one extra Purple symbol.\n\n[LV2] (Your End Step) By discarding a \"Zombie\" family Spirit card from your Hand, draw 1 card from your deck.",
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
            "text": "[LV1][LV2] While you have a Burst set, this Nexus gains one extra Purple symbol."
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-URTEXT",
    "name": "The Urtext of Creativity",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed) When deployed from your Hand, return a Yellow Magic card from your Trash to your Hand.\n\n[LV2] When your Burst activates, if that Burst is a Magic card, you can activate its Main/Flash effect without paying the cost.",
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
            "op": "SALVAGE_TRASH",
            "count": 1,
            "filter": {
              "type": "Magic",
              "color": "Yellow"
            }
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
            "text": "[LV2] When your Burst activates, if that Burst is a Magic card, you can activate its Main/Flash effect without paying the cost."
          }
        ]
      }
    ]
  }
];

for (const spec of BS16_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
