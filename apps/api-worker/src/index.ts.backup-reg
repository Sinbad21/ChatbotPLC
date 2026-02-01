import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerKnowledgeRoutes } from './routes/knowledge';
import { registerWebhookRoutes } from './routes/webhooks';
import { parseHTML } from 'linkedom';
import { getPrisma } from './db';
import { extractText } from 'unpdf';
import OpenAI from 'openai';

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  OPENAI_API_KEY: string;
  // WhatsApp
  WHATSAPP_API_KEY?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_WEBHOOK_TOKEN?: string;
  // Telegram
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  // Slack
  SLACK_BOT_TOKEN?: string;
  SLACK_SIGNING_SECRET?: string;
  SLACK_APP_ID?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware - robust setup with error handler
const ALLOWED_ORIGINS = [
  'https://chatbotstudio-web.gabrypiritore.workers.dev', // Frontend Worker (OpenNext)
  'https://chatbot-5o5.pages.dev',
  'https://chatbot-studio.pages.dev',
  'https://chatbot-studio-29k.pages.dev',
  'http://localhost:3000'
];

app.use('*', cors({
  origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}));

// Middleware to ensure CORS headers on ALL responses (including errors)
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || '';

  // Set CORS headers before processing the request
  if (ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    c.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Vary', 'Origin');

  // Wrap in try-catch to ensure errors are caught and CORS headers maintained
  try {
    await next();
  } catch (err: any) {
    console.error('[Middleware Error Catch]', err);

    // Ensure CORS headers are still set
    if (ALLOWED_ORIGINS.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
    } else {
      c.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
    }
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');

    return c.json({
      error: 'Internal server error',
      message: err.message || 'An unexpected error occurred'
    }, 500);
  }
});

// Global OPTIONS handler
app.options('*', (c) => c.text('', 204));

// Global error handler - ensures CORS headers are maintained even on 500 errors
app.onError((err, c) => {
  console.error('[Global Error Handler]', err);

  // Get the origin from the request
  const origin = c.req.header('Origin');

  // Set CORS headers based on the request origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to first allowed origin
    c.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }

  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Vary', 'Origin');

  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

registerKnowledgeRoutes(app as any, authMiddleware);
registerWebhookRoutes(app as any);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Chatbot Studio API'
  });
});

app.get('/debug/env', (c) => {
  return c.json({
    DATABASE_URL_exists: !!c.env.DATABASE_URL,
    DATABASE_URL_length: c.env.DATABASE_URL?.length || 0,
    DATABASE_URL_preview: c.env.DATABASE_URL?.substring(0, 20) + '...' || 'NOT_SET',
    JWT_SECRET_exists: !!c.env.JWT_SECRET,
    JWT_REFRESH_SECRET_exists: !!c.env.JWT_REFRESH_SECRET,
    all_env_keys: Object.keys(c.env)
  });
});

// Database connection health check
app.get('/api/v1/debug/db', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    
    // Test basic connection with raw query
    await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test that we can access tables
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    const botCount = await prisma.bot.count();
    const docCount = await prisma.document.count();
    
    return c.json({
      ok: true,
      database: 'connected',
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        organizations: orgCount,
        bots: botCount,
        documents: docCount,
      }
    });
  } catch (error: any) {
    console.error('[DEBUG /db] Database connection failed:', error);
    return c.json({
      ok: false,
      error: 'Database connection failed',
      code: error.code || 'UNKNOWN',
      message: error.message || String(error),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/v1/auth/register', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const { email, password, name } = await c.req.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create slug for organization
    const slugBase = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-workspace`;
    let slug = slugBase;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${counter}`;
      counter++;
    }

    // Multi-tenant: Create user + organization + membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create personal organization
      const organization = await tx.organization.create({
        data: {
          name: `${name}'s Workspace`,
          slug,
          plan: 'free',
        },
      });

      // 2. Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      // 3. Create organization membership with OWNER role
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      return { user, organization };
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: result.user.id, email: result.user.email, role: result.user.role },
      c.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: result.user.id, tokenId: result.user.id },
      c.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return c.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
      tokens: { accessToken, refreshToken },
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/v1/auth/login', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const { email, password } = await c.req.json();

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tokenId: user.id },
      c.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get current user
app.get('/api/v1/me', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    // Fetch full user details
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
      },
    });

    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      provider: userData.provider,
    });
  } catch (error: any) {
    console.error('[GET /api/v1/me] Error:', error);
    return c.json({ error: 'Failed to fetch user data' }, 500);
  }
});

// ============================================
// BOT ROUTES
// ============================================

