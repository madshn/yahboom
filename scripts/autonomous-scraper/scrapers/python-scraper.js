// Python lesson scraper

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BASE_URL, PYTHON_SECTIONS, PATHS } from '../config.js';
import {
  createPage,
  navigateTo,
  scrollFullPage,
} from '../utils/browser.js';
import { logger } from '../utils/logger.js';
import { stateManager } from '../state-manager.js';
import { parsePythonLesson } from '../parsers/lesson-parser.js';
import { rateLimiter } from '../utils/rate-limiter.js';

/**
 * Scrape a single Python lesson
 */
async function scrapePythonLesson(page, buildId, lessonIndex, lessonInfo) {
  const context = `python:${buildId}:${lessonIndex}`;
  logger.info(`Scraping lesson: ${lessonInfo.title || lessonIndex}`, context);

  try {
    if (lessonInfo.href) {
      await rateLimiter.wait();
      await navigateTo(page, lessonInfo.href);
    }

    await page.waitForTimeout(2000);
    await scrollFullPage(page, 5);

    // Check for iframe
    const iframeUrl = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      return iframe ? iframe.src : null;
    });

    if (iframeUrl) {
      await rateLimiter.wait();
      await navigateTo(page, iframeUrl);
      await page.waitForTimeout(2000);
    }

    // Parse lesson
    const lesson = await parsePythonLesson(page);

    lesson.title = lesson.title || lessonInfo.title || `Lesson ${lessonIndex}`;
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
 * Scrape all Python lessons for a build
 */
async function scrapeBuildPython(page, buildId, buildInfo) {
  const context = `python:${buildId}`;
  logger.info(`Scraping Python for ${buildId} (${buildInfo.name})`, context);

  const lessons = [];

  // Load course mappings
  let courseMappings = {};
  if (existsSync(PATHS.courseMappings)) {
    courseMappings = JSON.parse(readFileSync(PATHS.courseMappings, 'utf-8'));
  }

  const buildCourseInfo = courseMappings.python?.[buildId];
  const lessonList = buildCourseInfo?.lessons || [];

  if (lessonList.length === 0) {
    // Discover dynamically
    logger.info('No pre-mapped lessons, discovering dynamically...', context);

    await navigateTo(page, BASE_URL);
    await page.waitForTimeout(2000);

    const sectionSelector = `text=${buildInfo.section}.${buildInfo.name}`;
    try {
      await page.click(sectionSelector, { timeout: 10000 });
      await page.waitForTimeout(2000);

      const discoveredLessons = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.left-menu a, .menu a').forEach(a => {
          const text = a.textContent.trim();
          const href = a.href;
          if (text && href && !text.match(/^\d+\.[A-Z]/)) {
            items.push({ title: text, href });
          }
        });
        return items.slice(0, 15);
      });

      for (let i = 0; i < discoveredLessons.length; i++) {
        const lesson = await scrapePythonLesson(
          page,
          buildId,
          i,
          discoveredLessons[i]
        );
        lessons.push(lesson);
      }
    } catch (error) {
      logger.error(`Could not find section: ${error.message}`, context);
    }
  } else {
    for (let i = 0; i < lessonList.length; i++) {
      const lesson = await scrapePythonLesson(page, buildId, i, lessonList[i]);
      lessons.push(lesson);
    }
  }

  return lessons;
}

/**
 * Scrape all Python courses
 */
export async function scrapePython() {
  logger.phase('PYTHON SCRAPING');

  const page = await createPage();
  const buildsToScrape = Object.entries(PYTHON_SECTIONS);
  let scraped = 0;

  // Load existing builds.json
  let builds = [];
  if (existsSync(PATHS.buildsJson)) {
    const data = JSON.parse(readFileSync(PATHS.buildsJson, 'utf-8'));
    builds = data.builds || data;
  }

  try {
    for (const [buildId, buildInfo] of buildsToScrape) {
      if (stateManager.isComplete(buildId, 'python')) {
        logger.info(`Skipping ${buildId} (already complete)`, 'python');
        continue;
      }

      stateManager.setBuildStatus(buildId, 'python', 'in_progress');

      try {
        const lessons = await scrapeBuildPython(page, buildId, buildInfo);

        // Update builds.json
        const buildIndex = builds.findIndex(b => b.id === buildId);
        if (buildIndex >= 0) {
          if (!builds[buildIndex].codingCourses) {
            builds[buildIndex].codingCourses = {};
          }
          builds[buildIndex].codingCourses.python = {
            section: buildInfo.section,
            name: buildInfo.name,
            lessons,
          };
        }

        writeFileSync(PATHS.buildsJson, JSON.stringify({ builds }, null, 2));
        stateManager.markComplete(buildId, 'python');
        scraped++;

        logger.progress(scraped, buildsToScrape.length, `${buildId} - ${lessons.length} lessons`);
      } catch (error) {
        stateManager.markFailed(buildId, 'python', error);
        logger.error(`Failed ${buildId}: ${error.message}`, 'python');
      }

      await page.waitForTimeout(2000);
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

export default scrapePython;
