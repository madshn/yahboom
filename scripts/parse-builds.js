import fs from 'fs/promises';
import path from 'path';

const RAW_HTML_DIR = './raw/html';
const OUTPUT_FILE = './public/data/builds.json';

// Difficulty heuristics based on step count and complexity indicators
function determineDifficulty(build) {
  const stepCount = build.images?.length || 0;
  const name = build.name.toLowerCase();

  // Advanced indicators: sensors, obstacle avoidance, tracking, recognition
  const advancedKeywords = ['ultrasonic', 'obstacle', 'avoidance', 'tracking', 'recognition', 'sensor', 'temperature', 'humidity', 'pir', 'light-controlled', 'color-recognizing', 'photosensitive'];
  if (advancedKeywords.some(k => name.includes(k))) {
    return 'advanced';
  }

  // Intermediate indicators: robot, walking, biped, spider
  const intermediateKeywords = ['robot', 'biped', 'spider', 'dragon', 'walking', 'swimming', 'fleeing'];
  if (intermediateKeywords.some(k => name.includes(k))) {
    return 'intermediate';
  }

  // Based on step count
  if (stepCount > 12) return 'intermediate';
  if (stepCount > 16) return 'advanced';

  return 'beginner';
}

// Generate a brief description based on the build name
function generateDescription(name) {
  const nameLower = name.toLowerCase();

  const descriptions = {
    'mobile shooter': 'A wheeled vehicle that launches projectiles using a catapult mechanism',
    'pretty car': 'A decorative car build with colorful design elements',
    'clip robot': 'A robot with gripping mechanism for picking up objects',
    'proficient carrier': 'A transport vehicle designed to carry loads',
    'skip car': 'A hopping vehicle with unique movement mechanics',
    'freestyle': 'An open-ended creative build with multiple configurations',
    'spider': 'A walking robot with 4 legs that moves like a spider',
    'lifting platform': 'A platform with raising and lowering mechanism',
    'biped robot': 'A two-legged walking robot',
    'changing face': 'An interactive display that changes expressions',
    'carousel': 'A rotating platform like a merry-go-round',
    'oscillating fan': 'A fan that swings back and forth',
    'airplane': 'An aircraft build with propeller mechanism',
    'unicycle': 'A single-wheeled balancing vehicle',
    'auto-door': 'An automatic door that opens and closes',
    'dragon knight': 'A fantasy-themed robot with dragon motif',
    'ultrasonic handheld rangefinder': 'A distance measuring device using ultrasonic sensor',
    'small flying car obstacle avoidance': 'A smart car that detects and avoids obstacles using ultrasonic sensor',
    'adjustable rgb light': 'A color-changing LED light with adjustable settings',
    'adjustable fan': 'A fan with variable speed control',
    'photosensitive emergency light': 'A light that activates based on ambient brightness',
    'smart alarm clock': 'An alarm clock with programmable features',
    'light-controlled bipedal robot': 'A walking robot that responds to light levels',
    'swimming robot avoid objects': 'A robot that navigates around obstacles in water-like motion',
    'fleeing spider': 'A spider robot that moves away when detected',
    'temperature humidity reminder': 'A device that monitors and displays temperature and humidity',
    'temperature-controlled fan': 'A fan that adjusts speed based on temperature',
    'color recognition machine': 'A device that identifies different colors',
    'color-recognizing automatic door': 'A door that opens based on color detection',
    'rocker color changing light': 'A light controlled by joystick input',
    'rocker transporter': 'A vehicle controlled by joystick input'
  };

  for (const [key, desc] of Object.entries(descriptions)) {
    if (nameLower.includes(key.toLowerCase())) {
      return desc;
    }
  }

  return `A Building:bit project featuring ${name}`;
}

