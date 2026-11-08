export const SD19_OVERRIDES = {
  "SD19-X01": {
    "cardNumber": "SD19-X01",
    "name": "Ultimate-Siegfried",
    "keywords": [
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV3",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 57
      },
      {
        "name": "True-Awaken",
        "parameter": null,
        "wave": 1,
        "hook": "awaken",
        "bracketed": true,
        "index": 313
      }
    ],
    "abilities": [
      {
        "id": "SD19-X01#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Red Spirits"
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
          "cleanBody": ""
        },
        "rawText": "[Summon Condition: You control one or more Red Spirits]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD19-X01#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3,
            4,
            5
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Ultimate Trigger",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When Ultimate Trigger hits, the opponent must block if possible. However, Ultimates don't have to block. If blocked by an opposing Spirit, send an opposing Life to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When Ultimate Trigger hits, the opponent must block if possible.",
            "cleanText": "When Ultimate Trigger hits, the opponent must block if possible",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "FORCE_BLOCK",
              "side": "opp"
            }
          },
          {
            "rawText": "Ultimates don't have to block.",
            "cleanText": "Ultimates don't have to block",
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
            "rawText": "If blocked by an opposing Spirit, send an opposing Life to their Reserve.",
            "cleanText": "send an opposing Life to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If blocked by an opposing Spirit",
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
      },
      {
        "id": "SD19-X01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            4,
            5
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "True-Awaken",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By sending a core from Spirits you control to this Ultimate, this Ultimate gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "By sending a core from Spirits you control to this Ultimate",
            "cleanText": "By sending a core from Spirits you control to this Ultimate",
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
            "rawText": "this Ultimate gains +3000 BP.",
            "cleanText": "this Ultimate gains +3000 BP",
            "link": "byDoing",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD19-007": {
    "cardNumber": "SD19-007",
    "name": "Aizendragon",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-007#a0",
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
          "cleanBody": "Destroy an opposing 3000 BP or less Spirit. If you control any Ultimate, also, draw a card."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 3000 BP or less Spirit.",
            "cleanText": "Destroy an opposing 3000 BP or less Spirit",
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
          },
          {
            "rawText": "If you control any Ultimate, also, draw a card.",
            "cleanText": "also, draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control any Ultimate",
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
  },
  "SD19-005": {
    "cardNumber": "SD19-005",
    "name": "Edge-Wolf",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-005#a0",
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
          "cleanBody": "This Spirit gains +3000 BP. While you control any Ultimate, also, this Spirit gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "This Spirit gains +3000 BP.",
            "cleanText": "This Spirit gains +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "target": "self",
              "duration": "THIS_TURN"
            }
          },
          {
            "rawText": "While you control any Ultimate, also, this Spirit gains +3000 BP.",
            "cleanText": "also, this Spirit gains +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you control any Ultimate",
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "target": "self",
              "duration": "THIS_TURN"
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
  "SD19-001": {
    "cardNumber": "SD19-001",
    "name": "Fizard",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "SD19-015": {
    "cardNumber": "SD19-015",
    "name": "Flame Spark",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-015#a0",
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
          "cleanBody": "Destroy any number of opposing Spirits up to a total of 5000 BP. When this effect destroys any Spirit, return a Spirit card from the Trash to your Hand."
        },
        "clauses": [
          {
            "rawText": "Destroy any number of opposing Spirits up to a total of 5000 BP.",
            "cleanText": "Destroy any number of opposing Spirits up to a total of 5000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "mode": "TOTAL_BP_LTE",
              "maxTotalBp": 5000,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "When this effect destroys any Spirit, return a Spirit card from the Trash to your Hand.",
            "cleanText": "When this effect destroys any Spirit, return a Spirit card from the Trash to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SALVAGE",
              "count": 1,
              "family": null,
              "targetType": "Spirit",
              "destination": "HAND"
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
  "SD19-002": {
    "cardNumber": "SD19-002",
    "name": "Mugendra",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-002#a0",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD19-013": {
    "cardNumber": "SD19-013",
    "name": "Neo-Double Draw",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-013#a0",
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
          "cleanBody": "Draw two cards. Also, if you control any Ultimate, draw a card."
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
            "rawText": "if you control any Ultimate, draw a card.",
            "cleanText": "draw a card",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": "if you control any Ultimate",
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
        "id": "SD19-013#a1",
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
          "cleanBody": "During this turn, give a Spirit/Ultimate +1000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit/Ultimate +1000 BP.",
            "cleanText": "give a Spirit/Ultimate +1000 BP",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD19-016": {
    "cardNumber": "SD19-016",
    "name": "Neo-Flame Tempest",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-016#a0",
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
          "cleanBody": "Destroy an opposing 8000 BP or less Spirit. Or, destroy all 4000 BP or less Spirits."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 8000 BP or less Spirit.",
            "cleanText": "Destroy an opposing 8000 BP or less Spirit",
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
                  "bpLte": 8000
                }
              }
            }
          },
          {
            "rawText": "destroy all 4000 BP or less Spirits.",
            "cleanText": "destroy all 4000 BP or less Spirits",
            "link": "or",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "all": true,
              "target": {
                "side": "either",
                "types": [
                  "Spirit"
                ],
                "maxBp": 4000
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
  "SD19-003": {
    "cardNumber": "SD19-003",
    "name": "Rookie-Ryuuman",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-003#a0",
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
  "SD19-012": {
    "cardNumber": "SD19-012",
    "name": "The Red Dawn Sky",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-012#a0",
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
          "cleanBody": "If the first attack of the turn is made by your Ultimate, draw a card."
        },
        "clauses": [
          {
            "rawText": "If the first attack of the turn is made by your Ultimate, draw a card.",
            "cleanText": "draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the first attack of the turn is made by your Ultimate",
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
        "id": "SD19-012#a1",
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
          "cleanBody": "When an opposing Spirit is destroyed by comparing BP, destroy an opposing Nexus."
        },
        "clauses": [
          {
            "rawText": "When an opposing Spirit is destroyed by comparing BP, destroy an opposing Nexus.",
            "cleanText": "When an opposing Spirit is destroyed by comparing BP, destroy an opposing Nexus",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD19-011": {
    "cardNumber": "SD19-011",
    "name": "The Village of Hunters",
    "keywords": [],
    "abilities": [
      {
        "id": "SD19-011#a0",
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
          "cleanBody": "All your Red Spirits/Ultimates gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Red Spirits/Ultimates gain +2000 BP.",
            "cleanText": "All your Red Spirits/Ultimates gain +2000 BP",
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
        "id": "SD19-011#a1",
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
          "cleanBody": "When your Life is reduced by the opponent, destroy an opposing 4000 BP or less Spirit. If you control any Ultimate, instead, destroy an opposing 5000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "When your Life is reduced by the opponent, destroy an opposing 4000 BP or less Spirit.",
            "cleanText": "When your Life is reduced by the opponent, destroy an opposing 4000 BP or less Spirit",
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
                  "bpLte": 4000
                }
              }
            }
          },
          {
            "rawText": "If you control any Ultimate, instead, destroy an opposing 5000 BP or less Spirit.",
            "cleanText": "destroy an opposing 5000 BP or less Spirit",
            "link": "instead",
            "isOptional": false,
            "isCost": false,
            "condition": "If you control any Ultimate",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  }
};
