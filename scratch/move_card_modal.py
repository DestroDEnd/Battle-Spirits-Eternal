f = open('arena.html', encoding='utf-8').read()

modal_start = f.find('<div class="modal-overlay" id="cardModal"')
# Find closing of cardModal. Let's find </main> or <footer or <script
script_idx = f.find('<script', modal_start)
# Find the last </div> before <script
div_end = f.rfind('</div>', modal_start, script_idx) + 6

modal_html = f[modal_start:div_end]
print('Found cardModal:', len(modal_html), 'chars')

# Check arena closing tag
arena_close = f.find('</section>', 0, modal_start)
print('arena_close index:', arena_close)

# Remove modal from its current location
f_without_modal = f[:modal_start] + f[div_end:]

# Insert modal right before </section> of battleArena
new_f = f_without_modal[:arena_close] + '\n\n' + modal_html + '\n\n' + f_without_modal[arena_close:]

with open('arena.html', 'w', encoding='utf-8') as out:
    out.write(new_f)

print('Successfully moved cardModal inside #battleArena in arena.html!')
