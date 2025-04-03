import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db'; // Import sequelize instance from db.ts
import User from '../models/User';
import Video from '../models/Video';
import Material from '../models/Material';

/**
 * 使用 Sequelize 初始化测试数据
 */
export const seedData = async () => {
  try {
    console.log('开始使用 Sequelize 初始化测试数据...');

    // 确保数据库连接成功
    await sequelize.authenticate();
    console.log('Sequelize 数据库连接成功.');

    // 同步数据库模型 (注意：在生产环境中，通常使用迁移而不是 sync)
    // force: true 会删除现有表并重新创建，仅在开发和首次填充时使用
    await sequelize.sync({ force: true });
    console.log('Sequelize 模型同步完成 (表已创建/重置)');

    // --- 创建用户 ---
    let testUserId: number | undefined;
    try {
      const testUserEmail = 'test@example.com';
      const [user, created] = await User.findOrCreate({
        where: { email: testUserEmail },
        defaults: {
          username: '测试用户',
          email: testUserEmail,
          password: await bcrypt.hash('password123', 10),
          role: 'user', // 使用 role 字段
        }
      });
      testUserId = user.id; // 获取创建或找到的用户的 ID
      if (created) {
        console.log('测试用户创建成功');
      } else {
        console.log('测试用户已存在，跳过创建');
      }
    } catch (error) {
      console.error('创建测试用户失败:', error);
    }

    // 确保有测试用户 ID 才继续
    if (!testUserId) {
        console.error("无法获取测试用户 ID，无法创建依赖于用户的测试数据。")
        testUserId = 1; // 尝试回退到假定 ID=1，但这不健壮
        console.warn("回退使用假定的测试用户 ID: 1")
    }

    // --- 创建测试视频 ---
    try {
      const [video, created] = await Video.findOrCreate({
        where: { title: '数学基础概念讲解' }, 
        defaults: {
          title: '数学基础概念讲解',
          description: '这是一个关于基础数学概念的视频讲解',
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // 使用有效的示例 URL
          thumbnailUrl: '/uploads/thumbnails/default-thumbnail.jpg', // 保持默认
          duration: 60, // 示例时长 60 秒
          uploadedById: testUserId, // 使用获取到的用户 ID
          category: '数学',
          subject: '高等数学', // 更具体的科目示例
          difficulty: 'easy', // 修改为 'easy'
          views: 10, // 示例观看次数
        }
      });
      if (created) {
        console.log('测试视频创建成功');
      } else {
        console.log('视频数据已存在，跳过创建');
      }
    } catch (error) {
      console.error('创建测试视频失败:', error);
    }

    // --- 创建测试学习资料 ---
    try {
      const [material, created] = await Material.findOrCreate({
        where: { title: '高等数学学习资料' }, 
        defaults: {
          title: '高等数学学习资料',
          description: '这是一份高等数学的学习资料，包含了微积分、线性代数等内容',
          fileUrl: '/uploads/materials/sample.pdf', // 使用示例文件路径
          thumbnailUrl: '/uploads/thumbnails/default-material.jpg', // 保持默认
          fileType: 'pdf',
          fileSize: 1024 * 1024 * 1, // 1MB
          uploadedById: testUserId, // 使用获取到的用户 ID
          category: '数学',
          subject: '高等数学', 
          downloads: 5, // 示例下载次数
        }
      });
      if (created) {
        console.log('测试学习资料创建成功');
      } else {
        console.log('学习资料已存在，跳过创建');
      }
    } catch (error) {
      console.error('创建测试学习资料失败:', error);
    }

    // --- 创建或更新管理员账号 ---
    await createAdminUser();

    console.log('Sequelize 测试数据初始化完成');
  } catch (error) {
    console.error('Sequelize 初始化测试数据失败:', error);
    process.exit(1); // 如果初始化失败，退出进程
  } finally {
     // 通常不需要显式关闭，连接池会自动管理
     // await sequelize.close();
     // console.log('数据库连接已关闭');
  }
};

// 使用 Sequelize 添加管理员账号
const createAdminUser = async () => {
  try {
    const adminEmail = '040522@hlp.jzh';
    const adminUsername = 'admin_jzh_040522'; // 修改用户名以增加唯一性
    const adminPassword = '20030314';

    let adminUser = await User.findOne({ where: { email: adminEmail } });

    if (adminUser) {
      // 用户已存在，确保是管理员
      if (adminUser.role !== 'admin') { // 检查 role 字段
        await adminUser.update({ role: 'admin' }); // 更新 role 字段
        console.log(`用户 ${adminEmail} 已存在，已将其权限更新为管理员`);
      } else {
        console.log(`管理员账号 ${adminEmail} 已存在且具有管理员权限`);
      }
    } else {
      // 用户不存在，创建新管理员
      console.log(`管理员账号 ${adminEmail} 不存在，正在创建...`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
       try {
          adminUser = await User.create({
            username: adminUsername,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin', // 使用 role 字段
          });
          console.log(`管理员账号 ${adminEmail} 创建成功`);
       } catch (createError: any) {
         // 处理可能的用户名唯一性冲突
         if (createError.name === 'SequelizeUniqueConstraintError') {
           console.warn(`创建管理员时用户名 '${adminUsername}' 已被使用，尝试查找并更新邮箱对应的用户`);
           const existingUserByEmail = await User.findOne({ where: { email: adminEmail } });
           if (existingUserByEmail) {
              if (existingUserByEmail.role !== 'admin') { // 检查 role 字段
                 await existingUserByEmail.update({ role: 'admin' }); // 更新 role 字段
                 console.log(`已将现有用户 ${adminEmail} 的权限更新为管理员 (因用户名冲突)`);
              } else {
                 console.log(`现有用户 ${adminEmail} 已是管理员 (因用户名冲突)`);
              }
           } else {
              console.error(`用户名冲突，但无法根据邮箱 ${adminEmail} 找到现有用户进行更新`);
           }
         } else {
           throw createError; // 重新抛出其他创建错误
         }
       }
    }
  } catch (error) {
    console.error('处理管理员账号失败:', error);
  }
};

// 如果直接运行此文件，则执行 seedData
if (require.main === module) {
  seedData();
} 