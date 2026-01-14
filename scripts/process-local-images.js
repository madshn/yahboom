import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { execSync, exec } from 'child_process';

const BUILDS_JSON = path.join(process.cwd(), 'public', 'data', 'builds.json');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'builds');
const RAW_IMAGES_DIR = path.join(process.cwd(), 'raw', 'images-original');
const PYTHON_SCRIPT = path.join(process.cwd(), 'scripts', 'extract-frame.py');

// Check if Python/OpenCV is available
let PYTHON_PATH = null;
function findPython() {
  const paths = [
    path.join(process.cwd(), '.venv', 'bin', 'python'),
    'python3',
    'python'
  ];

  for (const p of paths) {
    try {
      execSync(`${p} -c "import cv2; import numpy"`, { stdio: 'ignore' });
      return p;
    } catch (e) {
      // Try next
    }
  }
  return null;
}

// Get local image path for a build and step index
function getLocalImagePath(buildId, imageIndex) {
  const ext = '.jpg';
  const filename = `${buildId}-img-${imageIndex.toString().padStart(3, '0')}${ext}`;
  return path.join(RAW_IMAGES_DIR, buildId, filename);
}

// Use OpenCV Python script to extract the last frame from multi-panel image
async function extractFrame(inputPath) {
  const tempOutput = `/tmp/frame_output_${Date.now()}.jpg`;

  try {
    // Run Python frame extractor
    const result = execSync(`${PYTHON_PATH} ${PYTHON_SCRIPT} "${inputPath}" "${tempOutput}"`, {
      encoding: 'utf-8',
      timeout: 30000
    }).trim();

    // Read extracted frame
    const extractedBuffer = await fs.readFile(tempOutput);

    // Cleanup temp file
    await fs.unlink(tempOutput).catch(() => {});

    return { buffer: extractedBuffer, dimensions: result };
  } catch (err) {
    // Cleanup on error
    await fs.unlink(tempOutput).catch(() => {});
    throw err;
  }
}

// Process gallery thumbnail using OpenCV frame extraction
async function processGalleryImage(build) {
  const buildId = build.id;

  // Find the last assembly step - this shows the completed build
  const lastStep = build.assemblySteps?.slice().reverse().find(s => s.type === 'step');

  if (!lastStep) {
    console.log(`  No final step image for ${buildId}`);
    return null;
  }

  // Get local image path
  const localPath = getLocalImagePath(buildId, lastStep.stepNumber);

  try {
    await fs.access(localPath);
  } catch {
    console.log(`  Local image not found: ${localPath}`);
    return null;
  }

  try {
    let buffer;

    if (PYTHON_PATH) {
      console.log(`  Extracting frame for ${buildId}...`);
      const { buffer: extractedBuffer, dimensions } = await extractFrame(localPath);
      buffer = extractedBuffer;
      console.log(`  Extracted ${dimensions}`);
    } else {
      // Fallback: just use the raw image
      console.log(`  Using raw image for ${buildId} (no OpenCV)`);
      buffer = await fs.readFile(localPath);
    }

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

// Process a single assembly step image from local file
async function processStepImage(buildId, stepNumber) {
  const localPath = getLocalImagePath(buildId, stepNumber);

  try {
    await fs.access(localPath);
  } catch {
    return null;
  }

  try {
    const imageBuffer = await fs.readFile(localPath);

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
    const localPaths = await processStepImage(build.id, step.stepNumber);

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

async function processAllImages() {
  console.log('Processing images from local files...\n');

  // Check for Python/OpenCV
  PYTHON_PATH = findPython();
  if (PYTHON_PATH) {
    console.log(`Using Python: ${PYTHON_PATH}\n`);
  } else {
    console.log('OpenCV not available - using fallback image processing\n');
  }

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Load builds data
  const buildsData = JSON.parse(await fs.readFile(BUILDS_JSON, 'utf-8'));

  let successCount = 0;
  let failCount = 0;

  // Process each build
  for (const build of buildsData.builds) {
    console.log(`\nProcessing ${build.id} ${build.name}...`);

    // Process gallery images from last assembly step
    const localImages = await processGalleryImage(build);
    if (localImages) {
      build.localImages = localImages;
      successCount++;
    } else {
      failCount++;
    }

    // Process all assembly step images for the step viewer
    await processAssemblySteps(build);
  }

  // Save updated builds data
  await fs.writeFile(BUILDS_JSON, JSON.stringify(buildsData, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log(`\n✓ Image processing complete!`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log('\n✓ Updated builds.json with local image paths');
}

processAllImages().catch(console.error);
