import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  uploadAvatar
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { searchUsers } from '../controllers/friendship.controller';

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 限制5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件!'));
    }
  },
});

// 公开路由
router.post('/register', registerUser);
router.post('/login', loginUser);

// 需要登录的路由
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

// 添加搜索用户路由
router.get('/search', protect, searchUsers);

export default router; 