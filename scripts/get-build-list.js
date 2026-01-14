import { chromium } from 'playwright';
import fs from 'fs/promises';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';

async function getBuildList() {
  console.log('Getting all build links from Yahboom...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await new Promise(r => setTimeout(r, 5000));

    // Expand Assembly Course menu
    console.log('Expanding Assembly Course menu...');
    await page.click('text=1.Assembly Course');
    await new Promise(r => setTimeout(r, 3000));

    // Get all build links
    const buildLinks = await page.$$eval('.left-menu a[href*="buildingbit-super-kit"]', links => {
      return links
        .map(a => ({
          href: a.href,
          text: a.textContent.trim(),
          id: a.textContent.match(/^(\d+\.\d+)/)?.[1] || '',
          name: a.textContent.replace(/^\d+\.\d+/, '').trim()
        }))
        .filter(link => link.id && link.id.startsWith('1.'));
    });

    console.log(`Found ${buildLinks.length} builds:\n`);
    buildLinks.forEach(b => console.log(`  ${b.id} - ${b.name}`));

    // Save to file
    await fs.mkdir('./raw/html', { recursive: true });
    await fs.writeFile('./raw/html/_build-links.json', JSON.stringify(buildLinks, null, 2));
    console.log('\nSaved to raw/html/_build-links.json');

    // Also get coding courses
    console.log('\nGetting coding courses structure...');

    const coursesData = { makecode: [], python: [], sensorAdvanced: [] };

    // MakeCode
    await page.click('text=3.MakeCode Course');
    await new Promise(r => setTimeout(r, 2000));
    coursesData.makecode = await page.$$eval('.left-menu a', links =>
      links.filter(a => /^3\.[A-Z]/.test(a.textContent.trim()))
        .map(a => ({ section: a.textContent.match(/^(3\.[A-Z])/)?.[1], name: a.textContent.replace(/^3\.[A-Z]\.?/, '').trim(), href: a.href }))
    );

    // Python
    await page.click('text=4.Python Course');
    await new Promise(r => setTimeout(r, 2000));
    coursesData.python = await page.$$eval('.left-menu a', links =>
      links.filter(a => /^4\.[A-Z]/.test(a.textContent.trim()))
        .map(a => ({ section: a.textContent.match(/^(4\.[A-Z])/)?.[1], name: a.textContent.replace(/^4\.[A-Z]\.?/, '').trim(), href: a.href }))
    );

    // Sensor Advanced
    await page.click('text=5.Sensor Advanced Course');
    await new Promise(r => setTimeout(r, 2000));
    coursesData.sensorAdvanced = await page.$$eval('.left-menu a', links =>
      links.filter(a => /^5\.\d+\.\d+/.test(a.textContent.trim()))
        .map(a => ({ section: a.textContent.match(/^(5\.\d+\.\d+)/)?.[1], name: a.textContent.replace(/^5\.\d+\.\d+\.?/, '').trim(), href: a.href }))
    );

    await fs.writeFile('./raw/html/_coding-courses.json', JSON.stringify(coursesData, null, 2));
    console.log(`MakeCode: ${coursesData.makecode.length}, Python: ${coursesData.python.length}, Sensor: ${coursesData.sensorAdvanced.length}`);

    return buildLinks;

  } finally {
    await browser.close();
  }
}

getBuildList().catch(console.error);
