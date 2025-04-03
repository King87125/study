import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

// 健康数据接口
interface HealthAttributes {
  id: number;
  userId: number;
  waterGoal: number;
  waterCurrent: number;
  stepsGoal: number;
  stepsCurrent: number;
  sittingGoal: number;
  sittingCurrent: number;
  sleepGoal: number;
  sleepCurrent: number;
  lastPeriod: Date | null;
  cycleLength: number | null;
  periodLength: number | null;
  menstruationSymptoms: string | null;
  menstruationNotes: string | null;
  lastUpdated: Date;
}

// 创建时可选的属性
interface HealthCreationAttributes extends Optional<HealthAttributes, 'id'> {}

// 健康数据模型
class Health extends Model<HealthAttributes, HealthCreationAttributes> implements HealthAttributes {
  public id!: number;
  public userId!: number;
  public waterGoal!: number;
  public waterCurrent!: number;
  public stepsGoal!: number;
  public stepsCurrent!: number;
  public sittingGoal!: number;
  public sittingCurrent!: number;
  public sleepGoal!: number;
  public sleepCurrent!: number;
  public lastPeriod!: Date | null;
  public cycleLength!: number | null;
  public periodLength!: number | null;
  public menstruationSymptoms!: string | null;
  public menstruationNotes!: string | null;
  public lastUpdated!: Date;

  // 时间戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Health.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    waterGoal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2000, // 默认2000ml
    },
    waterCurrent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stepsGoal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 8000, // 默认8000步
    },
    stepsCurrent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sittingGoal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 240, // 默认最长久坐4小时
    },
    sittingCurrent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sleepGoal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 8, // 默认8小时
    },
    sleepCurrent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    lastPeriod: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cycleLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 28, // 默认28天
    },
    periodLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5, // 默认5天
    },
    menstruationSymptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    menstruationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Health',
    tableName: 'healths',
    timestamps: true,
  }
);

// 建立与用户的关系
Health.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Health, { foreignKey: 'userId' });

export default Health; 