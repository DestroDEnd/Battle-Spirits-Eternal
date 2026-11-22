/**
 * compiler/identity.js
 * 
 * Deterministic Physical and Semantic Ability Identity Engine for Battle Spirits Eternal.
 * 
 * Phase 4C.3.2.1 Final Corrective Pass:
 * 1. Strict RFC 8785 JSON Canonicalization Scheme (JCS) Conformance:
 *    - Rejection of symbol-keyed properties (Object.getOwnPropertySymbols)
 *    - Rejection of non-plain objects (Date, Map, Set, TypedArray, class instances)
 *    - Circular reference cycle detection in nested objects and arrays
 *    - Rejection of undefined, functions, symbols, BigInt (no silent omissions or conversions)
 *    - Rejection of non-finite numbers (NaN, Infinity, -Infinity)
 *    - Negative zero (-0) serialized as '0'
 *    - Rejection of sparse arrays with holes or undefined elements
 *    - Strict Unicode validation: rejection of lone UTF-16 surrogates
 *    - Preservation of valid supplementary characters, Japanese characters, and emoji
 * 2. Semantic Identity for Compiled Operations:
 *    - Structured operation AST is the authoritative semantic representation
 *    - Cosmetic prose (cleanText) omitted when valid structured op exists
 *    - Unparsed/unsupported clauses preserve normalized text as explicit textFallback
 *    - Partially compiled clauses preserve both op and unparsedRemainder
 * 3. Documented Condition Descriptor Normalization:
 *    - Condition blocks explicitly labeled as CONDITION_TEXT_FALLBACK
 *    - Conservative whitespace/bracket normalization preserving all punctuation, operators, and thresholds
 * 4. Stable Instance-Level Physical Identity:
 *    - Scoped instance index (_inst2) for identical abilities on same canonical card
 *    - Semantic identity preserves cross-card / reprint behavioral equivalence
 * 5. Atomic Collision Registry with Snapshot & Rollback:
 *    - Exact canonical descriptor verification on ID match
 *    - FatalCollisionError on mismatch; zero registration-order suffixes
 *    - Atomic rollback ensuring failed compilations leave zero stale registry state
 */

import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// 1. Strict RFC 8785 JSON Canonicalization Scheme (JCS)
// ---------------------------------------------------------------------------

/**
 * Deterministic, locale-independent UTF-16 code-unit string comparator.
 * Conforms strictly to ECMAScript standard code-unit ordering (RFC 8785 section 3.2.3 key ordering rule).
 * Completely independent of OS locale, environment locale, and ICU collation tables.
 * 
 * @param {unknown} strA
 * @param {unknown} strB
 * @returns {number} Negative if strA < strB, positive if strA > strB, 0 if equal
 */
export function compareUtf16CodeUnits(strA, strB) {
  const a = String(strA ?? '');
  const b = String(strB ?? '');
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    const codeA = a.charCodeAt(i);
    const codeB = b.charCodeAt(i);
    if (codeA !== codeB) {
      return codeA - codeB;
    }
  }
  return a.length - b.length;
}

/**
 * Tests whether a property key is a valid canonical array index within actual array length.
 * In ECMAScript, an array index is a 32-bit unsigned integer whose canonical decimal
 * string representation has no leading zeros (except '0' itself) and is strictly less than length.
 * 
 * @param {string|symbol} key
 * @param {number} length
 * @returns {boolean}
 */
export function isValidArrayIndexKey(key, length) {
  if (typeof key !== 'string') {
    return false;
  }
  if (!/^(?:0|[1-9]\d*)$/.test(key)) {
    return false;
  }
  const index = Number(key);
  return Number.isSafeInteger(index) && index >= 0 && index < length && String(index) === key;
}

/**
 * Validates that an array strictly conforms to dense, plain array semantics:
 * - Rejects all symbol-keyed own properties (Object.getOwnPropertySymbols / Reflect.ownKeys).
 * - Rejects unexpected string own properties (only 'length' and canonical indices '0'..'length-1' are permitted).
 * - Rejects accessors (getters/setters) on 'length' or any array index prior to element reading.
 * - Rejects sparse arrays (unassigned holes).
 * 
 * @param {Array<unknown>} arr
 * @param {string} [contextLabel='RFC 8785'] Context description for error reporting
 */
