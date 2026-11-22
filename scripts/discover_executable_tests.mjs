/**
 * scripts/discover_executable_tests.mjs
 *
 * Conservative JavaScript tokenizer and brace-balanced callback parser for
 * discovering actual registered, non-skipped `test(...)` / `it(...)` cases,
 * verifying runner membership separately, and binding to execution logs.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SELF_CONTAINED_SUITES, DATA_DEPENDENT_SUITES } from './run_verified_suites.mjs';

const RUN_ALL_PATH = path.resolve('tests/run_all.js');

const REGEX_PREFIX_KEYWORDS = new Set([
  'return', 'throw', 'case', 'delete', 'void', 'typeof', 'in', 'instanceof', 'new', 'await', 'yield', 'else'
]);
const REGEX_PREFIX_PUNCTS = new Set([
  '(', ',', '=', ':', ';', '[', '!', '&', '|', '?', '{', '}', '=>', '+', '-', '*', '%', '<', '>', '~', '^'
]);

export function tokenizeJs(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  let lastCodeToken = null;

  const isIdentStart = c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
  const isIdentPart = c => isIdentStart(c) || (c >= '0' && c <= '9');

  const canPrecedeRegex = () => {
    if (!lastCodeToken) return true;
    if (lastCodeToken.type === 'PUNCT') return REGEX_PREFIX_PUNCTS.has(lastCodeToken.value);
    if (lastCodeToken.type === 'IDENT') return REGEX_PREFIX_KEYWORDS.has(lastCodeToken.value);
    return false;
  };

  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      i++;
      continue;
    }

    // Line comment
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < n && src[i] !== '\n') i++;
      continue;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // Regex literal
    if (ch === '/' && canPrecedeRegex()) {
      const start = i++;
      let inClass = false;
      while (i < n) {
        const c = src[i];
        if (c === '\\' && i + 1 < n) { i += 2; continue; }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) { i++; break; }
        else if (c === '\n') break;
        i++;
      }
      while (i < n && isIdentStart(src[i])) i++;
      const tok = { type: 'REGEX', value: src.slice(start, i), start, end: i };
      tokens.push(tok);
      lastCodeToken = tok;
      continue;
    }

    // String literal
    if (ch === '\'' || ch === '"') {
      const quote = ch;
      const start = i++;
      let val = '';
      while (i < n) {
        const c = src[i];
        if (c === '\\' && i + 1 < n) {
          val += src[i + 1];
          i += 2;
          continue;
        }
        i++;
        if (c === quote) break;
        val += c;
      }
      const tok = { type: 'STRING', value: val, start, end: i };
      tokens.push(tok);
      lastCodeToken = tok;
      continue;
    }

    // Template literal (tracks ${ ... } brace depth cleanly)
    if (ch === '`') {
      const start = i++;
      let val = '';
      while (i < n) {
        const c = src[i];
        if (c === '\\' && i + 1 < n) {
          val += src[i + 1];
          i += 2;
          continue;
        }
        if (c === '$' && src[i + 1] === '{') {
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            const ic = src[i];
            if (ic === '\'' || ic === '"' || ic === '`') {
              const q = ic;
              i++;
              while (i < n) {
                if (src[i] === '\\') { i += 2; continue; }
                if (src[i++] === q) break;
              }
              continue;
            }
            if (ic === '{') depth++;
            else if (ic === '}') depth--;
            i++;
          }
          continue;
        }
        i++;
        if (c === '`') break;
        val += c;
      }
      const tok = { type: 'TEMPLATE', value: val, start, end: i };
      tokens.push(tok);
      lastCodeToken = tok;
      continue;
    }

    // Identifier / keyword
    if (isIdentStart(ch)) {
      const start = i++;
      while (i < n && isIdentPart(src[i])) i++;
      const tok = { type: 'IDENT', value: src.slice(start, i), start, end: i };
      tokens.push(tok);
      lastCodeToken = tok;
      continue;
    }

    // Number
    if (ch >= '0' && ch <= '9') {
      const start = i++;
      while (i < n && (isIdentPart(src[i]) || src[i] === '.')) i++;
      const tok = { type: 'NUMBER', value: src.slice(start, i), start, end: i };
      tokens.push(tok);
      lastCodeToken = tok;
      continue;
    }

    // Multi-char punctuator =>
    if (ch === '=' && next === '>') {
      const tok = { type: 'PUNCT', value: '=>', start: i, end: i + 2 };
      tokens.push(tok);
      lastCodeToken = tok;
      i += 2;
      continue;
    }

    const tok = { type: 'PUNCT', value: ch, start: i, end: i + 1 };
    tokens.push(tok);
    lastCodeToken = tok;
    i++;
  }

  return tokens;
}

function findMatchingBrace(tokens, openIdx, openChar = '{', closeChar = '}') {
  let depth = 0;
  for (let i = openIdx; i < tokens.length; i++) {
    if (tokens[i].type === 'PUNCT' && tokens[i].value === openChar) depth++;
    else if (tokens[i].type === 'PUNCT' && tokens[i].value === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Extracts only top-level or describe-nested executable `test('name', fn)` / `it('name', fn)` calls.
 * Rejects comments, string/template/regex decoys, skipped/todo tests, helper-scoped declarations,
 * loop-generated tests, and callbacks without an explicit brace-balanced `{ ... }` body.
 */
