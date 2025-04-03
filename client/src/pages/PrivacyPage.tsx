import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const PrivacyPage: React.FC = () => {
  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Card>
        <Title level={2}>隐私政策</Title>
        <Paragraph>
          我们非常重视您的隐私。本隐私政策旨在说明我们如何收集、使用和保护您的个人信息。
        </Paragraph>
        <Title level={4}>1. 信息收集</Title>
        <Paragraph>
          我们可能会收集您在注册和使用服务时提供的信息，例如用户名、邮箱、学习计划数据、上传的资料等。
          我们还可能收集您的设备信息和使用日志，以改进服务质量。
        </Paragraph>
        <Title level={4}>2. 信息使用</Title>
        <Paragraph>
          收集的信息将用于提供和改进网站服务、个性化用户体验、与您沟通以及保障网站安全。
          我们不会将您的个人信息出售或分享给第三方，除非获得您的明确同意或法律要求。
        </Paragraph>
        <Title level={4}>3. 信息保护</Title>
        <Paragraph>
          我们将采取合理的技术和管理措施保护您的信息安全，防止未经授权的访问、使用或泄露。
        </Paragraph>
        <Title level={4}>4. Cookie 技术</Title>
        <Paragraph>
          我们可能使用 Cookie 技术来提升用户体验，例如记住您的登录状态。
        </Paragraph>
         <Paragraph>
          （请根据实际情况补充或修改具体条款，特别是涉及的第三方服务等）
        </Paragraph>
      </Card>
    </div>
  );
};

export default PrivacyPage; 