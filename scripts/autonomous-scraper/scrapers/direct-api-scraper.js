// Direct API Scraper - Uses /build?id=X endpoint to get iframe URLs
// Then fetches HTML content directly without browser navigation

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BUILD_API, ALL_BUILD_IDS, PATHS, RATE_LIMIT } from '../config.js';
import { logger } from '../utils/logger.js';
import { rateLimiter } from '../utils/rate-limiter.js';
import { withRetry } from '../utils/retry.js';
import { stateManager } from '../state-manager.js';

const BASE_URL = 'https://www.yahboom.net';

/**
 * Fetch build data from the API
 * @param {string} buildId - The build ID to fetch
 * @returns {Promise<Object>} Build data including iframe URL
 */
async function fetchBuildData(buildId) {
  await rateLimiter.wait();

  const url = `${BUILD_API}?id=${buildId}`;
  logger.info(`Fetching build ${buildId}...`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.yahboom.net/study/buildingbit-super-kit',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  // API returns an array, first element is the build data
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Extract iframe URL from build data
 * @param {Object} buildData - API response data
 * @returns {string|null} Full iframe URL or null
 */
function extractIframeUrl(buildData) {
  if (!buildData || !buildData.content) return null;

  // Content contains escaped iframe HTML like: <iframe src=\"\/public\/upload\/upload-html\/123\/file.html\"...>
  // The JSON parsing already unescapes the backslashes, but we need to handle both cases
  let content = buildData.content;

  // Try to find the src attribute (handles both escaped and unescaped)
  const match = content.match(/src=["\\]*"?([^"\\]+upload-html[^"\\]+)/);
  if (match) {
    let path = match[1];
    // Clean up any remaining escapes
    path = path.replace(/\\\//g, '/');
    return path.startsWith('http') ? path : `${BASE_URL}${path}`;
  }

  // Alternative: look for the path pattern directly
  const altMatch = content.match(/\/public\/upload\/upload-html\/[^"\\]+\.html/);
  if (altMatch) {
    return `${BASE_URL}${altMatch[0]}`;
  }

  return null;
}

/**
 * Fetch HTML content from iframe URL
 * @param {string} url - The iframe URL
 * @returns {Promise<string>} HTML content
 */
async function fetchHtmlContent(url) {
  await rateLimiter.wait();

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.yahboom.net/study/buildingbit-super-kit',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Parse lesson content from HTML
 * @param {string} html - Raw HTML content
 * @returns {Object} Parsed lesson data
 */
function parseLessonHtml(html) {
  const lesson = {
    objective: '',
    motorWiring: null,
    blocksUsed: [],
    code: null,
    phenomenon: '',
    pythonCode: null,
    images: [],
  };

  // Extract learning objectives
  const objectiveMatch = html.match(/<h[12][^>]*>.*?Learning objectives.*?<\/h[12]>\s*([\s\S]*?)(?=<h[12]|$)/i);
  if (objectiveMatch) {
    lesson.objective = cleanHtml(objectiveMatch[1]);
  }

  // Extract motor wiring
  const wiringMatch = html.match(/<h[12][^>]*>.*?Motor wiring.*?<\/h[12]>\s*([\s\S]*?)(?=<h[12]|$)/i);
  if (wiringMatch) {
    const wiringHtml = wiringMatch[1];
    lesson.motorWiring = {
      description: cleanHtml(wiringHtml),
    };
    // Extract images
    const imgMatches = wiringHtml.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi);
    for (const img of imgMatches) {
      lesson.images.push({ type: 'wiring', url: img[1] });
    }
  }

  // Extract blocks used
  const blocksMatch = html.match(/<h[23][^>]*>.*?Building blocks.*?<\/h[23]>\s*([\s\S]*?)(?=<h[23]|$)/i);
  if (blocksMatch) {
    const blocksHtml = blocksMatch[1];
    // Look for category/blocks pattern
    const categoryMatches = blocksHtml.matchAll(/<p[^>]*>([^<]+)<\/p>\s*<img[^>]+>/gi);
    for (const cat of categoryMatches) {
      lesson.blocksUsed.push(cat[1].trim());
    }
  }

  // Extract combined blocks / code
  const codeMatch = html.match(/<h[23][^>]*>.*?Combined blocks.*?<\/h[23]>\s*([\s\S]*?)(?=<h[23]|$)/i);
  if (codeMatch) {
    const codeHtml = codeMatch[1];
    lesson.code = {
      description: cleanHtml(codeHtml),
    };
    // Extract code images
    const imgMatches = codeHtml.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi);
    for (const img of imgMatches) {
      lesson.images.push({ type: 'code', url: img[1] });
    }
  }

  // Extract experimental phenomenon
  const phenomMatch = html.match(/<h[12][^>]*>.*?Experimental phenomenon.*?<\/h[12]>\s*([\s\S]*?)(?=<h[12]|$)/i);
  if (phenomMatch) {
    lesson.phenomenon = cleanHtml(phenomMatch[1]);
  }

  // Extract Python code blocks
  const pythonMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (pythonMatch) {
    lesson.pythonCode = pythonMatch[1].trim();
  }

  // Extract all images
  const allImgMatches = html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi);
  for (const img of allImgMatches) {
    const url = img[1];
    if (!lesson.images.some(i => i.url === url)) {
      lesson.images.push({ type: 'content', url });
    }
  }

  return lesson;
}

/**
 * Clean HTML by removing tags and normalizing whitespace
 */
function cleanHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scrape a single lesson using direct API
 * @param {Object} lessonInfo - { title, buildId }
 * @returns {Promise<Object>} Lesson data
 */
async function scrapeSingleLesson(lessonInfo) {
  const { title, buildId } = lessonInfo;

  try {
    // Fetch build data from API
    const buildData = await withRetry(
      () => fetchBuildData(buildId),
      `Fetch build ${buildId}`
    );

    // Extract iframe URL
    const iframeUrl = extractIframeUrl(buildData);
    if (!iframeUrl) {
      logger.warn(`No iframe URL found for build ${buildId}`);
      return { title, buildId, error: 'No iframe URL' };
    }

    logger.info(`  Iframe URL: ${iframeUrl}`);

    // Fetch HTML content
    const html = await withRetry(
      () => fetchHtmlContent(iframeUrl),
      `Fetch HTML for ${title}`
    );

    // Parse lesson content
    const lesson = parseLessonHtml(html);

    return {
      title,
      buildId,
      sourceUrl: iframeUrl,
      ...lesson,
      scrapedAt: new Date().toISOString(),
    };

  } catch (error) {
    logger.error(`Failed to scrape ${title}: ${error.message}`);
    stateManager.recordError(buildId, 'lesson', error.message);
    return { title, buildId, error: error.message };
  }
}

/**
 * Scrape all MakeCode lessons using direct API
 */
export async function scrapeMakeCodeDirect() {
  logger.phase('MAKECODE DIRECT API SCRAPING');

  const builds = ALL_BUILD_IDS.makecode;
  const results = {};
  let totalScraped = 0;

  for (const [sectionName, lessons] of Object.entries(builds)) {
    logger.info(`\nSection: ${sectionName}`);
    results[sectionName] = [];

    for (const lessonInfo of lessons) {
      // Check if already scraped
      const stateKey = `makecode_${lessonInfo.buildId}`;
      if (stateManager.isKeyComplete(stateKey)) {
        logger.info(`  Skipping ${lessonInfo.title} (already complete)`);
        continue;
      }

      const lessonData = await scrapeSingleLesson(lessonInfo);
      results[sectionName].push(lessonData);

      if (!lessonData.error) {
        stateManager.markKeyComplete(stateKey);
        totalScraped++;
        logger.success(`  ✓ ${lessonInfo.title}`);
      }

      // Rate limit pause
      await new Promise(r => setTimeout(r, RATE_LIMIT.pauseBetweenBuilds));
    }
  }

  // Save results
  const outputPath = join('data', 'makecode-lessons.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  logger.success(`\nSaved ${totalScraped} MakeCode lessons to ${outputPath}`);

  stateManager.updateStats('makecodeScraped', totalScraped);
  return results;
}

/**
 * Scrape all Python lessons using direct API
 */
export async function scrapePythonDirect() {
  logger.phase('PYTHON DIRECT API SCRAPING');

  const builds = ALL_BUILD_IDS.python;
  const results = {};
  let totalScraped = 0;

  for (const [sectionName, lessons] of Object.entries(builds)) {
    logger.info(`\nSection: ${sectionName}`);
    results[sectionName] = [];

    for (const lessonInfo of lessons) {
      // Check if already scraped
      const stateKey = `python_${lessonInfo.buildId}`;
      if (stateManager.isKeyComplete(stateKey)) {
        logger.info(`  Skipping ${lessonInfo.title} (already complete)`);
        continue;
      }

      const lessonData = await scrapeSingleLesson(lessonInfo);
      results[sectionName].push(lessonData);

      if (!lessonData.error) {
        stateManager.markKeyComplete(stateKey);
        totalScraped++;
        logger.success(`  ✓ ${lessonInfo.title}`);
      }

      // Rate limit pause
      await new Promise(r => setTimeout(r, RATE_LIMIT.pauseBetweenBuilds));
    }
  }

  // Save results
  const outputPath = join('data', 'python-lessons.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  logger.success(`\nSaved ${totalScraped} Python lessons to ${outputPath}`);

  stateManager.updateStats('pythonScraped', totalScraped);
  return results;
}

/**
 * Scrape sensor principles using direct API
 */
export async function scrapeSensorPrinciplesDirect() {
  logger.phase('SENSOR PRINCIPLES DIRECT API SCRAPING');

  const principles = ALL_BUILD_IDS.sensorPrinciples;
  const advanced = ALL_BUILD_IDS.sensorAdvanced;
  const results = {
    principles: [],
    advanced: [],
  };

  // Scrape principles
  logger.info('\nSensor Principles (1.x):');
  for (const lessonInfo of principles) {
    const stateKey = `sensor_${lessonInfo.buildId}`;
    if (stateManager.isKeyComplete(stateKey)) {
      logger.info(`  Skipping ${lessonInfo.title} (already complete)`);
      continue;
    }

    const lessonData = await scrapeSingleLesson(lessonInfo);
    results.principles.push(lessonData);

    if (!lessonData.error) {
      stateManager.markKeyComplete(stateKey);
      logger.success(`  ✓ ${lessonInfo.title}`);
    }

    await new Promise(r => setTimeout(r, RATE_LIMIT.pauseBetweenBuilds));
  }

  // Scrape advanced
  logger.info('\nSensor Advanced (2.x):');
  for (const lessonInfo of advanced) {
    const stateKey = `sensor_${lessonInfo.buildId}`;
    if (stateManager.isKeyComplete(stateKey)) {
      logger.info(`  Skipping ${lessonInfo.title} (already complete)`);
      continue;
    }

    const lessonData = await scrapeSingleLesson(lessonInfo);
    results.advanced.push(lessonData);

    if (!lessonData.error) {
      stateManager.markKeyComplete(stateKey);
      logger.success(`  ✓ ${lessonInfo.title}`);
    }

    await new Promise(r => setTimeout(r, RATE_LIMIT.pauseBetweenBuilds));
  }

  // Save results
  const outputPath = join('data', 'sensor-principles.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  logger.success(`\nSaved sensor principles to ${outputPath}`);

  return results;
}

/**
 * Run all direct API scraping
 */
export async function scrapeAllDirect() {
  logger.phase('DIRECT API SCRAPING - ALL CONTENT');

  const results = {
    makecode: await scrapeMakeCodeDirect(),
    python: await scrapePythonDirect(),
    sensors: await scrapeSensorPrinciplesDirect(),
  };

  // Save combined results
  const outputPath = join('data', 'all-scraped-content.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  logger.success(`\nAll content saved to ${outputPath}`);

  return results;
}
