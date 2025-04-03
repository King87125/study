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
import { uploadMaterialMiddleware } from '../utils/fileUpload';

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
  uploadMaterialMiddleware,
  uploadMaterial
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