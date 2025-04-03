import React from 'react';
import { Typography } from 'antd';
import DailyStudyPlan from '../components/planner/DailyStudyPlan';

const { Title, Paragraph } = Typography;

const DailyStudyPlanPage: React.FC = () => {
  return (
    <div className="daily-study-plan-page" style={{ padding: '20px' }}>
      <Title level={2}>每日学习计划</Title>
      <Paragraph>在这里可以查看和管理您的学习计划，点击日历上的日期可以查看当天的详细计划。</Paragraph>
      
      {/* 使用完整功能的DailyStudyPlan组件 */}
      <DailyStudyPlan />
    </div>
  );
};

export default DailyStudyPlanPage; 