import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error-handler';
import { chatRateLimiter } from '../middleware/rate-limiter';
import { Response, Request } from 'express';
import { prisma } from '@chatbot-studio/database';
import { AppError } from '../middleware/error-handler';

const router = Router();

/**
 * POST /api/v1/chat
 * Public endpoint for chatbot conversations
 */
router.post(
  '/',
  chatRateLimiter,
  [
    body('botId').notEmpty().withMessage('Bot ID is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('sessionId').notEmpty().withMessage('Session ID is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(
        `Validation failed: ${errors.array().map(e => e.msg).join(', ')}`,
        400
      );
    }

    const { botId, message, sessionId, metadata } = req.body;

    // Get bot
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: {
        documents: true,
        intents: true,
        faqs: true,
      },
    });

    if (!bot || !bot.published) {
      throw new AppError('Bot not found or not published', 404);
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { botId, sessionId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          botId,
          sessionId,
          source: metadata?.source || 'widget',
          metadata,
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        role: 'USER',
      },
    });

    // Simple intent matching
    let response = bot.welcomeMessage;

    for (const intent of bot.intents) {
      if (intent.enabled && intent.patterns.some((p: string) => message.toLowerCase().includes(p.toLowerCase()))) {
        response = intent.response;
        break;
      }
    }

    // FAQ matching
    for (const faq of bot.faqs) {
      if (faq.enabled && message.toLowerCase().includes(faq.question.toLowerCase())) {
        response = faq.answer;
        break;
      }
    }

    // Save bot response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: response,
        role: 'ASSISTANT',
      },
    });

    // Update analytics
    await prisma.analytics.upsert({
      where: {
        botId_date_metric: {
          botId,
          date: new Date(new Date().setHours(0, 0, 0, 0)),
          metric: 'messages',
        },
      },
      create: {
        botId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        metric: 'messages',
        value: 1,
      },
      update: {
        value: { increment: 1 },
      },
    });

    res.json({
      message: response,
      conversationId: conversation.id,
      botName: bot.name,
    });
  })
);

/**
 * GET /api/v1/chat/:botId/config
 * Get bot configuration for widget
 */
router.get('/:botId/config', asyncHandler(async (req: Request, res: Response) => {
  const { botId } = req.params;

  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: {
      id: true,
      name: true,
      avatar: true,
      welcomeMessage: true,
      color: true,
      published: true,
    },
  });

  if (!bot || !bot.published) {
    throw new AppError('Bot not found or not published', 404);
  }

  res.json(bot);
}));

export default router;
