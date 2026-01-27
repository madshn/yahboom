#!/usr/bin/env node
/**
 * Analyzes builds.json to report completeness of each build's assets
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildsPath = join(__dirname, '../public/data/builds.json');

const data = JSON.parse(readFileSync(buildsPath, 'utf-8'));
const builds = data.builds;

// Analysis functions
function hasGalleryImage(build) {
  return !!(build.finalImageUrl || build.localImage || (build.allImages && build.allImages.length > 0));
}

function hasSensorList(build) {
  return build.sensors && build.sensors.length > 0;
}

function hasAssemblySteps(build) {
  return build.assemblySteps && build.assemblySteps.length > 0;
}

function getAssemblyStepCount(build) {
  return build.assemblySteps ? build.assemblySteps.length : 0;
}

function hasMakeCodeLessons(build) {
  return build.codingCourses?.makecode?.lessons && build.codingCourses.makecode.lessons.length > 0;
}

function getMakeCodeLessonCount(build) {
  return build.codingCourses?.makecode?.lessons?.length || 0;
}

function hasMakeCodeBlockImages(build) {
  const lessons = build.codingCourses?.makecode?.lessons || [];
  return lessons.some(lesson =>
    lesson.images && lesson.images.some(img =>
      img.type === 'block' || img.url?.includes('block') || img.type === 'content'
    )
  );
}

function hasPythonLessons(build) {
  return build.codingCourses?.python?.lessons && build.codingCourses.python.lessons.length > 0;
}

function getPythonLessonCount(build) {
  return build.codingCourses?.python?.lessons?.length || 0;
}

function hasWiringImage(build) {
  // Check for wiring/circuit images in various places
  const lessons = [
    ...(build.codingCourses?.makecode?.lessons || []),
    ...(build.codingCourses?.python?.lessons || [])
  ];
  return lessons.some(lesson =>
    lesson.wiringImage ||
    lesson.circuitImage ||
    (lesson.images && lesson.images.some(img =>
      img.type === 'wiring' || img.type === 'circuit' ||
      img.url?.includes('wiring') || img.url?.includes('circuit')
    ))
  );
}

function hasSensorTheoryLink(build) {
  return !!(build.sensorTheoryUrl || build.sensorPrincipleUrl);
}

// Generate report
console.log('\n# Build Completeness Report\n');
console.log('Generated:', new Date().toISOString().split('T')[0]);
console.log('Total builds:', builds.length);
console.log('\n---\n');

// Summary stats
const stats = {
  withGalleryImage: 0,
  withSensors: 0,
  withAssembly: 0,
  withMakeCode: 0,
  withMakeCodeBlocks: 0,
  withPython: 0,
  withWiring: 0,
  withSensorTheory: 0
};

// Detailed table header
console.log('| ID | Name | Gallery | Sensors | Assembly | MakeCode | MC Blocks | Python | Wiring | Theory |');
console.log('|-----|------|---------|---------|----------|----------|-----------|--------|--------|--------|');

builds.forEach(build => {
  const galleryImg = hasGalleryImage(build);
  const sensors = hasSensorList(build);
  const assembly = hasAssemblySteps(build);
  const makecode = hasMakeCodeLessons(build);
  const mcBlocks = hasMakeCodeBlockImages(build);
  const python = hasPythonLessons(build);
  const wiring = hasWiringImage(build);
  const theory = hasSensorTheoryLink(build);

  if (galleryImg) stats.withGalleryImage++;
  if (sensors) stats.withSensors++;
  if (assembly) stats.withAssembly++;
  if (makecode) stats.withMakeCode++;
  if (mcBlocks) stats.withMakeCodeBlocks++;
  if (python) stats.withPython++;
  if (wiring) stats.withWiring++;
  if (theory) stats.withSensorTheory++;

  const mark = (val, count) => {
    if (count !== undefined) {
      return val ? `✓ (${count})` : '✗';
    }
    return val ? '✓' : '✗';
  };

  const name = build.name.substring(0, 30);
  console.log(`| ${build.id} | ${name.padEnd(30)} | ${mark(galleryImg).padEnd(7)} | ${mark(sensors, build.sensors?.length).padEnd(7)} | ${mark(assembly, getAssemblyStepCount(build)).padEnd(8)} | ${mark(makecode, getMakeCodeLessonCount(build)).padEnd(8)} | ${mark(mcBlocks).padEnd(9)} | ${mark(python, getPythonLessonCount(build)).padEnd(6)} | ${mark(wiring).padEnd(6)} | ${mark(theory).padEnd(6)} |`);
});

console.log('\n---\n');
console.log('## Summary\n');
console.log(`| Asset Type | Count | Percentage |`);
console.log(`|------------|-------|------------|`);
console.log(`| Gallery Image | ${stats.withGalleryImage}/${builds.length} | ${Math.round(stats.withGalleryImage/builds.length*100)}% |`);
console.log(`| Sensor List | ${stats.withSensors}/${builds.length} | ${Math.round(stats.withSensors/builds.length*100)}% |`);
console.log(`| Assembly Steps | ${stats.withAssembly}/${builds.length} | ${Math.round(stats.withAssembly/builds.length*100)}% |`);
console.log(`| MakeCode Lessons | ${stats.withMakeCode}/${builds.length} | ${Math.round(stats.withMakeCode/builds.length*100)}% |`);
console.log(`| MakeCode Block Images | ${stats.withMakeCodeBlocks}/${builds.length} | ${Math.round(stats.withMakeCodeBlocks/builds.length*100)}% |`);
console.log(`| Python Lessons | ${stats.withPython}/${builds.length} | ${Math.round(stats.withPython/builds.length*100)}% |`);
console.log(`| Wiring Diagrams | ${stats.withWiring}/${builds.length} | ${Math.round(stats.withWiring/builds.length*100)}% |`);
console.log(`| Sensor Theory Links | ${stats.withSensorTheory}/${builds.length} | ${Math.round(stats.withSensorTheory/builds.length*100)}% |`);

// List builds missing each asset type
console.log('\n---\n');
console.log('## Gaps by Asset Type\n');

const gaps = {
  'Gallery Image': builds.filter(b => !hasGalleryImage(b)).map(b => b.id),
  'Sensor List': builds.filter(b => !hasSensorList(b)).map(b => b.id),
  'Assembly Steps': builds.filter(b => !hasAssemblySteps(b)).map(b => b.id),
  'MakeCode Lessons': builds.filter(b => !hasMakeCodeLessons(b)).map(b => b.id),
  'MakeCode Block Images': builds.filter(b => !hasMakeCodeBlockImages(b)).map(b => b.id),
  'Python Lessons': builds.filter(b => !hasPythonLessons(b)).map(b => b.id),
  'Wiring Diagrams': builds.filter(b => !hasWiringImage(b)).map(b => b.id),
  'Sensor Theory Links': builds.filter(b => !hasSensorTheoryLink(b)).map(b => b.id)
};

for (const [asset, missing] of Object.entries(gaps)) {
  if (missing.length > 0 && missing.length < builds.length) {
    console.log(`### Missing ${asset} (${missing.length})`);
    console.log(missing.join(', '));
    console.log('');
  } else if (missing.length === builds.length) {
    console.log(`### Missing ${asset} (ALL - ${missing.length})`);
    console.log('*No builds have this asset type*\n');
  }
}

// JSON output for programmatic use
const jsonReport = {
  generated: new Date().toISOString(),
  totalBuilds: builds.length,
  summary: stats,
  builds: builds.map(b => ({
    id: b.id,
    name: b.name,
    hasGalleryImage: hasGalleryImage(b),
    sensors: b.sensors || [],
    assemblyStepCount: getAssemblyStepCount(b),
    makeCodeLessonCount: getMakeCodeLessonCount(b),
    hasMakeCodeBlocks: hasMakeCodeBlockImages(b),
    pythonLessonCount: getPythonLessonCount(b),
    hasWiring: hasWiringImage(b),
    hasSensorTheory: hasSensorTheoryLink(b)
  }))
};

// Write JSON report
import { writeFileSync } from 'fs';
writeFileSync(
  join(__dirname, '../public/data/completeness-report.json'),
  JSON.stringify(jsonReport, null, 2)
);
console.log('\n---\nJSON report written to: public/data/completeness-report.json');
