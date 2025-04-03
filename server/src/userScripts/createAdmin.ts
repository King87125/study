import bcrypt from 'bcryptjs';
import { db } from '../db';

/**
 * 创建管理员账号
 */
export const createAdminUser = async () => {
  try {
    const adminEmail = '040522@hlp.jzh';
    
    // 检查管理员账号是否已存在
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (existingAdmin) {
      // 如果账号存在但不是管理员，更新为管理员
      if (!existingAdmin.is_admin) {
        await db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [adminEmail]);
        console.log('已将账号更新为管理员权限');
      } else {
        console.log('管理员账号已存在，无需重新创建');
      }
      return;
    }
    
    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('20030314', salt);
    
    // 创建管理员用户
    await db.run(`
      INSERT INTO users (username, email, password, is_admin, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, ['管理员', adminEmail, hashedPassword, 1]);
    
    console.log('管理员账号创建成功');
  } catch (error) {
    console.error('创建管理员账号失败:', error);
  }
}; 