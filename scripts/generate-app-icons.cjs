/*
 * Genera los iconos de escritorio a partir del SVG de marca.
 *
 * Uso:
 *   npm run icons:generate
 *
 * Requiere Electron porque usa un BrowserWindow offscreen para rasterizar el
 * SVG. electron-builder usa después build/icon.ico para Windows y
 * build/icon.icns para macOS. En Linux se publica el set de build/icons.
 */
const { app, BrowserWindow, nativeImage } = require('electron');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { appBuilderPath } = require('app-builder-bin');

const repo = path.resolve(__dirname, '..');
const svgPath = path.join(repo, 'src', 'assets', 'brand', 'logoPisantech.svg');
const buildDir = path.join(repo, 'build');
const pngPath = path.join(buildDir, 'icon.png');
const publicPngPath = path.join(repo, 'public', 'icon.png');
const linuxIconsDir = path.join(buildDir, 'icons');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pisan-icon-'));
const htmlPath = path.join(tempDir, 'icon.html');
const size = 1024;
const linuxSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const icoSizes = [16, 24, 32, 48, 64, 128, 256];

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = Buffer.alloc(16 * images.length);
  let offset = 6 + entries.length;

  images.forEach(({ size: imageSize, data }, index) => {
    const entry = index * 16;
    const dimension = imageSize >= 256 ? 0 : imageSize;
    entries.writeUInt8(dimension, entry);
    entries.writeUInt8(dimension, entry + 1);
    entries.writeUInt8(0, entry + 2);
    entries.writeUInt8(0, entry + 3);
    entries.writeUInt16LE(1, entry + 4);
    entries.writeUInt16LE(32, entry + 6);
    entries.writeUInt32LE(data.length, entry + 8);
    entries.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  return Buffer.concat([
    header,
    entries,
    ...images.map(({ data }) => data),
  ]);
}

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        width: ${size}px;
        height: ${size}px;
        overflow: hidden;
        background: transparent;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tile {
        width: 960px;
        height: 960px;
        border-radius: 220px;
        background: linear-gradient(145deg, #ffffff 0%, #edf3f7 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 0 0 2px rgba(15, 34, 64, 0.08);
      }
      img {
        width: 800px;
        height: 800px;
        object-fit: contain;
        display: block;
      }
    </style>
  </head>
  <body>
    <div class="tile">
      <img src="${pathToFileURL(svgPath).href}" alt="" />
    </div>
  </body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
app.disableHardwareAcceleration();

async function main() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: size,
    height: size,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
    },
  });

  await win.loadFile(htmlPath);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const image = await win.webContents.capturePage({
    x: 0,
    y: 0,
    width: size,
    height: size,
  });
  const resized = image.resize({ width: size, height: size, quality: 'best' });
  fs.mkdirSync(buildDir, { recursive: true });
  fs.writeFileSync(pngPath, resized.toPNG());
  fs.copyFileSync(pngPath, publicPngPath);
  win.destroy();

  fs.mkdirSync(linuxIconsDir, { recursive: true });
  for (const iconSize of linuxSizes) {
    const resizedIcon = nativeImage
      .createFromPath(pngPath)
      .resize({ width: iconSize, height: iconSize, quality: 'best' });
    fs.writeFileSync(
      path.join(linuxIconsDir, `${iconSize}x${iconSize}.png`),
      resizedIcon.toPNG(),
    );
  }

  const icoImages = icoSizes.map((iconSize) => ({
    size: iconSize,
    data: fs.readFileSync(
      path.join(linuxIconsDir, `${iconSize}x${iconSize}.png`),
    ),
  }));
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), createIco(icoImages));

  execFileSync(
    appBuilderPath,
    [
      'icon',
      '--format',
      'icns',
      '--root',
      repo,
      '--out',
      buildDir,
      '--input',
      pngPath,
    ],
    { stdio: 'ignore' },
  );

  console.log(`[icons] PNG: ${pngPath}`);
  console.log(`[icons] ICO: ${path.join(buildDir, 'icon.ico')}`);
  console.log(`[icons] ICNS: ${path.join(buildDir, 'icon.icns')}`);
  console.log(`[icons] Linux: ${linuxIconsDir}`);
  console.log(`[icons] Copia para el renderer: ${publicPngPath}`);

  app.quit();
}

main()
  .catch((error) => {
    console.error('[icons] Error:', error);
    app.exit(1);
  })
  .finally(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
