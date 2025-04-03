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
      console.log('收到的认证Token:', token);
      
      // 记录JWT密钥（仅供开发调试，生产环境中不要这样做）
      console.log('当前使用的JWT密钥:', process.env.JWT_SECRET);
      
      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;
      console.log('解码后的令牌数据:', decoded);

      // 查找用户
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] } // 排除密码字段
      });

      if (!user) {
        console.log('认证失败：用户不存在', decoded.id);
        res.status(401).json({ message: '未授权，用户不存在' });
        return;
      }

      console.log('认证成功，用户ID:', user.id);
      // 将用户信息添加到请求中
      (req as any).user = user;
      next();
    } catch (error) {
      console.error('认证错误:', error);
      // 提供更详细的错误信息
      if (error instanceof Error) {
        res.status(401).json({ 
          message: '未授权，token无效', 
          details: error.message,
          name: error.name 
        });
      } else {
        res.status(401).json({ message: '未授权，token无效' });
      }
    }
  } else {
    console.log('认证失败：缺少token');
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