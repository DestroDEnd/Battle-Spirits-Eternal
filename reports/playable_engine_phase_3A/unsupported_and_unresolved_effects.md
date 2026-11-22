# Unsupported and Unresolved Effects Audit

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 3A  
**Date:** 2026-11-21  

---

## 1. Executive Summary

This report documents all opcodes, variants, and clauses currently classified as `UNRESOLVED` or lacking dedicated execution handlers in `engine/ops/`.

Of the 288 unique opcodes compiled across the 51,734 clauses:
- **Registered Handlers in Engine:** 298 opcodes possess active handlers or dispatch routines.
- **Unresolved Opcodes:** 0 opcodes represent specialized or compound effects without direct dispatch mappings.

---

## 2. Granular Unresolved Opcode Table

| Opcode | Affected Clauses | Gameplay Domain | Recommended Implementation Tier |
|---|---|---|---|

