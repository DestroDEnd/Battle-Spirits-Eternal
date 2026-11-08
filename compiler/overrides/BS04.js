export const BS04_OVERRIDES = {
  "BS04-X13": {
    "cardNumber": "BS04-X13",
    "name": "The DarkDragonEmperor Siegfried",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 6 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-X13#a0",
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
          "cleanBody": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirit you control to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirit you control to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all core from a Cost 6 or more Spirit you control to the Void",
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
        "id": "BS04-X13#a1",
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, draw a card."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, draw a card.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, draw a card",
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
        "id": "BS04-X13#a2",
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
          "cleanBody": "Destroy every non-Red 4000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy every non-Red 4000 BP or less Spirit.",
            "cleanText": "Destroy every non-Red 4000 BP or less Spirit",
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
  "BATTLE-SPIRITS-A184": {
    "cardNumber": "BATTLE-SPIRITS-A184",
    "name": "Alligade",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A184#a0",
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
          "cleanBody": "(During Your Turn) Each time 5 or more cards are moved from the top of your opponent's Deck to their Trash at once due to your effect, exhaust target unexhausted spirit your opponent controls."
        },
        "clauses": [
          {
            "rawText": "(During Your Turn) Each time 5 or more cards are moved from the top of your opponent's Deck to their Trash at once due to your effect, exhaust target unexhausted spirit your opponent controls.",
            "cleanText": "(During Your Turn) Each time 5 or more cards are moved from the top of your opponent's Deck to their Trash at once due to your effect, exhaust target unexhausted spirit your opponent controls",
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
  "BS04-051": {
    "cardNumber": "BS04-051",
    "name": "Arcanabeast-Hart",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-051#a0",
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
          "cleanBody": "Give all your \"Arcana\"-named Spirits the effect: \"(When Attacks) This Spirit gains +2000 BP.\""
        },
        "clauses": [
          {
            "rawText": "Give all your \"Arcana\"-named Spirits the effect: \"(When Attacks) This Spirit gains +2000 BP.\"",
            "cleanText": "Give all your \"Arcana\"-named Spirits the effect: \"(When Attacks) This Spirit gains +2000 BP.\"",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-054": {
    "cardNumber": "BS04-054",
    "name": "Arcanasoldier-Cinq",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-054#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "When the opponent uses any Magic effect that includes this Spirit as target, you can change the target of that Magic effect to only this Spirit."
        },
        "clauses": [
          {
            "rawText": "When the opponent uses any Magic effect that includes this Spirit as target, you can change the target of that Magic effect to only this Spirit.",
            "cleanText": "When the opponent uses any Magic effect that includes this Spirit as target, you can change the target of that Magic effect to only this Spirit",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REDIRECT_TARGET"
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
  "BATTLE-SPIRITS-A189": {
    "cardNumber": "BATTLE-SPIRITS-A189",
    "name": "Banshee",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BERSERKER-MAGNUM2": {
    "cardNumber": "BERSERKER-MAGNUM2",
    "name": "Berserker-Magnum",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A191": {
    "cardNumber": "BATTLE-SPIRITS-A191",
    "name": "BlackMachG",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-029": {
    "cardNumber": "BS04-029",
    "name": "BlackMonoqueiroz",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-029#a0",
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
          "cleanBody": "During this turn, every \"Shellman\"/\"Shell Insect\" family Spirit you control gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, every \"Shellman\"/\"Shell Insect\" family Spirit you control gains +3000 BP.",
            "cleanText": "every \"Shellman\"/\"Shell Insect\" family Spirit you control gains +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-056": {
    "cardNumber": "BS04-056",
    "name": "Braveless-Leo",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "CHAIN-DRAGON2": {
    "cardNumber": "CHAIN-DRAGON2",
    "name": "Chain-Dragon",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A197": {
    "cardNumber": "BATTLE-SPIRITS-A197",
    "name": "Chamelewhip",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A197#a0",
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
          "cleanBody": "This Spirit can't block."
        },
        "clauses": [
          {
            "rawText": "This Spirit can't block.",
            "cleanText": "This Spirit can't block",
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
        "id": "BATTLE-SPIRITS-A197#a1",
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
          "cleanBody": "This Spirit gains +1000 BP."
        },
        "clauses": [
          {
            "rawText": "This Spirit gains +1000 BP.",
            "cleanText": "This Spirit gains +1000 BP",
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
  "BS04-015": {
    "cardNumber": "BS04-015",
    "name": "Cyclo-Winder",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-094": {
    "cardNumber": "BS04-094",
    "name": "Danse Macabre",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-094#a0",
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
          "cleanBody": "Discard any number of cards from your Hand. For each card discarded, send a core from a single opposing Spirit to the Trash."
        },
        "clauses": [
          {
            "rawText": "Discard any number of cards from your Hand.",
            "cleanText": "Discard any number of cards from your Hand",
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
            "rawText": "For each card discarded, send a core from a single opposing Spirit to the Trash.",
            "cleanText": "For each card discarded, send a core from a single opposing Spirit to the Trash",
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
  "BS04-004": {
    "cardNumber": "BS04-004",
    "name": "DarkDinohound",
    "keywords": [
      {
        "name": "Awaken",
        "parameter": null,
        "wave": 1,
        "hook": "awaken",
        "bracketed": true,
        "index": 24
      },
      {
        "name": "Awaken",
        "parameter": null,
        "wave": 1,
        "hook": "awaken",
        "bracketed": true,
        "index": 231
      }
    ],
    "abilities": [
      {
        "id": "BS04-004#a0",
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
          "cleanBody": "You can send any number of cores from your Spirits to this Spirit."
        },
        "clauses": [
          {
            "rawText": "You can send any number of cores from your Spirits to this Spirit.",
            "cleanText": "You can send any number of cores from your Spirits to this Spirit",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "AWAKEN_CORE_MOVE",
              "count": "ANY",
              "from": {
                "zone": "field",
                "side": "self",
                "types": [
                  "Spirit"
                ]
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
        "id": "BS04-004#a1",
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, besides [DarkDinohound], refresh a Spirit with [Awaken] you control."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, besides [DarkDinohound], refresh a Spirit with [Awaken] you control.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, besides [DarkDinohound], refresh a Spirit with [Awaken] you control",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-003": {
    "cardNumber": "BS04-003",
    "name": "DarkGoradon",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A203": {
    "cardNumber": "BATTLE-SPIRITS-A203",
    "name": "DarkPiyon",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "DRA-GOLEM2": {
    "cardNumber": "DRA-GOLEM2",
    "name": "Dra-Golem",
    "keywords": [],
    "abilities": [
      {
        "id": "DRA-GOLEM2#a0",
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
          "cleanBody": "Spirits you control with Evolution are treated as being at the following LV depending on the number of cores they have on them\n1 core = LV1\n2 cores = LV2\n3 or more cores = the highest LV they have"
        },
        "clauses": [
          {
            "rawText": "Spirits you control with Evolution are treated as being at the following LV depending on the number of cores they have on them",
            "cleanText": "Spirits you control with Evolution are treated as being at the following LV depending on the number of cores they have on them",
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
            "rawText": "1 core = LV1",
            "cleanText": "1 core = LV1",
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
            "rawText": "2 cores = LV2",
            "cleanText": "2 cores = LV2",
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
            "rawText": "3 or more cores = the highest LV they have",
            "cleanText": "3 or more cores = the highest LV they have",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-092": {
    "cardNumber": "BS04-092",
    "name": "Dragons' Rush",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-092#a0",
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
          "cleanBody": "During this turn, when only the opposing Spirit is destroyed by comparing BP with your \"Winged Dragon\"/\"Dragon\"/\"Ancient Dragon\" family Spirits, refresh that Spirit you control."
        },
        "clauses": [
          {
            "rawText": "During this turn, when only the opposing Spirit is destroyed by comparing BP with your \"Winged Dragon\"/\"Dragon\"/\"Ancient Dragon\" family Spirits, refresh that Spirit you control.",
            "cleanText": "when only the opposing Spirit is destroyed by comparing BP with your \"Winged Dragon\"/\"Dragon\"/\"Ancient Dragon\" family Spirits, refresh that Spirit you control",
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
      },
      {
        "id": "BS04-092#a1",
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
  "BS04-102": {
    "cardNumber": "BS04-102",
    "name": "Dream Hand",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-102#a0",
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
          "cleanBody": "Return every Cost 1 or less Spirit to its owner's Hand."
        },
        "clauses": [
          {
            "rawText": "Return every Cost 1 or less Spirit to its owner's Hand.",
            "cleanText": "Return every Cost 1 or less Spirit to its owner's Hand",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A207": {
    "cardNumber": "BATTLE-SPIRITS-A207",
    "name": "Duckle",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A207#a0",
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
          "cleanBody": "If this is the first attack this turn, this spirit gets +2000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "If this is the first attack this turn, this spirit gets +2000BP until end of turn.",
            "cleanText": "this spirit gets +2000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If this is the first attack this turn",
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 2000,
              "target": "SELF",
              "duration": "UNTIL_END_OF_TURN"
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
  "FAL-CONDOR2": {
    "cardNumber": "FAL-CONDOR2",
    "name": "Fal-Condor",
    "keywords": [],
    "abilities": [
      {
        "id": "FAL-CONDOR2#a0",
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
          "cleanBody": "Each time this spirit defeats a spirit, gain 1 core in your Reserve."
        },
        "clauses": [
          {
            "rawText": "Each time this spirit defeats a spirit, gain 1 core in your Reserve.",
            "cleanText": "Each time this spirit defeats a spirit, gain 1 core in your Reserve",
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
        "id": "FAL-CONDOR2#a1",
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
          "cleanBody": "(During the Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit."
        },
        "clauses": [
          {
            "rawText": "(During the Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit.",
            "cleanText": "(During the Battle Phase) Each time this spirit defeats a spirit, if this spirit is exhausted, refresh this spirit",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "IRCANNONMK-II2": {
    "cardNumber": "IRCANNONMK-II2",
    "name": "Fenrircannon Mk-II",
    "keywords": [
      {
        "name": "Armor",
        "parameter": "Red/Green",
        "wave": 1,
        "hook": "armor",
        "bracketed": false,
        "index": 109
      }
    ],
    "abilities": [
      {
        "id": "IRCANNONMK-II2#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
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
          "cleanBody": "When blocking a Spirit at the same Lv, this Spirit gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "When blocking a Spirit at the same Lv, this Spirit gains +3000 BP.",
            "cleanText": "When blocking a Spirit at the same Lv, this Spirit gains +3000 BP",
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
      },
      {
        "id": "IRCANNONMK-II2#a1",
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
          "cleanBody": "Armor:Red/Green - This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated colors."
        },
        "clauses": [
          {
            "rawText": "Armor:Red/Green - This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated colors.",
            "cleanText": "Armor:Red/Green - This Spirit is unaffected by opposing Spirit/Nexus/Magic effects of the stated colors",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "IMMUNITY",
              "immuneTo": "OPPOSING_EFFECTS"
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
  "BATTLE-SPIRITS-A212": {
    "cardNumber": "BATTLE-SPIRITS-A212",
    "name": "Forest Aura",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A212#a0",
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
          "cleanBody": "During this turn, each time a \"Winged Beast\" or \"Plant Spirit\" spirit you control attacks, it gets +3000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "During this turn, each time a \"Winged Beast\" or \"Plant Spirit\" spirit you control attacks, it gets +3000BP until end of turn.",
            "cleanText": "each time a \"Winged Beast\" or \"Plant Spirit\" spirit you control attacks, it gets +3000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A213": {
    "cardNumber": "BATTLE-SPIRITS-A213",
    "name": "Giraffen",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BATTLE-SPIRITS-A214": {
    "cardNumber": "BATTLE-SPIRITS-A214",
    "name": "Glacial Breath",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A214#a0",
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
          "cleanBody": "Return 2 target spirits you control to the bottom of your Deck in any order. In that case, return 2 target spirits your opponent controls to the bottom of their Deck in any order. This effect cannot be used unless you control a spirit with 2 or more Gems."
        },
        "clauses": [
          {
            "rawText": "Return 2 target spirits you control to the bottom of your Deck in any order.",
            "cleanText": "Return 2 target spirits you control to the bottom of your Deck in any order",
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
            "rawText": "In that case, return 2 target spirits your opponent controls to the bottom of their Deck in any order.",
            "cleanText": "In that case, return 2 target spirits your opponent controls to the bottom of their Deck in any order",
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
            "rawText": "This effect cannot be used unless you control a spirit with 2 or more Gems.",
            "cleanText": "This effect cannot be used unless you control a spirit with 2 or more Gems",
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
      },
      {
        "id": "BATTLE-SPIRITS-A214#a1",
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
          "cleanBody": "Target spirit with 2 or more Gems gets +5000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit with 2 or more Gems gets +5000BP until end of turn.",
            "cleanText": "Target spirit with 2 or more Gems gets +5000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A215": {
    "cardNumber": "BATTLE-SPIRITS-A215",
    "name": "Gleam Hope",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A215#a0",
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
          "cleanBody": "Target spirit you control gets Brilliance until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit you control gets Brilliance until end of turn.",
            "cleanText": "Target spirit you control gets Brilliance until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "KEYWORD_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BATTLE-SPIRITS-A215#a1",
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
          "keyword": "Any LV",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Brilliance (During Your Battle Phase) While this spirit is battling, each time you play a spell card, at End of Battle Step, move that spell card from your Trash to your hand."
        },
        "clauses": [
          {
            "rawText": "Brilliance (During Your Battle Phase) While this spirit is battling, each time you play a spell card, at End of Battle Step, move that spell card from your Trash to your hand.",
            "cleanText": "Brilliance (During Your Battle Phase) While this spirit is battling, each time you play a spell card, at End of Battle Step, move that spell card from your Trash to your hand",
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
      },
      {
        "id": "BATTLE-SPIRITS-A215#a2",
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
  "BS04-089": {
    "cardNumber": "BS04-089",
    "name": "Great Link",
    "keywords": [
      {
        "name": "Awaken",
        "parameter": null,
        "wave": 1,
        "hook": "awaken",
        "bracketed": true,
        "index": 57
      }
    ],
    "abilities": [
      {
        "id": "BS04-089#a0",
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
          "cleanBody": "Send every core from your Trash to a Spirit with [Awaken] you control. This effect can't be used in Main Step."
        },
        "clauses": [
          {
            "rawText": "Send every core from your Trash to a Spirit with [Awaken] you control.",
            "cleanText": "Send every core from your Trash to a Spirit with [Awaken] you control",
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
            "rawText": "This effect can't be used in Main Step.",
            "cleanText": "This effect can't be used in Main Step",
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
  "BS04-055": {
    "cardNumber": "BS04-055",
    "name": "The LightDragon Lumiere",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 5 or more → Trash",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-055#a0",
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
          "keyword": "Tribute: Cost 5 or more → Trash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
            "cleanText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-010": {
    "cardNumber": "BS04-010",
    "name": "The ThunderDragon El-Clair",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 5 or more → Trash",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-010#a0",
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
          "keyword": "Tribute: Cost 5 or more → Trash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
            "cleanText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-020": {
    "cardNumber": "BS04-020",
    "name": "The DarkDragon Ops-Curite",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 5 or more → Trash",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-020#a0",
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
          "keyword": "Tribute: Cost 5 or more → Trash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
            "cleanText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-031": {
    "cardNumber": "BS04-031",
    "name": "The GroundDragon Fon-Daxion",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 5 or more → Trash",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-031#a0",
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
          "keyword": "Tribute: Cost 5 or more → Trash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
            "cleanText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-073": {
    "cardNumber": "BS04-073",
    "name": "The SeaDragon Courant-Marin",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 5 or more → Trash",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-073#a0",
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
          "keyword": "Tribute: Cost 5 or more → Trash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
            "cleanText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-077": {
    "cardNumber": "BS04-077",
    "name": "The Seven Dragons' Throne",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-077#a0",
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
          "cleanBody": "Give every \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit card in your Hand a [Red Core] reduction symbol."
        },
        "clauses": [
          {
            "rawText": "Give every \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit card in your Hand a [Red Core] reduction symbol.",
            "cleanText": "Give every \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit card in your Hand a [Red Core] reduction symbol",
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
      },
      {
        "id": "BS04-077#a1",
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
          "cleanBody": "When your \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit is summoned, destroy an opposing Spirit with BP equal or inferior to the summoned Spirit's."
        },
        "clauses": [
          {
            "rawText": "When your \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit is summoned, destroy an opposing Spirit with BP equal or inferior to the summoned Spirit's.",
            "cleanText": "When your \"Ancient Dragon\"/\"Dragon Emperor\" family Spirit is summoned, destroy an opposing Spirit with BP equal or inferior to the summoned Spirit's",
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
  "BS04-044": {
    "cardNumber": "BS04-044",
    "name": "The SkyDragon Le-Ciel",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 5 or more → Trash",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-044#a0",
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
          "keyword": "Tribute: Cost 5 or more → Trash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area.",
            "cleanText": "After paying for the summoning cost, you must send all cores from one of your Spirits with the specified cost or more to the specified area",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-090": {
    "cardNumber": "BS04-090",
    "name": "Der Ring des Nibelungen",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-090#a0",
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
          "cleanBody": "During this turn, when only the opposing Spirit is destroyed by BP comparison with your \"Sieg\"-named Spirit, destroy every opposing Spirit with the same family as the destroyed Spirit."
        },
        "clauses": [
          {
            "rawText": "During this turn, when only the opposing Spirit is destroyed by BP comparison with your \"Sieg\"-named Spirit, destroy every opposing Spirit with the same family as the destroyed Spirit.",
            "cleanText": "when only the opposing Spirit is destroyed by BP comparison with your \"Sieg\"-named Spirit, destroy every opposing Spirit with the same family as the destroyed Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
  "BATTLE-SPIRITS-A4057": {
    "cardNumber": "BATTLE-SPIRITS-A4057",
    "name": "Euthanasia",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A4057#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
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
          "cleanBody": "effects of spirits your opponent controls are negated until end of turn."
        },
        "clauses": [
          {
            "rawText": "effects of spirits your opponent controls are negated until end of turn.",
            "cleanText": "effects of spirits your opponent controls are negated until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "NEGATE_EFFECT"
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
  "BATTLE-SPIRITS-A4393": {
    "cardNumber": "BATTLE-SPIRITS-A4393",
    "name": "Full Add",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A4393#a0",
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
          "cleanBody": "Put cores from the Void to a Nexus you control until it reaches [LV2]."
        },
        "clauses": [
          {
            "rawText": "Put cores from the Void to a Nexus you control until it reaches [LV2].",
            "cleanText": "Put cores from the Void to a Nexus you control until it reaches [LV2]",
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
        "id": "BATTLE-SPIRITS-A4393#a1",
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
  "BATTLE-SPIRITS-A4705": {
    "cardNumber": "BATTLE-SPIRITS-A4705",
    "name": "Ground Howling",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A4705#a0",
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
          "cleanBody": "Exhaust all unexhausted spirits your opponent controls with 4000BP or more. This effect cannot be used unless you control a spirit with 2 or more gems."
        },
        "clauses": [
          {
            "rawText": "Exhaust all unexhausted spirits your opponent controls with 4000BP or more.",
            "cleanText": "Exhaust all unexhausted spirits your opponent controls with 4000BP or more",
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
            "rawText": "This effect cannot be used unless you control a spirit with 2 or more gems.",
            "cleanText": "This effect cannot be used unless you control a spirit with 2 or more gems",
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
      },
      {
        "id": "BATTLE-SPIRITS-A4705#a1",
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
          "cleanBody": "Target spirit with 2 or more gems gets +5000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit with 2 or more gems gets +5000BP until end of turn.",
            "cleanText": "Target spirit with 2 or more gems gets +5000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
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
  "BATTLE-SPIRITS-A4818": {
    "cardNumber": "BATTLE-SPIRITS-A4818",
    "name": "Headless Carriage",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-050": {
    "cardNumber": "BS04-050",
    "name": "Heartless-Tin",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-050#a0",
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
      },
      {
        "id": "BS04-050#a1",
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
          "cleanBody": "If there is a total of three or more White symbols on your Field, and the opponent didn't attack for at least once this turn, draw a card."
        },
        "clauses": [
          {
            "rawText": "If there is a total of three or more White symbols on your Field, and the opponent didn't attack for at least once this turn, draw a card.",
            "cleanText": "and the opponent didn't attack for at least once this turn, draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If there is a total of three or more White symbols on your Field",
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
  "BS04-096": {
    "cardNumber": "BS04-096",
    "name": "Inferno Eyes",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-096#a0",
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
          "cleanBody": "Each player sends four cores from their Spirits/Nexuses to the Void. This effect can't be used unless you control a Spirit with two or more symbols."
        },
        "clauses": [
          {
            "rawText": "Each player sends four cores from their Spirits/Nexuses to the Void.",
            "cleanText": "Each player sends four cores from their Spirits/Nexuses to the Void",
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
            "rawText": "This effect can't be used unless you control a Spirit with two or more symbols.",
            "cleanText": "This effect can't be used unless you control a Spirit with two or more symbols",
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
      },
      {
        "id": "BS04-096#a1",
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
          "cleanBody": "During this turn, give a Spirit with two or more symbols +5000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, give a Spirit with two or more symbols +5000 BP.",
            "cleanText": "give a Spirit with two or more symbols +5000 BP",
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
  "IRON-GOLEM2": {
    "cardNumber": "IRON-GOLEM2",
    "name": "Iron-Golem",
    "keywords": [],
    "abilities": [
      {
        "id": "IRON-GOLEM2#a0",
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
          "cleanBody": "By discarding a Nexus card from your Hand, this Spirit gains +4000 BP."
        },
        "clauses": [
          {
            "rawText": "By discarding a Nexus card from your Hand",
            "cleanText": "By discarding a Nexus card from your Hand",
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
            "rawText": "this Spirit gains +4000 BP.",
            "cleanText": "this Spirit gains +4000 BP",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 4000,
              "target": "self",
              "duration": "THIS_TURN"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "IRON-GOLEM2#a1",
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
          "cleanBody": "By discarding a Nexus card from your Hand, this Spirit gains +4000 BP."
        },
        "clauses": [
          {
            "rawText": "By discarding a Nexus card from your Hand",
            "cleanText": "By discarding a Nexus card from your Hand",
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
            "rawText": "this Spirit gains +4000 BP.",
            "cleanText": "this Spirit gains +4000 BP",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 4000,
              "target": "self",
              "duration": "THIS_TURN"
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
  "BATTLE-SPIRITS-A5233": {
    "cardNumber": "BATTLE-SPIRITS-A5233",
    "name": "Judgment Lights",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A5233#a0",
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
          "cleanBody": "Spirits your opponent controls are treated as being at LV1 until end of turn. This effect can only be used if you control a spirit with 2 or more Gems."
        },
        "clauses": [
          {
            "rawText": "Spirits your opponent controls are treated as being at LV1 until end of turn.",
            "cleanText": "Spirits your opponent controls are treated as being at LV1 until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "TREAT_LEVEL",
              "level": 1
            }
          },
          {
            "rawText": "This effect can only be used if you control a spirit with 2 or more Gems.",
            "cleanText": "This effect can only be used if you control a spirit with 2 or more Gems",
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
      },
      {
        "id": "BATTLE-SPIRITS-A5233#a1",
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
          "cleanBody": "Target spirit with 2 or more Gems gets +5000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit with 2 or more Gems gets +5000BP until end of turn.",
            "cleanText": "Target spirit with 2 or more Gems gets +5000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
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
  "BATTLE-SPIRITS-A5282": {
    "cardNumber": "BATTLE-SPIRITS-A5282",
    "name": "Jungle Law",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A5282#a0",
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
          "cleanBody": "Exhaust all unexhausted LV1 spirits."
        },
        "clauses": [
          {
            "rawText": "Exhaust all unexhausted LV1 spirits.",
            "cleanText": "Exhaust all unexhausted LV1 spirits",
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
        "id": "BATTLE-SPIRITS-A5282#a1",
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
          "cleanBody": "Target spirit gets +4000BP until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target spirit gets +4000BP until end of turn.",
            "cleanText": "Target spirit gets +4000BP until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "BP_BUFF",
              "amount": 4000,
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
  "BATTLE-SPIRITS-A6236": {
    "cardNumber": "BATTLE-SPIRITS-A6236",
    "name": "Lead Wall",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A6236#a0",
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
          "cleanBody": "During this turn, all of your spirits can block the spirit with \"Cannot be blocked\" effect."
        },
        "clauses": [
          {
            "rawText": "During this turn, all of your spirits can block the spirit with \"Cannot be blocked\" effect.",
            "cleanText": "all of your spirits can block the spirit with \"Cannot be blocked\" effect",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "UNBLOCKABLE"
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
  "BATTLE-SPIRITS-A6457": {
    "cardNumber": "BATTLE-SPIRITS-A6457",
    "name": "Massive Up",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A6457#a0",
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
          "cleanBody": "Target blue spirit with 3 Levels is treated as being at LV3 until end of turn."
        },
        "clauses": [
          {
            "rawText": "Target blue spirit with 3 Levels is treated as being at LV3 until end of turn.",
            "cleanText": "Target blue spirit with 3 Levels is treated as being at LV3 until end of turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "UNTIL_END_OF_TURN",
            "op": {
              "op": "TREAT_LEVEL",
              "level": 3
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
  "BATTLE-SPIRITS-A7404": {
    "cardNumber": "BATTLE-SPIRITS-A7404",
    "name": "Rabirabi",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-028": {
    "cardNumber": "BS04-028",
    "name": "Sevenspot",
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
        "id": "BS04-028#a0",
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
        "id": "BS04-028#a1",
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
          "cleanBody": "When putting cores onto this Spirit via Spirit/Nexus/Magic effects, put +1 core."
        },
        "clauses": [
          {
            "rawText": "When putting cores onto this Spirit via Spirit/Nexus/Magic effects, put +1 core.",
            "cleanText": "When putting cores onto this Spirit via Spirit/Nexus/Magic effects, put +1 core",
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
  "BATTLE-SPIRITS-A7807": {
    "cardNumber": "BATTLE-SPIRITS-A7807",
    "name": "Shadowjuggler",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A7807#a0",
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
        "id": "BATTLE-SPIRITS-A7807#a1",
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
          "cleanBody": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
            "cleanText": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle",
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
  "BATTLE-SPIRITS-A7858": {
    "cardNumber": "BATTLE-SPIRITS-A7858",
    "name": "Skulldemon",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A7858#a0",
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
          "cleanBody": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle.",
            "cleanText": "Destroy an opposing Spirit that blocked when the battle resolves at the end of battle",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A8116": {
    "cardNumber": "BATTLE-SPIRITS-A8116",
    "name": "Switch Hitter",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A8116#a0",
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
          "cleanBody": "During this turn, every \"Artificial Soldier\" family Spirit you control is also treated as Spirits with no printed effects."
        },
        "clauses": [
          {
            "rawText": "During this turn, every \"Artificial Soldier\" family Spirit you control is also treated as Spirits with no printed effects.",
            "cleanText": "every \"Artificial Soldier\" family Spirit you control is also treated as Spirits with no printed effects",
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
        "id": "BATTLE-SPIRITS-A8116#a1",
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
  "BATTLE-SPIRITS-A8291": {
    "cardNumber": "BATTLE-SPIRITS-A8291",
    "name": "The Ancient Arena",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A8291#a0",
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
          "cleanBody": "The effects of cards your opponent controls that increase the BP of 1 or more spirits are negated."
        },
        "clauses": [
          {
            "rawText": "The effects of cards your opponent controls that increase the BP of 1 or more spirits are negated.",
            "cleanText": "The effects of cards your opponent controls that increase the BP of 1 or more spirits are negated",
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
        "id": "BATTLE-SPIRITS-A8291#a1",
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
          "cleanBody": "(During Opponent's Main Phase) (When Summoned) effects of spirits your opponent controls are negated when they are summoned."
        },
        "clauses": [
          {
            "rawText": "(During Opponent's Main Phase) (When Summoned) effects of spirits your opponent controls are negated when they are summoned.",
            "cleanText": "(During Opponent's Main Phase) (When Summoned) effects of spirits your opponent controls are negated when they are summoned",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "NEGATE_EFFECT"
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
  "BS04-008": {
    "cardNumber": "BS04-008",
    "name": "The AncientDragon Ba-Gaw",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-008#a0",
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
      },
      {
        "id": "BS04-008#a1",
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison with your \"Dragon\"/\"Ancient Dragon\" family Spirits, draw a card."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison with your \"Dragon\"/\"Ancient Dragon\" family Spirits, draw a card.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison with your \"Dragon\"/\"Ancient Dragon\" family Spirits, draw a card",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A8376": {
    "cardNumber": "BATTLE-SPIRITS-A8376",
    "name": "The Angelia Throne",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A8376#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "2 target spirits your opponent controls must exchange all cores on them."
        },
        "clauses": [
          {
            "rawText": "2 target spirits your opponent controls must exchange all cores on them.",
            "cleanText": "2 target spirits your opponent controls must exchange all cores on them",
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
        "id": "BATTLE-SPIRITS-A8376#a1",
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
          "cleanBody": "(Permanent) This spirit is also treated as a purple spirit."
        },
        "clauses": [
          {
            "rawText": "This spirit is also treated as a purple spirit.",
            "cleanText": "This spirit is also treated as a purple spirit",
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
  "BS04-040": {
    "cardNumber": "BS04-040",
    "name": "The ArmoredBeast Gullin-Bullsty",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "HEITH-RUNE2": {
    "cardNumber": "HEITH-RUNE2",
    "name": "The ArmoredBeast Heith-Rune",
    "keywords": [],
    "abilities": [
      {
        "id": "HEITH-RUNE2#a0",
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
          "cleanBody": "while the opponent controls no Red Spirits, this Spirit can't attack."
        },
        "clauses": [
          {
            "rawText": "while the opponent controls no Red Spirits, this Spirit can't attack.",
            "cleanText": "this Spirit can't attack",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "while the opponent controls no Red Spirits",
            "duration": null,
            "op": {
              "op": "SET_RESTRICTION",
              "target": "self",
              "restriction": "CANNOT_ATTACK"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "HEITH-RUNE2#a1",
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
          "cleanBody": "When an opposing Cost 1 or less Spirit attacks, this Spirit refreshes."
        },
        "clauses": [
          {
            "rawText": "When an opposing Cost 1 or less Spirit attacks, this Spirit refreshes.",
            "cleanText": "When an opposing Cost 1 or less Spirit attacks, this Spirit refreshes",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A8965": {
    "cardNumber": "BATTLE-SPIRITS-A8965",
    "name": "The CatLady Abyssinia",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-074": {
    "cardNumber": "BS04-074",
    "name": "The ChimeraDragon Hydrus",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-074#a0",
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
          "cleanBody": "Either player can only use Magic effects once per turn."
        },
        "clauses": [
          {
            "rawText": "Either player can only use Magic effects once per turn.",
            "cleanText": "Either player can only use Magic effects once per turn",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MAGIC_RESTRICTION"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS04-074#a1",
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
          "cleanBody": "Unless the opponent pay the cost, they can't use Magic effects."
        },
        "clauses": [
          {
            "rawText": "Unless the opponent pay the cost, they can't use Magic effects.",
            "cleanText": "Unless the opponent pay the cost, they can't use Magic effects",
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
  "BS04-046": {
    "cardNumber": "BS04-046",
    "name": "The Fairy Dorothy",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-X15": {
    "cardNumber": "BS04-X15",
    "name": "The Emperor Kaiseratlas",
    "keywords": [
      {
        "name": "Tribute",
        "parameter": "Cost 6 or more → Void",
        "wave": 4,
        "hook": "tribute",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS04-X15#a0",
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
          "cleanBody": "After paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void."
        },
        "clauses": [
          {
            "rawText": "After paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void.",
            "cleanText": "After paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void",
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
        "id": "BS04-X15#a1",
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, by sending a core from your Reserve to the Void, send two opposing Lives to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, by sending a core from your Reserve to the Void, send two opposing Lives to their Reserve.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, by sending a core from your Reserve to the Void, send two opposing Lives to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "reserve",
                "side": "self"
              },
              "to": {
                "zone": "void",
                "side": "self"
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
  "BATTLE-SPIRITS-A9921": {
    "cardNumber": "BATTLE-SPIRITS-A9921",
    "name": "The FlameEmperor Kujaraku",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-087": {
    "cardNumber": "BS04-087",
    "name": "The Heart-Buster Huge Slope",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-087#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "START_STEP",
          "timingLabel": "Opposing Start Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Discard a card from the opposing decktop."
        },
        "clauses": [
          {
            "rawText": "Discard a card from the opposing decktop.",
            "cleanText": "Discard a card from the opposing decktop",
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
        "id": "BS04-087#a1",
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
          "cleanBody": "Every Spirit with no printed effects you control is treated as at its highest level during the turn it's summoned."
        },
        "clauses": [
          {
            "rawText": "Every Spirit with no printed effects you control is treated as at its highest level during the turn it's summoned.",
            "cleanText": "Every Spirit with no printed effects you control is treated as at its highest level during the turn it's summoned",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-007": {
    "cardNumber": "BS04-007",
    "name": "The Guardsman Dragno",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-007#a0",
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
          "cleanBody": "The (When Attacks) effects of all \"Dragon\" family Spirits activate as (When Blocks) effects."
        },
        "clauses": [
          {
            "rawText": "The (When Attacks) effects of all \"Dragon\" family Spirits activate as (When Blocks) effects.",
            "cleanText": "The (When Attacks) effects of all \"Dragon\" family Spirits activate as (When Blocks) effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "GRANT_FAMILY"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS04-007#a1",
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
          "cleanBody": "This Spirit gains +2000 BP."
        },
        "clauses": [
          {
            "rawText": "This Spirit gains +2000 BP.",
            "cleanText": "This Spirit gains +2000 BP",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-082": {
    "cardNumber": "BS04-082",
    "name": "The Inviolable Sanctuary",
    "keywords": [
      {
        "name": "Armor",
        "parameter": "Purple/Green/White/Yellow/Blue",
        "wave": 1,
        "hook": "armor",
        "bracketed": true,
        "index": 58
      }
    ],
    "abilities": [
      {
        "id": "BS04-082#a0",
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
          "cleanBody": "Give every Cost 8 or more Spirit you control: \"[Armor: Purple/Green/White/Yellow/Blue] This Spirit is unaffected by opposing Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects.\""
        },
        "clauses": [
          {
            "rawText": "Give every Cost 8 or more Spirit you control: \"[Armor: Purple/Green/White/Yellow/Blue] This Spirit is unaffected by opposing Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects.\"",
            "cleanText": "Give every Cost 8 or more Spirit you control: \"[Armor: Purple/Green/White/Yellow/Blue] This Spirit is unaffected by opposing Purple/Green/White/Yellow/Blue Spirit/Nexus/Magic effects.\"",
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
        "id": "BS04-082#a1",
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
          "cleanBody": "Only up to five cards can be discarded from your deck per turn due to opposing Spirit/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "Only up to five cards can be discarded from your deck per turn due to opposing Spirit/Nexus/Magic effects.",
            "cleanText": "Only up to five cards can be discarded from your deck per turn due to opposing Spirit/Nexus/Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "LIMIT_DECK_DISCARD"
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
  "BS04-039": {
    "cardNumber": "BS04-039",
    "name": "The JewelBug Scaraveil",
    "keywords": [
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 52
      },
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 129
      }
    ],
    "abilities": [
      {
        "id": "BS04-039#a0",
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
          "cleanBody": "All your Spirits with [High Speed] gain +1000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with [High Speed] gain +1000 BP.",
            "cleanText": "All your Spirits with [High Speed] gain +1000 BP",
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
        "id": "BS04-039#a1",
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
          "cleanBody": "When your Spirits with [High Speed] is destroyed by opposing Spirits via BP comparison, by sending a core from your Field/Reserve to your Trash, return that Spirit to the Hand."
        },
        "clauses": [
          {
            "rawText": "When your Spirits with [High Speed] is destroyed by opposing Spirits via BP comparison, by sending a core from your Field/Reserve to your Trash, return that Spirit to the Hand.",
            "cleanText": "When your Spirits with [High Speed] is destroyed by opposing Spirits via BP comparison, by sending a core from your Field/Reserve to your Trash, return that Spirit to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": true
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
  "BS04-022": {
    "cardNumber": "BS04-022",
    "name": "The KingSnake Quetzalcoatl",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-022#a0",
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
        "id": "BS04-022#a1",
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
          "cleanBody": "By discarding any number of cards from your Hand, send one core each from a number of opposing Spirits equal to the number of cards you discarded to their Trash."
        },
        "clauses": [
          {
            "rawText": "By discarding any number of cards from your Hand",
            "cleanText": "By discarding any number of cards from your Hand",
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
            "rawText": "send one core each from a number of opposing Spirits equal to the number of cards you discarded to their Trash.",
            "cleanText": "send one core each from a number of opposing Spirits equal to the number of cards you discarded to their Trash",
            "link": "byDoing",
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
  "BATTLE-SPIRITS-A11193": {
    "cardNumber": "BATTLE-SPIRITS-A11193",
    "name": "The LegendaryGiant Jude",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11193#a0",
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
          "cleanBody": "Move cards from the top of your opponent's Deck to their Trash equal to this spirit's LV."
        },
        "clauses": [
          {
            "rawText": "Move cards from the top of your opponent's Deck to their Trash equal to this spirit's LV.",
            "cleanText": "Move cards from the top of your opponent's Deck to their Trash equal to this spirit's LV",
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
        "id": "BATTLE-SPIRITS-A11193#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "Each time 1 or more nexus cards are moved from the top of your opponent's Deck to their Trash due to the effect of this spirit's Crush, if this spirit is exhausted at End of Battle Step, refresh this spirit."
        },
        "clauses": [
          {
            "rawText": "Each time 1 or more nexus cards are moved from the top of your opponent's Deck to their Trash due to the effect of this spirit's Crush, if this spirit is exhausted at End of Battle Step, refresh this spirit.",
            "cleanText": "Each time 1 or more nexus cards are moved from the top of your opponent's Deck to their Trash due to the effect of this spirit's Crush, if this spirit is exhausted at End of Battle Step, refresh this spirit",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A11443": {
    "cardNumber": "BATTLE-SPIRITS-A11443",
    "name": "The MobileFortress Castle-Golem",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11443#a0",
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
          "cleanBody": "For each Nexus you control, discard five cards from the opposing decktop ."
        },
        "clauses": [
          {
            "rawText": "For each Nexus you control, discard five cards from the opposing decktop .",
            "cleanText": "For each Nexus you control, discard five cards from the opposing decktop",
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
        "id": "BATTLE-SPIRITS-A11443#a1",
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
          "cleanBody": "For each Blue symbol you control, discard a card from the opposing decktop."
        },
        "clauses": [
          {
            "rawText": "For each Blue symbol you control, discard a card from the opposing decktop.",
            "cleanText": "For each Blue symbol you control, discard a card from the opposing decktop",
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
  "BATTLE-SPIRITS-A11715": {
    "cardNumber": "BATTLE-SPIRITS-A11715",
    "name": "The Pharmacist Girmamarl",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A11715#a0",
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
          "cleanBody": "Gain 1 core on target nexus you control."
        },
        "clauses": [
          {
            "rawText": "Gain 1 core on target nexus you control.",
            "cleanText": "Gain 1 core on target nexus you control",
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
  "BS04-052": {
    "cardNumber": "BS04-052",
    "name": "The Postman Pentan",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-052#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "If you control a total of three or more \"Pentan\"/\"Empereur\"-named Spirits, you draw +1 card."
        },
        "clauses": [
          {
            "rawText": "If you control a total of three or more \"Pentan\"/\"Empereur\"-named Spirits, you draw +1 card.",
            "cleanText": "you draw +1 card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you control a total of three or more \"Pentan\"/\"Empereur\"-named Spirits",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-X14": {
    "cardNumber": "BS04-X14",
    "name": "The SevenShogun Pandemium",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-X14#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When any opposing Spirit is destroyed, draw a card."
        },
        "clauses": [
          {
            "rawText": "When any opposing Spirit is destroyed, draw a card.",
            "cleanText": "When any opposing Spirit is destroyed, draw a card",
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
        "id": "BS04-X14#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Spirit is destroyed by opposing Spirits via BP comparison, exhaust an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "When your Spirit is destroyed by opposing Spirits via BP comparison, exhaust an opposing Spirit.",
            "cleanText": "When your Spirit is destroyed by opposing Spirits via BP comparison, exhaust an opposing Spirit",
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
      },
      {
        "id": "BS04-X14#a2",
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
          "cleanBody": "Both players discard five cards from the Hand."
        },
        "clauses": [
          {
            "rawText": "Both players discard five cards from the Hand.",
            "cleanText": "Both players discard five cards from the Hand",
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
  "BATTLE-SPIRITS-A12581": {
    "cardNumber": "BATTLE-SPIRITS-A12581",
    "name": "The Soldier Gustav",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-032": {
    "cardNumber": "BS04-032",
    "name": "The SpearBeetle Lucanidos",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-032#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "When only the opposing Spirit is destroyed by BP comparison, refresh this Spirit."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed by BP comparison, refresh this Spirit.",
            "cleanText": "When only the opposing Spirit is destroyed by BP comparison, refresh this Spirit",
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
  "BATTLE-SPIRITS-A12756": {
    "cardNumber": "BATTLE-SPIRITS-A12756",
    "name": "The Steel Forest",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A12756#a0",
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
          "cleanBody": "Move target \"Armored Beast\" spirit card from your Trash to your hand."
        },
        "clauses": [
          {
            "rawText": "Move target \"Armored Beast\" spirit card from your Trash to your hand.",
            "cleanText": "Move target \"Armored Beast\" spirit card from your Trash to your hand",
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
      },
      {
        "id": "BATTLE-SPIRITS-A12756#a1",
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
          "cleanBody": "(During Your Main Phase) Each time you summon an \"Armored Beast\" or \"Giant Beast\" spirit, move target spirit your opponent controls with BP less than or equal to the summoned spirit's BP to its owner's hand."
        },
        "clauses": [
          {
            "rawText": "(During Your Main Phase) Each time you summon an \"Armored Beast\" or \"Giant Beast\" spirit, move target spirit your opponent controls with BP less than or equal to the summoned spirit's BP to its owner's hand.",
            "cleanText": "(During Your Main Phase) Each time you summon an \"Armored Beast\" or \"Giant Beast\" spirit, move target spirit your opponent controls with BP less than or equal to the summoned spirit's BP to its owner's hand",
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
  "BATTLE-SPIRITS-A13302": {
    "cardNumber": "BATTLE-SPIRITS-A13302",
    "name": "The Tyrant Fuhjaus",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13302#a0",
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
          "cleanBody": "Destroy every Nexus on the opposing Field."
        },
        "clauses": [
          {
            "rawText": "Destroy every Nexus on the opposing Field.",
            "cleanText": "Destroy every Nexus on the opposing Field",
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
        "id": "BATTLE-SPIRITS-A13302#a1",
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
          "cleanBody": "Refresh a \"Winged Dragon\" family Spirit you control, other than \"The Tyrant Fuhjaus\"."
        },
        "clauses": [
          {
            "rawText": "Refresh a \"Winged Dragon\" family Spirit you control, other than \"The Tyrant Fuhjaus\".",
            "cleanText": "Refresh a \"Winged Dragon\" family Spirit you control, other than \"The Tyrant Fuhjaus\"",
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
        "id": "BATTLE-SPIRITS-A13302#a2",
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
          "cleanBody": "When only the opposing Spirit is destroyed by BP comparison, destroy an opposing Cost 3 or less Spirit."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed by BP comparison, destroy an opposing Cost 3 or less Spirit.",
            "cleanText": "When only the opposing Spirit is destroyed by BP comparison, destroy an opposing Cost 3 or less Spirit",
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
                  "costLte": 3
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
  },
  "BS04-088": {
    "cardNumber": "BS04-088",
    "name": "The Victory Stand of the Glory",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-088#a0",
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
          "cleanBody": "When you are paying the cost for deploying Nexus, you can discard a card from your decktop for each cost to be paid instead."
        },
        "clauses": [
          {
            "rawText": "When you are paying the cost for deploying Nexus, you can discard a card from your decktop for each cost to be paid instead.",
            "cleanText": "When you are paying the cost for deploying Nexus, you can discard a card from your decktop for each cost to be paid instead",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
              "count": 1,
              "side": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS04-088#a1",
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
          "cleanBody": "When your Nexus is deployed, put a core from the Void to your Reserve."
        },
        "clauses": [
          {
            "rawText": "When your Nexus is deployed, put a core from the Void to your Reserve.",
            "cleanText": "When your Nexus is deployed, put a core from the Void to your Reserve",
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
  "BS04-043": {
    "cardNumber": "BS04-043",
    "name": "The Valkyrie-Hildr",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-043#a0",
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
          "cleanBody": "This Spirit is unaffected by opposing Spirit/Magic effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit is unaffected by opposing Spirit/Magic effects.",
            "cleanText": "This Spirit is unaffected by opposing Spirit/Magic effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "IMMUNITY",
              "immuneTo": "OPPOSING_EFFECTS"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS04-043#a1",
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
          "cleanBody": "When your Life is reduced, refresh this Spirit."
        },
        "clauses": [
          {
            "rawText": "When your Life is reduced, refresh this Spirit.",
            "cleanText": "When your Life is reduced, refresh this Spirit",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-006": {
    "cardNumber": "BS04-006",
    "name": "The ZombieDragon Zom-Sauru",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-006#a0",
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
          "cleanBody": "All your Purple Spirits gain +1000 BP."
        },
        "clauses": [
          {
            "rawText": "All your Purple Spirits gain +1000 BP.",
            "cleanText": "All your Purple Spirits gain +1000 BP",
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
                "color": "Purple"
              },
              "all": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS04-006#a1",
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
          "cleanBody": "Destroy an exhausted Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy an exhausted Spirit.",
            "cleanText": "Destroy an exhausted Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "either",
                "types": [
                  "Spirit"
                ],
                "state": "exhausted"
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
  "BS04-114": {
    "cardNumber": "BS04-114",
    "name": "Tidal Tide",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-114#a0",
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
          "cleanBody": "Destroy any number of Nexuses you control. For each Nexus destroyed, the opponent destroys a Spirit they control. This effect can only be used if you control a Spirit with two or more symbols."
        },
        "clauses": [
          {
            "rawText": "Destroy any number of Nexuses you control.",
            "cleanText": "Destroy any number of Nexuses you control",
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
            "rawText": "For each Nexus destroyed, the opponent destroys a Spirit they control.",
            "cleanText": "For each Nexus destroyed, the opponent destroys a Spirit they control",
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
              },
              "chooser": "opp"
            }
          },
          {
            "rawText": "This effect can only be used if you control a Spirit with two or more symbols.",
            "cleanText": "This effect can only be used if you control a Spirit with two or more symbols",
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
      },
      {
        "id": "BS04-114#a1",
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
          "cleanBody": "During this turn, a Spirit with two or more symbols gain +5000 BP."
        },
        "clauses": [
          {
            "rawText": "During this turn, a Spirit with two or more symbols gain +5000 BP.",
            "cleanText": "a Spirit with two or more symbols gain +5000 BP",
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
  "BS04-105": {
    "cardNumber": "BS04-105",
    "name": "Trick Prank",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-105#a0",
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
          "cleanBody": "Choose five Spirit cards from your Trash and return them to the deckbottom in any order."
        },
        "clauses": [
          {
            "rawText": "Choose five Spirit cards from your Trash and return them to the deckbottom in any order.",
            "cleanText": "Choose five Spirit cards from your Trash and return them to the deckbottom in any order",
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
        "id": "BS04-105#a1",
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
  "BATTLE-SPIRITS-A13894": {
    "cardNumber": "BATTLE-SPIRITS-A13894",
    "name": "Ugarurum",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS04-047": {
    "cardNumber": "BS04-047",
    "name": "Wiseless-Scarecrow",
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
        "id": "BS04-047#a0",
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
          "cleanBody": "At the end of battle, return every Magic card you used in this battle to the Hand."
        },
        "clauses": [
          {
            "rawText": "At the end of battle, return every Magic card you used in this battle to the Hand.",
            "cleanText": "At the end of battle, return every Magic card you used in this battle to the Hand",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS04-021": {
    "cardNumber": "BS04-021",
    "name": "The Vampire Dampeel",
    "keywords": [],
    "abilities": [
      {
        "id": "BS04-021#a0",
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
          "cleanBody": "Send one core each from every opposing Cost 4 or less Spirit to their Trash."
        },
        "clauses": [
          {
            "rawText": "Send one core each from every opposing Cost 4 or less Spirit to their Trash.",
            "cleanText": "Send one core each from every opposing Cost 4 or less Spirit to their Trash",
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
        "id": "BS04-021#a1",
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
          "cleanBody": "This Spirit gains +1000 BP for each core in the opposing Trash."
        },
        "clauses": [
          {
            "rawText": "This Spirit gains +1000 BP for each core in the opposing Trash.",
            "cleanText": "This Spirit gains +1000 BP for each core in the opposing Trash",
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
        "id": "BS04-021#a2",
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, draw a card."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, draw a card.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, draw a card",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  }
};
