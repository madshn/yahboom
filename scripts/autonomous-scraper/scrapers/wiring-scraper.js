// Wiring diagram scraper and downloader

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BASE_URL, SENSOR_BUILDS, PATHS } from '../config.js';
import {
  createPage,
  navigateTo,
  scrollFullPage,
  extractImages,
} from '../utils/browser.js';
import { logger } from '../utils/logger.js';
import { stateManager } from '../state-manager.js';
import { rateLimiter } from '../utils/rate-limiter.js';

/**
 * Download wiring diagram image
 */
async function downloadWiringImage(page, imageUrl, buildId) {
  const imageDir = join(PATHS.rawImages, 'wiring');
  if (!existsSync(imageDir)) {
    mkdirSync(imageDir, { recursive: true });
  }

  const localPath = join(imageDir, `${buildId}-wiring.png`);

  try {
    const response = await page.request.get(imageUrl);
    if (response.ok()) {
      const buffer = await response.body();
      writeFileSync(localPath, buffer);
      logger.success(`Downloaded wiring diagram for ${buildId}`, 'wiring');
      return localPath;
    }
  } catch (error) {
    logger.warn(`Failed to download wiring image: ${error.message}`, 'wiring');
  }
  return null;
}

/**
 * Find and scrape wiring diagram for a build
 */
async function scrapeBuildWiring(page, buildId, buildInfo) {
  const context = `wiring:${buildId}`;
  logger.info(`Looking for wiring diagram for ${buildId}`, context);

  try {
    // Navigate to sensor advanced course section
    await navigateTo(page, BASE_URL);
    await page.waitForTimeout(2000);

    // Try to find the sensor advanced section for this build
    const sectionSelector = `text=${buildInfo.section}`;

    try {
      await page.click(sectionSelector, { timeout: 10000 });
      await page.waitForTimeout(2000);
      await scrollFullPage(page, 5);
    } catch (error) {
      logger.warn(`Could not find section ${buildInfo.section}: ${error.message}`, context);
      return null;
    }

    // Look for wiring diagram images
    const images = await page.evaluate(() => {
      const imgs = [];
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || '';
        const alt = img.alt || '';
        // Wiring diagrams often have specific patterns
        if (
          src.includes('wiring') ||
          src.includes('circuit') ||
          alt.toLowerCase().includes('wiring') ||
          alt.toLowerCase().includes('circuit') ||
          // Also match images near "wiring" text
          img.closest('p')?.textContent?.toLowerCase().includes('wiring')
        ) {
          imgs.push({
            src,
            alt,
            context: img.closest('p')?.textContent?.slice(0, 100) || '',
          });
        }
      });
      return imgs;
    });

    if (images.length > 0) {
      // Download the first wiring diagram found
      const wiringImage = images[0];
      const localPath = await downloadWiringImage(page, wiringImage.src, buildId);
      return {
        imageUrl: wiringImage.src,
        localPath,
        alt: wiringImage.alt,
      };
    }

    // Fallback: look for any circuit-related images in the content
    const allImages = await extractImages(page, 'article');
    for (const img of allImages) {
      if (img.src && (img.src.includes('.png') || img.src.includes('circuit'))) {
        const localPath = await downloadWiringImage(page, img.src, buildId);
        if (localPath) {
          return {
            imageUrl: img.src,
            localPath,
            alt: img.alt,
          };
        }
      }
    }

    logger.warn(`No wiring diagram found for ${buildId}`, context);
    return null;
  } catch (error) {
    logger.error(`Error scraping wiring for ${buildId}: ${error.message}`, context);
    return null;
  }
}

/**
 * Scrape all wiring diagrams
 */
export async function scrapeWiring() {
  logger.phase('WIRING DIAGRAM SCRAPING');

  const page = await createPage();
  const buildsToScrape = Object.entries(SENSOR_BUILDS);
  let scraped = 0;

  // Load existing builds.json
  let builds = [];
  if (existsSync(PATHS.buildsJson)) {
    const data = JSON.parse(readFileSync(PATHS.buildsJson, 'utf-8'));
    builds = data.builds || data;
  }

  try {
    for (const [buildId, buildInfo] of buildsToScrape) {
      if (stateManager.isComplete(buildId, 'wiring')) {
        logger.info(`Skipping ${buildId} (already complete)`, 'wiring');
        continue;
      }

      stateManager.setBuildStatus(buildId, 'wiring', 'in_progress');
      await rateLimiter.wait();

      try {
        const wiring = await scrapeBuildWiring(page, buildId, buildInfo);

        if (wiring) {
          // Update builds.json
          const buildIndex = builds.findIndex(b => b.id === buildId);
          if (buildIndex >= 0) {
            builds[buildIndex].wiringImageUrl = wiring.imageUrl;
            if (wiring.localPath) {
              if (!builds[buildIndex].localImages) {
                builds[buildIndex].localImages = {};
              }
              builds[buildIndex].localImages.wiring = wiring.localPath.replace(
                'raw/images/wiring/',
                '/images/builds/'
              );
            }
          }

          writeFileSync(PATHS.buildsJson, JSON.stringify({ builds }, null, 2));
          stateManager.markComplete(buildId, 'wiring');
          scraped++;
        } else {
          stateManager.setBuildStatus(buildId, 'wiring', 'not_found');
        }

        logger.progress(scraped, buildsToScrape.length, buildId);
      } catch (error) {
        stateManager.markFailed(buildId, 'wiring', error);
        logger.error(`Failed ${buildId}: ${error.message}`, 'wiring');
      }

      await page.waitForTimeout(2000);
    }

    logger.summary({
      'Total builds with sensors': buildsToScrape.length,
      'Wiring diagrams found': scraped,
      'Not found': buildsToScrape.length - scraped,
    });

    return scraped;
  } finally {
    await page.close();
  }
}

export default scrapeWiring;
