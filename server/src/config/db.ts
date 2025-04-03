import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 使用 DATABASE_URL 环境变量连接 PostgreSQL，如果不存在则回退到 SQLite (用于本地开发)
const databaseUrl = process.env.DATABASE_URL;

export const sequelize = databaseUrl 
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres', // 指定数据库类型为 PostgreSQL
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Supabase 可能需要这个配置
        }
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false, // 在开发环境打印日志
    })
  : new Sequelize({ // 本地 SQLite 配置 (回退)
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database.sqlite'), // 保持本地 SQLite 路径
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });

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