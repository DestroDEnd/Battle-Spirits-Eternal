/**
 * engine/keywords/index.js
 * 
 * Central Keyword Registry initialization.
 * Unifies Wave 1 (Core), Wave 2 (Modern), Wave 3 (Triggers & Collab),
 * Wave 4 (Advanced Color), Wave 5 (Diva & Collab), and Wave 6 (2026 Cross-Format).
 */

import { KeywordRegistry } from './registry.js';
import { registerWave1Keywords } from './wave1.js';
import { registerWave2Keywords } from './wave2.js';
import { registerWave3Keywords } from './wave3.js';
import { registerWave4Keywords } from './wave4.js';
import { registerWave5Keywords } from './wave5.js';
import { registerWave6Keywords } from './wave6.js';

export function createDefaultKeywordRegistry() {
  const registry = new KeywordRegistry();
  registerWave1Keywords(registry);
  registerWave2Keywords(registry);
  registerWave3Keywords(registry);
  registerWave4Keywords(registry);
  registerWave5Keywords(registry);
  registerWave6Keywords(registry);
  return registry;
}

export * from './registry.js';
export * from './wave1.js';
export * from './wave2.js';
export * from './wave3.js';
export * from './wave4.js';
export * from './wave5.js';
export * from './wave6.js';
