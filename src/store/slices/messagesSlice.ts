import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MessageState, Message } from '../../types';
import { realDataService } from '../../services/realDataService';

const initialState: MessageState = {
  messages: realDataService.getMessages(),
  isLoading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    fetchMessagesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (state, action: PayloadAction<Message[]>) => {
      state.isLoading = false;
      state.messages = action.payload;
      state.error = null;
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const index = state.messages.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    deleteMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(m => m.id !== action.payload);
    }
  },
});

export const {
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  addMessage,
  updateMessage,
  deleteMessage
} = messagesSlice.actions;

export default messagesSlice.reducer;