import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Button, Dropdown, Space } from 'antd';
import { 
  UserOutlined, 
  VideoCameraOutlined, 
  BookOutlined, 
  MessageOutlined, 
  DownOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  UploadOutlined, 
  ScheduleOutlined, 
  TeamOutlined, 
  HeartOutlined,
  CalendarOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { RootState } from '../../types';
import axios from 'axios';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // 检查是否为管理员
  useEffect(() => {
    const checkAdmin = async () => {
      if (userInfo?.token) {
        try {
          const response = await axios.get('/api/users/check-admin');
          const data = response.data as { isAdmin: boolean };
          setIsAdmin(data.isAdmin);
        } catch (error) {
          console.error('检查管理员权限失败:', error);
          setIsAdmin(false);
        }
      }
    };

    checkAdmin();
  }, [userInfo]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // 用户下拉菜单项
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'upload-video',
      label: '上传视频',
      icon: <UploadOutlined />,
      onClick: () => navigate('/upload-video'),
    },
    {
      key: 'upload-material',
      label: '上传资料',
      icon: <UploadOutlined />,
      onClick: () => navigate('/upload-material'),
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    ...(isAdmin ? [
      {
        key: 'admin',
        label: '管理控制台',
        icon: <DashboardOutlined />,
        onClick: () => navigate('/admin'),
      }
    ] : []),
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // 定义主菜单项 - 恢复每日学习，移除 study-planner
  const mainMenuItems = [
    {
      key: 'videos',
      icon: <VideoCameraOutlined />,
      label: '视频课程',
      onClick: () => navigate('/videos'),
    },
    {
      key: 'materials',
      icon: <BookOutlined />,
      label: '图书资料',
      onClick: () => navigate('/materials'),
    },
    {
      key: 'daily-study-plan',
      icon: <CalendarOutlined />,
      label: '每日学习',
      onClick: () => navigate('/daily-study-plan'),
    },
    {
      key: 'friends',
      icon: <TeamOutlined />,
      label: '互助学友',
      onClick: () => navigate('/friends'),
    },
    {
      key: 'health',
      icon: <HeartOutlined />,
      label: '健康管理',
      onClick: () => navigate('/health'),
    },
  ];

  return (
    <AntHeader className="header light-theme">
      <div className="logo">
        <span onClick={() => navigate('/')} style={{ color: '#1677ff', cursor: 'pointer', fontSize: '22px', fontWeight: '600' }}>考研伴侣</span>
      </div>
      <Menu 
        mode="horizontal" 
        className="main-menu" 
        items={mainMenuItems} 
        selectedKeys={[]}
      />
      <div className="user-actions">
        {userInfo ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-info">
              <Space>
                <Avatar src={userInfo.avatar || undefined} icon={<UserOutlined />} />
                <span className="username">{userInfo.username}</span>
                <DownOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }}/>
              </Space>
            </div>
          </Dropdown>
        ) : (
          <div className="auth-buttons">
            <Button type="primary" onClick={() => handleNavigate('/login')}>
              登录
            </Button>
            <Button onClick={() => handleNavigate('/register')}>
              注册
            </Button>
          </div>
        )}
      </div>
    </AntHeader>
  );
};

export default Header; 