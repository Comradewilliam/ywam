import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import { Settings, Save, RefreshCw, Shield, Bell, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { backupService, BackupConfig } from '../../services/backupService';
import { smsService } from '../../services/smsService';

interface SystemConfig {
  siteName: string;
  adminEmail: string;
  timezone: string;
  dateFormat: string;
  enableNotifications: boolean;
  enableSMS: boolean;
  maintenanceMode: boolean;
  maxUsersPerRole: number;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  smsConfig: {
    provider: string;
    apiKey: string;
    sourceAddr: string;
  };
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'backup'>('general');
  const [isLoading, setIsLoading] = useState(false);
  
  const [config, setConfig] = useState<SystemConfig>({
    siteName: 'YWAM DAR Management System',
    adminEmail: 'admin@ywamdar.org',
    timezone: 'Africa/Dar_es_Salaam',
    dateFormat: 'DD/MM/YYYY',
    enableNotifications: true,
    enableSMS: true,
    maintenanceMode: false,
    maxUsersPerRole: 100,
    sessionTimeout: 24,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    smsConfig: {
      provider: 'beem',
      apiKey: '',
      sourceAddr: 'YWAM DAR',
    },
  });

  const [backupConfig, setBackupConfig] = useState<BackupConfig>(backupService.getConfig());

  const handleConfigChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof SystemConfig],
          [child]: value,
        },
      }));
    } else {
      setConfig(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBackupConfigChange = (field: keyof BackupConfig, value: any) => {
    setBackupConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update backup service config
      backupService.updateConfig(backupConfig);
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testSMSConnection = async () => {
    try {
      // Test SMS configuration
      const testMessage = await smsService.sendSMS(
        config.adminEmail, 
        'Test message from YWAM DAR Management System'
      );
      
      if (testMessage.status === 'sent') {
        toast.success('SMS test successful');
      } else {
        toast.error('SMS test failed: ' + testMessage.errorMessage);
      }
    } catch (error) {
      toast.error('SMS test failed');
    }
  };

  const tabStyles = {
    active: "px-4 py-2 font-medium rounded-md bg-blue-600 text-white",
    inactive: "px-4 py-2 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        
        <Button
          variant="primary"
          onClick={saveSettings}
          isLoading={isLoading}
          className="flex items-center"
        >
          <Save size={16} className="mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          className={activeTab === 'general' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('general')}
        >
          <Settings size={16} className="inline mr-2" />
          General
        </button>
        <button
          className={activeTab === 'security' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} className="inline mr-2" />
          Security
        </button>
        <button
          className={activeTab === 'notifications' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} className="inline mr-2" />
          Notifications
        </button>
        <button
          className={activeTab === 'backup' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('backup')}
        >
          <Database size={16} className="inline mr-2" />
          Backup
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card title="General Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Site Name"
                  value={config.siteName}
                  onChange={(e) => handleConfigChange('siteName', e.target.value)}
                  fullWidth
                />
                
                <Input
                  label="Admin Email"
                  type="email"
                  value={config.adminEmail}
                  onChange={(e) => handleConfigChange('adminEmail', e.target.value)}
                  fullWidth
                />
                
                <Select
                  label="Timezone"
                  value={config.timezone}
                  onChange={(value) => handleConfigChange('timezone', value)}
                  options={[
                    { value: 'Africa/Dar_es_Salaam', label: 'Africa/Dar es Salaam' },
                    { value: 'UTC', label: 'UTC' },
                    { value: 'Africa/Nairobi', label: 'Africa/Nairobi' },
                  ]}
                  fullWidth
                />
                
                <Select
                  label="Date Format"
                  value={config.dateFormat}
                  onChange={(value) => handleConfigChange('dateFormat', value)}
                  options={[
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                  ]}
                  fullWidth
                />
                
                <Input
                  label="Max Users Per Role"
                  type="number"
                  value={config.maxUsersPerRole}
                  onChange={(e) => handleConfigChange('maxUsersPerRole', parseInt(e.target.value))}
                  fullWidth
                />
                
                <Input
                  label="Session Timeout (hours)"
                  type="number"
                  value={config.sessionTimeout}
                  onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                  fullWidth
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <Checkbox
                  label="Enable Notifications"
                  checked={config.enableNotifications}
                  onChange={(e) => handleConfigChange('enableNotifications', e.target.checked)}
                />
                
                <Checkbox
                  label="Maintenance Mode"
                  checked={config.maintenanceMode}
                  onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card title="Password Policy">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Minimum Length"
                  type="number"
                  value={config.passwordPolicy.minLength}
                  onChange={(e) => handleConfigChange('passwordPolicy.minLength', parseInt(e.target.value))}
                  fullWidth
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <Checkbox
                  label="Require Uppercase Letters"
                  checked={config.passwordPolicy.requireUppercase}
                  onChange={(e) => handleConfigChange('passwordPolicy.requireUppercase', e.target.checked)}
                />
                
                <Checkbox
                  label="Require Lowercase Letters"
                  checked={config.passwordPolicy.requireLowercase}
                  onChange={(e) => handleConfigChange('passwordPolicy.requireLowercase', e.target.checked)}
                />
                
                <Checkbox
                  label="Require Numbers"
                  checked={config.passwordPolicy.requireNumbers}
                  onChange={(e) => handleConfigChange('passwordPolicy.requireNumbers', e.target.checked)}
                />
                
                <Checkbox
                  label="Require Special Characters"
                  checked={config.passwordPolicy.requireSpecialChars}
                  onChange={(e) => handleConfigChange('passwordPolicy.requireSpecialChars', e.target.checked)}
                />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card title="SMS Configuration">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="SMS Provider"
                  value={config.smsConfig.provider}
                  onChange={(value) => handleConfigChange('smsConfig.provider', value)}
                  options={[
                    { value: 'beem', label: 'Beem Africa' },
                    { value: 'twilio', label: 'Twilio' },
                  ]}
                  fullWidth
                />
                
                <Input
                  label="Source Address"
                  value={config.smsConfig.sourceAddr}
                  onChange={(e) => handleConfigChange('smsConfig.sourceAddr', e.target.value)}
                  fullWidth
                />
                
                <Input
                  label="API Key"
                  type="password"
                  value={config.smsConfig.apiKey}
                  onChange={(e) => handleConfigChange('smsConfig.apiKey', e.target.value)}
                  fullWidth
                />
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Checkbox
                  label="Enable SMS Notifications"
                  checked={config.enableSMS}
                  onChange={(e) => handleConfigChange('enableSMS', e.target.checked)}
                />
                
                <Button
                  variant="outline"
                  onClick={testSMSConnection}
                  className="ml-4"
                >
                  Test SMS
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <Card title="Backup Configuration">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Backup Interval"
                  value={backupConfig.backupInterval}
                  onChange={(value) => handleBackupConfigChange('backupInterval', value)}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  fullWidth
                />
                
                <Input
                  label="Max Backups to Keep"
                  type="number"
                  value={backupConfig.maxBackups}
                  onChange={(e) => handleBackupConfigChange('maxBackups', parseInt(e.target.value))}
                  fullWidth
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <Checkbox
                  label="Enable Auto Backup"
                  checked={backupConfig.autoBackup}
                  onChange={(e) => handleBackupConfigChange('autoBackup', e.target.checked)}
                />
                
                <Checkbox
                  label="Include User Data"
                  checked={backupConfig.includeUserData}
                  onChange={(e) => handleBackupConfigChange('includeUserData', e.target.checked)}
                />
                
                <Checkbox
                  label="Include Schedules"
                  checked={backupConfig.includeSchedules}
                  onChange={(e) => handleBackupConfigChange('includeSchedules', e.target.checked)}
                />
                
                <Checkbox
                  label="Include Messages"
                  checked={backupConfig.includeMessages}
                  onChange={(e) => handleBackupConfigChange('includeMessages', e.target.checked)}
                />
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SystemSettings;