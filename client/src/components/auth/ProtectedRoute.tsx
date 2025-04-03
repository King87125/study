import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // 从localStorage获取用户信息
  const userInfoString = localStorage.getItem('userInfo');
  const isAuthenticated = userInfoString ? JSON.parse(userInfoString).token : null;

  // 如果用户未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果用户已登录，显示子组件
  return <>{children}</>;
};

export default ProtectedRoute; 