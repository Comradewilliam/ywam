import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Logo and info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center space-x-3">
            <img src="/YWAM-Logo.png" alt="YWAM" className="w-12 h-12" />
            <h1 className="text-3xl font-bold">YWAM DAR</h1>
          </div>
          <p className="mt-6 text-blue-100 text-lg max-w-lg">
            Welcome to the YWAM DAR Management System. Your one-stop platform for managing schedules, 
            meal planning, work duties, and messaging within the YWAM DAR community.
          </p>
        </div>
        
        <div className="mt-auto space-y-6">
          <div>
            <h3 className="text-xl font-semibold">Streamlined Scheduling</h3>
            <p className="mt-2 text-blue-100">
              Efficient organization of meditation, cooking, and work duty schedules with automatic assignments.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">Role-Based Access</h3>
            <p className="mt-2 text-blue-100">
              Personalized experiences based on individual roles within the community.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">Integrated Messaging</h3>
            <p className="mt-2 text-blue-100">
              SMS notifications and reminders for all scheduled activities.
            </p>
          </div>
        </div>
        
        <div className="pt-6 mt-auto">
          <p className="text-sm text-blue-100">© 2025 YWAM DAR. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;