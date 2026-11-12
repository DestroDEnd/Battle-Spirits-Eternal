/**
 * engine/cards/sets/bs13_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS13_SAGA_CARDS)
 * Total Cards: 90 (85 Effect, 5 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS13_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A12208",
    "name": "The SephirothicSheepDeity Sephiro-Aries",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Main Step)\nWhen any player would summon a Spirit card/Brave card without \"Imp\" family, it is summoned in exhausted state.\n\n[LV2][LV3] (When Attacks/Blocks)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh a \"Galaxian\"/\"Astral Soul\" family Spirit you control.\n\n[LV3]\nBesides via [Tribute], cores can't be removed from Spirits.",
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
            "scope": "TARGET",
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
            "text": "Besides via [Tribute], cores can't be removed from Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13330",
    "name": "The UltimateSunDragon Seventh-Apollodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon an \"Apollo\"-named Spirit card from your Hand, without paying the cost.\n\n[When Braved] [LV2][LV3] (Your Attack Step)\nAll your \"Astral Deity\" family Spirits can target and attack an opposing Spirit.",
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
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_ATTACK",
            "text": "All your \"Astral Deity\" family Spirits can target and attack an opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2054",
    "name": "The GalacticDragonRider Zodiacapollocrimson",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReveal 12 cards from your decktop. Among them, summon any number of \"Astral Deity\"/\"Galaxian\" family Spirit cards, without paying the cost and without [Tribute]. However, any (When Summoned) effects of the Spirits can't activate. Discard any remaining cards.\n\n[When Braved] [LV2] (Your Attack Step)\nTreat the LV1/LV2/LV3 BP of all your \"Galaxian\" family Spirits as 12000 BP.",
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
            "text": "Reveal 12 cards from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PREVENT_WHEN_SUMMONED",
            "text": "any (When Summoned) effects of the Spirits can't activate."
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
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "Treat the LV1/LV2/LV3 BP of all your \"Galaxian\" family Spirits as 12000 BP."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2631",
    "name": "Ammoknights",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3321",
    "name": "Bushbabe",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks) For each core on this Spirit, this Spirit gains +1000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3394",
    "name": "Chootah",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3995",
    "name": "Dream Seal",
    "cardType": "Magic",
    "effect": "This Magic card in Trash is unaffected by any effect.\n\nMain- Until (Your End Step) takes place three times, (When Summoned) effects of Spirits can't activate. After this effect resolves, take three cores from the Void and put beside your deck, and send one core to the Void every (Your End Step). These cores can only be used for this effect.\n\nFlash- During this turn, give a Spirit +2000 BP.",
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
            "rule": "IMMUNITY",
            "text": "This Magic card in Trash is unaffected by any effect."
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
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_EFFECT",
            "text": "Until (Your End Step) takes place three times, (When Summoned) effects of Spirits can't activate."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "take three cores from the Void and put beside your deck"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "send one core to the Void every (Your End Step)."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "These cores can only be used for this effect."
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
    "cardNumber": "BATTLE-SPIRITS-A6027",
    "name": "Kemurisu",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6167",
    "name": "Knocknmole",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6629",
    "name": "Modzu",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7862",
    "name": "Skullion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Send one core each from every opposing Cost 3 or less Spirit to their Reserve.",
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
    "cardNumber": "BATTLE-SPIRITS-A7864",
    "name": "Skullzard",
    "cardType": "Spirit",
    "effect": "[LV2] (Opposing Turn) When this Spirit is destroyed by the opponent, you can summon up to two Cost 1 or less Spirit cards from your Trash, without paying the cost.",
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
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8501",
    "name": "The ArmoredDinoman Ankylong",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Start Step) You can return a Spirit with Ultra Awaken you control to your Hand.\n\n[LV2] When using your Spirit's Ultra Awaken effect, instead of putting cores on it from your Spirits, you can also use cores from your Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "CARD_RULE_MODIFIER",
            "text": "When using your Spirit's Ultra Awaken effect, instead of putting cores on it from your Spirits, you can also use cores from your Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8566",
    "name": "The Assassin Dragonaga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Curse (When Attacks) Destroy an opposing Spirit that blocked when the battle resolves at the end of battle.\n\n[LV2] (When Attacks) Treat this Spirit's color as colorless.",
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
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle."
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
            "rule": "TREAT_RULE",
            "text": "Treat this Spirit's color as colorless."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-003",
    "name": "Chamaeleopus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen you are summoning an originally Cost 7 or more Spirit card, this Spirit gains two extra Red symbols.",
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
      }
    ]
  },
  {
    "cardNumber": "BS13-004",
    "name": "Phobos-Dragoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV3] (When Attacks)\nAt the end of battle, by destroying this Spirit and a Cost 3 or more Spirit you control, summon an \"Astral Deity\" family Spirit card from your Hand, without paying the cost.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "At the end of battle, by destroying this Spirit and a Cost 3 or more Spirit you control, summon an \"Astral Deity\" family Spirit card from your Hand, without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-005",
    "name": "The RudeSaurus Dirano-Rex",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nAll your Brave Spirits with [Ultra Awaken] can't be separated, and neither player can remove cores from them.\n\n[When Braved] [LV3]\nGive all your \"Terra Dragon\" family Brave Spirits the effect: \"Flash- [Ultra Awaken] You can put any number of cores from your Spirits to this Spirit. When one or more core is put via this effect, refresh this Spirit.\"",
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
        "keyword": "Ultra Awaken"
      },
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "ULTRA_AWAKEN",
            "maxCores": 2,
            "bpBonus": 3000
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
    "cardNumber": "BS13-006",
    "name": "The FlameBeast Fioryx",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen an opposing 4000 BP or less Spirit attacks, destroy that Spirit.\n\n[LV2][LV3] (When Attacks)\nWhile you control any Spirit-condition Brave, this Spirit gains an extra Red symbol.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-007",
    "name": "The PantherDragon Pandolancer",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can brave it with one of your Spirit-condition Braves. Then, activate this Spirit's (When This Spirit Brave Attacks) effect.\n\n[LV3] (When Battles)\nDestroy an opposing 5000 BP or less Spirit.",
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
            "text": "You can brave it with one of your Spirit-condition Braves."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "activate this Spirit's (When This Spirit Brave Attacks) effect."
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
    "cardNumber": "BS13-008",
    "name": "The DinomanKing Megalo-Saur",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can destroy any number of opposing Spirits up to (the total BP of your \"Dragon\" family Spirits) BP.\n\n[LV2] (When Attacks)\nWhen this Spirit is blocked, by returning one of your \"Terra Dragon\" family Spirits to the Hand, refresh this Spirit.",
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
            "rule": "DESTROY",
            "text": "You can destroy any number of opposing Spirits up to (the total BP of your \"Dragon\" family Spirits) BP."
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
    "cardNumber": "BS13-012",
    "name": "Jainagant",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 7/8] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 7/8 Spirit is destroyed.\n\n[LV1][LV2][LV3] (When Destroyed)\nSend a core from any opposing Spirits to the Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 7/8"
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
      }
    ]
  },
  {
    "cardNumber": "BS13-014",
    "name": "The DarkKnight Agravain",
    "cardType": "Spirit",
    "effect": "[Immortality: Dark Snake] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your \"Dark Snake\" family Spirit is destroyed.\n\n[LV1][LV2][LV3] (When Summoned)\nWhen summoned via [Immortality], you can summon a Cost 7 or more Spirit card from your Trash, without paying the cost. However, any (When Summoned) effects of the Spirit summoned via this effect can't activate.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Dark Snake"
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-015",
    "name": "The HellGovernor Hagen",
    "cardType": "Spirit",
    "effect": "During (Your End Step), return this Spirit card from your Trash to the Hand.\n\n[LV1][LV2] (When Summoned)\nReturn a Spirit card with [Curse]/ [Immortality] from your Trash to the Hand.\n\n[LV2] (Your Attack Step)\nAll your attacking Spirits with [Curse]/ [Immortality] are treated as colorless.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "END_STEP",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-016",
    "name": "The CurseKing Dragonaga",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] When your \"Dark Snake\" family Spirit is summoned, draw a card from your deck.\n\n[LV1][LV2][LV3] (Either Attack Step) When your \"Dragon\" family Spirits become exhausted, send a core from any opposing Spirits to the Reserve.\n\n[LV2][LV3] (When Destroyed) Return all \"Dragonaga\"-named Spirit card from your Trash to your Hand.",
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
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2,
            3
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
    "cardNumber": "BS13-017",
    "name": "Anaguma-Kosuke",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nFor each \"Imp\" family Spirit you control, this Spirit gains +1000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Imp"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-019",
    "name": "Corocorn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your End Step)\nBy returning a Spirit with [High Speed] you control to the Hand, this Spirit refreshes.\n\n[LV2] (Either Attack Step)\nWhen your Spirit braves, refresh that Spirit.",
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
    "cardNumber": "BS13-021",
    "name": "Saizorong",
    "cardType": "Spirit",
    "effect": "Flash - [High Speed]\nThis Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve.\n\n[LV1][LV2] (When Destroyed)\nRefresh a Spirit you control.",
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
        "overall": "WHEN_DESTROYED",
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
    "cardNumber": "BS13-022",
    "name": "Yang-Ogre",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed)\nPut a number of cores equal to this Spirit's LV from the Void to your Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put a number of cores equal to this Spirit's LV from the Void to your Reserve."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-023",
    "name": "Mountain-Seikai",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your End Step)\nRefresh all your LV2 or higher Spirits.\n\n[When Braved] [LV3] (When Battles)\nAt the end of the battle, by returning one of this Spirit's Braves to the Hand, this Spirit refreshes.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "END_STEP",
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
            "scope": "ALL_MATCHING",
            "filter": {}
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-024",
    "name": "The BushinBeast Deerl-Yukimura",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nFor each \"Imp\" family Spirit you control, put a core from the Void to your Reserve.\n\n[LV1][LV2] (When Attacks)\nBy exhausting an \"Imp\" family Spirit you control, this Spirit gains + (the exhausted Spirit's BP) BP.\n\n[LV2]\nBesides [The BushinBeast Deerl-Yukimura], when your Spirits are refreshed, this Spirit refreshes.",
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
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "BP_BUFF",
            "text": "this Spirit gains + (the exhausted Spirit's BP) BP."
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
    "cardNumber": "BS13-026",
    "name": "Kigna-Swan Mk-II",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - (Either Attack Step)\nBy exhausting this Spirit, during this turn, all your \"Galaxian\" /\"Astral Soul\" family Spirits gain +3000 BP.\n\n[LV1][LV2][LV3]\nOnly up to three cards can be discarded from either player's deck due to Spirit/Brave/Nexus/Magic effects per turn.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_ALLIES",
            "amount": 3000,
            "filter": {
              "family": "Galaxian"
            }
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
            "rule": "KEYWORD_RULE",
            "text": "Only up to three cards can be discarded from either player's deck due to Spirit/Brave/Nexus/Magic effects per turn."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-027",
    "name": "Moonshouuo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAt the start of the step, by returning this Spirit to the Hand, target an opposing Spirit. During this turn, when not blocked, that Spirit's attack can't reduce your Life.\n\n[LV2] (Opposing Attack Step)\nYour Life can't be reduced by opposing Spirit effects.",
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
            "text": "At the start of the step, by returning this Spirit to the Hand, target an opposing Spirit."
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
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "Your Life can't be reduced by opposing Spirit effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-028",
    "name": "The OathGoddess Var",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Red/Green/Yellow (Opposing Turn)\nWhen the opponent uses a Red/Green/Yellow Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV2][LV3] (Opposing Attack Step)\nAt the start of the step, refresh all your Spirits with [Ice Wall].",
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
    "cardNumber": "BS13-029",
    "name": "The SwordHorse Granim",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nAll your Red Spirits can block opposing 6000 BP or less Spirits while exhausted.\n\n[LV2][LV3] (Opposing Attack Step)\nAll your Red Spirits can block opposing Brave Spirits while exhausted.\n\n[LV3]\nThis Spirit is also treated as a Red spirit.",
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
            "text": "This Spirit is also treated as a Red spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-030",
    "name": "Lethalweapondragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Heavy Armor: Purple/Blue]\nThis Spirit is unaffected by opposing Purple/Blue Spirit/Brave/Nexus/Magic effects.\n\n[When Braved] [LV2] (When Battles)\nReturn opposing Spirits of the same colors as this Spirit's [Heavy Armor], one of each, to the Hand.",
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
        "keyword": "Heavy Armor: Purple/Blue"
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-031",
    "name": "The RainbowDragon Auroria",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAll your \"Armored Dragon\" family Spirits can block opposing Spirits while exhausted.\n\n[LV2] (When Blocks)\nFor each \"Armored Dragon\" family Spirit you control, this Spirit gains +2000 BP.",
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
            "op": "BP_BUFF_SELF",
            "amount": 2000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Armored Dragon"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-032",
    "name": "The LightSpeedKnight Hermod",
    "cardType": "Spirit",
    "effect": "[Tribute: Armed Machine → Void]\nAfter paying for the summoning cost, you must send all core from one of your \"Armed Machine\" family Spirits to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nReturn all opposing Nexuses to the Hand.\n\n[When Braved] [LV3] (When Brave Attacks)\nThis Spirit can't be blocked by opposing 6000 BP or more Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from one of your \"Armed Machine\" family Spirits to the Void."
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
            "count": 1,
            "allMatching": true
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
    "cardNumber": "BS13-034",
    "name": "Minogamen",
    "cardType": "Spirit",
    "effect": "When this card is discarded by an opposing \"Deck Discarding effect\", you can summon it without paying the cost. Also, during this turn, cards can't be discarded from your deck.\n\n[LV1][LV2] (When Summoned)\nReveal a card from your decktop. If that card is a Cost 2 Spirit card, add it to your Hand. Return any remaining card to the decktop.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
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
            "text": "Reveal a card from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If that card is a Cost 2 Spirit card, add it to your Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "RETURN_REMAINING_TO_DECK",
            "text": "Return any remaining card to the decktop."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-035",
    "name": "The Angelia of Olimpics Och",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step)\nCost 0/1/4 Spirits can't attack.\n\n[LV2]\nGive every \"Divine Spirit\" family Spirit card in your Hand a [Yellow Core] reduction symbol.",
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
            "text": "Cost 0/1/4 Spirits can't attack."
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
    "cardNumber": "BS13-036",
    "name": "The StarBird Kuhja",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nWhen your Yellow Spirits are destroyed, by sending a core from your Life to your Reserve, one of your destroyed Yellow Spirits remains on the Field, exhausted.\n\n[LV2][LV3] (Either Attack Step)\nWhen your Yellow Spirits are destroyed, draw a card.\n\n[LV3] (Either Attack Step)\nWhen your Yellow Spirits are destroyed, put a core from the Void to your Reserve.",
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
            "rule": "MOVE_CORE",
            "text": "When your Yellow Spirits are destroyed, by sending a core from your Life to your Reserve, one of your destroyed Yellow Spirits remains on the Field, exhausted."
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
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-037",
    "name": "Princepentan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit is also treated as being exactly-named \"The Kaiser Empereur\".\n\n[LV1][LV2][LV3] (When Summoned)\nYou can summon a \"Pentan\"-named Spirit card from your Hand, without paying the cost.",
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
            "text": "This Spirit is also treated as being exactly-named \"The Kaiser Empereur\"."
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-038",
    "name": "The Witch Tarangda",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen your \"Dark Artes\" family Spirits are destroyed, discard any number of Spirit cards from your Hand. For each Spirit card discard, one of your destroyed \"Dark Artes\" family Spirits returns to your Field, exhausted.\n\n[LV2] [Brilliance] (When Attacks)\nAt the end of battle, return all Magic cards you used during this battle to your Hand.",
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
            "text": "When your \"Dark Artes\" family Spirits are destroyed, discard any number of Spirit cards from your Hand."
          },
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
    "cardNumber": "BS13-039",
    "name": "The SacredBeast Barrong",
    "cardType": "Spirit",
    "effect": "For each \"Hunter Beast\" family Spirit you control, this Spirit card in your Hand gains an extra [Yellow Core] reduction symbol.\n\n[LV1][LV2][LV3] (When Summoned)\nDuring this turn, the effects of every opposing Nexus can't activates.\n\n[When Braved] [LV3] (When Brave Attacks)\nOnce per turn, at the end of battle, by sending a core from your Life to the Reserve, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
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
            "rule": "NEGATE_EFFECT",
            "text": "During this turn, the effects of every opposing Nexus can't activates."
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
    "cardNumber": "BS13-040",
    "name": "The VenusDragonDeity Venu-Feather",
    "cardType": "Spirit",
    "effect": "This Spirit card in your Hand can use the symbols on your Field as well as in your Trash for summoning cost reduction.\n\n[LV2][LV3] (When Destroyed)\nBy discarding three cards from your decktop, this Spirit returns to your Field, exhausted.\n\n[When Braved] [LV3] (When Brave Attacks)\nWhen blocked by an opposing Spirit, for each symbol on this Spirit, put a core from the Void to your Life.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "This Spirit card in your Hand can use the symbols on your Field as well as in your Trash for summoning cost reduction."
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
            "count": 2
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
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-042",
    "name": "Night-Gaun",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Main Step)\nWhen the opponent uses a Magic effect, after that effect resolves, destroy an opposing Cost 3 or less Spirit.\n\n[LV2] (Opposing Main Step)\nWhen the opponent uses a Magic effect, after that effect resolves, if the opposing Hand has equal or more cards than yours, the opposing Main Step ends.",
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
            "rule": "TRIGGERED_WATCHER",
            "text": "When the opponent uses a Magic effect"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "END_MAIN_STEP",
            "text": "if the opposing Hand has equal or more cards than yours, the opposing Main Step ends."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-043",
    "name": "The Birdman Ikarosh",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen either player's Cost 3 or less Spirit would attack, unless the owner sends a core from their Reserve to their Trash, it can't attack.",
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
            "text": "When either player's Cost 3 or less Spirit would attack, unless the owner sends a core from their Reserve to their Trash, it can't attack."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-044",
    "name": "The Minstrel Orphe",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBy discarding a card from your Hand, look at the entire opposing Hand, and discard a Magic card among them.\n\n[LV2]\nThe opponent can't return cards from the Trash to their Hand.",
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
    "cardNumber": "BS13-045",
    "name": "The GiantCaptain Iason",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBy destroying one of your Nexuses, destroy an opposing Nexus.\n\n[LV2] (Either Attack Step)\nWhen your \"Fighting Spirit\" family Spirit battles, for each of your \"Ancient Battleship\"-named Nexus, discard two cards from the opposing decktop (Max. 8)",
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
            "op": "DESTROY_NEXUS",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-046",
    "name": "Shantarg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDestroy two opposing Cost 3 or less Spirits. Or, destroy an opposing Cost 6 Spirit.\n\n[LV1][LV2] (Either Main Step)\nWhen either player uses a Magic effect, after that effect resolves, end the Main Step.\n\n[LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "maxCost": 3,
            "count": 2,
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
            "rule": "TRIGGERED_WATCHER",
            "text": "When either player uses a Magic effect"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "END_MAIN_STEP",
            "text": "end the Main Step."
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
    "cardNumber": "BS13-047",
    "name": "The GreatDeepSea Norg-Dens",
    "cardType": "Spirit",
    "effect": "[Tribute: Fusion Beast → Void]\nAfter paying for the summoning cost, you must send all core from one of your \"Fusion Beast\" family Spirits to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nDuring this turn, when this Spirit attacks, unless the opponent discards a Magic card from their Hand, they can't block.\n\n[LV2][LV3]\nThe symbols of every \"Fusion Beast\" family Spirit you control becomes two Blue symbols.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from one of your \"Fusion Beast\" family Spirits to the Void."
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
            "rule": "DISCARD_HAND",
            "text": "During this turn, when this Spirit attacks, unless the opponent discards a Magic card from their Hand, they can't block."
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-048",
    "name": "The AncientBattleship Argo-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nIf you have four different types of \"Ancient Battleship\"-named Nexuses, destroy every opposing Spirit/Nexus.\n\n[LV2] (Either Attack Step)\nAll your \"Ancient Battleship\"-named Nexuses with one core or more on them lose their Nexus effects, and are treated as \"Cost: 6/Family: Artificial Soldier, Astral Soul/LV1: 1 core, 8000 BP/No printed effects\" Spirits.",
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
            "op": "DESTROY_NEXUS",
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
            "rule": "COST_MODIFIER",
            "text": "All your \"Ancient Battleship\"-named Nexuses with one core or more on them lose their Nexus effects, and are treated as \"Cost: 6/Family: Artificial Soldier, Astral Soul/LV1: 1 core, 8000 BP/No printed effects\" Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-049",
    "name": "Irritaban",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1]\nWhile this Brave is in Spirit condition, you can brave this Spirit with a Brave you control.\n\n[When Braved] (When Brave Attacks)\nYou can activate the (When Brave Attacks) of a Spirit-condition Brave or a Brave on a Brave Spirit you control as this Spirit's effect.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
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
            "rule": "KEYWORD_RULE",
            "text": "While this Brave is in Spirit condition, you can brave this Spirit with a Brave you control."
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "You can activate the (When Brave Attacks) of a Spirit-condition Brave or a Brave on a Brave Spirit you control as this Spirit's effect."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-050",
    "name": "The ShineDragon Shine-Blazer",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (When Brave Attacks)\nWhen any opposing 8000 BP or more Spirit is destroyed, for each destroyed Spirit, send an opposing Life to their Reserve.",
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
    "cardNumber": "BS13-051",
    "name": "Zuganake",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nBy destroying a Spirit you control, the opponent destroys a Spirit they control.",
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
            "rule": "DESTROY",
            "text": "By destroying a Spirit you control"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "the opponent destroys a Spirit they control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-052",
    "name": "Evilglider",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nActivate the (When Destroyed) effect of a Spirit you control without destroying it.\n\n[When Braved] (When Brave Attacks)\nTreat this Spirit's color as colorless.",
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
            "rule": "DESTROY",
            "text": "Activate the (When Destroyed) effect of a Spirit you control without destroying it."
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
            "text": "Treat this Spirit's color as colorless."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-053",
    "name": "Mokubaoh",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (Either Attack Step)\nWhen your Spirit with [High Speed] is summoned, you can refresh this non-battling Spirit-condition Brave, and brave it with that Spirit.\n\n[When Braved] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, by returning a Spirit with [High Speed] you control to your Hand, return an opposing Spirit to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 3 or more"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "keyword": "High Speed"
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {},
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
    "cardNumber": "BS13-054",
    "name": "Hyo-Katchu",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nThe opponent exhaust two Spirits they control.",
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
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-055",
    "name": "The HeavyArmoredBrave Shield-Dragon Mk-II",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nReturn an opposing Nexus to the decktop.\n\n[When Braved] [Heavy Armor: Green/White/Yellow]\nThis Spirit is unaffected by opposing Green/White/Yellow Spirit/Brave/Nexus/Magic effects.",
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
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Heavy Armor: Green/White/Yellow"
      }
    ]
  },
  {
    "cardNumber": "BS13-056",
    "name": "Hawk-Breaker",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[LV1]\nWhile this Brave is in Spirit-condition, give all your Spirits: \"[Heavy Armor: Red] This Spirit is unaffected by opposing Red Spirit/Brave/Nexus/Magic effects.\"\n\n[When Braved] (When Blocks)\nThis Spirit gains +5000 BP for each symbol the opposing battling Spirit has.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 5 or more"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "keyword": "Heavy Armor: Red"
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "turn": "OPPONENT"
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
    "cardNumber": "BS13-057",
    "name": "Poppor",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Destroyed)\nThis Brave Spirit's Braves remain on the Field, refreshed, and only the Spirit returns to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
      },
      {
        "overall": "WHEN_DESTROYED",
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
    "cardNumber": "BS13-058",
    "name": "Chihyu",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Attacks)\nOnce per turn, by discarding five cards from your decktop, put a core from the Void to your Life, and this Spirit can't be blocked by opposing LV1/LV2 Spirits.",
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
          "levels": [
            1
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
    "cardNumber": "BS13-059",
    "name": "Forbbid-Vulture",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDeploy every Purple/Green/Blue Nexus cards from your Trash, without paying the cost.\n\n[When Braved] (Either Attack Step)\nWhen the battle of an attacking Cost 4 or less Spirit ends, end the Attack Step.",
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
            "op": "END_ATTACK_STEP",
            "timing": "IMMEDIATE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-060",
    "name": "Tres-Beluga",
    "cardType": "Brave",
    "effect": "[Brave Condition: Galaxian]\n\n[When Braved] (When Brave Attacks)\nBy discarding six cards from your decktop, this Spirit gains +6000 BP. If one or more \"Galaxian\" family Spirit cards are sent to your Trash via this effect, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Galaxian"
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          },
          {
            "op": "BP_BUFF_SELF",
            "amount": 6000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-061",
    "name": "The Coronation Volcano",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen a 4000 BP or less Spirit attacks, destroy that Spirit.\n\n[LV2] (Your Attack Step)\nFor each core in your Life, every Spirit you control with both \"Terra Dragon\" and \"Dragon\" families gain +1000 BP.",
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
            "maxBp": 4000,
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
        "amount": 1000
      }
    ]
  },
  {
    "cardNumber": "BS13-062",
    "name": "The Shining Galaxy",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nAll \"Galaxian\" family Spirit cards in your Hand become Cost 5.\n\n[LV2] Flash - (Either Attack Step)\nBy discarding an \"Astral Deity\"/\"Galaxian\" family Spirit card from your Hand, during this battle, one of your Spirits gets +6000 BP and an extra Red symbol. This effect can only be used once per turn.",
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
            "text": "All \"Galaxian\" family Spirit cards in your Hand become Cost 5."
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
            "op": "BP_BUFF_TARGET",
            "amount": 6000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-063",
    "name": "The Bloody Artifact",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen a Spirit with two or less cores on it attacks, destroy that Spirit.\n\n[LV2] (Your Draw Step)\nAt the start of the step, by discarding a Spirit card with [Curse]/[Immortality] from your Hand, you draw +2 cards.",
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
            "rule": "DESTROY",
            "text": "When a Spirit with two or less cores on it attacks, destroy that Spirit."
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-064",
    "name": "The Palace of Snake Believers",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen the attack of your LV2 or higher \"Dark Snake\" family Spirit would reduce the opposing Life, the core from the Life is sent to the Void, not the Reserve.\n\n[LV2] (Opposing Attack Step)\nWhen your Life is reduced by the attack of opposing Spirit, for each symbol on the Spirit attacked, the opponent discards a card from their Hand.",
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
            "text": "When the attack of your LV2 or higher \"Dark Snake\" family Spirit would reduce the opposing Life, the core from the Life is sent to the Void, not the Reserve."
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
            "rule": "DISCARD_HAND",
            "text": "When your Life is reduced by the attack of opposing Spirit, for each symbol on the Spirit attacked, the opponent discards a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-065",
    "name": "The Octant Small Shrine",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Main Step)\nWhen either player is summoning a Cost 3 or less non-\"Imp\"/\"Astral Soul\" family Spirit card, it is summoned in exhausted state.\n\n[LV2] (Opposing Main Step)\nCores can't be removed from opposing Spirits unless via an opposing effect.",
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
            "rule": "COMBAT_RESTRICTION",
            "text": "Cores can't be removed from opposing Spirits unless via an opposing effect."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-068",
    "name": "The Faraway Satellite Cannon",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nEither player can only attack once with a Spirit that has two symbols.\n\n[LV2] (Opposing Attack Step)\nWhen an opposing 4000 BP or less Spirit attacks, by exhausting this Nexus, return that Spirit to the Hand.",
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
        "subCost": {
          "type": "EXHAUST_SELF"
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
    "cardNumber": "BS13-069",
    "name": "The Starry Sky Concert Hall",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Main Step)\nWhen the opponent would deploy a Nexus, they can't use its reduction symbols to reduce the cost.\n\n[LV2]\nAll your Brave Spirits are also treated as Cost 2.",
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
            "text": "All your Brave Spirits are also treated as Cost 2."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-070",
    "name": "The Constellation Barrier",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nNeither player's Life would be reduced by the attack of Cost 3 or less LV1 Spirits.\n\n[LV2] (Opposing Attack Step)\nWhen your Life is reduced by an opposing Spirit, by exhausting this Nexus, put a core from the Void to your life. This effect can only be used once per turn.",
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
            "text": "Neither player's Life would be reduced by the attack of Cost 3 or less LV1 Spirits."
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
            "op": "CORE_FROM_VOID",
            "to": "LIFE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-071",
    "name": "The Port of Giants",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen you control three or less Spirits, you can't attack. When the opponent controls three or less Spirits, they can't attack.\n\n[LV2] (Opposing Main Step)\nWhen the opponent uses Magic effects twice or more, after that effect resolves, end the opposing Main Step.",
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
            "text": "When you control three or less Spirits, you can't attack."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "When the opponent controls three or less Spirits, they can't attack."
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
            "rule": "TRIGGERED_WATCHER",
            "text": "When the opponent uses Magic effects twice or more"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "END_MAIN_STEP",
            "text": "end the opposing Main Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-072",
    "name": "The Unfinished Ancient Battleship:Compass",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nThe opponent can't return cards from the Trash to their Hand.\n\n[LV2]\nTreat all your \"Ancient Battleship\"-named Nexuses as LV2.",
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
            "rule": "TREAT_RULE",
            "text": "Treat all your \"Ancient Battleship\"-named Nexuses as LV2."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-073",
    "name": "Burning Sun",
    "cardType": "Magic",
    "effect": "[Flash]\nSummon a Brave card from your Hand without paying the cost to directly brave with an \"Apollo\"-named Spirit you control, and refresh that Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "REANIMATE_TRASH",
            "count": 1
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
    "cardNumber": "BS13-074",
    "name": "Zodiac Conduct",
    "cardType": "Magic",
    "effect": "[Main]\nReveal four cards from your decktop. Summon a \"Galaxian\" family Spirit card among them, without paying the cost. Discard the remaining cards.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "rule": "REVEAL_DECKTOP",
            "text": "Reveal four cards from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "Discard the remaining cards."
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
    "cardNumber": "BS13-075",
    "name": "Snake Slave",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your Spirits are destroyed, by sending a core from your Reserve to the Trash, summon a \"Dark Snake\" family Spirit card from your Trash, without paying the cost. However, (When Summoned) effects of that Spirit do not activate.\n\n[Flash]\nDuring this turn, give a Spirit you control +2000 BP.",
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-076",
    "name": "Assassinate",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy an opposing exhausted Brave Spirit. Or, destroy two opposing exhausted Cost 3 or less Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BRAVE",
            "count": 1
          },
          {
            "op": "DESTROY_BY_COST",
            "maxCost": 3,
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-077",
    "name": "Breeze Ride",
    "cardType": "Magic",
    "effect": "During (Your End Step), return a [Breeze Ride] from your Trash to the Hand. This effect can only be used once per turn.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-078",
    "name": "Never Give Up",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, give a Spirit you control the following effect: \"When only the opposing Spirit is destroyed by comparing BP with your Spirits, refresh this Spirit.\"",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
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
    "cardNumber": "BS13-079",
    "name": "Vanishing Day",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, Spirits that would be returned to any player's Hand via your Spirit/Brave/Nexus/Magic effects are returned to the owner's decktop instead.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS13-080",
    "name": "Crescent Howling",
    "cardType": "Magic",
    "effect": "[Flash]\nReturn an opposing Spirit to the Hand. Then, if you control any \"Strike\"-named Spirit, return an opposing Spirit to the Hand.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-082",
    "name": "Pegasus Flap",
    "cardType": "Magic",
    "effect": "[Flash]\nWhen the battle resolves, end the battle without comparing BP. Then, refresh one of your Spirits.",
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
    "cardNumber": "BS13-083",
    "name": "Galaxy Eternal Requiem",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, treat every Spirit you control as being on its highest level.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "During this turn, treat every Spirit you control as being on its highest level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-084",
    "name": "Argo Attack",
    "cardType": "Magic",
    "effect": "[Main]\nDeploy every \"Ancient Battleship\"-named Nexus card from your Trash, without paying the cost. Then, if you control four different kinds of \"Ancient Battleship\"-named Nexuses, activate the (When Summoned) effect of a [The AncientBattleship Argo-Golem] you control.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
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
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ACTIVATE_TRIGGER",
            "text": "if you control four different kinds of \"Ancient Battleship\"-named Nexuses, activate the (When Summoned) effect of a [The AncientBattleship Argo-Golem] you control."
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
    "cardNumber": "BS13-X01",
    "name": "The ShineCentaurusDeity Sagitto-Apollodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit can brave with up to two Braves.\n\n[LV1][LV2][LV3]\nAll your \"Galaxian\"/\"Astral Soul\" family Spirits can target and attack an opposing Spirit.\n\n[During Brave] [LV3] (When Attacks)\nFor each Brave on this Spirit, destroy an opposing 10000 BP or less Spirit.",
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
            "text": "This Spirit can brave with up to two Braves."
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
            "rule": "TARGET_ATTACK",
            "text": "All your \"Galaxian\"/\"Astral Soul\" family Spirits can target and attack an opposing Spirit."
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
            "maxBp": 10000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-X02",
    "name": "The SnakeMasterDeity Asklepiooze",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nBy destroying an \"Astral Soul\" family Spirit you control, draw three cards.\n\n[LV2][LV3] (Your Attack Step)\nWhen your \"Galaxian\"/\"Dark Snake\" family Spirits are destroyed by comparing BP, they remain on the Field, refreshed.\n\n[LV3] (When Blocks)\nBesides [Soul Core], send every core from the opposing Spirit that this Spirit blocks to the Void.",
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
            "count": 3
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
            "scope": "TARGET"
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
    "cardNumber": "BS13-X04",
    "name": "The MachineLionDeity Strikewurm-Leo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Heavy Armor: Purple/Green/White/Yellow]\nThis Spirit is unaffected by opposing Purple/Green/White/Yellow Spirit/Brave/Nexus/Magic effects.\n\n[LV1][LV2][LV3]\nWhen your other \"Galaxian\"/\"Astral Soul\" family Spirit is exhausted, refresh this Spirit.\n\n[During Brave] [LV3]\nAll your \"Galaxian\"/\"Astral Soul\" family Spirits gain an extra White symbol.",
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
        "keyword": "Heavy Armor: Purple/Green/White/Yellow"
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-X05",
    "name": "The KylinStarBeast Rean",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit can brave ignoring brave conditions.\n\n[LV2][LV3] (When Destroyed)\nBy exhausting a Spirit you control in the same family as this Spirit, it remains on the Field, refreshed.\n\n[When Braved] [LV3]\nThis Spirit gains the families of all Spirits you control.",
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
            "text": "This Spirit can brave ignoring brave conditions."
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
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "GRANT_FAMILY",
            "text": "This Spirit gains the families of all Spirits you control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS13-X06",
    "name": "The GiantBraver Perseus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nFor each Nexus you control, destroy an opposing Spirit-condition Brave, or the Brave of an opposing Brave Spirit.\n\n[LV1][LV2] (When Attacks)\nDestroy an opposing Cost 4 or less Spirit.\n\n[When Braved] [LV2] [Assault: 3] (When Attacks)\nThis Spirit can, up to three times per turn, be refreshed by exhausting one of your Nexuses.",
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
            "op": "DESTROY_NEXUS",
            "count": 1
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
            2
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
    "cardNumber": "THE-GREAT-A10545",
    "name": "The Great Tree of Life",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] When your Spirit is destroyed by the opponent, put a core from the Void to your Reserve.\n\n[LV2] (Opposing Attack Step) When an opposing Spirit's attack reduces your life, put a core from the Void to your Reserve, and refresh a Spirit you control.",
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
          ],
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
          {
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  }
];

for (const spec of BS13_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
