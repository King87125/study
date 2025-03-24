// 为了简化实现，我们可以只导出接口而不是完整的模型
export interface EventAttributes {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'study' | 'exam' | 'rest' | 'other';
  completed: boolean;
  subject?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCreationAttributes {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  type?: 'study' | 'exam' | 'rest' | 'other';
  completed?: boolean;
  subject?: string;
  userId: number;
}

// 模拟对象
const Event = {
  findAll: async () => [],
  findOne: async () => null,
  create: async (data: EventCreationAttributes) => {
    const endDate = data.endDate || new Date(data.startDate.getTime() + 3600000); // 默认1小时
    return {
      id: 1,
      ...data,
      endDate,
      type: data.type || 'study',
      completed: data.completed || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

export default Event;