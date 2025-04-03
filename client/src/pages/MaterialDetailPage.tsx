import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Row, Col, Typography, Space, Tag, Button, Avatar, List, Rate, 
  Form, Input, message, Empty, Tabs, Skeleton, Divider, Descriptions, Card,
  Modal, DatePicker, Select, Spin, Result
} from 'antd';
import { DownloadOutlined, FileOutlined, CalendarOutlined, UserOutlined, PlusOutlined, CommentOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import PDFViewer from '../components/materials/PDFViewer';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import './MaterialDetailPage.css';

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
  comments: Comment[];
  uploadedBy: {
    _id: string;
    id?: number | string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentForm] = Form.useForm();
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  
  const [isAddToPlanModalVisible, setIsAddToPlanModalVisible] = useState(false);
  const [planForm] = Form.useForm();
  const [isPlanSubmitting, setIsPlanSubmitting] = useState(false);
  
  const { userInfo } = useSelector((state: RootState) => state.auth);
  
  const fetchMaterial = useCallback(async () => {
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
      
      const { data } = await axios.get(`/api/materials/${id}`, config);
      setMaterial(data as Material);
    } catch (error) {
      console.error('获取资料失败:', error);
      message.error('获取资料失败');
    } finally {
      setLoading(false);
    }
  }, [id, userInfo]);
  
  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchMaterial();
    } else {
      setLoading(false);
    }
  }, [fetchMaterial, id]);
  
  const handleDownload = async () => {
    if (!id || !material || !userInfo) {
      message.error('无法下载：缺少必要信息或未登录');
      return;
    }
    
    setIsDownloadLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.post<{ downloads: number }>(`/api/materials/${id}/download`, {}, config);
      
      if (data.downloads !== undefined) {
        setMaterial(prev => prev ? { ...prev, downloads: data.downloads } : null);
      }

      const link = document.createElement('a');
      link.href = material.fileUrl;
      const fileName = material.fileUrl.substring(material.fileUrl.lastIndexOf('/') + 1) || `material_${id}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('开始下载...');
      
    } catch (error: any) { 
      console.error('下载失败:', error);
      message.error(error.response?.data?.message || '下载失败，请稍后重试');
    } finally {
      setIsDownloadLoading(false);
    }
  };
  
  const handleComment = async (values: { comment: string; rating: number }) => {
    if (!userInfo) {
      message.warning('请先登录');
      return;
    }
    
    if (!id || id === 'undefined') {
      message.error('无效的资料ID');
      return;
    }
    
    if (!material) {
      message.error('资料数据不存在');
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
      
      const { data } = await axios.post(`/api/materials/${id}/comment`, { 
        comment: values.comment,
        rating: values.rating
      }, config);
      
      setMaterial({ 
        ...material, 
        comments: [...(material.comments || []), data as Comment] 
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
    if (!material) return;
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
    if (!material || !userInfo) return;

    setIsPlanSubmitting(true);
    try {
      const planData = {
        date: values.date.format('YYYY-MM-DD'),
        type: 'material',
        resourceId: material.id || material._id,
        title: material.title,
        priority: values.priority,
        notes: values.notes,
        completed: false,
        resourceUrl: `/materials/${material.id || material._id}`,
        thumbnail: material.thumbnailUrl
      };

      await axios.post('/api/study-plans', planData, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      message.success(`已将 "${material.title}" 添加到 ${values.date.format('YYYY-MM-DD')} 的学习计划`);
      setIsAddToPlanModalVisible(false);
      planForm.resetFields();
    } catch (error: any) {
      console.error('添加到学习计划失败:', error);
      message.error(error.response?.data?.message || '添加到学习计划失败');
    } finally {
      setIsPlanSubmitting(false);
    }
  };
  
  const isPdfFile = material?.fileType?.toLowerCase().includes('pdf');
  
  console.log('文件类型:', material?.fileType, 'isPDF:', isPdfFile);
  
  const getFileUrl = () => {
    if (!material || !material.fileUrl) return '';
    
    if (material.fileUrl.startsWith('http')) {
      return material.fileUrl;
    }
    
    const fileUrl = material.fileUrl.startsWith('/') 
      ? material.fileUrl
      : `/${material.fileUrl}`;
      
    return `http://localhost:5001${fileUrl}`;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
  
  if (!id || id === 'undefined') {
    return (
      <div className="page-container">
        <Card>
          <Empty
            description="无效的资料ID"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate('/materials')}>
              返回资料列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (loading && !material) {
    return (
      <div className="page-container">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }
  
  if (!material) {
    return (
      <div className="page-container">
        <Empty description={!id || id === 'undefined' ? "无效的资料ID" : "资料不存在或加载失败"} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/materials')}>
            返回资料列表
          </Button>
        </div>
      </div>
    );
  }
  
  const formattedDate = material.createdAt ? new Date(material.createdAt).toLocaleDateString() : '未知';
  
  return (
    <div className="page-container material-detail-page">
      <Row gutter={[32, 32]} className="material-info-header">
        <Col xs={24} sm={4} md={3} style={{ textAlign: 'center' }}>
          <div className="material-thumbnail">
             {material.thumbnailUrl ? (
                <img 
                  src={material.thumbnailUrl.startsWith('http') ? material.thumbnailUrl : `http://localhost:5001${material.thumbnailUrl}`} 
                  alt={material.title}
                />
              ) : (
                <FileOutlined />
              )}
          </div>
        </Col>
        <Col xs={24} sm={20} md={21}>
          <Title level={2} style={{ marginBottom: '8px' }}>{material.title}</Title>
          <Paragraph type="secondary" ellipsis={{ rows: 2, expandable: true }} style={{ marginBottom: '16px' }}>
            {material.description}
          </Paragraph>
          <Space wrap>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
              loading={isDownloadLoading}
              disabled={!userInfo}
            >
              {userInfo ? '下载资料' : '请先登录'}
            </Button>
            {isPdfFile && (
              <Button icon={<EyeOutlined />} onClick={() => document.getElementById('pdf-preview')?.scrollIntoView({ behavior: 'smooth' })}> 
                 在线预览
              </Button>
            )}
             <Button 
              icon={<PlusOutlined />} 
              onClick={handleAddToPlan}
              disabled={!userInfo}
            >
              添加到学习计划
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
        <Descriptions.Item label="上传者">
           <Space>
              <Avatar size="small" src={material.uploadedBy.avatar?.startsWith('http') ? material.uploadedBy.avatar : (material.uploadedBy.avatar ? `http://localhost:5001${material.uploadedBy.avatar}`: undefined)} icon={<UserOutlined />} />
              <Text>{material.uploadedBy.username}</Text>
           </Space>
        </Descriptions.Item>
        <Descriptions.Item label="上传日期">{formattedDate}</Descriptions.Item>
        <Descriptions.Item label="下载次数">{material.downloads} 次</Descriptions.Item>
        <Descriptions.Item label="文件类型">{material.fileType.toUpperCase()}</Descriptions.Item>
        <Descriptions.Item label="分类">{material.category}</Descriptions.Item>
        <Descriptions.Item label="科目">{material.subject}</Descriptions.Item>
      </Descriptions>

      {isPdfFile && (
        <div id="pdf-preview" style={{ marginTop: '32px' }}>
          <Title level={4}>在线预览</Title>
          <div style={{ height: '80vh', border: '1px solid #f0f0f0', borderRadius: '8px', overflow:'hidden' }}>
             <PDFViewer 
                fileUrl={getFileUrl()} 
                materialId={material.id || material._id}
              />
          </div>
        </div>
      )}

      <Divider />

      <div className="comment-section">
        <Title level={4} style={{ marginBottom: '24px' }}>
          <CommentOutlined style={{ marginRight: '8px' }}/> 用户评论 ({material.comments?.length || 0})
        </Title>
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
          dataSource={material.comments?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []}
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
      </div>

      <Modal
        title={`将 "${material.title}" 添加到学习计划`}
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
            <TextArea rows={3} placeholder="例如：重点看前三章" />
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

export default MaterialDetailPage; 