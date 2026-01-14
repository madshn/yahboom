// Sensor principles chapter scraper

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BASE_URL, SENSOR_PRINCIPLES, SENSOR_BUILDS, PATHS } from '../config.js';
import {
  createPage,
  navigateTo,
  scrollFullPage,
  getPageContent,
} from '../utils/browser.js';
import { logger } from '../utils/logger.js';
import { stateManager } from '../state-manager.js';
import { parseSensorPrinciples } from '../parsers/lesson-parser.js';
import { rateLimiter } from '../utils/rate-limiter.js';

/**
 * Map sensor types to their related build IDs
 */
function getSensorToBuildsMap() {
  const map = {};

  for (const [buildId, info] of Object.entries(SENSOR_BUILDS)) {
    for (const sensor of info.sensors) {
      if (!map[sensor]) {
        map[sensor] = [];
      }
      map[sensor].push(buildId);
    }
  }

  return map;
}

/**
 * Scrape all sensor principles content
 */
export async function scrapeSensorPrinciples() {
  logger.phase('SENSOR PRINCIPLES SCRAPING');

  const page = await createPage();
  const sensorToBuilds = getSensorToBuildsMap();

  const principles = {
    chapters: [],
    scrapedAt: new Date().toISOString(),
  };

  // Define expected sensor principle chapters
  const expectedChapters = [
    {
      id: '1',
      title: 'Ultrasonic Sensor',
      sensor: 'ultrasonic',
      subchapters: [
        { id: '1.1', searchTerm: 'about ultrasonic' },
        { id: '1.2', searchTerm: 'ultrasonic ranging' },
      ],
    },
    {
      id: '2',
      title: 'Light Sensor',
      sensor: 'light',
      subchapters: [
        { id: '2.1', searchTerm: 'about light' },
        { id: '2.2', searchTerm: 'light sensing' },
      ],
    },
    {
      id: '3',
      title: 'PIR Sensor',
      sensor: 'PIR',
      subchapters: [
        { id: '3.1', searchTerm: 'about PIR' },
        { id: '3.2', searchTerm: 'motion detection' },
      ],
    },
    {
      id: '4',
      title: 'Temperature Sensor',
      sensor: 'temperature',
      subchapters: [
        { id: '4.1', searchTerm: 'about temperature' },
        { id: '4.2', searchTerm: 'temperature reading' },
      ],
    },
    {
      id: '5',
      title: 'Color Sensor',
      sensor: 'color',
      subchapters: [
        { id: '5.1', searchTerm: 'about color' },
        { id: '5.2', searchTerm: 'color recognition' },
      ],
    },
    {
      id: '6',
      title: 'Joystick',
      sensor: 'joystick',
      subchapters: [
        { id: '6.1', searchTerm: 'about joystick' },
        { id: '6.2', searchTerm: 'joystick control' },
      ],
    },
  ];

  try {
    await navigateTo(page, BASE_URL);
    await page.waitForTimeout(2000);

    // Get all menu links
    const menuLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('.left-menu a, .menu a, nav a').forEach(a => {
        links.push({
          text: a.textContent.trim().toLowerCase(),
          href: a.href,
        });
      });
      return links;
    });

    for (const chapter of expectedChapters) {
      const chapterData = {
        id: chapter.id,
        title: chapter.title,
        sensor: chapter.sensor,
        relatedBuilds: sensorToBuilds[chapter.sensor] || [],
        subchapters: [],
      };

      for (const subchapter of chapter.subchapters) {
        await rateLimiter.wait();

        // Find matching link
        const matchingLink = menuLinks.find(
          l =>
            l.text.includes(subchapter.searchTerm.toLowerCase()) ||
            l.text.includes(chapter.sensor.toLowerCase())
        );

        if (matchingLink) {
          logger.info(`Found: ${matchingLink.text}`, `sensor:${subchapter.id}`);

          try {
            await navigateTo(page, matchingLink.href);
            await page.waitForTimeout(2000);
            await scrollFullPage(page, 5);

            const content = await parseSensorPrinciples(page);

            // Download images
            const imageDir = join(PATHS.rawImages, 'sensors', chapter.id);
            if (!existsSync(imageDir)) {
              mkdirSync(imageDir, { recursive: true });
            }

            for (let i = 0; i < content.images.length; i++) {
              const img = content.images[i];
              try {
                const response = await page.request.get(img.src);
                if (response.ok()) {
                  const localPath = join(imageDir, `${subchapter.id}-${i}.png`);
                  writeFileSync(localPath, await response.body());
                  content.images[i].localPath = localPath;
                }
              } catch (e) {
                logger.warn(`Failed to download image: ${e.message}`);
              }
            }

            chapterData.subchapters.push({
              id: subchapter.id,
              title: content.title || matchingLink.text,
              content: content.text?.slice(0, 2000) || '', // Limit content length
              images: content.images,
              sourceUrl: matchingLink.href,
            });
          } catch (error) {
            logger.warn(`Failed to scrape ${subchapter.id}: ${error.message}`);
            chapterData.subchapters.push({
              id: subchapter.id,
              title: subchapter.searchTerm,
              error: error.message,
            });
          }
        } else {
          logger.warn(`No link found for: ${subchapter.searchTerm}`);
        }
      }

      if (chapterData.subchapters.length > 0) {
        principles.chapters.push(chapterData);
      }

      logger.progress(
        principles.chapters.length,
        expectedChapters.length,
        chapter.title
      );
    }

    // Save sensor principles
    writeFileSync(PATHS.sensorPrinciples, JSON.stringify(principles, null, 2));
    logger.success(`Saved sensor principles to ${PATHS.sensorPrinciples}`);

    // Update builds.json to link sensor principles
    if (existsSync(PATHS.buildsJson)) {
      const data = JSON.parse(readFileSync(PATHS.buildsJson, 'utf-8'));
      const builds = data.builds || data;

      for (const build of builds) {
        if (build.sensors && build.sensors.length > 0) {
          build.sensorPrinciples = [];

          for (const sensor of build.sensors) {
            const chapter = principles.chapters.find(c => c.sensor === sensor);
            if (chapter) {
              for (const sub of chapter.subchapters) {
                build.sensorPrinciples.push({
                  chapterId: sub.id,
                  title: sub.title,
                });
              }
            }
          }
        }
      }

      writeFileSync(PATHS.buildsJson, JSON.stringify({ builds }, null, 2));
      logger.success('Updated builds.json with sensor principle links');
    }

    stateManager.setSensorPrinciplesStatus('complete');

    logger.summary({
      'Chapters scraped': principles.chapters.length,
      'Total subchapters': principles.chapters.reduce(
        (sum, c) => sum + c.subchapters.length,
        0
      ),
    });

    return principles;
  } finally {
    await page.close();
  }
}

export default scrapeSensorPrinciples;
