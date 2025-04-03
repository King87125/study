import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import User from '../models/User';
import cloudinary from '../config/cloudinaryConfig'; // 导入 Cloudinary 配置

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

// 辅助函数：从 Cloudinary URL 中提取 public_id
const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split('/');
    // 假设 URL 结构类似 https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v<version>/<folder>/<public_id>.<format>
    // 或者 https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/<folder>/<public_id>
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) return null;
    
    // 尝试获取 public_id 部分，移除可能的版本号和文件扩展名
    let publicIdWithFolder = parts.slice(uploadIndex + 2).join('/');
    // 移除文件扩展名
    const lastDotIndex = publicIdWithFolder.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      publicIdWithFolder = publicIdWithFolder.substring(0, lastDotIndex);
    }
    return publicIdWithFolder;
  } catch (error) {
    console.error('从 URL 提取 public_id 失败:', error);
    return null;
  }
};

// @desc   上传用户头像
// @route  POST /api/users/avatar
// @access Private
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    // 检查文件是否通过中间件上传并处理（Cloudinary URL 已在 req.file.path）
    if (!req.file || !(req.file as any).path) {
      return res.status(400).json({ message: '请上传头像文件或文件上传失败' });
    }

    const userId = (req as any).user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const newAvatarUrl = (req.file as any).path; // 获取 Cloudinary URL

    // 如果用户之前有自定义头像 (不是默认头像，且是 Cloudinary URL)，删除旧文件
    const oldAvatarUrl = user.avatar;
    if (oldAvatarUrl && 
        !oldAvatarUrl.includes('default-avatar.png') && 
        oldAvatarUrl.includes('res.cloudinary.com')) 
    {
      const publicId = getPublicIdFromUrl(oldAvatarUrl);
      if (publicId) {
        try {
          console.log(`尝试删除旧头像 (Cloudinary): ${publicId}`);
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }); // 指定类型为 image
          console.log(`成功删除旧头像 (Cloudinary): ${publicId}`);
        } catch (deleteError) {
          console.error(`删除旧 Cloudinary 头像失败 (${publicId}):`, deleteError);
          // 这里选择不中断流程，允许用户更新头像，但记录错误
        }
      } else {
          console.warn(`无法从旧头像 URL 提取 public_id: ${oldAvatarUrl}`);
      }
    }

    // 更新用户头像路径为 Cloudinary URL
    // const avatarPath = `/uploads/avatars/${req.file.filename}`; // 旧的本地路径
    user.avatar = newAvatarUrl;
    await user.save();

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar, // 返回新的 Cloudinary URL
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    console.error('上传头像错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
}; 