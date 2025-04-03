import express, { Request, Response, NextFunction } from 'express';
import { getVideos, getVideoById, uploadVideo, updateVideo, deleteVideo } from '../controllers/videoController';
import { protect } from '../middleware/authMiddleware';
import { uploadVideoMiddleware } from '../utils/fileUpload';

const router = express.Router();

// 获取所有视频 - 公开访问
router.get('/', (req: Request, res: Response): void => {
  getVideos(req, res);
});

// 获取视频详情 - 公开访问
router.get('/:id', (req: Request, res: Response): void => {
  getVideoById(req, res);
});

// 上传视频 - 需要登录
router.post(
  '/',
  protect,
  uploadVideoMiddleware,
  uploadVideo
);

// 更新视频信息 - 需要登录
router.put('/:id', protect, (req: Request, res: Response): void => {
  updateVideo(req, res);
});

// 删除视频 - 需要登录
router.delete('/:id', protect, (req: Request, res: Response): void => {
  deleteVideo(req, res);
});

export default router; 