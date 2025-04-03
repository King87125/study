import { Request, Response, NextFunction } from 'express';
import Health from '../models/Health';

/**
 * 验证用户ID中间件
 * 确保请求中包含有效的用户ID
 */
export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId || req.body.userId;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "用户ID是必需的"
    });
  }
  
  // 可以在这里添加更多用户ID验证逻辑
  
  next();
};

/**
 * 水量目标检查中间件
 * 在记录饮水量后检查是否达到目标
 */
export const checkWaterGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return next();
    }
    
    const healthData = await Health.findOne({ where: { userId } });
    
    if (!healthData) {
      return next();
    }
    
    // 在响应中添加水量目标达成信息
    res.locals.waterGoalReached = healthData.waterCurrent >= healthData.waterGoal;
    res.locals.waterPercentage = Math.min(100, Math.round((healthData.waterCurrent / healthData.waterGoal) * 100));
    
    next();
  } catch (error) {
    // 错误时继续执行，不中断主要流程
    console.error('水量目标检查出错:', error);
    next();
  }
};

/**
 * 久坐提醒中间件
 * 检查久坐时间是否超过设定阈值
 */
export const checkSittingTime = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return next();
    }
    
    const healthData = await Health.findOne({ where: { userId } });
    
    if (!healthData) {
      return next();
    }
    
    // 检查久坐时间是否接近或超过阈值
    // 接近阈值（80%）时发出警告
    const sittingWarningThreshold = healthData.sittingGoal * 0.8;
    
    res.locals.sittingTimeExceeded = healthData.sittingCurrent >= healthData.sittingGoal;
    res.locals.sittingTimeWarning = healthData.sittingCurrent >= sittingWarningThreshold;
    res.locals.sittingTimePercentage = Math.min(100, Math.round((healthData.sittingCurrent / healthData.sittingGoal) * 100));
    
    next();
  } catch (error) {
    console.error('久坐时间检查出错:', error);
    next();
  }
};

/**
 * 健康数据API响应格式化中间件
 * 美化和标准化健康数据API响应
 */
export const formatHealthResponse = (req: Request, res: Response, next: NextFunction) => {
  // 保存原始的res.json方法
  const originalJson = res.json;
  
  // 覆盖json方法以格式化健康数据响应
  res.json = function(body) {
    // 如果是健康数据响应且成功
    if (body && body.success === true && body.data) {
      // 添加时间戳
      body.timestamp = new Date().toISOString();
      
      // 添加中间件收集的数据（如果有）
      if (res.locals.waterGoalReached !== undefined) {
        if (!body.achievements) {
          body.achievements = {};
        }
        body.achievements.water = {
          goalReached: res.locals.waterGoalReached,
          percentage: res.locals.waterPercentage
        };
      }
      
      if (res.locals.sittingTimeExceeded !== undefined) {
        if (!body.warnings) {
          body.warnings = {};
        }
        body.warnings.sitting = {
          exceeded: res.locals.sittingTimeExceeded,
          warning: res.locals.sittingTimeWarning,
          percentage: res.locals.sittingTimePercentage
        };
      }
      
      // 如果是经期数据，添加下一次经期倒计时
      if (body.data.menstruation && body.data.menstruation.nextPeriod) {
        const now = new Date();
        const nextPeriod = new Date(body.data.menstruation.nextPeriod);
        const daysUntil = Math.ceil((nextPeriod.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        body.data.menstruation.daysUntilNextPeriod = daysUntil;
      }
    }
    
    // 调用原始的json方法
    return originalJson.call(this, body);
  };
  
  next();
}; 