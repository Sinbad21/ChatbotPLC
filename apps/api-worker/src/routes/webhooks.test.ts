/**
 * Tests for Multi-Channel Webhook Routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock dependencies FIRST (hoisted)
vi.mock('../db', () => ({
  getPrisma: vi.fn(() => ({
    integrationConfig: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  })),
}));

vi.mock('@chatbot-studio/multi-channel', () => {
  // Define mock classes inside the factory
  class MockWhatsAppAdapter {
    phoneNumberId: string;
    webhookToken: string;
    
    constructor(config: any) {
      this.phoneNumberId = config.phoneNumberId;
      this.webhookToken = config.webhookToken;
    }
    
    verifyWebhook(params: any) {
      return params['hub.mode'] === 'subscribe' && params['hub.verify_token'] === this.webhookToken;
    }
    
    async receiveMessage(payload: any) {
      return {
        id: 'msg_123',
        content: 'Hello',
        sender: { id: '1234567890', name: 'Test User' },
        timestamp: new Date(),
        channel: 'whatsapp',
      };
    }
    
    async sendMessage(to: string, message: any) {
      return { success: true };
    }
  }

  class MockTelegramAdapter {
    webhookSecret?: string;
    
    constructor(config: any) {
      this.webhookSecret = config.webhookSecret;
    }
    
    verifyWebhook(token?: string) {
      return token === this.webhookSecret;
    }
    
    async receiveMessage(payload: any) {
      return {
        id: 'msg_456',
        content: 'Hello from Telegram',
        sender: { id: '987654321', name: 'Telegram User' },
        timestamp: new Date(),
        channel: 'telegram',
        metadata: { chatId: '123456' },
      };
    }
    
    async sendMessage(chatId: string, message: any) {
      return { success: true };
    }
  }

  class MockSlackAdapter {
    signingSecret: string;
    
    constructor(config: any) {
      this.signingSecret = config.signingSecret;
    }
    
    verifyWebhook(signature: string, timestamp: string, body: string) {
      return signature === 'valid_signature' || this.signingSecret === 'test_secret';
    }
    
    async receiveMessage(payload: any) {
      return {
        id: 'msg_789',
        content: 'Hello from Slack',
        sender: { id: 'U123456', name: 'Slack User' },
        timestamp: new Date(),
        channel: 'slack',
        metadata: { channelId: 'C123456' },
      };
    }
    
    async sendMessage(channelId: string, message: any) {
      return { success: true };
    }
  }

  return {
    WhatsAppAdapter: MockWhatsAppAdapter,
    TelegramAdapter: MockTelegramAdapter,
    SlackAdapter: MockSlackAdapter,
  };
});

import { registerWebhookRoutes } from './webhooks';

describe('Webhook Routes', () => {
  let app: Hono<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    
    // Set up environment bindings
    app.use('*', async (c, next) => {
      c.env = {
        DATABASE_URL: 'postgres://test',
        OPENAI_API_KEY: 'sk-test',
        WHATSAPP_API_KEY: 'wa_test_key',
        WHATSAPP_PHONE_NUMBER_ID: '123456789',
        WHATSAPP_WEBHOOK_TOKEN: 'test_verify_token',
        TELEGRAM_BOT_TOKEN: 'telegram_bot_token',
        TELEGRAM_WEBHOOK_SECRET: 'telegram_secret',
        SLACK_BOT_TOKEN: 'xoxb-test-token',
        SLACK_SIGNING_SECRET: 'test_secret',
        SLACK_APP_ID: 'A123456',
      };
      await next();
    });
    
    registerWebhookRoutes(app);
  });

  describe('GET /webhooks/health', () => {
    it('should return health status', async () => {
      const res = await app.request('/webhooks/health');
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.webhooks).toEqual({
        whatsapp: true,
        telegram: true,
        slack: true,
      });
    });
  });

  describe('WhatsApp Webhook', () => {
    describe('GET /webhooks/whatsapp (verification)', () => {
      it('should verify webhook with correct token', async () => {
        const res = await app.request(
          '/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=challenge123'
        );
        
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toBe('challenge123');
      });

      it('should reject verification with wrong token', async () => {
        const res = await app.request(
          '/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge123'
        );
        
        expect(res.status).toBe(403);
      });

      it('should reject verification with missing mode', async () => {
        const res = await app.request(
          '/webhooks/whatsapp?hub.verify_token=test_verify_token&hub.challenge=challenge123'
        );
        
        expect(res.status).toBe(403);
      });
    });

    describe('POST /webhooks/whatsapp (messages)', () => {
      it('should receive WhatsApp message', async () => {
        const payload = {
          object: 'whatsapp_business_account',
          entry: [{
            id: '123',
            changes: [{
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  phone_number_id: '123456789',
                },
                messages: [{
                  from: '1234567890',
                  id: 'wamid.123',
                  timestamp: '1234567890',
                  text: { body: 'Hello' },
                  type: 'text',
                }],
              },
            }],
          }],
        };

        const res = await app.request('/webhooks/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
      });
    });
  });

  describe('Telegram Webhook', () => {
    describe('POST /webhooks/telegram', () => {
      it('should receive Telegram message with valid secret', async () => {
        const payload = {
          update_id: 123456789,
          message: {
            message_id: 1,
            from: {
              id: 987654321,
              first_name: 'Test',
              username: 'testuser',
            },
            chat: {
              id: 987654321,
              type: 'private',
            },
            date: 1234567890,
            text: 'Hello from Telegram',
          },
        };

        const res = await app.request('/webhooks/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Bot-Api-Secret-Token': 'telegram_secret',
          },
          body: JSON.stringify(payload),
        });
        
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
      });

      it('should reject Telegram message with invalid secret', async () => {
        const payload = {
          update_id: 123456789,
          message: {
            message_id: 1,
            text: 'Hello',
          },
        };

        const res = await app.request('/webhooks/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Bot-Api-Secret-Token': 'wrong_secret',
          },
          body: JSON.stringify(payload),
        });
        
        expect(res.status).toBe(403);
      });
    });
  });

  describe('Slack Webhook', () => {
    describe('POST /webhooks/slack', () => {
      it('should respond to URL verification challenge', async () => {
        const payload = {
          type: 'url_verification',
          challenge: 'test_challenge_123',
        };

        const res = await app.request('/webhooks/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.challenge).toBe('test_challenge_123');
      });

      it('should receive Slack event callback', async () => {
        const payload = {
          type: 'event_callback',
          event: {
            type: 'message',
            user: 'U123456',
            text: 'Hello from Slack',
            channel: 'C123456',
            ts: '1234567890.123456',
          },
        };

        const res = await app.request('/webhooks/slack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Slack-Signature': 'valid_signature',
            'X-Slack-Request-Timestamp': '1234567890',
          },
          body: JSON.stringify(payload),
        });
        
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
      });
    });
  });
});
