import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

// 好友关系状态
export enum FriendshipStatus {
  PENDING = 'pending',   // 待接受
  ACCEPTED = 'accepted', // 已接受
  REJECTED = 'rejected', // 已拒绝
  BLOCKED = 'blocked'    // 已屏蔽
}

// 好友关系属性接口
interface FriendshipAttributes {
  id: number;
  requesterId: number;   // 请求者ID
  recipientId: number;   // 接收者ID
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 创建时可选的属性
interface FriendshipCreationAttributes extends Optional<FriendshipAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// 定义Friendship模型
class Friendship extends Model<FriendshipAttributes, FriendshipCreationAttributes> implements FriendshipAttributes {
  public id!: number;
  public requesterId!: number;
  public recipientId!: number;
  public status!: FriendshipStatus;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化模型
Friendship.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
      allowNull: false,
      defaultValue: FriendshipStatus.PENDING,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Friendship',
    tableName: 'friendships',
    timestamps: true,
    // 关闭外键约束，避免启动时报错
    indexes: [
      {
        fields: ['requesterId']
      },
      {
        fields: ['recipientId']
      }
    ]
  }
);

export default Friendship; 