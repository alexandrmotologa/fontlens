import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { execSync } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT_DIR = process.cwd();
const OUT_DIR = path.resolve(ROOT_DIR, 'docs', 'images');
const SAMPLES_DIR = path.resolve(ROOT_DIR, 'samples');
const DIST_DIR = path.resolve(ROOT_DIR, 'web', 'dist');
const FRAMES_DIR = path.resolve(ROOT_DIR, '.temp_frames');

fs.mkdirSync(OUT_DIR, { recursive: true });
if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });

const SYSTEM_FONTS = [
  {
    name: 'Arial',
    family: 'Arial, sans-serif',
    category: 'sans-serif',
    units_per_em: 2048,
    ascent: 1854,
    descent: -434,
    line_gap: 307,
    cap_height: 1467,
    x_height: 1062,
    avg_char_width: 1195,
    os_target: 'cross-platform',
  },
  {
    name: 'Helvetica',
    family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    category: 'sans-serif',
    units_per_em: 2048,
    ascent: 1900,
    descent: -420,
    line_gap: 0,
    cap_height: 1456,
    x_height: 1060,
    avg_char_width: 1180,
    os_target: 'macos',
  },
  {
    name: 'Segoe UI',
    family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    category: 'sans-serif',
    units_per_em: 2048,
    ascent: 2210,
    descent: -514,
    line_gap: 269,
    cap_height: 1434,
    x_height: 1024,
    avg_char_width: 1210,
    os_target: 'windows',
  },
  {
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    category: 'sans-serif',
    units_per_em: 2048,
    ascent: 2146,
    descent: -555,
    line_gap: 0,
    cap_height: 1456,
    x_height: 1082,
    avg_char_width: 1205,
    os_target: 'android',
  },
];

function startStaticServer(port = 5210) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];

    // API mocks
    if (urlPath === '/api/system-fonts') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ fonts: SYSTEM_FONTS }));
      return;
    }

    if (urlPath === '/api/analyze-font') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          metadata: {
            family: 'Inter',
            style: 'Regular',
            units_per_em: 2048,
            ascent: 1984,
            descent: -494,
            line_gap: 0,
            avg_char_width: 1247,
            cap_height: 1490,
            x_height: 1118,
            category: 'sans-serif',
          },
        })
      );
      return;
    }

    // Samples serving
    if (urlPath.startsWith('/samples/')) {
      const sampleFile = path.join(SAMPLES_DIR, urlPath.replace('/samples/', ''));
      if (fs.existsSync(sampleFile)) {
        const ext = path.extname(sampleFile);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(fs.readFileSync(sampleFile));
        return;
      }
    }

    // Static frontend serving
    let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port);
  return server;
}

