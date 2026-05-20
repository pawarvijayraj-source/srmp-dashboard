#!/bin/bash
# Patch App.jsx search to deduplicate by Adv Sr No
# Run from inside srmp-dashboard folder

cd ~/Desktop/srmp-dashboard

node -e "
const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

// Fix the SearchPanel to use loiByAdvSrNo for deduplication
const oldSearch = \`const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return allRows.filter(r => {
      const loc = getLocation(r).toLowerCase();
      const dist = (r.district || r.district_name || '').toLowerCase();
      const adv = (r.adv_sr_no || r.advt_srno || '').toLowerCase();
      return loc.includes(q) || dist.includes(q) || adv.includes(q);
    }).slice(0, 6);
  }, [query, allRows]);\`;

const newSearch = \`const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    
    // Search all rows
    const matches = allRows.filter(r => {
      const loc = getLocation(r).toLowerCase();
      const dist = (r.district || r.district_name || '').toLowerCase();
      const adv = (r.adv_sr_no || r.advt_srno || r.adv_sr_no_of_location || '').toLowerCase();
      return loc.includes(q) || dist.includes(q) || adv.includes(q);
    });

    // Deduplicate — prefer LOI_PENDING record over DSB record
    const seen = new Map();
    matches.forEach(r => {
      const advKey = (r.adv_sr_no || r.advt_srno || r.adv_sr_no_of_location || '').trim().toUpperCase();
      const locKey = getLocation(r).trim().toLowerCase();
      const key = advKey || locKey;
      
      if (!seen.has(key)) {
        seen.set(key, r);
      } else {
        // Prefer LOI_PENDING over DSB records
        if (r._source === 'LOI_PENDING') {
          seen.set(key, r);
        }
      }
    });

    return Array.from(seen.values()).slice(0, 6);
  }, [query, allRows]);\`;

if (c.includes('return allRows.filter(r => {')) {
  c = c.replace(oldSearch, newSearch);
  console.log('Search deduplication patched!');
} else {
  // Try simpler replacement
  c = c.replace(
    /const results = useMemo\(\(\) => \{[\s\S]*?\}, \[query, allRows\]\);/,
    newSearch
  );
  console.log('Search deduplication patched (fallback)!');
}

fs.writeFileSync('src/App.jsx', c);
console.log('App.jsx updated!');
"

echo "Done! Now deploy with: git add . && git commit -m 'deduplicate search + cross-link M1 M2' && npm run deploy"
