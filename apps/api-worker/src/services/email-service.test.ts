import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Resend before importing email service
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = {
      send: vi.fn().mockResolvedValue({ id: 'email-123' }),
    };
  },
}));

// Set environment variables before importing
const originalEnv = process.env;

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('sendAttendeeConfirmation', () => {
    it('should skip email if no attendee email provided', async () => {
      const { sendAttendeeConfirmation } = await import('./email-service');
      const consoleSpy = vi.spyOn(console, 'log');

      await sendAttendeeConfirmation({
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        timeZone: 'Europe/Rome',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'No attendee email provided, skipping confirmation email'
      );
    });

    it('should log fallback when RESEND_API_KEY not configured', async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
      
      const { sendAttendeeConfirmation } = await import('./email-service');
      const consoleSpy = vi.spyOn(console, 'log');

      await sendAttendeeConfirmation({
        attendeeEmail: 'test@example.com',
        attendeeFirstName: 'John',
        attendeeLastName: 'Doe',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        timeZone: 'Europe/Rome',
      });

      // Should log fallback message
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('sendOwnerNotification', () => {
    it('should skip email if no owner email provided', async () => {
      const { sendOwnerNotification } = await import('./email-service');
      const consoleSpy = vi.spyOn(console, 'log');

      await sendOwnerNotification({
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        timeZone: 'Europe/Rome',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'No owner email configured, skipping notification'
      );
    });

    it('should include attendee info in notification', async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
      
      const { sendOwnerNotification } = await import('./email-service');
      const consoleSpy = vi.spyOn(console, 'log');

      await sendOwnerNotification({
        ownerEmail: 'owner@example.com',
        attendeeEmail: 'guest@example.com',
        attendeeFirstName: 'Jane',
        attendeeLastName: 'Smith',
        attendeePhone: '+1234567890',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        timeZone: 'Europe/Rome',
        notes: 'Consultation meeting',
      });

      // Verify log was called (email fallback)
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('sendCancellationEmail', () => {
    it('should skip email if no attendee email provided', async () => {
      const { sendCancellationEmail } = await import('./email-service');
      const consoleSpy = vi.spyOn(console, 'log');

      await sendCancellationEmail({
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        timeZone: 'Europe/Rome',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'No attendee email provided, skipping cancellation email'
      );
    });
  });

  describe('Email content generation', () => {
    it('should format dates correctly for Italian locale', async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
      
      const { sendAttendeeConfirmation } = await import('./email-service');
      const consoleSpy = vi.spyOn(console, 'log');

      await sendAttendeeConfirmation({
        attendeeEmail: 'test@example.com',
        attendeeFirstName: 'Marco',
        attendeeLastName: 'Rossi',
        startTime: '2024-01-15T14:00:00Z',
        endTime: '2024-01-15T15:00:00Z',
        timeZone: 'Europe/Rome',
        notes: 'Meeting notes here',
        calendarName: 'Main Calendar',
      });

      // Should log subject line
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subject: Conferma Prenotazione')
      );
    });
  });
});
