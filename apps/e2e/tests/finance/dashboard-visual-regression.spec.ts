/**
 * Visual Regression Tests for Finance Dashboard Charts
 * 
 * Uses Playwright to capture screenshots of all dashboard charts at different
 * screen sizes and theme modes for visual diff comparison.
 */

import { test, expect } from '@playwright/test';

const FINANCE_DASHBOARD_URL = '/finance/overview';

const CHARTS = [
  'liquidity-waterfall',
  'financial-ratios',
  'dso-trend',
  'budget-variance',
  'asset-portfolio',
  'tax-liability',
  'working-capital',
  'cash-flow-sankey',
] as const;

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

const THEMES = ['light', 'dark'] as const;

test.describe('Finance Dashboard Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to finance dashboard
    await page.goto(FINANCE_DASHBOARD_URL);
    
    // Wait for charts to load
    await page.waitForSelector('[data-testid="chart-card"]', { timeout: 10000 });
    
    // Wait for any animations to complete
    await page.waitForTimeout(500);
  });

  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`Full dashboard - ${viewport.name} - ${theme}`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Set theme
        const themeToggle = page.locator('[data-testid="theme-toggle"]');
        const currentTheme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        
        if (currentTheme !== theme) {
          await themeToggle.click();
          await page.waitForTimeout(300);
        }

        // Take full page screenshot
        await expect(page).toHaveScreenshot(
          `dashboard-full-${viewport.name}-${theme}.png`,
          {
            fullPage: true,
            maxDiffPixels: 100,
          }
        );
      });

      for (const chartId of CHARTS) {
        test(`Chart ${chartId} - ${viewport.name} - ${theme}`, async ({ page }) => {
          // Set viewport
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          // Set theme
          const themeToggle = page.locator('[data-testid="theme-toggle"]');
          const currentTheme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
          
          if (currentTheme !== theme) {
            await themeToggle.click();
            await page.waitForTimeout(300);
          }

          // Locate chart
          const chart = page.locator(`[data-chart-id="${chartId}"]`);
          await expect(chart).toBeVisible();

          // Take chart screenshot
          await expect(chart).toHaveScreenshot(
            `chart-${chartId}-${viewport.name}-${theme}.png`,
            {
              maxDiffPixels: 50,
            }
          );
        });
      }
    }
  }
});

test.describe('Finance Dashboard Empty States', () => {
  test('Empty state rendering', async ({ page }) => {
    // Mock empty data response
    await page.route('**/api/finance/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          meta: {
            generatedAt: new Date().toISOString(),
            cacheKey: 'test',
            ttl: 300,
            freshness: 'fresh',
          },
          kpis: {},
          charts: {},
        }),
      });
    });

    await page.goto(FINANCE_DASHBOARD_URL);
    await page.waitForTimeout(1000);

    // Capture empty state
    await expect(page).toHaveScreenshot('dashboard-empty-state.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Error state rendering', async ({ page }) => {
    // Mock error response
    await page.route('**/api/finance/dashboard**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to fetch dashboard data',
          message: 'Internal server error',
        }),
      });
    });

    await page.goto(FINANCE_DASHBOARD_URL);
    await page.waitForTimeout(1000);

    // Capture error state
    await expect(page).toHaveScreenshot('dashboard-error-state.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Loading state rendering', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/finance/dashboard**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          meta: {
            generatedAt: new Date().toISOString(),
            cacheKey: 'test',
            ttl: 300,
            freshness: 'fresh',
          },
          kpis: {},
          charts: {},
        }),
      });
    });

    await page.goto(FINANCE_DASHBOARD_URL);
    
    // Capture loading state immediately
    await expect(page).toHaveScreenshot('dashboard-loading-state.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe('Finance Dashboard Interactions', () => {
  test('Chart drilldown', async ({ page }) => {
    await page.goto(FINANCE_DASHBOARD_URL);
    await page.waitForSelector('[data-testid="chart-card"]');

    // Click on a chart to trigger drilldown
    const waterfallChart = page.locator('[data-chart-id="liquidity-waterfall"]');
    await waterfallChart.click();

    // Wait for navigation or modal
    await page.waitForTimeout(500);

    // Capture drilldown view
    await expect(page).toHaveScreenshot('dashboard-drilldown.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Time range selector', async ({ page }) => {
    await page.goto(FINANCE_DASHBOARD_URL);
    
    // Find time range control
    const timeRangeControl = page.locator('[data-testid="time-range-control"]');
    await expect(timeRangeControl).toBeVisible();

    // Change time range
    await timeRangeControl.click();
    const ytdOption = page.locator('text=YTD');
    await ytdOption.click();

    // Wait for chart refresh
    await page.waitForTimeout(1000);

    // Capture updated view
    await expect(page).toHaveScreenshot('dashboard-time-range-ytd.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Compare mode toggle', async ({ page }) => {
    await page.goto(FINANCE_DASHBOARD_URL);
    
    // Find compare toggle
    const compareToggle = page.locator('[data-testid="compare-toggle"]');
    await expect(compareToggle).toBeVisible();

    // Enable prior year comparison
    await compareToggle.click();
    const priorYearOption = page.locator('text=Prior Year');
    await priorYearOption.click();

    // Wait for chart refresh
    await page.waitForTimeout(1000);

    // Capture comparison view
    await expect(page).toHaveScreenshot('dashboard-compare-prior-year.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe('Finance Dashboard Accessibility', () => {
  test('Keyboard navigation', async ({ page }) => {
    await page.goto(FINANCE_DASHBOARD_URL);
    await page.waitForSelector('[data-testid="chart-card"]');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Capture focus states
    await expect(page).toHaveScreenshot('dashboard-keyboard-focus.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Screen reader labels', async ({ page }) => {
    await page.goto(FINANCE_DASHBOARD_URL);
    
    // Check ARIA labels
    const charts = await page.locator('[data-testid="chart-card"]').all();
    
    for (const chart of charts) {
      const ariaLabel = await chart.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).not.toBe('');
    }
  });
});
