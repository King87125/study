import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Calendar, Badge, Typography, Button, Modal, Form, 
  Select, Input, DatePicker, message, Spin, Empty, Tag, 
  Timeline, Row, Col, Tabs, List, Space,
  Progress
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { 
  CalendarOutlined, BookOutlined, VideoCameraOutlined, 
  PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined,
  ClockCircleOutlined, PlayCircleOutlined, UnorderedListOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './DailyStudyPlan.css';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface StudyPlan {
  id: number;
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

interface LearningResource {
  id: string;
  title: string;
}

interface DailyStudyPlanProps {
  simplified?: boolean;
}

const DailyStudyPlan: React.FC<DailyStudyPlanProps> = ({ simplified = false }) => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [dailyPlans, setDailyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [materials, setMaterials] = useState<LearningResource[]>([]);
  const [videos, setVideos] = useState<LearningResource[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchStudyPlans = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/study-plans');
        setStudyPlans(response.data as StudyPlan[]);
      } catch (error) {
        console.error('获取学习计划失败:', error);
        message.error('获取学习计划失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStudyPlans();
  }, []);

  useEffect(() => {
    const fetchLearningResources = async () => {
      try {
        const [materialsRes, videosRes] = await Promise.all([
          axios.get<{ materials?: any[], page?: number, pages?: number, count?: number }>('/api/materials'), 
          axios.get<{ videos?: any[], page?: number, pages?: number, count?: number }>('/api/videos')     
        ]);
        
        console.log('Raw API Response - Materials:', materialsRes.data);
        console.log('Raw API Response - Videos:', videosRes.data);

        const mapToResource = (item: any): LearningResource => ({
          id: String(item._id || item.id),
          title: item.title || '无标题资源',
        });
        
        const materialsData = Array.isArray(materialsRes.data?.materials) 
                              ? materialsRes.data.materials 
                              : [];
        const videosData = Array.isArray(videosRes.data?.videos) 
                           ? videosRes.data.videos 
                           : [];

        setMaterials(materialsData.map(mapToResource));
        setVideos(videosData.map(mapToResource));
        
      } catch (error) {
        console.error('获取学习资源失败:', error);
        message.error('获取学习资源失败');
      }
    };

    fetchLearningResources();
  }, []);

  useEffect(() => {
    if (selectedDate && studyPlans.length > 0) {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const filtered = studyPlans.filter(plan => plan.date === dateStr);
      
      const sorted = [...filtered].sort((a, b) => b.priority - a.priority);
      setDailyPlans(sorted);
    } else {
      setDailyPlans([]);
    }
  }, [selectedDate, studyPlans]);

  const completionPercentage = useMemo(() => {
    const totalPlans = dailyPlans.length;
    if (totalPlans === 0) {
      return 0;
    }
    const completedPlans = dailyPlans.filter(plan => plan.completed).length;
    return Math.round((completedPlans / totalPlans) * 100);
  }, [dailyPlans]);

  const cellRender = (current: Dayjs, info: { type: string }) => {
    if (info.type === 'date') {
      const dateStr = current.format('YYYY-MM-DD');
    const listData = studyPlans.filter(plan => plan.date === dateStr);
    
    if (listData.length === 0) return null;
    
    const completedCount = listData.filter(plan => plan.completed).length;
      const allCompleted = completedCount === listData.length;
      const hasIncomplete = completedCount < listData.length && completedCount > 0;
    
    return (
        <div className="calendar-cell-content">
        <Badge 
          count={listData.length} 
            size={listData.length > 5 ? "default" : "small"}
            color={allCompleted ? 'green' : (hasIncomplete ? 'yellow' : 'blue')}
        />
          {hasIncomplete && (
             <div className="completion-hint">{completedCount}/{listData.length}</div>
          )}
          {allCompleted && listData.length > 0 && (
             <CheckCircleFilled className="completion-icon" />
        )}
      </div>
    );
    }
    return undefined;
  };

  const onDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    if (!simplified) {
      setActiveTab('daily');
    }
  };

  const showAddPlanModal = (plan?: StudyPlan) => {
    form.resetFields();
    if (plan) {
      setIsEditMode(true);
      setCurrentPlan(plan);
      form.setFieldsValue({
        date: dayjs(plan.date),
        resourceType: plan.type,
        resourceId: String(plan.resourceId),
        priority: plan.priority,
        notes: plan.notes || '',
        completed: plan.completed
      });
    } else {
      setIsEditMode(false);
      setCurrentPlan(null);
      form.setFieldsValue({
        date: selectedDate,
        priority: 2,
        completed: false
      });
    }
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      let title = '';
      if (values.resourceType === 'video') {
        title = videos.find(v => v.id === values.resourceId)?.title || '未知视频';
      } else if (values.resourceType === 'material') {
        title = materials.find(m => m.id === values.resourceId)?.title || '未知资料';
      }

      const planData = {
        date: values.date.format('YYYY-MM-DD'),
        type: values.resourceType,
        resourceId: values.resourceId,
        title: title,
        priority: values.priority,
        notes: values.notes,
        completed: values.completed,
      };

      if (isEditMode && currentPlan) {
        await axios.put(`/api/study-plans/${currentPlan.id}`, planData);
        message.success('学习计划更新成功');
      } else {
        await axios.post('/api/study-plans', planData);
        message.success('学习计划添加成功');
      }
      
      setIsModalVisible(false);
      
      const response = await axios.get('/api/study-plans');
      setStudyPlans(response.data as StudyPlan[]);
    } catch (error) {
      console.error('保存学习计划失败:', error);
      message.error('保存学习计划失败');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    try {
      await axios.delete(`/api/study-plans/${planId}`);
      message.success('学习计划删除成功');
      
      const response = await axios.get('/api/study-plans');
      setStudyPlans(response.data as StudyPlan[]);
    } catch (error) {
      console.error('删除学习计划失败:', error);
      message.error('删除学习计划失败');
    }
  };

  const togglePlanCompletion = async (plan: StudyPlan) => {
    try {
      await axios.put(`/api/study-plans/${plan.id}/toggle-completion`);
      
      const response = await axios.get('/api/study-plans');
      setStudyPlans(response.data as StudyPlan[]);
      
      message.success(`已标记为${!plan.completed ? '已完成' : '未完成'}`);
    } catch (error) {
      console.error('更新计划状态失败:', error);
      message.error('更新计划状态失败');
    }
  };

  const getPriorityTag = (priority: number) => {
    const colors = { 1: 'blue', 2: 'orange', 3: 'red' };
    const labels = { 1: '低', 2: '中', 3: '高' };
    return (
      <Tag color={colors[priority as keyof typeof colors]}> {labels[priority as keyof typeof labels]}优先级 </Tag>
    );
  };

  const renderResourceLink = (plan: StudyPlan) => {
    const resourcePath = plan.type === 'video' ? '/videos' : '/materials';
      return (
      <Link to={`${resourcePath}/${plan.resourceId}`}>
        <Button type="link" icon={plan.type === 'video' ? <PlayCircleOutlined /> : <BookOutlined />}>
          {plan.type === 'video' ? '观看视频' : '查看资料'}
          </Button>
        </Link>
      );
  };

  const renderPlansList = () => {
    if (loading && dailyPlans.length === 0) {
      return <div><Spin tip="加载中..." /></div>;
    }
    return (
      <List
        itemLayout="vertical"
        size="large"
        dataSource={dailyPlans}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`${selectedDate.format('YYYY年MM月DD日')}没有学习计划`} /> }}
        renderItem={plan => (
          <List.Item
            key={plan.id}
            className={`daily-plan-item ${plan.completed ? 'completed' : ''}`}
            actions={!simplified ? [
                  <Button type="text" icon={plan.completed ? <ClockCircleOutlined /> : <CheckCircleFilled />} onClick={() => togglePlanCompletion(plan)} style={{ color: plan.completed ? 'rgba(0,0,0,0.45)' : '#52c41a' }}> {plan.completed ? '标记未完成' : '标记完成'} </Button>,
                  <Button type="text" icon={<EditOutlined />} onClick={() => showAddPlanModal(plan)}> 编辑 </Button>,
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeletePlan(plan.id)}> 删除 </Button>,
            ] : []}
            extra={getPriorityTag(plan.priority)}
          >
            <List.Item.Meta
              avatar={plan.type === 'video' ? <VideoCameraOutlined /> : <BookOutlined />}
              title={ <Space align="baseline"> <span style={{ textDecoration: plan.completed ? 'line-through' : 'none' }}> {plan.title} </span> {plan.completed && <CheckCircleFilled style={{ color: '#52c41a', fontSize: '14px'}}/>} </Space> }
              description={plan.notes || '暂无备注'}
            />
            <div style={{ marginTop: '8px' }}> {renderResourceLink(plan)} </div>
          </List.Item>
        )}
      />
    );
  };

  if (simplified) {
    return (
      <Card 
        title={ <span> <CalendarOutlined /> 今日学习计划 </span> } 
        extra={ <Link to="/daily-study-plan"> <Button type="link">查看更多</Button> </Link> }
      >
        {loading ? <div><Spin tip="加载中..." /></div> : renderPlansList()}
      </Card>
    );
  }

  return (
    <div className="daily-study-plan">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                label: <span><CalendarOutlined /> 日历视图</span>,
                key: 'calendar',
                children: (
                  <Card variant="outlined" loading={loading}>
                <Calendar 
                  cellRender={cellRender}
                  onSelect={onDateSelect}
                      value={selectedDate}
                />
              </Card>
                )
              },
              {
                label: <span><UnorderedListOutlined /> 每日计划</span>,
                key: 'daily',
                children: (
              <Card 
                title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                          <ClockCircleOutlined style={{ marginRight: 8 }} /> 
                          {selectedDate.format('YYYY年MM月DD日')} 学习计划
                  </span>
                        {dailyPlans.length > 0 && (
                          <Space align="center">
                            <Text type="secondary" style={{ fontSize: '12px', marginRight: '8px' }}>完成度:</Text>
                            <Progress 
                              percent={completionPercentage} 
                              size={[100, 8]}
                              status={completionPercentage === 100 ? 'success' : 'active'}
                              showInfo={false}
                            />
                            <span style={{ fontSize: '12px', marginLeft: '4px' }}>{completionPercentage}%</span>
                          </Space>
                        )}
                      </div>
                    } 
                    extra={ <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddPlanModal()}> 添加计划 </Button> }
                    variant="outlined"
              >
                {renderPlansList()}
              </Card>
                )
              }
            ]}
          />
        </Col>
      </Row>

      <Modal
        title={isEditMode ? "编辑学习计划" : "添加学习计划"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item name="date" label="计划日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="resourceType" label="资源类型" rules={[{ required: true, message: '请选择资源类型' }]}>
            <Select placeholder="选择资源类型" onChange={() => form.resetFields(['resourceId'])} >
              <Option value="video">视频</Option>
              <Option value="material">学习资料</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.resourceType !== currentValues.resourceType}
          >
            {({ getFieldValue }) => {
              const resourceType = getFieldValue('resourceType');
              const options = resourceType === 'video' ? videos : materials;
              return resourceType ? (
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
                    loading={resourceType && options.length === 0 && loading}
                    disabled={!resourceType}
                  >
                    {options.map((resource) => {
                      console.log('Rendering Option:', { id: resource.id, title: resource.title }); 
                      return (
                         <Option key={resource.id} value={resource.id}>{resource.title}</Option>
                      );
                    })}
            </Select>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
            <Select placeholder="选择优先级">
              <Option value={1}>低</Option>
              <Option value={2}>中</Option>
              <Option value={3}>高</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={4} placeholder="可添加备注说明" />
          </Form.Item>

          {isEditMode && (
            <Form.Item name="completed" label="完成状态" valuePropName="checked">
            <Select placeholder="完成状态">
              <Option value={true}>已完成</Option>
              <Option value={false}>未完成</Option>
            </Select>
          </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              {isEditMode ? '保存' : '添加'}
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyStudyPlan; 