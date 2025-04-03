import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { GithubOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'; // 示例图标
import { Link as RouterLink } from 'react-router-dom'; // 导入 React Router 的 Link
import './Footer.css';

const { Footer: AntFooter } = Layout;
const { Link, Text, Paragraph, Title } = Typography;

const Footer: React.FC = () => {
  return (
    <AntFooter className="footer-pro">
      <Row justify="center" gutter={[16, 32]} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Col xs={24} sm={12} md={8}>
          <Title level={4}>关于考研伴侣</Title>
          <Paragraph type="secondary">
            我们致力于为考研学子提供一站式的学习管理和资源分享平台，助力大家高效备考，成功上岸。
          </Paragraph>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Title level={4}>快速链接</Title>
          <Space direction="vertical">
            <RouterLink to="/about">关于我们</RouterLink> 
            <RouterLink to="/terms">服务条款</RouterLink> 
            <RouterLink to="/privacy">隐私政策</RouterLink> 
            <RouterLink to="/help">帮助中心</RouterLink> 
          </Space>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Title level={4}>联系我们</Title>
          <Space direction="vertical">
            <Space>
              <MailOutlined />
              <Link href="mailto:support@example.com">support@example.com</Link>
            </Space>
            <Space>
              <PhoneOutlined />
              <Text type="secondary">+86 123 4567 8900</Text> 
            </Space>
            <Space>
              <GithubOutlined />
              <Link href="https://github.com/King87125/study" target="_blank">GitHub 仓库</Link>
            </Space>
          </Space>
        </Col>
        <Col span={24} style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid #e8e8e8', paddingTop: '24px' }}>
          <Text type="secondary">考研伴侣 &copy; {new Date().getFullYear()} - 保留所有权利.</Text>
          {/* <br /> */} 
          {/* <Link href="http://beian.miit.gov.cn" target="_blank" type="secondary">京ICP备xxxxxxx号-1</Link> */}
        </Col>
      </Row>
    </AntFooter>
  );
};

export default Footer; 