import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const integrations = await prisma.integration.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  res.json(integrations);
}));

router.get('/configured', asyncHandler(async (req: AuthRequest, res: Response) => {
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
    throw new AppError('You do not have permission to view this organization\'s integrations', 403);
  }

  const configs = await prisma.integrationConfig.findMany({
    where: { organizationId: organizationId as string },
    include: { integration: true },
  });

  res.json(configs);
}));

router.post('/configure', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, integrationId, config } = req.body;

  // Security: Verify user belongs to the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: req.user!.userId,
      organizationId,
    },
  });

  if (!membership) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('You do not have permission to configure integrations for this organization', 403);
  }

  const integrationConfig = await prisma.integrationConfig.upsert({
    where: { organizationId_integrationId: { organizationId, integrationId } },
    create: { organizationId, integrationId, config },
    update: { config },
  });

  res.status(201).json(integrationConfig);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Security: Verify integration config belongs to user's organization
  const integrationConfig = await prisma.integrationConfig.findFirst({
    where: {
      id: req.params.id,
      organization: {
        members: {
          some: { userId: req.user!.userId },
        },
      },
    },
  });

  if (!integrationConfig) {
    const { AppError } = await import('../middleware/error-handler');
    throw new AppError('Integration configuration not found', 404);
  }

  await prisma.integrationConfig.delete({ where: { id: req.params.id } });
  res.json({ message: 'Integration removed' });
}));

export default router;
