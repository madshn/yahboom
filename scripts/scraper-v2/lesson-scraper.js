/**
 * Enhanced Lesson Scraper v2
 * - Full HTML content parsing
 * - Image downloading
 * - Hex file discovery
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { JSDOM } from 'jsdom';

const DELAY_MS = 2000;
const IMAGE_DIR = 'public/images/lessons';

/**
 * Fetch HTML content from URL
 */
async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Download image to local path
 */
async function downloadImage(url, localPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(localPath);

    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(localPath);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(localPath);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      reject(err);
    });
  });
}

/**
 * Parse lesson HTML and extract structured content
 */
function parseLessonHtml(html, baseUrl) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const lesson = {
    sections: {},
    images: [],
    hexFiles: [],
    rawHtml: html
  };

  // Find all headings and their content
  const headings = doc.querySelectorAll('h1, h2, h3');
  let currentSection = null;

  headings.forEach(heading => {
    const text = heading.textContent.trim().toLowerCase();

    if (text.includes('learning objective') || text.includes('1.')) {
      currentSection = 'objective';
    } else if (text.includes('building device') || text.includes('2.')) {
      currentSection = 'buildingDevices';
    } else if (text.includes('motor wiring') || text.includes('wiring') || text.includes('3.')) {
      currentSection = 'motorWiring';
    } else if (text.includes('programming') || text.includes('4.')) {
      currentSection = 'programming';
    } else if (text.includes('extension') || text.includes('4.1')) {
      currentSection = 'extension';
    } else if (text.includes('building block') && text.includes('used') || text.includes('4.2')) {
      currentSection = 'blocksUsed';
    } else if (text.includes('combining') || text.includes('4.3')) {
      currentSection = 'combinedBlocks';
    } else if (text.includes('experimental') || text.includes('phenomenon') || text.includes('5.')) {
      currentSection = 'phenomenon';
    }

    // Get content after heading until next heading
    if (currentSection) {
      let content = '';
      let sibling = heading.nextElementSibling;
      while (sibling && !['H1', 'H2', 'H3'].includes(sibling.tagName)) {
        content += sibling.textContent + '\n';
        sibling = sibling.nextElementSibling;
      }
      lesson.sections[currentSection] = content.trim();
    }
  });

  // Extract all images
  const images = doc.querySelectorAll('img');
  images.forEach((img, index) => {
    let src = img.getAttribute('src');
    if (!src) return;

    // Make absolute URL
    if (!src.startsWith('http')) {
      const urlParts = baseUrl.split('/');
      urlParts.pop(); // Remove filename
      src = urlParts.join('/') + '/' + src;
    }

    // Determine image type based on context
    let type = 'content';
    const parent = img.parentElement;
    const prevText = parent?.previousElementSibling?.textContent?.toLowerCase() || '';

    if (prevText.includes('wiring') || prevText.includes('motor') || prevText.includes('servo')) {
      type = 'wiring';
    } else if (prevText.includes('block') || prevText.includes('program') || prevText.includes('code')) {
      type = 'blocks';
    }

    lesson.images.push({
      url: src,
      type,
      alt: img.getAttribute('alt') || '',
      index
    });
  });

  // Find hex file references
  const textContent = doc.body.textContent;
  const hexMatches = textContent.match(/[\w-]+\.hex/gi);
  if (hexMatches) {
    lesson.hexFiles = [...new Set(hexMatches)];
  }

  // Extract motor wiring table if present
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    const tableText = table.textContent.toLowerCase();
    if (tableText.includes('motor') || tableText.includes('servo') || tableText.includes('m1') || tableText.includes('m3')) {
      const rows = table.querySelectorAll('tr');
      const wiring = {};
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim().toLowerCase();
          const value = cells[1].textContent.trim();
          if (key.includes('left')) wiring.leftMotor = value;
          else if (key.includes('right')) wiring.rightMotor = value;
          else if (key.includes('servo')) wiring.servo = value;
        }
      });
      if (Object.keys(wiring).length > 0) {
        lesson.sections.motorWiringTable = wiring;
      }
    }
  });

  return lesson;
}

/**
 * Scrape a single lesson with full content and images
 */
async function scrapeLesson(sourceUrl, buildId, lessonType, lessonIndex) {
  console.log(`  Scraping: ${sourceUrl}`);

  const html = await fetchHtml(sourceUrl);
  const lesson = parseLessonHtml(html, sourceUrl);

  // Download images
  const imageDir = path.join(IMAGE_DIR, buildId, lessonType, String(lessonIndex + 1));
  const downloadedImages = [];

  for (const img of lesson.images) {
    try {
      const ext = path.extname(img.url) || '.png';
      const filename = `${img.type}-${img.index}${ext}`;
      const localPath = path.join(imageDir, filename);

      await downloadImage(img.url, localPath);
      downloadedImages.push({
        ...img,
        localPath: '/' + localPath.replace(/\\/g, '/'),
        filename
      });
      console.log(`    ✓ Downloaded: ${filename}`);
    } catch (err) {
      console.log(`    ✗ Failed: ${img.url} - ${err.message}`);
    }

    await sleep(500); // Small delay between image downloads
  }

  lesson.downloadedImages = downloadedImages;
  return lesson;
}

/**
 * Scrape lessons for a build
 */
async function scrapeBuildLessons(buildId, lessonType, lessons, sourceUrls) {
  console.log(`\nScraping ${lessonType} lessons for build ${buildId}...`);

  const results = [];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const sourceUrl = lesson.sourceUrl || sourceUrls[i];

    if (!sourceUrl) {
      console.log(`  Skipping lesson ${i + 1}: No source URL`);
      results.push({ ...lesson, error: 'No source URL' });
      continue;
    }

    try {
      const scrapedData = await scrapeLesson(sourceUrl, buildId, lessonType, i);

      results.push({
        ...lesson,
        ...scrapedData.sections,
        downloadedImages: scrapedData.downloadedImages,
        hexFiles: scrapedData.hexFiles
      });
    } catch (err) {
      console.log(`  ✗ Failed: ${err.message}`);
      results.push({ ...lesson, error: err.message });
    }

    await sleep(DELAY_MS);
  }

  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
async function main() {
  const targetBuilds = process.argv.slice(2);
  if (targetBuilds.length === 0) {
    console.log('Usage: node lesson-scraper.js 1.1 1.2 1.3');
    process.exit(1);
  }

  console.log(`Scraping builds: ${targetBuilds.join(', ')}`);

  // Load current builds data
  const buildsPath = 'public/data/builds.json';
  const buildsData = JSON.parse(fs.readFileSync(buildsPath, 'utf-8'));

  for (const buildId of targetBuilds) {
    const build = buildsData.builds.find(b => b.id === buildId);
    if (!build) {
      console.log(`Build ${buildId} not found!`);
      continue;
    }

    // Scrape MakeCode lessons
    if (build.codingCourses?.makecode?.lessons) {
      const scrapedMakecode = await scrapeBuildLessons(
        buildId,
        'makecode',
        build.codingCourses.makecode.lessons,
        []
      );
      build.codingCourses.makecode.lessons = scrapedMakecode;
    }

    // Scrape Python lessons
    if (build.codingCourses?.python?.lessons) {
      const scrapedPython = await scrapeBuildLessons(
        buildId,
        'python',
        build.codingCourses.python.lessons,
        []
      );
      build.codingCourses.python.lessons = scrapedPython;
    }
  }

  // Save updated builds
  fs.writeFileSync(buildsPath, JSON.stringify(buildsData, null, 2));
  console.log(`\n✅ Updated ${buildsPath}`);
}

main().catch(console.error);
