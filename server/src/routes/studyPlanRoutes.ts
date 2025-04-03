import express from 'express';
import { 
  getUserStudyPlans, 
  addStudyPlan, 
  updateStudyPlan, 
  deleteStudyPlan, 
  togglePlanCompletion,
  getAllUsers,
  checkAdminStatus,
  getUserPlansAsAdmin,
  addStudyPlanAsAdmin,
  deleteStudyPlanAsAdmin,
  getAllStudyPlans
} from '../controllers/studyPlanController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 用户相关路由
router.get('/api/study-plans', authenticateToken, getUserStudyPlans);
router.post('/api/study-plans', authenticateToken, addStudyPlan);
router.put('/api/study-plans/:id', authenticateToken, updateStudyPlan);
router.delete('/api/study-plans/:id', authenticateToken, deleteStudyPlan);
router.put('/api/study-plans/:id/toggle-completion', authenticateToken, togglePlanCompletion);

// 管理员相关路由
router.get('/api/admin/study-plans/all', authenticateToken, getAllStudyPlans);
router.get('/api/users/check-admin', authenticateToken, checkAdminStatus);
router.get('/api/admin/users', authenticateToken, getAllUsers);
router.get('/api/admin/study-plans/:userId', authenticateToken, getUserPlansAsAdmin);
router.post('/api/admin/study-plans', authenticateToken, addStudyPlanAsAdmin);
router.delete('/api/admin/study-plans/:id', authenticateToken, deleteStudyPlanAsAdmin);

export default router; 