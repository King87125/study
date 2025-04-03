import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { testConnection, syncDatabase } from './config/db';
import userRoutes from './routes/userRoutes';
import videoRoutes from './routes/videoRoutes';
import materialRoutes from './routes/materialRoutes';
import plannerRoutes from './routes/plannerRoutes';
import healthRoutes from './routes/healthRoutes';
import studyPlanRoutes from './routes/studyPlanRoutes';
import apiRoutes from './routes/api';
import { seedData } from './utils/seedData';
import { validateUserId, checkWaterGoal, checkSittingTime, formatHealthResponse } from './middleware/healthMiddleware';
import { createAdminUser } from './userScripts/createAdmin';
import dns from 'dns';

// 加载环境变量
dotenv.config();

dns.setDefaultResultOrder('ipv4first'); // 强制优先使用 IPv4

// 启动函数
const startServer = async () => {
  // 测试数据库连接
  const connectionSuccess = await testConnection();
  
  if (connectionSuccess) {
    // 同步数据库模型
    await syncDatabase();
    
    // 初始化测试数据
    await seedData();
    
    // 创建管理员账号
    await createAdminUser();
  } else {
    console.log('数据库连接失败，服务将继续启动但某些功能可能不可用');
  }

  const app = express();
  const PORT = process.env.PORT || 5001;

  // 中间件
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 健康管理中间件 - 应用于所有健康相关路由
  app.use('/api/health', formatHealthResponse);

  // 静态文件服务
  app.use('/uploads', express.static(join(__dirname, '../uploads')));

  // API路由
  app.use('/api/users', userRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/materials', materialRoutes);
  app.use('/api/planner', plannerRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/', studyPlanRoutes);
  app.use('/api', apiRoutes);

  // 根路由
  app.get('/', (req: Request, res: Response) => {
    res.send('考研伴侣API服务运行中...');
  });

  // 错误处理中间件
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  });

  // 处理404
  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: '请求的资源不存在' });
  });

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`健康管理端点: http://localhost:${PORT}/api/health/user/:userId`);
  });
};

// 启动服务器
startServer().catch(err => {
  console.error('服务器启动失败:', err);
}); 