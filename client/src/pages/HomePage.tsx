import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Spin, Space } from 'antd';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Countdown from '../components/planner/Countdown';
import { RootState } from '../types';
import { VideoCameraAddOutlined, ReadOutlined, ScheduleOutlined, RightOutlined } from '@ant-design/icons';
import './HomePage.css';

const { Title, Paragraph, Text } = Typography;

const HomePage: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [examDate, setExamDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      fetchExamDate();
    }
  }, [userInfo]);

  const fetchExamDate = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{examDate: string}>('/api/planner/exam-date');
      setExamDate(response.data.examDate);
    } catch (error) {
      console.error('获取考试日期失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExamDate = async (date: string) => {
    try {
      setLoading(true);
      const response = await axios.post<{examDate: string}>('/api/planner/exam-date', { examDate: date });
      setExamDate(response.data.examDate);
    } catch (error) {
      console.error('更新考试日期失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page-container" style={{ padding: '0 24px' }}>
      <Row justify="center" align="middle" className="home-hero-section">
        <Col xs={24} md={16} style={{ textAlign: 'center' }}>
          <Title level={1} style={{ marginBottom: '16px', fontWeight: 700 }}>
            欢迎来到 考研伴侣
          </Title>
          <Paragraph style={{ fontSize: '18px', color: 'rgba(0, 0, 0, 0.65)', marginBottom: '32px' }}>
            一站式考研学习平台，提供优质视频课程、精选学习资料和智能学习计划，<br />
            助你高效备考，轻松上岸。
            </Paragraph>
          <Space size="large">
            <Button type="primary" size="large" href="/videos">
              开始学习 <RightOutlined />
            </Button>
            <Button size="large" href="/register">
              立即注册
            </Button>
          </Space>
        </Col>
      </Row>

        {userInfo && (
        <Row justify="center" style={{ marginTop: '48px' }}>
          <Col xs={24} md={12} lg={10}>
            <Card className="countdown-card" variant="borderless" style={{ border: '1px solid #f0f0f0' }}>
              <Spin spinning={loading}>
                <Countdown 
                  examDate={examDate} 
                  onChangeDate={handleUpdateExamDate} 
                />
              </Spin>
            </Card>
          </Col>
        </Row>
        )}

      <Row gutter={[24, 32]} justify="center" className="home-features-section">
        <Col span={24} style={{ textAlign: 'center' }}>
          <Title level={2}>核心功能</Title>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card className="home-feature-card" hoverable>
            <Space direction="vertical" align="center" size="middle">
              <VideoCameraAddOutlined className="home-feature-icon" />
              <Title level={4}>优质视频课程</Title>
              <Paragraph type="secondary">
                精选专业考研备考视频，紧跟考点，名师讲解，助你快速掌握知识。
            </Paragraph>
            <Link to="/videos">
                <Button type="primary" ghost>
                  浏览课程
                </Button>
            </Link>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card className="home-feature-card" hoverable>
            <Space direction="vertical" align="center" size="middle">
              <ReadOutlined className="home-feature-icon" />
              <Title level={4}>精选学习资料</Title>
              <Paragraph type="secondary">
                汇集历年真题、模拟试卷、核心笔记等高质量资料，高效备考必备。
            </Paragraph>
            <Link to="/materials">
                <Button type="primary" ghost>
                  查看资料
                </Button>
            </Link>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card className="home-feature-card" hoverable>
            <Space direction="vertical" align="center" size="middle">
              <ScheduleOutlined className="home-feature-icon" />
              <Title level={4}>智能学习计划</Title>
              <Paragraph type="secondary">
                根据个人情况定制学习计划，跟踪学习进度，智能提醒，提高效率。
            </Paragraph>
            <Link to="/study-planner">
                <Button type="primary" ghost>
                  制定计划
                </Button>
            </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage; 