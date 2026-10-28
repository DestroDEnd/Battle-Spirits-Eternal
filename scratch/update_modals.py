import re

files = ['index.html', 'browse.html', 'deck.html', 'family.html', 'sets.html']

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()

    # Match <div class="modal-overlay" id="cardModal" ...> ... </div> (the card detail modal)
    # Specifically up to the closing </div> of modal-overlay
    modal_pattern = re.compile(r'<div class="modal-overlay" id="cardModal"[\s\S]*?<!-- ════════════════ DECK IMPORT MODAL', re.DOTALL)
    m = modal_pattern.search(c)
    if not m:
        # For files without DECK IMPORT MODAL or slightly different comment
        modal_pattern = re.compile(r'<div class="modal-overlay" id="cardModal"[\s\S]*?</div>\s*</div>\s*(?:<!--|$)', re.DOTALL)
        m = modal_pattern.search(c)

    if not m:
        print(f"Warning: cardModal not found in {fname}")
        continue

    # Let's inspect modal-box inside cardModal
    # 1. Add floating prev arrow right inside <div class="modal-overlay" id="cardModal"...>
    # 2. Add counter pill right after <button class="modal-close"...>
    # 3. Add sub prev/next inside modal-actions
    # 4. Add floating next arrow right before </div> of modal-overlay

    # Specific replacement:
    # Look for `<div class="modal-overlay" id="cardModal" onclick="closeModalBg(event)">`
    c = c.replace(
        '<div class="modal-overlay" id="cardModal" onclick="closeModalBg(event)">\n  <div class="modal-box">',
        '''<div class="modal-overlay" id="cardModal" onclick="closeModalBg(event)">
  <!-- Floating Chevron Nav: Previous Card -->
  <button class="modal-nav-arrow modal-nav-prev" id="modalPrevBtn" onclick="event.stopPropagation(); navigateCardModal(-1)" title="Previous Card (← Left Arrow)" style="display:none;">
    <span>‹</span>
  </button>

  <div class="modal-box">'''
    )
    c = c.replace(
        '<div class="modal-overlay" id="cardModal" onclick="closeModalBg(event)">\r\n  <div class="modal-box">',
        '''<div class="modal-overlay" id="cardModal" onclick="closeModalBg(event)">\r\n  <!-- Floating Chevron Nav: Previous Card -->\r\n  <button class="modal-nav-arrow modal-nav-prev" id="modalPrevBtn" onclick="event.stopPropagation(); navigateCardModal(-1)" title="Previous Card (← Left Arrow)" style="display:none;">\r\n    <span>‹</span>\r\n  </button>\r\n\r\n  <div class="modal-box">'''
    )

    # Counter pill after modal-close
    c = c.replace(
        '<button class="modal-close" onclick="closeModal()">&times;</button>',
        '<button class="modal-close" onclick="closeModal()">&times;</button>\n    <div class="modal-nav-counter-pill" id="modalNavCounter" style="display:none;"></div>'
    )
    c = c.replace(
        '<button class="modal-close" onclick="closeModal()">&times;</button>\r\n',
        '<button class="modal-close" onclick="closeModal()">&times;</button>\r\n    <div class="modal-nav-counter-pill" id="modalNavCounter" style="display:none;"></div>\r\n'
    )

    # In modal-actions, add sub prev/next buttons
    sub_btns = '<button class="btn-modal-outline btn-modal-nav-btn" id="modalSubPrevBtn" onclick="navigateCardModal(-1)" title="Previous Card" style="display:none;">‹ Prev</button>\n        <button class="btn-modal-outline btn-modal-nav-btn" id="modalSubNextBtn" onclick="navigateCardModal(1)" title="Next Card" style="display:none;">Next ›</button>\n        <a class="btn-modal-outline" id="modalDownload"'
    sub_btns_crlf = '<button class="btn-modal-outline btn-modal-nav-btn" id="modalSubPrevBtn" onclick="navigateCardModal(-1)" title="Previous Card" style="display:none;">‹ Prev</button>\r\n        <button class="btn-modal-outline btn-modal-nav-btn" id="modalSubNextBtn" onclick="navigateCardModal(1)" title="Next Card" style="display:none;">Next ›</button>\r\n        <a class="btn-modal-outline" id="modalDownload"'

    if '<button class="btn-modal-outline btn-modal-nav-btn"' not in c:
        c = c.replace('<a class="btn-modal-outline" id="modalDownload"', sub_btns)
        if '<button class="btn-modal-outline btn-modal-nav-btn"' not in c:
            c = c.replace('<a class="btn-modal-outline" id="modalDownload"', sub_btns_crlf)

    # Add next arrow before closing modal-overlay:
    # Usually: `</div>\n  </div>\n</div>\n\n<!-- ════════════════ DECK IMPORT MODAL`
    next_arrow = '''  <!-- Floating Chevron Nav: Next Card -->
  <button class="modal-nav-arrow modal-nav-next" id="modalNextBtn" onclick="event.stopPropagation(); navigateCardModal(1)" title="Next Card (→ Right Arrow)" style="display:none;">
    <span>›</span>
  </button>
</div>'''

    # Replace the close of cardModal
    if '<button class="modal-nav-arrow modal-nav-next"' not in c:
        # Search for closing </div> of modal-box and modal-overlay
        old_close_block = '  </div>\n</div>\n\n<!-- ════════════════ DECK IMPORT MODAL'
        if old_close_block in c:
            c = c.replace(old_close_block, '  </div>\n' + next_arrow + '\n\n<!-- ════════════════ DECK IMPORT MODAL')
        else:
            old_close_block_crlf = '  </div>\r\n</div>\r\n\r\n<!-- ════════════════ DECK IMPORT MODAL'
            if old_close_block_crlf in c:
                c = c.replace(old_close_block_crlf, '  </div>\r\n' + next_arrow.replace('\n', '\r\n') + '\r\n\r\n<!-- ════════════════ DECK IMPORT MODAL')
            else:
                print(f"Check closing block in {fname}")

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)

    print(f"Updated cardModal in {fname} successfully!")
