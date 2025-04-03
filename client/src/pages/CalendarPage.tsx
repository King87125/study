import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Countdown from '../components/planner/Countdown';
import StudyCalendar from '../components/planner/StudyCalendar';
import { RootState } from '../types';

const { Title, Paragraph } = Typography;

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  
  const [examDate, setExamDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果用户未登录，重定向到登录页面
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    fetchExamDate();
  }, [userInfo, navigate]);

  const fetchExamDate = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<{examDate: string}>('/api/planner/exam-date');
      setExamDate(response.data.examDate);
    } catch (err) {
      console.error('获取考试日期失败:', err);
      setError('无法加载考试日期，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExamDate = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post<{examDate: string}>('/api/planner/exam-date', { examDate: date });
      setExamDate(response.data.examDate);
    } catch (err) {
      console.error('更新考试日期失败:', err);
      setError('无法更新考试日期，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calendar-page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>考研日历</Title>
          <Paragraph>
            管理您的考研时间，查看重要日期，为考试做好准备
          </Paragraph>
          {error && (
            <Alert
              message="错误"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}
        </Col>
        
        <Col xs={24} lg={8}>
          <Countdown 
            examDate={examDate} 
            onChangeDate={handleUpdateExamDate} 
          />
        </Col>
        
        <Col xs={24} lg={16}>
          <Card title="学习日历">
            <StudyCalendar examDate={examDate} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CalendarPage; 