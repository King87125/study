import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { connectDB } from './config/db';
import userRoutes from './routes/userRoutes';
import videoRoutes from './routes/videoRoutes';
import materialRoutes from './routes/materialRoutes';
import plannerRoutes from './routes/plannerRoutes';
import { seedData } from './utils/seedData';

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB().then(() => {
  // 初始化测试数据
  seedData();
});

const app = express();
const PORT = process.env.PORT || 5002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// API路由
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/planner', plannerRoutes);

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
}); 