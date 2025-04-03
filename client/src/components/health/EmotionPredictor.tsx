import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Timeline, Tag, Button, Alert, Progress, Statistic, Tooltip } from 'antd';
import { 
  HeartOutlined, 
  BulbOutlined, 
  BookOutlined, 
  BellOutlined,
  LineChartOutlined,
  SmileOutlined,
  CoffeeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import moment from 'moment';

interface EmotionPredictorProps {
  lastPeriod: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  historyData: any[];
}

// 情绪预测数据接口
interface EmotionPrediction {
  date: string;
  emotion: string;
  intensity: number;
  description: string;
  suggestions: string[];
}

// 学习建议接口
interface StudyAdvice {
  phase: string;
  tips: string[];
  activities: string[];
}

const EmotionPredictor: React.FC<EmotionPredictorProps> = ({
  lastPeriod,
  cycleLength = 28,
  periodLength = 5,
  historyData
}) => {
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [emotionPredictions, setEmotionPredictions] = useState<EmotionPrediction[]>([]);
  const [studyAdvice, setStudyAdvice] = useState<StudyAdvice[]>([]);
  const [showReminder, setShowReminder] = useState<boolean>(false);

  // 计算当前处于周期的哪个阶段
  useEffect(() => {
    if (!lastPeriod || !cycleLength) return;

    const today = moment();
    const lastPeriodDate = moment(lastPeriod);
    const daysSinceLastPeriod = today.diff(lastPeriodDate, 'days');
    const cyclePhase = daysSinceLastPeriod % cycleLength;
    const periodLengthValue = periodLength || 5;

    let phase = '';
    if (cyclePhase <= periodLengthValue) {
      phase = '经期';
    } else if (cyclePhase <= cycleLength * 0.3) {
      phase = '经期后';
    } else if (cyclePhase <= cycleLength * 0.6) {
      phase = '排卵期';
    } else {
      phase = '经期前';
    }

    setCurrentPhase(phase);
  }, [lastPeriod, cycleLength, periodLength]);

  // 生成情绪预测
  useEffect(() => {
    if (!lastPeriod || !cycleLength) return;

    const predictions: EmotionPrediction[] = [];
    const today = moment();
    
    // 预测未来7天的情绪
    for (let i = 0; i < 7; i++) {
      const date = today.clone().add(i, 'days');
      const daysSinceLastPeriod = date.diff(moment(lastPeriod), 'days');
      const cyclePhase = daysSinceLastPeriod % cycleLength;
      const periodLengthValue = periodLength || 5;

      let emotion = '';
      let intensity = 0;
      let description = '';
      let suggestions: string[] = [];

      // 根据周期阶段预测情绪
      if (cyclePhase <= periodLengthValue) {
        emotion = '疲惫';
        intensity = 0.7;
        description = '经期期间，身体和情绪可能较为敏感';
        suggestions = ['保持充足休息', '适当运动放松', '注意保暖'];
      } else if (cyclePhase <= cycleLength * 0.3) {
        emotion = '平静';
        intensity = 0.3;
        description = '经期后，情绪较为稳定';
        suggestions = ['制定学习计划', '保持运动习惯', '规律作息'];
      } else if (cyclePhase <= cycleLength * 0.6) {
        emotion = '愉悦';
        intensity = 0.4;
        description = '排卵期，精力充沛';
        suggestions = ['安排重要学习任务', '进行创造性活动', '保持积极心态'];
      } else {
        emotion = '敏感';
        intensity = 0.6;
        description = '经期前，情绪可能波动较大';
        suggestions = ['提前规划学习任务', '保持运动习惯', '注意饮食调节'];
      }

      predictions.push({
        date: date.format('YYYY-MM-DD'),
        emotion,
        intensity,
        description,
        suggestions
      });
    }

    setEmotionPredictions(predictions);
  }, [lastPeriod, cycleLength, periodLength]);

  // 生成学习建议
  useEffect(() => {
    const advice: StudyAdvice[] = [
      {
        phase: '经期',
        tips: [
          '将重要学习任务安排在精力较好的时段',
          '适当减少学习强度，保持充足休息',
          '使用番茄工作法，每25分钟休息5分钟',
          '准备热敷袋和暖宝宝，缓解不适'
        ],
        activities: [
          '进行轻度运动，如散步或瑜伽',
          '听轻音乐或冥想放松',
          '准备营养均衡的饮食',
          '保持充足睡眠'
        ]
      },
      {
        phase: '经期后',
        tips: [
          '制定详细的学习计划',
          '安排重要考试或项目',
          '进行高强度学习',
          '参加学习小组讨论'
        ],
        activities: [
          '进行有氧运动',
          '参加学习研讨会',
          '整理学习笔记',
          '预习新课程'
        ]
      },
      {
        phase: '排卵期',
        tips: [
          '安排创造性学习任务',
          '进行小组项目合作',
          '参加学术讨论',
          '准备重要考试'
        ],
        activities: [
          '进行团队学习',
          '参加学术讲座',
          '进行实验或研究',
          '准备演讲或展示'
        ]
      },
      {
        phase: '经期前',
        tips: [
          '提前完成重要任务',
          '准备学习材料',
          '进行复习和总结',
          '保持规律作息'
        ],
        activities: [
          '整理学习资料',
          '进行轻度运动',
          '准备营养餐',
          '保持充足睡眠'
        ]
      }
    ];

    setStudyAdvice(advice);
  }, []);

  // 获取当前阶段的学习建议
  const getCurrentAdvice = () => {
    return studyAdvice.find(advice => advice.phase === currentPhase) || studyAdvice[0];
  };

  // 情绪标签颜色
  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      '疲惫': '#ff4d4f',
      '平静': '#52c41a',
      '愉悦': '#1890ff',
      '敏感': '#722ed1'
    };
    return colors[emotion] || '#8c8c8c';
  };

  return (
    <div className="emotion-predictor">
      <Row gutter={[16, 16]}>
        {/* 当前状态卡片 */}
        <Col xs={24} md={8}>
          <Card 
            title="当前状态" 
            bordered={false}
            className="status-card"
            style={{ background: 'linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%)' }}
          >
            <Statistic
              title="当前阶段"
              value={currentPhase}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '20px' }}>
              <Alert
                message="情绪提醒"
                description="根据您的经期记录，系统会自动提醒您可能出现的情绪变化，帮助您更好地安排学习和生活。"
                type="info"
                showIcon
              />
            </div>
          </Card>
        </Col>

        {/* 情绪预测卡片 */}
        <Col xs={24} md={16}>
          <Card 
            title="情绪预测" 
            bordered={false}
            className="prediction-card"
            style={{ background: 'linear-gradient(135deg, #fff1f0 0%, #fff 100%)' }}
          >
            <Timeline>
              {emotionPredictions.map((prediction, index) => (
                <Timeline.Item 
                  key={index}
                  color={getEmotionColor(prediction.emotion)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Tag color={getEmotionColor(prediction.emotion)}>
                        {moment(prediction.date).format('MM-DD')}
                      </Tag>
                      <span style={{ marginLeft: '8px' }}>{prediction.emotion}</span>
                    </div>
                    <Progress 
                      percent={prediction.intensity * 100} 
                      size="small" 
                      showInfo={false}
                      strokeColor={getEmotionColor(prediction.emotion)}
                    />
                  </div>
                  <p style={{ marginTop: '4px', color: '#666' }}>{prediction.description}</p>
                  <div style={{ marginTop: '8px' }}>
                    {prediction.suggestions.map((suggestion, idx) => (
                      <Tag key={idx} color="blue" style={{ marginBottom: '4px' }}>
                        {suggestion}
                      </Tag>
                    ))}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* 学习建议卡片 */}
        <Col xs={24}>
          <Card 
            title="学习建议" 
            bordered={false}
            className="study-advice-card"
            style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #fff 100%)' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card 
                  title={<><BulbOutlined /> 学习技巧</>}
                  size="small"
                >
                  <ul style={{ paddingLeft: '20px' }}>
                    {getCurrentAdvice().tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  title={<><BookOutlined /> 推荐活动</>}
                  size="small"
                >
                  <ul style={{ paddingLeft: '20px' }}>
                    {getCurrentAdvice().activities.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmotionPredictor; 