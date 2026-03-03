import { describe, expect, it } from 'vitest';

import {
  PORTAL_NOTIFICATION_CHANNELS,
  type PortalNotificationType,
} from '../notifications/portal-notification-dispatcher.js';

describe('SP-1004: Notification Dispatcher', () => {
  describe('PORTAL_NOTIFICATION_CHANNELS', () => {
    it('has 3 channels', () => {
      expect(PORTAL_NOTIFICATION_CHANNELS).toHaveLength(3);
    });

    it('contains email, in_app, push', () => {
      expect(PORTAL_NOTIFICATION_CHANNELS).toContain('email');
      expect(PORTAL_NOTIFICATION_CHANNELS).toContain('in_app');
      expect(PORTAL_NOTIFICATION_CHANNELS).toContain('push');
    });
  });

  describe('notification types', () => {
    const allTypes: PortalNotificationType[] = [
      'CASE_STATUS_CHANGED',
      'CASE_ASSIGNED',
      'CASE_MESSAGE_RECEIVED',
      'CASE_SLA_BREACH',
      'ESCALATION_TRIGGERED',
      'ESCALATION_ASSIGNED',
      'PAYMENT_STATUS_CHANGED',
      'INVOICE_STATUS_CHANGED',
      'COMPLIANCE_EXPIRING',
      'COMPLIANCE_EXPIRED',
      'DOCUMENT_SHARED',
      'ONBOARDING_STATUS_CHANGED',
      'BANK_ACCOUNT_STATUS_CHANGED',
      'ANNOUNCEMENT_PUBLISHED',
      'APPOINTMENT_CONFIRMED',
      'APPOINTMENT_CANCELLED',
    ];

    it('has 16 notification types', () => {
      expect(allTypes).toHaveLength(16);
    });

    it('each type is a non-empty string', () => {
      for (const t of allTypes) {
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });
});
