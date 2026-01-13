// Coding Lesson Viewer - MakeCode and Python tutorials

let currentLesson = null;
let currentLessonType = null; // 'makecode' or 'python'

// Initialize lesson viewer
function initLessonViewer() {
  if (!document.getElementById('lessonViewer')) {
    const viewerHtml = `
      <div class="lesson-viewer" id="lessonViewer">
        <div class="lesson-header">
          <button class="lesson-close-btn" onclick="closeLessonViewer()">&times;</button>
          <div class="lesson-title">
            <span id="lessonBuildName"></span>
            <span class="lesson-type-badge" id="lessonTypeBadge">MakeCode</span>
          </div>
        </div>

        <div class="lesson-sidebar">
          <h3>Lessons</h3>
          <ul class="lesson-list" id="lessonList">
            <!-- Lesson list generated here -->
          </ul>
        </div>

        <div class="lesson-main">
          <div class="lesson-content" id="lessonContent">
            <!-- Lesson content loaded here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', viewerHtml);
  }
}

// Open lesson viewer for a build and type
function openLessonViewer(buildId, type) {
  const build = builds.find(b => b.id === buildId);
  if (!build) return;

  currentLessonType = type;

  const courseData = type === 'makecode'
    ? build.codingCourses?.makecode
    : build.codingCourses?.python;

  if (!courseData) {
    alert(`No ${type} lessons available for this build.`);
    return;
  }

  // Set header
  document.getElementById('lessonBuildName').textContent = `${build.id} ${build.name}`;
  document.getElementById('lessonTypeBadge').textContent = type === 'makecode' ? 'MakeCode' : 'Python';
  document.getElementById('lessonTypeBadge').className = `lesson-type-badge ${type}`;

  // Generate lesson list
  const lessonList = document.getElementById('lessonList');
  const lessons = courseData.lessons || [];

  lessonList.innerHTML = lessons.map((lesson, index) => `
    <li class="lesson-item ${index === 0 ? 'active' : ''}"
        onclick="selectLesson(${index})"
        data-index="${index}">
      <span class="lesson-number">${index + 1}</span>
      <span class="lesson-name">${lesson}</span>
    </li>
  `).join('');

  // Store lesson data
  currentLesson = {
    build,
    type,
    courseData,
    lessons,
    selectedIndex: 0
  };

  // Show first lesson content
  showLessonContent(0);

  // Show viewer
  document.getElementById('lessonViewer').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Select a lesson from the list
function selectLesson(index) {
  if (!currentLesson) return;

  currentLesson.selectedIndex = index;

  // Update active state
  document.querySelectorAll('.lesson-item').forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });

  showLessonContent(index);
}

// Show lesson content
function showLessonContent(index) {
  if (!currentLesson) return;

  const lesson = currentLesson.lessons[index];
  const content = document.getElementById('lessonContent');

  // For now, show placeholder content with links
  // In the full implementation, this would load scraped lesson content
  const type = currentLesson.type;
  const section = currentLesson.courseData.section;

  let html = `
    <div class="lesson-header-content">
      <h2>${lesson}</h2>
      <p class="lesson-section">Section ${section} - Lesson ${index + 1}</p>
    </div>
  `;

  if (type === 'makecode') {
    html += `
      <div class="lesson-section-block">
        <h3>1. Extension Package</h3>
        <p>Add the Yahboom SuperBit extension to MakeCode:</p>
        <div class="copy-block">
          <code id="extensionUrl">https://github.com/YahboomTechnology/SuperBitLibV2</code>
          <button class="copy-btn" onclick="copyToClipboard('extensionUrl')">
            <span class="copy-icon">📋</span> Copy
          </button>
        </div>
      </div>

      <div class="lesson-section-block">
        <h3>2. Code Blocks</h3>
        <p>The MakeCode blocks for this lesson:</p>
        <div class="code-image-placeholder">
          <div class="placeholder-icon">📦</div>
          <p>MakeCode block images will be loaded here</p>
          <p class="placeholder-hint">View the original lesson for block screenshots</p>
        </div>
      </div>

      <div class="lesson-section-block">
        <h3>3. Open in MakeCode</h3>
        <p>Click below to open MakeCode editor:</p>
        <a href="https://makecode.microbit.org/" target="_blank" class="lesson-link-btn">
          <span>🚀</span> Open MakeCode Editor
        </a>
      </div>
    `;
  } else if (type === 'python') {
    html += `
      <div class="lesson-section-block">
        <h3>1. Setup</h3>
        <p>Make sure you have the Mu editor or Thonny installed for micro:bit Python development.</p>
      </div>

      <div class="lesson-section-block">
        <h3>2. Python Code</h3>
        <p>The Python code for this lesson:</p>
        <div class="code-image-placeholder">
          <div class="placeholder-icon">🐍</div>
          <p>Python code will be loaded here</p>
          <p class="placeholder-hint">View the original lesson for code snippets</p>
        </div>
      </div>

      <div class="lesson-section-block">
        <h3>3. Resources</h3>
        <a href="https://python.microbit.org/" target="_blank" class="lesson-link-btn">
          <span>🐍</span> Open Python Editor
        </a>
      </div>
    `;
  }

  // Add link to original lesson
  html += `
    <div class="lesson-section-block original-link">
      <h3>Original Lesson</h3>
      <p>View the complete original lesson on Yahboom:</p>
      <a href="${currentLesson.build.assemblyUrl}" target="_blank" class="lesson-link-btn secondary">
        <span>🔗</span> View on Yahboom
      </a>
    </div>
  `;

  content.innerHTML = html;
}

// Copy text to clipboard
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.textContent || element.value;

  navigator.clipboard.writeText(text).then(() => {
    // Show feedback
    const btn = element.nextElementSibling;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="copy-icon">✓</span> Copied!';
    btn.classList.add('copied');

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
}

// Close lesson viewer
function closeLessonViewer() {
  document.getElementById('lessonViewer').classList.remove('active');
  document.body.style.overflow = '';
  currentLesson = null;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initLessonViewer);
