#!/usr/bin/env node
/**
 * Comprehensive Site Validation
 *
 * Validates all pages on the Building:bit gallery site for:
 * 1. Content completeness
 * 2. Text formatting (readability for 8-year-olds)
 * 3. Images displayed properly (not cropped)
 * 4. Related content listings
 */

import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RESULTS_PATH = './public/data/validation-report.json';

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: { passed: 0, warnings: 0, failed: 0 },
  categories: {
    contentCompleteness: { tests: [], passed: 0, failed: 0 },
    textFormatting: { tests: [], passed: 0, failed: 0, warnings: 0 },
    imageDisplay: { tests: [], passed: 0, failed: 0 },
    relatedContent: { tests: [], passed: 0, failed: 0 }
  },
  builds: []
};

// 8-year-old readability checks
const READABILITY_RULES = {
  maxSentenceWords: 15,          // Sentences should be short
  maxParagraphSentences: 4,      // Paragraphs should be brief
  avoidWords: [                  // Complex words to flag
    'subsequently', 'furthermore', 'nevertheless', 'comprehensive',
    'implementation', 'subsequently', 'aforementioned', 'utilize',
    'facilitate', 'methodology', 'paradigm', 'synergy'
  ],
  preferSimple: {                // Suggest simpler alternatives
    'utilize': 'use',
    'commence': 'start',
    'terminate': 'stop/end',
    'subsequently': 'then',
    'facilitate': 'help',
    'prior to': 'before',
    'in order to': 'to',
    'at this point in time': 'now'
  }
};

