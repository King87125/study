import express, { Request, Response, NextFunction } from 'express';
import { getVideos, getVideoById, uploadVideo, updateVideo, deleteVideo } from '../controllers/videoController';
import { protect } from '../middleware/authMiddleware';
import { uploadVideo as uploadVideoMiddleware } from '../utils/fileUpload';

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
  (req: Request, res: Response, next: NextFunction): void => {
    uploadVideoMiddleware.single('video')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: '视频文件大小超出限制(最大500MB)' });
        }
        console.error('视频上传错误:', err);
        return res.status(400).json({ message: err.message || '视频上传失败' });
      }
      
      console.log('视频上传中间件处理:', { file: req.file, body: req.body });
      
      if (req.file) {
        // 添加文件路径到请求体
        req.body.videoUrl = `/uploads/videos/${req.file.filename}`;
        
        // 如果有缩略图文件
        if (req.body.thumbnailUrl && req.body.thumbnailUrl.startsWith('data:image')) {
          // 在实际项目中需要处理base64图像并保存
          // 这里简化处理
          req.body.thumbnailUrl = '/uploads/thumbnails/default-thumbnail.jpg';
        } else {
          req.body.thumbnailUrl = '/uploads/thumbnails/default-thumbnail.jpg';
        }
        
        next();
      } else {
        res.status(400).json({ message: '请上传视频文件' });
      }
    });
  },
  (req: Request, res: Response): void => {
    uploadVideo(req, res);
  }
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