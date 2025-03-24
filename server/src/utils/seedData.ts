import User from '../models/User';
import Video from '../models/Video';
import Material from '../models/Material';
import bcrypt from 'bcryptjs';

/**
 * 初始化测试数据
 */
export const seedData = async (): Promise<void> => {
  try {
    console.log('开始初始化测试数据...');
    
    // 创建管理员用户
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const admin = await User.create({
        username: '管理员',
        email: 'admin@example.com',
        password: hashedPassword,
        avatar: '/uploads/avatars/default-avatar.png',
        role: 'admin'
      });
      
      console.log('已创建管理员用户:', admin.username);
    }
    
    // 创建普通用户
    const userExists = await User.findOne({ where: { email: 'user@example.com' } });
    
    if (!userExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const user = await User.create({
        username: '测试用户',
        email: 'user@example.com',
        password: hashedPassword,
        avatar: '/uploads/avatars/default-avatar.png',
        role: 'user'
      });
      
      console.log('已创建普通用户:', user.username);
    }
    
    console.log('测试数据初始化完成');
  } catch (error) {
    console.error('初始化测试数据失败:', error);
  }
}; 