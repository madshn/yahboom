import { chromium } from 'playwright';
import fs from 'fs/promises';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';

async function exploreMakeCode() {
  console.log('Exploring MakeCode section structure...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Get ALL links with onclick="build(...)"
    const allLinks = await page.$$eval('a[onclick^="build"]', links =>
      links.map(a => ({
        text: a.textContent?.trim()?.replace(/\s+/g, ' ').slice(0, 100) || '',
        onclick: a.getAttribute('onclick'),
        buildId: a.getAttribute('onclick')?.match(/build\((\d+)\)/)?.[1]
      }))
    );

    // Find MakeCode related links
    console.log('All MakeCode/3.A related links:');
    const makeCodeLinks = allLinks.filter(l =>
      l.text.includes('3.A') ||
      l.text.includes('Cannonball') ||
      l.text.includes('Music fortress')
    );

    for (const link of makeCodeLinks) {
      console.log(`  build(${link.buildId}): "${link.text}"`);
    }

    // Find Cannonball shooting lesson
    const cannonballLink = allLinks.find(l => l.text.includes('Cannonball'));
    if (cannonballLink) {
      console.log(`\n\nNavigating to Cannonball lesson (build ${cannonballLink.buildId})...`);

      // Click using JavaScript evaluation
      await page.evaluate((buildId) => {
        // The build() function should be defined globally on the page
        if (typeof build === 'function') {
          build(parseInt(buildId));
        }
      }, cannonballLink.buildId);

      await page.waitForTimeout(5000);

      // Scroll to load all content
      console.log('Scrolling to load content...');
      for (let i = 0; i < 20; i++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(200);
      }

      // Get page HTML
      const pageHtml = await page.content();
      await fs.writeFile('public/images/exploration/makecode-page.html', pageHtml);

      // Get article content
      const articleHtml = await page.$eval('article', el => el.innerHTML).catch(() => 'No article');
      await fs.writeFile('public/images/exploration/makecode-article.html', articleHtml);
      console.log('\nSaved HTML content');

      // Get images
      const images = await page.$$eval('article img', imgs =>
        imgs.map(img => ({
          src: img.src,
          alt: img.alt || '',
          filename: img.src.split('/').pop()
        }))
      );

      console.log(`\nFound ${images.length} images in article:`);
      for (const img of images) {
        console.log(`  ${img.filename}`);
      }

      // Check for PNGs (code block images)
      const pngImages = images.filter(img => img.filename?.includes('.png'));
      console.log(`\n${pngImages.length} PNG images (likely MakeCode blocks)`);

      // Look for any text content patterns
      const textContent = await page.$eval('article .content', el => el.textContent?.slice(0, 2000) || '').catch(() => '');
      console.log('\nText preview:', textContent.slice(0, 500));

      // Screenshot
      await page.screenshot({ path: 'public/images/exploration/makecode-lesson.png', fullPage: true });
      console.log('\nSaved screenshot');
    } else {
      console.log('Cannonball lesson not found');

      // List all links for debugging
      console.log('\nAll links (first 50):');
      for (const link of allLinks.slice(0, 50)) {
        console.log(`  build(${link.buildId}): "${link.text.slice(0, 60)}"`);
      }
    }

  } catch (err) {
    console.log('Error:', err.message);
    console.log(err.stack);
    await page.screenshot({ path: 'public/images/exploration/error-state.png' });
  } finally {
    await browser.close();
  }

  console.log('\n✓ Done');
}

exploreMakeCode().catch(console.error);
