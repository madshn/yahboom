#!/usr/bin/env node
/**
 * Validate Yahboom Chapter URLs
 *
 * The Yahboom site uses RELATIVE numbering within each main chapter:
 * - Chapter 1: 1.1-1.32 (Assembly)
 * - Chapter 3: 3.1-3.9 visible, but internally these are basic MakeCode lessons
 * - Chapter 5: When expanded shows 1.x, 2.x, 3.x (theory, basic, expansion)
 * - Chapter 6: Same pattern as Chapter 5
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/chapter-validation.json');

async function main() {
  console.log('🚀 Starting chapter validation...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📡 Loading Yahboom site...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Structure to track what we find
  const findings = {
    chapter1: { name: 'Assembly Course', items: [] },
    chapter2: { name: 'Preparation', items: [] },
    chapter3: { name: 'Basic MakeCode', items: [] },
    chapter4: { name: 'Basic Python', items: [] },
    chapter5: { name: 'Sensor MakeCode', sections: { theory: [], basic: [], expansion: [] } },
    chapter6: { name: 'Sensor Python', sections: { theory: [], basic: [], expansion: [] } }
  };

  // Helper to extract visible links after clicking
  async function getVisibleChapterLinks() {
    return page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a').forEach(a => {
        const text = a.textContent.trim();
        const match = text.match(/^([\d.]+)\s*(.+)/);
        if (match) {
          links.push({ id: match[1], title: match[2].substring(0, 80) });
        }
      });
      return links;
    });
  }

  // Click a chapter header and get its contents
  async function expandAndCapture(chapterText, targetKey) {
    try {
      // Find and click the chapter header
      const header = await page.locator(`text=/${chapterText}/`).first();
      if (await header.isVisible({ timeout: 2000 })) {
        await header.click();
        await page.waitForTimeout(800);
        return true;
      }
    } catch (e) {
      console.log(`   Could not find: ${chapterText}`);
    }
    return false;
  }

  console.log('\n📂 Analyzing Chapter 1 (Assembly)...');
  if (await expandAndCapture('1\\.Assembly Course', 'chapter1')) {
    const links = await getVisibleChapterLinks();
    findings.chapter1.items = links.filter(l => l.id.match(/^1\.\d+$/));
    console.log(`   Found ${findings.chapter1.items.length} assembly builds`);
  }

  console.log('\n📂 Analyzing Chapter 3 (Basic MakeCode)...');
  if (await expandAndCapture('3\\.Basic modeling MakeCode', 'chapter3')) {
    await page.waitForTimeout(500);
    const links = await getVisibleChapterLinks();
    findings.chapter3.items = links.filter(l => l.id.match(/^3\.\d+$/));
    console.log(`   Found ${findings.chapter3.items.length} MakeCode basic lessons`);
  }

  console.log('\n📂 Analyzing Chapter 4 (Basic Python)...');
  if (await expandAndCapture('4\\.Basic modeling Python', 'chapter4')) {
    await page.waitForTimeout(500);
    const links = await getVisibleChapterLinks();
    findings.chapter4.items = links.filter(l => l.id.match(/^4\.\d+$/));
    console.log(`   Found ${findings.chapter4.items.length} Python basic lessons`);
  }

  console.log('\n📂 Analyzing Chapter 5 (Sensor MakeCode)...');
  if (await expandAndCapture('5\\.Sensor Advanced MakeCode', 'chapter5')) {
    await page.waitForTimeout(500);

    // Now look for sub-sections: 1.x (theory), 2.x (basic), 3.x (expansion)
    // These are shown with relative numbering inside chapter 5

    // Try to expand section 1 (Sensor principle)
    try {
      const sec1 = await page.locator('text=/1\\.Sensor principle/').first();
      if (await sec1.isVisible({ timeout: 1000 })) {
        await sec1.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    // Try to expand section 2 (Sensor basic course)
    try {
      const sec2 = await page.locator('text=/2\\.Sensor basic course/').first();
      if (await sec2.isVisible({ timeout: 1000 })) {
        await sec2.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    // Try to expand section 3 (Sensor expansion course)
    try {
      const sec3 = await page.locator('text=/3\\.Sensor expansion/').first();
      if (await sec3.isVisible({ timeout: 1000 })) {
        await sec3.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    const links = await getVisibleChapterLinks();

    // Within chapter 5, items are numbered 1.1-1.16 (theory), 2.1-2.9 (basic), 3.1-3.9 (expansion)
    findings.chapter5.sections.theory = links.filter(l => l.id.match(/^1\.\d+$/) && parseInt(l.id.split('.')[1]) <= 16);
    findings.chapter5.sections.basic = links.filter(l => l.id.match(/^2\.\d+$/));
    findings.chapter5.sections.expansion = links.filter(l => l.id.match(/^3\.\d+$/) && !l.title.includes('MakeCode'));

    console.log(`   Theory: ${findings.chapter5.sections.theory.length} lessons`);
    console.log(`   Basic: ${findings.chapter5.sections.basic.length} lessons`);
    console.log(`   Expansion: ${findings.chapter5.sections.expansion.length} lessons`);
  }

  console.log('\n📂 Analyzing Chapter 6 (Sensor Python)...');
  if (await expandAndCapture('6\\.Sensor Advanced Python', 'chapter6')) {
    await page.waitForTimeout(500);

    // Try to expand sub-sections
    for (const secName of ['1.Sensor principle', '2.Sensor basic', '3.Sensor expansion']) {
      try {
        const sec = await page.locator(`text=/${secName}/`).first();
        if (await sec.isVisible({ timeout: 1000 })) {
          await sec.click();
          await page.waitForTimeout(400);
        }
      } catch (e) {}
    }

    const links = await getVisibleChapterLinks();

    findings.chapter6.sections.theory = links.filter(l => l.id.match(/^1\.\d+$/) && parseInt(l.id.split('.')[1]) <= 16);
    findings.chapter6.sections.basic = links.filter(l => l.id.match(/^2\.\d+$/));
    findings.chapter6.sections.expansion = links.filter(l => l.id.match(/^3\.\d+$/));

    console.log(`   Theory: ${findings.chapter6.sections.theory.length} lessons`);
    console.log(`   Basic: ${findings.chapter6.sections.basic.length} lessons`);
    console.log(`   Expansion: ${findings.chapter6.sections.expansion.length} lessons`);
  }

  // Print summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    VALIDATION RESULTS                          ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = [
    { name: 'Assembly (Ch 1)', found: findings.chapter1.items.length, expected: 32 },
    { name: 'MakeCode Basic (Ch 3)', found: findings.chapter3.items.length, expected: 9 },
    { name: 'Python Basic (Ch 4)', found: findings.chapter4.items.length, expected: 9 },
    { name: 'MakeCode Theory (Ch 5.1)', found: findings.chapter5.sections.theory.length, expected: 16 },
    { name: 'MakeCode Sensor Basic (Ch 5.2)', found: findings.chapter5.sections.basic.length, expected: 9 },
    { name: 'MakeCode Sensor Exp (Ch 5.3)', found: findings.chapter5.sections.expansion.length, expected: 9 },
    { name: 'Python Theory (Ch 6.1)', found: findings.chapter6.sections.theory.length, expected: 16 },
    { name: 'Python Sensor Basic (Ch 6.2)', found: findings.chapter6.sections.basic.length, expected: 9 },
    { name: 'Python Sensor Exp (Ch 6.3)', found: findings.chapter6.sections.expansion.length, expected: 9 },
  ];

  let totalFound = 0;
  let totalExpected = 0;

  for (const r of results) {
    const status = r.found >= r.expected ? '✓' : (r.found > 0 ? '⚠' : '✗');
    const pct = r.expected > 0 ? Math.round((r.found / r.expected) * 100) : 0;
    console.log(`${status} ${r.name.padEnd(30)} ${String(r.found).padStart(2)}/${r.expected} (${pct}%)`);
    totalFound += r.found;
    totalExpected += r.expected;
  }

  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  TOTAL                              ${totalFound}/${totalExpected} (${Math.round((totalFound/totalExpected)*100)}%)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Show what we found for each section
  console.log('📋 DETAILED FINDINGS:\n');

  if (findings.chapter1.items.length > 0) {
    console.log('Assembly (1.x):');
    console.log('   ' + findings.chapter1.items.map(i => i.id).join(', '));
    console.log('');
  }

  if (findings.chapter3.items.length > 0) {
    console.log('MakeCode Basic (3.x):');
    console.log('   ' + findings.chapter3.items.map(i => i.id).join(', '));
    console.log('');
  }

  if (findings.chapter5.sections.basic.length > 0) {
    console.log('MakeCode Sensor Basic (relative 2.x in Ch5):');
    findings.chapter5.sections.basic.forEach(i => console.log(`   ${i.id} - ${i.title}`));
    console.log('');
  }

  if (findings.chapter5.sections.expansion.length > 0) {
    console.log('MakeCode Sensor Expansion (relative 3.x in Ch5):');
    findings.chapter5.sections.expansion.forEach(i => console.log(`   ${i.id} - ${i.title}`));
    console.log('');
  }

  // Save results
  const output = {
    validatedAt: new Date().toISOString(),
    sourceUrl: BASE_URL,
    summary: {
      totalFound,
      totalExpected,
      percentComplete: Math.round((totalFound / totalExpected) * 100)
    },
    findings,
    resultsBySection: results
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`💾 Results saved to ${OUTPUT_PATH}`);

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
