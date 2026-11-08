/**
 * compiler/overrides/SD37.js
 * 
 * Explicit deterministic IR definitions for SD37 cards.
 */

export const SD37_OVERRIDES = {
  "SD37-012": {
    "cardNumber": "SD37-012",
    "name": "Advent Draw",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Life is reduced",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 282
      }
    ],
    "abilities": [
      {
        "id": "SD37-012#a0",
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
          "cleanBody": "Destroy any number of opposing Spirits/Ultimates up to a total of 7000 BP. Then, by paying the cost, activate this card's Main effect."
        },
        "clauses": [
          {
            "rawText": "Destroy any number of opposing Spirits/Ultimates up to a total of 7000 BP.",
            "cleanText": "Destroy any number of opposing Spirits/Ultimates up to a total of 7000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "mode": "TOTAL_BP_LTE",
              "maxTotalBp": 7000,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit",
                  "Ultimate"
                ]
              }
            }
          },
          {
            "rawText": "by paying the cost, activate this card's Main effect.",
            "cleanText": "by paying the cost, activate this card's Main effect",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CAST_MAGIC_FREE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD37-012#a1",
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
          "cleanBody": "Draw two cards. Then, you can reveal three cards from your decktop. Among them, add a Spirit card with [Advent] to your Hand. Discard any remaining cards."
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
          },
          {
            "rawText": "you can reveal three cards from your decktop.",
            "cleanText": "you can reveal three cards from your decktop",
            "link": "then",
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
            "rawText": "Among them, add a Spirit card with [Advent] to your Hand.",
            "cleanText": "Among them, add a Spirit card with [Advent] to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_TO_HAND"
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
      }
    ],
    "compiledClausesCount": 6,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD37-001": {
    "cardNumber": "SD37-001",
    "name": "Draw Genet",
    "keywords": [],
    "abilities": [
      {
        "id": "SD37-001#a0",
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
  "SD37-014": {
    "cardNumber": "SD37-014",
    "name": "Evolution Attack",
    "keywords": [],
    "abilities": [
      {
        "id": "SD37-014#a0",
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
          "cleanBody": "Destroy an opposing 10000 BP or less Spirit/Ultimate. When any Spirit/Ultimate is destroyed by this effect, refresh one of your [During Advent] Spirits, and during this turn, that Spirit gains an extra Red symbol."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 10000 BP or less Spirit/Ultimate.",
            "cleanText": "Destroy an opposing 10000 BP or less Spirit/Ultimate",
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
                  "bpLte": 10000
                }
              }
            }
          },
          {
            "rawText": "When any Spirit/Ultimate is destroyed by this effect, refresh one of your [During Advent] Spirits, and during this turn, that Spirit gains an extra Red symbol.",
            "cleanText": "When any Spirit/Ultimate is destroyed by this effect, refresh one of your [During Advent] Spirits, and during this turn, that Spirit gains an extra Red symbol",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
  "SD37-003": {
    "cardNumber": "SD37-003",
    "name": "Heatedge Wolf",
    "keywords": [],
    "abilities": [
      {
        "id": "SD37-003#a0",
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
        "id": "SD37-003#a1",
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
          "cleanBody": "You can target and attack an opposing Spirit/Ultimate."
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
  "SD37-002": {
    "cardNumber": "SD37-002",
    "name": "Pile-Puma",
    "keywords": [
      {
        "name": "Bombardment",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 183
      },
      {
        "name": "Twinkle Bombardment",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 197
      }
    ],
    "abilities": [
      {
        "id": "SD37-002#a0",
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
      },
      {
        "id": "SD37-002#a1",
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
          "cleanBody": "This Spirit's color and symbol are also treated as White."
        },
        "clauses": [
          {
            "rawText": "This Spirit's color and symbol are also treated as White.",
            "cleanText": "This Spirit's color and symbol are also treated as White",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TREAT_COLOR_SYMBOL",
              "color": "White"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD37-002#a2",
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
          "cleanBody": "The amount of cards revealed by your [Bombardment]/[Twinkle Bombardment] becomes three."
        },
        "clauses": [
          {
            "rawText": "The amount of cards revealed by your [Bombardment]/[Twinkle Bombardment] becomes three.",
            "cleanText": "The amount of cards revealed by your [Bombardment]/[Twinkle Bombardment] becomes three",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD37-013": {
    "cardNumber": "SD37-013",
    "name": "Red Lightning",
    "keywords": [],
    "abilities": [
      {
        "id": "SD37-013#a0",
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
          "cleanBody": "Destroy an opposing braved Brave. After this effect resolves, destroy an opposing 6000 BP or less Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing braved Brave.",
            "cleanText": "Destroy an opposing braved Brave",
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
                  "Brave"
                ]
              }
            }
          },
          {
            "rawText": "destroy an opposing 6000 BP or less Spirit/Ultimate.",
            "cleanText": "destroy an opposing 6000 BP or less Spirit/Ultimate",
            "link": "afterResolves",
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
                  "bpLte": 6000
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
  "SD37-004": {
    "cardNumber": "SD37-004",
    "name": "Royal Tiger Kid",
    "keywords": [],
    "abilities": [
      {
        "id": "SD37-004#a0",
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
          "cleanBody": "Destroy an opposing 5000 BP or less Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 5000 BP or less Spirit/Ultimate.",
            "cleanText": "Destroy an opposing 5000 BP or less Spirit/Ultimate",
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
                  "bpLte": 5000
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
  "SD37-006": {
    "cardNumber": "SD37-006",
    "name": "Rubyclaw Jaguar",
    "keywords": [
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 53
      }
    ],
    "abilities": [
      {
        "id": "SD37-006#a0",
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
          "cleanBody": "Return a Spirit card with [Advent] from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return a Spirit card with [Advent] from your Trash to the Hand.",
            "cleanText": "Return a Spirit card with [Advent] from your Trash to the Hand",
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
        "id": "SD37-006#a1",
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
          "cleanBody": "Destroy an opposing 6000 BP or less Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 6000 BP or less Spirit/Ultimate.",
            "cleanText": "Destroy an opposing 6000 BP or less Spirit/Ultimate",
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
                  "bpLte": 6000
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
  "BATTLE-SPIRITS-A8858": {
    "cardNumber": "BATTLE-SPIRITS-A8858",
    "name": "The BombardmentGodKing Revol-Tiger-Zero",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Emperor Beast & Cost 5 or more",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      },
      {
        "name": "Bombardment-Zero",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 198
      },
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 406
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A8858#a0",
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
          "keyword": "Advent: Emperor Beast & Cost 5 or more",
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
        "id": "BATTLE-SPIRITS-A8858#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [
            "During Advent"
          ],
          "timing": "WHEN_ADVENTS",
          "timingLabel": "When Advents/Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Bombardment-Zero",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can reveal a card from your decktop. If that card is an \"Emperor Beast\" family Spirit card, send an opposing Life to their Reserve. When it is a Spirit card with [Advent], instead, send two opposing Lives to their Reserve. Add the revealed card to the Hand."
        },
        "clauses": [
          {
            "rawText": "You can reveal a card from your decktop.",
            "cleanText": "You can reveal a card from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 1
            }
          },
          {
            "rawText": "If that card is an \"Emperor Beast\" family Spirit card, send an opposing Life to their Reserve.",
            "cleanText": "send an opposing Life to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If that card is an \"Emperor Beast\" family Spirit card",
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
          },
          {
            "rawText": "When it is a Spirit card with [Advent], instead, send two opposing Lives to their Reserve.",
            "cleanText": "When it is a Spirit card with [Advent], instead, send two opposing Lives to their Reserve",
            "link": "instead",
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
            "rawText": "Add the revealed card to the Hand.",
            "cleanText": "Add the revealed card to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_TO_HAND"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 6,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A11592": {
    "cardNumber": "BATTLE-SPIRITS-A11592",
    "name": "The NovaCannonEmperor Evol-Tiger",
    "keywords": [
      {
        "name": "Twinkle Bombardment",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 98
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11592#a0",
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
          "cleanBody": "Destroy an opposing 13000 BP or less Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 13000 BP or less Spirit/Ultimate.",
            "cleanText": "Destroy an opposing 13000 BP or less Spirit/Ultimate",
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
                  "bpLte": 13000
                }
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A11592#a1",
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
          "keyword": "Twinkle Bombardment",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "If you control any [During Advent] Spirit, you can reveal two cards from your decktop. For each \"Emperor Beast\" family Spirit card among them, send an opposing Life to their Reserve. Add the revealed cards to the Hand."
        },
        "clauses": [
          {
            "rawText": "If you control any [During Advent] Spirit, you can reveal two cards from your decktop.",
            "cleanText": "you can reveal two cards from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": "If you control any [During Advent] Spirit",
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 2
            }
          },
          {
            "rawText": "For each \"Emperor Beast\" family Spirit card among them, send an opposing Life to their Reserve.",
            "cleanText": "For each \"Emperor Beast\" family Spirit card among them, send an opposing Life to their Reserve",
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
          },
          {
            "rawText": "Add the revealed cards to the Hand.",
            "cleanText": "Add the revealed cards to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_TO_HAND"
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
  "BATTLE-SPIRITS-A11864": {
    "cardNumber": "BATTLE-SPIRITS-A11864",
    "name": "The Red Holy Relic",
    "keywords": [
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 39
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11864#a0",
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
          "cleanBody": "When you [Advent], draw a card."
        },
        "clauses": [
          {
            "rawText": "When you [Advent], draw a card.",
            "cleanText": "When you [Advent], draw a card",
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
        "id": "BATTLE-SPIRITS-A11864#a1",
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
          "cleanBody": "All your Red Spirits gain +3000 BP. Also, all your [During Advent] Spirits gain +3000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Red Spirits gain +3000 BP.",
            "cleanText": "All your Red Spirits gain +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "target": {
                "side": "self",
                "types": [
                  "Spirit"
                ],
                "color": "Red"
              },
              "all": true
            }
          },
          {
            "rawText": "all your [During Advent] Spirits gain +3000 BP.",
            "cleanText": "all your [During Advent] Spirits gain +3000 BP",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "BATTLE-SPIRITS-A12426": {
    "cardNumber": "BATTLE-SPIRITS-A12426",
    "name": "The ShieldBeast Shieldertel",
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
        "id": "BATTLE-SPIRITS-A12426#a0",
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
        "id": "BATTLE-SPIRITS-A12426#a1",
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
          "cleanBody": "When your [During Advent] Spirits are destroyed by the opponent, by discarding one of that Spirit's pre-Advent cards, it remains on the Field in the same condition."
        },
        "clauses": [
          {
            "rawText": "When your [During Advent] Spirits are destroyed by the opponent, by discarding one of that Spirit's pre-Advent cards, it remains on the Field in the same condition.",
            "cleanText": "When your [During Advent] Spirits are destroyed by the opponent, by discarding one of that Spirit's pre-Advent cards, it remains on the Field in the same condition",
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
        "id": "BATTLE-SPIRITS-A12426#a2",
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
          "cleanBody": "This Spirits gains +4000 BP."
        },
        "clauses": [
          {
            "rawText": "This Spirits gains +4000 BP.",
            "cleanText": "This Spirits gains +4000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A13122": {
    "cardNumber": "BATTLE-SPIRITS-A13122",
    "name": "The Tiger's Lair",
    "keywords": [
      {
        "name": "Advent",
        "parameter": null,
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 39
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13122#a0",
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
          "cantStack": true,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When you [Advent], destroy an opposing 10000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "When you [Advent], destroy an opposing 10000 BP or less Spirit.",
            "cleanText": "When you [Advent], destroy an opposing 10000 BP or less Spirit",
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
                  "bpLte": 10000
                }
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A13122#a1",
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
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By exhausting this Nexus, destroy an opposing attacking Spirit/Ultimate with 5000 BP or less."
        },
        "clauses": [
          {
            "rawText": "By exhausting this Nexus",
            "cleanText": "By exhausting this Nexus",
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
            "rawText": "destroy an opposing attacking Spirit/Ultimate with 5000 BP or less.",
            "cleanText": "destroy an opposing attacking Spirit/Ultimate with 5000 BP or less",
            "link": "byDoing",
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
  "BATTLE-SPIRITS-A13253": {
    "cardNumber": "BATTLE-SPIRITS-A13253",
    "name": "The TwinkleFlameFox Threetailed Fox",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Emperor Beast",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13253#a0",
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
          "keyword": "Advent: Emperor Beast",
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
        "id": "BATTLE-SPIRITS-A13253#a1",
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
          "cleanBody": "Destroy three opposing 5000 BP or less Spirits/Ultimates. For each Spirit/Ultimate destroyed by this effect, draw a card."
        },
        "clauses": [
          {
            "rawText": "Destroy three opposing 5000 BP or less Spirits/Ultimates.",
            "cleanText": "Destroy three opposing 5000 BP or less Spirits/Ultimates",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 3,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "filters": {
                  "bpLte": 5000
                }
              }
            }
          },
          {
            "rawText": "For each Spirit/Ultimate destroyed by this effect, draw a card.",
            "cleanText": "For each Spirit/Ultimate destroyed by this effect, draw a card",
            "link": null,
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD37-009": {
    "cardNumber": "SD37-009",
    "name": "The TwinkleLion Divaleon",
    "keywords": [
      {
        "name": "Advent",
        "parameter": "Emperor Beast & Cost 5 or more",
        "wave": 2,
        "hook": "advent",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD37-009#a0",
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
          "keyword": "Advent: Emperor Beast & Cost 5 or more",
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
        "id": "SD37-009#a1",
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
          "cleanBody": "Destroy any number of opposing Spirits/Ultimates, up to a total of 20000 BP."
        },
        "clauses": [
          {
            "rawText": "Destroy any number of opposing Spirits/Ultimates, up to a total of 20000 BP.",
            "cleanText": "Destroy any number of opposing Spirits/Ultimates, up to a total of 20000 BP",
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
      },
      {
        "id": "SD37-009#a2",
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
          "cleanBody": "Destroy an opposing Spirit/Ultimate with a BP equal or inferior to this Spirit's."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit/Ultimate with a BP equal or inferior to this Spirit's.",
            "cleanText": "Destroy an opposing Spirit/Ultimate with a BP equal or inferior to this Spirit's",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  }
};
