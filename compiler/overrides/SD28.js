export const SD28_OVERRIDES = {
  "SD28-013": {
    "cardNumber": "SD28-013",
    "name": "Counter Bind",
    "keywords": [
      {
        "name": "Trigger Counter",
        "parameter": null,
        "wave": 3,
        "hook": "trigger_counter",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD28-013#a0",
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
          "keyword": "Trigger Counter",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When an opposing Ultimate Trigger hits, if this Magic card is in your Hand, you can use the following effect before the \"When hits\" effect activates."
        },
        "clauses": [
          {
            "rawText": "When an opposing Ultimate Trigger hits, if this Magic card is in your Hand, you can use the following effect before the \"When hits\" effect activates.",
            "cleanText": "When an opposing Ultimate Trigger hits, if this Magic card is in your Hand, you can use the following effect before the \"When hits\" effect activates",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TRIGGER_COUNTER"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD28-013#a1",
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
          "cleanBody": "█ If the Hit card is Green, treat it as a Guard."
        },
        "clauses": [
          {
            "rawText": "█ If the Hit card is Green, treat it as a Guard.",
            "cleanText": "treat it as a Guard",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the Hit card is Green",
            "duration": null,
            "op": {
              "op": "TREAT_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD28-013#a2",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD28-014": {
    "cardNumber": "SD28-014",
    "name": "Exhaust End",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After the opposing Hand increases via an opposing effect",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD28-014#a0",
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
          "cleanBody": "For each card the opponent increases when this Burst was activated, put a core from the Void to your Reserve. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "For each card the opponent increases when this Burst was activated, put a core from the Void to your Reserve.",
            "cleanText": "For each card the opponent increases when this Burst was activated, put a core from the Void to your Reserve",
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
        "id": "SD28-014#a1",
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
          "cleanBody": "For every two cards in the opposing Hand, exhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "For every two cards in the opposing Hand, exhaust an opposing Spirit.",
            "cleanText": "For every two cards in the opposing Hand, exhaust an opposing Spirit",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD28-001": {
    "cardNumber": "SD28-001",
    "name": "Gigantea-Kamikiri",
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
        "id": "SD28-001#a0",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD28-007": {
    "cardNumber": "SD28-007",
    "name": "Koganehime",
    "keywords": [
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV4",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 241
      }
    ],
    "abilities": [
      {
        "id": "SD28-007#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Cost 1 or higher Spirits"
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
        "rawText": "[Summon Condition: You control one or more Cost 1 or higher Spirits]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD28-007#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3,
            4
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
          "cleanBody": "Ignore the summon conditions of all your Green Ultimate cards. The Ultimate symbols of all your \"Shellman\" family Ultimates are also treated as Green symbols."
        },
        "clauses": [
          {
            "rawText": "Ignore the summon conditions of all your Green Ultimate cards.",
            "cleanText": "Ignore the summon conditions of all your Green Ultimate cards",
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
            "rawText": "The Ultimate symbols of all your \"Shellman\" family Ultimates are also treated as Green symbols.",
            "cleanText": "The Ultimate symbols of all your \"Shellman\" family Ultimates are also treated as Green symbols",
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
      },
      {
        "id": "SD28-007#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            4
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
          "cleanBody": "When Ultimate-Trigger hits, exhaust two opposing Spirits."
        },
        "clauses": [
          {
            "rawText": "When Ultimate-Trigger hits, exhaust two opposing Spirits.",
            "cleanText": "When Ultimate-Trigger hits, exhaust two opposing Spirits",
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
  "SD28-011": {
    "cardNumber": "SD28-011",
    "name": "The AstralBeastBlade Procyon",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "Cost 3 or more Spirit/Ultimate",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD28-011#a0",
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
          "keyword": "Brave Condition: Cost 3 or more Spirit/Ultimate",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": ""
        },
        "rawText": "[Brave Condition: Cost 3 or more Spirit/Ultimate]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD28-011#a1",
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
          "cleanBody": "Put a core from the Void to any Ultimate you control."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void to any Ultimate you control.",
            "cleanText": "Put a core from the Void to any Ultimate you control",
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
        "id": "SD28-011#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
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
          "cleanBody": "(When this Spirit Brave Attacks)\nThis Spirit gains +5000 BP."
        },
        "clauses": [
          {
            "rawText": "(When this Spirit Brave Attacks)",
            "cleanText": "(When this Spirit Brave Attacks)",
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
            "rawText": "This Spirit gains +5000 BP.",
            "cleanText": "This Spirit gains +5000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 5000,
              "target": "self",
              "duration": "THIS_TURN"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD28-011#a3",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
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
          "cleanBody": "(When this Ultimate Brave Attacks)\nExhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "(When this Ultimate Brave Attacks)",
            "cleanText": "(When this Ultimate Brave Attacks)",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD28-X02": {
    "cardNumber": "SD28-X02",
    "name": "The EarthDeitySword Gaianohoko",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "Cost 5 or more Ultimate",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD28-X02#a0",
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
          "keyword": "Brave Condition: Cost 5 or more Ultimate",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": ""
        },
        "rawText": "[Brave Condition: Cost 5 or more Ultimate]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD28-X02#a1",
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
          "cleanBody": "When your Ultimate is summoned, you can summon this card from the Hand without paying the cost."
        },
        "clauses": [
          {
            "rawText": "When your Ultimate is summoned, you can summon this card from the Hand without paying the cost.",
            "cleanText": "When your Ultimate is summoned, you can summon this card from the Hand without paying the cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_FREE",
              "target": "this_card",
              "from": "HAND"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD28-X02#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "During Brave"
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
          "cleanBody": "While braved to an Ultimate without Cross Ultimate Trigger, this Brave's Cost becomes 0."
        },
        "clauses": [
          {
            "rawText": "While braved to an Ultimate without Cross Ultimate Trigger, this Brave's Cost becomes 0.",
            "cleanText": "this Brave's Cost becomes 0",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While braved to an Ultimate without Cross Ultimate Trigger",
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD28-X02#a3",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "During Brave"
          ],
          "timing": "WHEN_ATTACKS_OR_BLOCKS",
          "timingLabel": "When Attacks/Blocks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The opposing Burst can't activate."
        },
        "clauses": [
          {
            "rawText": "The opposing Burst can't activate.",
            "cleanText": "The opposing Burst can't activate",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BURST_LOCK",
              "side": "opp"
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
  "SD28-012": {
    "cardNumber": "SD28-012",
    "name": "The Jade Sword Detector",
    "keywords": [],
    "abilities": [
      {
        "id": "SD28-012#a0",
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
          "cleanBody": "When your Life is reduced, draw a card."
        },
        "clauses": [
          {
            "rawText": "When your Life is reduced, draw a card.",
            "cleanText": "When your Life is reduced, draw a card",
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
        "id": "SD28-012#a1",
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
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By exhausting this Nexus, reveal two cards from your decktop. Among them, add a Green \"Exalted Sword\" family Brave card to the Hand. Return any remaining cards to the deckbottom."
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
            "rawText": "reveal two cards from your decktop.",
            "cleanText": "reveal two cards from your decktop",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 2
            }
          },
          {
            "rawText": "Among them, add a Green \"Exalted Sword\" family Brave card to the Hand.",
            "cleanText": "Among them, add a Green \"Exalted Sword\" family Brave card to the Hand",
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
            "rawText": "Return any remaining cards to the deckbottom.",
            "cleanText": "Return any remaining cards to the deckbottom",
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
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD28-009": {
    "cardNumber": "SD28-009",
    "name": "The Last Emperor",
    "keywords": [
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV4",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 149
      },
      {
        "name": "Cross Ultimate Trigger",
        "parameter": null,
        "wave": 3,
        "hook": "cross_ultimate_trigger",
        "bracketed": true,
        "index": 346
      }
    ],
    "abilities": [
      {
        "id": "SD28-009#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Cost 3 or higher Spirits"
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
        "rawText": "[Summon Condition: You control one or more Cost 3 or higher Spirits]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD28-009#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3,
            4,
            5
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
          "cleanBody": "Put two cores from the Void to this Ultimate."
        },
        "clauses": [
          {
            "rawText": "Put two cores from the Void to this Ultimate.",
            "cleanText": "Put two cores from the Void to this Ultimate",
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
        "id": "SD28-009#a2",
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
          "keyword": "Ultimate Trigger",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When Ultimate Trigger hits, exhaust two opposing Spirits. After Ultimate Trigger, if your Life is at three or less, proceed to Cross Ultimate Trigger.\n[Cross Ultimate Trigger] When Cross Ultimate Trigger hits, send an opposing Life to their Trash."
        },
        "clauses": [
          {
            "rawText": "When Ultimate Trigger hits, exhaust two opposing Spirits.",
            "cleanText": "When Ultimate Trigger hits, exhaust two opposing Spirits",
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
            "rawText": "After Ultimate Trigger, if your Life is at three or less, proceed to Cross Ultimate Trigger.",
            "cleanText": "After Ultimate Trigger, if your Life is at three or less, proceed to Cross Ultimate Trigger",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CROSS_TRIGGER"
            }
          },
          {
            "rawText": "[Cross Ultimate Trigger] When Cross Ultimate Trigger hits, send an opposing Life to their Trash.",
            "cleanText": "[Cross Ultimate Trigger] When Cross Ultimate Trigger hits, send an opposing Life to their Trash",
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
  "SD28-008": {
    "cardNumber": "SD28-008",
    "name": "The ToughSwordMaster Rubeet",
    "keywords": [
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV4",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 154
      }
    ],
    "abilities": [
      {
        "id": "SD28-008#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Cost 1 or higher Spirits"
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
        "rawText": "[Summon Condition: You control one or more Cost 1 or higher Spirits]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD28-008#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3,
            4
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
          "cleanBody": "Exhaust an opposing Cost 5 or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Exhaust an opposing Cost 5 or less Spirit.",
            "cleanText": "Exhaust an opposing Cost 5 or less Spirit",
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
        "id": "SD28-008#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            4
          ],
          "levelExplicit": true,
          "prefixes": [
            "When Braved"
          ],
          "timing": "STEP_RESTRICTED",
          "timingLabel": "When this Ultimate Brave Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Ultimate Trigger",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When Ultimate Trigger hits, return an opposing exhausted Spirit to the decktop."
        },
        "clauses": [
          {
            "rawText": "When Ultimate Trigger hits, return an opposing exhausted Spirit to the decktop.",
            "cleanText": "When Ultimate Trigger hits, return an opposing exhausted Spirit to the decktop",
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
  "SD28-010": {
    "cardNumber": "SD28-010",
    "name": "The WingedBlade Gruid",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "Cost 3 or more Ultimate",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 52
      }
    ],
    "abilities": [
      {
        "id": "SD28-010#a0",
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
          "keyword": "Brave Condition: Cost 3 or more Ultimate",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": ""
        },
        "rawText": "[Brave Condition: Cost 3 or more Ultimate]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD28-010#a1",
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
          "cleanBody": "This Brave card in Hand can be summoned by paying the cost with cores in the Reserve. In this case, cores to be put on this Brave must also be from the Reserve."
        },
        "clauses": [
          {
            "rawText": "This Brave card in Hand can be summoned by paying the cost with cores in the Reserve.",
            "cleanText": "This Brave card in Hand can be summoned by paying the cost with cores in the Reserve",
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
            "rawText": "In this case, cores to be put on this Brave must also be from the Reserve.",
            "cleanText": "In this case, cores to be put on this Brave must also be from the Reserve",
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
        "id": "SD28-010#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "When Braved"
          ],
          "timing": "WHEN_BATTLES",
          "timingLabel": "When Battles",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Ultimate gains +5000 BP."
        },
        "clauses": [
          {
            "rawText": "This Ultimate gains +5000 BP.",
            "cleanText": "This Ultimate gains +5000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 5000,
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
  "SD28-015": {
    "cardNumber": "SD28-015",
    "name": "Ultimate Gain",
    "keywords": [],
    "abilities": [
      {
        "id": "SD28-015#a0",
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
          "cleanBody": "Refresh all your Brave Ultimates. During this turn, the Ultimate Triggers of any Ultimates refreshed by this effect can't activate."
        },
        "clauses": [
          {
            "rawText": "Refresh all your Brave Ultimates.",
            "cleanText": "Refresh all your Brave Ultimates",
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
            "rawText": "During this turn, the Ultimate Triggers of any Ultimates refreshed by this effect can't activate.",
            "cleanText": "the Ultimate Triggers of any Ultimates refreshed by this effect can't activate",
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
  "SD28-X01": {
    "cardNumber": "SD28-X01",
    "name": "Ultimate-Ushiwaka",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit/Ultimate is destroyed by the Opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 69
      },
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV4",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 245
      }
    ],
    "abilities": [
      {
        "id": "SD28-X01#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Green Spirits/Ultimates"
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
        "rawText": "[Summon Condition: You control one or more Green Spirits/Ultimates]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD28-X01#a1",
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
          "cleanBody": "Exhaust two opposing Spirits, or an opposing Ultimate. After this effect resolves, summon this Ultimate card."
        },
        "clauses": [
          {
            "rawText": "Exhaust two opposing Spirits, or an opposing Ultimate.",
            "cleanText": "Exhaust two opposing Spirits, or an opposing Ultimate",
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
            "rawText": "summon this Ultimate card.",
            "cleanText": "summon this Ultimate card",
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
        "id": "SD28-X01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            4,
            5
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_BATTLES",
          "timingLabel": "When Battles",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Ultimate Trigger",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When Ultimate Trigger hits, at the end of battle, by returning this Ultimate to your Hand, refresh an Ultimate you control."
        },
        "clauses": [
          {
            "rawText": "When Ultimate Trigger hits, at the end of battle, by returning this Ultimate to your Hand, refresh an Ultimate you control.",
            "cleanText": "When Ultimate Trigger hits, at the end of battle, by returning this Ultimate to your Hand, refresh an Ultimate you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH",
              "count": 1,
              "target": {
                "side": "self",
                "types": [
                  "Ultimate"
                ]
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
  "SD28-004": {
    "cardNumber": "SD28-004",
    "name": "Akagane",
    "keywords": [],
    "abilities": [
      {
        "id": "SD28-004#a0",
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
          "cleanBody": "This Spirit can't be destroyed by opposing effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit can't be destroyed by opposing effects.",
            "cleanText": "This Spirit can't be destroyed by opposing effects",
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
      },
      {
        "id": "SD28-004#a1",
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
          "cleanBody": "When your Green card is sent to the Trash by an opposing Ultimate-Trigger, after the Ultimate-Trigger, you can add all the those cards to your Hand."
        },
        "clauses": [
          {
            "rawText": "When your Green card is sent to the Trash by an opposing Ultimate-Trigger, after the Ultimate-Trigger, you can add all the those cards to your Hand.",
            "cleanText": "When your Green card is sent to the Trash by an opposing Ultimate-Trigger, after the Ultimate-Trigger, you can add all the those cards to your Hand",
            "link": null,
            "isOptional": true,
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD28-003": {
    "cardNumber": "SD28-003",
    "name": "Usubaageha",
    "keywords": [],
    "abilities": [
      {
        "id": "SD28-003#a0",
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
        "id": "SD28-003#a1",
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
          "cleanBody": "While your \"Shellman\" family Ultimates are battling, the opponent can't activate Bursts."
        },
        "clauses": [
          {
            "rawText": "While your \"Shellman\" family Ultimates are battling, the opponent can't activate Bursts.",
            "cleanText": "the opponent can't activate Bursts",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While your \"Shellman\" family Ultimates are battling",
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
  }
};
