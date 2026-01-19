/**
 * Enhance Lesson Content
 * Re-parses lesson HTML to extract full structured content
 */

import fs from 'fs';
import https from 'https';
import http from 'http';
import { JSDOM } from 'jsdom';

const DELAY_MS = 2000;

/**
 * Fetch HTML content from URL
 */
async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse HTML and extract structured sections
 */
function parseHtmlSections(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const body = doc.body;

  const sections = {
    objective: null,
    buildingDevices: [],
    motorWiring: null,
    blocksUsed: [],
    phenomenon: null,
    hexFiles: []
  };

  // Get all text content for regex matching
  const fullText = body.textContent;

  // Extract learning objective (usually first paragraph after h2)
  const objectiveMatch = fullText.match(/learning objective[s]?[\s\S]*?(?=2\.|building device|motor wiring|$)/i);
  if (objectiveMatch) {
    sections.objective = objectiveMatch[0]
      .replace(/learning objective[s]?:?/i, '')
      .replace(/1\./g, '')
      .trim()
      .split('\n')[0]
      .trim();
  }

  // Extract building devices
  const devicesMatch = fullText.match(/building device[s]?[\s\S]*?(?=3\.|motor wiring|programming|$)/i);
  if (devicesMatch) {
    // Look for a list of items
    const deviceText = devicesMatch[0];
    const items = deviceText.match(/micro:bit|superbit|expansion board|motor|servo|sensor|RGB|buzzer|cable|wire/gi);
    if (items) {
      sections.buildingDevices = [...new Set(items.map(i => i.toLowerCase()))];
    }
  }

  // Extract motor wiring info from tables
  const tables = doc.querySelectorAll('table');
  for (const table of tables) {
    const text = table.textContent.toLowerCase();
    if (text.includes('motor') || text.includes('m1') || text.includes('m3') || text.includes('servo')) {
      const wiring = {};
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim().toLowerCase();
          const value = cells[1].textContent.trim();
          const note = cells.length > 2 ? cells[2].textContent.trim() : '';

          if (key.includes('left')) {
            wiring.leftMotor = { port: value, note };
          } else if (key.includes('right')) {
            wiring.rightMotor = { port: value, note };
          } else if (key.includes('servo')) {
            wiring.servo = { port: value, note };
          } else if (key.includes('camera') || key.includes('wifi')) {
            wiring.camera = { port: value, note };
          }
        }
      });
      if (Object.keys(wiring).length > 0) {
        sections.motorWiring = wiring;
      }
    }
  }

  // Extract hex file references
  const hexMatches = fullText.match(/[\w-]+\.hex/gi);
  if (hexMatches) {
    sections.hexFiles = [...new Set(hexMatches)];
  }

  // Extract phenomenon/outcome - look for text after "Experimental phenomenon" heading
  const phenomMatch = fullText.match(/experimental phenomenon[:\s]*([\s\S]{20,500}?)(?=\s*(?:if you need|note:|resources|$))/i);
  if (phenomMatch && phenomMatch[1]) {
    // Clean up the extracted text
    let phenomText = phenomMatch[1]
      .replace(/5\./g, '')
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();

    // Limit to reasonable length (first 2-3 sentences)
    const sentences = phenomText.split(/(?<=[.!?])\s+/);
    sections.phenomenon = sentences.slice(0, 3).join(' ').trim();

    // Cap at 500 chars max
    if (sections.phenomenon.length > 500) {
      sections.phenomenon = sections.phenomenon.substring(0, 500).replace(/\s+\S*$/, '...');
    }
  }

  // Categorize images by their position in the document
  const images = doc.querySelectorAll('img');
  const categorizedImages = [];

  images.forEach((img, index) => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';

    // Determine type by looking at surrounding text
    let type = 'content';
    let elem = img;

    // Walk up to find context
    for (let i = 0; i < 5 && elem.parentElement; i++) {
      elem = elem.parentElement;
      const prevText = elem.previousElementSibling?.textContent?.toLowerCase() || '';
      const parentText = elem.textContent?.toLowerCase().slice(0, 200) || '';

      if (prevText.includes('wiring') || prevText.includes('connection') ||
          parentText.includes('wiring') && parentText.includes('motor')) {
        type = 'wiring';
        break;
      }
      if (prevText.includes('building block') || prevText.includes('4.2') ||
          prevText.includes('block card')) {
        type = 'blocks';
        break;
      }
      if (prevText.includes('combining') || prevText.includes('4.3') ||
          prevText.includes('program') || prevText.includes('code')) {
        type = 'combined';
        break;
      }
    }

    categorizedImages.push({
      url: src,
      type,
      index,
      alt
    });
  });

  sections.categorizedImages = categorizedImages;

  return sections;
}

