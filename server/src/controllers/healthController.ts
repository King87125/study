import { Request, Response } from "express";
import mongoose from "mongoose";
import os from "os";
import Health from "../models/Health";
import User from "../models/User";

/**
 * 获取系统内存使用情况
 */
const getMemoryUsage = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    total: formatBytes(totalMemory),
    free: formatBytes(freeMemory),
    used: formatBytes(usedMemory),
    usagePercentage: Math.round((usedMemory / totalMemory) * 100)
  };
};

/**
 * 获取系统运行时间
 */
const getUptime = () => {
  const uptime = os.uptime();
  const days = Math.floor(uptime / (60 * 60 * 24));
  const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return {
    raw: uptime,
    formatted: `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`
  };
};

/**
 * 格式化字节大小为人类可读格式
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 检查数据库连接状态
 */
const checkDatabaseConnection = async () => {
  try {
    // 检查当前连接状态
    const state = mongoose.connection.readyState;
    const stateMap: Record<number, string> = {
      0: '断开连接',
      1: '已连接',
      2: '正在连接',
      3: '正在断开连接'
    };
    
    return {
      status: state === 1 ? 'connected' : 'disconnected',
      message: stateMap[state] || '未知状态',
      isConnected: state === 1
    };
  } catch (error) {
    return {
      status: 'error',
      message: `数据库连接检查出错: ${(error as Error).message}`,
      isConnected: false
    };
  }
};

/**
 * 健康检查控制器
 * 提供服务器状态监控的端点
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // 检查数据库连接
    const dbStatus = await checkDatabaseConnection();
    
    // API版本信息（从package.json获取，这里使用硬编码示例）
    const apiVersion = process.env.API_VERSION || "1.0.0";
    
    // 系统信息
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      hostname: os.hostname(),
      memory: getMemoryUsage(),
      uptime: getUptime()
    };
    
    return res.status(200).json({
      status: "OK",
      message: "服务器正常运行",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      apiVersion,
      system: systemInfo,
      database: dbStatus
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: `健康检查失败: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 获取用户健康数据
 */
export const getUserHealth = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "用户ID是必需的"
      });
    }
    
    // 从数据库查询用户健康数据
    let healthData = await Health.findOne({ where: { userId } });
    
    // 如果不存在，则创建默认数据
    if (!healthData) {
      healthData = await Health.create({
        userId: parseInt(userId),
        waterGoal: 2000,
        waterCurrent: 0,
        stepsGoal: 8000,
        stepsCurrent: 0,
        sittingGoal: 240,
        sittingCurrent: 0,
        sleepGoal: 8,
        sleepCurrent: 0,
        lastUpdated: new Date()
      });
    }
    
    // 格式化响应数据
    const formattedData = {
      water: {
        goal: healthData.waterGoal,
        current: healthData.waterCurrent,
        unit: "ml",
        lastUpdated: healthData.lastUpdated
      },
      steps: {
        goal: healthData.stepsGoal,
        current: healthData.stepsCurrent,
        unit: "步",
        lastUpdated: healthData.lastUpdated
      },
      sittingTime: {
        goal: healthData.sittingGoal,
        current: healthData.sittingCurrent,
        unit: "分钟",
        lastUpdated: healthData.lastUpdated
      },
      sleepDuration: {
        goal: healthData.sleepGoal,
        current: healthData.sleepCurrent,
        unit: "小时",
        lastUpdated: healthData.lastUpdated
      },
      menstruation: healthData.lastPeriod ? {
        lastPeriod: healthData.lastPeriod,
        cycleLength: healthData.cycleLength || 28,
        periodLength: healthData.periodLength || 5,
        nextPeriod: new Date(new Date(healthData.lastPeriod).getTime() + (healthData.cycleLength || 28) * 24 * 60 * 60 * 1000),
        symptoms: healthData.menstruationSymptoms ? healthData.menstruationSymptoms.split(',') : [],
        notes: healthData.menstruationNotes || ""
      } : null
    };
    
    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `获取健康数据失败: ${(error as Error).message}`
    });
  }
};

/**
 * 更新用户饮水记录
 */
export const updateWaterIntake = async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "用户ID和饮水量是必需的"
      });
    }
    
    // 查找用户健康数据
    let healthData = await Health.findOne({ where: { userId } });
    
    // 如果不存在，则创建默认数据
    if (!healthData) {
      healthData = await Health.create({
        userId,
        waterGoal: 2000,
        waterCurrent: 0,
        stepsGoal: 8000,
        stepsCurrent: 0,
        sittingGoal: 240,
        sittingCurrent: 0,
        sleepGoal: 8,
        sleepCurrent: 0,
        lastUpdated: new Date()
      });
    }
    
    // 更新饮水量
    const newAmount = healthData.waterCurrent + parseInt(amount);
    await healthData.update({
      waterCurrent: newAmount,
      lastUpdated: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: `成功记录 ${amount}ml 的饮水量`,
      data: {
        current: newAmount,
        goal: healthData.waterGoal,
        unit: "ml",
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `更新饮水记录失败: ${(error as Error).message}`
    });
  }
};

/**
 * 更新久坐提醒状态
 */
