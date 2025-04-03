import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, Upload, message, Card, Typography } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const UploadMaterialPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  
  const navigate = useNavigate();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  
  // 检查是否登录
  if (!userInfo) {
    message.error('请先登录');
    navigate('/login');
    return null;
  }
  
  const handleMaterialUpload = ({ file }: any) => {
    setMaterialFile(file);
  };
  
  const onFinish = async (values: any) => {
    if (!materialFile) {
      message.error('请上传资料文件');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', materialFile);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('subject', values.subject);
      
      console.log('提交的资料数据:', {
        title: values.title,
        description: values.description,
        category: values.category,
        subject: values.subject,
        materialFile: materialFile.name,
      });
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.post('/api/materials', formData, config);
      
      console.log('上传成功，返回数据:', data);
      
      // 添加对返回的ID进行验证
      type MaterialResponse = {
        id?: number | string;
        _id?: string;
      };
      
      const responseData = data as MaterialResponse;
      
      if (responseData && responseData.id) {
        message.success('资料上传成功');
        navigate(`/materials/${responseData.id}`);
      } else if (responseData && responseData._id) {
        message.success('资料上传成功');
        navigate(`/materials/${responseData._id}`);
      } else {
        // 如果没有ID，返回到资料列表页面
        message.success('资料上传成功，但无法获取资料ID');
        console.error('上传成功但返回数据中没有ID:', responseData);
        navigate('/materials');
      }
    } catch (error: any) {
      console.error('上传错误:', error);
      message.error(error.response?.data?.message || '资料上传失败');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page-container">
      <Card className="form-card">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          上传学习资料
        </Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            category: '课件',
            subject: '数学',
          }}
        >
          <Form.Item
            name="title"
            label="资料标题"
            rules={[{ required: true, message: '请输入资料标题' }]}
          >
            <Input placeholder="输入资料标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="资料描述"
            rules={[{ required: true, message: '请输入资料描述' }]}
          >
            <TextArea rows={4} placeholder="输入资料描述" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="资料分类"
            rules={[{ required: true, message: '请选择资料分类' }]}
          >
            <Select placeholder="选择资料分类">
              <Option value="课件">课件</Option>
              <Option value="习题">习题</Option>
              <Option value="真题">真题</Option>
              <Option value="笔记">笔记</Option>
              <Option value="参考书">参考书</Option>
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
            name="file"
            label="上传资料文件"
            rules={[{ required: true, message: '请上传资料文件' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
          >
            <Upload
              customRequest={handleMaterialUpload}
              maxCount={1}
              beforeUpload={(file) => {
                const supportedTypes = [
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/vnd.ms-powerpoint',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'text/plain'
                ];
                const isSupported = supportedTypes.includes(file.type);
                if (!isSupported) {
                  message.error('只支持上传 PDF, Word, Excel, PowerPoint, 文本等文档格式!');
                }
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>选择资料文件</Button>
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
              上传资料
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UploadMaterialPage; 