import sys
sys.stdout.reconfigure(encoding='utf-8')

avatar_css = """

/* ══════════════════ DUELIST NAVBAR AVATAR & DROPDOWN ══════════════════ */
.nav-avatar-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.nav-avatar-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 9999px;
  padding: 0.25rem 0.75rem 0.25rem 0.35rem;
  color: #f1f5f9;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
}

.nav-avatar-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: #60a5fa;
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}

.nav-avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.nav-avatar-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-avatar-name {
  max-width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #f8fafc;
}

.nav-avatar-caret {
  font-size: 0.75rem;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.nav-avatar-wrapper.open .nav-avatar-caret {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.duelist-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 270px;
  background: rgba(15, 23, 42, 0.97);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 14px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(59, 130, 246, 0.15);
  padding: 0.75rem;
  z-index: 999999;
  display: none;
  animation: ddFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.nav-avatar-wrapper.open .duelist-dropdown {
  display: block;
}

@keyframes ddFadeIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.dd-header {
  padding: 0.5rem 0.5rem 0.75rem 0.5rem;
}

.dd-avatar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dd-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.dd-avatar-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dd-user-meta {
  overflow: hidden;
  flex: 1;
}

.dd-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.2rem;
}

.dd-duelist-id {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-family: 'JetBrains Mono', monospace;
  color: #93c5fd;
  font-weight: 700;
  background: rgba(59, 130, 246, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.dd-btn-copy {
  background: transparent;
  border: none;
  color: #93c5fd;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
}

.dd-btn-copy:hover {
  color: #fff;
}

.dd-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0.35rem 0;
}

.dd-menu {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dd-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.dd-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  transform: translateX(2px);
}

.dd-icon {
  font-size: 1.05rem;
}

.dd-badge {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 9999px;
  background: rgba(139, 92, 246, 0.3);
  color: #c084fc;
}

.dd-item.dd-logout {
  color: #f87171;
}

.dd-item.dd-logout:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

/* Modals for Avatar & Friends */
.bse-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 9999999;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.bse-modal-overlay.open {
  display: flex;
}

.bse-modal-card {
  background: #0f172a;
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 16px;
  padding: 1.75rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.2);
  position: relative;
  animation: bseModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes bseModalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.bse-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.bse-modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bse-modal-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
}

.bse-modal-close:hover {
  color: #fff;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.avatar-option-btn {
  aspect-ratio: 1;
  background: rgba(30, 41, 59, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.avatar-option-btn:hover {
  border-color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  transform: scale(1.05);
}

.avatar-option-btn.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.avatar-option-emoji {
  font-size: 1.8rem;
}

.avatar-option-label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.friend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.75rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.friend-avatar {
  font-size: 1.3rem;
}

.friend-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f1f5f9;
}

.friend-id {
  font-size: 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  color: #94a3b8;
}

.friend-actions {
  display: flex;
  gap: 0.35rem;
}

.btn-friend-challenge {
  background: #8b5cf6;
  color: #fff;
  border: none;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-friend-challenge:hover {
  background: #7c3aed;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
}

.btn-friend-del {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.35rem;
}

.btn-friend-del:hover {
  color: #ef4444;
}
"""

with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(avatar_css)
print('Appended avatar & dropdown styles to styles.css!')