app.get('/api/v1/bots', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    // Multi-tenant: Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization assigned' }, 403);
    }

    // Get all bots in user's organization (not just created by user)
    const bots = await prisma.bot.findMany({
      where: { organizationId: membership.organizationId },
      include: {
        _count: {
          select: {
            conversations: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(bots);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/v1/bots', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const { name, description, systemPrompt, welcomeMessage, color } = await c.req.json();

    // Multi-tenant: Get user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true, role: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization assigned' }, 403);
    }

    // Create bot with auto-propagated organizationId
    const bot = await prisma.bot.create({
      data: {
        name,
        description,
        organizationId: membership.organizationId, // Auto-propagated from user
        userId: user.userId,
        systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
        welcomeMessage: welcomeMessage || 'Hello! How can I help you?',
        color: color || '#6366f1',
      },
    });

    return c.json(bot, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/v1/bots/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const id = c.req.param('id');

    const bot = await prisma.bot.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            documents: true,
            intents: true,
            faqs: true,
          },
        },
      },
    });

    if (!bot) {
      return c.json({ error: 'Bot not found' }, 404);
    }

    return c.json(bot);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.patch('/api/v1/bots/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const id = c.req.param('id');
    const updates = await c.req.json();

    // Verify user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    // Verify bot belongs to user's organization
    const existingBot = await prisma.bot.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });

    if (!existingBot) {
      return c.json({ error: 'Bot not found' }, 404);
    }

    if (existingBot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Update bot
    const bot = await prisma.bot.update({
      where: { id },
      data: updates,
    });

    return c.json(bot);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/api/v1/bots/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const id = c.req.param('id');

    // Verify user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    // Verify bot belongs to user's organization
    const existingBot = await prisma.bot.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });

    if (!existingBot) {
      return c.json({ error: 'Bot not found' }, 404);
    }

    if (existingBot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Delete bot (cascade will handle related records)
    await prisma.bot.delete({
      where: { id },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Logo upload endpoint
app.post('/api/v1/bots/:id/logo', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const id = c.req.param('id');

    // Verify user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    // Verify bot belongs to user's organization
    const existingBot = await prisma.bot.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });

    if (!existingBot) {
      return c.json({ error: 'Bot not found' }, 404);
    }

    if (existingBot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Parse FormData
    const formData = await c.req.formData();
    const logoFile = formData.get('logo');

    if (!logoFile || !(logoFile instanceof File)) {
      return c.json({ error: 'No logo file provided' }, 400);
    }

    // Validate file type
    if (!logoFile.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400);
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (logoFile.size > maxSize) {
      return c.json({ error: 'File size must be less than 2MB' }, 400);
    }

    // Convert to base64 data URL
    const arrayBuffer = await logoFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Convert Uint8Array to base64
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${logoFile.type};base64,${base64}`;

    // Update bot with logo URL
    const updatedBot = await prisma.bot.update({
      where: { id },
      data: { logoUrl: dataUrl },
    });

    return c.json({
      success: true,
      logoUrl: updatedBot.logoUrl,
    });
  } catch (error: any) {
    console.error('[POST /bots/:id/logo] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get bot usage analytics
app.get('/api/v1/bots/:id/usage', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('id');
    const from = c.req.query('from');
    const to = c.req.query('to');

    // Verify bot access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    // Build date filter
    const dateFilter: any = {};
    if (from) {
      dateFilter.gte = new Date(from);
    }
    if (to) {
      dateFilter.lte = new Date(to);
    }

    const whereClause: any = { botId };
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    // Fetch usage logs
    const usageLogs = await prisma.usageLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by model
    const byModel: Record<string, {
      model: string;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      cost: number;
    }> = {};

    usageLogs.forEach(log => {
      if (!byModel[log.model]) {
        byModel[log.model] = {
          model: log.model,
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        };
      }

      byModel[log.model].requests += 1;
      byModel[log.model].inputTokens += log.inputTokens;
      byModel[log.model].outputTokens += log.outputTokens;
      byModel[log.model].cost += log.cost;
    });

    // Prepare time series data (group by date)
    const byDate: Record<string, {
      date: string;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      cost: number;
    }> = {};

    usageLogs.forEach(log => {
      const dateKey = log.createdAt.toISOString().split('T')[0];

      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          date: dateKey,
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        };
      }

      byDate[dateKey].requests += 1;
      byDate[dateKey].inputTokens += log.inputTokens;
      byDate[dateKey].outputTokens += log.outputTokens;
      byDate[dateKey].cost += log.cost;
    });

    return c.json({
      byModel: Object.values(byModel),
      byDate: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
      total: {
        requests: usageLogs.length,
        inputTokens: usageLogs.reduce((sum, log) => sum + log.inputTokens, 0),
        outputTokens: usageLogs.reduce((sum, log) => sum + log.outputTokens, 0),
        cost: usageLogs.reduce((sum, log) => sum + log.cost, 0),
      },
    });
  } catch (error: any) {
    console.error('[GET /bots/:id/usage] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// DOCUMENTS ROUTES
// ============================================

app.get('/api/v1/bots/:botId/documents', authMiddleware, async (c) => {
  try {
    console.log('[GET /documents] Starting request');
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');

    console.log('[GET /documents] Request details:', {
      userId: user?.userId,
      botId,
    });

    // Verify user has organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true, role: true },
    });

    console.log('[GET /documents] User membership:', {
      found: !!membership,
      organizationId: membership?.organizationId || 'NULL',
      role: membership?.role || 'NULL',
    });

    if (!membership || !membership.organizationId) {
      console.log('[GET /documents] ⚠️  User has no organization - returning empty array');
      // Return empty array instead of error to allow UI to load
      return c.json([], 200);
    }

    // Verify bot exists and user has access
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { id: true, organizationId: true, name: true },
    });

    console.log('[GET /documents] Bot details:', {
      found: !!bot,
      organizationId: bot?.organizationId || 'NULL',
      name: bot?.name || 'NULL',
    });

    if (!bot) {
      console.log('[GET /documents] ❌ Bot not found');
      return c.json({ error: 'Bot not found' }, 404);
    }

    if (!bot.organizationId) {
      console.log('[GET /documents] ❌ Bot has no organizationId - database inconsistency!');
      return c.json({
        error: 'Bot configuration error',
        message: 'This bot is not associated with any organization',
        code: 'BOT_NO_ORGANIZATION'
      }, 500);
    }

    if (bot.organizationId !== membership.organizationId) {
      console.log('[GET /documents] ❌ Organization mismatch:', {
        botOrg: bot.organizationId,
        userOrg: membership.organizationId,
      });
      return c.json({
        error: 'Access denied',
        message: 'This bot belongs to a different organization',
        code: 'ORGANIZATION_MISMATCH'
      }, 403);
    }

    console.log('[GET /documents] ✅ Tenant check passed - fetching documents...');

    // Fetch documents
    const documents = await prisma.document.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        size: true,
        url: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('[GET /documents] ✅ Found documents:', documents.length);

    // Transform documents to match frontend interface
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.title,
      content: doc.content,
      status: doc.status.toLowerCase(),
      createdAt: doc.createdAt,
    }));

    return c.json(transformedDocuments);
  } catch (error: any) {
    console.error('[GET /documents] ❌ EXCEPTION:', error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[GET /documents] Prisma error code:', error.code);
      console.error('[GET /documents] Prisma meta:', error.meta);

      if (error.code === 'P2025') {
        // Record not found
        console.error('[GET /documents] Record not found');
        return c.json([], 200); // Return empty array for not found
      }

      if (error.code === 'P2021') {
        // Table does not exist
        console.error('[GET /documents] Table does not exist - migration needed!');
        return c.json({
          error: 'Database not initialized',
          message: 'Documents table does not exist. Run: npx prisma migrate deploy',
          code: 'TABLE_NOT_FOUND',
          prismaCode: error.code,
        }, 500);
      }

      // Other Prisma errors
      console.error('[GET /documents] Unhandled Prisma error');
      return c.json({
        error: 'Database error',
        message: error.message,
        code: 'PRISMA_ERROR',
        prismaCode: error.code,
      }, 500);
    }

    // Generic errors
    console.error('[GET /documents] Generic error:', error.message);
    console.error('[GET /documents] Stack:', error.stack);
    return c.json({
      error: 'Internal server error',
      message: error.message,
      details: c.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
});

app.post('/api/v1/bots/:botId/documents', authMiddleware, async (c) => {
  try {
    console.log('[POST /documents] Starting request');
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');

    // Parse and validate request body
    let body;
    try {
      body = await c.req.json();
    } catch {
      console.log('[POST /documents] Failed to parse JSON body');
      return c.json({ error: 'Invalid JSON in request body' }, 400);
    }

    const { title, content, url, metadata } = body;

    console.log('[POST /documents] Request details:', {
      userId: user?.userId,
      botId,
      titleLength: title?.length,
      contentLength: content?.length,
      url,
    });

    // Validate required fields
    if (!title || typeof title !== 'string') {
      console.log('[POST /documents] Invalid title field');
      return c.json({ error: 'title is required and must be a string' }, 422);
    }

    if (!content || typeof content !== 'string') {
      console.log('[POST /documents] Invalid content field');
      return c.json({ error: 'content is required and must be a string' }, 422);
    }

    // Validate field lengths
    const MAX_TITLE_LENGTH = 200;
    const MAX_CONTENT_LENGTH = 200000; // ~200KB

    if (title.length > MAX_TITLE_LENGTH) {
      console.log('[POST /documents] Title too long:', title.length);
      return c.json({
        error: 'Document title too long',
        message: `Title must be less than ${MAX_TITLE_LENGTH} characters`
      }, 422);
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      console.log('[POST /documents] Content too large:', content.length);
      return c.json({
        error: 'Document content too large',
        message: `Content must be less than ${MAX_CONTENT_LENGTH} characters (~200KB)`
      }, 413);
    }

    if (title.trim().length === 0) {
      console.log('[POST /documents] Title is empty after trim');
      return c.json({ error: 'Document title cannot be empty' }, 400);
    }

    if (content.trim().length === 0) {
      console.log('[POST /documents] Content is empty after trim');
      return c.json({ error: 'Document content cannot be empty' }, 400);
    }

    // Verify user has organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true, role: true },
    });

    console.log('[POST /documents] User membership:', {
      found: !!membership,
      organizationId: membership?.organizationId || 'NULL',
      role: membership?.role || 'NULL',
    });

    if (!membership || !membership.organizationId) {
      console.log('[POST /documents] ❌ User has no organization - needs onboarding');
      return c.json({
        error: 'User not associated with any organization',
        message: 'Please run the multi-tenant fix script: npm run db:fix-multi-tenant',
        code: 'NO_ORGANIZATION'
      }, 403);
    }

    // Verify bot exists and user has access
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { id: true, organizationId: true, name: true },
    });

    console.log('[POST /documents] Bot details:', {
      found: !!bot,
      organizationId: bot?.organizationId || 'NULL',
      name: bot?.name || 'NULL',
    });

    if (!bot) {
      console.log('[POST /documents] ❌ Bot not found');
      return c.json({ error: 'Bot not found' }, 404);
    }

    if (!bot.organizationId) {
      console.log('[POST /documents] ❌ Bot has no organizationId - database inconsistency!');
      return c.json({
        error: 'Bot configuration error',
        message: 'This bot is not associated with any organization. Please run: npm run db:fix-multi-tenant',
        code: 'BOT_NO_ORGANIZATION'
      }, 500);
    }

    if (bot.organizationId !== membership.organizationId) {
      console.log('[POST /documents] ❌ Organization mismatch:', {
        botOrg: bot.organizationId,
        userOrg: membership.organizationId,
      });
      return c.json({
        error: 'Access denied',
        message: 'This bot belongs to a different organization',
        code: 'ORGANIZATION_MISMATCH'
      }, 403);
    }

    console.log('[POST /documents] ✅ Tenant check passed - creating document...');
    console.log('[POST /documents] Final validation:', {
      userOrg: membership.organizationId,
      botOrg: bot.organizationId,
      match: membership.organizationId === bot.organizationId,
    });

    // Determine document type from URL or content
    const documentType = url ? 'url' : 'text';

    const document = await prisma.document.create({
      data: {
        botId,
        title: title.trim(),
        content: content.trim(),
        type: documentType,
        size: content.trim().length,
        url: url || '',
        status: 'COMPLETED',
      },
    });

    console.log('[POST /documents] ✅ Document created successfully:', document.id);

    // Transform document to match frontend interface
    const transformedDocument = {
      id: document.id,
      name: document.title,
      title: document.title,
      content: document.content,
      url: document.url,
      type: document.type,
      status: document.status.toLowerCase(),
      createdAt: document.createdAt,
      metadata: metadata || {},
    };

    return c.json(transformedDocument, 201);
  } catch (error: any) {
    console.error('[POST /documents] ❌ EXCEPTION:', error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[POST /documents] Prisma error code:', error.code);
      console.error('[POST /documents] Prisma meta:', error.meta);

      if (error.code === 'P2003') {
        // Foreign key constraint failed
        console.error('[POST /documents] Foreign key constraint violation - likely organizationId mismatch');
        return c.json({
          error: 'Database constraint violation',
          message: 'Foreign key/tenant mismatch. Please run: npm run db:fix-multi-tenant',
          code: 'FK_CONSTRAINT',
          prismaCode: error.code,
        }, 409);
      }

      if (error.code === 'P2025') {
        // Record not found
        console.error('[POST /documents] Record not found in database');
        return c.json({
          error: 'Record not found',
          message: 'The referenced record does not exist',
          code: 'NOT_FOUND',
          prismaCode: error.code,
        }, 404);
      }

      if (error.code === 'P2002') {
        // Unique constraint violation
        console.error('[POST /documents] Unique constraint violation');
        return c.json({
          error: 'Duplicate record',
          message: 'A record with this data already exists',
          code: 'DUPLICATE',
          prismaCode: error.code,
        }, 409);
      }

      // Other Prisma errors
      console.error('[POST /documents] Unhandled Prisma error');
      return c.json({
        error: 'Database error',
        message: error.message,
        code: 'PRISMA_ERROR',
        prismaCode: error.code,
      }, 500);
    }

    // Generic errors
    console.error('[POST /documents] Generic error:', error.message);
    console.error('[POST /documents] Stack:', error.stack);
    return c.json({
      error: 'Internal server error',
      message: error.message,
      details: c.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
});

app.delete('/api/v1/documents/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const id = c.req.param('id');

    // Get document with bot organization
    const document = await prisma.document.findUnique({
      where: { id },
      include: { bot: { select: { organizationId: true } } },
    });

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Verify user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership || document.bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await prisma.document.delete({ where: { id } });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Update document (e.g., toggle excluded field)
app.patch('/api/v1/documents/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const id = c.req.param('id');
    const { excluded } = await c.req.json();

    // Get document with bot organization
    const document = await prisma.document.findUnique({
      where: { id },
      include: { bot: { select: { organizationId: true } } },
    });

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Verify user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership || document.bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Update document
    const updated = await prisma.document.update({
      where: { id },
      data: { excluded: excluded ?? document.excluded },
    });

    return c.json({ success: true, document: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// File upload endpoint - supports PDF, TXT, MD (max 25MB)
app.post('/api/v1/bots/:botId/documents/upload', authMiddleware, async (c) => {
  const MAX_UPLOAD_MB = 25;
  const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');

    console.log('[POST /documents/upload] Starting file upload');

    // Verify user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    // Verify bot belongs to user's organization
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { id: true, name: true, organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    // Parse FormData
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_BYTES) {
      return c.json({
        error: 'File too large',
        message: `File size must be less than ${MAX_UPLOAD_MB}MB`,
        maxSize: MAX_UPLOAD_MB
      }, 413);
    }

    // Validate MIME type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|md)$/i)) {
      return c.json({
        error: 'Invalid file type',
        message: 'Only PDF, TXT, and MD files are supported',
        allowedTypes: ['pdf', 'txt', 'md']
      }, 400);
    }

    console.log('[POST /documents/upload] File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Extract text content based on file type
    let content = '';
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (fileExtension === 'txt' || fileExtension === 'md' || file.type.startsWith('text/')) {
      // Text files - read directly
      content = await file.text();
    } else if (fileExtension === 'pdf' || file.type === 'application/pdf') {
      // PDF text extraction using unpdf
      console.log('[POST /documents/upload] Extracting text from PDF...');

      try {
        const arrayBuffer = await file.arrayBuffer();

        // Validate PDF header
        const bytes = new Uint8Array(arrayBuffer);
        const header = String.fromCharCode.apply(null, Array.from(bytes.slice(0, 5)));

        if (!header.startsWith('%PDF')) {
          return c.json({
            error: 'Invalid PDF',
            message: 'File does not appear to be a valid PDF document'
          }, 400);
        }

        // Extract text using unpdf
        const extracted = await extractText(arrayBuffer, { mergePages: true });
        content = extracted.text;

        console.log('[POST /documents/upload] PDF text extracted:', {
          fileName: file.name,
          textLength: content.length,
          pages: extracted.totalPages || 'unknown'
        });

        // If no text extracted, provide helpful message
        if (!content || content.trim().length === 0) {
          content = `[PDF Document: ${file.name}]

This PDF appears to contain no extractable text. This can happen when:
- The PDF contains only images or scanned documents (requires OCR)
- The PDF is encrypted or password-protected
- The PDF uses unsupported fonts or encoding

Consider using a text-based PDF or converting images to text first.`;

          console.log('[POST /documents/upload] ⚠️ No text extracted from PDF');
        }
      } catch (pdfError: any) {
        console.error('[POST /documents/upload] PDF extraction failed:', pdfError);

        return c.json({
          error: 'PDF extraction failed',
          message: pdfError.message || 'Failed to extract text from PDF. The file may be corrupted or encrypted.',
          details: 'Try converting the PDF to a text file or ensure it contains selectable text.'
        }, 400);
      }
    }

    if (!content || content.trim().length === 0) {
      return c.json({
        error: 'Empty file',
        message: 'File appears to be empty or contains no extractable text'
      }, 400);
    }

    // Create document with UPLOAD source
    const document = await prisma.document.create({
      data: {
        botId,
        title: file.name,
        content: content.trim(),
        type: fileExtension,
        size: file.size,
        url: '', // No URL for uploaded files
        status: 'COMPLETED',
        source: 'UPLOAD',
        excluded: false,
      },
    });

    console.log('[POST /documents/upload] ✅ Document created:', document.id);

    return c.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        size: document.size,
        source: document.source,
        createdAt: document.createdAt,
      }
    }, 201);

  } catch (error: any) {
    console.error('[POST /documents/upload] Error:', error);
    return c.json({
      error: 'Upload failed',
      message: error.message || 'Failed to upload file',
    }, 500);
  }
});

// ============================================
// WEB SCRAPING ROUTE
// ============================================

app.post('/api/v1/bots/:botId/scrape', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');
    const { url } = await c.req.json();

    console.log('🌐 [SCRAPE] Request:', { botId, url });

    // Validate URL
    if (!url || typeof url !== 'string') {
      return c.json({ error: 'URL is required' }, 400);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    // Filter out invalid URLs
    if (url.includes('#')) {
      return c.json({ error: 'URLs with anchors (#) are not allowed' }, 400);
    }

    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
      return c.json({ error: 'Invalid URL scheme' }, 400);
    }

    // Filter out common file extensions
    const fileExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.zip', '.rar', '.tar', '.gz', '.mp4', '.avi', '.mov', '.mp3', '.wav', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    if (fileExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
      return c.json({ error: 'File downloads are not allowed, only HTML pages' }, 400);
    }

    // Verify bot access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    console.log('🌐 [SCRAPE] Fetching URL:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatbotStudio/1.0; +https://chatbotstudio.com)',
      },
    });

    if (!response.ok) {
      return c.json({
        error: 'Failed to fetch URL',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }, 502);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return c.json({
        error: 'Invalid content type',
        message: 'URL must point to an HTML page',
      }, 400);
    }

    const html = await response.text();

    // Simple text extraction from HTML
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Limit content to 50,000 characters
    if (text.length > 50000) {
      text = text.substring(0, 50000) + '... [Content truncated]';
    }

    if (text.length < 50) {
      return c.json({
        error: 'Insufficient content',
        message: 'Could not extract enough text from the webpage',
      }, 400);
    }

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const pageTitle = titleMatch
      ? titleMatch[1].replace(/\s+/g, ' ').trim()
      : parsedUrl.hostname;

    // Create document from scraped content
    const document = await prisma.document.create({
      data: {
        botId,
        title: `${pageTitle.substring(0, 190)} [Web]`,
        content: text,
        type: 'web',
        size: text.length,
        url: url,
        status: 'COMPLETED',
      },
    });

    console.log('✅ [SCRAPE] Document created:', document.id);

    return c.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        url: document.url,
        size: document.size,
      },
    });
  } catch (error: any) {
    console.error('❌ [SCRAPE] Error:', error);
    return c.json({
      error: 'Scraping failed',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// ============================================
// CRAWLER UTILITIES
// ============================================

interface RobotsRules {
  sitemaps: string[];
  disallowedPaths: string[];
}

const parseRobotsTxt = (robotsTxt: string): RobotsRules => {
  const lines = robotsTxt.split('\n');
  const sitemaps: string[] = [];
  const disallowedPaths: string[] = [];
  let relevantUserAgent = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for sitemap
    if (trimmed.toLowerCase().startsWith('sitemap:')) {
      const sitemap = trimmed.substring(8).trim();
      if (sitemap) sitemaps.push(sitemap);
      continue;
    }

    // Check for user-agent
    if (trimmed.toLowerCase().startsWith('user-agent:')) {
      const agent = trimmed.substring(11).trim();
      relevantUserAgent = agent === '*' || agent.toLowerCase().includes('chatbotstudio');
      continue;
    }

    // Check for disallow rules (only for relevant user-agent)
    if (relevantUserAgent && trimmed.toLowerCase().startsWith('disallow:')) {
      const path = trimmed.substring(9).trim();
      if (path && path !== '/') {
        disallowedPaths.push(path);
      }
    }
  }

  return { sitemaps, disallowedPaths };
};

const isUrlAllowed = (url: string, disallowedPaths: string[]): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    for (const disallowed of disallowedPaths) {
      if (pathname.startsWith(disallowed)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
};

const crawlWebsite = async (
  startUrl: string,
  origin: string,
  disallowedPaths: string[],
  maxPages: number = 2000,
  concurrency: number = 5
): Promise<Set<string>> => {
  const discovered = new Set<string>([startUrl]);
  const visited = new Set<string>();
  const queue: string[] = [startUrl];

  while (queue.length > 0 && visited.size < maxPages) {
    const batch = queue.splice(0, concurrency);

    const results = await Promise.allSettled(
      batch.map(async (url) => {
        if (visited.has(url)) return [];
        visited.add(url);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChatbotStudio/1.0)' },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) return [];

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) return [];

          const html = await response.text();
          const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
          const foundLinks: string[] = [];

          for (const match of linkMatches) {
            let linkUrl = match[1].trim();

            if (linkUrl.startsWith('#') || linkUrl.startsWith('mailto:') ||
                linkUrl.startsWith('tel:') || linkUrl.startsWith('javascript:')) {
              continue;
            }

            if (linkUrl.startsWith('/')) {
              linkUrl = `${origin}${linkUrl}`;
            } else if (!linkUrl.startsWith('http')) {
              try {
                linkUrl = new URL(linkUrl, url).href;
              } catch {
                continue;
              }
            }

            if (linkUrl.startsWith(origin) && !linkUrl.includes('#')) {
              if (isUrlAllowed(linkUrl, disallowedPaths)) {
                foundLinks.push(linkUrl);
              }
            }
          }

          return foundLinks;
        } catch {
          return [];
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const link of result.value) {
          if (!discovered.has(link) && discovered.size < maxPages) {
            discovered.add(link);
            queue.push(link);
          }
        }
      }
    }

    if (visited.size % 50 === 0) {
      console.log(`🔍 [CRAWLER] Progress: ${visited.size} visited, ${discovered.size} discovered`);
    }
  }

  return discovered;
};

// Discover links from sitemap or full crawl
app.post('/api/v1/bots/:botId/discover-links', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');
    const { url: baseUrl } = await c.req.json();

    console.log('🔍 [DISCOVER] Request:', { botId, baseUrl });

    // Validate URL
    if (!baseUrl || typeof baseUrl !== 'string') {
      return c.json({ error: 'URL is required' }, 400);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(baseUrl);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    // Verify bot access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    const origin = parsedUrl.origin;
    let discoveredUrls: Set<string> = new Set();
    let robotsRules: RobotsRules = { sitemaps: [], disallowedPaths: [] };

    // Fetch and parse robots.txt
    console.log('🔍 [DISCOVER] Fetching robots.txt');
    try {
      const robotsResponse = await fetch(`${origin}/robots.txt`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChatbotStudio/1.0)' },
      });

      if (robotsResponse.ok) {
        const robotsTxt = await robotsResponse.text();
        robotsRules = parseRobotsTxt(robotsTxt);
        console.log('✅ [DISCOVER] Parsed robots.txt:', {
          sitemaps: robotsRules.sitemaps.length,
          disallowedPaths: robotsRules.disallowedPaths.length,
        });
      }
    } catch (err) {
      console.log('⚠️ [DISCOVER] Failed to fetch robots.txt:', err);
    }

    // Try to find sitemap
    const sitemapsToTry = [
      ...robotsRules.sitemaps,
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap-index.xml`,
    ];

    let foundSitemap = false;

    for (const sitemapUrl of sitemapsToTry) {
      try {
        console.log('🔍 [DISCOVER] Trying sitemap:', sitemapUrl);
        const response = await fetch(sitemapUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChatbotStudio/1.0)' },
        });

        if (response.ok) {
          const sitemapXml = await response.text();
          const urlMatches = sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g);

          for (const match of urlMatches) {
            const url = match[1].trim();
            if (url.startsWith(origin) && !url.includes('#')) {
              if (isUrlAllowed(url, robotsRules.disallowedPaths)) {
                discoveredUrls.add(url);
              }
            }
          }

          if (discoveredUrls.size > 0) {
            foundSitemap = true;
            console.log(`✅ [DISCOVER] Found sitemap with ${discoveredUrls.size} URLs`);
            break; // Use ONLY sitemap URLs as per requirements
          }
        }
      } catch (err) {
        console.log('⚠️ [DISCOVER] Failed to fetch sitemap:', err);
      }
    }

    // If NO sitemap found, do full crawl
    if (!foundSitemap) {
      console.log('🔍 [DISCOVER] No sitemap found, starting full crawl (max 2000 pages)');
      discoveredUrls = await crawlWebsite(
        baseUrl,
        origin,
        robotsRules.disallowedPaths,
        2000, // maxPages
        5     // concurrency
      );
      console.log(`✅ [DISCOVER] Crawl complete: ${discoveredUrls.size} URLs discovered`);
    }

    // Convert to array and return (preview will be fetched on-demand)
    const links = Array.from(discoveredUrls)
      .slice(0, 2000)
      .map(url => ({
        url,
        title: '', // Empty - will be fetched on-demand
        snippet: '', // Empty - will be fetched on-demand
      }));

    console.log(`✅ [DISCOVER] Returning ${links.length} links`);

    return c.json({
      success: true,
      count: links.length,
      links,
      strategy: foundSitemap ? 'sitemap' : 'crawl',
    });
  } catch (error: any) {
    console.error('❌ [DISCOVER] Error:', error);
    return c.json({
      error: 'Discovery failed',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// ============================================
// INTENTS ROUTES
// ============================================

app.get('/api/v1/bots/:botId/intents', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');

    // Verify bot access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    const intents = await prisma.intent.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(intents);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/v1/bots/:botId/intents', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');
    const { name, patterns, response, enabled = true } = await c.req.json();

    // Verify bot access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    const intent = await prisma.intent.create({
      data: {
        botId,
        name,
        patterns,
        response,
        enabled,
      },
    });

    return c.json(intent, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/api/v1/intents/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const id = c.req.param('id');

    // Get intent with bot organization
    const intent = await prisma.intent.findUnique({
      where: { id },
      include: { bot: { select: { organizationId: true } } },
    });

    if (!intent) {
      return c.json({ error: 'Intent not found' }, 404);
    }

    // Verify user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership || intent.bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await prisma.intent.delete({ where: { id } });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// FAQs ROUTES
// ============================================

app.get('/api/v1/bots/:botId/faqs', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');

    // Verify bot access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    const faqs = await prisma.fAQ.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(faqs);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/v1/bots/:botId/faqs', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const botId = c.req.param('botId');
    const { question, answer, category, enabled = true } = await c.req.json();

    // Verify bot access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership) {
      return c.json({ error: 'User has no organization' }, 403);
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { organizationId: true },
    });

    if (!bot || bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Bot not found or access denied' }, 404);
    }

    const faq = await prisma.fAQ.create({
      data: {
        botId,
        question,
        answer,
        category,
        enabled,
      },
    });

    return c.json(faq, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/api/v1/faqs/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const id = c.req.param('id');

    // Get FAQ with bot organization
    const faq = await prisma.fAQ.findUnique({
      where: { id },
      include: { bot: { select: { organizationId: true } } },
    });

    if (!faq) {
      return c.json({ error: 'FAQ not found' }, 404);
    }

    // Verify user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    if (!membership || faq.bot.organizationId !== membership.organizationId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await prisma.fAQ.delete({ where: { id } });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// CHAT ROUTES (PUBLIC)
// ============================================

app.post('/api/v1/chat', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const { botId, message, sessionId, metadata } = await c.req.json();

    // Validate required fields
    if (!botId || !message) {
      return c.json({ error: 'botId and message are required' }, 400);
    }

    console.log('💬 [CHAT] Request:', { botId, message, sessionId });

    // Get bot with documents
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: {
        documents: {
          where: { status: 'COMPLETED' },
          select: { title: true, content: true }
        },
        intents: { where: { enabled: true } },
        faqs: { where: { enabled: true } }
      },
    });

    if (!bot || !bot.published) {
      return c.json({ error: 'Bot not found or not published' }, 404);
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { botId, sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10  // Last 10 messages for context
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          botId,
          sessionId,
          source: metadata?.source || 'widget',
          metadata,
        },
        include: { messages: true }
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

    // Build context from documents
    let documentsContext = '';
    if (bot.documents.length > 0) {
      documentsContext = '\n\n# Knowledge Base\n\n';
      for (const doc of bot.documents) {
        documentsContext += `## ${doc.title}\n\n${doc.content}\n\n`;
      }
    }

    // Build context from intents
    let intentsContext = '';
    if (bot.intents.length > 0) {
      intentsContext = '\n\n# Intents\n\n';
      for (const intent of bot.intents) {
        intentsContext += `- ${intent.name}: ${intent.response}\n`;
      }
    }

    // Build context from FAQs
    let faqsContext = '';
    if (bot.faqs.length > 0) {
      faqsContext = '\n\n# Frequently Asked Questions\n\n';
      for (const faq of bot.faqs) {
        faqsContext += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
      }
    }

    // Build conversation history
    const conversationHistory = conversation.messages
      .reverse()
      .map((msg: any) => ({
        role: msg.role === 'USER' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Build system prompt
    const systemPrompt = `${bot.systemPrompt}${documentsContext}${intentsContext}${faqsContext}

You are ${bot.name}, an AI assistant. Use the knowledge base, intents, and FAQs provided above to answer questions accurately and concisely.

Important guidelines:
- Give direct, brief answers (2-3 sentences max when possible)
- If you need more information to give a good answer, ask a specific clarifying question
- If the information is not in the knowledge base, use your general knowledge but indicate that
- Be conversational and helpful`;

    // Use bot's configured model, fallback to gpt-5-mini
    const modelToUse = bot.model || 'gpt-5-mini';
    console.log(`🤖 [CHAT] Calling OpenAI with model: ${modelToUse}`);

    // Prepare request body
    const requestBody: any = {
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
    };

    // For GPT-5 models, use max_completion_tokens instead of max_tokens
    if (modelToUse.startsWith('gpt-5')) {
      requestBody.max_completion_tokens = 2048;
    } else if (modelToUse.startsWith('gpt-4')) {
      requestBody.max_tokens = 2048;
    }

    // Call OpenAI API directly using fetch (Workers-compatible)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('❌ [CHAT] OpenAI API Error:', errorData);

      // Check if it's a bad request error (invalid parameters, etc.)
      const isBadRequest = errorData.error?.type === 'invalid_request_error' ||
                           errorData.error?.code === 'unsupported_parameter';

      return c.json({
        error: 'OpenAI API error',
        message: errorData.error?.message || 'Unknown OpenAI error',
        details: errorData.error
      }, isBadRequest ? 400 : 502);
    }

    const completion = await openaiResponse.json();
    const response = completion.choices?.[0]?.message?.content || bot.welcomeMessage;

    console.log('✅ [CHAT] GPT-5 Response received');

    // Extract usage data
    const usage = completion.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;

    // Calculate cost based on model pricing (per 1M tokens)
    // Pricing map: https://openai.com/pricing
    const modelPricing: Record<string, { input: number; output: number }> = {
      'gpt-5-mini': { input: 0.15, output: 0.60 }, // $0.15 / $0.60 per 1M tokens
      'gpt-4o': { input: 2.50, output: 10.00 },
      'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
      'llama-3.1-70B': { input: 0.90, output: 0.90 },
    };

    const modelUsed = bot.model || 'gpt-5-mini';
    const pricing = modelPricing[modelUsed] || modelPricing['gpt-5-mini'];
    const cost = (inputTokens / 1000000) * pricing.input + (outputTokens / 1000000) * pricing.output;

    // Log usage
    try {
      await prisma.usageLog.create({
        data: {
          botId,
          model: modelUsed,
          inputTokens,
          outputTokens,
          cost,
        },
      });
      console.log(`📊 [USAGE] Logged: ${inputTokens} in, ${outputTokens} out, $${cost.toFixed(6)}`);
    } catch (usageError) {
      console.error('⚠️ [USAGE] Failed to log usage:', usageError);
      // Don't fail the request if usage logging fails
    }

    // Save bot response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: response,
        role: 'ASSISTANT',
      },
    });

    return c.json({
      message: response,
      conversationId: conversation.id,
      botName: bot.name,
    });
  } catch (error: any) {
    console.error('❌ [CHAT] Error:', {
      error: error.message,
      code: error.code,
      meta: error.meta,
      botId,
      sessionId,
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return c.json({
          error: 'Database constraint violation',
          message: 'Bot not found or database FK constraint error',
          prismaCode: error.code,
        }, 409);
      }
      if (error.code === 'P2025') {
        return c.json({
          error: 'Record not found',
          message: 'Bot not found',
          prismaCode: error.code,
        }, 404);
      }
      if (error.code === 'P2002') {
        return c.json({
          error: 'Unique constraint violation',
          message: 'Conversation already exists',
          prismaCode: error.code,
        }, 409);
      }
      if (error.code === 'P2011') {
        return c.json({
          error: 'Database error',
          message: `Null constraint violation on the fields: (${error.meta?.target})`,
          prismaCode: error.code,
        }, 400);
      }
      if (error.code === 'P2022') {
        return c.json({
          error: 'Database error',
          message: `The column \`${error.meta?.column}\` does not exist in the current database.`,
          prismaCode: error.code,
        }, 500);
      }
      if (error.code === 'P2021') {
        return c.json({
          error: 'Database error',
          message: `The table \`${error.meta?.table}\` does not exist in the current database.`,
          prismaCode: error.code,
        }, 500);
      }

      return c.json({
        error: 'Database error',
        message: error.message,
        prismaCode: error.code,
      }, 500);
    }

    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/v1/chat/:botId/config', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const botId = c.req.param('botId');

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
      return c.json({ error: 'Bot not found or not published' }, 404);
    }

    return c.json(bot);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

app.get('/api/v1/analytics/overview', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    // Date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get total bots count
    const totalBots = await prisma.bot.count({
      where: { userId: user.userId },
    });

    // Get bots created this month
    const botsThisMonth = await prisma.bot.count({
      where: {
        userId: user.userId,
        createdAt: { gte: startOfMonth },
      },
    });

    // Get conversations count (current month)
    const conversationsCount = await prisma.conversation.count({
      where: {
        bot: { userId: user.userId },
        createdAt: { gte: startOfMonth },
      },
    });

    // Get conversations last month for comparison
    const conversationsLastMonth = await prisma.conversation.count({
      where: {
        bot: { userId: user.userId },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    // Get leads count (current month)
    const leadsCount = await prisma.lead.count({
      where: {
        conversation: { bot: { userId: user.userId } },
        createdAt: { gte: startOfMonth },
      },
    });

    // Get leads last month for comparison
    const leadsLastMonth = await prisma.lead.count({
      where: {
        conversation: { bot: { userId: user.userId } },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    // Get active users count (users who sent messages in the last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeConversations = await prisma.conversation.findMany({
      where: {
        bot: { userId: user.userId },
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
        bot: { userId: user.userId },
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

    return c.json({
      totalBots,
      botsThisMonth,
      conversations: conversationsCount,
      conversationsGrowth,
      leads: leadsCount,
      leadsGrowth,
      activeUsers,
      activeUsersGrowth,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get conversations over time (for line chart)
app.get('/api/v1/analytics/conversations-over-time', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const range = c.req.query('range') || '30d';

    // Calculate date range
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get conversations grouped by date
    const conversations = await prisma.conversation.findMany({
      where: {
        bot: { userId: user.userId },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const dataMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dataMap.set(dateStr, 0);
    }

    conversations.forEach(conv => {
      const dateStr = conv.createdAt.toISOString().split('T')[0];
      const current = dataMap.get(dateStr) || 0;
      dataMap.set(dateStr, current + 1);
    });

    const data = Array.from(dataMap.entries()).map(([date, conversations]) => ({
      date,
      conversations,
    }));

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get top intents (for bar chart)
app.get('/api/v1/analytics/top-intents', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const range = c.req.query('range') || '30d';

    // Calculate date range
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get all messages with intent detection (simplified - you may want to enhance this)
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          bot: { userId: user.userId },
        },
        createdAt: { gte: startDate },
        role: 'USER', // Only count user messages (using Prisma enum)
      },
      select: {
        content: true,
      },
    });

    // Simple intent detection based on keywords (enhance with your actual intent matching logic)
    const intentCounts = new Map<string, number>();
    const intentKeywords: Record<string, string[]> = {
      'Greeting': ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      'Pricing': ['price', 'cost', 'pricing', 'how much', 'payment', 'subscription'],
      'Support': ['help', 'support', 'issue', 'problem', 'error', 'not working'],
      'Features': ['feature', 'can you', 'does it', 'available', 'capability'],
      'Contact': ['contact', 'email', 'phone', 'reach', 'talk to'],
    };

    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      for (const [intent, keywords] of Object.entries(intentKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
        }
      }
    });

    // Convert to array and sort by count
    const data = Array.from(intentCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get recent bots with activity
app.get('/api/v1/analytics/recent-bots', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '5');

    // Get recent bots with their last conversation time
    const recentBots = await prisma.bot.findMany({
      where: { userId: user.userId },
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
    const formattedBots = recentBots.map((bot) => {
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
        isPublished: bot.published,
      };
    });

    return c.json(formattedBots);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get conversations list with filters
app.get('/api/v1/conversations', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const status = c.req.query('status') || 'all';
    const sort = c.req.query('sort') || 'recent';
    const search = c.req.query('search') || '';

    // Build where clause
    const where: any = {
      bot: { userId: user.userId },
    };

    if (status !== 'all') {
      where.status = status;
    }

    // Get conversations with message count
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        bot: {
          select: {
            name: true,
          },
        },
        messages: {
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy:
        sort === 'recent'
          ? { createdAt: 'desc' }
          : sort === 'oldest'
          ? { createdAt: 'asc' }
          : undefined,
    });

    // Format response with duration calculation
    let data = conversations.map(conv => {
      const firstMsg = conv.messages[0];
      const lastMsg = conv.messages[conv.messages.length - 1];
      let duration = 'N/A';

      if (firstMsg && lastMsg && conv.messages.length > 1) {
        const durationMs = lastMsg.createdAt.getTime() - firstMsg.createdAt.getTime();
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        duration = `${minutes}m ${seconds}s`;
      }

      return {
        id: conv.id,
        botName: conv.bot.name,
        messageCount: conv._count.messages,
        lastMessage: lastMsg?.content || 'No messages',
        createdAt: conv.createdAt.toISOString(),
        status: conv.status || 'active',
        duration,
      };
    });

    // Apply search filter
    if (search) {
      data = data.filter(
        conv =>
          conv.botName.toLowerCase().includes(search.toLowerCase()) ||
          conv.lastMessage.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by message count if needed
    if (sort === 'messages') {
      data.sort((a, b) => b.messageCount - a.messageCount);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get conversation detail with full transcript
app.get('/api/v1/conversations/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const conversationId = c.req.param('id');

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        bot: { userId: user.userId }, // Security: ensure user owns this conversation
      },
      include: {
        bot: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        lead: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Calculate duration
    const firstMsg = conversation.messages[0];
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    let duration = 'N/A';
    if (firstMsg && lastMsg) {
      const durationMs = lastMsg.createdAt.getTime() - firstMsg.createdAt.getTime();
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      duration = `${minutes}m ${seconds}s`;
    }

    const data = {
      id: conversation.id,
      botId: conversation.bot.id,
      botName: conversation.bot.name,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      status: conversation.status || 'active',
      metadata: {
        duration,
        leadCaptured: !!conversation.lead,
        leadInfo: conversation.lead,
      },
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
    };

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete conversation
app.delete('/api/v1/conversations/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const conversationId = c.req.param('id');

    // Verify conversation belongs to user's bot
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        bot: { userId: user.userId },
      },
    });

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Delete conversation (cascade will handle messages)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /conversations/:id] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// API KEYS MANAGEMENT
// ============================================

// Get all API keys for user
app.get('/api/v1/api-keys', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mask the keys (show only first 20 chars)
    const data = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key: key.key.substring(0, 20) + '••••••••••••',
      lastUsed: key.lastUsed?.toISOString() || null,
      createdAt: key.createdAt.toISOString(),
    }));

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Generate new API key
app.post('/api/v1/api-keys', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Name is required' }, 400);
    }

    // Generate a secure random API key
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const key = 'sk_live_' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Get user's organization
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { organizationId: true },
    });

    if (!userWithOrg?.organizationId) {
      return c.json({ error: 'User organization not found' }, 404);
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key,
        userId: user.userId,
        organizationId: userWithOrg.organizationId,
      },
    });

    // Return full key only on creation (user needs to save it)
    return c.json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Full key shown only once
      lastUsed: null,
      createdAt: apiKey.createdAt.toISOString(),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Revoke/Delete API key
app.delete('/api/v1/api-keys/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const keyId = c.req.param('id');

    // Check if key exists and belongs to user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: user.userId,
      },
    });

    if (!apiKey) {
      return c.json({ error: 'API key not found' }, 404);
    }

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// LEADS MANAGEMENT
// ============================================

// Get all leads with filters
app.get('/api/v1/leads', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    // Query params for filtering
    const status = c.req.query('status') || 'all';
    const sort = c.req.query('sort') || 'recent';
    const search = c.req.query('search') || '';
    const minScore = parseInt(c.req.query('minScore') || '0');
    const maxScore = parseInt(c.req.query('maxScore') || '100');

    // Build where clause
    const where: any = {
      conversation: {
        bot: { userId: user.userId },
      },
    };

    if (status !== 'all') {
      where.status = status;
    }

    if (minScore > 0 || maxScore < 100) {
      where.score = {
        gte: minScore,
        lte: maxScore,
      };
    }

    // Get leads with conversation context
    const leads = await prisma.lead.findMany({
      where,
      include: {
        conversation: {
          select: {
            id: true,
            bot: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy:
        sort === 'recent'
          ? { createdAt: 'desc' }
          : sort === 'oldest'
          ? { createdAt: 'asc' }
          : sort === 'score-high'
          ? { score: 'desc' }
          : { score: 'asc' },
    });

    // Format response and apply search
    let data = leads.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      score: lead.score,
      status: lead.status,
      botId: lead.conversation.bot.id,
      botName: lead.conversation.bot.name,
      conversationId: lead.conversationId,
      messageCount: lead.conversation._count.messages,
      campaignId: lead.campaignId,
      campaignName: lead.campaign?.name,
      metadata: lead.metadata,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        lead =>
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(search) ||
          lead.company?.toLowerCase().includes(searchLower) ||
          lead.botName.toLowerCase().includes(searchLower)
      );
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get single lead detail
app.get('/api/v1/leads/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const leadId = c.req.param('id');

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        conversation: {
          bot: { userId: user.userId },
        },
      },
      include: {
        conversation: {
          include: {
            bot: {
              select: {
                id: true,
                name: true,
              },
            },
            messages: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
              },
            },
          },
        },
        campaign: true,
      },
    });

    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    const data = {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      score: lead.score,
      status: lead.status,
      metadata: lead.metadata,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      conversation: {
        id: lead.conversation.id,
        botId: lead.conversation.bot.id,
        botName: lead.conversation.bot.name,
        messageCount: lead.conversation.messages.length,
        messages: lead.conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        })),
      },
      campaign: lead.campaign
        ? {
            id: lead.campaign.id,
            name: lead.campaign.name,
            description: lead.campaign.description,
          }
        : null,
    };

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Update lead status or score
app.patch('/api/v1/leads/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const leadId = c.req.param('id');
    const body = await c.req.json();

    // Verify lead belongs to user
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        conversation: {
          bot: { userId: user.userId },
        },
      },
    });

    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    // Build update data
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.score !== undefined) updateData.score = body.score;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.company !== undefined) updateData.company = body.company;

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return c.json({
      id: updatedLead.id,
      status: updatedLead.status,
      score: updatedLead.score,
      updatedAt: updatedLead.updatedAt.toISOString(),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete lead
app.delete('/api/v1/leads/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const leadId = c.req.param('id');

    // Verify lead belongs to user
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        conversation: {
          bot: { userId: user.userId },
        },
      },
    });

    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Capture lead from conversation
