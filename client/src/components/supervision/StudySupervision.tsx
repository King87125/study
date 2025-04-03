import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, DatePicker, InputNumber, List, Typography, Statistic, Row, Col, Progress, message, Divider } from 'antd';
import { BookOutlined, ClockCircleOutlined, CheckCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import type { Moment } from 'moment';
import type { RangePickerProps } from 'antd/es/date-picker';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface StudySupervision {
  id: number;
  userId: number;
  supervisorId: number;
  date: string;
  studyHours: number;
  completedTasks: number;
  goalHours: number;
  goalTasks: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudyStats {
  userId: number;
  username: string;
  period: {
    from: string;
    to: string;
  };
  totalRecords: number;
  studyStats: {
    totalHours: number;
    avgHoursPerDay: number;
    hoursCompletionRate: number;
    totalTasks: number;
    avgTasksPerDay: number;
    tasksCompletionRate: number;
  };
  records: StudySupervision[];
}

const StudySupervisionComponent: React.FC = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const [form] = Form.useForm();
  const [records, setRecords] = useState<StudySupervision[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Moment, Moment]>([
    moment().subtract(7, 'days'),
    moment()
  ]);
  const token = useSelector((state: any) => state.auth.token);
  const userId = useSelector((state: any) => state.auth.user?.id);

  // 获取好友的学习统计数据
  const fetchFriendStats = async () => {
    if (!friendId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${friendId}/study-stats`, {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = response.data as StudyStats;
      setStats(statsData);
      setRecords(statsData.records || []);
    } catch (error) {
      console.error('获取学习统计失败:', error);
      message.error('获取学习统计失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建学习监督记录
  const createSupervisionRecord = async (values: any) => {
    try {
      setSubmitLoading(true);
      const data = {
        userId: parseInt(friendId as string),
        date: values.date.format('YYYY-MM-DD'),
        studyHours: values.studyHours,
        completedTasks: values.completedTasks,
        goalHours: values.goalHours,
        goalTasks: values.goalTasks,
        comment: values.comment
      };
      
      await axios.post('/api/supervisions', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      message.success('学习监督记录已创建');
      form.resetFields();
      fetchFriendStats();
    } catch (error) {
      console.error('创建学习监督记录失败:', error);
      message.error('创建学习监督记录失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 日期范围变化处理
  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0] as Moment, dates[1] as Moment]);
    }
  };

  useEffect(() => {
    if (token && friendId) {
      fetchFriendStats();
    }
  }, [token, friendId, dateRange]);

  return (
    <div className="study-supervision-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Title level={3}>
        <BookOutlined /> 学习监督
      </Title>
      
      {stats && (
        <Card style={{ marginBottom: '20px' }}>
          <Title level={4}>{stats.username} 的学习数据</Title>
          <Paragraph>
            统计周期: {moment(stats.period.from).format('YYYY-MM-DD')} 至 {moment(stats.period.to).format('YYYY-MM-DD')}
          </Paragraph>
          
          <DatePicker.RangePicker 
            value={dateRange as any}
            onChange={handleDateRangeChange}
            style={{ marginBottom: '20px' }}
          />
          
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic 
                title="总学习时长" 
                value={stats.studyStats.totalHours} 
                suffix="小时" 
                prefix={<ClockCircleOutlined />} 
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="日均学习时长" 
                value={stats.studyStats.avgHoursPerDay.toFixed(1)} 
                suffix="小时/天" 
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="总完成任务数" 
                value={stats.studyStats.totalTasks} 
                prefix={<CheckCircleOutlined />} 
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="日均完成任务数" 
                value={stats.studyStats.avgTasksPerDay.toFixed(1)} 
                suffix="个/天" 
              />
            </Col>
          </Row>
          
          <Divider>目标完成率</Divider>
          
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Text>学习时长完成率</Text>
                <Progress 
                  type="circle" 
                  percent={Math.min(100, stats.studyStats.hoursCompletionRate)} 
                  format={percent => `${percent?.toFixed(1)}%`}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Text>任务完成率</Text>
                <Progress 
                  type="circle" 
                  percent={Math.min(100, stats.studyStats.tasksCompletionRate)} 
                  format={percent => `${percent?.toFixed(1)}%`}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}
      
      <Tabs 
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: (
              <span>
                <LineChartOutlined />
                学习记录
              </span>
            ),
            children: (
              <List
                loading={loading}
                itemLayout="vertical"
                dataSource={records}
                locale={{ emptyText: '暂无学习记录' }}
                renderItem={record => (
                  <List.Item>
                    <Card style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <Text strong>{moment(record.date).format('YYYY-MM-DD')}</Text>
                        <Text type="secondary">
                          {record.supervisorId === userId ? '由你记录' : '由对方记录'}
                        </Text>
                      </div>
                      
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic 
                            title="学习时长" 
                            value={record.studyHours} 
                            suffix="小时" 
                            valueStyle={{ fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="时长目标" 
                            value={record.goalHours} 
                            suffix="小时" 
                            valueStyle={{ fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="完成任务数" 
                            value={record.completedTasks} 
                            valueStyle={{ fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="任务目标" 
                            value={record.goalTasks} 
                            valueStyle={{ fontSize: '16px' }}
                          />
                        </Col>
                      </Row>
                      
                      {record.comment && (
                        <div style={{ marginTop: '10px' }}>
                          <Text type="secondary">备注:</Text>
                          <Paragraph>{record.comment}</Paragraph>
                        </div>
                      )}
                    </Card>
                  </List.Item>
                )}
              />
            )
          },
          {
            key: '2',
            label: (
              <span>
                <BookOutlined />
                添加记录
              </span>
            ),
            children: (
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={createSupervisionRecord}
                  initialValues={{
                    date: moment(),
                    studyHours: 0,
                    completedTasks: 0,
                    goalHours: 8,
                    goalTasks: 5
                  }}
                >
                  <Form.Item
                    name="date"
                    label="日期"
                    rules={[{ required: true, message: '请选择日期' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="studyHours"
                        label="实际学习时长(小时)"
                        rules={[{ required: true, message: '请输入学习时长' }]}
                      >
                        <InputNumber min={0} max={24} step={0.5} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="goalHours"
                        label="目标学习时长(小时)"
                        rules={[{ required: true, message: '请输入目标学习时长' }]}
                      >
                        <InputNumber min={0} max={24} step={0.5} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="completedTasks"
                        label="完成的任务数量"
                        rules={[{ required: true, message: '请输入完成的任务数量' }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="goalTasks"
                        label="目标任务数量"
                        rules={[{ required: true, message: '请输入目标任务数量' }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    name="comment"
                    label="学习评价与建议"
                  >
                    <TextArea rows={4} placeholder="输入对学习情况的评价和建议..." />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={submitLoading}>
                      提交学习记录
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default StudySupervisionComponent;