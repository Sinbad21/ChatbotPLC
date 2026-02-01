import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '@chatbot-studio/auth';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication middleware
 * Checks for token in httpOnly cookie first, then fallback to Authorization header
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // First try httpOnly cookie (most secure)
    let token = req.cookies.accessToken;

    // Fallback to Authorization header for API clients
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Admin-only middleware
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Optional authentication middleware
 * Checks for token in httpOnly cookie first, then fallback to Authorization header
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // First try httpOnly cookie
    let token = req.cookies.accessToken;

    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
}
