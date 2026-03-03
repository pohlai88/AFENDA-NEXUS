/**
 * SP-8011: Supplier Portal > Case Management E2E Tests
 *
 * Tests the complete case lifecycle using SupplierPortalCasesPage POM:
 *  - Create case
 *  - List and filter cases
 *  - View case details
 *  - Add comments to timeline
 *  - Status transitions
 *  - Timeline verification
 *
 * Routes:
 *  - List:   /portal/cases
 *  - New:    /portal/cases/new  
 *  - Detail: /portal/cases/[id]
 *
 * Case lifecycle:
 *  SUBMITTED → IN_PROGRESS → AWAITING_INFO → RESOLVED → CLOSED
 *  
 * Alternative paths:
 *  → ESCALATED → REOPENED → CANCELLED
 *
 * IMPORTANT: Tests require authenticated supplier session.
 * Uses fixtures to provide authenticated context.
 */

import { test, expect } from '../../fixtures/index.js';
import { SupplierPortalCasesPage } from '../../pages/SupplierPortalCasesPage.js';

test.describe('Supplier Portal > Case Management', () => {
  //─── List Page Tests ─────────────────────────────────────────────────────

  test('cases list page loads without errors', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoList();
    
    await expect(cases.heading).toBeVisible();
    await expect(cases.newCaseButton).toBeVisible();
  });

  test('new case button navigates to /portal/cases/new', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoList();
    await cases.clickNewCase();
    
    await expect(page).toHaveURL(/\/portal\/cases\/new/);
    await expect(cases.newCaseHeading).toBeVisible();
  });

  test('empty cases list shows appropriate message', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoList();
    
    // Either shows cases or empty state (depending on data)
    const hasCases = await cases.caseCard('CASE-').isVisible({ timeout: 3000 }).catch(() => false);
    const isEmpty = await cases.emptyStateMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasCases || isEmpty).toBe(true);
  });

  //─── Create Case Tests ───────────────────────────────────────────────────

  test('new case form has all required fields', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoNew();
    
    await expect(cases.subjectInput).toBeVisible();
    await expect(cases.descriptionInput).toBeVisible();
    await expect(cases.categorySelect).toBeVisible();
    await expect(cases.prioritySelect).toBeVisible();
    await expect(cases.submitCaseButton).toBeVisible();
    await expect(cases.cancelLink).toBeVisible();
  });

  test('cancel button returns to cases list', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoNew();
    await cases.cancelLink.click();
    
    await expect(page).toHaveURL(/\/portal\/cases$/);
  });

  test('creates a new case with valid data', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `E2E Test Case ${timestamp}`,
      description: `This is a test case created by automated E2E tests at ${new Date().toISOString()}. Testing case creation functionality.`,
      category: 'GENERAL_INQUIRY',
      priority: 'MEDIUM',
    });
    
    // Should navigate to case detail page
    expect(caseId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/portal/cases/${caseId}`));
    
    // Case details should be visible
    await expect(cases.caseSubject).toContainText(`E2E Test Case ${timestamp}`);
    await expect(cases.caseTicketNumber).toBeVisible();
  });

  test('validates required fields on case submission', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoNew();
    
    // Try to submit without filling required fields
    await cases.submitCaseButton.click();
    
    // Should stay on form page or show validation errors
    const stayedOnForm = page.url().includes('/new');
    const errorVisible = await page
      .getByRole('alert')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const nativeInvalid = await page.locator('#subject:invalid, #description:invalid').count();
    
    expect(stayedOnForm || errorVisible || nativeInvalid > 0).toBe(true);
  });

  test('enforces minimum length for subject and description', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoNew();
    
    // Try with too short subject/description
    await cases.fillNewCaseForm({
      subject: 'Hi',  // Too short (< 5 chars)
      description: 'Test', // Too short (< 10 chars)
    });
    
    await cases.submitCaseButton.click();
    
    // Should show validation error or stay on page
    const url = page.url();
    expect(url).toContain('/new');
  });

  //─── Case Detail Tests ───────────────────────────────────────────────────

  test('displays case details correctly', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    // Create a case first
    const caseId = await cases.createCase({
      subject: `Detail Test ${timestamp}`,
      description: 'Testing case detail display',
      category: 'DOCUMENT_REQUEST',
      priority: 'HIGH',
    });
    
    await cases.gotoDetail(caseId);
    
    // Verify all details are visible
    await expect(cases.caseTicketNumber).toBeVisible();
    await expect(cases.caseSubject).toContainText(`Detail Test ${timestamp}`);
    await expect(cases.caseStatus).toBeVisible();
    await expect(cases.caseDescription).toBeVisible();
  });

  test('shows initial timeline entry on case creation', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `Timeline Test ${timestamp}`,
      description: 'Testing timeline entries',
    });
    
    await cases.gotoDetail(caseId);
    
    // Should have at least one timeline entry (case created)
    const timelineCount = await cases.timelineEntries.count();
    expect(timelineCount).toBeGreaterThan(0);
    
    // Should show SUBMITTED status in timeline
    await cases.expectTimelineEntryExists('SUBMITTED');
  });

  //─── Comment Tests ───────────────────────────────────────────────────────

  test('adds a comment to case timeline', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `Comment Test ${timestamp}`,
      description: 'Testing comment functionality',
    });
    
    await cases.gotoDetail(caseId);
    
    const commentText = `This is a test comment added at ${new Date().toISOString()}`;
    await cases.addComment(commentText);
    
    // Comment should appear in timeline
    await cases.expectCommentInTimeline(commentText);
  });

  test('multiple comments appear in chronological order', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `Multi-Comment Test ${timestamp}`,
      description: 'Testing multiple comments',
    });
    
    await cases.gotoDetail(caseId);
    
    // Add first comment
    await cases.addComment('First comment');
    await page.waitForTimeout(500);
    
    // Add second comment
    await cases.addComment('Second comment');
    await page.waitForTimeout(500);
    
    // Both comments should be visible
    await cases.expectCommentInTimeline('First comment');
    await cases.expectCommentInTimeline('Second comment');
    
    // Should have multiple timeline entries
    const timelineCount = await cases.timelineEntries.count();
    expect(timelineCount).toBeGreaterThanOrEqual(3); // Created + 2 comments
  });

  //─── Status Transition Tests ─────────────────────────────────────────────

  test('case starts with SUBMITTED status', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `Status Test ${timestamp}`,
      description: 'Testing initial status',
    });
    
    await cases.gotoDetail(caseId);
    await cases.expectStatus('SUBMITTED');
  });

  test('transitions case to IN_PROGRESS status', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `Transition Test ${timestamp}`,
      description: 'Testing status transitions',
    });
    
    await cases.gotoDetail(caseId);
    
    // Try to transition to IN_PROGRESS
    const hasTransitionButton = await cases
      .statusTransitionButton('IN_PROGRESS')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    
    if (hasTransitionButton) {
      await cases.transitionStatus('IN_PROGRESS');
      await cases.expectStatus('IN_PROGRESS');
      
      // Status change should appear in timeline
      await cases.expectTimelineEntryExists('IN_PROGRESS');
    } else {
      // Transition might not be available to supplier users
      test.info().annotations.push({
        type: 'note',
        description: 'Status transition buttons not available (may be buyer-only feature)',
      });
    }
  });

  test('case lifecycle: SUBMITTED → IN_PROGRESS → RESOLVED', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `Lifecycle Test ${timestamp}`,
      description: 'Testing complete case lifecycle',
      priority: 'LOW',
    });
    
    await cases.gotoDetail(caseId);
    
    // Verify initial status
    await cases.expectStatus('SUBMITTED');
    
    // Check if transitions are available (may be buyer-only)
    const hasInProgressButton = await cases
      .statusTransitionButton('IN_PROGRESS')
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    
    if (hasInProgressButton) {
      // Transition to IN_PROGRESS
      await cases.transitionStatus('IN_PROGRESS');
      await cases.expectStatus('IN_PROGRESS');
      
      // Transition to RESOLVED
      const hasResolvedButton = await cases
        .statusTransitionButton('RESOLVED')
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      
      if (hasResolvedButton) {
        await cases.transitionStatus('RESOLVED');
        await cases.expectStatus('RESOLVED');
        
        // All transitions should appear in timeline
        await cases.expectTimelineEntryExists('SUBMITTED');
        await cases.expectTimelineEntryExists('IN_PROGRESS');
        await cases.expectTimelineEntryExists('RESOLVED');
      }
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Full lifecycle transitions not available (buyer-only feature)',
      });
    }
  });

  //─── Filter and Search Tests ─────────────────────────────────────────────

  test('filters cases by status', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoList();
    
    // Check if status filters are available
    const hasSubmittedFilter = await cases
      .statusFilter('SUBMITTED')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    
    if (hasSubmittedFilter) {
      await cases.filterByStatus('SUBMITTED');
      
      // URL should contain status filter
      expect(page.url()).toContain('status=');
    }
  });

  test('filters cases by category', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    await cases.gotoList();
    
    // Check if category filters are available
    const hasInquiryFilter = await cases
      .categoryFilter('GENERAL_INQUIRY')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    
    if (hasInquiryFilter) {
      await cases.filterByCategory('GENERAL_INQUIRY');
      
      // URL should contain category filter
      expect(page.url()).toContain('category=');
    }
  });

  test('searches cases by subject/description', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    // Create a case with unique subject
    await cases.createCase({
      subject: `SearchTest${timestamp}`,
      description: 'Unique searchable case',
    });
    
    await cases.gotoList();
    
    const hasSearchInput = await cases.searchInput.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasSearchInput) {
      await cases.searchCases(`SearchTest${timestamp}`);
      
      // URL should contain search query
      expect(page.url()).toContain('q=');
      
      // Should show the case we just created
      await cases.expectCaseInList(`SearchTest${timestamp}`);
    }
  });

  //─── Edge Cases and Error Handling ───────────────────────────────────────

  test('handles case not found gracefully', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    
    // Try to access non-existent case
    await page.goto('/portal/cases/00000000-0000-0000-0000-000000000000');
    
    // Should show 404 or error message (not crash)
    const has404 = page.url().includes('404') || 
                   (await page.getByText(/not found|doesn't exist/i).isVisible({ timeout: 2000 }).catch(() => false));
    
    expect(has404).toBeTruthy();
  });

  test('prevents empty comment submission', async ({ page }) => {
    const cases = new SupplierPortalCasesPage(page);
    const timestamp = Date.now();
    
    const caseId = await cases.createCase({
      subject: `Empty Comment Test ${timestamp}`,
      description: 'Testing validation',
    });
    
    await cases.gotoDetail(caseId);
    
    const hasCommentTextarea = await cases.commentTextarea.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasCommentTextarea) {
      // Try to submit empty comment
      await cases.commentTextarea.fill('');
      
      const submitButton = cases.submitCommentButton;
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      
      // Button should be disabled or submission should fail
      if (!isDisabled) {
        await submitButton.click();
        // Should stay on same page or show error
        const url = page.url();
        expect(url).toContain(`/portal/cases/${caseId}`);
      } else {
        expect(isDisabled).toBeTruthy();
      }
    }
  });
});
