import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Typography, Input, Select, Button, Space, List, Tag, Avatar, Skeleton, Empty, Spin } from 'antd';
import { FileOutlined, SearchOutlined, UserOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Material {
  _id: string;
  id?: number | string;
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl: string;
  category: string;
  subject: string;
  fileType: string;
  fileSize: number;
  downloads: number;
  uploadedBy: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

const MaterialListPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [sort, setSort] = useState('newest');

  const { userInfo } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchMaterials();
  }, [category, subject, sort]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let url = '/api/materials';
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (subject) params.append('subject', subject);
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
      setMaterials((data as any).materials || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchMaterials();
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getFileColor = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '#ff4d4f';
      case 'doc':
      case 'docx':
        return '#1890ff';
      case 'ppt':
      case 'pptx':
        return '#faad14';
      case 'txt':
        return '#52c41a';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '#13c2c2';
      default:
        return '#8c8c8c';
    }
  };

  return (
    <div className="page-container">
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Title level={2}>学习资料</Title>
          <Text type="secondary">浏览和下载高质量的考研学习资料</Text>
        </Col>
        
        <Col xs={24}>
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Search
                  placeholder="搜索资料"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<SearchOutlined />}
                />
              </Col>
              
              <Col xs={24} md={16}>
                <Space wrap>
                  <Select
                    placeholder="资料分类"
                    style={{ width: 120 }}
                    value={category || undefined}
                    onChange={setCategory}
                    allowClear
                  >
                    <Option value="课件">课件</Option>
                    <Option value="习题">习题</Option>
                    <Option value="真题">真题</Option>
                    <Option value="笔记">笔记</Option>
                    <Option value="参考书">参考书</Option>
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
                    placeholder="排序方式"
                    style={{ width: 120 }}
                    value={sort}
                    onChange={setSort}
                  >
                    <Option value="newest">最新上传</Option>
                    <Option value="popular">最多下载</Option>
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
            dataSource={materials}
            loading={loading}
            locale={{
              emptyText: (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description={<span>暂无学习资料，<Link to="/upload-material">去上传?</Link></span>}
                />
              )
            }}
            renderItem={(item) => (
              <List.Item>
                <Link to={`/materials/${item._id || item.id}`}>
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
                          </Space>
                        </Col>
                        <Col>
                          <Space size="small">
                            <DownloadOutlined />
                            <Text>{item.downloads || 0}</Text>
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
                        <Col style={{ marginLeft: 'auto' }}>
                          <Text type="secondary">{formatFileSize(item.fileSize)}</Text>
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
            <Link to="/upload-material">
              <Button type="primary" size="large">
                上传新资料
              </Button>
            </Link>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default MaterialListPage; 