// State management for resume capability

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { PATHS } from './config.js';
import { logger } from './utils/logger.js';

const DEFAULT_STATE = {
  phase: null,
  startedAt: null,
  lastCheckpoint: null,
  builds: {},
  sensorPrinciples: 'pending',
  courseMappings: 'pending',
  errors: [],
  stats: {
    makecodeScraped: 0,
    pythonScraped: 0,
    wiringDownloaded: 0,
    imagesProcessed: 0,
  },
};

class StateManager {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      if (existsSync(PATHS.stateFile)) {
        const data = readFileSync(PATHS.stateFile, 'utf-8');
        logger.info('Loaded existing state', 'StateManager');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.warn(`Failed to load state: ${error.message}`, 'StateManager');
    }
    return { ...DEFAULT_STATE };
  }

  save() {
    try {
      this.state.lastCheckpoint = new Date().toISOString();
      writeFileSync(PATHS.stateFile, JSON.stringify(this.state, null, 2));
      logger.debug('State saved', 'StateManager');
    } catch (error) {
      logger.error(`Failed to save state: ${error.message}`, 'StateManager');
    }
  }

  reset() {
    this.state = { ...DEFAULT_STATE, startedAt: new Date().toISOString() };
    this.save();
    logger.info('State reset', 'StateManager');
  }

  setPhase(phase) {
    this.state.phase = phase;
    if (!this.state.startedAt) {
      this.state.startedAt = new Date().toISOString();
    }
    this.save();
  }

  getBuildStatus(buildId, type) {
    return this.state.builds[buildId]?.[type] || 'pending';
  }

  setBuildStatus(buildId, type, status) {
    if (!this.state.builds[buildId]) {
      this.state.builds[buildId] = {};
    }
    this.state.builds[buildId][type] = status;

    // Update stats
    if (status === 'complete') {
      if (type === 'makecode') this.state.stats.makecodeScraped++;
      if (type === 'python') this.state.stats.pythonScraped++;
      if (type === 'wiring') this.state.stats.wiringDownloaded++;
    }

    this.save();
  }

  markComplete(buildId, type) {
    this.setBuildStatus(buildId, type, 'complete');
  }

  markFailed(buildId, type, error) {
    this.setBuildStatus(buildId, type, 'failed');
    this.addError(buildId, type, error);
  }

  isComplete(buildId, type) {
    return this.getBuildStatus(buildId, type) === 'complete';
  }

  isPending(buildId, type) {
    const status = this.getBuildStatus(buildId, type);
    return status === 'pending' || status === 'failed';
  }

  addError(buildId, type, error) {
    const errorMsg = error.message || String(error);
    this.state.errors.push({
      buildId,
      type,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });
    this.save();
  }

  getStats() {
    return {
      ...this.state.stats,
      errors: this.state.errors.length,
      phase: this.state.phase,
      startedAt: this.state.startedAt,
      lastCheckpoint: this.state.lastCheckpoint,
    };
  }

  getPendingBuilds(type) {
    const allBuildIds = Object.keys(this.state.builds);
    return allBuildIds.filter(id => this.isPending(id, type));
  }

  getCompletedBuilds(type) {
    return Object.keys(this.state.builds).filter(id =>
      this.isComplete(id, type)
    );
  }

  setSensorPrinciplesStatus(status) {
    this.state.sensorPrinciples = status;
    this.save();
  }

  setCourseMappingsStatus(status) {
    this.state.courseMappings = status;
    this.save();
  }

  // Direct key-based methods for simpler state tracking
  isKeyComplete(key) {
    return this.state.completed?.[key] === true;
  }

  markKeyComplete(key) {
    if (!this.state.completed) {
      this.state.completed = {};
    }
    this.state.completed[key] = true;
    this.save();
  }

  // Alias for addError to maintain API compatibility
  recordError(id, type, errorMsg) {
    this.addError(id, type, errorMsg);
  }

  updateStats(key, value) {
    if (typeof value === 'number') {
      this.state.stats[key] = (this.state.stats[key] || 0) + value;
    } else {
      this.state.stats[key] = value;
    }
    this.save();
  }

  generateReport() {
    const stats = this.getStats();
    const errors = this.state.errors;

    return {
      summary: {
        phase: stats.phase,
        startedAt: stats.startedAt,
        lastCheckpoint: stats.lastCheckpoint,
        makecodeScraped: stats.makecodeScraped,
        pythonScraped: stats.pythonScraped,
        wiringDownloaded: stats.wiringDownloaded,
        imagesProcessed: stats.imagesProcessed,
        errorCount: errors.length,
      },
      errors: errors.slice(-20), // Last 20 errors
      builds: this.state.builds,
    };
  }
}

// Singleton instance
export const stateManager = new StateManager();

export default StateManager;
