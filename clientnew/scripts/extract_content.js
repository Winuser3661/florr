const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '..');
const lines = fs.readFileSync(OUT + '/data/strings.txt', 'utf8').split('\n');

// parse i18n "Namespace/path/to/key=value"
const ns = {};                 // namespace -> keypath -> Set(values)
const kv = /^([A-Za-z][A-Za-z0-9]*)((?:\/[^=\/][^=]*)+)=(.*)$/;
for (const line of lines) {
  const m = line.match(kv);
  if (!m) continue;
  const [, name, path, val] = m;
  if (!/^(Petals|Mobs|Talents|Rarities|Maps|Achievements|UI|Chat|Flower|Tutorial|Colors|Drops|Attribute|Article|i18n|Sacrifice)$/.test(name)) continue;
  const key = path.replace(/^\//, '');
  (ns[name] = ns[name] || {});
  (ns[name][key] = ns[name][key] || new Set()).add(val.trim());
}

// write per-namespace json (all fields, all localized values)
fs.mkdirSync(OUT + '/content', { recursive: true });
const idsOf = (name) => [...new Set(Object.keys(ns[name] || {}).map(k => k.split('/')[0]))].sort();
for (const name of Object.keys(ns)) {
  const obj = {};
  for (const [key, set] of Object.entries(ns[name])) obj[key] = [...set].filter(Boolean);
  fs.writeFileSync(`${OUT}/content/${name}.json`, JSON.stringify(obj, null, 1));
}

// best-effort english name+desc per id for petals & mobs
function englishOf(values) {
  // prefer a value that is mostly ascii letters/spaces and not truncated
  const scored = values.map(v => {
    const ascii = (v.match(/[A-Za-z ]/g) || []).length / Math.max(1, v.length);
    return { v, score: ascii * Math.min(v.length, 60) };
  }).sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].v : '';
}
function englishTable(name) {
  const out = {};
  for (const id of idsOf(name)) {
    const rec = {};
    for (const field of ['Name', 'FullName', 'Description']) {
      const set = ns[name][`${id}/${field}`];
      if (set) rec[field] = englishOf([...set]);
    }
    out[id] = rec;
  }
  return out;
}
for (const name of ['Petals', 'Mobs', 'Talents', 'Rarities', 'Maps'])
  fs.writeFileSync(`${OUT}/content/${name}.en.json`, JSON.stringify(englishTable(name), null, 1));

// clean id lists
for (const name of ['Petals', 'Mobs', 'Talents', 'Rarities', 'Maps', 'Achievements'])
  fs.writeFileSync(`${OUT}/content/${name.toLowerCase()}.ids.txt`, idsOf(name).join('\n') + '\n');

// changelog: lines beginning with a tab+dash or "- " that are prose
const changelog = lines.filter(l => /^\s*-\s+[A-Z]/.test(l) && l.length > 25);
fs.writeFileSync(`${OUT}/data/changelog.txt`, [...new Set(changelog)].join('\n') + '\n');

console.log('namespaces:', Object.keys(ns).join(', '));
for (const name of ['Petals', 'Mobs', 'Talents', 'Rarities', 'Maps', 'Achievements'])
  console.log(`  ${name}: ${idsOf(name).length} ids`);
console.log('changelog lines:', new Set(changelog).size);
