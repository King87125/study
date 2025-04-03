import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tabs, Button, Space, Modal, message } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { confirm } = Modal;

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface StudyPlan {
  id: number;
  title: string;
  description: string;
  status: string;
  user_id: number;
  username: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 获取所有用户
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data as User[]);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有学习计划
  const fetchStudyPlans = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/study-plans/all');
      setStudyPlans(response.data as StudyPlan[]);
    } catch (error) {
      console.error('获取学习计划列表失败:', error);
      message.error('获取学习计划列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除学习计划
  const handleDeleteStudyPlan = (id: number) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个学习计划吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await axios.delete(`/api/admin/study-plans/${id}`);
          message.success('学习计划删除成功');
          fetchStudyPlans(); // 重新加载数据
        } catch (error) {
          console.error('删除学习计划失败:', error);
          message.error('删除学习计划失败');
        }
      },
    });
  };

  // 初始加载数据
  useEffect(() => {
    fetchUsers();
    fetchStudyPlans();
  }, []);

  // 用户表格列定义
  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '管理员',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (isAdmin: boolean) => (isAdmin ? '是' : '否'),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  // 学习计划表格列定义
  const studyPlanColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StudyPlan) => (
        <Space size="middle">
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteStudyPlan(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card style={{ width: '100%', marginBottom: 20 }}>
        <Title level={2}>管理控制台</Title>
        <Tabs 
          defaultActiveKey="1"
          items={[
            {
              label: '用户管理',
              key: '1',
              children: (
                <Table 
                  columns={userColumns} 
                  dataSource={users} 
                  rowKey="id" 
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              label: '学习计划管理',
              key: '2',
              children: (
                <Table 
                  columns={studyPlanColumns} 
                  dataSource={studyPlans} 
                  rowKey="id" 
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default AdminPage; 