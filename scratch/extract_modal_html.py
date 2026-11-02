f = open('arena.html', encoding='utf-8').read()

modal_start = f.find('<!-- ════════════════ CARD DETAIL MODAL ════════════════ -->')
if modal_start == -1:
    modal_start = f.find('id="cardModal"')

# Find the end of cardModal
# It starts with <div class="modal-overlay" id="cardModal"
# Let's find its matching </div></div></div>
modal_tag = f.find('<div class="modal-overlay" id="cardModal"', modal_start - 100)
# Find the next section or comment or footer
next_marker = f.find('<!--', modal_tag + 50)
if next_marker == -1:
    next_marker = f.find('<script', modal_tag + 50)

modal_html = f[modal_start:next_marker].strip()
print('Modal length:', len(modal_html))
print('Modal starts with:', repr(modal_html[:80]))
print('Modal ends with:', repr(modal_html[-80:]))
