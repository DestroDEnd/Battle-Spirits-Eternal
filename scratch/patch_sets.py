with open('sets.html', 'r', encoding='utf-8') as f:
    c = f.read()

target = """async function loadSetsDirectory() {
  try {
    const res = await fetch('/api/filters');
    const data = await res.json();
    if (data.categorized_sets) {
      allCategorizedSets = data.categorized_sets;
      renderSetDirectory(allCategorizedSets);
    }
  } catch (err) {
    document.getElementById('setSectionsContainer').innerHTML = `<div style="text-align:center;padding:3rem;color:#fca5a5;">Failed to load sets: ${esc(err.message)}</div>`;
  }
}"""

replacement = """async function loadSetsDirectory() {
  try {
    let data = null;
    // 1. Try static filters_data.json first (100% reliable on GitHub Pages)
    try {
      const res = await fetch('./filters_data.json');
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {}

    // 2. Fallback to API if running with local server
    if (!data) {
      try {
        const res = await fetch('/api/filters');
        if (res.ok) {
          const text = await res.text();
          if (text.trim().startsWith('{')) {
            data = JSON.parse(text);
          }
        }
      } catch (e) {}
    }

    if (data && data.categorized_sets && data.categorized_sets.length > 0) {
      allCategorizedSets = data.categorized_sets;
      renderSetDirectory(allCategorizedSets);
    } else {
      throw new Error('Card sets directory data could not be loaded.');
    }
  } catch (err) {
    document.getElementById('setSectionsContainer').innerHTML = `<div style="text-align:center;padding:3rem;color:#fca5a5;">Failed to load sets: ${esc(err.message)}</div>`;
  }
}"""

c_norm = c.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

assert t_norm in c_norm, "Target not found in sets.html!"
c_patched = c_norm.replace(t_norm, r_norm)

with open('sets.html', 'w', encoding='utf-8') as f:
    f.write(c_patched)

print("sets.html patched successfully!")
