import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScheduleState, MeditationSchedule, Meal, WorkDuty } from '../../types';

const initialState: ScheduleState = {
  meditation: [],
  meals: [],
  workDuties: [],
  isLoading: false,
  error: null,
};

const schedulesSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    fetchSchedulesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSchedulesSuccess: (state, action: PayloadAction<{
      meditation?: MeditationSchedule[];
      meals?: Meal[];
      workDuties?: WorkDuty[];
    }>) => {
      state.isLoading = false;
      if (action.payload.meditation) {
        state.meditation = action.payload.meditation;
      }
      if (action.payload.meals) {
        state.meals = action.payload.meals;
      }
      if (action.payload.workDuties) {
        state.workDuties = action.payload.workDuties;
      }
      state.error = null;
    },
    fetchSchedulesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addMeditationSchedule: (state, action: PayloadAction<MeditationSchedule>) => {
      state.meditation.push(action.payload);
    },
    updateMeditationSchedule: (state, action: PayloadAction<MeditationSchedule>) => {
      const index = state.meditation.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.meditation[index] = action.payload;
      }
    },
    deleteMeditationSchedule: (state, action: PayloadAction<string>) => {
      state.meditation = state.meditation.filter(s => s.id !== action.payload);
    },
    addMeal: (state, action: PayloadAction<Meal>) => {
      state.meals.push(action.payload);
    },
    updateMeal: (state, action: PayloadAction<Meal>) => {
      const index = state.meals.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.meals[index] = action.payload;
      }
    },
    deleteMeal: (state, action: PayloadAction<string>) => {
      state.meals = state.meals.filter(m => m.id !== action.payload);
    },
    addWorkDuty: (state, action: PayloadAction<WorkDuty>) => {
      state.workDuties.push(action.payload);
    },
    updateWorkDuty: (state, action: PayloadAction<WorkDuty>) => {
      const index = state.workDuties.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.workDuties[index] = action.payload;
      }
    },
    deleteWorkDuty: (state, action: PayloadAction<string>) => {
      state.workDuties = state.workDuties.filter(w => w.id !== action.payload);
    }
  },
});

export const {
  fetchSchedulesStart,
  fetchSchedulesSuccess,
  fetchSchedulesFailure,
  addMeditationSchedule,
  updateMeditationSchedule,
  deleteMeditationSchedule,
  addMeal,
  updateMeal,
  deleteMeal,
  addWorkDuty,
  updateWorkDuty,
  deleteWorkDuty
} = schedulesSlice.actions;

export default schedulesSlice.reducer;