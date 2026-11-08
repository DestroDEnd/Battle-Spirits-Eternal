/**
 * compiler/overrides/index.js
 * 
 * Override router dispatching explicit deterministic IR by canonical card number.
 */

import { SD01_OVERRIDES } from './SD01.js';
import { BS01_OVERRIDES } from './BS01.js';
import { BS02_OVERRIDES } from './BS02.js';
import { SD02_OVERRIDES } from './SD02.js';
import { BS03_OVERRIDES } from './BS03.js';
import { SD03_OVERRIDES } from './SD03.js';
import { BS04_OVERRIDES } from './BS04.js';
import { BS05_OVERRIDES } from './BS05.js';
import { BS06_OVERRIDES } from './BS06.js';
import { SD06_OVERRIDES } from './SD06.js';
import { BS07_OVERRIDES } from './BS07.js';
import { SD10_OVERRIDES } from './SD10.js';
import { SD11_OVERRIDES } from './SD11.js';
import { BS08_OVERRIDES } from './BS08.js';
import { SD13_OVERRIDES } from './SD13.js';
import { SD14_OVERRIDES } from './SD14.js';
import { BS09_OVERRIDES } from './BS09.js';
import { SD15_OVERRIDES } from './SD15.js';
import { SD16_OVERRIDES } from './SD16.js';
import { BS10_OVERRIDES } from './BS10.js';
import { SD17_OVERRIDES } from './SD17.js';
import { BS11_OVERRIDES } from './BS11.js';
import { SD19_OVERRIDES } from './SD19.js';
import { SD20_OVERRIDES } from './SD20.js';
import { BS12_OVERRIDES } from './BS12.js';
import { SD22_OVERRIDES } from './SD22.js';
import { SD23_OVERRIDES } from './SD23.js';
import { BS13_OVERRIDES } from './BS13.js';
import { SD21_OVERRIDES } from './SD21.js';
import { SD24_OVERRIDES } from './SD24.js';
import { SD25_OVERRIDES } from './SD25.js';
import { BS14_OVERRIDES } from './BS14.js';
import { SD26_OVERRIDES } from './SD26.js';
import { SD27_OVERRIDES } from './SD27.js';
import { SD28_OVERRIDES } from './SD28.js';
import { BS15_OVERRIDES } from './BS15.js';
import { SD29_OVERRIDES } from './SD29.js';
import { SD30_OVERRIDES } from './SD30.js';
import { SD31_OVERRIDES } from './SD31.js';
import { SD32_OVERRIDES } from './SD32.js';
import { SD33_OVERRIDES } from './SD33.js';
import { BS16_OVERRIDES } from './BS16.js';
import { SD34_OVERRIDES } from './SD34.js';
import { SD37_OVERRIDES } from './SD37.js';
import { SD38_OVERRIDES } from './SD38.js';
import { SD39_OVERRIDES } from './SD39.js';
import { BS17_OVERRIDES } from './BS17.js';
import { SD40_OVERRIDES } from './SD40.js';
import { SD41_OVERRIDES } from './SD41.js';
import { SD42_OVERRIDES } from './SD42.js';
import { BS18_OVERRIDES } from './BS18.js';
import { SD43_OVERRIDES } from './SD43.js';
import { SD44_OVERRIDES } from './SD44.js';
import { SD45_OVERRIDES } from './SD45.js';
import { BS19_OVERRIDES } from './BS19.js';
import { SD46_OVERRIDES } from './SD46.js';
import { SD47_OVERRIDES } from './SD47.js';
import { SD48_OVERRIDES } from './SD48.js';
import { SKIPPED_CARDS } from './skipped.js';
import { VANILLA_CARD_NUMBERS } from './vanillas.js';

