const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async function run() {
  try {
    const pngToIcoModule = await import('png-to-ico');
    const pngToIco = pngToIcoModule.default || pngToIcoModule;

    const outDir = path.join(__dirname, '..', 'build');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="48" ry="48" fill="#1E90FF" />
  <text x="50%" y="52%" font-family="Arial, Helvetica, sans-serif" font-size="140" fill="#FFFFFF" font-weight="700" text-anchor="middle" dominant-baseline="middle">MS</text>
</svg>`;

    const pngBuffer = await sharp(Buffer.from(svg))
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

