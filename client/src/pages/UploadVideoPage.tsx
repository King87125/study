import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, Upload, message, Card, Typography, InputNumber } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const UploadVideoPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  
  // 检查是否登录
  if (!userInfo) {
    message.error('请先登录');
    navigate('/login');
    return null;
  }
  
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  
  const handleVideoUpload = ({ file }: any) => {
    console.log('开始上传视频文件:', file.name, file.type, file.size);
    setVideoFile(file);
    return false; // 防止默认上传行为
  };
  
  const handleThumbnailUpload = ({ file }: any) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setThumbnailFile(reader.result as string);
    };
  };
  
  const onFinish = async (values: any) => {
    if (!videoFile) {
      message.error('请上传视频文件');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('subject', values.subject);
      formData.append('difficulty', values.difficulty);
      formData.append('duration', values.duration?.toString() || '0');
      
      if (thumbnailFile) {
        formData.append('thumbnailUrl', thumbnailFile);
      }
      
      console.log('提交的视频数据:', {
        title: values.title,
        description: values.description,
        category: values.category,
        subject: values.subject,
        videoFile: videoFile.name,
        videoType: videoFile.type,
        videoSize: videoFile.size
      });
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.post('/api/videos', formData, config);
      
      message.success('视频上传成功');
      navigate(`/videos/${(data as any)._id}`);
    } catch (error: any) {
      console.error('视频上传错误:', error);
      
      if (error.response) {
        // 服务器响应错误
        console.error('服务器响应:', error.response.status, error.response.data);
        message.error(error.response.data?.message || '视频上传失败: 服务器错误');
      } else if (error.request) {
        // 请求发送了但没有收到响应
        console.error('没有收到响应:', error.request);
        message.error('视频上传失败: 服务器无响应');
      } else {
        // 请求设置时发生错误
        console.error('请求错误:', error.message);
        message.error(`视频上传失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page-container">
      <Card className="form-card">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          上传视频
        </Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            category: '专业课',
            subject: '数学',
            difficulty: '中等',
          }}
        >
          <Form.Item
            name="title"
            label="视频标题"
            rules={[{ required: true, message: '请输入视频标题' }]}
          >
            <Input placeholder="输入视频标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="视频描述"
            rules={[{ required: true, message: '请输入视频描述' }]}
          >
            <TextArea rows={4} placeholder="输入视频描述" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="视频分类"
            rules={[{ required: true, message: '请选择视频分类' }]}
          >
            <Select placeholder="选择视频分类">
              <Option value="专业课">专业课</Option>
              <Option value="公共课">公共课</Option>
              <Option value="考研经验">考研经验</Option>
              <Option value="院校解析">院校解析</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="subject"
            label="科目"
            rules={[{ required: true, message: '请选择科目' }]}
          >
            <Select placeholder="选择科目">
              <Option value="数学">数学</Option>
              <Option value="英语">英语</Option>
              <Option value="政治">政治</Option>
              <Option value="专业课">专业课</Option>
              <Option value="综合">综合</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="difficulty"
            label="难度级别"
            rules={[{ required: true, message: '请选择难度级别' }]}
          >
            <Select placeholder="选择难度级别">
              <Option value="入门">入门</Option>
              <Option value="简单">简单</Option>
              <Option value="中等">中等</Option>
              <Option value="困难">困难</Option>
              <Option value="挑战">挑战</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="duration"
            label="视频时长(分钟)"
          >
            <InputNumber min={1} placeholder="视频时长" />
          </Form.Item>
          
          <Form.Item
            name="video"
            label="上传视频"
            rules={[{ required: true, message: '请上传视频文件' }]}
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              customRequest={handleVideoUpload}
              maxCount={1}
              beforeUpload={(file) => {
                // 检查文件类型
                const isVideo = file.type.indexOf('video/') === 0 || 
                                /\.(mp4|mov|avi|wmv|flv|mkv|webm|m4v)$/i.test(file.name);
                if (!isVideo) {
                  message.error('请上传视频格式文件');
                  return Upload.LIST_IGNORE;
                }
                
                // 检查文件大小
                const isLt500M = file.size / 1024 / 1024 < 500;
                if (!isLt500M) {
                  message.error('视频大小不能超过 500MB!');
                  return Upload.LIST_IGNORE;
                }
                
                console.log('通过验证的视频文件:', file.name, file.type);
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>选择视频文件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="thumbnail"
            label="上传缩略图(可选)"
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Upload
              listType="picture-card"
              customRequest={handleThumbnailUpload}
              accept="image/*"
              maxCount={1}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('只能上传图片文件!');
                }
                return isImage || Upload.LIST_IGNORE;
              }}
            >
              <div>
                <InboxOutlined />
                <div style={{ marginTop: 8 }}>上传缩略图</div>
              </div>
            </Upload>
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
              上传视频
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UploadVideoPage; 