import express from 'express';
import { 
  getUserHealth, 
  updateWaterIntake, 
  updateSittingTime, 
  updateMenstruation,
  getHealthTips
} from '../controllers/healthController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route GET /health/user/:userId
 * @desc 获取用户健康数据
 * @access Private
 */
router.get('/user/:userId', protect, getUserHealth);

/**
 * @route POST /health/water
 * @desc 更新用户饮水记录
 * @access Private
 */
router.post('/water', protect, updateWaterIntake);

/**
 * @route POST /health/sitting
 * @desc 更新久坐时间状态
 * @access Private
 */
router.post('/sitting', protect, updateSittingTime);

/**
 * @route POST /health/menstruation
 * @desc 记录经期信息
 * @access Private
 */
router.post('/menstruation', protect, updateMenstruation);

/**
 * @route GET /health/tips
 * @desc 获取所有健康建议
 * @access Public
 */
router.get('/tips', getHealthTips);

/**
 * @route GET /health/tips/:category
 * @desc 获取特定类别的健康建议
 * @access Public
 */
router.get('/tips/:category', getHealthTips);

/**
 * @route GET /health/status
 * @desc 简单状态检查端点
 * @access Public
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'OK'
  });
});

export default router; 