/**
 * Enhance a single lesson with parsed content
 */
async function enhanceLesson(lesson) {
  if (!lesson.sourceUrl) {
    console.log(`    ⚠ No sourceUrl`);
    return lesson;
  }

  try {
    const html = await fetchHtml(lesson.sourceUrl);
    const sections = parseHtmlSections(html);

    // Merge with existing lesson data
    const enhanced = {
      ...lesson,
      objective: sections.objective || lesson.objective,
      buildingDevices: sections.buildingDevices.length > 0 ? sections.buildingDevices : lesson.buildingDevices,
      motorWiring: sections.motorWiring || lesson.motorWiring,
      hexFiles: sections.hexFiles.length > 0 ? sections.hexFiles : lesson.hexFiles,
      phenomenon: sections.phenomenon || lesson.phenomenon
    };

    // Update image types based on better categorization
    if (lesson.images && sections.categorizedImages) {
      enhanced.images = lesson.images.map((img, i) => {
        const categorized = sections.categorizedImages.find(c =>
          c.url === img.url || c.index === i
        );
        return {
          ...img,
          type: categorized?.type || img.type
        };
      });
    }

    console.log(`    ✓ Enhanced with ${sections.hexFiles.length} hex files, ${sections.buildingDevices.length} devices`);
    return enhanced;
  } catch (err) {
    console.log(`    ✗ ${err.message}`);
    return lesson;
  }
}

/**
 * Enhance all lessons for a build
 */
async function enhanceBuildLessons(build) {
  console.log(`\n📦 Build ${build.id}: ${build.name}`);

  // Process MakeCode lessons
  if (build.codingCourses?.makecode?.lessons) {
    console.log(`  MakeCode lessons:`);
    const enhanced = [];
    for (let i = 0; i < build.codingCourses.makecode.lessons.length; i++) {
      const lesson = build.codingCourses.makecode.lessons[i];
      console.log(`  Lesson ${i + 1}: ${lesson.title}`);
      const updated = await enhanceLesson(lesson);
      enhanced.push(updated);
      await sleep(DELAY_MS);
    }
    build.codingCourses.makecode.lessons = enhanced;
  }

  // Process Python lessons
  if (build.codingCourses?.python?.lessons) {
    console.log(`  Python lessons:`);
    const enhanced = [];
    for (let i = 0; i < build.codingCourses.python.lessons.length; i++) {
      const lesson = build.codingCourses.python.lessons[i];
      console.log(`  Lesson ${i + 1}: ${lesson.title}`);
      const updated = await enhanceLesson(lesson);
      enhanced.push(updated);
      await sleep(DELAY_MS);
    }
    build.codingCourses.python.lessons = enhanced;
  }

  return build;
}

// Main execution
async function main() {
  const targetBuilds = process.argv.slice(2);
  if (targetBuilds.length === 0) {
    console.log('Usage: node enhance-lesson-content.js 1.1 1.2 1.3');
    process.exit(1);
  }

  console.log(`\n📝 Enhancing lessons for builds: ${targetBuilds.join(', ')}`);

  // Load current builds data
  const buildsPath = 'public/data/builds.json';
  const buildsData = JSON.parse(fs.readFileSync(buildsPath, 'utf-8'));

  for (const buildId of targetBuilds) {
    const buildIndex = buildsData.builds.findIndex(b => b.id === buildId);
    if (buildIndex === -1) {
      console.log(`Build ${buildId} not found!`);
      continue;
    }

    const build = buildsData.builds[buildIndex];
    const updated = await enhanceBuildLessons(build);
    buildsData.builds[buildIndex] = updated;
  }

  // Save updated builds
  fs.writeFileSync(buildsPath, JSON.stringify(buildsData, null, 2));
  console.log(`\n✅ Saved to ${buildsPath}`);
}

main().catch(console.error);
