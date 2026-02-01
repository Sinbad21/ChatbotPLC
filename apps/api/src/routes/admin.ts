import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

router.get('/users', asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { bots: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
}));

router.get('/stats', asyncHandler(async (req: AuthRequest, res: Response) => {
  const [users, bots, conversations, organizations] = await Promise.all([
    prisma.user.count(),
    prisma.bot.count(),
    prisma.conversation.count(),
    prisma.organization.count(),
  ]);

  res.json({ users, bots, conversations, organizations });
}));

router.get('/audit-logs', asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(logs);
}));

router.put('/users/:id/role', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
  });

  res.json(user);
}));

export default router;
