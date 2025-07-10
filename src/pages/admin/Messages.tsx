import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { fetchMessagesStart, fetchMessagesSuccess, fetchMessagesFailure, addMessage, deleteMessage } from '../../store/slices/messagesSlice';
import { mockApi } from '../../mock/mockData';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
import { MessageSquare, Send, Calendar, Trash2 } from 'lucide-react';
import { User } from '../../types';
import { hasRole } from '../../utils/helpers';
import { motion } from 'framer-motion';

const tabStyles = {
  active: "px-4 py-2 font-medium rounded-md bg-blue-600 text-white",
  inactive: "px-4 py-2 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
};

const MessagesPage: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector((state: RootState) => state.messages);
  const { users } = useSelector((state: RootState) => state.users);
  
  const [activeTab, setActiveTab] = useState<'compose' | 'sent' | 'friends'>('compose');
  const [formData, setFormData] = useState({
    content: '',
    recipients: [] as string[],
    schedule: {
      startDate: '',
      startTime: '',
      frequency: 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
      endDate: '',
    },
    isScheduled: false,
  });
  
  const [selectedUserType, setSelectedUserType] = useState<'all' | 'staff' | 'dts' | 'missionary' | 'friends'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  useEffect(() => {
    const fetchMessages = async () => {
      dispatch(fetchMessagesStart());
      
      try {
        const data = await mockApi.getMessages();
        dispatch(fetchMessagesSuccess(data));
      } catch (error) {
        dispatch(fetchMessagesFailure('Failed to fetch messages'));
        toast.error('Failed to load messages');
      }
    };
    
    if (messages.length === 0) {
      fetchMessages();
    }
  }, [dispatch, messages.length]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('schedule.')) {
      const scheduleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [scheduleField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const toggleRecipient = (userId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, userId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recipients: prev.recipients.filter(id => id !== userId)
      }));
    }
  };
  
  const selectAllCurrentUsers = () => {
    const visibleUsers = filterUsersByType().filter(user => 
      searchTerm === '' || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm)
    );
    
    const userIds = visibleUsers.map(user => user.id);
    
    setFormData(prev => ({
      ...prev,
      recipients: [...new Set([...prev.recipients, ...userIds])]
    }));
  };
  
  const deselectAllCurrentUsers = () => {
    const visibleUsers = filterUsersByType().filter(user => 
      searchTerm === '' || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm)
    );
    
    const userIds = visibleUsers.map(user => user.id);
    
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(id => !userIds.includes(id))
    }));
  };
  
  const filterUsersByType = () => {
    switch (selectedUserType) {
      case 'staff':
        return users.filter(user => hasRole(user, 'Staff'));
      case 'dts':
        return users.filter(user => hasRole(user, 'DTS'));
      case 'missionary':
        return users.filter(user => hasRole(user, 'Missionary'));
      case 'friends':
        return users.filter(user => hasRole(user, 'Friend'));
      default:
        return users;
    }
  };
  
  const handleSendMessage = async () => {
    if (!formData.content) {
      toast.error('Please enter a message');
      return;
    }
    
    if (formData.recipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    
    if (formData.isScheduled) {
      if (!formData.schedule.startDate || !formData.schedule.startTime) {
        toast.error('Please set a schedule date and time');
        return;
      }
      
      if (formData.schedule.frequency !== 'once' && !formData.schedule.endDate) {
        toast.error('Please set an end date for recurring messages');
        return;
      }
    }
    
    setIsSending(true);
    
    try {
      // Combine date and time for the API
      const scheduledDateTime = formData.isScheduled 
        ? `${formData.schedule.startDate}T${formData.schedule.startTime}:00` 
        : new Date().toISOString();
      
      const messageData = {
        content: formData.content,
        recipients: formData.recipients,
        sentBy: '1', // Current user ID
        schedule: formData.isScheduled ? {
          startDate: scheduledDateTime,
          frequency: formData.schedule.frequency,
          endDate: formData.schedule.endDate ? `${formData.schedule.endDate}T23:59:59` : undefined
        } : undefined
      };
      
      const newMessage = await mockApi.sendMessage(messageData);
      dispatch(addMessage(newMessage));
      
      toast.success(
        formData.isScheduled 
          ? 'Message scheduled successfully' 
          : 'Message sent successfully'
      );
      
      // Reset form
      setFormData({
        content: '',
        recipients: [],
        schedule: {
          startDate: '',
          startTime: '',
          frequency: 'once',
          endDate: '',
        },
        isScheduled: false
      });
      
      // Switch to sent tab
      setActiveTab('sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await mockApi.deleteMessage(messageId);
        dispatch(deleteMessage(messageId));
        toast.success('Message deleted successfully');
      } catch (error) {
        toast.error('Failed to delete message');
      }
    }
  };
  
  const composeTabContent = (
    <div className="space-y-6">
      <Textarea
        label="Message Content"
        name="content"
        value={formData.content}
        onChange={handleInputChange}
        placeholder="Enter your message here... Use {{firstName}} to include recipient's first name."
        rows={4}
        fullWidth
      />
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="scheduled-checkbox"
          checked={formData.isScheduled}
          onChange={(e) => setFormData(prev => ({ ...prev, isScheduled: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="scheduled-checkbox" className="ml-2 text-sm text-gray-700">
          Schedule this message
        </label>
      </div>
      
      {formData.isScheduled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            name="schedule.startDate"
            type="date"
            value={formData.schedule.startDate}
            onChange={handleInputChange}
            fullWidth
          />
          
          <Input
            label="Start Time"
            name="schedule.startTime"
            type="time"
            value={formData.schedule.startTime}
            onChange={handleInputChange}
            fullWidth
          />
          
          <Select
            label="Frequency"
            name="schedule.frequency"
            value={formData.schedule.frequency}
            onChange={(value) => setFormData(prev => ({
              ...prev,
              schedule: {
                ...prev.schedule,
                frequency: value as any
              }
            }))}
            options={[
              { value: 'once', label: 'Once' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            fullWidth
          />
          
          {formData.schedule.frequency !== 'once' && (
            <Input
              label="End Date"
              name="schedule.endDate"
              type="date"
              value={formData.schedule.endDate}
              onChange={handleInputChange}
              fullWidth
            />
          )}
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recipients</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedUserType === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedUserType('all')}
          >
            All Users
          </Button>
          <Button
            variant={selectedUserType === 'staff' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedUserType('staff')}
          >
            Staff
          </Button>
          <Button
            variant={selectedUserType === 'dts' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedUserType('dts')}
          >
            DTS
          </Button>
          <Button
            variant={selectedUserType === 'missionary' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedUserType('missionary')}
          >
            Missionary
          </Button>
          <Button
            variant={selectedUserType === 'friends' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedUserType('friends')}
          >
            Friends
          </Button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex ml-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllCurrentUsers}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAllCurrentUsers}
            >
              Deselect All
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filterUsersByType()
              .filter(user => 
                searchTerm === '' || 
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phoneNumber.includes(searchTerm)
              )
              .map(user => (
                <div key={user.id} className="flex items-start">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={formData.recipients.includes(user.id)}
                    onChange={(e) => toggleRecipient(user.id, e.target.checked)}
                  />
                  <label htmlFor={`user-${user.id}`} className="ml-2 text-sm">
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-gray-500 text-xs">{user.phoneNumber}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.roles.map(role => (
                        <Badge key={role} variant="primary" size="sm">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </label>
                </div>
              ))}
          </div>
          
          {filterUsersByType().length === 0 && (
            <p className="text-center text-gray-500 py-4">No users found</p>
          )}
        </div>
        
        <div className="text-sm text-gray-500 mt-2">
          Selected {formData.recipients.length} recipient(s)
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSendMessage}
          isLoading={isSending}
          className="flex items-center"
        >
          <Send size={16} className="mr-2" />
          {formData.isScheduled ? 'Schedule Message' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
  
  const sentTabContent = (
    <div>
      {isLoading ? (
        <div className="py-8 text-center">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">No messages have been sent yet.</p>
          <Button
            variant="outline"
            onClick={() => setActiveTab('compose')}
            className="mt-4"
          >
            Compose a message
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(message => {
            const sender = users.find(u => u.id === message.sentBy);
            const recipientCount = message.recipients.length;
            const isScheduled = message.schedule !== undefined;
            
            return (
              <Card key={message.id} className="overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <MessageSquare size={16} className="text-blue-600 mr-2" />
                      <span className="text-sm text-gray-500">
                        Sent by {sender?.firstName} {sender?.lastName} on {new Date(message.sentAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-900">{message.content}</p>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      Sent to {recipientCount} recipient(s)
                    </div>
                    
                    {isScheduled && (
                      <div className="flex items-center mt-2">
                        <Calendar size={16} className="text-amber-600 mr-2" />
                        <span className="text-sm text-gray-500">
                          Scheduled: {message.schedule?.frequency} starting {new Date(message.schedule?.startDate || '').toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
  
  const friendsTabContent = (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Friends List</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users
          .filter(user => hasRole(user, 'Friend'))
          .map(user => (
            <Card key={user.id} className="h-full">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{user.firstName} {user.lastName}</h4>
                <p className="text-gray-600">{user.phoneNumber}</p>
                <p className="text-sm text-gray-500 mt-2">University: {user.university}</p>
                <p className="text-sm text-gray-500">Course: {user.course}</p>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      recipients: [user.id]
                    }));
                    setActiveTab('compose');
                  }}
                >
                  <MessageSquare size={16} className="mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>
          ))}
        
        {users.filter(user => hasRole(user, 'Friend')).length === 0 && (
          <div className="col-span-full py-8 text-center">
            <p className="text-gray-500">No friends have been added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Send notifications and reminders to YWAM DAR members</p>
      </div>
      
      <div className="flex space-x-2 mb-6">
        <button
          className={activeTab === 'compose' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('compose')}
        >
          Compose Message
        </button>
        <button
          className={activeTab === 'sent' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('sent')}
        >
          Sent Messages
        </button>
        <button
          className={activeTab === 'friends' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('friends')}
        >
          Friends List
        </button>
      </div>
      
      <Card>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'compose' && composeTabContent}
          {activeTab === 'sent' && sentTabContent}
          {activeTab === 'friends' && friendsTabContent}
        </motion.div>
      </Card>
    </div>
  );
};

export default MessagesPage;