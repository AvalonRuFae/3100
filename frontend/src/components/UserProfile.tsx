import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
// Switch component replacement
const Switch: React.FC<{
  children: React.ReactNode;
  isSelected: boolean;
  onValueChange: (value: boolean) => void;
  isDisabled?: boolean;
}> = ({ children, isSelected, onValueChange, isDisabled }) => (
  <div className="flex items-center justify-between py-2">
    <span className={`${isDisabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
      {children}
    </span>
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onValueChange(!isSelected)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${isSelected ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${isSelected ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  </div>
);
import { Avatar } from '@heroui/avatar';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserIcon, WalletIcon, EyeFilledIcon, EyeSlashFilledIcon } from '@/components/icons';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, logout, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // Editable user data - only real fields from backend
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: '',
    profilePicture: ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSave = () => {
    // In a real app, this would make an API call to update the user
    console.log('Saving user data:', formData);
    setEditMode(false);
    // Show success message
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (securityData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    const result = await changePassword(securityData.currentPassword, securityData.newPassword);
    
    if (result.success) {
      setPasswordSuccess('Password changed successfully!');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } else {
      setPasswordError(result.message || 'Failed to change password');
    }
  };

  const timezones = [
    { key: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { key: 'America/Denver', label: 'Mountain Time (MT)' },
    { key: 'America/Chicago', label: 'Central Time (CT)' },
    { key: 'America/New_York', label: 'Eastern Time (ET)' },
    { key: 'UTC', label: 'UTC' },
    { key: 'Europe/London', label: 'GMT' },
    { key: 'Europe/Paris', label: 'CET' },
    { key: 'Asia/Tokyo', label: 'JST' }
  ];

  const languages = [
    { key: 'English', label: 'English' },
    { key: 'Spanish', label: 'Español' },
    { key: 'French', label: 'Français' },
    { key: 'German', label: 'Deutsch' },
    { key: 'Japanese', label: '日本語' },
    { key: 'Chinese', label: '中文' }
  ];

  if (!isOpen) return null;
  
  // Safety check
  if (!user) {
    console.error('UserProfile: No user data available');
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Static Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white rounded-t-lg flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <Avatar
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                size="lg"
                className="border-2 border-white"
              />
              <div>
                <h2 className="text-2xl font-bold">{formData.username}</h2>
                <p className="opacity-90">{formData.email}</p>
                <p className="text-sm opacity-80">{user?.role}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {/* Theme Toggle */}
              <Button
                isIconOnly
                variant="light"
                className="text-white"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
              <Button
                variant="light"
                className="text-white"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button
                isIconOnly
                variant="light"
                className="text-white"
                onClick={onClose}
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-1 min-h-0">
          {/* Scrollable Profile Content */}
          <div className="flex-1 overflow-y-auto">

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserIcon className="text-primary" />
                    Basic Information
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Username"
                      value={formData.username}
                      isReadOnly
                      variant="flat"
                      description="Username cannot be changed"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                    <Input
                      label="Role"
                      value={user?.role || ''}
                      isReadOnly
                      variant="flat"
                      description="Role is assigned by administrator"
                    />
                    <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Current Balance</p>
                        <p className="text-2xl font-bold text-success">${user?.balance ? Number(user.balance).toFixed(2) : '0.00'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      disabled={!editMode}
                      placeholder="Tell us about yourself..."
                      className={`
                        w-full p-3 rounded-lg min-h-[100px] resize-none
                        ${editMode 
                          ? 'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800' 
                          : 'bg-gray-100 dark:bg-gray-800 border-0'
                        }
                        text-gray-900 dark:text-gray-100
                      `}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Account Statistics */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Account Information</h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">User ID</span>
                    <span className="font-semibold">#{user?.id}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">Team ID</span>
                    <span className="font-semibold">{user?.teamId ? `#${user.teamId}` : 'No team assigned'}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">Account Status</span>
                    <span className="px-3 py-1 bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </CardBody>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Security</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  {editMode && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Change Password</h4>
                      
                      {passwordError && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                          {passwordError}
                        </div>
                      )}
                      
                      {passwordSuccess && (
                        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                          {passwordSuccess}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          label="Current Password"
                          type={isPasswordVisible ? "text" : "password"}
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                          endContent={
                            <button
                              className="focus:outline-none"
                              type="button"
                              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            >
                              {isPasswordVisible ? (
                                <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                              ) : (
                                <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                              )}
                            </button>
                          }
                        />
                        <Input
                          label="New Password"
                          type={isPasswordVisible ? "text" : "password"}
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                        />
                        <Input
                          label="Confirm New Password"
                          type={isPasswordVisible ? "text" : "password"}
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                        />
                        <Button
                          color="primary"
                          onClick={handlePasswordChange}
                          isDisabled={!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword}
                        >
                          Change Password
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Action Buttons */}
              {editMode && (
                <div className="flex justify-end space-x-3">
                  <Button variant="light" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
