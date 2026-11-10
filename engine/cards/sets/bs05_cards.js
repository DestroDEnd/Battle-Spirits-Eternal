/**
 * engine/cards/sets/bs05_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (BS05_SAGA_CARDS)
 * Total Cards: 78 (62 Effect, 16 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS05_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10282",
    "name": "The GiantMobile Ymir",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10321",
    "name": "The GodTree Dionaeus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] High Speed (Flash) This card may be summoned from your hand during the Flash Step. In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve.\n\n[LV2] (When Battles) Gain 1 core in your Reserve.",
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
    "cardNumber": "BATTLE-SPIRITS-A1039",
    "name": "Gastoras",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Send two cores each from two opposing Cost 1 or less Spirits to the Trash.",
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
    "cardNumber": "BATTLE-SPIRITS-A11436",
    "name": "The MischievousFairy Imp",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (Your Draw Step) If you control three or more \"Fairy\"/\"Imaginary Beast\" family Spirits, increase the number of cards you draw by +1.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "requireFamilyOnField": {
            "family": "Imaginary Beast",
            "min": 1
          }
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
    "cardNumber": "BATTLE-SPIRITS-A11479",
    "name": "The MorningFairy Napalco",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11902",
    "name": "The Remain of Scaffold",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During your Battle Phase) \"Evil Shadow\" spirits you control get +2000BP.\n\n[LV2] (Your Start Step) If you control an \"Evil Shadow\" spirit, exhaust target unexhausted spirit your opponent controls.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A12096",
    "name": "The Sapphire Empty Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step) Cost 0/2 Spirits can't attack/block.\n\n[LV2] (Either Attack Step) While you control any Spirit with Tribute, neither player can use Cost 4 or less Magic effects.",
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
            "text": "Cost 0/2 Spirits can't attack/block."
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
            "text": "While you control any Spirit with Tribute, neither player can use Cost 4 or less Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13007",
    "name": "The Thorny Colosseum",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) Cores cannot be moved from any battling spirits.\n\n[LV2] (During Your Battle Phase) Battling spirits are unaffected by the effects of spirits or spells either player controls.",
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
            "op": "PASSIVE_RULE",
            "rule": "IMMUNITY",
            "text": "Battling spirits are unaffected by the effects of spirits or spells either player controls."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A1338",
    "name": "The Artifact Embla",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13390",
    "name": "The UnicornDragon Volsung",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Destroyed) Your spirits with 2 or more gems get +5000BP until end of turn.\n\n[LV2][LV3] (When Attacks) This spirit gets +3000BP until end of turn.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 5000,
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
    "cardNumber": "BATTLE-SPIRITS-A1421",
    "name": "The GunKnight Heavybarrel",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A186",
    "name": "Arcanafighter-Quatre",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A188",
    "name": "Armetcrab",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Armor : Yellow - This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated color.",
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
            "text": "Armor : Yellow - This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated color."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A198",
    "name": "Chorus Birds",
    "cardType": "Magic",
    "effect": "Main - Move 3 \"Song Bird\" spirit cards from your Trash to your hand.\n\nFlash - Target spirit gets +2000BP until end of turn.",
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
    "cardNumber": "BATTLE-SPIRITS-A3101",
    "name": "Blindsnake",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3810",
    "name": "Dimetrodoron",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4207",
    "name": "Fallenpaladin",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4467",
    "name": "Gengoron",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6308",
    "name": "LittleKnight-Lancelot",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] While you control three or more Cost 2 Spirits, all your Yellow Spirits are unaffected by opposing Magic effects.\n\n[LV3] This Spirit is unaffected by the (When Summoned) effects of opposing Spirits.",
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
            "text": "While you control three or more Cost 2 Spirits, all your Yellow Spirits are unaffected by opposing Magic effects."
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            3
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "IMMUNITY",
            "text": "This Spirit is unaffected by the (When Summoned) effects of opposing Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6639",
    "name": "Mothleaf",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Battles) When only the opposing Spirit is destroyed by comparing BP, put a core from the Void to this Spirit.\n\n[LV2] (When Battles) When only the opposing Spirit is destroyed by comparing BP, exhaust an opposing Spirit.",
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6943",
    "name": "Nexus Blockade",
    "cardType": "Magic",
    "effect": "Main - If you control three or more \"Imaginary Beast\" family Spirits, during this turn, the effects of opposing Nexuses can't activate.\n\nFlash - During this turn, give a Spirit +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR",
          "requireFamilyOnField": {
            "family": "Imaginary Beast",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "NEGATE_EFFECT",
            "text": "If you control three or more \"Imaginary Beast\" family Spirits, during this turn, the effects of opposing Nexuses can't activate."
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
    "cardNumber": "BATTLE-SPIRITS-A7042",
    "name": "Pantomeister",
    "cardType": "Spirit",
    "effect": "[LV2] (Permanent) The cost of \"Ice Princess\" spirit cards in your hand are treated as 5.",
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
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "The cost of \"Ice Princess\" spirit cards in your hand are treated as 5."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7154",
    "name": "Pineappopotamus",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7230",
    "name": "Potential Power",
    "cardType": "Magic",
    "effect": "(Your Main Phase) Spirits you control with no printed effect text cannot be blocked by spirits with a cost equal to or less than those spirits' cost this turn.\n\n(Flash Step)(Your Main Phase) Target spirit gets +4000BP until end of turn.",
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
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
        },
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
    "cardNumber": "BATTLE-SPIRITS-A7371",
    "name": "Redcap",
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
    "cardNumber": "BATTLE-SPIRITS-A7594",
    "name": "Sandman",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7758",
    "name": "Shesas",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) You can summon a Cost 2 Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of the Spirit summoned by this effect can't activate.\n\n[LV2] When you are counting the number of Spirits with your Spirit/Magic effects, this Spirit is counted as two Spirits.",
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
            "text": "any (When Summoned) effects of the Spirit summoned by this effect can't activate."
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
            "text": "When you are counting the number of Spirits with your Spirit/Magic effects, this Spirit is counted as two Spirits."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8641",
    "name": "The BattleBeast Babeaver",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8856",
    "name": "The BombSoldier Dragno",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Destroy an opposing Spirit with one core on it.",
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
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9565",
    "name": "The DragonicFortress Megaron",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9639",
    "name": "The EvilAdmiral Negapluto",
    "cardType": "Spirit",
    "effect": "[LV1] (When Attacks) This Spirit can't be blocked by Green Spirits.\n\n[LV2] (When Attacks) This Spirit can't be blocked by White/Blue Spirits.\n\n[LV3] (When Attacks) This Spirit can't be blocked by Red/Yellow Spirits.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BATTLE-SPIRITS-A9811",
    "name": "The Eternal Glacier Palace",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Permanent) \"Ice Princess\" spirits you control get +1000BP.\n\n[LV2] (During the Battle Phase) Each time 1 or more \"Ice Princess\" spirits you control are destroyed, move target spirit your opponent controls to its owner's hand (The target's BP cannot exceed that of the destroyed spirits.)",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BRONZE-GOLEM2",
    "name": "Bronze-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Crush (When Attacks) Move cards from the top of your opponent's Deck to their Trash equal to this spirits LV.\n\n[LV1][LV2][LV3] (Permanent) Each time a nexus you control would be destroyed, you may move 1 core from this spirit to your Trash. In that case, the nexus remains on your Field instead.",
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
            "count": 2
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
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 1
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-004",
    "name": "The MysteriousFox Cubic",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nYou can summon a Purple Cost 5/6/7 Spirit card from your Trash, without paying the cost. However, any (When Summoned) effects of the Spirit can't activate.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-007",
    "name": "The ScarletDragonRider Rosso",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, treat all cores on this Spirit as being sent to the designated place.\n\n[LV2][LV3]\nGive this Spirit and every \"Dragon Emperor\"/\"Vanity Deity\" family Spirit you control the effect: \"(Your Attack Step) This Spirit gains +3000 BP.\"",
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
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "turn": "YOUR"
        },
        "targetFilter": {
          "family": "Vanity Deity"
        },
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BS05-016",
    "name": "The QueenVampire Carmilla",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy every exhausted Cost 1 or less Spirit.\n\n[LV2] (When Attacks)\nDestroy every exhausted Cost 3 or less Spirit.\n\n[LV3] (When Attacks)\nEach player chooses and destroys one Spirit they control.",
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
            "op": "DESTROY_EXHAUSTED",
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
            "op": "DESTROY_EXHAUSTED",
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
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-017",
    "name": "The PurpleDragonRider Violet",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, treat all cores on this Spirit as being sent to the designated place.\n\n[LV2][LV3]\nGive this Spirit and every \"Dragon Emperor\"/\"Vanity Deity\" family Spirit you control the effect: \"(When Attacks) Draw a card.\"",
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
    "cardNumber": "BS05-020",
    "name": "Polluc&Castar",
    "cardType": "Spirit",
    "effect": "[LV2] (When Battles)\nWhen only the opposing Spirit is destroyed, put a core from the Void to your Reserve.",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS05-022",
    "name": "The SeaHorse Kelpie",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh all you Blue Spirits with [Crush].",
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
    "cardNumber": "BS05-024",
    "name": "The Yojinbo Antman",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS05-026",
    "name": "The ViridianDragonRider Grun",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, treat all cores on this Spirit as being sent to the designated place.\n\n[LV2]\nGive this Spirit and every \"Dragon Emperor\"/\"Vanity Deity\" family Spirit you control the effect: \"(When Attacks) Put a number of cores from the Void, equal to the number of symbols on this Spirit, to your Reserve.\"",
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
    "cardNumber": "BS05-032",
    "name": "The CoralCrab Siomanekid",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Armor: Red/White]\nThis Spirit is unaffected by opposing Red/White Spirit/Nexus/Magic effects.\n\n[LV2]\nGive all your Green Spirits: [Armor: Red/White].",
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
        "keyword": "Armor: Red/White"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Armor: Red/White"
      }
    ]
  },
  {
    "cardNumber": "BS05-034",
    "name": "The WhiteDragonRider Albus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, treat all cores on this Spirit as being sent to the designated place.\n\n[LV2][LV3]\nThis Spirit and every \"Dragon Emperor\"/\"Vanity Deity\" family Spirit you control are unaffected by opposing Magic effects.",
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
            "op": "PASSIVE_RULE",
            "rule": "IMMUNITY",
            "text": "This Spirit and every \"Dragon Emperor\"/\"Vanity Deity\" family Spirit you control are unaffected by opposing Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-035",
    "name": "The EvilDeity Big-Loki",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks)\nThis Spirit gains +3000 BP.\n\n[LV3] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, except [The EvilDeity Big-Loki], refresh a Spirit with two symbols or more you control.",
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
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
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-040",
    "name": "The Princess-Snowwhite",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Turn)\nWhen the opponent uses any Spirit/Magic effect that includes your White \"Ice Princess\" family Spirits as targets, you can change the target of that Spirit/Magic effect to affect this Spirit only.\n\n[LV2][LV3] (When Destroyed)\nIf you control any [Dwarf-Seven], return this Spirit to the Hand.",
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
            "rule": "REDIRECT_TARGET",
            "text": "When the opponent uses any Spirit/Magic effect that includes your White \"Ice Princess\" family Spirits as targets, you can change the target of that Spirit/Magic effect to affect this Spirit only."
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
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-042",
    "name": "The GreatAngelia Sophia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon an \"Imaginary Beast\" family Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of the Spirit summoned by this effect can't activate.\n\n[LV2][LV3] [Brilliance] (When Attacks)\nAt the end of the battle, return every Magic card you used during this battle to your Hand.",
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
            "text": "any (When Summoned) effects of the Spirit summoned by this effect can't activate."
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-043",
    "name": "The YellowDragonRider Flavum",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, treat all cores on this Spirit as being sent to the designated place.\n\n[LV3]\nGive this Spirit and every \"Dragon Emperor\"/\"Vanity Deity\" family Spirit you control the effect: \"(Your End Step) This Spirit refreshes.\"",
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
        "overall": "END_STEP",
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
    "cardNumber": "BS05-045",
    "name": "Dwarf-Seven",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS05-048",
    "name": "The ChimeraDinosaur Dinozaur",
    "cardType": "Spirit",
    "effect": "[LV2]\nChange the [Awaken] effect of your Spirits to: \"[Awaken] During Flash Timing, you can send any number of cores from your Spirits or your Reserve to this Spirit.\"",
    "isVanilla": false,
    "abilities": [
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
    "cardNumber": "BS05-050",
    "name": "MCPanther",
    "cardType": "Spirit",
    "effect": "[LV1] (When Attacks)\nDestroy an opposing Cost 1 or less Spirit.\n\n[LV2] (When Attacks)\nDestroy every Cost 1 or less Spirit.",
    "isVanilla": false,
    "abilities": [
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
            "op": "DESTROY_BY_BP",
            "maxBp": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-051",
    "name": "The GiantKnight Aldous",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nAll your Nexuses can't be destroyed by opposing Spirit/Nexus/Magic effects.\n\n[LV2] (When Attacks)\nFor each Nexus you control, discard two cards from the opposing decktop. (Max. 6)",
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
            "text": "All your Nexuses can't be destroyed by opposing Spirit/Nexus/Magic effects."
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-052",
    "name": "Mithril-Golem",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS05-053",
    "name": "The BlueDragonRider Azure",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen this Spirit becomes the target of [Tribute], by exhausting this Spirit, treat all cores on this Spirit as being sent to the designated place.\n\n[LV2]\nGive this Spirit and every \"Dragon Emperor\"/\"Vanity Deity\" family Spirit you control the effect: \"(When Battles) Discard five cards from the opposing decktop.\"",
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
    "cardNumber": "BS05-054",
    "name": "The IronHammer Oswald",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nDestroy a Nexus you or the opponent controls.\n\n[LV2]\nWhen your Nexus or the opposing Nexus is destroyed via this Spirit's effect, the opponent chooses and discards a card from their Hand.",
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
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "When your Nexus or the opposing Nexus is destroyed via this Spirit's effect, the opponent chooses and discards a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-055",
    "name": "The Ruby Empty Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhile you control any \"Dragon Emperor\"/\"Dragon Knight\"/\"Vanity Deity\" family Spirit, every Spirit you control gains +2000 BP.\n\n[LV2]\nGive all your Spirits with [Tribute] the effect: \"[Awaken] You can send any number of cores from Spirits you control to this Spirit.\"",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "requireFamilyOnField": {
            "family": "Vanity Deity",
            "min": 1
          }
        },
        "targetFilter": {
          "family": "Vanity Deity"
        },
        "amount": 2000
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
    "cardNumber": "BS05-057",
    "name": "The Amethyst Empty Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen any Cost 1 or less Spirit is exhausted, send two cores from that Spirit to its owner's Trash.\n\n[LV2]\nGive all your Spirits with [Tribute] the effect: \"(When Attacks) Destroy an opposing exhausted Spirit.\"",
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
    "cardNumber": "BS05-059",
    "name": "The Emerald Empty Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nCost 0/3 Spirits can't attack/block.\n\n[LV2]\nGive all your Spirits with [Tribute] the effect: \"(When Attacks) Exhaust an opposing Spirit.\"",
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
            "text": "Cost 0/3 Spirits can't attack/block."
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-064",
    "name": "The Empire of Pentan",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Turn)\nWhen your Yellow Spirits are destroyed, you can summon a \"Pentan\"-named Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of that Spirit can't activate.\n\n[LV2] (Your Attack Step)\nWhen your attacking \"Pentan\"/\"Empereur\"-named Spirit is blocked by an opposing Spirit with the same LV, refresh the attacking Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-066",
    "name": "The Sacred Torch scorched the Sky",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen your Blue Spirit attacks, you can reveal a card from your decktop. If that card is a \"Giant\"-named Spirit card, add it to the Hand. If not, discard it.\n\n[LV2] (Your Attacks Step)\nWhen your \"Giant\"-named Spirit attacks, it can target and attack an opposing Cost 5 or more Spirit.",
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
            "text": "When your Blue Spirit attacks, you can reveal a card from your decktop."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "ADD_TO_HAND",
            "text": "If that card is a \"Giant\"-named Spirit card, add it to the Hand."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DECK_OR_HAND_ACTION",
            "text": "If not, discard it."
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
            "text": "When your \"Giant\"-named Spirit attacks, it can target and attack an opposing Cost 5 or more Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-067",
    "name": "Warning Attack",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your \"Winged Dragon\"/\"Flying Fang\" family Spirit attacks, the opponent must block with their 3000 BP or less Spirits if possible.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "text": "During this turn, when your \"Winged Dragon\"/\"Flying Fang\" family Spirit attacks, the opponent must block with their 3000 BP or less Spirits if possible."
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
    "cardNumber": "BS05-068",
    "name": "Synchronicity",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when your Spirit with [Awaken] attacks, it can target and attack an opposing 4000 BP or more Spirit.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
          "turn": "YOUR"
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
    "cardNumber": "BS05-069",
    "name": "Transmigration",
    "cardType": "Magic",
    "effect": "[Main]\nReveal three cards from your decktop. If there are any Spirit cards with [Tribute] among them, you can summon one of them without paying the cost, and treat as having activated [Tribute]. Discard any remaining cards. Return the Spirit summoned via this effect to your deckbottom at your End Step.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "text": "Reveal three cards from your decktop."
          },
          {
            "op": "REANIMATE_TRASH",
            "count": 1
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_REVEALED",
            "text": "Discard any remaining cards."
          },
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
    "cardNumber": "BS05-070",
    "name": "Soul Crash",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when \"SevenShogun\"-named Spirits are summoned to your Field, destroy all exhausted Spirits.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-071",
    "name": "Reanimate",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, when your Spirits with [Curse] are destroyed by opposing Spirits via BP comparison, they return to your Field, exhausted.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BS05-072",
    "name": "Absorb Symbol",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, when cores are placed, or removed from opposing Spirits via Spirit/Nexus/Magic effects, exhaust those Spirits.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-073",
    "name": "God Speed",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, the cost of every Cost 6 or more Spirit card with [High Speed] in your Hand becomes 4. This effect can't be used during Main Step.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "During this turn, the cost of every Cost 6 or more Spirit card with [High Speed] in your Hand becomes 4."
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
    "cardNumber": "BS05-075",
    "name": "Brave Charge",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, all the (When Attacks) effects of a Spirit you control activate as (When Blocks).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "During this turn, all the (When Attacks) effects of a Spirit you control activate as (When Blocks)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-076",
    "name": "Eternal Shield",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, only up to five cards can be discarded from your deck via opposing Spirit/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "LIMIT_DECK_DISCARD",
            "text": "During this turn, only up to five cards can be discarded from your deck via opposing Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-077",
    "name": "Crystal Aura",
    "cardType": "Magic",
    "effect": "[Main]\nPut a core from the Void each to every \"Ice Princess\" family Spirit you control.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
    "cardNumber": "BS05-078",
    "name": "Icicle Assault",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, all your Spirits with [Armor] gain +1000 BP for each color targeted by its [Armor].\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 1000,
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-079",
    "name": "Three Cards",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a Spirit. During this turn, when counting the targeted Spirit via your Spirit/Nexus effects, count it as three Spirits. You can't use this effect during Main Step.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_SELECT",
            "text": "Target a Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "During this turn, when counting the targeted Spirit via your Spirit/Nexus effects, count it as three Spirits."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "PLAY_CONDITION",
            "text": "You can't use this effect during Main Step."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-083",
    "name": "Magic Spanner",
    "cardType": "Magic",
    "effect": "[Flash]\nSend all cores from one of your \"Artificial Soldier\" family Spirits to the Void. Discard cards from the opposing decktop equal to the cost of that Spirit.",
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
            "op": "MILL_DECK",
            "side": "OPPONENT",
            "count": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS05-X17",
    "name": "The PhantomLord Rean",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nFor each Nexus the opponent controls, return an opposing Spirit to the Hand.\n\n[LV3] (When Attacks)\nWhile you control three or more Cost 2 Spirits, this Spirit can't be blocked by Spirits with printed effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void."
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
            "allMatching": false
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
    "cardNumber": "BS05-X18",
    "name": "The HugeBeastLord Behedoth",
    "cardType": "Spirit",
    "effect": "[Tribute: Cost 6 or more → Void]\nAfter paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nFor each different color of Magic cards in the opposing Trash, destroy an opposing Spirit.\n\n[LV3] (When Attacks/Blocks)\nDuring this battle, the opponent can't use Magic cards during Flash timing.",
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
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "During this battle, the opponent can't use Magic cards during Flash timing."
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "During this battle, the opponent can't use Magic cards during Flash timing."
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
    "cardNumber": "XEN-FU2",
    "name": "The SaberTiger Xen-Fu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Exhaust all unexhausted spirits with only 1 core on them except this spirit.\n\n[LV2] (When Attacks) This spirit gets +1000BP for each spirit you control with High Speed until end of turn.",
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
            "amount": 1000
          }
        ]
      }
    ]
  }
];

for (const spec of BS05_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
