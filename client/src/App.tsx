import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { Provider } from 'react-redux';
import { store } from './store';
import axios from 'axios';

// 配置 Day.js 插件
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/zh-cn'; // 导入中文语言包
dayjs.extend(isBetween);
dayjs.locale('zh-cn'); // 设置全局语言为中文

// 导入布局组件
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// 导入保护路由组件
import ProtectedRoute from './components/auth/ProtectedRoute';

// 导入页面组件
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VideoListPage from './pages/VideoListPage';
import VideoDetailPage from './pages/VideoDetailPage';
import UploadVideoPage from './pages/UploadVideoPage';
import MaterialListPage from './pages/MaterialListPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import UploadMaterialPage from './pages/UploadMaterialPage';
import ProfilePage from './pages/ProfilePage';
import StudyPlannerPage from './pages/StudyPlannerPage';
import FriendsPage from './pages/FriendsPage';
import StudySupervisionPage from './pages/StudySupervisionPage';
import HealthPage from './pages/HealthPage';
import HealthPageTest from './pages/HealthPageTest';
import DailyStudyPlanPage from './pages/DailyStudyPlanPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import HelpPage from './pages/HelpPage';

// 设置全局请求拦截器
axios.interceptors.request.use(
  config => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider 
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
            fontFamily: 'Inter, sans-serif',
          },
          components: {
            Button: {
              borderRadius: 6,
            },
            Card: {
              borderRadiusLG: 8,
            }
          }
        }}
      >
        <AntApp>
        <Router>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/videos" element={<VideoListPage />} />
              <Route path="/videos/:id" element={<VideoDetailPage />} />
              <Route path="/upload-video" element={
                <ProtectedRoute>
                  <UploadVideoPage />
                </ProtectedRoute>
              } />
              <Route path="/materials" element={<MaterialListPage />} />
              <Route path="/materials/:id" element={<MaterialDetailPage />} />
              <Route path="/upload-material" element={
                <ProtectedRoute>
                  <UploadMaterialPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/study-planner" element={
                <ProtectedRoute>
                  <StudyPlannerPage />
                </ProtectedRoute>
              } />
              <Route path="/friends" element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              } />
              <Route path="/study-supervision/:friendId" element={
                <ProtectedRoute>
                  <StudySupervisionPage />
                </ProtectedRoute>
              } />
              <Route path="/health" element={
                <ProtectedRoute>
                  <HealthPage />
                </ProtectedRoute>
              } />
              <Route path="/health-test" element={
                <ProtectedRoute>
                  <HealthPageTest />
                </ProtectedRoute>
              } />
              <Route path="/daily-study-plan" element={
                <ProtectedRoute>
                  <DailyStudyPlanPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/help" element={<HelpPage />} />
            </Routes>
          </main>
          <Footer />
        </Router>
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
