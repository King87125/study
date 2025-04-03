import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/ipad.css'; // 引入iPad适配样式
import App from './App';
import reportWebVitals from './reportWebVitals';
import './utils/axios'; // 导入axios配置

// 添加全局未处理Promise错误监听器
window.addEventListener('unhandledrejection', function(event) {
  console.error('未处理的Promise错误:', event.reason);
  console.error('错误URL:', event.reason?.config?.url);
  console.error('错误堆栈:', event.reason?.stack);
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
