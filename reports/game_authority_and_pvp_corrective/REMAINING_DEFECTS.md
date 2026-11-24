# REMAINING DEFECTS & DEPLOYMENT NOTES

1. **Browser `engine_adapter.js` ESM Load:**
   - `arena.html` includes `<script type="module" src="./engine_adapter.js?v=8.0"></script>`, which transitively imports Node built-ins (`node:crypto`, `node:util`) via `engine/rules/eternal.js`, `engine/session_mode.js`, and `engine/restrictions.js`. Browser execution of compiled card DSL continues to run through `engine/cards/bundle.js` (`window.SagaConditionDSL`) and `battle_arena.js`; making `engine_adapter.js` directly runnable in browsers requires isomorphic replacements for those Node built-ins.
2. **Legacy Full `npm test` Runner Note:**
   - `package.json`'s `npm test` runs `node --test` without `--test-force-exit` and includes pre-existing Phase 13–20 `100% Zero-Unsupported Gate` assertions that fail on uncompiled promo/modern cards.
3. **Multi-Instance Deployment:**
   - Shared SQLite matchmaking (`matchmaking_tickets` in `SessionStore`) works across multiple Node.js processes sharing the same writable filesystem / `DB_PATH` (WAL mode). Horizontally scaled deployments across separate hosts without a shared filesystem would require an external store (e.g., Redis/Postgres) behind the same `Matchmaker` interface.
