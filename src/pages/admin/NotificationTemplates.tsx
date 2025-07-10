import React, { useState, useEffect } from 'react';
import { systemSettingsService, NotificationTemplate, LectureSchedule } from '../../services/systemSettingsService';
import { smsService } from '../../services/smsService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { Plus, Edit, Trash2, Send, Calendar, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationTemplatesPage: React.FC = () => {
  const { users } = useSelector((state: RootState) => state.users);
  const [activeTab, setActiveTab] = useState<'templates' | 'send' | 'lectures'>('templates');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [lectures, setLectures] = useState<LectureSchedule[]>([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editingLecture, setEditingLecture] = useState<LectureSchedule | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  
  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    content: '',
    type: 'general' as 'welcome' | 'reminder' | 'meeting' | 'general',
    isActive: true
  });
  
  // Lecture form state
  const [lectureForm, setLectureForm] = useState({
    lecturerName: '',
    courseTitle: '',
    sessionTime: '',
    date: '',
    duration: 60,
    location: '',
    month: new Date().toISOString().substring(0, 7)
  });
  
  // Send notification state
  const [sendForm, setSendForm] = useState({
    templateId: '',
    recipients: [] as string[],
    customVariables: {} as Record<string, string>,
    scheduleDate: '',
    scheduleTime: ''
  });
  
  useEffect(() => {
    loadTemplates();
    loadLectures();
  }, []);
  
  const loadTemplates = () => {
    const allTemplates = systemSettingsService.getNotificationTemplates();
    setTemplates(allTemplates);
  };
  
  const loadLectures = () => {
    const allLectures = systemSettingsService.getLectureSchedules();
    setLectures(allLectures);
  };
  
  const handleTemplateSubmit = () => {
    if (!templateForm.name || !templateForm.title || !templateForm.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // Extract variables from content
      const variables = extractVariables(templateForm.content);
      
      if (editingTemplate) {
        const updated = systemSettingsService.updateNotificationTemplate(editingTemplate.id, {
          ...templateForm,
          variables
        });
        if (updated) {
          toast.success('Template updated successfully');
        }
      } else {
        systemSettingsService.createNotificationTemplate({
          ...templateForm,
          variables
        });
        toast.success('Template created successfully');
      }
      
      loadTemplates();
      resetTemplateForm();
      setShowTemplateForm(false);
    } catch (error) {
      toast.error('Failed to save template');
    }
  };
  
  const handleLectureSubmit = () => {
    if (!lectureForm.lecturerName || !lectureForm.courseTitle || !lectureForm.sessionTime || !lectureForm.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      if (editingLecture) {
        const updated = systemSettingsService.updateLectureSchedule(editingLecture.id, lectureForm);
        if (updated) {
          toast.success('Lecture updated successfully');
        }
      } else {
        systemSettingsService.createLectureSchedule(lectureForm);
        toast.success('Lecture scheduled successfully');
      }
      
      loadLectures();
      resetLectureForm();
      setShowLectureForm(false);
    } catch (error) {
      toast.error('Failed to save lecture');
    }
  };
  
  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const success = systemSettingsService.deleteNotificationTemplate(id);
      if (success) {
        toast.success('Template deleted successfully');
        loadTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    }
  };
  
  const handleDeleteLecture = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      const success = systemSettingsService.deleteLectureSchedule(id);
      if (success) {
        toast.success('Lecture deleted successfully');
        loadLectures();
      } else {
        toast.error('Failed to delete lecture');
      }
    }
  };
  
  const handleSendNotification = async () => {
    if (!sendForm.templateId || sendForm.recipients.length === 0) {
      toast.error('Please select a template and recipients');
      return;
    }
    
    try {
      const template = templates.find(t => t.id === sendForm.templateId);
      if (!template) {
        toast.error('Template not found');
        return;
      }
      
      const recipients = users.filter(u => sendForm.recipients.includes(u.id));
      
      await smsService.sendTemplatedSMS(
        template.id,
        recipients,
        sendForm.customVariables
      );
      
      toast.success(`Notification sent to ${recipients.length} recipients`);
      resetSendForm();
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };
  
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };
  
  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      title: '',
      content: '',
      type: 'general',
      isActive: true
    });
    setEditingTemplate(null);
  };
  
  const resetLectureForm = () => {
    setLectureForm({
      lecturerName: '',
      courseTitle: '',
      sessionTime: '',
      date: '',
      duration: 60,
      location: '',
      month: new Date().toISOString().substring(0, 7)
    });
    setEditingLecture(null);
  };
  
  const resetSendForm = () => {
    setSendForm({
      templateId: '',
      recipients: [],
      customVariables: {},
      scheduleDate: '',
      scheduleTime: ''
    });
  };
  
  const editTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      title: template.title,
      content: template.content,
      type: template.type,
      isActive: template.isActive
    });
    setShowTemplateForm(true);
  };
  
  const editLecture = (lecture: LectureSchedule) => {
    setEditingLecture(lecture);
    setLectureForm({
      lecturerName: lecture.lecturerName,
      courseTitle: lecture.courseTitle,
      sessionTime: lecture.sessionTime,
      date: lecture.date,
      duration: lecture.duration,
      location: lecture.location || '',
      month: lecture.month
    });
    setShowLectureForm(true);
  };
  
  const tabStyles = {
    active: "px-4 py-2 font-medium rounded-md bg-blue-600 text-white",
    inactive: "px-4 py-2 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
          <p className="text-gray-600">Manage notification templates, send messages, and schedule lectures</p>
        </div>
      </div>
      
      <div className="flex space-x-2 mb-6">
        <button
          className={activeTab === 'templates' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={activeTab === 'send' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('send')}
        >
          Send Notification
        </button>
        <button
          className={activeTab === 'lectures' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('lectures')}
        >
          <BookOpen size={16} className="inline mr-2" />
          Lecture Schedule
        </button>
      </div>
      
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  resetTemplateForm();
                  setShowTemplateForm(!showTemplateForm);
                }}
                className="flex items-center"
              >
                {showTemplateForm ? 'Cancel' : <><Plus size={16} className="mr-2" /> Add Template</>}
              </Button>
            </div>
            
            <AnimatePresence>
              {showTemplateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card title={editingTemplate ? 'Edit Template' : 'Create New Template'}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Template Name"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Welcome Message"
                          fullWidth
                        />
                        
                        <Select
                          label="Type"
                          value={templateForm.type}
                          onChange={(value) => setTemplateForm(prev => ({ ...prev, type: value as any }))}
                          options={[
                            { value: 'welcome', label: 'Welcome' },
                            { value: 'reminder', label: 'Reminder' },
                            { value: 'meeting', label: 'Meeting' },
                            { value: 'general', label: 'General' }
                          ]}
                          fullWidth
                        />
                      </div>
                      
                      <Input
                        label="Title"
                        value={templateForm.title}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Notification title"
                        fullWidth
                      />
                      
                      <Textarea
                        label="Content"
                        value={templateForm.content}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Use {{variableName}} for dynamic content. E.g., Hi {{firstName}}, ..."
                        rows={4}
                        fullWidth
                      />
                      
                      <div className="bg-blue-50 p-4 rounded-md">
                        <h4 className="font-medium text-blue-800 mb-2">Available Variables:</h4>
                        <div className="text-sm text-blue-700">
                          <p>• {{firstName}} - User's first name</p>
                          <p>• {{lastName}} - User's last name</p>
                          <p>• {{username}} - User's username</p>
                          <p>• {{password}} - User's password (for login credentials)</p>
                          <p>• {{mealType}} - Type of meal (for kitchen reminders)</p>
                          <p>• {{mealName}} - Name of meal</p>
                          <p>• {{role}} - User's role in kitchen duty</p>
                          <p>• {{meetingTitle}} - Meeting title</p>
                          <p>• {{location}} - Meeting location</p>
                          <p>• {{timeUntil}} - Time until event</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={templateForm.isActive}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="mr-2"
                        />
                        <label htmlFor="isActive" className="text-sm text-gray-700">
                          Active template
                        </label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            resetTemplateForm();
                            setShowTemplateForm(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleTemplateSubmit}
                        >
                          {editingTemplate ? 'Update' : 'Create'} Template
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Card title="Notification Templates">
              <div className="space-y-4">
                {templates.length > 0 ? (
                  templates.map(template => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">{template.name}</h3>
                            <Badge variant={template.type === 'welcome' ? 'success' : template.type === 'reminder' ? 'warning' : 'primary'}>
                              {template.type}
                            </Badge>
                            {template.isActive ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">{template.title}</p>
                          <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                          <div className="text-xs text-gray-500">
                            Variables: {template.variables.join(', ') || 'None'}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editTemplate(template)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No templates created yet. Click "Add Template" to create your first template.
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
        
        {activeTab === 'send' && (
          <Card title="Send Notification">
            <div className="space-y-4">
              <Select
                label="Select Template"
                value={sendForm.templateId}
                onChange={(value) => setSendForm(prev => ({ ...prev, templateId: value }))}
                options={[
                  { value: '', label: 'Choose a template' },
                  ...templates.filter(t => t.isActive).map(t => ({
                    value: t.id,
                    label: `${t.name} (${t.type})`
                  }))
                ]}
                fullWidth
              />
              
              {sendForm.templateId && (
                <div className="bg-gray-50 p-4 rounded-md">
                  {(() => {
                    const template = templates.find(t => t.id === sendForm.templateId);
                    return template ? (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">{template.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                        {template.variables.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Variables needed: {template.variables.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={sendForm.recipients.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSendForm(prev => ({
                                ...prev,
                                recipients: [...prev.recipients, user.id]
                              }));
                            } else {
                              setSendForm(prev => ({
                                ...prev,
                                recipients: prev.recipients.filter(id => id !== user.id)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.firstName} {user.lastName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Selected {sendForm.recipients.length} recipient(s)
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSendNotification}
                  className="flex items-center"
                  disabled={!sendForm.templateId || sendForm.recipients.length === 0}
                >
                  <Send size={16} className="mr-2" />
                  Send Notification
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        {activeTab === 'lectures' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
                  Select Month:
                </label>
                <input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <Button
                variant="primary"
                onClick={() => {
                  resetLectureForm();
                  setShowLectureForm(!showLectureForm);
                }}
                className="flex items-center"
              >
                {showLectureForm ? 'Cancel' : <><Plus size={16} className="mr-2" /> Add Lecture</>}
              </Button>
            </div>
            
            <AnimatePresence>
              {showLectureForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card title={editingLecture ? 'Edit Lecture' : 'Schedule New Lecture'}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Lecturer Name"
                          value={lectureForm.lecturerName}
                          onChange={(e) => setLectureForm(prev => ({ ...prev, lecturerName: e.target.value }))}
                          placeholder="e.g., Dr. John Smith"
                          fullWidth
                        />
                        
                        <Input
                          label="Course Title"
                          value={lectureForm.courseTitle}
                          onChange={(e) => setLectureForm(prev => ({ ...prev, courseTitle: e.target.value }))}
                          placeholder="e.g., Biblical Studies"
                          fullWidth
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Date"
                          type="date"
                          value={lectureForm.date}
                          onChange={(e) => setLectureForm(prev => ({ ...prev, date: e.target.value }))}
                          fullWidth
                        />
                        
                        <Input
                          label="Session Time"
                          type="time"
                          value={lectureForm.sessionTime}
                          onChange={(e) => setLectureForm(prev => ({ ...prev, sessionTime: e.target.value }))}
                          fullWidth
                        />
                        
                        <Input
                          label="Duration (minutes)"
                          type="number"
                          value={lectureForm.duration}
                          onChange={(e) => setLectureForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          min="15"
                          max="240"
                          fullWidth
                        />
                      </div>
                      
                      <Input
                        label="Location (Optional)"
                        value={lectureForm.location}
                        onChange={(e) => setLectureForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Main Hall, Room 101"
                        fullWidth
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            resetLectureForm();
                            setShowLectureForm(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleLectureSubmit}
                        >
                          {editingLecture ? 'Update' : 'Schedule'} Lecture
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Card title={`Lecture Schedule - ${new Date(selectedMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lectures
                      .filter(lecture => lecture.month === selectedMonth)
                      .sort((a, b) => new Date(a.date + ' ' + a.sessionTime).getTime() - new Date(b.date + ' ' + b.sessionTime).getTime())
                      .map(lecture => (
                        <tr key={lecture.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(lecture.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {lecture.sessionTime}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {lecture.courseTitle}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {lecture.lecturerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {lecture.duration} min
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {lecture.location || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editLecture(lecture)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteLecture(lecture.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    
                    {lectures.filter(lecture => lecture.month === selectedMonth).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No lectures scheduled for this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotificationTemplatesPage;