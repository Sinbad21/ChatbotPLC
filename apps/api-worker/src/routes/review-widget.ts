import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

type Bindings = {
  DATABASE_URL: string;
  APP_URL: string;
};

const reviewWidgetRoutes = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all widget routes (public endpoints)
reviewWidgetRoutes.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Helper to get Prisma client
function getPrisma(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// GET /api/review-widget/:widgetId - Get widget config (public)
reviewWidgetRoutes.get('/:widgetId', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const widgetId = c.req.param('widgetId');
    const sessionId = c.req.query('sessionId');

    const reviewBot = await prisma.reviewBot.findUnique({
      where: { widgetId },
      select: {
        id: true,
        widgetId: true,
        businessName: true,
        googleReviewUrl: true,
        thankYouMessage: true,
        surveyQuestion: true,
        positiveMessage: true,
        negativeMessage: true,
        completedMessage: true,
        surveyType: true,
        positiveThreshold: true,
        widgetColor: true,
        widgetPosition: true,
        delaySeconds: true,
        autoCloseSeconds: true,
        isActive: true,
      },
    });

    if (!reviewBot) {
      return c.json({ success: false, error: 'Widget not found' }, 404);
    }

    if (!reviewBot.isActive) {
      return c.json({ success: false, error: 'Widget is disabled' }, 403);
    }

    // Check if session already responded
    let hasResponded = false;
    if (sessionId) {
      const existingResponse = await prisma.reviewRequest.findFirst({
        where: {
          reviewBotId: reviewBot.id,
          sessionId,
          status: { in: ['RESPONDED', 'COMPLETED'] },
        },
      });
      hasResponded = !!existingResponse;
    }

    return c.json({
      success: true,
      data: {
        ...reviewBot,
        hasResponded,
      },
    });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return c.json({ success: false, error: 'Failed to fetch widget config' }, 500);
  }
});

// POST /api/review-widget/:widgetId/respond - Submit rating
reviewWidgetRoutes.post('/:widgetId/respond', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const widgetId = c.req.param('widgetId');
    const body = await c.req.json();
    
    const { rating, sessionId, userAgent, ipAddress } = body;

    if (!rating || rating < 1 || rating > 5) {
      return c.json({ success: false, error: 'Rating must be between 1 and 5' }, 400);
    }

    if (!sessionId) {
      return c.json({ success: false, error: 'Session ID is required' }, 400);
    }

    // Get review bot
    const reviewBot = await prisma.reviewBot.findUnique({
      where: { widgetId },
    });

    if (!reviewBot || !reviewBot.isActive) {
      return c.json({ success: false, error: 'Widget not found or disabled' }, 404);
    }

    // Find or create review request for this session
    let reviewRequest = await prisma.reviewRequest.findFirst({
      where: {
        reviewBotId: reviewBot.id,
        sessionId,
      },
    });

    if (!reviewRequest) {
      // Create new request (direct widget trigger, not from webhook)
      reviewRequest = await prisma.reviewRequest.create({
        data: {
          reviewBotId: reviewBot.id,
          sessionId,
          platform: 'DIRECT',
          status: 'PENDING',
        },
      });
    }

    // Check if already responded
    const existingResponse = await prisma.reviewResponse.findFirst({
      where: { reviewRequestId: reviewRequest.id },
    });

    if (existingResponse) {
      return c.json({ 
        success: false, 
        error: 'Already responded',
        isPositive: existingResponse.rating >= reviewBot.positiveThreshold,
      }, 400);
    }

    // Determine rating type based on survey type
    let ratingType = 'EMOJI';
    if (reviewBot.surveyType === 'STARS') ratingType = 'STARS';
    if (reviewBot.surveyType === 'NPS') ratingType = 'NPS';

    // Create response
    const response = await prisma.reviewResponse.create({
      data: {
        reviewRequestId: reviewRequest.id,
        rating,
        ratingType,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
      },
    });

    // Update request status
    await prisma.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: { status: 'RESPONDED' },
    });

    const isPositive = rating >= reviewBot.positiveThreshold;

    return c.json({
      success: true,
      data: {
        responseId: response.id,
        isPositive,
        googleReviewUrl: isPositive ? reviewBot.googleReviewUrl : null,
        message: isPositive ? reviewBot.positiveMessage : reviewBot.negativeMessage,
      },
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return c.json({ success: false, error: 'Failed to submit rating' }, 500);
  }
});

// POST /api/review-widget/:widgetId/feedback - Submit text feedback
reviewWidgetRoutes.post('/:widgetId/feedback', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const widgetId = c.req.param('widgetId');
    const body = await c.req.json();
    
    const { feedback, sessionId } = body;

    if (!sessionId) {
      return c.json({ success: false, error: 'Session ID is required' }, 400);
    }

    // Get review bot
    const reviewBot = await prisma.reviewBot.findUnique({
      where: { widgetId },
    });

    if (!reviewBot) {
      return c.json({ success: false, error: 'Widget not found' }, 404);
    }

    // Find the review request
    const reviewRequest = await prisma.reviewRequest.findFirst({
      where: {
        reviewBotId: reviewBot.id,
        sessionId,
      },
    });

    if (!reviewRequest) {
      return c.json({ success: false, error: 'Review request not found' }, 404);
    }

    // Update response with feedback
    await prisma.reviewResponse.updateMany({
      where: { reviewRequestId: reviewRequest.id },
      data: { feedbackText: feedback || '' },
    });

    // Update request status
    await prisma.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: { status: 'COMPLETED' },
    });

    return c.json({
      success: true,
      message: 'Feedback submitted',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return c.json({ success: false, error: 'Failed to submit feedback' }, 500);
  }
});

