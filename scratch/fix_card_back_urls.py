f = open('battle_arena.js', encoding='utf-8').read()
count = f.count('/assets/card_back.png')
print('Count of /assets/card_back.png in battle_arena.js:', count)

f_new = f.replace("this.src='/assets/card_back.png'", "this.src='./assets/card_back.png'")
f_new = f_new.replace('this.src="/assets/card_back.png"', 'this.src="./assets/card_back.png"')
f_new = f_new.replace("'/assets/card_back.png'", "'./assets/card_back.png'")
f_new = f_new.replace('"/assets/card_back.png"', '"./assets/card_back.png"')

# Replace the hand card img tag
old_hand_tag = '''<img src="${card.image_url}" alt="${card.name}" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='./assets/card_back.png'; }" />'''
new_hand_tag = '''<img src="${card.image_url || './assets/card_back.png'}" alt="${card.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='./assets/card_back.png';" />'''

if old_hand_tag in f_new:
    f_new = f_new.replace(old_hand_tag, new_hand_tag)
    print('Replaced hand tag successfully!')
else:
    # also try with single quote
    import re
    f_new = re.sub(r'<img src="\$\{card\.image_url\}"[^>]*onerror="[^"]*" \/>', new_hand_tag, f_new)
    print('Replaced hand tag via regex!')

open('battle_arena.js', 'w', encoding='utf-8').write(f_new)
print('battle_arena.js updated!')