app.post('/api/v1/conversations/:id/capture-lead', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const conversationId = c.req.param('id');

    const body = await c.req.json();
    const { name, email, phone, company } = body;

    // Validate required fields
    if (!name || !email) {
      return c.json({ error: 'Name and email are required' }, 400);
    }

    // Verify conversation exists and belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        bot: { userId: user.userId },
      },
      include: {
        bot: { select: { name: true } },
      },
    });

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Calculate initial lead score based on data completeness
    let score = 50; // Base score
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) score += 10; // Valid email
    if (phone && phone.trim().length > 0) score += 15; // Has phone
    if (company && company.trim().length > 0) score += 15; // Has company
    if (name && name.trim().split(' ').length >= 2) score += 10; // Full name

    // Check if lead already exists for this conversation
    const existingLead = await prisma.lead.findFirst({
      where: { conversationId },
    });

    let lead;
    if (existingLead) {
      // Update existing lead
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null,
          company: company ? company.trim() : null,
          score,
          status: 'NEW',
        },
      });
    } else {
      // Create new lead
      lead = await prisma.lead.create({
        data: {
          conversationId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null,
          company: company ? company.trim() : null,
          score,
          status: 'NEW',
        },
      });
    }

    return c.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        score: lead.score,
        status: lead.status,
      },
    });
  } catch (error: any) {
    console.error('Error capturing lead:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// LEAD DISCOVERY & GENERATION ENDPOINTS
// ============================================

// Start intelligent lead discovery search
app.post('/api/v1/discovery/search', authMiddleware, async (c) => {
  try {
    console.log('[Discovery] Starting lead discovery search...');
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const body = await c.req.json();
    const {
      searchGoal,
      location,
      radius,
      businessType,
      minRating,
      maxRating,
      hasWebsite,
      employeeRange,
      sources,
    } = body;

    console.log('[Discovery] Search params:', { searchGoal, location, radius, businessType });

    if (!searchGoal || !location) {
      return c.json({ error: 'Search goal and location are required' }, 400);
    }

    // Check API keys status
    const hasGoogleKey = !!c.env.GOOGLE_PLACES_API_KEY;
    const hasYelpKey = !!c.env.YELP_API_KEY;
    console.log('[Discovery] API Keys status:', {
      google: hasGoogleKey ? 'configured' : 'missing',
      yelp: hasYelpKey ? 'configured' : 'missing'
    });

    // Create a discovery campaign to track this search
    console.log('[Discovery] Creating campaign...');

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true }
    });

    if (!membership) {
      return c.json({ error: 'User organization not found' }, 404);
    }

    const campaign = await prisma.leadCampaign.create({
      data: {
        organizationId: membership.organizationId,
        name: `Discovery: ${searchGoal}`,
        description: JSON.stringify({
          type: 'DISCOVERY',
          searchGoal,
          location,
          radius: radius || 10,
          businessType,
          minRating,
          maxRating,
          hasWebsite,
          employeeRange,
          sources: sources || ['google_maps', 'yelp'],
        }),
        status: 'ACTIVE',
      },
    });
    console.log('[Discovery] Campaign created:', campaign.id);

    // Real multi-source scraping with external APIs
    console.log('[Discovery] Starting multi-source scraping...');
    const { businesses, errors } = await performMultiSourceScraping({
      searchGoal,
      location,
      radius: radius || 10,
      businessType,
      minRating,
      maxRating,
      hasWebsite,
      sources: sources || ['google_maps', 'yelp'],
      googleApiKey: c.env.GOOGLE_PLACES_API_KEY,
      yelpApiKey: c.env.YELP_API_KEY,
    });
    console.log('[Discovery] Found', businesses.length, 'businesses');
    if (errors.length > 0) {
      console.warn('[Discovery] Errors occurred:', errors);
    }

    // Return campaign ID and initial results
    return c.json({
      campaignId: campaign.id,
      status: 'processing',
      initialResults: businesses,
      errors: errors.length > 0 ? errors : undefined,
      message: businesses.length > 0
        ? 'Discovery search started. Results will be analyzed and scored by AI.'
        : 'No results found. Check the errors for details.',
    });
  } catch (error: any) {
    console.error('[Discovery] ERROR:', error);
    console.error('[Discovery] Error stack:', error.stack);
    return c.json({
      error: error.message || 'Internal server error',
      details: error.stack
    }, 500);
  }
});

