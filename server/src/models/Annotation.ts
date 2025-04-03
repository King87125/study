import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import Material from './Material';

// 标注属性接口
interface AnnotationAttributes {
  id: number;
  materialId: number;
  userId: number;
  annotationObjects: string; // JSON字符串格式的fabric对象
  pageNumber: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建标注时可选的属性
interface AnnotationCreationAttributes extends Optional<AnnotationAttributes, 'id'> {}

// 标注模型类
class Annotation extends Model<AnnotationAttributes, AnnotationCreationAttributes> implements AnnotationAttributes {
  public id!: number;
  public materialId!: number;
  public userId!: number;
  public annotationObjects!: string;
  public pageNumber!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化标注模型
Annotation.init(
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
    annotationObjects: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    pageNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Annotation',
    indexes: [
      {
        unique: true,
        fields: ['materialId', 'userId', 'pageNumber'],
        name: 'annotation_unique_constraint'
      }
    ]
  }
);

// 标注与用户和资料的关联
Annotation.belongsTo(User, { foreignKey: 'userId' });
Annotation.belongsTo(Material, { foreignKey: 'materialId' });
Material.hasMany(Annotation, { foreignKey: 'materialId', as: 'annotations' });

export default Annotation; 