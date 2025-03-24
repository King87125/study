import express from 'express';
import userRoutes from './userRoutes';
import videoRoutes from './videoRoutes';
import materialRoutes from './materialRoutes';
// import commentRoutes from './commentRoutes';
import plannerRoutes from './plannerRoutes';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/videos', videoRoutes);
router.use('/materials', materialRoutes);
// router.use('/comments', commentRoutes);
router.use('/planner', plannerRoutes);

export default router; 