export function extractRegisteredTests(sourceCode) {
  const tokens = tokenizeJs(sourceCode);
  const tests = [];

  // Track active brace scopes: 'TOP' | 'DESCRIBE' | 'IGNORED_FN_OR_LOOP'
  const scopeStack = [];
  let pendingScopeKind = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // Track for/while/function declarations so nested test() inside helpers/loops are NOT credited
    if (t.type === 'IDENT' && (t.value === 'for' || t.value === 'while' || t.value === 'function')) {
      pendingScopeKind = 'IGNORED_FN_OR_LOOP';
    }
    if (t.type === 'PUNCT' && t.value === '=>') {
      pendingScopeKind = 'IGNORED_FN_OR_LOOP';
    }
    if (t.type === 'IDENT' && t.value === 'describe' && tokens[i + 1]?.value === '(') {
      pendingScopeKind = 'DESCRIBE';
    }

    if (t.type === 'PUNCT' && t.value === '{') {
      scopeStack.push(pendingScopeKind || 'BLOCK');
      pendingScopeKind = null;
      continue;
    }
    if (t.type === 'PUNCT' && t.value === '}') {
      scopeStack.pop();
      continue;
    }

    const inAllowedScope = !scopeStack.includes('IGNORED_FN_OR_LOOP');
    if (!inAllowedScope) continue;

    if (t.type !== 'IDENT' || (t.value !== 'test' && t.value !== 'it')) continue;
    const prev = tokens[i - 1];
    if (prev && (prev.value === '.' || prev.value === 'function' || prev.value === 'const' || prev.value === 'let' || prev.value === 'var')) {
      continue;
    }
    if (tokens[i + 1]?.type !== 'PUNCT' || tokens[i + 1].value !== '(') continue;

    const callOpen = i + 1;
    const callClose = findMatchingBrace(tokens, callOpen, '(', ')');
    if (callClose === -1) continue;

    const nameTok = tokens[callOpen + 1];
    if (!nameTok || nameTok.type !== 'STRING') continue;
    if (tokens[callOpen + 2]?.type !== 'PUNCT' || tokens[callOpen + 2].value !== ',') continue;

    // Locate callback after optional options object `{ ... },`
    let argIdx = callOpen + 3;
    if (tokens[argIdx]?.type === 'PUNCT' && tokens[argIdx].value === '{') {
      const optEnd = findMatchingBrace(tokens, argIdx, '{', '}');
      if (optEnd === -1 || optEnd >= callClose) continue;
      argIdx = optEnd + 1;
      if (tokens[argIdx]?.value === ',') argIdx++;
    }

    // Parse `async? ( ... ) => { ... }` or `async? function name? ( ... ) { ... }`
    let cbIdx = argIdx;
    if (tokens[cbIdx]?.type === 'IDENT' && tokens[cbIdx].value === 'async') cbIdx++;
    if (tokens[cbIdx]?.type === 'IDENT' && tokens[cbIdx].value === 'function') {
      cbIdx++;
      if (tokens[cbIdx]?.type === 'IDENT') cbIdx++;
    }
    if (tokens[cbIdx]?.type === 'PUNCT' && tokens[cbIdx].value === '(') {
      const paramClose = findMatchingBrace(tokens, cbIdx, '(', ')');
      if (paramClose === -1 || paramClose >= callClose) continue;
      cbIdx = paramClose + 1;
    } else if (tokens[cbIdx]?.type === 'IDENT' && tokens[cbIdx + 1]?.value === '=>') {
      cbIdx++;
    } else {
      continue;
    }
    if (tokens[cbIdx]?.type === 'PUNCT' && tokens[cbIdx].value === '=>') cbIdx++;

    // Conservative requirement: must have an explicit `{ ... }` block body
    if (tokens[cbIdx]?.type !== 'PUNCT' || tokens[cbIdx].value !== '{') continue;
    const bodyOpen = cbIdx;
    const bodyClose = findMatchingBrace(tokens, bodyOpen, '{', '}');
    if (bodyClose === -1 || bodyClose > callClose) continue;

    const bodyTokens = tokens.slice(bodyOpen + 1, bodyClose);
    let hasAssert = false;
    const calledIdents = new Set();

    const hasCardFrameworkImport = sourceCode.includes('card_e2e_framework.mjs');
    for (let k = 0; k < bodyTokens.length; k++) {
      const bt = bodyTokens[k];
      if (bt.type === 'IDENT') {
        const prevTok = bodyTokens[k - 1];
        const nextTok = bodyTokens[k + 1];
        const isCall = nextTok?.type === 'PUNCT' && nextTok.value === '(' && prevTok?.value !== 'function';
        if (isCall) {
          calledIdents.add(bt.value);
        }
        if ((bt.value === 'assert' && nextTok?.type === 'PUNCT' && nextTok.value === '.') ||
            (hasCardFrameworkImport && isCall && (bt.value === 'runCardAbilityE2E' || bt.value === 'runCardRulesE2E'))) {
          hasAssert = true;
        }
      }
    }

    const clsMatch = String(nameTok.value || '').match(/\[(CARD_ABILITY_E2E|CARD_RULES_E2E|CARD_IR_EXECUTION|OPERATION_INTEGRATION|COMPILER_UNIT|RULES_UNIT|OPERATION_VARIANT|CONDITION_SEMANTICS|INVARIANT|ADVERSARIAL|UNIT|INTEGRATION)\]/);
    tests.push({
      kind: t.value,
      name: nameTok.value,
      classification: clsMatch ? clsMatch[1] : null,
      hasAssert,
      calledIdents,
      bodyStart: tokens[bodyOpen].start,
      bodyEnd: tokens[bodyClose].end
    });

    // Advance past this test callback so nested helper functions inside it aren't misread
    i = callClose;
  }

  return tests;
}

