import React, { useState, useEffect } from 'react';
import { Card, Progress, Row, Col, Statistic, Typography, Spin, message } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;

interface Subject {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
}

interface ProgressData {
  overallProgress: number;
  subjects: Subject[];
}

interface StudyProgressProps {
  examDate: string;
}

const StudyProgress: React.FC<StudyProgressProps> = ({ examDate }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/planner/progress');
      const data = response.data as ProgressData;
      setProgressData(data);
    } catch (error) {
      console.error('获取学习进度失败:', error);
      message.error('无法加载学习进度数据');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (): number => {
    if (!examDate) return 0;
    
    const today = dayjs().startOf('day');
    const examDay = dayjs(examDate).startOf('day');
    const days = examDay.diff(today, 'day');
    
    return days >= 0 ? days : 0;
  };

  const daysLeft = calculateDaysLeft();

  return (
    <Spin spinning={loading}>
      <div className="study-progress-container">
        <Card className="progress-overview-card">
          <Title level={4}>总体备考进度</Title>
          
          <Row gutter={[16, 24]} style={{ marginTop: 20 }}>
            <Col span={24} md={12}>
              <Card variant="borderless">
                <Statistic 
                  title="剩余天数" 
                  value={daysLeft} 
                  suffix="天"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text type="secondary">
                  考试日期: {examDate ? dayjs(examDate).format('YYYY年MM月DD日') : '未设置'}
                </Text>
              </Card>
            </Col>
            
            <Col span={24} md={12}>
              <Card variant="borderless">
                <Statistic 
                  title="总体完成度" 
                  value={progressData?.overallProgress || 0} 
                  suffix="%" 
                  valueStyle={{ color: '#3f8600' }}
                />
                <Progress 
                  percent={progressData?.overallProgress || 0} 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="各科目学习进度" style={{ marginTop: 16 }}>
          {progressData?.subjects.map(subject => (
            <div key={subject.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text strong>{subject.name}</Text>
                <Text>{subject.completedTopics}/{subject.totalTopics} 章节</Text>
              </div>
              <Progress 
                percent={Math.round((subject.completedTopics / subject.totalTopics) * 100)} 
                size="small"
                status="active"
              />
            </div>
          ))}
        </Card>
      </div>
    </Spin>
  );
};

export default StudyProgress; 