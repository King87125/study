import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

interface JwtPayload {
  id: number;
}

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// 验证 JWT 令牌
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未授权，缺少访问令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'myjwtsecret123') as JwtPayload;
    
    // 验证用户是否存在
    const user = await db.get('SELECT id FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ message: '未授权，用户不存在' });
    }

    // 将用户ID添加到请求中
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    return res.status(401).json({ message: '未授权，令牌无效' });
  }
}; 