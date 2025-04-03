import express, { Request, Response, NextFunction } from 'express';
import { 
  getMaterials, 
  getMaterialById, 
  uploadMaterial, 
  updateMaterial, 
  deleteMaterial, 
  addComment,
  downloadMaterial
} from '../controllers/materialController';
import {
  getAnnotations,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation
} from '../controllers/annotationController';
import { protect } from '../middleware/authMiddleware';
import { uploadMaterial as uploadMaterialMiddleware } from '../utils/fileUpload';

const router = express.Router();

// 获取所有资料 - 公开访问
router.get('/', (req: Request, res: Response): void => {
  getMaterials(req, res);
});

// 获取资料详情 - 公开访问
router.get('/:id', (req: Request, res: Response): void => {
  getMaterialById(req, res);
});

// 上传资料 - 需要登录
router.post(
  '/',
  protect,
  (req: Request, res: Response, next: NextFunction) => {
    uploadMaterialMiddleware.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FIELD_VALUE') {
          return res.status(400).json({ message: '表单字段值过大' });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: '文件大小超出限制(最大50MB)' });
        }
        console.error('文件上传错误:', err);
        return res.status(400).json({ message: err.message || '文件上传失败' });
      }
      
      console.log('文件上传中间件处理:', { file: req.file, body: req.body });
      
      if (req.file) {
        // 添加文件信息到请求体
        req.body.fileUrl = `/uploads/materials/${req.file.filename}`;
        req.body.fileType = req.file.mimetype || req.file.originalname.split('.').pop();
        req.body.fileSize = req.file.size;
        
        // 添加默认缩略图
        req.body.thumbnailUrl = '/uploads/thumbnails/default-material.jpg';
        
        console.log('处理后的请求:', { body: req.body });
        
        next();
      } else {
        console.log('文件上传失败:', req.body);
        res.status(400).json({ message: '请上传文件' });
      }
    });
  },
  (req: Request, res: Response): void => {
    uploadMaterial(req, res);
  }
);

// 更新资料信息 - 需要登录
router.put('/:id', protect, (req: Request, res: Response): void => {
  updateMaterial(req, res);
});

// 删除资料 - 需要登录
router.delete('/:id', protect, (req: Request, res: Response): void => {
  deleteMaterial(req, res);
});

// 添加评论 - 需要登录
router.post('/:id/comment', protect, (req: Request, res: Response): void => {
  addComment(req, res);
});

// 下载资料 - 需要登录
router.post('/:id/download', protect, (req: Request, res: Response): void => {
  downloadMaterial(req, res);
});

// 添加标注相关路由
// 获取资料的所有标注 - 需要登录
router.get('/:materialId/annotations', protect, (req: Request, res: Response): void => {
  getAnnotations(req, res);
});

// 创建新标注 - 需要登录
router.post('/:materialId/annotations', protect, (req: Request, res: Response): void => {
  createAnnotation(req, res);
});

// 更新标注 - 需要登录
router.put('/:materialId/annotations/:annotationId', protect, (req: Request, res: Response): void => {
  updateAnnotation(req, res);
});

// 删除标注 - 需要登录
router.delete('/:materialId/annotations/:annotationId', protect, (req: Request, res: Response): void => {
  deleteAnnotation(req, res);
});

export default router; 