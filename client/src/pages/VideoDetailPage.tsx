import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Row, Col, Typography, Space, Tag, Button, Avatar, message, Skeleton, Divider, Descriptions, Empty, Card, Modal, DatePicker, Select, List, Rate, Form, Input, Spin, Result } from 'antd';
import { PlayCircleOutlined, LikeOutlined, LikeFilled, EyeOutlined, CalendarOutlined, UserOutlined, PlusOutlined, CommentOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { UserInfo } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import './VideoDetailPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Comment {
  _id: string;
  user?: {
    _id: string;
    id?: number | string;
    username: string;
    avatar: string;
  };
  comment: string;
  rating: number;
  createdAt: string;
}

interface Video {
  _id: string;
  id?: number | string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category: string;
  subject: string;
  difficulty: string;
  views: number;
  comments: Comment[];
  uploadedBy: {
    _id: string;
    id?: number | string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

// 辅助函数：格式化秒数为 mm:ss
const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  return `${formattedMinutes}:${formattedSeconds}`;
};

const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const auth = useSelector((state: RootState) => state.auth);
  const userInfo = auth.userInfo as UserInfo | null;
  
  const [commentForm] = Form.useForm();
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const [isAddToPlanModalVisible, setIsAddToPlanModalVisible] = useState(false);
  const [planForm] = Form.useForm();
  const [isPlanSubmitting, setIsPlanSubmitting] = useState(false);
  
