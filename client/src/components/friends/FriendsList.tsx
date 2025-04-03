import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Button, Typography, Tabs, Badge, Input, message, Space, Modal, Card } from 'antd';
import { UserOutlined, TeamOutlined, SearchOutlined, CheckOutlined, CloseOutlined, UserAddOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '../../types';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

interface Friend {
  id: number;
  username: string;
  status: string;
  since: string;
}

interface FriendRequest {
  id: number;
  requesterId: number;
  requesterName: string;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const { token } = useSelector((state: RootState) => state.auth);

  // 获取好友列表
  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data as Friend[]);
    } catch (error) {
      console.error('获取好友列表失败:', error);
      message.error('获取好友列表失败');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 获取好友请求
  const fetchFriendRequests = useCallback(async () => {
    try {
      console.log('开始获取好友请求，使用的token:', token);
      
      if (!token) {
        console.log('没有token，无法获取好友请求');
        return;
      }
      
      const response = await axios.get('/api/friend-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('好友请求响应状态:', response.status);
      console.log('好友请求响应数据:', response.data);
      
      if (Array.isArray(response.data)) {
        setRequests(response.data as FriendRequest[]);
      } else {
        console.error('好友请求数据格式不正确:', response.data);
        setRequests([]);
      }
    } catch (error: any) {
      console.error('获取好友请求失败:', error);
      console.error('错误详情:', error.response ? error.response.data : '无响应数据');
      message.error(error.response?.data?.message || '获取好友请求失败');
      setRequests([]);
    }
  }, [token]);

  // 接受好友请求
  const acceptFriendRequest = async (requestId: number) => {
    try {
      await axios.put(`/api/friend-requests/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('已接受好友请求');
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      console.error('接受好友请求失败:', error);
      message.error('接受好友请求失败');
    }
  };

  // 拒绝好友请求
  const rejectFriendRequest = async (requestId: number) => {
    try {
      await axios.put(`/api/friend-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('已拒绝好友请求');
      fetchFriendRequests();
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      message.error('拒绝好友请求失败');
    }
  };

  // 删除好友
  const removeFriend = async (friendId: number) => {
    try {
      await axios.delete(`/api/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('已删除好友');
      fetchFriends();
    } catch (error) {
      console.error('删除好友失败:', error);
      message.error('删除好友失败');
    }
  };

  // 搜索用户
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      console.log('开始搜索用户:', query);
      
      const response = await axios.get(`/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('搜索用户响应:', response.data);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('搜索用户失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('搜索用户失败');
      }
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 发送好友请求
  const sendFriendRequest = async (recipientId: number) => {
    try {
      console.log('发送好友请求给用户:', recipientId);
      console.log('recipientId类型:', typeof recipientId);
      
      // 确保recipientId是数字
      const numericRecipientId = Number(recipientId);
      console.log('转换后的recipientId:', numericRecipientId);
      
      if (isNaN(numericRecipientId)) {
        message.error('无效的用户ID');
        return;
      }
      
      const response = await axios.post('/api/friend-requests', { recipientId: numericRecipientId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('好友请求响应:', response.data);
      message.success('好友请求已发送');
      setIsSearchModalVisible(false);
    } catch (error: any) {
      console.error('发送好友请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('发送好友请求失败');
      }
    }
  };

  useEffect(() => {
    console.log('FriendsList组件加载，当前token状态:', token ? '有token' : '无token');
    
    if (token) {
      // 不需要测试API是否可访问，直接调用需要的接口
      fetchFriends();
      fetchFriendRequests();
    } else {
      console.log('未登录或token丢失，无法获取好友数据');
    }
  }, [token, fetchFriends, fetchFriendRequests]);

  const renderFriendItem = (friend: Friend) => (
    <List.Item
      actions={[
        <Button 
          type="link" 
          href={`/study-supervision/${friend.id}`}
        >
          学习监督
        </Button>,
        <Button 
          danger 
          onClick={() => removeFriend(friend.id)}
        >
          删除
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={friend.username}
        description={`成为好友时间: ${new Date(friend.since).toLocaleDateString()}`}
      />
    </List.Item>
  );

  const renderRequestItem = (request: FriendRequest) => (
    <List.Item
      actions={[
        <Button 
          type="primary" 
          icon={<CheckOutlined />} 
          onClick={() => acceptFriendRequest(request.id)}
        >
          接受
        </Button>,
        <Button 
          danger 
          icon={<CloseOutlined />} 
          onClick={() => rejectFriendRequest(request.id)}
        >
          拒绝
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={request.requesterName}
        description={`请求时间: ${new Date(request.createdAt).toLocaleDateString()}`}
      />
    </List.Item>
  );

  const renderSearchItem = (user: User) => (
    <List.Item
      actions={[
        <Button 
          type="primary" 
          onClick={() => sendFriendRequest(user.id)}
        >
          添加好友
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={user.username}
        description={user.email}
      />
    </List.Item>
  );

  const handleSearch = async (query: string) => {
    await searchUsers(query);
  };

  return (
    <div className="friends-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={3}>
          <TeamOutlined /> 好友管理
        </Title>
        <Button 
          type="primary" 
          icon={<SearchOutlined />} 
          onClick={() => setIsSearchModalVisible(true)}
        >
          查找用户
        </Button>
      </div>

      <Card>
        <Tabs
          tabPosition="top"
          type="card"
          style={{ marginTop: '20px' }}
          items={[
            {
              key: 'all',
              label: <span><UserOutlined /> 所有好友</span>,
              children: (
                <List
                  dataSource={friends}
                  renderItem={renderFriendItem}
                  loading={loading}
                  locale={{ emptyText: "您还没有添加任何好友" }}
                />
              ),
            },
            {
              key: 'requests',
              label: (
                <span>
                  <UserAddOutlined />
                  <Badge count={requests.length} size="small" style={{ marginLeft: 4 }}>
                    好友请求
                  </Badge>
                </span>
              ),
              children: (
                <List
                  dataSource={requests}
                  renderItem={renderRequestItem}
                  loading={loading}
                  locale={{ emptyText: "没有收到好友请求" }}
                />
              ),
            },
            {
              key: 'search',
              label: <span><SearchOutlined /> 查找好友</span>,
              children: (
                <>
                  <Input.Search
                    placeholder="输入用户名查找好友"
                    enterButton
                    onSearch={handleSearch}
                    loading={searchLoading}
                  />
                  <List
                    dataSource={searchResults}
                    renderItem={renderSearchItem}
                    loading={searchLoading}
                    locale={{ emptyText: "没有找到用户" }}
                    style={{ marginTop: '16px' }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 搜索用户弹窗 */}
      <Modal
        title="查找用户"
        open={isSearchModalVisible}
        onCancel={() => {
          setIsSearchModalVisible(false);
          setSearchResults([]);
        }}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Search
            placeholder="输入用户名或邮箱搜索"
            enterButton="搜索"
            loading={searchLoading}
            onSearch={searchUsers}
          />
          
          <List
            itemLayout="horizontal"
            dataSource={searchResults}
            locale={{ emptyText: '暂无搜索结果' }}
            renderItem={user => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    onClick={() => sendFriendRequest(user.id)}
                  >
                    添加好友
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={user.username}
                  description={user.email}
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default FriendsList; 