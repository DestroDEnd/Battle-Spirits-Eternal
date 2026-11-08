export const BS03_OVERRIDES = {
  "BS03-116": {
    "cardNumber": "BS03-116",
    "name": "The Loss of Heroes",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-116#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
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
          "cleanBody": "When cards are added to the opposing Hand, for each card added, discard a card from the opposing decktop."
        },
        "clauses": [
          {
            "rawText": "When cards are added to the opposing Hand, for each card added, discard a card from the opposing decktop.",
            "cleanText": "When cards are added to the opposing Hand, for each card added, discard a card from the opposing decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
              "side": "opp"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-116#a1",
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
          "cleanBody": "When your \"Soldier\" family Spirit is destroyed by opposing Spirits via BP comparison, discard five cards from the opposing decktop."
        },
        "clauses": [
          {
            "rawText": "When your \"Soldier\" family Spirit is destroyed by opposing Spirits via BP comparison, discard five cards from the opposing decktop.",
            "cleanText": "When your \"Soldier\" family Spirit is destroyed by opposing Spirits via BP comparison, discard five cards from the opposing decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
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
  "BATTLE-SPIRITS-A2675": {
    "cardNumber": "BATTLE-SPIRITS-A2675",
    "name": "Angelafish",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "NAPRINCESS-UN2": {
    "cardNumber": "NAPRINCESS-UN2",
    "name": "Arcanaprincess-Un",
    "keywords": [],
    "abilities": [
      {
        "id": "NAPRINCESS-UN2#a0",
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
          "cleanBody": "For each \"Arcana\"-named Spirit you control, this Spirit gains +1000 BP."
        },
        "clauses": [
          {
            "rawText": "For each \"Arcana\"-named Spirit you control, this Spirit gains +1000 BP.",
            "cleanText": "For each \"Arcana\"-named Spirit you control, this Spirit gains +1000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "self",
              "duration": "THIS_TURN"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "NAPRINCESS-UN2#a1",
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
          "cleanBody": "All Cost 3 Spirits you control are treated as \"Arcana\"-named."
        },
        "clauses": [
          {
            "rawText": "All Cost 3 Spirits you control are treated as \"Arcana\"-named.",
            "cleanText": "All Cost 3 Spirits you control are treated as \"Arcana\"-named",
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
  "BS03-059": {
    "cardNumber": "BS03-059",
    "name": "Arcanabeast-Paira",
    "keywords": [
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 11
      }
    ],
    "abilities": [
      {
        "id": "BS03-059#a0",
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
          "keyword": "Brilliance",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "At the end of battle, return every Magic card you used during this battle to your Hand."
        },
        "clauses": [
          {
            "rawText": "At the end of battle, return every Magic card you used during this battle to your Hand.",
            "cleanText": "At the end of battle, return every Magic card you used during this battle to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_BATTLE",
            "op": {
              "op": "SALVAGE",
              "cardType": "Magic",
              "filter": {
                "usedThisBattle": true
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-059#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "All your \"Arcana\"-named Spirits gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "All your \"Arcana\"-named Spirits gain +2000 BP.",
            "cleanText": "All your \"Arcana\"-named Spirits gain +2000 BP",
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
  "BS03-054": {
    "cardNumber": "BS03-054",
    "name": "Arcanadoll-Tria",
    "keywords": [
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 6
      }
    ],
    "abilities": [
      {
        "id": "BS03-054#a0",
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
          "keyword": "Brilliance",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "At the end of battle, return every Magic card you used during this battle to your Hand."
        },
        "clauses": [
          {
            "rawText": "At the end of battle, return every Magic card you used during this battle to your Hand.",
            "cleanText": "At the end of battle, return every Magic card you used during this battle to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_BATTLE",
            "op": {
              "op": "SALVAGE",
              "cardType": "Magic",
              "filter": {
                "usedThisBattle": true
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
  "BS03-143": {
    "cardNumber": "BS03-143",
    "name": "Blitz",
    "keywords": [
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 47
      }
    ],
    "abilities": [
      {
        "id": "BS03-143#a0",
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
          "cleanBody": "During this turn, when your Spirit with [Crush] attacks, put a core from the Void to your Trash."
        },
        "clauses": [
          {
            "rawText": "During this turn, when your Spirit with [Crush] attacks, put a core from the Void to your Trash.",
            "cleanText": "when your Spirit with [Crush] attacks, put a core from the Void to your Trash",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "void"
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
        "id": "BS03-143#a1",
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
          "cleanBody": "During this turn, give a Spirit +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +3000 BP.",
            "cleanText": "give a Spirit +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "BATTLE-SPIRITS-A3193": {
    "cardNumber": "BATTLE-SPIRITS-A3193",
    "name": "Brontrident",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A3193#a0",
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
          "cleanBody": "(Permanent) While you control a spirit with Evolution, this spirit gets +2000 BP."
        },
        "clauses": [
          {
            "rawText": "While you control a spirit with Evolution, this spirit gets +2000 BP.",
            "cleanText": "this spirit gets +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you control a spirit with Evolution",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-141": {
    "cardNumber": "BS03-141",
    "name": "Build Up",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-141#a0",
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
          "cleanBody": "Target a Spirit you or the opponent controls. During this turn, it is treated as being one LV higher."
        },
        "clauses": [
          {
            "rawText": "Target a Spirit you or the opponent controls.",
            "cleanText": "Target a Spirit you or the opponent controls",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET_SELECT",
              "target": {
                "side": "either",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "During this turn, it is treated as being one LV higher.",
            "cleanText": "it is treated as being one LV higher",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-119": {
    "cardNumber": "BS03-119",
    "name": "Buster Lance",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-119#a0",
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
          "cleanBody": "Destroy every LV1 Nexus."
        },
        "clauses": [
          {
            "rawText": "Destroy every LV1 Nexus.",
            "cleanText": "Destroy every LV1 Nexus",
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
        "id": "BS03-119#a1",
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
          "cleanBody": "During this turn, give a Spirit +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +3000 BP.",
            "cleanText": "give a Spirit +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "BATTLE-SPIRITS-A3454": {
    "cardNumber": "BATTLE-SPIRITS-A3454",
    "name": "Chihuahl",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A3454#a0",
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
          "cleanBody": "(Permanent) \"Imp\" spirits you control get +1000BP."
        },
        "clauses": [
          {
            "rawText": "\"Imp\" spirits you control get +1000BP.",
            "cleanText": "\"Imp\" spirits you control get +1000BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": {
                "side": "either"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A3454#a1",
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
          "cleanBody": "(Permanent) Each time a \"Toy Beast\" spirit you control is destroyed, move it to your hand instead."
        },
        "clauses": [
          {
            "rawText": "Each time a \"Toy Beast\" spirit you control is destroyed, move it to your hand instead.",
            "cleanText": "Each time a \"Toy Beast\" spirit you control is destroyed, move it to your hand instead",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REPLACEMENT_EFFECT"
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
  "BS03-148": {
    "cardNumber": "BS03-148",
    "name": "Construction",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-148#a0",
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
          "cleanBody": "Deploy every Red/Green/Blue Nexus cards from your Trash, without paying the costs."
        },
        "clauses": [
          {
            "rawText": "Deploy every Red/Green/Blue Nexus cards from your Trash, without paying the costs.",
            "cleanText": "Deploy every Red/Green/Blue Nexus cards from your Trash, without paying the costs",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DEPLOY_NEXUS",
              "free": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-148#a1",
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
          "cleanBody": "During this turn, give a Spirit +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +3000 BP.",
            "cleanText": "give a Spirit +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "DEEP-ARNOLD2": {
    "cardNumber": "DEEP-ARNOLD2",
    "name": "Deep-Arnold",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-018": {
    "cardNumber": "BS03-018",
    "name": "Darkwraith",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A3841": {
    "cardNumber": "BATTLE-SPIRITS-A3841",
    "name": "Dongurin",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-121": {
    "cardNumber": "BS03-121",
    "name": "Double Hearts",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-121#a0",
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
          "cleanBody": "Target a Spirit you or the opponent controls. During this turn, give it an extra symbol with the same color as the symbol it originally has."
        },
        "clauses": [
          {
            "rawText": "Target a Spirit you or the opponent controls.",
            "cleanText": "Target a Spirit you or the opponent controls",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET_SELECT",
              "target": {
                "side": "either",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "During this turn, give it an extra symbol with the same color as the symbol it originally has.",
            "cleanText": "give it an extra symbol with the same color as the symbol it originally has",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
  "BATTLE-SPIRITS-A4014": {
    "cardNumber": "BATTLE-SPIRITS-A4014",
    "name": "Enchu",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-135": {
    "cardNumber": "BS03-135",
    "name": "Escape Route",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-135#a0",
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
          "cleanBody": "During this turn, when your Spirits with two or more families are destroyed by opposing Spirits via BP comparison, return them to your Hand."
        },
        "clauses": [
          {
            "rawText": "During this turn, when your Spirits with two or more families are destroyed by opposing Spirits via BP comparison, return them to your Hand.",
            "cleanText": "when your Spirits with two or more families are destroyed by opposing Spirits via BP comparison, return them to your Hand",
            "link": null,
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
      },
      {
        "id": "BS03-135#a1",
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
          "cleanBody": "Target a Spirit you or the opponent controls. During this turn, give it +2000 BP."
        },
        "clauses": [
          {
            "rawText": "Target a Spirit you or the opponent controls.",
            "cleanText": "Target a Spirit you or the opponent controls",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET_SELECT",
              "target": {
                "side": "either",
                "types": [
                  "Spirit"
                ]
              }
            }
          },
          {
            "rawText": "During this turn, give it +2000 BP.",
            "cleanText": "give it +2000 BP",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "FLAME-ELK2": {
    "cardNumber": "FLAME-ELK2",
    "name": "Flame-Elk",
    "keywords": [],
    "abilities": [
      {
        "id": "FLAME-ELK2#a0",
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
          "cleanBody": "Destroy all nexuses with a core on them."
        },
        "clauses": [
          {
            "rawText": "Destroy all nexuses with a core on them.",
            "cleanText": "Destroy all nexuses with a core on them",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": "ALL",
              "target": {
                "side": "either",
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
  "BATTLE-SPIRITS-A4203": {
    "cardNumber": "BATTLE-SPIRITS-A4203",
    "name": "Fall Down",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A4203#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Move all cores from all nexuses to their owner's Trash."
        },
        "clauses": [
          {
            "rawText": "Move all cores from all nexuses to their owner's Trash.",
            "cleanText": "Move all cores from all nexuses to their owner's Trash",
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
        "id": "BATTLE-SPIRITS-A4203#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Target spirit gets +1000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit gets +1000BP until end of turn.",
            "cleanText": "Target spirit gets +1000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "target",
              "duration": "UNTIL_END_OF_TURN"
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
  "BS03-129": {
    "cardNumber": "BS03-129",
    "name": "Flock Recovery",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-129#a0",
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
          "cleanBody": "Target a family. Refresh three Spirits of the target family you control."
        },
        "clauses": [
          {
            "rawText": "Target a family.",
            "cleanText": "Target a family",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET_FAMILY"
            }
          },
          {
            "rawText": "Refresh three Spirits of the target family you control.",
            "cleanText": "Refresh three Spirits of the target family you control",
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
  "BS03-136": {
    "cardNumber": "BS03-136",
    "name": "Focus Light",
    "keywords": [
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 28
      }
    ],
    "abilities": [
      {
        "id": "BS03-136#a0",
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
          "cleanBody": "For each Spirit with [Brilliance] you control, draw a card."
        },
        "clauses": [
          {
            "rawText": "For each Spirit with [Brilliance] you control, draw a card.",
            "cleanText": "For each Spirit with [Brilliance] you control, draw a card",
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
      },
      {
        "id": "BS03-136#a1",
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
  "BS03-118": {
    "cardNumber": "BS03-118",
    "name": "Fourth Draw",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-118#a0",
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
          "cleanBody": "Draw until you have four cards in Hand."
        },
        "clauses": [
          {
            "rawText": "Draw until you have four cards in Hand.",
            "cleanText": "Draw until you have four cards in Hand",
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
        "id": "BS03-118#a1",
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
          "cleanBody": "During this turn, give a Spirit +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +3000 BP.",
            "cleanText": "give a Spirit +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "BATTLE-SPIRITS-A4292": {
    "cardNumber": "BATTLE-SPIRITS-A4292",
    "name": "Forthros",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A4421": {
    "cardNumber": "BATTLE-SPIRITS-A4421",
    "name": "Fullmingo",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A4421#a0",
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
          "cleanBody": "(Permanent) All spirit cards with High Speed in your hand get 1 additional green Reduction Cost."
        },
        "clauses": [
          {
            "rawText": "All spirit cards with High Speed in your hand get 1 additional green Reduction Cost.",
            "cleanText": "All spirit cards with High Speed in your hand get 1 additional green Reduction Cost",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A4611": {
    "cardNumber": "BATTLE-SPIRITS-A4611",
    "name": "Golem Craft",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A4611#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "All nexuses you control with a core on them lose their effects and are treated as spirits (Cost of 1/\"Artificial Soldier\" characteristic/[1] LV1:2000BP/No printed effects/1 Blue Gem) instead until end of turn."
        },
        "clauses": [
          {
            "rawText": "All nexuses you control with a core on them lose their effects and are treated as spirits (Cost of 1/\"Artificial Soldier\" characteristic/[1] LV1:2000BP/No printed effects/1 Blue Gem) instead until end of turn.",
            "cleanText": "All nexuses you control with a core on them lose their effects and are treated as spirits (Cost of 1/\"Artificial Soldier\" characteristic/[1] LV1:2000BP/No printed effects/1 Blue Gem) instead until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "COST_MODIFIER"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A4611#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Target spirit gets +2000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit gets +2000BP until end of turn.",
            "cleanText": "Target spirit gets +2000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": "target",
              "duration": "UNTIL_END_OF_TURN"
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
  "BS03-013": {
    "cardNumber": "BS03-013",
    "name": "Hellscorpio",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-133": {
    "cardNumber": "BS03-133",
    "name": "High Elixir",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-133#a0",
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
          "limit": "ONCE_PER_TURN",
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "Send two cores from your Reserve to your Life. ()"
        },
        "clauses": [
          {
            "rawText": "Send two cores from your Reserve to your Life.",
            "cleanText": "Send two cores from your Reserve to your Life",
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
  "BS03-127": {
    "cardNumber": "BS03-127",
    "name": "Ivy Cage",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-127#a0",
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
          "cleanBody": "Exhaust every 2000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Exhaust every 2000 BP or less Spirit.",
            "cleanText": "Exhaust every 2000 BP or less Spirit",
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
        "id": "BS03-127#a1",
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
          "cleanBody": "During this turn, give a Spirit +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +3000 BP.",
            "cleanText": "give a Spirit +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "BATTLE-SPIRITS-A5242": {
    "cardNumber": "BATTLE-SPIRITS-A5242",
    "name": "Jellfy",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A5242#a0",
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
          "cleanBody": "If you control any Purple Spirit, draw a card."
        },
        "clauses": [
          {
            "rawText": "If you control any Purple Spirit, draw a card.",
            "cleanText": "draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control any Purple Spirit",
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
  "BS03-050": {
    "cardNumber": "BS03-050",
    "name": "Kinokonoko",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-050#a0",
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
          "cleanBody": "Whenever you use a Magic effect, this Spirit gains +1000 BP."
        },
        "clauses": [
          {
            "rawText": "Whenever you use a Magic effect, this Spirit gains +1000 BP.",
            "cleanText": "Whenever you use a Magic effect, this Spirit gains +1000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "self",
              "duration": "THIS_TURN"
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
  "BATTLE-SPIRITS-A6294": {
    "cardNumber": "BATTLE-SPIRITS-A6294",
    "name": "Machfly",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-020": {
    "cardNumber": "BS03-020",
    "name": "Mega-Humpdump",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A6513": {
    "cardNumber": "BATTLE-SPIRITS-A6513",
    "name": "Mikene",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A6513#a0",
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
          "cleanBody": "Refresh target exhausted spirit you control."
        },
        "clauses": [
          {
            "rawText": "Refresh target exhausted spirit you control.",
            "cleanText": "Refresh target exhausted spirit you control",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A6644": {
    "cardNumber": "BATTLE-SPIRITS-A6644",
    "name": "Mogrunner",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A6644#a0",
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
          "cleanBody": "High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step. In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve."
        },
        "clauses": [
          {
            "rawText": "High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step.",
            "cleanText": "High Speed (Flash) This spirit card may be summoned from your hand during the Flash Step",
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
            "rawText": "In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve.",
            "cleanText": "In that case, the cost of this spirit and cores to be put on this spirit must be paid or moved from your Reserve",
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
        "id": "BATTLE-SPIRITS-A6644#a1",
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
          "cleanBody": "(Permanent) Each time your opponent draws 1 or more cards, if this spirit is exhausted, refresh this spirit."
        },
        "clauses": [
          {
            "rawText": "Each time your opponent draws 1 or more cards, if this spirit is exhausted, refresh this spirit.",
            "cleanText": "Each time your opponent draws 1 or more cards, if this spirit is exhausted, refresh this spirit",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-128": {
    "cardNumber": "BS03-128",
    "name": "Multiple Cores",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-128#a0",
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
          "cleanBody": "For each exhausted Spirit you control, put a core from the Void to your Reserve."
        },
        "clauses": [
          {
            "rawText": "For each exhausted Spirit you control, put a core from the Void to your Reserve.",
            "cleanText": "For each exhausted Spirit you control, put a core from the Void to your Reserve",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-123": {
    "cardNumber": "BS03-123",
    "name": "Necromancy",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-123#a0",
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
          "cleanBody": "Return every \"Zombie\" family Spirit card from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return every \"Zombie\" family Spirit card from your Trash to the Hand.",
            "cleanText": "Return every \"Zombie\" family Spirit card from your Trash to the Hand",
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
        "id": "BS03-123#a1",
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
  "BS03-130": {
    "cardNumber": "BS03-130",
    "name": "Möbius Loop",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-130#a0",
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
          "cleanBody": "Return a Nexus to its owner's Hand. If an opposing Nexus is returned to the Hand, put a core from the Void to your Trash."
        },
        "clauses": [
          {
            "rawText": "Return a Nexus to its owner's Hand.",
            "cleanText": "Return a Nexus to its owner's Hand",
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
            "rawText": "If an opposing Nexus is returned to the Hand, put a core from the Void to your Trash.",
            "cleanText": "put a core from the Void to your Trash",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If an opposing Nexus is returned to the Hand",
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "void"
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
        "id": "BS03-130#a1",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A6951": {
    "cardNumber": "BATTLE-SPIRITS-A6951",
    "name": "Ochogo",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A6951#a0",
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
          "cleanBody": "If you control a green spirit, gain 1 core on this spirit."
        },
        "clauses": [
          {
            "rawText": "If you control a green spirit, gain 1 core on this spirit.",
            "cleanText": "gain 1 core on this spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control a green spirit",
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "void"
              },
              "to": {
                "zone": "field",
                "target": "SELF"
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
  "BS03-146": {
    "cardNumber": "BS03-146",
    "name": "Nexus Register",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-146#a0",
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
          "cleanBody": "Discard any number of Nexus cards from your Hand. For each Nexus card you discarded, draw a card."
        },
        "clauses": [
          {
            "rawText": "Discard any number of Nexus cards from your Hand.",
            "cleanText": "Discard any number of Nexus cards from your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_HAND",
              "chooser": "self",
              "isCost": false
            }
          },
          {
            "rawText": "For each Nexus card you discarded, draw a card.",
            "cleanText": "For each Nexus card you discarded, draw a card",
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
      },
      {
        "id": "BS03-146#a1",
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
          "cleanBody": "During this turn, give a Spirit +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +3000 BP.",
            "cleanText": "give a Spirit +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "BS03-132": {
    "cardNumber": "BS03-132",
    "name": "Perfect Guard",
    "keywords": [
      {
        "name": "Armor",
        "parameter": null,
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 48
      }
    ],
    "abilities": [
      {
        "id": "BS03-132#a0",
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
          "cleanBody": "During this turn, when your Spirits with [Armor] is destroyed by opposing Spirits via BP comparison, they return to the Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "During this turn, when your Spirits with [Armor] is destroyed by opposing Spirits via BP comparison, they return to the Field, exhausted.",
            "cleanText": "when your Spirits with [Armor] is destroyed by opposing Spirits via BP comparison, they return to the Field, exhausted",
            "link": null,
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
      },
      {
        "id": "BS03-132#a1",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A7220": {
    "cardNumber": "BATTLE-SPIRITS-A7220",
    "name": "Ponysus",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-126": {
    "cardNumber": "BS03-126",
    "name": "Potion Berry",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-126#a0",
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
          "cleanBody": "Put a core from the Void to a Spirit."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void to a Spirit.",
            "cleanText": "Put a core from the Void to a Spirit",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A7353": {
    "cardNumber": "BATTLE-SPIRITS-A7353",
    "name": "Puppet String",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A7353#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "All yellow spirits you control get \"Magician\" characteristic and are treated as spirits that have \"Arcana\" in their names until end of turn."
        },
        "clauses": [
          {
            "rawText": "All yellow spirits you control get \"Magician\" characteristic and are treated as spirits that have \"Arcana\" in their names until end of turn.",
            "cleanText": "All yellow spirits you control get \"Magician\" characteristic and are treated as spirits that have \"Arcana\" in their names until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "TREAT_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A7353#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Target spirit gets +1000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit gets +1000BP until end of turn.",
            "cleanText": "Target spirit gets +1000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "target",
              "duration": "UNTIL_END_OF_TURN"
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
  "BATTLE-SPIRITS-A7538": {
    "cardNumber": "BATTLE-SPIRITS-A7538",
    "name": "Rumpkin",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A7573": {
    "cardNumber": "BATTLE-SPIRITS-A7573",
    "name": "Salvage",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A7573#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Reveal the top 5 cards of your Deck. If there are 1 or more nexus cards among them, select 1 of them and move it to your hand. Then, return the rest to the bottom of your Deck in any order. If not, return them in the same order."
        },
        "clauses": [
          {
            "rawText": "Reveal the top 5 cards of your Deck.",
            "cleanText": "Reveal the top 5 cards of your Deck",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 5
            }
          },
          {
            "rawText": "If there are 1 or more nexus cards among them, select 1 of them and move it to your hand.",
            "cleanText": "select 1 of them and move it to your hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If there are 1 or more nexus cards among them",
            "duration": null,
            "op": {
              "op": "ADD_TO_HAND"
            }
          },
          {
            "rawText": "return the rest to the bottom of your Deck in any order.",
            "cleanText": "return the rest to the bottom of your Deck in any order",
            "link": "then",
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
            "rawText": "If not, return them in the same order.",
            "cleanText": "return them in the same order",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If not",
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
        "id": "BATTLE-SPIRITS-A7573#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Target spirit gets +3000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit gets +3000BP until end of turn.",
            "cleanText": "Target spirit gets +3000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "target": "target",
              "duration": "UNTIL_END_OF_TURN"
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
  "BATTLE-SPIRITS-A7575": {
    "cardNumber": "BATTLE-SPIRITS-A7575",
    "name": "Same Tired",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A7575#a0",
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
          "cleanBody": "Exhaust opposing Spirits until they control the same number of exhausted Spirits as you do."
        },
        "clauses": [
          {
            "rawText": "Exhaust opposing Spirits until they control the same number of exhausted Spirits as you do.",
            "cleanText": "Exhaust opposing Spirits until they control the same number of exhausted Spirits as you do",
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
  "BS03-145": {
    "cardNumber": "BS03-145",
    "name": "Scramble",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-145#a0",
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
          "cleanBody": "During this turn, give all your \"Fighting Spirit\" family Spirits +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give all your \"Fighting Spirit\" family Spirits +3000 BP.",
            "cleanText": "give all your \"Fighting Spirit\" family Spirits +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "targetGroup": "ALL_FRIENDLY",
              "family": "Fighting Spirit",
              "target": "all_friendly",
              "duration": "DURING_THIS_TURN"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-145#a1",
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
          "cleanBody": "During this turn, give a Spirit +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit +3000 BP.",
            "cleanText": "give a Spirit +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
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
  "BATTLE-SPIRITS-A7696": {
    "cardNumber": "BATTLE-SPIRITS-A7696",
    "name": "Sharkhammer",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A7696#a0",
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
          "cleanBody": "When your nexuses are destroyed, refresh this spirit."
        },
        "clauses": [
          {
            "rawText": "When your nexuses are destroyed, refresh this spirit.",
            "cleanText": "When your nexuses are destroyed, refresh this spirit",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-140": {
    "cardNumber": "BS03-140",
    "name": "Shining Magic",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-140#a0",
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
          "cleanBody": "Choose and return a Magic card from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "Choose and return a Magic card from your Trash to the Hand.",
            "cleanText": "Choose and return a Magic card from your Trash to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SALVAGE",
              "cardType": "Magic",
              "count": 1
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-140#a1",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A7949": {
    "cardNumber": "BATTLE-SPIRITS-A7949",
    "name": "Stagscissor",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "STONE-STATUE2": {
    "cardNumber": "STONE-STATUE2",
    "name": "Stone-Statue",
    "keywords": [],
    "abilities": [
      {
        "id": "STONE-STATUE2#a0",
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
          "cleanBody": "Move the top card of your opponent's Deck to their Trash."
        },
        "clauses": [
          {
            "rawText": "Move the top card of your opponent's Deck to their Trash.",
            "cleanText": "Move the top card of your opponent's Deck to their Trash",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
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
  "BATTLE-SPIRITS-A8193": {
    "cardNumber": "BATTLE-SPIRITS-A8193",
    "name": "Teleport Change",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A8193#a0",
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
          "cleanBody": "Treat one of your battling Spirits as not battling, and target an exhausted Spirit you control to continue the battle."
        },
        "clauses": [
          {
            "rawText": "Treat one of your battling Spirits as not battling",
            "cleanText": "Treat one of your battling Spirits as not battling",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TREAT_RULE"
            }
          },
          {
            "rawText": "target an exhausted Spirit you control to continue the battle.",
            "cleanText": "target an exhausted Spirit you control to continue the battle",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUE_BATTLE"
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
  "BS03-113": {
    "cardNumber": "BS03-113",
    "name": "The Absorption Triumphal Arch",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-113#a0",
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
          "cleanBody": "The opponent can't use Magic cards that don't share the same colors as the symbols on their Field."
        },
        "clauses": [
          {
            "rawText": "The opponent can't use Magic cards that don't share the same colors as the symbols on their Field.",
            "cleanText": "The opponent can't use Magic cards that don't share the same colors as the symbols on their Field",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SET_RESTRICTION",
              "restriction": "PREVENT_MAGIC",
              "side": "opp"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-113#a1",
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
          "cleanBody": "The opponent can't use Magic cards unless they pay the cost."
        },
        "clauses": [
          {
            "rawText": "The opponent can't use Magic cards unless they pay the cost.",
            "cleanText": "The opponent can't use Magic cards unless they pay the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SET_RESTRICTION",
              "restriction": "PREVENT_MAGIC",
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
  "BATTLE-SPIRITS-A8354": {
    "cardNumber": "BATTLE-SPIRITS-A8354",
    "name": "The Angelia Archre",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A8354#a0",
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
          "cleanBody": "(Permanent) All yellow spell cards in your hand get 2 additional yellow Cost Reduction."
        },
        "clauses": [
          {
            "rawText": "All yellow spell cards in your hand get 2 additional yellow Cost Reduction.",
            "cleanText": "All yellow spell cards in your hand get 2 additional yellow Cost Reduction",
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
        "id": "BATTLE-SPIRITS-A8354#a1",
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
          "cleanBody": "(Permanent) All yellow spirit cards in your hand get 2 additional yellow Cost Reduction."
        },
        "clauses": [
          {
            "rawText": "All yellow spirit cards in your hand get 2 additional yellow Cost Reduction.",
            "cleanText": "All yellow spirit cards in your hand get 2 additional yellow Cost Reduction",
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
  "BS03-X11": {
    "cardNumber": "BS03-X11",
    "name": "The ArcAngelia Valiero",
    "keywords": [
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 158
      }
    ],
    "abilities": [
      {
        "id": "BS03-X11#a0",
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
          "cleanBody": "Target a color between Green/Yellow. Return every Magic card with the targeted color from the Trash to your Hand."
        },
        "clauses": [
          {
            "rawText": "Target a color between Green/Yellow.",
            "cleanText": "Target a color between Green/Yellow",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CHOOSE_COLOR"
            }
          },
          {
            "rawText": "Return every Magic card with the targeted color from the Trash to your Hand.",
            "cleanText": "Return every Magic card with the targeted color from the Trash to your Hand",
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
        "id": "BS03-X11#a1",
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
          "keyword": "Brilliance",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "At the end of the battle, return every Magic card you used during this battle to your Hand."
        },
        "clauses": [
          {
            "rawText": "At the end of the battle, return every Magic card you used during this battle to your Hand.",
            "cleanText": "At the end of the battle, return every Magic card you used during this battle to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_BATTLE",
            "op": {
              "op": "SALVAGE",
              "cardType": "Magic",
              "filter": {
                "usedThisBattle": true
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
  "BS03-023": {
    "cardNumber": "BS03-023",
    "name": "The ArtificialCreature No.44",
    "keywords": [
      {
        "name": "Curse",
        "parameter": null,
        "wave": 1,
        "hook": "curse",
        "bracketed": true,
        "index": 11
      }
    ],
    "abilities": [
      {
        "id": "BS03-023#a0",
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
          "keyword": "Curse",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing Spirit that blocked at the end of battle."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit that blocked at the end of battle.",
            "cleanText": "Destroy an opposing Spirit that blocked at the end of battle",
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
      },
      {
        "id": "BS03-023#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, exhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, exhaust an opposing Spirit.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, exhaust an opposing Spirit",
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
  "BS03-003": {
    "cardNumber": "BS03-003",
    "name": "The Assassin Dragno",
    "keywords": [
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 66
      },
      {
        "name": "Curse",
        "parameter": null,
        "wave": 1,
        "hook": "curse",
        "bracketed": true,
        "index": 147
      },
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 157
      }
    ],
    "abilities": [
      {
        "id": "BS03-003#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "This Spirit can't be blocked by Spirits with [High Speed]."
        },
        "clauses": [
          {
            "rawText": "This Spirit can't be blocked by Spirits with [High Speed].",
            "cleanText": "This Spirit can't be blocked by Spirits with [High Speed]",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "UNBLOCKABLE",
              "target": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-003#a1",
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
          "cleanBody": "This Spirit can't be blocked by Spirits with [Curse] / [High Speed]."
        },
        "clauses": [
          {
            "rawText": "This Spirit can't be blocked by Spirits with [Curse] / [High Speed].",
            "cleanText": "This Spirit can't be blocked by Spirits with [Curse] / [High Speed]",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "UNBLOCKABLE",
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
  "BS03-071": {
    "cardNumber": "BS03-071",
    "name": "The BattleBeast Bulltop",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-030": {
    "cardNumber": "BS03-030",
    "name": "The BeastMaster Rainer Bros.",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-030#a0",
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
          "cleanBody": "For each Nexus you control, put a core from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "For each Nexus you control, put a core from the Void to this Spirit.",
            "cleanText": "For each Nexus you control, put a core from the Void to this Spirit",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-010": {
    "cardNumber": "BS03-010",
    "name": "The BlackDragon Vritra",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-010#a0",
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
          "cleanBody": "Destroy every 2000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy every 2000 BP or less Spirit.",
            "cleanText": "Destroy every 2000 BP or less Spirit",
            "link": null,
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
                "maxBp": 2000
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
  "BS03-078": {
    "cardNumber": "BS03-078",
    "name": "The Berserker Troll",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-008": {
    "cardNumber": "BS03-008",
    "name": "The BladeDragon Stegorasaurus",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-008#a0",
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
          "cleanBody": "When this Spirit is blocked by a Spirit with the same LV, this Spirit gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is blocked by a Spirit with the same LV, this Spirit gains +3000 BP.",
            "cleanText": "When this Spirit is blocked by a Spirit with the same LV, this Spirit gains +3000 BP",
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
  "BS03-093": {
    "cardNumber": "BS03-093",
    "name": "The BuffaloMan Bulltania",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-093#a0",
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
          "cleanBody": "This Spirits gains +2000 BP."
        },
        "clauses": [
          {
            "rawText": "This Spirits gains +2000 BP.",
            "cleanText": "This Spirits gains +2000 BP",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-076": {
    "cardNumber": "BS03-076",
    "name": "The ClawSword Lazarus",
    "keywords": [
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 16
      }
    ],
    "abilities": [
      {
        "id": "BS03-076#a0",
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
          "keyword": "Crush",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Discard a number of cards equal to this Spirit's level from opposing decktop."
        },
        "clauses": [
          {
            "rawText": "Discard a number of cards equal to this Spirit's level from opposing decktop.",
            "cleanText": "Discard a number of cards equal to this Spirit's level from opposing decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
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
  "BS03-111": {
    "cardNumber": "BS03-111",
    "name": "The Child's Room in Midnight",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-111#a0",
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
          "cleanBody": "When your Spirit with no printed effects is destroyed by an opposing LV1 Spirit via BP comparison, it returns to your Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "When your Spirit with no printed effects is destroyed by an opposing LV1 Spirit via BP comparison, it returns to your Field, exhausted.",
            "cleanText": "When your Spirit with no printed effects is destroyed by an opposing LV1 Spirit via BP comparison, it returns to your Field, exhausted",
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
        "id": "BS03-111#a1",
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
          "cleanBody": "When your Spirit with no printed effects is destroyed by an opposing LV3 Spirit via BP comparison, it returns to your Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "When your Spirit with no printed effects is destroyed by an opposing LV3 Spirit via BP comparison, it returns to your Field, exhausted.",
            "cleanText": "When your Spirit with no printed effects is destroyed by an opposing LV3 Spirit via BP comparison, it returns to your Field, exhausted",
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
  "BS03-115": {
    "cardNumber": "BS03-115",
    "name": "The Collapse of Battle Line",
    "keywords": [
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 81
      },
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 160
      }
    ],
    "abilities": [
      {
        "id": "BS03-115#a0",
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
          "cleanBody": "When discarding cards from the opposing deck via [Crush] effects, discard +2 cards."
        },
        "clauses": [
          {
            "rawText": "When discarding cards from the opposing deck via [Crush] effects, discard +2 cards.",
            "cleanText": "When discarding cards from the opposing deck via [Crush] effects, discard +2 cards",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
              "side": "opp"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-115#a1",
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
          "cleanBody": "Every Spirit with [Crush] you control is treated as being on its highest level."
        },
        "clauses": [
          {
            "rawText": "Every Spirit with [Crush] you control is treated as being on its highest level.",
            "cleanText": "Every Spirit with [Crush] you control is treated as being on its highest level",
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
  "BATTLE-SPIRITS-A9188": {
    "cardNumber": "BATTLE-SPIRITS-A9188",
    "name": "The Crossroads of Destiny",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A9188#a0",
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
          "cleanBody": "(During the Battle Phase) Each time a spirit you control with no printed effects is defeated, draw 1 card."
        },
        "clauses": [
          {
            "rawText": "(During the Battle Phase) Each time a spirit you control with no printed effects is defeated, draw 1 card.",
            "cleanText": "(During the Battle Phase) Each time a spirit you control with no printed effects is defeated, draw 1 card",
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
        "id": "BATTLE-SPIRITS-A9188#a1",
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
          "cleanBody": "(During the Battle Phase) Each time a spirit you control with no printed effects defeats a spirit, exhaust target unexhuasted spirit."
        },
        "clauses": [
          {
            "rawText": "(During the Battle Phase) Each time a spirit you control with no printed effects defeats a spirit, exhaust target unexhuasted spirit.",
            "cleanText": "(During the Battle Phase) Each time a spirit you control with no printed effects defeats a spirit, exhaust target unexhuasted spirit",
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
  "BATTLE-SPIRITS-A9305": {
    "cardNumber": "BATTLE-SPIRITS-A9305",
    "name": "The DarkReefDiva Seiren",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A9305#a0",
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
          "cleanBody": "(During the Battle Phase) When this spirit defeats a spirit, exhaust target unexhausted spirit your opponent controls."
        },
        "clauses": [
          {
            "rawText": "(During the Battle Phase) When this spirit defeats a spirit, exhaust target unexhausted spirit your opponent controls.",
            "cleanText": "(During the Battle Phase) When this spirit defeats a spirit, exhaust target unexhausted spirit your opponent controls",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-011": {
    "cardNumber": "BS03-011",
    "name": "The DinoCavalry Diridalus",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-011#a0",
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
          "cleanBody": "You can destroy an opposing 2000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "You can destroy an opposing 2000 BP or less Spirit.",
            "cleanText": "You can destroy an opposing 2000 BP or less Spirit",
            "link": null,
            "isOptional": true,
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
      },
      {
        "id": "BS03-011#a1",
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
          "cleanBody": "All your Spirits with only one core on them gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with only one core on them gain +2000 BP.",
            "cleanText": "All your Spirits with only one core on them gain +2000 BP",
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
  "BATTLE-SPIRITS-A9653": {
    "cardNumber": "BATTLE-SPIRITS-A9653",
    "name": "The Earth of Aurora",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A9653#a0",
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
          "cleanBody": "(Permanent) Each time one or more cores are moved from a spirit you control to your Reserve or Trash by the effects of a card your opponent controls, gain 1 core in your Reserve."
        },
        "clauses": [
          {
            "rawText": "Each time one or more cores are moved from a spirit you control to your Reserve or Trash by the effects of a card your opponent controls, gain 1 core in your Reserve.",
            "cleanText": "Each time one or more cores are moved from a spirit you control to your Reserve or Trash by the effects of a card your opponent controls, gain 1 core in your Reserve",
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
        "id": "BATTLE-SPIRITS-A9653#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "If you control an \"Armed Machine\" spirit, gain 1 core in your Reserve."
        },
        "clauses": [
          {
            "rawText": "If you control an \"Armed Machine\" spirit, gain 1 core in your Reserve.",
            "cleanText": "gain 1 core in your Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control an \"Armed Machine\" spirit",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A9674": {
    "cardNumber": "BATTLE-SPIRITS-A9674",
    "name": "The EvilGrass Mindragora",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A9674#a0",
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
          "cleanBody": "Move 1 core from target spirit your opponent controls to their Reserve."
        },
        "clauses": [
          {
            "rawText": "Move 1 core from target spirit your opponent controls to their Reserve.",
            "cleanText": "Move 1 core from target spirit your opponent controls to their Reserve",
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
  "BS03-058": {
    "cardNumber": "BS03-058",
    "name": "The Fairy Tinguly",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-058#a0",
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
          "cleanBody": "During this turn, all your Spirits are also treated as Yellow Spirits."
        },
        "clauses": [
          {
            "rawText": "During this turn, all your Spirits are also treated as Yellow Spirits.",
            "cleanText": "all your Spirits are also treated as Yellow Spirits",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A9753": {
    "cardNumber": "BATTLE-SPIRITS-A9753",
    "name": "The Endless Horizon",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A9753#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The BP of each LV1 spirits you control is treated as their LV2 BP in the Showdown Step."
        },
        "clauses": [
          {
            "rawText": "The BP of each LV1 spirits you control is treated as their LV2 BP in the Showdown Step.",
            "cleanText": "The BP of each LV1 spirits you control is treated as their LV2 BP in the Showdown Step",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": {
                "side": "either"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A9753#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Each time a spirit you control with High Speed is defeated, you may move more 1 core from your Reserve to your Trash. In that case, the defeated spirit is moved to your hand instead of your Trash."
        },
        "clauses": [
          {
            "rawText": "Each time a spirit you control with High Speed is defeated, you may move more 1 core from your Reserve to your Trash.",
            "cleanText": "Each time a spirit you control with High Speed is defeated, you may move more 1 core from your Reserve to your Trash",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false
            }
          },
          {
            "rawText": "In that case, the defeated spirit is moved to your hand instead of your Trash.",
            "cleanText": "In that case, the defeated spirit is moved to your hand instead of your Trash",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SALVAGE",
              "from": "trash",
              "to": "hand"
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
  "BATTLE-SPIRITS-A9906": {
    "cardNumber": "BATTLE-SPIRITS-A9906",
    "name": "The FortressCrasher Dennis",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A9906#a0",
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
          "cleanBody": "You may discard a nexus card from your hand. In that case, this spirit gets +5000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "You may discard a nexus card from your hand.",
            "cleanText": "You may discard a nexus card from your hand",
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
          },
          {
            "rawText": "In that case, this spirit gets +5000BP until end of turn.",
            "cleanText": "In that case, this spirit gets +5000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 5000,
              "target": "SELF",
              "duration": "UNTIL_END_OF_TURN"
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
  "BS03-017": {
    "cardNumber": "BS03-017",
    "name": "The GhostCaptain Silvershark",
    "keywords": [
      {
        "name": "Curse",
        "parameter": null,
        "wave": 1,
        "hook": "curse",
        "bracketed": true,
        "index": 11
      }
    ],
    "abilities": [
      {
        "id": "BS03-017#a0",
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
          "keyword": "Curse",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing Spirit that blocked at the end of battle."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit that blocked at the end of battle.",
            "cleanText": "Destroy an opposing Spirit that blocked at the end of battle",
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
      },
      {
        "id": "BS03-017#a1",
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
          "cleanBody": "You can destroy a Spirit with two cores on it."
        },
        "clauses": [
          {
            "rawText": "You can destroy a Spirit with two cores on it.",
            "cleanText": "You can destroy a Spirit with two cores on it",
            "link": null,
            "isOptional": true,
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A10254": {
    "cardNumber": "BATTLE-SPIRITS-A10254",
    "name": "The GiantCentaurusSoldier Danston",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-X12": {
    "cardNumber": "BS03-X12",
    "name": "The GiantHero Titus",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-X12#a0",
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
          "cleanBody": "Discard ten cards from the opposing decktop."
        },
        "clauses": [
          {
            "rawText": "Discard ten cards from the opposing decktop.",
            "cleanText": "Discard ten cards from the opposing decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
              "side": "opp"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-X12#a1",
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
          "cleanBody": "When only the opposing Spirit is destroyed by BP comparison, discard ten cards from the opposing decktop."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed by BP comparison, discard ten cards from the opposing decktop.",
            "cleanText": "When only the opposing Spirit is destroyed by BP comparison, discard ten cards from the opposing decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
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
  "BS03-035": {
    "cardNumber": "BS03-035",
    "name": "The GoldenFlower Zonne-Bloem",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-035#a0",
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
          "cleanBody": "Put a core from the Void each to every \"Plant Spirit\"/\"Winged Beast\" family Spirit you control."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void each to every \"Plant Spirit\"/\"Winged Beast\" family Spirit you control.",
            "cleanText": "Put a core from the Void each to every \"Plant Spirit\"/\"Winged Beast\" family Spirit you control",
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
  "BS03-036": {
    "cardNumber": "BS03-036",
    "name": "The GodBird Peagod",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-036#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
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
          "cleanBody": "When this Spirit is destroyed by opposing Spirits via BP comparison, put four cores from the Void to your Reserve."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is destroyed by opposing Spirits via BP comparison, put four cores from the Void to your Reserve.",
            "cleanText": "When this Spirit is destroyed by opposing Spirits via BP comparison, put four cores from the Void to your Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 4,
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-036#a1",
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
          "cleanBody": "This Spirit gain +1000 BP for each \"Winged Beast\" family Spirit you control."
        },
        "clauses": [
          {
            "rawText": "This Spirit gain +1000 BP for each \"Winged Beast\" family Spirit you control.",
            "cleanText": "This Spirit gain +1000 BP for each \"Winged Beast\" family Spirit you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
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
  "BS03-012": {
    "cardNumber": "BS03-012",
    "name": "The GrandBishop Levia",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-012#a0",
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
          "cleanBody": "You can destroy a Spirit with three cores or less on it."
        },
        "clauses": [
          {
            "rawText": "You can destroy a Spirit with three cores or less on it.",
            "cleanText": "You can destroy a Spirit with three cores or less on it",
            "link": null,
            "isOptional": true,
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
        "id": "BS03-012#a1",
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
          "cleanBody": "When only the opposing Spirit is destroyed by comparing BP, return a Spirit card from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed by comparing BP, return a Spirit card from your Trash to the Hand.",
            "cleanText": "When only the opposing Spirit is destroyed by comparing BP, return a Spirit card from your Trash to the Hand",
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
  "BATTLE-SPIRITS-A10463": {
    "cardNumber": "BATTLE-SPIRITS-A10463",
    "name": "The GreatAngelia Exsia",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A10463#a0",
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
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "While this spirit is battling, each time you play a spell card, at the End of Battle Step, move that spell card from your Trash to your hand."
        },
        "clauses": [
          {
            "rawText": "While this spirit is battling, each time you play a spell card, at the End of Battle Step, move that spell card from your Trash to your hand.",
            "cleanText": "each time you play a spell card, at the End of Battle Step, move that spell card from your Trash to your hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While this spirit is battling",
            "duration": null,
            "op": {
              "op": "SALVAGE",
              "from": "trash",
              "to": "hand"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A10463#a1",
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
          "cleanBody": "If you control a purple nexus, draw 1 card."
        },
        "clauses": [
          {
            "rawText": "If you control a purple nexus, draw 1 card.",
            "cleanText": "draw 1 card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control a purple nexus",
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
  "BATTLE-SPIRITS-A10553": {
    "cardNumber": "BATTLE-SPIRITS-A10553",
    "name": "The GroundSupporter Francis",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A10553#a0",
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
          "cleanBody": "You may discard a nexus card from your hand. In that case, this spirit gets +5000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "You may discard a nexus card from your hand.",
            "cleanText": "You may discard a nexus card from your hand",
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
          },
          {
            "rawText": "In that case, this spirit gets +5000BP until end of turn.",
            "cleanText": "In that case, this spirit gets +5000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 5000,
              "target": "SELF",
              "duration": "UNTIL_END_OF_TURN"
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
  "BS03-117": {
    "cardNumber": "BS03-117",
    "name": "The H.Q. filled with Fighting Spirits",
    "keywords": [
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 48
      },
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 176
      }
    ],
    "abilities": [
      {
        "id": "BS03-117#a0",
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
          "cleanBody": "Your Spirits' [Crush] effects also activate at (When Blocks)."
        },
        "clauses": [
          {
            "rawText": "Your Spirits' [Crush] effects also activate at (When Blocks).",
            "cleanText": "Your Spirits' [Crush] effects also activate at (When Blocks)",
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
        "id": "BS03-117#a1",
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
          "cleanBody": "When cards are discarded from the opposing deck via [Crush] effects, put a core from the Void to your Reserve."
        },
        "clauses": [
          {
            "rawText": "When cards are discarded from the opposing deck via [Crush] effects, put a core from the Void to your Reserve.",
            "cleanText": "When cards are discarded from the opposing deck via [Crush] effects, put a core from the Void to your Reserve",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A10823": {
    "cardNumber": "BATTLE-SPIRITS-A10823",
    "name": "The High Sky Covered by Metal",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A10823#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "(Opponent's Battle Phase) At start of Phase, refresh target exhausted spirit you control with no printed effects."
        },
        "clauses": [
          {
            "rawText": "(Opponent's Battle Phase) At start of Phase, refresh target exhausted spirit you control with no printed effects.",
            "cleanText": "(Opponent's Battle Phase) At start of Phase, refresh target exhausted spirit you control with no printed effects",
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
        "id": "BATTLE-SPIRITS-A10823#a1",
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
          "cleanBody": "(Opponent's Battle Phase) At start of Phase, refresh all exhausted spirits you control with no printed effects."
        },
        "clauses": [
          {
            "rawText": "(Opponent's Battle Phase) At start of Phase, refresh all exhausted spirits you control with no printed effects.",
            "cleanText": "(Opponent's Battle Phase) At start of Phase, refresh all exhausted spirits you control with no printed effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REFRESH",
              "all": true,
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
  "BS03-053": {
    "cardNumber": "BS03-053",
    "name": "The HundredFaces Flatface",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-053#a0",
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
      },
      {
        "id": "BS03-053#a1",
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
  "BS03-X10": {
    "cardNumber": "BS03-X10",
    "name": "The IceBeast Mam-Morl",
    "keywords": [
      {
        "name": "Armor",
        "parameter": "Red/Purple/Green",
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 142
      },
      {
        "name": "Armor",
        "parameter": "Red/Purple/Green/Yellow/Blue",
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 282
      }
    ],
    "abilities": [
      {
        "id": "BS03-X10#a0",
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
          "cleanBody": "Give all your White Spirits the effect: \"(When Blocks) This Spirit gains +2000 BP.\""
        },
        "clauses": [
          {
            "rawText": "Give all your White Spirits the effect: \"(When Blocks) This Spirit gains +2000 BP.\"",
            "cleanText": "Give all your White Spirits the effect: \"(When Blocks) This Spirit gains +2000 BP.\"",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": "self",
              "duration": "THIS_TURN"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-X10#a1",
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
          "cleanBody": "Give all your Spirits the effect: \"[Armor: Red/Purple/Green] This Spirit is unaffected by opposing Red/Purple/Green Spirit/Nexus/Magic effects.\""
        },
        "clauses": [
          {
            "rawText": "Give all your Spirits the effect: \"[Armor: Red/Purple/Green] This Spirit is unaffected by opposing Red/Purple/Green Spirit/Nexus/Magic effects.\"",
            "cleanText": "Give all your Spirits the effect: \"[Armor: Red/Purple/Green] This Spirit is unaffected by opposing Red/Purple/Green Spirit/Nexus/Magic effects.\"",
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
        "id": "BS03-X10#a2",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Give all your Spirits: [Armor: Red/Purple/Green/Yellow/Blue]."
        },
        "clauses": [
          {
            "rawText": "Give all your Spirits: [Armor: Red/Purple/Green/Yellow/Blue].",
            "cleanText": "Give all your Spirits: [Armor: Red/Purple/Green/Yellow/Blue]",
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
  "BATTLE-SPIRITS-A11148": {
    "cardNumber": "BATTLE-SPIRITS-A11148",
    "name": "The Kingdom of Cards",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11148#a0",
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
          "cleanBody": "(During Your Battle Phrase) All \"Magician\" spirits you control cannot be exhausted by the effects of a card your opponent controls."
        },
        "clauses": [
          {
            "rawText": "(During Your Battle Phrase) All \"Magician\" spirits you control cannot be exhausted by the effects of a card your opponent controls.",
            "cleanText": "(During Your Battle Phrase) All \"Magician\" spirits you control cannot be exhausted by the effects of a card your opponent controls",
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
        "id": "BATTLE-SPIRITS-A11148#a1",
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
          "cleanBody": "(During Your Battle Phrase) Each time a Yellow spirit you control is destroyed or depleted, refresh target exhausted \"Magician\" spirit you control."
        },
        "clauses": [
          {
            "rawText": "(During Your Battle Phrase) Each time a Yellow spirit you control is destroyed or depleted, refresh target exhausted \"Magician\" spirit you control.",
            "cleanText": "(During Your Battle Phrase) Each time a Yellow spirit you control is destroyed or depleted, refresh target exhausted \"Magician\" spirit you control",
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
  "BATTLE-SPIRITS-A11399": {
    "cardNumber": "BATTLE-SPIRITS-A11399",
    "name": "The Middle of Hard Battle",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11399#a0",
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
          "cleanBody": "(Opponent's Battle Phase) At start of Phase, destroy target spirit your opponent controls with 1000 BP or less."
        },
        "clauses": [
          {
            "rawText": "(Opponent's Battle Phase) At start of Phase, destroy target spirit your opponent controls with 1000 BP or less.",
            "cleanText": "(Opponent's Battle Phase) At start of Phase, destroy target spirit your opponent controls with 1000 BP or less",
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
        "id": "BATTLE-SPIRITS-A11399#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Each time a spirit you control with Evolution defeats a spirit, destroy target spirit your opponent controls with the same BP as the defeated spirits BP."
        },
        "clauses": [
          {
            "rawText": "Each time a spirit you control with Evolution defeats a spirit, destroy target spirit your opponent controls with the same BP as the defeated spirits BP.",
            "cleanText": "Each time a spirit you control with Evolution defeats a spirit, destroy target spirit your opponent controls with the same BP as the defeated spirits BP",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A11637": {
    "cardNumber": "BATTLE-SPIRITS-A11637",
    "name": "The Outlaw Wasteland",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11637#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "All spirits you control with no printed effects get +2000BP."
        },
        "clauses": [
          {
            "rawText": "All spirits you control with no printed effects get +2000BP.",
            "cleanText": "All spirits you control with no printed effects get +2000BP",
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
        "id": "BATTLE-SPIRITS-A11637#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Each time a spirit you control with no printed effects would be defeated, it remains on your Field exhausted instead."
        },
        "clauses": [
          {
            "rawText": "Each time a spirit you control with no printed effects would be defeated, it remains on your Field exhausted instead.",
            "cleanText": "Each time a spirit you control with no printed effects would be defeated, it remains on your Field exhausted instead",
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
  "BS03-072": {
    "cardNumber": "BS03-072",
    "name": "The Pikeman Jeffrey",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-114": {
    "cardNumber": "BS03-114",
    "name": "The Rampart of Sapphire",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-114#a0",
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
          "cleanBody": "For your Spirits with no printed effects, if there is one core on them, treat them as LV1; If there are two cores, treat them as LV2; If there are three cores or more, treat them as being on their highest level."
        },
        "clauses": [
          {
            "rawText": "For your Spirits with no printed effects, if there is one core on them, treat them as LV1; If there are two cores, treat them as LV2; If there are three cores or more, treat them as being on their highest level.",
            "cleanText": "For your Spirits with no printed effects, if there is one core on them, treat them as LV1; If there are two cores, treat them as LV2; If there are three cores or more, treat them as being on their highest level",
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
        "id": "BS03-114#a1",
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
          "cleanBody": "While you control three or more Spirits with no printed effects, all your Nexuses can't be destroyed by opposing Spirit/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "While you control three or more Spirits with no printed effects, all your Nexuses can't be destroyed by opposing Spirit/Nexus/Magic effects.",
            "cleanText": "all your Nexuses can't be destroyed by opposing Spirit/Nexus/Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you control three or more Spirits with no printed effects",
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
  },
  "BARAN-BARAN2": {
    "cardNumber": "BARAN-BARAN2",
    "name": "The Repairer Baran-Baran",
    "keywords": [],
    "abilities": [
      {
        "id": "BARAN-BARAN2#a0",
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
          "cleanBody": "(During the Battle Phase) While you control a green nexus, each time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effect of Crush, gain 1 core on this spirit."
        },
        "clauses": [
          {
            "rawText": "(During the Battle Phase) While you control a green nexus, each time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effect of Crush, gain 1 core on this spirit.",
            "cleanText": "(During the Battle Phase) While you control a green nexus, each time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effect of Crush, gain 1 core on this spirit",
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
                "target": "SELF"
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
  "BATTLE-SPIRITS-A12032": {
    "cardNumber": "BATTLE-SPIRITS-A12032",
    "name": "The RoseLady Barossa",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A12032#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You may play yellow spell cards from your hand without paying their cost."
        },
        "clauses": [
          {
            "rawText": "You may play yellow spell cards from your hand without paying their cost.",
            "cleanText": "You may play yellow spell cards from your hand without paying their cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CAST_MAGIC_FREE"
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
  "BS03-110": {
    "cardNumber": "BS03-110",
    "name": "The Sacred Place in Falling Stars",
    "keywords": [
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 56
      },
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 118
      }
    ],
    "abilities": [
      {
        "id": "BS03-110#a0",
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
          "cleanBody": "All your Spirits with [Brilliance] gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with [Brilliance] gain +2000 BP.",
            "cleanText": "All your Spirits with [Brilliance] gain +2000 BP",
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
        "id": "BS03-110#a1",
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
          "cleanBody": "The [Brilliance] effects of your Spirits also activate at (When Blocks)."
        },
        "clauses": [
          {
            "rawText": "The [Brilliance] effects of your Spirits also activate at (When Blocks).",
            "cleanText": "The [Brilliance] effects of your Spirits also activate at (When Blocks)",
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
  "BS03-X09": {
    "cardNumber": "BS03-X09",
    "name": "The SavageKnight Hercules",
    "keywords": [
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 19
      },
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 239
      }
    ],
    "abilities": [
      {
        "id": "BS03-X09#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
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
          "cleanBody": "This Spirit card in Hand can be summoned during the Flash Timing. When you do, cores to be put on this Spirit and its cost must be paid from the Reserve."
        },
        "clauses": [
          {
            "rawText": "This Spirit card in Hand can be summoned during the Flash Timing.",
            "cleanText": "This Spirit card in Hand can be summoned during the Flash Timing",
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
            "rawText": "When you do, cores to be put on this Spirit and its cost must be paid from the Reserve.",
            "cleanText": "When you do, cores to be put on this Spirit and its cost must be paid from the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_ACTION",
              "keyword": "High Speed"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-X09#a1",
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
          "cleanBody": "Refresh all Spirits with [High Speed]."
        },
        "clauses": [
          {
            "rawText": "Refresh all Spirits with [High Speed].",
            "cleanText": "Refresh all Spirits with [High Speed]",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A12155": {
    "cardNumber": "BATTLE-SPIRITS-A12155",
    "name": "The SeaCreature Dugong",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS03-045": {
    "cardNumber": "BS03-045",
    "name": "The SilverFox Hati",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-045#a0",
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
          "cleanBody": "This Spirit gains +5000 BP."
        },
        "clauses": [
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-061": {
    "cardNumber": "BS03-061",
    "name": "The StrawberryGirl Strawberi",
    "keywords": [
      {
        "name": "Brilliance",
        "parameter": null,
        "wave": 3,
        "hook": "brilliance",
        "bracketed": true,
        "index": 45
      }
    ],
    "abilities": [
      {
        "id": "BS03-061#a0",
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
          "cleanBody": "Refresh a Spirit with [Brilliance] you control."
        },
        "clauses": [
          {
            "rawText": "Refresh a Spirit with [Brilliance] you control.",
            "cleanText": "Refresh a Spirit with [Brilliance] you control",
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
  "BATTLE-SPIRITS-A13392": {
    "cardNumber": "BATTLE-SPIRITS-A13392",
    "name": "The Unicorn Einhorn",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13392#a0",
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
          "cleanBody": "This spirit gets +1000BP for each nexus you control until end of turn."
        },
        "clauses": [
          {
            "rawText": "This spirit gets +1000BP for each nexus you control until end of turn.",
            "cleanText": "This spirit gets +1000BP for each nexus you control until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "SELF",
              "forEach": "NEXUS_COUNT"
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
  "BS03-024": {
    "cardNumber": "BS03-024",
    "name": "The VampireKnight Nosferat",
    "keywords": [
      {
        "name": "Curse",
        "parameter": null,
        "wave": 1,
        "hook": "curse",
        "bracketed": true,
        "index": 100
      }
    ],
    "abilities": [
      {
        "id": "BS03-024#a0",
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
          "cleanBody": "This Spirit can't be blocked by LV1 Spirits."
        },
        "clauses": [
          {
            "rawText": "This Spirit can't be blocked by LV1 Spirits.",
            "cleanText": "This Spirit can't be blocked by LV1 Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "UNBLOCKABLE",
              "target": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-024#a1",
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
          "cleanBody": "All your Spirits with [Curse] can't be blocked by LV1 Spirits."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with [Curse] can't be blocked by LV1 Spirits.",
            "cleanText": "All your Spirits with [Curse] can't be blocked by LV1 Spirits",
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
  "BATTLE-SPIRITS-A13525": {
    "cardNumber": "BATTLE-SPIRITS-A13525",
    "name": "The Weaponsmith Bagin",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13525#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "This spirit gets +1000BP for each nexus you control until end of turn."
        },
        "clauses": [
          {
            "rawText": "This spirit gets +1000BP for each nexus you control until end of turn.",
            "cleanText": "This spirit gets +1000BP for each nexus you control until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "SELF",
              "forEach": "NEXUS_COUNT"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A13525#a1",
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
          "cleanBody": "This spirit gets +1000BP for each nexus players control until end of turn."
        },
        "clauses": [
          {
            "rawText": "This spirit gets +1000BP for each nexus players control until end of turn.",
            "cleanText": "This spirit gets +1000BP for each nexus players control until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "SELF",
              "forEach": "NEXUS_COUNT"
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
  "BATTLE-SPIRITS-A13677": {
    "cardNumber": "BATTLE-SPIRITS-A13677",
    "name": "The WoodenSpirit Dryadena",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A14198": {
    "cardNumber": "BATTLE-SPIRITS-A14198",
    "name": "United Power",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A14198#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust an unexhausted spirit you control. In that case, target spirit you control gets + X BP until end of turn where X is equal to the exhausted spirits BP."
        },
        "clauses": [
          {
            "rawText": "Exhaust an unexhausted spirit you control.",
            "cleanText": "Exhaust an unexhausted spirit you control",
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
            "rawText": "In that case, target spirit you control gets + X BP until end of turn where X is equal to the exhausted spirits BP.",
            "cleanText": "In that case, target spirit you control gets + X BP until end of turn where X is equal to the exhausted spirits BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
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
  "VER-THANDIA2": {
    "cardNumber": "VER-THANDIA2",
    "name": "Ver-Thandia",
    "keywords": [],
    "abilities": [
      {
        "id": "VER-THANDIA2#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "Refresh target exhausted \"Giant Beast\" spirit you control."
        },
        "clauses": [
          {
            "rawText": "Refresh target exhausted \"Giant Beast\" spirit you control.",
            "cleanText": "Refresh target exhausted \"Giant Beast\" spirit you control",
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
        "id": "VER-THANDIA2#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
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
          "cleanBody": "If you control \"Ur-Dine\", \"Ver-Thandia\" and \"Skuldia\", gain 1 core in your Reserve."
        },
        "clauses": [
          {
            "rawText": "If you control \"Ur-Dine\", \"Ver-Thandia\" and \"Skuldia\", gain 1 core in your Reserve.",
            "cleanText": "\"Ver-Thandia\" and \"Skuldia\", gain 1 core in your Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control \"Ur-Dine\"",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS03-101": {
    "cardNumber": "BS03-101",
    "name": "Volcano-Golem",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-101#a0",
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, put a core from the Void each to every Blue Nexus you control."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, put a core from the Void each to every Blue Nexus you control.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, put a core from the Void each to every Blue Nexus you control",
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
  "BATTLE-SPIRITS-A14357": {
    "cardNumber": "BATTLE-SPIRITS-A14357",
    "name": "Weakness",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A14357#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Move all but 1 core from target spirit to its owner's reserve."
        },
        "clauses": [
          {
            "rawText": "Move all but 1 core from target spirit to its owner's reserve.",
            "cleanText": "Move all but 1 core from target spirit to its owner's reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": "ALL_BUT_ONE",
              "from": {
                "zone": "field",
                "side": "either",
                "types": [
                  "Spirit"
                ]
              },
              "to": {
                "zone": "field"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A14357#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Target spirit gets +3000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit gets +3000BP until end of turn.",
            "cleanText": "Target spirit gets +3000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "target": "target",
              "duration": "UNTIL_END_OF_TURN"
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
  "ARMA-DILLO2": {
    "cardNumber": "ARMA-DILLO2",
    "name": "Arma-Dillo",
    "keywords": [],
    "abilities": [
      {
        "id": "ARMA-DILLO2#a0",
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
          "cleanBody": "All your White Spirits gain +1000 BP."
        },
        "clauses": [
          {
            "rawText": "All your White Spirits gain +1000 BP.",
            "cleanText": "All your White Spirits gain +1000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": {
                "side": "self",
                "types": [
                  "Spirit"
                ],
                "color": "White"
              },
              "all": true
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
  "BAT-BAT2": {
    "cardNumber": "BAT-BAT2",
    "name": "Bat-Bat",
    "keywords": [],
    "abilities": [
      {
        "id": "BAT-BAT2#a0",
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
          "cleanBody": "If this spirit is blocked, you may move 1 core from the blocking spirit to its owner's reserve."
        },
        "clauses": [
          {
            "rawText": "If this spirit is blocked, you may move 1 core from the blocking spirit to its owner's reserve.",
            "cleanText": "you may move 1 core from the blocking spirit to its owner's reserve",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": "If this spirit is blocked",
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "target": "BLOCKING_SPIRIT"
              },
              "to": {
                "zone": "reserve"
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
  "BATTLE-SPIRITS-A931": {
    "cardNumber": "BATTLE-SPIRITS-A931",
    "name": "Bathopper",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A931#a0",
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
          "cleanBody": "Gain 1 core on this spirit."
        },
        "clauses": [
          {
            "rawText": "Gain 1 core on this spirit.",
            "cleanText": "Gain 1 core on this spirit",
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
                "target": "SELF"
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
  "BATTLE-SPIRITS-A934": {
    "cardNumber": "BATTLE-SPIRITS-A934",
    "name": "Caprihorn",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A934#a0",
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
          "cleanBody": "This spirit gets +1000 BP for each unexhausted spirit your opponent controls until end of turn."
        },
        "clauses": [
          {
            "rawText": "This spirit gets +1000 BP for each unexhausted spirit your opponent controls until end of turn.",
            "cleanText": "This spirit gets +1000 BP for each unexhausted spirit your opponent controls until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 1000,
              "target": "SELF",
              "forEach": "OPP_UNEXHAUSTED_SPIRIT_COUNT"
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
  "BATTLE-SPIRITS-A935": {
    "cardNumber": "BATTLE-SPIRITS-A935",
    "name": "Cast Off (Card)",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A935#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy target \"Parasite\" spirit you control. In that case, summon a spirit card from your hand with a cost of five without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Destroy target \"Parasite\" spirit you control.",
            "cleanText": "Destroy target \"Parasite\" spirit you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "self",
                "types": [
                  "Spirit"
                ],
                "family": "Parasite"
              }
            }
          },
          {
            "rawText": "In that case, summon a spirit card from your hand with a cost of five without paying the cost.",
            "cleanText": "In that case, summon a spirit card from your hand with a cost of five without paying the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_FREE",
              "from": "hand",
              "cost": 5
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A935#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Target spirit gets +2000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit gets +2000BP until end of turn.",
            "cleanText": "Target spirit gets +2000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": "target",
              "duration": "UNTIL_END_OF_TURN"
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
  "BATTLE-SPIRITS-A936": {
    "cardNumber": "BATTLE-SPIRITS-A936",
    "name": "Chagamaru",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A936#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opponent's Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When this Spirit is destroyed by opposing Spirit/Magic/Nexus effects, by sending all but one core on this Spirit to the Trash, it returns to the field, refreshed."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is destroyed by opposing Spirit/Magic/Nexus effects, by sending all but one core on this Spirit to the Trash, it returns to the field, refreshed.",
            "cleanText": "When this Spirit is destroyed by opposing Spirit/Magic/Nexus effects, by sending all but one core on this Spirit to the Trash, it returns to the field, refreshed",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "RESURRECT",
              "state": "refreshed"
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
  "BATTLE-SPIRITS-A937": {
    "cardNumber": "BATTLE-SPIRITS-A937",
    "name": "Chauw",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A937#a0",
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
          "cleanBody": "(Permanent) Each time 1 or more cores are put on this spirit due to an effect, increase the number by 1."
        },
        "clauses": [
          {
            "rawText": "Each time 1 or more cores are put on this spirit due to an effect, increase the number by 1.",
            "cleanText": "Each time 1 or more cores are put on this spirit due to an effect, increase the number by 1",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUOUS_RULE",
              "rule": "EXTRA_CORE_ON_PUT"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A937#a1",
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
          "cleanBody": "(Permanent) Each time 1 or more cores are moved from a spirit to its owner's Reserve, due to an effect, increase that number by 1."
        },
        "clauses": [
          {
            "rawText": "Each time 1 or more cores are moved from a spirit to its owner's Reserve, due to an effect, increase that number by 1.",
            "cleanText": "Each time 1 or more cores are moved from a spirit to its owner's Reserve, due to an effect, increase that number by 1",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUOUS_RULE",
              "rule": "EXTRA_CORE_ON_REMOVE"
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
  "BATTLE-SPIRITS-A949": {
    "cardNumber": "BATTLE-SPIRITS-A949",
    "name": "Liorider",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A949#a0",
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
          "cleanBody": "(During Opponent's Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit."
        },
        "clauses": [
          {
            "rawText": "(During Opponent's Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit.",
            "cleanText": "(During Opponent's Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A954": {
    "cardNumber": "BATTLE-SPIRITS-A954",
    "name": "Mind Flare",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A954#a0",
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
          "cleanBody": "If the opponent controls two or more Spirits with the same name, leaving off one Spirit for each different name, and destroy all the other Spirits."
        },
        "clauses": [
          {
            "rawText": "If the opponent controls two or more Spirits with the same name, leaving off one Spirit for each different name",
            "cleanText": "leaving off one Spirit for each different name",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the opponent controls two or more Spirits with the same name",
            "duration": null,
            "op": {
              "op": "TARGET_SELECT",
              "filter": {
                "duplicateNames": true
              }
            }
          },
          {
            "rawText": "destroy all the other Spirits.",
            "cleanText": "destroy all the other Spirits",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "all": true,
              "target": {
                "types": [
                  "Spirit"
                ],
                "excludeMatches": true
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A954#a1",
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
          "cleanBody": "During this turn, give a Spirit gets +4000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit gets +4000 BP.",
            "cleanText": "give a Spirit gets +4000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 4000,
              "target": {
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
  "BATTLE-SPIRITS-A955": {
    "cardNumber": "BATTLE-SPIRITS-A955",
    "name": "Mummella",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A955#a0",
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
          "cleanBody": "Move 1 core from target spirit your opponent controls to its owner's Reserve."
        },
        "clauses": [
          {
            "rawText": "Move 1 core from target spirit your opponent controls to its owner's Reserve.",
            "cleanText": "Move 1 core from target spirit your opponent controls to its owner's Reserve",
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
  "BATTLE-SPIRITS-A959": {
    "cardNumber": "BATTLE-SPIRITS-A959",
    "name": "Phantasma",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A960": {
    "cardNumber": "BATTLE-SPIRITS-A960",
    "name": "Piyon",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A961": {
    "cardNumber": "BATTLE-SPIRITS-A961",
    "name": "Porkne",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A961#a0",
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
          "cleanBody": "(Permanent) All \"Drifting Spirits\" you control are unaffected by the effects of spells your opponent controls."
        },
        "clauses": [
          {
            "rawText": "All \"Drifting Spirits\" you control are unaffected by the effects of spells your opponent controls.",
            "cleanText": "All \"Drifting Spirits\" you control are unaffected by the effects of spells your opponent controls",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUOUS_RULE",
              "rule": "SPELL_IMMUNITY"
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
  "BATTLE-SPIRITS-A963": {
    "cardNumber": "BATTLE-SPIRITS-A963",
    "name": "Rom",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A966": {
    "cardNumber": "BATTLE-SPIRITS-A966",
    "name": "Scorpede",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A966#a0",
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
          "cleanBody": "You may deploy target white or green nexus card from your Trash without paying its cost."
        },
        "clauses": [
          {
            "rawText": "You may deploy target white or green nexus card from your Trash without paying its cost.",
            "cleanText": "You may deploy target white or green nexus card from your Trash without paying its cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DEPLOY_NEXUS",
              "from": "trash",
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
  "BATTLE-SPIRITS-A968": {
    "cardNumber": "BATTLE-SPIRITS-A968",
    "name": "Sheeple",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A969": {
    "cardNumber": "BATTLE-SPIRITS-A969",
    "name": "Skuldia",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A969#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "REFRESH_STEP",
          "timingLabel": "Your Refresh Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This spirit cannot be refreshed."
        },
        "clauses": [
          {
            "rawText": "This spirit cannot be refreshed.",
            "cleanText": "This spirit cannot be refreshed",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SET_RESTRICTION",
              "restriction": "CANNOT_REFRESH",
              "target": "SELF"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A969#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_EXHAUSTED",
          "timingLabel": "When Exhausted",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Select an exhausted spirit your opponent controls. In that case, while this spirit is exhausted, that spirit cannot be refreshed."
        },
        "clauses": [
          {
            "rawText": "Select an exhausted spirit your opponent controls.",
            "cleanText": "Select an exhausted spirit your opponent controls",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET_SELECT",
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "state": "exhausted"
              }
            }
          },
          {
            "rawText": "In that case, while this spirit is exhausted, that spirit cannot be refreshed.",
            "cleanText": "In that case, while this spirit is exhausted, that spirit cannot be refreshed",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SET_RESTRICTION",
              "restriction": "CANNOT_REFRESH",
              "target": "TARGETED"
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
  "BS03-014": {
    "cardNumber": "BS03-014",
    "name": "Skull-Fish",
    "keywords": [
      {
        "name": "Curse",
        "parameter": null,
        "wave": 1,
        "hook": "curse",
        "bracketed": true,
        "index": 78
      }
    ],
    "abilities": [
      {
        "id": "BS03-014#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "This Spirit can't block opposing Spirits."
        },
        "clauses": [
          {
            "rawText": "This Spirit can't block opposing Spirits.",
            "cleanText": "This Spirit can't block opposing Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SET_RESTRICTION",
              "target": "self",
              "restriction": "CANNOT_BLOCK"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS03-014#a1",
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
          "keyword": "Curse",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing Spirit that blocked at the end of battle."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit that blocked at the end of battle.",
            "cleanText": "Destroy an opposing Spirit that blocked at the end of battle",
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
  "BATTLE-SPIRITS-A978": {
    "cardNumber": "BATTLE-SPIRITS-A978",
    "name": "The BalloonMan Barball",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A981": {
    "cardNumber": "BATTLE-SPIRITS-A981",
    "name": "The BlossomChild Lip",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A981#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Each time a spirit your opponent controls blocks a yellow spirit you control, if you control a combination of three yellow spirits or yellow nexuses, that blocking spirit is treated as being at LV1 until end of turn."
        },
        "clauses": [
          {
            "rawText": "Each time a spirit your opponent controls blocks a yellow spirit you control, if you control a combination of three yellow spirits or yellow nexuses, that blocking spirit is treated as being at LV1 until end of turn.",
            "cleanText": "Each time a spirit your opponent controls blocks a yellow spirit you control, if you control a combination of three yellow spirits or yellow nexuses, that blocking spirit is treated as being at LV1 until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "TREAT_LEVEL",
              "level": 1
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
  "BATTLE-SPIRITS-A984": {
    "cardNumber": "BATTLE-SPIRITS-A984",
    "name": "The CavalryBeast Sleiphorse",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A984#a0",
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
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Each time this spirit gets an addition to its BP due to the effects of a green spell, this spirit gets an addition +2000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Each time this spirit gets an addition to its BP due to the effects of a green spell, this spirit gets an addition +2000BP until end of turn.",
            "cleanText": "Each time this spirit gets an addition to its BP due to the effects of a green spell, this spirit gets an addition +2000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "TRIGGERED_BUFF",
              "trigger": "ON_BP_ADDITION",
              "amount": 2000
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A984#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "During Your Battle Phase",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Each time another green spirit you control gets an addition to its BP due to the effect of a green spell, it gets an additional +2000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Each time another green spirit you control gets an addition to its BP due to the effect of a green spell, it gets an additional +2000BP until end of turn.",
            "cleanText": "Each time another green spirit you control gets an addition to its BP due to the effect of a green spell, it gets an additional +2000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "TRIGGERED_BUFF",
              "trigger": "ON_BP_ADDITION"
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
  "BATTLE-SPIRITS-A987": {
    "cardNumber": "BATTLE-SPIRITS-A987",
    "name": "The Conqueror Cendragos",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A987#a0",
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
          "cleanBody": "Each player selects 1 color among the spirits they control. Then, each player destroys all of their spirits except the ones with the selected color(s)."
        },
        "clauses": [
          {
            "rawText": "Each player selects 1 color among the spirits they control.",
            "cleanText": "Each player selects 1 color among the spirits they control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CHOOSE_COLOR",
              "chooser": "both"
            }
          },
          {
            "rawText": "each player destroys all of their spirits except the ones with the selected color(s).",
            "cleanText": "each player destroys all of their spirits except the ones with the selected color(s)",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "all": true,
              "target": {
                "types": [
                  "Spirit"
                ],
                "excludeMatches": true
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A987#a1",
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
          "cleanBody": "This spirit gets +4000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "This spirit gets +4000BP until end of turn.",
            "cleanText": "This spirit gets +4000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 4000,
              "target": "SELF",
              "duration": "UNTIL_END_OF_TURN"
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
  "BATTLE-SPIRITS-A988": {
    "cardNumber": "BATTLE-SPIRITS-A988",
    "name": "The Corridor of Mirrors",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A988#a0",
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
          "cleanBody": "(During the Battle Phase) Each time a spirit you control with Immunity: X would be defeated by an X color spirit, that spirit may remain on your Field exhausted instead."
        },
        "clauses": [
          {
            "rawText": "(During the Battle Phase) Each time a spirit you control with Immunity: X would be defeated by an X color spirit, that spirit may remain on your Field exhausted instead.",
            "cleanText": "(During the Battle Phase) Each time a spirit you control with Immunity: X would be defeated by an X color spirit, that spirit may remain on your Field exhausted instead",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REMAIN_ON_FIELD_EXHAUSTED"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A988#a1",
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
          "cleanBody": "(During the Battle Phase) Each time your opponent plays a spell, negate that effect. Then, remove 2 cores from this nexus. This effect can be applied only once per turn."
        },
        "clauses": [
          {
            "rawText": "(During the Battle Phase) Each time your opponent plays a spell, negate that effect.",
            "cleanText": "(During the Battle Phase) Each time your opponent plays a spell, negate that effect",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "NEGATE_MAGIC"
            }
          },
          {
            "rawText": "remove 2 cores from this nexus.",
            "cleanText": "remove 2 cores from this nexus",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 2,
              "from": {
                "target": "SELF"
              },
              "to": {
                "zone": "reserve",
                "side": "self"
              },
              "isCost": true
            }
          },
          {
            "rawText": "This effect can be applied only once per turn.",
            "cleanText": "This effect can be applied only once per turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "LIMIT_ONCE_PER_TURN"
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
  "BS03-021": {
    "cardNumber": "BS03-021",
    "name": "The Count Wyhl",
    "keywords": [],
    "abilities": [
      {
        "id": "BS03-021#a0",
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
          "cleanBody": "When only the opposing Spirit is destroyed by comparing BP, exhaust every Spirit with the same LV as that destroyed Spirit."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed by comparing BP, exhaust every Spirit with the same LV as that destroyed Spirit.",
            "cleanText": "When only the opposing Spirit is destroyed by comparing BP, exhaust every Spirit with the same LV as that destroyed Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "target": {
                "matchDestroyedLevel": true,
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
  "BATTLE-SPIRITS-A990": {
    "cardNumber": "BATTLE-SPIRITS-A990",
    "name": "The DarkFeather Yatagross",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A990#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
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
          "cleanBody": "Gain cores in your Reserve equal to the number of cores that were on this spirit when it was destroyed."
        },
        "clauses": [
          {
            "rawText": "Gain cores in your Reserve equal to the number of cores that were on this spirit when it was destroyed.",
            "cleanText": "Gain cores in your Reserve equal to the number of cores that were on this spirit when it was destroyed",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": "CORES_ON_DESTROYED_SPIRIT",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A992": {
    "cardNumber": "BATTLE-SPIRITS-A992",
    "name": "The DragonBuster Archeorni",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A992#a0",
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
          "cleanBody": "When Nexuses on your Field or the opposing Field are destroyed, for each Nexus destroyed, draw a card."
        },
        "clauses": [
          {
            "rawText": "When Nexuses on your Field or the opposing Field are destroyed, for each Nexus destroyed, draw a card.",
            "cleanText": "When Nexuses on your Field or the opposing Field are destroyed, for each Nexus destroyed, draw a card",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "TI-TANYA2": {
    "cardNumber": "TI-TANYA2",
    "name": "The FairyQueen Ti-Tanya",
    "keywords": [],
    "abilities": [
      {
        "id": "TI-TANYA2#a0",
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
          "cleanBody": "(Opponent's Battle Phase) At start of the Phase, you may move 2 cores from your Trash to this spirit."
        },
        "clauses": [
          {
            "rawText": "(Opponent's Battle Phase) At start of the Phase, you may move 2 cores from your Trash to this spirit.",
            "cleanText": "(Opponent's Battle Phase) At start of the Phase, you may move 2 cores from your Trash to this spirit",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 2,
              "from": {
                "zone": "trash",
                "side": "self"
              },
              "to": {
                "target": "SELF"
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
  "BATTLE-SPIRITS-A1003": {
    "cardNumber": "BATTLE-SPIRITS-A1003",
    "name": "The LavaDragon Plesios",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A1003#a0",
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
          "cleanBody": "When both players control three or more colors of Nexuses in total, each player targets a color of Nexuses on their Field, and destroy every Nexus without that color."
        },
        "clauses": [
          {
            "rawText": "When both players control three or more colors of Nexuses in total, each player targets a color of Nexuses on their Field",
            "cleanText": "When both players control three or more colors of Nexuses in total, each player targets a color of Nexuses on their Field",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CHOOSE_COLOR",
              "chooser": "both",
              "targetType": "Nexus"
            }
          },
          {
            "rawText": "destroy every Nexus without that color.",
            "cleanText": "destroy every Nexus without that color",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "all": true,
              "target": {
                "types": [
                  "Nexus"
                ],
                "excludeMatches": true
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A1003#a1",
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
          "cleanBody": "If the opponent controls two or more colors of Nexuses, when this Spirit's attack reduces the opposing Life, send an extra core from the opposing Life to the Reserve."
        },
        "clauses": [
          {
            "rawText": "If the opponent controls two or more colors of Nexuses, when this Spirit's attack reduces the opposing Life, send an extra core from the opposing Life to the Reserve.",
            "cleanText": "when this Spirit's attack reduces the opposing Life, send an extra core from the opposing Life to the Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the opponent controls two or more colors of Nexuses",
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
  "BATTLE-SPIRITS-A1009": {
    "cardNumber": "BATTLE-SPIRITS-A1009",
    "name": "The PreciousBeast Carbulc",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A1009#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
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
          "cleanBody": "Gain 1 core in your Reserve for each \"Imaginary Beast\" spirit you control."
        },
        "clauses": [
          {
            "rawText": "Gain 1 core in your Reserve for each \"Imaginary Beast\" spirit you control.",
            "cleanText": "Gain 1 core in your Reserve for each \"Imaginary Beast\" spirit you control",
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
        "id": "BATTLE-SPIRITS-A1009#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
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
          "cleanBody": "Draw 1 card for each \"Imaginary Beast\" spirit you control."
        },
        "clauses": [
          {
            "rawText": "Draw 1 card for each \"Imaginary Beast\" spirit you control.",
            "cleanText": "Draw 1 card for each \"Imaginary Beast\" spirit you control",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "ZO-GOIN2": {
    "cardNumber": "ZO-GOIN2",
    "name": "The SkullKnight Zo-Goin",
    "keywords": [],
    "abilities": [
      {
        "id": "ZO-GOIN2#a0",
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
          "cleanBody": "Move 1 core from target spirit your opponent controls to its owner's Reserve."
        },
        "clauses": [
          {
            "rawText": "Move 1 core from target spirit your opponent controls to its owner's Reserve.",
            "cleanText": "Move 1 core from target spirit your opponent controls to its owner's Reserve",
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
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "ZO-GOIN2#a1",
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
          "cleanBody": "Randomly discard 1 card from your opponent's hand."
        },
        "clauses": [
          {
            "rawText": "Randomly discard 1 card from your opponent's hand.",
            "cleanText": "Randomly discard 1 card from your opponent's hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_HAND",
              "count": 1,
              "side": "opp",
              "random": true,
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
  "BATTLE-SPIRITS-A1025": {
    "cardNumber": "BATTLE-SPIRITS-A1025",
    "name": "Xscissors",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A1025#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
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
          "cleanBody": "The number of cores on target nexus you control is treated as the same as the number of cores on this spirit until end of turn."
        },
        "clauses": [
          {
            "rawText": "The number of cores on target nexus you control is treated as the same as the number of cores on this spirit until end of turn.",
            "cleanText": "The number of cores on target nexus you control is treated as the same as the number of cores on this spirit until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "TREAT_CORE_COUNT"
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
  "BS03-041": {
    "cardNumber": "BS03-041",
    "name": "The Artifact Asc",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  }
};