// Helper function for multi-source scraping (REAL implementation)
async function performMultiSourceScraping(params: any) {
  const { searchGoal, location, radius, businessType, minRating, sources, googleApiKey, yelpApiKey } = params;

  const allBusinesses: any[] = [];
  const errors: string[] = [];

  // Check if API keys are configured
  const hasApiKeys = googleApiKey || yelpApiKey;

  // Google Places API
  if (sources.includes('google_maps') && googleApiKey) {
    try {
      console.log('[Discovery] Attempting Google Places search...');
      const googleResults = await searchGooglePlaces(location, searchGoal, businessType, radius, minRating, googleApiKey);
      allBusinesses.push(...googleResults);
      console.log('[Discovery] Google Places returned', googleResults.length, 'results');
    } catch (error: any) {
      const errorMsg = `Google Places: ${error.message}`;
      console.error('[Discovery] Google Places error:', error);
      errors.push(errorMsg);
    }
  }

  // Yelp API
  if (sources.includes('yelp') && yelpApiKey) {
    try {
      console.log('[Discovery] Attempting Yelp search...');
      const yelpResults = await searchYelp(location, searchGoal, businessType, radius, minRating, yelpApiKey);
      allBusinesses.push(...yelpResults);
      console.log('[Discovery] Yelp returned', yelpResults.length, 'results');
    } catch (error: any) {
      const errorMsg = `Yelp: ${error.message}`;
      console.error('[Discovery] Yelp error:', error);
      errors.push(errorMsg);
    }
  }

  // If no results found, provide helpful error message
  if (allBusinesses.length === 0) {
    const missingKeys = [];
    if (!googleApiKey && sources.includes('google_maps')) {
      missingKeys.push('GOOGLE_PLACES_API_KEY');
    }
    if (!yelpApiKey && sources.includes('yelp')) {
      missingKeys.push('YELP_API_KEY');
    }

    if (missingKeys.length > 0) {
      throw new Error(
        `No API keys configured for the selected sources. Please configure: ${missingKeys.join(', ')}. ` +
        `Visit your Cloudflare Worker settings to add these environment variables.`
      );
    }

    // If API keys were configured but no results, throw error with details
    if (errors.length > 0) {
      throw new Error(`Search failed: ${errors.join('; ')}`);
    }

    // No errors but no results - legitimate empty result
    console.warn('[Discovery] No results found, but no errors occurred');
  }

  return { businesses: allBusinesses, errors };
}

