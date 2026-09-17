import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generate() {
  const svgPath = path.resolve('public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/icon-192.png'));
  console.log('Created icon-192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/icon-512.png'));
  console.log('Created icon-512.png');

  // 512x512 maskable PNG with padding
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#121614'
    })
    .png()
    .toFile(path.resolve('public/icon-maskable.png'));
  console.log('Created icon-maskable.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
