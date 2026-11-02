with open('browse.html', 'r', encoding='utf-8') as f:
    c = f.read()

target = """async function loadFamilyDropdownData() {
  try {
    const res = await fetch('/api/filters');
    const data = await res.json();
    if (data.categorized_families) {
      renderFamilyDropdownMenu(data.categorized_families);
    }
  } catch (err) {
    console.error('Failed to load filter metadata:', err);
    const splitEl = document.getElementById('familyDropdownSplit');
    if (splitEl) {
      splitEl.innerHTML = '<div style="flex:1;padding:2rem 1rem;color:#f87171;text-align:center;font-size:0.78rem;">Failed to load families metadata. <button type="button" onclick="loadFamilyDropdownData()" style="color:var(--accent);background:none;border:none;cursor:pointer;text-decoration:underline;font-weight:700;">Retry</button></div>';
    }
  }
}"""

replacement = """async function loadFamilyDropdownData() {
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

    if (data && data.categorized_families) {
      renderFamilyDropdownMenu(data.categorized_families);
    }
  } catch (err) {
    console.error('Failed to load filter metadata:', err);
    const splitEl = document.getElementById('familyDropdownSplit');
    if (splitEl) {
      splitEl.innerHTML = '<div style="flex:1;padding:2rem 1rem;color:#f87171;text-align:center;font-size:0.78rem;">Failed to load families metadata. <button type="button" onclick="loadFamilyDropdownData()" style="color:var(--accent);background:none;border:none;cursor:pointer;text-decoration:underline;font-weight:700;">Retry</button></div>';
    }
  }
}"""

c_norm = c.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

assert t_norm in c_norm, "Target not found in browse.html!"
c_patched = c_norm.replace(t_norm, r_norm)

with open('browse.html', 'w', encoding='utf-8') as f:
    f.write(c_patched)

print("browse.html patched successfully!")
