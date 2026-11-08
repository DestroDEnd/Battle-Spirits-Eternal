export const BS14_OVERRIDES = {
  "BS14-X01": {
    "cardNumber": "BS14-X01",
    "name": "The DragonHero Sieg-Yamato-Fried",
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
        "id": "BS14-X01#a0",
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
          "cleanBody": "When your Life is at three or less, destroy an opposing 15000 BP or less Spirit. After this effect resolves, summon this Spirit card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "When your Life is at three or less, destroy an opposing 15000 BP or less Spirit.",
            "cleanText": "When your Life is at three or less, destroy an opposing 15000 BP or less Spirit",
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
                  "bpLte": 15000
                }
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
        "id": "BS14-X01#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3,
            4
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
          "cleanBody": "You can target and attack an opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "You can target and attack an opposing Spirit.",
            "cleanText": "You can target and attack an opposing Spirit",
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
      },
      {
        "id": "BS14-X01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            3,
            4
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
          "cleanBody": "If you have a Burst set, destroy an opposing Spirit with BP equal or inferior to this Spirit's."
        },
        "clauses": [
          {
            "rawText": "If you have a Burst set, destroy an opposing Spirit with BP equal or inferior to this Spirit's.",
            "cleanText": "destroy an opposing Spirit with BP equal or inferior to this Spirit's",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you have a Burst set",
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
  },
  "BS14-091": {
    "cardNumber": "BS14-091",
    "name": "Double Blaster",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is destroyed by the opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-091#a0",
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
          "cleanBody": "Draw two cards. Then by paying the cost, activate this card's flash effect."
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
            "rawText": "Then by paying the cost, activate this card's flash effect.",
            "cleanText": "Then by paying the cost, activate this card's flash effect",
            "link": null,
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
        "id": "BS14-091#a1",
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
          "cleanBody": "Destroy a Brave on an opposing Brave Spirit. Or, destroy an opposing Nexus."
        },
        "clauses": [
          {
            "rawText": "Destroy a Brave on an opposing Brave Spirit.",
            "cleanText": "Destroy a Brave on an opposing Brave Spirit",
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
            "rawText": "destroy an opposing Nexus.",
            "cleanText": "destroy an opposing Nexus",
            "link": "or",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A1106": {
    "cardNumber": "BATTLE-SPIRITS-A1106",
    "name": "The SmokeWolf Noroshi",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS14-109": {
    "cardNumber": "BS14-109",
    "name": "Altar Mirage",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-109#a0",
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
          "cleanBody": "During this turn, when your Cost 3 or more Spirits are destroyed by opposing Spirits via BP comparison, they remain on your Field, refreshed. This effect can't be used during (Your Turn)."
        },
        "clauses": [
          {
            "rawText": "During this turn, when your Cost 3 or more Spirits are destroyed by opposing Spirits via BP comparison, they remain on your Field, refreshed.",
            "cleanText": "when your Cost 3 or more Spirits are destroyed by opposing Spirits via BP comparison, they remain on your Field, refreshed",
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
          },
          {
            "rawText": "This effect can't be used during (Your Turn).",
            "cleanText": "This effect can't be used during (Your Turn)",
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
  "BS14-051": {
    "cardNumber": "BS14-051",
    "name": "Arcanabeastqueen",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-051#a0",
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
          "cleanBody": "You can reveal four cards from your decktop. Return them to your decktop in any order."
        },
        "clauses": [
          {
            "rawText": "You can reveal four cards from your decktop.",
            "cleanText": "You can reveal four cards from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 4
            }
          },
          {
            "rawText": "Return them to your decktop in any order.",
            "cleanText": "Return them to your decktop in any order",
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
        "id": "BS14-051#a1",
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
          "isFlash": true,
          "isMain": false,
          "cleanBody": "By exhausting a \"Magician\" family Spirit you control, during this turn, treat an opposing Spirit as being LV1."
        },
        "clauses": [
          {
            "rawText": "By exhausting a \"Magician\" family Spirit you control",
            "cleanText": "By exhausting a \"Magician\" family Spirit you control",
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
            "rawText": "during this turn, treat an opposing Spirit as being LV1.",
            "cleanText": "treat an opposing Spirit as being LV1",
            "link": "byDoing",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-099": {
    "cardNumber": "BS14-099",
    "name": "Arms Shock",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After an oppposing Spirit/Brave's (When Summoned) effect resolves",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-099#a0",
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
          "burstCondition": "AFTER_OPPONENT_SUMMON_EFFECT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Exhaust an opposing Spirit. Then by paying the cost, activate this card's Main effect."
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
            "rawText": "Then by paying the cost, activate this card's Main effect.",
            "cleanText": "Then by paying the cost, activate this card's Main effect",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ACTIVATE_CARD_EFFECT",
              "timing": "MAIN",
              "payCost": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-099#a1",
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
          "cleanBody": "Put a core from the Void to any Spirit you control."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void to any Spirit you control.",
            "cleanText": "Put a core from the Void to any Spirit you control",
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
  "BS14-041": {
    "cardNumber": "BS14-041",
    "name": "Buster-Fenrircannon",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-041#a0",
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
          "cleanBody": "For each White Spirit you control, this Spirit gains +2000 BP."
        },
        "clauses": [
          {
            "rawText": "For each White Spirit you control, this Spirit gains +2000 BP.",
            "cleanText": "For each White Spirit you control, this Spirit gains +2000 BP",
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
        "id": "BS14-041#a1",
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
          "cleanBody": "While you have a Burst set, the (When Blocks) effects of all your \"Machine Beast\" family Spirits also activate as (When Attacks)."
        },
        "clauses": [
          {
            "rawText": "While you have a Burst set, the (When Blocks) effects of all your \"Machine Beast\" family Spirits also activate as (When Attacks).",
            "cleanText": "the (When Blocks) effects of all your \"Machine Beast\" family Spirits also activate as (When Attacks)",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you have a Burst set",
            "duration": null,
            "op": {
              "op": "GRANT_FAMILY"
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
  "BS14-094": {
    "cardNumber": "BS14-094",
    "name": "Critical Burst",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After an opposing Spirit/Brave's (When Summoned) effect resolves",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-094#a0",
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
          "burstCondition": "AFTER_OPPONENT_SUMMON_EFFECT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy two opposing Nexuses. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Destroy two opposing Nexuses.",
            "cleanText": "Destroy two opposing Nexuses",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 2,
              "target": {
                "side": "opp",
                "types": [
                  "Nexus"
                ]
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
        "id": "BS14-094#a1",
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
          "cleanBody": "Destroy an opposing 6000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 6000 BP or less Spirit.",
            "cleanText": "Destroy an opposing 6000 BP or less Spirit",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-103": {
    "cardNumber": "BS14-103",
    "name": "Crystallize Illusion",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is destroyed by the opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-103#a0",
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
          "cleanBody": "Return a Spirit card which was destroyed when this Burst was activated from your Trash to your Hand. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Return a Spirit card which was destroyed when this Burst was activated from your Trash to your Hand.",
            "cleanText": "Return a Spirit card which was destroyed when this Burst was activated from your Trash to your Hand",
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
        "id": "BS14-103#a1",
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
          "cleanBody": "Target an opposing Spirit. During this turn, your Life can't be reduced by the unblocked attack of that Spirit."
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
            "rawText": "During this turn, your Life can't be reduced by the unblocked attack of that Spirit.",
            "cleanText": "your Life can't be reduced by the unblocked attack of that Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "COMBAT_RESTRICTION"
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
  "BS14-096": {
    "cardNumber": "BS14-096",
    "name": "Curse of Hades",
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
        "id": "BS14-096#a0",
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
          "cleanBody": "Destroy an opposing exhausted Cost 5 or less Spirit. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing exhausted Cost 5 or less Spirit.",
            "cleanText": "Destroy an opposing exhausted Cost 5 or less Spirit",
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
                  "costLte": 5,
                  "state": "EXHAUSTED"
                }
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
        "id": "BS14-096#a1",
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
          "cleanBody": "By destroying one of your Spirits, the opponent destroy one of their Spirits."
        },
        "clauses": [
          {
            "rawText": "By destroying one of your Spirits",
            "cleanText": "By destroying one of your Spirits",
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
            "rawText": "the opponent destroy one of their Spirits.",
            "cleanText": "the opponent destroy one of their Spirits",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-110": {
    "cardNumber": "BS14-110",
    "name": "Disaster Wind",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After an opposing Spirit/Brave's (When Summoned) effect resolves",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-110#a0",
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
          "burstCondition": "AFTER_OPPONENT_SUMMON_EFFECT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "During this turn, all opposing Spirits are treated as LV1. Then by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "During this turn, all opposing Spirits are treated as LV1.",
            "cleanText": "all opposing Spirits are treated as LV1",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "TREAT_LEVEL",
              "level": 1
            }
          },
          {
            "rawText": "Then by paying the cost, activate this card's Flash effect.",
            "cleanText": "Then by paying the cost, activate this card's Flash effect",
            "link": null,
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
        "id": "BS14-110#a1",
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
          "cleanBody": "During this turn, neither player's Life would be reduced by attacks of LV1 Spirits."
        },
        "clauses": [
          {
            "rawText": "During this turn, neither player's Life would be reduced by attacks of LV1 Spirits.",
            "cleanText": "neither player's Life would be reduced by attacks of LV1 Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "PREVENT_LIFE_LOSS"
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
  "BS14-107": {
    "cardNumber": "BS14-107",
    "name": "Dream Prayer",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is destroyed by the Opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-107#a0",
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
          "cleanBody": "Put a core from the Void to your Life. Then by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Put a core from the Void to your Life.",
            "cleanText": "Put a core from the Void to your Life",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "RECOVER_LIFE",
              "count": 1
            }
          },
          {
            "rawText": "Then by paying the cost, activate this card's Flash effect.",
            "cleanText": "Then by paying the cost, activate this card's Flash effect",
            "link": null,
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
        "id": "BS14-107#a1",
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
          "cleanBody": "Destroy an opposing attacking Spirit that is in refreshed state."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing attacking Spirit that is in refreshed state.",
            "cleanText": "Destroy an opposing attacking Spirit that is in refreshed state",
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
  "BS14-113": {
    "cardNumber": "BS14-113",
    "name": "Exclusion Horn",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is Destroyed by the Opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-113#a0",
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
          "cleanBody": "Discard five cards from the opposing decktop. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Discard five cards from the opposing decktop.",
            "cleanText": "Discard five cards from the opposing decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
              "side": "opp"
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
        "id": "BS14-113#a1",
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
          "cleanBody": "Return a card from the opposing Trash to their deckbottom."
        },
        "clauses": [
          {
            "rawText": "Return a card from the opposing Trash to their deckbottom.",
            "cleanText": "Return a card from the opposing Trash to their deckbottom",
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
  "BS14-111": {
    "cardNumber": "BS14-111",
    "name": "Execution Destroy",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-111#a0",
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
          "cleanBody": "Discard a card from the opposing decktop. If the discarded card is a Spirit card/Brave card, the opponent destroys a Spirit they control. If the discarded card is a Nexus card/Magic card, the opponent destroys a Nexus they control."
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
          },
          {
            "rawText": "If the discarded card is a Spirit card/Brave card, the opponent destroys a Spirit they control.",
            "cleanText": "the opponent destroys a Spirit they control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the discarded card is a Spirit card/Brave card",
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
            "rawText": "If the discarded card is a Nexus card/Magic card, the opponent destroys a Nexus they control.",
            "cleanText": "the opponent destroys a Nexus they control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the discarded card is a Nexus card/Magic card",
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
        "id": "BS14-111#a1",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-037": {
    "cardNumber": "BS14-037",
    "name": "Ezono-Owl",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-037#a0",
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
          "cleanBody": "When an opposing Spirit attacks, refresh this Spirit."
        },
        "clauses": [
          {
            "rawText": "When an opposing Spirit attacks, refresh this Spirit.",
            "cleanText": "When an opposing Spirit attacks, refresh this Spirit",
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
        "id": "BS14-037#a1",
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
          "cleanBody": "If you have a set Burst, put a core from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "If you have a set Burst, put a core from the Void to this Spirit.",
            "cleanText": "put a core from the Void to this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you have a set Burst",
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
  "BS14-105": {
    "cardNumber": "BS14-105",
    "name": "Glacial Slash",
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
        "id": "BS14-105#a0",
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
          "cleanBody": "Return an opposing Spirit to the decktop. Then by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Return an opposing Spirit to the decktop.",
            "cleanText": "Return an opposing Spirit to the decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              },
              "destination": "DECK"
            }
          },
          {
            "rawText": "Then by paying the cost, activate this card's Flash effect.",
            "cleanText": "Then by paying the cost, activate this card's Flash effect",
            "link": null,
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
        "id": "BS14-105#a1",
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
          "cleanBody": "Refresh all your Spirits. During this turn, your Spirits refreshed via this effect can't attack."
        },
        "clauses": [
          {
            "rawText": "Refresh all your Spirits.",
            "cleanText": "Refresh all your Spirits",
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
            "rawText": "During this turn, your Spirits refreshed via this effect can't attack.",
            "cleanText": "your Spirits refreshed via this effect can't attack",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-045": {
    "cardNumber": "BS14-045",
    "name": "Goristal",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-045#a0",
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
          "cleanBody": "When only the opposing Spirit is destroyed via BP comparison, destroy this Spirit."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed via BP comparison, destroy this Spirit.",
            "cleanText": "When only the opposing Spirit is destroyed via BP comparison, destroy this Spirit",
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
        "id": "BS14-045#a1",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-030": {
    "cardNumber": "BS14-030",
    "name": "Grant-Benkei",
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
        "id": "BS14-030#a0",
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
          "cleanBody": "The opponent discards a card from their Hand. Then, return this card to the Hand."
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
          },
          {
            "rawText": "return this card to the Hand.",
            "cleanText": "return this card to the Hand",
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-030#a1",
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
      },
      {
        "id": "BS14-030#a2",
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
          "cleanBody": "When your \"Shell Insect\" family Spirit battles against an opposing 7000 BP or less Spirit, refresh that Spirit of yours."
        },
        "clauses": [
          {
            "rawText": "When your \"Shell Insect\" family Spirit battles against an opposing 7000 BP or less Spirit, refresh that Spirit of yours.",
            "cleanText": "When your \"Shell Insect\" family Spirit battles against an opposing 7000 BP or less Spirit, refresh that Spirit of yours",
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
  "BATTLE-SPIRITS-A4849": {
    "cardNumber": "BATTLE-SPIRITS-A4849",
    "name": "Gurangatch",
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
        "id": "BATTLE-SPIRITS-A4849#a0",
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
        "id": "BATTLE-SPIRITS-A4849#a1",
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
          "timing": "WHEN_BRAVE_ATTACKS",
          "timingLabel": "When Brave Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing Cost 3 or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Cost 3 or less Spirit.",
            "cleanText": "Destroy an opposing Cost 3 or less Spirit",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-036": {
    "cardNumber": "BS14-036",
    "name": "Icemaiden Mk-II",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS14-005": {
    "cardNumber": "BS14-005",
    "name": "Hinoshishi",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-005#a0",
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
          "cleanBody": "Return a Cost 4 or less Spirit card, or a Spirit card with Burst effect from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return a Cost 4 or less Spirit card, or a Spirit card with Burst effect from your Trash to the Hand.",
            "cleanText": "Return a Cost 4 or less Spirit card, or a Spirit card with Burst effect from your Trash to the Hand",
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
  "BS14-097": {
    "cardNumber": "BS14-097",
    "name": "Instantaneous Shoot",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After an opposing Spirit/Brave's (When Summoned) effect resolves",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-097#a0",
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
          "burstCondition": "AFTER_OPPONENT_SUMMON_EFFECT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Send a core from any opposing Spirits to their Reserve. Then, by paying the cost, activate this card's Main effect."
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
        "id": "BS14-097#a1",
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
          "cleanBody": "Summon a Cost 4 or less Spirit card from your Trash, without paying the cost. However, any (When Summoned) effect of the Spirit can't activate."
        },
        "clauses": [
          {
            "rawText": "Summon a Cost 4 or less Spirit card from your Trash, without paying the cost.",
            "cleanText": "Summon a Cost 4 or less Spirit card from your Trash, without paying the cost",
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
            "rawText": "any (When Summoned) effect of the Spirit can't activate.",
            "cleanText": "any (When Summoned) effect of the Spirit can't activate",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-007": {
    "cardNumber": "BS14-007",
    "name": "Kagutsuchidragoon",
    "keywords": [
      {
        "name": "Clash",
        "parameter": null,
        "wave": 1,
        "hook": "clash",
        "bracketed": true,
        "index": 46
      }
    ],
    "abilities": [
      {
        "id": "BS14-007#a0",
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
        "id": "BS14-007#a1",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-065": {
    "cardNumber": "BS14-065",
    "name": "Kurofune-Golem",
    "keywords": [
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 16
      },
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 230
      }
    ],
    "abilities": [
      {
        "id": "BS14-065#a0",
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
          "cleanBody": "Discard a number of cards from the opposing decktop equal to this Spirit's LV."
        },
        "clauses": [
          {
            "rawText": "Discard a number of cards from the opposing decktop equal to this Spirit's LV.",
            "cleanText": "Discard a number of cards from the opposing decktop equal to this Spirit's LV",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MILL_DECK",
              "count": "LEVEL",
              "side": "opp"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-065#a1",
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
          "cleanBody": "When only the opposing Spirit is destroyed by comparing BP with your Spirit with [Crush], discard cards from the opposing decktop equal to the cost of the destroyed opposing Spirit."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Spirit is destroyed by comparing BP with your Spirit with [Crush], discard cards from the opposing decktop equal to the cost of the destroyed opposing Spirit.",
            "cleanText": "When only the opposing Spirit is destroyed by comparing BP with your Spirit with [Crush], discard cards from the opposing decktop equal to the cost of the destroyed opposing Spirit",
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
  "BS14-067": {
    "cardNumber": "BS14-067",
    "name": "Lagian",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "Cost 4 or more",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      },
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
        "id": "BS14-067#a0",
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
        "id": "BS14-067#a1",
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
      }
    ],
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A6347": {
    "cardNumber": "BATTLE-SPIRITS-A6347",
    "name": "Last Stand",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A6347#a0",
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
          "cleanBody": "☼<nowiki>[ </nowiki>Burst: After your Spirit is destroyed by the opponent<nowiki>]</nowiki>\nPut a core from the void to your Reserve. Then, by paying the cost, activate this card's flash effect."
        },
        "clauses": [
          {
            "rawText": "☼<nowiki>[ </nowiki>Burst: After your Spirit is destroyed by the opponent<nowiki>]</nowiki>",
            "cleanText": "☼<nowiki>[ </nowiki>Burst: After your Spirit is destroyed by the opponent<nowiki>]</nowiki>",
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
            "rawText": "Put a core from the void to your Reserve.",
            "cleanText": "Put a core from the void to your Reserve",
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
            "rawText": "by paying the cost, activate this card's flash effect.",
            "cleanText": "by paying the cost, activate this card's flash effect",
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
        "id": "BATTLE-SPIRITS-A6347#a1",
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
          "cleanBody": "Target a Green Spirit you control. During this turn, that Spirit can block all opposing Spirits even when exhausted."
        },
        "clauses": [
          {
            "rawText": "Target a Green Spirit you control.",
            "cleanText": "Target a Green Spirit you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TARGET_SELECT"
            }
          },
          {
            "rawText": "During this turn, that Spirit can block all opposing Spirits even when exhausted.",
            "cleanText": "that Spirit can block all opposing Spirits even when exhausted",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-108": {
    "cardNumber": "BS14-108",
    "name": "Magical Light",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-108#a0",
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
          "cleanBody": "Reveal four cards from your decktop. If there is any Magic card among them, add one to your Hand. Discard any remaining cards."
        },
        "clauses": [
          {
            "rawText": "Reveal four cards from your decktop.",
            "cleanText": "Reveal four cards from your decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 4
            }
          },
          {
            "rawText": "If there is any Magic card among them, add one to your Hand.",
            "cleanText": "add one to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If there is any Magic card among them",
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
      },
      {
        "id": "BS14-108#a1",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-039": {
    "cardNumber": "BS14-039",
    "name": "Mibrock-Soldier",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-039#a0",
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
          "cleanBody": "Return an opposing Spirit to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return an opposing Spirit to the Hand.",
            "cleanText": "Return an opposing Spirit to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              },
              "destination": "HAND"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-039#a1",
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
          "cleanBody": "While you have a set burst, all your \"Mibrock\"-named Spirits gain +2000 BP."
        },
        "clauses": [
          {
            "rawText": "While you have a set burst, all your \"Mibrock\"-named Spirits gain +2000 BP.",
            "cleanText": "all your \"Mibrock\"-named Spirits gain +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you have a set burst",
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
  "BS14-031": {
    "cardNumber": "BS14-031",
    "name": "Musha-Apewhip",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-031#a0",
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
          "cleanBody": "If you have a Burst set, put two cores from the Void to your Reserve."
        },
        "clauses": [
          {
            "rawText": "If you have a Burst set, put two cores from the Void to your Reserve.",
            "cleanText": "put two cores from the Void to your Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you have a Burst set",
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-031#a1",
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
          "cleanBody": "While you have a Burst set, for each core in your Reserve, this Spirit gains +1000 BP."
        },
        "clauses": [
          {
            "rawText": "While you have a Burst set, for each core in your Reserve, this Spirit gains +1000 BP.",
            "cleanText": "for each core in your Reserve, this Spirit gains +1000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you have a Burst set",
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
  "BS14-055": {
    "cardNumber": "BS14-055",
    "name": "Mystic-Himiko",
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
        "id": "BS14-055#a0",
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
          "cleanBody": "If there are three or more Magic cards in your Trash, summon this Spirit card."
        },
        "clauses": [
          {
            "rawText": "If there are three or more Magic cards in your Trash, summon this Spirit card.",
            "cleanText": "summon this Spirit card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If there are three or more Magic cards in your Trash",
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
        "id": "BS14-055#a1",
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
          "cleanBody": "All your \"Dark Artes\" family Spirits can't be blocked by opposing Spirits without the \"Supreme Hero\" family."
        },
        "clauses": [
          {
            "rawText": "All your \"Dark Artes\" family Spirits can't be blocked by opposing Spirits without the \"Supreme Hero\" family.",
            "cleanText": "All your \"Dark Artes\" family Spirits can't be blocked by opposing Spirits without the \"Supreme Hero\" family",
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
        "id": "BS14-055#a2",
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
          "cleanBody": "You can use one Yellow Magic during the Flash Timing, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "You can use one Yellow Magic during the Flash Timing, without paying the cost.",
            "cleanText": "You can use one Yellow Magic during the Flash Timing, without paying the cost",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-046": {
    "cardNumber": "BS14-046",
    "name": "Pam",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS14-106": {
    "cardNumber": "BS14-106",
    "name": "Recovered Core",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-106#a0",
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
          "cleanBody": "Put one core each from the Void to your Life and a White Spirit you control."
        },
        "clauses": [
          {
            "rawText": "Put one core each from the Void to your Life and a White Spirit you control.",
            "cleanText": "Put one core each from the Void to your Life and a White Spirit you control",
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
        "id": "BS14-106#a1",
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
  "BS14-064": {
    "cardNumber": "BS14-064",
    "name": "Revoluting-Zeyon",
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
        "id": "BS14-064#a0",
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
          "cleanBody": "You can deploy Red/Purple/Green/Blue Nexus cards, one of each, from your Trash. Then, if you control three or more Nexuses, summon this Spirit card."
        },
        "clauses": [
          {
            "rawText": "You can deploy Red/Purple/Green/Blue Nexus cards, one of each, from your Trash.",
            "cleanText": "You can deploy Red/Purple/Green/Blue Nexus cards, one of each, from your Trash",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DEPLOY_NEXUS",
              "free": true
            }
          },
          {
            "rawText": "if you control three or more Nexuses, summon this Spirit card.",
            "cleanText": "summon this Spirit card",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": "if you control three or more Nexuses",
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
        "id": "BS14-064#a1",
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
          "cleanBody": "When your Spirits are destroyed by the opponent, by exhausting a Nexus you control, one of your destroyed Spirits remains on the Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "When your Spirits are destroyed by the opponent, by exhausting a Nexus you control, one of your destroyed Spirits remains on the Field, exhausted.",
            "cleanText": "When your Spirits are destroyed by the opponent, by exhausting a Nexus you control, one of your destroyed Spirits remains on the Field, exhausted",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-062": {
    "cardNumber": "BS14-062",
    "name": "Rock-Golem-Custom",
    "keywords": [
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 16
      },
      {
        "name": "Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 208
      },
      {
        "name": "Great Crush",
        "parameter": null,
        "wave": 1,
        "hook": "crush",
        "bracketed": true,
        "index": 216
      }
    ],
    "abilities": [
      {
        "id": "BS14-062#a0",
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
          "cleanBody": "Discard a number of cards from the opposing decktop equal to the level of this Spirit."
        },
        "clauses": [
          {
            "rawText": "Discard a number of cards from the opposing decktop equal to the level of this Spirit.",
            "cleanText": "Discard a number of cards from the opposing decktop equal to the level of this Spirit",
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
        "id": "BS14-062#a1",
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
          "cleanBody": "While you have a Burst set, every Spirit with [Crush]/[Great Crush] you control gets + 2000 BP."
        },
        "clauses": [
          {
            "rawText": "While you have a Burst set, every Spirit with [Crush]/[Great Crush] you control gets + 2000 BP.",
            "cleanText": "every Spirit with [Crush]/[Great Crush] you control gets + 2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you have a Burst set",
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
  "BATTLE-SPIRITS-A7636": {
    "cardNumber": "BATTLE-SPIRITS-A7636",
    "name": "Scartooth",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A7636#a0",
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
          "cleanBody": "While there are only Red cards in your Trash, this Spirit gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "While there are only Red cards in your Trash, this Spirit gains +3000 BP.",
            "cleanText": "this Spirit gains +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While there are only Red cards in your Trash",
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
  "BS14-112": {
    "cardNumber": "BS14-112",
    "name": "Sealing Maelstrom",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After an opposing Spirit/Brave's (When Summoned) effect resolves",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-112#a0",
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
          "burstCondition": "AFTER_OPPONENT_SUMMON_EFFECT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "During this turn, the opponent can't use Magic cards. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "During this turn, the opponent can't use Magic cards.",
            "cleanText": "the opponent can't use Magic cards",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "SET_RESTRICTION",
              "restriction": "PREVENT_MAGIC",
              "side": "opp"
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
        "id": "BS14-112#a1",
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
          "cleanBody": "During this turn, treat a Spirit you control as being one level higher."
        },
        "clauses": [
          {
            "rawText": "During this turn, treat a Spirit you control as being one level higher.",
            "cleanText": "treat a Spirit you control as being one level higher",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-016": {
    "cardNumber": "BS14-016",
    "name": "Shikitsuru",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-016#a0",
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
    "compiledClausesCount": 1,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-019": {
    "cardNumber": "BS14-019",
    "name": "Shuten-Doga",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-019#a0",
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
          "cleanBody": "You can summon a Cost 3 or less \"Evil Shadow\" family Spirit card from your Trash, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "You can summon a Cost 3 or less \"Evil Shadow\" family Spirit card from your Trash, without paying the cost.",
            "cleanText": "You can summon a Cost 3 or less \"Evil Shadow\" family Spirit card from your Trash, without paying the cost",
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
        "id": "BS14-019#a1",
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
          "cleanBody": "Your Burst effects send +1 core from opposing Spirits to their Reserve/Trash."
        },
        "clauses": [
          {
            "rawText": "Your Burst effects send +1 core from opposing Spirits to their Reserve/Trash.",
            "cleanText": "Your Burst effects send +1 core from opposing Spirits to their Reserve/Trash",
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
        "id": "BS14-019#a2",
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
          "cleanBody": "While you have a set burst, for each \"Evil Shadow\" family Spirit you control, this Spirit gains +2000 BP."
        },
        "clauses": [
          {
            "rawText": "While you have a set burst, for each \"Evil Shadow\" family Spirit you control, this Spirit gains +2000 BP.",
            "cleanText": "for each \"Evil Shadow\" family Spirit you control, this Spirit gains +2000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you have a set burst",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-100": {
    "cardNumber": "BS14-100",
    "name": "Storm Attack",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-100#a0",
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
          "cleanBody": "Exhaust an opposing Spirit. Then, refresh a Spirit you control."
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
            "rawText": "refresh a Spirit you control.",
            "cleanText": "refresh a Spirit you control",
            "link": "then",
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
  "BS14-026": {
    "cardNumber": "BS14-026",
    "name": "Tamamush",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-026#a0",
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
          "cleanBody": "Put a number of cores from the Void to this Spirit equal to the level of this Spirit."
        },
        "clauses": [
          {
            "rawText": "Put a number of cores from the Void to this Spirit equal to the level of this Spirit.",
            "cleanText": "Put a number of cores from the Void to this Spirit equal to the level of this Spirit",
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
  "BS14-080": {
    "cardNumber": "BS14-080",
    "name": "The Ancient Forest",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-080#a0",
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
          "cleanBody": "For each opposing Spirit, all your Green Spirits gain +1000 BP."
        },
        "clauses": [
          {
            "rawText": "For each opposing Spirit, all your Green Spirits gain +1000 BP.",
            "cleanText": "For each opposing Spirit, all your Green Spirits gain +1000 BP",
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
                "color": "Green"
              },
              "all": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-080#a1",
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
          "cleanBody": "Refresh all your Green Spirits."
        },
        "clauses": [
          {
            "rawText": "Refresh all your Green Spirits.",
            "cleanText": "Refresh all your Green Spirits",
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
  "BS14-085": {
    "cardNumber": "BS14-085",
    "name": "The Admiring Pipe Organ",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-085#a0",
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
          "cleanBody": "Cards from either players' deck can't be discarded during the Main Step."
        },
        "clauses": [
          {
            "rawText": "Cards from either players' deck can't be discarded during the Main Step.",
            "cleanText": "Cards from either players' deck can't be discarded during the Main Step",
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
      },
      {
        "id": "BS14-085#a1",
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
          "cleanBody": "Destroy all Red/Green/White/Blue Spirits refreshed by a Spirit/Magic effect."
        },
        "clauses": [
          {
            "rawText": "Destroy all Red/Green/White/Blue Spirits refreshed by a Spirit/Magic effect.",
            "cleanText": "Destroy all Red/Green/White/Blue Spirits refreshed by a Spirit/Magic effect",
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
  "BS14-053": {
    "cardNumber": "BS14-053",
    "name": "The Angelia of Olimpics Hagith",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-053#a0",
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
          "cleanBody": "You can reveal one of your Bursts. If that card is a Magic card, return it to your Hand. If not, discard it."
        },
        "clauses": [
          {
            "rawText": "You can reveal one of your Bursts.",
            "cleanText": "You can reveal one of your Bursts",
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
            "rawText": "If that card is a Magic card, return it to your Hand.",
            "cleanText": "return it to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If that card is a Magic card",
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
            "rawText": "If not, discard it.",
            "cleanText": "discard it",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If not",
            "duration": null,
            "op": {
              "op": "DECK_OR_HAND_ACTION"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-053#a1",
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
          "cleanBody": "Opposing Cost 2/4/6/8 Spirits can't attack."
        },
        "clauses": [
          {
            "rawText": "Opposing Cost 2/4/6/8 Spirits can't attack.",
            "cleanText": "Opposing Cost 2/4/6/8 Spirits can't attack",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-040": {
    "cardNumber": "BS14-040",
    "name": "The BraveArtifact Ryudroid",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-040#a0",
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
          "cleanBody": "When this Spirit card is discarded from your Hand due to the opponent, you can summon it without paying the cost."
        },
        "clauses": [
          {
            "rawText": "When this Spirit card is discarded from your Hand due to the opponent, you can summon it without paying the cost.",
            "cleanText": "When this Spirit card is discarded from your Hand due to the opponent, you can summon it without paying the cost",
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
        "id": "BS14-040#a1",
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
          "cleanBody": "When the attack of an opposing Spirit with BP equal or inferior to this Spirit's isn't blocked, your Life won't be reduced by that Spirit's attack."
        },
        "clauses": [
          {
            "rawText": "When the attack of an opposing Spirit with BP equal or inferior to this Spirit's isn't blocked, your Life won't be reduced by that Spirit's attack.",
            "cleanText": "When the attack of an opposing Spirit with BP equal or inferior to this Spirit's isn't blocked, your Life won't be reduced by that Spirit's attack",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "PREVENT_LIFE_LOSS"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-040#a2",
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
          "cleanBody": "When the opponent uses a Purple/Yellow Magic effect, by exhausting this Spirit, negate that effect."
        },
        "clauses": [
          {
            "rawText": "When the opponent uses a Purple/Yellow Magic effect, by exhausting this Spirit, negate that effect.",
            "cleanText": "When the opponent uses a Purple/Yellow Magic effect, by exhausting this Spirit, negate that effect",
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
  "BS14-049": {
    "cardNumber": "BS14-049",
    "name": "The Butler Pentan",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-049#a0",
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
          "cleanBody": "When this Spirit card is discarded by an opposing \"deck discarding effect\", during this turn, cards can't be discarded from your deck, and you can summon this Spirit card, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "When this Spirit card is discarded by an opposing \"deck discarding effect\", during this turn, cards can't be discarded from your deck, and you can summon this Spirit card, without paying the cost.",
            "cleanText": "When this Spirit card is discarded by an opposing \"deck discarding effect\", during this turn, cards can't be discarded from your deck, and you can summon this Spirit card, without paying the cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
            "op": {
              "op": "SUMMON_FREE",
              "from": "HAND"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-049#a1",
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
          "cleanBody": "When your \"Pentan\"-named Spirits are destroyed, draw a card."
        },
        "clauses": [
          {
            "rawText": "When your \"Pentan\"-named Spirits are destroyed, draw a card.",
            "cleanText": "When your \"Pentan\"-named Spirits are destroyed, draw a card",
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
  "BS14-X02": {
    "cardNumber": "BS14-X02",
    "name": "The CurseHero Chaotic-Seimei",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is destroyed by the Opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "Spell Blight",
        "parameter": null,
        "wave": 4,
        "hook": "spell_blight",
        "bracketed": true,
        "index": 234
      }
    ],
    "abilities": [
      {
        "id": "BS14-X02#a0",
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
          "cleanBody": "Send a core from any opposing Spirit to their Trash. Also, if this Burst is activated when a Purple Spirit is destroyed, draw a card. Then, return this card to your Hand."
        },
        "clauses": [
          {
            "rawText": "Send a core from any opposing Spirit to their Trash.",
            "cleanText": "Send a core from any opposing Spirit to their Trash",
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
            "rawText": "if this Burst is activated when a Purple Spirit is destroyed, draw a card.",
            "cleanText": "draw a card",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": "if this Burst is activated when a Purple Spirit is destroyed",
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": null
            }
          },
          {
            "rawText": "return this card to your Hand.",
            "cleanText": "return this card to your Hand",
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-X02#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_DESTROYED",
          "timingLabel": "When Destroyed by the Opponent",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Spell Blight",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "By sending an opposing Life to their Trash, this Spirit remains on the Field, refreshed."
        },
        "clauses": [
          {
            "rawText": "By sending an opposing Life to their Trash",
            "cleanText": "By sending an opposing Life to their Trash",
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
            "rawText": "this Spirit remains on the Field, refreshed.",
            "cleanText": "this Spirit remains on the Field, refreshed",
            "link": "byDoing",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-086": {
    "cardNumber": "BS14-086",
    "name": "The Destiny Roulette",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-086#a0",
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
          "cleanBody": "When your Life is reduced, you can reveal a card from your decktop. If it's a Yellow Magic card, refresh a Spirit you control. Add the revealed card to the Hand."
        },
        "clauses": [
          {
            "rawText": "When your Life is reduced, you can reveal a card from your decktop.",
            "cleanText": "When your Life is reduced, you can reveal a card from your decktop",
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
            "rawText": "If it's a Yellow Magic card, refresh a Spirit you control.",
            "cleanText": "refresh a Spirit you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If it's a Yellow Magic card",
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
      },
      {
        "id": "BS14-086#a1",
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
          "cleanBody": "You can reveal three cards from your decktop. Return the reveled cards to your decktop."
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
            "rawText": "Return the reveled cards to your decktop.",
            "cleanText": "Return the reveled cards to your decktop",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-087": {
    "cardNumber": "BS14-087",
    "name": "The Empire of Pentan:the Capital Empereur",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-087#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "By sending two cores from this Nexus to your Trash, when the battle resolves, compare LV instead of BP, and the Spirit with the lower level is destroyed. If the LVs are the same, both Spirits are destroyed."
        },
        "clauses": [
          {
            "rawText": "By sending two cores from this Nexus to your Trash",
            "cleanText": "By sending two cores from this Nexus to your Trash",
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
            "rawText": "when the battle resolves, compare LV instead of BP, and the Spirit with the lower level is destroyed.",
            "cleanText": "when the battle resolves, compare LV instead of BP, and the Spirit with the lower level is destroyed",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COMBAT_RULE"
            }
          },
          {
            "rawText": "If the LVs are the same, both Spirits are destroyed.",
            "cleanText": "both Spirits are destroyed",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If the LVs are the same",
            "duration": null,
            "op": {
              "op": "COMBAT_RULE"
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
  "BS14-010": {
    "cardNumber": "BS14-010",
    "name": "The FangBeastEmperor Kintarogue-Bear",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After an opposing Spirit/Brave's (When Summoned) effect resolves",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-010#a0",
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
          "burstCondition": "AFTER_OPPONENT_SUMMON_EFFECT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy two opposing 4000 BP or less Spirits. Then, draw a card."
        },
        "clauses": [
          {
            "rawText": "Destroy two opposing 4000 BP or less Spirits.",
            "cleanText": "Destroy two opposing 4000 BP or less Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 2,
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
            "rawText": "draw a card.",
            "cleanText": "draw a card",
            "link": "then",
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
        "id": "BS14-010#a1",
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
          "cleanBody": "Destroy two opposing 4000 BP or less Spirits."
        },
        "clauses": [
          {
            "rawText": "Destroy two opposing 4000 BP or less Spirits.",
            "cleanText": "Destroy two opposing 4000 BP or less Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 2,
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-010#a2",
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
          "cleanBody": "When your \"Emperor Beast\" family Spirit attacks, destroy an opposing Spirit with BP equal or inferior to that Spirit's."
        },
        "clauses": [
          {
            "rawText": "When your \"Emperor Beast\" family Spirit attacks, destroy an opposing Spirit with BP equal or inferior to that Spirit's.",
            "cleanText": "When your \"Emperor Beast\" family Spirit attacks, destroy an opposing Spirit with BP equal or inferior to that Spirit's",
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
  },
  "BS14-090": {
    "cardNumber": "BS14-090",
    "name": "The Fearless City on the Ship",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-090#a0",
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
          "cleanBody": "Treat the \"BP+ When Braved\" of all Brave Spirits as 0."
        },
        "clauses": [
          {
            "rawText": "Treat the \"BP+ When Braved\" of all Brave Spirits as 0.",
            "cleanText": "Treat the \"BP+ When Braved\" of all Brave Spirits as 0",
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
  "BS14-075": {
    "cardNumber": "BS14-075",
    "name": "The Fortified City of Flame Dragon",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-075#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "When opposing Spirits are destroyed, draw a card for each Spirit destroyed."
        },
        "clauses": [
          {
            "rawText": "When opposing Spirits are destroyed, draw a card for each Spirit destroyed.",
            "cleanText": "When opposing Spirits are destroyed, draw a card for each Spirit destroyed",
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
  "BS14-066": {
    "cardNumber": "BS14-066",
    "name": "The FistMaster Tiga",
    "keywords": [
      {
        "name": "Assault",
        "parameter": "2",
        "wave": 1,
        "hook": "assault",
        "bracketed": true,
        "index": 16
      },
      {
        "name": "Assault",
        "parameter": null,
        "wave": 1,
        "hook": "assault",
        "bracketed": true,
        "index": 179
      }
    ],
    "abilities": [
      {
        "id": "BS14-066#a0",
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
          "keyword": "Assault: 2",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit can, twice per turn, be refreshed by exhausting one of your Nexuses."
        },
        "clauses": [
          {
            "rawText": "This Spirit can, twice per turn, be refreshed by exhausting one of your Nexuses.",
            "cleanText": "This Spirit can, twice per turn, be refreshed by exhausting one of your Nexuses",
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
      },
      {
        "id": "BS14-066#a1",
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
          "cleanBody": "This Spirit's [Assault] also activates at (When Blocks)."
        },
        "clauses": [
          {
            "rawText": "This Spirit's [Assault] also activates at (When Blocks).",
            "cleanText": "This Spirit's [Assault] also activates at (When Blocks)",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CONTINUOUS_RULE"
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
  "BS14-083": {
    "cardNumber": "BS14-083",
    "name": "The Freezing WaterFalls",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-083#a0",
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
          "cleanBody": "At the end of the battle of a 3000 BP or less Spirit, end the Attack Step."
        },
        "clauses": [
          {
            "rawText": "At the end of the battle of a 3000 BP or less Spirit, end the Attack Step.",
            "cleanText": "At the end of the battle of a 3000 BP or less Spirit, end the Attack Step",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COMBAT_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-083#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "Return an opposing Nexus to their Hand."
        },
        "clauses": [
          {
            "rawText": "Return an opposing Nexus to their Hand.",
            "cleanText": "Return an opposing Nexus to their Hand",
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
  "BS14-011": {
    "cardNumber": "BS14-011",
    "name": "The FlameDragonDevil Ma-Gwo",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-011#a0",
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
          "cleanBody": "At the start of the step, you can send as many cores as you like from your Trash to this Spirit."
        },
        "clauses": [
          {
            "rawText": "At the start of the step, you can send as many cores as you like from your Trash to this Spirit.",
            "cleanText": "At the start of the step, you can send as many cores as you like from your Trash to this Spirit",
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
        "id": "BS14-011#a1",
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
          "cleanBody": "All your \"Dragon\"/ \"Ancient Dragon\" family Spirits gain +3000 BP."
        },
        "clauses": [
          {
            "rawText": "All your \"Dragon\"/ \"Ancient Dragon\" family Spirits gain +3000 BP.",
            "cleanText": "All your \"Dragon\"/ \"Ancient Dragon\" family Spirits gain +3000 BP",
            "link": null,
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
      },
      {
        "id": "BS14-011#a2",
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
          "cleanBody": "All your \"Ancient Dragon\" family Spirits gain an extra Red symbol."
        },
        "clauses": [
          {
            "rawText": "All your \"Ancient Dragon\" family Spirits gain an extra Red symbol.",
            "cleanText": "All your \"Ancient Dragon\" family Spirits gain an extra Red symbol",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-044": {
    "cardNumber": "BS14-044",
    "name": "The GlacialDragon Glaceus",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-044#a0",
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
          "cleanBody": "While you have a set burst, this Spirit is unaffected by opposing Spirit effects."
        },
        "clauses": [
          {
            "rawText": "While you have a set burst, this Spirit is unaffected by opposing Spirit effects.",
            "cleanText": "this Spirit is unaffected by opposing Spirit effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you have a set burst",
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
        "id": "BS14-044#a1",
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
          "cleanBody": "This Spirit can't be blocked by non-Cost 8 Spirits."
        },
        "clauses": [
          {
            "rawText": "This Spirit can't be blocked by non-Cost 8 Spirits.",
            "cleanText": "This Spirit can't be blocked by non-Cost 8 Spirits",
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
  "BS14-054": {
    "cardNumber": "BS14-054",
    "name": "The GreatAngelia Angu",
    "keywords": [
      {
        "name": "Holy Life",
        "parameter": null,
        "wave": 1,
        "hook": "holy_life",
        "bracketed": true,
        "index": 16
      },
      {
        "name": "Holy Life",
        "parameter": null,
        "wave": 1,
        "hook": "holy_life",
        "bracketed": true,
        "index": 185
      },
      {
        "name": "Holy Life",
        "parameter": null,
        "wave": 1,
        "hook": "holy_life",
        "bracketed": true,
        "index": 263
      }
    ],
    "abilities": [
      {
        "id": "BS14-054#a0",
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
        "id": "BS14-054#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
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
          "cleanBody": "Refresh a Spirit with [Holy Life] you control."
        },
        "clauses": [
          {
            "rawText": "Refresh a Spirit with [Holy Life] you control.",
            "cleanText": "Refresh a Spirit with [Holy Life] you control",
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
      },
      {
        "id": "BS14-054#a2",
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
          "cleanBody": "Give all your \"Divine Spirit\" family Spirits: [Holy Life]."
        },
        "clauses": [
          {
            "rawText": "Give all your \"Divine Spirit\" family Spirits: [Holy Life].",
            "cleanText": "Give all your \"Divine Spirit\" family Spirits: [Holy Life]",
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
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-033": {
    "cardNumber": "BS14-033",
    "name": "The GreatTreeGuardian Blanboar",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-033#a0",
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
          "cleanBody": "When the battling opposing Spirit is destroyed, refresh this Spirit."
        },
        "clauses": [
          {
            "rawText": "When the battling opposing Spirit is destroyed, refresh this Spirit.",
            "cleanText": "When the battling opposing Spirit is destroyed, refresh this Spirit",
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
        "id": "BS14-033#a1",
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
          "cleanBody": "When the battling opposing Spirit is destroyed, send a core from the opposing Life to the Reserve."
        },
        "clauses": [
          {
            "rawText": "When the battling opposing Spirit is destroyed, send a core from the opposing Life to the Reserve.",
            "cleanText": "When the battling opposing Spirit is destroyed, send a core from the opposing Life to the Reserve",
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
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BATTLE-SPIRITS-A10799": {
    "cardNumber": "BATTLE-SPIRITS-A10799",
    "name": "The HeroEmperor Lord-Dragon-Dominion",
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
        "id": "BATTLE-SPIRITS-A10799#a0",
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
          "cleanBody": "Summon this Spirit card."
        },
        "clauses": [
          {
            "rawText": "Summon this Spirit card.",
            "cleanText": "Summon this Spirit card",
            "link": null,
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
        "id": "BATTLE-SPIRITS-A10799#a1",
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
          "cleanBody": "By setting a card with Burst effect from your Hand, draw a card."
        },
        "clauses": [
          {
            "rawText": "By setting a card with Burst effect from your Hand",
            "cleanText": "By setting a card with Burst effect from your Hand",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
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
        "id": "BATTLE-SPIRITS-A10799#a2",
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
          "cleanBody": "While you have a Burst set, this Spirit gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "While you have a Burst set, this Spirit gains +3000 BP.",
            "cleanText": "this Spirit gains +3000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While you have a Burst set",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-X04": {
    "cardNumber": "BS14-X04",
    "name": "The IceHero Mibrock-Baragan",
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
        "id": "BS14-X04#a0",
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
          "cleanBody": "Summon this Spirit card."
        },
        "clauses": [
          {
            "rawText": "Summon this Spirit card.",
            "cleanText": "Summon this Spirit card",
            "link": null,
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
        "id": "BS14-X04#a1",
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
          "timingLabel": "After Your Burst Activates",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "If you don't have a Burst set, you can set a card with Burst effect from your Hand."
        },
        "clauses": [
          {
            "rawText": "If you don't have a Burst set, you can set a card with Burst effect from your Hand.",
            "cleanText": "you can set a card with Burst effect from your Hand",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": "If you don't have a Burst set",
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-X04#a2",
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
          "cleanBody": "At the start of the step, by returning a Spirit you control to the Hand, return any number of opposing Spirits with a total cost up to (the cost of the Spirit returned) to the Hand."
        },
        "clauses": [
          {
            "rawText": "At the start of the step, by returning a Spirit you control to the Hand, return any number of opposing Spirits with a total cost up to (the cost of the Spirit returned) to the Hand.",
            "cleanText": "At the start of the step, by returning a Spirit you control to the Hand, return any number of opposing Spirits with a total cost up to (the cost of the Spirit returned) to the Hand",
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
  "BS14-042": {
    "cardNumber": "BS14-042",
    "name": "The IronArtifact Modi",
    "keywords": [
      {
        "name": "Heavy Armor",
        "parameter": "Green/Blue",
        "wave": 1,
        "hook": "heavy_armor",
        "bracketed": true,
        "index": 11
      },
      {
        "name": "Heavy Armor",
        "parameter": null,
        "wave": 1,
        "hook": "heavy_armor",
        "bracketed": true,
        "index": 260
      }
    ],
    "abilities": [
      {
        "id": "BS14-042#a0",
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
          "keyword": "Heavy Armor: Green/Blue",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit is unaffected by opposing Green/Blue Spirit/Brave/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit is unaffected by opposing Green/Blue Spirit/Brave/Nexus/Magic effects.",
            "cleanText": "This Spirit is unaffected by opposing Green/Blue Spirit/Brave/Nexus/Magic effects",
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
        "id": "BS14-042#a1",
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
          "cleanBody": "When this Spirit is the destroyed via BP comparison by opposing Spirits with the same color as stated in this Spirit's [Heavy Armor], this Spirit remains on the Field, refreshed."
        },
        "clauses": [
          {
            "rawText": "When this Spirit is the destroyed via BP comparison by opposing Spirits with the same color as stated in this Spirit's [Heavy Armor], this Spirit remains on the Field, refreshed.",
            "cleanText": "When this Spirit is the destroyed via BP comparison by opposing Spirits with the same color as stated in this Spirit's [Heavy Armor], this Spirit remains on the Field, refreshed",
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
  "BS14-077": {
    "cardNumber": "BS14-077",
    "name": "The Leaning Tower of Corpse",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-077#a0",
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
          "cleanBody": "Exhaust any opposing Spirit that has core placed on them except via Spirit/Brave/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "Exhaust any opposing Spirit that has core placed on them except via Spirit/Brave/Nexus/Magic effects.",
            "cleanText": "Exhaust any opposing Spirit that has core placed on them except via Spirit/Brave/Nexus/Magic effects",
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
        "id": "BS14-077#a1",
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
          "cleanBody": "When an opposing Spirit is exhausted, draw a card."
        },
        "clauses": [
          {
            "rawText": "When an opposing Spirit is exhausted, draw a card.",
            "cleanText": "When an opposing Spirit is exhausted, draw a card",
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
  "BS14-X06": {
    "cardNumber": "BS14-X06",
    "name": "The MalevolentDeity Nyarla-Trap",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-X06#a0",
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
          "cleanBody": "You can reveal five cards from the opposing decktop. Among them, return a card to the opposing deckbottom. Return any remaining cards to the opposing decktop in any order."
        },
        "clauses": [
          {
            "rawText": "You can reveal five cards from the opposing decktop.",
            "cleanText": "You can reveal five cards from the opposing decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DECK_OR_HAND_ACTION"
            }
          },
          {
            "rawText": "Among them, return a card to the opposing deckbottom.",
            "cleanText": "Among them, return a card to the opposing deckbottom",
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
            "rawText": "Return any remaining cards to the opposing decktop in any order.",
            "cleanText": "Return any remaining cards to the opposing decktop in any order",
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
        "id": "BS14-X06#a1",
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
          "cleanBody": "effects of opposing Spirits can't activate."
        },
        "clauses": [
          {
            "rawText": "effects of opposing Spirits can't activate.",
            "cleanText": "effects of opposing Spirits can't activate",
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
      },
      {
        "id": "BS14-X06#a2",
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
          "cleanBody": "Destroy an opposing Spirit with a cost equal or inferior to this Spirit's."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Spirit with a cost equal or inferior to this Spirit's.",
            "cleanText": "Destroy an opposing Spirit with a cost equal or inferior to this Spirit's",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-043": {
    "cardNumber": "BS14-043",
    "name": "The MoonLightPrincess Mani",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-043#a0",
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
          "cleanBody": "When the opponent uses a Red/Green/White/Blue Magic effect, by exhausting this Spirit, negate that effect."
        },
        "clauses": [
          {
            "rawText": "When the opponent uses a Red/Green/White/Blue Magic effect, by exhausting this Spirit, negate that effect.",
            "cleanText": "When the opponent uses a Red/Green/White/Blue Magic effect, by exhausting this Spirit, negate that effect",
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
      },
      {
        "id": "BS14-043#a1",
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
          "cleanBody": "At the beginning of the step, by exhausting this Spirit, target an opposing Spirit. During this turn, that Spirit can't activate its (When Attacks) and (When Brave Attacks) effects."
        },
        "clauses": [
          {
            "rawText": "At the beginning of the step, by exhausting this Spirit, target an opposing Spirit.",
            "cleanText": "At the beginning of the step, by exhausting this Spirit, target an opposing Spirit",
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
            "rawText": "During this turn, that Spirit can't activate its (When Attacks) and (When Brave Attacks) effects.",
            "cleanText": "that Spirit can't activate its (When Attacks) and (When Brave Attacks) effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": "DURING_THIS_TURN",
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
  "BS14-082": {
    "cardNumber": "BS14-082",
    "name": "The Pentagon Stronghold",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-082#a0",
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
          "cleanBody": "Your Hand is unaffected by opposing Spirit/Brave/Nexus/Magic effects."
        },
        "clauses": [
          {
            "rawText": "Your Hand is unaffected by opposing Spirit/Brave/Nexus/Magic effects.",
            "cleanText": "Your Hand is unaffected by opposing Spirit/Brave/Nexus/Magic effects",
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
        "id": "BS14-082#a1",
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
          "cleanBody": "When the opponent draws outside of Draw Step, you can draw a card."
        },
        "clauses": [
          {
            "rawText": "When the opponent draws outside of Draw Step, you can draw a card.",
            "cleanText": "When the opponent draws outside of Draw Step, you can draw a card",
            "link": null,
            "isOptional": true,
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
  "BS14-084": {
    "cardNumber": "BS14-084",
    "name": "The Permafrost Capital",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-084#a0",
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
          "cleanBody": "This Nexus card in the Trash is unaffected by any effects."
        },
        "clauses": [
          {
            "rawText": "This Nexus card in the Trash is unaffected by any effects.",
            "cleanText": "This Nexus card in the Trash is unaffected by any effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "IMMUNITY"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "BS14-084#a1",
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
          "cleanBody": "When your Life would be brought to zero, by sending this Nexus to the Trash, your Life won't become zero. Then, put a core from the Void to your Reserve."
        },
        "clauses": [
          {
            "rawText": "When your Life would be brought to zero, by sending this Nexus to the Trash, your Life won't become zero.",
            "cleanText": "When your Life would be brought to zero, by sending this Nexus to the Trash, your Life won't become zero",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "PREVENT_LIFE_LOSS"
            }
          },
          {
            "rawText": "put a core from the Void to your Reserve.",
            "cleanText": "put a core from the Void to your Reserve",
            "link": "then",
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
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-X05": {
    "cardNumber": "BS14-X05",
    "name": "The SacredBird An-Zur",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-X05#a0",
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
          "cleanBody": "You can discard a card from your decktop. If that card is an \"Imaginary Beast\" family Spirit card, refresh this Spirit."
        },
        "clauses": [
          {
            "rawText": "You can discard a card from your decktop.",
            "cleanText": "You can discard a card from your decktop",
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
          },
          {
            "rawText": "If that card is an \"Imaginary Beast\" family Spirit card, refresh this Spirit.",
            "cleanText": "refresh this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If that card is an \"Imaginary Beast\" family Spirit card",
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
        "id": "BS14-X05#a1",
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
          "cleanBody": "By discarding one of your Bursts, this Spirit remains on the Field, refreshed."
        },
        "clauses": [
          {
            "rawText": "By discarding one of your Bursts",
            "cleanText": "By discarding one of your Bursts",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          },
          {
            "rawText": "this Spirit remains on the Field, refreshed.",
            "cleanText": "this Spirit remains on the Field, refreshed",
            "link": "byDoing",
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
        "id": "BS14-X05#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "STEP_RESTRICTED",
          "timingLabel": "After Your Burst Activates",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Refresh all your \"Imaginary Beast\" family Spirits."
        },
        "clauses": [
          {
            "rawText": "Refresh all your \"Imaginary Beast\" family Spirits.",
            "cleanText": "Refresh all your \"Imaginary Beast\" family Spirits",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-081": {
    "cardNumber": "BS14-081",
    "name": "The Stumpcity of God Tree",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-081#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "You can reveal a card from your decktop. If that card is a Green Spirit card, you can summon it. If you're not summoning it, or it's some other card, return it to the decktop."
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
            "rawText": "If that card is a Green Spirit card, you can summon it.",
            "cleanText": "you can summon it",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": "If that card is a Green Spirit card",
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
            }
          },
          {
            "rawText": "If you're not summoning it, or it's some other card, return it to the decktop.",
            "cleanText": "or it's some other card, return it to the decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If you're not summoning it",
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
  "BATTLE-SPIRITS-A13017": {
    "cardNumber": "BATTLE-SPIRITS-A13017",
    "name": "The Thousand Knowledge Canyon",
    "keywords": [],
    "abilities": [
      {
        "id": "BATTLE-SPIRITS-A13017#a0",
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
          "cleanBody": "All your \"Supreme Hero\"/ \"Ancient Dragon\" family Spirit cards in your Hand gain 1 extra [Red Core] reduction."
        },
        "clauses": [
          {
            "rawText": "All your \"Supreme Hero\"/ \"Ancient Dragon\" family Spirit cards in your Hand gain 1 extra [Red Core] reduction.",
            "cleanText": "All your \"Supreme Hero\"/ \"Ancient Dragon\" family Spirit cards in your Hand gain 1 extra [Red Core] reduction",
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
        "id": "BATTLE-SPIRITS-A13017#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
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
          "cleanBody": "Increase the number of cards you draw by +1."
        },
        "clauses": [
          {
            "rawText": "Increase the number of cards you draw by +1.",
            "cleanText": "Increase the number of cards you draw by +1",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-022": {
    "cardNumber": "BS14-022",
    "name": "The TwinPhantomDragon Sheyron",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-022#a0",
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
          "cleanBody": "Send cores from all opposing Spirits to the Reserve until only 1 core is left on each of them."
        },
        "clauses": [
          {
            "rawText": "Send cores from all opposing Spirits to the Reserve until only 1 core is left on each of them.",
            "cleanText": "Send cores from all opposing Spirits to the Reserve until only 1 core is left on each of them",
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
        "id": "BS14-022#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "STEP_RESTRICTED",
          "timingLabel": "After Your Burst Activates",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Send cores from two opposing Spirits to the Reserve until only 1 core is left on each of them."
        },
        "clauses": [
          {
            "rawText": "Send cores from two opposing Spirits to the Reserve until only 1 core is left on each of them.",
            "cleanText": "Send cores from two opposing Spirits to the Reserve until only 1 core is left on each of them",
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
  "BS14-X03": {
    "cardNumber": "BS14-X03",
    "name": "The WindHero Dorcus-Ushiwaka",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is destroyed by the Opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      },
      {
        "name": "High Speed",
        "parameter": null,
        "wave": 2,
        "hook": "high_speed",
        "bracketed": true,
        "index": 190
      }
    ],
    "abilities": [
      {
        "id": "BS14-X03#a0",
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
          "cleanBody": "Exhaust two opposing Spirits. Then, if you have at least 8 cores total in your Field/Reserve/Trash, summon this Spirit card."
        },
        "clauses": [
          {
            "rawText": "Exhaust two opposing Spirits.",
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
            "rawText": "if you have at least 8 cores total in your Field/Reserve/Trash, summon this Spirit card.",
            "cleanText": "summon this Spirit card",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": "if you have at least 8 cores total in your Field/Reserve/Trash",
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
        "id": "BS14-X03#a1",
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
        "id": "BS14-X03#a2",
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
          "cleanBody": "At the end of the battle, by returning this Spirit to your Hand, during this turn, a Spirit you control gains +3000 BP."
        },
        "clauses": [
          {
            "rawText": "At the end of the battle, by returning this Spirit to your Hand, during this turn, a Spirit you control gains +3000 BP.",
            "cleanText": "At the end of the battle, by returning this Spirit to your Hand, during this turn, a Spirit you control gains +3000 BP",
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
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-060": {
    "cardNumber": "BS14-060",
    "name": "Tindalo-Hound",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-060#a0",
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
          "cleanBody": "When your Nexus is deployed, you can summon this Spirit card from the Hand, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "When your Nexus is deployed, you can summon this Spirit card from the Hand, without paying the cost.",
            "cleanText": "When your Nexus is deployed, you can summon this Spirit card from the Hand, without paying the cost",
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
        "id": "BS14-060#a1",
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
          "cleanBody": "When only the opposing Cost 3 or less Spirit is destroyed by comparing BP with your Spirit, refresh this Spirit."
        },
        "clauses": [
          {
            "rawText": "When only the opposing Cost 3 or less Spirit is destroyed by comparing BP with your Spirit, refresh this Spirit.",
            "cleanText": "When only the opposing Cost 3 or less Spirit is destroyed by comparing BP with your Spirit, refresh this Spirit",
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
  "BS14-114": {
    "cardNumber": "BS14-114",
    "name": "Thunder Burst",
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
        "id": "BS14-114#a0",
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
          "cleanBody": "Target a cost equal or inferior to 4. Destroy all opposing Spirits with the target cost. Then, by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "Target a cost equal or inferior to 4.",
            "cleanText": "Target a cost equal or inferior to 4",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COST_MODIFIER"
            }
          },
          {
            "rawText": "Destroy all opposing Spirits with the target cost.",
            "cleanText": "Destroy all opposing Spirits with the target cost",
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
        "id": "BS14-114#a1",
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
          "cleanBody": "Destroy an opposing Cost 5 or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Cost 5 or less Spirit.",
            "cleanText": "Destroy an opposing Cost 5 or less Spirit",
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
                  "costLte": 5
                }
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
  "BS14-071": {
    "cardNumber": "BS14-071",
    "name": "Trumpn",
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
        "id": "BS14-071#a0",
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
        "id": "BS14-071#a1",
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
          "timing": "WHEN_DESTROYED",
          "timingLabel": "When destroyed by an opposing Spirit effect",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "this Spirit remains on the Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "this Spirit remains on the Field, exhausted.",
            "cleanText": "this Spirit remains on the Field, exhausted",
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
  "BS14-095": {
    "cardNumber": "BS14-095",
    "name": "Violet Funeral",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is Destroyed by the Opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-095#a0",
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
          "cleanBody": "By sending three cores from any of your Spirits to your Trash, the opponent send three cores from any of their Spirits to their Trash. Then by paying the cost, activate this card's Flash effect."
        },
        "clauses": [
          {
            "rawText": "By sending three cores from any of your Spirits to your Trash",
            "cleanText": "By sending three cores from any of your Spirits to your Trash",
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
            "rawText": "the opponent send three cores from any of their Spirits to their Trash.",
            "cleanText": "the opponent send three cores from any of their Spirits to their Trash",
            "link": "byDoing",
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
            "rawText": "Then by paying the cost, activate this card's Flash effect.",
            "cleanText": "Then by paying the cost, activate this card's Flash effect",
            "link": null,
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
        "id": "BS14-095#a1",
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
          "cleanBody": "Send all cores from one opposing Nexus to their Trash."
        },
        "clauses": [
          {
            "rawText": "Send all cores from one opposing Nexus to their Trash.",
            "cleanText": "Send all cores from one opposing Nexus to their Trash",
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
  "BS14-050": {
    "cardNumber": "BS14-050",
    "name": "Yaley",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS14-032": {
    "cardNumber": "BS14-032",
    "name": "Yatsunokanzo",
    "keywords": [
      {
        "name": "Windstorm",
        "parameter": null,
        "wave": 1,
        "hook": "windstorm",
        "bracketed": true,
        "index": 158
      },
      {
        "name": "Windstorm",
        "parameter": null,
        "wave": 1,
        "hook": "windstorm",
        "bracketed": true,
        "index": 286
      }
    ],
    "abilities": [
      {
        "id": "BS14-032#a0",
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
        "id": "BS14-032#a1",
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
          "cleanBody": "Give all your Spirits with [Windstorm]: \"(When Attacks) When this Spirit is destroyed, return to the Hand every opposing Spirit exhausted by this Spirit's [Windstorm].\""
        },
        "clauses": [
          {
            "rawText": "Give all your Spirits with [Windstorm]: \"(When Attacks) When this Spirit is destroyed, return to the Hand every opposing Spirit exhausted by this Spirit's [Windstorm].\"",
            "cleanText": "Give all your Spirits with [Windstorm]: \"(When Attacks) When this Spirit is destroyed, return to the Hand every opposing Spirit exhausted by this Spirit's [Windstorm].\"",
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
  "BS14-061": {
    "cardNumber": "BS14-061",
    "name": "Yagyurd-Jubei",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Spirit is Destroyed by the Opponent",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "BS14-061#a0",
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
          "cleanBody": "If a Blue Spirit is destroyed when this Burst activates, summon this Spirit card."
        },
        "clauses": [
          {
            "rawText": "If a Blue Spirit is destroyed when this Burst activates, summon this Spirit card.",
            "cleanText": "summon this Spirit card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If a Blue Spirit is destroyed when this Burst activates",
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
        "id": "BS14-061#a1",
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
          "cleanBody": "All your \"Supreme Hero\" family Spirits are treated as being on their highest levels."
        },
        "clauses": [
          {
            "rawText": "All your \"Supreme Hero\" family Spirits are treated as being on their highest levels.",
            "cleanText": "All your \"Supreme Hero\" family Spirits are treated as being on their highest levels",
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
  "BS14-021": {
    "cardNumber": "BS14-021",
    "name": "The VioletPhoenix Fognix",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-021#a0",
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
          "cleanBody": "Immortality: Cost 4/5 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed."
        },
        "clauses": [
          {
            "rawText": "Immortality: Cost 4/5 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed.",
            "cleanText": "Immortality: Cost 4/5 (Either Attack Step) - This Spirit card in your Trash can be summoned when your Cost 4/5 Spirit is destroyed",
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
        "id": "BS14-021#a1",
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
          "cleanBody": "Draw from your deck the same amount of cards as this Spirit's level."
        },
        "clauses": [
          {
            "rawText": "Draw from your deck the same amount of cards as this Spirit's level.",
            "cleanText": "Draw from your deck the same amount of cards as this Spirit's level",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "BS14-029": {
    "cardNumber": "BS14-029",
    "name": "Musha-Geo",
    "isVanilla": true,
    "isFullySupported": true,
    "compiledClausesCount": 0,
    "unsupportedClausesCount": 0,
    "abilities": [],
    "keywords": []
  },
  "BS14-052": {
    "cardNumber": "BS14-052",
    "name": "Tamamonoin",
    "keywords": [],
    "abilities": [
      {
        "id": "BS14-052#a0",
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
          "cleanBody": "Holy Life (When Attacks) When the opposing life is decreased by this Spirit's Attack, put one core from the Void to your Life."
        },
        "clauses": [
          {
            "rawText": "Holy Life (When Attacks) When the opposing life is decreased by this Spirit's Attack, put one core from the Void to your Life.",
            "cleanText": "Holy Life (When Attacks) When the opposing life is decreased by this Spirit's Attack, put one core from the Void to your Life",
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
        "id": "BS14-052#a1",
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
          "cleanBody": "All your Spirits with Holy Life cannot be blocked by opposing Lv1 Spirits."
        },
        "clauses": [
          {
            "rawText": "All your Spirits with Holy Life cannot be blocked by opposing Lv1 Spirits.",
            "cleanText": "All your Spirits with Holy Life cannot be blocked by opposing Lv1 Spirits",
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
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  }
};
