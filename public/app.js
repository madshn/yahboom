// Building:bit Projects Gallery App

let builds = [];
let currentDifficultyFilter = 'all';
let currentSensorFilter = 'all';

// Sensor to Material Symbol icon mapping
const sensorIcons = {
    'ultrasonic': 'radar',
    'PIR': 'motion_sensor_active',
    'light': 'light_mode',
    'line tracking': 'route',
    'servo': 'precision_manufacturing',
    'motor': 'speed',
    'speaker': 'volume_up',
    'LED': 'lightbulb',
    'button': 'touch_app',
    'RGB LED': 'palette',
    'buzzer': 'notifications',
    'joystick': 'gamepad',
};

// Get icon for a sensor (fallback to generic sensor icon)
function getSensorIcon(sensor) {
    const normalized = sensor.toLowerCase();
    for (const [key, icon] of Object.entries(sensorIcons)) {
        if (normalized.includes(key.toLowerCase())) {
            return icon;
        }
    }
    return 'sensors'; // fallback icon
}

// Load builds data
async function loadBuilds() {
    try {
        const response = await fetch('/data/builds.json');
        const data = await response.json();
        builds = data.builds;
        renderGallery(builds);
    } catch (error) {
        console.error('Error loading builds:', error);
        showEmptyState('Could not load projects. Please try again.');
    }
}

// Get the best available image URL (prefer local)
function getImageUrl(build, size = 'thumbnail') {
    if (build.localImages && build.localImages[size]) {
        return build.localImages[size];
    }
    return build.finalImageUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50%" x="50%" text-anchor="middle" dominant-baseline="middle" font-size="40">🤖</text></svg>';
}

// Render gallery cards
function renderGallery(buildsToShow) {
    const gallery = document.getElementById('gallery');

    if (buildsToShow.length === 0) {
        showEmptyState('No projects match this filter.');
        return;
    }

    gallery.innerHTML = buildsToShow.map(build => `
        <article class="gallery-card" data-id="${build.id}" onclick="openModal('${build.id}')">
            <div class="card-image">
                <img src="${getImageUrl(build, 'medium')}" alt="${build.name}" loading="lazy">
            </div>
            <span class="difficulty-badge ${build.difficulty}">${build.difficulty}</span>
            <div class="card-content">
                <span class="card-id">${build.id}</span>
                <h3 class="card-title">${build.name}</h3>
                ${build.description ? `<p class="card-description">${build.description}</p>` : ''}
                ${build.nameChinese ? `<p class="card-chinese">${build.nameChinese}</p>` : ''}
                ${build.sensors && build.sensors.length > 0 ? `
                    <div class="sensor-indicator">
                        ${build.sensors.map(s => `<span class="sensor-tag"><span class="material-symbols-outlined text-sm">${getSensorIcon(s)}</span>${s}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </article>
    `).join('');
}

// Show empty state
function showEmptyState(message) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = `
        <div class="empty-state">
            <div class="emoji">🔍</div>
            <p>${message}</p>
        </div>
    `;
}

// Filter builds
function filterBuilds(filterType, value) {
    // Update the appropriate filter
    if (filterType === 'difficulty') {
        currentDifficultyFilter = value;
    } else if (filterType === 'sensor') {
        currentSensorFilter = value;
    }

    // Update active buttons for the filter type
    document.querySelectorAll(`.filter-btn[data-filter="${filterType}"]`).forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.value === value) {
            btn.classList.add('active');
        }
    });

    // Apply both filters
    let filtered = builds;

    if (currentDifficultyFilter !== 'all') {
        filtered = filtered.filter(build => build.difficulty === currentDifficultyFilter);
    }

    if (currentSensorFilter !== 'all') {
        filtered = filtered.filter(build =>
            build.sensors && build.sensors.some(s =>
                s.toLowerCase() === currentSensorFilter.toLowerCase()
            )
        );
    }

    renderGallery(filtered);
}

