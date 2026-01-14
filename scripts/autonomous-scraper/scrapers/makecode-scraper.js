// MakeCode lesson scraper

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BASE_URL, MAKECODE_SECTIONS, PATHS, TIMEOUTS } from '../config.js';
import {
  createPage,
  navigateTo,
  waitForContent,
  scrollFullPage,
  getPageContent,
} from '../utils/browser.js';
import { logger } from '../utils/logger.js';
import { stateManager } from '../state-manager.js';
import { parseMakeCodeLesson } from '../parsers/lesson-parser.js';
import { withRetry } from '../utils/retry.js';
import { rateLimiter } from '../utils/rate-limiter.js';

/**
 * Download an image and save locally
 */
async function downloadImage(page, imageUrl, localPath) {
  try {
    const response = await page.request.get(imageUrl);
    if (response.ok()) {
      const buffer = await response.body();
      writeFileSync(localPath, buffer);
      return true;
    }
  } catch (error) {
    logger.warn(`Failed to download image: ${error.message}`);
  }
  return false;
}

/**
 * Scrape a single MakeCode lesson
 */
async function scrapeMakeCodeLesson(page, buildId, lessonIndex, lessonInfo) {
  const context = `makecode:${buildId}:${lessonIndex}`;
  logger.info(`Scraping lesson: ${lessonInfo.title || lessonIndex}`, context);

  try {
    // Navigate to lesson URL if provided
    if (lessonInfo.href) {
      await rateLimiter.wait();
      await navigateTo(page, lessonInfo.href);
    }

    // Wait for content to load
    await page.waitForTimeout(2000);
    await scrollFullPage(page, 8);

    // Check for iframe and navigate to it if present
    const iframeUrl = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      return iframe ? iframe.src : null;
    });

    if (iframeUrl) {
      logger.debug(`Found iframe, navigating to: ${iframeUrl}`, context);
      await rateLimiter.wait();
      await navigateTo(page, iframeUrl);
      await page.waitForTimeout(2000);
      await scrollFullPage(page, 8);
    }

    // Parse lesson content
    const lesson = await parseMakeCodeLesson(page);

    // Download images
    const imageDir = join(PATHS.rawImages, 'makecode', buildId);
    if (!existsSync(imageDir)) {
      mkdirSync(imageDir, { recursive: true });
    }

    // Download code block images
    if (lesson.code?.images?.length > 0) {
      for (let i = 0; i < lesson.code.images.length; i++) {
        const img = lesson.code.images[i];
        const localPath = join(imageDir, `lesson-${lessonIndex}-code-${i}.png`);
        if (await downloadImage(page, img.src, localPath)) {
          lesson.code.images[i].localPath = localPath;
        }
      }
    }

    // Download wiring images
    if (lesson.motorWiring?.images?.length > 0) {
      for (let i = 0; i < lesson.motorWiring.images.length; i++) {
        const img = lesson.motorWiring.images[i];
        const localPath = join(imageDir, `lesson-${lessonIndex}-wiring-${i}.png`);
        if (await downloadImage(page, img.src, localPath)) {
          lesson.motorWiring.images[i].localPath = localPath;
        }
      }
    }

    // Add metadata
    lesson.sourceUrl = iframeUrl || lessonInfo.href || page.url();
    lesson.scrapedAt = new Date().toISOString();

    return lesson;
  } catch (error) {
    logger.error(`Failed to scrape lesson: ${error.message}`, context);
    return {
      title: lessonInfo.title || `Lesson ${lessonIndex}`,
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

/**
 * Scrape all MakeCode lessons for a build
 */
async function scrapeBuildMakeCode(page, buildId, buildInfo) {
  const context = `makecode:${buildId}`;
  logger.info(`Scraping MakeCode for ${buildId} (${buildInfo.name})`, context);

  const lessons = [];

  // Load course mappings if available
  let courseMappings = {};
  if (existsSync(PATHS.courseMappings)) {
    courseMappings = JSON.parse(readFileSync(PATHS.courseMappings, 'utf-8'));
  }

  const buildCourseInfo = courseMappings.makecode?.[buildId];
  const lessonList = buildCourseInfo?.lessons || [];

  if (lessonList.length === 0) {
    // Try to discover lessons dynamically
    logger.info('No pre-mapped lessons, discovering dynamically...', context);

    await navigateTo(page, BASE_URL);
    await page.waitForTimeout(2000);

    // Click on the MakeCode section
    const sectionSelector = `text=${buildInfo.section}.${buildInfo.name}`;
    try {
      await page.click(sectionSelector, { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Extract lesson links
      const discoveredLessons = await page.evaluate(() => {
        const items = [];
        // Get all links that look like lessons
        document.querySelectorAll('.left-menu a, .menu a, .course-list a').forEach(a => {
          const text = a.textContent.trim();
          const href = a.href;
          // Filter out section headers
          if (text && href && !text.match(/^\d+\.[A-Z]/)) {
            items.push({ title: text, href });
          }
        });
        return items.slice(0, 20); // Limit
      });

      for (let i = 0; i < discoveredLessons.length; i++) {
        const lesson = await scrapeMakeCodeLesson(
          page,
          buildId,
          i,
          discoveredLessons[i]
        );
        lessons.push(lesson);
      }
    } catch (error) {
      logger.error(`Could not find section ${sectionSelector}: ${error.message}`, context);
    }
  } else {
    // Scrape each pre-mapped lesson
    for (let i = 0; i < lessonList.length; i++) {
      const lesson = await scrapeMakeCodeLesson(page, buildId, i, lessonList[i]);
      lessons.push(lesson);
    }
  }

  return lessons;
}

/**
 * Scrape all MakeCode courses
 */
export async function scrapeMakeCode() {
  logger.phase('MAKECODE SCRAPING');

  const page = await createPage();
  const buildsToScrape = Object.entries(MAKECODE_SECTIONS);
  let scraped = 0;

  // Load existing builds.json
  let builds = [];
  if (existsSync(PATHS.buildsJson)) {
    const data = JSON.parse(readFileSync(PATHS.buildsJson, 'utf-8'));
    builds = data.builds || data;
  }

  try {
    for (const [buildId, buildInfo] of buildsToScrape) {
      // Check if already done
      if (stateManager.isComplete(buildId, 'makecode')) {
        logger.info(`Skipping ${buildId} (already complete)`, 'makecode');
        continue;
      }

      stateManager.setBuildStatus(buildId, 'makecode', 'in_progress');

      try {
        const lessons = await scrapeBuildMakeCode(page, buildId, buildInfo);

        // Update builds.json
        const buildIndex = builds.findIndex(b => b.id === buildId);
        if (buildIndex >= 0) {
          if (!builds[buildIndex].codingCourses) {
            builds[buildIndex].codingCourses = {};
          }
          builds[buildIndex].codingCourses.makecode = {
            section: buildInfo.section,
            name: buildInfo.name,
            lessons,
          };
        }

        // Save progress
        writeFileSync(
          PATHS.buildsJson,
          JSON.stringify({ builds }, null, 2)
        );

        stateManager.markComplete(buildId, 'makecode');
        scraped++;

        logger.progress(scraped, buildsToScrape.length, `${buildId} - ${lessons.length} lessons`);
      } catch (error) {
        stateManager.markFailed(buildId, 'makecode', error);
        logger.error(`Failed ${buildId}: ${error.message}`, 'makecode');
      }

      // Pause between builds
      await page.waitForTimeout(3000);
    }

    logger.summary({
      'Total builds': buildsToScrape.length,
      'Successfully scraped': scraped,
      'Failed': buildsToScrape.length - scraped,
    });

    return scraped;
  } finally {
    await page.close();
  }
}

export default scrapeMakeCode;
