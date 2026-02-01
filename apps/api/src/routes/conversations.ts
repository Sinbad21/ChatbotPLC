import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { botId } = req.query;
  const conversations = await prisma.conversation.findMany({
    where: { bot: { userId: req.user!.userId }, ...(botId && { botId: botId as string }) },
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(conversations);
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Security: Verify conversation exists and user owns the bot
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: req.params.id,
      bot: { userId: req.user!.userId }, // Check ownership through bot
    },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!conversation) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('Conversation not found', 404);
  }

  res.json(conversation);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Security: Verify conversation exists and user owns the bot
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: req.params.id,
      bot: { userId: req.user!.userId }, // Check ownership through bot
    },
  });

  if (!conversation) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('Conversation not found', 404);
  }

  await prisma.conversation.delete({ where: { id: req.params.id } });
  res.json({ message: 'Conversation deleted' });
}));

export default router;
