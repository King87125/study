import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Avatar, Upload, message } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '../types';
import { updateProfile } from '../store/authSlice';
import { UserInfo } from '../types';

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const userInfo = auth.userInfo as UserInfo | null;
  
  // 检查是否登录
  useEffect(() => {
    if (!userInfo) {
      message.error('请先登录');
      navigate('/login');
    } else {
      // 设置初始表单值
      form.setFieldsValue({
        username: userInfo.username,
        email: userInfo.email,
      });
      
      setAvatarUrl(userInfo.avatar);
    }
  }, [userInfo, form, navigate]);
  
  const handleAvatarChange = (info: any) => {
    if (info.file) {
      setAvatarFile(info.file);
      
      // 预览图片
      const reader = new FileReader();
      reader.readAsDataURL(info.file);
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
    }
  };
  
  const onFinish = async (values: any) => {
    setLoading(true);
    
    try {
      let avatar = userInfo?.avatar;
      
      // 先上传头像（如果有）
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };
        
        const { data } = await axios.post('/api/users/avatar', formData, config);
        avatar = (data as any).fileUrl;
      }
      
      // 更新用户资料
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      
      const updateData: any = {
        username: values.username,
        email: values.email,
        avatar,
      };
      
      if (values.password) {
        updateData.password = values.password;
      }
      
      const { data } = await axios.put('/api/users/profile', updateData, config);
      
      // 更新Redux状态
      dispatch(updateProfile(data as UserInfo));
      
      message.success('资料更新成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };
  
  if (!userInfo) {
    return null;
  }
  
  return (
    <div className="page-container">
      <Card className="form-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar 
            size={100} 
            src={avatarUrl} 
            icon={<UserOutlined />} 
            style={{ marginBottom: 16 }}
          />
          <h2>个人资料</h2>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="avatar"
            label="头像"
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarChange}
            >
              <Button icon={<UploadOutlined />}>更换头像</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { min: 6, message: '密码至少需要6个字符' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="输入新密码（留空表示不修改）" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['password']}
            rules={[
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
            <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ marginTop: 16 }}
            >
              更新资料
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage; 