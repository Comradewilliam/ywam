import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import { mockApi } from '../../mock/mockData';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PhotoUpload from '../../components/profile/PhotoUpload';
import { User, Phone, Mail, Cake, GraduationCap, Building, Lock, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate, isValidPhoneNumber } from '../../utils/helpers';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const pushNotifications = usePushNotifications();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    phoneNumber: user?.phoneNumber || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  if (!user) return null;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async () => {
    if (!isValidPhoneNumber(formData.phoneNumber)) {
      toast.error('Phone number must start with +255 followed by 9 digits');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update user data
      const updatedUser = await mockApi.updateUser(user.id, {
        ...user,
        phoneNumber: formData.phoneNumber,
      });
      
      dispatch(updateUser(updatedUser));
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (!passwordData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Mock password change
      setTimeout(() => {
        toast.success('Password changed successfully');
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Failed to change password');
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!pushNotifications.isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    if (pushNotifications.isSubscribed) {
      await pushNotifications.unsubscribe();
    } else {
      const hasPermission = await pushNotifications.requestPermission();
      if (hasPermission) {
        await pushNotifications.subscribe();
      }
    }
  };
  
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">View and manage your YWAM DAR account information</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="lg:col-span-1"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <div className="flex flex-col items-center text-center">
              <PhotoUpload />
              
              <h2 className="text-xl font-bold text-gray-900 mt-4">{user.firstName} {user.lastName}</h2>
              
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {user.roles.map((role) => (
                  <Badge key={role} variant="primary">
                    {role}
                  </Badge>
                ))}
              </div>
              
              <div className="mt-6 space-y-2 w-full">
                <div className="flex items-center justify-center text-gray-600">
                  <Phone size={18} className="mr-2" />
                  <span>{user.phoneNumber}</span>
                </div>
                
                {user.email && (
                  <div className="flex items-center justify-center text-gray-600">
                    <Mail size={18} className="mr-2" />
                    <span>{user.email}</span>
                  </div>
                )}
                
                {user.username && (
                  <div className="flex items-center justify-center text-gray-600">
                    <User size={18} className="mr-2" />
                    <span>@{user.username}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-center text-gray-600">
                  <Cake size={18} className="mr-2" />
                  <span>Born on {formatDate(user.dateOfBirth)}</span>
                </div>
              </div>
              
              <div className="mt-6 w-full space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setIsChangingPassword(false);
                  }}
                  fullWidth
                >
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(!isChangingPassword);
                    setIsEditing(false);
                  }}
                  fullWidth
                >
                  {isChangingPassword ? 'Cancel' : 'Change Password'}
                </Button>

                {pushNotifications.isSupported && (
                  <Button
                    variant="outline"
                    onClick={handleNotificationToggle}
                    fullWidth
                    className="flex items-center justify-center"
                  >
                    <Bell size={16} className="mr-2" />
                    {pushNotifications.isSubscribed ? 'Disable' : 'Enable'} Notifications
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div 
          className="lg:col-span-2"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          {isEditing ? (
            <Card title="Edit Profile">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Input
                      value={user.firstName}
                      disabled
                      fullWidth
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Contact an administrator to change your name
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      value={user.lastName}
                      disabled
                      fullWidth
                    />
                  </div>
                </div>
                
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+255123456789"
                  fullWidth
                />
                
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          ) : isChangingPassword ? (
            <Card title="Change Password">
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                />
                
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                />
                
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                />
                
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsChangingPassword(false)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleChangePassword}
                    isLoading={isLoading}
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card title="Personal Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">First Name</p>
                      <p className="mt-1">{user.firstName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Name</p>
                      <p className="mt-1">{user.lastName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gender</p>
                      <p className="mt-1">{user.gender}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="mt-1">{formatDate(user.dateOfBirth)}</p>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card title="Educational Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Building size={20} className="mt-0.5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">University</p>
                        <p className="mt-1">{user.university}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <GraduationCap size={20} className="mt-0.5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Course</p>
                        <p className="mt-1">{user.course}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card title="Account Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <User size={20} className="mt-0.5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Username</p>
                        <p className="mt-1">{user.username || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail size={20} className="mt-0.5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1">{user.email || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone size={20} className="mt-0.5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p className="mt-1">{user.phoneNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Lock size={20} className="mt-0.5 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Password</p>
                        <p className="mt-1">••••••••</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsChangingPassword(true)}
                          className="mt-2"
                        >
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              {pushNotifications.isSupported && (
                <Card title="Notification Settings">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Push Notifications</p>
                        <p className="text-sm text-gray-500">
                          Receive notifications for schedule reminders and important updates
                        </p>
                      </div>
                      <Button
                        variant={pushNotifications.isSubscribed ? 'primary' : 'outline'}
                        onClick={handleNotificationToggle}
                        className="flex items-center"
                      >
                        <Bell size={16} className="mr-2" />
                        {pushNotifications.isSubscribed ? 'Enabled' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              
              <Card title="Role Information">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Your assigned roles in the YWAM DAR system:</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map(role => (
                      <Badge 
                        key={role} 
                        variant={
                          role === 'Admin' ? 'primary' :
                          role === 'Staff' ? 'secondary' :
                          role === 'Missionary' ? 'success' :
                          role === 'Chef' ? 'warning' :
                          role === 'WorkDutyManager' ? 'danger' : 'default'
                        }
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    For role changes, please contact an administrator.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;