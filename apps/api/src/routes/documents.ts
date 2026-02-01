import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { botId } = req.query;

  if (botId && typeof botId !== 'string') {
    return res.status(400).json({ error: 'Invalid bot id' });
  }

  const documents = await prisma.document.findMany({
    where: {
      bot: { userId: req.user!.userId },
      ...(botId ? { botId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(documents);
}));

router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { botId, title, content } = req.body as { botId?: string; title?: string; content?: string };

  if (!botId || !title || !content) {
    return res.status(400).json({ error: 'botId, title and content are required' });
  }

  const bot = await prisma.bot.findFirst({
    where: { id: botId, userId: req.user!.userId },
    select: { id: true },
  });

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const document = await prisma.document.create({
    data: {
      botId,
      title,
      type: 'text/plain',
      size: Buffer.byteLength(content, 'utf8'),
      url: `manual://${botId}/${randomUUID()}`,
      content,
      status: 'COMPLETED',
      source: 'UPLOAD',
    },
  });

  res.status(201).json(document);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, bot: { userId: req.user!.userId } },
  });

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ message: 'Document deleted' });
}));

export default router;
