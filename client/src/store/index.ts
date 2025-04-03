import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { RootState as AppRootState } from '../types';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = AppRootState;
export type AppDispatch = typeof store.dispatch; 