/**
 * engine/cards/sets/bs09_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS09_SAGA_CARDS)
 * Total Cards: 81 (81 Effect, 0 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS09_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10002",
    "name": "The Flying Ark",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step) When you put cores to your life due to Holy Life effects, you can reveal two cards from your decktop. Add a Magic card among them to your Hand. Return the remaining cards to the deckbottom in any order you wish.\n\n[LV2] (Either Attack Step) All of your Magic cards gain 1 additional Yellow cost reduction symbol.",
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
            "op": "REVEAL_DECKTOP_ADD",
            "count": 2,
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
            "rule": "COST_MODIFIER",
            "text": "All of your Magic cards gain 1 additional Yellow cost reduction symbol."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10210",
    "name": "The Gatekeeper Alparkar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Treat this spirit as a blue spirit as well as a green spirit.",
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
            "text": "Treat this spirit as a blue spirit as well as a green spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1027",
    "name": "Bogies",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Send all but one of the Cores on one of your opponent's Spirits to his/her Trash.",
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
            "count": 2,
            "to": "TRASH",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1049",
    "name": "Kitsunaby",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] This Spirit is also treated as a Red Spirit.",
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
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Red Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10516",
    "name": "The GreatHornCastle Elasmos",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Add one Core from the Void to this Spirit for every \"Blade Beast\" and \"Giant Beast\" Attribute Spirit on your Field.",
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10551",
    "name": "The Green Big Tree",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step) When your Spirit with Windstorm is summoned, exhaust an opposing Spirit with the same cost as that Spirit.\n\n[LV2] (Either Attack Step) You target which Spirit(s) the opponent exhaust due to Windstorm.",
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
    "cardNumber": "BATTLE-SPIRITS-A10567",
    "name": "The Great Workshop of the Meisters",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) When your \"Creator\" family Spirit becomes exhausted, put a core from the Void to your Reserve.\n\n[LV2] (Your End Step) By using the cores on your Field, you can deploy a Green/Blue Nexus card from your Trash.",
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
            "op": "PASSIVE_RULE",
            "rule": "PAY_COST",
            "text": "By using the cores on your Field"
          },
          {
            "op": "DEPLOY_NEXUS_FROM_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10624",
    "name": "The GuardianGiantBeast Galaparzo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] When a Spirit with only 3000BP or less attacks, neither player loses Life Cores.\n\n[LV2] Ice Wall: Green - (Opponent's Turn) When the opponent uses the effect of a Green Magic, by exhausting this Spirit, negate that effect.",
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
            "rule": "PREVENT_DAMAGE",
            "text": "When a Spirit with only 3000BP or less attacks, neither player loses Life Cores."
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
    "cardNumber": "BATTLE-SPIRITS-A10689",
    "name": "The HeelGiant Titus-the-Black",
    "cardType": "Spirit",
    "effect": "Tribute: Cost 5 or more → Void -\nAfter paying for the summon cost, you must send all cores from a Cost 5 or more Spirit you control to the Void.\n\n[LV1][LV2] (When Attacks) When only the opposing Spirit is destroyed by BP comparison, discard 15 cards from the opposing decktop.\n\n[LV2] (When Attacks) Cores on the Spirit blocking this Spirit cannot be removed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "Tribute: Cost 5 or more → Void -"
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
            "rule": "RESTRICTION",
            "text": "Cores on the Spirit blocking this Spirit cannot be removed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10870",
    "name": "The HornDinoman Drakkhen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) This Spirit gains +2000 BP.\n\n[LV2] (Your Attack Step) All your Spirits with cost reduction symbols of two or more different colors gain +2000 BP.",
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
    "cardNumber": "BATTLE-SPIRITS-A12049",
    "name": "The Sanctuary protected by GiantBeast",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step) When \"Giant Beast\"/\"Hunter Beast\" family Spirit blocks an opposing Spirit, put a core from the Void to that Spirit.\n\n[LV2] (Your End Step) Refresh every \"Giant Beast\"/\"Hunter Beast\" family Spirits you control.",
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
    "cardNumber": "BATTLE-SPIRITS-A12700",
    "name": "The StarDragonDeity Sieg-Meteorwurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash- [Awaken]\nYou can put any number of cores from Spirits you control to this Spirit.\n\n[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.",
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
    "cardNumber": "BATTLE-SPIRITS-A13852",
    "name": "Transformation",
    "cardType": "Magic",
    "effect": "Flash- Target a Nexus you control with at least one core on it. During this turn, that Nexus loses its effects as Nexus, and is instead treated as a Spirit with (Cost 5/\"Artificial Soldier\" family/LV1: 1 core, 6000BP/No printed effects).",
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
            "rule": "TARGET_CARD",
            "text": "Target a Nexus you control with at least one core on it."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "During this turn, that Nexus loses its effects as Nexus, and is instead treated as a Spirit with (Cost 5/\"Artificial Soldier\" family/LV1: 1 core, 6000BP/No printed effects)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14387",
    "name": "Wind Shear",
    "cardType": "Magic",
    "effect": "Flash - Refresh all your Spirits with Windstorm.",
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
    "cardNumber": "BATTLE-SPIRITS-A3068",
    "name": "Blessing Cores",
    "cardType": "Magic",
    "effect": "Main- Put a core from the Void each to two of your Nexuses.\n\nFlash- During this turn, give a Spirit +3000 BP.",
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
    "cardNumber": "BATTLE-SPIRITS-A3432",
    "name": "Clockdile",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned) Destroy all opposing Spirits with Assault.\n\n[LV3] (When Destroyed) Return a Purple/Yellow Magic card from the Trash to your Hand.",
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
    "cardNumber": "BATTLE-SPIRITS-A3942",
    "name": "Elimination",
    "cardType": "Magic",
    "effect": "Flash- By sending a core from your Spirits to the Trash, the opponent sends a core from their Spirits to their Trash.",
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3965",
    "name": "Dragonic Howling",
    "cardType": "Magic",
    "effect": "Flash- Discard a card from your decktop. Destroy every opposing Spirit with the same Cost as the discarded card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "MILL_DECK",
            "side": "OPPONENT",
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
    "cardNumber": "BATTLE-SPIRITS-A3986",
    "name": "Emergency",
    "cardType": "Magic",
    "effect": "Flash- Refresh all your exhausted Spirits. During this turn, Spirits without Tribute refreshed by this effect cannot attack.",
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
    "cardNumber": "BATTLE-SPIRITS-A4308",
    "name": "Futabanea",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Main Step) When your Blue Spirit is summoned, destroy an opposing 2000 BP or less Spirit.",
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
            "maxBp": 2000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4840",
    "name": "Healing Circle",
    "cardType": "Magic",
    "effect": "Main- Put a core from the Void to your Life.\n\nFlash- During this turn, give a Spirit +2000 BP.",
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
            "amount": 2000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4972",
    "name": "Iceberg",
    "cardType": "Magic",
    "effect": "Main - During this turn, all your Spirits' Ice Wall effect activate during (Your Turn).\n\nFlash - During this turn, give a Spirit +2000 BP.",
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
            "text": "During this turn, all your Spirits' Ice Wall effect activate during (Your Turn)."
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
    "cardNumber": "BATTLE-SPIRITS-A6521",
    "name": "Mimizukurow",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] When one of your Spirits is Summoned via Immortality, send one Core from any of your opponent's Spirits to his/her Reserve.",
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
    "cardNumber": "BATTLE-SPIRITS-A7910",
    "name": "Somersault Turn",
    "cardType": "Magic",
    "effect": "Main - Target a color of Spirits. During this turn, your \"Fairy\" family Spirits can't be blocked by opposing Spirits of the targeted color.\n\nFlash - During this turn, give a Spirit +4000 BP.",
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
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8479",
    "name": "The ArmoredBeast Oozuchi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step) When your Life is reduced by opposing Spirits, refresh a Yellow Spirit you control.",
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
    "cardNumber": "BATTLE-SPIRITS-A8544",
    "name": "The Artifact Galar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Treat this spirit as a white spirit as well as a yellow spirit.",
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
            "text": "Treat this spirit as a white spirit as well as a yellow spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8604",
    "name": "The Awakening Fortress Castle",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Deployed) You can summon a Cost 4 or less Blue Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects do not activate.\n\n[LV2] (Your Draw Step) At the start of this step, by discarding a Nexus card from your Hand, increase the number of cards you draw by +1.",
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
            "text": "any (When Summoned) effects do not activate."
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
            "text": "At the start of this step, by discarding a Nexus card from your Hand, increase the number of cards you draw by +1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8852",
    "name": "The BombBeast Bonnacorn",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) When you have a Green Spirit on your Field, destroy one opposing Spirit with a Core Cost of 2 or less.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9729",
    "name": "The FairyPrincess Hama-Dryas",
    "cardType": "Spirit",
    "effect": "[LV3] All of your \"Fairy\" Attribute Spirits gain the following effect: (When Attacks) When determining the battle's outcome, if the opponent's blocking Spirit is at Level 1, treat the situation as if you were never blocked, ignoring Battle Point difference.",
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
            "rule": "KEYWORD_RULE",
            "text": "All of your \"Fairy\" Attribute Spirits gain the following effect: (When Attacks) When determining the battle's outcome, if the opponent's blocking Spirit is at Level 1, treat the situation as if you were never blocked, ignoring Battle Point difference."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9954",
    "name": "The Flower Palace",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn) When your \"Fairy\" family Spirits is destroyed, by sending a core from that Spirit to the Trash, it returns to the Field, exhausted.\n\n[LV2] (Either Attack Step) Opposing Nexus cannot be exhausted.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-004",
    "name": "The VampireDragon Wybat",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.",
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
            "keyword": "Clash"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-005",
    "name": "The GalaxyDragon Andrometeors",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nYou can reveal two cards from your decktop. If any, add an \"Astral Dragon\" family Spirit card among them to your Hand. Return any remaining cards to the deckbottom in any order.\n\n[LV2][LV3]\nThis Spirit is also treated as a Blue Spirit.",
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
            "op": "REVEAL_DECKTOP_ADD",
            "count": 2,
            "filter": {
              "family": "Astral Dragon"
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
            "rule": "ADD_COLOR",
            "text": "This Spirit is also treated as a Blue Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-006",
    "name": "The SnakeDragon King-Gorgo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Either Attack Step)\nAll your \"Astral Dragon\" family Spirits gain +3000 BP.\n\n[LV2] (Your Main Step)\nWhen your Blue Spirit is summoned, destroy an opposing 3000 BP or less Spirit.",
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
        "amount": 3000
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
            "maxBp": 3000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-007",
    "name": "The WildBeast Cruger",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nSend two cores from your Trash to one of your Spirits.",
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
            "to": "RESERVE",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-008",
    "name": "The FlameEmperor Agniffon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nSend two cores from your Trash to one of your Spirits.\n\n[LV2][LV3] (Your Attack Step)\nThe symbols of every \"Emperor Beast\" family Spirit you control becomes two symbols of the same color as the symbol that Spirit already has.",
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
            "to": "RESERVE",
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
            "op": "ADD_EXTRA_SYMBOL",
            "scope": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-009",
    "name": "The BlazeEmperor Arc",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Attacks)\nDestroy an opposing 3000 BP or less Spirit, and two opposing Nexuses.",
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
    "cardNumber": "BS09-011",
    "name": "The ShieldKnight Guardner",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (Opposing Attack Step)\nWhen your Red Spirit is destroyed, send a core from any opposing Spirit to their Reserve.",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-014",
    "name": "The DarkKnight Bors",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Immortality: Cost 5] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 5 Spirit is destroyed.",
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
        "keyword": "Immortality: Cost 5"
      }
    ]
  },
  {
    "cardNumber": "BS09-015",
    "name": "The JailBeast Gashabers",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Draw Step)\nIf you control any 8000 BP or more Spirit, you draw +1 card.\n\n[LV3] (When Destroyed)\nReturn a Yellow Spirit card from your Trash to the Hand.",
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
    "cardNumber": "BS09-016",
    "name": "The DarkKnight Mordred",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 6/7] (Either Attack Step)\nWhen your Cost 6/7 Spirit is destroyed, you can summon this Spirit card from the Trash.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nWhen your Red Spirits are destroyed, send a core from any opposing Spirits to their Reserve.\n\n[LV2][LV3] (When Attacks)\nBoth players destroy a non-[Tribute] Spirit they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 6/7"
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
    "cardNumber": "BS09-017",
    "name": "The DragonPhoenixDeity Baaral",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Immortality: Cost 3/4/5/6] (Either Attack Step)\nWhen your Cost 3/4/5/6 Spirit is destroyed, you can summon this Spirit card from the Trash.\n\n[LV2][LV3]\nIncrease the level cost of every opposing Spirit by +1.\n\n[LV3] (When Attacks)\nSend all cores from the opposing Reserve to their Trash.",
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
        "keyword": "Immortality: Cost 3/4/5/6"
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
            "text": "Increase the level cost of every opposing Spirit by +1."
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
            "to": "TRASH"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-018",
    "name": "The DarknessEmperor Zanba",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Attacks)\nSend a number of cores from any opposing Spirits to their Reserve, equal to this Spirit's level.",
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
      }
    ]
  },
  {
    "cardNumber": "BS09-022",
    "name": "The Viscount Minoba",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts a Spirit they control.\n\n[LV2] (Your Attack Step)\nAll your Spirits with [Windstorm] gain +2000 BP.",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-023",
    "name": "The FortressWorm Ralba",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nPut a core from the Void each to two White Spirits you control.\n\n[LV2]\nThis Spirit is also treated as a White Spirit.",
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
            "text": "This Spirit is also treated as a White Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-025",
    "name": "The Ninja Sarutobe",
    "cardType": "Spirit",
    "effect": "When this Spirit is discarded from the Hand by an opposing Spirit effect, you can summon it, without paying the cost.\n\n[LV1][LV2] (When Summoned)\nThe opponent discards a card from their Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When this Spirit is discarded from the Hand by an opposing Spirit effect, you can summon it, without paying the cost."
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
            "rule": "DISCARD_HAND",
            "text": "The opponent discards a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-026",
    "name": "The Captain Dreadnought",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts two Spirits they control.\n\n[LV2] (Your Attack Step)\nWhen your Spirits with [Windstorm] are destroyed by comparing BP, they return to the Field, exhausted.",
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
    "cardNumber": "BS09-027",
    "name": "The JungleEmperor Volza",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Battles)\nWhen only the opposing Spirit is destroyed via BP comparison, this Spirit refreshes.\n\n[LV2][LV3] (When Attacks)\nCores can't be removed from the Spirit that is blocking this Spirit.",
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
            "rule": "COMBAT_RESTRICTION",
            "text": "Cores can't be removed from the Spirit that is blocking this Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-030",
    "name": "The Guardian Hlin",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Armor: Purple/Blue]\nThis Spirit is unaffected by opposing Purple/Blue Spirit/Nexus/Magic effects.\n\n[LV2]\nGive all your \"Ice Princess\" family Spirits: [Armor: Purple/Blue].",
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
        "keyword": "Armor: Purple/Blue"
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
    "cardNumber": "BS09-032",
    "name": "The FlyingIronBeast Gale-Fokker",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Core Step)\nIf you control any Cost 7 or more Spirit, put a core from the Void to this Spirit.\n\n[LV2] (Opposing Attack Step)\nAll your Spirits with cost reduction symbols of two or more colors gain +2000 BP.",
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
    "cardNumber": "BS09-033",
    "name": "The LanceKnight Gautr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Life is reduced by an opposing Spirit, refresh three of your Yellow Spirits.",
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
      }
    ]
  },
  {
    "cardNumber": "BS09-035",
    "name": "The GiantBeastEmperor Smidlord",
    "cardType": "Spirit",
    "effect": "When your Life is reduced by opposing Spirits, and your Life is three or less, you can summon this Spirit card from your Hand, without paying the cost.\n\n[LV2][LV3] (Opposing Attack Step)\nAll your \"Giant Beast\"/\"Hunter Beast\" family Spirits gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "When your Life is reduced by opposing Spirits, and your Life is three or less, you can summon this Spirit card from your Hand, without paying the cost."
          }
        ]
      },
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "targetFilter": {
          "family": "Hunter Beast"
        },
        "amount": 2000
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
    "cardNumber": "BS09-037",
    "name": "Pooka",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Treat this spirit as a Yellow spirit as well as a Purple spirit.",
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
            "text": "Treat this spirit as a Yellow spirit as well as a Purple spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-039",
    "name": "The Detective Pentan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Start Step)\nBy discarding [Character Lost] from your Hand, choose a random card from the opposing Hand, and look at its content.\n\n[LV2] (When Destroyed)\nReturn a Purple Magic card from your Trash to the Hand.",
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
            "text": "By discarding [Character Lost] from your Hand"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "choose a random card from the opposing Hand"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "look at its content."
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-040",
    "name": "Iwasaal",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nExhaust two opposing Cost 3 or less Spirits.\n\n[LV2]\nThis Spirit is also treated as a Purple Spirit.",
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
      }
    ]
  },
  {
    "cardNumber": "BS09-041",
    "name": "Aspidochelun",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nDraw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-042",
    "name": "The FairyKnight Peter",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.\n\n[LV2][LV3] (When Attacks)\nTarget an opposing Spirit. During this battle, that Spirit can't block.",
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
            "rule": "TARGET",
            "text": "Target an opposing Spirit."
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
    "cardNumber": "BS09-045",
    "name": "The ShiningEmperor Ryute",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (Your Attack Step)\nAll opposing Spirits that are blocking your Spirits are treated as LV1.",
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
            "rule": "TREAT_LEVEL",
            "text": "All opposing Spirits that are blocking your Spirits are treated as LV1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-049",
    "name": "The FlameLizard Cthughma",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit can block opposing Spirits with \"can't be blocked\" effects.\n\n[LV3] (When Blocks)\nDestroy an opposing Spirit with \"can't be blocked\" effects.",
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
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            3
          ],
          "turn": "OPPONENT"
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
    "cardNumber": "BS09-050",
    "name": "The Diva Canary",
    "cardType": "Spirit",
    "effect": "[LV2]\nWhen your Nexus is deployed, put a core from the Void onto this Spirit.",
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
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-052",
    "name": "Forest-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nIf you control any Green Spirit, destroy opposing Cost 3/4 Spirits, one of each.\n\n[LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
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
            "op": "DESTROY_ONE_OF_EACH_COST",
            "costs": [
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
    "cardNumber": "BS09-054",
    "name": "The StormEmperor Coyo",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 3 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.\n\n[LV2][LV3] [Assault: 1] (When Attacks)\nThis Spirit can, once per turn, be refreshed by exhausting one of your Nexuses.",
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
      }
    ]
  },
  {
    "cardNumber": "BS09-055",
    "name": "The Reincarnation Valley",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Draw Step)\nAt the start of the step, by discarding a Spirit card with [Tribute] from your Hand, you draw +1 card.\n\n[LV2]\nAll your Spirits with [Tribute] can't be returned to your Hand by opposing Spirit/ Nexus/ Magic effects.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-056",
    "name": "The Star Creation Place",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive all your 8000 BP or more Spirits the effect: \"[Clash] (When Attacks) The opponent must block if possible.\"\n\n[LV2] (Either Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Astral Dragon\" family Spirit, return a Spirit card from your Trash to the Hand.",
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
    "cardNumber": "BS09-058",
    "name": "The Grimoire Bookshelf",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen the opponent uses a Magic effect, send a core from any opposing Spirit to their Reserve.\n\n[LV2] (Opposing End Step)\nYou can return a card from your Hand to the decktop. If the opposing deck has 0 cards, this effect don't activate.",
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
          "turn": "OPPONENT"
        },
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "If the opposing deck has 0 cards, this effect don't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-059",
    "name": "The Jade Shrine",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nEvery \"Blade Beast\" family Spirit you control gains +2000 BP.\n\n[LV2] (Opposing Main Step)\nThe number of cores on your Spirits can't become less than their LV1 cost.",
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
          "family": "Blade Beast"
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
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "The number of cores on your Spirits can't become less than their LV1 cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-062",
    "name": "The Spring of Norn",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn) You can exhaust a Nexus you control instead for the Ice Wall of your Spirits.\n\n[LV2] Your White/Yellow Nexuses cannot be destroyed by opposing Spirit/Nexus/Magic effects.",
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
            "text": "Your White/Yellow Nexuses cannot be destroyed by opposing Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-067",
    "name": "Big Bang Energy",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, the cost of all \"Astral Dragon\" family Spirit cards in your Hand become the same number as your Life.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
            "text": "During this turn, the cost of all \"Astral Dragon\" family Spirit cards in your Hand become the same number as your Life."
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
    "cardNumber": "BS09-068",
    "name": "Land Mine",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy an opposing Spirit with [Awaken]/[Curse]/[High Speed]/[Brilliance]/[Crush]. If this Magic card was discarded from your deck by an opposing Spirit/Nexus/Magic effect, immediately activate this effect without paying the cost.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "AWAKEN",
            "maxCores": 2
          },
          {
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          },
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
    "cardNumber": "BS09-071",
    "name": "Immortal Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your Spirit with [Immortality] is summoned, draw two cards.\n\n[Flash]\nDuring this turn, give a Spirit +1000 BP.",
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
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-072",
    "name": "Shadow Blade",
    "cardType": "Magic",
    "effect": "[Flash]\nWhile you control both Red and Purple Spirits, destroy all exhausted opposing Spirits without [Tribute].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS09-073",
    "name": "On the Edge",
    "cardType": "Magic",
    "effect": "Flash- During this turn, when Spirits are comparing BP in battle, use their Level 2 BP to compare.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "BATTLE_RULE_MODIFIER",
            "text": "During this turn, when Spirits are comparing BP in battle, use their Level 2 BP to compare."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-074",
    "name": "Forest Charge",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this battle, when only the opposing Spirit is destroyed by your \"Blade Beast\"/\"Giant Beast\" family Spirit via BP comparison, refresh that Spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS09-079",
    "name": "Character Lost",
    "cardType": "Spirit",
    "effect": "[Main]\nDuring this turn, all opposing Spirits are treated as not having any family and can't gain new ones.\n\n[Flash]\nDuring this turn, give one Spirit +2000 BP.",
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
            "text": "During this turn, all opposing Spirits are treated as not having any family and can't gain new ones."
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
    "cardNumber": "BS09-080",
    "name": "Exhaust Nexus",
    "cardType": "Magic",
    "effect": "[Flash]\nFor each exhausted Nexus the opponent controls, destroy an opposing Spirit without [Tribute]. When this Magic card is discarded from your deck due to opposing Spirit/Nexus/Magic effects, immediately activate this effect, without paying the cost.",
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
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "When this Magic card is discarded from your deck due to opposing Spirit/Nexus/Magic effects, immediately activate this effect, without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-X35",
    "name": "The SupernovaDragon Siegwurm-Nova",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nWhen the [Tribute] was a \"Siegwurm\"-named Spirit, put cores from the Void to your Life until you have five Lives.\n\n[LV2][LV3] (When Attacks)\nDestroy any number of opposing Spirits up to a total of 10000 BP.\n\n[LV3] [Clash] (When Attacks)\nOpposing Spirits must block if possible.",
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
    "cardNumber": "BS09-X36",
    "name": "The SevenShogun Beldegaulle",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 4/5] (Either Attack Step)\nThis Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed.\n\n[LV1][LV2] (When Summoned)\nDestroy an opposing exhausted Cost 4 or less Spirit.",
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
            "op": "DESTROY_BY_COST",
            "maxCost": 4,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS09-X37",
    "name": "The DoomKnightLord Ragna-Rock",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all core from a Cost 6 or more Spirits you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nExhaust every opposing Spirit. If \"The IronKnight Yggdrasill\" was the [Tribute], also, put six cores from the Void to this Spirit.\n\n[LV3] (When Battles)\nRefresh three Cost 8 or less Spirits you control.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
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
    "cardNumber": "BS09-X38",
    "name": "The ImpregnableKnightLord Odin Type-X",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nIf the opponent has six or more cards in Hand, return three opposing Spirits without [Tribute] to the decktop in any order.\n\n[LV3] [Armor: Red/Purple/Green/White/Yellow/Blue]\nThis Spirit is unaffected by opposing Red/Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects.",
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
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "keyword": "Armor: Red/Purple/Green/White/Yellow/Blue"
      }
    ]
  },
  {
    "cardNumber": "BS09-X39",
    "name": "The MagicalEmpress Ambrocius",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen your Life is reduced by opposing Spirit, return a Yellow Magic card from your Trash to the Hand.\n\n[LV2][LV3]\nWhen you or the opponent uses a Magic card, this Spirit refreshes.\n\n[LV3] (Either Attack Step)\nYou can use Yellow Magic cards from your Hand/Removed Zone without paying the cost.",
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
            "rule": "CAST_MAGIC_FREE",
            "text": "You can use Yellow Magic cards from your Hand/Removed Zone without paying the cost."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "CYC-BROS3",
    "name": "The BlacksmithKing Cyc-Bros",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Crush (When Attacks) Discard a number of cards from the opposing decktop equal to this Spirit's LV.\n\n[LV1][LV2] (When Attacks) For each card discarded by this Spirit's Crush effect, put a core from the Void to this Spirit.",
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
            "count": 2
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
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  }
];

for (const spec of BS09_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
