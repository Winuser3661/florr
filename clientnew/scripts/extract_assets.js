const fs = require('fs'), zlib = require('zlib'), path = require('path');
const { PNG } = require('pngjs');
const OUT = path.resolve(__dirname, '..');
const s = fs.readFileSync(OUT + '/data/strings.txt', 'utf8');

// ---- SVG assets: each complete <svg ...>...</svg> string ----
let svgN = 0;
const svgRe = /<svg[\s\S]*?<\/svg>/g; let m;
const seen = new Set();
while ((m = svgRe.exec(s)) !== null) {
  const svg = m[0];
  if (svg.length < 40 || seen.has(svg)) continue; seen.add(svg);
  fs.writeFileSync(`${OUT}/svg/asset_${String(svgN).padStart(3, '0')}.svg`, svg);
  svgN++;
}
console.log('svg assets written:', svgN);

// ---- map grids: gzip (H4sI...) base64 blobs -> .bin + grayscale png if square ----
const blobs = [...s.matchAll(/H4sI[A-Za-z0-9+\/\\=]+/g)].map(x => x[0].replace(/\\\//g, '/'));
const sizes = {};
let gi = 0;
const index = [];
for (const b of blobs) {
  let buf;
  try { buf = zlib.gunzipSync(Buffer.from(b, 'base64')); } catch (e) { continue; }
  const n = buf.length; const side = Math.round(Math.sqrt(n));
  const id = String(gi).padStart(3, '0');
  fs.writeFileSync(`${OUT}/maps/grid_${id}.bin`, buf);
  sizes[n] = (sizes[n] || 0) + 1;
  let dims = `${n}B`;
  if (side * side === n) {
    dims = `${side}x${side}`;
    // render: scale byte value up for visibility, grayscale
    const png = new PNG({ width: side, height: side });
    // find max for contrast
    let max = 1; for (let i = 0; i < n; i++) if (buf[i] > max) max = buf[i];
    for (let i = 0; i < n; i++) {
      const v = Math.round((buf[i] / max) * 255);
      png.data[i * 4] = v; png.data[i * 4 + 1] = v; png.data[i * 4 + 2] = v; png.data[i * 4 + 3] = 255;
    }
    fs.writeFileSync(`${OUT}/maps/grid_${id}.png`, PNG.sync.write(png));
  }
  index.push(`grid_${id}  ${dims}  (${n} bytes)`);
  gi++;
}
fs.writeFileSync(`${OUT}/maps/index.txt`, index.join('\n') + '\n');
console.log('map grids written:', gi, 'size histogram:', JSON.stringify(sizes));