// Open project modal
function openModal(buildId) {
    const build = builds.find(b => b.id === buildId);
    if (!build) return;

    const modal = document.getElementById('projectModal');

    // Set image (use full size for modal)
    document.getElementById('modalImage').src = getImageUrl(build, 'full');
    document.getElementById('modalImage').alt = build.name;
    document.getElementById('modalTitle').textContent = `${build.id} ${build.name}`;
    document.getElementById('modalChinese').textContent = build.nameChinese || '';

    // Set up Build Instructions button
    const assemblyLink = document.getElementById('assemblyLink');
    if (build.assemblySteps && build.assemblySteps.length > 0) {
      // Use native step viewer
      assemblyLink.href = '#';
      assemblyLink.onclick = (e) => {
        e.preventDefault();
        closeModal();
        openStepViewer(build.id);
      };
      assemblyLink.removeAttribute('target');
    } else {
      // Fall back to external link
      assemblyLink.href = build.assemblyUrl;
      assemblyLink.onclick = null;
      assemblyLink.target = '_blank';
    }

    // Render coding options
    const codingOptions = document.getElementById('codingOptions');
    let codingHtml = '';

    if (build.codingCourses.makecode) {
        const mc = build.codingCourses.makecode;
        codingHtml += `
            <a href="#" class="coding-option makecode" onclick="event.preventDefault(); closeModal(); openLessonViewer('${build.id}', 'makecode');">
                <div class="option-icon">📦</div>
                <div class="option-text">
                    <div class="option-title">MakeCode - ${mc.section}</div>
                    <div class="option-subtitle">${mc.lessons ? mc.lessons.length + ' lessons' : mc.name}</div>
                </div>
            </a>
        `;
    }

    if (build.codingCourses.python) {
        const py = build.codingCourses.python;
        codingHtml += `
            <a href="#" class="coding-option python" onclick="event.preventDefault(); closeModal(); openLessonViewer('${build.id}', 'python');">
                <div class="option-icon">🐍</div>
                <div class="option-text">
                    <div class="option-title">Python - ${py.section}</div>
                    <div class="option-subtitle">${py.lessons ? py.lessons.length + ' lessons' : py.name}</div>
                </div>
            </a>
        `;
    }

    if (build.codingCourses.sensorAdvanced) {
        const sensor = build.codingCourses.sensorAdvanced;
        codingHtml += `
            <a href="${build.assemblyUrl}" class="coding-option sensor" target="_blank">
                <div class="option-icon">📡</div>
                <div class="option-text">
                    <div class="option-title">Sensor Course - ${sensor.section}</div>
                    <div class="option-subtitle">${sensor.name}</div>
                </div>
            </a>
        `;
    }

    codingOptions.innerHTML = codingHtml || '<p style="color: #888;">Basic build - no coding required!</p>';

    // Render sensors
    const sensorsSection = document.getElementById('sensorsSection');
    const sensorTags = document.getElementById('sensorTags');

    if (build.sensors && build.sensors.length > 0) {
        sensorsSection.style.display = 'block';
        sensorTags.innerHTML = build.sensors.map(s =>
            `<span class="sensor-tag"><span class="material-symbols-outlined text-sm">${getSensorIcon(s)}</span>${s}</span>`
        ).join('');
    } else {
        sensorsSection.style.display = 'none';
    }

    // Render wiring diagram if available
    const wiringSection = document.getElementById('wiringSection');
    const wiringImage = document.getElementById('wiringImage');

    if (build.localImages && build.localImages.wiring) {
        wiringSection.style.display = 'block';
        wiringImage.src = build.localImages.wiring;
        wiringImage.alt = `${build.name} wiring diagram`;
    } else {
        wiringSection.style.display = 'none';
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadBuilds();

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterBuilds(btn.dataset.filter, btn.dataset.value);
        });
    });

    // Close modal
    document.getElementById('closeModal').addEventListener('click', closeModal);

    // Close modal on backdrop click
    document.getElementById('projectModal').addEventListener('click', (e) => {
        if (e.target.id === 'projectModal') {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});
