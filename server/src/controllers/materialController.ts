import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Material, Comment } from '../models/Material';
import User from '../models/User';

// @desc    获取所有学习资料
// @route   GET /api/materials
// @access  Public
export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { subject, category, fileType, search, sort } = req.query;
    
    // 构建查询条件
    const whereClause: any = {};
    
    if (subject) {
      whereClause.subject = subject;
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (fileType) {
      whereClause.fileType = fileType;
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
      order = [['downloads', 'DESC']];
    } else if (sort === 'oldest') {
      order = [['createdAt', 'ASC']];
    }
    
    const { count, rows: materials } = await Material.findAndCountAll({
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
      
    res.json({
      materials,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error: any) {
    console.error('获取资料列表错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    获取学习资料详情
// @route   GET /api/materials/:id
// @access  Public
export const getMaterialById = async (req: Request, res: Response) => {
  try {
    const material = await Material.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'avatar']
            }
          ]
        }
      ]
    });
      
    if (material) {
      res.json(material);
    } else {
      res.status(404).json({ message: '资料未找到' });
    }
  } catch (error: any) {
    console.error('获取资料详情错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    上传学习资料
// @route   POST /api/materials
// @access  Private
export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    // fileUrl 现在应该是由 Cloudinary 中间件填充的 Cloudinary URL
    const { title, description, fileUrl, thumbnailUrl, category, subject, fileType, fileSize } = req.body;
    
    console.log('上传资料请求体 (控制器):', req.body);
    // console.log('上传资料文件 (控制器):', req.file); // req.file 在这里可能包含 Cloudinary URL 或原始信息
    
    // 确保 Cloudinary URL 已被中间件添加
    if (!fileUrl || !fileUrl.includes('res.cloudinary.com')) {
      // 检查 req.file.path 是否有 Cloudinary URL (作为备用)
      const cloudinaryUrlFromFile = (req.file as any)?.path;
      if (!cloudinaryUrlFromFile || !cloudinaryUrlFromFile.includes('res.cloudinary.com')) {
          console.error('错误: Cloudinary URL 未在 req.body.fileUrl 或 req.file.path 中找到。');
          return res.status(400).json({ message: '文件上传失败或未找到 Cloudinary URL' });
      }
      // 如果在 req.file.path 找到了，也用它 (虽然中间件应该已经加到 req.body.fileUrl 了)
      req.body.fileUrl = cloudinaryUrlFromFile; 
    }
    
    const userId = (req as any).user.id;
    
    const material = await Material.create({
      title,
      description,
      fileUrl: req.body.fileUrl, // 使用 Cloudinary URL
      thumbnailUrl: thumbnailUrl || '/uploads/thumbnails/default-material.jpg', // 暂时保留默认缩略图逻辑
      category,
      subject,
      fileType: fileType || (req.file ? req.file.mimetype : 'unknown'), // 从 body 或 file 获取
      fileSize: fileSize || (req.file ? req.file.size : 0),       // 从 body 或 file 获取
      uploadedById: userId,
      downloads: 0
    });
    
    const materialWithUser = await Material.findByPk(material.id, {
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    res.status(201).json(materialWithUser);
  } catch (error: any) {
    console.error('上传资料错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    更新学习资料
// @route   PUT /api/materials/:id
// @access  Private
export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const { title, description, category, subject } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    const material = await Material.findByPk(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: '资料未找到' });
    }
    
    // 确认是资料上传者或管理员
    if (material.uploadedById !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: '未授权：只有上传者或管理员可以修改资料' });
    }
    
    // 更新资料信息
    const updatedMaterial = await material.update({
      title: title || material.title,
      description: description || material.description,
      category: category || material.category,
      subject: subject || material.subject,
    });
    
    const materialWithUser = await Material.findByPk(updatedMaterial.id, {
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    res.json(materialWithUser);
  } catch (error: any) {
    console.error('更新资料错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    删除学习资料
// @route   DELETE /api/materials/:id
// @access  Private
export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    const material = await Material.findByPk(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: '资料未找到' });
    }
    
    // 确认是资料上传者或管理员
    if (material.uploadedById !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: '未授权：只有上传者或管理员可以删除资料' });
    }
    
    await material.destroy();
    
    res.json({ message: '资料已删除' });
  } catch (error: any) {
    console.error('删除资料错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    添加评论
// @route   POST /api/materials/:id/comment
// @access  Private
export const addComment = async (req: Request, res: Response) => {
  try {
    const { comment, rating } = req.body;
    const userId = (req as any).user.id;
    
    const material = await Material.findByPk(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: '资料未找到' });
    }
    
    const newComment = await Comment.create({
      materialId: material.id,
      userId,
      comment,
      rating
    });
    
    const commentWithUser = await Comment.findByPk(newComment.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    res.status(201).json({ message: '评论添加成功', comment: commentWithUser });
  } catch (error: any) {
    console.error('添加评论错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    下载资料（增加下载计数）
// @route   POST /api/materials/:id/download
// @access  Private
export const downloadMaterial = async (req: Request, res: Response) => {
  try {
    const material = await Material.findByPk(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: '资料未找到' });
    }
    
    // 更新下载次数
    await material.update({
      downloads: material.downloads + 1
    });
    
    res.json({ downloads: material.downloads, fileUrl: material.fileUrl });
  } catch (error: any) {
    console.error('下载资料错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
}; 