async function run() {
  console.log('Starting static studio server at http://127.0.0.1:5210...');
  const server = startStaticServer(5210);

  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5210', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // --- Capture Screenshots ---
  console.log('Capturing Screenshot 1: fontlens-1.png (Zero-CLS Studio)...');
  await page.evaluate(() => {
    if (window.__fontlens) window.__fontlens.setActiveTab('zero-cls');
    if (window.__zeroCls) {
      window.__zeroCls.setViewMode('split');
      window.__zeroCls.setSplitPos(50);
      window.__zeroCls.setCodeTab('css');
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fontlens-1.png'), fullPage: false });

  console.log('Capturing Screenshot 2: fontlens-2.png (Codebase Harvest)...');
  await page.evaluate(() => {
    if (window.__fontlens) window.__fontlens.setActiveTab('harvest');
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fontlens-2.png'), fullPage: false });

  console.log('Capturing Screenshot 3: fontlens-3.png (WOFF2 Subsetter & Savings Panel)...');
  await page.evaluate(() => {
    if (window.__fontlens) window.__fontlens.setActiveTab('subset');
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fontlens-3.png'), fullPage: false });

  console.log('Capturing Screenshot 4: fontlens-4.png (Progressive Font Chunking)...');
  await page.evaluate(() => {
    if (window.__fontlens) window.__fontlens.setActiveTab('chunking');
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fontlens-4.png'), fullPage: false });

  console.log('Capturing Screenshot 5: fontlens-5.png (Typography Waterfall)...');
  await page.evaluate(() => {
    if (window.__fontlens) window.__fontlens.setActiveTab('waterfall');
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fontlens-5.png'), fullPage: false });

  console.log('Capturing Screenshot 6: fontlens-6.png (Multi-Platform Fallback Suite)...');
  await page.evaluate(() => {
    if (window.__fontlens) window.__fontlens.setActiveTab('zero-cls');
    if (window.__zeroCls) {
      window.__zeroCls.setCodeTab('multiplatform');
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fontlens-6.png'), fullPage: false });

  console.log('Capturing Screenshot 7: fontlens-7.png (Responsive Tablet View)...');
  await page.setViewport({ width: 800, height: 1050, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'fontlens-7.png'), fullPage: false });

  // Reset viewport for demo GIF
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await page.evaluate(() => {
    if (window.__fontlens) window.__fontlens.setActiveTab('zero-cls');
    if (window.__zeroCls) {
      window.__zeroCls.setViewMode('split');
      window.__zeroCls.setSplitPos(50);
      window.__zeroCls.setCodeTab('css');
    }
  });
  await new Promise((r) => setTimeout(r, 800));

  // --- Record Animation Sequence for Demo GIF ---
  console.log('Recording animation sequence for fontlens_demo.gif (80 frames at 10 FPS)...');
  const totalFrames = 80;
  const fps = 10;

  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps; // 0.0 to 7.9s

    await page.evaluate((time) => {
      // Phase 1: 0.0s - 3.2s: Zero-CLS Studio & Split Slider Motion
      if (time < 3.2) {
        if (window.__fontlens && window.__fontlens.activeTab !== 'zero-cls') {
          window.__fontlens.setActiveTab('zero-cls');
        }
        if (window.__zeroCls) {
          window.__zeroCls.setViewMode('split');

          // Smooth cosine glide of split slider between 30% and 70%
          if (time >= 0.8 && time < 2.8) {
            const progress = (time - 0.8) / 2.0; // 0 to 1
            const sliderPos = 50 + 20 * Math.sin(progress * Math.PI * 2);
            window.__zeroCls.setSplitPos(Math.round(sliderPos));
          } else {
            window.__zeroCls.setSplitPos(50);
          }

          if (time >= 2.8 && time < 3.2) {
            window.__zeroCls.setCodeTab('nextjs');
          } else {
            window.__zeroCls.setCodeTab('css');
          }
        }
      }
      // Phase 2: 3.2s - 5.4s: WOFF2 Subsetter & 98.4% Net Savings Panel
      else if (time >= 3.2 && time < 5.4) {
        if (window.__fontlens && window.__fontlens.activeTab !== 'subset') {
          window.__fontlens.setActiveTab('subset');
        }
      }
      // Phase 3: 5.4s - 7.2s: Progressive Font Chunking
      else if (time >= 5.4 && time < 7.2) {
        if (window.__fontlens && window.__fontlens.activeTab !== 'chunking') {
          window.__fontlens.setActiveTab('chunking');
        }
      }
      // Phase 4: 7.2s - 8.0s: Seamless Loopback to Zero-CLS Studio
      else {
        if (window.__fontlens && window.__fontlens.activeTab !== 'zero-cls') {
          window.__fontlens.setActiveTab('zero-cls');
        }
        if (window.__zeroCls) {
          window.__zeroCls.setViewMode('split');
          window.__zeroCls.setSplitPos(50);
          window.__zeroCls.setCodeTab('css');
        }
      }
    }, t);

    await new Promise((r) => setTimeout(r, 45));

    const frameFile = path.join(FRAMES_DIR, `frame_${String(f).padStart(4, '0')}.png`);
    await page.screenshot({ path: frameFile, fullPage: false });
  }

  // Safely close browser and server
  const chromeProc = browser.process();
  try {
    const pages = await browser.pages();
    for (const p of pages) await p.close().catch(() => {});
    await Promise.race([
      browser.close(),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch (e) {
    console.log('Browser close notice:', e.message);
  }
  if (chromeProc && chromeProc.pid) {
    try {
      process.kill(chromeProc.pid);
    } catch {}
  }

  if (server.closeAllConnections) server.closeAllConnections();
  server.close();
  console.log('Browser and static server closed.');

  // Encode GIF with FFmpeg
  console.log('Generating fontlens_demo.gif with FFmpeg palettegen...');
  const gifOut = path.join(OUT_DIR, 'fontlens_demo.gif');
  try {
    execSync(
      `ffmpeg -y -framerate 10 -i "${FRAMES_DIR}\\frame_%04d.png" -vf "fps=10,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff:max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "${gifOut}"`,
      { stdio: 'inherit' }
    );
    console.log('✓ Demo GIF successfully rendered at:', gifOut);
  } catch (err) {
    console.error('Error rendering GIF:', err.message);
  }

  // Clean up frames
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  console.log('Media capture complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
