import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';

const initialState: AuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  token: null,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;