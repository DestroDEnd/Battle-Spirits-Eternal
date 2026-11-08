/**
 * compiler/overrides/SD38.js
 * 
 * Explicit deterministic IR definitions for SD38 cards.
 */

export const SD38_OVERRIDES = {
  "BATTLE-SPIRITS-A74": {
    "cardNumber": "BATTLE-SPIRITS-A74",
    "name": "The WingDragonEmperor Siegfried-Vert",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Cost 6 or more",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A74#a0",
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
          "cleanBody": "By sending your [Soul Core] to the Trash, stack this card from your Hand onto your target Spirit."
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
            "rawText": "stack this card from your Hand onto your target Spirit.",
            "cleanText": "stack this card from your Hand onto your target Spirit",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADVENT"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A74#a1",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Refresh all your [During Advent] Spirits."
        },
        "clauses": [
          {
            "rawText": "Refresh all your [During Advent] Spirits.",
            "cleanText": "Refresh all your [During Advent] Spirits",
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
      },
      {
        "id": "BATTLE-SPIRITS-A74#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [
            "During Advent"
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
          "cleanBody": "You can target and attack an opposing Spirit/Ultimate. When you've done so, at the end of battle, this Spirit refreshes."
        },
        "clauses": [
          {
            "rawText": "You can target and attack an opposing Spirit/Ultimate.",
            "cleanText": "You can target and attack an opposing Spirit/Ultimate",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET_ATTACK",
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "at the end of battle, this Spirit refreshes.",
            "cleanText": "at the end of battle, this Spirit refreshes",
            "link": "byDoing",
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
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A3004": {
    "cardNumber": "BATTLE-SPIRITS-A3004",
    "name": "Binding Petal",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A3004#a0",
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
          "cleanBody": "Exhaust an opposing Spirit. Then, if you control any [During Advent] Spirit, return an opposing exhausted Spirit to the Hand."
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
            "rawText": "if you control any [During Advent] Spirit, return an opposing exhausted Spirit to the Hand.",
            "cleanText": "return an opposing exhausted Spirit to the Hand",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": "if you control any [During Advent] Spirit",
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
  "SD38-012": {
    "cardNumber": "SD38-012",
    "name": "Bird Kick",
    "keywords": [],
    "abilities": [
      {
        "id": "SD38-012#a0",
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
          "cleanBody": "During this turn, give one of your Spirits +5000 BP. If you control any [During Advent] Spirit, also, refresh one of your Spirits."
        },
        "clauses": [
          {
            "rawText": "During this turn, give one of your Spirits +5000 BP.",
            "cleanText": "give one of your Spirits +5000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 5000,
              "target": {
                "side": "either"
              }
            }
          },
          {
            "rawText": "If you control any [During Advent] Spirit, also, refresh one of your Spirits.",
            "cleanText": "also, refresh one of your Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control any [During Advent] Spirit",
            "duration": null,
            "op": {
              "op": "REFRESH",
              "count": 1,
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD38-003": {
    "cardNumber": "SD38-003",
    "name": "Bluelegge",
    "keywords": [],
    "abilities": [
      {
        "id": "SD38-003#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "You can reveal two cards from your decktop. Among them, summon any number of Spirit cards up to a total cost of 5, without paying the cost. Discard any remaining cards."
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
            "rawText": "Among them, summon any number of Spirit cards up to a total cost of 5, without paying the cost.",
            "cleanText": "Among them, summon any number of Spirit cards up to a total cost of 5, without paying the cost",
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
            "rawText": "Discard any remaining cards.",
            "cleanText": "Discard any remaining cards",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_REVEALED"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD38-003#a1",
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
          "cleanBody": "This Spirit refreshes."
        },
        "clauses": [
          {
            "rawText": "This Spirit refreshes.",
            "cleanText": "This Spirit refreshes",
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
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD38-004": {
    "cardNumber": "SD38-004",
    "name": "Glasswallow",
    "keywords": [],
    "abilities": [
      {
        "id": "SD38-004#a0",
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
          "cleanBody": "The opponent exhaust one of their Spirits."
        },
        "clauses": [
          {
            "rawText": "The opponent exhaust one of their Spirits.",
            "cleanText": "The opponent exhaust one of their Spirits",
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
        "id": "SD38-004#a1",
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
  "SD38-002": {
    "cardNumber": "SD38-002",
    "name": "Ohayashi Bird",
    "keywords": [],
    "abilities": [
      {
        "id": "SD38-002#a0",
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
          "cleanBody": "Put a core from the Void to your Reserve."
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD38-002#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
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
  "SD38-001": {
    "cardNumber": "SD38-001",
    "name": "Shiroena",
    "keywords": [
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD38-001#a0",
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
          "keyword": "High Speed",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "This Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve."
        },
        "clauses": [
          {
            "rawText": "This Spirit card in Hand can be summoned by paying the cost with cores in the Reserve.",
            "cleanText": "This Spirit card in Hand can be summoned by paying the cost with cores in the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_RESERVE_ONLY"
            }
          },
          {
            "rawText": "In this case, cores to be put on this Spirit must also be from the Reserve.",
            "cleanText": "In this case, cores to be put on this Spirit must also be from the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_RESERVE_ONLY"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD38-001#a1",
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
          "cleanBody": "By sending two cores from your Reserve to your Trash, return this Spirit to the Hand."
        },
        "clauses": [
          {
            "rawText": "By sending two cores from your Reserve to your Trash",
            "cleanText": "By sending two cores from your Reserve to your Trash",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
            }
          },
          {
            "rawText": "return this Spirit to the Hand.",
            "cleanText": "return this Spirit to the Hand",
            "link": "byDoing",
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
  "SD38-005": {
    "cardNumber": "SD38-005",
    "name": "Silver Leaf Eagle",
    "keywords": [
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD38-005#a0",
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
          "keyword": "High Speed",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "This Spirit card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Spirit must also be from the Reserve."
        },
        "clauses": [
          {
            "rawText": "This Spirit card in Hand can be summoned by paying the cost with cores in the Reserve.",
            "cleanText": "This Spirit card in Hand can be summoned by paying the cost with cores in the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_RESERVE_ONLY"
            }
          },
          {
            "rawText": "In this case, cores to be put on this Spirit must also be from the Reserve.",
            "cleanText": "In this case, cores to be put on this Spirit must also be from the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_RESERVE_ONLY"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD38-005#a1",
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
          "cleanBody": "Return an opposing exhausted Spirit/Ultimate to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return an opposing exhausted Spirit/Ultimate to the Hand.",
            "cleanText": "Return an opposing exhausted Spirit/Ultimate to the Hand",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD38-013": {
    "cardNumber": "SD38-013",
    "name": "Sonic Wind",
    "keywords": [],
    "abilities": [
      {
        "id": "SD38-013#a0",
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
          "cleanBody": "Exhaust an opposing Spirit/Ultimate. Then, during this turn, when the attack of your [During Advent] Spirits reduces the opposing Life, send an opposing Life to their Reserve."
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
            "rawText": "during this turn, when the attack of your [During Advent] Spirits reduces the opposing Life, send an opposing Life to their Reserve.",
            "cleanText": "when the attack of your [During Advent] Spirits reduces the opposing Life, send an opposing Life to their Reserve",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD38-011": {
    "cardNumber": "SD38-011",
    "name": "The Phoenix's Tailfeathers",
    "keywords": [],
    "abilities": [
      {
        "id": "SD38-011#a0",
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
          "cantStack": true,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "By not putting a core from the Void to your Reserve, draw a card."
        },
        "clauses": [
          {
            "rawText": "By not putting a core from the Void to your Reserve",
            "cleanText": "By not putting a core from the Void to your Reserve",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
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
      },
      {
        "id": "SD38-011#a1",
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
          "cleanBody": "When your \"Winged Beast\" family Spirits are destroyed, by exhausting this Nexus, one of those Spirits remains on the Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "When your \"Winged Beast\" family Spirits are destroyed, by exhausting this Nexus, one of those Spirits remains on the Field, exhausted.",
            "cleanText": "When your \"Winged Beast\" family Spirits are destroyed, by exhausting this Nexus, one of those Spirits remains on the Field, exhausted",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "target": "self"
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
  "SD38-007": {
    "cardNumber": "SD38-007",
    "name": "The StrikerBird Bruce-Kei",
    "keywords": [],
    "abilities": [
      {
        "id": "SD38-007#a0",
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
          "cleanBody": "When this Spirit is destroyed by opposing effects, it remains on the Field, in the same condition."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is destroyed by opposing effects, it remains on the Field, in the same condition.",
            "cleanText": "When this Spirit is destroyed by opposing effects, it remains on the Field, in the same condition",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "RESURRECT"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD38-007#a1",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD38-009": {
    "cardNumber": "SD38-009",
    "name": "The TribalBird Tyranbird",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is depleted/destroyed by the opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD38-009#a0",
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
          "cleanBody": "Summon this card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Summon this card without paying the cost.",
            "cleanText": "Summon this card without paying the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_FREE",
              "target": "this_card",
              "from": "BURST"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD38-009#a1",
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
          "cleanBody": "You can reveal three cards from your decktop. Among them, summon any number of Green Spirit cards up to a total cost of 6, without paying the cost. Return any remaining cards to the decktop. Also, during this turn, when your Spirits are depleted/destroyed by the opponent, returns them to the Hand."
        },
        "clauses": [
          {
            "rawText": "You can reveal three cards from your decktop.",
            "cleanText": "You can reveal three cards from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 3
            }
          },
          {
            "rawText": "Among them, summon any number of Green Spirit cards up to a total cost of 6, without paying the cost.",
            "cleanText": "Among them, summon any number of Green Spirit cards up to a total cost of 6, without paying the cost",
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
            "rawText": "Return any remaining cards to the decktop.",
            "cleanText": "Return any remaining cards to the decktop",
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
          },
          {
            "rawText": "during this turn, when your Spirits are depleted/destroyed by the opponent, returns them to the Hand.",
            "cleanText": "when your Spirits are depleted/destroyed by the opponent, returns them to the Hand",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD38-010": {
    "cardNumber": "SD38-010",
    "name": "The TwinkleEmperor Simurgh",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Winged Beast & Cost 5 or more",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD38-010#a0",
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
          "keyword": "Advent: Winged Beast & Cost 5 or more",
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
        "id": "SD38-010#a1",
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
      },
      {
        "id": "SD38-010#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
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
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By discarding a pre-Advent card beneath this Spirit, return all opposing exhausted Spirits/Ultimates to the deckbottom in any order."
        },
        "clauses": [
          {
            "rawText": "By discarding a pre-Advent card beneath this Spirit",
            "cleanText": "By discarding a pre-Advent card beneath this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_PRE_ADVENT",
              "count": 1,
              "target": "SELF_STACK"
            }
          },
          {
            "rawText": "return all opposing exhausted Spirits/Ultimates to the deckbottom in any order.",
            "cleanText": "return all opposing exhausted Spirits/Ultimates to the deckbottom in any order",
            "link": "byDoing",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A13289": {
    "cardNumber": "BATTLE-SPIRITS-A13289",
    "name": "The TwinkleWingsBird Gerygale",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Cost 3 or more",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13289#a0",
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
          "keyword": "Advent: Cost 3 or more",
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
        "id": "BATTLE-SPIRITS-A13289#a1",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit refreshes, and during this turn, it gains +5000 BP."
        },
        "clauses": [
          {
            "rawText": "This Spirit refreshes, and during this turn, it gains +5000 BP.",
            "cleanText": "This Spirit refreshes, and during this turn, it gains +5000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "REFRESH",
              "target": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A13289#a2",
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
          "cleanBody": "When only the opposing Spirit/Ultimate is destroyed by comparing BP, send an opposing Life to their Trash."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit/Ultimate is destroyed by comparing BP, send an opposing Life to their Trash.",
            "cleanText": "When only the opposing Spirit/Ultimate is destroyed by comparing BP, send an opposing Life to their Trash",
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
  "BATTLE-SPIRITS-A13613": {
    "cardNumber": "BATTLE-SPIRITS-A13613",
    "name": "The WindTwinkleBird Peregriff",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Winged Beast",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13613#a0",
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
          "keyword": "Advent: Winged Beast",
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
        "id": "BATTLE-SPIRITS-A13613#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ADVENTS",
          "timingLabel": "When Advents",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Put two cores from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "Put two cores from the Void to this Spirit.",
            "cleanText": "Put two cores from the Void to this Spirit",
            "link": null,
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
                "zone": "field",
                "target": "self"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A13613#a2",
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
          "cleanBody": "By returning a pre-Advent card from beneath this Spirit to the Hand, this Spirit remains on the Field, in the same condition."
        },
        "clauses": [
          {
            "rawText": "By returning a pre-Advent card from beneath this Spirit to the Hand",
            "cleanText": "By returning a pre-Advent card from beneath this Spirit to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": true,
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
            "rawText": "this Spirit remains on the Field, in the same condition.",
            "cleanText": "this Spirit remains on the Field, in the same condition",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "RESURRECT"
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
  }
};