export function validateArrayOwnProperties(arr, contextLabel = 'RFC 8785') {
  // 1. Inspect all own property keys (string and symbol, enumerable and non-enumerable)
  const ownKeys = Reflect.ownKeys(arr);

  // Check for symbol-keyed properties
  for (const key of ownKeys) {
    if (typeof key === 'symbol') {
      throw new TypeError(`${contextLabel}: Array contains unexpected symbol-keyed own property '${String(key)}'`);
    }
  }

  const len = arr.length;
  if (typeof len !== 'number' || !Number.isInteger(len) || len < 0) {
    throw new TypeError(`${contextLabel}: Invalid array length`);
  }

  // Check own keys: permit ONLY 'length' and valid canonical array indices within actual length
  for (const key of ownKeys) {
    if (key === 'length') {
      const desc = Object.getOwnPropertyDescriptor(arr, 'length');
      if (desc && (desc.get || desc.set)) {
        throw new TypeError(`${contextLabel}: Array 'length' property cannot be an accessor`);
      }
      continue;
    }

    if (!isValidArrayIndexKey(key, len)) {
      throw new TypeError(`${contextLabel}: Array contains unexpected own property '${key}'`);
    }

    const desc = Object.getOwnPropertyDescriptor(arr, key);
    if (desc && (desc.get || desc.set)) {
      throw new TypeError(`${contextLabel}: Array element at index ${key} cannot be an accessor`);
    }
  }

  // Check for sparse array holes (every index 0..len-1 must exist as own property)
  for (let i = 0; i < len; i++) {
    if (!Object.prototype.hasOwnProperty.call(arr, i)) {
      throw new TypeError(`${contextLabel}: Sparse array contains unassigned element at index ${i}`);
    }
  }
}

/**
 * Serializes any JavaScript value to a deterministic UTF-8 string according to RFC 8785.
 * 
 * Key requirements:
 * - Reject undefined, Function, Symbol, BigInt (no silent omission or conversion)
 * - Reject symbol-keyed properties and non-plain objects (Date, Map, Set, TypedArray, etc.)
 * - Reject unexpected array properties (symbols, named properties, non-index keys, accessors)
 * - Reject circular references
 * - Object keys sorted strictly by UTF-16 code unit values
 * - Strict number serialization (finite only, -0 serialized as 0)
 * - Minimal string escaping (only ", \, and U+0000..U+001F as \u00xx)
 * - Array order strictly preserved; sparse arrays rejected
 * - Strict Unicode validation (reject lone high/low surrogates)
 * 
 * @param {unknown} val
 * @param {Set<object>} [seen] Recursion cycle tracker
 * @returns {string}
 */
export function canonicalizeRFC8785(val, seen = new Set()) {
  if (val === undefined) {
    throw new TypeError('RFC 8785: undefined is not valid JSON data');
  }
  if (typeof val === 'symbol') {
    throw new TypeError('RFC 8785: Symbols are not supported in JSON');
  }
  if (typeof val === 'function') {
    throw new TypeError('RFC 8785: Functions are not supported in JSON');
  }
  if (typeof val === 'bigint') {
    throw new TypeError('RFC 8785: BigInt is not supported in JSON');
  }
  if (val === null) {
    return 'null';
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      throw new TypeError(`RFC 8785: Numbers must be finite; received ${val}`);
    }
    if (Object.is(val, -0)) {
      return '0';
    }
    return val.toString();
  }
  if (typeof val === 'string') {
    return serializeRFC8785String(val);
  }
  if (Array.isArray(val)) {
    validateArrayOwnProperties(val, 'RFC 8785');
    if (seen.has(val)) {
      throw new TypeError('RFC 8785: Circular reference detected in array');
    }
    seen.add(val);

    const items = [];
    for (let i = 0; i < val.length; i++) {
      const item = val[i];
      if (item === undefined || typeof item === 'symbol' || typeof item === 'function' || typeof item === 'bigint') {
        seen.delete(val);
        throw new TypeError(`RFC 8785: Array contains unsupported data type '${typeof item}' at index ${i}`);
      }
      items.push(canonicalizeRFC8785(item, seen));
    }
    seen.delete(val);
    return '[' + items.join(',') + ']';
  }
  if (typeof val === 'object') {
    // Check for symbol-keyed properties
    const symbolKeys = Object.getOwnPropertySymbols(val);
    if (symbolKeys.length > 0) {
      throw new TypeError('RFC 8785: Symbol-keyed properties are not supported in JSON objects');
    }

    // Check plain object: prototype must be Object.prototype or null
    const proto = Object.getPrototypeOf(val);
    if (proto !== Object.prototype && proto !== null) {
      throw new TypeError(`RFC 8785: Unsupported non-plain object type '${Object.prototype.toString.call(val)}'`);
    }

    // Check circular references
    if (seen.has(val)) {
      throw new TypeError('RFC 8785: Circular reference detected in object');
    }
    seen.add(val);

    // Sort keys strictly by UTF-16 code units
    const keys = Object.keys(val).sort(compareUtf16CodeUnits);

    const entries = [];
    for (const key of keys) {
      const v = val[key];
      if (v === undefined || typeof v === 'symbol' || typeof v === 'function' || typeof v === 'bigint') {
        seen.delete(val);
        throw new TypeError(`RFC 8785: Object property '${key}' has unsupported type '${typeof v}'`);
      }
      entries.push(serializeRFC8785String(key) + ':' + canonicalizeRFC8785(v, seen));
    }
    seen.delete(val);
    return '{' + entries.join(',') + '}';
  }

  throw new TypeError(`RFC 8785: Unsupported type '${typeof val}'`);
}

