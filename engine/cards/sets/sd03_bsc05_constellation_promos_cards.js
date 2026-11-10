/**
 * engine/cards/sets/sd03_bsc05_constellation_promos_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (SD03_BSC05_CONSTELLATION_PROMOS_SAGA_CARDS)
 * Total Cards: 124 (120 Effect, 4 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const SD03_BSC05_CONSTELLATION_PROMOS_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10361",
    "name": "The GorgeousMoonDragon Strikewurm-Procyon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed)\nBy discarding a card from your Hand or a face-up Magic card on your Removed Zone, this Spirit remains on the Field, refreshed.\n\n[When Braved] [LV2][LV3] (When This Spirit Brave Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, put a core from the Void to your Life.",
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
        "subCost": {
          "type": "DISCARD_HAND",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "By discarding a card from your Hand or a face-up Magic card on your Removed Zone"
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
            2,
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
    "cardNumber": "BATTLE-SPIRITS-A10667",
    "name": "The HeavenStarDragon Apollodragon-Spica",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can target and attack an opposing refreshed Spirit.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nDestroy an opposing Spirit with one core on it.",
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
            "text": "You can target and attack an opposing refreshed Spirit."
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
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10731",
    "name": "The HellLionKnight Marbalion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Send cores from two opposing Spirits to the Reserve until only one core remains on each of them.\n\n[LV3] (Your Attack Step) Your first attacking Spirit can target and attack an opposing exhausted Spirit.",
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
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "Your first attacking Spirit can target and attack an opposing exhausted Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10742",
    "name": "The HellWheel Buer",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nDraw a card, and send a core from any opposing Cost 4 or less Spirit to their Reserve.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10879",
    "name": "The HornetKing Fong-Need",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut three cores from the Void to this Spirit.\n\n[LV1][LV2] (When Attacks)\nExhaust any number of opposing Spirits up to a total of 10000 BP.\n\n[LV2] (When Attacks)\nWhen the opposing Life is reduced, by sending three cores from this Spirit to your Trash, refresh this Spirit.",
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
            "to": "SELF",
            "count": 3
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11192",
    "name": "The LegendaryDragon Ancientwurm",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 5 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nFor each \"Wurm\"-named Spirit you control, destroy an opposing Spirit. For each Spirit destroyed via this effect, put one core from the Void to your Life.\n\n[When Braved] [LV3] (When Battles)\nThis Spirit gains +5000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from a Cost 5 or more Spirit you control to the Void."
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
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11333",
    "name": "The MagicalPrincessDeity Geraldy",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 2/3/4] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 2/3/4 Spirit is destroyed.\n\n[LV1][LV2][LV3]\nWhen any Magic card is discarded from your deck by an opposing Spirit effect, during this turn, cards can't be discarded from your deck.\n\n[LV2][LV3] (When Battles)\nBy returning a card from your Trash to the deckbottom, send two cores from any opposing Spirits to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 2/3/4"
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
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
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
    "cardNumber": "BATTLE-SPIRITS-A11454",
    "name": "The MoonFangDragon Strikewurm-Sirius",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh this Spirit.\n\n[When Braved] [LV2][LV3] (When This Spirit Brave Attacks)\nWhen this Spirit's attack reduces the opposing Life, return an opposing Spirit with a cost equal or inferior to this Spirit's to the Hand.",
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
    "cardNumber": "BATTLE-SPIRITS-A11467",
    "name": "The MoonlightFairy Gekka",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Main Step)\nWhen you are summoning a \"Moonlight\"-named Spirit card, this Spirit gains two White symbols.\n\n[When Braved] [LV3] (Your Main Step)\nWhen your \"Moonlight\"-named Spirit is summoned, put a core from the Void to your Life.",
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
    "cardNumber": "BATTLE-SPIRITS-A11472",
    "name": "The MoonlightMusha Heike-Boruta",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cores on your \"Moonlight\"-named Spirits can't be removed by opposing Spirit/Brave/Magic effects.\n\n[When Braved] [LV2]\nWhen cores are removed from your Spirits due to opposing Spirit/Brave/Magic effects, for each core removed, send a core from any opposing Spirits to the Void.",
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
            "text": "The cores on your \"Moonlight\"-named Spirits can't be removed by opposing Spirit/Brave/Magic effects."
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
    "cardNumber": "BATTLE-SPIRITS-A11571",
    "name": "The NetherworldDeity Obsidion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV1][LV2][LV3]\nWhen your Spirits would be returned to the Hand due to the opponent, for each Spirit to be returned, the opponent discards a card from their Hand.\n\n[LV2][LV3] (When Attacks)\nWhen blocked by opposing Spirits, send a number of cores equal to the cost of the blocking Spirit from any opposing non-blocking Spirits to their Trash.",
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
            "rule": "DISCARD_HAND",
            "text": "When your Spirits would be returned to the Hand due to the opponent, for each Spirit to be returned, the opponent discards a card from their Hand."
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
            "text": "When blocked by opposing Spirits, send a number of cores equal to the cost of the blocking Spirit from any opposing non-blocking Spirits to their Trash."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11686",
    "name": "The PhantomLeoDragon Apollodragon-Denebola",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 5 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 5 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (Your Attack Step)\nAll your Spirits can target and attack one opposing Spirit when they attack.\n\n[When Braved] [LV3] (When Brave Attacks)\nDuring this battle, all cores on opposing destroyed Spirits are sent to the Void.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from a Cost 5 or more Spirit you control to the Void."
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
            "rule": "COMBAT_RULE",
            "text": "All your Spirits can target and attack one opposing Spirit when they attack."
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
            "rule": "REDIRECT_CORE_DESTINATION",
            "text": "During this battle, all cores on opposing destroyed Spirits are sent to the Void."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11722",
    "name": "The PhoenixDragon Phoenix-Sword",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[LV1] (When Summoned)\nDestroy every 4000 BP or less Spirit. Or, destroy all Nexuses.\n\n[When Braved] (When Brave Attacks)\nYou can target and attack an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
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
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": true
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_ATTACK",
            "text": "You can target and attack an opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11834",
    "name": "The RaptorDeity Galoud",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 5 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts five Spirits they control.\n\n[LV1][LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, discard twelve cards from the opposing decktop.\n\n[LV2] (Your Attack Step)\nWhen opposing Spirits are exhausted, for each of those Spirits, discard three cards from the opposing decktop.",
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
        "overall": "ATTACK_STEP",
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
    "cardNumber": "BATTLE-SPIRITS-A12238",
    "name": "The SevenShogun Beliot",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon a \"SevenShogun\"-named Spirit card from your Trash, without paying the cost.\n\n[LV1][LV2][LV3] (When Destroyed)\nSend a core from the opposing Field to their Trash.\n\n[LV2][LV3] (When Attacks)\nActivate one (When Destroyed) effect of a Spirit you control without destroying that Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12353",
    "name": "The SilverBrave Shield-Dragon",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] [Armor: White]\nThis Spirit is unaffected by opposing White Spirit/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Armor: White"
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12656",
    "name": "The StarArmoredDragon Sieg-Brave",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nDestroy an opposing 4000 BP or less Spirit.\n\n[When Braved]\nTreat this Spirit as having \"Siegwurm\" in name.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
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
            "rule": "TREAT_RULE",
            "text": "Treat this Spirit as having \"Siegwurm\" in name."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12808",
    "name": "The SunWyvern Flaredragoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles)\nDestroy an opposing Spirit with the same BP as this Spirit's.\n\n[When Braved] [LV2][LV3] (When Battles)\nFor each \"Sun\"-named Spirit you control, this Spirit gains +1000 BP.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
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
            "op": "BP_BUFF_SELF",
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Sun"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12858",
    "name": "The SuperDragonEmperor UltimateDragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nWhen your Spirit is destroyed by comparing BP this turn, this Spirit can't be blocked.\n\n[LV3] (Either Start Step)\nTarget a color. During this turn, every opposing Spirit loses one symbol of the targeted color.",
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
            "op": "GRANT_UNBLOCKABLE",
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
            "rule": "CHOOSE_COLOR",
            "text": "Target a color."
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
    "cardNumber": "BATTLE-SPIRITS-A12867",
    "name": "The SuperEmperor Siegpentan-Nova",
    "cardType": "Spirit",
    "effect": "[Tribute: Song Bird → Void]\nAfter paying for the summoning cost, you must send all core from a \"Song Bird\" family Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nIf \"The Kaiser Empereur\" was used for the [Tribute], summon any number of \"Pentan\"-named Spirit cards from your Hand/Trash, without paying the cost. However, the (When Summoned) effects of those Spirits can't activate.\n\n[LV3] (When Attacks)\nBy destroying three \"Pentan\"-named Spirits you control, this Spirit refreshes.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_EFFECT",
            "text": "the (When Summoned) effects of those Spirits can't activate."
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
            "maxBp": 5000,
            "count": 1
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
    "cardNumber": "BATTLE-SPIRITS-A12891",
    "name": "The SunCount Rubicante",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReturn a \"Sun\"-named Spirit card from your Trash to the Hand.\n\n[When Braved] [LV2][LV3] (When Destroyed)\nDestroy an opposing Brave Spirit. Then, the brave of this Spirit remains, and the Spirit alone returns to the Hand.",
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
    "cardNumber": "BATTLE-SPIRITS-A12911",
    "name": "The SunGiantSoldier Solar-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Main Step)\nNeither player can summon Braves without paying the cost.\n\n[When Braved] [LV2] (When Brave Attacks)\nFor each \"Sun\"-named Spirit you control, destroy an opposing Cost 3 or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A13225",
    "name": "The TwinAxeEmperor Gordias",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nCards in every player's Trash are unaffected by any other effects except this one.\n\n[LV2][LV3] (When Attacks)\nDestroy an opposing Cost 4 or less Spirit. When any Spirit is destroyed by this effect, refresh this Spirit.\n\n[LV3] (Your Attack Step)\nAt the beginning of the step, you can target an opposing Spirit. During this turn, the targeted Spirit is also treated as Cost 3.",
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
            "text": "Cards in every player's Trash are unaffected by any other effects except this one."
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
            "op": "DESTROY_BY_COST",
            "maxCost": 4,
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
            "rule": "TARGET",
            "text": "At the beginning of the step, you can target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "During this turn, the targeted Spirit is also treated as Cost 3."
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
    "cardNumber": "BATTLE-SPIRITS-A14261",
    "name": "Victory-White-Dragon",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] [Heavy Armor: Red/Purple]\nThis Spirit is unaffected by opposing Red/Purple Spirit/Brave/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Heavy Armor: Red/Purple"
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1501",
    "name": "The MoonlightArtifactDragon Crescenthor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nAll your \"Moonlight\"-named Spirits are unaffected by opposing Brave effects.\n\n[When Braved] [LV2] (When Blocks)\nWhen this Spirit is destroyed by an opposing 10000 BP or more Spirit via BP comparison, by sending a core from this Spirit to your Trash, this Spirit returns to your Field, refreshed.",
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
            "text": "All your \"Moonlight\"-named Spirits are unaffected by opposing Brave effects."
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1584",
    "name": "The ShadowMoonDragon Strikewurm-Betelgeuse",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen any opposing Spirit refreshes, this Spirit refreshes.\n\n[When Braved] [LV2][LV3] (When Blocks)\nReturn every opposing exhausted Spirit to the Hand.",
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
            2,
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
    "cardNumber": "BATTLE-SPIRITS-A2714",
    "name": "Arch-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nDestroy an opposing Cost 3 or less Spirit.\n\n[When Braved] (When Brave Attacks)\nThe opponent can only use Magic cards with the same color as symbols on their field.",
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
            "op": "DESTROY_BY_COST",
            "maxCost": 3,
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3331",
    "name": "Centrodriller",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nDestroy an opposing 4000 BP or less Spirit. Or, destroy an opposing Nexus.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 1,
            "allMatching": false
          },
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
    "cardNumber": "BATTLE-SPIRITS-A3865",
    "name": "ElectricFairy Birit",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed) Draw a card from your deck.\n\n[LV3] When another Spirit you control is destroyed, by returning this Spirit to your Hand, the destroyed Spirit returns to the Field in the same condition.",
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
            "op": "DRAW_CARDS",
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
    "cardNumber": "BATTLE-SPIRITS-A7434",
    "name": "Revol-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nPut two cores from the Void to a Nexus you control.\n\n[When Braved] (When Brave Attacks)\nTarget either Cost 3 or 4. During this battle, Magic cards with the targeted cost can't be used by the opponent.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
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
            "rule": "COST_MODIFIER",
            "text": "Target either Cost 3 or 4."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "During this battle, Magic cards with the targeted cost can't be used by the opponent."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7809",
    "name": "Shieldybug",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\nFlash - [High Speed]\nThis Brave card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Brave must also be from the Reserve.\n\n[When Braved] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 3 or more"
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
        "overall": "WHEN_BATTLES",
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
    "cardNumber": "BATTLE-SPIRITS-A8498",
    "name": "The ArmoredBushin Girafa-Rando",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Purple/White/Blue (Opposing Turn)\nWhen the opponent uses a Purple/White/Blue Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV1][LV2] (Opposing Attack Step)\nThis Spirit can block opposing Spirits while exhausted.\n\n[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh this Spirit and exhaust an opposing Spirit.",
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
            1,
            2
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
    "cardNumber": "BATTLE-SPIRITS-A8923",
    "name": "The CannonBeast Glypdon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] The attacks of Cost 2 or less Spirits can't reduce either player's Life.\n\n[LV2][LV3] Armor:White/Blue - This Spirit is unaffected by opposing White/Blue Spirit/Nexus/Magic effects.",
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
            "text": "The attacks of Cost 2 or less Spirits can't reduce either player's Life."
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
            "text": "Armor:White/Blue - This Spirit is unaffected by opposing White/Blue Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A902",
    "name": "The StationeryRobot Stationer",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Battles)\nWhen you use a Magic effect, after its effect resolves, destroy an opposing Spirit with a cost equal or inferior to the Magic's.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "WHEN_BATTLES",
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
    "cardNumber": "BATTLE-SPIRITS-A9158",
    "name": "The CretaceousMarshal Lay-Saurer",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit is unaffected by opposing Spirit effects.\n\n[LV1][LV2][LV3] (Start of Opposing Attack Step)\nYou can target an opposing Spirit. During this turn, that targeted Spirit can't attack.\n\n[LV2][LV3] (When Attacks/Blocks)\nAt the end of the battle, by returning a White Spirit you control to your Hand, this Spirit refreshes.",
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
            "text": "This Spirit is unaffected by opposing Spirit effects."
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
            "text": "You can target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this turn, that targeted Spirit can't attack."
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
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
    "cardNumber": "BATTLE-SPIRITS-A9393",
    "name": "The DinoDeity Gundinos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Assault: 2] (When Attacks)\nThis Spirit can, up to twice per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV1][LV2][LV3] (When Attacks)\nDestroy an opposing 5000 BP or less Spirit. When this effect destroys any opposing Spirit, draw a card.",
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
    "cardNumber": "BATTLE-SPIRITS-A9774",
    "name": "The FallenStarDragon Apollodragon-Arcturus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can target and attack an opposing exhausted Spirit.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nSend cores from an opposing Spirit to their Trash until one core remains.",
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
            "count": 2,
            "to": "TRASH",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9966",
    "name": "The FlyingBeetle Ittoukabuto",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nExhaust an opposing spirit.\n\n[When Braved] (When Brave Attacks)\nIf this is the first attack of your turn, refresh this Spirit.",
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
            "op": "EXHAUST_SPIRITS",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-014",
    "name": "The Shaman Dragno",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn a Spirit card from your Trash to the Hand.",
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
    "cardNumber": "BS01-025",
    "name": "The DragonicFortress Giga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can destroy an opposing 6000 BP or less Spirit.\n\n[LV2] (When Battles)\nWhen only the opposing Spirit is destroyed via BP comparison, you can send any number of cores from this Spirit to other Spirits/Nexuses you control.",
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
            "maxBp": 6000,
            "count": 1,
            "allMatching": false
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-058",
    "name": "Hercules-Geo",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS01-X02",
    "aliases": [
      "26RBS03-X06"
    ],
    "name": "The SevenShogun Desperado",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBesides this Spirit, send a core each from every Spirit to the owner's Reserve. For each Spirit destroyed by this effect, put a core from the Void to this Spirit.\n\n[LV2] (When Attacks)\nSend cores from a Spirit to its owner's Reserve until only one core left.",
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
            "to": "SELF",
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
    "cardNumber": "BS01-X03",
    "name": "The Duke Kingtaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each other Spirit you control, put a core from the Void to this Spirit.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve.",
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
            "to": "SELF",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
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
    "cardNumber": "BS03-119",
    "name": "Buster Lance",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy every LV1 Nexus.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
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
    "cardNumber": "BS05-074",
    "name": "Branch Lock",
    "cardType": "Magic",
    "effect": "[Flash]\nIf there are two or more colors of symbols on your Field, exhaust two opposing Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS05-X19",
    "name": "The SacredEmperor Siegfrieden",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nDestroy any number of opposing Spirits up to a total of cost 5. When the Tribute was [The DragonEmperor Siegfried]/[The ImpregnableFortress Odin], destroy up to a total of cost 8.\n\n[LV3] (When Attacks)\nDestroy two opposing 7000 BP or less Spirits.",
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
            "maxBp": 7000,
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-X20",
    "name": "The GreatArmoredLord Deathtaurus",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nFor each exhausted Spirit, put a core from the Void to this Spirit.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by BP comparison, send two cores from any opposing Spirits to the Void.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-016",
    "name": "Bronzemaiden",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDraw a card.",
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
    "cardNumber": "BS06-023",
    "name": "The DarkBishop Baculus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nSend cores from every Spirit to its owner's Reserve until only one core remains on each of them.",
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
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-029",
    "name": "Maparrot",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nPut a core from the Void to any of your Spirit.",
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
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-046",
    "name": "The KeyMaul Valgrind",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2] (When Summoned)\nReturn an opposing Spirit to the Hand.\n\n[LV2] (When Blocks)\nWhen this Spirit blocks an opposing 4000 BP or more Spirit, it refreshes.",
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
            "rule": "SET_HAND_COST",
            "text": "The cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6."
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
    "cardNumber": "BS06-073",
    "name": "The Burning Canyon",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Draw Step)\nIncrease the amount of cards you draw by +1. After you draw, discard a card from your Hand.\n\n[LV2] (Your Attack Step)\nEvery Spirit you control gains +1000 BP.",
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
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "After you draw, discard a card from your Hand."
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
    "cardNumber": "BS06-076",
    "name": "The Digged Tombstone",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen your Spirit is destroyed, draw a card.\n\n[LV2]\nOnce per turn, when your \"Zombie\" family Spirits are destroyed, by discarding a card from your Hand, they remain on your Field, refreshed.",
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
        "subCost": {
          "type": "DISCARD_HAND",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "when your \"Zombie\" family Spirits are destroyed, by discarding a card from your Hand, they remain on your Field, refreshed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-100",
    "name": "Thorn Prison",
    "cardType": "Magic",
    "effect": "[Flash]\nThe opponent exhausts two Spirits they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS06-X24",
    "name": "The ArmoredSacred Walhalance",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Armor: ∞]\nThis Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the same color as the symbols on the opposing Field.\n\n[LV2][LV3] (When Battles)\nBy exhausting an \"Armed Machine\" family Spirit you control, this Spirit gains + (the exhausted Spirit's BP) BP.\n\n[LV3] (When Attacks)\nReturn every opposing 4000 BP or less Spirit to the Hand.",
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
            "text": "This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the same color as the symbols on the opposing Field."
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
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
    "cardNumber": "BS09-036",
    "name": "The BlizzardEmperor Ullr",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3]\nThe attacks of Cost 4 or less Spirits can't reduce either player's Life.\n\n[LV2][LV3] [Armor: Red/Purple/White/Blue]\nThis Spirit is unaffected by opposing Red/Purple/White/Blue Spirit/Nexus/Magic effects.",
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
            "text": "The attacks of Cost 4 or less Spirits can't reduce either player's Life."
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
        "keyword": "Armor: Red/Purple/White/Blue"
      }
    ]
  },
  {
    "cardNumber": "BSC05-001",
    "name": "Soulhorse",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit's color and symbol are also treated as Red.",
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
            "rule": "TREAT_COLOR_SYMBOL",
            "text": "This Spirit's color and symbol are also treated as Red."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-002",
    "name": "The Magician Dragonaga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDraw a card.\n\n[LV3] (When Attacks)\nSend a core from any opposing Spirit to their Reserve.",
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
    "cardNumber": "BSC05-004",
    "name": "The ForestBird Sekkohkiji",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit's color and symbol are also treated as Red.",
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
            "rule": "TREAT_COLOR_SYMBOL",
            "text": "This Spirit's color and symbol are also treated as Red."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-005",
    "name": "Hinawazaru",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void to any of your Spirits.\n\n[LV2] (When Battles)\nWhen only the opposing Spirit is destroyed via BP comparison, this Spirit refreshes.",
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
    "cardNumber": "BSC05-006",
    "name": "The BushinBeast Tigerd-Shingen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nNeither player can remove cores from the battling Spirits.\n\n[LV2] (When Attacks)\nWhen the opposing Life is reduced, besides [The BushinBeast Tigerd-Shingen], refresh a Spirit you control.",
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
    "cardNumber": "BSC05-007",
    "name": "Igua-Buggy",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit's color and symbol are also treated as Red.",
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
            "rule": "TREAT_COLOR_SYMBOL",
            "text": "This Spirit's color and symbol are also treated as Red."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-009",
    "name": "The ArtifactDragon Swordrander",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nThis Spirit can block all opposing non-braved Spirits while exhausted.\n\n[LV3] (When Battles)\nWhen only the opposing Spirit is destroyed via BP comparison, return any number of opposing Spirits up to a total of Cost 4 to the Hand.",
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
            "text": "This Spirit can block all opposing non-braved Spirits while exhausted."
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-012",
    "name": "The ThunderBeast Raijoule",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Holy Life (When Attacks) When this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.\n\n[LV3] (Your Attack Step) Your Cost 10 Spirits can't be blocked by opposing Spirits with printed effects.",
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
    "cardNumber": "BSC05-013",
    "name": "The BlackWingDragon Burn-Crow",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Battles)\nWhen this Spirit is destroyed by opposing Spirit via BP comparison, send an opposing Life to their Reserve. Then, the Brave of this Brave Spirit remains on the Field, and only the Spirit returns to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
    "cardNumber": "BSC05-014",
    "name": "The BladeWolf Beo-Wulf",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, send two opposing Lives to their Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-015",
    "name": "The BeastArmor Megabison",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[During Brave] [Armor: Red/Green/White]\nThis Spirit is unaffected by opposing Red/Green/White Spirit/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Armor: Red/Green/White"
      }
    ]
  },
  {
    "cardNumber": "BSC05-016",
    "name": "The HeavenHornBeast Bicorn",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Brave Attacks)\nWhen this battle resolves, if the opposing blocking Spirit is 6000 BP or less, by not comparing BP, treat this Spirit as not being blocked.",
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
            "rule": "TREAT_RULE",
            "text": "When this battle resolves, if the opposing blocking Spirit is 6000 BP or less, by not comparing BP, treat this Spirit as not being blocked."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-017",
    "name": "The Old Devil's Castle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen the opponent uses a Spirit/Magic effect that targets your Spirits, you can choose one of your Spirits affected by that effect, and change the target of that effect to that Spirit only.\n\n[LV2] (Either Attack Step)\nWhen your Brave Spirit becomes exhausted, draw a card.",
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
            "rule": "REDIRECT_TARGET",
            "text": "When the opponent uses a Spirit/Magic effect that targets your Spirits, you can choose one of your Spirits affected by that effect, and change the target of that effect to that Spirit only."
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
    "cardNumber": "BSC05-018",
    "name": "The Immovable Headquarters",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen your Spirit-condition Brave is summoned, put a core from the Void to your Reserve.\n\n[LV2] (Your End Step)\nRefresh all your Brave Spirits.",
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
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-019",
    "name": "The Impregnable Fortress",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nYour Life can only be reduced by up to one per opposing Spirit per turn.\n\n[LV2]\nGive all your Spirit-condition Braves the effect: \"[Armor: Red/Blue] This Spirit is unaffected by opposing Red/Blue Spirit/Nexus/Magic effects.\"",
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
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Armor: Red/Blue"
      }
    ]
  },
  {
    "cardNumber": "BSC05-020",
    "name": "The Crown of the Starlit Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Life is reduced, you can reveal a card from your decktop. If it is a Cost 2 or less Spirit card, you can summon it without paying the cost. Add any remaining card to the Hand.\n\n[LV2] (Opposing Turn)\nDestroy every Red/Green/Blue Spirit refreshed by Spirit/Magic effects.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "When your Life is reduced, you can reveal a card from your decktop."
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
    "cardNumber": "BSC05-021",
    "name": "Grim Reaper",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy an exhausted Spirit with only one core on it.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
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
    "cardNumber": "BSC05-022",
    "name": "Greedy Cores",
    "cardType": "Magic",
    "effect": "[Flash]\nSend two cores from any opposing non-braved Spirits to their Reserve.",
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
    "cardNumber": "BSC05-023",
    "name": "Grass Trap",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget an opposing Spirit. Exhaust that Spirit, and during this turn, that Spirit can't refresh.",
    "isVanilla": false,
    "abilities": [
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BSC05-024",
    "name": "Rapid Wind",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a family. Refresh two of your Spirits with the targeted family.",
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
    "cardNumber": "BSC05-025",
    "name": "Magic Boost",
    "cardType": "Magic",
    "effect": "[Flash]\nRefresh one of your Brave Spirits, and during this turn, give that Spirit +2000 BP.",
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
    "cardNumber": "BSC05-026",
    "name": "Mirage Coat",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all your Spirit-condition Braves can't be blocked.",
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
    "cardNumber": "BSC05-027",
    "name": "Elec Trick",
    "cardType": "Magic",
    "effect": "[Flash]\nBy destroying one of your battling Spirits, send a core from that Spirit to your Life.",
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
    "cardNumber": "BSC05-028",
    "name": "Thunder Branch",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, treat the LV1/LV2/LV3 BP of every opposing non-braved or non-[Tribute] Spirit as 2000 BP. This effect can't be used during Main Step.",
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
            "rule": "KEYWORD_RULE",
            "text": "During this turn, treat the LV1/LV2/LV3 BP of every opposing non-braved or non-[Tribute] Spirit as 2000 BP."
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
    "cardNumber": "GAI-ASURA",
    "name": "The EarthDragonDeity Gai-Asura",
    "cardType": "Brave",
    "effect": "[LV1][LV2][LV3] Neither player can remove cores from this Spirit.\n\n[When Braved] [LV1][LV2][LV3] Flash- Ultra Awaken - You can put any number of cores from your Spirits to this Spirit. Whenever one or more core is put by this effect, refresh this Spirit.",
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
            "to": "RESERVE",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "GODSLAYER-DRAGON",
    "name": "The WarEmperor Godslayer-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) Destroy an opposing Nexus. When this effect destroys any Nexus, refresh this Spirit.\n\n[LV1][LV2][LV3] (When Battles) When battling an opposing \"God\"-named Spirit, this Spirit gains +5000 BP.\n\n[LV2][LV3] (When Attacks) You can target and attack and opposing Spirit.",
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
            "op": "DESTROY_NEXUS",
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
            "amount": 5000
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
            "rule": "COMBAT_RULE",
            "text": "You can target and attack and opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD01-001",
    "name": "Erimakilizard",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
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
    "cardNumber": "SD03-001",
    "name": "Bladra",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD03-002",
    "name": "The SwordDinoman Stegorus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile you control two or fewer Spirits, treat this Spirit as being at LV3.",
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
            "text": "While you control two or fewer Spirits, treat this Spirit as being at LV3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD03-003",
    "name": "Morgesaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nThis Spirit gains +2000 BP.",
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
      }
    ]
  },
  {
    "cardNumber": "SD03-004",
    "name": "The HornBeast Gulnearl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nYou can reveal three cards from your decktop. Among them, add an \"Astral Dragon\" family Spirit card, or an \"Astral Dragon\" family Brave card to the Hand. Return the remaining cards to the deckbottom in any order.",
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
            "text": "You can reveal three cards from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Among them, add an \"Astral Dragon\" family Spirit card, or an \"Astral Dragon\" family Brave card to the Hand."
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
    "cardNumber": "SD03-005",
    "name": "Big-Horn",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD03-006",
    "name": "The SunDragon Sieg-Apollodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can target and attack an opposing refreshed Spirit.\n\n[When Braved] [LV3] (When Brave Attacks)\nDestroy an opposing 9000 BP or less Spirit.",
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
            "text": "You can target and attack an opposing refreshed Spirit."
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
            "op": "DESTROY_BY_BP",
            "maxBp": 9000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD03-007",
    "name": "The BattleDragon Elginius",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit's symbol and color are also treated as Red.",
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
            "text": "This Spirit's symbol and color are also treated as Red."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD03-008",
    "name": "The MasterCarpenter Mccoy",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nPut a number of cores equal to this Spirit's LV from the Void to a Nexus you control.",
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
    "cardNumber": "SD03-009",
    "name": "The StarMonster Sea-Serpendar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy an opposing Cost 4 or less Spirit.\n\n[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV2] (Opposing Attack Step)\nWhile you control any Brave Spirit, Cost 4 or less Spirits can't attack.",
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
            "op": "DESTROY_BY_COST",
            "maxCost": 4,
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
            "op": "ASSAULT_REFRESH",
            "maxTimes": 1
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
            "text": "While you control any Brave Spirit, Cost 4 or less Spirits can't attack."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD03-010",
    "name": "The CannonDragon Bal-Gunner",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Attacks)\nDraw a card, and destroy an opposing 4000 BP or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "WHEN_ATTACKS",
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
            "maxBp": 4000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD03-011",
    "name": "The CrustDragon Groun-Giras",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDestroy an opposing Nexus.\n\n[During Brave] (When Attacks)\nDestroy an opposing Nexus",
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
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": false
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
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD03-012",
    "name": "The FangEmperor Cerbelord",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Attacks)\nOnce per turn, by discarding five cards from your decktop, refresh this Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD03-013",
    "name": "The Fire Paradise",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every Brave card in your Hand an extra [Red Core] reduction symbol.\n\n[LV2] (Your Draw Step)\nIncrease the number of cards you draw by +1.",
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
            "text": "Give every Brave card in your Hand an extra [Red Core] reduction symbol."
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
    "cardNumber": "SD03-014",
    "name": "The Olymspia Stadium",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Main Step)\nSpirits can't be summoned via Spirit/Nexus/Magic effects.\n\n[LV2] (Opposing Attack Step)\nWhen opposing non-braved Spirit would attack, unless the opponent sends a core from their Reserve to the Trash, it can't attack.",
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
            "text": "Spirits can't be summoned via Spirit/Nexus/Magic effects."
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
    "cardNumber": "SD03-015",
    "name": "Brave Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw two cards. Then, reveal three cards from your decktop, and add a Brave card among them to the Hand. Return any remaining cards to the decktop in any order.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "REVEAL_DECKTOP_ADD",
            "count": 3,
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
    "cardNumber": "SD03-016",
    "name": "Sagitta Flame",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy any number of opposing Spirits up to a total of 5000 BP. Or, destroy an opposing Nexus.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1,
            "allMatching": true
          },
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
    "cardNumber": "SD03-017",
    "name": "Blue Splash",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy an opposing Cost 3 or less Spirit. Or, return a Nexus card from your Trash to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
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
  }
];

for (const spec of SD03_BSC05_CONSTELLATION_PROMOS_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
