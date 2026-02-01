import { Response } from 'express';
import { validationResult } from 'express-validator';
import { randomUUID } from 'crypto';
import { prisma } from '@chatbot-studio/database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@chatbot-studio/auth';
import { emailService, welcomeTemplate } from '@chatbot-studio/email';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

class AuthController {
  async register(req: AuthRequest, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password, name } = req.body;

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();

    // Check if email or name is already used (separately, not as a combined pair)
    const [existingByEmail, existingByName] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      prisma.user.findFirst({
        where: {
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    if (existingByEmail && existingByName) {
      throw new AppError('Name and email already in use', 409);
    }
    if (existingByEmail) {
      throw new AppError('Email already registered', 409);
    }
    if (existingByName) {
      throw new AppError('Name already in use', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,        name: normalizedName,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Generate unique token ID for this session
    const tokenId = randomUUID();

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId,
    });

    // Save refresh token with unique tokenId
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        tokenId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send welcome email
    try {
      await emailService.sendEmail({
        to: email,
        subject: 'Welcome to Chatbot Studio!',
        html: welcomeTemplate(name),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Set httpOnly cookies for security (protection against XSS)
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Set auth_session cookie for client-side checks
    res.cookie('auth_session', 'true', {
      httpOnly: false, // Client needs to read this
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      // Don't send tokens in response - they're in httpOnly cookies
    });
  }

  async login(req: AuthRequest, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Generate unique token ID for this session
    const tokenId = randomUUID();

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId,
    });

    // Save refresh token with unique tokenId
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        tokenId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set httpOnly cookies for security (protection against XSS)
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Set auth_session cookie for client-side checks
    res.cookie('auth_session', 'true', {
      httpOnly: false, // Client needs to read this
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      // Don't send tokens in response - they're in httpOnly cookies
    });
  }

  async refresh(req: AuthRequest, res: Response) {
    // Get refresh token from httpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database and tokenId matches
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Verify tokenId matches (prevents token reuse attacks)
    if (storedToken.tokenId !== payload.tokenId) {
      throw new AppError('Token ID mismatch - possible token reuse attack', 401);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update access token cookie
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.json({ success: true });
  }

  async logout(req: AuthRequest, res: Response) {
    // Get refresh token from httpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Clear all auth cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('auth_session', { path: '/' });
    res.clearCookie('last_activity', { path: '/' });

    res.json({ message: 'Logged out successfully' });
  }

  async me(req: AuthRequest, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json(user);
  }

  async forgotPassword(req: AuthRequest, res: Response) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    res.json({ message: 'If the email exists, a reset link has been sent' });

    // TODO: Generate reset token and send email
  }

  async resetPassword(req: AuthRequest, res: Response) {
    const { token, password } = req.body;

    // TODO: Verify reset token and update password

    res.json({ message: 'Password reset successfully' });
  }
}

export const authController = new AuthController();

