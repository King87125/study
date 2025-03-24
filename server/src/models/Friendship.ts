import { Request, Response } from 'express';

// 好友关系状态
export enum FriendshipStatus {
  PENDING = 'pending',   // 待接受
  ACCEPTED = 'accepted', // 已接受
  REJECTED = 'rejected', // 已拒绝
  BLOCKED = 'blocked'    // 已屏蔽
}

// 好友关系属性接口
export interface FriendshipAttributes {
  id: number;
  requesterId: number;   // 请求者ID
  recipientId: number;   // 接收者ID
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendshipCreationAttributes {
  requesterId: number;
  recipientId: number;
  status?: FriendshipStatus;
}

// 模拟对象
const friendships: FriendshipAttributes[] = [];
let nextId = 1;

const Friendship = {
  findAll: async (options?: any) => {
    // 模拟查询条件
    if (options && options.where) {
      return friendships.filter(f => {
        // 匹配所有提供的查询条件
        for (const key in options.where) {
          if (f[key as keyof FriendshipAttributes] !== options.where[key]) {
            return false;
          }
        }
        return true;
      });
    }
    return friendships;
  },
  
  findOne: async (options?: any) => {
    if (options && options.where) {
      const friendship = friendships.find(f => {
        for (const key in options.where) {
          if (f[key as keyof FriendshipAttributes] !== options.where[key]) {
            return false;
          }
        }
        return true;
      });
      
      return friendship || null;
    }
    return friendships[0] || null;
  },
  
  create: async (data: FriendshipCreationAttributes) => {
    const friendship: FriendshipAttributes = {
      id: nextId++,
      requesterId: data.requesterId,
      recipientId: data.recipientId,
      status: data.status || FriendshipStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    friendships.push(friendship);
    return friendship;
  },
  
  update: async (values: Partial<FriendshipAttributes>, options: any) => {
    let updated = 0;
    
    if (options && options.where) {
      friendships.forEach((f, index) => {
        let match = true;
        for (const key in options.where) {
          if (f[key as keyof FriendshipAttributes] !== options.where[key]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          updated++;
          friendships[index] = { ...f, ...values, updatedAt: new Date() };
        }
      });
    }
    
    return [updated];
  },
  
  destroy: async (options: any) => {
    let deleted = 0;
    
    if (options && options.where) {
      const newFriendships = friendships.filter(f => {
        let match = true;
        for (const key in options.where) {
          if (f[key as keyof FriendshipAttributes] !== options.where[key]) {
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
      friendships.length = 0;
      friendships.push(...newFriendships);
    }
    
    return deleted;
  }
};

export default Friendship; 