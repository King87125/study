import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import { db } from '../db'; // 移除旧 db 导入
import User from '../models/User'; // 导入 Sequelize User 模型

interface JwtPayload {
  id: number;
}

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      // user?: User; // 尝试移除显式类型或改为 any
      user?: any; 
    }
  }
}

// 验证 JWT 令牌
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // 如果没有token，则未授权
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;
    const userId = decoded.id;

    // 使用 Sequelize 查找用户
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] } // 排除密码字段
    }); 

    if (!user) {
      return res.status(403).json({ message: '用户不存在或令牌无效' }); // 用户不存在
    }

    // 将用户ID和完整的用户信息（排除密码）附加到请求对象
    req.userId = userId;
    req.user = user; 

    // 移除旧的 SQLite 查询
    /*
    const user = await db.get('SELECT id, username, email, is_admin FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.sendStatus(403); // 用户不存在
    }
    req.userId = userId;
    req.isAdmin = user.is_admin === 1; // 附加管理员状态
    */

    next(); // 继续处理请求
  } catch (error) {
    console.error('JWT 验证错误:', error);
    return res.status(403).json({ message: '令牌无效或已过期' }); // 令牌无效
  }
}; 