// Search Google Places API
async function searchGooglePlaces(location: string, searchGoal: string, businessType: string, radius: number, minRating: number, apiKey: string) {
  console.log('[Google Places] Starting search:', { location, searchGoal, businessType, radius });

  // Step 1: Geocode location to get coordinates
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
  console.log('[Google Places] Geocoding:', location);
  const geocodeResponse = await fetch(geocodeUrl);
  const geocodeData = await geocodeResponse.json();

  console.log('[Google Places] Geocode response status:', geocodeData.status);

  if (geocodeData.status !== 'OK') {
    throw new Error(`Google Geocoding failed: ${geocodeData.status}. ${geocodeData.error_message || ''}`);
  }

  if (!geocodeData.results || geocodeData.results.length === 0) {
    throw new Error(`Location not found: ${location}`);
  }

  const { lat, lng } = geocodeData.results[0].geometry.location;
  console.log('[Google Places] Coordinates:', { lat, lng });

  // Step 2: Search for places nearby
  const query = businessType || searchGoal;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius * 1000}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
  console.log('[Google Places] Searching nearby:', query);
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();

  console.log('[Google Places] Search response status:', searchData.status);
  console.log('[Google Places] Found results:', searchData.results?.length || 0);

  if (searchData.status === 'REQUEST_DENIED') {
    throw new Error(`Google Places API access denied: ${searchData.error_message || 'Check API key and enabled APIs'}`);
  }

  if (searchData.status === 'INVALID_REQUEST') {
    throw new Error(`Invalid request to Google Places API: ${searchData.error_message || ''}`);
  }

  if (!searchData.results || searchData.results.length === 0) {
    console.warn('[Google Places] No results found for query:', query);
    return [];
  }

  // Step 3: Get details for each place
  const businesses = await Promise.all(
    searchData.results.slice(0, 20).map(async (place: any) => {
      // Skip if rating below minimum
      if (minRating > 0 && (!place.rating || place.rating < minRating)) {
        return null;
      }

      // Get place details for more info
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (!detailsData.result) {
        return null;
      }

      const details = detailsData.result;

      // Check for online booking presence
      const hasOnlineBooking = details.website ? await checkForOnlineBooking(details.website) : false;

      return {
        id: crypto.randomUUID(),
        name: details.name || 'Unknown',
        address: details.formatted_address || '',
        phone: details.formatted_phone_number || null,
        email: null, // Google Places doesn't provide email
        website: details.website || null,
        rating: details.rating || 0,
        reviewCount: details.user_ratings_total || 0,
        category: details.types?.[0]?.replace('_', ' ') || 'Business',
        source: 'Google Maps',
        coordinates: {
          lat: details.geometry?.location?.lat || 0,
          lng: details.geometry?.location?.lng || 0,
        },
        technologies: [],
        hasOnlineBooking,
        socialPresence: { facebook: false, instagram: false, linkedin: false },
      };
    })
  );

  return businesses.filter((b) => b !== null);
}

