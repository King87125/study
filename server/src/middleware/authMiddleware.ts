import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  id: number;
}

// 扩展Request类型，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// 验证用户是否登录
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // 获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;

      // 查找用户
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] } // 排除密码字段
      });

      if (!user) {
        res.status(401).json({ message: '未授权，用户不存在' });
        return;
      }

      // 将用户信息添加到请求中
      (req as any).user = user;
      next();
    } catch (error) {
      console.error('认证错误:', error);
      res.status(401).json({ message: '未授权，token无效' });
    }
  } else {
    res.status(401).json({ message: '未授权，缺少token' });
  }
};

// 验证是否为管理员
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user && (req as any).user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '没有管理员权限' });
  }
};

// 验证邀请码
export const validateInviteCode = (req: Request, res: Response, next: NextFunction) => {
  const { inviteCode } = req.body;

  if (!inviteCode) {
    return res.status(400).json({ message: '请提供邀请码' });
  }

  if (inviteCode !== process.env.INVITE_CODE) {
    return res.status(400).json({ message: '邀请码无效' });
  }

  next();
}; 