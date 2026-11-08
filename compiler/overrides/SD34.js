export const SD34_OVERRIDES = {
  "SD34-001": {
    "cardNumber": "SD34-001",
    "name": "Crystaneedle",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-001#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "STEP_RESTRICTED",
          "timingLabel": "When Depleted/Destroyed by the Opponent",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing Nexus."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Nexus.",
            "cleanText": "Destroy an opposing Nexus",
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
                  "Nexus"
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
  "SD34-005": {
    "cardNumber": "SD34-005",
    "name": "Darkness Wyvern",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-005#a0",
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
          "cleanBody": "Draw a card. If [Soul Core] (Soul Core) is used to pay the summon cost, instead, destroy an opposing exhausted Spirit."
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
          },
          {
            "rawText": "If [Soul Core] (Soul Core) is used to pay the summon cost, instead, destroy an opposing exhausted Spirit.",
            "cleanText": "destroy an opposing exhausted Spirit",
            "link": "instead",
            "isOptional": false,
            "isCost": false,
            "condition": "If [Soul Core] (Soul Core) is used to pay the summon cost",
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
                  "state": "EXHAUSTED"
                }
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD34-005#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [
            "When Braved"
          ],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Treat this Spirit's color as colorless."
        },
        "clauses": [
          {
            "rawText": "Treat this Spirit's color as colorless.",
            "cleanText": "Treat this Spirit's color as colorless",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD34-006": {
    "cardNumber": "SD34-006",
    "name": "Death Claw Dragon",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "SD34-014": {
    "cardNumber": "SD34-014",
    "name": "Death Shoot",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-014#a0",
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
          "cleanBody": "Send a core from any opposing Spirit/Ultimate to their Reserve. If [Soul Core] (Soul Core) is used to pay the cost, instead, destroy an opposing Cost 5 or less exhausted Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Send a core from any opposing Spirit/Ultimate to their Reserve.",
            "cleanText": "Send a core from any opposing Spirit/Ultimate to their Reserve",
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
            "rawText": "If [Soul Core] (Soul Core) is used to pay the cost, instead, destroy an opposing Cost 5 or less exhausted Spirit/Ultimate.",
            "cleanText": "destroy an opposing Cost 5 or less exhausted Spirit/Ultimate",
            "link": "instead",
            "isOptional": false,
            "isCost": false,
            "condition": "If [Soul Core] (Soul Core) is used to pay the cost",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD34-X01": {
    "cardNumber": "SD34-X01",
    "name": "Dragon Demon-God",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "[Right",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD34-X01#a0",
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
          "keyword": "Brave Condition: [Right",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Cost 4 or more<br>[Left] Cost 4 or more]"
        },
        "rawText": "[Brave Condition: [Right] Cost 4 or more<br>[Left] Cost 4 or more]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD34-X01#a1",
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
          "cleanBody": "This Brave doesn't exhaust, and while in Spirit condition, can't attack or block."
        },
        "clauses": [
          {
            "rawText": "This Brave doesn't exhaust, and while in Spirit condition, can't attack or block.",
            "cleanText": "This Brave doesn't exhaust, and while in Spirit condition, can't attack or block",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SET_RESTRICTION",
              "restriction": "CANNOT_ATTACK_OR_BLOCK"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD34-X01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "When Braved on Right",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "By destroying an opposing exhausted Spirit, put a core from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "By destroying an opposing exhausted Spirit",
            "cleanText": "By destroying an opposing exhausted Spirit",
            "link": null,
            "isOptional": false,
            "isCost": true,
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
            "rawText": "put a core from the Void to this Spirit.",
            "cleanText": "put a core from the Void to this Spirit",
            "link": "byDoing",
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
        "id": "SD34-X01#a3",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "When Braved on Left",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "By exhausting an opposing Spirit, draw a card."
        },
        "clauses": [
          {
            "rawText": "By exhausting an opposing Spirit",
            "cleanText": "By exhausting an opposing Spirit",
            "link": null,
            "isOptional": false,
            "isCost": true,
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD34-007": {
    "cardNumber": "SD34-007",
    "name": "Flying Snake",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-007#a0",
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
          "cleanBody": "Send two cores from any opposing Spirits to the Reserve."
        },
        "clauses": [
          {
            "rawText": "Send two cores from any opposing Spirits to the Reserve.",
            "cleanText": "Send two cores from any opposing Spirits to the Reserve",
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
        "id": "SD34-007#a1",
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
          "cleanBody": "Send a core from any opposing Spirit/Ultimate to their Reserve."
        },
        "clauses": [
          {
            "rawText": "Send a core from any opposing Spirit/Ultimate to their Reserve.",
            "cleanText": "Send a core from any opposing Spirit/Ultimate to their Reserve",
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
  "SD34-012": {
    "cardNumber": "SD34-012",
    "name": "Necro Reverse",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-012#a0",
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
          "cleanBody": "Summon a Cost 3 or less Spirit card from your Trash, without paying the cost. At the end of battle, destroy the Spirit summoned by this effect. This effect can only be used during (Opposing Attack Step)."
        },
        "clauses": [
          {
            "rawText": "Summon a Cost 3 or less Spirit card from your Trash, without paying the cost.",
            "cleanText": "Summon a Cost 3 or less Spirit card from your Trash, without paying the cost",
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
            "rawText": "At the end of battle, destroy the Spirit summoned by this effect.",
            "cleanText": "At the end of battle, destroy the Spirit summoned by this effect",
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
            "rawText": "This effect can only be used during (Opposing Attack Step).",
            "cleanText": "This effect can only be used during (Opposing Attack Step)",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
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
  "SD34-013": {
    "cardNumber": "SD34-013",
    "name": "Nightmare Drain",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit/Ultimate is destroyed by the opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD34-013#a0",
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
          "cleanBody": "Send two cores from any opposing Spirits/Ultimates to the Trash. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Send two cores from any opposing Spirits/Ultimates to the Trash.",
            "cleanText": "Send two cores from any opposing Spirits/Ultimates to the Trash",
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
        "id": "SD34-013#a1",
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
          "cleanBody": "Send one core each from every opposing Cost 4 or less Spirit/Ultimate to their Reserve."
        },
        "clauses": [
          {
            "rawText": "Send one core each from every opposing Cost 4 or less Spirit/Ultimate to their Reserve.",
            "cleanText": "Send one core each from every opposing Cost 4 or less Spirit/Ultimate to their Reserve",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD34-002": {
    "cardNumber": "SD34-002",
    "name": "Shaznake",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-002#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "STEP_RESTRICTED",
          "timingLabel": "When Depleted/Destroyed by the Opponent",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust an opposing Spirit/Ultimate."
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
  "SD34-011": {
    "cardNumber": "SD34-011",
    "name": "The Amethyst Ancient Palace",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-011#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_DEPLOYED",
          "timingLabel": "When Deployed",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can reveal five cards from your decktop. Among them, add a \"Death Dragon\" family Spirit card, or an \"Imagine\" family Brave card to the Hand. Return the remaining cards to the deckbottom in any order."
        },
        "clauses": [
          {
            "rawText": "You can reveal five cards from your decktop.",
            "cleanText": "You can reveal five cards from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 5
            }
          },
          {
            "rawText": "Among them, add a \"Death Dragon\" family Spirit card, or an \"Imagine\" family Brave card to the Hand.",
            "cleanText": "Among them, add a \"Death Dragon\" family Spirit card, or an \"Imagine\" family Brave card to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          },
          {
            "rawText": "Return the remaining cards to the deckbottom in any order.",
            "cleanText": "Return the remaining cards to the deckbottom in any order",
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
      },
      {
        "id": "SD34-011#a1",
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
          "cleanBody": "All your Spirits that activated a \"When depleted/destroyed by the Opponent\" effect return to your Hand rather than the Trash."
        },
        "clauses": [
          {
            "rawText": "All your Spirits that activated a \"When depleted/destroyed by the Opponent\" effect return to your Hand rather than the Trash.",
            "cleanText": "All your Spirits that activated a \"When depleted/destroyed by the Opponent\" effect return to your Hand rather than the Trash",
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
  "SD34-008": {
    "cardNumber": "SD34-008",
    "name": "The CrystalDragon Amethyst-Dragon",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-008#a0",
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
          "cleanBody": "You can summon an \"Imagine\" family Brave card from your Hand/Trash, without paying the cost. When a Brave is summoned via this effect, draw two cards."
        },
        "clauses": [
          {
            "rawText": "You can summon an \"Imagine\" family Brave card from your Hand/Trash, without paying the cost.",
            "cleanText": "You can summon an \"Imagine\" family Brave card from your Hand/Trash, without paying the cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
            }
          },
          {
            "rawText": "When a Brave is summoned via this effect, draw two cards.",
            "cleanText": "When a Brave is summoned via this effect, draw two cards",
            "link": null,
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD34-008#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [
            "When Braved"
          ],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When any opposing Spirit is depleted/destroyed by the [When Braved] effect of the Brave braving to this Spirit, send an opposing Life to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When any opposing Spirit is depleted/destroyed by the [When Braved] effect of the Brave braving to this Spirit, send an opposing Life to their Reserve.",
            "cleanText": "When any opposing Spirit is depleted/destroyed by the [When Braved] effect of the Brave braving to this Spirit, send an opposing Life to their Reserve",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD34-010": {
    "cardNumber": "SD34-010",
    "name": "The DeathDragonGreatEmperor Bascarl",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-010#a0",
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
          "cleanBody": "The opponent sends four cores from their Spirits/Ultimates to their Trash."
        },
        "clauses": [
          {
            "rawText": "The opponent sends four cores from their Spirits/Ultimates to their Trash.",
            "cleanText": "The opponent sends four cores from their Spirits/Ultimates to their Trash",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD34-010#a1",
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
          "cleanBody": "Unless the opponent sends two cores from one of their Spirits to their Trash, they can't block."
        },
        "clauses": [
          {
            "rawText": "Unless the opponent sends two cores from one of their Spirits to their Trash, they can't block.",
            "cleanText": "Unless the opponent sends two cores from one of their Spirits to their Trash, they can't block",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD34-009": {
    "cardNumber": "SD34-009",
    "name": "The EvilDragon Deslar",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Life is reduced",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD34-009#a0",
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
          "cleanBody": "Summon this Spirit card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Summon this Spirit card without paying the cost.",
            "cleanText": "Summon this Spirit card without paying the cost",
            "link": null,
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
        "id": "SD34-009#a1",
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
          "cleanBody": "Draw two cards."
        },
        "clauses": [
          {
            "rawText": "Draw two cards.",
            "cleanText": "Draw two cards",
            "link": null,
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD34-009#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [
            "When Braved"
          ],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit gains +7000 BP."
        },
        "clauses": [
          {
            "rawText": "This Spirit gains +7000 BP.",
            "cleanText": "This Spirit gains +7000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 7000,
              "target": "self",
              "duration": "THIS_TURN"
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
  "SD34-003": {
    "cardNumber": "SD34-003",
    "name": "The SnakeMonk Harim",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-003#a0",
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
      },
      {
        "id": "SD34-003#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "STEP_RESTRICTED",
          "timingLabel": "When Depleted/Destroyed by the Opponent",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust an opposing Spirit/Ultimate."
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
  "SD34-004": {
    "cardNumber": "SD34-004",
    "name": "The SnakeBrawler Jagi",
    "keywords": [],
    "abilities": [
      {
        "id": "SD34-004#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "STEP_RESTRICTED",
          "timingLabel": "When Depleted/Destroyed by the Opponent",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Send three cores from an opposing Spirit/Ultimate to their Reserve."
        },
        "clauses": [
          {
            "rawText": "Send three cores from an opposing Spirit/Ultimate to their Reserve.",
            "cleanText": "Send three cores from an opposing Spirit/Ultimate to their Reserve",
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
        "id": "SD34-004#a1",
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
          "cleanBody": "While [Soul Core] (Soul Core) is on this Spirit, all your \"Dark Snake\"/\"Death Dragon\" family Spirits gain +4000 BP."
        },
        "clauses": [
          {
            "rawText": "While [Soul Core] (Soul Core) is on this Spirit, all your \"Dark Snake\"/\"Death Dragon\" family Spirits gain +4000 BP.",
            "cleanText": "all your \"Dark Snake\"/\"Death Dragon\" family Spirits gain +4000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While [Soul Core] (Soul Core) is on this Spirit",
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 4000,
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
  }
};
