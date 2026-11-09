/**
 * engine/cards/sets/bs37_cards.js
 *
 * God King Saga (十二神皇編 / Double Drive Era) — Deterministic Two-Tier Per-Card Handlers for Booster 37 (God King Chapter 3)
 * Total Cards: 87
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const BS37_SAGA_CARDS = [
  {
    "cardNumber": "BATTLE-SPIRITS-A10035",
    "name": "The Fourth's DinosaurMachine Deinonych-Walker",
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
    "cardNumber": "BATTLE-SPIRITS-A10289",
    "name": "The GiantPrince Bharata",
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
    "cardNumber": "BATTLE-SPIRITS-A10290",
    "name": "The GiantPrince Lakshmana",
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
    "cardNumber": "BATTLE-SPIRITS-A10301",
    "name": "The GiantPrince Rama",
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
    "cardNumber": "BATTLE-SPIRITS-A10303",
    "name": "The GiantPrincess Sita",
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
    "cardNumber": "BATTLE-SPIRITS-A10385",
    "name": "The GourmetFairy Rosette",
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
    "cardNumber": "BATTLE-SPIRITS-A11219",
    "name": "The LionDeathDragonKing Richard the First",
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
    "cardNumber": "BATTLE-SPIRITS-A11541",
    "name": "The Ninth's FireMonkey Neela",
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
    "cardNumber": "BATTLE-SPIRITS-A11543",
    "name": "The NinthBeast Acceledge",
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
    "cardNumber": "BATTLE-SPIRITS-A11802",
    "name": "The PreserverGod Vishten",
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
    "cardNumber": "BATTLE-SPIRITS-A12037",
    "name": "The SakraGeneral Indra",
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
    "cardNumber": "BATTLE-SPIRITS-A12168",
    "name": "The SecondKnight Harpe-Gornis",
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
    "cardNumber": "BATTLE-SPIRITS-A12251",
    "name": "The Seventh's AccelDragon Turbulence",
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
    "cardNumber": "BATTLE-SPIRITS-A12270",
    "name": "The Seventh's MonkeyPrince Angada",
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
    "cardNumber": "BATTLE-SPIRITS-A12344",
    "name": "The SixHellsSorcerer Shamiram",
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
    "cardNumber": "BATTLE-SPIRITS-A12442",
    "name": "The SixthArtifactBeastman Solid-Falco",
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
    "cardNumber": "BATTLE-SPIRITS-A12448",
    "name": "The SixthArtifact Sheperdoll",
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
    "cardNumber": "BATTLE-SPIRITS-A13124",
    "name": "The TigerTwelveGodKing Revol-Tiger",
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
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A13483",
    "name": "The WarOgre Murciela",
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
    "cardNumber": "BATTLE-SPIRITS-A14342",
    "name": "Warthog Kong",
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
    "cardNumber": "BATTLE-SPIRITS-A14407",
    "name": "Wheely-Coyote",
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
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4231",
    "name": "Evil Dragon Demon-God",
    "cardType": "Brave",
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
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A4928",
    "name": "Hyllus Beetle",
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
    "cardNumber": "BATTLE-SPIRITS-A6725",
    "name": "Monkey Demon-God",
    "cardType": "Brave",
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
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A7297",
    "name": "Racing Pentan",
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
    "cardNumber": "BATTLE-SPIRITS-A7482",
    "name": "Roadrunner",
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
    "cardNumber": "BATTLE-SPIRITS-A7876",
    "name": "Slothing",
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
    "cardNumber": "BATTLE-SPIRITS-A8263",
    "name": "The AccelHero Gale-Green",
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
    "cardNumber": "BATTLE-SPIRITS-A8293",
    "name": "The AccelHero Yellow-Merlin",
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
    "cardNumber": "BATTLE-SPIRITS-A8297",
    "name": "The AccelTenthBird AirEraser",
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
    "cardNumber": "BATTLE-SPIRITS-A8612",
    "name": "The AzureHornetEmperor Cuckoo-Ace",
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
    "cardNumber": "BATTLE-SPIRITS-A8706",
    "name": "The Beeman Cuckoo-B",
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
    "cardNumber": "BATTLE-SPIRITS-A8753",
    "name": "The BlackNinthBeast BloodySaber",
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
    "cardNumber": "BATTLE-SPIRITS-A8779",
    "name": "The BirdGiant Jatayu",
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
    "cardNumber": "BATTLE-SPIRITS-A896",
    "name": "The Sixth's ExplosiveBeast Armor Rhider",
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
    "cardNumber": "BATTLE-SPIRITS-A9409",
    "name": "The DinosaurEighthArtifact Turborex",
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
    "cardNumber": "BATTLE-SPIRITS-A9412",
    "name": "The DinosaurMachine Brachiox",
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
    "cardNumber": "BATTLE-SPIRITS-A9415",
    "name": "The DinosaurMachine Tricera-Vehicle",
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
            "op": "REFRESH_SELF"
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A9894",
    "name": "The First's MonkeyKing Sugriva",
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
      }
    ]
  },
  {
    "cardNumber": "BS37-001",
    "name": "Civet Drone",
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
    "cardNumber": "BS37-001-A8290",
    "name": "The AccelHero Revol-Red",
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
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-002",
    "name": "The TyrantDragonKing Nero-Dragdius",
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
    "cardNumber": "BS37-003",
    "name": "The FirstArmoredBeast Cannon-Puma",
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
            "op": "DRAW",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-004",
    "name": "Spinos Legger",
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
    "cardNumber": "BS37-006",
    "name": "The AzureThunderbolt Keravnos",
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-006-A9984",
    "name": "The FlyingFirstArmoredDragon Steelhorn Dragon",
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
    "cardNumber": "BS37-007",
    "name": "The BeamBeast Laser-Leon",
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
    "cardNumber": "BS37-008",
    "name": "The ThirdBeast Blast Tiger",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS37-010",
    "name": "The SeventhBeast Golden-Accel-Tiger",
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
      }
    ]
  },
  {
    "cardNumber": "BS37-011",
    "name": "Yabusame-Dragon",
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
    "cardNumber": "BS37-013",
    "name": "Crusader Dragon",
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
    "cardNumber": "BS37-013-A4033",
    "name": "Epigaulus",
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
    "cardNumber": "BS37-014",
    "name": "Mist Bat",
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
    "cardNumber": "BS37-015",
    "name": "The BeautifulOgre Ara",
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
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-017",
    "name": "The Fifth's FourDragonHorsemen Black Rider",
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
    "cardNumber": "BS37-018",
    "name": "The WarOgre Nosorog",
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
    "cardNumber": "BS37-019",
    "name": "Mist Wyvern",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS37-020",
    "name": "Crusader Generous",
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
    "cardNumber": "BS37-021",
    "name": "The CrossRiderDragon Crusades",
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
    "cardNumber": "BS37-024",
    "name": "Chat Runner",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS37-024-A9866",
    "name": "The Fifth's WaterMonkey Susena",
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
    "cardNumber": "BS37-025",
    "name": "The Beeman Haraaka-B",
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
    "cardNumber": "BS37-029",
    "name": "The StylishNinja Burberry Hopper",
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
      }
    ]
  },
  {
    "cardNumber": "BS37-031",
    "name": "The EighthKnight Redtail Knight",
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
    "cardNumber": "BS37-032",
    "name": "The FourthKnight Heavyquick",
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
    "cardNumber": "BS37-033",
    "name": "The CleverMachineMusha E-Naomasa",
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
    "cardNumber": "BS37-034",
    "name": "The TenthBird Migratory Alba",
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
    "cardNumber": "BS37-036",
    "name": "Cynognathus",
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
    "cardNumber": "BS37-038",
    "name": "The TenthArtifactBeast Grosso-Teriuman",
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
    "cardNumber": "BS37-042",
    "name": "The SixthArtifactBeastman Blockade-Tiger",
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
    "cardNumber": "BS37-046",
    "name": "The GourmetFairy Amandine",
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
    "cardNumber": "BS37-047",
    "name": "Glorious-Sheep -Android Mode-",
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
    "cardNumber": "BS37-048",
    "name": "The WhiteMonkey Salabha",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS37-052",
    "name": "The Fruitsel Blueblueberry",
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
    "cardNumber": "BS37-055",
    "name": "The MonkeyWizard Onkot",
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
    "cardNumber": "BS37-057",
    "name": "Frankenman",
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
    "cardNumber": "BS37-058",
    "name": "The Fruitsel Papaiyan",
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
    "cardNumber": "BS37-061",
    "name": "The GiantPrince Shatrugna",
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
    "cardNumber": "BS37-063",
    "name": "The Gigantic Thride-Gelm",
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
            "op": "BP_BUFF_SELF",
            "amount": 3000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-067",
    "name": "Elephant-Gear",
    "cardType": "Spirit",
    "isVanilla": true,
    "abilities": []
  },
  {
    "cardNumber": "BS37-068",
    "name": "The Eighth's StrangeBeast Black Pantherzan",
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
    "cardNumber": "BS37-072",
    "name": "Bear Demon-God",
    "cardType": "Brave",
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
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-074",
    "name": "Kabuto Demon-God",
    "cardType": "Brave",
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
            "op": "DRAW",
            "amount": 1
          }
        ]
      },
      {
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-075",
    "name": "Headbutt Demon-God",
    "cardType": "Brave",
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
        "overall": "WHEN_BRAVED",
        "subConditions": {
          "requireBraved": true
        },
        "subEffects": [
          {
            "op": "BP_BUFF_SELF",
            "amount": 5000
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-X05",
    "name": "The MonkeyTwelveGodKing Hanumerlin",
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
            "op": "BP_BUFF_SELF",
            "amount": 5000
          },
          {
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
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
            "op": "CHARGE_CORE_VOID_TO_RESERVE",
            "amount": 1
          }
        ]
      }
    ]
  },
  {
    "cardNumber": "BS37-XX01",
    "name": "The RedOriginDragon Amaterasu",
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
    "cardNumber": "BS37-XX02",
    "name": "The PurpleOriginDragon Is-Baram",
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

for (const spec of BS37_SAGA_CARDS) {
  SagaConditionDSL.registerSagaCard(spec);
}
