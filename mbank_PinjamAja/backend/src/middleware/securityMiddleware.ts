import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

// Helmet headers configuration
export const securityHeaders = helmet();

// General rate limiter (120 requests per 1 minute for operational dashboard polling)
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many requests from this IP, please try again after 1 minute.', 429);
  },
});

// Authentication rate limiter (10 login attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many login attempts, please try again after 15 minutes.', 429);
  },
});
