import { Request, Response } from 'express';

// 学习监督数据类型
export interface StudySupervisionAttributes {
  id: number;
  userId: number;        // 被监督的用户ID
  supervisorId: number;  // 监督者ID
  date: Date;            // 日期
  studyHours: number;    // 学习时长(小时)
  completedTasks: number;// 完成的任务数
  goalHours: number;     // 目标学习时长
  goalTasks: number;     // 目标任务数
  comment?: string;      // 监督者评论
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySupervisionCreationAttributes {
  userId: number;
  supervisorId: number;
  date: Date;
  studyHours: number;
  completedTasks: number;
  goalHours: number;
  goalTasks: number;
  comment?: string;
}

// 模拟数据存储
const supervisions: StudySupervisionAttributes[] = [];
let nextId = 1;

const StudySupervision = {
  findAll: async (options?: any) => {
    // 模拟查询条件
    if (options && options.where) {
      return supervisions.filter(s => {
        for (const key in options.where) {
          if (s[key as keyof StudySupervisionAttributes] !== options.where[key]) {
            return false;
          }
        }
        return true;
      });
    }
    return supervisions;
  },
  
  findOne: async (options?: any) => {
    if (options && options.where) {
      const supervision = supervisions.find(s => {
        for (const key in options.where) {
          if (s[key as keyof StudySupervisionAttributes] !== options.where[key]) {
            return false;
          }
        }
        return true;
      });
      
      return supervision || null;
    }
    return supervisions[0] || null;
  },
  
  create: async (data: StudySupervisionCreationAttributes) => {
    const supervision: StudySupervisionAttributes = {
      id: nextId++,
      userId: data.userId,
      supervisorId: data.supervisorId,
      date: data.date,
      studyHours: data.studyHours,
      completedTasks: data.completedTasks,
      goalHours: data.goalHours,
      goalTasks: data.goalTasks,
      comment: data.comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    supervisions.push(supervision);
    return supervision;
  },
  
  update: async (values: Partial<StudySupervisionAttributes>, options: any) => {
    let updated = 0;
    
    if (options && options.where) {
      supervisions.forEach((s, index) => {
        let match = true;
        for (const key in options.where) {
          if (s[key as keyof StudySupervisionAttributes] !== options.where[key]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          updated++;
          supervisions[index] = { ...s, ...values, updatedAt: new Date() };
        }
      });
    }
    
    return [updated];
  },
  
  destroy: async (options: any) => {
    let deleted = 0;
    
    if (options && options.where) {
      const newSupervisions = supervisions.filter(s => {
        let match = true;
        for (const key in options.where) {
          if (s[key as keyof StudySupervisionAttributes] !== options.where[key]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          deleted++;
          return false;
        }
        return true;
      });
      
      // 更新数组
      supervisions.length = 0;
      supervisions.push(...newSupervisions);
    }
    
    return deleted;
  }
};

export default StudySupervision; 