  const fetchVideo = useCallback(async () => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: userInfo ? `Bearer ${userInfo.token}` : '',
        },
      };
      
      const { data } = await axios.get(`/api/videos/${id}`, config);
      setVideo(data as Video);
    } catch (error) {
      console.error('获取视频失败:', error);
      message.error('获取视频失败');
    } finally {
      setLoading(false);
    }
  }, [id, userInfo]);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchVideo();
    } else {
      setLoading(false);
    }
  }, [fetchVideo, id]);

  const handleComment = async (values: { comment: string; rating: number }) => {
    if (!userInfo) {
      message.warning('请先登录');
      return;
    }
    
    if (!id || id === 'undefined') {
      message.error('无效的视频ID');
      return;
    }
    
    if (!video) {
      message.error('视频数据不存在');
      return;
    }
    
    setIsCommentLoading(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.post(`/api/videos/${id}/comment`, { 
        comment: values.comment,
        rating: values.rating
      }, config);
      
      setVideo({ 
        ...video, 
        comments: [...(video.comments || []), data as Comment] 
      });
      
      commentForm.resetFields();
      message.success('评论添加成功');
    } catch (error: any) {
      console.error('评论失败:', error);
      message.error('评论失败');
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleAddToPlan = () => {
    if (!video) return;
    if (!userInfo) {
      message.warning('请先登录后再添加到学习计划');
      navigate('/login');
      return;
    }
    planForm.setFieldsValue({
      date: dayjs(),
      priority: 2,
      notes: '',
    });
    setIsAddToPlanModalVisible(true);
  };

  const handlePlanFormSubmit = async (values: any) => {
    if (!video || !userInfo) return;

    setIsPlanSubmitting(true);
    try {
      const planData = {
        date: values.date.format('YYYY-MM-DD'),
        type: 'video',
        resourceId: video.id || video._id,
        title: video.title,
        priority: values.priority,
        notes: values.notes,
        completed: false,
        resourceUrl: `/videos/${video.id || video._id}`,
        thumbnail: video.thumbnailUrl
      };

      await axios.post('/api/study-plans', planData, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      message.success(`已将 "${video.title}" 添加到 ${values.date.format('YYYY-MM-DD')} 的学习计划`);
      setIsAddToPlanModalVisible(false);
      planForm.resetFields();
    } catch (error: any) {
      console.error('添加到学习计划失败:', error);
      message.error(error.response?.data?.message || '添加到学习计划失败');
    } finally {
      setIsPlanSubmitting(false);
    }
  };

  const formatViews = (views: number) => {
    if (views < 1000) return views;
    if (views < 10000) return (views / 1000).toFixed(1) + '千';
    return (views / 10000).toFixed(1) + '万';
  };
  
  const getVideoUrl = () => {
    if (!video || !video.videoUrl) return '';
    
    if (video.videoUrl.startsWith('http')) {
      return video.videoUrl;
    }
    
    const videoUrl = video.videoUrl.startsWith('/') 
      ? video.videoUrl
      : `/${video.videoUrl}`;
      
    return `http://localhost:5001${videoUrl}`;
  };

  const renderVideoInfo = () => {
    if (!video) return null;
    
    const descriptionItems = [
      { key: '1', label: '上传者', children: video.uploadedBy ? (
        <Link to={`/profile/${video.uploadedBy._id}`}>
          <Space>
            <Avatar src={video.uploadedBy.avatar || '/uploads/avatars/default.jpg'} icon={<UserOutlined />} size="small" />
            {video.uploadedBy.username}
          </Space>
        </Link>
      ) : '未知' },
      { key: '2', label: '分类', children: video.category },
      { key: '3', label: '学科', children: video.subject },
      { key: '4', label: '难度', children: <Tag>{video.difficulty || '中等'}</Tag> },
      { key: '5', label: '上传时间', children: dayjs(video.createdAt).format('YYYY-MM-DD HH:mm') },
      { key: '6', label: '观看次数', children: `${video.views || 0} 次` },
      { key: '7', label: '时长', children: formatDuration(video.duration) },
    ];
    
    return (
      <Card bordered={false} className="video-info-card">
        <Title level={3} style={{ marginBottom: 16 }}>{video.title}</Title>
        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} items={descriptionItems} size="small"/>
        <Divider />
        <Paragraph type="secondary">{video.description}</Paragraph>
        {userInfo && (
          <Button 
            icon={<PlusOutlined />} 
            onClick={() => setIsAddToPlanModalVisible(true)} 
            style={{ marginTop: 16 }}
          >
            添加到学习计划
          </Button>
        )}
      </Card>
    );
  };

  if (!id || id === 'undefined') {
    return (
      <div className="page-container">
        <Card>
          <Empty
            description="无效的视频ID"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate('/videos')}>
              返回视频列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (loading && !video) {
    return (
      <div className="page-container">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }
  
  if (!video) {
    return (
      <div className="page-container">
        <Empty description={!id || id === 'undefined' ? "无效的视频ID" : "视频不存在或加载失败"} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/videos')}>
            返回视频列表
          </Button>
        </div>
      </div>
    );
  }
  
  const formattedDate = video.createdAt ? new Date(video.createdAt).toLocaleDateString() : '未知';
  const videoFileUrl = getVideoUrl();

  return (
    <div className="page-container video-detail-page">
      <Spin spinning={loading} tip="加载中...">
        {video ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card className="video-player-card" bodyStyle={{ padding: 0 }}>
                <div className="video-aspect-ratio-wrapper">
                  {videoFileUrl ? (
                    <video
                      controls
                      src={videoFileUrl}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <Empty description="无法加载视频" />
                  )}
                </div>
              </Card>

              <Card title="评论区" className="comment-section">
                {userInfo ? (
                  <Form form={commentForm} onFinish={handleComment} layout="vertical" style={{ marginBottom: '24px' }}>
                    <Form.Item name="rating" label="评分" rules={[{ required: true, message: '请给出评分' }]}>
                      <Rate allowHalf />
                    </Form.Item>
                    <Form.Item name="comment" label="评论内容" rules={[{ required: true, message: '请输入评论内容' }]}>
                      <TextArea rows={3} placeholder="分享你的看法..." />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={isCommentLoading}>
                        提交评论
                      </Button>
                    </Form.Item>
                  </Form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', background: '#fafafa', borderRadius: '8px', marginBottom:'24px' }}>
                    <Text type="secondary">登录后可以发表评论</Text>
                    <Button type="link" onClick={() => navigate('/login')}>立即登录</Button>
                  </div>
                )}
                
                <List
                  itemLayout="horizontal"
                  dataSource={video.comments?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []}
                  renderItem={(comment) => (
                    <List.Item key={comment._id}>
                      <List.Item.Meta
                        avatar={<Avatar src={comment.user?.avatar?.startsWith('http') ? comment.user.avatar : (comment.user?.avatar ? `http://localhost:5001${comment.user.avatar}` : undefined)} icon={<UserOutlined />} />}
                        title={
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong>{comment.user?.username || '匿名用户'}</Text>
                            <Rate disabled defaultValue={comment.rating} style={{ fontSize: 14 }} />
                          </Space>}
                        description={
                          <>
                            <Paragraph style={{ margin: '8px 0' }}>{comment.comment}</Paragraph>
                            <Text type="secondary" style={{ fontSize: 12 }}>{new Date(comment.createdAt).toLocaleString()}</Text>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: <Empty description="暂无评论" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              {renderVideoInfo()}
            </Col>
          </Row>
        ) : (
          !loading && <Result status="404" title="404" subTitle="抱歉，未找到该视频。" extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>} />
        )}
      </Spin>

      <Modal
        title={`将 "${video.title}" 添加到学习计划`}
        open={isAddToPlanModalVisible}
        onCancel={() => setIsAddToPlanModalVisible(false)}
        footer={null}
      >
        <Form
          form={planForm}
          layout="vertical"
          onFinish={handlePlanFormSubmit}
        >
          <Form.Item
            name="date"
            label="计划日期"
            rules={[{ required: true, message: '请选择计划日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="选择优先级">
              <Option value={1}>低</Option>
              <Option value={2}>中</Option>
              <Option value={3}>高</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注 (可选)"
          >
            <TextArea rows={3} placeholder="例如：看完第一遍，做笔记" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isPlanSubmitting}
              style={{ marginRight: 8 }}
            >
              确认添加
            </Button>
            <Button onClick={() => setIsAddToPlanModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VideoDetailPage; 