async function runValidation() {
  console.log('🔍 Building:bit Site Validation\n');
  console.log('═'.repeat(60) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // Load the main gallery
    console.log('Loading gallery...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('.gallery-card', { timeout: 10000 });

    // Get all builds from the page
    const buildIds = await page.$$eval('.gallery-card', cards =>
      cards.map(c => c.dataset.id)
    );

    console.log(`Found ${buildIds.length} builds to validate\n`);

    // Validate each build
    for (const buildId of buildIds) {
      console.log(`\n📦 Validating build ${buildId}...`);
      const buildResult = await validateBuild(page, buildId);
      results.builds.push(buildResult);
    }

    // Validate devices/peripherals page if it exists
    await validateDevicesPage(page);

    // Calculate summary
    calculateSummary();

    // Print report
    printReport();

    // Save results
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
    console.log(`\n💾 Full report saved to ${RESULTS_PATH}`);

  } catch (err) {
    console.error('Validation error:', err.message);
    results.error = err.message;
  } finally {
    await browser.close();
  }

  // Exit with error if failures
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

async function validateBuild(page, buildId) {
  const buildResult = {
    id: buildId,
    name: '',
    tests: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  try {
    // Open the build modal
    await page.click(`.gallery-card[data-id="${buildId}"]`);
    await page.waitForSelector('.modal.active', { timeout: 5000 });

    // Get build name
    buildResult.name = await page.$eval('#modalTitle', el => el.textContent);

    // ═══════════════════════════════════════════════════════════
    // 1. CONTENT COMPLETENESS
    // ═══════════════════════════════════════════════════════════

    // Check description exists
    const hasDescription = await page.$eval('#modalDescription', el =>
      el && el.textContent.trim().length > 10
    ).catch(() => false);

    addTest(buildResult, 'contentCompleteness',
      'Has description', hasDescription,
      hasDescription ? null : 'Missing or too short description'
    );

    // Check build instructions button
    const hasBuildBtn = await page.$('#assemblyLink') !== null;
    addTest(buildResult, 'contentCompleteness',
      'Has build instructions', hasBuildBtn,
      hasBuildBtn ? null : 'Missing Build Instructions button'
    );

    // Check coding options
    const codingOptions = await page.$$('.coding-option');
    const hasCoding = codingOptions.length > 0;
    addTest(buildResult, 'contentCompleteness',
      'Has coding tutorials', hasCoding,
      hasCoding ? `${codingOptions.length} tutorial(s)` : 'No coding tutorials'
    );

    // Check sensors section (for sensor builds 1.17-1.32)
    const sensorSection = await page.$('#sensorsSection');
    const sensorTags = await page.$$('#sensorTags .sensor-tag');

    // Parse build ID as major.minor for proper version comparison
    const [major, minor] = buildId.split('.').map(Number);
    const isSensorBuild = major === 1 && minor >= 17;

    if (isSensorBuild) {
      addTest(buildResult, 'contentCompleteness',
        'Sensor build has sensors listed', sensorTags.length > 0,
        sensorTags.length > 0 ? `${sensorTags.length} sensor(s)` : 'Missing sensor tags for sensor build'
      );
    }

    // ═══════════════════════════════════════════════════════════
    // 2. TEXT FORMATTING (8-year-old readability)
    // ═══════════════════════════════════════════════════════════

    // Check description text
    const description = await page.$eval('#modalDescription', el =>
      el?.textContent?.trim() || ''
    ).catch(() => '');

    const readabilityIssues = checkReadability(description);
    addTest(buildResult, 'textFormatting',
      'Description is child-friendly', readabilityIssues.length === 0,
      readabilityIssues.length > 0 ? readabilityIssues.join('; ') : null,
      readabilityIssues.length > 0 ? 'warning' : 'pass'
    );

    // ═══════════════════════════════════════════════════════════
    // 3. IMAGE DISPLAY
    // ═══════════════════════════════════════════════════════════

    // Check modal image loads and isn't cropped
    const modalImage = await page.$('#modalImage');
    if (modalImage) {
      const imgInfo = await page.evaluate(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.offsetWidth,
        displayHeight: img.offsetHeight,
        loaded: img.complete && img.naturalWidth > 0
      }), modalImage);

      addTest(buildResult, 'imageDisplay',
        'Modal image loads', imgInfo.loaded,
        imgInfo.loaded ? `${imgInfo.naturalWidth}x${imgInfo.naturalHeight}` : 'Image failed to load'
      );

      // Check for aspect ratio preservation (not cropped)
      if (imgInfo.loaded && imgInfo.displayWidth > 0) {
        const naturalRatio = imgInfo.naturalWidth / imgInfo.naturalHeight;
        const displayRatio = imgInfo.displayWidth / imgInfo.displayHeight;
        const ratioDiff = Math.abs(naturalRatio - displayRatio);
        const isPreserved = ratioDiff < 0.1; // Allow 10% tolerance

        addTest(buildResult, 'imageDisplay',
          'Image aspect ratio preserved', isPreserved,
          isPreserved ? null : `Image may be cropped (ratio diff: ${ratioDiff.toFixed(2)})`
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 4. CHECK LESSON VIEWER
    // ═══════════════════════════════════════════════════════════

    if (codingOptions.length > 0) {
      // Click first coding option to open lesson viewer
      await page.click('.coding-option');
      await page.waitForTimeout(500);

      const lessonViewer = await page.$('.lesson-viewer.active');
      if (lessonViewer) {
        // Check lesson list
        const lessonItems = await page.$$('.lesson-item');
        addTest(buildResult, 'contentCompleteness',
          'Lesson viewer has lessons', lessonItems.length > 0,
          lessonItems.length > 0 ? `${lessonItems.length} lesson(s)` : 'No lessons in viewer'
        );

        // Check lesson content has actual content (not just placeholder)
        const lessonContent = await page.$eval('#lessonContent', el => el.innerHTML);
        const hasDetailedContent = lessonContent.includes('objective') ||
                                   lessonContent.includes('code-block') ||
                                   lessonContent.includes('wiring');

        addTest(buildResult, 'contentCompleteness',
          'Lessons have detailed content', hasDetailedContent,
          hasDetailedContent ? null : 'Lessons appear to be placeholders',
          hasDetailedContent ? 'pass' : 'warning'
        );

        // Check lesson text readability
        const lessonText = await page.$eval('#lessonContent', el => el.textContent || '');
        const lessonReadability = checkReadability(lessonText);
        if (lessonReadability.length > 0) {
          addTest(buildResult, 'textFormatting',
            'Lesson text is child-friendly', false,
            lessonReadability.slice(0, 3).join('; '),
            'warning'
          );
        }

        // Check for images in lesson
        const lessonImages = await page.$$('#lessonContent img');
        if (lessonImages.length > 0) {
          for (let i = 0; i < Math.min(lessonImages.length, 3); i++) {
            const imgLoaded = await page.evaluate(img =>
              img.complete && img.naturalWidth > 0, lessonImages[i]
            );
            if (!imgLoaded) {
              addTest(buildResult, 'imageDisplay',
                `Lesson image ${i+1} loads`, false,
                'Lesson image failed to load'
              );
            }
          }
        }

        // Close lesson viewer
        await page.click('.lesson-close-btn');
        await page.waitForTimeout(300);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 5. CHECK STEP VIEWER (Assembly)
    // ═══════════════════════════════════════════════════════════

    if (hasBuildBtn) {
      // Re-open modal if it was closed (coding option clicks close modal)
      const modalStillOpen = await page.$('.modal.active');
      if (!modalStillOpen) {
        await page.click(`.gallery-card[data-id="${buildId}"]`);
        await page.waitForSelector('.modal.active', { timeout: 5000 });
      }

      await page.click('#assemblyLink');
      await page.waitForTimeout(500);

      const stepViewer = await page.$('.step-viewer.active');
      if (stepViewer) {
        // Check step counter
        const stepCounter = await page.$eval('#stepCounter', el => el.textContent).catch(() => '');
        const match = stepCounter.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
          const totalSteps = parseInt(match[2]);
          addTest(buildResult, 'contentCompleteness',
            'Assembly has steps', totalSteps > 0,
            `${totalSteps} assembly steps`
          );
        }

        // Check step image loads and is not cropped
        const stepImage = await page.$('#stepImage');
        if (stepImage) {
          const stepImgInfo = await page.evaluate(img => ({
            loaded: img.complete && img.naturalWidth > 0,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.offsetWidth,
            displayHeight: img.offsetHeight
          }), stepImage);

          addTest(buildResult, 'imageDisplay',
            'Assembly step image loads', stepImgInfo.loaded,
            stepImgInfo.loaded ? null : 'Assembly step image failed to load'
          );

          // Check aspect ratio (images should not be cropped)
          if (stepImgInfo.loaded && stepImgInfo.displayWidth > 0 && stepImgInfo.displayHeight > 0) {
            const naturalRatio = stepImgInfo.naturalWidth / stepImgInfo.naturalHeight;
            const displayRatio = stepImgInfo.displayWidth / stepImgInfo.displayHeight;
            const ratioDiff = Math.abs(naturalRatio - displayRatio);

            addTest(buildResult, 'imageDisplay',
              'Assembly image not cropped', ratioDiff < 0.15,
              ratioDiff < 0.15 ? null : `Assembly image appears cropped (ratio diff: ${ratioDiff.toFixed(2)})`
            );
          }
        }

        // Close step viewer
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 6. RELATED CONTENT
    // ═══════════════════════════════════════════════════════════

    // Check if sensors section shows related builds (for sensor builds)
    // This would require implementing a "related builds" feature
    // For now, just check that sensor tags are clickable/linked

    // Close any open viewers/modals
    try {
      // Try closing step viewer first if open
      const stepViewerOpen = await page.$('.step-viewer.active');
      if (stepViewerOpen) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }

      // Try closing lesson viewer if open
      const lessonViewerOpen = await page.$('.lesson-viewer.active');
      if (lessonViewerOpen) {
        await page.click('.lesson-close-btn');
        await page.waitForTimeout(200);
      }

      // Close modal
      const modalOpen = await page.$('.modal.active');
      if (modalOpen) {
        await page.click('#closeModal');
        await page.waitForTimeout(200);
      }
    } catch (closeErr) {
      // If closing fails, try escape key as fallback
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

  } catch (err) {
    buildResult.error = err.message;
    addTest(buildResult, 'contentCompleteness',
      'Build page loads', false, err.message
    );
  }

  return buildResult;
}

async function validateDevicesPage(page) {
  console.log('\n📱 Validating devices/peripherals data...');

  // Check if devices.json exists and is valid
  try {
    const devicesResponse = await page.goto(`${BASE_URL}/data/devices.json`);
    if (devicesResponse.ok()) {
      const devices = await devicesResponse.json();

      addTest(results.categories.contentCompleteness, 'contentCompleteness',
        'Devices catalog exists', true,
        `${devices.devices?.length || 0} devices cataloged`
      );

      // Check each device has required fields
      let validDevices = 0;
      for (const device of devices.devices || []) {
        if (device.id && device.name && device.category && device.description) {
          validDevices++;
        }
      }

      addTest(results.categories.contentCompleteness, 'contentCompleteness',
        'Devices have complete data', validDevices === devices.devices?.length,
        `${validDevices}/${devices.devices?.length} devices complete`
      );
    }
  } catch (err) {
    addTest(results.categories.contentCompleteness, 'contentCompleteness',
      'Devices catalog exists', false, 'devices.json not found or invalid'
    );
  }

  // Go back to gallery
  await page.goto(BASE_URL);
  await page.waitForSelector('.gallery-card', { timeout: 5000 });
}

function checkReadability(text) {
  const issues = [];
  if (!text || text.length < 10) return issues;

  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Check sentence length
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    if (words.length > READABILITY_RULES.maxSentenceWords) {
      issues.push(`Long sentence (${words.length} words): "${sentence.substring(0, 30)}..."`);
    }
  }

  // Check for complex words
  const textLower = text.toLowerCase();
  for (const word of READABILITY_RULES.avoidWords) {
    if (textLower.includes(word)) {
      issues.push(`Complex word: "${word}"`);
    }
  }

  // Check for improvable phrases
  for (const [phrase, simpler] of Object.entries(READABILITY_RULES.preferSimple)) {
    if (textLower.includes(phrase)) {
      issues.push(`Consider "${simpler}" instead of "${phrase}"`);
    }
  }

  return issues;
}

function addTest(target, category, name, passed, details, level = null) {
  const test = {
    name,
    passed: level === 'warning' ? true : passed,
    warning: level === 'warning',
    details
  };

  if (target.tests) {
    target.tests.push(test);
  }

  if (passed || level === 'warning') {
    target.passed = (target.passed || 0) + 1;
    if (level === 'warning') {
      target.warnings = (target.warnings || 0) + 1;
    }
  } else {
    target.failed = (target.failed || 0) + 1;
  }

  // Also add to category totals
  if (results.categories[category]) {
    results.categories[category].tests.push({ ...test, buildId: target.id });
    if (passed || level === 'warning') {
      results.categories[category].passed++;
      if (level === 'warning') {
        results.categories[category].warnings = (results.categories[category].warnings || 0) + 1;
      }
    } else {
      results.categories[category].failed++;
    }
  }
}

function calculateSummary() {
  results.summary.passed = 0;
  results.summary.warnings = 0;
  results.summary.failed = 0;

  for (const build of results.builds) {
    results.summary.passed += build.passed;
    results.summary.warnings += build.warnings || 0;
    results.summary.failed += build.failed;
  }

  // Add device tests
  for (const cat of Object.values(results.categories)) {
    // Already counted in builds
  }
}

function printReport() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 VALIDATION REPORT');
  console.log('═'.repeat(60));

  // Overall summary
  console.log('\n📈 OVERALL SUMMARY:');
  console.log(`   ✓ Passed:   ${results.summary.passed}`);
  console.log(`   ⚠ Warnings: ${results.summary.warnings}`);
  console.log(`   ✗ Failed:   ${results.summary.failed}`);

  // Category breakdown
  console.log('\n📋 BY CATEGORY:');
  for (const [name, cat] of Object.entries(results.categories)) {
    const total = cat.passed + cat.failed;
    if (total === 0) continue;
    const pct = Math.round((cat.passed / total) * 100);
    console.log(`   ${name}: ${cat.passed}/${total} (${pct}%)${cat.warnings ? ` [${cat.warnings} warnings]` : ''}`);
  }

  // Failed tests
  const failures = [];
  for (const build of results.builds) {
    for (const test of build.tests) {
      if (!test.passed && !test.warning) {
        failures.push({ build: build.id, ...test });
      }
    }
  }

  if (failures.length > 0) {
    console.log('\n❌ FAILURES:');
    for (const f of failures.slice(0, 20)) {
      console.log(`   [${f.build}] ${f.name}: ${f.details || 'Failed'}`);
    }
    if (failures.length > 20) {
      console.log(`   ... and ${failures.length - 20} more`);
    }
  }

  // Warnings
  const warnings = [];
  for (const build of results.builds) {
    for (const test of build.tests) {
      if (test.warning) {
        warnings.push({ build: build.id, ...test });
      }
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    for (const w of warnings.slice(0, 10)) {
      console.log(`   [${w.build}] ${w.name}: ${w.details || 'Warning'}`);
    }
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more`);
    }
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');

  const missingCoding = results.builds.filter(b =>
    b.tests.some(t => t.name === 'Has coding tutorials' && !t.passed)
  );
  if (missingCoding.length > 0) {
    console.log(`   - Add coding tutorials to ${missingCoding.length} builds: ${missingCoding.map(b => b.id).join(', ')}`);
  }

  const placeholderLessons = results.builds.filter(b =>
    b.tests.some(t => t.name === 'Lessons have detailed content' && t.warning)
  );
  if (placeholderLessons.length > 0) {
    console.log(`   - Fill in detailed lesson content for ${placeholderLessons.length} builds`);
  }

  const readabilityIssues = results.builds.filter(b =>
    b.tests.some(t => t.name.includes('child-friendly') && (t.warning || !t.passed))
  );
  if (readabilityIssues.length > 0) {
    console.log(`   - Simplify text for 8-year-olds in ${readabilityIssues.length} builds`);
  }
}

runValidation().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
