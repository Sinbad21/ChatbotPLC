/**
 * Multi-Channel Adapter Framework
 * Provides interfaces and base adapters for multiple messaging channels
 */

export interface ChannelMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name?: string;
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChannelResponse {
  content: string;
  buttons?: Array<{
    text: string;
    action: 'url' | 'postback';
    value: string;
  }>;
  quickReplies?: string[];
  attachments?: Array<{
    type: 'image' | 'file' | 'audio' | 'video';
    url: string;
  }>;
}

export interface ChannelAdapter {
  name: string;
  isEnabled(): boolean;
  sendMessage(recipient: string, response: ChannelResponse): Promise<void>;
  receiveMessage(payload: any): Promise<ChannelMessage>;
  verifyWebhook(payload: any): boolean;
}

/**
 * WhatsApp Adapter (Stub)
 */
export class WhatsAppAdapter implements ChannelAdapter {
  name = 'whatsapp';

  constructor(
    private config: {
      apiKey: string;
      phoneNumberId: string;
      webhookToken: string;
    }
  ) {}

  isEnabled(): boolean {
    return !!this.config.apiKey && !!this.config.phoneNumberId;
  }

  async sendMessage(recipient: string, response: ChannelResponse): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('WhatsApp adapter is not enabled. Check configuration.');
    }

    const url = `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: false,
        body: response.content,
      },
    };

    // Add interactive buttons if provided
    if (response.buttons && response.buttons.length > 0) {
      payload.type = 'interactive';
      payload.interactive = {
        type: 'button',
        body: { text: response.content },
        action: {
          buttons: response.buttons.slice(0, 3).map((btn, idx) => ({
            type: 'reply',
            reply: {
              id: `btn_${idx}`,
              title: btn.text.slice(0, 20),
            },
          })),
        },
      };
      delete payload.text;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }
  }

  async receiveMessage(payload: any): Promise<ChannelMessage> {
    // Parse WhatsApp webhook payload
    // https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    const contact = change?.value?.contacts?.[0];

    if (!message) {
      throw new Error('Invalid WhatsApp webhook payload: no message found');
    }

    return {
      id: message.id,
      content: message.text?.body || message.button?.text || '',
      sender: {
        id: message.from,
        name: contact?.profile?.name,
      },
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      metadata: {
        channel: 'whatsapp',
        messageType: message.type,
        raw: payload
      },
    };
  }

  verifyWebhook(payload: any): boolean {
    // WhatsApp webhook verification (GET request during setup)
    // https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
    const mode = payload['hub.mode'];
    const token = payload['hub.verify_token'];
    const challenge = payload['hub.challenge'];

    if (mode === 'subscribe' && token === this.config.webhookToken) {
      return true;
    }
    return false;
  }

  getWebhookChallenge(payload: any): string | null {
    return payload['hub.challenge'] || null;
  }
}

/**
 * Telegram Adapter (Stub)
 */
export class TelegramAdapter implements ChannelAdapter {
  name = 'telegram';

  constructor(
    private config: {
      botToken: string;
      webhookSecret?: string;
    }
  ) {}

  isEnabled(): boolean {
    return !!this.config.botToken;
  }

  async sendMessage(recipient: string, response: ChannelResponse): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Telegram adapter is not enabled. Check bot token.');
    }

    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

    const payload: any = {
      chat_id: recipient,
      text: response.content,
      parse_mode: 'Markdown',
    };

    // Add inline keyboard with buttons
    if (response.buttons && response.buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: [
          response.buttons.map(btn => ({
            text: btn.text,
            url: btn.action === 'url' ? btn.value : undefined,
            callback_data: btn.action === 'postback' ? btn.value : undefined,
          })),
        ],
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
    }
  }

  async receiveMessage(payload: any): Promise<ChannelMessage> {
    // Parse Telegram webhook payload - supports messages and callback queries
    const message = payload.message || payload.edited_message;
    const callbackQuery = payload.callback_query;

    if (callbackQuery) {
      // Handle button clicks
      return {
        id: callbackQuery.id,
        content: callbackQuery.data || '',
        sender: {
          id: callbackQuery.from.id.toString(),
          name: callbackQuery.from.username || callbackQuery.from.first_name,
        },
        timestamp: new Date(),
        metadata: {
          channel: 'telegram',
          chatId: callbackQuery.message.chat.id,
          isCallback: true,
          raw: payload
        },
      };
    }

    if (!message) {
      throw new Error('Invalid Telegram webhook payload: no message found');
    }

    return {
      id: message.message_id.toString(),
      content: message.text || message.caption || '',
      sender: {
        id: message.from.id.toString(),
        name: message.from.username || message.from.first_name,
      },
      timestamp: new Date(message.date * 1000),
      metadata: { channel: 'telegram', chatId: message.chat.id, raw: payload },
    };
  }

  verifyWebhook(secretToken?: string): boolean {
    // Telegram webhook verification using X-Telegram-Bot-Api-Secret-Token header
    // https://core.telegram.org/bots/api#setwebhook
    if (!this.config.webhookSecret) {
      return true; // If no secret configured, accept all (not recommended for production)
    }
    return secretToken === this.config.webhookSecret;
  }
}

/**
 * Slack Adapter (Stub)
 */
export class SlackAdapter implements ChannelAdapter {
  name = 'slack';

  constructor(
    private config: {
      botToken: string;
      signingSecret: string;
      appId?: string;
    }
  ) {}

  isEnabled(): boolean {
    return !!this.config.botToken && !!this.config.signingSecret;
  }

  async sendMessage(recipient: string, response: ChannelResponse): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Slack adapter is not enabled. Check configuration.');
    }

    const url = 'https://slack.com/api/chat.postMessage';

    const payload: any = {
      channel: recipient,
      text: response.content,
    };

    // Add blocks with buttons if provided
    if (response.buttons && response.buttons.length > 0) {
      payload.blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: response.content,
          },
        },
        {
          type: 'actions',
          elements: response.buttons.map(btn => ({
            type: 'button',
            text: {
              type: 'plain_text',
              text: btn.text,
            },
            url: btn.action === 'url' ? btn.value : undefined,
            value: btn.action === 'postback' ? btn.value : undefined,
            action_id: btn.action === 'postback' ? btn.value : undefined,
          })),
        },
      ];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as { ok: boolean; error?: string };
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
  }

  async receiveMessage(payload: any): Promise<ChannelMessage> {
    // Parse Slack event payload
    const event = payload.event;

    if (!event) {
      throw new Error('Invalid Slack webhook payload: no event found');
    }

    // Handle message events
    if (event.type === 'message' && !event.bot_id) {
      return {
        id: event.client_msg_id || event.ts,
        content: event.text || '',
        sender: {
          id: event.user,
          name: event.username,
        },
        timestamp: new Date(parseFloat(event.ts) * 1000),
        metadata: { channel: 'slack', channelId: event.channel, raw: payload },
      };
    }

    // Handle app_mention events
    if (event.type === 'app_mention') {
      return {
        id: event.client_msg_id || event.ts,
        content: event.text.replace(/<@[A-Z0-9]+>/g, '').trim(), // Remove bot mention
        sender: {
          id: event.user,
          name: event.username,
        },
        timestamp: new Date(parseFloat(event.ts) * 1000),
        metadata: { channel: 'slack', channelId: event.channel, isMention: true, raw: payload },
      };
    }

    throw new Error(`Unsupported Slack event type: ${event.type}`);
  }

  verifyWebhook(payload: any): boolean {
    // Slack request signing verification
    // https://api.slack.com/authentication/verifying-requests-from-slack
    const crypto = require('crypto');

    const { signature, timestamp, body } = payload;
    if (!signature || !timestamp || !body) {
      return false;
    }

    // Check timestamp to prevent replay attacks (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
      return false;
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', this.config.signingSecret)
      .update(sigBasestring)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    );
  }
}

/**
 * Discord Adapter (Stub)
 */
export class DiscordAdapter implements ChannelAdapter {
  name = 'discord';

  constructor(
    private config: {
      botToken: string;
      applicationId: string;
      publicKey: string;
    }
  ) {}

  isEnabled(): boolean {
    return !!this.config.botToken && !!this.config.applicationId;
  }

  async sendMessage(recipient: string, response: ChannelResponse): Promise<void> {
    // TODO: Implement Discord API
    // https://discord.com/developers/docs/resources/channel#create-message
    console.log('[Discord] Sending message to:', recipient, response);
    throw new Error('Discord adapter not yet implemented. Configure Discord Bot.');
  }

  async receiveMessage(payload: any): Promise<ChannelMessage> {
    // TODO: Parse Discord interaction payload
    return {
      id: payload.id || '',
      content: payload.data?.content || payload.message?.content || '',
      sender: {
        id: payload.member?.user?.id || payload.user?.id || '',
        name: payload.member?.user?.username || payload.user?.username,
      },
      timestamp: new Date(payload.timestamp || Date.now()),
      metadata: { channel: 'discord', guildId: payload.guild_id, raw: payload },
    };
  }

  verifyWebhook(payload: any): boolean {
    // TODO: Implement Discord signature verification
    // https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
    return true;
  }
}

/**
 * Channel Manager
 * Manages multiple channel adapters
 */
export class ChannelManager {
  private adapters = new Map<string, ChannelAdapter>();

  registerAdapter(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  getAdapter(channelName: string): ChannelAdapter | undefined {
    return this.adapters.get(channelName);
  }

  getEnabledAdapters(): ChannelAdapter[] {
    return Array.from(this.adapters.values()).filter(a => a.isEnabled());
  }

  async sendToChannel(
    channelName: string,
    recipient: string,
    response: ChannelResponse
  ): Promise<void> {
    const adapter = this.getAdapter(channelName);
    if (!adapter) {
      throw new Error(`Channel adapter '${channelName}' not found`);
    }
    if (!adapter.isEnabled()) {
      throw new Error(`Channel adapter '${channelName}' is not enabled`);
    }
    await adapter.sendMessage(recipient, response);
  }
}
