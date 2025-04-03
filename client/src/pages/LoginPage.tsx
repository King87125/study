import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, UserInfo } from '../types';
import { loginRequest, loginSuccess, loginFail } from '../store/authSlice';
import './AuthPages.css';

const { Title } = Typography;

// 定义登录响应数据类型
interface LoginResponse {
  _id: string | number;
  id?: string | number;
  username: string;
  email: string;
  avatar: string;
  role: string;
  token: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setSubmitting(true);
      dispatch(loginRequest());
      
      const response = await axios.post<LoginResponse>('/api/users/login', values);
      console.log('登录响应数据:', response.data);
      
      // 确保ID字段格式一致
      const userData: UserInfo = {
        _id: String(response.data._id || response.data.id || ''),
        username: response.data.username,
        email: response.data.email,
        avatar: response.data.avatar,
        role: response.data.role,
        token: response.data.token
      };
      
      dispatch(loginSuccess(userData));
      
      // 设置全局axios默认token
      if (userData.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      }
      
      message.success('登录成功！');
      navigate('/');
    } catch (error: any) {
      console.error('登录失败:', error);
      console.error('错误详情:', error.response ? error.response.data : '无响应数据');
      dispatch(loginFail(error.response?.data?.message || '登录失败，请稍后再试'));
      message.error(error.response?.data?.message || '登录失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row justify="center" align="middle" className="auth-container">
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card className="auth-card" variant="borderless">
          <div className="auth-title-section">
            <span className="auth-logo">考研伴侣</span>
            <Title level={4} style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 500 }}>用户登录</Title>
          </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
            size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="邮箱" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={submitting || loading}
            >
              登录
            </Button>
          </Form.Item>

          <div className="auth-footer">
            没有账号？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
      </Col>
    </Row>
  );
};

export default LoginPage; 