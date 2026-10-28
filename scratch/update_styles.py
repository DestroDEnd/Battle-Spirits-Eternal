import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

new_styles = '''
/* Burst Discard Options Modal */
.burst-discard-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}
.burst-discard-opt:hover {
  background: rgba(249, 115, 22, 0.18);
  border-color: #f97316;
  transform: translateY(-1px);
}
.burst-discard-opt-title {
  font-weight: 700;
  font-size: 0.88rem;
  color: #fdba74;
}
.burst-discard-opt-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}
'''

if '.burst-discard-opt' not in css:
    css += new_styles
    with open('styles.css', 'w', encoding='utf-8', newline='') as f:
        f.write(css)
    print("Added burst-discard-opt styles to styles.css!")
else:
    print("Styles already present.")
