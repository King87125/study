// 用户信息接口
export interface UserInfo {
  _id: string;
  id?: string | number;
  username: string;
  email: string;
  avatar: string;
  role: string;
  token: string;
}

// 认证状态接口
export interface AuthState {
  userInfo: UserInfo | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// 全局状态接口
export interface RootState {
  auth: AuthState;
} 