with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

target = """async function loadFeaturedXRares(color = '') {
  featuredColorFilter = color;
  const track = document.getElementById('featuredCardsTrack');
  if (!track) return;
  track.classList.add('loading-fade');

  try {
    const url = '/api/featured-x-rares' + (color ? `?color=${encodeURIComponent(color)}` : '');
    const res = await fetch(url);
    const data = await res.json();
    featuredCards = data.cards || [];
    renderFeaturedCards(featuredCards);
  } catch (err) {
    console.error('Failed to load featured X-Rares:', err);
    if (track) {
      track.innerHTML = '<div style="padding:2.5rem;color:#94a3b8;font-size:0.95rem;">Failed to load cards. Please click Shuffle or reload.</div>';
    }
  } finally {
    track.classList.remove('loading-fade');
  }
}"""

replacement = """async function loadFeaturedXRares(color = '') {
  featuredColorFilter = color;
  const track = document.getElementById('featuredCardsTrack');
  if (!track) return;
  track.classList.add('loading-fade');

  try {
    let cards = [];
    // 1. Try static featured_x_rares.json first (100% reliable on GitHub Pages)
    try {
      const res = await fetch('./featured_x_rares.json');
      if (res.ok) {
        const staticData = await res.json();
        if (color && staticData.by_color) {
          const capColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
          cards = staticData.by_color[capColor] || [];
        }
        if (!cards.length) {
          cards = staticData.cards || [];
        }
        cards = [...cards].sort(() => Math.random() - 0.5);
      }
    } catch (e) {}

    // 2. Fallback to API if running with local server
    if (!cards.length) {
      try {
        const url = '/api/featured-x-rares' + (color ? `?color=${encodeURIComponent(color)}` : '');
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text.trim().startsWith('{')) {
            const data = JSON.parse(text);
            cards = data.cards || [];
          }
        }
      } catch (e) {}
    }

    featuredCards = cards;
    renderFeaturedCards(featuredCards);
  } catch (err) {
    console.error('Failed to load featured X-Rares:', err);
    if (track) {
      track.innerHTML = '<div style="padding:2.5rem;color:#94a3b8;font-size:0.95rem;">Failed to load cards. Please click Shuffle or reload.</div>';
    }
  } finally {
    track.classList.remove('loading-fade');
  }
}"""

c_norm = c.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

assert t_norm in c_norm, "Target not found in index.html!"
c_patched = c_norm.replace(t_norm, r_norm)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c_patched)

print("index.html patched successfully!")
