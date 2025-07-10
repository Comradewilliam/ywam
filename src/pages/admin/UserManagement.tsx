import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { fetchUsersStart, fetchUsersSuccess, fetchUsersFailure, addUser, updateUser, deleteUser } from '../../store/slices/usersSlice';
import { mockApi } from '../../mock/mockData';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Plus, Edit, Trash2, Search, Key, Upload, Download, Filter } from 'lucide-react';
import { User, UserRole } from '../../types';
import { universityOptions } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsService } from '../../services/analyticsService';

const UserManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { users, isLoading } = useSelector((state: RootState) => state.users);
  
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    roles: [] as string[],
    universities: [] as string[],
    gender: '',
    dateRange: { start: '', end: '' },
  });
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsUser, setCredentialsUser] = useState<User | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '+255',
    gender: 'Male',
    university: '',
    course: '',
    dateOfBirth: '',
    roles: [] as UserRole[],
    username: '',
    password: '',
  });
  
  // Modal state
  const [modalData, setModalData] = useState({
    username: '',
    password: '',
  });
  
  useEffect(() => {
    const fetchUsers = async () => {
      dispatch(fetchUsersStart());
      
      try {
        const data = await mockApi.getUsers();
        dispatch(fetchUsersSuccess(data));
      } catch (error) {
        dispatch(fetchUsersFailure('Failed to fetch users'));
        toast.error('Failed to load users');
      }
    };
    
    fetchUsers();
  }, [dispatch]);
  
  useEffect(() => {
    // Apply advanced search and filtering
    const result = analyticsService.searchUsers(users, searchTerm, filters);
    setFilteredUsers(result);
  }, [users, searchTerm, filters]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (role: UserRole, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, roles: [...prev.roles, role] }));
    } else {
      setFormData(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role) }));
    }
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '+255',
      gender: 'Male',
      university: '',
      course: '',
      dateOfBirth: '',
      roles: [],
      username: '',
      password: '',
    });
    setEditingUser(null);
  };
  
  const handleAddUser = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phoneNumber ||
      !formData.gender ||
      !formData.university ||
      !formData.course ||
      !formData.dateOfBirth ||
      formData.roles.length === 0
    ) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Convert names to uppercase as per requirements
    const userData = {
      ...formData,
      firstName: formData.firstName.toUpperCase(),
      lastName: formData.lastName.toUpperCase(),
      course: formData.course.toUpperCase(),
    };
    
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await mockApi.updateUser(editingUser.id, userData);
        dispatch(updateUser(updatedUser));
        toast.success('User updated successfully');
      } else {
        // Create new user
        const newUser = await mockApi.createUser(userData as any);
        dispatch(addUser(newUser));
        toast.success('User added successfully');
        
        // Show credentials modal for newly created user
        if (userData.roles.some(role => role !== 'Friend')) {
          setCredentialsUser(newUser);
          setModalData({
            username: userData.username || newUser.lastName.toLowerCase(),
            password: userData.password || `${newUser.lastName.toLowerCase()}@123`,
          });
          setShowCredentialsModal(true);
        }
      }
      
      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error(editingUser ? 'Failed to update user' : 'Failed to add user');
    }
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      university: user.university,
      course: user.course,
      dateOfBirth: user.dateOfBirth,
      roles: user.roles,
      username: user.username || '',
      password: '',
    });
    setShowForm(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await mockApi.deleteUser(userId);
        dispatch(deleteUser(userId));
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };
  
  const handleSetCredentials = (user: User) => {
    setCredentialsUser(user);
    setModalData({
      username: user.username || user.lastName.toLowerCase(),
      password: `${user.lastName.toLowerCase()}@123`,
    });
    setShowCredentialsModal(true);
  };
  
  const saveCredentials = async () => {
    if (!credentialsUser) return;
    
    try {
      const updatedUser = await mockApi.updateUser(credentialsUser.id, {
        username: modalData.username,
      });
      dispatch(updateUser(updatedUser));
      toast.success('User credentials set successfully');
      setShowCredentialsModal(false);
    } catch (error) {
      toast.error('Failed to set user credentials');
    }
  };

  const exportUsers = () => {
    const csvData = analyticsService.exportUserData(filteredUsers, 'csv');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ywam-dar-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setIsImporting(true);

    try {
      const text = await importFile.text();
      const result = await analyticsService.importUsers(text);

      if (result.success.length > 0) {
        // Add successful imports to the store
        result.success.forEach(user => {
          dispatch(addUser(user));
        });
        
        toast.success(`Successfully imported ${result.success.length} users`);
      }

      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
        toast.warning(`${result.errors.length} rows had errors. Check console for details.`);
      }

      setShowBulkImport(false);
      setImportFile(null);
    } catch (error) {
      toast.error('Failed to import users');
    } finally {
      setIsImporting(false);
    }
  };
  
  const allRoles: UserRole[] = [
    'Admin', 'Staff', 'Missionary', 'Chef', 'WorkDutyManager', 'DTS', 'PraiseTeam', 'Friend'
  ];

  const uniqueUniversities = [...new Set(users.map(user => user.university))];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all YWAM DAR users and their roles</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="flex items-center"
          >
            <Upload size={16} className="mr-2" />
            Bulk Import
          </Button>
          <Button 
            variant="outline" 
            onClick={exportUsers}
            className="flex items-center"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="flex items-center"
          >
            {showForm ? 'Cancel' : <><Plus size={16} className="mr-2" /> Add New User</>}
          </Button>
        </div>
      </div>

      {/* Bulk Import Section */}
      <AnimatePresence>
        {showBulkImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card title="Bulk Import Users">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload a CSV file with user data. Required columns: firstname, lastname, phonenumber, gender, university, course, dateofbirth
                </p>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  <Button
                    variant="primary"
                    onClick={handleBulkImport}
                    isLoading={isImporting}
                    disabled={!importFile}
                  >
                    Import
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card title={editingUser ? 'Edit User' : 'Add New User'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name (will be displayed in UPPERCASE)"
                  required
                />
                
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name (will be displayed in UPPERCASE)"
                  required
                />
                
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+255123456789"
                  required
                />
                
                <Select
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                  ]}
                  required
                />
                
                <Select
                  label="University"
                  name="university"
                  value={formData.university}
                  onChange={(value) => setFormData(prev => ({ ...prev, university: value }))}
                  options={universityOptions.map(uni => ({ value: uni, label: uni }))}
                  required
                />
                
                <Input
                  label="Course"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="Course (will be displayed in UPPERCASE)"
                  required
                />
                
                <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {allRoles.map(role => (
                      <div key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`role-${role}`}
                          checked={formData.roles.includes(role)}
                          onChange={(e) => handleRoleChange(role, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`role-${role}`} className="ml-2 text-sm text-gray-700">
                          {role}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {formData.roles.some(role => role !== 'Friend') && (
                  <>
                    <Input
                      label="Username (for login)"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Automatically generated if empty"
                    />
                    
                    <Input
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Default: lastname@123"
                    />
                  </>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddUser}
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Card>
        {/* Advanced Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={16} className="text-gray-400" />
              </span>
              <Input
                placeholder="Search by name, email, phone, university, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              options={[
                { value: '', label: 'All Roles' },
                ...allRoles.map(role => ({ value: role, label: role }))
              ]}
              value={filters.roles[0] || ''}
              onChange={(value) => handleFilterChange('roles', value ? [value] : [])}
              className="w-full"
            />

            <Select
              options={[
                { value: '', label: 'All Universities' },
                ...uniqueUniversities.map(uni => ({ value: uni, label: uni }))
              ]}
              value={filters.universities[0] || ''}
              onChange={(value) => handleFilterChange('universities', value ? [value] : [])}
              className="w-full"
            />

            <Select
              options={[
                { value: '', label: 'All Genders' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' }
              ]}
              value={filters.gender}
              onChange={(value) => handleFilterChange('gender', value)}
              className="w-full"
            />

            <Button
              variant="outline"
              onClick={() => setFilters({ roles: [], universities: [], gender: '', dateRange: { start: '', end: '' } })}
              className="flex items-center"
            >
              <Filter size={16} className="mr-2" />
              Clear Filters
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phoneNumber}</div>
                      {user.username && <div className="text-sm text-gray-500">@{user.username}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.university}</div>
                      <div className="text-sm text-gray-500">{user.course}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
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
                            size="sm"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {user.roles.some(role => role !== 'Friend') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetCredentials(user)}
                            title="Set Login Credentials"
                          >
                            <Key size={16} />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Set Login Credentials</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set login credentials for {credentialsUser?.firstName} {credentialsUser?.lastName}
            </p>
            
            <Input
              label="Username"
              value={modalData.username}
              onChange={(e) => setModalData(prev => ({ ...prev, username: e.target.value }))}
              fullWidth
            />
            
            <Input
              label="Default Password"
              value={modalData.password}
              disabled
              fullWidth
              className="mt-4"
            />
            
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCredentialsModal(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveCredentials}
              >
                Save Credentials
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;