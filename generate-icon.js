const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');

sharp('Screenshot 2026-07-02 042824.png')
  .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .toFile('temp-square.png')
  .then(() => {
    return pngToIco('temp-square.png');
  })
  .then(buf => {
    fs.writeFileSync('build/icon.ico', buf);
    console.log('Successfully generated build/icon.ico');
  })
  .catch(console.error);
