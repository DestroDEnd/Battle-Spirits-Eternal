/**
 * engine/cards/sets/bs15_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS15_SAGA_CARDS)
 * Total Cards: 80 (75 Effect, 5 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS15_SAGA_CARDS = [
  {
    "cardNumber": "ANAGUMAD-DEVIL2",
    "name": "Anagumad-Devil",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) While you have only Green Spirits/Nexuses on your field, put a core from the void to this Spirit. By discarding your set Burst, also, put a core from the void to this Spirit.",
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
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1028",
    "name": "Elefog",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) For each color of Spirit/Nexus on the opposing field, send one core from any opposing Spirits to the Reserve.",
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
    "cardNumber": "BATTLE-SPIRITS-A1037",
    "name": "Gasfrog",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10834",
    "name": "The HollowBeast Champbongor",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] While you have a Burst set, each Spirit can only reduce either player's Life by one each turn.\n\n[LV2][LV3] (Your Attack Step) When only the opposing Spirit is destroyed when comparing BP with your Red Spirit, draw a card.",
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
    "cardNumber": "BATTLE-SPIRITS-A11292",
    "name": "The MachineBeastFortress Naumannguard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] When this Spirit is destroyed by the opponent, draw 3 cards from your deck, and put 3 cores from the void to your Reserve.\n\n[LV2] After your attack step ends, you can repeat either your draw step, refresh step or main step. This effect can only be used once per turn.",
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
            "count": 3
          },
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3159",
    "name": "Bloody Rondo",
    "cardType": "Magic",
    "effect": "Main- Compare the total amount of cores in either player's Field/Reserve/Trash. The player who has a higher total amount of cores must send cores from the Field/Reserve/Trash to the void until they have an equal amount to the player with a lower total.\n\nFlash- During this turn, target Spirit gets +2000 BP.",
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
            "rule": "COMBAT_RULE",
            "text": "Compare the total amount of cores in either player's Field/Reserve/Trash."
          },
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3309",
    "name": "Burst Stratagem",
    "cardType": "Magic",
    "effect": "☼<nowiki>[ </nowiki>Burst: After an opposing Spirit attacks<nowiki> ]</nowiki>\nRefresh a Spirit you control. Then, by paying the cost, activate this card's Main effect.\n\nMain - When the opponent controls two or more colors of Spirits/Nexuses, target 1 color, and exhaust all opposing Spirits with that color.",
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
            "scope": "TARGET",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4119",
    "name": "Firefansaur",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step) By discarding a card from your Hand and exhausting this Spirit, destroy an opposing Nexus.",
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
          "type": "DISCARD_HAND",
          "count": 1
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
    "cardNumber": "BATTLE-SPIRITS-A4141",
    "name": "Fenneborac",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks) For each color of Spirits on the opposing field, this Spirit gains +2000 BP.\n\n[LV2] (Opposing Turn) When your deck would be discarded due to the opponent, by exhausting this Spirit, no cards will be discarded from your deck.",
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
            "amount": 2000
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
    "cardNumber": "BATTLE-SPIRITS-A6436",
    "name": "Meerbat",
    "cardType": "Spirit",
    "effect": "Flash- (Either Attack Step) By discarding this Spirit card from your Hand, during this turn, target Spirit gains +2000 BP. This effect is treated as a Spirit effect.\n\nImmortality: Cost 4 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 4 Spirit is destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 2000
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
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
    "cardNumber": "BATTLE-SPIRITS-A6471",
    "name": "Matadora",
    "cardType": "Brave",
    "effect": "[Brave Condition: A cost of 4 or more]\n\n[When Braved] (When Destroyed) Your opponent target a color out of the colors of their Spirits Destroy all opposing Spirits/Nexuses not of the targeted color.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: A cost of 4 or more"
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A7034",
    "name": "Pandal",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Windstorm: 1 - (When Attacks) When this Spirit is blocked, your opponent exhausts the specified number of Spirits they control.",
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
    "cardNumber": "BATTLE-SPIRITS-A7262",
    "name": "Pygmygator",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7290",
    "name": "Provocation",
    "cardType": "Magic",
    "effect": "At the end of the opposing Main Step, you can use this Magic card from your Hand.\n\nFlash- Target an opposing Spirit. During this turn, that Spirit must attack, if possible.",
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
            "rule": "USE_FROM_HAND",
            "text": "At the end of the opposing Main Step, you can use this Magic card from your Hand."
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
            "rule": "SET_RESTRICTION",
            "text": "During this turn, that Spirit must attack, if possible."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7351",
    "name": "Punkmouse",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] While there are two or more colors of Spirits/Nexus on the opposing field, treat this Spirit as Lv2.",
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
            "text": "While there are two or more colors of Spirits/Nexus on the opposing field, treat this Spirit as Lv2."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7893",
    "name": "Snowflaken",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step) At the start of the step, by sending a core from your Reserve to your Trash, target an opposing Spirit. That Spirit must attack if possible.\n\n[LV2] Ice Wall: Green - (Opposing Turn) When the opponent uses the effect of a Green Magic, by exhausting this Spirit, negate that effect.",
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
          "type": "PAY_RESERVE_CORES",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET",
            "text": "At the start of the step, by sending a core from your Reserve to your Trash, target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "That Spirit must attack if possible."
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
    "cardNumber": "BATTLE-SPIRITS-A7965",
    "name": "Starham",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Battles) When this Spirit is destroyed by comparing BP with an opposing Spirit, put a core from the Void to your life.",
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
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8920",
    "name": "The Blowing Lollipop Uplands",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step) When the opponent controls two or more colors of Spirits/Nexuses, all Magic cards in your Hand gets an extra Yellow reduction symbol.\n\n[LV2] (Opposing Attack Step) At the end of the step, if the opponent didn't attack for this turn, draw 1 card from your deck.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-004",
    "name": "Hanzo-Shinobi-Dragon",
    "cardType": "Spirit",
    "effect": "☼<nowiki>[ </nowiki>Burst: After Your Life is Decreased<nowiki> ]</nowiki>\nFor each color of Spirits/Nexuses on the opposing field, destroy an opposing Spirit with only 1 core on it. After this effect resolves, summon this Spirit card.\n\n[LV2][LV3] (When Destroyed) If you don't have a Burst set, you can set this Spirit as a Burst.",
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
            "op": "DESTROY_NEXUS",
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
        "overall": "WHEN_DESTROYED",
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
            "text": "If you don't have a Burst set, you can set this Spirit as a Burst."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-006",
    "name": "Golhorn-Eagle",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV1][LV2][LV3]\nGive all your \"Emperor Beast\" family Spirits: [Clash].",
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
      }
    ]
  },
  {
    "cardNumber": "BS15-007",
    "name": "Zenith-Dragoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy an opposing 5000 BP or less Spirit. By discarding a card from your Hand, also, destroy an opposing 10000 BP or more Spirit.",
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
        "subCost": {
          "type": "DISCARD_HAND",
          "count": 1
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
    "cardNumber": "BS15-008",
    "name": "Paladin-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nEither player target a color among those of their Spirits. Destroy every Spirit of the colors that aren't targeted.\n\n[LV2] (When Attacks)\nDraw a card for each color of Spirits/Nexuses on the opposing Field.",
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
            "rule": "CHOOSE_COLOR",
            "text": "Either player target a color among those of their Spirits."
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
    "cardNumber": "BS15-009",
    "name": "The HollowDragonEmperor Catastrophedragon",
    "cardType": "Spirit",
    "effect": "While you have a Burst set, this Spirit card in Hand becomes Cost 7.\n\n[LV1][LV2][LV3] (When Attacks)\nYou can reveal two cards from your decktop. Summon any number of Spirit cards with [Clash] among them, without paying the cost. Discard any remaining cards.\n\n[LV2][LV3] (Your Attack Step)\nBesides this Spirit, when your Spirits with [Clash] attack, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While you have a Burst set, this Spirit card in Hand becomes Cost 7."
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-012",
    "name": "Werewolf-Command",
    "cardType": "Spirit",
    "effect": "[Immortality: Nightling] (Either Attack Step)\nThis Spirit card in your Trash can be summoned when your \"Nightling\" family Spirit is destroyed.\n\n[LV1][LV2][LV3] (When Destroyed)\nDraw a card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Nightling"
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-014",
    "name": "The HellHollowBeast Ibos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile you have a Burst set, each Spirit can only reduce either player's Life by one each turn.\n\n[LV3] (When Attacks)\nBy discarding a card from your Hand, destroy an opposing exhausted Spirit.",
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
        "subCost": {
          "type": "DISCARD_HAND",
          "count": 1
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
    "cardNumber": "BS15-015",
    "name": "The VampireLady Ethelfleda",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Battles)\nAll the Purple Magic card you use are treated as colorless.\n\n[LV2][LV3]\nIncrease the LV cost of all opposing Nexuses by +1.",
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
            "rule": "TREAT_RULE",
            "text": "All the Purple Magic card you use are treated as colorless."
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
            "text": "Increase the LV cost of all opposing Nexuses by +1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-016",
    "name": "The DarkKnight Gawain",
    "cardType": "Spirit",
    "effect": "[Immortality: Nightling] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your \"Nightling\" family Spirit is destroyed.\n\n[LV1][LV2][LV3] (When Summoned)\nBy discarding one of your Bursts, send three cores from any opposing Spirits to the Reserve.\n\n[LV1][LV2][LV3]\nWhile your Life is at three or more, this Spirit is treated as being on LV3.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Nightling"
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
            "rule": "KEYWORD_RULE",
            "text": "By discarding one of your Bursts"
          },
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
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "While your Life is at three or more, this Spirit is treated as being on LV3."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-017",
    "name": "Empress-Youqueen",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nIf your Hand is five or more, summon this Spirit card.\n\n[LV1][LV2] (When Summoned)\nYou can summon one Spirit card with [Immortality] from your Trash, without paying the cost.\n\n[LV2] (Opposing End Step)\nBy discarding one Spirit card with [Immortality] from your Hand, return one Purple Spirit card from your Trash to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If your Hand is five or more, summon this Spirit card."
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
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "By discarding one Spirit card with [Immortality] from your Hand"
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
    "cardNumber": "BS15-018",
    "name": "The PhantomBeastEmperor Ten-Qoo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your End Step)\nSummon a number of Cost 4 or less Purple Spirit cards from your Trash, without paying the cost, up to the number of colors of Spirits/Nexuses on the opposing Field.\n\n[LV2]\nFor each \"Spiritual Beast\" family Spirit you control, this Spirit gets +1000 BP.",
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
            "op": "REANIMATE_TRASH",
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
        "targetFilter": {
          "family": "Spiritual Beast"
        },
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS15-024",
    "name": "Guan-Choun",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts a Spirit they control.\n\n[LV1][LV2] (When Attacks)\nPut a core from the Void to your Reserve.\n\n[LV2] (When Attacks)\nOnce per turn, when this Spirit's attack reduces the opposing Life, refresh this Spirit.",
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-025",
    "name": "Kahyoton",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2] (Your Attack Step)\nAll your \"Gaudy Trooper\" family Spirits gain +2000 BP.",
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
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "targetFilter": {
          "family": "Gaudy Trooper"
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BS15-026",
    "name": "The TacticianBird Shokatsuryo",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf there are a total of three or more exhausted Spirits on your Field and the opposing Field, summon this Spirit card.\n\n[LV2] (Your Attack Step)\nWhen your Spirit with [Windstorm] attacks, by sending a number of cores from your Reserve to your Trash equal to the number designated by that Spirit's [Windstorm], exhaust that number of opposing Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If there are a total of three or more exhausted Spirits on your Field and the opposing Field, summon this Spirit card."
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
    "cardNumber": "BS15-027",
    "name": "The HollowProvidence Hououga",
    "cardType": "Spirit",
    "effect": "While you have a Burst set, this Spirit card in your Hand becomes Cost 7.\n\n[LV1][LV2][LV3] (Your Attack Step)\nWhen the attacks of this Spirit and your Spirits with [Windstorm] reduce the opposing Life, send an opposing Life to the Void.\n\n[LV2][LV3]\nWhen your Spirits with [Windstorm] are destroyed by the opponent, return an opposing Spirit to their Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While you have a Burst set, this Spirit card in your Hand becomes Cost 7."
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-030",
    "name": "The LoveGoddess Lofn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Turn)\nWhen your deck would be discarded by the opponent, by exhausting this Spirit, cards can't be discarded from your deck.\n\n[LV2]\nWhile you control only White Spirits, when this Spirit is destroyed by the opponent, put a core from the Void to your Reserve. Then, return this Spirit to the Hand.",
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
        "overall": "WHEN_DESTROYED",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-031",
    "name": "The HollowBeast Glassbear",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile you have a Burst set, the Life of either player can only be reduced by one per Spirit per turn.\n\n[LV2][LV3] [Heavy Armor: Red/Yellow]\nThis Spirit is unaffected by opposing Red/Yellow Spirit/Brave/Nexus/Magic effects.",
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
        "keyword": "Heavy Armor: Red/Yellow"
      }
    ]
  },
  {
    "cardNumber": "BS15-033",
    "name": "Chimera-Debri",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nFor each color of Spirits/Nexuses on the opposing Field, this Spirit gains +3000 BP.\n\n[LV2] (When Blocks)\nFor each color of Spirits/Nexuses on the opposing Field, exhaust an opposing Spirit.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-034",
    "name": "Mibrock-Genius",
    "cardType": "Spirit",
    "effect": "[Burst: After Your Spirit is Destroyed by the Opponent]\nIf the Spirit destroyed when this Burst activates was 5000 BP or more, summon this Spirit card.\n\n[LV1][LV2][LV3]\nWhile there are only White Spirits/Nexuses on your Field, the effects of all Nexuses can't activate.\n\n[LV2][LV3] (When Battles)\nReturn an opposing Spirit without a Burst effect to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If the Spirit destroyed when this Burst activates was 5000 BP or more, summon this Spirit card."
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
            "rule": "NEGATE_EFFECT",
            "text": "While there are only White Spirits/Nexuses on your Field, the effects of all Nexuses can't activate."
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
    "cardNumber": "BS15-036",
    "name": "The HollowMachineEmperor Inphenit-Wols",
    "cardType": "Spirit",
    "effect": "While you have a Burst set, this Spirit card in Hand becomes Cost 7.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nThis Spirit and all your Spirits with [Ice Wall] can block while exhausted.\n\n[LV2][LV3] (Opposing Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with this Spirit or your Spirits with [Ice Wall], send a core from the opposing Life to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While you have a Burst set, this Spirit card in Hand becomes Cost 7."
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "keyword": "Ice Wall"
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
    "cardNumber": "BS15-037",
    "name": "Kudagitsunen",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS15-038",
    "name": "Arcanabeast-Jack",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDuring this turn, you can give this Spirit and an opposing Spirit an additional color besides the color the two selected Spirits originally have.",
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-039",
    "name": "The Priest Pentan",
    "cardType": "Spirit",
    "effect": "[LV2] (Opposing Start Step)\nIf you control only Yellow Spirits/Nexuses, send two cores from your Trash to your Reserve.",
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
    "cardNumber": "BS15-042",
    "name": "The Angelia of Olimpics Aratron",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile you have a Burst set, each Spirit can only reduce either player's Life by one each turn.\n\n[LV2][LV3] (Opposing Turn)\nWhen cards would be discarded from your deck via an opposing Spirit effect, by exhausting this Spirit, cards would not be discarded from your deck, and return that Spirit to the opposing deckbottom.",
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
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-043",
    "name": "Shogunpentan",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf you control three or more Yellow Spirits, summon this Spirit card without paying the cost.\n\n[LV2][LV3] (When Destroyed)\nDiscard a card from your decktop. If the card discard via this effect is a Yellow Spirit card, this Spirit remains on the Field, refreshed. Also, if the discarded card is \"Pentan\"-named, add it to your Hand.",
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
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "if the discarded card is \"Pentan\"-named, add it to your Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-044",
    "name": "The Angelia Sakuel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) By discarding your set Burst, return a Yellow Magic card with a Burst effect to your Hand.\n\n[LV2][LV3] (When Battles) During the flash timing, you can use the flash effect of a Yellow Magic card with Burst effect from your Hand without paying the cost.",
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
            "rule": "KEYWORD_RULE",
            "text": "By discarding your set Burst"
          },
          {
            "op": "BOUNCE_TO_HAND",
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
            "rule": "CAST_MAGIC_FREE",
            "text": "During the flash timing, you can use the flash effect of a Yellow Magic card with Burst effect from your Hand without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-045",
    "name": "The HollowBeastEmperor Sphin-Cross",
    "cardType": "Spirit",
    "effect": "While you have a Burst set, this Spirit card in your Hand becomes Cost 7.\n\n[LV1][LV2][LV3] (Your Attack Step)\nWhen this Spirit or your Spirits with [Holy Life] compare BP, by sending a core from the attacking Spirit to the Void, without comparing BP, the attacking Spirit is treated as not blocked.\n\n[LV2][LV3] (Your Attack Step)\nWhen your Spirit reduces the opposing Life, return a Yellow card from your Trash to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While you have a Burst set, this Spirit card in your Hand becomes Cost 7."
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
    "cardNumber": "BS15-046",
    "name": "Rammer-Golem",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS15-048",
    "name": "The FishermanMaster Zigorou",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Start Step)\nBy sending a core from this Spirit to your Trash, during this turn, the number of cards discarded by your Spirits' [Crush]/[Great Crush] gets +1.",
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
    "cardNumber": "BS15-049",
    "name": "Tsundog-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDuring this turn, when your Spirits with [Crush]/[Great Crush] are destroyed by opposing Spirits via comparing BP, those destroyed Spirits remain on your Field, exhausted.\n\n[LV1][LV2][LV3] [Crush] (when Attacks)\nDiscard cards from the opposing decktop equal to this Spirit's LV.",
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
    "cardNumber": "BS15-050",
    "name": "Grenade-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (when Attacks)\nDiscard cards from the opposing decktop equal to this Spirit's LV.\n\n[LV1][LV2][LV3] (When Destroyed)\nDiscard cards from the opposing decktop equal to this Spirit's LV.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-051",
    "name": "The HollowSeaBeast Emehydral",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhile you have a Burst set, the Life of either player can only be reduced by one per Spirit per turn.\n\n[LV2] Flash - (Opposing Attack Step)\nBy sending a core from this Spirit to your Trash, destroy an opposing Spirit with \"Can't be blocked\" effects.",
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
        "overall": "FLASH",
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
    "cardNumber": "BS15-052",
    "name": "The HeavenMarshal Chohakkai",
    "cardType": "Spirit",
    "effect": "This Spirit card in the Trash is treated as [The PigMan Chohakkai].\n\n[LV1][LV2][LV3]\nNeither player can add/discard cards from Hand via Spirit/Brave/Nexus/Magic effects.\n\n[LV2][LV3] (Your End Step)\nDeploy a Nexus card from your Trash without paying the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "This Spirit card in the Trash is treated as [The PigMan Chohakkai]."
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
            "text": "Neither player can add/discard cards from Hand via Spirit/Brave/Nexus/Magic effects."
          }
        ]
      },
      {
        "overall": "END_STEP",
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
      }
    ]
  },
  {
    "cardNumber": "BS15-053",
    "name": "Kojirond-Golem",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit attacks]\nIf you control any Spirit with [Crush]/[Great Crush], summon this Spirit card.\n\n[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard cards from the opposing decktop equal to this Spirit's LV.\n\n[LV2][LV3]\nWhen a Cost 4 or more card is discarded via the [Crush] of your Spirits, exhaust an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "scaleByLevel": true,
            "perLevel": 1
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
    "cardNumber": "BS15-054",
    "name": "The HollowGolemEmperor Phoenix-Golem",
    "cardType": "Spirit",
    "effect": "While you have a Burst set, this Spirit card in Hand becomes Cost 7.\n\n[LV1][LV2][LV3]\nGive this Spirit and all your Spirits with [Assault]: \"[Crush] (When Attacks) Discard a number of cards from the opposing decktop equal to this Spirit's LV.\".\n\n[LV2][LV3]\nFor each Spirit card discarded via your Spirits' [Crush], destroy an opposing Cost 6 or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While you have a Burst set, this Spirit card in Hand becomes Cost 7."
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
          },
          {
            "op": "DESTROY_BY_COST",
            "maxCost": 6,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-058",
    "name": "Double-Camel",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] [Heavy Armor: Green/Yellow]\nThis Spirit is unaffected by opposing Green/Yellow Spirit/Brave/Nexus/Magic effects.",
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
        "keyword": "Heavy Armor: Green/Yellow"
      }
    ]
  },
  {
    "cardNumber": "BS15-060",
    "name": "Bandit-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more/{{tk]\n\n[When Braved] (Either Attack Step)\nWhile the opponent has a set Burst, this Spirit is unaffected by opposing Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more/{{tk"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "IMMUNITY",
            "text": "While the opponent has a set Burst, this Spirit is unaffected by opposing Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-063",
    "name": "The Hanged Old Castle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed)\nFor each color of opposing Spirits/Nexuses, draw a card.\n\n[LV2]\nWhen your \"Nightling\"/\"Vanity Deity\" family Spirit is destroyed, by discarding a card from your Hand, that Spirit remains on the Field, exhausted.",
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
            "text": "When your \"Nightling\"/\"Vanity Deity\" family Spirit is destroyed, by discarding a card from your Hand, that Spirit remains on the Field, exhausted."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-064",
    "name": "The Evil Gate to the Thanatos",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen your Purple Spirit attacks, by discarding a card from your Hand, during that battle, treat the attacking Spirit as colorless.\n\n[LV2] (Either Attack Step)\nWhen you are summoning a Cost 6 or less Spirit card with [Immortality] from the Trash, by exhausting this Nexus, summon that Spirit card without paying the cost. However, (When Summoned) effects of the Spirit don't activate.",
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
          "type": "DISCARD_HAND",
          "count": 1
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When your Purple Spirit attacks, by discarding a card from your Hand, during that battle, treat the attacking Spirit as colorless."
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
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "(When Summoned) effects of the Spirit don't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-068",
    "name": "The Fortress Metropolis Naumann City",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed)\nYou can summon a White Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of that Spirit can't activate.\n\n[LV2] (Opposing Turn)\nWhile there are two or more colors of Spirits/Nexuses on the opposing Field, for each of such color, increase the cost of all Magic cards in the opposing Hand by +1.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of that Spirit can't activate."
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
            "text": "While there are two or more colors of Spirits/Nexuses on the opposing Field, for each of such color, increase the cost of all Magic cards in the opposing Hand by +1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-069",
    "name": "The Lunar Court",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] Only up to three cards can be discarded from either player's deck each turn due to opposing Spirit/Brave/Nexus/Magic effects.\n\n[LV2] Your burst with the condition [After Your Opponent activates a Spirit/Brave's (When Summoned) effect ] can also activate at the condition: [After Your Life is Decreased].",
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
            "text": "Only up to three cards can be discarded from either player's deck each turn due to opposing Spirit/Brave/Nexus/Magic effects."
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
            "text": "Your burst with the condition [After Your Opponent activates a Spirit/Brave's (When Summoned) effect ] can also activate at the condition: [After Your Life is Decreased]."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-071",
    "name": "The Giant's Stamp Lake",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nFor each of your Burst and the opposing Burst, the number of cards discarded by your Spirits' [Crush]/[Great Crush] gets +1.\n\n[LV2] (Your Attack Step)\nWhile your Field only has Blue Spirits/Nexuses, every Spirit you control gets +3000 BP.",
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
    "cardNumber": "BS15-073",
    "name": "Transmigration Flame",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nSummon a \"Supreme Hero\" family Spirit card from your Trash that was destroyed when this Burst was activated. However, any (When Summoned) effect of the Spirit can't activate. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nTarget a family. During this turn, all your non-braved Spirits in the target family get +4000 BP.",
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
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 4000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-076",
    "name": "Vampiric Nail",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nDraw two cards. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDiscard any number of cards from your Hand. For each card discarded, send a core from an opposing Spirit to their Trash.",
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
    "cardNumber": "BS15-077",
    "name": "Heat Ride",
    "cardType": "Magic",
    "effect": "During (Your End Step), return a [Heat Ride] from your Trash to the Hand. This effect can only be used once per turn.\n\n[Flash]\nTarget a Spirit you control. During this turn, when the attack of that Spirit reduces the opposing Life, put a core from the Void to your Reserve.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-080",
    "name": "Triple Stab",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit attacks]\nDuring this turn, all your Spirits gain +3000 BP. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nReturn an opposing Spirit to the deckbottom.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 3000,
            "filter": {}
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
    "cardNumber": "BS15-082",
    "name": "Moonlight Punish",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nReturn a Magic card from your Trash to the decktop, and return up to ten other cards from your Trash to the deckbottom in any order. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nIf the opponent controls two or more colors of Spirits/Nexuses, during this turn, all non-Yellow Spirits can't attack/block.",
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
            "op": "BOUNCE_TO_HAND",
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
            "rule": "COMBAT_RESTRICTION",
            "text": "If the opponent controls two or more colors of Spirits/Nexuses, during this turn, all non-Yellow Spirits can't attack/block."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-083",
    "name": "Swallow Counter",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nIf the opposing Hand is five or more, the opponent discards cards from their Hand until their Hand becomes two. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy a Brave on an opposing Brave Spirit. After this effect resolves, destroy an opposing Cost 3 or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "If the opposing Hand is five or more, the opponent discards cards from their Hand until their Hand becomes two."
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
            "maxCost": 3,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-084",
    "name": "Burst Fist",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nDiscard a number of cards from the opposing decktop, equal to the cost of the Spirit destroyed when this Burst activates. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nRefresh a Spirit you control, and during this turn, treat that Spirit as being one LV higher.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-X01",
    "name": "The KatanaHero Musashied-Ashliger",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit attacks]\nIf the Spirit that attacks when this Burst activates is 5000 BP or more, summon this Spirit card without paying the cost. Then, during this turn, this Spirit gains +3000 BP.\n\n[LV2][LV3] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, destroy a Brave on an opposing Brave Spirit, or an opposing Nexus.\n\n[LV3] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, send an opposing Life to the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
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
            "op": "DESTROY_NEXUS",
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
    "cardNumber": "BS15-X02",
    "name": "The HollowEmperor Netherd-Baaral",
    "cardType": "Spirit",
    "effect": "While you don't have a Burst set, this Spirit card in Hand becomes Cost 11.\n\n[Immortality: Nightling] (Either Attack Step)\nThis Spirit card in your Trash can be summoned when your \"Nightling\" family Spirit is destroyed.\n\n[LV1][LV2][LV3]\nIncrease the level costs of all opposing Spirits by +1.\n\n[LV2][LV3] (Your Attack Step)\nWhen your Spirits with [Immortality] attack, send two cores from the opposing Field to their Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While you don't have a Burst set, this Spirit card in Hand becomes Cost 11."
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Nightling"
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
            "text": "Increase the level costs of all opposing Spirits by +1."
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
        "keyword": "Immortality"
      }
    ]
  },
  {
    "cardNumber": "BS15-X03",
    "name": "The BirdWarEmperor Suzacross-Soso",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Battles)\nThe opponent can't activate their Bursts.\n\n[LV1][LV2] (Your Attack Step)\nFor each Green Spirit you control, all your \"Gaudy Trooper\" family Spirits gain +1000 BP.\n\n[LV2] (Your Attack Step)\nWhen an opposing Spirit becomes exhausted, this Spirit refreshes.",
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "The opponent can't activate their Bursts."
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
        "targetFilter": {
          "color": "Green",
          "family": "Gaudy Trooper"
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS15-X05",
    "name": "The LightHero LunaArk-Kaguya",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is Destroyed by the Opponent]\nIf there are three or more Yellow cards in your Trash, put a core from the Void to either your Life, or your Reserve. After this effect resolves, summon this Spirit card.\n\n[LV1][LV2][LV3] Flash - (Either Attack Step)\nBy sending two cores from your Reserve to your Trash, during this battle, an opposing Spirit's LV1/LV2/LV3/LV4 BP is treated as 2000.",
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
            "rule": "SUMMON_THIS_CARD",
            "text": "summon this Spirit card."
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
        "subCost": {
          "type": "PAY_RESERVE_CORES",
          "count": 2
        },
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
    "cardNumber": "BS15-X06",
    "name": "The IronHero Saigord-Golem",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDiscard a number of cards, equal to the cost of the Spirit that activated the (When Summoned) effect, from the opposing decktop, and if a card with Burst effects is discarded, summon this Spirit card without paying the cost.\n\n[LV1][LV2][LV3] [Great Crush] (When Attacks)\nFor each LV this Spirit has, discard five cards from the opposing decktop, and when a card with Burst effects is discarded, destroy an opposing Spirit.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "DAL-EAGLE",
    "name": "Dal-Eagle",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "KAMEN-FUKUROU",
    "name": "Kamen-Fukurou",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or above/ Spirit With '''Windstorm''']\n\n[When Braved] (When Destroyed) By discarding your set Burst, this Spirit remains on the field, refreshed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or above/ Spirit With '''Windstorm'''"
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "By discarding your set Burst"
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
    "cardNumber": "KNIGHT-ANOLE",
    "name": "Knight-Anole",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned) Send one core from any opposing Spirit to the Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "MEGA-TYR",
    "name": "The WarSacred Mega-Tyr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Start Step) The opponent target a color among the colors of their Spirits. The opponent return their Spirits/Braves to the Hand until they have only Spirits/Braves of the selected color on their field.\n\n[LV2] Heavy Armor: Red/Purple/Blue - This Spirit is unaffected by opposing Red/Purple/Blue Spirit/Brave/Nexus/Magic effects.",
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
            "rule": "CONTINUOUS_RULE",
            "text": "Heavy Armor: Red/Purple/Blue - This Spirit is unaffected by opposing Red/Purple/Blue Spirit/Brave/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-GREAT",
    "name": "The Great River and the Precipice",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] All Spirit cards in your Hand with Windstorm gain 1 extra Green reduction symbol.\n\n[LV2] (Your Start Step) When the opponent has a Burst set, exhaust an opposing Spirit.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-SNOW",
    "name": "The Snow Crystal Tree",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) At the end of the step, if your opponent did not attack this turn, put a core from the void to your Reserve.\n\n[LV2] (Opposing Turn) When your Spirit uses an Ice Wall effect, by sending a core from this Nexus to the trash, refresh that Spirit.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "THE-WHIRTING",
    "name": "The Whirling Big Channel",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] All exhausted Spirits can only be refreshed during the Refresh Step.\n\n[LV2] While you have a Burst set, (When Destroyed) effects of Spirits can't activate.",
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
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_EFFECT",
            "text": "While you have a Burst set, (When Destroyed) effects of Spirits can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "TOUCHBET-MONKEY2",
    "name": "Touchbet-Monkey",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) While you control only Red Spirits/Nexuses, this Spirit gets +2000 BP.",
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
  }
];

for (const spec of BS15_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
