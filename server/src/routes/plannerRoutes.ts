import express from 'express';
// 重写导入语句，使用相对路径
import * as plannerController from '../controllers/planner.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// 学习事件路由
router.get('/study-events', protect, plannerController.getEvents);
router.post('/study-events', protect, plannerController.createEvent);
router.patch('/study-events/:id', protect, plannerController.updateEvent);
router.delete('/study-events/:id', protect, plannerController.deleteEvent);

// 任务路由
router.get('/tasks', protect, plannerController.getTasks);
router.post('/tasks', protect, plannerController.createTask);
router.patch('/tasks/:id', protect, plannerController.updateTask);
router.delete('/tasks/:id', protect, plannerController.deleteTask);

// 考试日期路由
router.get('/exam-date', protect, plannerController.getExamDate);
router.post('/exam-date', protect, plannerController.updateExamDate);

// 学习进度路由
router.get('/progress', protect, plannerController.getProgress);

export default router; 