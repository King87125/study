import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

// 资料属性接口
interface MaterialAttributes {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl: string;
  category: string;
  subject: string;
  fileType: string;
  fileSize: number;
  uploadedById: number;
  downloads: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建资料时可选的属性
interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'thumbnailUrl' | 'downloads'> {}

// 资料模型类
class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public fileUrl!: string;
  public thumbnailUrl!: string;
  public category!: string;
  public subject!: string;
  public fileType!: string;
  public fileSize!: number;
  public uploadedById!: number;
  public downloads!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化资料模型
Material.init(
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
    fileUrl: {
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
    fileType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uploadedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    downloads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Material',
  }
);

// 资料与用户的关联
Material.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

// 创建评论模型
class Comment extends Model {
  public id!: number;
  public materialId!: number;
  public userId!: number;
  public comment!: string;
  public rating!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Material,
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },
  {
    sequelize,
    modelName: 'Comment',
  }
);

// 评论与用户和资料的关联
Comment.belongsTo(User, { foreignKey: 'userId' });
Comment.belongsTo(Material, { foreignKey: 'materialId' });
Material.hasMany(Comment, { foreignKey: 'materialId', as: 'comments' });

export { Material, Comment };
export default Material; 