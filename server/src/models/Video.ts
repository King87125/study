import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

// 视频属性接口
interface VideoAttributes {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  uploadedById: number;
  duration: number;
  views: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建视频时可选的属性
interface VideoCreationAttributes extends Optional<VideoAttributes, 'id' | 'thumbnailUrl' | 'duration' | 'views'> {}

// 视频模型类
class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public videoUrl!: string;
  public thumbnailUrl!: string;
  public category!: string;
  public subject!: string;
  public difficulty!: 'easy' | 'medium' | 'hard';
  public uploadedById!: number;
  public duration!: number;
  public views!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化视频模型
Video.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium',
    },
    uploadedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Video',
  }
);

// 视频与用户的关联
Video.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

export default Video; 