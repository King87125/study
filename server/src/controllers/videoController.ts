import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Video from '../models/Video';
import User from '../models/User';

// @desc    获取所有视频
// @route   GET /api/videos
// @access  Public
export const getVideos = async (req: Request, res: Response) => {
  try {
    const { subject, category, difficulty, search, sort } = req.query;
    
    // 构建查询条件
    const whereClause: any = {};
    
    if (subject) {
      whereClause.subject = subject;
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (difficulty) {
      whereClause.difficulty = difficulty;
    }
    
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }
    
    // 分页
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    
    // 排序方式
    let order: any = [['createdAt', 'DESC']];
    if (sort === 'popular') {
      order = [['views', 'DESC']];
    } else if (sort === 'oldest') {
      order = [['createdAt', 'ASC']];
    }
    
    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order,
      limit: pageSize,
      offset: pageSize * (page - 1)
    });
    
    // 为每个视频添加_id字段
    const formattedVideos = await Promise.all(videos.map(async (video) => {
      const videoJSON = video.toJSON() as any;
      
      // 查询上传者信息
      const uploadedBy = await User.findByPk(video.uploadedById);
      
      return {
        ...videoJSON,
        _id: video.id,
        uploadedBy: uploadedBy ? {
          _id: uploadedBy.id,
          username: uploadedBy.username,
          avatar: uploadedBy.avatar || '/uploads/avatars/default.jpg'
        } : null
      };
    }));
    
    res.json({
      videos: formattedVideos,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error: any) {
    console.error('获取视频列表错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    获取视频详情
// @route   GET /api/videos/:id
// @access  Public
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const video = await Video.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
      
    if (video) {
      // 增加观看次数
      video.views += 1;
      await video.save();
      
      // 查询上传者信息
      const uploadedBy = await User.findByPk(video.uploadedById);
      
      // 格式化响应，添加_id字段
      const videoJSON = video.toJSON() as any;
      const response = {
        ...videoJSON,
        _id: video.id,
        uploadedBy: uploadedBy ? {
          _id: uploadedBy.id,
          username: uploadedBy.username,
          avatar: uploadedBy.avatar || '/uploads/avatars/default.jpg'
        } : null
      };
      
      res.json(response);
    } else {
      res.status(404).json({ message: '视频未找到' });
    }
  } catch (error: any) {
    console.error('获取视频详情错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    上传视频
// @route   POST /api/videos
// @access  Private
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    // videoUrl 现在应该是由 Cloudinary 中间件填充的 Cloudinary URL
    const { title, description, videoUrl, thumbnailUrl, category, subject, difficulty, duration } = req.body;
    
    console.log('上传视频请求体 (控制器):', req.body);
    
    // 确保 Cloudinary URL 已被中间件添加
    if (!videoUrl || !videoUrl.includes('res.cloudinary.com')) {
       // 检查 req.file.path 是否有 Cloudinary URL (作为备用)
      const cloudinaryUrlFromFile = (req.file as any)?.path;
      if (!cloudinaryUrlFromFile || !cloudinaryUrlFromFile.includes('res.cloudinary.com')) {
          console.error('错误: Cloudinary URL 未在 req.body.videoUrl 或 req.file.path 中找到。');
          return res.status(400).json({ message: '视频文件上传失败或未找到 Cloudinary URL' });
      }
      // 如果在 req.file.path 找到了，也用它
      req.body.videoUrl = cloudinaryUrlFromFile; 
    }
    
    const userId = (req as any).user.id;
    
    // 查询用户信息 (可选，如果需要)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const video = await Video.create({
      title,
      description,
      videoUrl: req.body.videoUrl, // 使用 Cloudinary URL
      thumbnailUrl: thumbnailUrl || '/uploads/thumbnails/default-thumbnail.jpg', // 暂时保留默认或外部 URL 逻辑
      category,
      subject,
      difficulty,
      duration: duration || 0, // 前端应该计算并传递时长
      uploadedById: userId,
      views: 0
    });
    
    const videoWithUser = await Video.findByPk(video.id, {
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    // 转换为JSON格式 (确保 videoWithUser 不是 null)
    const videoJSON = videoWithUser?.toJSON() as any;
    
    // 添加_id字段以匹配前端期望的格式
    const response = {
      ...(videoJSON || {}), // 处理 videoWithUser 可能为 null 的情况
      _id: video.id,
      // 确保 uploadedBy 即使在 videoWithUser 为 null 时也能从 user 对象获取
      uploadedBy: {
        _id: user.id,
        username: user.username,
        avatar: user.avatar || '/uploads/avatars/default.jpg'
      }
    };
    
    console.log('返回的视频数据:', { id: response._id, title: response.title });
    
    res.status(201).json(response);
  } catch (error: any) {
    console.error('上传视频错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    更新视频
// @route   PUT /api/videos/:id
// @access  Private
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { title, description, category, subject, difficulty } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    const video = await Video.findByPk(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: '视频未找到' });
    }
    
    // 确认是视频上传者或管理员
    if (video.uploadedById !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: '未授权：只有上传者或管理员可以修改视频' });
    }
    
    // 更新视频信息
    const updatedVideo = await video.update({
      title: title || video.title,
      description: description || video.description,
      category: category || video.category,
      subject: subject || video.subject,
      difficulty: difficulty || video.difficulty,
    });
    
    const videoWithUser = await Video.findByPk(updatedVideo.id, {
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    // 查询上传者信息
    const uploadedBy = await User.findByPk(video.uploadedById);
    
    // 格式化响应，添加_id字段
    const videoJSON = videoWithUser?.toJSON() as any;
    const response = {
      ...videoJSON,
      _id: updatedVideo.id,
      uploadedBy: uploadedBy ? {
        _id: uploadedBy.id,
        username: uploadedBy.username,
        avatar: uploadedBy.avatar || '/uploads/avatars/default.jpg'
      } : null
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('更新视频错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    删除视频
// @route   DELETE /api/videos/:id
// @access  Private
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    const video = await Video.findByPk(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: '视频未找到' });
    }
    
    // 确认是视频上传者或管理员
    if (video.uploadedById !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: '未授权：只有上传者或管理员可以删除视频' });
    }
    
    await video.destroy();
    
    res.json({ message: '视频已删除' });
  } catch (error: any) {
    console.error('删除视频错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
}; 