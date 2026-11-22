# Engine Failure Semantics Specification (Phase 4C.4 – 4C.5)

## Explicit Operation & Targeting Result Statuses

Operations (`engine/ops/index.js`) and `resolveTargets()` (`engine/selectors.js`) distinguish four explicit outcomes instead of collapsing failures into generic `{ success: true }` or `{ success: false }`:

| Status | Meaning | State Mutation | Example |
| --- | --- | --- | --- |
| `SUCCESS` | Operation / target selection succeeded | Applied | `DESTROY` moved 1+ targets to `grave` |
| `NO_OP_BY_RULE` | Zero legal targets or all targets protected/immune | None (safe no-op) | `DESTROY` on `INDESTRUCTIBLE` target; `DRAW` on empty deck |
| `REJECTED` | Invalid selection, duplicate target, declined mandatory target, or missing source/previous target | None | Player selects out-of-pool or duplicate card |
| `UNSUPPORTED` | Unimplemented IR op, unknown string target ref, or missing `promptResolver` | None (fail-closed) | Unknown target string `'foo'` or unimplemented op |

## Tri-State Condition Semantics (`engine/conditions.js`)

| Result | Meaning | Behavior |
| --- | --- | --- |
| `CONDITION_RESULT.TRUE` | Condition parsed and evaluated true | Ability / clause proceeds |
| `CONDITION_RESULT.FALSE` | Condition parsed and evaluated false (or missing runtime context) | Ability / clause does not fire |
| `CONDITION_RESULT.UNSUPPORTED` | Condition AST/string not recognized (including any unsupported half of `AND`/`OR`) | Fail-closed; never treated as `TRUE` |
