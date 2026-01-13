import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';

const BUILDS_JSON = path.join(process.cwd(), 'public', 'data', 'builds.json');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'builds');
const PYTHON_SCRIPT = path.join(process.cwd(), 'scripts', 'extract-frame.py');
const VENV_PYTHON = path.join(process.cwd(), '.venv', 'bin', 'python');

// Download image from URL with retry logic
async function downloadImage(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const buffer = await downloadImageOnce(url);
      return buffer;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

function downloadImageOnce(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { timeout: 30000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImageOnce(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Use OpenCV Python script to extract the last frame from multi-panel image
async function extractFrame(imageUrl, outputPath) {
  const tempInput = `/tmp/frame_input_${Date.now()}.jpg`;
  const tempOutput = `/tmp/frame_output_${Date.now()}.jpg`;

  try {
    // Download image
    const buffer = await downloadImage(imageUrl);
    await fs.writeFile(tempInput, buffer);

    // Run Python frame extractor
    const result = execSync(`${VENV_PYTHON} ${PYTHON_SCRIPT} ${tempInput} ${tempOutput}`, {
      encoding: 'utf-8',
      timeout: 30000
    }).trim();

    // Read extracted frame
    const extractedBuffer = await fs.readFile(tempOutput);

    // Cleanup temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});

    return { buffer: extractedBuffer, dimensions: result };
  } catch (err) {
    // Cleanup on error
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    throw err;
  }
}

// Process gallery thumbnail using OpenCV frame extraction
async function processGalleryImage(build) {
  const buildId = build.id;

  // Find the last assembly step - this shows the completed build
  const lastStep = build.assemblySteps?.slice().reverse().find(s => s.type === 'step');

  if (!lastStep?.imageUrl) {
    console.log(`  No final step image for ${buildId}`);
    return null;
  }

  try {
    console.log(`  Extracting frame for ${buildId}...`);
    const { buffer, dimensions } = await extractFrame(lastStep.imageUrl, null);
    console.log(`  Extracted ${dimensions}`);

    // Create thumbnail (300px wide) - preserve transparency
    const thumbnailPath = path.join(OUTPUT_DIR, `${buildId}-thumb.webp`);
    await sharp(buffer)
      .resize(300, null, { fit: 'inside' })
      .webp({ quality: 80, alphaQuality: 100 })
      .toFile(thumbnailPath);

    // Create medium size (600px wide)
    const mediumPath = path.join(OUTPUT_DIR, `${buildId}-medium.webp`);
    await sharp(buffer)
      .resize(600, null, { fit: 'inside' })
      .webp({ quality: 85, alphaQuality: 100 })
      .toFile(mediumPath);

    // Create full size (max 1200px)
    const fullPath = path.join(OUTPUT_DIR, `${buildId}-full.webp`);
    await sharp(buffer)
      .resize(1200, null, { fit: 'inside' })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(fullPath);

    console.log(`  ✓ Gallery images for ${buildId}`);

    return {
      thumbnail: `/images/builds/${buildId}-thumb.webp`,
      medium: `/images/builds/${buildId}-medium.webp`,
      full: `/images/builds/${buildId}-full.webp`
    };

  } catch (err) {
    console.log(`  ✗ Failed ${buildId}: ${err.message}`);
    return null;
  }
}

// Process a single assembly step image (with auto-trim)
async function processStepImage(imageUrl, buildId, stepNumber) {
  if (!imageUrl) return null;

  try {
    const imageBuffer = await downloadImage(imageUrl);

    // Auto-trim borders
    const trimmedBuffer = await sharp(imageBuffer)
      .trim({ threshold: 10 })
      .toBuffer();

    // For step viewer: create medium size (1200px wide for good detail)
    const stepPath = path.join(OUTPUT_DIR, `${buildId}-step-${stepNumber}.webp`);
    await sharp(trimmedBuffer)
      .resize(1200, null, { fit: 'inside' })
      .webp({ quality: 85 })
      .toFile(stepPath);

    // Also create a smaller preview for preloading (400px)
    const previewPath = path.join(OUTPUT_DIR, `${buildId}-step-${stepNumber}-preview.webp`);
    await sharp(trimmedBuffer)
      .resize(400, null, { fit: 'inside' })
      .webp({ quality: 70 })
      .toFile(previewPath);

    return {
      image: `/images/builds/${buildId}-step-${stepNumber}.webp`,
      preview: `/images/builds/${buildId}-step-${stepNumber}-preview.webp`
    };
  } catch (err) {
    console.log(`    ✗ Failed step ${stepNumber}: ${err.message}`);
    return null;
  }
}

// Process all assembly steps for a build
async function processAssemblySteps(build) {
  if (!build.assemblySteps || build.assemblySteps.length === 0) {
    console.log(`  No assembly steps for ${build.id}`);
    return;
  }

  console.log(`  Processing ${build.assemblySteps.length} assembly steps...`);

  for (let i = 0; i < build.assemblySteps.length; i++) {
    const step = build.assemblySteps[i];
    const localPaths = await processStepImage(step.imageUrl, build.id, step.stepNumber);

    if (localPaths) {
      step.localImage = localPaths.image;
      step.localPreview = localPaths.preview;
    }

    // Progress indicator
    if ((i + 1) % 3 === 0 || i === build.assemblySteps.length - 1) {
      process.stdout.write(`    ✓ ${i + 1}/${build.assemblySteps.length} steps\r`);
    }
  }

  console.log(`  ✓ Processed ${build.assemblySteps.length} assembly steps`);
}

// Process wiring diagram image
async function processWiringImage(wiringUrl, buildId) {
  if (!wiringUrl) {
    console.log(`  No wiring image for ${buildId}`);
    return null;
  }

  try {
    console.log(`  Downloading wiring diagram for ${buildId}...`);
    const imageBuffer = await downloadImage(wiringUrl);

    // Create wiring image (600px wide max)
    const wiringPath = path.join(OUTPUT_DIR, `${buildId}-wiring.webp`);
    await sharp(imageBuffer)
      .resize(600, null, { fit: 'inside' })
      .webp({ quality: 85 })
      .toFile(wiringPath);

    console.log(`  ✓ Processed wiring for ${buildId}`);

    return `/images/builds/${buildId}-wiring.webp`;

  } catch (err) {
    console.log(`  ✗ Failed wiring ${buildId}: ${err.message}`);
    return null;
  }
}

async function processAllImages() {
  console.log('Processing images with OpenCV frame extraction...\n');

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Load builds data
  const buildsData = JSON.parse(await fs.readFile(BUILDS_JSON, 'utf-8'));

  // Process each build
  for (const build of buildsData.builds) {
    console.log(`\nProcessing ${build.id} ${build.name}...`);

    // Process gallery images from last assembly step using OpenCV
    const localImages = await processGalleryImage(build);
    if (localImages) {
      build.localImages = localImages;
    }

    // Process all assembly step images for the step viewer
    await processAssemblySteps(build);

    // Process wiring diagram if available
    const wiringImage = await processWiringImage(build.wiringImageUrl, build.id);
    if (wiringImage) {
      build.localImages = build.localImages || {};
      build.localImages.wiring = wiringImage;
    }
  }

  // Save updated builds data
  await fs.writeFile(BUILDS_JSON, JSON.stringify(buildsData, null, 2));
  console.log('\n✓ Updated builds.json with local image paths');
}

processAllImages().catch(console.error);
