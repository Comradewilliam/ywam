import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import schedulesReducer from './slices/schedulesSlice';
import usersReducer from './slices/usersSlice';
import messagesReducer from './slices/messagesSlice';
import { AppState } from '../types';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    schedules: schedulesReducer,
    users: usersReducer,
    messages: messagesReducer,
  } as any, // Cast to any to avoid TypeScript errors with the reducers
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;