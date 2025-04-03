import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const AboutPage: React.FC = () => {
  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Card>
        <Title level={2}>关于我们</Title>
        <Paragraph>
          欢迎来到"考研伴侣"！这个网站是为了帮助黄丽萍小宝宝高效备考、顺利上岸而创建的。
        </Paragraph>
        <Paragraph>
          我们致力于提供学习计划管理、资源分享、进度跟踪、健康提醒等。希望能成为你考研路上的得力助手。
        </Paragraph>
        <Paragraph>
          网站目前由jinzihao_2020@qq.com维护。如果你有任何建议或发现问题，欢迎随时联系我。
        </Paragraph>
        <Paragraph>
          祝你学习顺利，金榜题名！
        </Paragraph>
      </Card>
    </div>
  );
};

export default AboutPage; 