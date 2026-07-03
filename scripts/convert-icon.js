const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async function run() {
  try {
    const pngToIcoModule = await import('png-to-ico');
    const pngToIco = pngToIcoModule.default || pngToIcoModule;

    const src = path.join(__dirname, '..', 'Screenshot 2026-07-02 042824.png');
    const outDir = path.join(__dirname, '..', 'build');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const image = sharp(src);
    const metadata = await image.metadata();
    const size = Math.max(metadata.width || 0, metadata.height || 0);
    if (!size) throw new Error('Invalid image size from source PNG');

    const padded = image.extend({
      top: Math.floor((size - (metadata.height || 0)) / 2),
      bottom: Math.floor((size - (metadata.height || 0)) / 2),
      left: Math.floor((size - (metadata.width || 0)) / 2),
      right: Math.floor((size - (metadata.width || 0)) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });

    const squareBuffer = await padded
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const pngBuffer = await sharp(squareBuffer)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const icoBuf = await pngToIco(pngBuffer);
    fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuf);
    console.log('Conversion finished: build/icon.ico');
    process.exit(0);
  } catch (err) {
    console.error('Conversion failed', err);
    process.exit(1);
  }
})();

