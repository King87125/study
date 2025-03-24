import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import User from '../models/User';

// 生成JWT令牌
const generateToken = (id: number) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc   注册新用户
// @route  POST /api/users/register
// @access Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, inviteCode } = req.body;

    // 检查邀请码
    if (inviteCode !== process.env.INVITE_CODE) {
      return res.status(400).json({ message: '邀请码无效' });
    }

    // 检查用户是否已存在
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: '用户已存在' });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
      avatar: '/uploads/avatars/default-avatar.png',
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: '无效的用户数据' });
    }
  } catch (error: any) {
    console.error('注册用户错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc   用户登录
// @route  POST /api/users/login
// @access Public
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: '邮箱或密码不正确' });
    }

    // 检查密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码不正确' });
    }

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    console.error('登录用户错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc   获取用户资料
// @route  GET /api/users/profile
// @access Private
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    });
  } catch (error: any) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc   更新用户资料
// @route  PUT /api/users/profile
// @access Private
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const { username, email, password } = req.body;

    // 更新字段
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password;

    // 保存更新
    await user.save();

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc   上传用户头像
// @route  POST /api/users/avatar
// @access Private
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传头像文件' });
    }

    const userId = (req as any).user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 如果用户之前有自定义头像，删除旧文件
    if (user.avatar && user.avatar !== '/uploads/avatars/default-avatar.png') {
      const oldAvatarPath = path.join(__dirname, '../../', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // 更新用户头像路径
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    console.error('上传头像错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
}; 