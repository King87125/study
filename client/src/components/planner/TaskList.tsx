import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, Modal, Form, Input, Select, DatePicker, Checkbox, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

interface TaskItem {
  _id?: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate?: string;
  subject?: string;
}

interface TaskListProps {
  examDate: string;
}

const TaskList: React.FC<TaskListProps> = ({ examDate }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/planner/tasks');
      const taskData = response.data || [];
      setTasks(taskData as TaskItem[]);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      message.error('无法加载任务数据');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    form.resetFields();
    setEditingTask(null);
    setModalVisible(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      dueDate: task.dueDate ? dayjs(task.dueDate) : undefined
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const taskData = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined
      };
      
      if (editingTask?._id) {
        // 更新任务
        const response = await axios.patch(`/api/planner/tasks/${editingTask._id}`, taskData);
        const updatedTask = response.data as TaskItem;
        setTasks(tasks.map(task => 
          task._id === editingTask._id ? updatedTask : task
        ));
        message.success('任务更新成功');
      } else {
        // 创建新任务
        const response = await axios.post('/api/planner/tasks', taskData);
        const newTask = response.data as TaskItem;
        setTasks([...tasks, newTask]);
        message.success('任务添加成功');
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('保存任务失败:', error);
      message.error('无法保存任务信息');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      setLoading(true);
      await axios.delete(`/api/planner/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
      message.success('任务删除成功');
    } catch (error) {
      console.error('删除任务失败:', error);
      message.error('无法删除任务');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/api/planner/tasks/${taskId}`, { completed: !completed });
      const updatedTask = response.data as TaskItem;
      
      setTasks(tasks.map(task => 
        task._id === taskId ? updatedTask : task
      ));
      
      message.success(completed ? '标记为未完成' : '标记为已完成');
    } catch (error) {
      console.error('更新任务状态失败:', error);
      message.error('无法更新任务状态');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未设置';
    }
  };

  return (
    <Spin spinning={loading}>
      <div className="task-list-container">
        <Card 
          title="任务列表" 
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>
              添加任务
            </Button>
          }
        >
          <List
            dataSource={tasks}
            renderItem={(task) => (
              <List.Item
                actions={[
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => handleEditTask(task)}
                  />,
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={() => task._id && handleDelete(task._id)}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Checkbox 
                        checked={task.completed} 
                        onChange={() => task._id && toggleTaskCompletion(task._id, task.completed)}
                      />
                      <span
                        style={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          marginRight: '8px'
                        }}
                      >
                        {task.title}
                      </span>
                      <Tag color={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Tag>
                      {task.subject && (
                        <Tag color="blue">{task.subject}</Tag>
                      )}
                    </div>
                  }
                  description={
                    <>
                      {task.description && (
                        <p style={{ margin: '4px 0' }}>{task.description}</p>
                      )}
                      {task.dueDate && (
                        <small>截止日期: {dayjs(task.dueDate).format('YYYY年MM月DD日')}</small>
                      )}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>

      <Modal
        title={editingTask ? '编辑任务' : '添加任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="详细描述"
          >
            <TextArea rows={4} placeholder="详细描述你的任务..." />
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="优先级"
            initialValue="medium"
          >
            <Select>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="subject"
            label="科目"
          >
            <Select allowClear placeholder="选择科目">
              <Option value="math">数学</Option>
              <Option value="english">英语</Option>
              <Option value="politics">政治</Option>
              <Option value="professional">专业课</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="dueDate"
            label="截止日期"
          >
            <DatePicker placeholder="选择截止日期" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default TaskList; 