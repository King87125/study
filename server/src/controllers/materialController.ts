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
    
    // 为每个材料添加_id字段
    const formattedMaterials = await Promise.all(materials.map(async (material) => {
      const materialJSON = material.toJSON() as any;
      
      // 查询上传者信息
      const uploadedBy = await User.findByPk(material.uploadedById);
      
      return {
        ...materialJSON,
        _id: material.id,
        uploadedBy: uploadedBy ? {
          _id: uploadedBy.id,
          username: uploadedBy.username,
          avatar: uploadedBy.avatar || '/uploads/avatars/default.jpg'
        } : null
      };
    }));
      
    res.json({
      materials: formattedMaterials,
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
      // 查询上传者信息
      const uploadedBy = await User.findByPk(material.uploadedById);
      
      // 格式化响应，添加_id字段
      const materialJSON = material.toJSON() as any;
      const response = {
        ...materialJSON,
        _id: material.id,
        uploadedBy: uploadedBy ? {
          _id: uploadedBy.id,
          username: uploadedBy.username,
          avatar: uploadedBy.avatar || '/uploads/avatars/default.jpg'
        } : null,
        comments: materialJSON.comments ? materialJSON.comments.map((comment: any) => ({
          ...comment,
          _id: comment.id,
          user: {
            ...comment.User,
            _id: comment.User.id
          }
        })) : []
      };
      
      res.json(response);
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
    const { title, description, fileUrl, thumbnailUrl, category, subject, fileType, fileSize } = req.body;
    
    console.log('上传资料请求体:', req.body);
    console.log('上传资料文件:', req.file);
    
    if (!fileUrl) {
      return res.status(400).json({ message: '请提供文件URL' });
    }
    
    const userId = (req as any).user.id;
    
    // 查询用户信息
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const material = await Material.create({
      title,
      description,
      fileUrl,
      thumbnailUrl: thumbnailUrl || '/uploads/thumbnails/default-material.jpg',
      category,
      subject,
      fileType,
      fileSize,
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
    
    // 添加_id字段以匹配前端期望的格式
    const materialJSON = materialWithUser?.toJSON() as any;
    const response = {
      ...materialJSON,
      _id: materialWithUser?.id,
      uploadedBy: {
        _id: user.id,
        username: user.username,
        avatar: user.avatar || '/uploads/avatars/default.jpg'
      }
    };
    
    res.status(201).json(response);
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
    
    // 格式化评论响应
    const commentJSON = commentWithUser?.toJSON() as any;
    const formattedComment = {
      ...commentJSON,
      _id: commentJSON.id,
      user: {
        _id: commentJSON.User.id,
        username: commentJSON.User.username,
        avatar: commentJSON.User.avatar || '/uploads/avatars/default.jpg'
      }
    };
    
    res.status(201).json(formattedComment);
  } catch (error: any) {
    console.error('添加评论错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// @desc    下载资料
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
    
    // 确保提供完整的文件URL，如果是相对路径的话添加主机信息
    const fileUrl = material.fileUrl.startsWith('http') 
      ? material.fileUrl 
      : `${req.protocol}://${req.get('host')}${material.fileUrl}`;
    
    res.json({ fileUrl, message: '下载成功' });
  } catch (error: any) {
    console.error('下载资料错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
}; 