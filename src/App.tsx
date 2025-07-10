import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './store';
import 'react-toastify/dist/ReactToastify.css';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import MobileOptimized from './components/layout/MobileOptimized';

// Dashboard Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import MeditationSchedule from './pages/admin/MeditationSchedule';
import Messages from './pages/admin/Messages';
import NotificationTemplates from './pages/admin/NotificationTemplates';
import Analytics from './components/admin/Analytics';
import SystemSettings from './components/admin/SystemSettings';
import BackupManagement from './components/admin/BackupManagement';

import ChefDashboard from './pages/chef/Dashboard';
import MealPlanning from './pages/chef/MealPlanning';

import WorkDutyDashboard from './pages/workduty/Dashboard';
import TaskManagement from './pages/workduty/TaskManagement';

import MissionaryDashboard from './pages/missionary/Dashboard';
import StaffDashboard from './pages/staff/Dashboard';
import DTSDashboard from './pages/dts/Dashboard';

import ProfilePage from './pages/profile/Profile';
import SchedulesPage from './pages/profile/Schedules';

// Route Protection
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <MobileOptimized>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Dashboard Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/meditation" element={<MeditationSchedule />} />
              <Route path="/admin/messages" element={<Messages />} />
              <Route path="/admin/notifications" element={<NotificationTemplates />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
              <Route path="/admin/backup" element={<BackupManagement />} />
              
              {/* Chef Routes */}
              <Route path="/chef" element={<ChefDashboard />} />
              <Route path="/chef/meal-plan" element={<MealPlanning />} />
              
              {/* Work Duty Routes */}
              <Route path="/work-duty" element={<WorkDutyDashboard />} />
              <Route path="/work-duty/tasks" element={<TaskManagement />} />
              
              {/* Role-specific Dashboards */}
              <Route path="/missionary" element={<MissionaryDashboard />} />
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/dts" element={<DTSDashboard />} />
              
              {/* Profile Routes */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/schedules" element={<SchedulesPage />} />

              {/* Logout Route (handled by component) */}
              <Route path="/logout" element={<Navigate to="/login" />} />
            </Route>
            
            {/* Default Route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </MobileOptimized>
    </Provider>
  );
}

export default App;