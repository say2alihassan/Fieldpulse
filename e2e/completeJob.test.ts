import { by, device, element, expect, waitFor } from 'detox';

describe('Complete Job Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete the full flow: login → view job → complete checklist → submit', async () => {
    // ============================================
    // Step 1: Login
    // ============================================

    // Wait for login screen to appear
    await waitFor(element(by.id('email-input')))
      .toBeVisible()
      .withTimeout(5000);

    // Enter credentials
    await element(by.id('email-input')).typeText('tech@fieldpulse.com');
    await element(by.id('password-input')).typeText('password123');

    // Tap login button
    await element(by.id('login-button')).tap();

    // Wait for job list to appear
    await waitFor(element(by.id('job-list')))
      .toBeVisible()
      .withTimeout(10000);

    // ============================================
    // Step 2: View first job
    // ============================================

    // Tap on the first job card
    await waitFor(element(by.id('job-card-job-1')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('job-card-job-1')).tap();

    // Wait for job details to load
    await waitFor(element(by.id('job-details')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify job details are displayed
    await expect(element(by.text('Job Details'))).toBeVisible();

    // ============================================
    // Step 3: Start the job
    // ============================================

    // Tap start job button
    await waitFor(element(by.id('start-job-button')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('start-job-button')).tap();

    // Confirm start job alert
    await waitFor(element(by.text('Start')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Start')).tap();

    // Wait for job to be started
    await waitFor(element(by.id('start-checklist-button')))
      .toBeVisible()
      .withTimeout(5000);

    // ============================================
    // Step 4: Open and complete checklist
    // ============================================

    // Tap checklist button
    await element(by.id('start-checklist-button')).tap();

    // Wait for checklist screen
    await waitFor(element(by.text('Checklist')))
      .toBeVisible()
      .withTimeout(5000);

    // Fill in text field (e.g., notes)
    await waitFor(element(by.id('field-notes')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('field-notes')).typeText('Work completed successfully. All systems operational.');

    // Fill in number field (e.g., hours)
    await element(by.id('field-hours')).tap();
    await element(by.id('field-hours')).typeText('2.5');

    // Select dropdown option (e.g., status)
    await element(by.id('field-status-dropdown')).tap();
    await waitFor(element(by.text('Completed')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Completed')).tap();

    // Capture signature
    await element(by.id('field-signature-capture')).tap();

    // Wait for signature pad
    await waitFor(element(by.id('signature-pad')))
      .toBeVisible()
      .withTimeout(3000);

    // Draw signature (swipe gesture)
    await element(by.id('signature-pad')).swipe('right', 'fast', 0.5, 0.5, 0.5);
    await element(by.id('signature-pad')).swipe('down', 'fast', 0.3, 0.7, 0.3);

    // Save signature
    await element(by.id('signature-save')).tap();

    // Wait for checklist screen to reappear
    await waitFor(element(by.id('submit-checklist')))
      .toBeVisible()
      .withTimeout(3000);

    // ============================================
    // Step 5: Submit checklist
    // ============================================

    // Scroll to submit button if needed
    await element(by.id('submit-checklist')).tap();

    // Confirm submission
    await waitFor(element(by.text('Submit')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Submit')).tap();

    // Wait for success and navigation back to job details
    await waitFor(element(by.id('job-details')))
      .toBeVisible()
      .withTimeout(10000);

    // ============================================
    // Step 6: Verify job is completed
    // ============================================

    // Navigate back to job list
    await element(by.id('back-button')).tap();

    // Verify the job status is now "Completed"
    await waitFor(element(by.id('job-list')))
      .toBeVisible()
      .withTimeout(5000);

    // The job card should show completed status
    // Note: The exact assertion depends on how status is displayed
    await expect(element(by.text('Completed'))).toBeVisible();
  });

  it('should save draft and restore on re-entry', async () => {
    // Login
    await element(by.id('email-input')).typeText('tech@fieldpulse.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('job-list')))
      .toBeVisible()
      .withTimeout(10000);

    // Open a job
    await element(by.id('job-card-job-2')).tap();
    await waitFor(element(by.id('job-details')))
      .toBeVisible()
      .withTimeout(5000);

    // Start the job first
    await element(by.id('start-job-button')).tap();
    await element(by.text('Start')).tap();

    // Open checklist
    await element(by.id('start-checklist-button')).tap();

    // Fill in some fields
    await element(by.id('field-notes')).typeText('Partial notes - draft test');

    // Go back (should auto-save draft)
    await element(by.id('back-button')).tap();

    // Re-open checklist
    await element(by.id('start-checklist-button')).tap();

    // Verify the draft was restored
    await waitFor(element(by.id('field-notes')))
      .toBeVisible()
      .withTimeout(2000);

    // Check if the previously entered text is there
    await expect(element(by.text('Partial notes - draft test'))).toBeVisible();
  });

  it('should handle offline mode gracefully', async () => {
    // Login first while online
    await element(by.id('email-input')).typeText('tech@fieldpulse.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('job-list')))
      .toBeVisible()
      .withTimeout(10000);

    // Simulate offline mode
    await device.setURLBlacklist(['.*']);

    // Try to pull to refresh
    await element(by.id('job-list')).scroll(100, 'down');

    // Should show offline banner or cached data message
    await waitFor(element(by.text('Offline Mode')))
      .toBeVisible()
      .withTimeout(5000);

    // Jobs should still be visible from cache
    await expect(element(by.id('job-card-job-1'))).toBeVisible();

    // Re-enable network
    await device.setURLBlacklist([]);
  });
});
