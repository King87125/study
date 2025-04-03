import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, UserInfo } from '../types';
import { loginRequest, loginSuccess, loginFail } from '../store/authSlice';
import './AuthPages.css';

const { Title } = Typography;

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; email: string; password: string; confirmPassword: string; inviteCode: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      setSubmitting(true);
      dispatch(loginRequest());
      
      const response = await axios.post('/api/users/register', values);
      
      dispatch(loginSuccess(response.data as UserInfo));
      message.success('注册成功！');
      navigate('/');
    } catch (error: any) {
      dispatch(loginFail(error.response?.data?.message || '注册失败，请稍后再试'));
      message.error(error.response?.data?.message || '注册失败，请稍后再试');
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
            <Title level={4} style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 500 }}>用户注册</Title>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="邮箱"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="确认密码"
              />
            </Form.Item>

            <Form.Item
              name="inviteCode"
              rules={[{ required: true, message: '请输入邀请码' }]}
            >
              <Input 
                prefix={<KeyOutlined />} 
                placeholder="邀请码"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={submitting || loading}
              >
                注册
              </Button>
            </Form.Item>

            <div className="auth-footer">
              已有账号？ <Link to="/login">立即登录</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default RegisterPage; 