import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';
const RAW_HTML_DIR = './raw/html';
const RAW_IMAGES_DIR = './raw/images-original';

// Builds to retry
const buildsToRetry = [
  { id: '1.31', name: 'Rocker color changing light' },
  { id: '1.32', name: 'Rocker transporter' }
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', async () => {
        await fs.writeFile(filepath, Buffer.concat(chunks));
        resolve(filepath);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function scrapeRetry() {
  console.log('=== Retrying failed builds ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  // Navigate to base page
  console.log('Navigating to base URL...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await new Promise(r => setTimeout(r, 5000));

  // Expand Assembly Course menu
  console.log('Expanding Assembly Course menu...');
  await page.click('text=1.Assembly Course');
  await new Promise(r => setTimeout(r, 3000));

  // Scroll the sidebar to make sure all items are visible
  console.log('Scrolling sidebar to load all items...');
  await page.evaluate(() => {
    const sidebar = document.querySelector('.left-menu');
    if (sidebar) sidebar.scrollTop = sidebar.scrollHeight;
  });
  await new Promise(r => setTimeout(r, 2000));

  for (const build of buildsToRetry) {
    console.log(`\nProcessing ${build.id} ${build.name}...`);

    const buildData = {
      id: build.id,
      name: build.name,
      scrapedAt: new Date().toISOString(),
      images: [],
      downloadedImages: [],
      error: null
    };

    try {
      // Try multiple selector strategies
      let clicked = false;
      const selectors = [
        `a:has-text("${build.id}")`,
        `text=${build.id}`,
        `a >> text=${build.id}`,
        `.left-menu >> text=${build.id}`
      ];

      for (const selector of selectors) {
        try {
          console.log(`  Trying selector: ${selector}`);
          await page.click(selector, { timeout: 5000 });
          clicked = true;
          break;
        } catch (e) {
          console.log(`  Failed: ${e.message.split('\n')[0]}`);
        }
      }

      if (!clicked) {
        throw new Error('Could not click build link with any selector');
      }

      await new Promise(r => setTimeout(r, 3000));
      await page.waitForSelector('article', { timeout: 30000 });

      // Scroll to load images
      for (let j = 0; j < 20; j++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 300));
      }
      await new Promise(r => setTimeout(r, 2000));

      // Get HTML
      buildData.html = await page.$eval('article', el => el.innerHTML);

      // Get images
      buildData.images = await page.$$eval('article img', imgs =>
        imgs.map(img => ({ src: img.src, alt: img.alt || '' }))
          .filter(img => img.src && img.src.includes('yahboom.net'))
      );

      // Get title
      buildData.title = await page.$eval('article h2, article h3', el => el.textContent.trim()).catch(() => '');

      // Save HTML
      const htmlFile = `${build.id.replace('.', '-')}.html`;
      await fs.writeFile(path.join(RAW_HTML_DIR, htmlFile), buildData.html);

      // Download images
      const imgDir = path.join(RAW_IMAGES_DIR, build.id);
      await fs.mkdir(imgDir, { recursive: true });

      for (let k = 0; k < buildData.images.length; k++) {
        try {
          const img = buildData.images[k];
          const ext = path.extname(img.src.split('?')[0]) || '.jpg';
          const localFile = `${build.id}-img-${k.toString().padStart(3, '0')}${ext}`;
          const localPath = path.join(imgDir, localFile);
          await downloadImage(img.src, localPath);
          buildData.downloadedImages.push({ index: k, src: img.src, local: localPath });
          await new Promise(r => setTimeout(r, 100));
        } catch (e) {
          // Skip failed image
        }
      }

      console.log(`  ✓ ${buildData.images.length} images, ${buildData.downloadedImages.length} downloaded`);

    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      buildData.error = err.message;
    }

    // Save metadata
    const metaFile = `${build.id.replace('.', '-')}.json`;
    await fs.writeFile(path.join(RAW_HTML_DIR, metaFile), JSON.stringify(buildData, null, 2));
  }

  await browser.close();
  console.log('\n=== Retry complete ===\n');
}

scrapeRetry().catch(console.error);
