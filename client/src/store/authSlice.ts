import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserInfo, AuthState } from '../types';

// 从localStorage中获取用户信息
const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo') || '{}')
  : null;

// 设置初始状态
const initialState: AuthState = {
  userInfo: userInfoFromStorage,
  token: userInfoFromStorage?.token || null, // 增加token字段，方便直接访问
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<UserInfo>) => {
      state.loading = false;
      state.userInfo = action.payload;
      state.token = action.payload.token; // 设置token
      state.error = null;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    loginFail: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.userInfo = null;
      state.token = null; // 清除token
      localStorage.removeItem('userInfo');
    },
    updateProfile: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
      state.token = action.payload.token; // 更新token
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
  },
});

export const { loginRequest, loginSuccess, loginFail, logout, updateProfile } = authSlice.actions;

export default authSlice.reducer; 