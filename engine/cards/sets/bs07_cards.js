/**
 * engine/cards/sets/bs07_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS07_SAGA_CARDS)
 * Total Cards: 82 (76 Effect, 6 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS07_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10126",
    "name": "The FuryRockWyvern Dragorock",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Clash (When Attacks) The opponent must block if possible.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1058",
    "name": "Necrow",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Curse (During Your Battle Phase) Each time this spirit is blocked, destroy the spirit that blocked this spirit at End of Battle Step.",
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
            "rule": "KEYWORD_ACTION",
            "text": "Each time this spirit is blocked, destroy the spirit that blocked this spirit at End of Battle Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10626",
    "name": "The Healing Fountain",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] All your Spirits with Holy Life gain +1000 BP\n\n[LV2] (Your Attack Step) All your Spirits with Holy Life can't be blocked by opposing Cost 3 or less Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10820",
    "name": "The HighPriestess Lilu-Succubus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Activate the (When Destroyed) effects of all Spirits you control, without them being destroyed.",
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
            "rule": "ACTIVATE_TRIGGER",
            "text": "Activate the (When Destroyed) effects of all Spirits you control, without them being destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10824",
    "name": "The Hill of Big Windmill",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] When your Nexus is destroyed due to opposing Spirit/Nexus/Magic effects, target a color; exhaust every opposing Spirit with the chose color.\n\n[LV2] (Opposing Attack Step) All your Spirits' Windstorm effect changes to: \"Windstorm: 1 (When Blocks) The opponent must exhaust a Spirit they control.\"",
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
        "overall": "WHEN_BLOCKS",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11306",
    "name": "The MachineryMonster Giga-Therium",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll the (When Blocks) effects of \"Machine Beast\"/\"Giant Beast\" family Spirits you control activate as (When Attacks) effects.\n\n[LV2] (When Blocks)\nThis Spirit gains +3000 BP.",
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
            "text": "All the (When Blocks) effects of \"Machine Beast\"/\"Giant Beast\" family Spirits you control activate as (When Attacks) effects."
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
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13948",
    "name": "Turon Slash",
    "cardType": "Magic",
    "effect": "Main- During this turn, when your Spirit is blocked, send a core from the blocking opposing Spirit to the Reserve.\n\nFlash- During this turn, give a \"Braver\"-named Spirit you control +5000 BP.",
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
            "amount": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14336",
    "name": "Warlwind",
    "cardType": "Magic",
    "effect": "Main - During this turn, the Spirit(s) that the opponent would exhaust due to Windstorm effect is targeted by you instead.\n\nFlash - During this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BATTLE-SPIRITS-A2839",
    "name": "Arms Impact",
    "cardType": "Magic",
    "effect": "Flash - When your Spirit is blocking an opposing Spirit, destroy a Cost 4 or less Spirit you control, and you can destroy any number of opposing Spirits up to the cost of your destroyed Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "When your Spirit is blocking an opposing Spirit, destroy a Cost 4 or less Spirit you control, and you can destroy any number of opposing Spirits up to the cost of your destroyed Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2988",
    "name": "Basilizard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) For each opposing Cost 3 or less Spirit, this Spirit gains +1000 BP .",
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
    "cardNumber": "BATTLE-SPIRITS-A3161",
    "name": "Bloom Flute",
    "cardType": "Magic",
    "effect": "Flash - In this battle, when your Spirit with \"Holy Life\" is blocked, add one Core from the Void to your Life.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3188",
    "name": "Brionagon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) By destroying a Spirit with Curse you control, choose and return a \"Vanity Deity\"/ \"Deified General\" family Spirit card from your Trash to your Hand.\n\n[LV3] All your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest Levels.",
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
            "count": 1,
            "filter": {
              "type": "Spirit"
            }
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
            "rule": "TREAT_RULE",
            "text": "All your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest Levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3263",
    "name": "Ashtal",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3962",
    "name": "Dyrfangs",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles) Put a core from the Void to a \"Vanity Deity\"/\"Deified General\" family Spirit you control.\n\n[LV3] All \"Vanity Deity\"/\"Deified General\" family Spirits you control are treated as being on their highest Levels.",
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
            "rule": "MOVE_CORE",
            "text": "Put a core from the Void to a \"Vanity Deity\"/\"Deified General\" family Spirit you control."
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
            "rule": "TREAT_RULE",
            "text": "All \"Vanity Deity\"/\"Deified General\" family Spirits you control are treated as being on their highest Levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4130",
    "name": "Felarl Slash",
    "cardType": "Magic",
    "effect": "Main- Destroy every opposing 2000 BP or less Spirit.\n\nFlash- During this turn, a \"Braver\"-named Spirit you control gains +5000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 2000,
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
            "amount": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4339",
    "name": "Galadolg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step) When your \"Vanity Deity\"/\"Deified General\" family Spirit is summoned, you can deploy a Nexus card from the Trash, without paying the cost.\n\n[LV3] Every \"Vanity Deity\"/\"Deified General\" family Spirit you control are treated as being on its highest level.",
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "Every \"Vanity Deity\"/\"Deified General\" family Spirit you control are treated as being on its highest level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4741",
    "name": "Gulyver",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash- High Speed- You can summon this Spirit card from the Hand during Flash Timing. When you do, the cost and cores to be put on this Spirit must be paid and put from your Reserve.\n\n[LV1][LV2][LV3] (When Summoned) During this turn, all \"Blade Beast\" family Spirits you control gain +1000 BP.",
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
            "rule": "SUMMON_THIS_CARD",
            "text": "High Speed- You can summon this Spirit card from the Hand during Flash Timing."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "When you do, the cost and cores to be put on this Spirit must be paid and put from your Reserve."
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
            "op": "BP_BUFF_ALLIES",
            "amount": 1000,
            "filter": {
              "family": "Blade Beast"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A5057",
    "name": "Hippocampoo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6173",
    "name": "La-Diablord",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step) All your \"Deified General\" family Spirits gain +2000 BP.\n\n[LV3] All your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest levels.",
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
        "amount": 2000
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
            "rule": "TREAT_RULE",
            "text": "All your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6316",
    "name": "Lunar Slash",
    "cardType": "Magic",
    "effect": "Main - During this turn, any non-Tribute-Summon opposing Spirits that block your Spirits cannot activate any effects.\n\nFlash - During this turn, one Spirit on your Field with \"Braver\" in its name gains +5000BP.",
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
    "cardNumber": "BATTLE-SPIRITS-A6338",
    "name": "Maclarn Slash",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Choose a Spirit on your Field with a \"When This Spirit Blocks\" effect. For the duration of this turn, this Spirit's specified effect now activates when this Spirit attacks.\n\n(Flash Step) For the duration of this turn, one Spirit on your Field with \"Braver\" in its name gains +5000BP.",
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
            "rule": "CARD_RULE_MODIFIER",
            "text": "Choose a Spirit on your Field with a \"When This Spirit Blocks\" effect."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CARD_RULE_MODIFIER",
            "text": "For the duration of this turn, this Spirit's specified effect now activates when this Spirit attacks."
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
    "cardNumber": "BATTLE-SPIRITS-A6935",
    "name": "Nexus Attack",
    "cardType": "Magic",
    "effect": "Flash - During this turn, give one of your Spirits with \"Assault\" +2000 BP for every exhausted Nexus on your Field.",
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
    "cardNumber": "BATTLE-SPIRITS-A7204",
    "name": "Plasbat",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Send one Core from any opposing Spirits to your opponent's Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7375",
    "name": "Rakudacho",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Windstorm: 1 - (When Attacks) When this Spirit is blocked, the opponent exhausts the specified number of Spirits they control.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8041",
    "name": "Spearmink",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8546",
    "name": "The Artifact Vellnd",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Armor:Blue -This Spirit is unaffected by opposing Blue Spirit/Nexus/Magic effects.",
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
            "text": "Armor:Blue -This Spirit is unaffected by opposing Blue Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9045",
    "name": "The CherryBlossomFairy Ouka",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Flash- By exhausting this Spirit, give an attacking Spirit with Holy Life you control +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
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
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9924",
    "name": "The FortuneTeller Deasha",
    "cardType": "Spirit",
    "effect": "[LV2] (When Destroyed) The opponent choose a card from their Hand and return it to the decktop.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-001",
    "name": "Rainydle",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS07-005",
    "name": "The HalberdBraver Arc",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nNeither player's Life can be reduced by the attacks of Cost 2 or less Spirits.\n\n[LV2][LV3] (When Attacks)\nDestroy an opposing 2000 BP or less Spirit.",
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
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
            "maxBp": 2000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-007",
    "name": "The Astrologist Dragron",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nChoose and return a Spirit card from your Trash to the Hand. If that card is a \"Soldier\" family Spirit card, destroy an opposing 3000 BP or less Spirit.",
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
    "cardNumber": "BS07-008",
    "name": "The BladeDinosaur Bragasaur",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nFor each \"Soldier\" family Spirit you control, this Spirit gains +1000 BP.\n\n[LV2][LV3] (Your Attack Step)\nGive all \"Terra Dragon\" family Spirits you control the \"Soldier\" family.",
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
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Soldier"
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
            "rule": "GRANT_FAMILY",
            "text": "Give all \"Terra Dragon\" family Spirits you control the \"Soldier\" family."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-009",
    "name": "The SwordDragonEmperor Ex-Calibus",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with a designated cost to the designated area.\n\n[LV1][LV2] (When Summoned)\nYou can destroy any number of opposing Spirits up to a total of 6000 BP.\n\n[LV2] [Clash] (When Attacks)\nThe opponent must block if possible.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with a designated cost to the designated area."
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
            "maxBp": 6000,
            "count": 1,
            "allMatching": true
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
    "cardNumber": "BS07-014",
    "name": "The ScytheBraver Zanba",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nNeither player's Life can be reduced by the attacks of Cost 2 or less Spirits.\n\n[LV3] (When Attacks)\nSend a core from any opposing Spirits to their Reserve.",
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
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
    "cardNumber": "BS07-016",
    "name": "The HellBraver Deathcarabia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nDiscard a card from your decktop. If that card is a Purple Spirit card, this Spirit remains on the Field, refreshed.\n\n[LV2] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
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
    "cardNumber": "BS07-017",
    "name": "The HellBeastMan Zabullgan",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Trash.\n\n[LV1][LV2][LV3] (When Summoned)\nSend a core from any opposing Spirit to the Void.\n\n[LV2][LV3] (When Destroyed)\nSend two cores from any opposing Spirits to the Void.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-021",
    "name": "The BladeBraver Volza",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player's Life can be reduced by the attacks of Cost 2 or less Spirits.\n\n[LV2] (When Battles)\nWhen only the opposing Cost 3 or less Spirit is destroyed by comparing BP, refresh this Spirit.",
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-022",
    "name": "BlackCaracalossom",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Flash -\nBy returning one of your battling [Caracalossom] to the Hand, summon this Spirit card from your Hand in exhausted state and battle in its place.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "summon this Spirit card from your Hand in exhausted state and battle in its place."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-025",
    "name": "The Elder Buchi-Energy",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nAt the end of of battle, you can summon a Green Cost 3 or less Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of the Spirit summoned by this effect can't activate.",
    "isVanilla": false,
    "abilities": [
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of the Spirit summoned by this effect can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-026",
    "name": "The StingBeast Matsunoarashi",
    "cardType": "Spirit",
    "effect": "Tribute: Cost 3 or more → Trash -\nAfter paying for the summoning cost, you must send all core from one of your Cost 3 or more Spirits to the Trash.\n\n[LV1][LV2] (When Attacks) When only the opposing Spirit is destroyed through BP comparison, send a core from the opposing Life to the Reserve.\n\n[LV2] All your \"Blade Beast\" family Spirits get +1000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Tribute: Cost 3 or more → Trash -"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from one of your Cost 3 or more Spirits to the Trash."
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
          ]
        },
        "targetFilter": {
          "family": "Blade Beast"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS07-027",
    "name": "The BlastMarquis Kokatleaf",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts the designated number of Spirits they control.\n\n[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, refresh all your Spirits with 1.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-029",
    "name": "Kigna-Swan",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS07-030",
    "name": "The Sacred Laevateinn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen only the opposing Spirit is destroyed by comparing BP with your [The Gigantic Thor]/[The ArmoredSacred Walhalance], refresh this Spirit.",
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
    "cardNumber": "BS07-031",
    "name": "The BowBraver Ullr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nNeither player's Life can be reduced by the attacks of Cost 2 or less Spirits.\n\n[LV2][LV3] [Armor: Red/White]\nThis Spirit is unaffected by opposing Red/White Spirit/Nexus/Magic effects.",
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
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
    "cardNumber": "BS07-032",
    "name": "Hail-Garf",
    "cardType": "Spirit",
    "effect": "[LV2] (When Blocks)\nThis Spirit gains +3000 BP.",
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
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-033",
    "name": "The ChiefLibrarian Saga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen your Life would be reduced by an opposing Spirit's attack, you can discard a card from your decktop. If that's a White Magic card, your Life won't be reduced.\n\n[LV2][LV3]\nWhen cards are discarded from your deck via this Spirit's effect, if it's a Magic card, add it to the Hand.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 1
          },
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
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "When cards are discarded from your deck via this Spirit's effect, if it's a Magic card, add it to the Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-034",
    "name": "Durackdahl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Armor: Purple/Green/White]\nThis Spirit is unaffected by opposing Purple/Green/White Spirit/Nexus/Magic effects.\n\n[LV3]\nAll your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest Levels.",
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
        "keyword": "Armor: Purple/Green/White"
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
            "rule": "TREAT_RULE",
            "text": "All your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest Levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-035",
    "name": "The SteelWingFish Orcanon",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Trash.\n\n[LV1][LV2] (When Summoned)\nReturn an opposing Spirit without [Tribute] to the Hand.\n\n[LV2] (Your Attack Step)\nAll your \"Flying Fish\" family Spirits can't be blocked by opposing 4000 BP or less Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-039",
    "name": "The Macaroni Pentan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nIf you control [The Kaiser Empereur]/[The Penpress], return this Spirit to the Hand.",
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
    "cardNumber": "BS07-041",
    "name": "The SwordBraver Ryute",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nNeither player's Life can be reduced by the attacks of Cost 2 or less Spirits.\n\n[LV3] (When Battles)\nThe opposing Spirit battling with this Spirit is treated as LV1.",
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
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
            "rule": "TREAT_LEVEL",
            "text": "The opposing Spirit battling with this Spirit is treated as LV1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-043",
    "name": "The Penpress",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nWhen your \"Pentan\"-named Spirit is destroyed, refresh this Spirit.\n\n[LV2][LV3]\nAll \"Pentan\"-named Spirit cards in your Hand become Cost 3.\n\n[LV3]\nFor each \"Pentan\"-named Spirit you control, this Spirit gains +1000 BP.",
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
            "text": "All \"Pentan\"-named Spirit cards in your Hand become Cost 3."
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS07-044",
    "name": "The GreatAngelia Tron",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from one of your Spirits with a designated cost to the designated area.\n\n[LV1][LV2] (When Summoned)\nDuring this turn, this Spirit can't be blocked.\n\n[LV2] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Spirits with a designated cost to the designated area."
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
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
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-045",
    "name": "The HolyEmperorBeast Sphin-Cross",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon an \"Imaginary Beast\" family Spirit card from your Hand, without paying the cost.\n\n[LV1][LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.\n\n[LV3] (When Attacks)\nWhen blocked by an opposing Spirit that is not at its highest Level, refresh this Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-046",
    "name": "The PantherMan Berserkas",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS07-047",
    "name": "The Merman Apkareel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen the opponent uses a Magic effect, put a core from the Void to this Spirit.",
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
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-049",
    "name": "Cannon-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's LV.\n\n[LV2][LV3] (When Attacks)\nDestroy every opposing Cost 1 Spirit.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy every opposing Cost 1 Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-051",
    "name": "The AxeBraver Coyo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player's Life can be reduced by the attacks of Cost 2 or less Spirits.\n\n[LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
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
    "cardNumber": "BS07-052",
    "name": "The Fencer Falconia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Assault: 1] (When Attacks)\nhis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
    "cardNumber": "BS07-053",
    "name": "Island-Golem",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Trash]\nAfter paying for the summoning cost, you must send all cores from a Spirit you control with a designated or higher cost to the targeted area.\n\n[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's LV.\n\n[LV2][LV3] (Either Attack Step)\nWhen cards are discarded from the opposing deck due to [Crush] effect, it discards +3 cards.",
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
    "cardNumber": "BS07-054",
    "name": "The PhoenicDeity Phoenix-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can deploy a Nexus card from your Hand, without paying the cost.\n\n[LV2][LV3]\nWhen this Spirit refreshes, discard four cards from the opposing decktop.\n\n[LV3] [Assault: 3] (When Attacks)\nThis Spirit can, up to three times per turn, be refreshed by exhausting one of your Nexuses.",
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
            "op": "DEPLOY_NEXUS_FROM_TRASH",
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 3
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-055",
    "name": "The Meteor Stream Nightsky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive all your \"Soldier\" family Spirits: \"[Awaken] During Flash Timing, you can send any number of cores from Spirits you control to this Spirit.\"\n\n[LV2] (Your Attack Step)\nAll your \"Astral Dragon\" family Spirits gain +2000 BP.",
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
        "keyword": "Awaken"
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "targetFilter": {
          "family": "Astral Dragon"
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS07-056",
    "name": "The Fall of Meteorite",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Nexus is destroyed by opposing Spirit/Nexus/Magic effects, destroy every opposing 3000 BP or less Spirit.\n\n[LV2] (Your Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your Spirit with [Clash], destroy an opposing 3000 BP or less Spirit.",
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
            "allMatching": true
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
        "keyword": "Clash"
      }
    ]
  },
  {
    "cardNumber": "BS07-057",
    "name": "The Decayed Swamp",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Nexus is destroyed by opposing Spirit/Nexus/Magic effects, send a core each from every opposing Spirit to their Trash.\n\n[LV2] (Either Attack Step)\nEvery LV1 Spirit can't attack/block.",
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
            "rule": "COMBAT_RESTRICTION",
            "text": "Every LV1 Spirit can't attack/block."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-058",
    "name": "The Darkness Church",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your End Step)\nBy using the cores on your Field to pay for the cost, you can summon a Cost 3 or less \"Nightling\" family Spirit card from your Trash.\n\n[LV2] (Your Draw Step)\nBy not drawing a card, you can choose and return a \"Nightling\" family Spirit card from your Trash to the Hand.",
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
            "rule": "DRAW",
            "text": "By not drawing a card"
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
    "cardNumber": "BS07-061",
    "name": "The Gears Plain",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen an opposing Cost 2 or less Spirit attacks, refresh every \"Machine Beast\" family Spirits you control.\n\n[LV2]\nGive all your \"Machine Beast\"/\"Giant Beast\" family Spirits the effect: \"(When Blocks) This Spirit gains +2000 BP.\"",
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
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {
              "family": "Machine Beast"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-062",
    "name": "The Necklace of Brisingamen",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Nexuses are destroyed by opposing Spirit/Nexus/Magic effect, the opponent returns three of their Spirits to the decktop in any order.\n\n[LV2] (Opposing Attack Step)\nOnce per turn, when your Spirit blocks an opposing Spirit without [Tribute], your Spirit don't become exhausted.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-063",
    "name": "The Secret Flower Garden",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Nexus is destroyed by opposing Spirit/Nexus/Magic effects, put a core from the Void to your Life.\n\n[LV2] (Opposing Start Step)\nBy exhausting a \"Fairy\" family Spirit you control, during this turn, your Life can't be reduced by attacks of Cost 3 or less Spirits.",
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
            "to": "LIFE",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "during this turn, your Life can't be reduced by attacks of Cost 3 or less Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-065",
    "name": "The Golem Factory",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen blocking an opposing Spirit with the same cost, your \"Artificial Soldier\" family Spirits do not get exhausted.\n\n[LV2] (Either Attack Step)\nEvery Cost 3 or more \"Artificial Soldier\" family Spirit you control gains +2000 BP.",
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
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "targetFilter": {
          "family": "Artificial Soldier"
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS07-066",
    "name": "The Historic Assault Field",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Nexus is destroyed by opposing Spirit/Nexus/Magic effects, destroy every opposing Cost 3 or less Spirit.\n\n[LV2] (Opposing Attack Step)\nThe [Assault] effect of your Spirits also activates at (When Blocks).",
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
            "op": "DESTROY_NEXUS",
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "The [Assault] effect of your Spirits also activates at (When Blocks)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-067",
    "name": "Meteor Fall",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, treat the color of a Spirit you control as Blue, and it gains +2000 BP.",
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
    "cardNumber": "BS07-069",
    "name": "Reborn Flame",
    "cardType": "Magic",
    "effect": "[Main]\nReturn a Spirit card from your Trash to the Hand. During this turn, give every \"Astral Dragon\" family Spirit card in your Hand an extra [Red Core] reduction symbol.\n\n[Flash]\nDuring this turn, give a Spirit +1000 BP.",
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
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-070",
    "name": "Black Ritual",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, When your Spirits are destroyed by opposing Spirit/Nexus/Magic effects and activated their (When Destroyed) effects, return them to your Hand.\n\n[Flash]\nDuring this turn, give a Spirit +1000 BP.",
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
    "cardNumber": "BS07-071",
    "name": "Dirty Fist",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this battle, when the attack of your Spirit reduces the opposing Life, draw two cards.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS07-074",
    "name": "Needle Shot",
    "cardType": "Magic",
    "effect": "Flash - During this battle, give a \"Blade Beast\" family Spirit you control +2000 BP. When only the opposing Spirit is destroyed by comparing BP with that Spirit, exhaust an opposing Spirit.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-075",
    "name": "Fordia Slash",
    "cardType": "Magic",
    "effect": "Main- During this turn, opposing Spirit/Nexus/Magic's \"BP Increase\" effects can't activate.\n\nFlash- During this turn, give a \"Braver\"-named Spirit you control +5000 BP.",
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
            "text": "During this turn, opposing Spirit/Nexus/Magic's \"BP Increase\" effects can't activate."
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
    "cardNumber": "BS07-076",
    "name": "Diamond Strike",
    "cardType": "Magic",
    "effect": "Flash - Refresh an \"Armed Machine\" family Spirit you control.",
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
    "cardNumber": "BS07-083",
    "name": "Wirian Slash",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, while your \"Soldier\" family Spirit is attacking, the opponent can't use effects of cards from their Hand during Flash Timing.\n\n[Flash]\nDuring this turn, a \"Braver\"-named Spirit you control gains +5000 BP.",
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
            "rule": "SET_RESTRICTION",
            "text": "During this turn, while your \"Soldier\" family Spirit is attacking, the opponent can't use effects of cards from their Hand during Flash Timing."
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
    "cardNumber": "BS07-X25",
    "name": "The StarEmperorDragon Meteorwurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV2][LV3] (Your Attack Step)\nGive all your \"Soldier\" family Spirits: [Clash].\n\n[LV3] (Your Attack Step)\nWhen your Spirit with [Clash] attacks, you can target and attack an opposing Spirit.",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-X26",
    "name": "The BladeKingBeast Byak-Garo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts two Spirits they control.\n\n[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, by sending a core from your Reserve to your Trash, return two opposing Spirits without [Tribute] to the Hand.",
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
        "subCost": {
          "type": "PAY_RESERVE_CORES",
          "count": 1
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
    "cardNumber": "BS07-X27",
    "name": "The ArcAngelia Isfiel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles)\nYou can use a Magic card without paying the cost, and after the Magic effect resolves, you can activate the same effect once and only once more.\n\n[LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.",
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
            "rule": "CAST_MAGIC_FREE",
            "text": "You can use a Magic card without paying the cost, and after the Magic effect resolves, you can activate the same effect once and only once more."
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS07-X28",
    "name": "The GiantEmperor Alexander",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Assault: 2] (When Attacks)\nThis Spirit can, up to twice per turn, be refreshed by exhausting a Nexus you control.\n\n[LV2] (When Attacks)\nDestroy an opposing Cost 4 or less Spirit, and discard a number of cards from the opposing decktop equal to the cost of the destroyed opposing Spirit.",
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
            "maxTimes": 2
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
            "maxCost": 4,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "PAO-PEIR2",
    "name": "Pao-Peir",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed) By exhausting an \"Imaginary Beast\" family Spirit you control, this Spirit remains on the Field, refreshed.\n\n[LV3] All your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest Levels.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
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
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "All your \"Vanity Deity\"/\"Deified General\" family Spirits are treated as being on their highest Levels."
          }
        ]
      }
    ]
  }
];

for (const spec of BS07_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
