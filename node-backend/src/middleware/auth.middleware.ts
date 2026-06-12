import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendErrorResponse } from '../utils/errors';
import { ErrorCode } from '../utils/errorCodes';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    mobile: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendErrorResponse(res, ErrorCode.AUTH_TOKEN_REQUIRED, 'No token provided');
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      sendErrorResponse(res, ErrorCode.AUTH_TOKEN_INVALID, 'Invalid token');
      return;
    }

    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendErrorResponse(res, ErrorCode.AUTH_TOKEN_EXPIRED, 'Token expired');
    } else {
      sendErrorResponse(res, ErrorCode.AUTH_TOKEN_INVALID, 'Authentication failed');
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendErrorResponse(res, ErrorCode.AUTH_UNAUTHORIZED, 'Unauthorized');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendErrorResponse(res, ErrorCode.AUTH_FORBIDDEN, 'Forbidden: Insufficient permissions', { 
        requiredRoles: roles,
        userRole: req.user.role 
      });
      return;
    }

    next();
  };
};

