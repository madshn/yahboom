#!/usr/bin/env node
/**
 * Analyze Yahboom Chapter Structure
 * Scrapes full navigation from the Building:bit site
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.yahboom.net/study/buildingbit-super-kit';
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/chapter-structure.json');

async function analyzeChapters() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to Yahboom site...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Find and click all main chapter headers to expand them
  console.log('Expanding all chapter sections...');

  // The sidebar has chapter titles that can be clicked to expand
  const chapterTitles = [
    '1.Assembly Course',
    '2.Preparation before class',
    '3.Basic modeling MakeCode course',
    '4.Basic modeling Python course',
    '5.Sensor Advanced MakeCode course',
    '6.Sensor Advanced Python course'
  ];

  for (const title of chapterTitles) {
    try {
      // Try to find and click the chapter header
      const header = await page.locator(`text="${title}"`).first();
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(800);
        console.log(`  Expanded: ${title}`);
      }
    } catch (e) {
      console.log(`  Could not expand: ${title}`);
    }
  }

  // For chapters with sub-sections (5 and 6), we need to expand those too
  const subSections = [
    '5.1.Sensor principle',
    '5.2.Sensor basic course',
    '5.3.Sensor expansion course',
    '6.1.Sensor principle',
    '6.2.Sensor basic course',
    '6.3.Sensor expansion course'
  ];

  for (const section of subSections) {
    try {
      const sectionEl = await page.locator(`text="${section}"`).first();
      if (await sectionEl.isVisible()) {
        await sectionEl.click();
        await page.waitForTimeout(500);
        console.log(`  Expanded subsection: ${section}`);
      }
    } catch (e) {
      // Try partial match
      const partial = section.split('.').slice(0, 2).join('.');
      try {
        const el = await page.locator(`text=/${partial}/`).first();
        if (await el.isVisible()) {
          await el.click();
          await page.waitForTimeout(500);
        }
      } catch (e2) {
        // Ignore
      }
    }
  }

  await page.waitForTimeout(1000);

  // Take screenshot after expansion
  await page.screenshot({ path: 'docs/yahboom-expanded.png', fullPage: true });
  console.log('Screenshot saved to docs/yahboom-expanded.png');

  // Extract all chapter links
  console.log('\nExtracting chapter structure...');

  const allLinks = await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('a').forEach(a => {
      const text = a.textContent.trim();
      // Match patterns like "1.1", "3.2.1", "5.1.1", "6.3.9"
      if (text.match(/^\d+(\.\d+)+\s*[A-Za-z]/)) {
        links.push({
          text: text.substring(0, 150),
          href: a.getAttribute('href')
        });
      }
    });
    return links;
  });

  console.log(`Found ${allLinks.length} chapter links`);

  // Parse into structured format
  const chapters = {
    '1': { number: '1', title: 'Assembly Course', subchapters: [] },
    '2': { number: '2', title: 'Preparation before class', subchapters: [] },
    '3': { number: '3', title: 'Basic modeling MakeCode course', subchapters: [] },
    '4': { number: '4', title: 'Basic modeling Python course', subchapters: [] },
    '5': { number: '5', title: 'Sensor Advanced MakeCode course', sections: {
      '5.1': { title: 'Sensor principle', items: [] },
      '5.2': { title: 'Sensor basic course', items: [] },
      '5.3': { title: 'Sensor expansion course', items: [] }
    }},
    '6': { number: '6', title: 'Sensor Advanced Python course', sections: {
      '6.1': { title: 'Sensor principle', items: [] },
      '6.2': { title: 'Sensor basic course', items: [] },
      '6.3': { title: 'Sensor expansion course', items: [] }
    }}
  };

  for (const link of allLinks) {
    const match = link.text.match(/^([\d.]+)\s*(.+)/);
    if (!match) continue;

    const id = match[1];
    const title = match[2].trim();
    const parts = id.split('.');
    const mainChapter = parts[0];

    if (mainChapter === '5' || mainChapter === '6') {
      // Three-level chapters: 5.1.1, 5.2.3, 6.1.5, etc.
      const section = parts.slice(0, 2).join('.');
      if (chapters[mainChapter].sections[section]) {
        chapters[mainChapter].sections[section].items.push({ id, title });
      }
    } else {
      // Two-level chapters: 1.1, 3.5, etc.
      chapters[mainChapter].subchapters.push({ id, title });
    }
  }

  // Sort all items
  const sortById = (a, b) => {
    const aParts = a.id.split('.').map(Number);
    const bParts = b.id.split('.').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const diff = (aParts[i] || 0) - (bParts[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  };

  for (const ch of Object.values(chapters)) {
    if (ch.subchapters) {
      ch.subchapters.sort(sortById);
    }
    if (ch.sections) {
      for (const sec of Object.values(ch.sections)) {
        sec.items.sort(sortById);
      }
    }
  }

  // Print summary
  console.log('\n=== Chapter Structure ===\n');
  for (const [num, ch] of Object.entries(chapters)) {
    if (ch.subchapters) {
      console.log(`${num}. ${ch.title} (${ch.subchapters.length} items)`);
      ch.subchapters.slice(0, 3).forEach(s => console.log(`   ${s.id} ${s.title}`));
      if (ch.subchapters.length > 3) console.log(`   ...and ${ch.subchapters.length - 3} more`);
    }
    if (ch.sections) {
      console.log(`${num}. ${ch.title}`);
      for (const [secId, sec] of Object.entries(ch.sections)) {
        console.log(`   ${secId} ${sec.title} (${sec.items.length} items)`);
      }
    }
  }

  // Build output
  const output = {
    scrapedAt: new Date().toISOString(),
    sourceUrl: BASE_URL,
    chapters: Object.values(chapters),
    summary: {
      totalChapters: Object.keys(chapters).length,
      totalItems: allLinks.length
    }
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${OUTPUT_PATH}`);

  await browser.close();
  return output;
}

// Generate markdown report
function generateReport(data) {
  let report = `# Yahboom Chapter Structure Report\n\n`;
  report += `Scraped: ${data.scrapedAt}\n`;
  report += `Source: ${data.sourceUrl}\n\n`;

  for (const ch of data.chapters) {
    report += `## ${ch.number}. ${ch.title}\n\n`;

    if (ch.subchapters && ch.subchapters.length > 0) {
      report += `| ID | Title |\n`;
      report += `|----|-------|\n`;
      for (const sub of ch.subchapters) {
        report += `| ${sub.id} | ${sub.title} |\n`;
      }
      report += `\n`;
    }

    if (ch.sections) {
      for (const [secId, sec] of Object.entries(ch.sections)) {
        report += `### ${secId} ${sec.title}\n\n`;
        if (sec.items.length > 0) {
          report += `| ID | Title |\n`;
          report += `|----|-------|\n`;
          for (const item of sec.items) {
            report += `| ${item.id} | ${item.title} |\n`;
          }
        } else {
          report += `No items found.\n`;
        }
        report += `\n`;
      }
    }
  }

  const reportPath = path.join(process.cwd(), 'docs/chapter-structure-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Report saved to ${reportPath}`);
}

analyzeChapters()
  .then(generateReport)
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
