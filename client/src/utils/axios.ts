import axios from 'axios';

// 设置基础URL - 使用环境变量
// axios.defaults.baseURL = 'http://localhost:5001'; // 旧的硬编码地址
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001'; 
// 在生产环境使用环境变量REACT_APP_API_URL，如果未设置（本地开发），则回退到本地地址

console.log('Axios Base URL:', axios.defaults.baseURL); // 添加日志方便调试

// 配置请求拦截器
axios.interceptors.request.use(
  (config) => {
    // 检查URL是否包含"undefined"
    if (config.url && config.url.includes('undefined')) {
      console.warn('检测到请求包含undefined的URL:', config.url);
      console.trace('请求堆栈');
      // 创建一个控制台错误，但不中断请求流程
      console.error(`发现包含undefined的URL: ${config.url}`);
    }
    
    // 从localStorage获取token
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.token) {
          // 设置认证头
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${userInfo.token}`;
        }
      } catch (error) {
        console.error('Error parsing user info from localStorage', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 配置响应拦截器
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误（未授权）
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios; 