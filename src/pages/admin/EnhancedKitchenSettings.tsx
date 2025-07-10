import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import { Settings, Save, Clock, Users, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { kitchenRulesService } from '../../services/kitchenRulesService';
import { enhancedSmsService } from '../../services/enhancedSmsService';

const EnhancedKitchenSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kitchen' | 'sms' | 'publication'>('kitchen');
  const [isLoading, setIsLoading] = useState(false);
  
  // Kitchen Rules State
  const [kitchenRules, setKitchenRules] = useState({
    exclude_roles_cooking: [] as string[],
    exclude_roles_washing: [] as string[],
    day_restrictions: {} as any,
  });

  // SMS Configuration State
  const [smsConfig, setSmsConfig] = useState({
    provider: 'beem' as 'beem' | 'africas_talking',
    beem: {
      apiKey: '',
      secretKey: '',
      sourceAddr: 'YWAM DAR',
    },
    africas_talking: {
      username: '',
      apiKey: '',
      from: 'YWAM DAR',
    },
  });

  // Publication Settings State
  const [publicationSettings, setPublicationSettings] = useState({
    day: 5, // Friday
    hour: 17,
    minute: 45,
  });

  const allRoles = ['Admin', 'Staff', 'Missionary', 'Chef', 'WorkDutyManager', 'DTS', 'PraiseTeam', 'Friend'];
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const rules = await kitchenRulesService.loadRules();
      setKitchenRules({
        exclude_roles_cooking: rules.exclude_roles_cooking,
        exclude_roles_washing: rules.exclude_roles_washing,
        day_restrictions: rules.day_restrictions,
      });

      const pubTime = await kitchenRulesService.getPublicationTime();
      setPublicationSettings(pubTime);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleKitchenRulesChange = (field: string, value: any) => {
    setKitchenRules(prev => ({ ...prev, [field]: value }));
  };

  const handleDayRestrictionChange = (role: string, field: string, value: any) => {
    setKitchenRules(prev => ({
      ...prev,
      day_restrictions: {
        ...prev.day_restrictions,
        [role]: {
          ...prev.day_restrictions[role],
          [field]: value,
        },
      },
    }));
  };

  const saveKitchenRules = async () => {
    setIsLoading(true);
    try {
      await kitchenRulesService.updateRules(kitchenRules);
      toast.success('Kitchen rules updated successfully');
    } catch (error) {
      toast.error('Failed to update kitchen rules');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSmsConfig = async () => {
    setIsLoading(true);
    try {
      const config = smsConfig.provider === 'beem' ? smsConfig.beem : smsConfig.africas_talking;
      await enhancedSmsService.updateConfiguration(smsConfig.provider, config);
      toast.success('SMS configuration updated successfully');
    } catch (error) {
      toast.error('Failed to update SMS configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const savePublicationSettings = async () => {
    setIsLoading(true);
    try {
      await kitchenRulesService.updatePublicationTime(
        publicationSettings.day,
        publicationSettings.hour,
        publicationSettings.minute
      );
      toast.success('Publication settings updated successfully');
    } catch (error) {
      toast.error('Failed to update publication settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testSmsConnection = async () => {
    try {
      // Test SMS by sending to admin
      await enhancedSmsService.sendSMS('+255123456789', 'Test message from YWAM DAR Management System');
      toast.success('SMS test sent successfully');
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
          <p className="text-gray-600">Configure kitchen rules, SMS, and publication settings</p>
        </div>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          className={activeTab === 'kitchen' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('kitchen')}
        >
          <Users size={16} className="inline mr-2" />
          Kitchen Rules
        </button>
        <button
          className={activeTab === 'sms' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('sms')}
        >
          <Settings size={16} className="inline mr-2" />
          SMS Configuration
        </button>
        <button
          className={activeTab === 'publication' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('publication')}
        >
          <Clock size={16} className="inline mr-2" />
          Publication Settings
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'kitchen' && (
          <div className="space-y-6">
            <Card title="Role Exclusions">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclude from Cooking
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {allRoles.map(role => (
                      <Checkbox
                        key={role}
                        label={role}
                        checked={kitchenRules.exclude_roles_cooking.includes(role)}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...kitchenRules.exclude_roles_cooking, role]
                            : kitchenRules.exclude_roles_cooking.filter(r => r !== role);
                          handleKitchenRulesChange('exclude_roles_cooking', newRoles);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclude from Washing Dishes
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {allRoles.map(role => (
                      <Checkbox
                        key={role}
                        label={role}
                        checked={kitchenRules.exclude_roles_washing.includes(role)}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...kitchenRules.exclude_roles_washing, role]
                            : kitchenRules.exclude_roles_washing.filter(r => r !== role);
                          handleKitchenRulesChange('exclude_roles_washing', newRoles);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Day Restrictions by Role">
              <div className="space-y-6">
                {['DTS', 'PraiseTeam'].map(role => (
                  <div key={role} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">{role} Restrictions</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exclude Days
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                          {daysOfWeek.map(day => (
                            <Checkbox
                              key={day.value}
                              label={day.label}
                              checked={kitchenRules.day_restrictions[role]?.excludeDays?.includes(day.value) || false}
                              onChange={(e) => {
                                const currentDays = kitchenRules.day_restrictions[role]?.excludeDays || [];
                                const newDays = e.target.checked
                                  ? [...currentDays, day.value]
                                  : currentDays.filter(d => d !== day.value);
                                handleDayRestrictionChange(role, 'excludeDays', newDays);
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exclude Meals
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['breakfast', 'lunch', 'dinner'].map(meal => (
                            <Checkbox
                              key={meal}
                              label={meal.charAt(0).toUpperCase() + meal.slice(1)}
                              checked={kitchenRules.day_restrictions[role]?.excludeMeals?.includes(meal) || false}
                              onChange={(e) => {
                                const currentMeals = kitchenRules.day_restrictions[role]?.excludeMeals || [];
                                const newMeals = e.target.checked
                                  ? [...currentMeals, meal]
                                  : currentMeals.filter(m => m !== meal);
                                handleDayRestrictionChange(role, 'excludeMeals', newMeals);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={saveKitchenRules}
                isLoading={isLoading}
                className="flex items-center"
              >
                <Save size={16} className="mr-2" />
                Save Kitchen Rules
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="space-y-6">
            <Card title="SMS Provider">
              <div className="space-y-4">
                <Select
                  label="SMS Provider"
                  value={smsConfig.provider}
                  onChange={(value) => setSmsConfig(prev => ({ ...prev, provider: value as any }))}
                  options={[
                    { value: 'beem', label: 'Beem Africa' },
                    { value: 'africas_talking', label: 'Africa\'s Talking' },
                  ]}
                  fullWidth
                />

                {smsConfig.provider === 'beem' && (
                  <div className="space-y-4">
                    <Input
                      label="API Key"
                      value={smsConfig.beem.apiKey}
                      onChange={(e) => setSmsConfig(prev => ({
                        ...prev,
                        beem: { ...prev.beem, apiKey: e.target.value }
                      }))}
                      fullWidth
                    />
                    <Input
                      label="Secret Key"
                      type="password"
                      value={smsConfig.beem.secretKey}
                      onChange={(e) => setSmsConfig(prev => ({
                        ...prev,
                        beem: { ...prev.beem, secretKey: e.target.value }
                      }))}
                      fullWidth
                    />
                    <Input
                      label="Source Address"
                      value={smsConfig.beem.sourceAddr}
                      onChange={(e) => setSmsConfig(prev => ({
                        ...prev,
                        beem: { ...prev.beem, sourceAddr: e.target.value }
                      }))}
                      fullWidth
                    />
                  </div>
                )}

                {smsConfig.provider === 'africas_talking' && (
                  <div className="space-y-4">
                    <Input
                      label="Username"
                      value={smsConfig.africas_talking.username}
                      onChange={(e) => setSmsConfig(prev => ({
                        ...prev,
                        africas_talking: { ...prev.africas_talking, username: e.target.value }
                      }))}
                      fullWidth
                    />
                    <Input
                      label="API Key"
                      type="password"
                      value={smsConfig.africas_talking.apiKey}
                      onChange={(e) => setSmsConfig(prev => ({
                        ...prev,
                        africas_talking: { ...prev.africas_talking, apiKey: e.target.value }
                      }))}
                      fullWidth
                    />
                    <Input
                      label="From"
                      value={smsConfig.africas_talking.from}
                      onChange={(e) => setSmsConfig(prev => ({
                        ...prev,
                        africas_talking: { ...prev.africas_talking, from: e.target.value }
                      }))}
                      fullWidth
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={testSmsConnection}
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveSmsConfig}
                    isLoading={isLoading}
                    className="flex items-center"
                  >
                    <Save size={16} className="mr-2" />
                    Save SMS Config
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'publication' && (
          <div className="space-y-6">
            <Card title="Schedule Publication Time">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Set when kitchen schedules become read-only and published to all users.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Day of Week"
                    value={publicationSettings.day.toString()}
                    onChange={(value) => setPublicationSettings(prev => ({ ...prev, day: parseInt(value) }))}
                    options={daysOfWeek.map(day => ({ value: day.value.toString(), label: day.label }))}
                    fullWidth
                  />

                  <Input
                    label="Hour (24-hour format)"
                    type="number"
                    min="0"
                    max="23"
                    value={publicationSettings.hour}
                    onChange={(e) => setPublicationSettings(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                    fullWidth
                  />

                  <Input
                    label="Minute"
                    type="number"
                    min="0"
                    max="59"
                    value={publicationSettings.minute}
                    onChange={(e) => setPublicationSettings(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
                    fullWidth
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Current Setting:</strong> Schedules will be published every{' '}
                    {daysOfWeek.find(d => d.value === publicationSettings.day)?.label} at{' '}
                    {String(publicationSettings.hour).padStart(2, '0')}:{String(publicationSettings.minute).padStart(2, '0')}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={savePublicationSettings}
                    isLoading={isLoading}
                    className="flex items-center"
                  >
                    <Save size={16} className="mr-2" />
                    Save Publication Settings
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnhancedKitchenSettings;