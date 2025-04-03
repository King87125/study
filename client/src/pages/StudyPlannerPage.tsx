import React, { useState, useEffect } from 'react';
import { Typography, Spin, message, Row, Col } from 'antd';
import { useSelector } from 'react-redux';
import axios from 'axios';
import StudyCalendar from '../components/planner/StudyCalendar';
import TodaysPlanList from '../components/planner/TodaysPlanList';
import { RootState } from '../types';
import './StudyPlannerPage.css';

const { Title } = Typography;

// 定义用户 Profile 数据的接口 (至少包含 examDate)
interface UserProfile {
  examDate?: string;
  // ... 其他可能的 profile 字段
}

const StudyPlannerPage: React.FC = () => {
  const [examDate, setExamDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userInfo } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchExamDate = async () => {
      if (!userInfo) return;
      try {
        // 为 axios.get 添加类型注解
        const response = await axios.get<UserProfile>('/api/users/profile'); 
        setExamDate(response.data.examDate || null);
      } catch (error) {
        console.error('获取考试日期失败:', error);
        // message.error('无法获取考试日期'); // 不一定是错误，可能用户没设置
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamDate();
  }, [userInfo]);

  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>;
  }

  return (
    <div className="page-container study-planner-page">
      <Title level={2} style={{ marginBottom: '24px' }}>学习计划</Title>

      {/* 今日计划列表放在最上面 */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <TodaysPlanList />
        </Col>

        {/* 日历视图放在下方 */}
        <Col xs={24}>
          <Title level={3} style={{ marginTop: '30px', marginBottom: '20px' }}>学习日历总览</Title>
          <StudyCalendar examDate={examDate || ''} />
        </Col>
      </Row>
    </div>
  );
};

export default StudyPlannerPage; 