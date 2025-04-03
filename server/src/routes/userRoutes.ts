import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  uploadAvatar
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { searchUsers } from '../controllers/friendship.controller';
import { uploadAvatarMiddleware } from '../utils/fileUpload';

const router = express.Router();

// 公开路由
router.post('/register', registerUser);
router.post('/login', loginUser);

// 需要登录的路由
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// 上传头像路由 (简化)
router.post(
    '/avatar', 
    protect, 
    uploadAvatarMiddleware,
    uploadAvatar
);

// 添加搜索用户路由
router.get('/search', protect, searchUsers);

export default router; 