// Search Yelp API
async function searchYelp(location: string, searchGoal: string, businessType: string, radius: number, minRating: number, apiKey: string) {
  const term = businessType || searchGoal;
  const searchUrl = `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&term=${encodeURIComponent(term)}&radius=${Math.min(radius * 1000, 40000)}&limit=20`;

  const response = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();

  if (!data.businesses) {
    return [];
  }

  const businesses = data.businesses
    .filter((biz: any) => !minRating || biz.rating >= minRating)
    .map((biz: any) => ({
      id: crypto.randomUUID(),
      name: biz.name,
      address: `${biz.location.address1 || ''}, ${biz.location.city || ''}, ${biz.location.country || ''}`.trim(),
      phone: biz.phone || null,
      email: null,
      website: biz.url || null,
      rating: biz.rating || 0,
      reviewCount: biz.review_count || 0,
      category: biz.categories?.[0]?.title || 'Business',
      source: 'Yelp',
      coordinates: {
        lat: biz.coordinates?.latitude || 0,
        lng: biz.coordinates?.longitude || 0,
      },
      technologies: [],
      hasOnlineBooking: false,
      socialPresence: { facebook: false, instagram: false, linkedin: false },
    }));

  return businesses;
}

// Check if website has online booking system
async function checkForOnlineBooking(websiteUrl: string): Promise<boolean> {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    const html = await response.text();

    // Simple keyword detection for booking systems
    const bookingKeywords = [
      'book now',
      'booking',
      'reservation',
      'prenotazione',
      'prenota',
      'opentable',
      'resy',
      'tock',
      'bookatable',
    ];

    const htmlLower = html.toLowerCase();
    return bookingKeywords.some((keyword) => htmlLower.includes(keyword));
  } catch (error) {
    // Silent fail - just return false if we can't check
    return false;
  }
}

