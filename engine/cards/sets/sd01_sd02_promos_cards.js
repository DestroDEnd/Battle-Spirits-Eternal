/**
 * engine/cards/sets/sd01_sd02_promos_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (SD01_SD02_PROMOS_SAGA_CARDS)
 * Total Cards: 87 (74 Effect, 13 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const SD01_SD02_PROMOS_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10017",
    "name": "The FlameWingDragon Ma-Dwo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10287",
    "name": "The GiantPrince Alexander IV",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV2] (When Attacks)\nDestroy an opposing Cost 3 or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A10625",
    "name": "The HeadlessKnight Durahan",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11197",
    "aliases": [
      "RPX26-01"
    ],
    "name": "The LeoDragon Lion-Howl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy every 3000 BP or less Spirit, and draw a card for each Spirit destroyed.\n\n[LV2][LV3] (When Attacks)\nThis Spirit gains +4000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12429",
    "name": "The ShieldDragon Aegi-Onis",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nAll your \"Armored Dragon\"/\"Deified General\" family Spirits get +1000 BP.\n\n[LV3] (When Blocks)\nReturn an opposing \"Flying Fang\" family Spirit that blocked by this Spirit to the Hand.",
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
          "family": "Deified General"
        },
        "amount": 1000
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12668",
    "name": "The StarlightDragon Siegwurm-Deneb",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nYou can target and attack an opposing Cost 4 or less Spirit.\n\n[LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "rule": "COST_MODIFIER",
            "text": "You can target and attack an opposing Cost 4 or less Spirit."
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
    "cardNumber": "BATTLE-SPIRITS-A12761",
    "name": "The SteelDragon Niflheimr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Armor: Green]\nThis Spirit is unaffected by opposing Green Spirit/Nexus/Magic effects.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13209",
    "name": "The TridentalSpear Hugo",
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
    "cardNumber": "BATTLE-SPIRITS-A13311",
    "name": "The UltimateDragonEmperor Sieg-Sol-Fried",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon a \"Sieg\"-named Spirit card from your Hand, without paying the cost and without using [Tribute].\n\n[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A13313",
    "name": "The UltimateDragonRider Sieg-Crimson",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Trash.\n\n[LV1][LV2][LV3] (When Summoned)\nDestroy every 3000 BP or less Spirit. For each Spirit destroyed by this effect, put a core from the Void to this Spirit.\n\n[LV3] (When Attacks)\nThis Spirit gains +5000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Trash."
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
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13620",
    "name": "The WingBeast Griffi-Oar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReturn every Yellow Magic card from your Trash to the Hand.\n\n[LV2][LV3] (When Attacks)\nYou can use your Magic cards without paying the cost during the Flash Timing.",
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
            "rule": "CAST_MAGIC_FREE",
            "text": "You can use your Magic cards without paying the cost during the Flash Timing."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A401",
    "name": "Amenborg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step. In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A404",
    "name": "Armor Purge",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phrase) Refresh all exhausted spirits you control with Immunity: X. Spirits you control lose and cannot gain Immunity: X until end of turn.",
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
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4734",
    "name": "Gul-Karura",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nIf you control any \"Song Bird\" family Spirit, this Spirit gains +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR",
          "requireFamilyOnField": {
            "family": "Song Bird",
            "min": 1
          }
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
    "cardNumber": "BATTLE-SPIRITS-A4739",
    "name": "Hacchidori",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6049",
    "name": "Kerorodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nIf you control two or more \"Winged Dragon\" family Spirits, this Spirit gains +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR",
          "requireFamilyOnField": {
            "family": "Winged Dragon",
            "min": 1
          }
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
    "cardNumber": "BATTLE-SPIRITS-A6123",
    "name": "Komoribrella",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6439",
    "name": "Mahavasuki",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDraw a card.\n\n[LV2][LV3] (When Destroyed)\nChoose one \"Dark Snake\" family Spirit card from your Trash and return it to your Hand.",
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
    "cardNumber": "BATTLE-SPIRITS-A6519",
    "name": "Mimizukku",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Destroyed)\nRefresh a \"Winged Beast\" family Spirit you control.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6595",
    "name": "Mantistar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nSend two cores from your Trash to your Reserve.",
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
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6675",
    "name": "Momongul",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7866",
    "name": "Skunks",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8034",
    "name": "Styrahorn",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8237",
    "name": "The AbyssalLord Da-Gon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy every Cost 3 or less Spirit. For each Spirit destroyed by this effect, discard two cards from the opposing decktop.\n\n[LV2] (When Battles)\nDiscard three cards from the opposing decktop.",
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
          },
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8364",
    "name": "The Angelia Dominia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nWhen a BP+ Magic effect is used with this Spirit as the target, this Spirit gains +1000 BP further.",
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
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8430",
    "name": "The AntleredBeast Megalo-Els",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash.\n\n[LV1][LV2][LV3] (When Summoned)\nDestroy a 4000 BP or less Spirit, and draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8512",
    "name": "The ArmoredDragon Maximillion",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8685",
    "name": "The BeastSpear Giga-Galrave",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void each to every Spirit you control.\n\n[LV2] (When Attacks)\nPut a core from the Void to your Reserve.",
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
    "cardNumber": "BATTLE-SPIRITS-A9297",
    "name": "The Deity Sieg-Catastrophedragon",
    "cardType": "Spirit",
    "effect": "[LV3] (When Destroyed)\nPut a core from the Void to your life.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BATTLE-SPIRITS-A9544",
    "name": "The DragonKnight Wagner",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nChoose and return a [The GreatDragonEmperor Siegmund] from your Trash to your Hand.",
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
    "cardNumber": "BATTLE-SPIRITS-A9590",
    "name": "The EclipseDragon Siegwurm-Vega",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can target and attack an opposing exhausted Spirit.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, destroy an opposing Spirit with one core on it.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "You can target and attack an opposing exhausted Spirit."
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
    "cardNumber": "BATTLE-SPIRITS-A9682",
    "name": "The EvilPrince El-Blood",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nExhaust every opposing Spirit with only one core on it.\n\n[LV2][LV3] (When Attacks)\nDraw a card.",
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
    "cardNumber": "BATTLE-SPIRITS-A9719",
    "name": "The ExtremeShield Gran-Tortoise",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen this Spirit blocks opposing LV1 Spirits, it doesn't exhaust.\n\n[LV2] (When Blocks)\nThis Spirit gains +4000 BP.",
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
            "text": "When this Spirit blocks opposing LV1 Spirits, it doesn't exhaust."
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
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BONE-DOG2",
    "name": "Bone-Dog",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD01-001",
    "name": "Erimakilizard",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD01-002",
    "name": "Katanakasago",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD01-003",
    "name": "Ankillersaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nWhile you control any Spirit with [Awaken]/[Clash], this Spirit gains +1000 BP.",
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
            "op": "AWAKEN",
            "maxCores": 2
          },
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          },
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-004",
    "name": "The Infantry Dragron",
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
    "cardNumber": "SD01-005",
    "name": "Tartargar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit can't be returned to the Hand from your Field by opposing Spirit/Nexus/Magic effects.",
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
            "text": "This Spirit can't be returned to the Hand from your Field by opposing Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-006",
    "name": "The FineDragon Windrake",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from Spirits you control to this Spirit.",
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
    "cardNumber": "SD01-008",
    "aliases": [
      "RP26-01"
    ],
    "name": "The ThunderEmperorDragon Siegwurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV3] (Your Attack Step)\nGive every Spirit with [Awaken] you control: [Clash].",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-011",
    "name": "The HellFighter Balam",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked at the end of battle.",
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
            "keyword": "Curse"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-012",
    "name": "The DoubleHead Snake",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw a card.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed by BP comparison, draw a card.",
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
    "cardNumber": "SD01-013",
    "name": "The HellFencer Berith",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nThe opponent sends three cores from any Spirits they control to their Reserve. This effect can't bring the number of cores on opposing Spirits to 0.\n\n[LV2][LV3] (When Attacks)\nSend a core from any opposing Spirit to their Reserve.",
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
            "count": 3
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RESTRICTION",
            "text": "This effect can't bring the number of cores on opposing Spirits to 0."
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
    "cardNumber": "SD01-017",
    "name": "The HeavyArmoredBug Caterbarga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nExhaust every Cost 1 or less Spirit.",
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
    "cardNumber": "SD01-018",
    "name": "The Hunter Kingghepardo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile your Life is three or less, this Spirit gains +3000 BP.\n\n[LV2][LV3] (When Battles)\nPut a core from the Void to your Reserve.",
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
        "amount": 3000
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-020",
    "name": "Hitodem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Armor: Red]\nThis Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated color.\n\n[LV2] (When Blocks)\nThis Spirit gains +2000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-021",
    "name": "The Sacred Gungnir",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nReturn every opposing Cost 1 or less Spirit to the Hand.",
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
    "cardNumber": "SD01-022",
    "name": "Glasscargot",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD01-023",
    "name": "The Artifact Droiden",
    "cardType": "Spirit",
    "effect": "[LV2][LV3]\nAll your White Spirits gain +1000 BP.",
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
        "targetFilter": {
          "color": "White"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "SD01-024",
    "name": "The CentaurusSoldier Atrithr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nThis Spirit gains +3000 BP.\n\n[LV2] (When Blocks)\nWhen this Spirit blocks an opposing 4000 BP or less Spirit, refresh this Spirit.",
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
    "cardNumber": "SD01-025",
    "name": "The ArmoredBeast Skoll",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD01-026",
    "aliases": [
      "26RBS03-X09"
    ],
    "name": "The IronKnight Yggdrasill",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReturn every 3000 BP or less Spirit to the Hand.\n\n[LV2][LV3]\nGive every White Spirit you control: \"[Armor: Red/White] - This Spirit is unaffected by opposing Red/White Spirit/Nexus/Magic effects.\"",
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
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "keyword": "Armor: Red/White"
      }
    ]
  },
  {
    "cardNumber": "SD01-027",
    "name": "The Big Lavafalls",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nEvery attacking Spirit you control gains +1000 BP.\n\n[LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your Spirits with [Awaken]/[Clash], draw a card.",
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
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "AWAKEN",
            "maxCores": 2
          },
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          },
          {
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-028",
    "name": "The Cursed Shrine",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nAll your Purple Spirits gain +1000 BP.\n\n[LV2] (Opposing Attack Step)\nWhen opposing Spirit is exhausted, draw a card.",
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
    "cardNumber": "SD01-029",
    "name": "The Wriggle Catacomb",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nWhen cores are put on the opposing Field/Reserve due to opposing Green Spirit/ Nexus/ Magic effects, for each core put by that effect, the opponent sends a core from Spirits they control to the Void.\n\n[LV2] (Either Attack Step)\nWhen opposing Green Spirit attacks or blocks, exhaust an opposing Spirit.",
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
            "to": "VOID"
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
    "cardNumber": "SD01-030",
    "name": "The Earth of Fertility",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nFor each exhausted Spirit you control, your attacking and blocking Spirits gain +1000 BP.\n\n[LV2] (Your Core Step)\nYou gain +1 core.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-031",
    "name": "The Cape in the Red Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nWhen cards are added to the opposing Hand via an opposing Purple Spirit/Nexus/Magic effects, for each card added, the opponent discards a card from their Hand.\n\n[LV2]\nThe (When Summoned) and (When Destroyed) effects of opposing Purple Spirits can't activate.",
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
            "text": "When cards are added to the opposing Hand via an opposing Purple Spirit/Nexus/Magic effects, for each card added, the opponent discards a card from their Hand."
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
            "text": "and (When Destroyed) effects of opposing Purple Spirits can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-032",
    "name": "The Protection of Sacred Artifacts",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nYour White Nexuses can't be destroyed by opposing Red Spirit/Magic effects.\n\n[LV2] (Opposing Start Step)\nTarget an opposing Spirit. That Spirit must attack this turn.",
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
            "text": "Your White Nexuses can't be destroyed by opposing Red Spirit/Magic effects."
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
            "text": "Target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "That Spirit must attack this turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-033",
    "name": "Victory Fire",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy two opposing 3000 BP or less Spirits. Or, destroy an opposing 3000 BP or less Spirit and an opposing Nexus.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 3000,
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-034",
    "name": "Extra Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw two cards. Then, reveal a card from your decktop. If that card is a Red Spirit card, add it to your Hand. Return any remaining card to the decktop.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "SD01-035",
    "name": "Sudden Death Draw",
    "cardType": "Magic",
    "effect": "[Flash]\nDraw a card. During this turn, give a Spirit +1000 BP.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-036",
    "name": "Curse Enchant",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, give a Spirit you control the effect: \"[Curse] (When Attacks) This Spirit destroys an opposing Spirit that blocked at the end of battle.\"\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
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
    "cardNumber": "SD01-037",
    "name": "Carry Cores",
    "cardType": "Magic",
    "effect": "[Flash]\nPut a core from the Void to your Reserve. During this turn, give a Spirit +1000 BP.",
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
    "cardNumber": "SD01-038",
    "name": "Emerald Boost",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all your attacking Spirits gain +1000 BP for each reduction symbol that Spirit has.",
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
    "cardNumber": "SD01-039",
    "name": "Blizzard Wall",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, your Life can only be reduced by one by the attacks of opposing unblocked Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-001",
    "name": "The MysteriousBeast Pooxan",
    "cardType": "Spirit",
    "effect": "[LV2][LV3]\nThis Spirit is also treated as a Blue Spirit.",
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
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Blue Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-002",
    "name": "Misaal",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nExhaust every Spirit with the same cost as the opposing attacking Spirit.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-003",
    "name": "The Angelia Dunamis",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks)\nWhen this Spirit blocks an opposing Cost 2 or less Spirit, when the current battle ends, end the Attack Step.\n\n[LV2][LV3] [Brilliance] (When Attacks)\nAt the end of battle, return all Magic cards you used during this battle to the Hand.",
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
            "op": "END_ATTACK_STEP",
            "timing": "IMMEDIATE"
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
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-004",
    "name": "The SacredBeast Haktak",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Trash.\n\n[LV1][LV2][LV3] (When Summoned)\nChoose either the \"Imaginary Beast\" or the \"Beast Head\" family. For each Spirit you control in that family, draw a card.\n\n[LV2][LV3] (Your Attack Step)\nWhen your Spirit is blocked by an opposing Cost 4 or less Spirit, refresh one of your Spirits with [Tribute].",
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
            "op": "CHOOSE_FAMILY_DRAW",
            "families": [
              "Imaginary Beast",
              "Beast Head"
            ]
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
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-005",
    "name": "The Angelia Cherubim",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each Yellow Symbol on your Field, reveal a card from your decktop. Add a Magic card among them to the Hand. Return any remaining cards to the deckbottom in any order.\n\n[LV2][LV3] (Your Attack Step)\nEvery opposing Spirit that is blocking your Spirits with [Brilliance] is treated as LV1.\n\n[LV3] [Brilliance] (When Attacks)\nAt the end of battle, return all Magic cards you used during this battle to the Hand.",
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
            "op": "REVEAL_DECKTOP_ADD",
            "scaleBySymbolColor": "Yellow",
            "filter": {
              "type": "Magic"
            }
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
        "keyword": "Brilliance"
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
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-006",
    "name": "The Assassin Weaseve",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed)\nYou can deploy a Nexus card from your Trash, without paying the cost.",
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-007",
    "name": "The DogPoliceman Bernald",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nThis Spirit can block opposing Cost 3 or less Spirits while exhausted.",
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
            "text": "This Spirit can block opposing Cost 3 or less Spirits while exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-008",
    "name": "The RhinoMousquetair Grhinos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nDestroy an opposing Cost 1 or less Spirit.\n\n[LV2] [Assault: 1] (When Attacks)\nThis Spirit can, once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "op": "DESTROY_BY_COST",
            "maxCost": 1,
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-009",
    "name": "The BeastCommander Kuyultha",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen this Spirit becomes the target of [Tribute], by returning this Spirit to the Hand, treat as having sent the cores on this Spirit to the designated area.\n\n[LV2]\nGive this Spirit and every Spirit with [Tribute] you control the effect: \"(When Battles) This Spirit gains +2000 BP.\"",
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
        "subEffects": [
          {
            "op": "RETURN_SELF_FOR_TRIBUTE"
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
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-010",
    "name": "The RoaringSwordmaster Lowen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy opposing Cost 0/1/2/3/4 Spirits, one of each.\n\n[LV2][LV3] [Assault: 1] (When Attacks)\nThis Spirit can, once per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV3] (Your Attack Step)\nAll your Spirits with [Assault] gain +3000 BP.",
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
            "op": "DESTROY_ONE_OF_EACH_COST",
            "costs": [
              0,
              1,
              2,
              3,
              4
            ]
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
            "op": "BP_BUFF_ALLIES",
            "amount": 3000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-011",
    "name": "The BeastPrince Bahamunt",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from a Spirit you control with a designated or higher cost to the targeted area.\n\n[LV1][LV2][LV3] (When Summoned)\nLook at the entire opposing Hand, and discard a Magic card among them.\n\n[LV2][LV3] (Your Attack Step)\nThe opponent can't use Magic effects of the same color as the Magic cards in their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from a Spirit you control with a designated or higher cost to the targeted area."
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
            "op": "LOOK_OPPONENT_HAND_DISCARD",
            "count": 1,
            "filter": {
              "type": "Magic"
            }
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
            "rule": "SET_RESTRICTION",
            "text": "The opponent can't use Magic effects of the same color as the Magic cards in their Trash."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-012",
    "name": "The Heaven's Door",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Life would be reduced by the attack of an opposing LV1 Spirit without [Tribute], discard a card from your decktop. If that card is a Spirit card, your Life won't be reduced. Also, if it has [Tribute], add it to the Hand.\n\n[LV2] (Your Attack Step)\nThe attack of your Spirit with [Tribute] can't be blocked by opposing Spirits with a level equal or inferior to that Spirit's.",
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
          },
          {
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 0,
            "preventAllLifeLoss": true
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "if it has [Tribute], add it to the Hand."
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
    "cardNumber": "SD02-013",
    "name": "The Generate Altar",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen the opponent would summon a Cost 3 or less Spirit card without [Tribute], they must pay one extra cost.\n\n[LV2] (Your Main Step)\nWhen summoning a Spirit card with [Tribute], the cost of all your Spirits with the same family as that Spirit card increases by +3.",
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
            "text": "When the opponent would summon a Cost 3 or less Spirit card without [Tribute], they must pay one extra cost."
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
            "text": "When summoning a Spirit card with [Tribute], the cost of all your Spirits with the same family as that Spirit card increases by +3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-014",
    "name": "The Magic Control Tower",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Nexuses are destroyed, by sending a core from your Field/Reserve to your Trash, one of the destroyed Nexuses returns to the Field, in the same condition.\n\n[LV2]\nWhen the opponents uses a Magic effect, you can negate that effect. Then, return this Nexus to the deckbottom.",
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
            "rule": "REPLACEMENT_EFFECT",
            "text": "When your Nexuses are destroyed, by sending a core from your Field/Reserve to your Trash, one of the destroyed Nexuses returns to the Field, in the same condition."
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
            "rule": "NEGATE_MAGIC",
            "text": "When the opponents uses a Magic effect, you can negate that effect."
          },
          {
            "op": "BOUNCE_TO_DECK",
            "position": "BOTTOM",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-015",
    "name": "Friendly Power",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give one of your Spirits +1000 BP for each of your Spirits in the same family as the targeted Spirit.",
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
    "cardNumber": "SD02-016",
    "name": "Wing Boots",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a Spirit you control. During this turn, when battle resolves, if that Spirit's level is equal to or higher than the blocking opposing Spirit's, without comparing BP, treat the attack as not having been blocked.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Target a Spirit you control."
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
    "cardNumber": "SD02-017",
    "name": "Strong Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw three cards, then discard two cards from your Hand.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "count": 3,
            "thenDiscard": 2
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
    "cardNumber": "SD02-018",
    "name": "The BraveColonel Dragron",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen this Spirit becomes the target of [Tribute], destroy two opposing 4000 BP or less Spirits without [Tribute].",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 2,
            "allMatching": false,
            "filter": {
              "withoutKeyword": "Tribute"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-019",
    "name": "The DarkKnight Schwart",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen this Spirit becomes the target of [Tribute], send two cores from any opposing Spirits without [Tribute] to their Trash.",
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
            "op": "OPPONENT_SEND_CORES_MIN_ONE",
            "count": 2,
            "to": "TRASH"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD02-020",
    "name": "The RainbowWings Jewelg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen this Spirit becomes the target of [Tribute], put two cores from the Void to your Reserve.",
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
    "cardNumber": "SD02-021",
    "name": "The BeastMachine Sai-Drill",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen this Spirit becomes the target of [Tribute], return an opposing 5000 BP or less Spirit without [Tribute] to the decktop.",
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
        "subEffects": [
          {
            "op": "BOUNCE_TO_DECK",
            "position": "TOP",
            "count": 1,
            "filter": {
              "maxBp": 5000,
              "withoutKeyword": "Tribute"
            }
          }
        ]
      }
    ]
  }
];

for (const spec of SD01_SD02_PROMOS_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
