/**
 * engine/cards/sets/sd06_sd11_heroes_promos_cards.js
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (SD06_SD11_HEROES_PROMOS_SAGA_CARDS)
 * Total Cards: 395 (386 Effect, 9 Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const SD06_SD11_HEROES_PROMOS_SAGA_CARDS = [
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
    "cardNumber": "BATTLE-SPIRITS-A10334",
    "name": "The GoldenEmperor Lord-Dragon-Inty",
    "cardType": "Spirit",
    "effect": "[Burst: After your Spirit is destroyed by the Opponent]\nIf this Burst activates when a 7000 BP or more Spirit is destroyed, summon this Spirit card. After this effect resolves, you can summon a \"Lord-Dragon\"-named Spirit card from your Hand/Trash.\n\n[LV2][LV3] (Your Attack Step)\nAll your \"Lord-Dragon\"-named Spirits gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "If this Burst activates when a 7000 BP or more Spirit is destroyed, summon this Spirit card."
          },
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
            2,
            3
          ]
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A10364",
    "name": "The GodStarEmperor Strike-Apollodragon",
    "cardType": "Spirit",
    "effect": "[When Braved] [LV1][LV2][LV3] (Opposing Attack Step)\nWhen braved to a Green/White/Yellow Brave, when an opposing Spirit attacks, this Spirit refreshes.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nWhen braved to a Red/Purple/Blue Brave, destroy an opposing 10000 BP or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A10991",
    "name": "The InfernoHero Dark-Dragon-Bazzel",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV2][LV3]\nYour Bursts with condition: [Burst Condition] (After an opposing Spirit/Brave's (When Summoned) effect resolves) can also be activated at the condition: [Burst Condition] (After your Spirit is destroyed by the opponent).\n\n[LV3] (After Your Burst Activates)\nDestroy an opposing Brave/Nexus.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
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
            "rule": "KEYWORD_RULE",
            "text": "Your Bursts with condition: [Burst Condition] (After an opposing Spirit/Brave's (When Summoned) effect resolves) can also be activated at the condition: [Burst Condition] (After your Spirit is destroyed by the opponent)."
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
            "op": "DESTROY_NEXUS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A11245",
    "name": "The Little Samurai Issun Antman",
    "cardType": "Spirit",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nBy returning a Spirit with [High Speed]/[Windstorm] you control to the Hand, summon this Spirit card.\n\n[LV2] (Opposing Attack Step)\nAt the start of the step, by exhausting this Spirit, exhaust an opposing Spirit.",
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
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "summon this Spirit card."
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
    "cardNumber": "BATTLE-SPIRITS-A11443",
    "name": "The MobileFortress Castle-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nFor each Nexus you control, discard five cards from the opposing decktop (Max 15).\n\n[LV2] (When Attacks)\nFor each Blue symbol you control, discard a card from the opposing decktop.",
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
    "cardNumber": "BATTLE-SPIRITS-A11505",
    "name": "The Negotiator Mix",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit is also treated as a Red/Purple Spirit.\n\n[LV1][LV2] (Your Attack Step)\nAll your \"Astral Deity\"/\"Galaxian\"/\"Astral Soul\" family Spirits gain +1000 BP.\n\n[LV2]\nWhen this Spirit or any [The Astronomer Lilia] you control are destroyed by the opponent, return them to your Hand.",
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
            "text": "This Spirit is also treated as a Red/Purple Spirit."
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
          "family": "Astral Soul"
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
    "cardNumber": "BATTLE-SPIRITS-A11700",
    "name": "The PhantomThief Vambbit",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 4] (Either Attack Step)\nYou can summon this Spirit card from the Trash when your Cost 4 Spirit is destroyed.\n\n[LV1][LV2]\nWhen an opposing Spirit effect discards 10 or more cards from your deck at once, send two opposing Lives to their Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 4"
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 1,
            "allMatching": true
          },
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
    "cardNumber": "BATTLE-SPIRITS-A11745",
    "name": "The PirateDeity Piscegalleon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBesides this Spirit, send a core each from every Spirit to its owner's Reserve. Draw a card for each Spirit depleted by this effect.\n\n[LV2] (When Destroyed)\nFor each \"Galaxian\"/\"Astral Soul\" family Spirit you control, both players discard a card from their Hand.",
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
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "For each \"Galaxian\"/\"Astral Soul\" family Spirit you control, both players discard a card from their Hand."
          }
        ]
      }
    ]
  },
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
    "cardNumber": "BATTLE-SPIRITS-A12587",
    "name": "The SongBirdHero Sieg-Yamato-Pentan",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your life is three or less, target an opposing 15000 BP or less Spirit. During this turn, that Spirit can't attack. After this effect resolves, summon this Spirit card.\n\n[LV2][LV3][LV4] (Your Attack Step)\nWhen your \"Pentan\"-named Spirit compares BP with an opposing LV2 or lower Spirit, instead of comparing BP, treat the attack as not blocked by opposing Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_CARD",
            "text": "If your life is three or less, target an opposing 15000 BP or less Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this turn, that Spirit can't attack."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "summon this Spirit card."
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            2,
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "When your \"Pentan\"-named Spirit compares BP with an opposing LV2 or lower Spirit, instead of comparing BP, treat the attack as not blocked by opposing Spirits."
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
    "cardNumber": "BATTLE-SPIRITS-A12884",
    "name": "The SuperStarDragon Yamatowurm-Nova",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nIf you have a Burst set, destroy an opposing 10000 BP or less Spirit.\n\n[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV3] (When Attacks)\nBy discarding one of your Bursts, destroy any number of opposing Spirits up to a total of 10000 BP.",
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
            "allMatching": false
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
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13128",
    "name": "The TimeControllerDragonDeity Amaterasu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy an opposing Spirit.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, at the end of your turn, refresh all your Red Spirits. Then, your Attack Step and End Step occur once more in order. This effect can only be used once per turn.",
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
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit."
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
            "scope": "ALL_MATCHING",
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13246",
    "name": "The TwinkleDragon Siegwurm-Altair",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, destroy an opposing Spirit with the same family as that Spirit.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "When only the opposing Spirit is destroyed by comparing BP, destroy an opposing Spirit with the same family as that Spirit."
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
    "cardNumber": "BATTLE-SPIRITS-A13471",
    "name": "The Wanderer Lolo",
    "cardType": "Spirit",
    "effect": "This card can't be summoned without paying the cost.\n\n[LV1][LV2]\nThis Spirit can't attack or brave, and is unaffected by any effects except its own.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "COST_MODIFIER",
            "text": "This card can't be summoned without paying the cost."
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
            "rule": "SET_RESTRICTION",
            "text": "This Spirit can't attack or brave, and is unaffected by any effects except its own."
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
    "cardNumber": "BATTLE-SPIRITS-A13644",
    "name": "The WolfMan Izowolf",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nYou can target a Spirit you control. Destroy an opposing Spirit with the same cost as that Spirit.\n\n[LV2]\nWhen your Nexuses are deployed, for each Nexus deployed, destroy an opposing Cost 3 or less Spirit.",
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
            "rule": "TARGET_CARD",
            "text": "You can target a Spirit you control."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit with the same cost as that Spirit."
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
    "cardNumber": "BATTLE-SPIRITS-A13907",
    "name": "Tsukushinmoa",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step. In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve.\n\n[LV1][LV2] (When Summoned) Your opponent discards 1 card.",
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
            "text": "Your opponent discards 1 card."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A14198",
    "name": "United Power",
    "cardType": "Magic",
    "effect": "(Flash Step)(Your Main Phase) Exhaust an unexhausted spirit you control. In that case, target spirit you control gets + X BP until end of turn where X is equal to the exhausted spirits BP.",
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
    "cardNumber": "BATTLE-SPIRITS-A14262",
    "name": "Victory Burst",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nDestroy two opposing 3000 BP or less Spirits. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy an opposing Nexus.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 3000,
            "count": 2,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "BATTLE-SPIRITS-A14501",
    "name": "Xain-Traill",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] Red/Blue (Opposing Turn)\nWhen the opponent uses a Red/Blue Magic effect, by exhausting this Spirit, negate that effect.\n\n[LV1][LV2] (Opposing Main Step)\nWhen the opposing Hand increases, for each card added, the opponent discards a card from their Hand.",
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
            "rule": "DISCARD_HAND",
            "text": "When the opposing Hand increases, for each card added, the opponent discards a card from their Hand."
          }
        ]
      }
    ]
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
    "cardNumber": "BATTLE-SPIRITS-A1628",
    "name": "The WhiteFlameFighter Iron-Rackle",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nWhile you have a Burst set, this non-Braved Spirit gains +4000 BP.\n\n[LV2] (Opposing Attack Step)\nWhen an opposing Cost 5 or less Spirit attacks, refresh this Spirit.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 4000,
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
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
    "cardNumber": "BATTLE-SPIRITS-A215",
    "name": "Gleam Hope",
    "cardType": "Magic",
    "effect": "Main - Target spirit you control gets Brilliance until end of turn.\n\n[Any LV] Brilliance (During Your Battle Phase) While this spirit is battling, each time you play a spell card, at End of Battle Step, move that spell card from your Trash to your hand.\n\nFlash - Target spirit gets +2000BP until end of turn.",
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
            "rule": "KEYWORD_RULE",
            "text": "Target spirit you control gets Brilliance until end of turn."
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
    "cardNumber": "BATTLE-SPIRITS-A2549",
    "name": "Ultimate Hero Impact",
    "cardType": "Brave",
    "effect": "[Main]\nDestroy an opposing \"Supreme Hero\" family Spirit. When this effect destroys any Spirit, draw a card.\n\n[Flash]\nDuring this turn, give a \"Supreme Hero\" family Spirit you control +5000 BP.",
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
            "amount": 5000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A2924",
    "name": "Berserker-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (After Your Burst Activates)\nDestroy an opposing 4000 BP or less Spirit. Or, destroy an opposing Nexus.\n\n[LV1][LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.\n\n[LV2][LV3] (When Attacks)\nWhile you have a Burst set, this non-braved Spirit gains +4000 BP.",
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
          },
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
            "op": "BP_BUFF_TARGET",
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3079",
    "name": "Ascension of Dragons (Card)",
    "cardType": "Magic",
    "effect": "Main- Draw 1 card from your deck.\n\nFlash- Destroy an opposing Cost 3 or less Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A3399",
    "name": "Chaotic-Rikugo",
    "cardType": "Brave",
    "effect": "[Brave Condition: A cost of 3 or more]\n\n☼<nowiki>[ </nowiki>Burst: After Your Life is Decreased<nowiki> ]</nowiki>\nSummon this Brave card.\n\n[When Braved] (When Battles) When the battle resolves, instead of the Spirit with the lower BP, the Spirit with the higher BP is destroyed. If both Spirits have the same BP, both Spirits are destroyed.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: A cost of 3 or more"
      },
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
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Brave card."
          }
        ]
      },
      {
        "overall": "WHEN_BATTLES",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "BATTLE_RULE_MODIFIER",
            "text": "When the battle resolves, instead of the Spirit with the lower BP, the Spirit with the higher BP is destroyed."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RULE",
            "text": "If both Spirits have the same BP, both Spirits are destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3497",
    "name": "Crush of Supernova",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy an opposing 10000 BP or less Spirit.\n\n[Flash]\nThe opponent exhausts three Spirits they control.",
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
            "maxBp": 10000,
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
            "op": "EXHAUST_SPIRITS",
            "count": 3,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A3622",
    "name": "Daioh-Hydra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nFor each \"Fusion Beast\"/\"Ocean Emperor\" family Spirit you control, destroy an opposing Cost 3 or less Spirit.\n\n[LV1][LV2]\nWhile you have a Burst set, treat the \"BP+ when braved\" of all opposing Brave Spirits as 0.",
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
            "rule": "KEYWORD_RULE",
            "text": "While you have a Burst set, treat the \"BP+ when braved\" of all opposing Brave Spirits as 0."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4968",
    "name": "Ice Lance",
    "cardType": "Magic",
    "effect": "[Burst: After your Spirit is destroyed by the opponent]\nReturn an opposing Spirit to the Hand. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nReturn an opposing Nexus to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BOUNCE_TO_HAND",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A5260",
    "name": "Kahyoen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts a Spirit they control.\n\n[LV2] (Your Attack Step)\nWhen the attack of your Spirits with 1 reduces the opposing Life, exhaust an opposing Spirit.",
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
    "cardNumber": "BATTLE-SPIRITS-A565",
    "name": "The BigDipperDragon Sieg-Apollodragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon a Brave card from your Hand, without paying the cost. When a Brave is summoned with this effect, draw a card.\n\n[When Braved] [LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, destroy an opposing Spirit.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "When only the opposing Spirit is destroyed by comparing BP, destroy an opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6169",
    "name": "Kowdeen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy an opposing exhausted Brave Spirit.\n\n[LV2][LV3] (After Your Burst Activates)\nSend one core each from every opposing Cost 4 or less Spirit to their Reserve.",
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
            "op": "DESTROY_BRAVE",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6251",
    "name": "Lou-Koutyu",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nPut a core from the Void to your Reserve.\n\n[LV2] (When Attacks)\nBy sending two cores from your Reserve to your Trash, the opponent can't activate their Bursts.",
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
        "subCost": {
          "type": "PAY_RESERVE_CORES",
          "count": 2
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "By sending two cores from your Reserve to your Trash"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "the opponent can't activate their Bursts."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A6504",
    "name": "Maximum Break",
    "cardType": "Magic",
    "effect": "(Your Main Phase) During this turn, effects of spirits you control that have a limit on the number of cards they can move from the top of the Deck to the Trash have their limit increased by 10.\n\n(Flash Step)(Your Main Phase) Target spirit gets +4000BP until end of turn.",
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
            "count": 2
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
    "cardNumber": "BATTLE-SPIRITS-A6513",
    "name": "Mikene",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed) Refresh target exhausted spirit you control.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put two cores from the Void to a Nexus you control."
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
    "cardNumber": "BATTLE-SPIRITS-A7839",
    "name": "Shovel-Golem",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (when Attacks)\nDiscard cards from the opposing decktop equal to this Spirit's level.\n\n[LV3] (Your Attack Step)\nWhen your Spirit's [Crush]/[Great Crush] discards a card with Burst effects, also, discard two cards from the opposing decktop.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8040",
    "name": "Sunk-Shine",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card. Then, during this turn, all your Spirits gain +3000 BP.\n\n[LV1][LV2][LV3] (When Blocks)\nPut a core from the Void to this Spirit.\n\n[LV2][LV3] (Opposing Attack Step)\nThis exhausted Spirit can block opposing Spirits with a cost equal or inferior to this Spirit's.",
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8069",
    "name": "Storm Strike",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nExhaust all opposing Spirits with one core on them. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nPut a core from the Void to any Spirit you control. Also, put a core from the Void to your [The WindHero Dorcus-Ushiwaka], or [Grant-Benkei].",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put a core from the Void to any Spirit you control."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "put a core from the Void to your [The WindHero Dorcus-Ushiwaka], or [Grant-Benkei]."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8073",
    "name": "Storm of Warriers",
    "cardType": "Magic",
    "effect": "[Main]\nReturn two opposing Spirits to the Hand.\n\n[Flash]\nDestroy all opposing Nexuses.",
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
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": true
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8193",
    "name": "Teleport Change",
    "cardType": "Magic",
    "effect": "Flash - Treat one of your battling Spirits as not battling, and target an exhausted Spirit you control to continue the battle.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "Treat one of your battling Spirits as not battling"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "CONTINUE_BATTLE",
            "text": "target an exhausted Spirit you control to continue the battle."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8291",
    "name": "The Ancient Arena",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (During Your Battle Phase) The effects of cards your opponent controls that increase the BP of 1 or more spirits are negated.\n\n[LV2] (During Opponent's Main Phase) (When Summoned) effects of spirits your opponent controls are negated when they are summoned.",
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
            "rule": "BP_BUFF",
            "text": "The effects of cards your opponent controls that increase the BP of 1 or more spirits are negated."
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
            "text": "(During Opponent's Main Phase) (When Summoned) effects of spirits your opponent controls are negated when they are summoned."
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
    "cardNumber": "BATTLE-SPIRITS-A8591",
    "name": "The Astronomer Lilia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit is also treated as a Green/White Spirit.\n\n[LV1][LV2]\nWhen the opposing Life is reduced, you can summon a \"Galaxian\" family Spirit card from your Hand, without paying the cost.\n\n[LV2]\nWhile you control [The Negotiator Mix], all your \"Galaxian\"/\"Astral Soul\" family Spirits are treated as being at their highest levels.",
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
            "text": "This Spirit is also treated as a Green/White Spirit."
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
          ],
          "requireFamilyOnField": {
            "family": "Astral Soul",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "While you control [The Negotiator Mix], all your \"Galaxian\"/\"Astral Soul\" family Spirits are treated as being at their highest levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8757",
    "name": "The BigBirdman Bearded",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Assault: 1] (When Attacks)\nThis Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.\n\n[LV2] (When Attacks)\nThe opponent can't use Magic cards with the same cost as your exhausted Nexuses.",
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
            "op": "PASSIVE_RULE",
            "rule": "SET_RESTRICTION",
            "text": "The opponent can't use Magic cards with the same cost as your exhausted Nexuses."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A8994",
    "name": "The CancerBushin Cancerd",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhen your \"Galaxian\"/\"Astral Soul\" family Spirit attacks, the opponent can only block if they block with two Spirits, or one Ultimate. When that Spirit you control is blocked, choose one of the two to battle against.\n\n[LV2] (When Attacks)\nWhile you control any Brave Spirit, when this Spirit's attack reduces the opposing Life, send an opposing Life to their Reserve.",
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
            "text": "When your \"Galaxian\"/\"Astral Soul\" family Spirit attacks, the opponent can only block if they block with two Spirits, or one Ultimate."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RULE",
            "text": "When that Spirit you control is blocked, choose one of the two to battle against."
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
    "cardNumber": "BATTLE-SPIRITS-A918",
    "name": "Salamantle",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Attacks) Draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9235",
    "name": "The DarkKnight Gareth",
    "cardType": "Spirit",
    "effect": "[Immortality: Cost 5/6] (Either Attack Step)\nWhen your Cost 5/6 Spirit is destroyed, you can summon this Spirit card from the Trash.\n\n[LV2][LV3] (Either Attack Step)\nWhen your Spirit is destroyed by the Opponent, send a core from your Trash to your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Immortality: Cost 5/6"
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
            "rule": "MOVE_CORE",
            "text": "When your Spirit is destroyed by the Opponent, send a core from your Trash to your Reserve."
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "When only the opposing Spirit is destroyed by comparing BP, destroy an opposing Spirit with one core on it."
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
    "cardNumber": "BS01-011",
    "name": "Dragsaurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy a Nexus.",
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
            "op": "DESTROY_NEXUS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-030",
    "name": "Grip-Hands",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw a card.",
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
      }
    ]
  },
  {
    "cardNumber": "BS01-034",
    "name": "Bi-Python",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nDraw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-036",
    "name": "Sha-Zoo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Destroyed)\nExhaust up to two Spirits.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-038",
    "name": "Skel-Viper",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw a card.",
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
      }
    ]
  },
  {
    "cardNumber": "BS01-056",
    "name": "Matchra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nThe opponent discards a card from their Hand.",
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
            "rule": "DISCARD_HAND",
            "text": "The opponent discards a card from their Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-059",
    "name": "Shidafukurou",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nWhen the opponent would draw cards from the deck, refresh this Spirit.",
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
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-099",
    "name": "The Canyon Where Sage lives",
    "cardType": "Nexus",
    "effect": "[LV1] (Your Draw Step)\nYou draw +1 card. After you draw, discard a card from your Hand.\n\n[LV2] (Your Draw Step)\nYou draw +1 card.",
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
    "cardNumber": "BS01-117",
    "name": "Double Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw two cards.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS01-125",
    "name": "Deadly Balance",
    "cardType": "Magic",
    "effect": "[Flash]\nBoth players destroy a Spirit they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Both players destroy a Spirit they control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-138",
    "name": "Hand Reverse",
    "cardType": "Magic",
    "effect": "[Main]\nDiscard your entire Hand. Then, draw a card for each card in the opposing Hand.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS01-141",
    "name": "Invisible Cloak",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a Spirit. During this turn, the targeted Spirit can't be blocked.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Send every core from your Trash to a Spirit you control."
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
    "cardNumber": "BS03-012",
    "name": "The GrandBishop Levia",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can destroy a Spirit with three cores or less on it.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed by comparing BP, return a Spirit card from your Trash to the Hand.",
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
            "rule": "DESTROY",
            "text": "You can destroy a Spirit with three cores or less on it."
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
    "cardNumber": "BS03-115",
    "name": "The Collapse of Battle Line",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nWhen discarding cards from the opposing deck via [Crush] effects, discard +2 cards.\n\n[LV2] (Your Attack Step)\nEvery Spirit with [Crush] you control is treated as being on its highest level.",
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
    "cardNumber": "BS03-129",
    "name": "Flock Recovery",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a family. Refresh three Spirits of the target family you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "TARGET_FAMILY",
            "text": "Target a family."
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
    "cardNumber": "BS03-148",
    "name": "Construction",
    "cardType": "Magic",
    "effect": "[Main]\nDeploy every Red/Green/Blue Nexus cards from your Trash, without paying the costs.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
    "cardNumber": "BS03-X10",
    "name": "The IceBeast Mam-Morl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nGive all your White Spirits the effect: \"(When Blocks) This Spirit gains +2000 BP.\"\n\n[LV2]\nGive all your Spirits the effect: \"[Armor: Red/Purple/Green] This Spirit is unaffected by opposing Red/Purple/Green Spirit/Nexus/Magic effects.\"\n\n[LV3]\nGive all your Spirits: [Armor: Red/Purple/Green/Yellow/Blue].",
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
            "op": "BP_BUFF_ALLIES",
            "amount": 2000,
            "filter": {
              "family": "(When Blocks) This Spirit gains +2000 BP.",
              "color": "White"
            }
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
        "keyword": "Armor: Red/Purple/Green"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            3
          ]
        },
        "keyword": "Armor: Red/Purple/Green/Yellow/Blue"
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
    "cardNumber": "BS04-021",
    "name": "The Vampire Dampeel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nSend one core each from every opposing Cost 4 or less Spirit to their Trash.\n\n[LV2][LV3] (When Attacks)\nThis Spirit gains +1000 BP for each core in the opposing Trash.\n\n[LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-022",
    "name": "The KingSnake Quetzalcoatl",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDraw two cards.\n\n[LV2][LV3] (When Attacks)\nBy discarding any number of cards from your Hand, send one core each from a number of opposing Spirits equal to the number of cards you discarded to their Trash.",
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
            "count": 2
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
            "text": "By discarding any number of cards from your Hand"
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
    "cardNumber": "BS04-043",
    "name": "The Valkyrie-Hildr",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThis Spirit is unaffected by opposing Spirit/Magic effects.\n\n[LV2]\nWhen your Life is reduced, refresh this Spirit.",
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
            "text": "This Spirit is unaffected by opposing Spirit/Magic effects."
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
    "cardNumber": "BS04-082",
    "name": "The Inviolable Sanctuary",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every Cost 8 or more Spirit you control: \"[Armor: Purple/Green/White/Yellow/Blue] This Spirit is unaffected by opposing Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects.\"\n\n[LV2]\nOnly up to five cards can be discarded from your deck per turn due to opposing Spirit/Nexus/Magic effects.",
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
        "keyword": "Armor: Purple/Green/White/Yellow/Blue"
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
            "rule": "LIMIT_DECK_DISCARD",
            "text": "Only up to five cards can be discarded from your deck per turn due to opposing Spirit/Nexus/Magic effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS04-094",
    "name": "Danse Macabre",
    "cardType": "Magic",
    "effect": "[Flash]\nDiscard any number of cards from your Hand. For each card discarded, send a core from a single opposing Spirit to the Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DISCARD_HAND",
            "text": "Discard any number of cards from your Hand."
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
    "cardNumber": "BS04-096",
    "name": "Inferno Eyes",
    "cardType": "Magic",
    "effect": "[Main]\nEach player sends four cores from their Spirits/Nexuses to the Void. This effect can't be used unless you control a Spirit with two or more symbols.\n\n[Flash]\nDuring this turn, give a Spirit with two or more symbols +5000 BP.",
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
            "text": "Each player sends four cores from their Spirits/Nexuses to the Void."
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
            "amount": 5000,
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
    "cardNumber": "BS05-024",
    "name": "The Yojinbo Antman",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Send all cores from one of your \"Artificial Soldier\" family Spirits to the Void."
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
    "cardNumber": "BS06-005",
    "name": "The DinosaurPrincess Jura",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nYour \"Terra Dragon\" family Spirits can't be returned to the Hand by opposing Spirit/Nexus/Magic effects.",
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
      }
    ]
  },
  {
    "cardNumber": "BS06-006",
    "name": "Sabecaulus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Flash - [Awaken]\nYou can send any number of cores from your Spirits to this Spirit.\n\n[LV2][LV3] (Your Attack Step)\nAll your Spirits with [Clash] gain +1000 BP",
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
            "amount": 1000,
            "filter": {}
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-015",
    "name": "Straysoul",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] [Curse] (When Attacks)\nDestroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
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
    "cardNumber": "BS06-022",
    "name": "The ChopSword Shadowslicer",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2] (When Attacks)\nReturn a \"Zombie\" family Spirit card from your Trash to the Hand.\n\n[LV2]\nFor each \"Zombie\" family Spirit you control, this Spirit gains +1000 BP.",
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
        "targetFilter": {
          "family": "Zombie"
        },
        "amount": 1000
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Send cores from every Spirit to its owner's Reserve until only one core remains on each of them."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-024",
    "name": "The HellKnight Andra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nDestroy an opposing Spirit with two cores or less on it.\n\n[LV2][LV3] (Your Attack Step)\nWhen Spirit with [Curse] you control attacks, send a core from any opposing Spirits to their Reserve.\n\n[LV3] (When Destroyed)\nFor each Spirit with [Curse] you control, send a core from any opposing Spirits to their Reserve.",
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
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit with two cores or less on it."
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
            3
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
    "cardNumber": "BS06-028",
    "name": "Gabunohashi",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts one Spirit they control.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put a core from the Void to any of your Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-034",
    "name": "The IronFist Cactusgaroo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nThe cost of all \"Vanity Deity\" family Spirit cards in your Hand becomes 6.\n\n[LV1][LV2]\nWhile your Life is at three or less, this Spirit gains +3000 BP.\n\n[LV2] (Your Attack Step)\nBesides [The IronFist Cactusgaroo], when the attack of your Spirit with [Windstorm] reduces the opposing Life, refresh this Spirit.",
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
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ]
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
            "scope": "SELF"
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
    "cardNumber": "BS06-054",
    "name": "The FortuneTeller Pentan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nBy putting a Magic card from your Hand face-up onto the Removed Zone, draw a card.",
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
    "cardNumber": "BS06-077",
    "name": "The Depths of the Nether World",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive every \"Infernal Lord\"/\"Zombie\" family Spirit you control: \"[Curse] (When Attacks) Destroy an opposing Spirit that blocked when the battle resolves at the end of battle.\"\n\n[LV2] (Your Attack Step)\nWhen your Spirit with [Curse] attacks, send a core from any opposing Spirit to their Reserve.",
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
    "cardNumber": "BS06-080",
    "name": "The Storm Highland",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen your Spirit with [Windstorm] is summoned, put a number of cores from the Void to the summoned Spirit equal to the number specified by that Spirit's [Windstorm].\n\n[LV2]\nWhen only the opposing Spirit is destroyed by comparing BP with your Spirit with [Windstorm], return every opposing Spirit exhausted by [Windstorm] to the deckbottom in any order.",
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
        "keyword": "Windstorm"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2
          ]
        },
        "keyword": "Windstorm"
      }
    ]
  },
  {
    "cardNumber": "BS06-081",
    "name": "The Fruit of Wise Tree",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen your Life is reduced by opposing Spirits, put a core from the Void to your Reserve.\n\n[LV2] (Your End Step)\nRefresh all your Spirits.",
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
    "cardNumber": "BS06-087",
    "name": "The Phantom Paradise",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Main Step)\nWhen any \"Imaginary Beast\" family Spirit is summoned, draw a card.\n\n[LV2] (Your Attack Step)\nWhile the opponent controls one color of symbols only, when your Yellow Spirits are destroyed by opposing Spirit via BP comparison, they remain on the Field, exhausted.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS06-089",
    "name": "The Battlefield enclosed by the Chains",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nNeither player can return cards from the Trash to their Hand.\n\n[LV2] (Opposing Main Step)\nThe opponent can't use Flash effects of Magic cards.",
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
            "rule": "MAGIC_RESTRICTION",
            "text": "The opponent can't use Flash effects of Magic cards."
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
    "cardNumber": "BS06-X22",
    "name": "The SevenShogun Beelzebeat",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon any number of Spirit cards with [Curse] from your Trash, up to a total cost of 13, without paying the costs.\n\n[LV2][LV3] (Your Attack Step)\nWhen the attack of your Spirit with [Curse] reduces the opposing Life, destroy an opposing Spirit.",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
          },
          {
            "op": "REANIMATE_TRASH",
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Curse"
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
    "cardNumber": "BS07-029",
    "name": "Kigna-Swan",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
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
    "cardNumber": "BS07-046",
    "name": "The PantherMan Berserkas",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
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
    "cardNumber": "BS08-020",
    "name": "Dio-Mantis",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Both players destroy a non-[Tribute] Spirit they control."
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put a core from the Void each to two White Spirits you control."
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
    "cardNumber": "BS09-056",
    "name": "The Star Creation Place",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nGive all your 8000 BP or more Spirits the effect: \"[Clash] (When Attacks) The opponent must block if possible.\"\n\n[LV2] (Either Attack Step)\nWhen only the opposing Spirit is destroyed by comparing BP with your \"Astral Dragon\" family Spirit, return a Spirit card from your Trash to the Hand.",
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirits you control to the Void."
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "If \"The IronKnight Yggdrasill\" was the [Tribute], also, put six cores from the Void to this Spirit."
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
    "cardNumber": "BS10-006",
    "name": "Yashium",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn a Spirit card/Brave card from your Trash to the Hand.",
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
            "op": "BOUNCE_TO_HAND",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-020",
    "name": "The WaterSnake Hydrogen",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nFor each \"Astral Soul\" family Spirit you control, send a core from any opposing Spirit to their Reserve.",
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
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-027",
    "name": "The Rookie Unpyoru",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks)\nAt the end of battle, you can separate the Brave from one of your Brave Spirits, and brave it to a Spirit you control.",
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
            "rule": "KEYWORD_RULE",
            "text": "At the end of battle, you can separate the Brave from one of your Brave Spirits, and brave it to a Spirit you control."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-029",
    "name": "The JupiterDragonDeity Nobunagard-Zeuses",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon any number of Brave cards from your Hand without paying the costs. However, any (When Summoned) effects of the Braves can't activate.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nFor each Brave Spirit you control, exhaust an opposing Spirit.",
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
            "text": "any (When Summoned) effects of the Braves can't activate."
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
    "cardNumber": "BS10-033",
    "name": "Northernbeard",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Blocks)\nPut a core from the Void to this Spirit.",
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
            "op": "CORE_FROM_VOID",
            "to": "SELF",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-036",
    "name": "The CrystalFish Crysteel",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS10-037",
    "name": "Emperordol",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nGive all your \"Machine Beast\" family Spirits: \"[Armor: Red/Blue] This Spirit is unaffected by opposing Red/Blue Spirit/Nexus/Magic effects.\"\n\n[LV2] (When Blocks)\nThis Spirit gains +5000 BP.",
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
        "keyword": "Armor: Red/Blue"
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
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-040",
    "name": "The CarrierWhale Hogale",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nThis Spirit gains +1000 BP for every \"Flying Fish\" family Spirit you control.\n\n[LV2][LV3] (Opposing Attack Step)\nAll your \"Flying Fish\" family Spirits gain +3000 BP.",
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
          "family": "Flying Fish"
        },
        "amount": 1000
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
          "family": "Flying Fish"
        },
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "BS10-049",
    "name": "The FairyPriest Andromeda",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nReturn a Magic card from your Trash to the Hand.\n\n[LV1][LV2][LV3]\nThis Spirit gains +1000 BP for each card in your Hand.",
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
            "count": 1
          }
        ]
      },
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
      }
    ]
  },
  {
    "cardNumber": "BS10-060",
    "name": "The GiantJaeger Orion",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDiscard 12 cards from the opposing decktop.",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-062",
    "name": "The GunDragon Phoenix-Cannon",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDestroy two opposing 4000 BP or less Spirits. Or, destroy an opposing 4000 BP or less Spirit and an opposing Nexus.\n\n[When Braved] [Clash] (When Attacks)\nThe opponent must block with their Spirits if possible. However, Ultimates don't have to block.",
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
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 2,
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
            "op": "GRANT_KEYWORD",
            "scope": "SELF",
            "keyword": "Clash"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-064",
    "name": "The SkullTank Geparberd",
    "cardType": "Brave",
    "effect": "[Brave Condition: No printed effects]\n\n[LV1] (When Summoned)\nDraw a card.\n\n[When Braved] (When Attacks)\nDestroy an opposing exhausted Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: No printed effects"
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
            "op": "DRAW_CARDS",
            "count": 1
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
            "op": "DESTROY_EXHAUSTED",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-066",
    "name": "The KnightSnake Pendragon",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nSend two cores from an opposing Spirit to their Reserve. When the number of cores on that Spirit is brought to 0 by this effect, draw a card.\n\n[When Braved] (When Attacks)\nSend a core from any opposing non-braved Spirit to their Reserve.",
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
            "op": "DRAW_CARDS",
            "count": 1
          },
          {
            "op": "CORE_DRAIN",
            "count": 2,
            "to": "RESERVE",
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
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-068",
    "name": "Beam-Beetle",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Brave Attacks)\nExhaust an opposing Spirit.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-069",
    "name": "The SwordBird Kacrane",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] 2 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts two Spirits they control.",
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
            "op": "EXHAUST_SPIRITS",
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-070",
    "name": "The ArmoredHorse Alfothr",
    "cardType": "Brave",
    "effect": "[Brave Condition: No printed effect]\n\n[LV1] (When Summoned)\nReturn an opposing Spirit to the Hand.\n\n[When Braved] (Opposing Attack Step)\nWhen an opposing non-braved Spirit attacks, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: No printed effect"
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
    "cardNumber": "BS10-072",
    "name": "Sabershark",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[LV1] (When Summoned)\nDuring this turn, all the (When Blocks) effects of your Spirits now activate as (When Attacks).\n\n[When Braved] (When Blocks)\nWhen only the opposing Spirit is destroyed by comparing BP, send an opposing Life to their Reserve.",
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
            "op": "PASSIVE_RULE",
            "rule": "CONTINUOUS_RULE",
            "text": "During this turn, all the (When Blocks) effects of your Spirits now activate as (When Attacks)."
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
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
    "cardNumber": "BS10-078",
    "name": "The SacredArmoredBeast Ammead",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] (Your Attack Step)\nTreat this Spirit as being on its highest Level.",
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
            "text": "Treat this Spirit as being on its highest Level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-079",
    "name": "The Table Mountain Range",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Turn)\nAll your Spirits gain +1000 BP.\n\n[LV2]\nAll your Brave Spirits can't be returned to the Hand from Field by opposing Spirit/Brave/Nexus/Magic effects.",
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
    "cardNumber": "BS10-082",
    "name": "The Sextant Observatory",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your End Step)\nReturn a Spirit card with no printed effects from your Trash to the Hand.\n\n[LV2]\nWhen your \"Evil Shadow\" family Spirit is summoned, send cores from an opposing Spirit to the Reserve until one core remains on it.",
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
            "count": 2,
            "to": "RESERVE",
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-093",
    "name": "The Ticking Flower Clock",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Yellow Spirit is destroyed by opposing Spirit effects, during this turn, your Life can't be reduced.\n\n[LV2] (Your Attack Step)\nYour Brave Spirits can't be blocked by opposing Cost 5 or less Spirits.",
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
            "text": "When your Yellow Spirit is destroyed by opposing Spirit effects, during this turn, your Life can't be reduced."
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
    "cardNumber": "BS10-094",
    "name": "The Unfinished Ancient Battleship:Keel",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nYour Spirits with no printed effects can block opposing Cost 4 or less Spirits while exhausted.\n\n[LV2]\nTreat all your Spirits with no printed effects as being one Level higher.",
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
            "rule": "TREAT_RULE",
            "text": "Treat all your Spirits with no printed effects as being one Level higher."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-098",
    "name": "Revive Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw two cards. Or, return one Spirit card from your Trash to Hand.\n\n[Flash]\nDuring this turn, give a Spirit +2000 BP.",
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
    "cardNumber": "BS10-104",
    "name": "Triangle Trap",
    "cardType": "Magic",
    "effect": "[Flash]\nExhaust an opposing Spirit. Or, exhaust three opposing Cost 4 or less Spirits.",
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
    "cardNumber": "BS10-105",
    "name": "Life Charge",
    "cardType": "Magic",
    "effect": "[Flash]\nBy destroying a Cost 3 or more Spirit you control, put three cores from the Void to your Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "RESERVE",
            "count": 3
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-113",
    "name": "Orion Power",
    "cardType": "Magic",
    "effect": "[Main]\nDuring this turn, when the attack of your \"Fighting Spirit\"/\"Astral Soul\" family Spirit reduces the opposing Life, discard ten cards from the opposing decktop.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS10-114",
    "name": "Eridanus Flood",
    "cardType": "Magic",
    "effect": "[Main]\nDestroy an opposing Brave Spirit.\n\n[Flash]\nDuring this turn, give a Spirit +4000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {
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
    "cardNumber": "BS10-X01",
    "name": "The PhantomStarDragon Gai-Asura",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3][LV4]\nNeither player can remove cores from this Spirit.\n\n[LV1][LV2][LV3][LV4] Flash - [Ultra Awaken]\nYou can put any number of cores from your Spirits to this Spirit. When any core is put via this effect, refresh this Spirit.\n\n[LV4] (When Attacks)\nDuring this battle, cores of all opposing destroyed Spirits are sent to the Void, not the Reserve.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2,
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Neither player can remove cores from this Spirit."
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
            1,
            2,
            3,
            4
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
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            4
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
    "cardNumber": "BS10-X06",
    "name": "The ScorpioKnight Scor-Spear",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nAll your Spirit-condition Braves are treated as Spirit-condition Braves with \"Cost 5/Galaxian\" & \"Fusion Beast\" families/Level 1: 1 core, 7000 BP.\"\n\n[LV2][LV3]\nGive all your \"Galaxian\"/\"Astral Soul\" family Spirits the effect: \"(When Attacks) Destroy an opposing non-braved Spirit with a cost equal or inferior to this Spirit's.\"",
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
            "text": "All your Spirit-condition Braves are treated as Spirit-condition Braves with \"Cost 5/Galaxian\" & \"Fusion Beast\" families/Level 1: 1 core, 7000 BP.\""
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
            "text": "Give all your \"Galaxian\"/\"Astral Soul\" family Spirits the effect: \"(When Attacks) Destroy an opposing non-braved Spirit with a cost equal or inferior to this Spirit's.\""
          }
        ]
      }
    ]
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
  },
  {
    "cardNumber": "BS12-005",
    "name": "The StarHornBeast Unigaunt",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhen your Spirit is destroyed by the opponent, you can summon a Brave card from your Hand in Spirit-condition, without paying the cost.\n\n[LV2][LV3]\nWhen a Brave is summoned via this Spirit's effect, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-007",
    "name": "The FlameDragonDeity Mars-Dragoon",
    "cardType": "Spirit",
    "effect": "[Tribute: Astral Soul → Void]\nAfter paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void.\n\n[LV1][LV2][LV3] (When Summoned)\nDestroy two opposing Spirits with one symbol.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nDestroy an opposing Spirit with two symbols.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ACTION",
            "text": "After paying for the summoning cost, you must send all cores from an \"Astral Soul\" family Spirit you control to the Void."
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
            "rule": "DESTROY",
            "text": "Destroy two opposing Spirits with one symbol."
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
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit with two symbols."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-012",
    "name": "The ChariotEmperor Dirgan",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Opposing Attack Step)\nAt the start of the step, by sending any number of cores from this Spirit to your Trash, for each core sent, send a core from an opposing Brave Spirit with two symbols to their Trash.\n\n[LV2][LV3]\nThis Spirit can't be exhausted by opposing Spirit/Brave/Nexus/Magic effects.",
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
    "cardNumber": "BS12-016",
    "name": "The CorpseGiant Gi-Gasha",
    "cardType": "Spirit",
    "effect": "While there are five or more \"Zombie\" family Spirit cards in your Trash, this Spirit card in your Hand becomes Cost 3.\n\n[LV1][LV2] (When Summoned)\nReturn any number of \"Zombie\" family Spirit cards, up to a total cost of 13, from your Trash to the Hand.\n\n[LV2] (When Destroyed)\nExhaust every opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SET_HAND_COST",
            "text": "While there are five or more \"Zombie\" family Spirit cards in your Trash, this Spirit card in your Hand becomes Cost 3."
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
        "overall": "WHEN_DESTROYED",
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
    "cardNumber": "BS12-020",
    "name": "The Spearhead Siberza",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nNeither player's life can be reduced by the attacks of Brave Spirits with two symbols.\n\n[LV2] (When Attacks)\nIf this is the first attack of your turn, this Spirit refreshes.",
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
            "text": "Neither player's life can be reduced by the attacks of Brave Spirits with two symbols."
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
    "cardNumber": "BS12-028",
    "name": "Sailfish",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] [Heavy Armor: White]\nThis Spirit is unaffected by opposing White Spirit/Brave/Nexus/Magic effects.\n\n[LV2] (Opposing Main Step)\nAll your White Spirits are unaffected by opposing Brave effects.",
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
        "keyword": "Heavy Armor: White"
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
            "text": "All your White Spirits are unaffected by opposing Brave effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-033",
    "name": "Kogumaru",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS12-036",
    "name": "The StarDog Pomeran",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks)\nFor each symbol on the opposing battling Brave Spirit, this Spirit gains +3000 BP.",
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
      }
    ]
  },
  {
    "cardNumber": "BS12-043",
    "name": "The Hunter Condrad",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAt the start of the step, by exhausting this Spirit, during this turn, your Life can't be reduced by the attacks of Brave Spirits with two symbols.\n\n[LV2] (Opposing Main Step)\nThe (When Summoned) effects of all Cost 3 or less Spirits can't activate.",
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
            "rule": "COST_MODIFIER",
            "text": "The (When Summoned) effects of all Cost 3 or less Spirits can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-045",
    "name": "The BlackBeastKing Cepheus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2]\nTreat all your \"Beast Head\" family Spirits as Spirits with no printed effect.\n\n[LV2] (Your Attack Step)\nAll your Spirits with no printed effects are treated as being at their highest levels.",
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
            "text": "Treat all your \"Beast Head\" family Spirits as Spirits with no printed effect."
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
            "text": "All your Spirits with no printed effects are treated as being at their highest levels."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-050",
    "name": "The ChargingMachineDragon Archaelancer",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nDraw a card, and destroy an opposing Nexus.\n\n[When Braved] Flash -\nBy exhausting a Spirit you control, during this turn, this Spirit gains +3000 BP.",
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
            "op": "DRAW_CARDS",
            "count": 1
          },
          {
            "op": "DESTROY_NEXUS",
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-053",
    "name": "Oodsutsunanafushi",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 3 or more]\n\n[LV1] (When Summoned)\nYou can discard your entire Hand (at least one card). When you've done so, draw cards from your deck equal to the number of cards in the opposing Hand.\n\n[During Brave]\nWhen the opponent draws, refresh this Spirit.",
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
            "rule": "DISCARD_HAND",
            "text": "You can discard your entire Hand (at least one card)."
          },
          {
            "op": "DRAW_CARDS",
            "count": 1
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
    "cardNumber": "BS12-054",
    "name": "Manekicat",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/ Galaxian / Astral Soul]\n\n[LV1] (When Summoned)\nYou can summon a Green/White Spirit card from your Hand, without paying the cost. However, any (When Summoned) effects of the Spirit can't activate.\n\n[When Braved] (When Battles)\nThe opponent exhausts a Spirit they control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/ Galaxian / Astral Soul"
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
        "overall": "WHEN_BATTLES",
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
    "cardNumber": "BS12-057",
    "name": "Hydrandea",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 2 or more]\n\n[LV1] (When Summoned)\nSummon three Cost 2 Spirit cards from your Trash, without paying the cost.\n\n[When Braved]\nWhen the number of cores on this Spirit is brought to zero by an opposing Spirit/Brave/Magic effect, this Spirit is treated as being destroyed at its highest level.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 2 or more"
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
            "op": "REANIMATE_TRASH",
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
            "rule": "KEYWORD_RULE",
            "text": "When the number of cores on this Spirit is brought to zero by an opposing Spirit/Brave/Magic effect, this Spirit is treated as being destroyed at its highest level."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-058",
    "name": "The DivineBird Thunder-Bird",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/Galaxian/Astral Soul]\n\n[LV1] (When Summoned)\nReturn a Magic card from your Trash to the Hand.\n\n[When Braved] (When This Spirit Brave Attacks)\nWhen you use a Magic card, after the effect resolves, during this battle, the LV1/LV2/LV3 BP of the blocking opposing Spirits is treated as 2000.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/Galaxian/Astral Soul"
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
            "op": "SALVAGE_TRASH",
            "count": 1
          }
        ]
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
            "text": "(When This Spirit Brave Attacks)"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TRIGGERED_WATCHER",
            "text": "When you use a Magic card"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "BP_BUFF",
            "text": "during this battle, the LV1/LV2/LV3 BP of the blocking opposing Spirits is treated as 2000."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-060",
    "name": "Vulcan-Arms",
    "cardType": "Brave",
    "effect": "[Brave Condition: Astral Deity/Galaxian/Astral Soul]\n\n[LV1] (When Summoned)\nDraw three cards. Then, discard two cards from your Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Astral Deity/Galaxian/Astral Soul"
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
            "op": "DRAW_CARDS",
            "count": 3,
            "thenDiscard": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-061",
    "name": "The Birthplace of the Sword",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you would [Tribute], by exhausting this Nexus, treat all the cores on a Cost 3 \"Astral Soul\" family Spirit you control are sent to the specified area.\n\n[LV2] (Your Main Step)\nWhen Braves are summoned, you draw a card.",
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
    "cardNumber": "BS12-064",
    "name": "The House of the Idol",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you would [Tribute], by exhausting this Nexus, treat all the cores on a Cost 3 \"Astral Soul\" family Spirit you control are sent to the specified area.\n\n[LV2]\nWhen your Spirit is exhausted by an opposing Spirit/Brave/Magic effect, for each Spirit exhausted, exhaust an opposing Spirit.",
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
    "cardNumber": "BS12-067",
    "name": "The Moonlight Gathering Tower",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nYour Hand is unaffected by opposing Spirit/Brave/Magic effects.\n\n[LV2]\nAll your Spirits with [Armor] are unaffected by opposing Brave effects of the same colors as their [Armor].",
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
            "text": "Your Hand is unaffected by opposing Spirit/Brave/Magic effects."
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
        "keyword": "Armor"
      }
    ]
  },
  {
    "cardNumber": "BS12-069",
    "name": "The Ruler Mountains",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen the number of cores on your Spirits become zero due to opposing Spirit/Brave/Magic effect, that Spirit is treated as being destroyed at its highest level.\n\n[LV2] (Opposing Attack Step)\nYour Lives can't be reduced by the attacks of opposing Spirits with two symbols.",
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
            "text": "When the number of cores on your Spirits become zero due to opposing Spirit/Brave/Magic effect, that Spirit is treated as being destroyed at its highest level."
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
    "cardNumber": "BS12-071",
    "name": "The Unfinished Ancient Battleship:Sail",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nSpirits with no printed effects you control are unaffected by opposing Magic effects.\n\n[LV2] (Opposing Main Step)\nThe opponent can only summon one Spirit card with printed effects from their Hand per turn.",
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
            "text": "Spirits with no printed effects you control are unaffected by opposing Magic effects."
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
    "cardNumber": "BS12-075",
    "name": "Bootes Call",
    "cardType": "Magic",
    "effect": "[Flash]\nBy using the cores on your Reserve to pay for the summoning cost and put on the Spirit for the summon, summon a Spirit card with [Immortality] from your Trash.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
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
    "cardNumber": "BS12-078",
    "name": "Cassiopeia Seal",
    "cardType": "Magic",
    "effect": "This Magic card in Trash is unaffected by any effect.\n\n[Main]\nExhaust an opposing Spirit. Until (Your End Step) occurs five times, that Spirit can't refresh. After this effect resolves, put five cores from the Void beside your deck, and send one core to the Void on each of (Your End Step). Besides via this effect, these cores can't be used.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-080",
    "name": "Vacuum Symbol",
    "cardType": "Magic",
    "effect": "[Flash]\nTarget a color. During this turn, every opposing Spirit loses a symbol of the targeted color. This effect can't be used during (Your Turn).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
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
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "This effect can't be used during (Your Turn)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-081",
    "name": "Melodious Harp",
    "cardType": "Magic",
    "effect": "[Flash]\nDuring this turn, a Spirit loses all its effects, and can't gain any new ones. That Spirit is treated as having no printed effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "LOSE_EFFECTS",
            "text": "During this turn, a Spirit loses all its effects, and can't gain any new ones."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "TREAT_RULE",
            "text": "That Spirit is treated as having no printed effects."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-084",
    "name": "Mercury Goblet",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy a Spirit with the lowest cost on the opposing Field.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy a Spirit with the lowest cost on the opposing Field."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-X01",
    "name": "The BullDragonDeity Dragonic-Taurus",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Clash] (When Attacks)\nOpposing Spirits must block if possible.\n\n[LV2][LV3] (When Attacks)\nWhen blocked, compare the symbols of the blocking opposing Spirit to this Spirit's, and for each symbol more on this Spirit, send an opposing Life to their Reserve.\n\n[LV3] (When Attacks)\nWhen comparing symbols with this Spirit's effect, this Spirit gains an extra Red symbol for each \"Astral Deity\"/\"Galaxian\" family Spirit you control.",
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
    "cardNumber": "BS12-X02",
    "name": "The EvilCapricornusDeity Stein-Bolg",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each \"Galaxian\"/\"Astral Soul\" family Spirit you control, return a Purple card from your Trash to the Hand.\n\n[LV1][LV2][LV3] (Your Attack Step)\nWhen your \"Galaxian\"/\"Astral Soul\" family Spirit attacks, send a core from any opposing Spirit to the Reserve.\n\n[LV2][LV3]\nCores to be sent to the opposing Reserve via Spirit/Brave/Magic effects are sent to the Trash instead.",
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
            "rule": "KEYWORD_RULE",
            "text": "Cores to be sent to the opposing Reserve via Spirit/Brave/Magic effects are sent to the Trash instead."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS12-X05",
    "name": "The ValkyrieVirgoDeity Vielje",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nIf your Life is five or less, put a core from the Void to your Life.\n\n[LV1][LV2][LV3] (Opposing Attack Step)\nOpposing Cost 2/3/5/7/11 Spirits can't attack.\n\n[LV2][LV3]\nWhen your \"Galaxian\"/\"Divine Spirit\" family Spirits are destroyed by the opponent, return them to the Hand.",
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
            "to": "LIFE",
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
            "rule": "COST_MODIFIER",
            "text": "Opposing Cost 2/3/5/7/11 Spirits can't attack."
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
            "op": "PASSIVE_RULE",
            "rule": "MOVE_CORE",
            "text": "Put a core from the Void to any of your Spirits."
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy every Red/Green/Blue Spirit refreshed by Spirit/Magic effects."
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
    "cardNumber": "CIMA-CREEK",
    "name": "The SeaDragon Cima-Creek",
    "cardType": "Spirit",
    "effect": "☼<nowiki>[ </nowiki>Burst: After your opponent activates a Spirit/Brave's (When Summoned) effect<nowiki> ]</nowiki>\nSummon this Spirit card.\n\n[LV1][LV2] This Spirit and Cost 2 or less Spirits cannot attack.\n\n[LV1][LV2][LV3] (Opposing Turn) Each opposing Spirit can only reduce your Life by one each turn.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "☼<nowiki>[ </nowiki>Burst: After your opponent activates a Spirit/Brave's (When Summoned) effect<nowiki> ]</nowiki>"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
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
            "rule": "SET_RESTRICTION",
            "text": "This Spirit and Cost 2 or less Spirits cannot attack."
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
            "op": "DAMAGE_WALL",
            "maxLifeLoss": 1,
            "preventAllLifeLoss": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "EX13-01",
    "name": "The CrossStarDragon Southern-Cross-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nAll your \"Astral Dragon\"/\"Astral Soul\" family Spirits gain +2000 BP.\n\n[LV2][LV3] (When Attacks)\nDestroy an opposing 4000 BP or less Spirit.",
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
          "family": "Astral Soul"
        },
        "amount": 2000
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
            "maxBp": 4000,
            "count": 1,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "EX13-02",
    "name": "The EvilArtifactMaster Caelum",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nSend cores from an opposing Cost 5 or less Spirit to their Reserve until only one core remains.\n\n[LV2][LV3] (When Destroyed)\nDestroy an opposing Spirit with two or less cores on it.",
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
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy an opposing Spirit with two or less cores on it."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "EX13-03",
    "name": "Compass-Mingo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts a Spirit they control.\n\n[LV2]\nWhen your \"Winged Beast\"/\"Astral Soul\" family Spirits are destroyed by the opponent, put a core from the Void to your Reserve.",
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
    "cardNumber": "EX13-04",
    "name": "The SatelliteRobo Telescord",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Either Attack Step)\nFor both players, Spirits with two or more symbols can only attack once per turn.\n\n[LV2][LV3] (Opposing Attack Step)\nAll your Spirits with one symbol gain +2000 BP.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ],
          "oncePerTurn": "opt_1"
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
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2,
            3
          ]
        },
        "amount": 2000
      }
    ]
  },
  {
    "cardNumber": "EX13-05",
    "name": "The Angelia Coma",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nTarget an opposing Spirit. During this battle, that Spirit can't block.\n\n[LV2][LV3] [Holy Life] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.",
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
            "rule": "TARGET",
            "text": "Target an opposing Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "COMBAT_RESTRICTION",
            "text": "During this battle, that Spirit can't block."
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
    "cardNumber": "EX13-06",
    "name": "The GiantCentaurus Troydes",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards from the opposing decktop equal to this Spirit's level.\n\n[LV1][LV2][LV3] (When Attacks)\nFor each level this Spirit has, destroy an opposing Cost 3 or less Spirit.",
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
    "cardNumber": "IZAKUCHI-WURM001",
    "name": "Ikazuchi-Wurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Destroy an opposing Brave/Nexus.\n\n[LV1][LV2] (When Attacks) If you have a set burst, you can target and attack an opposing Spirit.\n\n[LV2] (When Attacks) For each \"Dragon Warrior\" family Spirit you control, this Spirit gains +3000 BP.",
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
            "op": "PASSIVE_RULE",
            "rule": "TARGET_ATTACK",
            "text": "If you have a set burst, you can target and attack an opposing Spirit."
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
            "amount": 3000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Dragon Warrior"
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KA12-01",
    "name": "Kaneid-Ace",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] 1 (When Attacks)\nWhen this Spirit is blocked, the opponent exhausts a Spirit they control.\n\n[LV2]\nGive all your \"Gaudy Trooper\" family Spirits: 1.",
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
            "text": "Give all your \"Gaudy Trooper\" family Spirits: 1."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KF-01",
    "name": "Colonel-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nThis Spirit gains +3000 BP.\n\n[LV2][LV3] [Clash] (When Attacks)\nThe opponent must block if possible.",
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
            "amount": 3000
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
    "cardNumber": "KF-02",
    "name": "King-Colonel",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] For each \"Colonel\"/\"Kenta\"-named Spirit you control, this Spirit gains +1000 BP.",
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
      }
    ]
  },
  {
    "cardNumber": "KF-03",
    "name": "Colonel-Golem",
    "cardType": "Spirit",
    "effect": "[LV2] (When Attacks)\nDestroy an opposing Cost 4 or less Spirit.",
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
    "cardNumber": "KF-04",
    "name": "ChickenFilletSandKnight",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nSend a core from any opposing Spirits to their Reserve.",
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
    "cardNumber": "KF-05",
    "name": "Coles-Tortoise",
    "cardType": "Spirit",
    "effect": "[LV2] (When Blocks) This Spirit gains +3000 BP.",
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
    "cardNumber": "KF-06",
    "name": "Fried-Phoenix",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Attacks) When only the opposing Spirit is destroyed by comparing BP, refresh this Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KF-07",
    "name": "The Fried Chicken Palace",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nAll \"Colonel\"/\"Kenta\"-named Spirit you control gain +2000 BP.\n\n[LV2] (Opposing Main Step)\nThe (When Summoned) effects of all opposing Spirits can't activate.",
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
            "text": "The (When Summoned) effects of all opposing Spirits can't activate."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KF-08",
    "name": "Mach-Twister",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[When Braved] (When Blocks) Return an opposing 4000 BP or less Spirit to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: Cost 4 or more"
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
    "cardNumber": "KF-09",
    "name": "Piyocuit",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (When Destroyed) Refresh a Spirit you control.",
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
    "cardNumber": "KF-10",
    "name": "Musha Musha-Chickencutletsanders",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned) Put a core from the Void to your Reserve.",
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
    "cardNumber": "KF-11",
    "name": "Crispy-Cobra",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw a card.",
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
      }
    ]
  },
  {
    "cardNumber": "KF-12",
    "name": "Potato Arrow",
    "cardType": "Magic",
    "effect": "Main- Destroy all 4000 BP or less Spirits.\n\nFlash- During this turn, target Spirit gets +4000 BP.",
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
            "maxBp": 4000,
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
            "amount": 4000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KF-13",
    "name": "The ChickenHero Sieg-Kenta-Fried",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nIf your Life is at three or less, destroy an opposing 10000 BP or less Spirit. After this effect resolves, summon this Spirit card.\n\n[LV2][LV3][LV4] (When Attacks)\nIf you control any \"Colonel\"-named Spirit, destroy an opposing Spirit with a BP equal or inferior to this Spirit's.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 10000,
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
            3,
            4
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "If you control any \"Colonel\"-named Spirit, destroy an opposing Spirit with a BP equal or inferior to this Spirit's."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "KF-14",
    "name": "The FryingHero Kenta-Dragon-Bazzel",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV2][LV3] (When Attacks)\nIf you control any \"Colonel\"-named Spirit, this Spirit gains +5000 BP.\n\n[LV3] (After your Burst activates)\nRefresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
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
            "amount": 5000
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
    "cardNumber": "KF-15",
    "name": "The ParttimePrincess Kentuckyster",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn a \"Colonel\"-named Spirit card from your Trash to the Hand.\n\n[LV2] (When Attacks)\nThis Spirit can't be blocked by opposing LV1 Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "PB12-04",
    "name": "The FurikakeHero White Rice",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nDestroy an opposing (1000x the number of Spirits you control) BP or less Spirit. After this effect resolves, summon this Spirit card.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "DESTROY",
            "text": "Destroy an opposing (1000x the number of Spirits you control) BP or less Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "summon this Spirit card."
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
    "cardNumber": "SD01-026",
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
    "cardNumber": "SD06-001",
    "name": "Ohdoran",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "SD06-003",
    "name": "One-Kengo",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nWhile you have a set Burst, treat this Spirit as LV3.\n\n[LV2][LV3] [Clash] (When Attacks)\nThe opponent must block with their Spirits if possible. However, Ultimates don't have to block.",
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
            "text": "While you have a set Burst, treat this Spirit as LV3."
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
    "cardNumber": "SD06-004",
    "name": "Dos-Monkey",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nWhile you have a set Burst, all your non-braved Spirits gain +3000 BP.",
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
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "SD06-007",
    "name": "The HeroDragon Lord-Dragon",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV1][LV2][LV3] (After Your Burst Activates)\nIf the card activated was Cost 5 or less, destroy an opposing 9000 BP or less Spirit.\n\n[LV2][LV3] (When Battles)\nAt the end of battle, by discarding one of your Bursts, refresh this Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
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
            "op": "DESTROY_BY_BP",
            "maxBp": 9000,
            "count": 1,
            "allMatching": false
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD06-009",
    "name": "Kiji-Toria",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Turn)\nWhile you have a set Burst, all your non-braved Spirits gain +2000 BP.\n\n[LV2] (Opposing Start Step)\nIf you don't have a set Burst, you can set a card with Burst effect from your Hand.",
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
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "If you don't have a set Burst, you can set a card with Burst effect from your Hand."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD06-011",
    "name": "The HeroEmperor DeitySword",
    "cardType": "Nexus",
    "effect": "[LV1][LV2]\nWhen you set Burst, draw a card. This effect can only be used once per turn.\n\n[LV2] (Your Attack Step)\nEach non-braved \"Supreme Hero\" family Spirit you control gains +3000 BP. Also, while you have a Burst set, each non-braved \"Supreme Hero\" family Spirit you control gains +5000 BP.",
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
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            2
          ],
          "requireFamilyOnField": {
            "family": "Supreme Hero",
            "min": 1
          }
        },
        "targetFilter": {
          "family": "Supreme Hero"
        },
        "amount": 3000
      }
    ]
  },
  {
    "cardNumber": "SD06-012",
    "name": "The HeroEmperor DeityShield",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Either Attack Step)\nAt the beginning of the step, target an opposing Brave Spirit. During this turn, that Brave Spirit can't battle.\n\n[LV2]\nWhile you have a set Burst, all your \"HeroEmperor\"-named Nexuses can't be destroyed.",
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
            "text": "At the beginning of the step, target an opposing Brave Spirit."
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "During this turn, that Brave Spirit can't battle."
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
            "text": "While you have a set Burst, all your \"HeroEmperor\"-named Nexuses can't be destroyed."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD06-013",
    "name": "Burst Draw",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDraw two cards. Then by paying the cost, activate this card's Main effect.\n\n[Main]\nDraw two cards.",
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
      }
    ]
  },
  {
    "cardNumber": "SD06-014",
    "name": "Burst Cross",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDestroy an opposing 6000 BP or less Spirit, a Brave on an opposing Brave Spirit, and an opposing Nexus. Then, by paying the cost, activate this card's Main effect.\n\n[Main]\nReturn a card with Burst effect from your Trash to the Hand.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
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
      }
    ]
  },
  {
    "cardNumber": "SD06-015",
    "name": "Burst Flame",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nDestroy three opposing 4000 BP or less Spirits. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nDestroy an opposing Brave Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 4000,
            "count": 3,
            "allMatching": false
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
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
    "cardNumber": "SD06-016",
    "name": "Burst Wall",
    "cardType": "Magic",
    "effect": "[Burst: After your Life is reduced]\nPut a core from the Void to your Life. Then by paying the cost, activate this card's Flash effect.\n\n[Flash]\nWhen this battle ends, end the Attack Step.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
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
            "op": "END_ATTACK_STEP",
            "timing": "END_OF_BATTLE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD06-017",
    "name": "Burst Storm",
    "cardType": "Magic",
    "effect": "[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nReturn an opposing Spirit/Brave/Nexus to the deckbottom. Then, by paying the cost, activate this card's Flash effect.\n\n[Flash]\nRefresh a Spirit you control.",
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
    "cardNumber": "SD10-005",
    "name": "Bronze-Wurm",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] Charge- Increase the limit of your \"BP destruction effects\" by +1000.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-008",
    "name": "Dragon-Annura",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your Spirits with [Charge] gain +2000 BP.\n\n[LV2] [Charge]\nIncrease the limit of your \"BP Destruction effects\" by +1000.",
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
          "keyword": "Charge"
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
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-009",
    "name": "Sunpillar-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn an \"Astral Dragon\" family Spirit card/Brave card from your Trash to the Hand.\n\n[LV2] [Charge]\nIncrease the limit of your non-Ultimate \"BP Destruction effects\" by +1000.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-010",
    "name": "The StormDragon Supercell-Dragoon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nDestroy two opposing 4000 BP or less Spirits.\n\n[LV2][LV3] (When Attacks)\nFor each Spirit with [Charge] you control, this Spirit gains +2000 BP.\n\n[LV3] (When Attacks)\nYou can target and attack an opposing Spirit.",
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
            "maxBp": 4000,
            "count": 2,
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
            "op": "BP_BUFF_SELF",
            "amount": 2000
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
            "rule": "TARGET_ATTACK",
            "text": "You can target and attack an opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-011",
    "name": "Dustwhirl",
    "cardType": "Brave",
    "effect": "[Brave Condition: {{tk]\n\n[LV1] (When Summoned)\nDestroy an opposing Nexus.\n\n[When Braved] (When Brave Attacks)\nDestroy an opposing 3000 BP or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Brave Condition: {{tk"
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
        "overall": "ATTACK_STEP",
        "subConditions": {},
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
    "cardNumber": "SD10-012",
    "name": "The Magma Spouting Star City",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Your Attack Step)\nAll your \"Astral Dragon\" family Spirits gain +2000 BP.\n\n[LV2] (Either Attack Step)\nWhen opposing Spirits are destroyed by your Spirit effects, draw a card.",
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
            "op": "DRAW_CARDS",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-013",
    "name": "The Dragon Shuttle to the Heavens",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nWhen your Life is reduced by the attacks of opposing Spirits, destroy an opposing 5000 BP or less Spirit that attacked.\n\n[LV2] (Your Attack Step)\nWhen your Spirits with [Charge] destroys any opposing Spirits, destroy an opposing Nexus.",
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
    "cardNumber": "SD10-014",
    "name": "Twin Flame",
    "cardType": "Magic",
    "effect": "[Flash]\nDestroy two opposing 2000 BP or less Spirits.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DESTROY_BY_BP",
            "maxBp": 2000,
            "count": 2,
            "allMatching": false
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-015",
    "name": "Fire Wall",
    "cardType": "Magic",
    "effect": "[Flash]\nBy destroying a Red Spirit you control, when this battle ends, end the Attack Step. This effect can only be used during (Opposing Attack Step).",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "END_ATTACK_STEP",
            "timing": "END_OF_BATTLE"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-016",
    "name": "Charge Draw",
    "cardType": "Magic",
    "effect": "[Main]\nDraw two cards. Then, reveal two cards from your decktop, and add every Spirit card/Brave card with [Charge] among them to the Hand. Return any remaining cards to your decktop in any order.\n\n[Flash]\nDuring this turn, give a Spirit +3000 BP.",
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
            "amount": 3000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-X01",
    "name": "The ShineDragon Shining-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nYou can summon a Red Brave card from your Hand, without paying the cost.\n\n[LV2][LV3] (When Attacks)\nDestroy an opposing 5000 BP or less Spirit.\n\n[LV3] [Charge]\nIncrease the limit of your \"BP Destruction effects\" by +1000.",
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
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD10-X02",
    "name": "The ShiningSacredSword Shining-Sword",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[LV1] (When Summoned)\nDestroy every opposing 3000 BP or less Spirit, and for each Spirit destroyed, draw a card.\n\n[LV1] [Charge]\nIncrease the limit of your non-Ultimate \"BP Destruction effects\" by +1000.\n\n[When Braved] [Charge]\nIncrease the limit of your non-Ultimate \"BP Destruction effects\" by +1000.",
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
        "overall": "ATTACK_STEP",
        "subConditions": {
          "levels": [
            1
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_TARGET",
            "amount": 1000,
            "count": 1
          }
        ]
      },
      {
        "overall": "ATTACK_STEP",
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
    "cardNumber": "SD11-005",
    "name": "Dark-Gadphant",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nReturn an opposing 2000 BP or less Spirit to the Hand.\n[Rush: Green]\n(While you have a Green symbol, the following effect activates next)\n[Green Core]: Put a core from the Void to this Spirit.\n\n[LV2] [Heavy Armor: Red/Blue]\nThis Spirit is unaffected by opposing Red/Blue Spirit/Brave/Nexus/Magic effects.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR",
          "requireSymbols": {
            "color": "Green",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "CORE_FROM_VOID",
            "to": "SELF",
            "count": 1
          },
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
            2
          ]
        },
        "keyword": "Heavy Armor: Red/Blue"
      }
    ]
  },
  {
    "cardNumber": "SD11-007",
    "name": "Bear Polar",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nThe opponent must attack at least once if possible.\n\n[LV2] (When Blocks)\nThis Spirit gets +3000 BP.\n[Rush: Green]\n(While you have a Green symbol, the following effect activates next)\n[Green Core]: Exhaust an opposing Spirit.",
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
            "rule": "FORCE_ATTACK",
            "text": "The opponent must attack at least once if possible."
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            2
          ],
          "turn": "OPPONENT",
          "requireSymbols": {
            "color": "Green",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
          },
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD11-008",
    "name": "Wise-Monkey",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (Your Attack Step)\nThe (When Blocks) effects of all your \"Machine Beast\" family Spirits actviate at (When Attacks).",
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
            "text": "The (When Blocks) effects of all your \"Machine Beast\" family Spirits actviate at (When Attacks)."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD11-009",
    "name": "The HuntingMachineBeast Silver-Jackal",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks)\nWhen only the opposing Spirit is destroyed by comparing BP, send a core from the opposing Life to their Reserve.\n[Rush: Green]\n(While you have a Green symbol, the following effect activates next)\n[Green Core]: The opponent can't activate their Burst.",
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
          "turn": "OPPONENT",
          "requireSymbols": {
            "color": "Green",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "CORE_DRAIN",
            "count": 1,
            "to": "RESERVE"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ABILITY",
            "text": "[Rush: Green]"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_ABILITY",
            "text": "(While you have a Green symbol, the following effect activates next)"
          },
          {
            "op": "PASSIVE_RULE",
            "rule": "KEYWORD_RULE",
            "text": "The opponent can't activate their Burst."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD11-010",
    "name": "Dark-Uranus",
    "cardType": "Spirit",
    "effect": "[LV2][LV3]\nThis Spirit is also treated as a Green Spirit.\n\n[When Braved] [LV2][LV3] (When Brave Attacks)\nBy exhausting an opposing 7000 BP or more Spirit, refresh this Spirit.\n[Rush: Green]\n(While you have a Green symbol, the following effect activates next)\n[Green Core]: Put a core from the Void to any of your Spirits.",
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
            "text": "This Spirit is also treated as a Green Spirit."
          }
        ]
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {
          "levels": [
            2,
            3
          ],
          "requireSymbols": {
            "color": "Green",
            "min": 1
          }
        },
        "keyword": "Rush: Green"
      }
    ]
  },
  {
    "cardNumber": "SD11-011",
    "name": "Jet-Gannet",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 4 or more]\n\n[LV1] (When Summoned)\nReturn an opposing Nexus to the Hand.\n\n[When Braved] (Opposing Attack Step)\nWhen an opposing 4000 BP or more Spirit attacks, refresh this Spirit.",
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
    "cardNumber": "SD11-012",
    "name": "The Underground Lake of the Ice Sword",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (Opposing Attack Step)\nAll your \"Machine Beast\" family Spirits gain +2000 BP.\n\n[LV2] (Opposing Attack Step)\nWhen your \"Machine Beast\" family Spirit blocks, put a core from the Void to that Spirit.",
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
          "family": "Machine Beast"
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
            "rule": "MOVE_CORE",
            "text": "When your \"Machine Beast\" family Spirit blocks, put a core from the Void to that Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SD11-013",
    "name": "The Lost Crystal",
    "cardType": "Nexus",
    "effect": "[LV1][LV2] (When Destroyed)\nYou can summon a White Spirit card from your Hand, without paying the cost.\n\n[LV2]\nGive all your \"Machine Beast\" family Spirits: \"[Heavy Armor: Red] This Spirit is unaffected by opposing Red Spirit/Brave/Nexus/Magic effects.\"",
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
            "op": "REANIMATE_TRASH",
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
        "keyword": "Heavy Armor: Red"
      }
    ]
  },
  {
    "cardNumber": "SD11-014",
    "name": "Wind Wall",
    "cardType": "Magic",
    "effect": "[Flash]\nWhen this battle ends, end the Attack Step.\n[Rush: Green]\n(While you have a Green symbol, the following effect activates next)\n[Green Core]: Exhaust an opposing Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "requireSymbols": {
            "color": "Green",
            "min": 1
          }
        },
        "subEffects": [
          {
            "op": "EXHAUST_SPIRITS",
            "count": 1,
            "allMatching": false
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
    "cardNumber": "SD11-015",
    "name": "Dream Horizon",
    "cardType": "Magic",
    "effect": "[Flash]\nReturn an opposing Spirit to the Hand.\n[Rush: Green]\n(While you have a Green symbol, the following effect activates next)\n[Green Core]: Refresh a White Spirit you control.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {
          "requireSymbols": {
            "color": "Green",
            "min": 1
          }
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
    "cardNumber": "SD11-016",
    "name": "Burst Break",
    "cardType": "Magic",
    "effect": "[Flash]\nReturn any number of opposing Spirits up to a total of 5000 BP to the Hand. Or, discard an opposing Burst. This effect can't be used during Main Step.",
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
    "cardNumber": "SD11-X01",
    "name": "The DarkEmperor Ninetail-Dark",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Blocks)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh this Spirit, and during this turn, this Spirit gains +3000 BP.\n\n[LV3] (When Battles)\nReturn an opposing Cost 6 or less Spirit to the Hand.\n[Rush: Green]\n(While you have a Green symbol, the following effect activates next)\n[Green Core]: Exhaust an opposing Spirit.",
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
            "op": "REFRESH_SPIRITS",
            "scope": "SELF"
          },
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
            3
          ],
          "requireSymbols": {
            "color": "Green",
            "min": 1
          }
        },
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
    "cardNumber": "SD11-X02",
    "name": "The MidnightSunTreasuredSword Midnight-Sun",
    "cardType": "Brave",
    "effect": "[Brave Condition: Cost 5 or more]\n\n[When Braved] [Heavy Armor: Green/White/Yellow/Blue]\nThis Spirit is unaffected by opposing Green/White/Yellow/Blue Spirit/Brave/Nexus/Magic effects.\n\n[When Braved]\nThis Spirit's [Rush] effects activate, ignoring the conditions.",
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
        "keyword": "Heavy Armor: Green/White/Yellow/Blue"
      },
      {
        "overall": "AURA_KEYWORDS",
        "subConditions": {},
        "keyword": "Rush"
      }
    ]
  },
  {
    "cardNumber": "SJ12-01",
    "name": "The StrongestDeity White-Odin",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3]\nGive all your \"Strongest\"-named Spirits: \"[Heavy Armor: Red/Purple] This Spirit is unaffected by opposing Red/Purple Spirit/Brave/Nexus/Magic effects.\"",
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
        "keyword": "Heavy Armor: Red/Purple"
      }
    ]
  },
  {
    "cardNumber": "SJ12-02",
    "name": "The StrongestHero Lord-Dragon-Red",
    "cardType": "Spirit",
    "effect": "[Burst: After your Life is reduced]\nSummon this Spirit card.\n\n[LV1][LV2][LV3] (When Attacks)\nFor each \"Strongest\"-named Spirit you control, this Spirit gains +1000 BP.\n\n[LV2][LV3] (When Attacks)\nFor each \"Strongest\"-named Spirit you control, destroy an opposing 5000 BP or less Spirit.",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "BURST",
        "subConditions": {},
        "subEffects": [
          {
            "op": "PASSIVE_RULE",
            "rule": "SUMMON_THIS_CARD",
            "text": "Summon this Spirit card."
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
            "op": "BP_BUFF_SELF",
            "amount": 1000,
            "scaleBy": {
              "type": "FAMILY",
              "family": "Strongest"
            }
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
    "cardNumber": "SJ12-03",
    "name": "The StrongestShogun Death-Violet",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Summoned)\nFor each \"Strongest\"-named Spirit you control, send a core from any opposing Spirits to their Reserve.\n\n[LV2][LV3] (When Attacks)\nSend a core from any opposing Spirit to their Reserve.\n\n[LV3] (When Attacks)\nTreat this Spirit as colorless.",
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
            "rule": "TREAT_RULE",
            "text": "Treat this Spirit as colorless."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SJ12-05",
    "name": "The StrongestAngelia Yellow-Mikafar",
    "cardType": "Spirit",
    "effect": "[LV2][LV3] (Your Attack Step)\nYour \"Strongest\"-named Spirits can't be blocked by opposing LV1 Spirits.",
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
            "op": "GRANT_UNBLOCKABLE",
            "scope": "SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SJ12-06",
    "name": "The StrongestGiant Titus-the-Blue",
    "cardType": "Spirit",
    "effect": "[LV1][LV2] (When Summoned)\nDraw two cards. Then, discard two cards from your Hand.\n\n[LV2] (When Attacks)\nFor each \"Strongest\"-named Spirit you control, discard two cards from the opposing decktop. (Max. 12)",
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
            "count": 2,
            "thenDiscard": 2
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
    "cardNumber": "SJ12-07",
    "name": "The StrongestBeast Viridian-Pumaru",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (Your Attack Step)\nAll your \"Strongest\"-named Spirits gain +2000 BP.\n\n[LV2][LV3] (When Battles)\nWhen only the opposing Spirit is destroyed by comparing BP, refresh a \"Strongest\"-named Spirit you control.",
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
        "amount": 2000
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
            "op": "REFRESH_SPIRITS",
            "scope": "TARGET",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "SJ12-08",
    "name": "The StrongestDragonKing Siegfiredragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks)\nDraw a card.\n\n[LV2][LV3] (Your Attack Step)\nWhen your \"Strongest\"-named Spirits attack, you can target and attack an opposing Spirit.",
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
            "op": "DRAW_CARDS",
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
            "text": "When your \"Strongest\"-named Spirits attack, you can target and attack an opposing Spirit."
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "TWINBLADE-DRAGON",
    "name": "TwinBlade-Dragon",
    "cardType": "Spirit",
    "effect": "[LV1][LV2][LV3] (When Attacks) Draw a card. If you have a Burst set, also, destroy an opposing 4000 BP or less Spirit.\n\n[LV2][LV3] Flash- (Your Attack Step) By discarding one of your Bursts, during this turn, give one of your Spirits +5000 BP.",
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
      },
      {
        "overall": "FLASH",
        "subConditions": {
          "levels": [
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
      }
    ]
  }
];

for (const spec of SD06_SD11_HEROES_PROMOS_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
