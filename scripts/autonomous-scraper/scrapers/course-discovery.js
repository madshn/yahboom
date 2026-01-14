// Course discovery - map all lesson URLs from the site

import { writeFileSync } from 'fs';
import {
  BASE_URL,
  SELECTORS,
  MAKECODE_SECTIONS,
  PYTHON_SECTIONS,
  PATHS,
} from '../config.js';
import {
  createPage,
  navigateTo,
  waitForContent,
  clickAndWait,
  scrollFullPage,
} from '../utils/browser.js';
import { logger } from '../utils/logger.js';
import { stateManager } from '../state-manager.js';

/**
 * Extract all lesson links from a course section
 */
async function extractLessonLinks(page, sectionSelector, sectionName) {
  logger.info(`Extracting lessons from ${sectionName}...`);

  // Click to expand section
  try {
    await clickAndWait(page, sectionSelector);
    await page.waitForTimeout(2000);
  } catch (error) {
    logger.warn(`Could not expand ${sectionName}: ${error.message}`);
    return [];
  }

  // Extract all links in the left menu
  const links = await page.evaluate(sectionName => {
    const results = [];
    const menuLinks = document.querySelectorAll('.left-menu a, .menu a, nav a');

    menuLinks.forEach(link => {
      const text = link.textContent.trim();
      const href = link.href;

      // Match section pattern (e.g., "3.A", "4.B", "5.3.1")
      const sectionMatch = text.match(/^(\d+\.[A-Z]|\d+\.\d+\.\d+)/);
      if (sectionMatch || text.toLowerCase().includes(sectionName.toLowerCase())) {
        results.push({
          text,
          href,
          section: sectionMatch ? sectionMatch[1] : null,
        });
      }
    });

    return results;
  }, sectionName);

  logger.info(`Found ${links.length} links in ${sectionName}`);
  return links;
}

/**
 * Extract lesson iframes/content URLs for a specific build section
 */
async function extractBuildLessons(page, buildSection, buildName) {
  const lessons = [];

  // Navigate to the build's course section
  try {
    const selector = `text=${buildSection}.${buildName}`;
    await clickAndWait(page, selector);
    await page.waitForTimeout(2000);

    // Look for lesson links within this section
    const lessonLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('.left-menu a, .menu a').forEach(link => {
        const text = link.textContent.trim();
        // Lesson links are typically after the section header
        if (text && !text.match(/^\d+\.[A-Z]/)) {
          links.push({
            title: text,
            href: link.href,
          });
        }
      });
      return links;
    });

    // For each lesson, try to get the iframe URL
    for (const lesson of lessonLinks) {
      try {
        await page.click(`text=${lesson.title}`);
        await page.waitForTimeout(1500);

        // Check for iframe
        const iframeUrl = await page.evaluate(() => {
          const iframe = document.querySelector('iframe');
          return iframe ? iframe.src : null;
        });

        lessons.push({
          title: lesson.title,
          href: lesson.href,
          iframeUrl,
        });
      } catch (e) {
        lessons.push({
          title: lesson.title,
          href: lesson.href,
          iframeUrl: null,
        });
      }
    }
  } catch (error) {
    logger.warn(`Could not extract lessons for ${buildSection}: ${error.message}`);
  }

  return lessons;
}

/**
 * Discover all courses and create a complete mapping
 */
export async function discoverCourses() {
  logger.phase('COURSE DISCOVERY');

  const page = await createPage();
  const mappings = {
    makecode: {},
    python: {},
    sensorAdvanced: {},
    sensorPrinciples: [],
    discoveredAt: new Date().toISOString(),
  };

  try {
    // Navigate to main page
    await navigateTo(page, BASE_URL);
    await waitForContent(page, SELECTORS.leftMenu);
    await scrollFullPage(page, 5);

    // Discover MakeCode courses
    logger.info('Discovering MakeCode courses...');
    for (const [buildId, info] of Object.entries(MAKECODE_SECTIONS)) {
      const selector = `text=${info.section}.${info.name}`;

      try {
        // Click on the section
        await page.click(selector, { timeout: 5000 });
        await page.waitForTimeout(1500);

        // Get all lesson links under this section
        const lessons = await page.evaluate(() => {
          const items = [];
          const activeSection = document.querySelector('.left-menu .active, .menu .active');
          if (activeSection) {
            const parent = activeSection.closest('li, .menu-item');
            if (parent) {
              parent.querySelectorAll('a').forEach(a => {
                const text = a.textContent.trim();
                if (text && !text.match(/^\d+\.[A-Z]/)) {
                  items.push({ title: text, href: a.href });
                }
              });
            }
          }
          return items;
        });

        mappings.makecode[buildId] = {
          section: info.section,
          name: info.name,
          lessons,
        };

        logger.success(`${buildId}: Found ${lessons.length} MakeCode lessons`, 'Discovery');
      } catch (error) {
        logger.warn(`Could not discover MakeCode for ${buildId}: ${error.message}`);
        mappings.makecode[buildId] = {
          section: info.section,
          name: info.name,
          lessons: [],
          error: error.message,
        };
      }
    }

    // Navigate back to main page
    await navigateTo(page, BASE_URL);
    await page.waitForTimeout(2000);

    // Discover Python courses
    logger.info('Discovering Python courses...');
    for (const [buildId, info] of Object.entries(PYTHON_SECTIONS)) {
      const selector = `text=${info.section}.${info.name}`;

      try {
        await page.click(selector, { timeout: 5000 });
        await page.waitForTimeout(1500);

        const lessons = await page.evaluate(() => {
          const items = [];
          const links = document.querySelectorAll('.left-menu a, .menu a');
          links.forEach(a => {
            const text = a.textContent.trim();
            if (text && !text.match(/^\d+\.[A-Z]/) && !text.match(/^\d+\.\d+/)) {
              items.push({ title: text, href: a.href });
            }
          });
          return items.slice(0, 10); // Limit to prevent noise
        });

        mappings.python[buildId] = {
          section: info.section,
          name: info.name,
          lessons,
        };

        logger.success(`${buildId}: Found ${lessons.length} Python lessons`, 'Discovery');
      } catch (error) {
        logger.warn(`Could not discover Python for ${buildId}: ${error.message}`);
        mappings.python[buildId] = {
          section: info.section,
          name: info.name,
          lessons: [],
          error: error.message,
        };
      }
    }

    // Discover Sensor Principles
    logger.info('Discovering Sensor Principles...');
    try {
      await navigateTo(page, BASE_URL);
      await page.waitForTimeout(2000);

      // Look for sensor principles section
      const principles = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.left-menu a, .menu a').forEach(a => {
          const text = a.textContent.trim();
          // Match patterns like "1.1 About ultrasonic" or sensor-related content
          if (text.match(/sensor|ultrasonic|PIR|light|temperature|color|joystick/i)) {
            items.push({ title: text, href: a.href });
          }
        });
        return items;
      });

      mappings.sensorPrinciples = principles;
      logger.success(`Found ${principles.length} sensor principle pages`, 'Discovery');
    } catch (error) {
      logger.warn(`Could not discover sensor principles: ${error.message}`);
    }

    // Save mappings
    writeFileSync(PATHS.courseMappings, JSON.stringify(mappings, null, 2));
    logger.success(`Saved course mappings to ${PATHS.courseMappings}`);

    stateManager.setCourseMappingsStatus('complete');

    return mappings;
  } finally {
    await page.close();
  }
}

export default discoverCourses;
