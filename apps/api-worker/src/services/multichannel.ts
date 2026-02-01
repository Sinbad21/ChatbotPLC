/**
 * Multi-Channel Message Processing Service
 * 
 * Connects channel webhooks (WhatsApp, Telegram, Slack) to the AI chat logic.
 * 
 * Flow:
 * 1. Receive message from channel adapter
 * 2. Find bot for the organization (via IntegrationConfig)
 * 3. Process message with AI
 * 4. Send response back through channel adapter
 */

import { ChannelMessage, ChannelResponse, ChannelAdapter } from '@chatbot-studio/multi-channel';

interface PrismaClient {
  integrationConfig: {
    findFirst: (args: any) => Promise<any>;
  };
  organization: {
    findUnique: (args: any) => Promise<any>;
  };
  bot: {
    findFirst: (args: any) => Promise<any>;
  };
  conversation: {
    findFirst: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  message: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
  };
}

interface ProcessMessageResult {
  success: boolean;
  response?: string;
  error?: string;
  botId?: string;
  conversationId?: string;
}

/**
 * Find organization by channel integration config
 */
async function findOrganizationByChannel(
  prisma: PrismaClient,
  channelSlug: string,
  identifyingField: string,
  identifyingValue: string
): Promise<{ organizationId: string; botId: string } | null> {
  // Find IntegrationConfig for this channel
  const integration = await prisma.integrationConfig.findFirst({
    where: {
      integration: { slug: channelSlug },
      enabled: true,
      // Look for config that matches the identifying value (e.g., phoneNumberId for WhatsApp)
    },
    include: {
      integration: true,
      organization: {
        include: {
          bots: {
            where: { published: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!integration?.organization?.bots?.[0]) {
    console.log(`[MultiChannel] No active bot found for ${channelSlug} integration`);
    return null;
  }

  return {
    organizationId: integration.organizationId,
    botId: integration.organization.bots[0].id,
  };
}

/**
 * Get or create conversation for this channel user
 */
async function getOrCreateConversation(
  prisma: PrismaClient,
  botId: string,
  channelUserId: string,
  channelName: string
): Promise<string> {
  // Session ID for channel messages
  const sessionId = `${channelName}:${channelUserId}`;
  
  // Find existing conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      botId,
      sessionId,
    },
    orderBy: { startedAt: 'desc' },
  });

  // Create new conversation if not exists or if too old (24h)
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = new Date();
  
  if (!conversation || (now.getTime() - new Date(conversation.startedAt).getTime()) > maxAge) {
    conversation = await prisma.conversation.create({
      data: {
        botId,
        sessionId,
        startedAt: now,
        status: 'ACTIVE',
        metadata: {
          channel: channelName,
          userId: channelUserId,
        },
      },
    });
    console.log(`[MultiChannel] Created new conversation: ${conversation.id}`);
  }

  return conversation.id;
}

/**
 * Get recent conversation history for context
 */
async function getConversationHistory(
  prisma: PrismaClient,
  conversationId: string,
  limit: number = 10
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.reverse().map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

/**
 * Call OpenAI to generate response
 */
async function generateAIResponse(
  apiKey: string,
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const completion = await response.json();
  return completion.choices?.[0]?.message?.content || 'Mi dispiace, non sono riuscito a generare una risposta.';
}

/**
 * Save message to database
 */
async function saveMessage(
  prisma: PrismaClient,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
): Promise<void> {
  await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      metadata,
    },
  });
}

/**
 * Main function: Process incoming channel message and generate response
 */
export async function processChannelMessage(
  prisma: PrismaClient,
  openaiApiKey: string,
  channelSlug: string,
  message: ChannelMessage,
  adapter: ChannelAdapter
): Promise<ProcessMessageResult> {
  try {
    console.log(`[MultiChannel] Processing ${channelSlug} message from ${message.sender.id}`);

    // 1. Find organization and bot
    const orgData = await findOrganizationByChannel(
      prisma,
      channelSlug,
      'phoneNumberId', // This will need to be dynamic based on channel
      message.sender.id
    );

    if (!orgData) {
      // No integration found - try to find any enabled integration for this channel
      const anyIntegration = await prisma.integrationConfig.findFirst({
        where: {
          integration: { slug: channelSlug },
          enabled: true,
        },
        include: {
          organization: {
            include: {
              bots: {
                where: { published: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!anyIntegration?.organization?.bots?.[0]) {
        return {
          success: false,
          error: 'No bot configured for this channel',
        };
      }

      // Use found integration
      const bot = anyIntegration.organization.bots[0];
      
      // 2. Get or create conversation
      const conversationId = await getOrCreateConversation(
        prisma,
        bot.id,
        message.sender.id,
        channelSlug
      );

      // 3. Get conversation history
      const history = await getConversationHistory(prisma, conversationId);

      // 4. Save user message
      await saveMessage(prisma, conversationId, 'user', message.content, {
        channel: channelSlug,
        senderId: message.sender.id,
        senderName: message.sender.name,
      });

      // 5. Generate AI response
      const aiResponse = await generateAIResponse(
        openaiApiKey,
        bot.systemPrompt,
        history,
        message.content
      );

      // 6. Save assistant message
      await saveMessage(prisma, conversationId, 'assistant', aiResponse);

      // 7. Send response through channel
      const channelResponse: ChannelResponse = {
        content: aiResponse,
      };

      const recipientId = message.metadata?.chatId || 
                         message.metadata?.channelId || 
                         message.sender.id;

      await adapter.sendMessage(recipientId, channelResponse);

      console.log(`[MultiChannel] Response sent to ${recipientId}`);

      return {
        success: true,
        response: aiResponse,
        botId: bot.id,
        conversationId,
      };
    }

    // Use found organization data
    const { botId } = orgData;

    // Get bot details
    const bot = await prisma.bot.findFirst({
      where: { id: botId },
    });

    if (!bot) {
      return {
        success: false,
        error: 'Bot not found',
      };
    }

    // 2. Get or create conversation
    const conversationId = await getOrCreateConversation(
      prisma,
      botId,
      message.sender.id,
      channelSlug
    );

    // 3. Get conversation history
    const history = await getConversationHistory(prisma, conversationId);

    // 4. Save user message
    await saveMessage(prisma, conversationId, 'user', message.content, {
      channel: channelSlug,
      senderId: message.sender.id,
      senderName: message.sender.name,
    });

    // 5. Generate AI response
    const aiResponse = await generateAIResponse(
      openaiApiKey,
      bot.systemPrompt,
      history,
      message.content
    );

    // 6. Save assistant message
    await saveMessage(prisma, conversationId, 'assistant', aiResponse);

    // 7. Send response through channel
    const channelResponse: ChannelResponse = {
      content: aiResponse,
    };

    const recipientId = message.metadata?.chatId || 
                       message.metadata?.channelId || 
                       message.sender.id;

    await adapter.sendMessage(recipientId, channelResponse);

    console.log(`[MultiChannel] Response sent to ${recipientId}`);

    return {
      success: true,
      response: aiResponse,
      botId,
      conversationId,
    };
  } catch (error: any) {
    console.error(`[MultiChannel] Error processing message:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}
