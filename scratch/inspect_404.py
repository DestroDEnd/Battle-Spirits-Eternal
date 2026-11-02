with open('404.html', 'r', encoding='utf-8') as f:
    c = f.read()

with open('scratch/404_content.txt', 'w', encoding='utf-8') as out:
    out.write(c)
