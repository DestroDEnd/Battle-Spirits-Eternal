
// ═══════════════════ SHIFTING FEATURED X-RARES CONTROLLER ═══════════════════
let featuredCards = [];
let featuredColorFilter = '';
let featuredAutoShift = true;
const FEATURED_SHIFT_INTERVAL = 3200; // Shift smoothly every 3.2 seconds
let shiftIntervalTimer = null;

function escHtml(str) {
  return (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

async function loadFeaturedXRares(color = '') {
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
}

function renderFeaturedCards(cards) {
  const track = document.getElementById('featuredCardsTrack');
  if (!track) return;

  if (!cards || cards.length === 0) {
    track.innerHTML = '<div style="padding:2.5rem;color:#94a3b8;font-size:0.95rem;">No X-Rare cards found for this selection.</div>';
    return;
  }

  // Duplicate cards for seamless looping ribbon
  const displayPool = cards.length > 5 ? [...cards, ...cards] : cards;

  track.innerHTML = displayPool.map(c => {
    const colorLower = (c.color || 'yellow').toLowerCase();
    const rarityLabel = c.rarity || 'X-Rare';
    const typeLabel = c.type || 'Spirit';
    const costText = (c.cost !== null && c.cost !== undefined) ? `Cost ${c.cost}` : '';
    const familyText = c.family ? ` • ${c.family}` : '';
    const subText = [costText, typeLabel].filter(Boolean).join(' • ') + familyText;
    const safeName = escHtml(c.name);

    return `
      <div class="featured-card-item card-theme-${colorLower}" data-name="${safeName}" onclick="openCardDetail(this.dataset.name)" title="Click to view ${safeName}">
        <div class="card-foil-sheen"></div>
        <div class="card-art-wrap">
          <img src="${c.image_url}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer" class="card-art-img" data-art="${c.image_url}" onerror="if(!this.dataset.retried && this.dataset.art && this.dataset.art.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.dataset.art);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
        </div>
        <div class="card-meta-top">
          <span class="card-color-tag color-tag-${colorLower}">${c.color}</span>
          <span class="card-rarity-tag">${rarityLabel}</span>
        </div>
        <div class="card-info-overlay">
          <div class="card-title-name">${safeName}</div>
          <div class="card-sub-info">${subText}</div>
        </div>
        <div class="card-hover-prompt">
          <span>Inspect Card ↗</span>
        </div>
      </div>
    `;
  }).join('');

  resetFeaturedProgress();
}

function shiftFeaturedCards(direction = 1) {
  const vp = document.getElementById('featuredViewport');
  if (!vp) return;
  const cardItem = vp.querySelector('.featured-card-item');
  const shiftAmount = cardItem ? (cardItem.offsetWidth + 20) * 1.5 : 320;
  
  const maxScroll = vp.scrollWidth - vp.clientWidth;
  let target = vp.scrollLeft + (direction * shiftAmount);

  // Seamless wrap-around
  if (target >= maxScroll - 15) {
    vp.scrollTo({ left: 0, behavior: 'smooth' });
  } else if (target < 0) {
    vp.scrollTo({ left: maxScroll, behavior: 'smooth' });
  } else {
    vp.scrollBy({ left: direction * shiftAmount, behavior: 'smooth' });
  }

  resetFeaturedProgress();
}

function startFeaturedShiftLoop() {
  clearInterval(shiftIntervalTimer);
  shiftIntervalTimer = setInterval(() => {
    if (featuredAutoShift) {
      shiftFeaturedCards(1);
    }
  }, FEATURED_SHIFT_INTERVAL);
}

function resetFeaturedProgress() {
  if (featuredAutoShift) {
    startFeaturedShiftLoop();
  }
}

function toggleFeaturedAutoShift() {
  featuredAutoShift = !featuredAutoShift;
  const icon = document.getElementById('featuredPlayPauseIcon');
  if (icon) icon.textContent = featuredAutoShift ? '⏸️' : '▶️';
}

function pauseFeaturedHover() {
  featuredAutoShift = false;
  clearInterval(shiftIntervalTimer);
}

function resumeFeaturedHover() {
  const icon = document.getElementById('featuredPlayPauseIcon');
  if (icon && icon.textContent === '⏸️') {
    featuredAutoShift = true;
    startFeaturedShiftLoop();
  }
}

function shuffleFeaturedCards() {
  loadFeaturedXRares(featuredColorFilter);
}

function filterFeaturedColor(color, btn) {
  document.querySelectorAll('.color-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadFeaturedXRares(color);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedXRares();
    startFeaturedShiftLoop();
  });
} else {
  loadFeaturedXRares();
  startFeaturedShiftLoop();
}
