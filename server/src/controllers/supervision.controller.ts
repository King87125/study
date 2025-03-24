import { Request, Response } from 'express';
import StudySupervision from '../models/StudySupervision';

// 获取当前用户被监督的学习记录
export const getMySupervisions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = req.query;
    
    const where: any = { userId };
    
    // 如果提供了日期范围，添加过滤条件
    if (startDate && endDate) {
      where.date = {
        $between: [new Date(startDate as string), new Date(endDate as string)]
      };
    }
    
    const supervisions = await StudySupervision.findAll({ where });
    
    res.json(supervisions);
  } catch (error) {
    console.error('获取学习监督记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户作为监督者的记录
export const getMySupervisedUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = req.query;
    
    const where: any = { supervisorId: userId };
    
    // 如果提供了日期范围，添加过滤条件
    if (startDate && endDate) {
      where.date = {
        $between: [new Date(startDate as string), new Date(endDate as string)]
      };
    }
    
    const supervisions = await StudySupervision.findAll({ where });
    
    // 将结果按被监督用户分组
    const supervisedUsers: {[key: string]: any} = {};
    supervisions.forEach(record => {
      if (!supervisedUsers[record.userId]) {
        supervisedUsers[record.userId] = {
          userId: record.userId,
          username: `用户${record.userId}`, // 模拟用户名
          records: []
        };
      }
      supervisedUsers[record.userId].records.push(record);
    });
    
    res.json(Object.values(supervisedUsers));
  } catch (error) {
    console.error('获取监督记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建学习监督记录
export const createSupervision = async (req: Request, res: Response) => {
  try {
    const supervisorId = (req as any).user.id;
    const { userId, date, studyHours, completedTasks, goalHours, goalTasks, comment } = req.body;
    
    if (!userId || !date || studyHours === undefined || completedTasks === undefined) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    // 创建学习监督记录
    const supervision = await StudySupervision.create({
      userId,
      supervisorId,
      date: new Date(date),
      studyHours,
      completedTasks,
      goalHours: goalHours || 0,
      goalTasks: goalTasks || 0,
      comment
    });
    
    res.status(201).json({
      message: '学习监督记录已创建',
      supervision
    });
  } catch (error) {
    console.error('创建学习监督记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新学习监督记录
export const updateSupervision = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { supervisionId } = req.params;
    const { studyHours, completedTasks, goalHours, goalTasks, comment } = req.body;
    
    // 查找并验证监督记录
    const supervision = await StudySupervision.findOne({
      where: { 
        id: parseInt(supervisionId),
        $or: [
          { userId },
          { supervisorId: userId }
        ]
      }
    });
    
    if (!supervision) {
      return res.status(404).json({ message: '监督记录不存在或无权限更新' });
    }
    
    // 更新记录
    const updateData: any = {};
    if (studyHours !== undefined) updateData.studyHours = studyHours;
    if (completedTasks !== undefined) updateData.completedTasks = completedTasks;
    if (goalHours !== undefined) updateData.goalHours = goalHours;
    if (goalTasks !== undefined) updateData.goalTasks = goalTasks;
    if (comment !== undefined) updateData.comment = comment;
    
    await StudySupervision.update(
      updateData,
      { where: { id: supervision.id } }
    );
    
    res.json({ message: '监督记录已更新' });
  } catch (error) {
    console.error('更新监督记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除学习监督记录
export const deleteSupervision = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { supervisionId } = req.params;
    
    // 查找并验证监督记录
    const supervision = await StudySupervision.findOne({
      where: { 
        id: parseInt(supervisionId),
        $or: [
          { userId },
          { supervisorId: userId }
        ]
      }
    });
    
    if (!supervision) {
      return res.status(404).json({ message: '监督记录不存在或无权限删除' });
    }
    
    // 删除记录
    await StudySupervision.destroy({
      where: { id: supervision.id }
    });
    
    res.json({ message: '监督记录已删除' });
  } catch (error) {
    console.error('删除监督记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取特定用户的学习统计
export const getUserStudyStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const currentUserId = (req as any).user.id;
    
    // 验证权限 - 只有好友或自己可以查看统计
    // 这里简化处理，假设已经是好友
    const isFriend = true; // 实际实现需要查询好友关系表
    
    if (parseInt(userId) !== currentUserId && !isFriend) {
      return res.status(403).json({ message: '无权限查看该用户的学习统计' });
    }
    
    const where: any = { userId: parseInt(userId) };
    
    // 如果提供了日期范围，添加过滤条件
    if (startDate && endDate) {
      where.date = {
        $between: [new Date(startDate as string), new Date(endDate as string)]
      };
    }
    
    const supervisions = await StudySupervision.findAll({ where });
    
    // 计算统计数据
    const totalStudyHours = supervisions.reduce((sum, record) => sum + record.studyHours, 0);
    const totalCompletedTasks = supervisions.reduce((sum, record) => sum + record.completedTasks, 0);
    const totalGoalHours = supervisions.reduce((sum, record) => sum + record.goalHours, 0);
    const totalGoalTasks = supervisions.reduce((sum, record) => sum + record.goalTasks, 0);
    
    // 计算平均值和完成率
    const avgStudyHours = supervisions.length ? totalStudyHours / supervisions.length : 0;
    const avgCompletedTasks = supervisions.length ? totalCompletedTasks / supervisions.length : 0;
    const hoursCompletionRate = totalGoalHours ? (totalStudyHours / totalGoalHours) * 100 : 0;
    const tasksCompletionRate = totalGoalTasks ? (totalCompletedTasks / totalGoalTasks) * 100 : 0;
    
    res.json({
      userId: parseInt(userId),
      username: `用户${userId}`, // 模拟用户名
      period: {
        from: startDate || '所有时间',
        to: endDate || '至今'
      },
      totalRecords: supervisions.length,
      studyStats: {
        totalHours: totalStudyHours,
        avgHoursPerDay: avgStudyHours,
        hoursCompletionRate: hoursCompletionRate,
        totalTasks: totalCompletedTasks,
        avgTasksPerDay: avgCompletedTasks,
        tasksCompletionRate: tasksCompletionRate
      },
      records: supervisions
    });
  } catch (error) {
    console.error('获取学习统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 