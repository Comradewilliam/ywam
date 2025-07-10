import { AppState } from '../types';

export const mockInitialState: AppState = {
  auth: {
    user: {
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'yefta@ydms.com',
      phoneNumber: '+255123456789',
      gender: 'Male',
      university: 'KIUT',
      course: 'COMPUTER SCIENCE',
      dateOfBirth: '1990-01-01',
      roles: ['Admin', 'Staff'],
      createdAt: '2023-01-01',
    },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
  },
  schedules: {
    meditation: [],
    meals: [],
    workDuties: [],
    isLoading: false,
    error: null,
  },
  users: {
    users: [],
    isLoading: false,
    error: null,
  },
  messages: {
    messages: [],
    isLoading: false,
    error: null,
  },
};