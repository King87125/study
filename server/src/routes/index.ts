import express from 'express';
import userRoutes from './userRoutes';
import videoRoutes from './videoRoutes';
import materialRoutes from './materialRoutes';
// import commentRoutes from './commentRoutes';
import plannerRoutes from './plannerRoutes';
import healthRoutes from './healthRoutes';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/videos', videoRoutes);
router.use('/materials', materialRoutes);
// router.use('/comments', commentRoutes);
router.use('/planner', plannerRoutes);
router.use('/health', healthRoutes);

export default router;
