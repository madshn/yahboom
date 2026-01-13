import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';

// Start with just 3 builds for validation
const ASSEMBLY_COURSES = [
  { id: '1.1', name: 'Mobile shooter', difficulty: 'beginner', description: 'A wheeled vehicle that launches projectiles using a catapult mechanism' },
  { id: '1.7', name: 'Spider', difficulty: 'intermediate', description: 'A walking robot with 4 legs that moves like a spider' },
  { id: '1.18', name: 'Small flying car obstacle avoidance', difficulty: 'advanced', description: 'A smart car that detects and avoids obstacles using ultrasonic sensor' },
];

// Mapping from assembly builds to MakeCode courses (Section 3)
const MAKECODE_MAPPING = {
  '1.1': { section: '3.A', name: 'Mobile shooter', lessons: ['Cannonball shooting', 'Music fortress', 'APP control', 'Micro:bit handle control', 'WiFi camera control'] },
  '1.7': { section: '3.G', name: 'Spider', lessons: ['Spider advance', 'The dancing spider', 'APP control', 'Micro:bit handle control', 'WiFi camera control'] },
};

// Mapping from assembly builds to Python courses (Section 4)
const PYTHON_MAPPING = {
  '1.1': { section: '4.A', name: 'Mobile shooter', lessons: ['Cannonball shooting', 'Music fortress', 'Micro:bit handle control'] },
  '1.7': { section: '4.G', name: 'Spider', lessons: ['Spider advance', 'The dancing spider', 'Micro:bit handle control'] },
};

// Sensor Advanced courses (Section 5.3) with wiring diagram URLs
const SENSOR_MAPPING = {
  '1.18': {
    section: '5.3.1',
    name: 'Avoiding car',
    sensors: ['ultrasonic'],
    wiringImageUrl: 'https://www.yahboom.net/public/upload/upload-html/1753443262/image-20250624143411432.png'
  },
  '1.7': {
    section: '5.3.6',
    name: 'Spiders sense human body',
    sensors: ['PIR'],
    wiringImageUrl: null // Will be scraped
  },
};

// MakeCode basic courses (Section 3) - for builds without sensor courses
const MAKECODE_WIRING = {
  '1.1': {
    wiringImageUrl: null // Basic builds may not have wiring diagrams
  }
};

async function scrapeBuilds() {
  console.log('Starting Yahboom scraper (3 builds for validation)...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Increase default timeout
  page.setDefaultTimeout(120000);

  const builds = [];

  try {
    // Navigate to main page with longer timeout
    console.log('Loading main page...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(5000);

    // Click on Assembly Course to expand
    console.log('Expanding Assembly Course menu...');
    await page.click('text=1.Assembly Course');
    await page.waitForTimeout(2000);

    for (const course of ASSEMBLY_COURSES) {
      console.log(`\nScraping ${course.id} ${course.name}...`);

      try {
        // Click on the course link - try different selector patterns
        const linkText = `${course.id}${course.name}`;
        const linkSelector = `a:has-text("${linkText}")`;

        console.log(`  Looking for: ${linkText}`);
        await page.click(linkSelector, { timeout: 10000 });
        await page.waitForTimeout(5000);

        // Wait for images to start loading
        await page.waitForSelector('article img', { timeout: 30000 });

        // Scroll to bottom to load all images
        console.log('  Scrolling to load images...');
        for (let i = 0; i < 10; i++) {
          await page.evaluate(() => window.scrollBy(0, 1000));
          await page.waitForTimeout(500);
        }

        // Give extra time for images to load
        await page.waitForTimeout(3000);

        // Get all images in the article
        const images = await page.$$eval('article img', imgs =>
          imgs.map(img => img.src).filter(src => src && src.includes('yahboom.net') && src.endsWith('.jpg'))
        );

        console.log(`  Found ${images.length} images`);

        // The last image is usually the final build
        const finalImageUrl = images.length > 0 ? images[images.length - 1] : null;

        // Create assembly steps data
        // First image is parts list, subsequent images are build steps
        const assemblySteps = images.map((url, index) => ({
          stepNumber: index,
          type: index === 0 ? 'parts' : 'step',
          imageUrl: url,
          // Parts needed indicator: true for first build step after parts, false otherwise
          partsNeeded: index === 1
        }));

        console.log(`  ✓ Assembly steps: ${assemblySteps.length} (1 parts + ${assemblySteps.length - 1} steps)`);

        // Get Chinese name from the page title
        const pageTitle = await page.$eval('article h3, article h2', el => el.textContent).catch(() => '');
        const chineseMatch = pageTitle.match(/[\u4e00-\u9fff]+/);
        const chineseName = chineseMatch ? chineseMatch[0] : '';

        // Build the data object
        const buildData = {
          id: course.id,
          name: course.name,
          nameChinese: chineseName,
          difficulty: course.difficulty,
          description: course.description,
          finalImageUrl: finalImageUrl,
          allImages: images.slice(-5), // Keep last 5 images for reference
          assemblySteps: assemblySteps, // All steps with type metadata
          assemblyUrl: BASE_URL,
          codingCourses: {}
        };

        // Add MakeCode course if available
        if (MAKECODE_MAPPING[course.id]) {
          buildData.codingCourses.makecode = MAKECODE_MAPPING[course.id];
        }

        // Add Python course if available
        if (PYTHON_MAPPING[course.id]) {
          buildData.codingCourses.python = PYTHON_MAPPING[course.id];
        }

        // Add Sensor Advanced course if available
        if (SENSOR_MAPPING[course.id]) {
          buildData.codingCourses.sensorAdvanced = SENSOR_MAPPING[course.id];
          buildData.sensors = SENSOR_MAPPING[course.id].sensors;
          buildData.wiringImageUrl = SENSOR_MAPPING[course.id].wiringImageUrl;
        } else {
          buildData.sensors = [];
          buildData.wiringImageUrl = MAKECODE_WIRING[course.id]?.wiringImageUrl || null;
        }

        builds.push(buildData);
        console.log(`  ✓ Final image: ${finalImageUrl ? finalImageUrl.slice(-30) : 'NONE'}`);
        console.log(`  ✓ Chinese name: ${chineseName || 'NONE'}`);

      } catch (err) {
        console.log(`  ✗ Error: ${err.message}`);
        // Add with placeholder
        builds.push({
          id: course.id,
          name: course.name,
          nameChinese: '',
          difficulty: course.difficulty,
          description: course.description,
          finalImageUrl: null,
          allImages: [],
          assemblySteps: [],
          assemblyUrl: BASE_URL,
          codingCourses: {},
          sensors: []
        });
      }
    }

  } finally {
    await browser.close();
  }

  // Save to JSON
  const outputPath = path.join(process.cwd(), 'public', 'data', 'builds.json');
  await fs.writeFile(outputPath, JSON.stringify({ builds }, null, 2));
  console.log(`\n✓ Saved ${builds.length} builds to ${outputPath}`);

  return builds;
}

// Run the scraper
scrapeBuilds().catch(console.error);
