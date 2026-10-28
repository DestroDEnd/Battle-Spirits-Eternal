const fs = require('fs');

const hexCss = `

/* ==========================================================================
   ANIME & GAME ACCURATE HEXAGONAL CRYSTALLINE CORES & SOUL CORE
   ========================================================================== */

.hex-core-svg {
  display: inline-block;
  vertical-align: middle;
  overflow: visible;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
}

/* Regular Hexagonal Blue / Cyan Crystal Core */
.hex-blue-core {
  filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}
.hex-blue-core:hover {
  transform: scale(1.15) translateY(-1px);
  filter: drop-shadow(0 0 9px rgba(56, 189, 248, 1)) drop-shadow(0 0 14px rgba(186, 230, 253, 0.8));
}

/* Life Hexagonal Amber / Golden Crystal Core */
.hex-life-active {
  filter: drop-shadow(0 0 7px rgba(245, 158, 11, 0.85)) drop-shadow(0 0 12px rgba(251, 191, 36, 0.55));
  animation: hexLifePulse 2.8s ease-in-out infinite alternate;
}
.hex-life-active:hover {
  transform: scale(1.22) translateY(-2px);
  filter: drop-shadow(0 0 12px rgba(245, 158, 11, 1)) drop-shadow(0 0 20px rgba(254, 240, 138, 0.9));
}

.hex-life-empty {
  opacity: 0.28;
  filter: grayscale(0.85) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

/* Soul Core: Flaming Ruby Imperial Hexagonal Core */
.hex-soul-core {
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.9)) drop-shadow(0 0 16px rgba(245, 158, 11, 0.65));
  animation: hexSoulGlow 2.2s ease-in-out infinite alternate;
}
.hex-soul-core:hover {
  transform: scale(1.25) translateY(-2px) rotate(6deg);
  filter: drop-shadow(0 0 14px rgba(239, 68, 68, 1)) drop-shadow(0 0 24px rgba(245, 158, 11, 0.9));
}

/* Life Gem Container & Hex Sockets */
.life-hex-gem {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 1px;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.life-hex-gem:hover {
  transform: scale(1.15) translateY(-2px);
}

/* Floating Void Hexagonal Cores */
.void-hex-core {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: void-hex-float 3s ease-in-out infinite;
  transition: transform 0.3s ease;
}
.void-hex-core:hover {
  transform: scale(1.3) translateY(-4px);
}

/* Icons inside Pills & Buttons */
.hex-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  vertical-align: middle;
}
.btn-hex-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  vertical-align: middle;
}

.fsc-hex-group {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 800;
}
.fsc-core-num {
  font-size: 0.8rem;
  font-weight: 900;
  color: #38bdf8;
}
.fsc-sc-tag {
  font-size: 0.65rem;
  font-weight: 900;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 3px;
  padding: 0 3px;
  margin-left: 1px;
}

/* Animations */
@keyframes hexLifePulse {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.75)) drop-shadow(0 0 10px rgba(251, 191, 36, 0.45));
  }
  100% {
    transform: scale(1.07);
    filter: drop-shadow(0 0 10px rgba(245, 158, 11, 1)) drop-shadow(0 0 18px rgba(251, 191, 36, 0.85));
  }
}

@keyframes hexSoulGlow {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 7px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 14px rgba(245, 158, 11, 0.5));
  }
  100% {
    transform: scale(1.08) translateY(-1px);
    filter: drop-shadow(0 0 12px rgba(239, 68, 68, 1)) drop-shadow(0 0 22px rgba(245, 158, 11, 0.9));
  }
}

@keyframes void-hex-float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-7px) rotate(4deg);
  }
}
`;

fs.appendFileSync('styles.css', hexCss, 'utf8');
console.log('[OK] Hexagonal core styles appended to styles.css!');
