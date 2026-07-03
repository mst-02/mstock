const fs = require('fs');
const path = require('path');
let pngToIco = require('png-to-ico');
if (typeof pngToIco !== 'function' && pngToIco && typeof pngToIco.default === 'function') pngToIco = pngToIco.default;
let Jimp = require('jimp');
if (Jimp && !Jimp.read && Jimp.default && typeof Jimp.default.read === 'function') Jimp = Jimp.default;

async function run() {
  const src = path.join(__dirname, '..', 'Screenshot 2026-07-02 042824.png');
  const tmp = path.join(__dirname, '..', 'build', 'tmp_icon_256.png');
  const out = path.join(__dirname, '..', 'build', 'icon.ico');
  if (!fs.existsSync(src)) {
    console.error('Source PNG not found:', src);
    process.exit(1);
  }
  try {
    const img = await Jimp.read(src);
    // make square by taking max dimension and filling with transparent background
    const size = Math.max(img.bitmap.width, img.bitmap.height);
    const square = new Jimp(size, size, 0x00000000);
    const x = Math.floor((size - img.bitmap.width) / 2);
    const y = Math.floor((size - img.bitmap.height) / 2);
    square.composite(img, x, y);
    square.resize(256, 256);
    await square.writeAsync(tmp);
    const buf = await pngToIco(tmp);
    fs.writeFileSync(out, buf);
    console.log('Wrote', out);
  } catch (err) {
    console.error('Conversion failed', err);
    process.exit(2);
  }
}

run();
