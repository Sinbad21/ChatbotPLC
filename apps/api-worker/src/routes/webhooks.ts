import { Hono } from 'hono';
import { getPrisma } from '../db';
import {
  WhatsAppAdapter,
  TelegramAdapter,
  SlackAdapter,
  ChannelManager,
} from '@chatbot-studio/multi-channel';
import { processChannelMessage } from '../services/multichannel';

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  // WhatsApp
  WHATSAPP_API_KEY?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_WEBHOOK_TOKEN?: string;
  // Telegram
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  // Slack
  SLACK_BOT_TOKEN?: string;
  SLACK_SIGNING_SECRET?: string;
  SLACK_APP_ID?: string;
};

export function registerWebhookRoutes(app: Hono<{ Bindings: Bindings }>) {
  // WhatsApp Webhook
  // GET for verification, POST for messages
  app.get('/webhooks/whatsapp', async (c) => {
    try {
      const mode = c.req.query('hub.mode');
      const token = c.req.query('hub.verify_token');
      const challenge = c.req.query('hub.challenge');

      const adapter = new WhatsAppAdapter({
        apiKey: c.env.WHATSAPP_API_KEY || '',
        phoneNumberId: c.env.WHATSAPP_PHONE_NUMBER_ID || '',
        webhookToken: c.env.WHATSAPP_WEBHOOK_TOKEN || '',
      });

      if (adapter.verifyWebhook({ 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge })) {
        return c.text(challenge || '');
      }

      return c.json({ error: 'Verification failed' }, 403);
    } catch (error: any) {
      console.error('[WhatsApp Webhook Verification Error]', error);
      return c.json({ error: error.message }, 400);
    }
  });

  app.post('/webhooks/whatsapp', async (c) => {
    try {
      const payload = await c.req.json();
      const prisma = getPrisma(c.env);

      // Initialize WhatsApp adapter
      const adapter = new WhatsAppAdapter({
        apiKey: c.env.WHATSAPP_API_KEY || '',
        phoneNumberId: c.env.WHATSAPP_PHONE_NUMBER_ID || '',
        webhookToken: c.env.WHATSAPP_WEBHOOK_TOKEN || '',
      });

      // Parse incoming message
      const message = await adapter.receiveMessage(payload);

      console.log('[WhatsApp Message Received]', {
        from: message.sender.id,
        content: message.content,
      });

      // Process message with AI and send response
      if (c.env.OPENAI_API_KEY && message.content) {
        const result = await processChannelMessage(
          prisma as any,
          c.env.OPENAI_API_KEY,
          'whatsapp',
          message,
          adapter
        );

        if (!result.success) {
          console.warn('[WhatsApp] Failed to process message:', result.error);
        }
      }

      return c.json({ status: 'ok' });
    } catch (error: any) {
      console.error('[WhatsApp Webhook Error]', error);
      return c.json({ error: error.message }, 400);
    }
  });

  // Telegram Webhook
  app.post('/webhooks/telegram', async (c) => {
    try {
      const secretToken = c.req.header('X-Telegram-Bot-Api-Secret-Token');
      const payload = await c.req.json();
      const prisma = getPrisma(c.env);

      const adapter = new TelegramAdapter({
        botToken: c.env.TELEGRAM_BOT_TOKEN || '',
        webhookSecret: c.env.TELEGRAM_WEBHOOK_SECRET,
      });

      // Verify webhook
      if (!adapter.verifyWebhook(secretToken)) {
        return c.json({ error: 'Invalid secret token' }, 403);
      }

      // Parse incoming message
      const message = await adapter.receiveMessage(payload);

      console.log('[Telegram Message Received]', {
        from: message.sender.id,
        content: message.content,
      });

      // Process message with AI and send response
      if (c.env.OPENAI_API_KEY && message.content) {
        const result = await processChannelMessage(
          prisma as any,
          c.env.OPENAI_API_KEY,
          'telegram',
          message,
          adapter
        );

        if (!result.success) {
          console.warn('[Telegram] Failed to process message:', result.error);
        }
      }

      return c.json({ ok: true });
    } catch (error: any) {
      console.error('[Telegram Webhook Error]', error);
      return c.json({ error: error.message }, 400);
    }
  });

  // Slack Webhook
  // Handle URL verification challenge
  app.post('/webhooks/slack', async (c) => {
    try {
      const body = await c.req.text();
      const payload = JSON.parse(body);
      const prisma = getPrisma(c.env);

      // Handle Slack URL verification
      if (payload.type === 'url_verification') {
        return c.json({ challenge: payload.challenge });
      }

      // Verify request signature
      const signature = c.req.header('X-Slack-Signature') || '';
      const timestamp = c.req.header('X-Slack-Request-Timestamp') || '';

      const adapter = new SlackAdapter({
        botToken: c.env.SLACK_BOT_TOKEN || '',
        signingSecret: c.env.SLACK_SIGNING_SECRET || '',
        appId: c.env.SLACK_APP_ID,
      });

      if (!adapter.verifyWebhook(signature, timestamp, body)) {
        return c.json({ error: 'Invalid signature' }, 403);
      }

      // Handle events
      if (payload.type === 'event_callback') {
        const message = await adapter.receiveMessage(payload);

        console.log('[Slack Message Received]', {
          from: message.sender.id,
          content: message.content,
          channel: message.metadata.channelId,
        });

        // Process message with AI and send response
        if (c.env.OPENAI_API_KEY && message.content) {
          const result = await processChannelMessage(
            prisma as any,
            c.env.OPENAI_API_KEY,
            'slack',
            message,
            adapter
          );

          if (!result.success) {
            console.warn('[Slack] Failed to process message:', result.error);
          }
        }
      }

      return c.json({ ok: true });
    } catch (error: any) {
      console.error('[Slack Webhook Error]', error);
      return c.json({ error: error.message }, 400);
    }
  });

  // Health check endpoint for webhooks
  app.get('/webhooks/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      webhooks: {
        whatsapp: !!c.env.WHATSAPP_API_KEY,
        telegram: !!c.env.TELEGRAM_BOT_TOKEN,
        slack: !!c.env.SLACK_BOT_TOKEN,
      },
    });
  });
}
