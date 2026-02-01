/**
 * Google Calendar OAuth2 and API Service
 * Handles authentication, token management, and calendar operations
 */

import { getPrisma } from '../../db';
import type { PrismaClient } from '@prisma/client';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  env: any; // Cloudflare Workers environment
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface TimeSlot {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

export interface AvailabilityRequest {
  calendarId: string;
  timeMin: string;
  timeMax: string;
  timeZone?: string;
}

export interface CreateEventRequest {
  calendarId: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  timeZone: string;
  attendeeEmail?: string;
  attendeeName?: string;
  organizerEmail: string;
  idempotencyKey?: string;
}

export class GoogleCalendarService {
  private config: GoogleCalendarConfig;
  private prisma: PrismaClient;
  private baseUrl = 'https://www.googleapis.com/calendar/v3';
  private authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private tokenUrl = 'https://oauth2.googleapis.com/token';

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
    this.prisma = getPrisma(config.env);
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthorizationUrl(state: string, organizationId: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: `${state}:${organizationId}`,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth token exchange failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt,
    };
  }

  /**
   * Get valid access token (refresh if expired)
   */
  async getValidAccessToken(connectionId: string): Promise<string> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    // Check if token is expired or about to expire (5 min buffer)
    const now = new Date();
    const expiresAt = connection.tokenExpiresAt;

    if (expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      // Token expired or expiring soon, refresh it
      if (!connection.refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokens = await this.refreshAccessToken(connection.refreshToken);

      // Update connection with new tokens
      await this.prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
        },
      });

      return tokens.accessToken;
    }

    return connection.accessToken;
  }

  /**
   * List calendars for the authenticated user
   */
  async listCalendars(accessToken: string) {
    const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list calendars: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.items;
  }

  /**
   * Get free/busy information for a calendar
   */
  async getFreeBusy(
    accessToken: string,
    request: AvailabilityRequest
  ): Promise<{ busy: TimeSlot[] }> {
    const response = await fetch(`${this.baseUrl}/freeBusy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: request.timeMin,
        timeMax: request.timeMax,
        timeZone: request.timeZone || 'Europe/Rome',
        items: [{ id: request.calendarId }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get free/busy: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const calendar = data.calendars[request.calendarId];

    return {
      busy: calendar?.busy || [],
    };
  }

  /**
   * Calculate available time slots based on free/busy and working hours
   */
  async getAvailableSlots(
    connectionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSlot[]> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    const accessToken = await this.getValidAccessToken(connectionId);

    // Get busy periods
    const { busy } = await this.getFreeBusy(accessToken, {
      calendarId: connection.calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      timeZone: connection.timeZone,
    });

    // Get blocked dates (stored as JSON array of YYYY-MM-DD strings)
    const blockedDates: string[] = (connection.blockedDates as any) || [];

    // Generate all possible slots based on working hours
    const allSlots = this.generateTimeSlots(
      startDate,
      endDate,
      connection.slotDuration,
      connection.bufferTime,
      connection.workingHours as any,
      blockedDates
    );

    // Filter out busy slots
    const availableSlots = allSlots.filter((slot) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      return !busy.some((busyPeriod) => {
        const busyStart = new Date(busyPeriod.start);
        const busyEnd = new Date(busyPeriod.end);

        // Check if slot overlaps with busy period
        return slotStart < busyEnd && slotEnd > busyStart;
      });
    });

    return availableSlots;
  }

  /**
   * Generate time slots based on working hours and blocked dates
   */
  private generateTimeSlots(
    startDate: Date,
    endDate: Date,
    slotDuration: number,
    bufferTime: number,
    workingHours?: {
      monday?: { start: string; end: string; enabled?: boolean };
      tuesday?: { start: string; end: string; enabled?: boolean };
      wednesday?: { start: string; end: string; enabled?: boolean };
      thursday?: { start: string; end: string; enabled?: boolean };
      friday?: { start: string; end: string; enabled?: boolean };
      saturday?: { start: string; end: string; enabled?: boolean };
      sunday?: { start: string; end: string; enabled?: boolean };
    },
    blockedDates: string[] = []
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(startDate);

    // Default working hours if not provided
    const defaultHours = { start: '09:00', end: '17:00', enabled: true };

    // Convert blocked dates to Set for O(1) lookup
    const blockedDatesSet = new Set(blockedDates);

    while (current < endDate) {
      // Format current date as YYYY-MM-DD for comparison with blocked dates
      const currentDateStr = current.toISOString().split('T')[0];

      // Skip if this date is in blocked dates
      if (blockedDatesSet.has(currentDateStr)) {
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
        continue;
      }

      const dayName = current
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase() as keyof typeof workingHours;

      const dayHours = workingHours?.[dayName] || defaultHours;

      // Skip if day is explicitly disabled or no hours configured
      if (!dayHours || dayHours.enabled === false) {
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
        continue;
      }

      const [startHour, startMinute] = dayHours.start.split(':').map(Number);
      const [endHour, endMinute] = dayHours.end.split(':').map(Number);

      const dayStart = new Date(current);
      dayStart.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      const slotStart = new Date(dayStart);

      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

        if (slotEnd <= dayEnd) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });
        }

        slotStart.setTime(
          slotStart.getTime() + (slotDuration + bufferTime) * 60 * 1000
        );
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    return slots;
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    connectionId: string,
    request: CreateEventRequest
  ): Promise<any> {
    // Check for idempotency
    if (request.idempotencyKey) {
      const existing = await this.prisma.calendarEvent.findUnique({
        where: { idempotencyKey: request.idempotencyKey },
      });

      if (existing) {
        return existing;
      }
    }

    const accessToken = await this.getValidAccessToken(connectionId);

    const eventBody: any = {
      summary: request.summary,
      description: request.description,
      start: {
        dateTime: request.start,
        timeZone: request.timeZone,
      },
      end: {
        dateTime: request.end,
        timeZone: request.timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 },       // 30 min before
        ],
      },
    };

    // Add attendee if provided
    if (request.attendeeEmail) {
      eventBody.attendees = [
        {
          email: request.attendeeEmail,
          displayName: request.attendeeName,
        },
      ];
    }

    // Add Google Meet conference
    eventBody.conferenceData = {
      createRequest: {
        requestId: request.idempotencyKey || crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(request.calendarId)}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create event: ${JSON.stringify(error)}`);
    }

    const event = await response.json();

    // Save to database
    const savedEvent = await this.prisma.calendarEvent.create({
      data: {
        calendarConnectionId: connectionId,
        externalEventId: event.id,
        title: request.summary,
        description: request.description,
        startTime: new Date(request.start),
        endTime: new Date(request.end),
        timeZone: request.timeZone,
        attendeeEmail: request.attendeeEmail,
        attendeeName: request.attendeeName,
        organizerEmail: request.organizerEmail,
        meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
        status: 'CONFIRMED',
        idempotencyKey: request.idempotencyKey,
        metadata: event,
      },
    });

    return savedEvent;
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    connectionId: string,
    eventId: string,
    updates: Partial<CreateEventRequest>
  ): Promise<any> {
    const accessToken = await this.getValidAccessToken(connectionId);
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, calendarConnectionId: connectionId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const eventBody: any = {};

    if (updates.summary) eventBody.summary = updates.summary;
    if (updates.description) eventBody.description = updates.description;
    if (updates.start) {
      eventBody.start = {
        dateTime: updates.start,
        timeZone: updates.timeZone || connection.timeZone,
      };
    }
    if (updates.end) {
      eventBody.end = {
        dateTime: updates.end,
        timeZone: updates.timeZone || connection.timeZone,
      };
    }

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(connection.calendarId)}/events/${event.externalEventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update event: ${JSON.stringify(error)}`);
    }

    const updatedEvent = await response.json();

    // Update in database
    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: updates.summary || event.title,
        description: updates.description || event.description,
        startTime: updates.start ? new Date(updates.start) : event.startTime,
        endTime: updates.end ? new Date(updates.end) : event.endTime,
        metadata: updatedEvent,
      },
    });

    return updatedEvent;
  }

  /**
   * Cancel a calendar event
   */
  async cancelEvent(connectionId: string, eventId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(connectionId);
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, calendarConnectionId: connectionId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(connection.calendarId)}/events/${event.externalEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 410) {
      // 410 means already deleted
      const error = await response.json();
      throw new Error(`Failed to cancel event: ${JSON.stringify(error)}`);
    }

    // Update status in database
    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Set up webhook for calendar push notifications
   */
  async setupWebhook(
    connectionId: string,
    webhookUrl: string,
    channelId: string
  ): Promise<any> {
    const accessToken = await this.getValidAccessToken(connectionId);
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(connection.calendarId)}/events/watch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          expiration: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to setup webhook: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }
}
