import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '@chatbot-studio/database';

const router = Router();
router.use(authenticate);

router.get('/overview', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { botId, startDate, endDate } = req.query;
  const userId = req.user!.userId;

  // Date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Get total bots count
  const totalBots = await prisma.bot.count({
    where: { userId },
  });

  // Get bots created this month
  const botsThisMonth = await prisma.bot.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });

  // Get conversations count (current period)
  const conversationsCount = await prisma.conversation.count({
    where: {
      bot: { userId },
      ...(botId && { botId: botId as string }),
      ...(startDate && endDate && {
        createdAt: { gte: new Date(startDate as string), lte: new Date(endDate as string) },
      }),
    },
  });

  // Get conversations last month for comparison
  const conversationsLastMonth = await prisma.conversation.count({
    where: {
      bot: { userId },
      createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
  });

  // Get leads count (current period)
  const leadsCount = await prisma.lead.count({
    where: {
      conversation: { bot: { userId } },
    },
  });

  // Get leads last month for comparison
  const leadsLastMonth = await prisma.lead.count({
    where: {
      conversation: { bot: { userId } },
      createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
  });

  // Get active users count (users who sent messages in the last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const activeConversations = await prisma.conversation.findMany({
    where: {
      bot: { userId },
      messages: {
        some: {
          createdAt: { gte: thirtyDaysAgo },
          role: 'USER',
        },
      },
    },
    select: {
      id: true,
    },
  });
  const activeUsers = activeConversations.length;

  // Get active users last month for comparison
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const activeConversationsLastMonth = await prisma.conversation.findMany({
    where: {
      bot: { userId },
      messages: {
        some: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          role: 'USER',
        },
      },
    },
    select: {
      id: true,
    },
  });
  const activeUsersLastMonth = activeConversationsLastMonth.length;

  // Calculate growth percentages
  const conversationsGrowth = conversationsLastMonth > 0
    ? Math.round(((conversationsCount - conversationsLastMonth) / conversationsLastMonth) * 100)
    : 0;

  const leadsGrowth = leadsLastMonth > 0
    ? Math.round(((leadsCount - leadsLastMonth) / leadsLastMonth) * 100)
    : 0;

  const activeUsersGrowth = activeUsersLastMonth > 0
    ? Math.round(((activeUsers - activeUsersLastMonth) / activeUsersLastMonth) * 100)
    : 0;

  res.json({
    totalBots,
    botsThisMonth,
    conversations: conversationsCount,
    conversationsGrowth,
    leads: leadsCount,
    leadsGrowth,
    activeUsers,
    activeUsersGrowth,
  });
}));

router.get('/metrics', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { botId } = req.query;

  const metrics = await prisma.analytics.findMany({
    where: { bot: { userId: req.user!.userId }, ...(botId && { botId: botId as string }) },
    orderBy: { date: 'desc' },
    take: 30,
  });

  res.json(metrics);
}));

router.get('/recent-bots', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const userId = req.user!.userId;

  // Get recent bots with their last conversation time
  const recentBots = await prisma.bot.findMany({
    where: { userId },
    include: {
      conversations: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          updatedAt: true,
        },
      },
      _count: {
        select: {
          conversations: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  // Format the response
  const formattedBots = recentBots.map((bot: any) => {
    const lastActive = bot.conversations[0]?.updatedAt || bot.updatedAt;
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let lastActiveText = '';
    if (diffDays > 0) {
      lastActiveText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      lastActiveText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      lastActiveText = 'Just now';
    }

    return {
      id: bot.id,
      name: bot.name,
      description: bot.description,
      lastActive: lastActiveText,
      lastActiveDate: lastActive,
      conversationCount: bot._count.conversations,
      published: bot.published,
    };
  });

  res.json(formattedBots);
}));

export default router;
