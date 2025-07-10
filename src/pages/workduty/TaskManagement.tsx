import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { fetchSchedulesStart, fetchSchedulesSuccess, fetchSchedulesFailure, addWorkDuty, updateWorkDuty, deleteWorkDuty } from '../../store/slices/schedulesSlice';
import { mockApi } from '../../mock/mockData';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { jsPDF } from 'jspdf';
import { RefreshCw, Download, Edit, Trash2, Plus } from 'lucide-react';
import { User, WorkDuty } from '../../types';
import { hasRole, formatDate } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

const TaskManagementPage: React.FC = () => {
  const dispatch = useDispatch();
  const { workDuties, isLoading } = useSelector((state: RootState) => state.schedules);
  const { users } = useSelector((state: RootState) => state.users);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  const [selectedWeek, setSelectedWeek] = useState<string>(
    getStartOfWeek(new Date()).toISOString().split('T')[0]
  );
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDuty, setEditingDuty] = useState<WorkDuty | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    taskName: '',
    isLight: true,
    peopleCount: 1,
    date: '',
    time: '',
  });
  
  // Helper to get start of week (Monday)
  function getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }
  
  // Get end date for the week
  function getEndOfWeek(startDate: Date): Date {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate;
  }
  
  useEffect(() => {
    const fetchWorkDuties = async () => {
      dispatch(fetchSchedulesStart());
      
      try {
        const data = await mockApi.getWorkDuties();
        dispatch(fetchSchedulesSuccess({ workDuties: data }));
      } catch (error) {
        dispatch(fetchSchedulesFailure('Failed to fetch work duties'));
        toast.error('Failed to load work duties');
      }
    };
    
    if (workDuties.length === 0) {
      fetchWorkDuties();
    }
  }, [dispatch, workDuties.length]);
  
  // Filter duties for the selected week
  const filteredDuties = workDuties.filter(duty => {
    const dutyDate = new Date(duty.date);
    const weekStart = new Date(selectedWeek);
    const weekEnd = getEndOfWeek(weekStart);
    
    return dutyDate >= weekStart && dutyDate <= weekEnd;
  }).sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Auto-assign users based on people count
  const autoAssignUsers = (peopleCount: number, taskDate: string): string[] => {
    // Get available users (exclude missionaries from work duties)
    const availableUsers = users.filter(user => !hasRole(user, 'Missionary'));
    
    // Shuffle users for random assignment
    const shuffledUsers = [...availableUsers].sort(() => 0.5 - Math.random());
    
    // Return the first N users based on people count
    return shuffledUsers.slice(0, peopleCount).map(user => user.id);
  };
  
  const resetForm = () => {
    setFormData({
      taskName: '',
      isLight: true,
      peopleCount: 1,
      date: '',
      time: '',
    });
    setEditingDuty(null);
  };
  
  const handleSubmit = async () => {
    if (!formData.taskName || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.peopleCount < 1) {
      toast.error('People count must be at least 1');
      return;
    }
    
    try {
      // Auto-assign users based on people count
      const assignedUserIds = autoAssignUsers(formData.peopleCount, formData.date);
      
      const dutyData = {
        ...formData,
        isGroup: formData.peopleCount > 1,
        assignedUserIds,
      };
      
      if (editingDuty) {
        const updatedDuty = await mockApi.updateWorkDuty(editingDuty.id, dutyData);
        dispatch(updateWorkDuty(updatedDuty));
        toast.success('Work duty updated successfully');
      } else {
        const newDuty = await mockApi.createWorkDuty(dutyData);
        dispatch(addWorkDuty(newDuty));
        toast.success('Work duty created successfully');
      }
      
      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error(editingDuty ? 'Failed to update work duty' : 'Failed to create work duty');
    }
  };
  
  const handleEdit = (duty: WorkDuty) => {
    setEditingDuty(duty);
    setFormData({
      taskName: duty.taskName,
      isLight: duty.isLight,
      peopleCount: duty.peopleCount,
      date: duty.date,
      time: duty.time,
    });
    setShowForm(true);
  };
  
  const handleDelete = async (dutyId: string) => {
    if (window.confirm('Are you sure you want to delete this work duty?')) {
      try {
        await mockApi.deleteWorkDuty(dutyId);
        dispatch(deleteWorkDuty(dutyId));
        toast.success('Work duty deleted successfully');
      } catch (error) {
        toast.error('Failed to delete work duty');
      }
    }
  };
  
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Create PDF in landscape orientation
      const doc = new jsPDF('landscape');
      
      const weekStart = new Date(selectedWeek);
      const weekEnd = getEndOfWeek(weekStart);
      const dateRange = `Week of ${formatDate(weekStart.toISOString())} - ${formatDate(weekEnd.toISOString())}`;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('YOUTH WITH A MISSION', 148, 15, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('WORK DUTY SCHEDULE', 148, 25, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Date: ${dateRange}`, 148, 35, { align: 'center' });
      
      let yPos = 50;
      
      // Create table headers
      const headers = [
        ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      ];
      
      // Morning Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Morning (8:00-10:00)', 15, yPos);
      yPos += 10;
      
      const morningDuties = Array(7).fill('').map((_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        return filteredDuties.filter(duty => 
          duty.date === dateStr && 
          parseInt(duty.time.split(':')[0]) < 12
        );
      });
      
      const morningData = morningDuties.map(duties => 
        duties.map(duty => {
          const assignees = duty.assignedUserIds
            .map(id => users.find(u => u.id === id))
            .filter(Boolean)
            .map(u => `${u.firstName} ${u.lastName}`)
            .join(', ');
          
          return `${duty.taskName}\n${duty.time}\n${duty.isLight ? 'Light' : 'Heavy'}\n${assignees}`;
        }).join('\n\n') || '-'
      );
      
      (doc as any).autoTable({
        head: headers,
        body: [['Tasks', ...morningData]],
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Afternoon Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Afternoon (12:00-16:00)', 15, yPos);
      yPos += 10;
      
      const afternoonDuties = Array(7).fill('').map((_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        return filteredDuties.filter(duty => 
          duty.date === dateStr && 
          parseInt(duty.time.split(':')[0]) >= 12 &&
          parseInt(duty.time.split(':')[0]) < 16
        );
      });
      
      const afternoonData = afternoonDuties.map(duties => 
        duties.map(duty => {
          const assignees = duty.assignedUserIds
            .map(id => users.find(u => u.id === id))
            .filter(Boolean)
            .map(u => `${u.firstName} ${u.lastName}`)
            .join(', ');
          
          return `${duty.taskName}\n${duty.time}\n${duty.isLight ? 'Light' : 'Heavy'}\n${assignees}`;
        }).join('\n\n') || '-'
      );
      
      (doc as any).autoTable({
        head: headers,
        body: [['Tasks', ...afternoonData]],
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Evening Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Evening (16:00-18:00)', 15, yPos);
      yPos += 10;
      
      const eveningDuties = Array(7).fill('').map((_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        return filteredDuties.filter(duty => 
          duty.date === dateStr && 
          parseInt(duty.time.split(':')[0]) >= 16
        );
      });
      
      const eveningData = eveningDuties.map(duties => 
        duties.map(duty => {
          const assignees = duty.assignedUserIds
            .map(id => users.find(u => u.id === id))
            .filter(Boolean)
            .map(u => `${u.firstName} ${u.lastName}`)
            .join(', ');
          
          return `${duty.taskName}\n${duty.time}\n${duty.isLight ? 'Light' : 'Heavy'}\n${assignees}`;
        }).join('\n\n') || '-'
      );
      
      (doc as any).autoTable({
        head: headers,
        body: [['Tasks', ...eveningData]],
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 }
      });
      
      doc.save(`ywam-dar-workduty-schedule-${selectedWeek}.pdf`);
      toast.success('Work duty schedule PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Check if current user can manage work duties
  const canManage = hasRole(currentUser, 'WorkDutyManager') || hasRole(currentUser, 'Admin');
  
  if (!canManage) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have permission to manage work duties.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Create and manage work duty assignments</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="flex items-center"
          >
            {showForm ? 'Cancel' : <><Plus size={16} className="mr-2" /> Add Work Duty</>}
          </Button>
          
          <Button
            variant="outline"
            onClick={generatePdf}
            isLoading={isGeneratingPdf}
            className="flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <div className="flex items-center">
        <label htmlFor="week-select" className="mr-2 text-sm font-medium text-gray-700">
          Select Week Starting:
        </label>
        <input
          id="week-select"
          type="date"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card title={editingDuty ? 'Edit Work Duty' : 'Add New Work Duty'}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Task Name"
                    name="taskName"
                    value={formData.taskName}
                    onChange={handleInputChange}
                    placeholder="e.g., Clean Dormitories"
                    required
                  />
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Task Type</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isLight"
                          checked={formData.isLight}
                          onChange={() => setFormData(prev => ({ ...prev, isLight: true }))}
                          className="mr-2"
                        />
                        Light Duty
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isLight"
                          checked={!formData.isLight}
                          onChange={() => setFormData(prev => ({ ...prev, isLight: false }))}
                          className="mr-2"
                        />
                        Heavy Duty
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    label="Time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    label="Number of People"
                    name="peopleCount"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.peopleCount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Users will be automatically assigned to this task based on the number of people specified. 
                    The system will randomly select available users (excluding missionaries) for the assignment.
                  </p>
                </div>
                
                <div className="flex justify-end">
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
                    onClick={handleSubmit}
                  >
                    {editingDuty ? 'Update Work Duty' : 'Create Work Duty'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Card title={`Work Duties - Week of ${formatDate(selectedWeek)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">People</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDuties.length > 0 ? (
                filteredDuties.map(duty => {
                  const assignedUsers = duty.assignedUserIds.map(id => 
                    users.find(u => u.id === id)
                  ).filter(Boolean);
                  
                  return (
                    <tr key={duty.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(duty.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {duty.time}
                      </td>
                      <td className="px-6 py-4">
                        {duty.taskName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={duty.isLight ? 'success' : 'warning'}>
                          {duty.isLight ? 'Light' : 'Heavy'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {duty.peopleCount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {assignedUsers.map(user => (
                            <Badge key={user.id} variant="secondary" size="sm">
                              {user.firstName} {user.lastName}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(duty)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(duty.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No work duties scheduled for this week.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TaskManagementPage;