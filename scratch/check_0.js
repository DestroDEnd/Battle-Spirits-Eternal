
function executeHeroSearch() {
  const q = document.getElementById('heroSearchInput').value.trim();
  if (q) {
    window.location.href = '/browse?q=' + encodeURIComponent(q);
  } else {
    window.location.href = '/browse';
  }
}
