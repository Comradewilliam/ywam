import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { hasRole, getDashboardForUser } from '../../utils/helpers';
import { 
  Users, Calendar, Clock, BookOpen, ChefHat, 
  Briefcase, MessageSquare, User, LogOut, Menu, X,
  BarChart3, Settings, Database, Bell
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center py-3 px-4 rounded-lg text-sm font-medium
        transition-colors duration-150 ease-in-out
        ${isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onClose }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const closeIfMobile = () => {
    if (isMobile) {
      onClose();
    }
  };
  
  if (!user) return null;
  
  const isAdmin = hasRole(user, 'Admin');
  const isChef = hasRole(user, 'Chef');
  const isWorkDutyManager = hasRole(user, 'WorkDutyManager');
  const isMissionary = hasRole(user, 'Missionary');
  const isDTS = hasRole(user, 'DTS');
  const isStaff = hasRole(user, 'Staff');
  const isPraiseTeam = hasRole(user, 'PraiseTeam');
  
  return (
    <div
      className={`
        ${isMobile ? 'fixed inset-0 z-50 flex' : 'relative'}
        ${isMobile && !isOpen ? 'pointer-events-none' : ''}
      `}
    >
      {/* Overlay */}
      {isMobile && (
        <div
          className={`
            fixed inset-0 bg-gray-600
            transition-opacity duration-300 ease-in-out
            ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
          `}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 w-64 transition-transform duration-300 ease-in-out transform
               ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'w-64 h-screen sticky top-0'
          }
          bg-white border-r border-gray-200 pt-5 pb-4 flex flex-col overflow-y-auto
        `}
      >
        {/* Logo and mobile close button */}
        <div className="flex items-center justify-between px-4 mb-6">
          <div className="flex items-center">
            <img src="/YWAM-Logo.png" alt="YWAM" className="w-8 h-8 mr-2" />
            <h1 className="text-xl font-bold text-blue-600">YWAM DAR</h1>
          </div>
          {isMobile && (
            <button
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* User info */}
        <div className="px-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <User size={20} className="text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-blue-800">{user.firstName} {user.lastName}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.roles.slice(0, 2).map((role) => (
                    <span key={role} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {role}
                    </span>
                  ))}
                  {user.roles.length > 2 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      +{user.roles.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="px-4 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {/* Dashboard - For everyone */}
            <NavItem 
              to={getDashboardForUser(user)} 
              icon={<Calendar size={18} />} 
              label="Dashboard" 
              onClick={closeIfMobile}
            />
            
            {/* Admin Links */}
            {isAdmin && (
              <>
                <h3 className="mt-6 mb-2 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administration
                </h3>
                
                <NavItem 
                  to="/admin/users" 
                  icon={<Users size={18} />} 
                  label="User Management" 
                  onClick={closeIfMobile}
                />
                
                <NavItem 
                  to="/admin/meditation" 
                  icon={<BookOpen size={18} />} 
                  label="Meditation Schedule" 
                  onClick={closeIfMobile}
                />
                
                <NavItem 
                  to="/admin/messages" 
                  icon={<MessageSquare size={18} />} 
                  label="Messages" 
                  onClick={closeIfMobile}
                />

                <NavItem 
                  to="/admin/notifications" 
                  icon={<Bell size={18} />} 
                  label="Notifications" 
                  onClick={closeIfMobile}
                />

                <NavItem 
                  to="/admin/analytics" 
                  icon={<BarChart3 size={18} />} 
                  label="Analytics" 
                  onClick={closeIfMobile}
                />

                <NavItem 
                  to="/admin/backup" 
                  icon={<Database size={18} />} 
                  label="Backup" 
                  onClick={closeIfMobile}
                />

                <NavItem 
                  to="/admin/settings" 
                  icon={<Settings size={18} />} 
                  label="Settings" 
                  onClick={closeIfMobile}
                />
              </>
            )}
            
            {/* Chef Links */}
            {isChef && (
              <>
                <h3 className="mt-6 mb-2 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kitchen
                </h3>
                
                <NavItem 
                  to="/chef/meal-plan" 
                  icon={<ChefHat size={18} />} 
                  label="Meal Planning" 
                  onClick={closeIfMobile}
                />
              </>
            )}
            
            {/* Work Duty Manager Links */}
            {isWorkDutyManager && (
              <>
                <h3 className="mt-6 mb-2 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Work Duties
                </h3>
                
                <NavItem 
                  to="/work-duty/tasks" 
                  icon={<Briefcase size={18} />} 
                  label="Task Management" 
                  onClick={closeIfMobile}
                />
              </>
            )}
            
            {/* Common Links */}
            <h3 className="mt-6 mb-2 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              My Schedule
            </h3>
            
            <NavItem 
              to="/profile/schedules" 
              icon={<Clock size={18} />} 
              label="View My Schedule" 
              onClick={closeIfMobile}
            />
            
            <NavItem 
              to="/profile" 
              icon={<User size={18} />} 
              label="My Profile" 
              onClick={closeIfMobile}
            />
            
            <div className="mt-6">
              <NavItem 
                to="/logout" 
                icon={<LogOut size={18} />} 
                label="Logout" 
                onClick={closeIfMobile}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;