import express from 'express';
import * as friendshipController from '../controllers/friendship.controller';
import * as supervisionController from '../controllers/supervision.controller';
// 假设这些是已有的控制器
import * as userController from '../controllers/userController';
import * as plannerController from '../controllers/plannerController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 用户相关路由
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.get('/users/profile', authMiddleware, userController.getProfile);
router.put('/users/profile', authMiddleware, userController.updateProfile);

// 任务相关路由
router.get('/tasks', authMiddleware, plannerController.getTasks);
router.post('/tasks', authMiddleware, plannerController.createTask);
router.put('/tasks/:id', authMiddleware, plannerController.updateTask);
router.delete('/tasks/:id', authMiddleware, plannerController.deleteTask);

// 事件相关路由
router.get('/events', authMiddleware, plannerController.getEvents);
router.post('/events', authMiddleware, plannerController.createEvent);
router.put('/events/:id', authMiddleware, plannerController.updateEvent);
router.delete('/events/:id', authMiddleware, plannerController.deleteEvent);

// 考试日期相关路由
router.get('/exam-date', authMiddleware, plannerController.getExamDate);
router.post('/exam-date', authMiddleware, plannerController.setExamDate);
router.put('/exam-date/:id', authMiddleware, plannerController.updateExamDate);

// 好友相关路由
router.get('/friends', authMiddleware, friendshipController.getFriends);
router.get('/friend-requests', authMiddleware, friendshipController.getFriendRequests);
router.post('/friend-requests', authMiddleware, friendshipController.sendFriendRequest);
router.put('/friend-requests/:requestId/accept', authMiddleware, friendshipController.acceptFriendRequest);
router.put('/friend-requests/:requestId/reject', authMiddleware, friendshipController.rejectFriendRequest);
router.delete('/friends/:friendId', authMiddleware, friendshipController.removeFriend);
router.get('/users/search', authMiddleware, friendshipController.searchUsers);

// 学习监督相关路由
router.get('/supervisions', authMiddleware, supervisionController.getMySupervisions);
router.get('/supervised-users', authMiddleware, supervisionController.getMySupervisedUsers);
router.post('/supervisions', authMiddleware, supervisionController.createSupervision);
router.put('/supervisions/:supervisionId', authMiddleware, supervisionController.updateSupervision);
router.delete('/supervisions/:supervisionId', authMiddleware, supervisionController.deleteSupervision);
router.get('/users/:userId/study-stats', authMiddleware, supervisionController.getUserStudyStats);

export default router; 