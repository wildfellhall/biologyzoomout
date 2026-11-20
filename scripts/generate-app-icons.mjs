// Rasterize the existing vector identity. Generated PNGs are committed, so builds
// and installation do not require Chrome or an image service.
import {chromium} from 'playwright';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
const destination = new URL('../public/icons/', import.meta.url);
const original = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
await mkdir(destination, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
try {
  const page = await browser.newPage();
  for (const [name, size, maskable] of [['app-192.png',192,false], ['app-512.png',512,false], ['app-maskable-512.png',512,true], ['apple-touch-icon.png',180,false]]) {
    const svg = maskable ? original.replace('<g fill=', '<g transform="translate(5.12 5.12) scale(.84)"><g fill=').replace('</svg>', '</g></svg>').replace('rx="13"', 'rx="0"') : original;
    const png = await page.evaluate(async ({svg, size}) => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.fillStyle = '#eeede5'; context.fillRect(0, 0, size, size);
      const img = new Image(); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await img.decode();
      context.drawImage(img, 0, 0, size, size);
      return canvas.toDataURL('image/png').split(',')[1];
    }, {svg, size});
    await writeFile(new URL(name, destination), Buffer.from(png, 'base64'));
  }
} finally { await browser.close(); }
