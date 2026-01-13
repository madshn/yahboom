import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';

async function exploreStructure() {
  console.log('Exploring Yahboom assembly page structure...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  try {
    // Navigate to main page
    console.log('Loading main page...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(5000);

    // Click on Assembly Course to expand
    console.log('Expanding Assembly Course menu...');
    await page.click('text=1.Assembly Course');
    await page.waitForTimeout(2000);

    // Click on 1.1 Mobile shooter
    console.log('Opening 1.1 Mobile shooter...');
    await page.click('a:has-text("1.1Mobile shooter")');
    await page.waitForTimeout(5000);

    // Wait for content to load
    await page.waitForSelector('article img', { timeout: 30000 });

    // Scroll to load all images
    console.log('Scrolling to load all content...');
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2000);

    // Get all images with context
    const imageData = await page.$$eval('article img', imgs => {
      return imgs.map((img, index) => {
        // Get surrounding text (previous sibling or parent text)
        const parent = img.parentElement;
        const grandparent = parent?.parentElement;

        // Look for nearby text content
        let nearbyText = '';
        let prevSibling = img.previousElementSibling || parent?.previousElementSibling;
        if (prevSibling) {
          nearbyText = prevSibling.textContent?.trim() || '';
        }

        // Check for p tags around the image
        const prevP = parent?.previousElementSibling;
        const nextP = parent?.nextElementSibling;

        return {
          index,
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight,
          nearbyText: nearbyText.slice(0, 100),
          prevPText: prevP?.textContent?.trim()?.slice(0, 100) || '',
          nextPText: nextP?.textContent?.trim()?.slice(0, 100) || '',
          parentTag: parent?.tagName,
          grandparentTag: grandparent?.tagName
        };
      });
    });

    console.log(`\nFound ${imageData.length} images\n`);
    console.log('='.repeat(80));

    // Analyze images
    for (const img of imageData) {
      console.log(`\nImage ${img.index + 1}:`);
      console.log(`  URL: ...${img.src.slice(-50)}`);
      console.log(`  Size: ${img.width}x${img.height}`);
      console.log(`  Alt: ${img.alt || '(none)'}`);
      console.log(`  Prev text: ${img.prevPText || '(none)'}`);
      console.log(`  Parent: ${img.parentTag} > ${img.grandparentTag}`);
    }

    // Look for patterns
    console.log('\n' + '='.repeat(80));
    console.log('\nAnalyzing patterns...\n');

    // Group by URL patterns
    const urlPatterns = {};
    for (const img of imageData) {
      const match = img.src.match(/\/(\d+)\.jpg$/);
      if (match) {
        const num = match[1];
        urlPatterns[num] = (urlPatterns[num] || 0) + 1;
      }
    }
    console.log('URL endings:', Object.keys(urlPatterns).slice(0, 20));

    // Get the raw HTML structure around images
    const htmlStructure = await page.$eval('article', el => {
      // Get first 5000 chars of HTML
      return el.innerHTML.slice(0, 8000);
    });

    // Save HTML sample for analysis
    await fs.mkdir('public/images/exploration', { recursive: true });
    await fs.writeFile('public/images/exploration/html-sample.html', htmlStructure);
    console.log('\nSaved HTML sample to public/images/exploration/html-sample.html');

    // Save image data
    await fs.writeFile('public/images/exploration/image-data.json', JSON.stringify(imageData, null, 2));
    console.log('Saved image data to public/images/exploration/image-data.json');

    // Take screenshot
    await page.screenshot({ path: 'public/images/exploration/page-screenshot.png', fullPage: true });
    console.log('Saved full page screenshot');

    // Now let's look at MakeCode section
    console.log('\n' + '='.repeat(80));
    console.log('\nExploring MakeCode section...\n');

    // Go back to main page
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);

    // Click on MakeCode Course section
    console.log('Expanding MakeCode Course menu...');
    await page.click('text=3.MakeCode Course');
    await page.waitForTimeout(2000);

    // Click on section A (Mobile shooter)
    console.log('Opening 3.A Mobile shooter MakeCode...');
    await page.click('a:has-text("3.A.Mobile shooter")');
    await page.waitForTimeout(3000);

    // Click on first lesson
    const firstLesson = await page.$('a:has-text("Cannonball shooting")');
    if (firstLesson) {
      await firstLesson.click();
      await page.waitForTimeout(5000);

      // Scroll to load content
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(300);
      }

      // Get MakeCode content structure
      const makeCodeImages = await page.$$eval('article img', imgs => {
        return imgs.map(img => ({
          src: img.src,
          alt: img.alt || ''
        }));
      });

      console.log(`\nFound ${makeCodeImages.length} images in MakeCode lesson`);
      for (const img of makeCodeImages.slice(0, 5)) {
        console.log(`  ...${img.src.slice(-60)}`);
      }

      // Look for code blocks
      const codeBlocks = await page.$$eval('pre, code, .code-block', els => {
        return els.map(el => ({
          tag: el.tagName,
          text: el.textContent?.slice(0, 200) || ''
        }));
      });

      console.log(`\nFound ${codeBlocks.length} code blocks`);
      for (const block of codeBlocks.slice(0, 3)) {
        console.log(`  ${block.tag}: ${block.text.slice(0, 100)}...`);
      }

      // Save MakeCode HTML
      const makeCodeHtml = await page.$eval('article', el => el.innerHTML.slice(0, 10000));
      await fs.writeFile('public/images/exploration/makecode-sample.html', makeCodeHtml);
      console.log('\nSaved MakeCode HTML sample');

      // Screenshot
      await page.screenshot({ path: 'public/images/exploration/makecode-screenshot.png', fullPage: true });
      console.log('Saved MakeCode screenshot');
    }

  } finally {
    await browser.close();
  }

  console.log('\n✓ Exploration complete');
}

exploreStructure().catch(console.error);
