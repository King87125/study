import React from 'react';
import { Typography, Card, Collapse } from 'antd';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const HelpPage: React.FC = () => {
  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Card>
        <Title level={2}>帮助中心</Title>
        <Paragraph>
          这里汇集了一些常见问题的解答和使用指南，希望能帮助您更好地使用"考研伴侣"。
        </Paragraph>
        <Collapse accordion>
          <Panel header="如何添加学习计划？" key="1">
            <Paragraph>
              您可以在"每日学习"页面的"每日计划"标签下，点击右上角的"添加计划"按钮。也可以在视频或资料的详情页点击"添加到学习计划"按钮。
            </Paragraph>
          </Panel>
          <Panel header="如何标记计划为已完成？" key="2">
            <Paragraph>
              在"每日学习"页面的"每日计划"列表中，点击计划项前面的复选框即可标记完成或未完成。
            </Paragraph>
          </Panel>
          <Panel header="上传的视频/资料支持哪些格式？" key="3">
            <Paragraph>
              视频支持常见的 MP4, MOV, AVI 等格式。资料支持 PDF, Word, Excel, PowerPoint, TXT 等文档格式。
            </Paragraph>
          </Panel>
           <Panel header="如何联系我们？" key="4">
            <Paragraph>
              如果您遇到问题或有任何建议，可以通过页脚提供的邮箱或 GitHub 链接联系我们。
            </Paragraph>
          </Panel>
          {/* 可以根据需要添加更多常见问题 */}
        </Collapse>
      </Card>
    </div>
  );
};

export default HelpPage; 