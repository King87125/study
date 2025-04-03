import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Row, Col, Spin, message } from 'antd';
import FriendsList from '../components/friends/FriendsList';
import axios from 'axios';

const FriendsPage: React.FC = () => {
  const { userInfo, loading } = useSelector((state: any) => state.auth);

  // 页面加载时进行测试请求
  useEffect(() => {
    const testApi = async () => {
      if (userInfo && userInfo.token) {
        try {
          console.log('开始测试API请求');
          console.log('当前用户token:', userInfo.token);
          
          // 测试请求好友列表
          const response = await axios.get('/api/friends', {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          });
          
          console.log('好友列表测试请求结果:', response.data);
          
          // 测试请求好友请求列表
          const requestsResponse = await axios.get('/api/friend-requests', {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          });
          
          console.log('好友请求列表测试结果:', requestsResponse.data);
        } catch (error: any) {
          console.error('测试API请求失败:', error);
          console.error('错误详情:', error.response ? error.response.data : '无响应数据');
          message.error('获取好友数据失败，请检查网络连接');
        }
      }
    };
    
    testApi();
  }, [userInfo]);

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

  return (
    <div className="page-container">
      <Row justify="center">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <FriendsList />
        </Col>
      </Row>
    </div>
  );
};

export default FriendsPage;