/**
 * Serializes a string with RFC 8785 escaping and strict UTF-16 surrogate validation.
 * 
 * @param {string} str
 * @returns {string}
 */
export function serializeRFC8785String(str) {
  let result = '"';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    // UTF-16 Surrogate validation
    if (code >= 0xD800 && code <= 0xDBFF) {
      // High surrogate: must be immediately followed by low surrogate (0xDC00..0xDFFF)
      if (i + 1 >= str.length) {
        throw new TypeError(`RFC 8785: Lone high surrogate U+${code.toString(16).toUpperCase()} at end of string`);
      }
      const nextCode = str.charCodeAt(i + 1);
      if (nextCode < 0xDC00 || nextCode > 0xDFFF) {
        throw new TypeError(`RFC 8785: Lone high surrogate U+${code.toString(16).toUpperCase()} not followed by low surrogate`);
      }
      // Valid surrogate pair: emit both directly as literal characters
      result += str[i] + str[i + 1];
      i++;
      continue;
    } else if (code >= 0xDC00 && code <= 0xDFFF) {
      // Low surrogate encountered without preceding high surrogate
      throw new TypeError(`RFC 8785: Lone low surrogate U+${code.toString(16).toUpperCase()} without preceding high surrogate`);
    }

    // Standard RFC 8785 character serialization
    if (code === 0x22) { // '"'
      result += '\\"';
    } else if (code === 0x5c) { // '\'
      result += '\\\\';
    } else if (code === 0x08) {
      result += '\\b';
    } else if (code === 0x09) {
      result += '\\t';
    } else if (code === 0x0a) {
      result += '\\n';
    } else if (code === 0x0c) {
      result += '\\f';
    } else if (code === 0x0d) {
      result += '\\r';
    } else if (code < 0x20) {
      result += '\\u00' + code.toString(16).padStart(2, '0').toLowerCase();
    } else {
      result += str[i];
    }
  }
  result += '"';
  return result;
}

// ---------------------------------------------------------------------------
// 2. Strict AST Sanitizer (No JSON.stringify shortcuts)
// ---------------------------------------------------------------------------

/**
 * Recursively validates and deep-copies an AST node into plain JSON-compatible data.
 * Rejects symbols, functions, BigInt, non-finite numbers, and circular references.
 * 
 * @param {unknown} node
 * @param {Set<object>} [seen]
 * @returns {unknown}
 */
export function sanitizeAstNode(node, seen = new Set()) {
  if (node === null || typeof node === 'boolean' || typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    if (!Number.isFinite(node)) {
      throw new TypeError(`RFC 8785: AST node contains non-finite number: ${node}`);
    }
    return Object.is(node, -0) ? 0 : node;
  }
  if (typeof node === 'undefined' || typeof node === 'symbol' || typeof node === 'function' || typeof node === 'bigint') {
    throw new TypeError(`RFC 8785: AST node contains unsupported type: ${typeof node}`);
  }
  if (Array.isArray(node)) {
    validateArrayOwnProperties(node, 'RFC 8785');
    if (seen.has(node)) {
      throw new TypeError('RFC 8785: Circular reference detected in AST array');
    }
    seen.add(node);
    const result = [];
    for (let i = 0; i < node.length; i++) {
      const item = node[i];
      if (item === undefined || typeof item === 'symbol' || typeof item === 'function' || typeof item === 'bigint') {
        seen.delete(node);
        throw new TypeError(`RFC 8785: AST array contains unsupported data type '${typeof item}' at index ${i}`);
      }
      result.push(sanitizeAstNode(item, seen));
    }
    seen.delete(node);
    return result;
  }
  if (typeof node === 'object') {
    const symbolKeys = Object.getOwnPropertySymbols(node);
    if (symbolKeys.length > 0) {
      throw new TypeError('RFC 8785: Symbol-keyed properties in AST node');
    }
    const proto = Object.getPrototypeOf(node);
    if (proto !== Object.prototype && proto !== null) {
      throw new TypeError(`RFC 8785: Non-plain object in AST node: ${Object.prototype.toString.call(node)}`);
    }
    if (seen.has(node)) {
      throw new TypeError('RFC 8785: Circular reference detected in AST object');
    }
    seen.add(node);
    const result = {};
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (val === undefined || typeof val === 'symbol' || typeof val === 'function' || typeof val === 'bigint') {
        seen.delete(node);
        throw new TypeError(`RFC 8785: AST object property '${key}' has unsupported type '${typeof val}'`);
      }
      result[key] = sanitizeAstNode(val, seen);
    }
    seen.delete(node);
    return result;
  }
  throw new TypeError(`RFC 8785: Unsupported AST node type: ${typeof node}`);
}

