import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
}));

router.get('/unread', asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, read: false },
  });
  res.json({ count });
}));

router.put('/:id/read', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Security: Verify notification belongs to the current user
  const notification = await prisma.notification.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.userId, // Ensure user owns the notification
    },
  });

  if (!notification) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('Notification not found', 404);
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });

  res.json(updatedNotification);
}));

router.post('/mark-all-read', asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });
  res.json({ message: 'All notifications marked as read' });
}));

export default router;
