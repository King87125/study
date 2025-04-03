import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const TermsPage: React.FC = () => {
  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Card>
        <Title level={2}>服务条款</Title>
        <Paragraph>
          欢迎使用"考研伴侣"。在使用本网站前，请仔细阅读以下条款。
        </Paragraph>
        <Title level={4}>1. 服务内容</Title>
        <Paragraph>
          本网站提供学习计划管理、资源分享等功能，旨在帮助用户备考研究生入学考试。
        </Paragraph>
        <Title level={4}>2. 用户行为</Title>
        <Paragraph>
          用户在使用本网站时，应遵守相关法律法规，不得上传或分享任何违法、侵权或不当内容。
          用户应对自己上传的内容负责。
        </Paragraph>
        <Title level={4}>3. 免责声明</Title>
        <Paragraph>
          本网站提供的学习资源仅供参考，不保证其准确性、完整性或及时性。用户应自行判断并承担使用风险。
          网站可能因维护或不可抗力暂停服务，对此不承担责任。
        </Paragraph>
        <Title level={4}>4. 条款修改</Title>
        <Paragraph>
          我们保留随时修改本服务条款的权利。修改后的条款将在网站上公布，用户继续使用本网站即表示接受修改后的条款。
        </Paragraph>
         <Paragraph>
          （请根据实际情况补充或修改具体条款）
        </Paragraph>
      </Card>
    </div>
  );
};

export default TermsPage; 