// ---------------------------------------------------------------------------
// 3. Documented Condition Expression Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes condition block text into a documented normalized text fallback representation.
 * 
 * Supported Normalization Transformations:
 * 1. Trimming outer leading and trailing whitespace.
 * 2. Standardizing condition brackets: [Summon Condition: ...] -> conditionType: 'SUMMON_CONDITION'.
 * 3. Collapsing internal whitespace runs (\s+) to single spaces.
 * 4. Stripping purely cosmetic trailing periods.
 * 
 * Strict Preservations (Never modified):
 * - Internal punctuation (colons, commas, hyphens, quotes).
 * - Numeric thresholds (Cost 4, Life 2).
 * - Comparison operators (or more, or less, above, below).
 * - Card type prerequisites (Spirit, Ultimate, Brave, Nexus).
 * - Logical connectors (and, or, with).
 * 
 * @param {string} blockText
 * Parses condition block text (e.g. "[Summon Condition: ...]").
 * When options.v3 is false (default), preserves strict V2 regex behavior for frozen shard hash compatibility.
 * @param {string} blockText
 * @param {{ v3?: boolean }} [options]
 * @returns {{ type: 'CONDITION_TEXT_FALLBACK', conditionType: string, expression: string, source: 'NORMALIZED_TEXT' }}
 */
export function parseConditionBlock(blockText, options = {}) {
  if (!blockText || typeof blockText !== 'string') {
    return {
      type: 'CONDITION_TEXT_FALLBACK',
      conditionType: 'NONE',
      expression: '',
      source: 'NORMALIZED_TEXT'
    };
  }

  const trimmed = blockText.trim();
  let conditionType = 'CONDITION';
  let expression = '';

  const v3 = Boolean(options && options.v3);
  const summonMatch = v3
    ? trimmed.match(/^\[(?:Summon\s+Condition|SuAdcon):\s*([^\]]+)\]?/i)
    : trimmed.match(/^\[(?:Summon\s+Condition|SuAdcon):\s*([^\]]+)\]/i);
  const braveMatch = v3
    ? trimmed.match(/^\[Brave\s+Condition:\s*((?:\[[^\]]*\]|[^\]])+)\]?/i)
    : trimmed.match(/^\[Brave\s+Condition:\s*([^\]]+)\]/i);
  const coreModMatch = trimmed.match(/^\[\+(\d+)\]/);

  if (summonMatch) {
    conditionType = /suadcon/i.test(trimmed) ? 'SUPER_ADVENT_CONDITION' : 'SUMMON_CONDITION';
    expression = summonMatch[1].trim();
  } else if (braveMatch) {
    conditionType = 'BRAVE_CONDITION';
    expression = braveMatch[1].trim();
  } else if (coreModMatch) {
    conditionType = 'CORE_MODIFIER';
    expression = `+${coreModMatch[1]}`;
  } else {
    // Other bracketed condition or reminder block
    const bracketMatch = trimmed.match(/^\[([^\]]+)\]/);
    if (bracketMatch) {
      const parts = bracketMatch[1].split(':');
      conditionType = parts[0].trim().toUpperCase().replace(/[\s\-]+/g, '_');
      expression = parts.slice(1).join(':').trim() || bracketMatch[1].trim();
    } else {
      expression = trimmed;
    }
  }

  // Conservative, documented normalization
  const normalizedExpression = expression
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .trim();

  return {
    type: 'CONDITION_TEXT_FALLBACK',
    conditionType,
    expression: normalizedExpression,
    source: 'NORMALIZED_TEXT'
  };
}

// ---------------------------------------------------------------------------
// 4. Ability Descriptor Construction
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic functional ability descriptor from compiler AST elements.
 * 
 * INCLUDED Execution-Relevant Attributes:
 * - type: string ('ABILITY', 'CONDITION')
 * - timing: string (normalized uppercase)
 * - timings: string[] (sorted multi-timings if present)
 * - trigger: string (normalized uppercase event trigger)
 * - levels: number[] (sorted level prerequisites)
 * - limit: string | null (normalized restriction)
 * - cantStack: boolean
 * - keyword: string | null (primary named mechanic)
 * - keywords: array of normalized bound keyword summaries [{ name, parameter }]
 * - burstCondition: string | null
 * - condition: object | null (structured condition representation or text fallback)
 * - clauses: array of clause objects in sequential execution order
 * 
 * SEMANTIC OPERATION DESCRIPTOR POLICY:
 * - When valid structured operation AST exists: authoritative representation is the op AST.
 *   Cosmetic cleanText prose is excluded so wording variations with identical ops share semantic IDs.
 * - When no structured op exists (or op.op === 'UNSUPPORTED'): normalized source text preserved as textFallback.
 * - When partially compiled: both structured op and unparsedRemainder are preserved.
 * 
 * @param {object} ability
 * @returns {object}
 */
