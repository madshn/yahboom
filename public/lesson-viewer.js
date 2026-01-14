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

  lessonList.innerHTML = lessons.map((lesson, index) => {
    // Support both old format (string) and new format (object with title)
    const lessonTitle = typeof lesson === 'string' ? lesson : lesson.title;
    return `
      <li class="lesson-item ${index === 0 ? 'active' : ''}"
          onclick="selectLesson(${index})"
          data-index="${index}">
        <span class="lesson-number">${index + 1}</span>
        <span class="lesson-name">${lessonTitle}</span>
      </li>
    `;
  }).join('');

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
  const type = currentLesson.type;
  const section = currentLesson.courseData.section;
  const extensionUrl = currentLesson.courseData.extensionUrl || 'https://github.com/YahboomTechnology/SuperBitLibV2';

  // Support both old format (string) and new format (object with full content)
  const isDetailedLesson = typeof lesson === 'object';
  const lessonTitle = isDetailedLesson ? lesson.title : lesson;

  let html = `
    <div class="lesson-header-content">
      <h2>${lessonTitle}</h2>
      <p class="lesson-section">Section ${section} - Lesson ${index + 1}</p>
    </div>
  `;

  if (type === 'makecode') {
    if (isDetailedLesson) {
      // Render detailed MakeCode lesson content
      html += renderDetailedMakeCodeLesson(lesson, extensionUrl);
    } else {
      // Fallback to placeholder for lessons without detailed content
      html += renderPlaceholderMakeCode(extensionUrl);
    }
  } else if (type === 'python') {
    if (isDetailedLesson) {
      // Render detailed Python lesson content
      html += renderDetailedPythonLesson(lesson);
    } else {
      // Fallback to placeholder
      html += renderPlaceholderPython();
    }
  }

  // Add link to original lesson
  html += `
    <div class="lesson-section-block original-link">
      <h3>📚 Resources</h3>
      <p>View the complete original lesson and download hex files:</p>
      <a href="${currentLesson.build.assemblyUrl}" target="_blank" class="lesson-link-btn secondary">
        <span>🔗</span> View on Yahboom
      </a>
      <a href="https://makecode.microbit.org/" target="_blank" class="lesson-link-btn">
        <span>🚀</span> Open MakeCode Editor
      </a>
    </div>
  `;

  content.innerHTML = html;
}

