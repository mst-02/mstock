const fs = require('fs');
const path = require('path');

// Use dynamic imports because `png-to-ico` is an ES module and can't be required in CommonJS.
(async function run() {
  try {
    const JimpModule = await import('jimp');
    const Jimp = JimpModule.default || JimpModule;

    const pngToIcoModule = await import('png-to-ico');
    const pngToIco = pngToIcoModule.default || pngToIcoModule;

    const src = path.join(__dirname, '..', 'Screenshot 2026-07-02 042824.png');
    const outDir = path.join(__dirname, '..', 'build');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const image = await Jimp.read(src);
    const size = Math.max(image.bitmap.width, image.bitmap.height);

    const square = new Jimp(size, size, 0xffffffff);
    square.composite(image, Math.floor((size - image.bitmap.width) / 2), Math.floor((size - image.bitmap.height) / 2));

    const buf = await square.getBufferAsync(Jimp.MIME_PNG);

    const icoBuf = await pngToIco(buf);
    fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuf);
    console.log('Conversion finished: build/icon.ico');
    process.exit(0);
  } catch (err) {
    console.error('Conversion failed', err);
    process.exit(1);
  }
})();

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
