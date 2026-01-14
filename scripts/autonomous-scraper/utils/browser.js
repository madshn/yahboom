// Playwright browser management

import { chromium } from 'playwright';
import { TIMEOUTS } from '../config.js';
import { logger } from './logger.js';
import { withRetry } from './retry.js';
import { rateLimiter } from './rate-limiter.js';

let browser = null;
let context = null;

export async function initBrowser() {
  if (browser) return { browser, context };

  logger.info('Launching browser...');

  browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  logger.success('Browser launched');
  return { browser, context };
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
    logger.info('Browser closed');
  }
}

export async function createPage() {
  const { context: ctx } = await initBrowser();
  const page = await ctx.newPage();

  // Set default timeouts
  page.setDefaultTimeout(TIMEOUTS.elementWait);
  page.setDefaultNavigationTimeout(TIMEOUTS.navigation);

  return page;
}

export async function navigateTo(page, url, options = {}) {
  await rateLimiter.wait();

  return withRetry(
    async () => {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.navigation,
        ...options,
      });
    },
    `navigate:${url}`
  );
}

export async function waitForContent(page, selector, options = {}) {
  return withRetry(
    async () => {
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout: TIMEOUTS.elementWait,
        ...options,
      });
    },
    `waitFor:${selector}`
  );
}

export async function scrollFullPage(page, iterations = 10) {
  for (let i = 0; i < iterations; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(300);
  }

  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
}

export async function clickAndWait(page, selector, waitSelector = null) {
  await rateLimiter.wait();

  await page.click(selector);

  if (waitSelector) {
    await waitForContent(page, waitSelector);
  } else {
    await page.waitForTimeout(1000);
  }
}

export async function extractText(page, selector) {
  try {
    const element = await page.$(selector);
    if (!element) return null;
    return await element.textContent();
  } catch {
    return null;
  }
}

export async function extractAllText(page, selector) {
  try {
    const elements = await page.$$(selector);
    return Promise.all(elements.map(el => el.textContent()));
  } catch {
    return [];
  }
}

export async function extractImages(page, containerSelector = 'article') {
  return page.evaluate(container => {
    const images = document.querySelectorAll(`${container} img`);
    return Array.from(images).map(img => ({
      src: img.src,
      alt: img.alt || '',
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
  }, containerSelector);
}

export async function getPageContent(page) {
  return page.evaluate(() => {
    const article = document.querySelector('article');
    return article ? article.innerHTML : document.body.innerHTML;
  });
}

export default {
  initBrowser,
  closeBrowser,
  createPage,
  navigateTo,
  waitForContent,
  scrollFullPage,
  clickAndWait,
  extractText,
  extractAllText,
  extractImages,
  getPageContent,
};
