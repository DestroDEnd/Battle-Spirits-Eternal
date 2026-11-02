with open('family.html', 'r', encoding='utf-8') as f:
    c = f.read()

target = """async function loadFamilyDirectory() {
  try {
    const res = await fetch('/api/filters');
    const data = await res.json();
    if (data.categorized_families) {
      allCategorizedFamilies = data.categorized_families;
      renderFamilyDirectory(allCategorizedFamilies);
    }
  } catch (err) {
    document.getElementById('familySectionsContainer').innerHTML = `<div style="text-align:center;padding:3rem;color:#fca5a5;">Failed to load families: ${esc(err.message)}</div>`;
  }
}"""

replacement = """async function loadFamilyDirectory() {
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

    if (data && data.categorized_families && data.categorized_families.length > 0) {
      allCategorizedFamilies = data.categorized_families;
      renderFamilyDirectory(allCategorizedFamilies);
    } else {
      throw new Error('Family directory data could not be loaded.');
    }
  } catch (err) {
    document.getElementById('familySectionsContainer').innerHTML = `<div style="text-align:center;padding:3rem;color:#fca5a5;">Failed to load families: ${esc(err.message)}</div>`;
  }
}"""

c_norm = c.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

assert t_norm in c_norm, "Target not found in family.html!"
c_patched = c_norm.replace(t_norm, r_norm)

with open('family.html', 'w', encoding='utf-8') as f:
    f.write(c_patched)

print("family.html patched successfully!")
