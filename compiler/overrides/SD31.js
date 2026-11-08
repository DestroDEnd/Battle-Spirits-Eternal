/**
 * compiler/overrides/SD31.js
 * 
 * Explicit deterministic IR definitions for SD31 cards.
 */

export const SD31_OVERRIDES = {
  "SD31-015": {
    "cardNumber": "SD31-015",
    "name": "Double Body Swap",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "s",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Catalyze",
        "parameter": null,
        "wave": 2,
        "hook": "catalyze",
        "bracketed": true,
        "index": 109
      }
    ],
    "abilities": [
      {
        "id": "SD31-015#a0",
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
          "burstCondition": "AFTER_YOUR_LIFE_REDUCED",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust an opposing Spirit/Ultimate. If this Burst was activated via [Catalyze], also, you can summon up to two \"Ninja Gale\" family Spirit cards from your Hand, without paying the cost. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Exhaust an opposing Spirit/Ultimate.",
            "cleanText": "Exhaust an opposing Spirit/Ultimate",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
            "rawText": "If this Burst was activated via [Catalyze], also, you can summon up to two \"Ninja Gale\" family Spirit cards from your Hand, without paying the cost.",
            "cleanText": "also, you can summon up to two \"Ninja Gale\" family Spirit cards from your Hand, without paying the cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": "If this Burst was activated via [Catalyze]",
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
            }
          },
          {
            "rawText": "by paying the cost, activate this card's Flash effect.",
            "cleanText": "by paying the cost, activate this card's Flash effect",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ACTIVATE_FLASH"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD31-015#a1",
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
          "cleanBody": "Exhaust all opposing Cost 4 or less Spirits/Ultimates."
        },
        "clauses": [
          {
            "rawText": "Exhaust all opposing Cost 4 or less Spirits/Ultimates.",
            "cleanText": "Exhaust all opposing Cost 4 or less Spirits/Ultimates",
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
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD31-013": {
    "cardNumber": "SD31-013",
    "name": "Earth Release Technique",
    "keywords": [],
    "abilities": [
      {
        "id": "SD31-013#a0",
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
          "cleanBody": "Exhaust an opposing Spirit. If [Soul Core] (Soul Core) is used to pay the cost, also, the Spirit exhausted by this effect can't refresh until after the end of the next (Opposing Refresh Step)."
        },
        "clauses": [
          {
            "rawText": "Exhaust an opposing Spirit.",
            "cleanText": "Exhaust an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
            "rawText": "If [Soul Core] (Soul Core) is used to pay the cost, also, the Spirit exhausted by this effect can't refresh until after the end of the next (Opposing Refresh Step).",
            "cleanText": "also, the Spirit exhausted by this effect can't refresh until after the end of the next (Opposing Refresh Step)",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If [Soul Core] (Soul Core) is used to pay the cost",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD31-005": {
    "cardNumber": "SD31-005",
    "name": "Shinobikogane",
    "keywords": [],
    "abilities": [
      {
        "id": "SD31-005#a0",
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
          "cleanBody": "Put a core from the Void to this Spirit. When [Soul Core](Soul Core) was used to pay the summon cost, also, put a core from the Void to another Spirit you control."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void to this Spirit.",
            "cleanText": "Put a core from the Void to this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
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
          },
          {
            "rawText": "When [Soul Core] was used to pay the summon cost, also, put a core from the Void to another Spirit you control.",
            "cleanText": "When [Soul Core] was used to pay the summon cost, also, put a core from the Void to another Spirit you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "void"
              },
              "to": {
                "zone": "field",
                "side": "self",
                "types": [
                  "Spirit"
                ]
              },
              "chooser": "self"
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
  "SD31-012": {
    "cardNumber": "SD31-012",
    "name": "Teppounanafushi",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "Cost 4 or more",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD31-012#a0",
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
          "keyword": "Brave Condition: Cost 4 or more",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": ""
        },
        "rawText": "[Brave Condition: Cost 4 or more]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD31-012#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "By discarding your entire Hand (at least one card), draw cards from your deck equal to the number of cards in the opposing Hand."
        },
        "clauses": [
          {
            "rawText": "By discarding your entire Hand (at least one card)",
            "cleanText": "By discarding your entire Hand (at least one card)",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_HAND",
              "count": "ALL"
            }
          },
          {
            "rawText": "draw cards from your deck equal to the number of cards in the opposing Hand.",
            "cleanText": "draw cards from your deck equal to the number of cards in the opposing Hand",
            "link": "byDoing",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD31-002": {
    "cardNumber": "SD31-002",
    "name": "The ArmoredMothShinobi Namitento",
    "keywords": [],
    "abilities": [
      {
        "id": "SD31-002#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "Exhaust an opposing Spirit. If [Soul Core](Soul Core) is on this Spirit, also, exhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "Exhaust an opposing Spirit.",
            "cleanText": "Exhaust an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
            "rawText": "If [Soul Core] is on this Spirit, also, exhaust an opposing Spirit.",
            "cleanText": "also, exhaust an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If [Soul Core] is on this Spirit",
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
  "SD31-003": {
    "cardNumber": "SD31-003",
    "name": "The NinjaMaster Higurashi",
    "keywords": [],
    "abilities": [
      {
        "id": "SD31-003#a0",
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
          "cleanBody": "Put a core from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void to this Spirit.",
            "cleanText": "Put a core from the Void to this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
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
        "id": "SD31-003#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_DESTROYED",
          "timingLabel": "When Destroyed by the Opponent",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust every opposing Cost 3 or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Exhaust every opposing Cost 3 or less Spirit.",
            "cleanText": "Exhaust every opposing Cost 3 or less Spirit",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD31-010": {
    "cardNumber": "SD31-010",
    "name": "The ShinobiCommander Kurohagane",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "s",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Catalyze",
        "parameter": null,
        "wave": 2,
        "hook": "catalyze",
        "bracketed": true,
        "index": 135
      }
    ],
    "abilities": [
      {
        "id": "SD31-010#a0",
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
          "cleanBody": "Exhaust an opposing Spirit. Also, if this Burst was activated via [Catalyze], exhaust an opposing Spirit/Ultimate. After this effect resolves, summon this Spirit card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Exhaust an opposing Spirit.",
            "cleanText": "Exhaust an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
            "rawText": "if this Burst was activated via [Catalyze], exhaust an opposing Spirit/Ultimate.",
            "cleanText": "exhaust an opposing Spirit/Ultimate",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": "if this Burst was activated via [Catalyze]",
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
        "id": "SD31-010#a1",
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
          "cleanBody": "When the attack of your \"Ninja Gale\" family Spirit with [Soul Core] on it reduces the opposing life, send an opposing Life to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When the attack of your \"Ninja Gale\" family Spirit with [Soul Core] on it reduces the opposing life, send an opposing Life to their Reserve.",
            "cleanText": "When the attack of your \"Ninja Gale\" family Spirit with [Soul Core] on it reduces the opposing life, send an opposing Life to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "life",
                "side": "opp"
              },
              "to": {
                "zone": "reserve",
                "side": "opp"
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
  "SD31-011": {
    "cardNumber": "SD31-011",
    "name": "The StrangeFangGreatShinobi Hyousouga",
    "keywords": [],
    "abilities": [
      {
        "id": "SD31-011#a0",
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
          "cleanBody": "Exhaust three opposing Spirits/Ultimates."
        },
        "clauses": [
          {
            "rawText": "Exhaust three opposing Spirits/Ultimates.",
            "cleanText": "Exhaust three opposing Spirits/Ultimates",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
              "count": 3,
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD31-009": {
    "cardNumber": "SD31-009",
    "name": "The WindDemonGreatShinobi Highwind",
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
        "id": "SD31-009#a0",
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
          "burstCondition": "AFTER_YOUR_LIFE_REDUCED",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Refresh a \"Ninja Gale\" family Spirit you control. After this effect resolves, summon this Spirit card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Refresh a \"Ninja Gale\" family Spirit you control.",
            "cleanText": "Refresh a \"Ninja Gale\" family Spirit you control",
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
        "id": "SD31-009#a1",
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
          "cleanBody": "At the end of battle, you can return this Spirit to the Hand. If this Spirit was returned to the Hand by this effect, you can set a card with Burst effect from your Hand."
        },
        "clauses": [
          {
            "rawText": "At the end of battle, you can return this Spirit to the Hand.",
            "cleanText": "At the end of battle, you can return this Spirit to the Hand",
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
            "rawText": "If this Spirit was returned to the Hand by this effect, you can set a card with Burst effect from your Hand.",
            "cleanText": "you can set a card with Burst effect from your Hand",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": "If this Spirit was returned to the Hand by this effect",
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
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
  "SD31-007": {
    "cardNumber": "SD31-007",
    "name": "The WindDemon Benimatoi",
    "keywords": [],
    "abilities": [
      {
        "id": "SD31-007#a0",
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
          "cleanBody": "Put a core from the Void to your Reserve. Also , if [Soul Core] is on this Spirit, exhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void to your Reserve.",
            "cleanText": "Put a core from the Void to your Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
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
            "rawText": "Also , if [Soul Core] is on this Spirit, exhaust an opposing Spirit.",
            "cleanText": "Also , if [Soul Core] is on this Spirit, exhaust an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
  "SD31-X01": {
    "cardNumber": "SD31-X01",
    "name": "The WhirlwindNinja Kirikage",
    "keywords": [
      {
        "name": "Soul Swift",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD31-X01#a0",
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
          "keyword": "Soul Swift",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "You can summon this Spirit card from your Hand by using [Soul Core](Soul Core) from the Reserve to pay the entire summon cost and cores from the Reserve to put onto it."
        },
        "clauses": [
          {
            "rawText": "You can summon this Spirit card from your Hand by using [Soul Core] from the Reserve to pay the entire summon cost and cores from the Reserve to put onto it.",
            "cleanText": "You can summon this Spirit card from your Hand by using [Soul Core] from the Reserve to pay the entire summon cost and cores from the Reserve to put onto it",
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
        "id": "SD31-X01#a1",
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
          "cleanBody": "By sending [Soul Core](Soul Core) from this Spirit to the Trash, immediately activate one of your Green Soul Bursts."
        },
        "clauses": [
          {
            "rawText": "By sending [Soul Core] from this Spirit to the Trash",
            "cleanText": "By sending [Soul Core] from this Spirit to the Trash",
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
            "rawText": "immediately activate one of your Green Soul Bursts.",
            "cleanText": "immediately activate one of your Green Soul Bursts",
            "link": "byDoing",
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
        "id": "SD31-X01#a2",
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
          "cleanBody": "Exhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "Exhaust an opposing Spirit.",
            "cleanText": "Exhaust an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD31-014": {
    "cardNumber": "SD31-014",
    "name": "Thousand Shuriken",
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
        "id": "SD31-014#a0",
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
          "burstCondition": "AFTER_TRIGGER_CONDITION",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust two opposing Spirits, and put two cores from the Void to your Reserve. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Exhaust two opposing Spirits",
            "cleanText": "Exhaust two opposing Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
              "count": 2,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "put two cores from the Void to your Reserve.",
            "cleanText": "put two cores from the Void to your Reserve",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 2,
              "from": {
                "zone": "void"
              },
              "to": {
                "zone": "reserve",
                "side": "self",
                "types": [
                  "Spirit"
                ]
              },
              "chooser": "self"
            }
          },
          {
            "rawText": "by paying the cost, activate this card's Flash effect.",
            "cleanText": "by paying the cost, activate this card's Flash effect",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ACTIVATE_FLASH"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD31-014#a1",
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
          "cleanBody": "During this turn, give a Spirit +4000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +4000 BP.",
            "cleanText": "give a Spirit +4000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 4000,
              "target": "target",
              "duration": "DURING_THIS_TURN"
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
  "SD31-008": {
    "cardNumber": "SD31-008",
    "name": "The StrangeFangShinobi Sendougitsune",
    "keywords": [],
    "abilities": [
      {
        "id": "SD31-008#a0",
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
          "cleanBody": "Catalyze: All Color (When Attacks) By sending [Soul Core](Soul Core) from this Spirit to your trash, immediately activate your set Soul Burst."
        },
        "clauses": [
          {
            "rawText": "Catalyze: All Color (When Attacks) By sending [Soul Core] from this Spirit to your trash, immediately activate your set Soul Burst.",
            "cleanText": "Catalyze: All Color (When Attacks) By sending [Soul Core] from this Spirit to your trash, immediately activate your set Soul Burst",
            "link": null,
            "isOptional": false,
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
        "id": "SD31-008#a1",
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
          "cleanBody": "Exhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "Exhaust an opposing Spirit.",
            "cleanText": "Exhaust an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "isHeavy": false,
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
  }
};
