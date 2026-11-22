import fs from 'node:fs';
import path from 'node:path';

const sourceMatrixPath = path.resolve('reports/master_corrective_closure/card_effect_support_matrix.json');
const matrix = JSON.parse(fs.readFileSync(sourceMatrixPath, 'utf8'));

// Verify totals
const counts = {
  FULLY_SUPPORTED: 0,
  PARTIALLY_SUPPORTED: 0,
  VANILLA: 0,
  UNSUPPORTED: 0
};

for (const card of matrix.cards) {
  counts[card.classification] = (counts[card.classification] || 0) + 1;
}

console.log('Classifications:', counts);
console.log('Total Cards:', matrix.cards.length);

const phase4dMatrix = {
  metadata: {
    generatedAt: new Date().toISOString(),
    phase: 'Phase 4D',
    standard: 'Evidence-Derived Card Effect Support Matrix',
    totalUniqueCards: matrix.cards.length,
    totalShardFiles: 514,
    classificationCounts: counts,
    classificationBreakdown: counts,
    overallSupportRate: ((counts.FULLY_SUPPORTED / matrix.cards.length) * 100).toFixed(2) + '%'
  },
  cards: matrix.cards
};

fs.writeFileSync('reports/phase4d/card_effect_support_matrix.json', JSON.stringify(phase4dMatrix, null, 2));
console.log('Saved reports/phase4d/card_effect_support_matrix.json');
