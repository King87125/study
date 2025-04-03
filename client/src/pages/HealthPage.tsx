import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import MenstruationTracker from '../components/health/MenstruationTracker';
import { RootState } from '../types';

// 接口定义
interface MenstruationData {
  lastPeriod: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  symptoms: string[];
  notes: string;
  nextPeriod: string | null;
}

interface HealthDataResponse {
  success: boolean;
  data: {
    menstruation: MenstruationData | null;
  };
  message?: string;
}

interface HealthData {
  userId: number;
  lastPeriod: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  menstruationSymptoms: string | null;
  menstruationNotes: string | null;
}

const HealthPage: React.FC = () => {
  // 状态管理
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  
  // 获取用户认证信息
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const userId = userInfo?.id;
  const token = userInfo?.token;

  // 获取健康数据
  useEffect(() => {
    const fetchHealthData = async () => {
      // 没有用户ID或token则不继续
      if (!userId || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 发送请求获取数据
        const response = await axios.get<HealthDataResponse>(`/api/health/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 检查响应
        if (!response.data || response.data.success === false) {
          throw new Error(response.data?.message || '获取经期数据失败');
        }
        
        const data = response.data.data;
        
        // 将响应数据转换为应用需要的格式
        setHealthData({
          userId: Number(userId),
          lastPeriod: data.menstruation?.lastPeriod || null,
          cycleLength: data.menstruation?.cycleLength || 28,
          periodLength: data.menstruation?.periodLength || 5,
          menstruationSymptoms: data.menstruation?.symptoms?.join(',') || '',
          menstruationNotes: data.menstruation?.notes || '',
        });
        
      } catch (err: any) {
        console.error('获取经期数据失败:', err);
        
        setError(err.message || '获取经期数据失败');
        notification.error({
          message: '获取经期数据失败',
          description: err.response?.data?.message || '请稍后再试'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [userId, token, navigate]);

  // 更新经期数据
  const updateMenstruation = async (data: any) => {
    if (!userId || !token) return;
    
    try {
      await axios.post('/api/health/menstruation', 
        { ...data, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 更新本地数据
      if (healthData) {
        setHealthData({
          ...healthData,
          lastPeriod: data.lastPeriod,
          cycleLength: data.cycleLength,
          periodLength: data.periodLength,
          menstruationSymptoms: data.menstruationSymptoms,
          menstruationNotes: data.menstruationNotes
        });
      }
      
      notification.success({
        message: '经期数据已更新',
        description: '您的经期记录已成功保存'
      });
    } catch (err: any) {
      notification.error({
        message: '更新经期数据失败',
        description: err.response?.data?.message || '请稍后再试'
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div><Spin size="large" tip="加载经期数据中..." /></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card title="出错了">
        <p>{error}</p>
      </Card>
    );
  }

  return (
    <div className="health-page" style={{ padding: '20px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="经期管理"
            bordered={false}
            className="menstruation-card"
            style={{ 
              background: 'linear-gradient(135deg, #ffd6d6 0%, #fff1f1 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            <MenstruationTracker
              lastPeriod={healthData?.lastPeriod || null}
              cycleLength={healthData?.cycleLength || null}
              periodLength={healthData?.periodLength || null}
              menstruationSymptoms={healthData?.menstruationSymptoms || null}
              menstruationNotes={healthData?.menstruationNotes || null}
              onUpdateMenstruation={updateMenstruation}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HealthPage; 