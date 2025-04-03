import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Typography, Input, Select, Button, Space, List, Tag, Avatar, Empty, Spin } from 'antd';
import { PlayCircleOutlined, SearchOutlined, UserOutlined, EyeOutlined, VideoCameraOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Video {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  subject: string;
  difficulty: string;
  views: number;
  uploadedBy: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

const VideoListPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('newest');

  const { userInfo } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchVideos();
  }, [category, subject, difficulty, sort]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let url = '/api/videos';
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (subject) params.append('subject', subject);
      if (difficulty) params.append('difficulty', difficulty);
      if (sort) params.append('sort', sort);
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: userInfo ? `Bearer ${userInfo.token}` : '',
        },
      };
      
      const { data } = await axios.get(url, config);
      setVideos((data as any).videos || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchVideos();
  };

  return (
    <div className="page-container">
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Title level={2}>视频课程</Title>
          <Text type="secondary">浏览和观看高质量的考研视频课程</Text>
        </Col>
        
        <Col xs={24}>
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Search
                  placeholder="搜索视频"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<SearchOutlined />}
                />
              </Col>
              
              <Col xs={24} md={16}>
                <Space wrap>
                  <Select
                    placeholder="视频分类"
                    style={{ width: 120 }}
                    value={category || undefined}
                    onChange={setCategory}
                    allowClear
                  >
                    <Option value="专业课">专业课</Option>
                    <Option value="公共课">公共课</Option>
                    <Option value="考研经验">考研经验</Option>
                    <Option value="院校解析">院校解析</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                  
                  <Select
                    placeholder="科目"
                    style={{ width: 120 }}
                    value={subject || undefined}
                    onChange={setSubject}
                    allowClear
                  >
                    <Option value="数学">数学</Option>
                    <Option value="英语">英语</Option>
                    <Option value="政治">政治</Option>
                    <Option value="专业课">专业课</Option>
                    <Option value="综合">综合</Option>
                  </Select>
                  
                  <Select
                    placeholder="难度级别"
                    style={{ width: 120 }}
                    value={difficulty || undefined}
                    onChange={setDifficulty}
                    allowClear
                  >
                    <Option value="入门">入门</Option>
                    <Option value="简单">简单</Option>
                    <Option value="中等">中等</Option>
                    <Option value="困难">困难</Option>
                    <Option value="挑战">挑战</Option>
                  </Select>
                  
                  <Select
                    placeholder="排序方式"
                    style={{ width: 120 }}
                    value={sort}
                    onChange={setSort}
                  >
                    <Option value="newest">最新上传</Option>
                    <Option value="popular">最多观看</Option>
                  </Select>
                  
                  <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                    筛选
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24}>
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 4,
            }}
            dataSource={videos}
            loading={loading}
            locale={{
              emptyText: (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description={<span>暂无视频资源，<Link to="/upload-video">去上传?</Link></span>}
                />
              )
            }}
            renderItem={(item) => (
              <List.Item>
                <Link to={`/videos/${item._id}`}>
                  <Card
                    className="custom-card"
                    hoverable
                  >
                    <Card.Meta
                      title={item.title}
                      description={
                        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                          {item.description}
                        </Paragraph>
                      }
                    />
                    <div className="card-meta-footer">
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space size={4} wrap className="card-tags">
                            {item.category && <Tag>{item.category}</Tag>}
                            {item.subject && <Tag color="blue">{item.subject}</Tag>}
                            {item.difficulty && <Tag color="green">{item.difficulty}</Tag>}
                          </Space>
                        </Col>
                        <Col>
                          <Space size="small">
                            <EyeOutlined />
                            <Text>{item.views || 0}</Text>
                          </Space>
                        </Col>
                      </Row>
                      <Row justify="start" align="middle" style={{ marginTop: '8px' }}>
                        <Col>
                          <Space size="small">
                            <Avatar
                              size="small"
                              src={item.uploadedBy?.avatar?.startsWith('http') ? item.uploadedBy.avatar : (item.uploadedBy?.avatar ? `http://localhost:5001${item.uploadedBy.avatar}` : undefined)}
                              icon={<UserOutlined />}
                            />
                            <Text type="secondary">{item.uploadedBy?.username || '匿名'}</Text>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Link>
              </List.Item>
            )}
          />
        </Col>
        
        {userInfo && (
          <Col xs={24} style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/upload-video">
              <Button type="primary" size="large">
                上传新视频
              </Button>
            </Link>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default VideoListPage; 