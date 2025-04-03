import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config(); // 加载环境变量

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(
    '警告: Cloudinary 环境变量 (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) 未完全设置。文件上传功能可能无法正常工作。'
  );
  // 在生产环境中，你可能希望抛出错误阻止应用启动
  // throw new Error('Cloudinary 环境变量未完全设置');
}

// 使用环境变量配置 Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true, // 推荐使用 https
});

export default cloudinary;
