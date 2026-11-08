/**
 * compiler/overrides/SD41.js
 * 
 * Explicit deterministic IR definitions for SD41 cards.
 */

export const SD41_OVERRIDES = {
  "SD41-X01": {
    "cardNumber": "SD41-X01",
    "name": "The MakaiPhantomDragon Siegfried-Necro",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Cost 6 or more",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      },
      {
        "name": "Twinkle Necromancy",
        "parameter": null,
        "wave": 4,
        "hook": "twinkle_necromancy",
        "bracketed": true,
        "index": 166
      }
    ],
    "abilities": [
      {
        "id": "SD41-X01#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step)",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Advent: Cost 6 or more",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By sending your [Soul Core] to the Trash, stack this from your Hand onto your target Spirit."
        },
        "clauses": [
          {
            "rawText": "By sending your [Soul Core] to the Trash",
            "cleanText": "By sending your [Soul Core] to the Trash",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "isSoulCore": true,
              "from": {
                "zone": "field_or_reserve",
                "side": "self"
              },
              "to": {
                "zone": "trash",
                "side": "self"
              }
            }
          },
          {
            "rawText": "stack this from your Hand onto your target Spirit.",
            "cleanText": "stack this from your Hand onto your target Spirit",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADVENT_STACK",
              "from": "HAND",
              "target": {
                "side": "self",
                "types": [
                  "Spirit"
                ]
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD41-X01#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ADVENTS",
          "timingLabel": "When Advents",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Twinkle Necromancy",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "You can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost.",
            "cleanText": "You can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD41-X01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Your Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your \"Ancient Dragon\"/\"Astral Dragon\"/\"Ogre Wizard\" family Spirit attacks, the opponent can't block unless they destroy one of their Spirits."
        },
        "clauses": [
          {
            "rawText": "When your \"Ancient Dragon\"/\"Astral Dragon\"/\"Ogre Wizard\" family Spirit attacks, the opponent can't block unless they destroy one of their Spirits.",
            "cleanText": "When your \"Ancient Dragon\"/\"Astral Dragon\"/\"Ogre Wizard\" family Spirit attacks, the opponent can't block unless they destroy one of their Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "either"
              },
              "isCost": false
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-005": {
    "cardNumber": "SD41-005",
    "name": "Jadgas",
    "keywords": [
      {
        "name": "Accel",
        "parameter": "Cost 4 ([Purple Core",
        "wave": 2,
        "hook": "accel",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD41-005#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "FLASH",
          "timingLabel": "Flash",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Purple Core",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "Send a core from any opposing Spirits to their Reserve. Then, by paying one cost, send two cores from an opposing Spirit to their Reserve. After this effect resolves, put this card face-up onto the Removed Zone."
        },
        "clauses": [
          {
            "rawText": "Send a core from any opposing Spirits to their Reserve.",
            "cleanText": "Send a core from any opposing Spirits to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "field",
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              },
              "to": {
                "zone": "reserve",
                "side": "opp"
              },
              "chooser": "self"
            }
          },
          {
            "rawText": "by paying one cost, send two cores from an opposing Spirit to their Reserve.",
            "cleanText": "by paying one cost, send two cores from an opposing Spirit to their Reserve",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
            }
          },
          {
            "rawText": "put this card face-up onto the Removed Zone.",
            "cleanText": "put this card face-up onto the Removed Zone",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "OPEN_ZONE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD41-005#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Draw a card."
        },
        "clauses": [
          {
            "rawText": "Draw a card.",
            "cleanText": "Draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": null
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-003": {
    "cardNumber": "SD41-003",
    "name": "Smog Hand",
    "keywords": [
      {
        "name": "Accel",
        "parameter": "Cost 3 ([Purple Core",
        "wave": 2,
        "hook": "accel",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD41-003#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "FLASH",
          "timingLabel": "Flash",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Purple Core",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "Summon a Cost 1 or less Purple Spirit card from your Trash, without paying the cost. After this effect resolves, put this card face-up onto the Removed Zone."
        },
        "clauses": [
          {
            "rawText": "Summon a Cost 1 or less Purple Spirit card from your Trash, without paying the cost.",
            "cleanText": "Summon a Cost 1 or less Purple Spirit card from your Trash, without paying the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
            }
          },
          {
            "rawText": "put this card face-up onto the Removed Zone.",
            "cleanText": "put this card face-up onto the Removed Zone",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "OPEN_ZONE"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-002": {
    "cardNumber": "SD41-002",
    "name": "The MakaiFogDragon Mistwurm",
    "keywords": [],
    "abilities": [
      {
        "id": "SD41-002#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": "ONCE_PER_TURN_SAME_NAME",
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By discarding two cards from your Hand, summon this card from your Hand/Trash, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "By discarding two cards from your Hand",
            "cleanText": "By discarding two cards from your Hand",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_HAND",
              "count": 2,
              "upTo": false,
              "filter": null,
              "chooser": "self"
            }
          },
          {
            "rawText": "summon this card from your Hand/Trash, without paying the cost.",
            "cleanText": "summon this card from your Hand/Trash, without paying the cost",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_THIS_CARD",
              "from": "HAND_OR_BURST"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-006": {
    "cardNumber": "SD41-006",
    "name": "The MakaiDragonOgre Darkwurm",
    "keywords": [],
    "abilities": [
      {
        "id": "SD41-006#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "By sending one of your Lives to the Trash, draw two cards. Your Bursts can't activate via this effect."
        },
        "clauses": [
          {
            "rawText": "By sending one of your Lives to the Trash",
            "cleanText": "By sending one of your Lives to the Trash",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE"
            }
          },
          {
            "rawText": "draw two cards.",
            "cleanText": "draw two cards",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 2,
              "chooser": "self",
              "forEach": null
            }
          },
          {
            "rawText": "Your Bursts can't activate via this effect.",
            "cleanText": "Your Bursts can't activate via this effect",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD41-006#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Send a core from any opposing Spirit/Nexus to the Reserve."
        },
        "clauses": [
          {
            "rawText": "Send a core from any opposing Spirit/Nexus to the Reserve.",
            "cleanText": "Send a core from any opposing Spirit/Nexus to the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-007": {
    "cardNumber": "SD41-007",
    "name": "The MakaiEmperorDragon Darkwurm-Regalia",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Red/Purple & Cost 3 or more",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      },
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 168
      },
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 234
      }
    ],
    "abilities": [
      {
        "id": "SD41-007#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step)",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Advent: Red/Purple & Cost 3 or more",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By sending your [Soul Core] to the Trash, stack this from your Hand onto your target Spirit."
        },
        "clauses": [
          {
            "rawText": "By sending your [Soul Core] to the Trash",
            "cleanText": "By sending your [Soul Core] to the Trash",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "isSoulCore": true,
              "from": {
                "zone": "field_or_reserve",
                "side": "self"
              },
              "to": {
                "zone": "trash",
                "side": "self"
              }
            }
          },
          {
            "rawText": "stack this from your Hand onto your target Spirit.",
            "cleanText": "stack this from your Hand onto your target Spirit",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADVENT_STACK",
              "from": "HAND",
              "target": {
                "side": "self",
                "types": [
                  "Spirit"
                ]
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD41-007#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When [adventing] this card onto a Cost 3/4 Spirit you control, you can [Advent] it without sending your [Soul Core] to the Trash."
        },
        "clauses": [
          {
            "rawText": "When [adventing] this card onto a Cost 3/4 Spirit you control, you can [Advent] it without sending your [Soul Core] to the Trash.",
            "cleanText": "When [adventing] this card onto a Cost 3/4 Spirit you control, you can [Advent] it without sending your [Soul Core] to the Trash",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "isSoulCore": true,
              "from": {
                "zone": "field_or_reserve",
                "side": "self"
              },
              "to": {
                "zone": "trash",
                "side": "self"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD41-007#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned/Advents",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy all opposing Spirits/Ultimates with one core on them, and draw a card for each destroyed Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Destroy all opposing Spirits/Ultimates with one core on them",
            "cleanText": "Destroy all opposing Spirits/Ultimates with one core on them",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "either"
              },
              "isCost": false
            }
          },
          {
            "rawText": "draw a card for each destroyed Spirit/Ultimate.",
            "cleanText": "draw a card for each destroyed Spirit/Ultimate",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": "DISCARDED_COUNT"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A2296": {
    "cardNumber": "BATTLE-SPIRITS-A2296",
    "name": "The MakaiMarshal BurguHearts",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "s",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A2296#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "BURST",
          "timingLabel": "Burst",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": "AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Send two cores each from every non-\"Makai\"-named Spirits to the Reserve. If this Burst is activated during (Your Turn), for each Spirit depleted by this effect, put a core from the Void to your Reserve. After this effect resolves, summon this Spirit card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Send two cores each from every non-\"Makai\"-named Spirits to the Reserve.",
            "cleanText": "Send two cores each from every non-\"Makai\"-named Spirits to the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
            }
          },
          {
            "rawText": "If this Burst is activated during (Your Turn), for each Spirit depleted by this effect, put a core from the Void to your Reserve.",
            "cleanText": "for each Spirit depleted by this effect, put a core from the Void to your Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If this Burst is activated during (Your Turn)",
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "void"
              },
              "to": {
                "zone": "reserve",
                "side": "self"
              }
            }
          },
          {
            "rawText": "summon this Spirit card without paying the cost.",
            "cleanText": "summon this Spirit card without paying the cost",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_FREE",
              "from": "HAND"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A2296#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "For every 10 cards in your Trash, this Spirit gains an extra Purple symbol."
        },
        "clauses": [
          {
            "rawText": "For every 10 cards in your Trash, this Spirit gains an extra Purple symbol.",
            "cleanText": "For every 10 cards in your Trash, this Spirit gains an extra Purple symbol",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_SYMBOL"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-008": {
    "cardNumber": "SD41-008",
    "name": "The DivineHellGun Armillary-Sphere",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "Cost 5 or more",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Burst",
        "parameter": "s",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 35
      },
      {
        "name": "Reload",
        "parameter": null,
        "wave": 3,
        "hook": "reload",
        "bracketed": true,
        "index": 301
      },
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 318
      },
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 370
      }
    ],
    "abilities": [
      {
        "id": "SD41-008#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Brave Condition: Cost 5 or more",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": ""
        },
        "rawText": "[Brave Condition: Cost 5 or more]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD41-008#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "BURST",
          "timingLabel": "Burst",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": "AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Send two cores from an opposing Spirit to their Reserve. When any Spirit is depleted by this effect, draw a card. After this effect resolves, summon this Brave card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Send two cores from an opposing Spirit to their Reserve.",
            "cleanText": "Send two cores from an opposing Spirit to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
            }
          },
          {
            "rawText": "When any Spirit is depleted by this effect, draw a card.",
            "cleanText": "When any Spirit is depleted by this effect, draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": null
            }
          },
          {
            "rawText": "summon this Brave card without paying the cost.",
            "cleanText": "summon this Brave card without paying the cost",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_THIS_CARD",
              "from": "HAND_OR_BURST"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD41-008#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Reload",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can [Advent] onto this Spirit-condition Brave. When you [Advent] onto this Brave, you can brave this pre-Advent card to that Spirit."
        },
        "clauses": [
          {
            "rawText": "You can [Advent] onto this Spirit-condition Brave.",
            "cleanText": "You can [Advent] onto this Spirit-condition Brave",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          },
          {
            "rawText": "When you [Advent] onto this Brave, you can brave this pre-Advent card to that Spirit.",
            "cleanText": "When you [Advent] onto this Brave, you can brave this pre-Advent card to that Spirit",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-001": {
    "cardNumber": "SD41-001",
    "name": "Death Returner",
    "keywords": [
      {
        "name": "Immortality",
        "parameter": "Cost 0/3",
        "wave": 4,
        "hook": "immortality",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD41-001#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Immortality: Cost 0/3",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit card in your Trash can be summoned when your Cost 0/3 Spirit is destroyed."
        },
        "clauses": [
          {
            "rawText": "This Spirit card in your Trash can be summoned when your Cost 0/3 Spirit is destroyed.",
            "cleanText": "This Spirit card in your Trash can be summoned when your Cost 0/3 Spirit is destroyed",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD41-004": {
    "cardNumber": "SD41-004",
    "name": "The MakaiSoldier Curse Swordsman",
    "keywords": [],
    "abilities": [
      {
        "id": "SD41-004#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "By sending a core from any opposing Spirit that the opponent chooses to their Reserve, draw a card."
        },
        "clauses": [
          {
            "rawText": "By sending a core from any opposing Spirit that the opponent chooses to their Reserve",
            "cleanText": "By sending a core from any opposing Spirit that the opponent chooses to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "field",
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              },
              "to": {
                "zone": "reserve",
                "side": "opp"
              },
              "chooser": "opp"
            }
          },
          {
            "rawText": "draw a card.",
            "cleanText": "draw a card",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": null
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  }
};
