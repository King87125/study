import React, { useState, useEffect } from 'react';
import { Card, Button, notification, Spin } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const HealthPageTest: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  // 获取用户认证信息
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const userId = userInfo?.id;
  const token = userInfo?.token;

  const testApiConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 测试公共API端点
      const statusResponse = await axios.get('/api/health/status');
      console.log('健康状态API测试:', statusResponse.data);
      
      // 尝试获取健康数据
      if (userId && token) {
        try {
          const userResponse = await axios.get(`/api/health/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('用户健康数据响应:', userResponse.data);
          setApiResponse(userResponse.data);
          
          notification.success({
            message: '获取健康数据成功',
            description: '已成功获取用户健康数据'
          });
        } catch (userErr: any) {
          console.error('获取用户健康数据失败:', userErr);
          setError(`获取健康数据失败: ${userErr.message}`);
          
          notification.error({
            message: '获取健康数据失败',
            description: userErr.response?.data?.message || userErr.message
          });
        }
      } else {
        setError('未找到用户ID或Token');
        notification.warning({
          message: '无法获取健康数据',
          description: '请先登录以访问您的健康数据'
        });
      }
    } catch (err: any) {
      console.error('API测试失败:', err);
      setError(`API测试失败: ${err.message}`);
      
      notification.error({
        message: 'API测试失败',
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('HealthPageTest 已加载');
    console.log('用户信息:', userInfo);
    console.log('用户ID:', userId);
    console.log('Token:', token);
  }, [userInfo, userId, token]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Card title="健康管理页面测试">
        <p>这是一个简化版的健康管理页面，用于测试组件渲染和API连接问题。</p>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>用户信息</h3>
          <p>登录状态: {userInfo ? '已登录' : '未登录'}</p>
          <p>用户ID: {userId || '未知'}</p>
          <p>Token: {token ? `${token.substring(0, 15)}...` : '未找到'}</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <Button 
            type="primary" 
            onClick={testApiConnection} 
            loading={loading}
            disabled={loading}
          >
            测试健康数据API
          </Button>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin size="large" />
            <p>正在请求数据...</p>
          </div>
        )}
        
        {error && (
          <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
            <h3 style={{ color: '#f5222d' }}>错误信息</h3>
            <p>{error}</p>
          </div>
        )}
        
        {apiResponse && (
          <div style={{ margin: '20px 0' }}>
            <h3>API响应数据</h3>
            <pre style={{ 
              background: '#f6f8fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HealthPageTest; 