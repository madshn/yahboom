#!/usr/bin/env node

/**
 * Integrate Scraped Content into builds.json
 *
 * This script takes the scraped lesson data and merges it into
 * the public/data/builds.json file so it appears on the website.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Section name to build ID mapping
const SECTION_TO_BUILD = {
  'A.Mobile shooter': '1.1',
  'B.Pretty car': '1.2',
  'C.Clip robot': '1.3',
  'D.Proficient carrier': '1.4',
  'E.Skip car': '1.5',
  'F.Freestyle': '1.6',
  'G.Spider': '1.7',
  'H.Lifting platform': '1.8',
  'I.Biped robot': '1.9',
  'J.Changing Face': '1.10',
  'K.Carousel': '1.11',
  'L.Oscillating fan': '1.12',
  'M.Airplane': '1.13',
  'N.Unicycle': '1.14',
  'O.Auto-door': '1.15',
  'P.Dragon knight': '1.16',
  '0.Basic course': null, // Basic course doesn't map to a specific build
};

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    console.error(`Error loading ${path}:`, error.message);
    return null;
  }
}

function cleanLessonForDisplay(lesson) {
  // Clean up the lesson object for display
  if (lesson.error) {
    return null; // Skip lessons with errors
  }

  return {
    title: lesson.title,
    objective: lesson.objective || '',
    phenomenon: lesson.phenomenon || '',
    sourceUrl: lesson.sourceUrl || null,
    code: lesson.code ? {
      description: lesson.code.description || ''
    } : null,
    images: (lesson.images || []).filter(img => img.url && !img.url.startsWith('<')),
  };
}

function main() {
  console.log('Integrating scraped content into builds.json...\n');

  // Load builds.json
  const buildsPath = 'public/data/builds.json';
  const buildsData = loadJson(buildsPath);
  if (!buildsData) {
    console.error('Failed to load builds.json');
    process.exit(1);
  }

  // Load scraped content
  const makecodeData = loadJson('data/makecode-lessons.json');
  const pythonData = loadJson('data/python-lessons.json');
  const sensorData = loadJson('data/sensor-principles.json');

  let updatedCount = 0;
  let lessonsAdded = 0;

  // Process MakeCode lessons
  if (makecodeData) {
    console.log('Processing MakeCode lessons...');
    for (const [sectionName, lessons] of Object.entries(makecodeData)) {
      const buildId = SECTION_TO_BUILD[sectionName];
      if (!buildId) {
        console.log(`  Skipping ${sectionName} (no matching build)`);
        continue;
      }

      const build = buildsData.builds.find(b => b.id === buildId);
      if (!build) {
        console.log(`  Build ${buildId} not found`);
        continue;
      }

      // Ensure codingCourses structure exists
      if (!build.codingCourses) {
        build.codingCourses = {};
      }
      if (!build.codingCourses.makecode) {
        build.codingCourses.makecode = {
          section: `3.${sectionName.charAt(0)}`,
          name: sectionName.split('.')[1] || sectionName,
          lessons: []
        };
      }

      // Add cleaned lessons
      const cleanedLessons = lessons
        .map(cleanLessonForDisplay)
        .filter(Boolean);

      if (cleanedLessons.length > 0) {
        build.codingCourses.makecode.lessons = cleanedLessons;
        console.log(`  ✓ ${buildId} ${build.name}: ${cleanedLessons.length} MakeCode lessons`);
        updatedCount++;
        lessonsAdded += cleanedLessons.length;
      }
    }
  }

  // Process Python lessons
  if (pythonData) {
    console.log('\nProcessing Python lessons...');
    for (const [sectionName, lessons] of Object.entries(pythonData)) {
      const buildId = SECTION_TO_BUILD[sectionName];
      if (!buildId) {
        console.log(`  Skipping ${sectionName} (no matching build)`);
        continue;
      }

      const build = buildsData.builds.find(b => b.id === buildId);
      if (!build) {
        console.log(`  Build ${buildId} not found`);
        continue;
      }

      // Ensure codingCourses structure exists
      if (!build.codingCourses) {
        build.codingCourses = {};
      }
      if (!build.codingCourses.python) {
        build.codingCourses.python = {
          section: `4.${sectionName.charAt(0)}`,
          name: sectionName.split('.')[1] || sectionName,
          lessons: []
        };
      }

      // Add cleaned lessons
      const cleanedLessons = lessons
        .map(cleanLessonForDisplay)
        .filter(Boolean);

      if (cleanedLessons.length > 0) {
        build.codingCourses.python.lessons = cleanedLessons;
        console.log(`  ✓ ${buildId} ${build.name}: ${cleanedLessons.length} Python lessons`);
        updatedCount++;
        lessonsAdded += cleanedLessons.length;
      }
    }
  }

  // Save updated builds.json
  writeFileSync(buildsPath, JSON.stringify(buildsData, null, 2));
  console.log(`\n✅ Updated builds.json`);
  console.log(`   - ${updatedCount} builds updated`);
  console.log(`   - ${lessonsAdded} total lessons added`);

  // Also save sensor principles to public folder for direct access
  if (sensorData) {
    const sensorOutputPath = 'public/data/sensor-principles.json';
    writeFileSync(sensorOutputPath, JSON.stringify(sensorData, null, 2));
    console.log(`   - Sensor principles saved to ${sensorOutputPath}`);
  }

  console.log('\n🎉 Integration complete! Run `npm run dev` to see the content.');
}

main();
