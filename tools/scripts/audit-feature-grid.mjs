#!/usr/bin/env node
/**
 * Feature Grid (Module Map) Configuration Audit
 *
 * Checks:
 * 1. Domain configs have all required fields
 * 2. buildFeatureMetrics is configured and cached
 * 3. Navigation groups are properly defined
 * 4. Feature IDs are consistent across configs
 * 5. Roadmap features are properly registered
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE = process.cwd();
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const issues = [];
const warnings = [];
const passed = [];

function error(msg) {
  issues.push(msg);
  console.log(`${COLORS.red}❌ ${msg}${COLORS.reset}`);
}

function warn(msg) {
  warnings.push(msg);
  console.log(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}`);
}

function pass(msg) {
  passed.push(msg);
  console.log(`${COLORS.green}✅ ${msg}${COLORS.reset}`);
}

function info(msg) {
  console.log(`${COLORS.blue}ℹ️  ${msg}${COLORS.reset}`);
}

function readFile(path) {
  const fullPath = join(WORKSPACE, path);
  if (!existsSync(fullPath)) {
    return null;
  }
  return readFileSync(fullPath, 'utf-8');
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   Feature Grid (Module Map) Configuration Audit           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ─── 1. Check Domain Config File ────────────────────────────────────────

info('Checking domain-configs.ts...');
const domainConfigsPath = 'apps/web/src/lib/dashboards/domain-configs.ts';
const domainConfigsContent = readFile(domainConfigsPath);

if (!domainConfigsContent) {
  error(`File not found: ${domainConfigsPath}`);
} else {
  pass('Domain configs file exists');

  // Check FINANCE_OVERVIEW_CONFIG
  if (domainConfigsContent.includes('export const FINANCE_OVERVIEW_CONFIG')) {
    pass('FINANCE_OVERVIEW_CONFIG is exported');
  } else {
    error('FINANCE_OVERVIEW_CONFIG is not exported');
  }

  // Check required fields in FINANCE_OVERVIEW_CONFIG
  const requiredFields = ['domainId', 'title', 'description', 'defaultKpiIds', 'navGroups'];

  // Extract FINANCE_OVERVIEW_CONFIG body using balanced-brace counting
  // (the old regex could not handle deeply nested savedViewPresets)
  const configStart = domainConfigsContent.indexOf('export const FINANCE_OVERVIEW_CONFIG');
  let configBody = '';
  if (configStart !== -1) {
    const braceStart = domainConfigsContent.indexOf('{', configStart);
    if (braceStart !== -1) {
      let depth = 0;
      let end = braceStart;
      for (let i = braceStart; i < domainConfigsContent.length; i++) {
        if (domainConfigsContent[i] === '{' || domainConfigsContent[i] === '[') depth++;
        if (domainConfigsContent[i] === '}' || domainConfigsContent[i] === ']') depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
      configBody = domainConfigsContent.slice(configStart, end);
    }
  }

  if (configBody) {
    requiredFields.forEach((field) => {
      if (configBody.includes(`${field}:`)) {
        pass(`FINANCE_OVERVIEW_CONFIG has '${field}' field`);
      } else {
        error(`FINANCE_OVERVIEW_CONFIG missing '${field}' field`);
      }
    });

    // Check for buildFeatureMetrics
    if (configBody.includes('buildFeatureMetrics:')) {
      pass('FINANCE_OVERVIEW_CONFIG has buildFeatureMetrics configured');

      // Check if it references buildFinanceFeatureMetrics
      if (configBody.includes('buildFinanceFeatureMetrics')) {
        pass('buildFeatureMetrics references buildFinanceFeatureMetrics');
      } else {
        warn('buildFeatureMetrics exists but may not reference correct function');
      }
    } else {
      error('FINANCE_OVERVIEW_CONFIG missing buildFeatureMetrics (required for metrics display)');
    }

    // Check for navGroups value
    if (configBody.includes('navGroups: financeNavigationGroups')) {
      pass('navGroups is set to financeNavigationGroups');
    } else if (configBody.includes('navGroups:')) {
      warn('navGroups is configured but may not use financeNavigationGroups');
    } else {
      error('navGroups is not configured');
    }
  }
}

// ─── 2. Check buildFeatureMetrics Implementation ─────────────────────────

info('\nChecking build-feature-metrics.ts...');
const buildMetricsPath = 'apps/web/src/lib/finance/build-feature-metrics.ts';
const buildMetricsContent = readFile(buildMetricsPath);

if (!buildMetricsContent) {
  error(`File not found: ${buildMetricsPath}`);
} else {
  pass('build-feature-metrics.ts exists');

  // Check for cache() usage
  if (buildMetricsContent.includes("import { cache } from 'react'")) {
    pass('React cache is imported');
  } else {
    error('React cache is NOT imported (performance issue)');
  }

  // Check if buildFinanceFeatureMetrics is cached
  if (buildMetricsContent.includes('export const buildFinanceFeatureMetrics = cache(')) {
    pass('buildFinanceFeatureMetrics is wrapped with cache()');
  } else if (buildMetricsContent.includes('export async function buildFinanceFeatureMetrics')) {
    error('buildFinanceFeatureMetrics is NOT cached (major performance issue)');
  } else {
    error('buildFinanceFeatureMetrics function not found');
  }

  // Check return type
  if (buildMetricsContent.includes(': Promise<FeatureMetricMap>')) {
    pass('Function returns FeatureMetricMap type');
  } else {
    warn('Function may not have proper return type annotation');
  }

  // Check for feature ID coverage (supports both object-literal and dot-notation)
  const featureIds = ['gl', 'ap', 'ar', 'banking', 'assets', 'co', 'tr', 'tax'];
  let coveredFeatures = 0;

  featureIds.forEach((id) => {
    if (
      buildMetricsContent.includes(`'${id}':`) ||
      buildMetricsContent.includes(`metrics.${id}`) ||
      buildMetricsContent.includes(`"${id}":`)
    ) {
      coveredFeatures++;
    }
  });

  if (coveredFeatures >= 5) {
    pass(`Metrics configured for ${coveredFeatures}/${featureIds.length} core features`);
  } else {
    warn(`Only ${coveredFeatures}/${featureIds.length} features have metrics configured`);
  }
}

// ─── 3. Check Navigation Groups ──────────────────────────────────────────

info('\nChecking navigation groups in constants.ts...');
const constantsPath = 'apps/web/src/lib/constants.ts';
const constantsContent = readFile(constantsPath);

if (!constantsContent) {
  error(`File not found: ${constantsPath}`);
} else {
  pass('constants.ts exists');

  // Check financeNavigationGroups export
  if (constantsContent.includes('export const financeNavigationGroups')) {
    pass('financeNavigationGroups is exported');
  } else {
    error('financeNavigationGroups is not exported');
  }

  // Count navigation groups
  const navGroupMatches = constantsContent.match(/{\s*featureId:\s*['"][\w-]+['"]/g);
  if (navGroupMatches) {
    const count = navGroupMatches.length;
    pass(`Found ${count} navigation groups with featureId`);

    if (count < 5) {
      warn('Very few navigation groups defined (expected 10+)');
    }
  } else {
    error('No navigation groups with featureId found');
  }

  // Check for required featureIds in nav groups
  const requiredFeatureIds = ['gl', 'ap', 'ar'];
  requiredFeatureIds.forEach((id) => {
    if (constantsContent.includes(`featureId: '${id}'`)) {
      pass(`Navigation group for '${id}' exists`);
    } else {
      error(`Navigation group for '${id}' is missing`);
    }
  });

  // Check for shortcut descriptions (used in feature cards)
  const shortcutCount = (constantsContent.match(/shortcut:\s*{/g) || []).length;
  if (shortcutCount > 0) {
    pass(`${shortcutCount} features have shortcut descriptions`);
  } else {
    warn('No shortcut descriptions found (feature cards may lack descriptions)');
  }
}

// ─── 4. Check Feature Grid Component ─────────────────────────────────────

info('\nChecking feature-grid.tsx...');
const featureGridPath = 'apps/web/src/lib/dashboards/feature-grid.tsx';
const featureGridContent = readFile(featureGridPath);

if (!featureGridContent) {
  error(`File not found: ${featureGridPath}`);
} else {
  pass('feature-grid.tsx exists');

  // Check for section headers
  if (
    featureGridContent.includes('"features-available"') ||
    featureGridContent.includes("'features-available'")
  ) {
    pass('Available features section is defined');
  } else {
    error('Available features section header is missing');
  }

  if (
    featureGridContent.includes('"features-planned"') ||
    featureGridContent.includes("'features-planned'")
  ) {
    pass('Planned features section is defined');
  } else {
    warn('Planned features section is missing (optional)');
  }

  // Check for metrics mapping
  if (
    featureGridContent.includes('featureMetrics') &&
    featureGridContent.includes('[card.featureId]')
  ) {
    pass('Feature metrics are properly mapped by featureId');
  } else {
    warn('Feature metrics mapping may be missing or incorrect');
  }

  // Check for attention mapping
  if (featureGridContent.includes('attentionByFeature')) {
    pass('Attention items are properly mapped');
  } else {
    warn('Attention mapping may be missing');
  }
}

// ─── 5. Check Feature Card Component ─────────────────────────────────────

info('\nChecking feature-card.tsx...');
const featureCardPath = 'apps/web/src/lib/dashboards/feature-card.tsx';
const featureCardContent = readFile(featureCardPath);

if (!featureCardContent) {
  error(`File not found: ${featureCardPath}`);
} else {
  pass('feature-card.tsx exists');

  // Check for signals rendering
  if (
    featureCardContent.includes('metricPrimary') &&
    featureCardContent.includes('metricSecondary')
  ) {
    pass('Feature card renders primary and secondary metrics');
  } else {
    error('Feature card may not display metrics properly');
  }

  // Check for attention severity styling
  if (
    featureCardContent.includes('getSeverityColor') ||
    featureCardContent.includes('getSeverityAccent')
  ) {
    pass('Attention severity styling is implemented');
  } else {
    warn('Attention severity styling may be missing');
  }

  // Check for variant support (type def + runtime check)
  if (
    (featureCardContent.includes("'active'") && featureCardContent.includes("'planned'")) ||
    (featureCardContent.includes('FeatureCardVariant') && featureCardContent.includes('isPlanned'))
  ) {
    pass('Feature card supports both active and planned variants');
  } else {
    warn('Feature card may not support all variants');
  }
}

// ─── 6. Check Domain Dashboard Shell ──────────────────────────────────────

info('\nChecking domain-dashboard-shell.tsx...');
const shellPath = 'apps/web/src/lib/dashboards/domain-dashboard-shell.tsx';
const shellContent = readFile(shellPath);

if (!shellContent) {
  error(`File not found: ${shellPath}`);
} else {
  pass('domain-dashboard-shell.tsx exists');

  // Check for FeatureGrid import
  if (shellContent.includes('import { FeatureGrid }')) {
    pass('FeatureGrid is imported');
  } else {
    error('FeatureGrid is not imported');
  }

  // Check for FeatureGrid rendering
  if (shellContent.includes('<FeatureGrid')) {
    pass('FeatureGrid component is rendered');
  } else {
    error('FeatureGrid component is not rendered');
  }

  // Check if buildFeatureMetrics is called
  if (
    shellContent.includes('buildFeatureMetrics') &&
    shellContent.includes('config.buildFeatureMetrics')
  ) {
    pass('buildFeatureMetrics is called from config');
  } else {
    error('buildFeatureMetrics is not being called');
  }

  // Check if featureMetrics are passed to FeatureGrid
  if (shellContent.includes('featureMetrics={featureMetrics}')) {
    pass('Feature metrics are passed to FeatureGrid');
  } else {
    error('Feature metrics are NOT passed to FeatureGrid (cards will not show metrics)');
  }

  // Check parallel fetching
  if (shellContent.includes('Promise.all')) {
    pass('Data is fetched in parallel (optimized)');
  } else {
    warn('Data may not be fetched in parallel (performance issue)');
  }
}

// ─── 7. Check Domain Dashboard Layout ────────────────────────────────────

info('\nChecking domain-dashboard-layout.tsx...');
const layoutPath = 'apps/web/src/lib/dashboards/domain-dashboard-layout.tsx';
const layoutContent = readFile(layoutPath);

if (!layoutContent) {
  error(`File not found: ${layoutPath}`);
} else {
  pass('domain-dashboard-layout.tsx exists');

  // Check for separator
  if (layoutContent.includes('<Separator') || layoutContent.includes('Separator')) {
    pass('Separator component is used');
  } else {
    error("Separator is missing (bottom panel won't be visually separated)");
  }

  // Check for featureGrid prop
  if (layoutContent.includes('featureGrid:') || layoutContent.includes('featureGrid?:')) {
    pass('Layout accepts featureGrid prop');
  } else {
    error('Layout does not accept featureGrid prop');
  }

  // Check if featureGrid is rendered
  if (layoutContent.includes('{featureGrid}')) {
    pass('Feature grid is rendered in layout');
  } else {
    error('Feature grid is not rendered in layout');
  }
}

// ─── 8. Check Roadmap Registry (Optional) ─────────────────────────────────

info('\nChecking roadmap-registry.ts (optional)...');
const roadmapPath = 'apps/web/src/lib/dashboards/roadmap-registry.ts';
const roadmapContent = readFile(roadmapPath);

if (!roadmapContent) {
  warn('roadmap-registry.ts not found (planned features will not show)');
} else {
  pass('roadmap-registry.ts exists');

  // Check for getPlannedFeatures export
  if (
    roadmapContent.includes('export function getPlannedFeatures') ||
    roadmapContent.includes('export const getPlannedFeatures')
  ) {
    pass('getPlannedFeatures function is exported');
  } else {
    warn('getPlannedFeatures function not found');
  }

  // Check if finance module has planned features
  if (roadmapContent.includes("'finance'") || roadmapContent.includes('"finance"')) {
    pass('Finance module has roadmap entries');
  } else {
    info('Finance module has no planned features (optional)');
  }
}

// ─── 9. Check Types ───────────────────────────────────────────────────────

info('\nChecking type definitions...');
const typesPath = 'apps/web/src/lib/dashboards/types.ts';
const typesContent = readFile(typesPath);

if (!typesContent) {
  error(`File not found: ${typesPath}`);
} else {
  pass('types.ts exists');

  // Check for BuildFeatureMetrics type
  if (typesContent.includes('BuildFeatureMetrics')) {
    pass('BuildFeatureMetrics type is defined');
  } else {
    error('BuildFeatureMetrics type is missing');
  }

  // Check for FeatureMetricMap type (in module-map.types.ts)
  const moduleMapTypesPath = 'apps/web/src/lib/dashboards/module-map.types.ts';
  const moduleMapTypesContent = readFile(moduleMapTypesPath);

  if (moduleMapTypesContent) {
    if (moduleMapTypesContent.includes('FeatureMetricMap')) {
      pass('FeatureMetricMap type is defined');
    } else {
      error('FeatureMetricMap type is missing');
    }
  } else {
    warn('module-map.types.ts not found');
  }
}

// ─── 10. Summary ──────────────────────────────────────────────────────────

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                      Audit Summary                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`${COLORS.green}✅ Passed: ${passed.length}${COLORS.reset}`);
console.log(`${COLORS.yellow}⚠️  Warnings: ${warnings.length}${COLORS.reset}`);
console.log(`${COLORS.red}❌ Errors: ${issues.length}${COLORS.reset}\n`);

if (issues.length === 0 && warnings.length === 0) {
  console.log(`${COLORS.green}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  ✅ All checks passed! Feature Grid is properly configured ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);
  process.exit(0);
} else if (issues.length === 0) {
  console.log(`${COLORS.yellow}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  ⚠️  Configuration OK with minor warnings                  ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  ❌ Configuration issues found! See errors above           ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

  console.log('\n📋 Action Items:\n');
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });

  process.exit(1);
}
