import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getDashboardForUser } from '../../utils/helpers';
import Header from './Header';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  // Update isMobile state based on window width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Close sidebar on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);
  
  // Get title based on current location
  const getTitle = () => {
    const path = location.pathname;
    
    if (path === '/admin') return 'Admin Dashboard';
    if (path === '/admin/users') return 'User Management';
    if (path === '/admin/meditation') return 'Meditation Schedule';
    if (path === '/admin/messages') return 'Messages';
    
    if (path === '/chef') return 'Chef Dashboard';
    if (path === '/chef/meal-plan') return 'Meal Planning';
    
    if (path === '/work-duty') return 'Work Duty Dashboard';
    if (path === '/work-duty/tasks') return 'Task Management';
    
    if (path === '/missionary') return 'Missionary Dashboard';
    if (path === '/staff') return 'Staff Dashboard';
    if (path === '/dts') return 'DTS Dashboard';
    
    if (path === '/profile') return 'My Profile';
    if (path === '/profile/schedules') return 'My Schedules';
    
    return 'Dashboard';
  };
  
  // Determine if download button should be shown
  const shouldShowDownload = () => {
    const path = location.pathname;
    return [
      '/admin',
      '/chef',
      '/work-duty',
      '/missionary',
      '/staff',
      '/dts',
      '/profile/schedules'
    ].includes(path);
  };
  
  const handleDownload = () => {
    console.log('Download schedule');
    // Implement schedule download logic
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header
          title={getTitle()}
          onMenuClick={() => setIsSidebarOpen(true)}
          showDownload={shouldShowDownload()}
          onDownloadSchedule={handleDownload}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
        
        <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6">
          <p className="text-sm text-center text-gray-500">
            &copy; {new Date().getFullYear()} YWAM DAR Management System
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;