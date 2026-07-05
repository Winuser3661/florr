# clientnew: everything extracted from the modern florr.io wasm

`clientnew.wasm` is the modern florr.io client (rust → wasm). full write-up in
[`analysis.md`](analysis.md). this folder holds everything pulled out of it.

```
clientnew/
  clientnew.wasm          the binary (9.4 MB)
  analysis.md             the static-analysis report
  data/
    strings.txt           every printable string (~108k)
    sections.txt          wasm section table
    imports.txt           361 imports (minified wasm-bindgen)
    exports.txt           46 exports
    changelog.txt         the in-game changelog (209 lines)
  content/                the embedded i18n table, decoded
    <ns>.json             all keys+values, all languages, per namespace
                          (Petals, Mobs, Talents, Rarities, Maps, Achievements,
                           UI, Chat, Flower, Tutorial, Colors, Drops, Attribute)
    <ns>.en.json          best-effort english name/fullname/description per id
    <ns>.ids.txt          plain id lists
  svg/                    148 vector assets (petal/mob/ui art, drawn via skia)
    asset_NNN.svg
  maps/                   92 map grids from the embedded gzip blobs
    grid_NNN.bin          raw byte grid (terrain/tile data)
    grid_NNN.png          grayscale render (square grids only)
    index.txt             dimensions per grid
  scripts/                the extraction scripts
    extract_content.js    strings.txt -> content/
    extract_assets.js     strings.txt -> svg/ + maps/  (needs `npm i pngjs`)
```

## quick facts

- rust + wasm-bindgen; skia (2d/vector) on webgl/glow; icu for i18n; 256 MB heap.
- backend: `api.n.m28.io`, `oauth2.florr.io`; oauth via google/apple/discord;
  xsolla payments.
- content: 122 petals, 87 mobs, 113 talents, 10 rarities, 18 maps, 142 achievements.
- map grids come in sizes 12x12 .. 246x246 (see `maps/index.txt`).

## regenerating

everything is re-derivable from `clientnew.wasm`:

```
strings -n 5 clientnew.wasm > data/strings.txt
wasm-objdump -h clientnew.wasm > data/sections.txt          # wabt
wasm-objdump -x -j Import clientnew.wasm > data/imports.txt
wasm-objdump -x -j Export clientnew.wasm > data/exports.txt
node scripts/extract_content.js
npm i pngjs && node scripts/extract_assets.js
```

the map data is gunzip of the `H4sI…` base64 blobs found in the strings.
