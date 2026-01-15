// Step-by-step assembly viewer (LEGO-app style)

let currentBuild = null;
let currentStep = 0;
let isZoomed = false;

// Initialize step viewer
function initStepViewer() {
  // Create step viewer modal if it doesn't exist
  if (!document.getElementById('stepViewer')) {
    const viewerHtml = `
      <div class="step-viewer" id="stepViewer">
        <div class="step-viewer-header">
          <button class="step-close-btn" onclick="closeStepViewer()">&times;</button>
          <div class="step-title">
            <span id="stepBuildName"></span>
          </div>
          <div class="step-progress">
            <span id="stepCounter">1 / 10</span>
          </div>
        </div>

        <div class="step-main">
          <button class="step-nav-btn step-prev" onclick="prevStep()" id="prevBtn">
            <span>‹</span>
          </button>

          <div class="step-image-container" id="stepImageContainer" onclick="toggleZoom()">
            <img id="stepImage" src="" alt="Assembly step">
            <div class="step-parts-indicator" id="partsIndicator">
              <span class="parts-icon">🧩</span>
              <span class="parts-text">Collect these parts</span>
            </div>
          </div>

          <button class="step-nav-btn step-next" onclick="nextStep()" id="nextBtn">
            <span>›</span>
          </button>
        </div>

        <div class="step-thumbnails" id="stepThumbnails">
          <!-- Thumbnails will be generated here -->
        </div>

        <div class="step-footer">
          <div class="step-type-indicator" id="stepTypeIndicator">
            Parts List
          </div>
          <div class="zoom-hint">
            Click image to zoom
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', viewerHtml);

    // Add keyboard navigation
    document.addEventListener('keydown', handleStepKeyboard);
  }
}

// Open step viewer for a build
function openStepViewer(buildId) {
  currentBuild = builds.find(b => b.id === buildId);
  if (!currentBuild || !currentBuild.assemblySteps || currentBuild.assemblySteps.length === 0) {
    alert('No assembly steps available for this build.');
    return;
  }

  currentStep = 0;
  isZoomed = false;

  // Set build name
  document.getElementById('stepBuildName').textContent = `${currentBuild.id} ${currentBuild.name}`;

  // Generate thumbnails
  generateThumbnails();

  // Show first step
  showStep(0);

  // Show viewer
  document.getElementById('stepViewer').classList.add('active');
  document.body.style.overflow = 'hidden';

  // Preload next few images
  preloadImages();
}

// Close step viewer
function closeStepViewer() {
  document.getElementById('stepViewer').classList.remove('active');
  document.body.style.overflow = '';
  isZoomed = false;
  currentBuild = null;
}

// Generate thumbnail strip
function generateThumbnails() {
  const container = document.getElementById('stepThumbnails');
  const steps = currentBuild.assemblySteps;

  container.innerHTML = steps.map((step, index) => `
    <div class="step-thumb ${index === 0 ? 'active' : ''} ${step.type === 'parts' ? 'parts-thumb' : ''}"
         onclick="goToStep(${index})"
         data-step="${index}">
      <img src="${step.localPreview || step.imageUrl}" alt="Step ${index + 1}" loading="lazy">
      ${step.type === 'parts' ? '<span class="thumb-parts-badge">🧩</span>' : ''}
    </div>
  `).join('');
}

// Show specific step
function showStep(stepIndex) {
  if (!currentBuild || stepIndex < 0 || stepIndex >= currentBuild.assemblySteps.length) {
    return;
  }

  currentStep = stepIndex;
  const step = currentBuild.assemblySteps[stepIndex];
  const totalSteps = currentBuild.assemblySteps.length;

  // Update image
  const img = document.getElementById('stepImage');
  img.src = step.localImage || step.imageUrl;
  img.alt = step.type === 'parts' ? 'Parts needed' : `Step ${stepIndex}`;

  // Update counter
  document.getElementById('stepCounter').textContent = `${stepIndex + 1} / ${totalSteps}`;

  // Update nav buttons
  document.getElementById('prevBtn').disabled = stepIndex === 0;
  document.getElementById('nextBtn').disabled = stepIndex === totalSteps - 1;

  // Update parts indicator and type label
  const partsIndicator = document.getElementById('partsIndicator');
  const typeIndicator = document.getElementById('stepTypeIndicator');
  const partsText = partsIndicator.querySelector('.parts-text');

  // Determine indicator state based on step type
  const isParts = step.type === 'parts';
  const isPartsNeeded = step.partsNeeded;
  const isLaterStep = stepIndex > 1;
  const showIndicator = isParts || isPartsNeeded || isLaterStep;
  const showFaded = !isParts && !isPartsNeeded && isLaterStep;

  partsIndicator.classList.toggle('visible', showIndicator);
  partsIndicator.classList.toggle('faded', showFaded);

  if (isParts) {
    partsText.textContent = 'Collect these parts';
    typeIndicator.textContent = 'Parts List';
    typeIndicator.className = 'step-type-indicator parts';
  } else {
    if (isPartsNeeded) {
      partsText.textContent = 'Parts needed for this step';
    } else if (isLaterStep) {
      partsText.textContent = 'Parts already collected';
    }
    typeIndicator.textContent = `Build Step ${stepIndex}`;
    typeIndicator.className = 'step-type-indicator step';
  }

  // Update thumbnail highlight
  document.querySelectorAll('.step-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === stepIndex);
  });

  // Scroll thumbnail into view
  const activeThumb = document.querySelector(`.step-thumb[data-step="${stepIndex}"]`);
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Reset zoom
  if (isZoomed) {
    toggleZoom();
  }
}

// Navigation functions
function nextStep() {
  if (currentStep < currentBuild.assemblySteps.length - 1) {
    showStep(currentStep + 1);
    preloadImages();
  }
}

function prevStep() {
  if (currentStep > 0) {
    showStep(currentStep - 1);
  }
}

function goToStep(stepIndex) {
  showStep(stepIndex);
}

// Keyboard navigation
function handleStepKeyboard(e) {
  if (!document.getElementById('stepViewer').classList.contains('active')) {
    return;
  }

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      nextStep();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      prevStep();
      break;
    case 'Escape':
      closeStepViewer();
      break;
    case 'Home':
      e.preventDefault();
      goToStep(0);
      break;
    case 'End':
      e.preventDefault();
      goToStep(currentBuild.assemblySteps.length - 1);
      break;
  }
}

// Zoom functionality
function toggleZoom() {
  const container = document.getElementById('stepImageContainer');
  isZoomed = !isZoomed;
  container.classList.toggle('zoomed', isZoomed);
}

// Preload nearby images for smooth navigation
function preloadImages() {
  if (!currentBuild) return;

  const steps = currentBuild.assemblySteps;
  const preloadRange = 3; // Preload 3 images ahead

  for (let i = currentStep + 1; i <= Math.min(currentStep + preloadRange, steps.length - 1); i++) {
    const step = steps[i];
    if (step.localImage) {
      const img = new Image();
      img.src = step.localImage;
    }
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initStepViewer);
