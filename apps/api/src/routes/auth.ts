import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth-controller';
import { strictRateLimiter } from '../middleware/rate-limiter';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty().trim(),
  ],
  asyncHandler(authController.register)
);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
  '/login',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(authController.login)
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  asyncHandler(authController.refresh)
);

/**
 * POST /api/v1/auth/logout
 * Logout user
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

/**
 * GET /api/v1/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me)
);

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  strictRateLimiter,
  [body('email').isEmail().normalizeEmail()],
  asyncHandler(authController.forgotPassword)
);

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  strictRateLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  asyncHandler(authController.resetPassword)
);

export default router;
