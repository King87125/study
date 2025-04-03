import bcrypt from 'bcryptjs';
// import { db } from '../db'; // 移除旧 db
import User from '../models/User'; // 导入 Sequelize 模型
import Video from '../models/Video';
import Material from '../models/Material';
// 可能还需要导入其他模型...

/**
 * 初始化测试数据
 */
export const seedData = async () => {
  try {
    // 检查用户表是否为空
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('用户表为空，开始填充初始数据...');

      // 创建初始用户 (使用 Sequelize)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt); // 示例密码
      
      const users = await User.bulkCreate([
        {
          username: '测试用户',
          email: 'test@example.com',
          password: hashedPassword,
          role: 'user'
        },
        {
          username: '管理员用户',
          email: 'admin@example.com',
          password: hashedPassword, // 实际应用中应使用不同密码
          role: 'admin'
        },
      ], { validate: true }); // validate: true 会触发 beforeCreate 钩子加密密码
      
      console.log(`${users.length} 个初始用户已创建.`);
      
      const testUser = users.find(u => u.email === 'test@example.com');
      const adminUser = users.find(u => u.email === 'admin@example.com');
      
      if (testUser && adminUser) {
          // 创建初始视频 (使用 Sequelize)
          await Video.bulkCreate([
            {
              title: '示例视频 1: 高数基础',
              description: '这是高数基础视频的描述...',
              videoUrl: 'https://res.cloudinary.com/dr4rhdl38/video/upload/v1717488901/kaoyan_companion/videos/video-1717488900704-303406441.mp4', // 使用 Cloudinary URL 或占位符
              thumbnailUrl: 'https://res.cloudinary.com/dr4rhdl38/image/upload/v1717488882/kaoyan_companion/thumbnails/thumbnail-1717488881905.png', // 使用 Cloudinary URL 或占位符
              category: '数学',
              subject: '高等数学',
              difficulty: 'easy',
              uploadedById: testUser.id,
              duration: 3660, // 秒
            },
             {
              title: '示例视频 2: 线性代数入门',
              description: '线性代数入门介绍...',
              videoUrl: 'https://res.cloudinary.com/dr4rhdl38/video/upload/v1717488901/kaoyan_companion/videos/video-1717488900704-303406441.mp4', // 占位符
              thumbnailUrl: 'https://res.cloudinary.com/dr4rhdl38/image/upload/v1717488882/kaoyan_companion/thumbnails/thumbnail-1717488881905.png', // 占位符
              category: '数学',
              subject: '线性代数',
              difficulty: 'medium',
              uploadedById: adminUser.id,
              duration: 4820, // 秒
            }
          ]);
          console.log('初始视频已创建.');
          
          // 创建初始资料 (使用 Sequelize)
          await Material.bulkCreate([
            {
              title: '示例资料 1: 英语词汇表',
              description: '考研核心英语词汇整理...',
              fileUrl: 'https://res.cloudinary.com/dr4rhdl38/raw/upload/v1717488912/kaoyan_companion/materials/material-1717488911533-672971674.pdf', // 使用 Cloudinary URL 或占位符
              thumbnailUrl: '/uploads/thumbnails/default-material.jpg', // 默认缩略图
              category: '英语',
              subject: '词汇',
              fileType: 'pdf',
              fileSize: 1024 * 1024 * 2, // 2MB
              uploadedById: testUser.id,
            }
          ]);
          console.log('初始资料已创建.');
      } else {
          console.warn('未找到测试用户或管理员用户，无法创建关联的初始数据。')
      }

    } else {
      console.log('数据库非空，跳过数据填充。');
    }

    // 移除旧的 SQLite 逻辑
    /*
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (...);
      CREATE TABLE IF NOT EXISTS videos (...);
      CREATE TABLE IF NOT EXISTS materials (...);
      // ... 其他表 ...
    `);
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('数据库为空，填充初始数据...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', ['testuser', 'test@example.com', hashedPassword]);
      // ... 插入其他数据 ...
    } else {
      console.log('数据库非空，跳过数据填充。');
    }
    */

  } catch (error) {
    console.error('填充初始数据时出错:', error);
  }
};

// 添加管理员账号
const createAdminUser = async () => {
  try {
    const adminEmail = '040522@hlp.jzh';
    
    // 检查管理员账号是否已存在
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      // 如果账号存在，确保其管理员权限为 'admin'
      if (existingAdmin.role !== 'admin') {
        await User.update({ role: 'admin' }, { where: { email: adminEmail } });
        console.log(`用户 ${adminEmail} 已存在，已将其权限更新为管理员`);
      } else {
        console.log(`管理员账号 ${adminEmail} 已存在且具有管理员权限`);
      }
      return;
    }
    
    // 如果账号不存在，则创建新管理员账号
    console.log(`管理员账号 ${adminEmail} 不存在，正在创建...`);
    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('20030314', salt);
    
    // 创建管理员用户，使用特定用户名避免冲突
    const adminUsername = 'admin_user_040522'; 
    try {
    await User.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });
      console.log(`管理员账号 ${adminEmail} 创建成功`);
    } catch (insertError: any) {
      if (insertError.code === 'SQLITE_CONSTRAINT' && insertError.message.includes('UNIQUE constraint failed: Users.username')) {
        console.warn(`用户名 ${adminUsername} 已存在，尝试查找并更新现有用户 ${adminEmail} 的管理员权限`);
        // 如果用户名已存在但邮箱不同，这表示数据不一致，但我们仍尝试确保该邮箱是管理员
         await User.update({ role: 'admin' }, { where: { email: adminEmail } });
         console.log(`已将现有用户 ${adminEmail} 的权限更新为管理员`);
      } else {
        throw insertError; // 重新抛出其他插入错误
      }
    }
  } catch (error) {
    console.error('处理管理员账号失败:', error);
  }
}; 