// Render detailed MakeCode lesson
function renderDetailedMakeCodeLesson(lesson, extensionUrl) {
  let html = '';

  // Learning objective
  if (lesson.objective) {
    html += `
      <div class="lesson-section-block objective">
        <h3>🎯 Learning Objective</h3>
        <p>${lesson.objective}</p>
      </div>
    `;
  }

  // Motor wiring
  if (lesson.motorWiring) {
    html += `
      <div class="lesson-section-block wiring">
        <h3>🔌 Motor Wiring</h3>
        <p>${lesson.motorWiring.description || 'Connect the motors to the expansion board:'}</p>
        <div class="wiring-info">
          <div class="wiring-item">
            <span class="wiring-label">Left Motor:</span>
            <span class="wiring-value">${lesson.motorWiring.left}</span>
          </div>
          <div class="wiring-item">
            <span class="wiring-label">Right Motor:</span>
            <span class="wiring-value">${lesson.motorWiring.right}</span>
          </div>
          ${lesson.motorWiring.camera ? `
          <div class="wiring-item">
            <span class="wiring-label">Camera:</span>
            <span class="wiring-value">${lesson.motorWiring.camera}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Extension package
  html += `
    <div class="lesson-section-block extension">
      <h3>📦 Extension Package</h3>
      <p>Add the Yahboom SuperBit extension to MakeCode:</p>
      <div class="copy-block">
        <code id="extensionUrl">${extensionUrl}</code>
        <button class="copy-btn" onclick="copyToClipboard('extensionUrl')">
          <span class="copy-icon">📋</span> Copy
        </button>
      </div>
    </div>
  `;

  // Blocks used
  if (lesson.blocksUsed && lesson.blocksUsed.length > 0) {
    html += `
      <div class="lesson-section-block blocks">
        <h3>🧱 Blocks Used</h3>
        <div class="blocks-grid">
          ${lesson.blocksUsed.map(cat => `
            <div class="block-category">
              <span class="category-name">${cat.category}</span>
              <div class="category-blocks">
                ${cat.blocks.map(b => `<span class="block-item">${b}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Code / Combined blocks
  if (lesson.code) {
    html += `
      <div class="lesson-section-block code">
        <h3>💻 Combined Blocks</h3>
        ${lesson.code.description ? `<p>${lesson.code.description}</p>` : ''}
        <div class="code-structure">
          ${lesson.code.onStart ? `
            <div class="code-block on-start">
              <span class="code-label">on start</span>
              <span class="code-content">${lesson.code.onStart}</span>
            </div>
          ` : ''}
          ${lesson.code.forever ? `
            <div class="code-block forever">
              <span class="code-label">forever</span>
              <div class="code-content">
                ${Array.isArray(lesson.code.forever)
                  ? lesson.code.forever.map(line => `<div class="code-line">${line}</div>`).join('')
                  : lesson.code.forever}
              </div>
            </div>
          ` : ''}
          ${lesson.code.controller ? `
            <div class="code-block controller">
              <span class="code-label">Controller micro:bit</span>
              <span class="code-content">${lesson.code.controller}</span>
            </div>
          ` : ''}
          ${lesson.code.spider ? `
            <div class="code-block spider">
              <span class="code-label">Spider micro:bit</span>
              <span class="code-content">${lesson.code.spider}</span>
            </div>
          ` : ''}
          ${lesson.code.onCommand ? `
            <div class="code-block on-command">
              <span class="code-label">on command received</span>
              <span class="code-content">${lesson.code.onCommand}</span>
            </div>
          ` : ''}
          ${lesson.code.onData ? `
            <div class="code-block on-data">
              <span class="code-label">on data received</span>
              <span class="code-content">${lesson.code.onData}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Hex file
  if (lesson.hexFile) {
    html += `
      <div class="lesson-section-block hex-file">
        <h3>📁 Program File</h3>
        <p>Download <strong>${lesson.hexFile}</strong> from the Yahboom resources and drag it to your micro:bit.</p>
      </div>
    `;
  }

  // Experimental phenomenon
  if (lesson.phenomenon) {
    html += `
      <div class="lesson-section-block phenomenon">
        <h3>✨ What Happens</h3>
        <p>${lesson.phenomenon}</p>
      </div>
    `;
  }

  return html;
}

// Render detailed Python lesson
function renderDetailedPythonLesson(lesson) {
  let html = '';

  // Learning objective
  if (lesson.objective) {
    html += `
      <div class="lesson-section-block objective">
        <h3>🎯 Learning Objective</h3>
        <p>${lesson.objective}</p>
      </div>
    `;
  }

  // Python code
  if (lesson.code) {
    html += `
      <div class="lesson-section-block python-code">
        <h3>🐍 Python Code</h3>
        <pre class="code-block python"><code>${escapeHtml(lesson.code)}</code></pre>
        <button class="copy-btn" onclick="copyCode(this)">
          <span class="copy-icon">📋</span> Copy Code
        </button>
      </div>
    `;
  }

  // Setup info
  html += `
    <div class="lesson-section-block setup">
      <h3>⚙️ Setup</h3>
      <p>Use the Mu editor or Thonny for micro:bit Python development.</p>
      <a href="https://python.microbit.org/" target="_blank" class="lesson-link-btn">
        <span>🐍</span> Open Python Editor
      </a>
    </div>
  `;

  return html;
}

// Fallback placeholder for MakeCode
function renderPlaceholderMakeCode(extensionUrl) {
  return `
    <div class="lesson-section-block">
      <h3>📦 Extension Package</h3>
      <p>Add the Yahboom SuperBit extension to MakeCode:</p>
      <div class="copy-block">
        <code id="extensionUrl">${extensionUrl}</code>
        <button class="copy-btn" onclick="copyToClipboard('extensionUrl')">
          <span class="copy-icon">📋</span> Copy
        </button>
      </div>
    </div>
    <div class="lesson-section-block">
      <h3>💻 Code Blocks</h3>
      <p>View the original lesson on Yahboom for detailed block instructions.</p>
    </div>
  `;
}

// Fallback placeholder for Python
function renderPlaceholderPython() {
  return `
    <div class="lesson-section-block">
      <h3>🐍 Python Setup</h3>
      <p>Use the Mu editor or Thonny for micro:bit Python development.</p>
    </div>
    <div class="lesson-section-block">
      <h3>💻 Code</h3>
      <p>View the original lesson on Yahboom for the Python code.</p>
    </div>
  `;
}

// Helper to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy code from pre block
function copyCode(btn) {
  const pre = btn.previousElementSibling;
  const code = pre.querySelector('code').textContent;

  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="copy-icon">✓</span> Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('copied');
    }, 2000);
  });
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