// Analyze lead with AI and generate intelligent score
app.post('/api/v1/discovery/analyze', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { business, searchGoal, userProduct, language = 'en' } = body;

    if (!business || !searchGoal) {
      return c.json({ error: 'Business data and search goal are required' }, 400);
    }

    // Language mapping for prompts
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'it': 'Italian',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'pl': 'Polish',
      'ro': 'Romanian',
      'el': 'Greek',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'lt': 'Lithuanian'
    };
    const targetLanguage = languageNames[language] || 'English';

    // Debug logging - what env vars do we actually have?
    console.log('[Debug] Available env keys:', Object.keys(c.env));
    console.log('[Debug] OPENAI_API_KEY present?', 'OPENAI_API_KEY' in c.env);
    console.log('[Debug] OPENAI_API_KEY value (first 10 chars):',
      c.env.OPENAI_API_KEY ? c.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'undefined');

    // Check if OpenAI API key is configured
    if (!c.env.OPENAI_API_KEY) {
      return c.json({
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your Cloudflare Worker environment variables.',
        debug: {
          availableEnvVars: Object.keys(c.env),
          openaiKeyPresent: 'OPENAI_API_KEY' in c.env
        }
      }, 500);
    }

    // Use OpenAI to analyze the lead
    const openai = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const analysisPrompt = `You are an expert lead qualification analyst. Analyze this business and determine how well it matches the search goal.

IMPORTANT: Provide your entire response in ${targetLanguage}. All text fields (painPoints, opportunity, approachStrategy, bestContactTime, emailHook, reasoning) must be written in ${targetLanguage}.

Search Goal: ${searchGoal}
User's Product/Service: ${userProduct || 'a solution to help businesses grow'}

Business Data:
- Name: ${business.name}
- Category: ${business.category}
- Rating: ${business.rating}/5 (${business.reviewCount} reviews)
- Website: ${business.website || 'None'}
- Has Online Booking: ${business.hasOnlineBooking ? 'Yes' : 'No'}
- Technologies: ${business.technologies?.join(', ') || 'Unknown'}
- Social Presence: ${JSON.stringify(business.socialPresence)}

Analyze this business and provide:
1. Lead Score (0-100): How well this business matches the search goal
2. Pain Points: What problems does this business likely have?
3. Opportunity: Why is this a good lead?
4. Approach Strategy: How should we contact them?
5. Best Contact Time: When to reach out?
6. Email Hook: A compelling opening line for an outreach email

Return your analysis as JSON with this exact structure:
{
  "score": number,
  "painPoints": string[],
  "opportunity": string,
  "approachStrategy": string,
  "bestContactTime": string,
  "emailHook": string,
  "reasoning": string
}

Remember: Write all text content in ${targetLanguage}!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert lead qualification analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    return c.json({
      businessId: business.id,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing lead:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Generate personalized outreach email
app.post('/api/v1/discovery/generate-outreach', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { business, analysis, userInfo, language = 'en' } = body;

    if (!business || !analysis) {
      return c.json({ error: 'Business and analysis data are required' }, 400);
    }

    // Language mapping for prompts
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'it': 'Italian',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'pl': 'Polish',
      'ro': 'Romanian',
      'el': 'Greek',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'lt': 'Lithuanian'
    };
    const targetLanguage = languageNames[language] || 'English';

    // Debug logging - what env vars do we actually have?
    console.log('[Debug] Available env keys:', Object.keys(c.env));
    console.log('[Debug] OPENAI_API_KEY present?', 'OPENAI_API_KEY' in c.env);
    console.log('[Debug] OPENAI_API_KEY value (first 10 chars):',
      c.env.OPENAI_API_KEY ? c.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'undefined');

    // Check if OpenAI API key is configured
    if (!c.env.OPENAI_API_KEY) {
      return c.json({
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your Cloudflare Worker environment variables.',
        debug: {
          availableEnvVars: Object.keys(c.env),
          openaiKeyPresent: 'OPENAI_API_KEY' in c.env
        }
      }, 500);
    }

    const openai = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const emailPrompt = `Generate a personalized outreach email for this lead.

IMPORTANT: Write the ENTIRE email in ${targetLanguage}. The subject, body, and follow-up suggestions must all be in ${targetLanguage}.

Business: ${business.name}
Category: ${business.category}
Pain Points: ${analysis.painPoints?.join(', ')}
Opportunity: ${analysis.opportunity}
Email Hook: ${analysis.emailHook}

Sender Info:
- Name: ${userInfo?.name || 'Your Name'}
- Company: ${userInfo?.company || 'Your Company'}
- Product: ${userInfo?.product || 'our solution'}

Write a professional, personalized cold email that:
1. Uses the email hook as opening
2. Addresses their specific pain points
3. Proposes a clear value proposition
4. Includes a soft call-to-action
5. Keeps it under 150 words
6. Sounds natural and friendly, not salesy

Return JSON:
{
  "subject": "email subject line",
  "body": "email body",
  "followUpSuggestions": ["suggestion 1", "suggestion 2"]
}

