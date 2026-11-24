# PHASE M4 — CANONICAL PHYSICAL ZONE CONTRACT

## 1. Canonical Physical Zones (`CANONICAL_ZONES`)

Defined and exported in [engine/selectors.js](file:///c:/Users/namis/Downloads/BSP/engine/selectors.js):

| Canonical Zone | Physical Container (`state.players[side]`) | Deterministic Aliases Normalized via `normalizeCardZone()` |
| :--- | :--- | :--- |
| `deck` | `p.deck` | `deck`, `deck_top`, `deck_bottom`, `decktop`, `deckbottom` |
| `hand` | `p.hand` | `hand` |
| `field` | `p.field` (stacks) | `field`, `battlefield`, `arena` |
| `nexus` | `p.nexus` / Nexus stacks | `nexus` |
| `grave` | `p.grave` | `grave`, `trash`, `graveyard` |
| `removed` | `p.removed` / `p.openCards` | `removed`, `open`, `open_zone`, `opencards`, `removed_zone`, `removed_from_game`, `banished` |
| `revealed` | `p.revealed` | `revealed`, `revealedcards` |
| `burst` | `p.burst` | `burst` |
| `mirage` | `p.mirage` | `mirage` |
| `under` | `stack.under` | `under`, `underneath`, `pre_advent`, `preadvent` |
| `braves` | `stack.braves` | `braves`, `brave` |

## 2. Candidate Identity Descriptor (`buildCandidateDescriptor()`)

Every candidate emitted by `queryCandidates()`, `SALVAGE`, `ADD_TO_HAND`, and `DISCARD_HAND` carries:
- `candidateId`: `${side}:${zone}:${stackId || ''}:${cardId}`
- `cardId`: Exact card instance ID (`card.id`)
- `cardNumber`: Canonical card number (`BS44-012`, etc.)
- `cardType`: Printed card type (`Spirit`, `Ultimate`, `Magic`, `Nexus`, `Brave`, etc.)
- `side`: Physical side (`'player'` or `'opponent'`) — strictly separated from `owner`
- `zone`: Canonical physical zone
- `stackId`: Parent stack ID when applicable (`null` otherwise)
- `owner`: Original card owner metadata
- `controller`: Current physical controller (`stack.owner || side`)

## 3. Non-Negotiable Isolation Rules

1. Aliases never broaden one zone into another (`deck` cards never qualify for `hand`, `grave`, or `field`).
2. `owner` metadata never overrides physical `side`.
3. `opponent` hand enumeration is blocked unless `selector.allowOpponentHand` or `selector.opponentHand` is explicitly enabled (`filters.hand` no longer bypasses this guard).
4. `validateTargetAvailability(state, target, expectedZone, expectedSide)` enforces exact physical zone, exact physical side, and rejects any duplicate instance occurring across incompatible zones.
