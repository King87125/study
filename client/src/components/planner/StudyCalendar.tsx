import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, Form, Input, Select, Button, message, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import type { SelectInfo } from 'antd/es/calendar/generateCalendar';

const { Option } = Select;
const { TextArea } = Input;

interface StudyEvent {
  _id?: string;
  title: string;
  description?: string;
  date: string;
  type: 'study' | 'exam' | 'rest';
  completed: boolean;
}

interface StudyCalendarProps {
  examDate: string;
}

const StudyCalendar: React.FC<StudyCalendarProps> = ({ examDate }) => {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/planner/study-events');
      const eventData = response.data as StudyEvent[];
      setEvents(eventData);
    } catch (error) {
      console.error('获取学习计划失败:', error);
      message.error('无法加载学习计划数据');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (values: any) => {
    try {
      setLoading(true);
      const newEvent: StudyEvent = {
        title: values.title,
        description: values.description,
        date: selectedDate.format('YYYY-MM-DD'),
        type: values.type,
        completed: false
      };

      const response = await axios.post('/api/planner/study-events', newEvent);
      const createdEvent = response.data as StudyEvent;
      setEvents([...events, createdEvent]);
      message.success('学习计划添加成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('添加学习计划失败:', error);
      message.error('无法添加学习计划');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventCompletion = async (eventId: string, completed: boolean) => {
    try {
      setLoading(true);
      await axios.patch(`/api/planner/study-events/${eventId}`, { completed: !completed });
      
      setEvents(events.map(event => 
        event._id === eventId 
          ? { ...event, completed: !completed } 
          : event
      ));
      
      message.success(completed ? '标记为未完成' : '标记为已完成');
    } catch (error) {
      console.error('更新学习计划状态失败:', error);
      message.error('无法更新学习计划状态');
    } finally {
      setLoading(false);
    }
  };

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    return events.filter(event => event.date === dateStr);
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map(item => (
          <li key={item._id} onClick={() => item._id && toggleEventCompletion(item._id, item.completed)}>
            <Badge 
              status={item.type === 'study' ? 'processing' : item.type === 'exam' ? 'error' : 'default'} 
              text={
                <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                  {item.title}
                </span>
              } 
            />
          </li>
        ))}
      </ul>
    );
  };

  const handleDateSelect = (date: Dayjs, selectInfo: SelectInfo) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  return (
    <Spin spinning={loading}>
      <div className="calendar-container">
        <Calendar 
          cellRender={(date, info) => {
            if (info.type === 'date') {
              return dateCellRender(date);
            }
            return null;
          }}
          onSelect={handleDateSelect}
        />
      </div>

      <Modal
        title={`添加学习计划 - ${selectedDate.format('YYYY年MM月DD日')}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEvent}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入计划标题' }]}
          >
            <Input placeholder="例如：复习高等数学第三章" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="详细描述"
          >
            <TextArea rows={4} placeholder="详细描述你的学习计划..." />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="类型"
            initialValue="study"
            rules={[{ required: true, message: '请选择计划类型' }]}
          >
            <Select>
              <Option value="study">学习</Option>
              <Option value="exam">考试/测验</Option>
              <Option value="rest">休息</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default StudyCalendar;