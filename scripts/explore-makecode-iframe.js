import { chromium } from 'playwright';
import fs from 'fs/promises';

// Direct URL to iframe content
const IFRAME_URL = 'https://www.yahboom.net/public/upload/upload-html/1753440693/1.Cannonball%20shooting.html';

async function exploreMakeCodeIframe() {
  console.log('Exploring MakeCode iframe content...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    console.log('Loading iframe content directly...');
    await page.goto(IFRAME_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Scroll to load all content
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(200);
    }

    // Get all images
    const images = await page.$$eval('img', imgs =>
      imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth,
        height: img.naturalHeight
      }))
    );

    console.log(`\nFound ${images.length} images:`);
    for (const img of images) {
      const filename = img.src.split('/').pop()?.slice(0, 60);
      console.log(`  ${filename} (${img.width}x${img.height})`);
    }

    // Count by type
    const pngImages = images.filter(i => i.src.includes('.png'));
    const jpgImages = images.filter(i => i.src.includes('.jpg'));
    console.log(`\n${pngImages.length} PNG images (likely code blocks)`);
    console.log(`${jpgImages.length} JPG images`);

    // Get text content structure
    const textContent = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p'));
      return paragraphs.map(p => p.textContent?.trim().slice(0, 200) || '').filter(t => t.length > 10);
    });

    console.log(`\nText paragraphs: ${textContent.length}`);
    for (const text of textContent.slice(0, 10)) {
      console.log(`  - ${text.slice(0, 80)}...`);
    }

    // Check for code blocks
    const codeBlocks = await page.$$eval('pre, code, .code', els =>
      els.map(el => el.textContent?.slice(0, 200) || '')
    );

    console.log(`\nCode blocks: ${codeBlocks.length}`);
    for (const code of codeBlocks.slice(0, 3)) {
      console.log(`  ${code.slice(0, 100)}...`);
    }

    // Save the full HTML
    const html = await page.content();
    await fs.writeFile('public/images/exploration/makecode-iframe-content.html', html);
    console.log('\nSaved full iframe HTML');

    // Take screenshot
    await page.screenshot({ path: 'public/images/exploration/makecode-iframe.png', fullPage: true });
    console.log('Saved screenshot');

    // Try to identify patterns in image URLs
    console.log('\n=== Image URL Patterns ===');
    const codeImages = images.filter(i =>
      i.src.includes('png') &&
      (i.width > 200 || i.height > 100)
    );

    console.log(`\nLarge PNG images (likely code blocks): ${codeImages.length}`);
    for (const img of codeImages.slice(0, 5)) {
      console.log(`  ${img.src.split('/').pop()}`);
    }

  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n✓ Done');
}

exploreMakeCodeIframe().catch(console.error);
