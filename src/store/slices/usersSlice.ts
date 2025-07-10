import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState, User } from '../../types';
import { mockInitialState } from '../initialState';

const initialState: UserState = mockInitialState.users;

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action: PayloadAction<User[]>) => {
      state.isLoading = false;
      state.users = action.payload;
      state.error = null;
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(u => u.id !== action.payload);
    }
  },
});

export const {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  addUser,
  updateUser,
  deleteUser
} = usersSlice.actions;

export default usersSlice.reducer;