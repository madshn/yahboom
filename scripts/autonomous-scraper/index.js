#!/usr/bin/env node

// Autonomous Scraper Orchestrator
// Usage:
//   node index.js --all              Run all phases
//   node index.js --phase=discover   Run specific phase
//   node index.js --resume           Resume from last checkpoint
//   node index.js --report           Generate completion report

import { existsSync, writeFileSync } from 'fs';
import { PATHS } from './config.js';
import { logger } from './utils/logger.js';
import { initBrowser, closeBrowser } from './utils/browser.js';
import { stateManager } from './state-manager.js';

// Import scrapers
import { discoverCourses } from './scrapers/course-discovery.js';
import { scrapeMakeCode } from './scrapers/makecode-scraper.js';
import { scrapePython } from './scrapers/python-scraper.js';
import { scrapeWiring } from './scrapers/wiring-scraper.js';
import { scrapeSensorPrinciples } from './scrapers/sensor-principles.js';
import { scrapeMakeCodeDirect, scrapePythonDirect, scrapeSensorPrinciplesDirect, scrapeAllDirect } from './scrapers/direct-api-scraper.js';

const PHASES = {
  discover: {
    name: 'Course Discovery',
    fn: discoverCourses,
    dependencies: [],
  },
  makecode: {
    name: 'MakeCode Scraping',
    fn: scrapeMakeCode,
    dependencies: ['discover'],
  },
  python: {
    name: 'Python Scraping',
    fn: scrapePython,
    dependencies: ['discover'],
  },
  wiring: {
    name: 'Wiring Diagrams',
    fn: scrapeWiring,
    dependencies: [],
  },
  sensors: {
    name: 'Sensor Principles',
    fn: scrapeSensorPrinciples,
    dependencies: [],
  },
  // Direct API scrapers (no browser required, uses /build?id=X API)
  'direct-makecode': {
    name: 'MakeCode Direct API',
    fn: scrapeMakeCodeDirect,
    dependencies: [],
  },
  'direct-python': {
    name: 'Python Direct API',
    fn: scrapePythonDirect,
    dependencies: [],
  },
  'direct-sensors': {
    name: 'Sensors Direct API',
    fn: scrapeSensorPrinciplesDirect,
    dependencies: [],
  },
  'direct-all': {
    name: 'All Content Direct API',
    fn: scrapeAllDirect,
    dependencies: [],
  },
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    phase: null,
    resume: false,
    report: false,
    reset: false,
  };

  for (const arg of args) {
    if (arg === '--all') options.all = true;
    if (arg === '--resume') options.resume = true;
    if (arg === '--report') options.report = true;
    if (arg === '--reset') options.reset = true;
    if (arg.startsWith('--phase=')) {
      options.phase = arg.split('=')[1];
    }
  }

  return options;
}

/**
 * Run a single phase
 */
async function runPhase(phaseName) {
  const phase = PHASES[phaseName];
  if (!phase) {
    logger.error(`Unknown phase: ${phaseName}`);
    return false;
  }

  logger.info(`Starting phase: ${phase.name}`);
  stateManager.setPhase(phaseName);

  try {
    const result = await phase.fn();
    logger.success(`Completed phase: ${phase.name}`);
    return result;
  } catch (error) {
    logger.error(`Phase failed: ${error.message}`);
    return false;
  }
}

/**
 * Run all phases in order
 */
async function runAllPhases() {
  logger.phase('AUTONOMOUS SCRAPER - FULL RUN');
  logger.info('Running all scraping phases...');

  const phaseOrder = ['discover', 'makecode', 'python', 'wiring', 'sensors'];
  const results = {};

  for (const phaseName of phaseOrder) {
    results[phaseName] = await runPhase(phaseName);
  }

  return results;
}

/**
 * Resume from last checkpoint
 */
