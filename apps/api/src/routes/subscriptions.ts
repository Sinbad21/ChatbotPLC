import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);

router.get('/plans', asyncHandler(async (req: AuthRequest, res: Response) => {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
  });
  res.json(plans);
}));

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.query;

  // Security: Verify user belongs to the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: req.user!.userId,
      organizationId: organizationId as string,
    },
  });

  if (!membership) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('You do not have permission to view this organization\'s subscription', 403);
  }

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: organizationId as string },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(subscription);
}));

router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, planId } = req.body;

  // Security: Verify user belongs to the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: req.user!.userId,
      organizationId,
    },
  });

  if (!membership) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('You do not have permission to create subscriptions for this organization', 403);
  }

  const subscription = await prisma.subscription.create({
    data: {
      organizationId,
      planId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json(subscription);
}));

router.post('/:id/cancel', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Security: Verify subscription belongs to user's organization
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      id: req.params.id,
      organization: {
        members: {
          some: { userId: req.user!.userId },
        },
      },
    },
  });

  if (!existingSubscription) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('Subscription not found', 404);
  }

  const subscription = await prisma.subscription.update({
    where: { id: req.params.id },
    data: { cancelAtPeriodEnd: true },
  });

  res.json(subscription);
}));

export default router;
