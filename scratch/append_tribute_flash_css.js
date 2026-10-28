const fs = require('fs');

const tributeFlashCss = `

/* ==========================================================================
   TRIBUTE SUMMON & FLASH TIMING STYLES
   ========================================================================== */

/* Flash Timing Active Pill */
.flash-window-indicator {
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(245, 158, 11, 0.25));
  border: 1px solid #eab308;
  color: #fef08a;
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.35);
  letter-spacing: 0.5px;
  animation: flash-pill-pulse 1.8s infinite alternate;
}
@keyframes flash-pill-pulse {
  from { box-shadow: 0 0 6px rgba(234, 179, 8, 0.3); }
  to { box-shadow: 0 0 14px rgba(234, 179, 8, 0.75); }
}

/* Flash Spells Container in Block Modal */
.flash-spells-container {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(234, 179, 8, 0.35);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.85rem;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
}
.flash-spells-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #fef08a;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.flash-spell-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.4rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(234, 179, 8, 0.4);
  border-radius: 0.5rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}
.flash-spell-btn:hover {
  border-color: #facc15;
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(15, 23, 42, 0.95));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.35);
}
.fsb-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fsb-name {
  font-size: 0.82rem;
  font-weight: 800;
  color: #fef08a;
}
.fsb-desc {
  font-size: 0.72rem;
  color: #cbd5e1;
}
.fsb-cost {
  font-size: 0.75rem;
  font-weight: 900;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 0.35rem;
  white-space: nowrap;
}

/* Tribute Styles */
.kw-tribute {
  background: linear-gradient(135deg, #b45309, #d97706);
  border-color: #f59e0b;
  color: #fff;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}
.btn-quick-summon.is-blocked {
  opacity: 0.65;
  background: rgba(180, 83, 9, 0.35) !important;
  border-color: #b45309 !important;
  color: #fde68a !important;
  cursor: not-allowed !important;
}
.tribute-choice-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 0.65rem;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tribute-choice-card:hover {
  border-color: #fbbf24;
  background: rgba(245, 158, 11, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
}
.tcc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tcc-name {
  font-size: 0.85rem;
  font-weight: 800;
  color: #fef08a;
}
.tcc-meta {
  font-size: 0.72rem;
  color: #94a3b8;
}
.tcc-btn {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.35rem 0.75rem;
  background: linear-gradient(135deg, #d97706, #b45309);
  border: none;
  border-radius: 0.4rem;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(180, 83, 9, 0.4);
}
.tcc-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.6);
}
`;

fs.appendFileSync('styles.css', tributeFlashCss, 'utf8');
console.log('[OK] Appended Tribute & Flash timing styles to styles.css');
