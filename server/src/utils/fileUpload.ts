import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 确保上传目录存在
const createUploadDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 视频存储
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 资料存储
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/materials');
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `material-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 头像存储
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 文件过滤器：视频
const videoFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
const materialFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('不支持的文件类型!'));
  }
};

// 文件过滤器：头像
const avatarFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只支持图片文件!'));
  }
};

// 上传视频
export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 1024 * 1024 * 500 }, // 500MB
  fileFilter: videoFilter,
});

// 上传资料
export const uploadMaterial = multer({
  storage: materialStorage,
  limits: { 
    fileSize: 1024 * 1024 * 50, // 50MB
    fieldSize: 10 * 1024 * 1024  // 增加字段大小限制到10MB
  },
  fileFilter: materialFilter,
});

// 上传头像
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB
  fileFilter: avatarFilter,
}); 