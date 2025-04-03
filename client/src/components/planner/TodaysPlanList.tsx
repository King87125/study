import React, { useState, useEffect, useCallback } from 'react';
import { List, Checkbox, Button, Tag, Space, Spin, Empty, message, Modal, Form, Select, Input, DatePicker, Card } from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { VideoCameraOutlined, ReadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

// --- 接口定义 ---
// 后端 StudyPlan 接口
interface StudyPlan {
  id: number; // 后端通常是 number ID
  _id?: string; // MongoDB 可能用 _id
  userId: number;
  date: string;
  type: 'video' | 'material';
  resourceId: number | string;
  title: string;
  priority: number;
  notes?: string;
  completed: boolean;
  resourceUrl?: string;
  thumbnail?: string;
}

// 后端 TaskItem 接口
interface TaskItem {
  id?: number;
  _id?: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low'; // Task 使用字符串
  completed: boolean;
  dueDate?: string;
  subject?: string;
}

// 统一的计划项接口 (用于前端展示)
interface UnifiedPlanItem {
  id: string; // 使用 string _id 或 number id 作为唯一标识
  origin: 'studyPlan' | 'taskItem'; // 来源
  title: string;
  type: 'video' | 'material' | 'task'; // 统一类型
  priority: number; // 统一使用数字 1-low, 2-medium, 3-high
  completed: boolean;
  date: string; // 计划执行日期 (来自 StudyPlan.date 或 TaskItem.dueDate)
  notes?: string; // 来自 StudyPlan.notes 或 TaskItem.description
  resourceUrl?: string; // 仅 StudyPlan 有
  thumbnail?: string; // 仅 StudyPlan 有
  originalData: StudyPlan | TaskItem; // 保留原始数据
}

// 学习资源接口 (用于 Modal 选择)
interface LearningResource {
  _id: string;
  id?: number | string;
  title: string;
}

const TodaysPlanList: React.FC = () => {
  const [plans, setPlans] = useState<UnifiedPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<UnifiedPlanItem | null>(null);
  const [materials, setMaterials] = useState<LearningResource[]>([]);
  const [videos, setVideos] = useState<LearningResource[]>([]);
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm(); // Modal 使用独立的 form 实例
  const { userInfo } = useSelector((state: RootState) => state.auth);

  const todayStr = dayjs().format('YYYY-MM-DD');

  const mapPriority = (priority: 'high' | 'medium' | 'low' | number): number => {
    if (typeof priority === 'number') return priority >= 1 && priority <= 3 ? priority : 2;
    if (priority === 'high') return 3;
    if (priority === 'low') return 1;
    return 2; // medium or default
  };

  const fetchTodaysPlans = useCallback(async () => {
    setLoading(true);
    try {
      const [studyPlanRes, taskRes] = await Promise.all([
        axios.get<{ data: StudyPlan[] }>('/api/study-plans', { params: { date: todayStr } }), // 指定响应数据类型
        axios.get<{ data: TaskItem[] }>('/api/planner/tasks', { params: { dueDate: todayStr } }) // 指定响应数据类型
      ]);

      // 明确断言或检查 data 属性是否存在且为数组
      const studyPlansData: StudyPlan[] = Array.isArray(studyPlanRes.data) ? studyPlanRes.data : (studyPlanRes.data as any)?.data || [];
      const tasksData: TaskItem[] = Array.isArray(taskRes.data) ? taskRes.data : (taskRes.data as any)?.data || [];

      const unifiedPlans: UnifiedPlanItem[] = [
        ...studyPlansData.map((p): UnifiedPlanItem => ({
          id: String(p._id || p.id),
          origin: 'studyPlan',
          title: p.title,
          type: p.type,
          priority: mapPriority(p.priority),
          completed: p.completed,
          date: p.date,
          notes: p.notes,
          resourceUrl: p.resourceUrl,
          thumbnail: p.thumbnail,
          originalData: p,
        })),
        ...tasksData.map((t): UnifiedPlanItem => ({
          id: String(t._id || t.id),
          origin: 'taskItem',
          title: t.title,
          type: 'task',
          priority: mapPriority(t.priority),
          completed: t.completed,
          date: t.dueDate || todayStr,
          notes: t.description,
          originalData: t,
        })),
      ];

      unifiedPlans.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return b.priority - a.priority;
      });

      setPlans(unifiedPlans);
    } catch (error) {
      console.error('获取今日计划失败:', error);
      message.error('获取今日计划失败');
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  const fetchLearningResources = useCallback(async () => {
    try {
      const [materialsRes, videosRes] = await Promise.all([
        axios.get<LearningResource[]>('/api/materials'), // 假设直接返回数组
        axios.get<LearningResource[]>('/api/videos')     // 假设直接返回数组
      ]);
      setMaterials(materialsRes.data || []);
      setVideos(videosRes.data || []);
    } catch (error) {
      console.error('获取学习资源失败:', error);
      message.warning('获取学习资源列表失败，部分选项可能无法显示'); // 使用 warning
    }
  }, []);

  useEffect(() => {
    fetchTodaysPlans();
    fetchLearningResources();
  }, [fetchTodaysPlans, fetchLearningResources]);

  // --- 事件处理函数 (待实现) ---
  const handleToggleCompletion = async (item: UnifiedPlanItem) => {
    const { id, origin, completed, originalData } = item;
    const apiPath = origin === 'studyPlan' ? `/api/study-plans/${id}/toggle-completion` : `/api/planner/tasks/${id}`;
    const payload = origin === 'studyPlan' ? {} : { completed: !completed };
    const method = origin === 'studyPlan' ? 'put' : 'patch';

    try {
      setLoading(true); // 界面反馈
      await axios[method](apiPath, payload);
      message.success(`已将 "${item.title}" 标记为 ${!completed ? '已完成' : '未完成'}`);
      fetchTodaysPlans(); // 重新获取数据刷新列表
    } catch (error) {
      console.error('更新计划状态失败:', error);
      message.error('更新计划状态失败');
      setLoading(false); // 出错时停止 loading
    }
  };

  const showAddModal = () => {
    setIsEditMode(false);
    setCurrentPlan(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({ date: dayjs(todayStr), priority: 2, planType: 'task' }); // 默认添加普通任务
    setIsModalVisible(true);
  };

  const showEditModal = (item: UnifiedPlanItem) => {
    // 编辑功能暂缓，先实现添加
    message.info('编辑功能待实现');
    // setIsEditMode(true);
    // setCurrentPlan(item);
    // // ... 根据 item 类型填充 modalForm ...
    // setIsModalVisible(true);
  };

  const handleDelete = async (item: UnifiedPlanItem) => {
    const { id, origin, title } = item;
    const apiPath = origin === 'studyPlan' ? `/api/study-plans/${id}` : `/api/planner/tasks/${id}`;

    Modal.confirm({
      title: `确认删除 "${title}"?`,
      content: '此操作不可撤销。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await axios.delete(apiPath);
          message.success('删除成功');
          fetchTodaysPlans();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
          setLoading(false);
        }
      },
    });
  };

  const handleModalSubmit = async (values: any) => {
    console.log('Modal Submit Values:', values);
    const { planType, date, priority, notes } = values;
    const commonData = {
      date: date.format('YYYY-MM-DD'),
      priority,
      notes,
      completed: false
    };

    try {
      setLoading(true);
      if (planType === 'resource') {
        const { resourceType, resourceId } = values;
        const resourceList = resourceType === 'video' ? videos : materials;
        const selectedResource = resourceList.find(r => (r.id || r._id) === resourceId);
        if (!selectedResource) {
          message.error('未找到所选资源');
          setLoading(false);
          return;
        }
        const planData = {
          ...commonData,
          type: resourceType,
          resourceId,
          title: selectedResource.title,
          resourceUrl: `/${resourceType === 'video' ? 'videos' : 'materials'}/${resourceId}`,
          // thumbnail: selectedResource.thumbnail // 需要API返回或前端获取
        };
        await axios.post('/api/study-plans', planData);
      } else { // planType === 'task'
        const { title, description } = values; // 普通任务有自己的标题和描述
        const taskData = {
          title: title || '无标题任务', // 确保有标题
          description,
          priority: priority === 3 ? 'high' : priority === 1 ? 'low' : 'medium',
          dueDate: date.format('YYYY-MM-DD'),
          completed: false,
          // subject: values.subject // 如果需要科目字段
        };
        await axios.post('/api/planner/tasks', taskData);
      }
      message.success('计划添加成功');
      setIsModalVisible(false);
      fetchTodaysPlans();
    } catch (error) {
      console.error('保存计划失败:', error);
      message.error('保存计划失败');
      setLoading(false);
    }
  };

  // --- 渲染函数 ---
  const getPriorityTag = (priority: number) => {
    const colors = { 1: 'blue', 2: 'orange', 3: 'red' };
    const labels = { 1: '低', 2: '中', 3: '高' };
    return <Tag color={colors[priority as keyof typeof colors]}>{labels[priority as keyof typeof labels]}</Tag>;
  };

  const getTypeIcon = (type: 'video' | 'material' | 'task') => {
    if (type === 'video') return <VideoCameraOutlined style={{ color: '#1890ff' }} />;
    if (type === 'material') return <ReadOutlined style={{ color: '#52c41a' }} />;
    return <CalendarOutlined style={{ color: '#faad14' }} />; // 普通任务用日历图标
  };

  const renderPlanItem = (item: UnifiedPlanItem) => {
    // 添加日志，检查每个列表项的数据
    console.log('Rendering Plan Item:', item);

    return (
      <List.Item
        actions={[
          // <Button icon={<EditOutlined />} size="small" onClick={() => showEditModal(item)}>编辑</Button>,
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(item)}>删除</Button>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <Checkbox
              checked={item.completed}
              onChange={() => handleToggleCompletion(item)}
              disabled={loading}
            />
          }
          title={
            <Space>
              {getTypeIcon(item.type)}
              {item.resourceUrl ? (
                <Link to={item.resourceUrl} style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#bfbfbf' : 'inherit' }}>
                  {item.title}
                </Link>
              ) : (
                <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#bfbfbf' : 'inherit' }}>
                  {item.title}
                </span>
              )}
              {getPriorityTag(item.priority)}
            </Space>
          }
          description={item.notes || '无备注'}
        />
      </List.Item>
    );
  };

  return (
    <Spin spinning={loading}>
      <Card
        title={`今日计划 (${todayStr})`}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>添加计划/任务</Button>}
      >
        {plans.length === 0 && !loading ? (
          <Empty description="今天没有计划，快去添加吧！" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={plans}
            renderItem={renderPlanItem}
          />
        )}
      </Card>

      {/* 添加/编辑 Modal */}
      <Modal
        title={isEditMode ? '编辑计划/任务' : '添加今日计划/任务'}
        open={isModalVisible}
        onCancel={() => { 
          setIsModalVisible(false); 
          modalForm.resetFields(); // 关闭时重置表单
        }}
        footer={null}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleModalSubmit}
          initialValues={{ date: dayjs(todayStr), priority: 2, planType: 'task' }} // 默认添加普通任务
        >
          <Form.Item name="planType" label="类型" rules={[{ required: true }]}>
            <Select onChange={() => modalForm.resetFields(['title', 'description', 'resourceType', 'resourceId'])}>
              <Option value="task">普通任务</Option>
              <Option value="resource">学习资源</Option>
            </Select>
          </Form.Item>

          <Form.Item
             noStyle
             shouldUpdate={(prevValues, currentValues) => prevValues.planType !== currentValues.planType}
          >
            {({ getFieldValue }) => {
              const planType = getFieldValue('planType');
              return planType === 'resource' ? (
                <>
                  <Form.Item name="resourceType" label="资源类型" rules={[{ required: true, message: '请选择资源类型' }]}>
                    <Select placeholder="选择资源类型">
                      <Option value="video">视频</Option>
                      <Option value="material">学习资料</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.resourceType !== curr.resourceType}
                  >
                     {({ getFieldValue: getResourceTypeValue }) => { // 重命名 getFieldValue
                        const resourceType = getResourceTypeValue('resourceType');
                        return (
                          <Form.Item
                            name="resourceId"
                            label="选择资源"
                            rules={[{ required: true, message: '请选择学习资源' }]}
                          >
                            <Select
                              showSearch
                              placeholder="选择或搜索学习资源"
                              optionFilterProp="children"
                              filterOption={(input, option) => 
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                              }
                              loading={resourceType && (videos.length === 0 || materials.length === 0)}
                              disabled={!resourceType}
                            >
                              {resourceType === 'video' && videos.map(v => <Option key={v._id || v.id} value={v._id || v.id}>{v.title}</Option>)}
                              {resourceType === 'material' && materials.map(m => <Option key={m._id || m.id} value={m._id || m.id}>{m.title}</Option>)}
                            </Select>
                         </Form.Item>
                        );
                     }}
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
                    <Input placeholder="例如：完成数学第一章习题" />
                  </Form.Item>
                  <Form.Item name="description" label="任务描述 (可选)">
                    <TextArea rows={2} placeholder="任务详情..." />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Form.Item name="date" label="计划日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
            <Select placeholder="选择优先级">
              <Option value={1}>低</Option>
              <Option value={2}>中</Option>
              <Option value={3}>高</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="备注 (可选)">
            <TextArea rows={3} placeholder="例如：重点关注错题" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
              {isEditMode ? '保存' : '添加'}
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default TodaysPlanList; 