export function createAbilityDescriptor(ability) {
  if (!ability || typeof ability !== 'object') {
    throw new TypeError('Ability must be a valid object');
  }

  const header = ability.header || {};

  // Normalize timing
  const timing = (header.timing || 'NONE').toUpperCase().trim();
  const timings = Array.isArray(header.timings)
    ? [...new Set(header.timings.map(t => String(t).toUpperCase().trim()))].sort(compareUtf16CodeUnits)
    : [];

  // Normalize trigger
  const trigger = (header.trigger || 'NONE').toUpperCase().trim();

  // Normalize levels (sorted numerically)
  const levels = Array.isArray(header.levels)
    ? [...header.levels].map(Number).filter(Number.isFinite).sort((a, b) => a - b)
    : [];

  // Normalize limit
  const limit = header.limit ? String(header.limit).toUpperCase().trim() : null;

  // Normalize primary keyword
  const keyword = header.keyword ? String(header.keyword).trim() : null;

  // Normalize bound keywords if present (sorted deterministically by UTF-16 code units: name, then parameter)
  let keywords = null;
  if (Array.isArray(ability.keywords) && ability.keywords.length > 0) {
    keywords = ability.keywords.map(kw => ({
      name: String(kw.name || '').trim(),
      parameter: kw.parameter ? String(kw.parameter).trim() : null
    })).sort((a, b) => {
      const cmp = compareUtf16CodeUnits(a.name, b.name);
      if (cmp !== 0) return cmp;
      return compareUtf16CodeUnits(a.parameter, b.parameter);
    });
  }

  // Normalize burstCondition
  const burstCondition = header.burstCondition ? String(header.burstCondition).trim() : null;

  // Normalize condition: structured representation for condition blocks or top-level conditions
  let condition = null;
  if (ability.condition && typeof ability.condition === 'object') {
    condition = sanitizeAstNode(ability.condition);
  } else if (ability.type === 'CONDITION' || /^\[(?:Summon|Brave)\s+Condition:/i.test(ability.rawText || '')) {
    condition = parseConditionBlock(ability.rawText || '');
  }

  // Normalize clauses in STRICT sequential execution order (never sort clauses!)
  const clauses = [];
  if (Array.isArray(ability.clauses)) {
    for (const c of ability.clauses) {
      if (!c) continue;

      const link = c.link ? String(c.link).toLowerCase().trim() : null;
      const isOptional = Boolean(c.isOptional);
      const isCost = Boolean(c.isCost);
      const duration = c.duration ? String(c.duration).toUpperCase().trim() : null;
      const clauseCond = c.condition ? sanitizeAstNode(c.condition) : null;

      const hasStructuredOp = Boolean(
        c.op &&
        typeof c.op === 'object' &&
        c.op.op &&
        c.op.op !== 'UNSUPPORTED'
      );

      let opDescriptor = null;
      let textFallback = null;

      if (hasStructuredOp) {
        // Structured operation AST is authoritative representation of semantics
        opDescriptor = sanitizeAstNode(c.op);
        // Exclude cosmetic cleanText prose when valid structured op exists
        // If unparsed remainder is present in partially compiled clause, preserve it:
        if (c.unparsedRemainder) {
          textFallback = String(c.unparsedRemainder).trim();
        }
      } else {
        // No structured op or op.op === 'UNSUPPORTED': preserve normalized text fallback
        const raw = c.cleanText || c.rawText || '';
        textFallback = String(raw).trim();
        if (c.op && c.op.op === 'UNSUPPORTED') {
          opDescriptor = { op: 'UNSUPPORTED' };
        }
      }

      const clauseDesc = {
        link,
        isOptional,
        isCost,
        duration,
        condition: clauseCond
      };

      if (opDescriptor) {
        clauseDesc.op = opDescriptor;
      }
      if (textFallback) {
        clauseDesc.textFallback = textFallback;
      }

      clauses.push(clauseDesc);
    }
  }

  const descriptor = {
    type: ability.type || 'ABILITY',
    timing,
    timings,
    trigger,
    levels,
    limit,
    cantStack: Boolean(header.cantStack),
    keyword,
    burstCondition,
    condition,
    clauses
  };

  if (keywords) {
    descriptor.keywords = keywords;
  }

  return descriptor;
}

// ---------------------------------------------------------------------------
// 5. Unconditional Dual-Digest Derivation
// ---------------------------------------------------------------------------

/**
 * Computes H1 (SHA-256) and H2 (SHA-512 slice) unconditionally.
 * 
 * Architectural & Security Specification:
 * - H1 is the full 256-bit SHA-256 digest (32 raw bytes = 64 lowercase hex characters).
 * - H2 is the first 128 bits of SHA-512 (16 raw bytes = 32 lowercase hex characters).
 * - Both are derived unconditionally from the identical canonical RFC 8785 descriptor.
 * - Suffix format: H1 + "_" + H2 = exactly 97 characters.
 * 
 * Dual-Digest Collision Detection Model:
 * - The combined suffix is a dual-digest collision-detection identifier.
 * - NO additive 384-bit collision-resistance guarantee is claimed or relied upon.
 *   Under Merkle-Damgård multi-collision attacks (Joux, 2004), concatenating hashes does
 *   not provide the sum of their individual security parameters.
 * - Primary cryptographic protection is the 256-bit collision resistance of SHA-256 (birthday bound ~2^128).
 * - Secondary digest (128-bit SHA-512 slice) provides uncorrelated hash-function diversity.
 * - Corpus collision probability estimates are conditional on stated random-oracle assumptions
 *   and are not formal security proofs.
 * - The AbilityCollisionRegistry provides absolute deterministic protection: when derived IDs match,
 *   the registry compares exact canonical descriptor strings (D1 === D2).
 * - A mismatched descriptor sharing an ID immediately triggers a fatal FatalCollisionError.
 * 
 * @param {string|Buffer} canonicalJson
 * @param {object} [customHasher] Optional test interface for simulating collisions
 * @returns {{ h1: string, h2: string, suffix: string }}
 */
export function deriveDualDigest(canonicalJson, customHasher = null) {
  if (typeof canonicalJson !== 'string' && !Buffer.isBuffer(canonicalJson)) {
    throw new TypeError('canonicalJson must be string or Buffer');
  }

  const inputBuffer = Buffer.isBuffer(canonicalJson) ? canonicalJson : Buffer.from(canonicalJson, 'utf8');

  // Allow test-only injectable hasher for simulating hash collisions
  if (customHasher) {
    const h1 = customHasher.sha256(inputBuffer);
    const h2 = customHasher.sha512Slice(inputBuffer);
    return {
      h1,
      h2,
      suffix: `${h1}_${h2}`
    };
  }

  // 1. Primary Digest: SHA-256 (32 bytes = 64 lowercase hex characters)
  const h1 = createHash('sha256').update(inputBuffer).digest('hex').toLowerCase();

  // 2. Secondary Digest: SHA-512 sliced to first 16 bytes (32 lowercase hex characters)
  const fullH2 = createHash('sha512').update(inputBuffer).digest('hex').toLowerCase();
  const h2 = fullH2.slice(0, 32);

  return {
    h1,
    h2,
    suffix: `${h1}_${h2}`
  };
}

// ---------------------------------------------------------------------------
// 6. Physical and Semantic Ability ID Derivation
// ---------------------------------------------------------------------------

/**
 * Formats level range segment for identity template.
 */
function formatLevelRange(levels) {
  if (!levels || levels.length === 0) return 'ALL';
  return levels.map(l => `LV${l}`).join('_');
}

/**
 * Derives the deterministic physical ability ID for a specific card number and instance index.
 * Template: {cardNumber}#AB_{timing}_{trigger}_{levelRange}_{H1}_{H2}[_inst{N}]
 * 
 * @param {string} cardNumber Canonical card number (e.g. 'BS52-001')
 * @param {object} descriptor Functional ability descriptor
 * @param {number|object} [instanceIndexOrHasher=1] 1-based occurrence index on this card OR customHasher
 * @param {object} [customHasher=null] Optional test interface
 * @returns {string}
 */
export function derivePhysicalAbilityId(cardNumber, descriptor, instanceIndexOrHasher = 1, customHasher = null) {
  if (!cardNumber || typeof cardNumber !== 'string') {
    throw new TypeError('cardNumber must be a non-empty string');
  }
  if (!descriptor || typeof descriptor !== 'object') {
    throw new TypeError('descriptor must be a valid object');
  }

  let instanceIndex = 1;
  let hasher = customHasher;
  if (typeof instanceIndexOrHasher === 'object' && instanceIndexOrHasher !== null) {
    hasher = instanceIndexOrHasher;
    instanceIndex = 1;
  } else if (Number.isInteger(instanceIndexOrHasher) && instanceIndexOrHasher > 0) {
    instanceIndex = instanceIndexOrHasher;
  }

  const canonicalJson = canonicalizeRFC8785(descriptor);
  const { h1, h2 } = deriveDualDigest(canonicalJson, hasher);

  const timing = (descriptor.timing || 'NONE').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  const trigger = (descriptor.trigger || 'NONE').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  const levelRange = formatLevelRange(descriptor.levels);

  const baseId = `${cardNumber}#AB_${timing}_${trigger}_${levelRange}_${h1}_${h2}`;
  return instanceIndex > 1 ? `${baseId}_inst${instanceIndex}` : baseId;
}

/**
 * Derives the deterministic semantic ability ID for cross-card/reprint equivalence.
 * Template: SEM#AB_{timing}_{trigger}_{levelRange}_{H1}_{H2}
 * 
 * Semantic identity does NOT incorporate card number or instance index,
 * allowing exact behavioral matching across reprints and separate cards.
 * 
 * @param {object} descriptor Functional ability descriptor
 * @param {object} [customHasher] Optional test interface
 * @returns {string}
 */
export function deriveSemanticAbilityId(descriptor, customHasher = null) {
  if (!descriptor || typeof descriptor !== 'object') {
    throw new TypeError('descriptor must be a valid object');
  }

  const canonicalJson = canonicalizeRFC8785(descriptor);
  const { h1, h2 } = deriveDualDigest(canonicalJson, customHasher);

  const timing = (descriptor.timing || 'NONE').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  const trigger = (descriptor.trigger || 'NONE').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  const levelRange = formatLevelRange(descriptor.levels);

  return `SEM#AB_${timing}_${trigger}_${levelRange}_${h1}_${h2}`;
}

/**
 * Builds the property-complete V3 semantic ability descriptor (K.1.5),
 * preserving V2 backward compatibility for existing physicalId/semanticId fields
 * while capturing timingOwner, timingCause, timingTriggers, activationRestrictions,
 * prerequisite metadata, and embedded timing-label subclauses.
 *
 * @param {object} ability
 * @returns {object}
 */
export function createAbilityDescriptorV3(ability) {
  const base = createAbilityDescriptor(ability);
  const header = ability.header || {};
  const label = String(header.timingLabel || '');
  const isMultiLine = label.includes('\n');
  const firstLine = isMultiLine ? label.split(/\r?\n/)[0].trim() : label.trim();
  const low = firstLine.toLowerCase();

  let timingOwner = header.timingOwner || null;
  if (!timingOwner) {
    if (/\beither\b/i.test(low)) timingOwner = 'EITHER';
    else if (/\bopposing\b|\bopponent'?s\b/i.test(low) && !/\bby (?:the )?opponent\b|\bby an opposing\b/i.test(low)) timingOwner = 'OPPONENT';
    else if (/\byour\b|\byour spirit\b/i.test(low)) timingOwner = 'SELF';
    else timingOwner = 'ANY';
  }

  let timingCause = header.timingCause || null;
  if (!timingCause) {
    if (/by an opposing spirit effect/i.test(low)) timingCause = 'OPPOSING_SPIRIT_EFFECT';
    else if (/by (?:the )?opponent|by an opposing/i.test(low)) timingCause = 'OPPONENT';
    else timingCause = 'ANY';
  }

  const triggerSet = new Set(Array.isArray(header.timingTriggers) ? header.timingTriggers.map(t => String(t).toUpperCase().trim()) : []);
  if (/depleted\s*\/\s*destroyed/i.test(low)) {
    triggerSet.add('WHEN_DEPLETED');
    triggerSet.add('WHEN_DESTROYED');
  } else if (/\bwhen\b.*\bdepleted\b/i.test(low)) {
    triggerSet.add('WHEN_DEPLETED');
  }
  if (triggerSet.size === 0 && base.timing && base.timing !== 'PASSIVE' && base.timing !== 'NONE') {
    triggerSet.add(base.timing);
  }
  const timingTriggers = [...triggerSet].sort(compareUtf16CodeUnits);

  const restSet = new Set(Array.isArray(header.activationRestrictions) ? header.activationRestrictions.map(r => String(r).toUpperCase().trim()) : []);
  if (/paying the original cost/i.test(low)) restSet.add('PAID_ORIGINAL_COST');
  if (base.limit) restSet.add(base.limit);
  if (base.cantStack) restSet.add('CANT_STACK');
  const prefixes = Array.isArray(header.prefixes) ? header.prefixes.map(p => String(p).trim()) : [];
  for (const p of prefixes) {
    if (/during\s+set/i.test(p)) restSet.add('DURING_SET');
    if (/during\s+brave|when\s+braved/i.test(p)) restSet.add('WHILE_BRAVED');
    if (/soul\s+state/i.test(p)) restSet.add('SOUL_STATE');
  }
  if (header.keyword && /when\s+braved|during\s+brave/i.test(header.keyword)) {
    restSet.add('WHILE_BRAVED');
  }
  const activationRestrictions = [...restSet].sort(compareUtf16CodeUnits);

  const embeddedText = header.embeddedConditionText || (isMultiLine ? label.split(/\r?\n/).slice(1).join('\n').trim() : null);

  let condition = base.condition;
  if (!(ability.condition && typeof ability.condition === 'object') &&
      (ability.type === 'CONDITION' || /^\[(?:Summon|Brave)\s+Condition:/i.test(ability.rawText || ''))) {
    condition = parseConditionBlock(ability.rawText || '', { v3: true });
  }

  return {
    ...base,
    condition,
    prefixes: [...prefixes].sort(compareUtf16CodeUnits),
    timingOwner,
    timingCause,
    timingTriggers,
    activationRestrictions,
    hasEmbeddedTimingLabelText: Boolean(embeddedText),
    embeddedConditionText: embeddedText || null,
    teams: Array.isArray(ability.teams) ? [...ability.teams].sort(compareUtf16CodeUnits) : null
  };
}

/**
 * Derives the V3 semantic ability ID incorporating full timing semantics and
 * collision-resolving qualifiers without altering V2 IDs.
 *
 * @param {object} abilityOrDescriptor
 * @param {object} [customHasher=null]
 * @returns {string}
 */
export function deriveSemanticAbilityIdV3(abilityOrDescriptor, customHasher = null) {
  if (!abilityOrDescriptor || typeof abilityOrDescriptor !== 'object') {
    throw new TypeError('abilityOrDescriptor must be a valid object');
  }
  const descriptorV3 = Object.prototype.hasOwnProperty.call(abilityOrDescriptor, 'timingOwner')
    ? abilityOrDescriptor
    : createAbilityDescriptorV3(abilityOrDescriptor);

  const canonicalJson = canonicalizeRFC8785(descriptorV3);
  const { h1, h2 } = deriveDualDigest(canonicalJson, customHasher);

  const timing = (descriptorV3.timing || 'NONE').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  const trigger = (descriptorV3.trigger || 'NONE').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  const levelRange = formatLevelRange(descriptorV3.levels);

  return `SEM3#AB_${timing}_${trigger}_${levelRange}_${h1}_${h2}`;
}

// ---------------------------------------------------------------------------
// 7. Deterministic Collision Registry with Snapshot & Rollback
// ---------------------------------------------------------------------------

export class FatalCollisionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'FatalCollisionError';
    this.details = details;
  }
}

/**
 * In-memory registry guarding against hash collisions during compilation.
 * 
 * Guarantees:
 * - Registration order has zero effect on derivation.
 * - Deep canonical AST descriptor string equality (D1 === D2) checked upon collision.
 * - Mismatched descriptors with matching IDs throw FatalCollisionError.
 * - No suffixes assigned based on discovery order.
 * - No silent merging of disparate abilities.
 * - Atomic snapshot and rollback support for compilation isolation and exception safety.
 */
export class AbilityCollisionRegistry {
  constructor() {
    this.entries = new Map();
  }

  /**
   * Clears the registry (useful for test resets).
   */
  clear() {
    this.entries.clear();
  }

  /**
   * Captures an immutable snapshot of currently registered keys.
   * @returns {Set<string>}
   */
  snapshot() {
    return new Set(this.entries.keys());
  }

  /**
   * Rolls back registry state to the provided snapshot, discarding entries added since.
   * @param {Set<string>} snapshot
   */
  rollbackTo(snapshot) {
    if (!snapshot || !(snapshot instanceof Set)) {
      return;
    }
    for (const key of this.entries.keys()) {
      if (!snapshot.has(key)) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Unregisters a specific physical ability ID.
   * @param {string} physicalId
   */
  unregister(physicalId) {
    this.entries.delete(physicalId);
  }

  /**
   * Registers a physical ability ID and its canonical descriptor.
   * 
   * @param {string} physicalId
   * @param {object|string} descriptor Ability descriptor object or canonical JSON string
   * @param {string} cardNumber
   * @returns {{ status: 'NEW'|'MATCH', physicalId: string }}
   */
  register(physicalId, descriptor, cardNumber = 'UNKNOWN') {
    const canonicalJson = typeof descriptor === 'string'
      ? descriptor
      : canonicalizeRFC8785(descriptor);

    if (this.entries.has(physicalId)) {
      const existing = this.entries.get(physicalId);

      // Exact canonical descriptor equality check
      if (existing.canonicalJson !== canonicalJson) {
        throw new FatalCollisionError(
          `[FATAL COLLISION DETECTED] Physical Ability ID collision encountered!\n` +
          `Physical ID: ${physicalId}\n` +
          `Existing card: ${existing.cardNumber}\n` +
          `Incoming card: ${cardNumber}\n` +
          `Descriptors differ despite matching dual-digest.\n` +
          `Aborting compilation. Never assign discovery-order suffixes or merge silently.`,
          {
            physicalId,
            existingCardNumber: existing.cardNumber,
            incomingCardNumber: cardNumber,
            existingCanonical: existing.canonicalJson,
            incomingCanonical: canonicalJson
          }
        );
      }

      // Identical descriptor: benign re-compilation
      return { status: 'MATCH', physicalId };
    }

    // Register new unique ability
    this.entries.set(physicalId, {
      physicalId,
      canonicalJson,
      cardNumber
    });

    return { status: 'NEW', physicalId };
  }

  /**
   * Returns registered entry if present.
   */
  get(physicalId) {
    return this.entries.get(physicalId) || null;
  }

  /**
   * Checks whether a physical ID is registered.
   */
  has(physicalId) {
    return this.entries.has(physicalId);
  }

  /**
   * Total number of registered physical abilities.
   */
  get size() {
    return this.entries.size;
  }
}

// Global compiler collision registry singleton
export const globalCollisionRegistry = new AbilityCollisionRegistry();
