import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';
const RAW_HTML_DIR = './raw/html';
const RAW_IMAGES_DIR = './raw/images-original';

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Download image helper
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.open(filepath, 'w').then(fh => {
      protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
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
  });
}

// Get all build links from the sidebar
async function getAllBuildLinks(page) {
  console.log('Getting all build links from sidebar...\n');

  // Navigate to main page
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await delay(5000);

  // Click on Assembly Course to expand
  console.log('Expanding Assembly Course menu...');
  await page.click('text=1.Assembly Course');
  await delay(3000);

  // Get all links in the Assembly Course section
  const buildLinks = await page.$$eval('.left-menu a[href*="buildingbit-super-kit"]', links => {
    return links
      .map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        // Parse ID and name from text like "1.1Mobile shooter"
        id: a.textContent.match(/^(\d+\.\d+)/)?.[1] || '',
        name: a.textContent.replace(/^\d+\.\d+/, '').trim()
      }))
      .filter(link => link.id && link.id.startsWith('1.')); // Only Assembly Course items (1.x)
  });

  console.log(`Found ${buildLinks.length} assembly build links\n`);
  return buildLinks;
}

// Scrape a single build page
async function scrapeBuildPage(page, buildInfo) {
  const { id, name, href } = buildInfo;
  console.log(`\nScraping ${id} ${name}...`);

  const buildData = {
    id,
    name,
    href,
    scrapedAt: new Date().toISOString(),
    images: [],
    html: '',
    error: null
  };

  try {
    // Navigate to the build page
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await delay(3000);

    // Wait for content
    await page.waitForSelector('article', { timeout: 30000 });

    // Scroll to load all images
    console.log(`  Scrolling to load images...`);
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await delay(300);
    }
    await delay(3000);

    // Get full article HTML
    buildData.html = await page.$eval('article', el => el.innerHTML);

    // Get all images
    buildData.images = await page.$$eval('article img', imgs =>
      imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth,
        height: img.naturalHeight
      })).filter(img => img.src && img.src.includes('yahboom.net'))
    );

    // Get page title/heading
    buildData.title = await page.$eval('article h2, article h3', el => el.textContent.trim()).catch(() => '');

    console.log(`  ✓ Found ${buildData.images.length} images`);
    console.log(`  ✓ HTML size: ${buildData.html.length} chars`);

  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    buildData.error = err.message;
  }

  return buildData;
}

// Download all images for a build
async function downloadBuildImages(buildData) {
  const { id, images } = buildData;
  if (!images || images.length === 0) return [];

  const downloadedImages = [];
  const buildImagesDir = path.join(RAW_IMAGES_DIR, id);
  await fs.mkdir(buildImagesDir, { recursive: true });

  console.log(`  Downloading ${images.length} images for ${id}...`);

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      // Extract filename from URL
      const urlParts = img.src.split('/');
      const originalFilename = urlParts[urlParts.length - 1];
      const ext = path.extname(originalFilename) || '.jpg';
      const localFilename = `${id}-img-${i.toString().padStart(3, '0')}${ext}`;
      const filepath = path.join(buildImagesDir, localFilename);

      await downloadImage(img.src, filepath);
      downloadedImages.push({
        index: i,
        originalUrl: img.src,
        localPath: filepath,
        alt: img.alt
      });

      // Small delay between downloads
      await delay(200);
    } catch (err) {
      console.log(`    ✗ Failed to download image ${i}: ${err.message}`);
    }
  }

  console.log(`  ✓ Downloaded ${downloadedImages.length}/${images.length} images`);
  return downloadedImages;
}

