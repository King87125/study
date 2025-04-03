import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // 加载 .env 文件中的环境变量

// SQLite 配置 (注释掉或移除)
/*
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.NODE_ENV === 'test' ? './database.test.sqlite' : './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // 开发环境打印日志
});
*/

// PostgreSQL 配置
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // 在实际部署中，应该抛出错误或提供一个默认的开发数据库连接（如果适用）
  // 这里我们暂时使用你提供的 Supabase URL 作为备用，但不推荐硬编码
  console.warn('警告: 未找到 DATABASE_URL 环境变量，将尝试使用备用连接字符串 (不推荐用于生产环境)。请确保在部署平台正确设置 DATABASE_URL。');
  // throw new Error('DATABASE_URL 环境变量未设置');
}

// !!重要提示!!: 下面的备用 URL 包含敏感信息，请在部署到 Render 前移除或确保 Render 环境变量优先。
const fallbackUrl = 'postgresql://postgres:Jzh040522$*-@db.yqubkxcyctefjgmoebky.supabase.co:5432/postgres';

export const sequelize = new Sequelize(databaseUrl || fallbackUrl, { // 优先使用环境变量
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Supabase 可能需要这个设置
    }
  },
  pool: {
    max: 5, // 根据 Render 免费套餐的连接数限制调整
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功 (PostgreSQL)');
    // 注意：我们不再需要在这里运行迁移，迁移将在单独的步骤中处理
    // await sequelize.sync({ alter: process.env.NODE_ENV === 'development' }); 
    // console.log('数据库同步完成');
  } catch (error) {
    console.error('无法连接到数据库:', error);
    process.exit(1); // 连接失败时退出应用
  }
};

// 同步数据库，导入所有模型后调用此函数
export const syncDatabase = async () => {
  try {
    // 导入所有模型以确保关联正确设置
    require('../models');
    
    // 使用sync()而不带force和alter选项，避免修改现有表结构
    await sequelize.sync();
    console.log('数据库同步完成');
  } catch (error) {
    console.error('数据库同步失败:', error);
    // 不终止进程，允许应用继续运行
    console.log('应用将继续运行，但某些数据库功能可能不可用');
  }
};

// 测试数据库连接
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功.');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

export default sequelize; 