export type UserRole = 'Admin' | 'Staff' | 'Missionary' | 'Chef' | 'WorkDutyManager' | 'DTS' | 'PraiseTeam' | 'Friend';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email?: string;
  phoneNumber: string;
  gender: 'Male' | 'Female';
  university: string;
  course: string;
  dateOfBirth: string;
  roles: UserRole[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MeditationSchedule {
  id: string;
  date: string;
  time: string;
  userId: string;
  user?: User;
  bibleVerse: string;
}

export interface Meal {
  id: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  mealName: string;
  cookId: string;
  cook?: User;
  washerId: string;
  washer?: User;
  prepTime: string;
  serveTime: string;
}

export interface WorkDuty {
  id: string;
  taskName: string;
  isLight: boolean;
  isGroup: boolean;
  peopleCount: number;
  date: string;
  time: string;
  assignedUserIds: string[];
  assignedUsers?: User[];
}

export interface Message {
  id: string;
  content: string;
  recipients: string[];
  schedule?: {
    startDate: string;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
  sentAt: string;
  sentBy: string;
}

export interface ScheduleState {
  meditation: MeditationSchedule[];
  meals: Meal[];
  workDuties: WorkDuty[];
  isLoading: boolean;
  error: string | null;
}

export interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

export interface MessageState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  schedules: ScheduleState;
  users: UserState;
  messages: MessageState;
}