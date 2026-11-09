/**
 * engine/cards/index.js
 * 
 * Central aggregator for all deterministic per-card explicit implementations.
 */

import { CardRegistry, PerCardRegistry } from './registry.js';
import './bundle.js';
import './sets/sd65_four_demon_lords.js';
import './sets/standard_and_custom_decks.js';
import './sets/soul_drive_cards.js';
import './sets/bs14_cards.js';
import './sets/bs15_cards.js';
import './sets/bs16_cards.js';
import './sets/bs17_cards.js';
import './sets/bs18_cards.js';
import './sets/sd06_sd11_heroes_promos_cards.js';
import './sets/bs19_cards.js';
import './sets/bs20_cards.js';
import './sets/bs21_cards.js';
import './sets/bs22_cards.js';
import './sets/bs23_cards.js';
import './sets/sd12_sd17_swordblade_promos_cards.js';

export { CardRegistry, PerCardRegistry };
export default PerCardRegistry;