export const updateSittingTime = async (req: Request, res: Response) => {
  try {
    const { userId, action } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        message: "用户ID和操作类型是必需的"
      });
    }
    
    // 查找用户健康数据
    let healthData = await Health.findOne({ where: { userId } });
    
    // 如果不存在，则创建默认数据
    if (!healthData) {
      healthData = await Health.create({
        userId,
        waterGoal: 2000,
        waterCurrent: 0,
        stepsGoal: 8000,
        stepsCurrent: 0,
        sittingGoal: 240,
        sittingCurrent: 0,
        sleepGoal: 8,
        sleepCurrent: 0,
        lastUpdated: new Date()
      });
    }
    
    let message = "";
    let currentTime = healthData.sittingCurrent;
    
    // 根据不同操作更新久坐时间
    if (action === "start") {
      message = "开始计时久坐时间";
      // 开始计时不修改当前值
    } else if (action === "reset") {
      message = "重置久坐时间";
      currentTime = 0;
      await healthData.update({
        sittingCurrent: 0,
        lastUpdated: new Date()
      });
    } else if (action === "update") {
      // 增加久坐时间，假设前端每分钟发送一次更新
      currentTime += 1;
      message = `更新久坐时间: ${currentTime}分钟`;
      await healthData.update({
        sittingCurrent: currentTime,
        lastUpdated: new Date()
      });
    } else if (action === "pause") {
      message = "暂停久坐计时";
      // 暂停计时不修改当前值
    }
    
    return res.status(200).json({
      success: true,
      message,
      data: {
        current: currentTime,
        goal: healthData.sittingGoal,
        unit: "分钟",
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `更新久坐时间失败: ${(error as Error).message}`
    });
  }
};

/**
 * 记录经期信息
 */
export const updateMenstruation = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, periodLength, symptoms, notes } = req.body;
    
    if (!userId || !startDate) {
      return res.status(400).json({
        success: false,
        message: "用户ID和经期开始日期是必需的"
      });
    }
    
    // 查找用户健康数据
    let healthData = await Health.findOne({ where: { userId } });
    
    // 如果不存在，则创建默认数据
    if (!healthData) {
      healthData = await Health.create({
        userId,
        waterGoal: 2000,
        waterCurrent: 0,
        stepsGoal: 8000,
        stepsCurrent: 0,
        sittingGoal: 240,
        sittingCurrent: 0,
        sleepGoal: 8,
        sleepCurrent: 0,
        lastPeriod: new Date(startDate),
        cycleLength: 28,
        periodLength: periodLength || 5,
        menstruationSymptoms: symptoms ? symptoms.join(',') : null,
        menstruationNotes: notes || null,
        lastUpdated: new Date()
      });
    } else {
      // 更新经期信息
      await healthData.update({
        lastPeriod: new Date(startDate),
        periodLength: periodLength || healthData.periodLength || 5,
        menstruationSymptoms: symptoms ? symptoms.join(',') : healthData.menstruationSymptoms,
        menstruationNotes: notes || healthData.menstruationNotes,
        lastUpdated: new Date()
      });
    }
    
    // 计算下次经期预计开始日期
    const nextPeriod = new Date(new Date(startDate).getTime() + (healthData.cycleLength || 28) * 24 * 60 * 60 * 1000);
    
    return res.status(200).json({
      success: true,
      message: "成功更新经期信息",
      data: {
        lastPeriod: startDate,
        cycleLength: healthData.cycleLength || 28,
        periodLength: periodLength || healthData.periodLength || 5,
        nextPeriod: nextPeriod,
        symptoms: symptoms || (healthData.menstruationSymptoms ? healthData.menstruationSymptoms.split(',') : []),
        notes: notes || healthData.menstruationNotes || ""
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `更新经期信息失败: ${(error as Error).message}`
    });
  }
};

/**
 * 获取健康建议
 */
export const getHealthTips = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    const tips: Record<string, string[]> = {
      water: [
        "每天至少饮用2000毫升水",
        "早上起床后立即喝一杯水可以促进新陈代谢",
        "饮水应该分散在一整天，而不是一次性大量饮用",
        "运动时应适当增加饮水量",
        "可以设置饮水提醒，每小时喝一杯水"
      ],
      sitting: [
        "久坐工作时，每30-60分钟起来活动几分钟",
        "尝试站立办公，交替站立和坐着工作",
        "久坐时可以做一些简单的伸展运动",
        "保持正确的坐姿，避免驼背",
        "使用符合人体工程学的椅子和桌子"
      ],
      menstruation: [
        "经期注意保暖，避免受凉",
        "经期可适当补充富含铁质的食物，如菠菜、瘦肉等",
        "经期前后情绪波动属于正常现象，保持轻松愉快的心情",
        "经期避免剧烈运动，可以进行温和的瑜伽或散步",
        "使用经期记录APP追踪周期，有助于更好地了解自己的身体"
      ],
      sleep: [
        "保持规律的作息时间，每天相同时间睡觉和起床",
        "睡前1小时避免使用电子设备",
        "创造舒适的睡眠环境，适宜的温度、安静和黑暗",
        "避免睡前饮用咖啡、茶和酒精",
        "睡前可以进行放松活动，如阅读、听轻音乐或冥想"
      ]
    };
    
    if (category && tips[category]) {
      return res.status(200).json({
        success: true,
        data: tips[category]
      });
    } else {
      // 返回所有分类的提示
      return res.status(200).json({
        success: true,
        data: tips
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `获取健康建议失败: ${(error as Error).message}`
    });
  }
};
