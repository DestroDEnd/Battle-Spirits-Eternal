/**
 * engine/cards/index.js
 * 
 * Central aggregator for all deterministic per-card explicit implementations.
 */

import { CardRegistry, PerCardRegistry } from './registry.js';
import './bundle.js';
import './sets/sd65_four_demon_lords.js';
import './sets/standard_and_custom_decks.js';

export { CardRegistry, PerCardRegistry };
export default PerCardRegistry;
