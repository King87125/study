// 为了简化实现，我们可以只导出接口而不是完整的模型
export interface TaskAttributes {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: Date;
  subject?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCreationAttributes {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  dueDate?: Date;
  subject?: string;
  userId: number;
}

// 模拟对象
const Task = {
  findAll: async () => [],
  findOne: async () => null,
  create: async (data: TaskCreationAttributes) => ({
    id: 1,
    ...data,
    priority: data.priority || 'medium',
    completed: data.completed || false,
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

export default Task; 