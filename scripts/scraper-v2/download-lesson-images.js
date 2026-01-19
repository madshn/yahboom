/**
 * Download Lesson Images
 * Downloads images for specified builds and updates builds.json with local paths
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const IMAGE_DIR = 'public/images/lessons';
const DELAY_MS = 500;

/**
 * Download image to local path
 */
async function downloadImage(url, localPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(localPath);

    const request = protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(localPath);
        downloadImage(res.headers.location, localPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(localPath);
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      reject(err);
    });

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
 * Get base URL from source URL (remove filename)
 */
function getBaseUrl(sourceUrl) {
  const parts = sourceUrl.split('/');
  parts.pop(); // Remove filename
  return parts.join('/');
}

/**
 * Download images for a single lesson
 */
async function downloadLessonImages(lesson, buildId, lessonType, lessonIndex) {
  if (!lesson.sourceUrl || !lesson.images || lesson.images.length === 0) {
    return lesson;
  }

  const baseUrl = getBaseUrl(lesson.sourceUrl);
  const imageDir = path.join(IMAGE_DIR, buildId, lessonType, String(lessonIndex + 1));
  const downloadedImages = [];

  console.log(`  Lesson ${lessonIndex + 1}: ${lesson.title}`);

  for (const img of lesson.images) {
    const imgUrl = img.url.startsWith('http') ? img.url : `${baseUrl}/${img.url}`;
    const ext = path.extname(img.url) || '.png';
    const filename = `${img.type || 'content'}-${downloadedImages.length}${ext}`;
    const localPath = path.join(imageDir, filename);

    // Skip if already downloaded
    if (fs.existsSync(localPath)) {
      downloadedImages.push({
        ...img,
        originalUrl: imgUrl,
        localPath: '/' + localPath.replace(/\\/g, '/').replace(/^public\//, '')
      });
      console.log(`    ✓ Already exists: ${filename}`);
      continue;
    }

    try {
      await downloadImage(imgUrl, localPath);
      downloadedImages.push({
        ...img,
        originalUrl: imgUrl,
        localPath: '/' + localPath.replace(/\\/g, '/').replace(/^public\//, '')
      });
      console.log(`    ✓ Downloaded: ${filename}`);
    } catch (err) {
      console.log(`    ✗ Failed: ${img.url} - ${err.message}`);
      downloadedImages.push({
        ...img,
        originalUrl: imgUrl,
        error: err.message
      });
    }

    await sleep(DELAY_MS);
  }

  return {
    ...lesson,
    images: downloadedImages
  };
}

/**
 * Download images for all lessons of a build
 */
async function downloadBuildImages(build) {
  console.log(`\n📦 Build ${build.id}: ${build.name}`);

  // Process MakeCode lessons
  if (build.codingCourses?.makecode?.lessons) {
    console.log(`\n  MakeCode lessons:`);
    const updatedLessons = [];
    for (let i = 0; i < build.codingCourses.makecode.lessons.length; i++) {
      const lesson = build.codingCourses.makecode.lessons[i];
      const updated = await downloadLessonImages(lesson, build.id, 'makecode', i);
      updatedLessons.push(updated);
    }
    build.codingCourses.makecode.lessons = updatedLessons;
  }

  // Process Python lessons
  if (build.codingCourses?.python?.lessons) {
    console.log(`\n  Python lessons:`);
    const updatedLessons = [];
    for (let i = 0; i < build.codingCourses.python.lessons.length; i++) {
      const lesson = build.codingCourses.python.lessons[i];
      const updated = await downloadLessonImages(lesson, build.id, 'python', i);
      updatedLessons.push(updated);
    }
    build.codingCourses.python.lessons = updatedLessons;
  }

  return build;
}

// Main execution
async function main() {
  const targetBuilds = process.argv.slice(2);
  if (targetBuilds.length === 0) {
    console.log('Usage: node download-lesson-images.js 1.1 1.2 1.3');
    process.exit(1);
  }

  console.log(`\n🖼️  Downloading images for builds: ${targetBuilds.join(', ')}`);

  // Load current builds data
  const buildsPath = 'public/data/builds.json';
  const buildsData = JSON.parse(fs.readFileSync(buildsPath, 'utf-8'));

  let totalImages = 0;
  let downloadedCount = 0;

  for (const buildId of targetBuilds) {
    const buildIndex = buildsData.builds.findIndex(b => b.id === buildId);
    if (buildIndex === -1) {
      console.log(`Build ${buildId} not found!`);
      continue;
    }

    const build = buildsData.builds[buildIndex];
    const updatedBuild = await downloadBuildImages(build);
    buildsData.builds[buildIndex] = updatedBuild;

    // Count images
    const countImages = (lessons) => {
      if (!lessons) return { total: 0, downloaded: 0 };
      let total = 0, downloaded = 0;
      lessons.forEach(l => {
        if (l.images) {
          total += l.images.length;
          downloaded += l.images.filter(i => i.localPath && !i.error).length;
        }
      });
      return { total, downloaded };
    };

    const mc = countImages(updatedBuild.codingCourses?.makecode?.lessons);
    const py = countImages(updatedBuild.codingCourses?.python?.lessons);
    totalImages += mc.total + py.total;
    downloadedCount += mc.downloaded + py.downloaded;
  }

  // Save updated builds
  fs.writeFileSync(buildsPath, JSON.stringify(buildsData, null, 2));

  console.log(`\n✅ Complete!`);
  console.log(`   Images: ${downloadedCount}/${totalImages} downloaded`);
  console.log(`   Updated: ${buildsPath}`);
}

main().catch(console.error);
