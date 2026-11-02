/**
 * engine/keywords/index.js
 * 
 * Central Keyword Registry initialization.
 * Unifies Wave 1 (Core), Wave 2 (Modern), and Wave 3 (Triggers & Collab) keywords.
 */

import { KeywordRegistry } from './registry.js';
import { registerWave1Keywords } from './wave1.js';
import { registerWave2Keywords } from './wave2.js';
import { registerWave3Keywords } from './wave3.js';

export function createDefaultKeywordRegistry() {
  const registry = new KeywordRegistry();
  registerWave1Keywords(registry);
  registerWave2Keywords(registry);
  registerWave3Keywords(registry);
  return registry;
}

export * from './registry.js';
export * from './wave1.js';
export * from './wave2.js';
export * from './wave3.js';
