/**
 * engine/cards/sets/bs25_cards.js
 *
 * Ultimate Saga — Deterministic Two-Tier Per-Card Handlers for Booster 25 (Ultimate Battle 02)
 * Total Cards: 84
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS25_SAGA_CARDS = [
  {
    "cardNumber": "BS25-001",
    "name": "Debris-Zard",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-003",
    "name": "The Survivor Neo-Arc",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-004",
    "name": "Ryuuman-Tiger",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-005",
    "name": "Dark Matter Dragon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-006",
    "name": "Ryuuman-Lightning",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-007",
    "name": "The BurstFireElephant Maximus",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-008",
    "name": "The DinosaurAircraftCarrier Apato",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-009",
    "name": "The LeonKnight Arocain",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-010",
    "name": "Bone-Sabretiger",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-011",
    "name": "The Survivor Vassago",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-012",
    "name": "Rune Master Naga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-013",
    "name": "The EvilMarquis Focalor",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-014",
    "name": "The ChevalLancer Eligale",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          },
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-015",
    "name": "The EvilBull Morax",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-016",
    "name": "Darkwurm-Nova-Remnant",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-017",
    "name": "The Hellwitch Aini",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          },
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-018",
    "name": "Hakubisword",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-019",
    "name": "SaberSeseri",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-020",
    "name": "The Survivor Fugue",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-021",
    "name": "Rikaospada",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-022",
    "name": "Lucky Cat",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-023",
    "name": "Night Ibis",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-024",
    "name": "Dandolion",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-025",
    "name": "The BladeEmperorInsect GrandeKuwaga",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-028",
    "name": "The Survivor Ullr-Defender",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-029",
    "name": "Star Drian",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-031",
    "name": "Sunstone-Dragoon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-033",
    "name": "The FatePrincessDeity Verthandi",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-034",
    "name": "Hisui-Cannon-Dragon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-035",
    "name": "The Angelia Wizel",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-036",
    "name": "Ceryneiar",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-037",
    "name": "The SurvivorAngelia Mael",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-038",
    "name": "The Investigator Asia",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-039",
    "name": "Calydon",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-040",
    "name": "The Diva Raquel",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-041",
    "name": "The AngeliaDaughter Asahel",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-042",
    "name": "The Paladin Pentan",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-043",
    "name": "Mechanic-Corgi",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-044",
    "name": "Gecko-Golem",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-045",
    "name": "The ApprenticePirate Terry",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-046",
    "name": "The Survivor Buddy",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-047",
    "name": "The GiantSwordsman Archbold",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          },
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-049",
    "name": "The GiantMusketeer Clifford",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-051",
    "name": "The GiantDeity Junius",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-052",
    "name": "Ultimate-Siegwurm",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-053",
    "name": "Ultimate-Ex-Calibus",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-054",
    "name": "Ultimate-Baculus",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-055",
    "name": "Ultimate-Berith",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      },
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-056",
    "name": "Ultimate-Caracalossom",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-057",
    "name": "Ultimate-Amenborg",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-058",
    "name": "Ultimate-Monokerock",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-059",
    "name": "Ultimate-Yggdrasill",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-060",
    "name": "Ultimate-Salaty",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-061",
    "name": "Ultimate-Cu-Sith",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-062",
    "name": "Ultimate-Galadolg",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-063",
    "name": "Ultimate-Lowen",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            3,
            4
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxCost": 5
            }
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-064",
    "name": "The Planet Celtic Cross",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-065",
    "name": "The Dark Capital Antenora",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-066",
    "name": "The Fruit of Emerald Agrimony",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-067",
    "name": "The Armored City Shieldonia",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-068",
    "name": "The Armored Dragons' Hunting Ground",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-069",
    "name": "The Golden Wings of Pipe Organ",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-070",
    "name": "The Three Headed Dragon Pirate Flag",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-071",
    "name": "The Rare Metal Mine",
    "cardType": "Nexus",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-072",
    "name": "Neo-Aggressive Rage",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-073",
    "name": "Neo-Call of Lost",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-074",
    "name": "Brave Cremation",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-076",
    "name": "Wind Circle",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_DESTROYED",
        "subConditions": {
          "levels": [
            1,
            2,
            3
          ]
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "BURST",
        "subConditions": {
          "burstTiming": "AFTER_LIFE_REDUCED"
        },
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-077",
    "name": "Binding Scale",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-078",
    "name": "White Crack",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-081",
    "name": "Golden Counter",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-082",
    "name": "Support Flag",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "MAIN",
        "subConditions": {},
        "subEffects": [
          {
            "op": "DRAW",
            "amount": 2
          }
        ]
      },
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-083",
    "name": "Random Bomb",
    "cardType": "Magic",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "FLASH",
        "subConditions": {},
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X01",
    "name": "The ArmoredDragonBattleship Enterprise",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "DESTROY_OPPOSING_SPIRIT",
            "filter": {
              "maxBp": 6000
            }
          },
          {
            "op": "REFRESH_SELF"
          }
        ]
      },
      {
        "overall": "WHEN_BLOCKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 4000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X02",
    "name": "The OceanEmperorGiantDeity Duran-Kidd",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X03",
    "name": "Ultimate-Gai-Asura",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X04",
    "name": "Ultimate-Beelzebeat",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X05",
    "name": "Ultimate-Byak-Garo",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X06",
    "name": "Ultimate-Grand-Woden",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X07",
    "name": "Ultimate-Isfiel",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS25-X08",
    "name": "Ultimate-Orichalcum-Golem",
    "cardType": "Ultimate",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_ATTACKS",
        "subConditions": {
          "levels": [
            3,
            4,
            5
          ]
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS26-041",
    "name": "The ViceCaptain Chester",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "AURA_BP",
        "subConditions": {
          "levels": [
            1,
            2
          ],
          "turn": "YOUR"
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 1000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "CP14-X04",
    "name": "The LittleDevil David",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "CP14-X05",
    "name": "The LittlePhoenix Nix",
    "cardType": "Spirit",
    "isVanilla": false,
    "abilities": [
      {
        "overall": "WHEN_SUMMONED",
        "subConditions": {
          "levels": [
            1,
            2
          ]
        },
        "subEffects": [
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  }
];

for (const spec of BS25_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