async function resumeScraping() {
  logger.phase('RESUME SCRAPING');

  const currentPhase = stateManager.state.phase;
  if (!currentPhase) {
    logger.info('No previous state found, starting fresh...');
    return runAllPhases();
  }

  logger.info(`Resuming from phase: ${currentPhase}`);

  // Get remaining phases
  const phaseOrder = ['discover', 'makecode', 'python', 'wiring', 'sensors'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const remainingPhases = phaseOrder.slice(currentIndex);

  const results = {};
  for (const phaseName of remainingPhases) {
    results[phaseName] = await runPhase(phaseName);
  }

  return results;
}

/**
 * Generate and display completion report
 */
function generateReport() {
  logger.phase('COMPLETION REPORT');

  const report = stateManager.generateReport();

  console.log('\n' + '='.repeat(60));
  console.log('  SCRAPING COMPLETION REPORT');
  console.log('='.repeat(60) + '\n');

  console.log('Summary:');
  console.log(`  Phase: ${report.summary.phase || 'Not started'}`);
  console.log(`  Started: ${report.summary.startedAt || 'N/A'}`);
  console.log(`  Last checkpoint: ${report.summary.lastCheckpoint || 'N/A'}`);
  console.log('');

  console.log('Progress:');
  console.log(`  MakeCode lessons scraped: ${report.summary.makecodeScraped}`);
  console.log(`  Python lessons scraped: ${report.summary.pythonScraped}`);
  console.log(`  Wiring diagrams downloaded: ${report.summary.wiringDownloaded}`);
  console.log(`  Images processed: ${report.summary.imagesProcessed}`);
  console.log('');

  console.log(`Errors: ${report.summary.errorCount}`);
  if (report.errors.length > 0) {
    console.log('\nRecent errors:');
    report.errors.slice(-5).forEach(err => {
      console.log(`  - [${err.buildId}/${err.type}] ${err.error}`);
    });
  }
  console.log('');

  // Build completion status
  const buildIds = Object.keys(report.builds);
  const complete = {
    makecode: buildIds.filter(id => report.builds[id].makecode === 'complete').length,
    python: buildIds.filter(id => report.builds[id].python === 'complete').length,
    wiring: buildIds.filter(id => report.builds[id].wiring === 'complete').length,
  };

  console.log('Build Completion:');
  console.log(`  MakeCode: ${complete.makecode}/${buildIds.length || '?'} builds`);
  console.log(`  Python: ${complete.python}/${buildIds.length || '?'} builds`);
  console.log(`  Wiring: ${complete.wiring}/${buildIds.length || '?'} builds`);
  console.log('');

  // Save report to file
  const reportPath = 'data/scrape-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Full report saved to: ${reportPath}`);

  return report;
}

/**
 * Main entry point
 */
async function main() {
  const options = parseArgs();

  console.log('\n' + '='.repeat(60));
  console.log('  YAHBOOM AUTONOMOUS SCRAPER');
  console.log('='.repeat(60) + '\n');

  // Handle report option
  if (options.report) {
    generateReport();
    return;
  }

  // Handle reset option
  if (options.reset) {
    stateManager.reset();
    logger.info('State has been reset');
    return;
  }

  // Ensure data directory exists
  if (!existsSync('data')) {
    const { mkdirSync } = await import('fs');
    mkdirSync('data', { recursive: true });
  }

  // Check if we need browser (direct-* phases don't need it)
  const needsBrowser = !options.phase || !options.phase.startsWith('direct-');

  if (needsBrowser) {
    // Initialize browser only for browser-based phases
    await initBrowser();
  }

  try {
    let results;

    if (options.all) {
      results = await runAllPhases();
    } else if (options.resume) {
      results = await resumeScraping();
    } else if (options.phase) {
      results = { [options.phase]: await runPhase(options.phase) };
    } else {
      // Default: show help
      console.log('Usage:');
      console.log('  node index.js --all              Run all phases (browser-based)');
      console.log('  node index.js --phase=NAME       Run specific phase');
      console.log('  node index.js --resume           Resume from checkpoint');
      console.log('  node index.js --report           Generate report');
      console.log('  node index.js --reset            Reset state');
      console.log('');
      console.log('Browser-based phases: discover, makecode, python, wiring, sensors');
      console.log('');
      console.log('Direct API phases (recommended - faster, no browser):');
      console.log('  --phase=direct-makecode    Scrape MakeCode lessons');
      console.log('  --phase=direct-python      Scrape Python lessons');
      console.log('  --phase=direct-sensors     Scrape Sensor principles');
      console.log('  --phase=direct-all         Scrape ALL content');
      return;
    }

    // Generate final report
    generateReport();

    logger.success('Scraping complete!');
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    if (needsBrowser) {
      await closeBrowser();
    }
  }
}

// Run
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
