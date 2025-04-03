import bcrypt from 'bcryptjs';
import { db } from '../db';

/**
 * 初始化测试数据
 */
export const seedData = async () => {
  try {
    console.log('开始初始化测试数据...');

    // 检查并创建测试用户
    try {
      const existingUsers = await db.all('SELECT * FROM users WHERE email = ?', ['test@example.com']);
      if (existingUsers.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        await db.run(`
          INSERT INTO users (username, email, password, is_admin, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, ['测试用户', 'test@example.com', hashedPassword, 0]);
        
        console.log('测试用户创建成功');
      } else {
        console.log('测试用户已存在，跳过创建');
      }
    } catch (error) {
      console.error('创建测试用户失败:', error);
    }

    // 检查并创建测试视频
    try {
      const existingVideos = await db.all('SELECT * FROM videos LIMIT 1');
      if (existingVideos.length === 0) {
        await db.run(`
          INSERT INTO videos (title, description, file_url, thumbnail, duration, user_id, category, tags, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          '数学基础概念讲解', 
          '这是一个关于基础数学概念的视频讲解',
          'https://example.com/videos/math-basics.mp4',
          '/uploads/thumbnails/math-thumbnail.jpg',
          3600,
          1,
          '数学',
          '基础,数学,考研'
        ]);
        
        console.log('测试视频创建成功');
      } else {
        console.log('视频数据已存在，跳过创建');
      }
    } catch (error) {
      console.error('创建测试视频失败:', error);
    }

    // 检查并创建测试学习资料
    try {
      const existingMaterials = await db.all('SELECT * FROM materials LIMIT 1');
      if (existingMaterials.length === 0) {
        await db.run(`
          INSERT INTO materials (title, description, file_url, file_type, file_size, user_id, category, tags, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          '高等数学学习资料',
          '这是一份高等数学的学习资料，包含了微积分、线性代数等内容',
          '/uploads/materials/advanced-math.pdf',
          'pdf',
          1024 * 1024 * 5, // 5MB
          1,
          '数学',
          '高数,微积分,线性代数,考研'
        ]);
        
        console.log('测试学习资料创建成功');
      } else {
        console.log('学习资料已存在，跳过创建');
      }
    } catch (error) {
      console.error('创建测试学习资料失败:', error);
    }

    // 检查并创建管理员账号
    await createAdminUser();
    
    console.log('测试数据初始化完成');
  } catch (error) {
    console.error('初始化测试数据失败:', error);
  }
};

// 添加管理员账号
const createAdminUser = async () => {
  try {
    const adminEmail = '040522@hlp.jzh';
    
    // 检查管理员账号是否已存在
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (existingAdmin) {
      // 如果账号存在，确保其管理员权限为 1
      if (!existingAdmin.is_admin) {
        await db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [adminEmail]);
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
      await db.run(`
        INSERT INTO users (username, email, password, is_admin, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [adminUsername, adminEmail, hashedPassword, 1]);
      console.log(`管理员账号 ${adminEmail} 创建成功`);
    } catch (insertError: any) {
      if (insertError.code === 'SQLITE_CONSTRAINT' && insertError.message.includes('UNIQUE constraint failed: Users.username')) {
        console.warn(`用户名 ${adminUsername} 已存在，尝试查找并更新现有用户 ${adminEmail} 的管理员权限`);
        // 如果用户名已存在但邮箱不同，这表示数据不一致，但我们仍尝试确保该邮箱是管理员
         await db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [adminEmail]);
         console.log(`已将现有用户 ${adminEmail} 的权限更新为管理员`);
      } else {
        throw insertError; // 重新抛出其他插入错误
      }
    }
  } catch (error) {
    console.error('处理管理员账号失败:', error);
  }
}; 