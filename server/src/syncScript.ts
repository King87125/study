import { syncDatabase, sequelize } from './config/db';
import dotenv from 'dotenv';

dotenv.config(); // 确保环境变量被加载

console.log('开始数据库同步...');

syncDatabase()
  .then(() => {
    console.log('数据库同步成功完成！');
    return sequelize.close(); // 关闭连接
  })
  .catch((error) => {
    console.error('数据库同步过程中发生错误:', error);
    process.exit(1); // 出错时退出
  })
  .finally(() => {
    console.log('同步脚本执行完毕。');
    process.exit(0); // 正常退出
  });