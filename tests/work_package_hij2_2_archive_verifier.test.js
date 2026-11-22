import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { verifyHandoffArchive } from '../scripts/verify_handoff_archive_hij2_2.mjs';

function buildSyntheticZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const ent of entries) {
    const nameBuf = Buffer.from(ent.name, 'utf8');
    const rawData = Buffer.isBuffer(ent.data) ? ent.data : Buffer.from(ent.data, 'utf8');
    const compressed = ent.store ? rawData : zlib.deflateRawSync(rawData);
    const method = ent.store ? 0 : 8;
    const crc = (ent.overrideCrc32 !== undefined ? ent.overrideCrc32 : zlib.crc32(rawData)) >>> 0;
    const uncompSize = ent.overrideUncompSize !== undefined ? ent.overrideUncompSize : rawData.length;

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 6);
    lfh.writeUInt16LE(method, 8);
    lfh.writeUInt16LE(0, 10);
    lfh.writeUInt16LE(0, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(compressed.length, 18);
    lfh.writeUInt32LE(uncompSize, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);

    localParts.push(lfh, nameBuf, compressed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compressed.length, 20);
    cd.writeUInt32LE(uncompSize, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);

    centralParts.push(cd, nameBuf);
    offset += lfh.length + nameBuf.length + compressed.length;
  }

  const cdBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, cdBuf, eocd]);
}

function mkManifestLine(relPath, content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  return `${sha}  ${buf.length}  ${relPath}`;
}

function withTempZip(buf, fn) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hij22-ver-'));
  const zipPath = path.join(tmpDir, 'test.zip');
  fs.writeFileSync(zipPath, buf);
  try {
    return fn(zipPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

test('HIJ22-VER-01: Valid archive passes all structural, CRC, SHA-256, size, and self-exclusion checks', () => {
  const f1 = 'hello world';
  const manifest = mkManifestLine('src/a.txt', f1) + '\n';
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'MANIFEST.txt', data: manifest },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'PASS');
  assert.equal(res.crcValidity.passedCount, 2);
  assert.equal(res.manifestValidity.selfExcluded, true);
  assert.equal(res.sha256Validity.verifiedCount, 1);
  assert.equal(res.byteSizeValidity.verifiedCount, 1);
});

test('HIJ22-VER-02: Corrupt CRC-32 fails closed', () => {
  const f1 = 'hello world';
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1, overrideCrc32: 0xdeadbeef },
    { name: 'MANIFEST.txt', data: mkManifestLine('src/a.txt', f1) + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.equal(res.crcValidity.valid, false);
  assert.equal(res.crcValidity.failures[0].path, 'src/a.txt');
});

test('HIJ22-VER-03: Incorrect SHA-256 in manifest fails closed', () => {
  const f1 = 'hello world';
  const badSha = '0'.repeat(64);
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'MANIFEST.txt', data: `${badSha}  ${f1.length}  src/a.txt\n` },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.equal(res.sha256Validity.valid, false);
  assert.equal(res.sha256Validity.mismatches.length, 1);
});

test('HIJ22-VER-04: Incorrect byte size in manifest fails closed', () => {
  const f1 = 'hello world';
  const sha = crypto.createHash('sha256').update(f1).digest('hex');
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'MANIFEST.txt', data: `${sha}  999  src/a.txt\n` },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.equal(res.byteSizeValidity.valid, false);
  assert.equal(res.byteSizeValidity.mismatches.length, 1);
});

test('HIJ22-VER-05: Missing manifest-listed file fails closed', () => {
  const f1 = 'hello world';
  const zipBuf = buildSyntheticZip([
    { name: 'MANIFEST.txt', data: mkManifestLine('src/missing.txt', f1) + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.deepEqual(res.missingFiles, ['src/missing.txt']);
});

test('HIJ22-VER-06: Unlisted ZIP entry fails closed', () => {
  const f1 = 'hello world';
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'src/extra.txt', data: 'sneaky' },
    { name: 'MANIFEST.txt', data: mkManifestLine('src/a.txt', f1) + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.deepEqual(res.unlistedFiles, ['src/extra.txt']);
});

test('HIJ22-VER-07: Duplicate ZIP entry fails closed', () => {
  const f1 = 'hello world';
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'src/a.txt', data: f1 },
    { name: 'MANIFEST.txt', data: mkManifestLine('src/a.txt', f1) + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.deepEqual(res.duplicatePaths.zip, ['src/a.txt']);
});

test('HIJ22-VER-08: Duplicate manifest path fails closed', () => {
  const f1 = 'hello world';
  const line = mkManifestLine('src/a.txt', f1);
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'MANIFEST.txt', data: `${line}\n${line}\n` },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.deepEqual(res.duplicatePaths.manifest, ['src/a.txt']);
});

test('HIJ22-VER-09: Relative path containing spaces passes cleanly', () => {
  const f1 = 'spaced content';
  const rel = 'folder with spaces/my file name.txt';
  const zipBuf = buildSyntheticZip([
    { name: rel, data: f1 },
    { name: 'MANIFEST.txt', data: mkManifestLine(rel, f1) + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'PASS');
  assert.equal(res.sha256Validity.verifiedCount, 1);
});

test('HIJ22-VER-10: Path traversal attempt fails closed', () => {
  const f1 = 'evil';
  const zipBuf = buildSyntheticZip([
    { name: '../evil.txt', data: f1 },
    { name: 'MANIFEST.txt', data: mkManifestLine('../evil.txt', f1) + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.ok(res.unsafePaths.some(u => u.reason === 'PATH_TRAVERSAL_REJECTED'));
});

test('HIJ22-VER-11: Absolute path fails closed', () => {
  const f1 = 'evil';
  const zipBuf = buildSyntheticZip([
    { name: '/abs/evil.txt', data: f1 },
    { name: 'MANIFEST.txt', data: mkManifestLine('/abs/evil.txt', f1) + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.ok(res.unsafePaths.some(u => u.reason === 'ABSOLUTE_PATH_REJECTED'));
});

test('HIJ22-VER-12: Malformed manifest line fails closed', () => {
  const f1 = 'hello';
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'MANIFEST.txt', data: 'not_a_valid_sha 5 src/a.txt\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.equal(res.manifestValidity.syntaxValid, false);
});

test('HIJ22-VER-13: Manifest including itself fails self-exclusion check', () => {
  const f1 = 'hello';
  const fakeSelf = 'a'.repeat(64) + '  10  MANIFEST.txt';
  const zipBuf = buildSyntheticZip([
    { name: 'src/a.txt', data: f1 },
    { name: 'MANIFEST.txt', data: mkManifestLine('src/a.txt', f1) + '\n' + fakeSelf + '\n' },
  ]);
  const res = withTempZip(zipBuf, verifyHandoffArchive);
  assert.equal(res.status, 'FAIL');
  assert.equal(res.manifestValidity.selfExcluded, false);
});
