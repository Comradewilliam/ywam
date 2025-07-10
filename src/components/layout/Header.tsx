import React from 'react';
import { Menu, Bell, Download } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onDownloadSchedule?: () => void;
  showDownload?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  onMenuClick,
  onDownloadSchedule,
  showDownload = false
}) => {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden p-2 mr-3 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadSchedule}
              className="flex items-center"
            >
              <Download size={16} className="mr-1" />
              Download Schedule
            </Button>
          )}
          
          <button
            type="button"
            className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="sr-only">View notifications</span>
            <Bell size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;