with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    lifeDamage() {
      this.init();
      this.playTone(120, 'sawtooth', 0.3, 0.18);
      setTimeout(() => this.playTone(90, 'sawtooth', 0.4, 0.15), 100);
    },"""

replacement = """    lifeDamage() {
      this.init();
      this.playTone(120, 'sawtooth', 0.3, 0.18);
      setTimeout(() => this.playTone(90, 'sawtooth', 0.4, 0.15), 100);
    },
    burstIgnite() {
      this.init();
      this.playTone(280, 'sawtooth', 0.25, 0.15);
      setTimeout(() => this.playTone(420, 'square', 0.2, 0.12), 70);
      setTimeout(() => this.playTone(560, 'sawtooth', 0.35, 0.16), 140);
    },"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Added burstIgnite to AudioFX")
