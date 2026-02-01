import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { campaignId, status } = req.query;

  const leads = await prisma.lead.findMany({
    where: {
      conversation: { bot: { userId: req.user!.userId } },
      ...(campaignId && { campaignId: campaignId as string }),
      ...(status && { status: status as any }),
    },
    include: { conversation: { select: { bot: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(leads);
}));

router.get('/campaigns', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Security: Only return campaigns for organizations the user belongs to
  const userOrgs = await prisma.organizationMember.findMany({
    where: { userId: req.user!.userId },
    select: { organizationId: true },
  });

  const orgIds = userOrgs.map((m: { organizationId: string }) => m.organizationId);

  const campaigns = await prisma.leadCampaign.findMany({
    where: { organizationId: { in: orgIds } },
    include: { _count: { select: { leads: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(campaigns);
}));

router.post('/campaigns', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, name, description, creditsLimit } = req.body;

  // Security: Verify user belongs to the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: req.user!.userId,
      organizationId,
    },
  });

  if (!membership) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('You do not have permission to create campaigns for this organization', 403);
  }

  const campaign = await prisma.leadCampaign.create({
    data: { organizationId, name, description, creditsLimit: creditsLimit || 100 },
  });

  res.status(201).json(campaign);
}));

router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, score } = req.body;

  // Security: Verify lead belongs to user before updating
  const existingLead = await prisma.lead.findFirst({
    where: {
      id: req.params.id,
      conversation: { bot: { userId: req.user!.userId } },
    },
  });

  if (!existingLead) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('Lead not found', 404);
  }

  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data: { status, score },
  });

  res.json(lead);
}));

export default router;
