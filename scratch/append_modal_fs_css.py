extra_css = '''
/* Card Modal Fullscreen and Top Layer Support */
#cardModal,
.modal-overlay#cardModal {
  z-index: 2147483647 !important;
}

:fullscreen #cardModal,
:-webkit-full-screen #cardModal,
.is-fullscreen-arena #cardModal {
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483647 !important;
}

:fullscreen #cardModal.open,
:-webkit-full-screen #cardModal.open,
.is-fullscreen-arena #cardModal.open {
  display: flex !important;
}
'''

with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(extra_css)

print('Appended modal fullscreen CSS to styles.css')
