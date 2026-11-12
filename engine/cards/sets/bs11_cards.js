/**
 * engine/cards/sets/bs11_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS11_SAGA_CARDS)
 * Total Cards: 89 (84 Effect, 5 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS11_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10696",
    "name": "The HellArmor Zepar",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11041",
    "name": "The IronHeadDinoman Pachycephalon",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13836",
    "name": "Totemowl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] When your opponent draws a card from their deck, refresh this spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A14461",
    "name": "Wolvy",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1625",
    "name": "The WaterCarrierDeity Aqua-Elysion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Refresh Step)\nOnly one non-braved Spirit can be refreshed. Also, Nexuses can't be refreshed.\n\n[LV2][LV3]\nGive all your \"Astral Deity\"/\"Galaxian\"/\"Astral Soul\" family Spirits: \"[Armor: Red/Purple/Blue] This Spirit is unaffected by opposing Red/Purple/Blue Spirit/Nexus/Magic effects.\"\n\n[During Brave] [LV3] (Opposing Refresh Step)\nAll opposing Brave Spirits can't refresh.",
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
            "scope": "TARGET"
          },
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
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
        "keyword": "Armor: Red/Purple/Blue"
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
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6129",
    "name": "Karugamode",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When this spirit blocks) This spirit gets BP+3000.\n\n[LV2] (When this spirit blocks) Exhaust an opponent's spirit.",
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
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
    "cardNumber": "BATTLE-SPIRITS-A7999",
    "name": "Streamotter",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS11-001",
    "name": "Volgames",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nDestroy an opposing 4000 BP or less Spirit.",
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
    "cardNumber": "BS11-002",
    "name": "Cometwyarm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your \"Astral Dragon\" family Spirits gain +1000 BP.",
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
          "family": "Astral Dragon"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS11-003",
    "name": "Aquilam",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nThis Spirit gains +2000 BP.\n\n[LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.",
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
    "cardNumber": "BS11-004",
    "name": "Prominencewyvern",
    "cardType": "Spirit",
    "effect": "When your \"Sun\"-named Spirit is summoned, you can summon this Spirit card from the Trash, without paying the cost.\n\n[LV1][LV2][LV3] Flash - [Awaken]\nYou can put any number of cores from Spirits you control to this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When your \"Sun\"-named Spirit is summoned, you can summon this Spirit card from the Trash, without paying the cost."
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
    "cardNumber": "BS11-006",
    "name": "The LeoDragonPrince Leogulus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy an opposing 5000 BP or less Spirit. When this effect destroys any opposing Spirit, draw a card.",
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
          },
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
    "cardNumber": "BS11-007",
    "name": "The ShiningEmperor Heliosdragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) At the end of the battle, you can reveal cards from your decktop equal to this Spirit's level. You can summon every Cost 7 or less \"Astral Dragon\" family Spirit card among them, without paying the cost. Remaining cards are discarded.",
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
            "rule": "DECK_ACTION",
            "text": "At the end of the battle, you can reveal cards from your decktop equal to this Spirit's level."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
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
    "cardNumber": "BS11-008",
    "name": "The BurstDragon Dragonicbeard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nIf both players control Spirits with 10000 BP or more, destroy every 10000 BP or more Spirit.\n\n[LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.",
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
            "maxBp": 10000,
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-009",
    "name": "Smokeloco",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nDraw a card.",
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
      }
    ]
  },
  {
    "cardNumber": "BS11-010",
    "name": "The DarkKnight Gaheris",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 3] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 3 Spirit is destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 3"
      }
    ]
  },
  {
    "cardNumber": "BS11-011",
    "name": "Flyskull",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed)\nSend one core each from two opposing Spirits to their Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-013",
    "name": "Glasyahound",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 5/6] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 5/6 Spirit is destroyed.\n\n[LV1][LV2]\nGive every Spirit card with [Immortality] in your Trash a [Purple Core] reduction symbol.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 5/6"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "keyword": "Immortality"
      }
    ]
  },
  {
    "cardNumber": "BS11-014",
    "name": "The RipperPrincess Azalea",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nSend one core from any opposing Spirits to their Reserve.\n\n[LV2][LV3] (When Destroyed)\nDestroy a Brave on an opposing Brave Spirit.",
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
    "cardNumber": "BS11-015",
    "name": "The PlutoSacredBeast Inferd-Hades",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 4/5] (Either Attack Step)\nThis Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed.\n\n[LV1][LV2][LV3] (When Attacks)\nSeparate an opposing Brave Spirit. However, the opponent moves the cores for the separation.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 4/5"
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
            "rule": "KEYWORD_RULE",
            "text": "Separate an opposing Brave Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "the opponent moves the cores for the separation."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-016",
    "name": "The EvilEyeEmperor Zenas",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy one Brave on every opposing Brave Spirit.\n\n[LV1][LV2]\nWhen your Spirit is summoned via the effect of [Immortality], destroy an opposing exhausted Spirit.",
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
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "keyword": "Immortality"
      }
    ]
  },
  {
    "cardNumber": "BS11-017",
    "name": "Mushatsubame",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV2][LV3] (Your Attack Step)\nThis Spirit's cost gets +3.",
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
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "BP_BUFF",
            "text": "This Spirit's cost gets +3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-018",
    "name": "Yakuyanagi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step) All Spirit cards with \"High Speed\" and Brave cards with \"High Speed\" in your Hand gets two extra Green reduction symbols.",
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
            "text": "All Spirit cards with \"High Speed\" and Brave cards with \"High Speed\" in your Hand gets two extra Green reduction symbols."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-019",
    "name": "Danderabbit",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void to your Reserve. Also, put a core from the Void to another \"Astral Soul\" family Spirit you control.",
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
    "cardNumber": "BS11-020",
    "name": "Onmyoyamasemi",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2] (When Summoned)\nYou can summon a Brave card from your Hand to directly brave it to this Spirit.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-021",
    "name": "Gokurakucho",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2] (When Summoned)\nPut a core from the Void to your Reserve.",
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
    "cardNumber": "BS11-024",
    "name": "The BushinBird Birdy-Kenshin",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your \"Winged Beast\" family Spirits gain +3000 BP.\n\n[LV2] (When Attacks)\nRefresh two of your Spirits with [High Speed].",
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
          "family": "Winged Beast"
        },
        "amount": 3000
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
            "scope": "TARGET",
            "count": 1
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
  },
  {
    "cardNumber": "BS11-027",
    "name": "The SeaCarrier Njord",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen you control only one Nexus, this Spirit can't attack, and is unaffected by opposing Spirit/Brave/Nexus/Magic effects.\n\n[LV2]\nWhile you control only one Nexus, that Nexus can't be destroyed.",
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
            "text": "When you control only one Nexus, this Spirit can't attack, and is unaffected by opposing Spirit/Brave/Nexus/Magic effects."
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
            "rule": "INDESTRUCTIBLE",
            "text": "While you control only one Nexus, that Nexus can't be destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-028",
    "name": "The ArtifactBird Hresvelgr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Armor: White]\nThis Spirit is unaffected by opposing White Spirit/Nexus/Magic effects.\n\n[LV1][LV2][LV3] White (Opposing Turn)\nWhen the opponent uses a White Magic effect, by exhausting this Spirit, negate that effect.",
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
        "keyword": "Armor: White"
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
      }
    ]
  },
  {
    "cardNumber": "BS11-030",
    "name": "Dolphing",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAt the start of the step, you can target an opposing Brave Spirit. During this turn, the targeted Brave Spirit can't attack.",
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
            "text": "At the start of the step, you can target an opposing Brave Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "During this turn, the targeted Brave Spirit can't attack."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-031",
    "name": "The Valkyrie-Mist",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit is unaffected by opposing Spirit/Magic effects.\n\n[LV2][LV3] (Opposing Attack Step)\nWhen an opposing Spirit attacks, exhaust an opposing Spirit.",
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
            "rule": "IMMUNITY",
            "text": "This Spirit is unaffected by opposing Spirit/Magic effects."
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
    "cardNumber": "BS11-032",
    "name": "The UranusSacredBeast Slei-Uranus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Armor: Green/White/Yellow]\nThis Spirit is unaffected by opposing Green/White/Yellow Spirit/Nexus/Magic effects.\n\n[LV2][LV3] (When Attacks)\nReturn an opposing Spirit to the Hand. When this effect returns a Cost 4 or less Spirit to the Hand, refresh a \"Galaxian\"/ \"Astral Deity\" family Spirit you control. This effect can only be used once per turn.",
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
        "keyword": "Armor: Green/White/Yellow"
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
    "cardNumber": "BS11-033",
    "name": "Nijinoko",
    "cardType": "Spirit",
    "effect": "[LV1]\nThis Spirit is also treated as a Red Spirit.\n\n[LV2]\nThis Spirit is also treated as a Purple Spirit.\n\n[LV3]\nThis Spirit is also treated as a White Spirit.",
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
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Red Spirit."
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
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Purple Spirit."
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
            "text": "This Spirit is also treated as a White Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-034",
    "name": "The StarHorse Colutte",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen this Spirit is destroyed by opposing Spirit effects, separate every opposing Brave Spirit with two symbols or more. However, the opponent decides how the cores are moved during separation.",
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
            "rule": "KEYWORD_RULE",
            "text": "When this Spirit is destroyed by opposing Spirit effects, separate every opposing Brave Spirit with two symbols or more."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "the opponent decides how the cores are moved during separation."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-036",
    "name": "The NetherWitch Helen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nBy putting up to three Magic cards from your Hand face-up onto the Remove Zone, for each card you put, draw a card. An opened Magic card can be used as if it were in your hand until the end of the game.",
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
    "cardNumber": "BS11-037",
    "name": "Hipogrifee",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.\n\n[LV2][LV3] (When Attacks)\nUnless the opponent sends a core from their Reserve to their Trash, they can't block.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Unless the opponent sends a core from their Reserve to their Trash, they can't block."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-038",
    "name": "The HeavenStarHorse Pegaseeda",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nYou can discard cards from your decktop until a Cost 6/7 Spirit card appears (Max. 6 cards). Then, you can summon that Spirit card from the Trash, without paying the cost. However, any (When Summoned) effects can't activate.\n\n[LV2] (When Destroyed)\nDraw three cards.",
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
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects can't activate."
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
            "op": "DRAW_CARDS",
            "count": 3
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-039",
    "name": "The Angelia Tiael",
    "cardType": "Spirit",
    "effect": "In addition to the symbols on your Field, you can also use symbols of cards in your Trash to reduce the summon cost of this Spirit card in the Hand.\n\n[LV1][LV2][LV3] (Your Main Step)\nWhen you're summoning a Spirit card, this Spirit's symbol becomes three Yellow symbols.",
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
            "rule": "SET_SYMBOL",
            "text": "When you're summoning a Spirit card, this Spirit's symbol becomes three Yellow symbols."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-040",
    "name": "The SacredBeast Hikyu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Brilliance] (When Attacks)\nAt the end of battle, return every Magic card you used during this battle to your Hand.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nWhen you use a Magic effect, refresh this Spirit.",
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-041",
    "name": "Clay-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nDiscard two cards from the opposing decktop.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-042",
    "name": "The Pirate Raccorsair",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen one or more Spirit cards are sent to the opposing Trash due to your Spirits' [Crush] effects, put a core from the Void to one of your Spirits.",
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
    "cardNumber": "BS11-043",
    "name": "Tower-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards equal to this Spirit's level from opposing decktop.\n\n[LV2][LV3] (Opposing Attack Step)\nThis Spirit can block opposing Cost 5 or less Spirits while exhausted.",
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
            "text": "This Spirit can block opposing Cost 5 or less Spirits while exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-044",
    "name": "Shell-Golem",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS11-045",
    "name": "MC Gingar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nFor both players, Magic effects can only be used once per turn.\n\n[LV1][LV2] (When Attacks)\nDiscard one card from the opposing decktop. Destroy an opposing Spirit with the same cost as the discarded card.",
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
            "op": "PASSIVE_RULE",
            "rule": "MAGIC_RESTRICTION",
            "text": "For both players, Magic effects can only be used once per turn."
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit with the same cost as the discarded card."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-046",
    "name": "The RoaringArm Todon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV1][LV2] Your End Step)\nRefresh all your Spirits with [Crush].",
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
            1,
            2
          ],
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
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-047",
    "name": "The NeptuneSacredBeast Tri-Poseidos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your Cost 7 or more Spirits are treated as being on their highest levels.\n\n[LV2] (Your Attack Step)\nAll your Cost 7 or more Spirits gains +3000 BP.",
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
            "text": "All your Cost 7 or more Spirits are treated as being on their highest levels."
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
    "cardNumber": "BS11-048",
    "name": "Centaurus-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each of your Spirits with [Crush], discard three cards from the opposing decktop.\n\n[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's level.",
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
    "cardNumber": "BS11-049",
    "name": "Jambi-Olepis",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDuring this turn, every opposing Spirit is treated as not having [Armor] and they can't gain new ones.\n\n[When Braved] Flash - [Awaken]\nYou can put any number of cores from Spirits you control to this Spirit.",
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
            "rule": "KEYWORD_RULE",
            "text": "During this turn, every opposing Spirit is treated as not having [Armor] and they can't gain new ones."
          }
        ]
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
    "cardNumber": "BS11-050",
    "name": "The ClawDragon Powered-Tusker",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Brave Attacks)\nWhen this Spirit is blocked, destroy an opposing Spirit with only three cores or less on it.",
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
            "rule": "DESTROY",
            "text": "When this Spirit is blocked, destroy an opposing Spirit with only three cores or less on it."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-051",
    "name": "Evil-Fisher",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nReveal two cards from your decktop. Add one of them to the Hand, and discard the other one.\n\n[When Braved] (When Brave Attacks)\nReturn a Cost 6 or less Spirit card from your Trash to the Hand.",
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
            "op": "PASSIVE_RULE",
            "rule": "REVEAL_DECKTOP",
            "text": "Reveal two cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "Add one of them to the Hand"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "discard the other one."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
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
    "cardNumber": "BS11-052",
    "name": "The EvilGun Vesper",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Brave Attacks)\nFor each symbol this Spirit has, send a core from any opposing Spirits to their Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-053",
    "name": "Karmula One",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\nFlash - [High Speed]\nThis Brave card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Brave must also be from the Reserve.\n\n[When Braved] (When Brave Attacks)\nWhen this Spirit's attack reduces the opposing Life, send an opposing Life to their Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_RESERVE_ONLY",
            "text": "This Brave card in Hand can be summoned by paying the cost with cores in the Reserve."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "In this case, cores to be put on this Brave must also be from the Reserve."
          }
        ]
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
    "cardNumber": "BS11-054",
    "name": "The SpearBird Spineed-Hayato",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (Your Attack Step)\nAt the start of the step, choose a color. During this turn, when this Spirit is blocked by a Spirit with the selected color, refresh this Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-055",
    "name": "Janome-Shielder",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nTarget an opposing exhausted Spirit. The targeted Spirit can't refresh on the next (Opposing Refresh Step).\n\n[When Braved]\nThis Spirit is unaffected by opposing Brave effects.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
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
            "text": "This Spirit is unaffected by opposing Brave effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-056",
    "name": "The StarSwordShuttle Polar-Caliber",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Blocks)\nWhen only the opposing Spirit is destroyed by comparing BP, return an opposing Spirit/Brave/Nexus to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
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
    "cardNumber": "BS11-057",
    "name": "Butterhorn",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDuring this turn, opposing Cost 4/6/8 Spirits can't block.\n\n[When Braved] [Brilliance] (When Brave Attacks)\nAt the end of battle, return all Magic cards that you used this battle to the Hand.",
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
            "rule": "COST_MODIFIER",
            "text": "During this turn, opposing Cost 4/6/8 Spirits can't block."
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brilliance"
      }
    ]
  },
  {
    "cardNumber": "BS11-058",
    "name": "The DivineBowBird Perytorn",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Brave Attacks)\nYou can reveal a card from your decktop. If it's a Magic card, you can use that card's Flash effect immediately without paying the cost. If you don't use it or, when it's not a Magic card, add it to the Hand.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "You can reveal a card from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "If it's a Magic card, you can use that card's Flash effect immediately without paying the cost."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If you don't use it or, when it's not a Magic card, add it to the Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-059",
    "name": "Reticle-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDiscard three cards from the opposing decktop.\n\n[When Braved] [Crush] (When Brave Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's level.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
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
    "cardNumber": "BS11-060",
    "name": "The ThunderSacredArtillery Cannon-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[During Brave] (When Attacks)\nDiscard a card from the opposing decktop. Also, during this battle, cards from the opposing Hand that share the same color as the card discarded by this Spirit's effect can't be used by the opponent.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "during this battle, cards from the opposing Hand that share the same color as the card discarded by this Spirit's effect can't be used by the opponent."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-061",
    "name": "The Star Altar",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen your \"Astral Deity\"/ \"Galaxian\"/ \"Astral Soul\" family Spirit is summoned, destroy an opposing 3000 BP or less Spirit.\n\n[LV2] (Your Attack Step)\nAll your \"Astral Deity\"/\"Galaxian\"/\"Astral Soul\" family Spirits gain +3000 BP.",
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
            "maxBp": 3000,
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
          "family": "Astral Soul"
        },
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BS11-062",
    "name": "The Oort Dragon's Nest",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every \"Astral Dragon\" family Spirit card in your Hand reduction symbol: .\n\n[LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your Brave Spirit, return a Spirit card from your Trash to the Hand.",
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-063",
    "name": "The Doomsday Drawn Canvas",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen an opposing Spirit attacks, the opponent sends a core from any of their Spirits to their Reserve.\n\n[LV2] (Your Attack Step)\nYour Brave Spirit can target and attack an opposing exhausted Spirit.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "Your Brave Spirit can target and attack an opposing exhausted Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-064",
    "name": "The Dark Sacred Sword",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Spirit is destroyed, that Spirit is also treated as a Cost 3/4 Spirit.\n\n[LV2]\nWhen opposing Spirit braves, exhaust that Brave Spirit.",
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
            "text": "When your Spirit is destroyed, that Spirit is also treated as a Cost 3/4 Spirit."
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
    "cardNumber": "BS11-065",
    "name": "The Starry Sky Pasture",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Main Step)\nNeither player can draw, nor discard cards from their Hand.\n\n[LV2] (Either Attack Step)\nWhen your Spirit is summoned via the effect of [High Speed], exhaust an opposing Spirit.",
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
            "text": "Neither player can draw, nor discard cards from their Hand."
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
        "keyword": "High Speed"
      }
    ]
  },
  {
    "cardNumber": "BS11-066",
    "name": "The Discovered World Tree",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Green Nexus is destroyed, by sending a core from this Nexus to your Trash, one of the destroyed Nexus returns to your Field in the same condition.\n\n[LV2]\nWhen your Spirit is destroyed, by sending three cores from this Nexus to your Trash, that Spirit returns to your Field, exhausted.",
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
            "text": "When your Green Nexus is destroyed, by sending a core from this Nexus to your Trash, one of the destroyed Nexus returns to your Field in the same condition."
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
            "text": "When your Spirit is destroyed, by sending three cores from this Nexus to your Trash, that Spirit returns to your Field, exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-067",
    "name": "The Great Wall of the White Shield",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Start Step)\nTarget an opposing Spirit. That Spirit must attack during that turn if possible.\n\n[LV2] Flash - (Either Attack Step)\nBy sending three cores from this Nexus to the Trash, immediately end the battle.",
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
            "rule": "TARGET",
            "text": "Target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "That Spirit must attack during that turn if possible."
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "By sending three cores from this Nexus to the Trash"
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
    "cardNumber": "BS11-068",
    "name": "The Pure Milky Way",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen opposing non-braved Spirit attacks, put a core from the Void to a \"Flying Fish\"/\"Astral Soul\" family Spirit you control.\n\n[LV2] (Your Attack Step)\nWhen your \"Astral Soul\" family Spirit attacks, return an opposing Spirit with a cost equal or inferior to the attacking Spirit's to the Hand.",
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-069",
    "name": "The Golden Belfry",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nWhile all your Nexuses are Yellow, your Nexuses can't be destroyed.\n\n[LV2] (Either Attack Step)\nWhen your Spirits with [Holy Life] are destroyed, put a core from the Void to your Life.",
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
            "rule": "INDESTRUCTIBLE",
            "text": "While all your Nexuses are Yellow, your Nexuses can't be destroyed."
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
        "keyword": "Holy Life"
      }
    ]
  },
  {
    "cardNumber": "BS11-070",
    "name": "The Drifting Zero Gravity Island",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen your \"Hunter Beast\" family Spirit is exhausted, draw a card.\n\n[LV2] (Either Attack Step)\nGive all your \"Hunter Beast\" family Spirits the effect: \"[Holy Life] (When Attacks) When this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.\"",
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
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Holy Life"
      }
    ]
  },
  {
    "cardNumber": "BS11-071",
    "name": "The PillarRocks' Aquapolis",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen your Spirit with [Crush] is summoned, discard two cards from the opposing decktop.\n\n[LV2] (Your Attack Step)\nWhen your Spirit attacks, discard a card from the opposing decktop. If that card is Cost 3 or less, exhaust an opposing Spirit.",
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
        "keyword": "Crush"
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
    "cardNumber": "BS11-072",
    "name": "The Unfinished Ancient Battleship:Stern",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nNeither players can put cores from the Void to their Life.\n\n[LV2] (Opposing Main Step)\nThe (When Summoned) effects of Spirits/Braves can't activate.",
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
            "text": "Neither players can put cores from the Void to their Life."
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
            "rule": "KEYWORD_RULE",
            "text": "The (When Summoned) effects of Spirits/Braves can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-073",
    "name": "Buster Hammer",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a color. Destroy every Nexus of the selected color. For each Nexus destroyed by this effect, draw a card.",
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
    "cardNumber": "BS11-074",
    "name": "Solar Breaker",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy every opposing Spirit with [Clash]/ [Immortality]/ [Windstorm]/ [Ice Wall]/ [Holy Life]/ [Assault].\n\n[Flash]\nDuring this turn, give a Spirit +6000 BP.",
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
            "keyword": "Clash"
          },
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
            "amount": 6000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-075",
    "name": "Totentanz",
    "cardType": "Magic",
    "effect": "[Flash]\nBy discarding a Spirit card or Brave card from your Hand, send two cores from any opposing Spirits to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "By discarding a Spirit card or Brave card from your Hand"
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
    "cardNumber": "BS11-076",
    "name": "Sharing Pain",
    "cardType": "Magic",
    "effect": "[Main]\nBy destroying a Spirit you control, the opponent destroys any number of their Spirits until the total cost of destroyed Spirits are equal or more than the cost of your destroyed Spirit.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "text": "By destroying a Spirit you control"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "the opponent destroys any number of their Spirits until the total cost of destroyed Spirits are equal or more than the cost of your destroyed Spirit."
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
    "cardNumber": "BS11-077",
    "name": "Star Cradle",
    "cardType": "Magic",
    "effect": "[Flash]\nExhaust an opposing Spirit. Return a Spirit with [High Speed] you control to the Hand.",
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
    "cardNumber": "BS11-078",
    "name": "Brave Flash",
    "cardType": "Magic",
    "effect": "[Flash]\nBrave a Brave in Spirit condition you control to a Spirit you control. This effect can't be used in the Flash Timing after block declaration.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Brave a Brave in Spirit condition you control to a Spirit you control."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "This effect can't be used in the Flash Timing after block declaration."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-079",
    "name": "Reboot Code",
    "cardType": "Magic",
    "effect": "[Flash]\nRefresh all your exhausted Spirits. During this turn, every Spirit refreshed by this effect, except Brave Spirits, can't attack.",
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
    "cardNumber": "BS11-080",
    "name": "Delta Barrier",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, your Life can't be brought to zero by opposing Spirit/Magic effects and attacks of opposing Cost 4 or more Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "During this turn, your Life can't be brought to zero by opposing Spirit/Magic effects and attacks of opposing Cost 4 or more Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-081",
    "name": "Lightning Delivery",
    "cardType": "Spirit",
    "effect": "[Flash]\nDraw a card. During this turn, give all your Spirits with [Brilliance]/[Holy Life] +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          },
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
    "cardNumber": "BS11-082",
    "name": "Wig Bind",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all opposing Spirits with printed effects can't attack nor block, and non-Yellow cards in Hand can't be used by the opponent.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this turn, all opposing Spirits with printed effects can't attack nor block, and non-Yellow cards in Hand can't be used by the opponent."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-083",
    "name": "Lead Voice",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy every opposing Spirit with \"can't be blocked\" effects.",
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
    "cardNumber": "BS11-084",
    "name": "Solid Body",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all your Spirits with [Crush] can block opposing Spirits while exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS11-X01",
    "name": "The SunDragonDeity Rising-Apollodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nYour \"Astral Dragon\" family Spirits can target and attack an opposing Spirit.\n\n[During Brave] [LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, destroy an opposing Spirit/Brave/Nexus.",
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
            "rule": "TARGET_ATTACK",
            "text": "Your \"Astral Dragon\" family Spirits can target and attack an opposing Spirit."
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
            "op": "DESTROY_NEXUS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-X02",
    "name": "The StarSlayerDragon Darkwurm-Nova",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit can't brave.\n\n[LV1][LV2][LV3] (When Attacks)\nYou can target and attack an opposing Brave Spirit.\n\n[LV2][LV3] (When Attacks)\nWhile battling against an opposing Brave Spirit, this Spirit gains +10000 BP.\n\n[LV3]\nThe opponent can't control Braves in Spirit condition.",
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
            "text": "This Spirit can't brave."
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
            "rule": "KEYWORD_RULE",
            "text": "You can target and attack an opposing Brave Spirit."
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
            "amount": 10000
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
            "text": "The opponent can't control Braves in Spirit condition."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-X03",
    "name": "The StarKnight Hercules Ω",
    "cardType": "Spirit",
    "effect": "While your Life is at three or less, the cost of this Spirit card in Hand becomes Cost 4.\n\nFlash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[When Braved] [LV2][LV3]\nWhen your Spirit with [High Speed] is summoned, this Spirit refreshes.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While your Life is at three or less, the cost of this Spirit card in Hand becomes Cost 4."
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
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "keyword": "High Speed"
      }
    ]
  },
  {
    "cardNumber": "BS11-X05",
    "name": "The MagicalTwinsDeity Geminize",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen your \"Astral Deity\"/\"Galaxian\"/\"Astral Soul\" family Spirits are summoned from the Hand, reveal a card from your decktop. If that's a Spirit card/Brave card, summon it without paying the cost. Add any remaining card to the Hand.\n\n[LV2][LV3]\nWhen you pay the cost to use a Magic card, after that effect resolves, you can use a Magic card from your Hand/Removed Zone, without paying the cost. This effect can only be used twice per turn.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "When your \"Astral Deity\"/\"Galaxian\"/\"Astral Soul\" family Spirits are summoned from the Hand, reveal a card from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "Add any remaining card to the Hand."
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
            "text": "When you pay the cost to use a Magic card"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CAST_MAGIC_FREE",
            "text": "you can use a Magic card from your Hand/Removed Zone, without paying the cost."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "This effect can only be used twice per turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS11-X06",
    "name": "The BalanceDeity Libra-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's LV.\n\n[LV3] (When Attacks)\nWhen any Spirit card is discarded from the opposing deck by this Spirit's [Crush], refresh this Spirit.\n\n[LV3] (When Attacks)\nWhile this Spirit is in refreshed state, the opposing Life can't be reduced.",
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
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "While this Spirit is in refreshed state, the opposing Life can't be reduced."
          }
        ]
      }
    ]
  }
];

for (const spec of BS11_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
