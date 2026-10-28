with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

target = """.std-decks-section {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(10, 15, 26, 0.95) 100%);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
}

.std-decks-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
}

.std-decks-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.3rem 0.85rem;
  border-radius: 9999px;
  width: fit-content;
  margin-bottom: 0.35rem;
}

.std-decks-title {
  font-size: 1.65rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
}

.std-decks-sub {
  font-size: 0.92rem;
  color: #94a3b8;
  max-width: 680px;
  line-height: 1.5;
}

.std-decks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  width: 100%;
}

.std-deck-card {
  position: relative;
  background: rgba(20, 29, 47, 0.8);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.85rem;
  transition: all 0.25s ease;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.std-deck-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.7);
}

/* Color specific borders and glows */
.card-color-red { border-color: rgba(239, 68, 68, 0.35); }
.card-color-red:hover { border-color: rgba(239, 68, 68, 0.7); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.25); }

.card-color-purple { border-color: rgba(168, 85, 247, 0.35); }
.card-color-purple:hover { border-color: rgba(168, 85, 247, 0.7); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.25); }

.card-color-green { border-color: rgba(34, 197, 94, 0.35); }
.card-color-green:hover { border-color: rgba(34, 197, 94, 0.7); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(34, 197, 94, 0.25); }

.card-color-white { border-color: rgba(226, 232, 240, 0.35); }
.card-color-white:hover { border-color: rgba(226, 232, 240, 0.7); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 255, 255, 0.2); }

.card-color-yellow { border-color: rgba(234, 179, 8, 0.35); }
.card-color-yellow:hover { border-color: rgba(234, 179, 8, 0.7); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(234, 179, 8, 0.25); }

.card-color-blue { border-color: rgba(59, 130, 246, 0.35); }
.card-color-blue:hover { border-color: rgba(59, 130, 246, 0.7); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.25); }

.std-deck-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.std-deck-icon {
  font-size: 1.35rem;
}

.std-deck-tag {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

.tag-red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); }
.tag-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); }
.tag-green { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); }
.tag-white { background: rgba(255, 255, 255, 0.15); color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.3); }
.tag-yellow { background: rgba(234, 179, 8, 0.15); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.35); }
.tag-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35); }

.std-deck-count {
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
}

.std-deck-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
}

.std-deck-desc {
  font-size: 0.82rem;
  color: #cbd5e1;
  line-height: 1.5;
  min-height: 48px;
}

.std-deck-aces {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.2rem;
}

.ace-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.18rem 0.5rem;
  border-radius: 0.35rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
}

.std-deck-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-load-std {
  flex: 1;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  font-family: var(--font);
  font-size: 0.84rem;
  font-weight: 800;
  padding: 0.55rem 0.75rem;
  border: none;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-load-std:hover {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.45);
  transform: translateY(-1px);
}

.btn-preview-std {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  font-family: var(--font);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.55rem 0.75rem;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-preview-std:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}"""

