// This file now imports from realDataService for consistency
import { realDataService } from '../services/realDataService';

// Export real data instead of mock data
export const mockUsers = realDataService.getUsers();
export const mockMeditationSchedules = realDataService.getMeditationSchedules();
export const mockMeals = realDataService.getMeals();
export const mockWorkDuties = realDataService.getWorkDuties();
export const mockMessages = realDataService.getMessages();

// Keep the existing API structure but use real data
export const mockApi = {
  // Auth
  login: async (email: string, password: string) => {
    await delay(500);
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      return { user, token: 'real-token' };
    }
    throw new Error('Invalid credentials');
  },
  
  loginWithUsername: async (username: string, password: string) => {
    await delay(500);
    const user = mockUsers.find(u => u.username === username);
    if (user) {
      return { user, token: 'real-token' };
    }
    throw new Error('Invalid credentials');
  },
  
  // Users
  getUsers: async () => {
    await delay(300);
    return mockUsers;
  },
  
  createUser: async (userData: any) => {
    await delay(500);
    const newUser = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return newUser;
  },
  
  updateUser: async (id: string, userData: any) => {
    await delay(500);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...userData };
      return mockUsers[index];
    }
    throw new Error('User not found');
  },
  
  deleteUser: async (id: string) => {
    await delay(500);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      const deletedUser = mockUsers[index];
      mockUsers.splice(index, 1);
      return deletedUser;
    }
    throw new Error('User not found');
  },
  
  // Meditation Schedules
  getMeditationSchedules: async () => {
    await delay(300);
    return mockMeditationSchedules;
  },
  
  createMeditationSchedule: async (scheduleData: any) => {
    await delay(500);
    const newSchedule = {
      ...scheduleData,
      id: generateId(),
    };
    mockMeditationSchedules.push(newSchedule);
    return newSchedule;
  },
  
  updateMeditationSchedule: async (id: string, scheduleData: any) => {
    await delay(500);
    const index = mockMeditationSchedules.findIndex(s => s.id === id);
    if (index !== -1) {
      mockMeditationSchedules[index] = { ...mockMeditationSchedules[index], ...scheduleData };
      return mockMeditationSchedules[index];
    }
    throw new Error('Schedule not found');
  },
  
  deleteMeditationSchedule: async (id: string) => {
    await delay(500);
    const index = mockMeditationSchedules.findIndex(s => s.id === id);
    if (index !== -1) {
      const deletedSchedule = mockMeditationSchedules[index];
      mockMeditationSchedules.splice(index, 1);
      return deletedSchedule;
    }
    throw new Error('Schedule not found');
  },
  
  // Meals
  getMeals: async () => {
    await delay(300);
    return mockMeals;
  },
  
  createMeal: async (mealData: any) => {
    await delay(500);
    const newMeal = {
      ...mealData,
      id: generateId(),
    };
    mockMeals.push(newMeal);
    return newMeal;
  },
  
  updateMeal: async (id: string, mealData: any) => {
    await delay(500);
    const index = mockMeals.findIndex(m => m.id === id);
    if (index !== -1) {
      mockMeals[index] = { ...mockMeals[index], ...mealData };
      return mockMeals[index];
    }
    throw new Error('Meal not found');
  },
  
  deleteMeal: async (id: string) => {
    await delay(500);
    const index = mockMeals.findIndex(m => m.id === id);
    if (index !== -1) {
      const deletedMeal = mockMeals[index];
      mockMeals.splice(index, 1);
      return deletedMeal;
    }
    throw new Error('Meal not found');
  },
  
  // Work Duties
  getWorkDuties: async () => {
    await delay(300);
    return mockWorkDuties;
  },
  
  createWorkDuty: async (dutyData: any) => {
    await delay(500);
    const newDuty = {
      ...dutyData,
      id: generateId(),
    };
    mockWorkDuties.push(newDuty);
    return newDuty;
  },
  
  updateWorkDuty: async (id: string, dutyData: any) => {
    await delay(500);
    const index = mockWorkDuties.findIndex(w => w.id === id);
    if (index !== -1) {
      mockWorkDuties[index] = { ...mockWorkDuties[index], ...dutyData };
      return mockWorkDuties[index];
    }
    throw new Error('Work duty not found');
  },
  
  deleteWorkDuty: async (id: string) => {
    await delay(500);
    const index = mockWorkDuties.findIndex(w => w.id === id);
    if (index !== -1) {
      const deletedDuty = mockWorkDuties[index];
      mockWorkDuties.splice(index, 1);
      return deletedDuty;
    }
    throw new Error('Work duty not found');
  },
  
  // Messages
  getMessages: async () => {
    await delay(300);
    return mockMessages;
  },
  
  sendMessage: async (messageData: any) => {
    await delay(500);
    const newMessage = {
      ...messageData,
      id: generateId(),
      sentAt: new Date().toISOString(),
    };
    mockMessages.push(newMessage);
    return newMessage;
  },
  
  deleteMessage: async (id: string) => {
    await delay(500);
    const index = mockMessages.findIndex(m => m.id === id);
    if (index !== -1) {
      const deletedMessage = mockMessages[index];
      mockMessages.splice(index, 1);
      return deletedMessage;
    }
    throw new Error('Message not found');
  },
};

// Helper functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => Math.random().toString(36).substr(2, 9);

// Export the generateMockData function for backward compatibility
export const generateMockData = () => {
  return {
    users: mockUsers,
    meditationSchedules: mockMeditationSchedules,
    meals: mockMeals,
    workDuties: mockWorkDuties,
    messages: mockMessages,
  };
};