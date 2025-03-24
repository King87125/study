import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 创建SQLite数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false, // 设置为true可以在控制台查看SQL日志
});

// 连接数据库
const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步模型到数据库，使用force:true强制重建所有表
    await sequelize.sync({ force: true });
    console.log('数据库模型同步完成');
  } catch (error) {
    console.error('数据库连接失败:', error);
    // 不退出进程，允许应用继续运行
    console.log('应用将继续运行，但数据库功能可能不可用');
  }
};

export { sequelize, connectDB }; 