// Main scraper function
async function scrapeAllBuilds() {
  console.log('='.repeat(60));
  console.log('Full Yahboom Building:bit Scraper');
  console.log('='.repeat(60));
  console.log(`\nStarting at ${new Date().toISOString()}\n`);

  // Ensure directories exist
  await fs.mkdir(RAW_HTML_DIR, { recursive: true });
  await fs.mkdir(RAW_IMAGES_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  const allBuildsData = [];

  try {
    // Step 1: Get all build links
    const buildLinks = await getAllBuildLinks(page);

    // Save build links list
    await fs.writeFile(
      path.join(RAW_HTML_DIR, '_build-links.json'),
      JSON.stringify(buildLinks, null, 2)
    );
    console.log(`Saved ${buildLinks.length} build links to _build-links.json\n`);

    // Step 2: Scrape each build page
    for (let i = 0; i < buildLinks.length; i++) {
      const buildInfo = buildLinks[i];
      console.log(`\n[${ i + 1}/${buildLinks.length}] Processing ${buildInfo.id} ${buildInfo.name}`);

      // Scrape the page
      const buildData = await scrapeBuildPage(page, buildInfo);

      // Save raw HTML
      const htmlFilename = `${buildInfo.id.replace('.', '-')}.html`;
      await fs.writeFile(
        path.join(RAW_HTML_DIR, htmlFilename),
        buildData.html || ''
      );

      // Download images
      buildData.downloadedImages = await downloadBuildImages(buildData);

      // Save metadata
      const metaFilename = `${buildInfo.id.replace('.', '-')}.json`;
      await fs.writeFile(
        path.join(RAW_HTML_DIR, metaFilename),
        JSON.stringify(buildData, null, 2)
      );

      allBuildsData.push(buildData);

      // Delay between builds to be nice to the server
      console.log('  Waiting before next build...');
      await delay(2000);
    }

    // Save combined data
    await fs.writeFile(
      path.join(RAW_HTML_DIR, '_all-builds.json'),
      JSON.stringify(allBuildsData, null, 2)
    );

    console.log('\n' + '='.repeat(60));
    console.log(`\n✓ Scraping complete!`);
    console.log(`  Total builds: ${allBuildsData.length}`);
    console.log(`  Successful: ${allBuildsData.filter(b => !b.error).length}`);
    console.log(`  Failed: ${allBuildsData.filter(b => b.error).length}`);
    console.log(`\nRaw data saved to: ${RAW_HTML_DIR}`);
    console.log(`Original images saved to: ${RAW_IMAGES_DIR}`);

  } finally {
    await browser.close();
  }

  return allBuildsData;
}

// Also scrape the coding courses structure (MakeCode, Python, Sensor)
async function scrapeCodingCourses() {
  console.log('\n' + '='.repeat(60));
  console.log('Scraping Coding Courses Structure');
  console.log('='.repeat(60) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  const coursesData = {
    makecode: [],
    python: [],
    sensorAdvanced: []
  };

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await delay(5000);

    // Get MakeCode courses (Section 3)
    console.log('Expanding MakeCode Course menu...');
    await page.click('text=3.MakeCode Course');
    await delay(2000);

    coursesData.makecode = await page.$$eval('.left-menu a[href*="buildingbit-super-kit"]', links => {
      return links
        .map(a => ({
          href: a.href,
          text: a.textContent.trim(),
          section: a.textContent.match(/^(\d+\.[A-Z])/)?.[1] || '',
          name: a.textContent.replace(/^\d+\.[A-Z]\.?/, '').trim()
        }))
        .filter(link => link.section && link.section.startsWith('3.'));
    });
    console.log(`Found ${coursesData.makecode.length} MakeCode courses`);

    // Get Python courses (Section 4)
    console.log('Expanding Python Course menu...');
    await page.click('text=4.Python Course');
    await delay(2000);

    coursesData.python = await page.$$eval('.left-menu a[href*="buildingbit-super-kit"]', links => {
      return links
        .map(a => ({
          href: a.href,
          text: a.textContent.trim(),
          section: a.textContent.match(/^(\d+\.[A-Z])/)?.[1] || '',
          name: a.textContent.replace(/^\d+\.[A-Z]\.?/, '').trim()
        }))
        .filter(link => link.section && link.section.startsWith('4.'));
    });
    console.log(`Found ${coursesData.python.length} Python courses`);

    // Get Sensor Advanced courses (Section 5)
    console.log('Expanding Sensor Advanced Course menu...');
    await page.click('text=5.Sensor Advanced Course');
    await delay(2000);

    coursesData.sensorAdvanced = await page.$$eval('.left-menu a[href*="buildingbit-super-kit"]', links => {
      return links
        .map(a => ({
          href: a.href,
          text: a.textContent.trim(),
          section: a.textContent.match(/^(\d+\.\d+\.\d+)/)?.[1] || '',
          name: a.textContent.replace(/^\d+\.\d+\.\d+\.?/, '').trim()
        }))
        .filter(link => link.section && link.section.startsWith('5.'));
    });
    console.log(`Found ${coursesData.sensorAdvanced.length} Sensor Advanced courses`);

    // Save courses data
    await fs.writeFile(
      path.join(RAW_HTML_DIR, '_coding-courses.json'),
      JSON.stringify(coursesData, null, 2)
    );
    console.log('\nSaved coding courses structure to _coding-courses.json');

  } finally {
    await browser.close();
  }

  return coursesData;
}

// Run both scrapers
async function main() {
  try {
    // First get coding courses structure (quick)
    await scrapeCodingCourses();

    // Then scrape all assembly builds (slow)
    await scrapeAllBuilds();

    console.log('\n' + '='.repeat(60));
    console.log('All scraping complete!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
