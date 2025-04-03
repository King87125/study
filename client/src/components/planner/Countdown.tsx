import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, DatePicker, Progress, Row, Col, Statistic } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { DatePickerProps } from 'antd';

interface CountdownProps {
  examDate: string;
  onChangeDate: (date: string) => void;
}

const Countdown: React.FC<CountdownProps> = ({ examDate, onChangeDate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [deadline, setDeadline] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (examDate) {
      const examDay = dayjs(examDate);
      setSelectedDate(examDay);
      setDeadline(examDay);
      calculateDaysLeft(examDay);
    }
  }, [examDate]);

  const calculateDaysLeft = (date: Dayjs) => {
    const today = dayjs().startOf('day');
    const examDay = date.startOf('day');
    const days = examDay.diff(today, 'day');
    setDaysLeft(days >= 0 ? days : 0);
  };

  const handleDateChange: DatePickerProps['onChange'] = (date) => {
    setSelectedDate(date);
  };

  const handleSave = () => {
    if (selectedDate) {
      onChangeDate(selectedDate.format('YYYY-MM-DD'));
      setDeadline(selectedDate);
      calculateDaysLeft(selectedDate);
    }
    setIsEditing(false);
  };

  const formatCountdown = (value: number): string => {
    return `${value}`;
  };

  const calculateProgress = (): number => {
    if (!deadline) return 0;
    
    const totalDays = 180; // 假设备考总时长为180天
    const passedDays = totalDays - daysLeft;
    const progress = Math.min(Math.floor((passedDays / totalDays) * 100), 100);
    
    return progress > 0 ? progress : 0;
  };

  return (
    <Card 
      className="countdown-card"
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          距离考试还有
        </Typography.Title>
      }
      extra={
        isEditing ? (
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        ) : (
          <Button type="primary" onClick={() => setIsEditing(true)}>
            修改考试日期
          </Button>
        )
      }
    >
      {isEditing ? (
        <DatePicker 
          value={selectedDate}
          onChange={handleDateChange}
          style={{ width: '100%' }}
          placeholder="选择考试日期"
        />
      ) : (
        <Row gutter={16}>
          <Col span={24} style={{ textAlign: 'center', marginBottom: 20 }}>
            <Statistic 
              value={daysLeft} 
              suffix="天" 
              valueStyle={{ color: '#1890ff', fontSize: '3rem', fontWeight: 'bold' }}
              formatter={(value) => formatCountdown(value as number)}
            />
          </Col>
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <Typography.Text>
                考试日期: {deadline ? deadline.format('YYYY年MM月DD日') : '未设置'}
              </Typography.Text>
            </div>
            <Progress 
              percent={calculateProgress()} 
              status="active" 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Typography.Text type="secondary">
                {calculateProgress()}% 的备考时间已经过去
              </Typography.Text>
            </div>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default Countdown;