const VERIFIED_SUITE_SET = new Set([
  ...SELF_CONTAINED_SUITES.map(s => s.replace(/\\/g, '/')),
  ...DATA_DEPENDENT_SUITES.map(s => s.replace(/\\/g, '/'))
]);

export function getRunnerMembership(relPath) {
  const norm = String(relPath).replace(/\\/g, '/').replace(/^\.\//, '');
  const fullExists = fs.existsSync(path.resolve(norm));
  const inVerifiedRunner = fullExists && VERIFIED_SUITE_SET.has(norm);
  const inFullRunner = fullExists && norm.startsWith('tests/') && norm.endsWith('.test.js') && fs.existsSync(RUN_ALL_PATH);
  return { inFullRunner, inVerifiedRunner };
}

export function isTestFileInRunner(relPath) {
  const { inFullRunner, inVerifiedRunner } = getRunnerMembership(relPath);
  return inFullRunner || inVerifiedRunner;
}

const fileDiscoveryCache = new Map();

export function discoverTestsInFile(relPath) {
  const norm = String(relPath).replace(/\\/g, '/').replace(/^\.\//, '');
  const fullPath = path.resolve(norm);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, inFullRunner: false, inVerifiedRunner: false, inRunner: false, tests: [] };
  }
  if (fileDiscoveryCache.has(fullPath)) return fileDiscoveryCache.get(fullPath);

  const src = fs.readFileSync(fullPath, 'utf8');
  const fileSha256 = crypto.createHash('sha256').update(src).digest('hex');
  const tests = extractRegisteredTests(src);
  const { inFullRunner, inVerifiedRunner } = getRunnerMembership(norm);
  const entry = {
    exists: true,
    src,
    fileSha256,
    inFullRunner,
    inVerifiedRunner,
    inRunner: inFullRunner || inVerifiedRunner,
    tests
  };
  fileDiscoveryCache.set(fullPath, entry);
  return entry;
}

