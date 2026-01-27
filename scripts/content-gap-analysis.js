#!/usr/bin/env node
/**
 * Content Gap Analysis
 *
 * Compares what we HAVE in builds.json against what's AVAILABLE
 * from the master map to identify missing content to scrape.
 */

import fs from 'fs';
import path from 'path';

const BUILDS_PATH = path.join(process.cwd(), 'public/data/builds.json');
const MASTER_MAP_PATH = path.join(process.cwd(), 'public/data/content-master-map.json');
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/content-gaps.json');

function analyzeGaps() {
  console.log('📊 Content Gap Analysis\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const builds = JSON.parse(fs.readFileSync(BUILDS_PATH, 'utf8'));
  const masterMap = JSON.parse(fs.readFileSync(MASTER_MAP_PATH, 'utf8'));

  const gaps = {
    analyzedAt: new Date().toISOString(),
    summary: { total: 0, complete: 0, partial: 0, missing: 0 },
    builds: [],
    actionItems: []
  };

  // Expected content based on master map validation
  const expectations = {
    // Basic builds 1.1-1.9: Assembly + MakeCode (no Python available)
    basic_with_code: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9'],
    // Basic builds 1.10-1.16: Assembly only
    basic_assembly_only: ['1.10', '1.11', '1.12', '1.13', '1.14', '1.15', '1.16'],
    // Sensor builds: Assembly + MakeCode + Python
    sensor_builds: ['1.17', '1.18', '1.19', '1.20', '1.21', '1.22', '1.23', '1.24',
                    '1.25', '1.26', '1.27', '1.28', '1.29', '1.30', '1.31', '1.32']
  };

  console.log('Analyzing builds...\n');

  for (const build of builds.builds) {
    const analysis = {
      id: build.id,
      name: build.name,
      hasAssembly: !!(build.assemblySteps?.length > 0),
      hasMakeCode: !!(build.codingCourses?.makecode?.lessons?.length > 0),
      hasPython: !!(build.codingCourses?.python?.lessons?.length > 0),
      makeCodeLessons: build.codingCourses?.makecode?.lessons?.length || 0,
      pythonLessons: build.codingCourses?.python?.lessons?.length || 0,
      expected: {},
      status: 'unknown',
      gaps: []
    };

    // Determine expectations based on build category
    if (expectations.basic_with_code.includes(build.id)) {
      analysis.expected = { assembly: true, makecode: true, python: false };
      analysis.category = 'basic_with_code';
    } else if (expectations.basic_assembly_only.includes(build.id)) {
      analysis.expected = { assembly: true, makecode: false, python: false };
      analysis.category = 'basic_assembly_only';
    } else if (expectations.sensor_builds.includes(build.id)) {
      analysis.expected = { assembly: true, makecode: true, python: true };
      analysis.category = 'sensor';
    }

    // Check for gaps
    if (analysis.expected.assembly && !analysis.hasAssembly) {
      analysis.gaps.push('Missing assembly steps');
    }
    if (analysis.expected.makecode && !analysis.hasMakeCode) {
      analysis.gaps.push('Missing MakeCode lessons');
    }
    if (analysis.expected.python && !analysis.hasPython) {
      analysis.gaps.push('Missing Python lessons');
    }

    // Determine status
    if (analysis.gaps.length === 0) {
      analysis.status = 'complete';
      gaps.summary.complete++;
    } else if (analysis.hasAssembly || analysis.hasMakeCode || analysis.hasPython) {
      analysis.status = 'partial';
      gaps.summary.partial++;
    } else {
      analysis.status = 'missing';
      gaps.summary.missing++;
    }

    gaps.summary.total++;
    gaps.builds.push(analysis);
  }

  // Generate action items
  const missingMakeCode = gaps.builds.filter(b =>
    b.expected.makecode && !b.hasMakeCode
  ).map(b => b.id);

  const missingPython = gaps.builds.filter(b =>
    b.expected.python && !b.hasPython
  ).map(b => b.id);

  const missingAssembly = gaps.builds.filter(b =>
    b.expected.assembly && !b.hasAssembly
  ).map(b => b.id);

  if (missingMakeCode.length > 0) {
    gaps.actionItems.push({
      action: 'Scrape MakeCode lessons',
      builds: missingMakeCode,
      source: 'Chapter 3 (basic) or Chapter 5.2/5.3 (sensor)',
      count: missingMakeCode.length
    });
  }

  if (missingPython.length > 0) {
    gaps.actionItems.push({
      action: 'Scrape Python lessons',
      builds: missingPython,
      source: 'Chapter 6.2/6.3 (sensor only)',
      count: missingPython.length
    });
  }

  if (missingAssembly.length > 0) {
    gaps.actionItems.push({
      action: 'Scrape assembly steps',
      builds: missingAssembly,
      source: 'Chapter 1',
      count: missingAssembly.length
    });
  }

  // Print results
  console.log('SUMMARY BY CATEGORY:\n');

  const categories = {
    basic_with_code: { label: 'Basic with MakeCode (1.1-1.9)', builds: [] },
    basic_assembly_only: { label: 'Basic Assembly Only (1.10-1.16)', builds: [] },
    sensor: { label: 'Sensor Builds (1.17-1.32)', builds: [] }
  };

  for (const b of gaps.builds) {
    if (categories[b.category]) {
      categories[b.category].builds.push(b);
    }
  }

  for (const [key, cat] of Object.entries(categories)) {
    console.log(`${cat.label}:`);
    console.log('─'.repeat(50));

    for (const b of cat.builds) {
      const status = b.status === 'complete' ? '✓' : (b.status === 'partial' ? '⚠' : '✗');
      const details = [];
      if (b.hasAssembly) details.push(`Asm:✓`);
      if (b.hasMakeCode) details.push(`MC:${b.makeCodeLessons}`);
      if (b.hasPython) details.push(`Py:${b.pythonLessons}`);

      const gapStr = b.gaps.length > 0 ? ` [${b.gaps.join(', ')}]` : '';
      console.log(`  ${status} ${b.id.padEnd(5)} ${b.name.substring(0,25).padEnd(26)} ${details.join(' ')}${gapStr}`);
    }
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('OVERALL SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total builds:    ${gaps.summary.total}`);
  console.log(`  Complete:        ${gaps.summary.complete} (${Math.round(gaps.summary.complete/gaps.summary.total*100)}%)`);
  console.log(`  Partial:         ${gaps.summary.partial}`);
  console.log(`  Missing:         ${gaps.summary.missing}`);
  console.log('');

  if (gaps.actionItems.length > 0) {
    console.log('ACTION ITEMS:');
    console.log('─'.repeat(50));
    for (const item of gaps.actionItems) {
      console.log(`\n  📋 ${item.action} (${item.count} builds)`);
      console.log(`     Source: ${item.source}`);
      console.log(`     Builds: ${item.builds.join(', ')}`);
    }
  } else {
    console.log('✅ No gaps found! All expected content is present.');
  }

  // Save results
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(gaps, null, 2));
  console.log(`\n\n💾 Detailed results saved to ${OUTPUT_PATH}`);

  return gaps;
}

analyzeGaps();
