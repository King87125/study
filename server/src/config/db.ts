import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 创建SQLite数据库连接
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
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