f = open('arena.html', encoding='utf-8').read()
arena_idx = f.find('id="battleArena"')
card_modal_idx = f.find('id="cardModal"')
print('battleArena index:', arena_idx)
print('cardModal index:', card_modal_idx)

# Find where battleArena ends
close_arena_idx = f.find('</section>', arena_idx)
print('battleArena ends at:', close_arena_idx)
print('Is cardModal inside battleArena?:', arena_idx < card_modal_idx < close_arena_idx)
