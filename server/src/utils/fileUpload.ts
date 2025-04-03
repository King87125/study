import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinaryConfig'; // 导入 Cloudinary 配置
import { Request, Response, NextFunction } from 'express'; // 导入 Response, NextFunction
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'; // 导入 Cloudinary 类型

// 使用内存存储
const memoryStorage = multer.memoryStorage();

// 辅助函数：上传文件到 Cloudinary
const uploadToCloudinary = async (file: Express.Multer.File, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 使用 upload_stream 上传缓冲区
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `kaoyan_companion/${folder}`, // 在 Cloudinary 中创建子文件夹
        resource_type: 'auto', // 自动检测资源类型 (image, video, raw)
        public_id: `${folder.slice(0, -1)}-${Date.now()}` // 设置一个基础文件名
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => { // 添加类型
        if (error) {
          console.error('Cloudinary 上传错误:', error);
          return reject(new Error('文件上传到 Cloudinary 失败'));
        }
        if (!result) {
            return reject(new Error('Cloudinary 未返回上传结果'));
        }
        console.log('Cloudinary 上传成功:', result.secure_url);
        resolve(result.secure_url);
      }
    );

    // 将 multer 内存中的 buffer 写入 Cloudinary 的上传流
    uploadStream.end(file.buffer);
  });
};

// 文件过滤器：视频
const videoFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的视频文件扩展名
  const fileExtTypes = /mp4|mov|avi|wmv|flv|mkv|webm|m4v|3gp/i;
  const extname = fileExtTypes.test(path.extname(file.originalname).toLowerCase());
  
  // 允许的MIME类型
  const mimeTypes = /video\/.*/i;  // 允许任何video/*类型
  const mimetype = mimeTypes.test(file.mimetype);

  // 检查文件类型
  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只支持视频文件格式 (mp4, mov, avi, wmv, flv, mkv, webm 等)'));
  }
};

// 文件过滤器：资料
const materialFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('不支持的文件类型!'));
  }
};

// 文件过滤器：头像
const avatarFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只支持图片文件!'));
  }
};

// 修改导出：导出处理上传和 Cloudinary 集成的中间件

const createUploadMiddleware = (fieldName: string, folder: string, fileFilter: multer.Options['fileFilter'], limits: multer.Options['limits']) => {
  const upload = multer({ storage: memoryStorage, fileFilter, limits });

  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, async (err: any) => {
      if (err) {
        console.error(`${folder} 上传 multer 错误:`, err);
        // 根据错误类型返回不同的消息
        if (err instanceof multer.MulterError) {
             const fileSizeLimitMB = limits?.fileSize ? (limits.fileSize / 1024 / 1024).toFixed(1) : 'N/A'; // 修正数字调用
             if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: `文件大小超出限制 (${fileSizeLimitMB}MB)` });
             }
             if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ message: `字段名应为 '${fieldName}'` });
             }
        }
        return res.status(400).json({ message: err.message || '文件处理失败' });
      }

      if (!req.file) {
        // 允许没有文件的情况继续，由控制器处理
        // console.log(`没有文件上传到字段 ${fieldName}`);
        return next(); 
        // 或者如果必须有文件，则返回错误:
        // return res.status(400).json({ message: '请上传文件' });
      }

      try {
        // 上传到 Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(req.file, folder);
        
        // 将 Cloudinary URL 附加到 req.file 或 req.body
        // 约定将 URL 放在 req.file.path 中，方便控制器访问
        (req.file as any).path = cloudinaryUrl;
        
        // 同时也可以添加到 req.body 对应的字段，如果路由处理逻辑依赖它
        if (folder === 'avatars') req.body.avatarUrl = cloudinaryUrl; 
        if (folder === 'materials') req.body.fileUrl = cloudinaryUrl;
        if (folder === 'videos') req.body.videoUrl = cloudinaryUrl;
        if (folder === 'thumbnails') req.body.thumbnailUrl = cloudinaryUrl; // 假设有缩略图上传

        console.log(`${folder} 文件已上传到 Cloudinary: ${cloudinaryUrl}`);
        next(); // 继续到下一个中间件或路由处理器
      } catch (uploadError: any) {
        console.error(`${folder} 上传到 Cloudinary 失败:`, uploadError);
        return res.status(500).json({ message: uploadError.message || '文件上传失败' });
      }
    });
  };
};

// 导出新的中间件创建函数
export const uploadAvatarMiddleware = createUploadMiddleware('avatar', 'avatars', avatarFilter, { fileSize: 1024 * 1024 * 2 }); // 2MB
export const uploadMaterialMiddleware = createUploadMiddleware('file', 'materials', materialFilter, { fileSize: 1024 * 1024 * 50 }); // 50MB
export const uploadVideoMiddleware = createUploadMiddleware('video', 'videos', videoFilter, { fileSize: 1024 * 1024 * 500 }); // 500MB
// 如果有缩略图上传，也需要一个类似的中间件
// export const uploadThumbnailMiddleware = createUploadMiddleware('thumbnail', 'thumbnails', avatarFilter, { fileSize: 1024 * 1024 * 5 }); // 5MB

// 移除旧的导出
/*
export const uploadVideo = multer({ ... });
export const uploadMaterial = multer({ ... });
export const uploadAvatar = multer({ ... });
*/ 