import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Form, Input, Button, Select, InputNumber, Calendar, Badge, Row, Col, Alert, Tabs, Table, Radio, Space, Modal, Progress, Tag, Statistic, Typography, message } from 'antd';
import { WomanOutlined, PlusOutlined, EditOutlined, HistoryOutlined, LineChartOutlined, ReadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

interface MenstruationTrackerProps {
  lastPeriod: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  menstruationSymptoms: string | null;
  menstruationNotes: string | null;
  onUpdateMenstruation: (data: any) => void;
}

// 历史记录接口
interface PeriodRecord {
  key: string;
  startDate: string;
  endDate: string;
  duration: number;
  symptoms: string[];
  painLevel: number;
  mood: string;
  notes: string;
}

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// 症状选项
const symptomOptions = [
  { value: '痛经', label: '痛经', color: '#f50' },
  { value: '乏力', label: '乏力', color: '#108ee9' },
  { value: '情绪波动', label: '情绪波动', color: '#87d068' },
  { value: '头痛', label: '头痛', color: '#2db7f5' },
  { value: '腰痛', label: '腰痛', color: '#ff85c0' },
  { value: '食欲变化', label: '食欲变化', color: '#faad14' },
  { value: '浮肿', label: '浮肿', color: '#8c8c8c' },
  { value: '恶心', label: '恶心', color: '#7265e6' },
  { value: '失眠', label: '失眠', color: '#ffb8b8' },
  { value: '乳房胀痛', label: '乳房胀痛', color: '#b37feb' }
];

// 情绪选项
const moodOptions = [
  { value: '平静', label: '平静', color: '#87d068' },
  { value: '焦虑', label: '焦虑', color: '#fadb14' },
  { value: '烦躁', label: '烦躁', color: '#f5222d' },
  { value: '愉悦', label: '愉悦', color: '#1890ff' },
  { value: '抑郁', label: '抑郁', color: '#722ed1' },
  { value: '敏感', label: '敏感', color: '#eb2f96' }
];

// 模拟历史记录数据
const mockHistoryData = [
  {
    key: '1',
    startDate: '2023-03-01',
    endDate: '2023-03-06',
    duration: 6,
    symptoms: ['痛经', '乏力'],
    painLevel: 3,
    mood: '焦虑',
    notes: '学习任务重，经期状态一般'
  },
  {
    key: '2',
    startDate: '2023-03-29',
    endDate: '2023-04-03',
    duration: 6,
    symptoms: ['头痛', '情绪波动'],
    painLevel: 2,
    mood: '烦躁',
    notes: '经期较短，痛经较轻'
  },
  {
    key: '3',
    startDate: '2023-04-27',
    endDate: '2023-05-02',
    duration: 6,
    symptoms: ['腰痛', '食欲变化', '乏力'],
    painLevel: 4,
    mood: '敏感',
    notes: '经期前情绪波动较大'
  }
];

const MenstruationTracker: React.FC<MenstruationTrackerProps> = ({
  lastPeriod,
  cycleLength = 28,
  periodLength = 5,
  menstruationSymptoms = '',
  menstruationNotes = '',
  onUpdateMenstruation
}) => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    lastPeriod ? dayjs(lastPeriod) : null
  );
  const [activeTab, setActiveTab] = useState<string>('record');
  const [historyData, setHistoryData] = useState<PeriodRecord[]>(mockHistoryData);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [painLevel, setPainLevel] = useState<number>(1);
  const [selectedMood, setSelectedMood] = useState<string>('平静');
  const [isLoading, setIsLoading] = useState(false);
  
  // 计算下一次周期
  const getNextCycle = () => {
    if (!selectedDate || !cycleLength) return null;
    return selectedDate.add(cycleLength, 'days');
  };
  
  // 计算排卵期
  const getOvulationDate = () => {
    const nextCycleStart = getNextCycle();
    if (!nextCycleStart) return null;
    return nextCycleStart.subtract(14, 'day');
  };
  
  // 计算经期预测
  const getPredictedPeriods = (): { start: Dayjs, end: Dayjs }[] => {
    if (!selectedDate || !cycleLength || !periodLength) return [];
    
    const periods = [];
    const currentCycleLength = cycleLength ?? 28;
    const currentPeriodLength = periodLength ?? 5;
    
    for (let i = -3; i <= 6; i++) {
      const cycleStartDate = selectedDate.add(currentCycleLength * i, 'day');
      const cycleEndDate = cycleStartDate.add(currentPeriodLength - 1, 'day');
      
      periods.push({
        start: cycleStartDate,
        end: cycleEndDate
      });
    }
    
    return periods;
  };
  
  // 优化日历单元格渲染 - 修复重叠问题 (使用 CSS 类名)
  const cellRender = (current: Dayjs, info: { originNode: React.ReactElement, type: string }) => {
    if (info.type !== 'date') return info.originNode;

    const isToday = current.isSame(dayjs(), 'day');
    const predictedPeriods = getPredictedPeriods();
    const isPredictedPeriod = predictedPeriods.some(p => current.isBetween(p.start, p.end, 'day', '[]'));
    const isActualPeriod = historyData.some(record =>
      dayjs(record.startDate).isValid() && dayjs(record.endDate).isValid() &&
      current.isBetween(dayjs(record.startDate), dayjs(record.endDate), 'day', '[]')
    );
    const ovulationDate = getOvulationDate();
    const isOvulation = ovulationDate ? ovulationDate.isSame(current, 'day') : false;

    let customClassName = ' date-cell-custom'; // 基础类名，用于可能的通用样式
    let cellTitle = ''; // 用于 tooltip 提示

    if (isActualPeriod) {
      customClassName += ' actual-period-cell';
      cellTitle = '经期';
    } else if (isPredictedPeriod) {
      customClassName += ' predicted-period-cell';
      cellTitle = '预测期';
    }

    if (isOvulation) {
      customClassName += ' ovulation-cell';
      cellTitle = cellTitle ? `${cellTitle} / 排卵日` : '排卵日';
    }

    if (isToday) {
      customClassName += ' today-cell';
    }

    // 克隆原始节点并仅合并类名和 title
    const originalProps = info.originNode.props;
    const originalClassName = (originalProps as any)?.className || '';
    const mergedClassName = `${originalClassName}${customClassName}`.trim();

    // 只传递 className 和 title，避免 style 相关的类型问题
    return React.cloneElement(info.originNode, {
        className: mergedClassName,
        title: cellTitle
    } as any);
  };

  // 处理表单提交
  const handleSubmit = (values: any) => {
    const data = {
      lastPeriod: values.lastPeriod.format('YYYY-MM-DD'),
      cycleLength: values.cycleLength,
      periodLength: values.periodLength,
      menstruationSymptoms: values.symptoms,
      menstruationNotes: values.notes,
      painLevel: painLevel,
      mood: selectedMood
    };
    
    // 添加到历史记录
    const newRecord: PeriodRecord = {
      key: Date.now().toString(),
      startDate: values.lastPeriod.format('YYYY-MM-DD'),
      endDate: values.lastPeriod.clone().add(values.periodLength - 1, 'days').format('YYYY-MM-DD'),
      duration: values.periodLength,
      symptoms: values.symptoms || [],
      painLevel: painLevel,
      mood: selectedMood,
      notes: values.notes || ''
    };
    
    setHistoryData([newRecord, ...historyData]);
    
    onUpdateMenstruation(data);
    setSelectedDate(values.lastPeriod);
    
    // 关闭添加模态框
    setIsAddModalVisible(false);
  };
  
  // 设置表单初始值
  useEffect(() => {
    form.setFieldsValue({
      lastPeriod: lastPeriod ? dayjs(lastPeriod) : null,
      cycleLength: cycleLength,
      periodLength: periodLength,
      symptoms: menstruationSymptoms ? menstruationSymptoms.split(',') : [],
      notes: menstruationNotes || ''
    });
  }, [form, lastPeriod, cycleLength, periodLength, menstruationSymptoms, menstruationNotes]);
  
  // 表格列定义
  const columns = [
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
    },
    {
      title: '持续天数',
      dataIndex: 'duration',
      key: 'duration',
      sorter: (a: PeriodRecord, b: PeriodRecord) => a.duration - b.duration,
    },
    {
      title: '症状',
      dataIndex: 'symptoms',
      key: 'symptoms',
      render: (symptoms: string[]) => (
        <span>
          {symptoms.map(symptom => {
            const option = symptomOptions.find(o => o.value === symptom);
            return option ? (
              <Tag color={option.color} key={symptom}>
                {symptom}
              </Tag>
            ) : null;
          })}
        </span>
      ),
    },
    {
      title: '痛经程度',
      dataIndex: 'painLevel',
      key: 'painLevel',
      render: (level: number) => (
        <Progress 
          percent={level * 20} 
          size="small" 
          status={level > 3 ? "exception" : "active"} 
          format={() => `${level}/5`}
        />
      ),
    },
    {
      title: '情绪',
      dataIndex: 'mood',
      key: 'mood',
      render: (mood: string) => {
        const option = moodOptions.find(o => o.value === mood);
        return option ? (
          <Tag color={option.color}>
            {mood}
          </Tag>
        ) : mood;
      },
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PeriodRecord) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];
  
  // 添加记录模态框
  const renderAddModal = () => (
    <Modal
      title="添加经期记录"
      open={isAddModalVisible}
      onCancel={() => setIsAddModalVisible(false)}
      footer={null}
      width={700}
    >
      <Form 
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="lastPeriod" 
              label="经期开始日期"
              rules={[{ required: true, message: '请选择经期开始日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="periodLength" 
              label="经期持续天数"
              rules={[{ required: true, message: '请输入经期持续天数' }]}
            >
              <InputNumber min={2} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="cycleLength" 
              label="月经周期长度 (天)"
              rules={[{ required: true, message: '请输入月经周期长度' }]}
            >
              <InputNumber min={20} max={40} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="痛经程度">
              <Radio.Group value={painLevel} onChange={e => setPainLevel(e.target.value)}>
                <Radio.Button value={1}>轻微</Radio.Button>
                <Radio.Button value={2}>较轻</Radio.Button>
                <Radio.Button value={3}>中度</Radio.Button>
                <Radio.Button value={4}>较重</Radio.Button>
                <Radio.Button value={5}>剧烈</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item name="symptoms" label="症状记录">
          <Select
            mode="multiple"
            placeholder="选择症状"
            style={{ width: '100%' }}
            tagRender={props => {
              const { value, closable, onClose } = props;
              const option = symptomOptions.find(o => o.value === value);
              return (
                <Tag 
                  color={option?.color} 
                  closable={closable}
                  onClose={onClose}
                  style={{ marginRight: 3 }}
                >
                  {value}
                </Tag>
              );
            }}
          >
            {symptomOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item label="情绪状态">
          <Radio.Group value={selectedMood} onChange={e => setSelectedMood(e.target.value)}>
            {moodOptions.map(option => (
              <Radio.Button value={option.value} key={option.value}>
                {option.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>
        
        <Form.Item name="notes" label="备注">
          <TextArea rows={4} placeholder="添加备注..." />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            保存经期记录
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
  
  return (
    <Card title="经期管理" className="menstruation-tracker">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'record',
            label: <span><WomanOutlined />经期记录</span>,
            children: (
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div style={{ padding: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <WomanOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
                      <h2>经期信息</h2>
                    </div>
                    
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: '20px' }}
                      message="点击下方按钮添加新的经期记录"
                      description="定期记录经期信息有助于更好地了解自己的生理状况，并能预测未来的经期日期。"
                    />
                    
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      block 
                      onClick={() => setIsAddModalVisible(true)}
                      style={{ marginBottom: '20px' }}
                    >
                      添加经期记录
                    </Button>
                    
                    <div style={{ marginTop: '20px' }}>
                      <Alert
                        message="下次经期预测"
                        description={
                          <div>
                            {selectedDate ? (
                              <>
                                <p>最近一次经期开始日期: {selectedDate.format('YYYY-MM-DD')}</p>
                                <p>下次经期预计开始日期: {getNextCycle()?.format('YYYY-MM-DD')}</p>
                                <p>排卵日: {getOvulationDate()?.format('YYYY-MM-DD')}</p>
                                <p>经期持续天数: {periodLength} 天</p>
                                <p>月经周期长度: {cycleLength} 天</p>
                              </>
                            ) : (
                              <p>请先记录经期开始日期</p>
                            )}
                          </div>
                        }
                        type="info"
                        showIcon
                      />
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} md={12}>
                  <div style={{ padding: '20px' }}>
                    <h3>经期预测日历</h3>
                    <Calendar
                      fullscreen={false}
                      cellRender={cellRender}
                      headerRender={({ value, onChange }) => {
                        const start = 0;
                        const end = 12;
                        const monthOptions = [];
                        
                        for (let i = start; i < end; i++) {
                          monthOptions.push(
                            <Select.Option key={i} value={i}>
                              {i + 1}月
                            </Select.Option>
                          );
                        }
                        
                        const year = value.year();
                        const month = value.month();
                        
                        return (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <div>
                              <Select
                                size="small"
                                value={month}
                                onChange={selectedMonth => {
                                  const newValue = value.clone();
                                  newValue.month(selectedMonth);
                                  onChange(newValue);
                                }}
                              >
                                {monthOptions}
                              </Select>
                            </div>
                            <div>
                              <InputNumber
                                size="small"
                                value={year}
                                onChange={newYear => {
                                  const newValue = value.clone();
                                  newValue.year(newYear as number);
                                  onChange(newValue);
                                }}
                              />
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>
                </Col>
              </Row>
            )
          },
          {
            key: 'history',
            label: <span><HistoryOutlined />历史记录</span>,
            children: (
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3>经期历史记录</h3>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsAddModalVisible(true)}
                  >
                    添加记录
                  </Button>
                </div>
                <Table 
                  columns={columns} 
                  dataSource={historyData} 
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 1000 }}
                />
              </div>
            )
          },
          {
            key: 'stats',
            label: <span><LineChartOutlined />统计分析</span>,
            children: (
              <Row gutter={[16, 16]} style={{ padding: '20px' }}>
                <Col span={24}>
                  <Alert
                    message="经期统计分析"
                    description="根据您的历史记录，我们提供了您的经期统计分析。这些数据可以帮助您更好地了解自己的生理周期。"
                    type="info"
                    showIcon
                    style={{ marginBottom: '20px' }}
                  />
                </Col>
                
                <Col xs={24} md={8}>
                  <Card title="周期长度">
                    <Statistic
                      title="平均周期长度"
                      value={cycleLength || 28}
                      suffix="天"
                    />
                    <p style={{ color: '#8c8c8c' }}>
                      {(cycleLength || 28) < 25 ? '您的周期较短' : 
                       (cycleLength || 28) > 31 ? '您的周期较长' : 
                       '您的周期在正常范围内'}
                    </p>
                  </Card>
                </Col>
                
                <Col xs={24} md={8}>
                  <Card title="经期持续天数">
                    <Statistic
                      title="平均持续天数"
                      value={periodLength || 5}
                      suffix="天"
                    />
                    <p style={{ color: '#8c8c8c' }}>
                      {(periodLength || 5) < 4 ? '您的经期较短' : 
                       (periodLength || 5) > 7 ? '您的经期较长' : 
                       '您的经期在正常范围内'}
                    </p>
                  </Card>
                </Col>
                
                <Col xs={24} md={8}>
                  <Card title="常见症状">
                    <div>
                      {menstruationSymptoms ? 
                        menstruationSymptoms.split(',').map(symptom => {
                          const option = symptomOptions.find(o => o.value === symptom);
                          return option ? (
                            <Tag color={option.color} key={symptom} style={{ margin: '0 5px 5px 0' }}>
                              {symptom}
                            </Tag>
                          ) : null;
                        })
                        : <p>暂无症状记录</p>
                      }
                    </div>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'tips',
            label: <span>小贴士</span>,
            children: (
              <div style={{ padding: '20px' }}>
                <h3>经期管理小贴士</h3>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card title="经期护理">
                      <ul>
                        <li>经期应减少剧烈运动，保持充足的休息</li>
                        <li>注意保暖，避免着凉</li>
                        <li>保持个人卫生，勤换卫生用品</li>
                        <li>适当进行轻度活动，如散步、轻度瑜伽</li>
                        <li>饮食清淡，避免刺激性食物</li>
                      </ul>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={8}>
                    <Card title="经期饮食">
                      <ul>
                        <li>多补充富含铁质的食物，如菠菜、瘦肉等</li>
                        <li>适量摄入蛋白质，有助于身体恢复</li>
                        <li>多喝温水，保持身体水分</li>
                        <li>避免过度摄入糖分和咖啡因</li>
                        <li>适量补充钙质，有助于缓解情绪波动</li>
                      </ul>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={8}>
                    <Card title="学习调整">
                      <ul>
                        <li>经期可能影响学习状态，适当调整学习计划</li>
                        <li>感到疲惫时，适当休息，不要过度透支</li>
                        <li>情绪波动时，尝试深呼吸或冥想放松</li>
                        <li>重要考试前，留意自己的经期安排</li>
                        <li>规律记录经期有助于了解自己的身体状况</li>
                      </ul>
                    </Card>
                  </Col>
                </Row>
              </div>
            )
          }
        ]}
      />
      
      {renderAddModal()}
    </Card>
  );
};

export default MenstruationTracker; 