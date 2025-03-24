// 为了简化实现，我们可以只导出一个接口而不是完整的模型
export interface ExamDateAttributes {
  id: number;
  userId: number;
  examDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamDateCreationAttributes {
  userId: number;
  examDate: Date;
}

// 模拟对象
const ExamDate = {
  findOne: async () => null,
  create: async (data: ExamDateCreationAttributes) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

export default ExamDate; 