Remember: Write everything in ${targetLanguage}!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email copywriter. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: emailPrompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const emailContent = JSON.parse(completion.choices[0].message.content || '{}');

    return c.json(emailContent);
  } catch (error: any) {
    console.error('Error generating outreach email:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get discovery campaign results
app.get('/api/v1/discovery/campaigns/:id', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const campaignId = c.req.param('id');

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true }
    });

    if (!membership) {
      return c.json({ error: 'User organization not found' }, 404);
    }

    const campaign = await prisma.leadCampaign.findFirst({
      where: {
        id: campaignId,
        organizationId: membership.organizationId,
      },
    });

    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404);
    }

    // Get leads associated with this campaign
    const leads = await prisma.lead.findMany({
      where: { campaignId },
      orderBy: { score: 'desc' },
    });

    return c.json({
      campaign,
      leads,
      stats: {
        total: leads.length,
        qualified: leads.filter(l => l.score >= 70).length,
        contacted: leads.filter(l => l.status === 'CONTACTED').length,
        converted: leads.filter(l => l.status === 'CONVERTED').length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save discovered leads to database
app.post('/api/v1/discovery/save-results', authMiddleware, async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const body = await c.req.json();
    const { campaignId, businesses, analyses } = body;

    if (!campaignId || !Array.isArray(businesses)) {
      return c.json({ error: 'Campaign ID and businesses array are required' }, 400);
    }

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true }
    });

    if (!membership) {
      return c.json({ error: 'User organization not found' }, 404);
    }

    // Verify campaign ownership
    const campaign = await prisma.leadCampaign.findFirst({
      where: {
        id: campaignId,
        organizationId: membership.organizationId,
      },
    });

    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404);
    }

    // Create conversation for this discovery campaign
    let discoveryBot = await prisma.bot.findFirst({
      where: {
        userId: user.userId,
        name: 'Lead Discovery',
      },
    });

    if (!discoveryBot) {
      discoveryBot = await prisma.bot.create({
        data: {
          userId: user.userId,
          name: 'Lead Discovery',
          systemPrompt: 'This bot manages leads from intelligent discovery campaigns.',
          model: 'gpt-4o-mini',
        },
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        botId: discoveryBot.id,
        status: 'COMPLETED',
      },
    });

    // Save all businesses as leads
    const createdLeads = await Promise.all(
      businesses.map(async (business: any, index: number) => {
        const analysis = analyses?.[index];

        return prisma.lead.create({
          data: {
            conversationId: conversation.id,
            campaignId: campaign.id,
            name: business.name,
            email: business.email || null,
            phone: business.phone || null,
            company: business.name,
            score: analysis?.score || 50,
            status: 'NEW',
            metadata: {
              address: business.address,
              website: business.website,
              rating: business.rating,
              reviewCount: business.reviewCount,
              category: business.category,
              source: business.source,
              coordinates: business.coordinates,
              technologies: business.technologies,
              hasOnlineBooking: business.hasOnlineBooking,
              socialPresence: business.socialPresence,
              aiAnalysis: analysis || null,
            },
          },
        });
      })
    );

    return c.json({
      success: true,
      saved: createdLeads.length,
      campaignId: campaign.id,
    });
  } catch (error: any) {
    console.error('Error saving discovery results:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// WEB SCRAPING ENDPOINTS with robust error handling
// ============================================

// OPTIONS handler for CORS preflight
app.options('/api/v1/scrape', async (c) => {
  return c.json({ ok: true }, 200);
});

// Scrape URL and extract all links
app.post('/api/v1/scrape', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { url, selector = 'a', max = 200 } = body;

    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    console.log('[Scrape] Fetching:', url);

    // Timeout hard (10s) with AbortController
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    let response;
    try {
      // Fetch the page with timeout and better User-Agent
      response = await fetch(url, {
        signal: abortController.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return c.json({ error: 'Request timeout', message: 'The page took too long to respond (>10s)' }, 504);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.log('[Scrape] Upstream fetch failed:', response.status);
      return c.json({
        error: 'Upstream fetch failed',
        status: response.status,
        message: `The target website returned ${response.status} ${response.statusText}`
      }, 502);
    }

    const html = await response.text();

    // Parse HTML with linkedom
    let document;
    try {
      const parsed = parseHTML(html);
      document = parsed.document;
    } catch (parseError: any) {
      console.error('[Scrape] HTML parsing error:', parseError);
      return c.json({
        error: 'HTML parsing failed',
        message: 'Could not parse the HTML content'
      }, 500);
    }

    // Extract all links
    const links = Array.from(document.querySelectorAll(selector))
      .map((a: any) => {
        const href = a.getAttribute('href');
        if (!href) return null;

        // Skip anchors, mailto, tel, javascript
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
          return null;
        }

        // Convert relative URLs to absolute
        try {
          const absoluteUrl = new URL(href, targetUrl.href);
          // Only return http/https URLs without anchors
          if ((absoluteUrl.protocol === 'http:' || absoluteUrl.protocol === 'https:') && !absoluteUrl.href.includes('#')) {
            return {
              url: absoluteUrl.href,
              text: a.textContent?.trim() || '',
            };
          }
        } catch (e) {
          // Invalid URL, skip
        }
        return null;
      })
      .filter((link): link is { url: string; text: string } => link !== null);

    // Deduplicate by URL and limit
    const uniqueLinks = Array.from(
      new Map(links.map(link => [link.url, link])).values()
    ).slice(0, Number(max) || 200);

    console.log('[Scrape] Found', uniqueLinks.length, 'unique links');

    return c.json({
      ok: true,
      url,
      totalLinks: uniqueLinks.length,
      links: uniqueLinks,
    });
  } catch (error: any) {
    console.error('[Scrape] Error:', error);
    return c.json({
      error: 'SCRAPE_ERROR',
      message: error.message || 'Failed to scrape URL',
      details: error.name || 'Unknown error',
    }, 500);
  }
});

// Preview content from a URL
app.get('/api/v1/scrape', authMiddleware, async (c) => {
  try {
    const url = c.req.query('url');

    if (!url) {
      return c.json({ error: 'URL parameter is required' }, 400);
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    // Filter out invalid URLs
    if (url.includes('#')) {
      return c.json({ error: 'URLs with anchors (#) are not allowed' }, 400);
    }

    console.log('[Scrape Preview] Fetching:', url);

    // Timeout hard (10s)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    let response;
    try {
      // Fetch the page
      response = await fetch(url, {
        signal: abortController.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return c.json({ error: 'Request timeout', message: 'The page took too long to respond' }, 504);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return c.json({
        error: 'Upstream fetch failed',
        status: response.status,
        message: `The target website returned ${response.status} ${response.statusText}`
      }, 502);
    }

    const html = await response.text();

    // Parse HTML
    let document;
    try {
      const parsed = parseHTML(html);
      document = parsed.document;
    } catch (parseError) {
      return c.json({ error: 'HTML parsing failed' }, 500);
    }

    // Extract title
    const title = document.querySelector('title')?.textContent?.trim() || 'Untitled';

    // Extract meta description
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';

    // Extract text content (simplified - get paragraphs)
    const paragraphs = Array.from(document.querySelectorAll('p'))
      .map((p: any) => p.textContent?.trim())
      .filter((text: string) => text && text.length > 20) // Filter out short paragraphs
      .slice(0, 10); // Limit to first 10 paragraphs

    const content = paragraphs.join('\n\n');

    console.log('[Scrape Preview] Extracted:', { title, contentLength: content.length });

    return c.json({
      url,
      title,
      description: metaDesc,
      content,
      contentPreview: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
    });
  } catch (error: any) {
    console.error('[Scrape Preview] Error:', error);
    return c.json({
      error: 'SCRAPE_ERROR',
      message: error.message || 'Failed to preview URL',
      details: error.name || 'Unknown error',
    }, 500);
  }
});

// ============================================
// DEBUG / HEALTH CHECK ENDPOINTS
// ============================================

app.get('/api/v1/debug/db', async (c) => {
  console.log('[DEBUG /db] Testing database connection...');

  try {
    const prisma = getPrisma(c.env);

    // Test 1: Basic connection
    console.log('[DEBUG /db] Test 1: Running SELECT 1');
    await prisma.$queryRaw`SELECT 1 as result`;
    console.log('[DEBUG /db] ✅ SELECT 1 succeeded');

    // Test 2: Check tables exist
    console.log('[DEBUG /db] Test 2: Checking tables');
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;
    console.log('[DEBUG /db] ✅ Found tables:', tables);

    // Test 3: Count records in key tables
    console.log('[DEBUG /db] Test 3: Counting records');
    const [userCount, orgCount, botCount, docCount] = await Promise.all([
      prisma.user.count().catch(() => -1),
      prisma.organization.count().catch(() => -1),
      prisma.bot.count().catch(() => -1),
      prisma.document.count().catch(() => -1),
    ]);

    const counts = {
      users: userCount,
      organizations: orgCount,
      bots: botCount,
      documents: docCount,
    };
    console.log('[DEBUG /db] ✅ Record counts:', counts);

    return c.json({
      ok: true,
      message: 'Database connection successful',
      tables: Array.isArray(tables) ? tables.length : 0,
      counts,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[DEBUG /db] ❌ FAILED:', error);
    console.error('[DEBUG /db] Error code:', error.code);
    console.error('[DEBUG /db] Error message:', error.message);
    console.error('[DEBUG /db] Stack:', error.stack);

    return c.json({
      ok: false,
      error: error.message,
      code: error.code,
      name: error.name,
      details: {
        isPrismaError: error instanceof Prisma.PrismaClientKnownRequestError,
        prismaCode: error.code,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

export default app;
