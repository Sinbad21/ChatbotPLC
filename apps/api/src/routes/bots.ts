import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { botController } from '../controllers/bot-controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/bots - List all bots
router.get('/', asyncHandler(botController.list));

// POST /api/v1/bots - Create bot
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('organizationId').notEmpty(),
  ],
  asyncHandler(botController.create)
);

// GET /api/v1/bots/:id - Get bot
router.get('/:id', asyncHandler(botController.get));

// PUT /api/v1/bots/:id - Update bot
router.put('/:id', asyncHandler(botController.update));

// PATCH /api/v1/bots/:id - Partial update bot (used by web dashboard)
router.patch('/:id', asyncHandler(botController.update));

// DELETE /api/v1/bots/:id - Delete bot
router.delete('/:id', asyncHandler(botController.delete));

// POST /api/v1/bots/:id/publish - Publish bot
router.post('/:id/publish', asyncHandler(botController.publish));

// GET /api/v1/bots/:id/intents - Get bot intents
router.get('/:id/intents', asyncHandler(botController.getIntents));

// POST /api/v1/bots/:id/intents - Create intent
router.post('/:id/intents', asyncHandler(botController.createIntent));

// GET /api/v1/bots/:id/faqs - Get bot FAQs
router.get('/:id/faqs', asyncHandler(botController.getFAQs));

// POST /api/v1/bots/:id/faqs - Create FAQ
router.post('/:id/faqs', asyncHandler(botController.createFAQ));

export default router;