replacement = """/* ═══════════════ COMPACT STANDARD COLOR DECKS (6 REALMS) ═══════════════ */
.std-decks-section {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 15, 26, 0.9) 100%);
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 0.85rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  transition: all 0.25s ease;
}

.std-decks-section.is-collapsed {
  gap: 0;
  padding: 0.55rem 0.9rem;
}

.std-decks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.std-decks-header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.std-decks-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  width: fit-content;
}

.std-decks-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
  margin: 0;
}

.std-decks-sub {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
}

.std-decks-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Quick realm chips when collapsed */
.std-header-chips {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.chip-btn {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.18s ease;
}

.chip-btn:hover {
  transform: translateY(-1px);
}

.chip-red { border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }
.chip-red:hover { background: rgba(239, 68, 68, 0.25); }
.chip-purple { border-color: rgba(168, 85, 247, 0.4); color: #d8b4fe; }
.chip-purple:hover { background: rgba(168, 85, 247, 0.25); }
.chip-green { border-color: rgba(34, 197, 94, 0.4); color: #86efac; }
.chip-green:hover { background: rgba(34, 197, 94, 0.25); }
.chip-white { border-color: rgba(226, 232, 240, 0.4); color: #f8fafc; }
.chip-white:hover { background: rgba(255, 255, 255, 0.2); }
.chip-yellow { border-color: rgba(234, 179, 8, 0.4); color: #fde047; }
.chip-yellow:hover { background: rgba(234, 179, 8, 0.25); }
.chip-blue { border-color: rgba(59, 130, 246, 0.4); color: #93c5fd; }
.chip-blue:hover { background: rgba(59, 130, 246, 0.25); }

.btn-std-toggle {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #cbd5e1;
  font-family: var(--font);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}

.btn-std-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-color: rgba(245, 158, 11, 0.45);
}

/* 6-Column Compact Grid */
.std-decks-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.65rem;
  width: 100%;
}

.std-decks-section.is-collapsed .std-decks-grid {
  display: none !important;
}

.std-deck-card {
  position: relative;
  background: rgba(20, 29, 47, 0.85);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4rem;
  transition: all 0.2s ease;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

.std-deck-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

/* Color specific borders and glows */
.card-color-red { border-color: rgba(239, 68, 68, 0.35); }
.card-color-red:hover { border-color: rgba(239, 68, 68, 0.7); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(239, 68, 68, 0.25); }

.card-color-purple { border-color: rgba(168, 85, 247, 0.35); }
.card-color-purple:hover { border-color: rgba(168, 85, 247, 0.7); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(168, 85, 247, 0.25); }

.card-color-green { border-color: rgba(34, 197, 94, 0.35); }
.card-color-green:hover { border-color: rgba(34, 197, 94, 0.7); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(34, 197, 94, 0.25); }

.card-color-white { border-color: rgba(226, 232, 240, 0.35); }
.card-color-white:hover { border-color: rgba(226, 232, 240, 0.7); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 255, 255, 0.2); }

.card-color-yellow { border-color: rgba(234, 179, 8, 0.35); }
.card-color-yellow:hover { border-color: rgba(234, 179, 8, 0.7); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(234, 179, 8, 0.25); }

.card-color-blue { border-color: rgba(59, 130, 246, 0.35); }
.card-color-blue:hover { border-color: rgba(59, 130, 246, 0.7); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(59, 130, 246, 0.25); }

.std-deck-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.std-deck-icon {
  font-size: 1.05rem;
  line-height: 1;
}

.std-deck-tag {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); }
.tag-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); }
.tag-green { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); }
.tag-white { background: rgba(255, 255, 255, 0.15); color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.3); }
.tag-yellow { background: rgba(234, 179, 8, 0.15); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.35); }
.tag-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35); }

.std-deck-count {
  font-family: var(--mono);
  font-size: 0.68rem;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(0, 0, 0, 0.45);
  padding: 0.1rem 0.35rem;
  border-radius: 0.35rem;
  line-height: 1;
}

.std-deck-name {
  font-size: 0.84rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
  margin: 0;
  min-height: 2.1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.std-deck-aces {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0;
}

.ace-pill {
  font-size: 0.64rem;
  font-weight: 700;
  padding: 0.12rem 0.4rem;
  border-radius: 0.3rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  white-space: nowrap;
}

.std-deck-actions {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.2rem;
}

.btn-load-std {
  flex: 1;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  font-family: var(--font);
  font-size: 0.74rem;
  font-weight: 800;
  padding: 0.38rem 0.5rem;
  border: none;
  border-radius: 0.45rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  text-align: center;
}

.btn-load-std:hover {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.45);
  transform: translateY(-1px);
}

.btn-preview-std {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  font-family: var(--font);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.38rem 0.45rem;
  border-radius: 0.45rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-preview-std:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}"""

if target not in css:
    print('Error: target not found in styles.css')
    exit(1)

css = css.replace(target, replacement, 1)

# Also update responsive media query for std-decks-grid
old_media = """@media (max-width: 1080px) {
  .std-decks-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 650px) {
  .std-decks-grid { grid-template-columns: 1fr; }
  .std-decks-section { padding: 1.25rem; }
}"""

new_media = """@media (max-width: 1200px) {
  .std-decks-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .std-decks-grid { grid-template-columns: repeat(2, 1fr); }
  .std-decks-sub { display: none; }
}

@media (max-width: 480px) {
  .std-decks-grid { grid-template-columns: 1fr; }
  .std-decks-section { padding: 0.65rem 0.75rem; }
}"""

if old_media in css:
    css = css.replace(old_media, new_media, 1)

with open('styles.css', 'wb') as f:
    f.write(css.encode('utf-8'))

print('styles.css updated with compact styling!')
