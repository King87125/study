import bcrypt from 'bcryptjs';
// import { db } from '../db'; // 移除旧的 db 导入
import User from '../models/User'; // 导入 Sequelize User 模型

/**
 * 创建管理员账号
 */
export const createAdminUser = async () => {
  try {
    const adminEmail = '040522@hlp.jzh';
    const adminUsername = '管理员';
    // 重要：切勿在代码中硬编码密码！应从环境变量读取或使用更安全的方式。
    // 这里仅作示例，实际应使用环境变量。
    const adminPassword = process.env.ADMIN_PASSWORD || 'your_strong_admin_password'; // 替换为强密码或从环境变量读取

    // 检查管理员是否已存在
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      // 哈希密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // 使用 Sequelize 创建管理员用户
      await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin', // 使用 role 字段
        // 可能需要添加其他必需字段的默认值
      });
      console.log(`管理员账号 (${adminEmail}) 创建成功。`);
    } else {
      console.log(`管理员账号 (${adminEmail}) 已存在。`);
    }

    // 移除旧的 SQLite 查询
    /*
    await db.run(`
      INSERT OR IGNORE INTO users (username, email, password, is_admin, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [adminUsername, adminEmail, hashedPassword, 1]);
    */

  } catch (error) {
    console.error('创建管理员账号时出错:', error);
  }
}; 