export { SD01_OVERRIDES, BS01_OVERRIDES, BS02_OVERRIDES, SD02_OVERRIDES, BS03_OVERRIDES, SD03_OVERRIDES, BS04_OVERRIDES, BS05_OVERRIDES, BS06_OVERRIDES, SD06_OVERRIDES, BS07_OVERRIDES, SD10_OVERRIDES, SD11_OVERRIDES, BS08_OVERRIDES, SD13_OVERRIDES, SD14_OVERRIDES, BS09_OVERRIDES, SD15_OVERRIDES, SD16_OVERRIDES, BS10_OVERRIDES, SD17_OVERRIDES, BS11_OVERRIDES, SD19_OVERRIDES, SD20_OVERRIDES, BS12_OVERRIDES, SD22_OVERRIDES, SD23_OVERRIDES, BS13_OVERRIDES, SD21_OVERRIDES, SD24_OVERRIDES, SD25_OVERRIDES, BS14_OVERRIDES, SD26_OVERRIDES, SD27_OVERRIDES, SD28_OVERRIDES, BS15_OVERRIDES, SD29_OVERRIDES, SD30_OVERRIDES, SD31_OVERRIDES, SD32_OVERRIDES, SD33_OVERRIDES, BS16_OVERRIDES, SD34_OVERRIDES, SD37_OVERRIDES, SD38_OVERRIDES, SD39_OVERRIDES, BS17_OVERRIDES, SD40_OVERRIDES, SD41_OVERRIDES, SD42_OVERRIDES, BS18_OVERRIDES, SD43_OVERRIDES, SD44_OVERRIDES, SD45_OVERRIDES, BS19_OVERRIDES, SD46_OVERRIDES, SD47_OVERRIDES, SD48_OVERRIDES, SKIPPED_CARDS, VANILLA_CARD_NUMBERS };

