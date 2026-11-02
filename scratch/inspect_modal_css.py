f = open('styles.css', encoding='utf-8').read()
idx = f.find('.modal-overlay')
print(f[idx:idx+400])
