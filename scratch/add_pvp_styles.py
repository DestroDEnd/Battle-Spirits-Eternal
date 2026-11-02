pvp_styles = """
/* ══════════════════════════════════════════════════════════════════
   🌐 ONLINE 1v1 MULTIPLAYER & 8-DIGIT DUELIST ID STYLES
   ══════════════════════════════════════════════════════════════════ */

.arena-mode-switch {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin: 1rem 0 1.5rem 0;
}
.arena-mode-tab {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #94a3b8;
  padding: 0.65rem 1.4rem;
  border-radius: 9999px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}
.arena-mode-tab:hover {
  background: rgba(51, 65, 85, 0.9);
  color: #f1f5f9;
  border-color: rgba(148, 163, 184, 0.5);
}
.arena-mode-tab.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25));
  border-color: #60a5fa;
  color: #93c5fd;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.online-pvp-lobby {
  display: none;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(26, 16, 40, 0.95));
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 1.25rem;
  padding: 1.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6), 0 0 25px rgba(59, 130, 246, 0.15);
}
.online-pvp-lobby.active {
  display: block;
}

.pvp-header-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 800px) {
  .pvp-header-grid { grid-template-columns: 1fr; }
}

.duelist-id-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.duelist-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.duelist-id-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.35rem;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 2px;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.35rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(251, 191, 36, 0.3);
}
.btn-copy-id {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #93c5fd;
  border-radius: 0.4rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.15s;
}
.btn-copy-id:hover {
  background: #3b82f6;
  color: #fff;
}

.duelist-tracker-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
}
.tracker-input-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.tracker-input {
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0.5rem;
  padding: 0.5rem 0.85rem;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  letter-spacing: 1px;
}
.tracker-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
}
.btn-track-submit {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  border: none;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
}
.tracker-result-box {
  margin-top: 0.85rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  display: none;
}

.pvp-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
@media (max-width: 800px) {
  .pvp-actions-grid { grid-template-columns: 1fr; }
}

.pvp-action-box {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.btn-pvp-host {
  background: linear-gradient(135deg, #ef4444, #f97316);
  border: none;
  color: #fff;
  padding: 0.85rem 1.5rem;
  border-radius: 0.6rem;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);
  transition: all 0.2s;
  width: 100%;
  margin-top: 1rem;
}
.btn-pvp-host:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
}

.btn-pvp-join {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  border: none;
  color: #fff;
  padding: 0.85rem 1.5rem;
  border-radius: 0.6rem;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
  transition: all 0.2s;
  width: 100%;
  margin-top: 1rem;
}
.btn-pvp-join:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.pvp-waiting-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: none;
  align-items: center;
  justify-content: center;
}
.pvp-waiting-content {
  background: #0f172a;
  border: 1px solid #3b82f6;
  border-radius: 1.25rem;
  padding: 2.25rem;
  width: 90%;
  max-width: 480px;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.25);
}
.room-code-display {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.25rem;
  font-weight: 900;
  color: #60a5fa;
  letter-spacing: 4px;
  margin: 1.25rem 0;
  padding: 0.75rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px dashed rgba(96, 165, 250, 0.4);
  border-radius: 0.75rem;
}
"""

with open('styles.css', 'r', encoding='utf-8') as f:
    orig = f.read()

if 'ONLINE 1v1 MULTIPLAYER & 8-DIGIT DUELIST ID STYLES' not in orig:
    with open('styles.css', 'a', encoding='utf-8') as f:
        f.write(pvp_styles)
    print("Appended online PvP styles to styles.css!")
else:
    print("Styles already present in styles.css.")
