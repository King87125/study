import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Row, Col, Spin } from 'antd';
import StudySupervisionComponent from '../components/supervision/StudySupervision';

const StudySupervisionPage: React.FC = () => {
  const { userInfo, loading } = useSelector((state: any) => state.auth);
  const { friendId } = useParams<{ friendId: string }>();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!userInfo) {
    return <Navigate to="/login" />;
  }

  // 如果没有好友ID参数，重定向到好友列表页面
  if (!friendId) {
    return <Navigate to="/friends" />;
  }

  return (
    <div className="page-container">
      <Row justify="center">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <StudySupervisionComponent />
        </Col>
      </Row>
    </div>
  );
};

export default StudySupervisionPage; 