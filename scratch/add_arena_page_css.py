import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

extra = '''
/* ── DEDICATED ARENA PAGE ADAPTATION ── */
.arena-page-body .battle-arena-section {
  margin: 0.5rem 0 2rem 0 !important;
  border-radius: 1rem;
}
'''

if '.arena-page-body .battle-arena-section' not in css:
    css += extra
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("✅ Added .arena-page-body styling to styles.css")
else:
    print("Styles already present")
