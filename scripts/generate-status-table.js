#!/usr/bin/env node
/**
 * Generates detailed build content status table for validation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildsPath = join(__dirname, '../public/data/builds.json');

const data = JSON.parse(readFileSync(buildsPath, 'utf-8'));
const builds = data.builds;

// Helper functions
function hasGalleryImage(b) {
  return Boolean(b.finalImageUrl || b.localImage || (b.allImages && b.allImages.length > 0));
}

function getSensors(b) {
  return b.sensors && b.sensors.length ? b.sensors.join(', ') : '—';
}

function getAssemblyCount(b) {
  return b.assemblySteps ? b.assemblySteps.length : 0;
}

function getMCCount(b) {
  return b.codingCourses?.makecode?.lessons?.length || 0;
}

function hasMCBlocks(b) {
  const lessons = b.codingCourses?.makecode?.lessons || [];
  return lessons.some(l => l.images && l.images.length > 0);
}

function getPyCount(b) {
  return b.codingCourses?.python?.lessons?.length || 0;
}

function hasWiring(b) {
  const allLessons = [
    ...(b.codingCourses?.makecode?.lessons || []),
    ...(b.codingCourses?.python?.lessons || [])
  ];
  return allLessons.some(l =>
    l.wiringImage ||
    l.circuitImage ||
    (l.images && l.images.some(i => i.type === 'wiring' || i.type === 'circuit'))
  );
}

// Generate report
console.log('# Detailed Build Content Status');
console.log('');
console.log('Generated: ' + new Date().toISOString().split('T')[0]);
console.log('');
console.log('## Legend');
console.log('- **Gallery**: Primary image for gallery display');
console.log('- **Sensors**: Tagged sensor types used in build');
console.log('- **Assembly**: Step count for build instructions');
console.log('- **MakeCode**: Lesson count');
console.log('- **MC Blocks**: MakeCode block illustration images');
console.log('- **Python**: Lesson count');
console.log('- **Wiring**: Circuit/wiring diagram available');
console.log('');
console.log('---');
console.log('');
console.log('## All Builds');
console.log('');
console.log('| ID | Name | Gallery | Sensors | Assembly | MakeCode | MC Blocks | Python | Wiring |');
console.log('|----|------|---------|---------|----------|----------|-----------|--------|--------|');

builds.forEach(b => {
  const name = b.name.length > 35 ? b.name.substring(0, 32) + '...' : b.name;
  const gallery = hasGalleryImage(b) ? '✓' : '✗';
  const sensors = getSensors(b);
  const assembly = getAssemblyCount(b) > 0 ? `✓ (${getAssemblyCount(b)})` : '✗';
  const mc = getMCCount(b) > 0 ? `✓ (${getMCCount(b)})` : '✗';
  const mcBlocks = hasMCBlocks(b) ? '✓' : '✗';
  const py = getPyCount(b) > 0 ? `✓ (${getPyCount(b)})` : '✗';
  const wiring = hasWiring(b) ? '✓' : '✗';

  console.log(`| ${b.id} | ${name} | ${gallery} | ${sensors} | ${assembly} | ${mc} | ${mcBlocks} | ${py} | ${wiring} |`);
});

console.log('');
console.log('---');
console.log('');
console.log('## Sensor-to-Build Mapping');
console.log('');
console.log('Only advanced builds (1.17+) use external sensors. Basic builds (1.1-1.16) use only motors/servos.');
console.log('');

const sensorMap = {};
builds.forEach(b => {
  if (b.sensors && b.sensors.length > 0) {
    b.sensors.forEach(s => {
      if (!sensorMap[s]) sensorMap[s] = [];
      sensorMap[s].push(`${b.id} (${b.name})`);
    });
  }
});

const theoryMap = {
  'ultrasonic': '1.1 About ultrasonic, 1.2 Ranging',
  'potentiometer': '1.3 About potentiometers, 1.4 Adjust',
  'light': '1.5 About photosensitive, 1.6 Read intensity',
  'infrared': '1.7 About infrared, 1.8 Obstacle detection',
  'PIR': '1.9 About human IR, 1.10 Body detection',
  'temperature': '1.11 About temp-humidity, 1.12 Read',
  'humidity': '1.11 About temp-humidity, 1.12 Read',
  'color': '1.13 About color sensors, 1.14 Recognition',
  'joystick': '1.15 About rocker module, 1.16 Control'
};

console.log('| Sensor | Builds Using It | Theory Lessons (Section 5) |');
console.log('|--------|-----------------|----------------------------|');

Object.entries(sensorMap).forEach(([sensor, buildList]) => {
  const theory = theoryMap[sensor] || '—';
  console.log(`| ${sensor} | ${buildList.join('; ')} | ${theory} |`);
});

console.log('');
console.log('---');
console.log('');
console.log('## Summary Statistics');
console.log('');
console.log('| Metric | Count | Percentage |');
console.log('|--------|-------|------------|');
console.log(`| Total Builds | ${builds.length} | — |`);
console.log(`| With Gallery Image | ${builds.filter(hasGalleryImage).length} | ${Math.round(builds.filter(hasGalleryImage).length / builds.length * 100)}% |`);
console.log(`| With Sensor Tags | ${builds.filter(b => b.sensors?.length > 0).length} | ${Math.round(builds.filter(b => b.sensors?.length > 0).length / builds.length * 100)}% |`);
console.log(`| With Assembly Steps | ${builds.filter(b => getAssemblyCount(b) > 0).length} | ${Math.round(builds.filter(b => getAssemblyCount(b) > 0).length / builds.length * 100)}% |`);
console.log(`| With MakeCode Lessons | ${builds.filter(b => getMCCount(b) > 0).length} | ${Math.round(builds.filter(b => getMCCount(b) > 0).length / builds.length * 100)}% |`);
console.log(`| With MC Block Images | ${builds.filter(hasMCBlocks).length} | ${Math.round(builds.filter(hasMCBlocks).length / builds.length * 100)}% |`);
console.log(`| With Python Lessons | ${builds.filter(b => getPyCount(b) > 0).length} | ${Math.round(builds.filter(b => getPyCount(b) > 0).length / builds.length * 100)}% |`);
console.log(`| With Wiring Diagrams | ${builds.filter(hasWiring).length} | ${Math.round(builds.filter(hasWiring).length / builds.length * 100)}% |`);
