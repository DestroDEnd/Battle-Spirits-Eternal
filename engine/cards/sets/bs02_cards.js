/**
 * engine/cards/sets/bs02_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS02_SAGA_CARDS)
 * Total Cards: 71 (65 Effect, 6 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS02_SAGA_CARDS = [
  {
    "cardNumber": "BS02-001",
    "name": "Lizardedge",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS02-002",
    "name": "The Acrobat Juggline",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile you control two or less Spirits, this Spirit is treated as being at LV3.",
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
            "rule": "TREAT_LEVEL",
            "text": "While you control two or less Spirits, this Spirit is treated as being at LV3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-003",
    "name": "Dinohound",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS02-004",
    "name": "Orcaria",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nThis Spirit can target and attack an opposing refreshed Spirit.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "This Spirit can target and attack an opposing refreshed Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-005",
    "name": "The Charger Dragno",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nThis Spirit can't block opposing Spirits.\n\n[LV2] (When Attacks)\nThis Spirit gains +2000 BP.",
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
            "text": "This Spirit can't block opposing Spirits."
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
    "cardNumber": "BS02-007",
    "name": "The RiseDragon Balmung",
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
    "cardNumber": "BS02-008",
    "name": "Fisdragoon",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks)\nThis Spirit gains +1000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-015",
    "name": "Humpdump",
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
    "cardNumber": "BS02-016",
    "name": "Slimy",
    "cardType": "Spirit",
    "effect": "[LV3] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, send the core from the opposing Life to the Void, instead of the Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "When this Spirit's attack reduces the opposing Life, send the core from the opposing Life to the Void, instead of the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-018",
    "name": "Top Supra",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nThis Spirit can't be blocked by LV3 Spirits.\n\n[LV3] (When Attacks)\nThis Spirit can't be blocked by LV2/LV3 Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-019",
    "name": "Bottom Desuper",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nThis Spirit can't be blocked by LV1 Spirits.\n\n[LV3] (When Attacks)\nThis Spirit can't be blocked by LV1/LV2 Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-020",
    "name": "Lady-Frankelly",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked when the battle resolves at the end of battle.\n\n[LV3] (When Destroyed)\nReturn this Spirit to your Hand.",
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
    "cardNumber": "BS02-022",
    "name": "The Marquis Cocytus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Refresh Step)\nWhen this Spirit would refresh, send a core from one opposing Spirit or one opposing Nexus to their Trash.\n\n[LV3] (Your Refresh Step)\nWhen this Spirit would refresh, send two cores from from one opposing Spirit or one opposing Nexus to their Trash.",
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
            "to": "TRASH"
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
            "count": 2,
            "to": "TRASH"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-023",
    "name": "The TwinSnake Hydram",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS02-024",
    "name": "The DarkGeneral Bloody-Caesar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nWhen the opponent declares to block this Spirit, you can send up to two cores from the blocking Spirit to the opposing Reserve.\n\n[LV2] (When Attacks)\nDestroy an exhausted Spirit you or the opponent controls.",
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
            "count": 2,
            "to": "RESERVE"
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-030",
    "name": "The Soldier Antman",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV2] (When Destroyed)\nYou can summon any number of \"Parasite\" family Spirit cards from your Hand, paying their costs. However, any (When Summoned) effects of those Spirits can't activate.",
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
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_MULTI",
            "text": "You can summon any number of \"Parasite\" family Spirit cards from your Hand, paying their costs."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of those Spirits can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-034",
    "name": "The OldSage Trenton",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can summon a Green Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of the Spirit summoned by this effect do not activate.\n\n[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Reserve.",
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
            "text": "any (When Summoned) effects of the Spirit summoned by this effect do not activate."
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
    "cardNumber": "BS02-036",
    "name": "The Great Kaiseleon",
    "cardType": "Spirit",
    "effect": "[LV1] (Your Attack Step)\nThis Spirit can't attack.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, send a core from the opposing Life to the Reserve.",
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
    "cardNumber": "BS02-038",
    "name": "The Buckler Langlies",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nThis Spirit can't attack.\n\n[LV2] (When Destroyed)\nTarget a Spirit you control. Send all cores from this Spirit to the targeted Spirit you control instead of the Reserve.",
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
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Target a Spirit you control."
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
    "cardNumber": "BS02-039",
    "name": "The Sacred Mjolnir",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS02-040",
    "name": "Lobsterk",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Armor: Red]\nThis Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the specified color.",
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
      }
    ]
  },
  {
    "cardNumber": "BS02-048",
    "name": "The DragonTank Earthguard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can summon a Spirit card with the same family as this Spirit from your Hand, without paying the cost. However, any (When Summoned) effects of the Spirit summoned via this effect can't activate.\n\n[LV2] (When Attacks)\nThis Spirit can't be blocked non-Cost 8 Spirits.",
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
            "text": "any (When Summoned) effects of the Spirit summoned via this effect can't activate."
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
    "cardNumber": "BS02-050",
    "name": "Koristal",
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
    "cardNumber": "BS02-051",
    "name": "Chunpopo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS02-053",
    "name": "The Fairy Tanya",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS02-056",
    "name": "Arcanabeast-Ken",
    "cardType": "Spirit",
    "effect": "[LV3]\nGive all your \"Arcana\"-named Spirits the effect: \"(When Blocks) This Spirit gains +2000 BP.\"",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS02-058",
    "name": "Pentan",
    "cardType": "Spirit",
    "effect": "[LV1]\nWhile you control three or more Yellow Spirits/Nexuses, give all your Magic cards [Yellow Core] reduction symbol.\n\n[LV2]\nWhile you control three or more Yellow Spirits/Nexuses, give all your Magic cards [Yellow Core][Yellow Core] reduction symbols.",
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
            "rule": "SYMBOL_MODIFIER",
            "text": "While you control three or more Yellow Spirits/Nexuses, give all your Magic cards [Yellow Core] reduction symbol."
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
            "rule": "SYMBOL_MODIFIER",
            "text": "While you control three or more Yellow Spirits/Nexuses, give all your Magic cards [Yellow Core][Yellow Core] reduction symbols."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-060",
    "name": "The Clown Clan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Start Step)\nIf you control three or more Yellow Spirits/Nexuses, during this turn, all your Spirits are also treated as Cost 2 Spirits.",
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
            "rule": "TREAT_COST",
            "text": "If you control three or more Yellow Spirits/Nexuses, during this turn, all your Spirits are also treated as Cost 2 Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-061",
    "name": "The Angelia Angu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nRefresh a Yellow Spirit you control.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-063",
    "name": "The HellDog Cerru-Berus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step)\nThis Spirit can't attack or block.\n\n[LV2][LV3] (Your Start Step)\nMove an opposing Cost 6 Spirit to your Field in the same state it is in. You can use the Spirit you moved during this turn as your Spirit. When you do, the cores on the moved Spirit are treated as that owned by its owner; cores can't be moved from that Spirit, or sent to that Spirit. When the turn ends, return that Spirit to the opposing Field in exhausted state.",
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
            "text": "This Spirit can't attack or block."
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
            "rule": "TAKE_CONTROL",
            "text": "Move an opposing Cost 6 Spirit to your Field in the same state it is in."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TAKE_CONTROL",
            "text": "You can use the Spirit you moved during this turn as your Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTROL_RULE",
            "text": "When you do, the cores on the moved Spirit are treated as that owned by its owner; cores can't be moved from that Spirit, or sent to that Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RETURN_CONTROL",
            "text": "When the turn ends, return that Spirit to the opposing Field in exhausted state."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-064",
    "name": "The Melodybird Crewc",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Start Step)\nDuring this turn, you can give \"Song Bird\" family Spirits you control and all \"Song Bird\" family Spirit cards in your Hand a family you like.",
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
            "text": "During this turn, you can give \"Song Bird\" family Spirits you control and all \"Song Bird\" family Spirit cards in your Hand a family you like."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-066",
    "name": "Arcanadoll-Pan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can exhaust an opposing Spirit.",
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
    "cardNumber": "BS02-068",
    "name": "The WhiteTiger Huck",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can deploy a White Nexus card from your Hand, without paying the cost.",
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
    "cardNumber": "BS02-069",
    "name": "The BlackTiger Kuron",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can deploy a Purple Nexus card from your Hand, without paying the cost.",
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
    "cardNumber": "BS02-070",
    "name": "Arcanaprince-Obero",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nFor each \"Arcana\"-named Spirit you control, this Spirit gains +1000 BP.\n\n[LV2][LV3]\nAll your Cost 2 Spirits are treated as \"Arcana\"-named.",
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
        "amount": 1000
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
            "rule": "TREAT_NAME",
            "text": "All your Cost 2 Spirits are treated as \"Arcana\"-named."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-072",
    "name": "Trickster",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn a Magic card from your Trash to the Hand.",
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-073",
    "name": "The Kaiser Empereur",
    "cardType": "Spirit",
    "effect": "[LV3] (Either Start Step)\nAt the start of the step, by sending a core from your Reserve to the Void, during this turn, you can treat every opposing Nexus as being LV1.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "VOID"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-075",
    "name": "The GreatAngelia Principearl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy a Cost 4 or less you control. Put a number of cores from the Void to your Reserve equal to the cost of the destroyed Spirit.\n\n[LV2][LV3] (When Attacks)\nWhen a \"BP+\" Magic effect is used with this Spirit as target, this Spirit gains +3000 BP further.",
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
    "cardNumber": "BS02-077",
    "name": "The Plateau of Duel",
    "cardType": "Nexus",
    "effect": "[LV1] (Opposing Start Step)\nRefresh a Spirit with [Awaken] you control.\n\n[LV2] (Opposing Start Step)\nRefresh every Spirit with [Awaken] you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "keyword": "Awaken"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Awaken"
      }
    ]
  },
  {
    "cardNumber": "BS02-078",
    "name": "The Evil Coffin",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Main Step)\nUnless via Spirit/Nexus/Magic effects, when the number of cores on Spirits is increased, exhaust them.\n\n[LV2] (Your Attack Step)\nEvery LV3 Spirit you control can target and attack an opposing exhausted Spirit.",
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
            "text": "Unless via Spirit/Nexus/Magic effects, when the number of cores on Spirits is increased, exhaust them."
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
            "text": "Every LV3 Spirit you control can target and attack an opposing exhausted Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-079",
    "name": "The Forest of Amethyst",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen your Spirit is destroyed by opposing Spirit/Nexus/Magic effects, by sending a core from that Spirit to the Void, it can return to your Field, refreshed.\n\n[LV2] (Your Attack Step)\nWhen the step ends, if you control three or more refreshed Spirits, draw two cards.",
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
            "op": "DRAW_CARDS",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-080",
    "name": "The Limestone Cave of Emerald",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your Spirits with three or more cores on them get +1000 BP.\n\n[LV2] (Either Attack Step)\nWhen only the opposing Spirit is destroyed via BP comparison with your Spirits with three cores or more on them, put a core from the Void to this Nexus.",
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
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-081",
    "name": "The Budding Plain",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen you use a Magic effect, put a core from the Void to your Reserve.\n\n[LV2] (Either Attack Step)\nGive every \"Parasite\" family Spirit card in your Hand the effect: \"[High Speed] This Spirit can be summoned from the Hand during Flash Timing. Both the cost and the cores to be put onto this Spirit must be from the Reserve.\"",
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
    "cardNumber": "BS02-082",
    "name": "The Artifact Plant",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nGive all your Cost 2 White Spirits the \"Armed Machine\" family.\n\n[LV2] (Either Attack Step)\nWhen your \"Armed Machine\" family Spirits are exhausted, put a core from the Void to your Reserve for each of those exhausted Spirits.",
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
            "text": "Give all your Cost 2 White Spirits the \"Armed Machine\" family."
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
    "cardNumber": "BS02-084",
    "name": "The Blessed Sanctuary",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen your Yellow Spirits are destroyed, put a core from the Void to your Reserve.\n\n[LV2] (Either Attack Step)\nWhen your Yellow Spirits are destroyed, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-085",
    "name": "The Topaz Meteor",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every Nexus card in your Hand reduction symbols: [Yellow Core][Yellow Core].\n\n[LV2]\nYou can treat every Nexus you control as LV2.",
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
            "rule": "SYMBOL_MODIFIER",
            "text": "Give every Nexus card in your Hand reduction symbols: [Yellow Core][Yellow Core]."
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
            "rule": "TREAT_LEVEL",
            "text": "You can treat every Nexus you control as LV2."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-086",
    "name": "The Spiral Tower",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen the opponent would use a Magic effect, they must pay one extra cost.\n\n[LV2] (Your Attack Step)\nWhen the opponent would use a Magic effect, they must pay the entire cost from the Reserve.",
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
            "text": "When the opponent would use a Magic effect, they must pay one extra cost."
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
            "text": "When the opponent would use a Magic effect, they must pay the entire cost from the Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-087",
    "name": "The Sealed Spellbook",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Turn)\nYou can change the target of Magic effects that target both players to either only you, or only the opponent.\n\n[LV2] (Your Attack Step)\nWhen you draw via Spirit/Magic effects, double the total number of the cards you would draw. (This effect doesn't stack.)",
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
            "text": "You can change the target of Magic effects that target both players to either only you, or only the opponent."
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
            "text": "When you draw via Spirit/Magic effects, double the total number of the cards you would draw."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-088",
    "name": "Cross Fire",
    "cardType": "Magic",
    "effect": "[Main]\nEach player chooses and destroys a Nexus they control. This effect can't be used unless each player controls at least one Nexus.\n\n[Flash]\nDuring this turn, give a Spirit +1000 BP.",
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
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "This effect can't be used unless each player controls at least one Nexus."
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
    "cardNumber": "BS02-089",
    "name": "Spirit Link",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give a Spirit you control: \"[Awaken] During Flash Timing, you can put any number of cores from Spirits you control to this Spirit.\"",
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
    "cardNumber": "BS02-091",
    "name": "Seventh Crimson",
    "cardType": "Magic",
    "effect": "[Main]\nBy sending all cores from a 7000 BP or more Spirit you control to the Void, send seven cores from any opposing Spirits to their Reserve.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
          },
          {
            "op": "CORE_DRAIN",
            "count": 7,
            "to": "RESERVE"
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
    "cardNumber": "BS02-092",
    "name": "Energy Drain",
    "cardType": "Magic",
    "effect": "[Main]\nSend a core from any opposing Nexus/the opposing Reserve to their Trash.\n\n[Flash]\nDuring this turn, give a Spirit +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "TRASH"
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
    "cardNumber": "BS02-093",
    "name": "Mind Control",
    "cardType": "Magic",
    "effect": "[Main]\nBoth players send a total of four cores from Spirits they control to the owner's Trash.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-094",
    "name": "Bloody Rain",
    "cardType": "Magic",
    "effect": "[Main]\nIf there is a total of 10 to 19 cores on the opposing Field/Trash/Reserve, the opponent sends two cores among them to the Void. If there are 20 cores or more, they send six cores among them to the Void.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "VOID"
          },
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 6
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
    "cardNumber": "BS02-095",
    "name": "Sacrifice",
    "cardType": "Magic",
    "effect": "[Flash]\nBy destroying a Nexus you control, send every core from all opposing Nexuses to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_NEXUS",
            "count": 1
          },
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "TRASH"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-096",
    "name": "Divine Wind",
    "cardType": "Magic",
    "effect": "[Main]\nSummon a Spirit card from your Hand with a Cost equal or inferior to the number of cores in your Trash, without paying the cost. However, any (When Summoned) effects of the Spirit summoned by this effect can't activate.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
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
            "text": "any (When Summoned) effects of the Spirit summoned by this effect can't activate."
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
    "cardNumber": "BS02-097",
    "name": "Nature Forces",
    "cardType": "Magic",
    "effect": "[Flash]\nSend every core from your Trash to a Spirit you control. This effect can't be used during the Main Step.",
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
            "op": "PASSIVE_RULE",
            "rule": "RESTRICT_MAIN_STEP",
            "text": "This effect can't be used during the Main Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-099",
    "name": "Life Chain",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy a Spirit you control. Put a number of cores from the Void to your Reserve equal to the cost of the destroyed Spirit.",
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
    "cardNumber": "BS02-102",
    "name": "White Potion",
    "cardType": "Magic",
    "effect": "[Flash]\nRefresh a Spirit you control.",
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
    "cardNumber": "BS02-103",
    "name": "Reload Cores",
    "cardType": "Magic",
    "effect": "[Main]\nFor each \"Armed Machine\" family Spirit you control, put a core from the Void to your Reserve.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-104",
    "name": "Additional Color",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give a Spirit an additional color that is different from its original color.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_COLOR",
            "text": "During this turn, give a Spirit an additional color that is different from its original color."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-106",
    "name": "Royal Potion",
    "cardType": "Magic",
    "effect": "[Flash]\nRefresh all Cost 2 Spirits.",
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
    "cardNumber": "BS02-107",
    "name": "Time Reap",
    "cardType": "Magic",
    "effect": "[Main]\nActivate a (When Summoned) effect of a Spirit you control.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "rule": "ACTIVATE_TRIGGER",
            "text": "Activate a (When Summoned) effect of a Spirit you control."
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
    "cardNumber": "BS02-108",
    "name": "Magic Book",
    "cardType": "Magic",
    "effect": "[Main]\nBy putting any number of Magic cards from your Hand onto the Removed Zone, for each card you put, draw a card.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
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
    "cardNumber": "BS02-109",
    "name": "Angel Voice",
    "cardType": "Magic",
    "effect": "[Flash]\nWhen the battle resolves, instead of comparing BP, compare the Levels of the Spirits, and destroy the Spirit with a lower Level. If their Levels are the same, destroy both players' Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COMPARE_LV_INSTEAD_OF_BP",
            "text": "When the battle resolves, instead of comparing BP, compare the Levels of the Spirits"
          },
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
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
    "cardNumber": "BS02-110",
    "name": "Heavy Gate",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all Cost 1 or less Spirits can't attack nor block.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "During this turn, all Cost 1 or less Spirits can't attack nor block."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS02-111",
    "name": "Spirit Illusion",
    "cardType": "Magic",
    "effect": "[Main]\nChoose a color among the colors of either player's Spirits. During this turn, every Spirit of the chosen color is treated as being at its highest Level.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "rule": "CHOOSE_COLOR",
            "text": "Choose a color among the colors of either player's Spirits."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_AS_MAX_LEVEL",
            "text": "During this turn, every Spirit of the chosen color is treated as being at its highest Level."
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
    "cardNumber": "BS02-X05",
    "name": "The TwinRowdy Diranos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nAll your Spirits with [Awaken] gain +1000 BP.\n\n[LV2][LV3] (Either Attack Step)\nGive all your \"Terra Dragon\" family Spirits: \"[Awaken] During Flash Timing, you can put any number of cores from Spirits you control to this Spirit.\"",
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
          "keyword": "Awaken"
        },
        "amount": 1000
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "keyword": "Awaken"
      }
    ]
  },
  {
    "cardNumber": "BS02-X06",
    "name": "The SevenShogun Destlord",
    "cardType": "Spirit",
    "effect": "[LV1] (When Summoned)\nExhaust every LV2 Spirit.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, put a number of cores from the Void to your Reserve equals to the number of cores on that destroyed opposing Spirit.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS02-X07",
    "name": "The Gigantic Thor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nBy exhausting one of your \"Armed Machine\" family Spirits, give this Spirit + (Exhausted Spirit's BP) BP.\n\n[LV2][LV3] (When Blocks)\nWhen this Spirit blocks an opposing Red Spirit, it doesn't exhaust.\n\n[LV3] (When Attacks)\nAt the end of battle, by destroying one of your \"Armed Machine\" family Spirits, this Spirit refreshes.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "BP_BUFF_TARGET",
            "amount": "EXHAUSTED_SPIRIT_BP",
            "count": 1
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "When this Spirit blocks an opposing Red Spirit, it doesn't exhaust."
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
    "cardNumber": "BS02-X08",
    "name": "The ArcAngelia Mikafar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nFor each Yellow Spirit/Nexus you control, reveal a card from your decktop. Add every Magic card among them to your Hand. Return any remaining cards to the deckbottom.\n\n[LV2]\nYou can use Magic cards from your Hand/Removed Zone, without paying the cost.",
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
            "text": "For each Yellow Spirit/Nexus you control, reveal a card from your decktop."
          },
          {
            "op": "SALVAGE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RETURN_REVEALED_BOTTOM",
            "text": "Return any remaining cards to the deckbottom."
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
            "rule": "CAST_MAGIC_FREE",
            "text": "You can use Magic cards from your Hand/Removed Zone, without paying the cost."
          }
        ]
      }
    ]
  }
];

for (const spec of BS02_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
