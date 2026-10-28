const fs = require('fs');

const coinCss = `

/* ==========================================================================
   3D COIN TOSS (FIRST TURN DETERMINATION) STYLES
   ========================================================================== */

.coin-modal-card {
  max-width: 440px !important;
  text-align: center !important;
  border-color: rgba(245, 158, 11, 0.45) !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.25) !important;
}

.coin-stage {
  perspective: 1000px;
  width: 140px;
  height: 140px;
  margin: 0.5rem auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coin-3d-disc {
  width: 120px;
  height: 120px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.coin-3d-disc.is-flipping {
  animation: coin-flip-spin 1.4s ease-in-out forwards;
}

.coin-3d-disc.lands-heads {
  transform: rotateY(0deg);
}

.coin-3d-disc.lands-tails {
  transform: rotateY(180deg);
}

.coin-face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #f59e0b;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.4), inset 0 0 12px rgba(254, 240, 138, 0.4);
}

.coin-face-heads {
  background: radial-gradient(circle at 35% 35%, #1e40af, #0f172a);
  transform: rotateY(0deg);
}

.coin-face-tails {
  background: radial-gradient(circle at 35% 35%, #991b1b, #450a0a);
  transform: rotateY(180deg);
}

.coin-inner-ring {
  width: 85%;
  height: 85%;
  border-radius: 50%;
  border: 1px dashed rgba(254, 240, 138, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.coin-crest {
  font-size: 1.8rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
}

.coin-label {
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 1px;
  color: #fef08a;
  text-transform: uppercase;
}

.coin-sub {
  font-size: 0.55rem;
  font-weight: 800;
  color: #bae6fd;
}

.coin-result-banner {
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  animation: result-fade-up 0.4s ease-out;
}

.coin-result-banner.heads {
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.35), rgba(15, 23, 42, 0.85));
  border: 1px solid #38bdf8;
  color: #bae6fd;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
}

.coin-result-banner.tails {
  background: linear-gradient(135deg, rgba(153, 27, 27, 0.35), rgba(69, 10, 10, 0.85));
  border: 1px solid #ef4444;
  color: #fca5a5;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.35);
}

.crb-icon {
  font-size: 1.6rem;
  margin-bottom: 0.2rem;
}

.crb-title {
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  margin-bottom: 0.2rem;
}

.crb-sub {
  font-size: 0.75rem;
  opacity: 0.85;
}

.coin-actions-row {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn-coin-flip {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  font-weight: 900;
  font-size: 0.95rem;
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(245, 158, 11, 0.5);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-coin-flip:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.8);
}

.btn-coin-flip:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn-coin-proceed {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-weight: 900;
  font-size: 0.95rem;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.5);
  animation: pulse-proceed 1.2s infinite alternate;
}

@keyframes coin-flip-spin {
  0% { transform: rotateY(0deg) scale(1) translateY(0); }
  30% { transform: rotateY(720deg) scale(1.3) translateY(-30px); }
  60% { transform: rotateY(1440deg) scale(1.3) translateY(-30px); }
  100% { transform: rotateY(2160deg) scale(1) translateY(0); }
}

@keyframes result-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-proceed {
  from { transform: scale(1); box-shadow: 0 4px 18px rgba(16, 185, 129, 0.5); }
  to { transform: scale(1.05); box-shadow: 0 8px 26px rgba(16, 185, 129, 0.85); }
}
`;

fs.appendFileSync('styles.css', coinCss, 'utf8');
console.log('[OK] Appended 3D Coin Toss CSS to styles.css');
