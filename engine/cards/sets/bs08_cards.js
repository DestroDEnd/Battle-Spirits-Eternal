/**
 * engine/cards/sets/bs08_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS08_SAGA_CARDS)
 * Total Cards: 87 (81 Effect, 6 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS08_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10325",
    "name": "The Gogyo Temple",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) When an opposing Cost 3 or less Spirit attacks, put a core from the Void to a \"Beast Head\" family Spirit you control.\n\n[LV2] (Either Attack Step) All your \"Beast Head\" family Spirits are treated as being on their highest level.",
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "All your \"Beast Head\" family Spirits are treated as being on their highest level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12069",
    "name": "The Sacred Totem Pole",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step) The number of cores on every Spirit cannot become less than their LV1 cost.\n\n[LV2] (Opposing Attack Step) When your life is reduced, you can summon a Spirit card with Tribute from your Hand, without using Tribute. However, any (When Summoned) effect cannot activate.",
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
            "text": "The number of cores on every Spirit cannot become less than their LV1 cost."
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RESTRICTION",
            "text": "any (When Summoned) effect cannot activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13946",
    "name": "Turn Inferno",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Return one Tribute Summon Spirit from your Trash to your hand.\n\n(Flash Step) For the duration of this turn, one of your Spirits gains +2000BP.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14260",
    "name": "Victim",
    "cardType": "Magic",
    "effect": "Main - During this turn, when paying the cost for one Spirit card, you can discard cards from your Hand to pay the entire cost, or part of it, each card discarded paying for one cost.\n\nFlash - During this turn, one Spirit gains +2000 BP.",
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
            "rule": "DISCARD_HAND",
            "text": "During this turn, when paying the cost for one Spirit card, you can discard cards from your Hand to pay the entire cost, or part of it, each card discarded paying for one cost."
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
    "cardNumber": "BATTLE-SPIRITS-A2748",
    "name": "Ambush Blocker",
    "cardType": "Magic",
    "effect": "Flash- During this turn, opposing Cost 3 or less Spirits must attack if possible.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "During this turn, opposing Cost 3 or less Spirits must attack if possible."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3041",
    "name": "Bokrugar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) When your opponent has 6 or more cards in his/her hand, he/she must discard those cards until he/she has only three remaining.",
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
            "rule": "DISCARD_HAND",
            "text": "When your opponent has 6 or more cards in his/her hand, he/she must discard those cards until he/she has only three remaining."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3051",
    "name": "BlackUgarurum",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step) When this Spirit becomes the target of Tribute, by exhausting this Spirit, summon without using Tribute.\n\n[LV2] (Opposing Attack Step) While the opponent has five or more cards in the Hand, all your Spirits gain +3000 BP.",
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
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3291",
    "name": "Cat's Eye",
    "cardType": "Magic",
    "effect": "Main- During this turn, treat an opposing Spirit as being Level 1.\n\nFlash- During this turn, give a Spirit +2000 BP.",
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
            "text": "During this turn, treat an opposing Spirit as being Level 1."
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
    "cardNumber": "BATTLE-SPIRITS-A3577",
    "name": "DarkAnkillersaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Phase) When this Spirit is sacrificed for a Tribute Summon, you can instead exhaust this Spirit to bring the Tribute Summon Spirit to the Field without paying its Tribute Cost.\n\n[LV2][LV3] (During Your Opponent's Turn) When your opponent draws a card at any time other than his/her Draw Phase, destroy an opposing Spirit with 4000BP or less.",
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
    "cardNumber": "BATTLE-SPIRITS-A3579",
    "name": "DarkChunpopo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step) When this Spirit becomes the target of Tribute, by exhausting this Spirit, you can summon without Tribute.\n\n[LV2] (Opposing Attack Step) While you control fewer Spirits than the opponent does, every \"Imaginary Beast\" family Spirit you control is treated as being on its highest Level.",
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
          ],
          "requireFamilyOnField": {
            "family": "Imaginary Beast",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "While you control fewer Spirits than the opponent does, every \"Imaginary Beast\" family Spirit you control is treated as being on its highest Level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3592",
    "name": "Dark Power",
    "cardType": "Magic",
    "effect": "Flash- During this turn, for each exhausted Spirit you control, all \"Dark\"/\"Black\"-named Spirits you control gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {
              "family": "Dark"
            },
            "scaleBy": {
              "type": "FAMILY",
              "family": "Dark"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3765",
    "name": "Destruction Barrier",
    "cardType": "Magic",
    "effect": "Flash- During this turn, when the attack of an opposing Spirit without Tribute reduces your life, destroy that Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "During this turn, when the attack of an opposing Spirit without Tribute reduces your life, destroy that Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3823",
    "name": "Dinonychusaw",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3956",
    "name": "Emeantman",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Put a core from the Void to your Reserve.",
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
    "cardNumber": "BATTLE-SPIRITS-A4717",
    "name": "Grow Up",
    "cardType": "Magic",
    "effect": "Main- During this turn, increase the cost of a Spirit you control by +3.\n\nFlash- During this turn, give a Spirit +2000 BP.",
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
            "text": "During this turn, increase the cost of a Spirit you control by +3."
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
    "cardNumber": "BATTLE-SPIRITS-A6018",
    "name": "Kikimora",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6591",
    "name": "Mangoose",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Main Step) For each card the opponent draws, refresh a \"Blade Beast\" family Spirit you control.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7890",
    "name": "Sniping Blast",
    "cardType": "Magic",
    "effect": "Main - During this turn, give all your Spirits with Windstorm +2000 BP for each specified number on that Spirit's Windstorm effect.\n\nFlash - During this turn, give a Spirit +2000 BP.",
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
            "amount": 2000,
            "filter": {}
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
    "cardNumber": "BATTLE-SPIRITS-A8419",
    "name": "The Anthill of the Earth",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) When an opposing 6000 BP or less Spirit attacks, put a core from the Void to a \"Shell Insect\"/\"Shellman\" family Spirit you control.\n\n[LV2] (Your End Step) Refresh every \"Shell Insect\"/\"Shellman\" family Spirit you control.",
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
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8643",
    "name": "The BattleBeast Babyrouza",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8679",
    "name": "The BeastPriest Ganes",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step) When this Spirit becomes the target of Tribute, put three cores from the Void to one of your Nexuses.",
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
            "text": "When this Spirit becomes the target of Tribute, put three cores from the Void to one of your Nexuses."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9746",
    "name": "The FallenAngelia Mikafar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Discard any number of cards from your Hand. For each card you discarded, draw a card.\n\n[LV2][LV3] (When Attacks) You can use a Yellow Magic card from your Trash as if it was from your Hand.\n\n[LV3] (Either Attack Step) When a Magic effect is used, draw a card.",
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
            2,
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CAST_FROM_TRASH",
            "text": "You can use a Yellow Magic card from your Trash as if it was from your Hand."
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-004",
    "name": "The Dinoman Tyrannoid",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile you control two or fewer Spirits, treat this Spirit as being on LV3.",
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
            "text": "While you control two or fewer Spirits, treat this Spirit as being on LV3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-005",
    "name": "The BraveGeneral Catapuldos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can reveal two cards from your decktop. Among them, add a \"Vanity Deity\"/\"Deified General\" family Spirit card to the Hand. Return any remaining cards to the deckbottom in any order.\n\n[LV2][LV3] [Clash] (When Attacks)\nThe opponent must block with their Spirits if possible. However, Ultimates don't have to block.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "You can reveal two cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "Among them, add a \"Vanity Deity\"/\"Deified General\" family Spirit card to the Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RETURN_REVEALED_BOTTOM",
            "text": "Return any remaining cards to the deckbottom in any order."
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
      }
    ]
  },
  {
    "cardNumber": "BS08-006",
    "name": "The ThunderDragonRider Rayblitz",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step)\nOnce per turn, you can summon a Spirit card with [Tribute] from your Hand without using [Tribute]. However, any (When Summoned) effects of the Spirit can't activate.\n\n[LV2] (Your Attack Step)\nTreat all your \"Dragon Emperor\"/ \"Dragon Knight\" family Spirits as being on their highest Levels.",
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
            "text": "any (When Summoned) effects of the Spirit can't activate."
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
            "text": "Treat all your \"Dragon Emperor\"/ \"Dragon Knight\" family Spirits as being on their highest Levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-007",
    "name": "The PyroclasticDragon Prometeors",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 1 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 1 or more Spirits to the Trash.\n\n[LV1][LV2] (When Summoned)\nDestroy every opposing 5000 BP or less Spirits with (When Summoned) effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 1 or more Spirits to the Trash."
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
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-008",
    "name": "The BlackEmperorDragon Darkwurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV2][LV3] (Your Attack Step)\nGive all your \"Astral Dragon\" family Spirits +3000 BP and [Clash].",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          },
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 3000,
            "filter": {
              "family": "Astral Dragon"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-009",
    "name": "The FieldMarshalEmperor Dragron",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash.\n\n[LV1][LV2] (When Summoned)\nDestroy all Spirits with [High Speed]. When the [Tribute] was a \"Dragon\" family Spirit, also, look at the entire opposing Hand, and discard a Spirit card among them.\n\n[LV2] [Clash] (When Attacks)\nThe opponent must block if possible.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash."
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
            "op": "LOOK_OPPONENT_HAND_DISCARD",
            "count": 1,
            "filter": {
              "type": "Spirit"
            }
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
    "cardNumber": "BS08-010",
    "name": "Demo-Bone",
    "cardType": "Spirit",
    "effect": "[LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-011",
    "name": "The HellWolf Armon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS08-012",
    "name": "The DarkSkulldemon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, you can summon without [Tribute].\n\n[LV2][LV3] (Opposing Attack Step)\nWhen an opposing 6000 BP or less Spirit attacks, the opponent sends a core from any of their Spirits to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_TRIBUTED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "turn": "YOUR"
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
    "cardNumber": "BS08-013",
    "name": "Andrealphas",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your End Step)\nYou can summon a \"Braver\"-named Spirit card from your Trash.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-014",
    "name": "The HellGeneral Amaimon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nYou can discard cards from your decktop until a \"Vanity Deity\" family Spirit card is discarded (Max. 6). Then, return that Spirit cards from the Trash to the Hand.",
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
    "cardNumber": "BS08-015",
    "name": "The DarkDragonRider Sabna-Rook",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nOnce per turn, you can summon a Spirit card with [Tribute] from your Hand without using [Tribute]. However, any (When Summoned) effects of the Spirit can't activate.\n\n[LV2][LV3] (Your Attack Step)\nWhen your \"Dragon Emperor\" family Spirit attacks, send one core each from every opposing Spirit without [Tribute] to their Reserve.",
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
            "text": "any (When Summoned) effects of the Spirit can't activate."
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
    "cardNumber": "BS08-016",
    "name": "The HellSerpentineMan Botis",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 1 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 1 or more Spirits to the Trash.\n\n[LV1][LV2][LV3] (When Summoned)\nDraw a card. When an \"Infernal Lord\" family Spirit was used for [Tribute], instead, draw three cards.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 1 or more Spirits to the Trash."
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
    "cardNumber": "BS08-017",
    "name": "The SkeletonSnake Skullpione",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Main Step)\nBesides via Spirit/Nexus/Magic effects, exhaust all Spirits who have their number of cores increased.\n\n[LV2][LV3] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, the opponent discards a card from their Hand.",
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
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When this Spirit's attack reduces the opposing Life, the opponent discards a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-018",
    "name": "The SupremeDarkKnight Schwart",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash.\n\n[LV1][LV2][LV3] (When Summoned)\nReturn an \"Evil Shadow\" family Spirit card from your Trash to the Hand.\n\n[LV2][LV3] (When Attacks)\nDestroy all opposing exhausted Cost 4 or less Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash."
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
      }
    ]
  },
  {
    "cardNumber": "BS08-020",
    "name": "Dio-Mantis",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS08-021",
    "name": "BlackAmenborg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, you can summon without using [Tribute].\n\n[LV2] (Opposing Attack Step)\nWhen an opposing 6000 BP or less Spirit attacks, the opponent exhausts a Spirit they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_TRIBUTED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
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
    "cardNumber": "BS08-023",
    "name": "The AirCommodore Geran",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts one Spirit they control.\n\n[LV2]\nIncrease the number of targets specified by the [Windstorm] of your Spirits by +1.",
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
            "op": "PASSIVE_RULE",
            "rule": "ENHANCE_KEYWORD",
            "text": "Increase the number of targets specified by the [Windstorm] of your Spirits by +1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-024",
    "name": "The GroundDragonRider Vespeniar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step)\nOnce per turn, you can summon a Spirit card with [Tribute] from your Hand without using [Tribute]. However, any (When Summoned) effects of the Spirit can't activate.\n\n[LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Dragon Emperor\" family Spirit, send a core from the opposing Life to their Reserve.",
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
            "text": "any (When Summoned) effects of the Spirit can't activate."
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
    "cardNumber": "BS08-025",
    "name": "The Queen Antreine",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 1 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from a Cost 1 or more Spirit you control to the Trash.\n\n[LV1][LV2] (When Summoned)\nPut two cores from the Void to your Reserve. If an \"Antman\"-named Spirit was the Tribute, put four cores instead.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from a Cost 1 or more Spirit you control to the Trash."
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
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-026",
    "name": "The HeavyArmoredBug Goliearth",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Battles)\nWhen only the opposing Spirit is destroyed via BP comparison, refresh this Spirit.\n\n[LV2] (When Battles)\nPut a core from the Void to your Reserve.",
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
            "op": "REFRESH_SPIRITS",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-027",
    "name": "The ShiningWings JewelgΣ",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash.\n\n[LV1][LV2] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts two Spirits they control.\n\n[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, send a core from the opposing Life to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash."
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
    "cardNumber": "BS08-028",
    "name": "Lampsquid",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS08-029",
    "name": "The Narwhal Monokerock",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Armor: Purple/White/Blue]\nThis Spirit is unaffected by opposing Purple/White/Blue Spirit/Nexus/Magic effects.\n\n[LV2][LV3] (Opposing Attack Step)\nThis Spirit can block opposing Spirits without [Tribute] while exhausted.",
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
        "keyword": "Armor: Purple/White/Blue"
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
            "text": "This Spirit can block opposing Spirits without [Tribute] while exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-030",
    "name": "The Artifact Fjalar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Armor: Red/Green]\nThis Spirit is unaffected by opposing Red/Green Spirit/Nexus/Magic effects.\n\n[LV1][LV2][LV3] Flash -\nBy exhausting this Spirit, during this turn, give an \"Armed Machine\" family Spirit you control + (this Spirit's) BP.",
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
        "keyword": "Armor: Red/Green"
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
        "subCost": {
          "type": "EXHAUST_SELF"
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "GRANT_FAMILY",
            "text": "during this turn, give an \"Armed Machine\" family Spirit you control + (this Spirit's) BP."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-031",
    "name": "The HellSacred Gungnir",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nWhen summoning a Spirit card with [Tribute], this Spirit's cost gets +3.",
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
            "rule": "BP_BUFF",
            "text": "When summoning a Spirit card with [Tribute], this Spirit's cost gets +3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-032",
    "name": "The ResourcefulGeneral Gondlir",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Red (Opposing Turn)\nWhen the opponent uses any Red Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2]\nGive all your Spirits with [Ice Wall]: \"[Armor: Purple/White] This Spirit is unaffected by effects of opposing Purple/White Spirit/Nexus/Magic effects.\"",
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
    "cardNumber": "BS08-033",
    "name": "The GuardianBeast Snopard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player's Life can be reduced by the attacks of Cost 3/4 Spirits without [Tribute].\n\n[LV2] [Armor: Purple/Blue]\nThis Spirit is unaffected by opposing Purple/Blue Spirit/Nexus/Magic effects.",
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
            "text": "Neither player's Life can be reduced by the attacks of Cost 3/4 Spirits without [Tribute]."
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
        "keyword": "Armor: Purple/Blue"
      }
    ]
  },
  {
    "cardNumber": "BS08-034",
    "name": "The SkyDragonRider Platinam",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nOnce per turn, you can summon a Spirit card with [Tribute] from your Hand without using [Tribute]. However, any (When Summoned) effects of the Spirit can't activate.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nWhen not blocked, if the opposing Spirit's BP is equal or inferior to this Spirit's, your Life can't be reduced by that Spirit's attack.",
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
            "text": "any (When Summoned) effects of the Spirit can't activate."
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
            "text": "When not blocked, if the opposing Spirit's BP is equal or inferior to this Spirit's, your Life can't be reduced by that Spirit's attack."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-035",
    "name": "The ArtifactBeast Sai-Drigan",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all core from a Cost 3 or more Spirit you control to the Trash.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nAt the start of the step, you can target an opposing Spirit. That Spirit must attack at the start of the step if possible.\n\n[LV2][LV3] (When Battles)\nReturn an opposing Spirit without [Tribute] to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from a Cost 3 or more Spirit you control to the Trash."
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
            "rule": "TARGET",
            "text": "At the start of the step, you can target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "That Spirit must attack at the start of the step if possible."
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
    "cardNumber": "BS08-036",
    "name": "The MachineDeity Inphenit-Wols",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Purple/White/Yellow/Blue (Opposing Turn)\nWhen the opponent uses any Purple/White/Yellow/Blue Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2][LV3] (Opposing Attack Step)\nThis Spirit can block opposing Spirits while exhausted.\n\n[LV3] (When Blocks)\nWhen only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Trash.",
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
            "text": "This Spirit can block opposing Spirits while exhausted."
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-038",
    "name": "The CatGirl Annie",
    "cardType": "Spirit",
    "effect": "(Opposing Attack Step)\nWhen your Life is reduced, you can summon this Spirit card from your Hand, without paying the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When your Life is reduced, you can summon this Spirit card from your Hand, without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-040",
    "name": "The Angelia Olifia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nWhen this Spirit becomes the target of [Tribute], put a core from the Void to your Life.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_TRIBUTED",
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
    "cardNumber": "BS08-041",
    "name": "The DogGeneral Cu-Sith",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put one core from the Void to your Life.\n\n[LV2][LV3] (Your Attack Step)\nAll your Spirits with [Holy Life] can't be blocked by opposing LV2/LV3 Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-042",
    "name": "The Angelia Salaty",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.\n\n[LV3] [Brilliance] (When Attacks)\nAt the end of battle, return all Magic cards you used during this battle to your Hand.",
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-043",
    "name": "The LightDragonRider Arcanajoker",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nOnce per turn, you can summon a Spirit card with [Tribute] from your Hand without using [Tribute]. However, any (When Summoned) effects of the Spirit can't activate.\n\n[LV3] (Your Attack Step)\nAll your \"Dragon Emperor\" family Spirits can't be blocked by opposing Spirits without [Tribute].",
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
            "text": "any (When Summoned) effects of the Spirit can't activate."
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-044",
    "name": "ArcanaQueen-Pallas",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 1 or more → Trash]\nAfter paying for the summoning cost, you must send all core from a Cost 1 or more Spirit you control to the Trash.\n\n[LV1][LV2] (When Summoned)\nReturn three \"Arcana\"-named Spirit cards from your Trash to the Hand.\n\n[LV2]\nFor each \"Arcana\"-named Spirit you control, this Spirit gains +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from a Cost 1 or more Spirit you control to the Trash."
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
    "cardNumber": "BS08-045",
    "name": "The Braver Phoenixpentan",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash.\n\n[LV2][LV3] (When Attacks)\nBy returning a \"Pentan\"-named Spirit you control to the decktop, this Spirit refreshes.\n\n[LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash."
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
            "count": 1
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
    "cardNumber": "BS08-047",
    "name": "The PigMan Chohakkai",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nNeither player can draw outside Draw Step.",
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
      }
    ]
  },
  {
    "cardNumber": "BS08-051",
    "name": "The VeteranGeneral Dogu-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nYou can reveal one card from your decktop for each Nexus you control. If there is any \"Vanity Deity\"/\"Deified General\" family Spirit card among them, add one to the Hand. Return any remaining cards to the deckbottom in any order.\n\n[LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "text": "You can reveal one card from your decktop for each Nexus you control."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If there is any \"Vanity Deity\"/\"Deified General\" family Spirit card among them, add one to the Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RETURN_REVEALED_BOTTOM",
            "text": "Return any remaining cards to the deckbottom in any order."
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-052",
    "name": "The SeaDragonRider Vang-Tholomew",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step)\nOnce per turn, you can summon a Spirit card with [Tribute] from your Hand without using [Tribute]. However, any (When Summoned) effects of the Spirit can't activate.\n\n[LV1][LV2] (Your Attack Step)\nWhen your \"Dragon Emperor\" family Spirit attacks, you can destroy any number of opposing Spirits up to a total cost of 4.",
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
            "text": "any (When Summoned) effects of the Spirit can't activate."
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
            "rule": "DESTROY",
            "text": "When your \"Dragon Emperor\" family Spirit attacks, you can destroy any number of opposing Spirits up to a total cost of 4."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-053",
    "name": "The ReverieBonze Sanzorl",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 1 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 1 or more Spirits to the Trash.\n\n[LV1][LV2][LV3] (When Summoned)\nReturn [The ApeMan Mongoku], [The PigMan Chohakkai] and [The SharkMan Sangojaw], one of each, from your Trash to the Hand.\n\n[LV2][LV3]\nThe opponent can only summon one Cost 4 or less Spirit each turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 1 or more Spirits to the Trash."
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-054",
    "name": "The ChimeraSacredBeast Cthulhum",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash.\n\n[LV1][LV2] (When Summoned)\nDestroy all Spirits without [Tribute].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash."
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
            "rule": "DESTROY",
            "text": "Destroy all Spirits without [Tribute]."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-055",
    "name": "The ImperialDragoon's Round Table",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Life is reduced by the attack of an opposing 5000 BP or less Spirit, destroy that Spirit.\n\n[LV2] (Your Attack Step)\nWhen your \"Dragon Emperor\"/\"Dragon Knight\" family Spirit becomes the target of an opposing Spirit effect, by discarding a card from your Hand, it is unaffected by that effect.",
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
        "subCost": {
          "type": "DISCARD_HAND",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When your \"Dragon Emperor\"/\"Dragon Knight\" family Spirit becomes the target of an opposing Spirit effect, by discarding a card from your Hand, it is unaffected by that effect."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-056",
    "name": "The Sunstone Shrine",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen a Spirit with [Clash] you control attacks as the first attack of your turn, and only the opposing Spirit is destroyed by BP comparison, you can destroy any number of opposing Spirits up to a total BP of the Spirit destroyed.\n\n[LV2] (Your Attack Step)\nWhen your Spirits with [Clash] are destroyed, by sending a core from your Life to the Void, they return to the Field, refreshed.",
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
        "keyword": "Clash"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Clash"
      }
    ]
  },
  {
    "cardNumber": "BS08-057",
    "name": "The Red Sand Glass",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nSpirits with only one core on them can't attack.\n\n[LV2] (Your Main Step)\nWhen summoning a Spirit card with [Tribute], the cost of every \"Infernal Lord\" family Spirit you control increases by +3.",
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
            "text": "Spirits with only one core on them can't attack."
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
            "text": "When summoning a Spirit card with [Tribute], the cost of every \"Infernal Lord\" family Spirit you control increases by +3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-058",
    "name": "The Reverse Pyramid Fields",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing End Step)\nSend a core from an opposing 5000 BP or less Spirit to their Reserve.\n\n[LV2] (Your Attack Step)\nWhen the attack of your \"Infernal Lord\" family Spirit reduces the opposing life, the core is sent to the Void instead of the Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "GRANT_FAMILY",
            "text": "When the attack of your \"Infernal Lord\" family Spirit reduces the opposing life, the core is sent to the Void instead of the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-061",
    "name": "The Resonant Tuning Fork Tower",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nThe (When Summoned) effects of Cost 4 or less Spirits can't activate.\n\n[LV2] (Opposing Turn)\nWhen the opponent draws outside of Draw Step, you can draw a card.",
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
            "rule": "COST_MODIFIER",
            "text": "effects of Cost 4 or less Spirits can't activate."
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
    "cardNumber": "BS08-062",
    "name": "The Gravity Dimension Engine",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen summoning Cost 3 or less Spirit cards, neither player can use reduction symbols to reduce the cost.\n\n[LV2] (Your Main Step)\nWhen you're summoning a Spirit card, this symbol of this Nexus becomes three White Symbols.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-063",
    "name": "The Winner's Green Field",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nEvery \"Magician\" family Spirit you control gains +2000 BP.\n\n[LV2] (Opposing Attack Step)\nWhen your \"Magician\" family Spirit is destroyed via BP comparison with opposing 7000 BP or less Spirit, that Spirit you control returns to the Field, refreshed.",
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
          "family": "Magician"
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-064",
    "name": "The PhoenixCalibur",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nDuring the turn this Nexus is deployed, cards can't be discarded from your deck. When this Nexus card is discarded from the deck by an opposing Spirit effect, deploy it without paying the cost.\n\n[LV2]\nWhen cards would be discarded from your deck by an opposing non-[Crush] Spirit effect, by sending a core from your Life to the Reserve, negate that effect.",
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
          },
          {
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
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
    "cardNumber": "BS08-066",
    "name": "The Ruins of the Seabed",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen your \"Fusion Beast\" family Spirit is summoned, put a core from the Void to your Reserve.\n\n[LV2]\nThe symbols of all your \"Fusion Beast\" family Spirits become two symbols with the same color as the symbol they originally have.",
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-067",
    "name": "Dragon Scramble",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your \"Dragon Emperor\"/\"Dragon Knight\" family Spirit attacks, destroy every 3000 BP or less Spirit. Draw one card for each Spirit destroyed via this effect.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 3000,
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-068",
    "name": "Meteor Storm",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give a \"Wurm\"-named Spirit you control: \"(When Attacks) When only the opposing Spirit is destroyed via BP comparison, send a number of cores from the opposing Life to their Reserve equal to the number of symbols this Spirit has.\"",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-069",
    "name": "Judgment Flare",
    "cardType": "Magic",
    "effect": "[Flash]\nIf you control two or more Spirits, the opponent destroys their Spirits until they control the same number of Spirits as you. This effect can't be used during the Main Step.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "If you control two or more Spirits, the opponent destroys their Spirits until they control the same number of Spirits as you."
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
    "cardNumber": "BS08-072",
    "name": "Mind Break",
    "cardType": "Magic",
    "effect": "[Main]\nBy sending five cores from your Spirits to your Trash, the opponent send five cores from their Spirits to their Trash.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP",
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
            "text": "By sending five cores from your Spirits to your Trash"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "the opponent send five cores from their Spirits to their Trash."
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
    "cardNumber": "BS08-080",
    "name": "Magic Mirror",
    "cardType": "Magic",
    "effect": "Flash -\nYou can activate the same Magic effect as what the opponent used in this Flash Timing right before this Magic, once and only once more, treating as if you're using that Magic. However, this effect can't target [Magic Mirror].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "You can activate the same Magic effect as what the opponent used in this Flash Timing right before this Magic, once and only once more, treating as if you're using that Magic."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "this effect can't target [Magic Mirror]."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-081",
    "name": "Royal Straight Flush",
    "cardType": "Magic",
    "effect": "[Main]\nIf you control [Arcanaprince-Obero], [Arcanaprincess-Un], [ArcanaKing-Charle], [ArcanaQueen-Pallas] and [The LightDragonRider Arcanajoker], destroy all opposing Spirits/Nexuses.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
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
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-083",
    "name": "Break Burst",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your Spirit with [Crush] attacks, you can destroy an opposing Cost 3 or less Spirit.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "op": "DESTROY_BY_COST",
            "maxCost": 3,
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
    "cardNumber": "BS08-X29",
    "name": "The MasterDragonRider Dark-Crimson",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReveal seven cards from your decktop. You can summon all \"Dragon Emperor\"/\"Dragon Knight\" family Spirit cards among them, without paying the cost and without using [Tribute]. However, any (When Summoned) effects of these Spirits can't activate. Discard any remaining cards.\n\n[LV2][LV3] (When Attacks)\nFor each \"Dragon Emperor\" family Spirit you control, destroy an opposing 5000 BP or less Spirit.",
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
            "text": "Reveal seven cards from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of these Spirits can't activate."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_REVEALED",
            "text": "Discard any remaining cards."
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-X30",
    "name": "The SevenShogun Asmodios",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nSend two cores each from every opposing Spirit to their Reserve. When the [Tribute] was [The SevenShogun Destlord]/[The SevenShogun Beelzebeat], also, the opponent discards four cards from their Hand.\n\n[LV3] (When Attacks)\nSend two cores from any opposing Spirits to the Void.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void."
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When the [Tribute] was [The SevenShogun Destlord]/[The SevenShogun Beelzebeat], also, the opponent discards four cards from their Hand."
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
    "cardNumber": "BS08-X31",
    "name": "The GreatKing Blacktaurus",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve.\n\n[LV2][LV3] (When Attacks)\nWhen the opposing Life is reduced, by sending two cores from this Spirit to the Void, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void."
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS08-X32",
    "name": "The WingDeity Grand-Woden",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Void]\nAfter paying for the summoning cost, you must send all core from a Cost 5 or more Spirits you control to the Void.\n\n[LV1][LV2][LV3] Red/Purple/Green/White/Yellow/Blue (Opposing Turn)\nWhen the opponent uses a Red/Purple/Green/White/Yellow/Blue Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2][LV3]\nBesides [The WingDeity Grand-Woden], when your \"Armed Machine\" family Spirit is exhausted, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from a Cost 5 or more Spirits you control to the Void."
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
    "cardNumber": "BS08-X34",
    "name": "The GodMadeSoldier Orichalcum-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's LV.\n\n[LV1][LV2][LV3] (When Attacks)\nFor each Blue symbol on your Field, this Spirit's [Crush] discards +1 card.\n\n[LV2][LV3] [Assault: 2] (When Attacks)\nThis Spirit can, up to twice per turn, be refreshed by exhausting one of your Nexuses.",
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
            "maxTimes": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-026",
    "name": "Thousandneedle",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit can't attack.\n\n[LV1][LV2] [Armor: Purple/Blue]\nThis Spirit is unaffected by opposing Purple/Blue Spirit/Nexus/Magic effects.",
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
            "text": "This Spirit can't attack."
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
        "keyword": "Armor: Purple/Blue"
      }
    ]
  }
];

for (const spec of BS08_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
