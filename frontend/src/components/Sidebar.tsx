import React, { useState } from 'react';
import { Avatar } from '@heroui/avatar';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DashboardIcon, UserIcon, WalletIcon, TaskIcon, LogoutIcon } from '@/components/icons';
import UserProfile from '@/components/UserProfile';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon },
    { id: 'tasks', label: 'My Tasks', icon: TaskIcon },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 lg:relative lg:translate-x-0 lg:w-80
      `}>
        <div className="p-6">
          {/* User Profile Section */}
          <div 
            className="flex items-center space-x-4 mb-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors duration-200"
            onClick={() => setIsProfileOpen(true)}
          >
            <Avatar
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              size="lg"
              className="shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">{user?.username}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user?.email}</p>
              <div className="flex items-center space-x-1 mt-1">
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${user?.role === 'OYAKATASAMA' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                    user?.role === 'HASHIRA' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}
                `}>
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to edit profile</p>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-4 text-white mb-6">
            <p className="text-sm opacity-90">Current Balance</p>
            <p className="text-2xl font-bold">${user?.balance?.toFixed(2) || '0.00'}</p>
          </div>

          <Divider className="my-4" />

          {/* Menu Items */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="light"
                className={`
                  w-full justify-start h-12 px-4 transition-all duration-200
                  ${hoveredItem === item.id ? 'bg-primary-50 dark:bg-primary-900/20 scale-105' : ''}
                `}
                startContent={
                  <item.icon 
                    className={`text-xl transition-colors duration-200 ${
                      hoveredItem === item.id ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                    }`} 
                  />
                }
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span className={`transition-colors duration-200 ${
                  hoveredItem === item.id ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {item.label}
                </span>
              </Button>
            ))}
          </nav>

          <Divider className="my-4" />

          {/* Theme Toggle */}
          <Button
            variant="light"
            className={`
              w-full justify-start h-12 px-4 transition-all duration-200
              ${hoveredItem === 'theme' ? 'bg-primary-50 dark:bg-primary-900/20 scale-105' : ''}
            `}
            startContent={
              <span className={`text-xl transition-colors duration-200 ${
                hoveredItem === 'theme' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
            }
            onMouseEnter={() => setHoveredItem('theme')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={toggleTheme}
          >
            <span className={`transition-colors duration-200 ${
              hoveredItem === 'theme' ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </Button>

          <Divider className="my-4" />

          {/* Logout Button */}
          <Button
            variant="light"
            color="danger"
            className={`
              w-full justify-start h-12 px-4 transition-all duration-200
              ${hoveredItem === 'logout' ? 'bg-danger-50 dark:bg-danger-900/20 scale-105' : ''}
            `}
            startContent={
              <LogoutIcon 
                className={`text-xl transition-colors duration-200 ${
                  hoveredItem === 'logout' ? 'text-danger' : 'text-gray-600 dark:text-gray-400'
                }`} 
              />
            }
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={handleLogout}
          >
            <span className={`transition-colors duration-200 ${
              hoveredItem === 'logout' ? 'text-danger font-medium' : 'text-gray-700 dark:text-gray-300'
            }`}>
              Logout
            </span>
          </Button>
        </div>

        {/* Close button for mobile */}
        <Button
          isIconOnly
          variant="light"
          className="absolute top-4 right-4 lg:hidden"
          onClick={onClose}
        >
          ×
        </Button>
      </div>

      {/* User Profile Modal */}
      <UserProfile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};

export default Sidebar;