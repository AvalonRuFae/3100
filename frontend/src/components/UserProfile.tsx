import React, { useState } from 'react';
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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Editable user data
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate developer with 3+ years of experience in React and Node.js. Love solving complex problems and learning new technologies.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    company: 'Tech Innovations Inc.',
    jobTitle: 'Full Stack Developer',
    timezone: 'America/Los_Angeles',
    language: 'English',
    notifications: {
      email: true,
      push: true,
      taskReminders: true,
      bountyAlerts: true,
      weeklyReports: false
    },
    privacy: {
      profileVisible: true,
      emailVisible: false,
      phoneVisible: false,
      statsVisible: true
    },
    preferences: {
      autoAssignTasks: false,
      receiveNewsletters: true,
      twoFactorAuth: false
    }
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = () => {
    // In a real app, this would make an API call to update the user
    console.log('Saving user data:', formData);
    setEditMode(false);
    // Show success message
  };

  const handlePasswordChange = () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // In a real app, this would make an API call to change password
    console.log('Changing password');
    setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteAccount = () => {
    // In a real app, this would make an API call to delete the account
    console.log('Deleting account');
    logout();
    onDeleteClose();
    onClose();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
                <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
                <p className="opacity-90">@{formData.username}</p>
                <p className="text-sm opacity-80">{formData.jobTitle} at {formData.company}</p>
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
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                    <Input
                      label="Username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
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
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                    <Input
                      label="Location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                  </div>
                  <Input
                    label="Bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    isReadOnly={!editMode}
                    variant={editMode ? "bordered" : "flat"}
                    description="Tell us about yourself and your experience"
                  />
                </CardBody>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <WalletIcon className="text-primary" />
                    Professional Information
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                    <Input
                      label="Job Title"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                    <Input
                      label="Website"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      isReadOnly={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="font-semibold">Current Balance</p>
                        <p className="text-2xl font-bold text-success">${user?.balance?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Preferences & Settings */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Preferences & Settings</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Timezone"
                      selectedKeys={[formData.timezone]}
                      onSelectionChange={(keys) => setFormData({...formData, timezone: Array.from(keys)[0] as string})}
                      isDisabled={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    >
                      {timezones.map((tz) => (
                        <SelectItem key={tz.key}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Language"
                      selectedKeys={[formData.language]}
                      onSelectionChange={(keys) => setFormData({...formData, language: Array.from(keys)[0] as string})}
                      isDisabled={!editMode}
                      variant={editMode ? "bordered" : "flat"}
                    >
                      {languages.map((lang) => (
                        <SelectItem key={lang.key}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <Divider />

                  {/* Notification Settings */}
                  <div>
                    <h4 className="font-semibold mb-3">Notification Settings</h4>
                    <div className="space-y-3">
                      <Switch
                        isSelected={formData.notifications.email}
                        onValueChange={(checked) => setFormData({...formData, notifications: {...formData.notifications, email: checked}})}
                        isDisabled={!editMode}
                      >
                        Email Notifications
                      </Switch>
                      <Switch
                        isSelected={formData.notifications.push}
                        onValueChange={(checked) => setFormData({...formData, notifications: {...formData.notifications, push: checked}})}
                        isDisabled={!editMode}
                      >
                        Push Notifications
                      </Switch>
                      <Switch
                        isSelected={formData.notifications.taskReminders}
                        onValueChange={(checked) => setFormData({...formData, notifications: {...formData.notifications, taskReminders: checked}})}
                        isDisabled={!editMode}
                      >
                        Task Deadline Reminders
                      </Switch>
                      <Switch
                        isSelected={formData.notifications.bountyAlerts}
                        onValueChange={(checked) => setFormData({...formData, notifications: {...formData.notifications, bountyAlerts: checked}})}
                        isDisabled={!editMode}
                      >
                        New Bounty Alerts
                      </Switch>
                    </div>
                  </div>

                  <Divider />

                  {/* Privacy Settings */}
                  <div>
                    <h4 className="font-semibold mb-3">Privacy Settings</h4>
                    <div className="space-y-3">
                      <Switch
                        isSelected={formData.privacy.profileVisible}
                        onValueChange={(checked) => setFormData({...formData, privacy: {...formData.privacy, profileVisible: checked}})}
                        isDisabled={!editMode}
                      >
                        Make Profile Public
                      </Switch>
                      <Switch
                        isSelected={formData.privacy.emailVisible}
                        onValueChange={(checked) => setFormData({...formData, privacy: {...formData.privacy, emailVisible: checked}})}
                        isDisabled={!editMode}
                      >
                        Show Email Publicly
                      </Switch>
                      <Switch
                        isSelected={formData.privacy.statsVisible}
                        onValueChange={(checked) => setFormData({...formData, privacy: {...formData.privacy, statsVisible: checked}})}
                        isDisabled={!editMode}
                      >
                        Show Performance Stats
                      </Switch>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Security</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="space-y-3">
                    <Switch
                      isSelected={formData.preferences.twoFactorAuth}
                      onValueChange={(checked) => setFormData({...formData, preferences: {...formData.preferences, twoFactorAuth: checked}})}
                      isDisabled={!editMode}
                    >
                      Two-Factor Authentication
                    </Switch>
                  </div>

                  {editMode && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold">Change Password</h4>
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
                <div className="flex justify-between">
                  <Button color="danger" variant="light" onClick={onDeleteOpen}>
                    Delete Account
                  </Button>
                  <div className="flex space-x-3">
                    <Button variant="light" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button color="primary" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Delete Account</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <p className="text-danger">All your tasks, progress, and earnings will be permanently lost.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteAccount}>
              Delete Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default UserProfile;
