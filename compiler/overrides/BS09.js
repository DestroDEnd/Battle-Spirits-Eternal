/**
 * compiler/overrides/BS09.js
 * 
 * Explicit deterministic IR definitions for BS09 cards.
 */

export const BS09_OVERRIDES = {
  "BS09-036": {
    "cardNumber": "BS09-036",
    "name": "The BlizzardEmperor Ullr",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 3 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Armor",
        "parameter": "Red/Purple/White/Blue",
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 250
      }
    ],
    "abilities": [
      {
        "id": "BS09-036#a0",
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
          "keyword": "Tribute: Cost 3 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "Tribute"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-036#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
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
          "cleanBody": "The attacks of Cost 4 or less Spirits can't reduce either player's Life."
        },
        "clauses": [
          {
            "rawText": "The attacks of Cost 4 or less Spirits can't reduce either player's Life.",
            "cleanText": "The attacks of Cost 4 or less Spirits can't reduce either player's Life",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COST_MODIFIER"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-036#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Armor: Red/Purple/White/Blue",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit is unaffected by opposing Red/Purple/White/Blue Spirit/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit is unaffected by opposing Red/Purple/White/Blue Spirit/Nexus/Magic effects.",
            "cleanText": "This Spirit is unaffected by opposing Red/Purple/White/Blue Spirit/Nexus/Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUOUS_RULE",
              "rule": "IMMUNITY"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-X37": {
    "cardNumber": "BS09-X37",
    "name": "The DoomKnightLord Ragna-Rock",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 6 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 251
      }
    ],
    "abilities": [
      {
        "id": "BS09-X37#a0",
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
          "keyword": "Tribute: Cost 6 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirits you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirits you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirits you control to the Void",
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
      },
      {
        "id": "BS09-X37#a1",
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
          "cleanBody": "Exhaust every opposing Spirit. If \"The IronKnight Yggdrasill\" was the [Tribute], also, put six cores from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "Exhaust every opposing Spirit.",
            "cleanText": "Exhaust every opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "target": {
                "side": "either"
              }
            }
          },
          {
            "rawText": "If \"The IronKnight Yggdrasill\" was the [Tribute], also, put six cores from the Void to this Spirit.",
            "cleanText": "also, put six cores from the Void to this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If \"The IronKnight Yggdrasill\" was the [Tribute]",
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-X37#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_BATTLES",
          "timingLabel": "When Battles",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Refresh three Cost 8 or less Spirits you control."
        },
        "clauses": [
          {
            "rawText": "Refresh three Cost 8 or less Spirits you control.",
            "cleanText": "Refresh three Cost 8 or less Spirits you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH",
              "target": {
                "side": "either"
              }
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
  "BS09-X38": {
    "cardNumber": "BS09-X38",
    "name": "The ImpregnableKnightLord Odin Type-X",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 117
      },
      {
        "name": "Armor",
        "parameter": "Red/Purple/Green/White/Yellow/Blue",
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 163
      }
    ],
    "abilities": [
      {
        "id": "BS09-X38#a0",
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
          "cleanBody": "If the opponent has six or more cards in Hand, return three opposing Spirits without [Tribute] to the decktop in any order."
        },
        "clauses": [
          {
            "rawText": "If the opponent has six or more cards in Hand, return three opposing Spirits without [Tribute] to the decktop in any order.",
            "cleanText": "return three opposing Spirits without [Tribute] to the decktop in any order",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the opponent has six or more cards in Hand",
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "either"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-X38#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Armor: Red/Purple/Green/White/Yellow/Blue",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit is unaffected by opposing Red/Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit is unaffected by opposing Red/Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects.",
            "cleanText": "This Spirit is unaffected by opposing Red/Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUOUS_RULE",
              "rule": "IMMUNITY"
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
  "BS09-033": {
    "cardNumber": "BS09-033",
    "name": "The LanceKnight Gautr",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-033#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opposing Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Life is reduced by an opposing Spirit, refresh three of your Yellow Spirits."
        },
        "clauses": [
          {
            "rawText": "When your Life is reduced by an opposing Spirit, refresh three of your Yellow Spirits.",
            "cleanText": "When your Life is reduced by an opposing Spirit, refresh three of your Yellow Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH",
              "target": {
                "side": "either"
              }
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
  "BS09-067": {
    "cardNumber": "BS09-067",
    "name": "Big Bang Energy",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-067#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN",
          "timingLabel": "Main",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": true,
          "cleanBody": "During this turn, the cost of all \"Astral Dragon\" family Spirit cards in your Hand become the same number as your Life."
        },
        "clauses": [
          {
            "rawText": "During this turn, the cost of all \"Astral Dragon\" family Spirit cards in your Hand become the same number as your Life.",
            "cleanText": "the cost of all \"Astral Dragon\" family Spirit cards in your Hand become the same number as your Life",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "COST_MODIFIER"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-067#a1",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "During this turn, give a Spirit +2000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +2000 BP.",
            "cleanText": "give a Spirit +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": "target",
              "duration": "DURING_THIS_TURN"
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
  "BS09-041": {
    "cardNumber": "BS09-041",
    "name": "Aspidochelun",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-041#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_BLOCKS",
          "timingLabel": "When Blocks",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-079": {
    "cardNumber": "BS09-079",
    "name": "Character Lost",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-079#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN",
          "timingLabel": "Main",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": true,
          "cleanBody": "During this turn, all opposing Spirits are treated as not having any family and can't gain new ones."
        },
        "clauses": [
          {
            "rawText": "During this turn, all opposing Spirits are treated as not having any family and can't gain new ones.",
            "cleanText": "all opposing Spirits are treated as not having any family and can't gain new ones",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "TREAT_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-079#a1",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "During this turn, give one Spirit +2000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give one Spirit +2000 BP.",
            "cleanText": "give one Spirit +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": {
                "side": "either"
              }
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
  "BS09-080": {
    "cardNumber": "BS09-080",
    "name": "Exhaust Nexus",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 91
      }
    ],
    "abilities": [
      {
        "id": "BS09-080#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "For each exhausted Nexus the opponent controls, destroy an opposing Spirit without [Tribute]. When this Magic card is discarded from your deck due to opposing Spirit/Nexus/Magic effects, immediately activate this effect, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "For each exhausted Nexus the opponent controls, destroy an opposing Spirit without [Tribute].",
            "cleanText": "For each exhausted Nexus the opponent controls, destroy an opposing Spirit without [Tribute]",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "When this Magic card is discarded from your deck due to opposing Spirit/Nexus/Magic effects, immediately activate this effect, without paying the cost.",
            "cleanText": "When this Magic card is discarded from your deck due to opposing Spirit/Nexus/Magic effects, immediately activate this effect, without paying the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COST_MODIFIER"
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
  "BS09-052": {
    "cardNumber": "BS09-052",
    "name": "Forest-Golem",
    "keywords": [
      {
        "name": "Assault",
        "parameter": "1",
        "wave": 1,
        "hook": "assault",
        "bracketed": true,
        "index": 115
      }
    ],
    "abilities": [
      {
        "id": "BS09-052#a0",
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
          "cleanBody": "If you control any Green Spirit, destroy opposing Cost 3/4 Spirits, one of each."
        },
        "clauses": [
          {
            "rawText": "If you control any Green Spirit, destroy opposing Cost 3/4 Spirits, one of each.",
            "cleanText": "destroy opposing Cost 3/4 Spirits, one of each",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control any Green Spirit",
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
      },
      {
        "id": "BS09-052#a1",
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
          "keyword": "Assault: 1",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses."
        },
        "clauses": [
          {
            "rawText": "This Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses.",
            "cleanText": "This Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH_BY_EXHAUSTING_NEXUS",
              "target": "self"
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
  "BS09-074": {
    "cardNumber": "BS09-074",
    "name": "Forest Charge",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-074#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "During this battle, when only the opposing Spirit is destroyed by your \"Blade Beast\"/\"Giant Beast\" family Spirit via BP comparison, refresh that Spirit you control."
        },
        "clauses": [
          {
            "rawText": "During this battle, when only the opposing Spirit is destroyed by your \"Blade Beast\"/\"Giant Beast\" family Spirit via BP comparison, refresh that Spirit you control.",
            "cleanText": "when only the opposing Spirit is destroyed by your \"Blade Beast\"/\"Giant Beast\" family Spirit via BP comparison, refresh that Spirit you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_BATTLE",
            "op": {
              "op": "REFRESH",
              "target": {
                "side": "either"
              }
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
  "BATTLE-SPIRITS-A4308": {
    "cardNumber": "BATTLE-SPIRITS-A4308",
    "name": "Futabanea",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A4308#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Blue Spirit is summoned, destroy an opposing 2000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "When your Blue Spirit is summoned, destroy an opposing 2000 BP or less Spirit.",
            "cleanText": "When your Blue Spirit is summoned, destroy an opposing 2000 BP or less Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "filters": {
                  "bpLte": 2000
                }
              }
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
  "BS09-071": {
    "cardNumber": "BS09-071",
    "name": "Immortal Draw",
    "keywords": [
      {
        "name": "Immortality",
        "parameter": null,
        "wave": 4,
        "hook": "immortality",
        "bracketed": true,
        "index": 47
      }
    ],
    "abilities": [
      {
        "id": "BS09-071#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN",
          "timingLabel": "Main",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": true,
          "cleanBody": "During this turn, when your Spirit with [Immortality] is summoned, draw two cards."
        },
        "clauses": [
          {
            "rawText": "During this turn, when your Spirit with [Immortality] is summoned, draw two cards.",
            "cleanText": "when your Spirit with [Immortality] is summoned, draw two cards",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "DRAW",
              "count": 2,
              "chooser": "self",
              "forEach": null
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-071#a1",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "During this turn, give a Spirit +1000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +1000 BP.",
            "cleanText": "give a Spirit +1000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "target",
              "duration": "DURING_THIS_TURN"
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
  "BS09-040": {
    "cardNumber": "BS09-040",
    "name": "Iwasaal",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-040#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_BLOCKS",
          "timingLabel": "When Blocks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust two opposing Cost 3 or less Spirits."
        },
        "clauses": [
          {
            "rawText": "Exhaust two opposing Cost 3 or less Spirits.",
            "cleanText": "Exhaust two opposing Cost 3 or less Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "target": {
                "side": "either"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-040#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "This Spirit is also treated as a Purple Spirit."
        },
        "clauses": [
          {
            "rawText": "This Spirit is also treated as a Purple Spirit.",
            "cleanText": "This Spirit is also treated as a Purple Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_COLOR",
              "color": "Purple"
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
  "BS09-068": {
    "cardNumber": "BS09-068",
    "name": "Land Mine",
    "keywords": [
      {
        "name": "Awaken",
        "parameter": null,
        "wave": 1,
        "hook": "awaken",
        "bracketed": true,
        "index": 40
      },
      {
        "name": "Curse",
        "parameter": null,
        "wave": 1,
        "hook": "curse",
        "bracketed": true,
        "index": 49
      },
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 57
      },
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 70
      },
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 83
      }
    ],
    "abilities": [
      {
        "id": "BS09-068#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "Destroy an opposing Spirit with [Awaken]/[Curse]/[High Speed]/[Brilliance]/[Crush]. If this Magic card was discarded from your deck by an opposing Spirit/Nexus/Magic effect, immediately activate this effect without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit with [Awaken]/[Curse]/[High Speed]/[Brilliance]/[Crush].",
            "cleanText": "Destroy an opposing Spirit with [Awaken]/[Curse]/[High Speed]/[Brilliance]/[Crush]",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "If this Magic card was discarded from your deck by an opposing Spirit/Nexus/Magic effect, immediately activate this effect without paying the cost.",
            "cleanText": "immediately activate this effect without paying the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If this Magic card was discarded from your deck by an opposing Spirit/Nexus/Magic effect",
            "duration": null,
            "op": {
              "op": "COST_MODIFIER"
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
  "BS09-072": {
    "cardNumber": "BS09-072",
    "name": "Shadow Blade",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 102
      }
    ],
    "abilities": [
      {
        "id": "BS09-072#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "While you control both Red and Purple Spirits, destroy all exhausted opposing Spirits without [Tribute]."
        },
        "clauses": [
          {
            "rawText": "While you control both Red and Purple Spirits, destroy all exhausted opposing Spirits without [Tribute].",
            "cleanText": "destroy all exhausted opposing Spirits without [Tribute]",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you control both Red and Purple Spirits",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-009": {
    "cardNumber": "BS09-009",
    "name": "The BlazeEmperor Arc",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 3 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS09-009#a0",
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
          "keyword": "Tribute: Cost 3 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "Tribute"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-009#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "Destroy an opposing 3000 BP or less Spirit, and two opposing Nexuses."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 3000 BP or less Spirit, and two opposing Nexuses.",
            "cleanText": "Destroy an opposing 3000 BP or less Spirit, and two opposing Nexuses",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "filters": {
                  "bpLte": 3000
                }
              }
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
  "BS09-026": {
    "cardNumber": "BS09-026",
    "name": "The Captain Dreadnought",
    "keywords": [
      {
        "name": "Windstorm",
        "parameter": null,
        "wave": 1,
        "hook": "windstorm",
        "bracketed": true,
        "index": 154
      }
    ],
    "abilities": [
      {
        "id": "BS09-026#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "When this Spirit is blocked, the opponent exhausts two Spirits they control."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is blocked, the opponent exhausts two Spirits they control.",
            "cleanText": "When this Spirit is blocked, the opponent exhausts two Spirits they control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "count": 2,
              "chooser": "opp",
              "target": {
                "side": "opp",
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
        "id": "BS09-026#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
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
          "cleanBody": "When your Spirits with [Windstorm] are destroyed by comparing BP, they return to the Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "When your Spirits with [Windstorm] are destroyed by comparing BP, they return to the Field, exhausted.",
            "cleanText": "When your Spirits with [Windstorm] are destroyed by comparing BP, they return to the Field, exhausted",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "either"
              }
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
  "BS09-014": {
    "cardNumber": "BS09-014",
    "name": "The DarkKnight Bors",
    "keywords": [
      {
        "name": "Immortality",
        "parameter": "Cost 5",
        "wave": 4,
        "hook": "immortality",
        "bracketed": true,
        "index": 11
      }
    ],
    "abilities": [
      {
        "id": "BS09-014#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Immortality: Cost 5",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can summon this Spirit card from the Trash when your Cost 5 Spirit is destroyed."
        },
        "clauses": [
          {
            "rawText": "You can summon this Spirit card from the Trash when your Cost 5 Spirit is destroyed.",
            "cleanText": "You can summon this Spirit card from the Trash when your Cost 5 Spirit is destroyed",
            "link": null,
            "isOptional": true,
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-016": {
    "cardNumber": "BS09-016",
    "name": "The DarkKnight Mordred",
    "keywords": [
      {
        "name": "Immortality",
        "parameter": "Cost 6/7",
        "wave": 4,
        "hook": "immortality",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 320
      }
    ],
    "abilities": [
      {
        "id": "BS09-016#a0",
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
          "keyword": "Immortality: Cost 6/7",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Cost 6/7 Spirit is destroyed, you can summon this Spirit card from the Trash."
        },
        "clauses": [
          {
            "rawText": "When your Cost 6/7 Spirit is destroyed, you can summon this Spirit card from the Trash.",
            "cleanText": "When your Cost 6/7 Spirit is destroyed, you can summon this Spirit card from the Trash",
            "link": null,
            "isOptional": true,
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
        "id": "BS09-016#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opposing Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Red Spirits are destroyed, send a core from any opposing Spirits to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When your Red Spirits are destroyed, send a core from any opposing Spirits to their Reserve.",
            "cleanText": "When your Red Spirits are destroyed, send a core from any opposing Spirits to their Reserve",
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-016#a2",
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
          "cleanBody": "Both players destroy a non-[Tribute] Spirit they control."
        },
        "clauses": [
          {
            "rawText": "Both players destroy a non-[Tribute] Spirit they control.",
            "cleanText": "Both players destroy a non-[Tribute] Spirit they control",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-018": {
    "cardNumber": "BS09-018",
    "name": "The DarknessEmperor Zanba",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 3 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS09-018#a0",
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
          "keyword": "Tribute: Cost 3 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "Tribute"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-018#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "Send a number of cores from any opposing Spirits to their Reserve, equal to this Spirit's level."
        },
        "clauses": [
          {
            "rawText": "Send a number of cores from any opposing Spirits to their Reserve, equal to this Spirit's level.",
            "cleanText": "Send a number of cores from any opposing Spirits to their Reserve, equal to this Spirit's level",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-039": {
    "cardNumber": "BS09-039",
    "name": "The Detective Pentan",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-039#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "START_STEP",
          "timingLabel": "Your Start Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "By discarding [Character Lost] from your Hand, choose a random card from the opposing Hand, and look at its content."
        },
        "clauses": [
          {
            "rawText": "By discarding [Character Lost] from your Hand",
            "cleanText": "By discarding [Character Lost] from your Hand",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_HAND",
              "chooser": "self",
              "isCost": false
            }
          },
          {
            "rawText": "choose a random card from the opposing Hand",
            "cleanText": "choose a random card from the opposing Hand",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DECK_OR_HAND_ACTION"
            }
          },
          {
            "rawText": "look at its content.",
            "cleanText": "look at its content",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DECK_OR_HAND_ACTION"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-039#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_DESTROYED",
          "timingLabel": "When Destroyed",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Return a Purple Magic card from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return a Purple Magic card from your Trash to the Hand.",
            "cleanText": "Return a Purple Magic card from your Trash to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "either"
              }
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
  "BS09-050": {
    "cardNumber": "BS09-050",
    "name": "The Diva Canary",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-050#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "When your Nexus is deployed, put a core from the Void onto this Spirit."
        },
        "clauses": [
          {
            "rawText": "When your Nexus is deployed, put a core from the Void onto this Spirit.",
            "cleanText": "When your Nexus is deployed, put a core from the Void onto this Spirit",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-017": {
    "cardNumber": "BS09-017",
    "name": "The DragonPhoenixDeity Baaral",
    "keywords": [
      {
        "name": "Immortality",
        "parameter": "Cost 3/4/5/6",
        "wave": 4,
        "hook": "immortality",
        "bracketed": true,
        "index": 16
      }
    ],
    "abilities": [
      {
        "id": "BS09-017#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Immortality: Cost 3/4/5/6",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Cost 3/4/5/6 Spirit is destroyed, you can summon this Spirit card from the Trash."
        },
        "clauses": [
          {
            "rawText": "When your Cost 3/4/5/6 Spirit is destroyed, you can summon this Spirit card from the Trash.",
            "cleanText": "When your Cost 3/4/5/6 Spirit is destroyed, you can summon this Spirit card from the Trash",
            "link": null,
            "isOptional": true,
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
        "id": "BS09-017#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
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
          "cleanBody": "Increase the level cost of every opposing Spirit by +1."
        },
        "clauses": [
          {
            "rawText": "Increase the level cost of every opposing Spirit by +1.",
            "cleanText": "Increase the level cost of every opposing Spirit by +1",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COST_MODIFIER"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-017#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "Send all cores from the opposing Reserve to their Trash."
        },
        "clauses": [
          {
            "rawText": "Send all cores from the opposing Reserve to their Trash.",
            "cleanText": "Send all cores from the opposing Reserve to their Trash",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": "ALL",
              "from": {
                "zone": "reserve",
                "side": "opp"
              },
              "to": {
                "zone": "trash",
                "side": "opp"
              }
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-042": {
    "cardNumber": "BS09-042",
    "name": "The FairyKnight Peter",
    "keywords": [
      {
        "name": "Holy Life",
        "parameter": null,
        "wave": 1,
        "hook": "holy_life",
        "bracketed": true,
        "index": 16
      }
    ],
    "abilities": [
      {
        "id": "BS09-042#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "keyword": "Holy Life",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When this Spirit's attack reduces the opposing Life, put a core from the Void to your Life."
        },
        "clauses": [
          {
            "rawText": "When this Spirit's attack reduces the opposing Life, put a core from the Void to your Life.",
            "cleanText": "When this Spirit's attack reduces the opposing Life, put a core from the Void to your Life",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "RECOVER_LIFE",
              "count": 1
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-042#a1",
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
          "cleanBody": "Target an opposing Spirit. During this battle, that Spirit can't block."
        },
        "clauses": [
          {
            "rawText": "Target an opposing Spirit.",
            "cleanText": "Target an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET",
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "During this battle, that Spirit can't block.",
            "cleanText": "that Spirit can't block",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_BATTLE",
            "op": {
              "op": "COMBAT_RESTRICTION"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-023": {
    "cardNumber": "BS09-023",
    "name": "The FortressWorm Ralba",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-023#a0",
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
          "cleanBody": "Put a core from the Void each to two White Spirits you control."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void each to two White Spirits you control.",
            "cleanText": "Put a core from the Void each to two White Spirits you control",
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
      },
      {
        "id": "BS09-023#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "This Spirit is also treated as a White Spirit."
        },
        "clauses": [
          {
            "rawText": "This Spirit is also treated as a White Spirit.",
            "cleanText": "This Spirit is also treated as a White Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_COLOR",
              "color": "White"
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
  "BS09-008": {
    "cardNumber": "BS09-008",
    "name": "The FlameEmperor Agniffon",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-008#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "Send two cores from your Trash to one of your Spirits."
        },
        "clauses": [
          {
            "rawText": "Send two cores from your Trash to one of your Spirits.",
            "cleanText": "Send two cores from your Trash to one of your Spirits",
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
      },
      {
        "id": "BS09-008#a1",
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
          "cleanBody": "The symbols of every \"Emperor Beast\" family Spirit you control becomes two symbols of the same color as the symbol that Spirit already has."
        },
        "clauses": [
          {
            "rawText": "The symbols of every \"Emperor Beast\" family Spirit you control becomes two symbols of the same color as the symbol that Spirit already has.",
            "cleanText": "The symbols of every \"Emperor Beast\" family Spirit you control becomes two symbols of the same color as the symbol that Spirit already has",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-049": {
    "cardNumber": "BS09-049",
    "name": "The FlameLizard Cthughma",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-049#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
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
          "cleanBody": "This Spirit can block opposing Spirits with \"can't be blocked\" effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit can block opposing Spirits with \"can't be blocked\" effects.",
            "cleanText": "This Spirit can block opposing Spirits with \"can't be blocked\" effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "UNBLOCKABLE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-049#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_BLOCKS",
          "timingLabel": "When Blocks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing Spirit with \"can't be blocked\" effects."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit with \"can't be blocked\" effects.",
            "cleanText": "Destroy an opposing Spirit with \"can't be blocked\" effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              }
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
  "BS09-032": {
    "cardNumber": "BS09-032",
    "name": "The FlyingIronBeast Gale-Fokker",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-032#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "CORE_STEP",
          "timingLabel": "Your Core Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "If you control any Cost 7 or more Spirit, put a core from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "If you control any Cost 7 or more Spirit, put a core from the Void to this Spirit.",
            "cleanText": "put a core from the Void to this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control any Cost 7 or more Spirit",
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "void"
              },
              "to": {
                "zone": "field",
                "target": "self"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-032#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opposing Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "All your Spirits with cost reduction symbols of two or more colors gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with cost reduction symbols of two or more colors gain +2000 BP.",
            "cleanText": "All your Spirits with cost reduction symbols of two or more colors gain +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": {
                "side": "either"
              }
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
  "BS09-005": {
    "cardNumber": "BS09-005",
    "name": "The GalaxyDragon Andrometeors",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-005#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "You can reveal two cards from your decktop. If any, add an \"Astral Dragon\" family Spirit card among them to your Hand. Return any remaining cards to the deckbottom in any order."
        },
        "clauses": [
          {
            "rawText": "You can reveal two cards from your decktop.",
            "cleanText": "You can reveal two cards from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 2
            }
          },
          {
            "rawText": "If any, add an \"Astral Dragon\" family Spirit card among them to your Hand.",
            "cleanText": "add an \"Astral Dragon\" family Spirit card among them to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If any",
            "duration": null,
            "op": {
              "op": "ADD_TO_HAND"
            }
          },
          {
            "rawText": "Return any remaining cards to the deckbottom in any order.",
            "cleanText": "Return any remaining cards to the deckbottom in any order",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "RETURN_REVEALED_BOTTOM"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-005#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
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
          "cleanBody": "This Spirit is also treated as a Blue Spirit."
        },
        "clauses": [
          {
            "rawText": "This Spirit is also treated as a Blue Spirit.",
            "cleanText": "This Spirit is also treated as a Blue Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_COLOR",
              "color": "Blue"
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
  "BS09-035": {
    "cardNumber": "BS09-035",
    "name": "The GiantBeastEmperor Smidlord",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-035#a0",
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
          "cleanBody": "When your Life is reduced by opposing Spirits, and your Life is three or less, you can summon this Spirit card from your Hand, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "When your Life is reduced by opposing Spirits, and your Life is three or less, you can summon this Spirit card from your Hand, without paying the cost.",
            "cleanText": "When your Life is reduced by opposing Spirits, and your Life is three or less, you can summon this Spirit card from your Hand, without paying the cost",
            "link": null,
            "isOptional": true,
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
        "id": "BS09-035#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opposing Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "All your \"Giant Beast\"/\"Hunter Beast\" family Spirits gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "All your \"Giant Beast\"/\"Hunter Beast\" family Spirits gain +2000 BP.",
            "cleanText": "All your \"Giant Beast\"/\"Hunter Beast\" family Spirits gain +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": {
                "side": "either"
              }
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
  "BS09-058": {
    "cardNumber": "BS09-058",
    "name": "The Grimoire Bookshelf",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-058#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When the opponent uses a Magic effect, send a core from any opposing Spirit to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When the opponent uses a Magic effect, send a core from any opposing Spirit to their Reserve.",
            "cleanText": "When the opponent uses a Magic effect, send a core from any opposing Spirit to their Reserve",
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-058#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "END_OF_TURN",
          "timingLabel": "Opposing End Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can return a card from your Hand to the decktop. If the opposing deck has 0 cards, this effect don't activate."
        },
        "clauses": [
          {
            "rawText": "You can return a card from your Hand to the decktop.",
            "cleanText": "You can return a card from your Hand to the decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "either"
              }
            }
          },
          {
            "rawText": "If the opposing deck has 0 cards, this effect don't activate.",
            "cleanText": "this effect don't activate",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the opposing deck has 0 cards",
            "duration": null,
            "op": {
              "op": "PLAY_CONDITION"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-030": {
    "cardNumber": "BS09-030",
    "name": "The Guardian Hlin",
    "keywords": [
      {
        "name": "Armor",
        "parameter": "Purple/Blue",
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 11
      },
      {
        "name": "Armor",
        "parameter": "Purple/Blue",
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 162
      }
    ],
    "abilities": [
      {
        "id": "BS09-030#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Armor: Purple/Blue",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit is unaffected by opposing Purple/Blue Spirit/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit is unaffected by opposing Purple/Blue Spirit/Nexus/Magic effects.",
            "cleanText": "This Spirit is unaffected by opposing Purple/Blue Spirit/Nexus/Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUOUS_RULE",
              "rule": "IMMUNITY"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-030#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "Give all your \"Ice Princess\" family Spirits: [Armor: Purple/Blue]."
        },
        "clauses": [
          {
            "rawText": "Give all your \"Ice Princess\" family Spirits: [Armor: Purple/Blue].",
            "cleanText": "Give all your \"Ice Princess\" family Spirits: [Armor: Purple/Blue]",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-027": {
    "cardNumber": "BS09-027",
    "name": "The JungleEmperor Volza",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 3 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS09-027#a0",
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
          "keyword": "Tribute: Cost 3 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "Tribute"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-027#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_BATTLES",
          "timingLabel": "When Battles",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, this Spirit refreshes."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, this Spirit refreshes.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, this Spirit refreshes",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH",
              "target": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-027#a2",
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
          "cleanBody": "Cores can't be removed from the Spirit that is blocking this Spirit."
        },
        "clauses": [
          {
            "rawText": "Cores can't be removed from the Spirit that is blocking this Spirit.",
            "cleanText": "Cores can't be removed from the Spirit that is blocking this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COMBAT_RESTRICTION"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-059": {
    "cardNumber": "BS09-059",
    "name": "The Jade Shrine",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-059#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
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
          "cleanBody": "Every \"Blade Beast\" family Spirit you control gains +2000 BP."
        },
        "clauses": [
          {
            "rawText": "Every \"Blade Beast\" family Spirit you control gains +2000 BP.",
            "cleanText": "Every \"Blade Beast\" family Spirit you control gains +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": {
                "side": "either"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-059#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Opposing Main Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The number of cores on your Spirits can't become less than their LV1 cost."
        },
        "clauses": [
          {
            "rawText": "The number of cores on your Spirits can't become less than their LV1 cost.",
            "cleanText": "The number of cores on your Spirits can't become less than their LV1 cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COST_MODIFIER"
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
  "BS09-015": {
    "cardNumber": "BS09-015",
    "name": "The JailBeast Gashabers",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-015#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "DRAW_STEP",
          "timingLabel": "Your Draw Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "If you control any 8000 BP or more Spirit, you draw +1 card."
        },
        "clauses": [
          {
            "rawText": "If you control any 8000 BP or more Spirit, you draw +1 card.",
            "cleanText": "you draw +1 card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control any 8000 BP or more Spirit",
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-015#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_DESTROYED",
          "timingLabel": "When Destroyed",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Return a Yellow Spirit card from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return a Yellow Spirit card from your Trash to the Hand.",
            "cleanText": "Return a Yellow Spirit card from your Trash to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "either"
              }
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
  "BS09-025": {
    "cardNumber": "BS09-025",
    "name": "The Ninja Sarutobe",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-025#a0",
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
          "cleanBody": "When this Spirit is discarded from the Hand by an opposing Spirit effect, you can summon it, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is discarded from the Hand by an opposing Spirit effect, you can summon it, without paying the cost.",
            "cleanText": "When this Spirit is discarded from the Hand by an opposing Spirit effect, you can summon it, without paying the cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_HAND",
              "chooser": "self",
              "isCost": false
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-025#a1",
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
          "cleanBody": "The opponent discards a card from their Hand."
        },
        "clauses": [
          {
            "rawText": "The opponent discards a card from their Hand.",
            "cleanText": "The opponent discards a card from their Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_HAND",
              "count": 1,
              "chooser": "opp",
              "target": {
                "side": "opp"
              }
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
  "BS09-055": {
    "cardNumber": "BS09-055",
    "name": "The Reincarnation Valley",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 87
      },
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 160
      }
    ],
    "abilities": [
      {
        "id": "BS09-055#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "DRAW_STEP",
          "timingLabel": "Your Draw Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "At the start of the step, by discarding a Spirit card with [Tribute] from your Hand, you draw +1 card."
        },
        "clauses": [
          {
            "rawText": "At the start of the step, by discarding a Spirit card with [Tribute] from your Hand, you draw +1 card.",
            "cleanText": "At the start of the step, by discarding a Spirit card with [Tribute] from your Hand, you draw +1 card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-055#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "All your Spirits with [Tribute] can't be returned to your Hand by opposing Spirit/ Nexus/ Magic effects."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with [Tribute] can't be returned to your Hand by opposing Spirit/ Nexus/ Magic effects.",
            "cleanText": "All your Spirits with [Tribute] can't be returned to your Hand by opposing Spirit/ Nexus/ Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "either"
              }
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
  "BATTLE-SPIRITS-A12049": {
    "cardNumber": "BATTLE-SPIRITS-A12049",
    "name": "The Sanctuary protected by GiantBeast",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A12049#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opposing Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When \"Giant Beast\"/\"Hunter Beast\" family Spirit blocks an opposing Spirit, put a core from the Void to that Spirit."
        },
        "clauses": [
          {
            "rawText": "When \"Giant Beast\"/\"Hunter Beast\" family Spirit blocks an opposing Spirit, put a core from the Void to that Spirit.",
            "cleanText": "When \"Giant Beast\"/\"Hunter Beast\" family Spirit blocks an opposing Spirit, put a core from the Void to that Spirit",
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
      },
      {
        "id": "BATTLE-SPIRITS-A12049#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "END_OF_TURN",
          "timingLabel": "Your End Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Refresh every \"Giant Beast\"/\"Hunter Beast\" family Spirits you control."
        },
        "clauses": [
          {
            "rawText": "Refresh every \"Giant Beast\"/\"Hunter Beast\" family Spirits you control.",
            "cleanText": "Refresh every \"Giant Beast\"/\"Hunter Beast\" family Spirits you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH",
              "target": {
                "side": "either"
              }
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
  "BS09-X36": {
    "cardNumber": "BS09-X36",
    "name": "The SevenShogun Beldegaulle",
    "keywords": [
      {
        "name": "Immortality",
        "parameter": "Cost 4/5",
        "wave": 4,
        "hook": "immortality",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS09-X36#a0",
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
          "keyword": "Immortality: Cost 4/5",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed."
        },
        "clauses": [
          {
            "rawText": "This Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed.",
            "cleanText": "This Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed",
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
      },
      {
        "id": "BS09-X36#a1",
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
          "cleanBody": "Destroy an opposing exhausted Cost 4 or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing exhausted Cost 4 or less Spirit.",
            "cleanText": "Destroy an opposing exhausted Cost 4 or less Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "filters": {
                  "costLte": 4,
                  "state": "EXHAUSTED"
                }
              }
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
  "BS09-045": {
    "cardNumber": "BS09-045",
    "name": "The ShiningEmperor Ryute",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 3 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS09-045#a0",
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
          "keyword": "Tribute: Cost 3 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "Tribute"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-045#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "All opposing Spirits that are blocking your Spirits are treated as LV1."
        },
        "clauses": [
          {
            "rawText": "All opposing Spirits that are blocking your Spirits are treated as LV1.",
            "cleanText": "All opposing Spirits that are blocking your Spirits are treated as LV1",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TREAT_LEVEL",
              "level": 1
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
  "BS09-011": {
    "cardNumber": "BS09-011",
    "name": "The ShieldKnight Guardner",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-011#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opposing Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Red Spirit is destroyed, send a core from any opposing Spirit to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When your Red Spirit is destroyed, send a core from any opposing Spirit to their Reserve.",
            "cleanText": "When your Red Spirit is destroyed, send a core from any opposing Spirit to their Reserve",
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
  "BS09-006": {
    "cardNumber": "BS09-006",
    "name": "The SnakeDragon King-Gorgo",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-006#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "All your \"Astral Dragon\" family Spirits gain +3000 BP."
        },
        "clauses": [
          {
            "rawText": "All your \"Astral Dragon\" family Spirits gain +3000 BP.",
            "cleanText": "All your \"Astral Dragon\" family Spirits gain +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "targetGroup": "ALL_FRIENDLY",
              "family": "Astral Dragon",
              "target": "all_friendly",
              "duration": "THIS_TURN"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-006#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Blue Spirit is summoned, destroy an opposing 3000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "When your Blue Spirit is summoned, destroy an opposing 3000 BP or less Spirit.",
            "cleanText": "When your Blue Spirit is summoned, destroy an opposing 3000 BP or less Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "filters": {
                  "bpLte": 3000
                }
              }
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
  "BATTLE-SPIRITS-A12700": {
    "cardNumber": "BATTLE-SPIRITS-A12700",
    "name": "The StarDragonDeity Sieg-Meteorwurm",
    "keywords": [
      {
        "name": "Awaken",
        "parameter": null,
        "wave": 1,
        "hook": "awaken",
        "bracketed": true,
        "index": 23
      },
      {
        "name": "Clash",
        "parameter": null,
        "wave": 1,
        "hook": "clash",
        "bracketed": true,
        "index": 122
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A12700#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "FLASH",
          "timingLabel": "Flash",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Awaken",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "You can put any number of cores from Spirits you control to this Spirit."
        },
        "clauses": [
          {
            "rawText": "You can put any number of cores from Spirits you control to this Spirit.",
            "cleanText": "You can put any number of cores from Spirits you control to this Spirit",
            "link": null,
            "isOptional": true,
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
      },
      {
        "id": "BATTLE-SPIRITS-A12700#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "keyword": "Clash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The opponent must block if possible."
        },
        "clauses": [
          {
            "rawText": "The opponent must block if possible.",
            "cleanText": "The opponent must block if possible",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "FORCE_BLOCK",
              "side": "opp"
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
  "BS09-056": {
    "cardNumber": "BS09-056",
    "name": "The Star Creation Place",
    "keywords": [
      {
        "name": "Clash",
        "parameter": null,
        "wave": 1,
        "hook": "clash",
        "bracketed": true,
        "index": 62
      }
    ],
    "abilities": [
      {
        "id": "BS09-056#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "Give all your 8000 BP or more Spirits the effect: \"[Clash] (When Attacks) The opponent must block if possible.\""
        },
        "clauses": [
          {
            "rawText": "Give all your 8000 BP or more Spirits the effect: \"[Clash] (When Attacks) The opponent must block if possible.\"",
            "cleanText": "Give all your 8000 BP or more Spirits the effect: \"[Clash] (When Attacks) The opponent must block if possible.\"",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "FORCE_BLOCK",
              "side": "opp"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-056#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When only the opposing Spirit is destroyed by comparing BP with your \"Astral Dragon\" family Spirit, return a Spirit card from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed by comparing BP with your \"Astral Dragon\" family Spirit, return a Spirit card from your Trash to the Hand.",
            "cleanText": "When only the opposing Spirit is destroyed by comparing BP with your \"Astral Dragon\" family Spirit, return a Spirit card from your Trash to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SALVAGE",
              "cardType": "Spirit",
              "count": 1
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
  "BS09-054": {
    "cardNumber": "BS09-054",
    "name": "The StormEmperor Coyo",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 3 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Assault",
        "parameter": "1",
        "wave": 1,
        "hook": "assault",
        "bracketed": true,
        "index": 160
      }
    ],
    "abilities": [
      {
        "id": "BS09-054#a0",
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
          "keyword": "Tribute: Cost 3 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from a Cost 3 or more Spirit you control to the Void",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "Tribute"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-054#a1",
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
          "keyword": "Assault: 1",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit can, once per turn, be refreshed by exhausting one of your Nexuses."
        },
        "clauses": [
          {
            "rawText": "This Spirit can, once per turn, be refreshed by exhausting one of your Nexuses.",
            "cleanText": "This Spirit can, once per turn, be refreshed by exhausting one of your Nexuses",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH_BY_EXHAUSTING_NEXUS",
              "target": "self"
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
  "BS09-X35": {
    "cardNumber": "BS09-X35",
    "name": "The SupernovaDragon Siegwurm-Nova",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 6 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Tribute",
        "parameter": null,
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 190
      },
      {
        "name": "Clash",
        "parameter": null,
        "wave": 1,
        "hook": "clash",
        "bracketed": true,
        "index": 395
      }
    ],
    "abilities": [
      {
        "id": "BS09-X35#a0",
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
          "keyword": "Tribute: Cost 6 or more → Void",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from a Cost 6 or more Spirit you control to the Void",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "Tribute"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-X35#a1",
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
          "cleanBody": "When the [Tribute] was a \"Siegwurm\"-named Spirit, put cores from the Void to your Life until you have five Lives."
        },
        "clauses": [
          {
            "rawText": "When the [Tribute] was a \"Siegwurm\"-named Spirit, put cores from the Void to your Life until you have five Lives.",
            "cleanText": "When the [Tribute] was a \"Siegwurm\"-named Spirit, put cores from the Void to your Life until you have five Lives",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "RECOVER_LIFE",
              "count": 1
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-X35#a2",
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
          "cleanBody": "Destroy any number of opposing Spirits up to a total of 10000 BP."
        },
        "clauses": [
          {
            "rawText": "Destroy any number of opposing Spirits up to a total of 10000 BP.",
            "cleanText": "Destroy any number of opposing Spirits up to a total of 10000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "mode": "TOTAL_BP_LTE",
              "maxTotalBp": 10000,
              "target": {
                "side": "opp",
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
        "id": "BS09-X35#a3",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Clash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Opposing Spirits must block if possible."
        },
        "clauses": [
          {
            "rawText": "Opposing Spirits must block if possible.",
            "cleanText": "Opposing Spirits must block if possible",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "FORCE_BLOCK",
              "side": "opp"
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
  "BS09-022": {
    "cardNumber": "BS09-022",
    "name": "The Viscount Minoba",
    "keywords": [
      {
        "name": "Windstorm",
        "parameter": null,
        "wave": 1,
        "hook": "windstorm",
        "bracketed": true,
        "index": 150
      }
    ],
    "abilities": [
      {
        "id": "BS09-022#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "When this Spirit is blocked, the opponent exhausts a Spirit they control."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is blocked, the opponent exhausts a Spirit they control.",
            "cleanText": "When this Spirit is blocked, the opponent exhausts a Spirit they control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "count": 1,
              "chooser": "opp",
              "target": {
                "side": "opp",
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
        "id": "BS09-022#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
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
          "cleanBody": "All your Spirits with [Windstorm] gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with [Windstorm] gain +2000 BP.",
            "cleanText": "All your Spirits with [Windstorm] gain +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": {
                "side": "either"
              }
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
  "BS09-004": {
    "cardNumber": "BS09-004",
    "name": "The VampireDragon Wybat",
    "keywords": [
      {
        "name": "Clash",
        "parameter": null,
        "wave": 1,
        "hook": "clash",
        "bracketed": true,
        "index": 11
      }
    ],
    "abilities": [
      {
        "id": "BS09-004#a0",
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
          "keyword": "Clash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The opponent must block if possible."
        },
        "clauses": [
          {
            "rawText": "The opponent must block if possible.",
            "cleanText": "The opponent must block if possible",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "FORCE_BLOCK",
              "side": "opp"
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
  "BS09-007": {
    "cardNumber": "BS09-007",
    "name": "The WildBeast Cruger",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-007#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "Send two cores from your Trash to one of your Spirits."
        },
        "clauses": [
          {
            "rawText": "Send two cores from your Trash to one of your Spirits.",
            "cleanText": "Send two cores from your Trash to one of your Spirits",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS09-073": {
    "cardNumber": "BS09-073",
    "name": "On the Edge",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-073#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "During this turn, when Spirits are comparing BP in battle, use their Level 2 BP to compare."
        },
        "clauses": [
          {
            "rawText": "During this turn, when Spirits are comparing BP in battle, use their Level 2 BP to compare.",
            "cleanText": "when Spirits are comparing BP in battle, use their Level 2 BP to compare",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BATTLE_RULE_MODIFIER"
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
  "BS09-037": {
    "cardNumber": "BS09-037",
    "name": "Pooka",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-037#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "Treat this spirit as a Yellow spirit as well as a Purple spirit."
        },
        "clauses": [
          {
            "rawText": "Treat this spirit as a Yellow spirit as well as a Purple spirit.",
            "cleanText": "Treat this spirit as a Yellow spirit as well as a Purple spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TREAT_RULE"
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
  "BS09-062": {
    "cardNumber": "BS09-062",
    "name": "The Spring of Norn",
    "keywords": [],
    "abilities": [
      {
        "id": "BS09-062#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "TURN_TRIGGER",
          "timingLabel": "Opposing Turn",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can exhaust a Nexus you control instead for the Ice Wall of your Spirits."
        },
        "clauses": [
          {
            "rawText": "You can exhaust a Nexus you control instead for the Ice Wall of your Spirits.",
            "cleanText": "You can exhaust a Nexus you control instead for the Ice Wall of your Spirits",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "target": {
                "side": "either"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS09-062#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "Your White/Yellow Nexuses cannot be destroyed by opposing Spirit/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "Your White/Yellow Nexuses cannot be destroyed by opposing Spirit/Nexus/Magic effects.",
            "cleanText": "Your White/Yellow Nexuses cannot be destroyed by opposing Spirit/Nexus/Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "INDESTRUCTIBLE"
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
