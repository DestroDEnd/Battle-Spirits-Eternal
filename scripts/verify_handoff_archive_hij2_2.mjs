/**
 * scripts/verify_handoff_archive_hij2_2.mjs
 *
 * Independent, zero-shell, pure Node.js ZIP & MANIFEST.txt integrity verifier
 * for Battle Spirits Eternal Work Package H/I/J.2.2.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const SIG_EOCD = 0x06054b50;
const SIG_CD = 0x02014b50;
const SIG_LFH = 0x04034b50;

export function normalizeAndValidatePath(rawPath) {
  if (typeof rawPath !== 'string' || rawPath.length === 0) {
    return { safe: false, normalized: '', reason: 'EMPTY_PATH' };
  }
  if (rawPath.includes('\0')) {
    return { safe: false, normalized: rawPath, reason: 'NULL_BYTE_IN_PATH' };
  }
  const norm = rawPath.replace(/\\/g, '/');
  if (norm.startsWith('/') || /^[A-Za-z]:/.test(norm)) {
    return { safe: false, normalized: norm, reason: 'ABSOLUTE_PATH_REJECTED' };
  }
  const segments = norm.split('/');
  if (segments.some(seg => seg === '..' || seg === '.')) {
    return { safe: false, normalized: norm, reason: 'PATH_TRAVERSAL_REJECTED' };
  }
  if (segments.some(seg => seg.length === 0)) {
    return { safe: false, normalized: norm, reason: 'EMPTY_PATH_SEGMENT' };
  }
  return { safe: true, normalized: norm, reason: null };
}

function findEocdOffset(buf) {
  const minOffset = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minOffset; i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) {
      const commentLen = buf.readUInt16LE(i + 20);
      if (i + 22 + commentLen === buf.length) return i;
    }
  }
  return -1;
}

export function parseAndVerifyZipBuffer(buf) {
  const structuralErrors = [];
  const crcFailures = [];
  const unsafePaths = [];
  const duplicateZipPaths = [];

  if (!Buffer.isBuffer(buf) || buf.length < 22) {
    return {
      structurallyValid: false,
      structuralErrors: ['NOT_A_VALID_ZIP_BUFFER'],
      crcFailures,
      unsafePaths,
      duplicateZipPaths,
      entries: [],
    };
  }

  const eocdOffset = findEocdOffset(buf);
  if (eocdOffset < 0) {
    return {
      structurallyValid: false,
      structuralErrors: ['EOCD_SIGNATURE_NOT_FOUND'],
      crcFailures,
      unsafePaths,
      duplicateZipPaths,
      entries: [],
    };
  }

  const diskNum = buf.readUInt16LE(eocdOffset + 4);
  const cdDisk = buf.readUInt16LE(eocdOffset + 6);
  const totalEntriesDisk = buf.readUInt16LE(eocdOffset + 8);
  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdSize = buf.readUInt32LE(eocdOffset + 12);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  if (diskNum !== 0 || cdDisk !== 0 || totalEntriesDisk !== totalEntries) {
    structuralErrors.push('MULTI_DISK_ZIP_UNSUPPORTED');
  }
  if (cdOffset + cdSize > eocdOffset) {
    structuralErrors.push('CENTRAL_DIRECTORY_OUT_OF_BOUNDS');
  }

  const entries = [];
  const seenZipPaths = new Set();
  let ptr = cdOffset;

  for (let idx = 0; idx < totalEntries; idx++) {
    if (ptr + 46 > cdOffset + cdSize) {
      structuralErrors.push(`CD_TRUNCATED_AT_ENTRY_${idx}`);
      break;
    }
    const sig = buf.readUInt32LE(ptr);
    if (sig !== SIG_CD) {
      structuralErrors.push(`INVALID_CD_SIGNATURE_AT_ENTRY_${idx}`);
      break;
    }

    const flags = buf.readUInt16LE(ptr + 8);
    const method = buf.readUInt16LE(ptr + 10);
    const cdCrc32 = buf.readUInt32LE(ptr + 16);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const uncompressedSize = buf.readUInt32LE(ptr + 24);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const externalAttr = buf.readUInt32LE(ptr + 38);
    const lfhOffset = buf.readUInt32LE(ptr + 42);

    const rawName = buf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');
    ptr += 46 + nameLen + extraLen + commentLen;

    const isDirectory = rawName.endsWith('/') || rawName.endsWith('\\') || ((externalAttr & 0x10) !== 0 && uncompressedSize === 0 && rawName.endsWith('/'));
    if (isDirectory) {
      continue;
    }

    const pathCheck = normalizeAndValidatePath(rawName);
    if (!pathCheck.safe) {
      unsafePaths.push({ source: 'ZIP_ENTRY', path: rawName, reason: pathCheck.reason });
    }
    if (seenZipPaths.has(pathCheck.normalized)) {
      duplicateZipPaths.push(pathCheck.normalized);
    }
    seenZipPaths.add(pathCheck.normalized);

    if (lfhOffset + 30 > cdOffset) {
      structuralErrors.push(`LFH_OUT_OF_BOUNDS:${pathCheck.normalized}`);
      continue;
    }
    if (buf.readUInt32LE(lfhOffset) !== SIG_LFH) {
      structuralErrors.push(`INVALID_LFH_SIGNATURE:${pathCheck.normalized}`);
      continue;
    }

    const lfhFlags = buf.readUInt16LE(lfhOffset + 6);
    const lfhCrc32 = buf.readUInt32LE(lfhOffset + 14);
    const lfhNameLen = buf.readUInt16LE(lfhOffset + 26);
    const lfhExtraLen = buf.readUInt16LE(lfhOffset + 28);
    const dataStart = lfhOffset + 30 + lfhNameLen + lfhExtraLen;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > cdOffset) {
      structuralErrors.push(`ENTRY_DATA_OUT_OF_BOUNDS:${pathCheck.normalized}`);
      continue;
    }

    const compPayload = buf.subarray(dataStart, dataEnd);
    let data;
    try {
      if (method === 0) {
        data = Buffer.from(compPayload);
      } else if (method === 8) {
        data = zlib.inflateRawSync(compPayload);
      } else {
        structuralErrors.push(`UNSUPPORTED_COMPRESSION_METHOD_${method}:${pathCheck.normalized}`);
        continue;
      }
    } catch (err) {
      structuralErrors.push(`DECOMPRESSION_FAILED:${pathCheck.normalized}:${err.message}`);
      continue;
    }

    if (data.length !== uncompressedSize) {
      structuralErrors.push(`UNCOMPRESSED_SIZE_HEADER_MISMATCH:${pathCheck.normalized}:${data.length}!=${uncompressedSize}`);
    }

    const hasDataDescriptor = (flags & 0x08) !== 0 || (lfhFlags & 0x08) !== 0;
    if (!hasDataDescriptor && lfhCrc32 !== cdCrc32) {
      crcFailures.push({
        path: pathCheck.normalized,
        reason: 'LFH_VS_CD_CRC_MISMATCH',
        expectedCrc32: cdCrc32 >>> 0,
        lfhCrc32: lfhCrc32 >>> 0,
      });
    }

    const actualCrc32 = zlib.crc32(data) >>> 0;
    if (actualCrc32 !== (cdCrc32 >>> 0)) {
      crcFailures.push({
        path: pathCheck.normalized,
        reason: 'CRC32_MISMATCH',
        expectedCrc32Hex: (cdCrc32 >>> 0).toString(16).padStart(8, '0'),
        actualCrc32Hex: actualCrc32.toString(16).padStart(8, '0'),
      });
    }

    const actualSha256 = crypto.createHash('sha256').update(data).digest('hex');
    entries.push({
      path: pathCheck.normalized,
      rawPath: rawName,
      compressionMethod: method,
      compressedSize,
      uncompressedSize,
      actualBytes: data.length,
      crc32Hex: actualCrc32.toString(16).padStart(8, '0'),
      actualSha256,
      data,
    });
  }

  return {
    structurallyValid: structuralErrors.length === 0,
    structuralErrors,
    crcFailures,
    unsafePaths,
    duplicateZipPaths,
    entries,
  };
}

export function verifyHandoffArchive(zipPath, options = {}) {
  const absPath = path.resolve(zipPath);
  const buf = fs.readFileSync(absPath);
  const archiveSha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const archiveBytes = buf.length;

  const zipRes = parseAndVerifyZipBuffer(buf);
  const entryMap = new Map(zipRes.entries.map(e => [e.path, e]));

  const manifestEntry = entryMap.get('MANIFEST.txt');
  const manifestSyntaxErrors = [];
  const unsafePaths = [...zipRes.unsafePaths];
  const duplicateManifestPaths = [];
  const missingFiles = [];
  const sha256Mismatches = [];
  const byteSizeMismatches = [];
  const unlistedFiles = [];

  let manifestSelfExcluded = false;
  let manifestPresent = Boolean(manifestEntry);
  let manifestEntryCount = 0;
  let manifestShaVerifiedCount = 0;
  let manifestSizeVerifiedCount = 0;
  const manifestPathsSeen = new Set();

  if (!manifestEntry) {
    manifestSyntaxErrors.push('MANIFEST_TXT_MISSING_FROM_ARCHIVE');
  } else {
    const manifestText = manifestEntry.data.toString('utf8');
    const rawLines = manifestText.split(/\r?\n/);
    const nonEmptyLines = rawLines.filter(l => l.length > 0);
    manifestEntryCount = nonEmptyLines.length;
    manifestSelfExcluded = true;

    const lineRegex = /^([0-9a-fA-F]{64})  (\d+)  (.+)$/;
    for (let i = 0; i < nonEmptyLines.length; i++) {
      const line = nonEmptyLines[i];
      const m = line.match(lineRegex);
      if (!m) {
        manifestSyntaxErrors.push({ lineNumber: i + 1, line, reason: 'MALFORMED_MANIFEST_LINE' });
        continue;
      }
      const expectedSha256 = m[1].toLowerCase();
      const expectedBytes = Number(m[2]);
      const rawRelPath = m[3];

      const pathCheck = normalizeAndValidatePath(rawRelPath);
      if (!pathCheck.safe) {
        unsafePaths.push({ source: 'MANIFEST_LINE', lineNumber: i + 1, path: rawRelPath, reason: pathCheck.reason });
        continue;
      }
      const relPath = pathCheck.normalized;

      if (relPath === 'MANIFEST.txt') {
        manifestSelfExcluded = false;
        manifestSyntaxErrors.push({ lineNumber: i + 1, path: relPath, reason: 'MANIFEST_MUST_BE_SELF_EXCLUDED' });
        continue;
      }

      if (manifestPathsSeen.has(relPath)) {
        duplicateManifestPaths.push(relPath);
        continue;
      }
      manifestPathsSeen.add(relPath);

      const zipFile = entryMap.get(relPath);
      if (!zipFile) {
        missingFiles.push(relPath);
        continue;
      }

      if (zipFile.actualSha256 !== expectedSha256) {
        sha256Mismatches.push({ path: relPath, expected: expectedSha256, actual: zipFile.actualSha256 });
      } else {
        manifestShaVerifiedCount++;
      }

      if (zipFile.actualBytes !== expectedBytes) {
        byteSizeMismatches.push({ path: relPath, expected: expectedBytes, actual: zipFile.actualBytes });
      } else {
        manifestSizeVerifiedCount++;
      }
    }

    for (const e of zipRes.entries) {
      if (e.path !== 'MANIFEST.txt' && !manifestPathsSeen.has(e.path)) {
        unlistedFiles.push(e.path);
      }
    }
  }

  const allPassed =
    zipRes.structurallyValid &&
    zipRes.crcFailures.length === 0 &&
    manifestPresent &&
    manifestSelfExcluded &&
    manifestSyntaxErrors.length === 0 &&
    unsafePaths.length === 0 &&
    zipRes.duplicateZipPaths.length === 0 &&
    duplicateManifestPaths.length === 0 &&
    missingFiles.length === 0 &&
    unlistedFiles.length === 0 &&
    sha256Mismatches.length === 0 &&
    byteSizeMismatches.length === 0 &&
    manifestShaVerifiedCount === manifestEntryCount &&
    manifestSizeVerifiedCount === manifestEntryCount;

  const publicEntries = options.includeEntries
    ? zipRes.entries.map(({ data, ...rest }) => rest)
    : undefined;

  return {
    verifiedAt: new Date().toISOString(),
    archivePath: zipPath.replace(/\\/g, '/'),
    archiveSha256,
    archiveBytes,
    status: allPassed ? 'PASS' : 'FAIL',
    zipStructuralValidity: {
      valid: zipRes.structurallyValid,
      totalEntries: zipRes.entries.length,
      errors: zipRes.structuralErrors,
    },
    crcValidity: {
      valid: zipRes.crcFailures.length === 0,
      passedCount: zipRes.entries.length - zipRes.crcFailures.length,
      totalEntries: zipRes.entries.length,
      failures: zipRes.crcFailures,
    },
    manifestValidity: {
      present: manifestPresent,
      selfExcluded: manifestSelfExcluded,
      syntaxValid: manifestSyntaxErrors.length === 0,
      syntaxErrors: manifestSyntaxErrors,
      entryCount: manifestEntryCount,
    },
    sha256Validity: {
      valid: sha256Mismatches.length === 0 && manifestShaVerifiedCount === manifestEntryCount,
      verifiedCount: manifestShaVerifiedCount,
      expectedCount: manifestEntryCount,
      mismatches: sha256Mismatches,
    },
    byteSizeValidity: {
      valid: byteSizeMismatches.length === 0 && manifestSizeVerifiedCount === manifestEntryCount,
      verifiedCount: manifestSizeVerifiedCount,
      expectedCount: manifestEntryCount,
      mismatches: byteSizeMismatches,
    },
    missingFiles,
    unlistedFiles,
    duplicatePaths: {
      zip: zipRes.duplicateZipPaths,
      manifest: duplicateManifestPaths,
    },
    unsafePaths,
    ...(publicEntries ? { entries: publicEntries } : {}),
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node scripts/verify_handoff_archive_hij2_2.mjs <zipPath> [--entries]');
    process.exit(2);
  }
  const includeEntries = process.argv.includes('--entries');
  const result = verifyHandoffArchive(target, { includeEntries });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') process.exit(1);
}
