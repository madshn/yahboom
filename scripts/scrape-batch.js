import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';
const RAW_HTML_DIR = './raw/html';
const RAW_IMAGES_DIR = './raw/images-original';

// Get batch parameters from command line
const startIndex = parseInt(process.argv[2]) || 0;
const endIndex = parseInt(process.argv[3]) || 999;
const batchId = process.argv[4] || 'default';

console.log(`\n=== Batch ${batchId}: Processing builds ${startIndex} to ${endIndex} ===\n`);

// Download image helper
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

async function scrapeBatch() {
  // Load build list
  const buildLinks = JSON.parse(await fs.readFile('./raw/html/_build-links.json', 'utf-8'));
  const batchBuilds = buildLinks.slice(startIndex, endIndex + 1);

  console.log(`Processing ${batchBuilds.length} builds in batch ${batchId}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  const results = [];

  // Navigate to base page first
  console.log(`[${batchId}] Navigating to base URL...`);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await new Promise(r => setTimeout(r, 5000));

  // Expand Assembly Course menu
  console.log(`[${batchId}] Expanding Assembly Course menu...`);
  try {
    await page.click('text=1.Assembly Course');
    await new Promise(r => setTimeout(r, 3000));
  } catch (e) {
    console.log(`[${batchId}] Warning: Could not expand menu: ${e.message}`);
  }

  for (let i = 0; i < batchBuilds.length; i++) {
    const build = batchBuilds[i];
    console.log(`[${batchId}] ${i + 1}/${batchBuilds.length}: ${build.id} ${build.name}`);

    const buildData = {
      id: build.id,
      name: build.name,
      scrapedAt: new Date().toISOString(),
      images: [],
      downloadedImages: [],
      error: null
    };

    try {
      // Click on the build link by text - use the ID pattern like "1.1"
      const linkText = build.id + build.name;
      const linkSelector = `.left-menu a:has-text("${build.id}")`;

      // Try clicking the link
      try {
        await page.click(linkSelector, { timeout: 10000 });
      } catch (clickErr) {
        // Alternative: click by exact text match
        const altSelector = `text=${build.id}${build.name}`;
        await page.click(altSelector, { timeout: 10000 });
      }

      await new Promise(r => setTimeout(r, 3000));

      // Wait for article content
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
    results.push(buildData);

    // Delay between builds
    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();

  // Save batch results
  await fs.writeFile(
    path.join(RAW_HTML_DIR, `_batch-${batchId}.json`),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n=== Batch ${batchId} complete: ${results.filter(r => !r.error).length}/${results.length} successful ===\n`);
}

scrapeBatch().catch(console.error);