// Parse a single build metadata file
async function parseBuild(buildFile) {
  const data = JSON.parse(await fs.readFile(buildFile, 'utf-8'));

  if (data.error) {
    console.log(`  Skipping ${data.id}: ${data.error}`);
    return null;
  }

  const images = data.images || [];
  const downloadedImages = data.downloadedImages || [];

  // Create assembly steps from images
  // First image is typically the parts list
  const assemblySteps = images.map((img, idx) => ({
    stepNumber: idx,
    type: idx === 0 ? 'parts' : 'step',
    imageUrl: img.src,
    partsNeeded: idx === 1, // Second step usually shows parts being used
    localImage: `/images/builds/${data.id}-step-${idx}.webp`,
    localPreview: `/images/builds/${data.id}-step-${idx}-preview.webp`
  }));

  // Final image is the completed build
  const finalImageUrl = images.length > 0 ? images[images.length - 1].src : null;

  // All images except the first (parts) are progress images
  const allImages = images.slice(1).map(img => img.src);

  return {
    id: data.id,
    name: data.name,
    nameChinese: '',
    difficulty: determineDifficulty(data),
    description: generateDescription(data.name),
    finalImageUrl,
    allImages,
    assemblySteps,
    assemblyUrl: 'https://www.yahboom.net/study/buildingbit-super-kit',
    codingCourses: {}, // Will be populated later when coding courses are scraped
    sensors: [], // Will be populated based on build type
    wiringImageUrl: null,
    localImages: {
      thumbnail: `/images/builds/${data.id}-thumb.webp`,
      medium: `/images/builds/${data.id}-medium.webp`,
      full: `/images/builds/${data.id}-full.webp`
    },
    // Keep reference to raw data for later processing
    _rawImageCount: images.length,
    _scrapedAt: data.scrapedAt
  };
}

// Get sensors based on build name
function inferSensors(build) {
  const nameLower = build.name.toLowerCase();
  const sensors = [];

  if (nameLower.includes('ultrasonic') || nameLower.includes('rangefinder') || nameLower.includes('obstacle avoidance')) {
    sensors.push('ultrasonic');
  }
  if (nameLower.includes('pir') || nameLower.includes('fleeing')) {
    sensors.push('PIR');
  }
  if (nameLower.includes('light-controlled') || nameLower.includes('photosensitive')) {
    sensors.push('light');
  }
  if (nameLower.includes('temperature')) {
    sensors.push('temperature');
  }
  if (nameLower.includes('humidity')) {
    sensors.push('humidity');
  }
  if (nameLower.includes('color-recogni') || nameLower.includes('color recogni')) {
    sensors.push('color');
  }
  if (nameLower.includes('rocker')) {
    sensors.push('joystick');
  }

  return sensors;
}

// Sort builds by ID (1.1, 1.2, ..., 1.10, 1.11, ...)
function sortBuildsById(builds) {
  return builds.sort((a, b) => {
    const [, numA] = a.id.split('.');
    const [, numB] = b.id.split('.');
    return parseInt(numA) - parseInt(numB);
  });
}

async function parseAllBuilds() {
  console.log('=== Parsing scraped builds ===\n');

  // Find all build metadata files (exclude batch files and build-links)
  const files = await fs.readdir(RAW_HTML_DIR);
  const buildFiles = files
    .filter(f => f.match(/^\d+-\d+\.json$/))
    .map(f => path.join(RAW_HTML_DIR, f));

  console.log(`Found ${buildFiles.length} build files\n`);

  const builds = [];

  for (const file of buildFiles) {
    const filename = path.basename(file);
    console.log(`Parsing ${filename}...`);

    const build = await parseBuild(file);
    if (build) {
      build.sensors = inferSensors(build);
      builds.push(build);
      console.log(`  ✓ ${build.id} ${build.name} (${build.difficulty}, ${build.assemblySteps.length} steps)`);
    }
  }

  // Sort by ID
  const sortedBuilds = sortBuildsById(builds);

  // Create output structure
  const output = {
    builds: sortedBuilds.map(b => {
      // Remove internal metadata before output
      const { _rawImageCount, _scrapedAt, ...cleanBuild } = b;
      return cleanBuild;
    })
  };

  // Ensure output directory exists
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

  // Write output
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n=== Parse complete ===`);
  console.log(`Total builds: ${sortedBuilds.length}`);
  console.log(`Output: ${OUTPUT_FILE}`);

  // Summary by difficulty
  const byDifficulty = {
    beginner: sortedBuilds.filter(b => b.difficulty === 'beginner').length,
    intermediate: sortedBuilds.filter(b => b.difficulty === 'intermediate').length,
    advanced: sortedBuilds.filter(b => b.difficulty === 'advanced').length
  };
  console.log(`\nBy difficulty:`);
  console.log(`  Beginner: ${byDifficulty.beginner}`);
  console.log(`  Intermediate: ${byDifficulty.intermediate}`);
  console.log(`  Advanced: ${byDifficulty.advanced}`);
}

parseAllBuilds().catch(console.error);
