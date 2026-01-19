// URL Router for Building:bit Gallery
// Handles permalinks for builds, lessons, and assembly steps

const Router = {
  // Current route state
  current: null,

  // Route patterns
  patterns: {
    build: /^#\/build\/([^/]+)$/,
    buildModal: /^#\/build\/([^/]+)\/modal$/,
    lesson: /^#\/build\/([^/]+)\/(makecode|python)(?:\/(\d+))?$/,
    assembly: /^#\/build\/([^/]+)\/assembly(?:\/(\d+))?$/,
  },

  // Initialize router
  init() {
    // Handle initial route
    window.addEventListener('load', () => {
      // Small delay to ensure builds are loaded
      setTimeout(() => this.handleRoute(), 100);
    });

    // Handle browser back/forward
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  // Parse current hash and return route info
  parseHash(hash = window.location.hash) {
    if (!hash || hash === '#' || hash === '#/') {
      return { type: 'home' };
    }

    // Check each pattern
    let match;

    match = hash.match(this.patterns.assembly);
    if (match) {
      return {
        type: 'assembly',
        buildId: match[1],
        step: match[2] ? parseInt(match[2], 10) : 0
      };
    }

    match = hash.match(this.patterns.lesson);
    if (match) {
      return {
        type: 'lesson',
        buildId: match[1],
        lessonType: match[2],
        lessonIndex: match[3] ? parseInt(match[3], 10) - 1 : 0
      };
    }

    match = hash.match(this.patterns.buildModal);
    if (match) {
      return {
        type: 'buildModal',
        buildId: match[1]
      };
    }

    match = hash.match(this.patterns.build);
    if (match) {
      return {
        type: 'build',
        buildId: match[1]
      };
    }

    return { type: 'unknown' };
  },

  // Handle route change
  handleRoute() {
    const route = this.parseHash();
    this.current = route;

    // Close all viewers first
    this.closeAllViewers();

    switch (route.type) {
      case 'home':
        // Just show gallery
        break;

      case 'build':
      case 'buildModal':
        if (typeof openModal === 'function') {
          openModal(route.buildId);
        }
        break;

      case 'lesson':
        if (typeof openLessonViewer === 'function') {
          openLessonViewer(route.buildId, route.lessonType);
          // Navigate to specific lesson after viewer opens
          if (route.lessonIndex > 0) {
            setTimeout(() => {
              if (typeof selectLesson === 'function') {
                selectLesson(route.lessonIndex);
              }
            }, 100);
          }
        }
        break;

      case 'assembly':
        if (typeof openStepViewer === 'function') {
          openStepViewer(route.buildId);
          // Navigate to specific step after viewer opens
          if (route.step > 0) {
            setTimeout(() => {
              if (typeof goToStep === 'function') {
                goToStep(route.step);
              }
            }, 100);
          }
        }
        break;
    }
  },

  // Close all viewers without changing hash
  closeAllViewers() {
    // Close build modal
    const modal = document.getElementById('projectModal');
    if (modal) {
      modal.classList.remove('active');
    }

    // Close lesson viewer
    const lessonViewer = document.getElementById('lessonViewer');
    if (lessonViewer) {
      lessonViewer.classList.remove('active');
    }

    // Close step viewer
    const stepViewer = document.getElementById('stepViewer');
    if (stepViewer) {
      stepViewer.classList.remove('active');
    }

    document.body.style.overflow = '';
  },

  // Navigation methods - update hash (which triggers handleRoute)
  navigateTo(path) {
    window.location.hash = path;
  },

  navigateToHome() {
    history.pushState(null, '', window.location.pathname);
    this.handleRoute();
  },

  navigateToBuild(buildId) {
    this.navigateTo(`#/build/${buildId}`);
  },

  navigateToLesson(buildId, lessonType, lessonIndex = 0) {
    const lessonNum = lessonIndex + 1;
    if (lessonIndex === 0) {
      this.navigateTo(`#/build/${buildId}/${lessonType}`);
    } else {
      this.navigateTo(`#/build/${buildId}/${lessonType}/${lessonNum}`);
    }
  },

  navigateToAssembly(buildId, step = 0) {
    if (step === 0) {
      this.navigateTo(`#/build/${buildId}/assembly`);
    } else {
      this.navigateTo(`#/build/${buildId}/assembly/${step}`);
    }
  },

  // Update hash without triggering navigation (for internal state updates)
  updateHash(path, replace = false) {
    if (replace) {
      history.replaceState(null, '', path);
    } else {
      history.pushState(null, '', path);
    }
  }
};

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => Router.init());