export function getCardOverride(cardNumber, card = null) {
  if (!cardNumber && !card) return null;
  const num = (typeof cardNumber === 'string' && cardNumber.trim().length > 0)
    ? cardNumber.trim()
    : (card && typeof (card.card_number || card.cardNumber || card.id) === 'string'
        ? (card.card_number || card.cardNumber || card.id).trim()
        : null);

  if (!num || typeof num !== 'string') return null;

  if (Object.prototype.hasOwnProperty.call(SD01_OVERRIDES, num)) return SD01_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS01_OVERRIDES, num)) return BS01_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS02_OVERRIDES, num)) return BS02_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD02_OVERRIDES, num)) return SD02_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS03_OVERRIDES, num)) return BS03_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD03_OVERRIDES, num)) return SD03_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS04_OVERRIDES, num)) return BS04_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS05_OVERRIDES, num)) return BS05_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS06_OVERRIDES, num)) return BS06_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD06_OVERRIDES, num)) return SD06_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS07_OVERRIDES, num)) return BS07_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD10_OVERRIDES, num)) return SD10_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD11_OVERRIDES, num)) return SD11_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS08_OVERRIDES, num)) return BS08_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD13_OVERRIDES, num)) return SD13_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD14_OVERRIDES, num)) return SD14_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS09_OVERRIDES, num)) return BS09_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD15_OVERRIDES, num)) return SD15_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD16_OVERRIDES, num)) return SD16_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS10_OVERRIDES, num)) return BS10_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD17_OVERRIDES, num)) return SD17_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS11_OVERRIDES, num)) return BS11_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD19_OVERRIDES, num)) return SD19_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD20_OVERRIDES, num)) return SD20_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS12_OVERRIDES, num)) return BS12_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD22_OVERRIDES, num)) return SD22_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD23_OVERRIDES, num)) return SD23_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS13_OVERRIDES, num)) return BS13_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD21_OVERRIDES, num)) return SD21_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD24_OVERRIDES, num)) return SD24_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD25_OVERRIDES, num)) return SD25_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS14_OVERRIDES, num)) return BS14_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD26_OVERRIDES, num)) return SD26_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD27_OVERRIDES, num)) return SD27_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD28_OVERRIDES, num)) return SD28_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS15_OVERRIDES, num)) return BS15_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD29_OVERRIDES, num)) return SD29_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD30_OVERRIDES, num)) return SD30_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD31_OVERRIDES, num)) return SD31_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD32_OVERRIDES, num)) return SD32_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD33_OVERRIDES, num)) return SD33_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS16_OVERRIDES, num)) return BS16_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD34_OVERRIDES, num)) return SD34_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD37_OVERRIDES, num)) return SD37_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD38_OVERRIDES, num)) return SD38_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD39_OVERRIDES, num)) return SD39_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS17_OVERRIDES, num)) return BS17_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD40_OVERRIDES, num)) return SD40_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD41_OVERRIDES, num)) return SD41_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD42_OVERRIDES, num)) return SD42_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS18_OVERRIDES, num)) return BS18_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD43_OVERRIDES, num)) return SD43_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD44_OVERRIDES, num)) return SD44_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD45_OVERRIDES, num)) return SD45_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(BS19_OVERRIDES, num)) return BS19_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD46_OVERRIDES, num)) return SD46_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD47_OVERRIDES, num)) return SD47_OVERRIDES[num];
  if (Object.prototype.hasOwnProperty.call(SD48_OVERRIDES, num)) return SD48_OVERRIDES[num];

  if (typeof VANILLA_CARD_NUMBERS !== 'undefined' && VANILLA_CARD_NUMBERS.has(num)) {
    return { cardNumber: num, name: (card && card.name) || num, isVanilla: true, isFullySupported: true, compiledClausesCount: 0, unsupportedClausesCount: 0, abilities: [], keywords: [] };
  }

  if (card && typeof card.id === 'string' && card.id.trim().length > 0) {
    const cardId = card.id.trim();
    if (Object.prototype.hasOwnProperty.call(SD01_OVERRIDES, cardId)) return SD01_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS01_OVERRIDES, cardId)) return BS01_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS02_OVERRIDES, cardId)) return BS02_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD02_OVERRIDES, cardId)) return SD02_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS03_OVERRIDES, cardId)) return BS03_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD03_OVERRIDES, cardId)) return SD03_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS04_OVERRIDES, cardId)) return BS04_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS05_OVERRIDES, cardId)) return BS05_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS06_OVERRIDES, cardId)) return BS06_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD06_OVERRIDES, cardId)) return SD06_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS07_OVERRIDES, cardId)) return BS07_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD10_OVERRIDES, cardId)) return SD10_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD11_OVERRIDES, cardId)) return SD11_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS08_OVERRIDES, cardId)) return BS08_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD13_OVERRIDES, cardId)) return SD13_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD14_OVERRIDES, cardId)) return SD14_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS09_OVERRIDES, cardId)) return BS09_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD15_OVERRIDES, cardId)) return SD15_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD16_OVERRIDES, cardId)) return SD16_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS10_OVERRIDES, cardId)) return BS10_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD17_OVERRIDES, cardId)) return SD17_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS11_OVERRIDES, cardId)) return BS11_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD19_OVERRIDES, cardId)) return SD19_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD20_OVERRIDES, cardId)) return SD20_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS12_OVERRIDES, cardId)) return BS12_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD22_OVERRIDES, cardId)) return SD22_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD23_OVERRIDES, cardId)) return SD23_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS13_OVERRIDES, cardId)) return BS13_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD21_OVERRIDES, cardId)) return SD21_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD24_OVERRIDES, cardId)) return SD24_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD25_OVERRIDES, cardId)) return SD25_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS14_OVERRIDES, cardId)) return BS14_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD26_OVERRIDES, cardId)) return SD26_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD27_OVERRIDES, cardId)) return SD27_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD28_OVERRIDES, cardId)) return SD28_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS15_OVERRIDES, cardId)) return BS15_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD29_OVERRIDES, cardId)) return SD29_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD30_OVERRIDES, cardId)) return SD30_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD31_OVERRIDES, cardId)) return SD31_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD32_OVERRIDES, cardId)) return SD32_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD33_OVERRIDES, cardId)) return SD33_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS16_OVERRIDES, cardId)) return BS16_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD34_OVERRIDES, cardId)) return SD34_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD37_OVERRIDES, cardId)) return SD37_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD38_OVERRIDES, cardId)) return SD38_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD39_OVERRIDES, cardId)) return SD39_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS17_OVERRIDES, cardId)) return BS17_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD40_OVERRIDES, cardId)) return SD40_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD41_OVERRIDES, cardId)) return SD41_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD42_OVERRIDES, cardId)) return SD42_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS18_OVERRIDES, cardId)) return BS18_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD43_OVERRIDES, cardId)) return SD43_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD44_OVERRIDES, cardId)) return SD44_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD45_OVERRIDES, cardId)) return SD45_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(BS19_OVERRIDES, cardId)) return BS19_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD46_OVERRIDES, cardId)) return SD46_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD47_OVERRIDES, cardId)) return SD47_OVERRIDES[cardId];
    if (Object.prototype.hasOwnProperty.call(SD48_OVERRIDES, cardId)) return SD48_OVERRIDES[cardId];

    if (typeof VANILLA_CARD_NUMBERS !== 'undefined' && VANILLA_CARD_NUMBERS.has(cardId)) {
      return { cardNumber: cardId, name: card.name || cardId, isVanilla: true, isFullySupported: true, compiledClausesCount: 0, unsupportedClausesCount: 0, abilities: [], keywords: [] };
    }
  }

  return null;
}