// POST /api/review-widget/:widgetId/google-click - Track Google Review click
reviewWidgetRoutes.post('/:widgetId/google-click', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const widgetId = c.req.param('widgetId');
    const body = await c.req.json();
    
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ success: false, error: 'Session ID is required' }, 400);
    }

    // Get review bot
    const reviewBot = await prisma.reviewBot.findUnique({
      where: { widgetId },
    });

    if (!reviewBot) {
      return c.json({ success: false, error: 'Widget not found' }, 404);
    }

    // Find the review request
    const reviewRequest = await prisma.reviewRequest.findFirst({
      where: {
        reviewBotId: reviewBot.id,
        sessionId,
      },
    });

    if (!reviewRequest) {
      return c.json({ success: false, error: 'Review request not found' }, 404);
    }

    // Update response with Google click
    await prisma.reviewResponse.updateMany({
      where: { reviewRequestId: reviewRequest.id },
      data: {
        clickedGoogleReview: true,
        googleClickedAt: new Date(),
      },
    });

    // Update request status to completed
    await prisma.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: { status: 'COMPLETED' },
    });

    return c.json({
      success: true,
      message: 'Google click tracked',
    });
  } catch (error) {
    console.error('Error tracking Google click:', error);
    return c.json({ success: false, error: 'Failed to track click' }, 500);
  }
});

// GET /api/review-widget/:widgetId/embed.js - Generate embed script
reviewWidgetRoutes.get('/:widgetId/embed.js', async (c) => {
  const widgetId = c.req.param('widgetId');
  const appUrl = c.env.APP_URL || 'https://app.chatbotstudio.io';

  const script = `
(function() {
  'use strict';

  var WIDGET_ID = '${widgetId}';
  var API_URL = '${appUrl}';
  var WIDGET_URL = API_URL + '/widget/review?widgetId=' + WIDGET_ID;

  // Session management
  function generateSessionId() {
    return Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  function getSessionId() {
    var key = 'rb_session_' + WIDGET_ID;
    var existing = localStorage.getItem(key);
    if (existing) return existing;
    var newId = generateSessionId();
    localStorage.setItem(key, newId);
    return newId;
  }

  function hasResponded() {
    return localStorage.getItem('rb_responded_' + WIDGET_ID) === 'true';
  }

  function setResponded() {
    localStorage.setItem('rb_responded_' + WIDGET_ID, 'true');
  }

  // Widget state
  var widgetFrame = null;
  var isVisible = false;

  function createWidget() {
    if (widgetFrame) return;

    var iframe = document.createElement('iframe');
    iframe.id = 'review-bot-widget-' + WIDGET_ID;
    iframe.src = WIDGET_URL + '&sessionId=' + getSessionId();
    iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:400px;height:500px;border:none;z-index:999999;background:transparent;pointer-events:none;';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameborder', '0');
    
    document.body.appendChild(iframe);
    widgetFrame = iframe;

    // Enable pointer events when widget is shown
    setTimeout(function() {
      iframe.style.pointerEvents = 'auto';
    }, 100);
  }

  function showWidget(options) {
    options = options || {};
    
    // Don't show if already responded (unless forced)
    if (!options.force && hasResponded()) {
      console.log('[ReviewBot] User already responded');
      return;
    }

    createWidget();
    if (widgetFrame) {
      widgetFrame.style.display = 'block';
      widgetFrame.style.pointerEvents = 'auto';
      isVisible = true;
    }
  }

  function hideWidget() {
    if (widgetFrame) {
      widgetFrame.style.display = 'none';
      widgetFrame.style.pointerEvents = 'none';
      isVisible = false;
    }
  }

  function resetWidget() {
    localStorage.removeItem('rb_session_' + WIDGET_ID);
    localStorage.removeItem('rb_responded_' + WIDGET_ID);
    if (widgetFrame) {
      widgetFrame.parentNode.removeChild(widgetFrame);
      widgetFrame = null;
    }
    console.log('[ReviewBot] Widget reset');
  }

  // Handle messages from widget iframe
  function handleMessage(event) {
    if (!event.data || !event.data.type) return;

    switch (event.data.type) {
      case 'REVIEW_BOT_CLOSE':
        hideWidget();
        break;
      case 'REVIEW_BOT_RESPONDED':
        setResponded();
        break;
      case 'REVIEW_BOT_RESIZE':
        if (widgetFrame && event.data.height) {
          widgetFrame.style.height = event.data.height + 'px';
        }
        break;
    }
  }

  window.addEventListener('message', handleMessage);

  // Auto-trigger check
  function checkAutoTrigger() {
    var params = new URLSearchParams(window.location.search);
    return params.get('review') === 'true' || 
           params.get('rb') === '1' || 
           params.get('feedback') === 'true';
  }

  // Initialize
  function init() {
    if (checkAutoTrigger()) {
      // Small delay for page load
      setTimeout(function() {
        showWidget();
      }, 2000);
    }
  }

  // Expose API
  window.ReviewBot = {
    show: showWidget,
    hide: hideWidget,
    trigger: showWidget,
    reset: resetWidget,
    isVisible: function() { return isVisible; },
    hasResponded: hasResponded
  };

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[ReviewBot] Widget loaded for ' + WIDGET_ID);
})();
`.trim();

  // Set response headers
  c.header('Content-Type', 'application/javascript; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Access-Control-Allow-Origin', '*');

  return c.text(script);
});

export { reviewWidgetRoutes };