export function parseExecutionLog(logPath) {
  const results = new Map();
  if (!logPath || !fs.existsSync(logPath)) return results;
  const raw = fs.readFileSync(logPath);
  const text = raw.includes(0x00) ? raw.toString('utf16le') : raw.toString('utf8');
  const clean = text.replace(/\x1b\[[0-9;]*m/g, '');
  for (const line of clean.split(/\r?\n/)) {
    const passM = line.match(/^\s*✔\s+(.+?)(?:\s+\([^)]+ms\))?\s*$/);
    if (passM) {
      const name = passM[1].trim();
      const status = line.includes('# SKIP') ? 'SKIP' : 'PASS';
      results.set(name, status);
      continue;
    }
    const failM = line.match(/^\s*✖\s+(.+?)(?:\s+\([^)]+ms\))?\s*$/);
    if (failM) {
      results.set(failM[1].trim(), 'FAIL');
    }
  }
  return results;
}

export function verifyExecutableTestReference(testFile, testIds = [], requiredApis = [], executionMap = null) {
  if (!testFile || !Array.isArray(testIds) || testIds.length === 0) {
    return { valid: false, reason: 'MISSING_TEST_REFERENCE', matchedTests: [], executionStatus: 'NOT_EXECUTED' };
  }
  const disc = discoverTestsInFile(testFile);
  if (!disc.exists) {
    return { valid: false, reason: 'TEST_FILE_NOT_FOUND', matchedTests: [], executionStatus: 'NOT_EXECUTED' };
  }
  if (!disc.inFullRunner && !disc.inVerifiedRunner) {
    return { valid: false, reason: 'EXCLUDED_FROM_RUNNER', matchedTests: [], executionStatus: 'NOT_EXECUTED' };
  }

  const matchedTests = [];
  const executionStatuses = [];
  for (const id of testIds) {
    // Exact registration name match only (no prefix matching)
    const found = disc.tests.find(t => t.name === id);
    if (!found) {
      return { valid: false, reason: `TEST_ID_NOT_REGISTERED:${id}`, matchedTests, executionStatus: 'NOT_EXECUTED' };
    }
    if (!found.hasAssert) {
      return { valid: false, reason: `NO_ASSERTIONS_IN_TEST:${id}`, matchedTests, executionStatus: 'NOT_EXECUTED' };
    }
    if ((found.classification === 'CARD_ABILITY_E2E' || found.classification === 'CARD_RULES_E2E') && found.calledIdents.has('executeOp')) {
      return { valid: false, reason: `BYPASSED_RESOLVER_IN_CARD_E2E:${id}`, matchedTests, executionStatus: 'NOT_EXECUTED' };
    }
    if (found.classification === 'CARD_ABILITY_E2E' || found.classification === 'CARD_RULES_E2E') {
      const bodyText = disc.src ? disc.src.slice(found.bodyStart, found.bodyEnd) : '';
      if (bodyText.includes('snapBefore !== snapAfter') || /events\.length\s*>\s*0\s*\|\|/.test(bodyText)) {
        return { valid: false, reason: `GENERIC_FALLBACK_ASSERTION_IN_CARD_E2E:${id}`, matchedTests, executionStatus: 'NOT_EXECUTED' };
      }
    }
    if (Array.isArray(requiredApis) && requiredApis.length > 0) {
      const callsApi = requiredApis.some(api => found.calledIdents.has(api));
      if (!callsApi) {
        return { valid: false, reason: `NO_PRODUCTION_API_CALL:${id}`, matchedTests, executionStatus: 'NOT_EXECUTED' };
      }
    }
    if (!(executionMap instanceof Map) || executionMap.size === 0) {
      return { valid: false, reason: 'MISSING_OR_EMPTY_EXECUTION_MAP', matchedTests, executionStatus: 'NOT_EXECUTED' };
    }
    const normFile = String(testFile).replace(/\\/g, '/').replace(/^\.\//, '');
    const execStatus = executionMap.get(`${normFile}::${found.name}`) ?? executionMap.get(found.name);
    if (execStatus !== 'PASS') {
      return {
        valid: false,
        reason: execStatus ? `EXECUTION_${execStatus}:${found.name}` : `NOT_EXECUTED:${found.name}`,
        matchedTests,
        executionStatus: execStatus || 'NOT_EXECUTED'
      };
    }
    executionStatuses.push(execStatus);
    matchedTests.push(found.name);
  }
  return {
    valid: true,
    reason: null,
    matchedTests,
    fileSha256: disc.fileSha256,
    inFullRunner: disc.inFullRunner,
    inVerifiedRunner: disc.inVerifiedRunner,
    executionStatus: executionStatuses.length > 0 ? 'PASS' : 'STATIC_ONLY_NO_LOG'
  };
}
