import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { Calendar, Book, ChefHat, Briefcase, Download, Activity, Map, MessageSquare, Users, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { realDataService } from '../../services/realDataService';
import { formatDate } from '../../utils/helpers';

const MissionaryDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfType, setPdfType] = useState<'all' | 'meditation' | 'kitchen' | 'workDuty'>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>(
    getStartOfWeek(new Date()).toISOString().split('T')[0]
  );
  const [activeView, setActiveView] = useState<'overview' | 'users' | 'schedules'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  if (!user) return null;
  
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
  
  // Get all system data
  const systemData = {
    users: realDataService.getUsers(),
    meditations: realDataService.getMeditationSchedules(),
    meals: realDataService.getMeals(),
    workDuties: realDataService.getWorkDuties(),
    messages: realDataService.getMessages()
  };
  
  // This week's dates
  const weekDates = {
    start: selectedWeek,
    end: getEndOfWeek(new Date(selectedWeek)).toISOString().split('T')[0]
  };
  
  // Get all schedules for the current week
  const getWeekSchedules = () => {
    // Filter schedules for the current week
    const weekMeditation = systemData.meditations.filter(item => {
      const itemDate = item.date;
      return itemDate >= weekDates.start && itemDate <= weekDates.end;
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    const weekKitchen = systemData.meals.filter(item => {
      const itemDate = item.date;
      return itemDate >= weekDates.start && itemDate <= weekDates.end;
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    const weekWorkDuty = systemData.workDuties.filter(item => {
      const itemDate = item.date;
      return itemDate >= weekDates.start && itemDate <= weekDates.end;
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      meditation: weekMeditation,
      kitchen: weekKitchen,
      workDuty: weekWorkDuty
    };
  };
  
  const weekSchedules = getWeekSchedules();
  
  // Filter users based on search and role
  const filteredUsers = systemData.users.filter(u => {
    const matchesSearch = searchTerm === '' || 
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber.includes(searchTerm) ||
      u.university.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === '' || u.roles.includes(filterRole);
    
    return matchesSearch && matchesRole;
  });
  
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Create PDF in landscape orientation
      const doc = new jsPDF('landscape');
      
      // Header with YWAM logo
      doc.addImage('/YWAM-Logo.png', 'PNG', 15, 10, 30, 30);
      
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('YOUTH WITH A MISSION', 148, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      
      if (pdfType === 'all') {
        doc.text(`Complete System Report (${formatDate(weekDates.start)} - ${formatDate(weekDates.end)})`, 148, 30, { align: 'center' });
      } else if (pdfType === 'meditation') {
        doc.text('Meditation Schedule Report', 148, 30, { align: 'center' });
      } else if (pdfType === 'kitchen') {
        doc.text('Kitchen Schedule Report', 148, 30, { align: 'center' });
      } else if (pdfType === 'workDuty') {
        doc.text('Work Duty Schedule Report', 148, 30, { align: 'center' });
      }
      
      // Date generated
      doc.setFontSize(10);
      const dateGenerated = new Date().toLocaleDateString();
      doc.text(`Generated on: ${dateGenerated}`, 148, 40, { align: 'center' });
      
      // Add content based on selected PDF type
      let yPos = 50;
      
      if (pdfType === 'all' || pdfType === 'meditation') {
        // Meditation Schedule
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Meditation Schedule', 15, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        const meditationHeaders = [['Date', 'Time', 'Leader', 'Bible Verse']];
        const meditationData = weekSchedules.meditation.map(schedule => {
          const leader = systemData.users.find(u => u.id === schedule.userId);
          return [
            formatDate(schedule.date),
            schedule.time,
            leader ? `${leader.firstName} ${leader.lastName}` : 'Not assigned',
            schedule.bibleVerse
          ];
        });
        
        if (meditationData.length === 0) {
          meditationData.push(['No meditation sessions scheduled', '', '', '']);
        }
        
        (doc as any).autoTable({
          head: meditationHeaders,
          body: meditationData,
          startY: yPos,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255] },
          margin: { left: 15, right: 15 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      if (pdfType === 'all' || pdfType === 'kitchen') {
        // Check if we need a new page
        if (pdfType === 'all' && yPos > 150) {
          doc.addPage('landscape');
          yPos = 20;
        }
        
        // Kitchen Schedule
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Kitchen Schedule', 15, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        const kitchenHeaders = [['Date', 'Meal', 'Dish', 'Cook', 'Washer']];
        const kitchenData = weekSchedules.kitchen.map(meal => {
          const cook = systemData.users.find(u => u.id === meal.cookId);
          const washer = systemData.users.find(u => u.id === meal.washerId);
          return [
            formatDate(meal.date),
            meal.mealType,
            meal.mealName,
            cook ? `${cook.firstName} ${cook.lastName}` : 'Not assigned',
            washer ? `${washer.firstName} ${washer.lastName}` : 'Not assigned'
          ];
        });
        
        if (kitchenData.length === 0) {
          kitchenData.push(['No kitchen schedules for this week', '', '', '', '']);
        }
        
        (doc as any).autoTable({
          head: kitchenHeaders,
          body: kitchenData,
          startY: yPos,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255] },
          margin: { left: 15, right: 15 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      if (pdfType === 'all' || pdfType === 'workDuty') {
        // Check if we need a new page
        if (pdfType === 'all' && yPos > 150) {
          doc.addPage('landscape');
          yPos = 20;
        }
        
        // Work Duty Schedule
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Work Duty Schedule', 15, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        const workDutyHeaders = [['Date', 'Time', 'Task', 'Type', 'Assigned To']];
        const workDutyData = weekSchedules.workDuty.map(duty => {
          const assignedUsers = duty.assignedUserIds.map(id => {
            const user = systemData.users.find(u => u.id === id);
            return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
          });
          
          return [
            formatDate(duty.date),
            duty.time,
            duty.taskName,
            duty.isLight ? 'Light' : 'Heavy',
            assignedUsers.join(', ')
          ];
        });
        
        if (workDutyData.length === 0) {
          workDutyData.push(['No work duty schedules for this week', '', '', '', '']);
        }
        
        (doc as any).autoTable({
          head: workDutyHeaders,
          body: workDutyData,
          startY: yPos,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255] },
          margin: { left: 15, right: 15 }
        });
      }
      
      // Save the PDF
      let filename = 'ywam-dar-system-report';
      if (pdfType === 'meditation') {
        filename = 'ywam-dar-meditation-schedule';
      } else if (pdfType === 'kitchen') {
        filename = 'ywam-dar-kitchen-schedule';
      } else if (pdfType === 'workDuty') {
        filename = 'ywam-dar-workduty-schedule';
      }
      
      doc.save(`${filename}.pdf`);
      toast.success('Report PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };
  
  const tabStyles = {
    active: "px-4 py-2 font-medium rounded-md bg-blue-600 text-white",
    inactive: "px-4 py-2 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.firstName}!</h1>
          <p className="text-gray-600">Complete system overview and management dashboard</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select
            options={[
              { value: 'all', label: 'All Reports' },
              { value: 'meditation', label: 'Meditation Schedule' },
              { value: 'kitchen', label: 'Kitchen Schedule' },
              { value: 'workDuty', label: 'Work Duty Schedule' },
            ]}
            value={pdfType}
            onChange={(value) => setPdfType(value as any)}
            className="w-40"
          />
          
          <Button
            variant="primary"
            onClick={generatePdf}
            isLoading={isGeneratingPdf}
            className="flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download Report
          </Button>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          className={activeView === 'overview' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveView('overview')}
        >
          System Overview
        </button>
        <button
          className={activeView === 'users' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveView('users')}
        >
          <Users size={16} className="inline mr-2" />
          User Management
        </button>
        <button
          className={activeView === 'schedules' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveView('schedules')}
        >
          <Calendar size={16} className="inline mr-2" />
          Schedule Management
        </button>
      </div>
      
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* System Statistics */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                      <Users size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <h3 className="text-2xl font-bold text-gray-900">{systemData.users.length}</h3>
                    </div>
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                      <Book size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Meditation Sessions</p>
                      <h3 className="text-2xl font-bold text-gray-900">{systemData.meditations.length}</h3>
                    </div>
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                      <ChefHat size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Kitchen Duties</p>
                      <h3 className="text-2xl font-bold text-gray-900">{systemData.meals.length}</h3>
                    </div>
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-100 text-green-600">
                      <Briefcase size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Work Duties</p>
                      <h3 className="text-2xl font-bold text-gray-900">{systemData.workDuties.length}</h3>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
            
            {/* Week Overview */}
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
            
            <Card title="Weekly System Overview" className="h-full">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                      <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Meditation</th>
                      <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Kitchen</th>
                      <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Work Duty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                      const date = new Date(selectedWeek);
                      date.setDate(date.getDate() + index);
                      const formattedDate = date.toISOString().split('T')[0];
                      
                      const dayMeditation = weekSchedules.meditation.filter(s => s.date === formattedDate);
                      const dayKitchen = weekSchedules.kitchen.filter(m => m.date === formattedDate);
                      const dayWorkDuty = weekSchedules.workDuty.filter(w => w.date === formattedDate);
                      
                      return (
                        <tr key={day} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border-b">
                            <p className="font-medium">{day}</p>
                            <p className="text-xs text-gray-500">{formatDate(formattedDate)}</p>
                          </td>
                          <td className="px-3 py-2 border-b">
                            {dayMeditation.length > 0 ? (
                              dayMeditation.map(session => {
                                const leader = systemData.users.find(u => u.id === session.userId);
                                return (
                                  <div key={session.id} className="text-sm">
                                    <p>{session.time} - {leader?.firstName} {leader?.lastName}</p>
                                    <p className="text-xs text-gray-600">{session.bibleVerse}</p>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-gray-500">No sessions</span>
                            )}
                          </td>
                          <td className="px-3 py-2 border-b">
                            {dayKitchen.length > 0 ? (
                              <div className="space-y-1">
                                {dayKitchen.map(meal => (
                                  <div key={meal.id} className="text-sm">
                                    <Badge 
                                      variant={
                                        meal.mealType === 'Breakfast' ? 'primary' : 
                                        meal.mealType === 'Lunch' ? 'success' : 'warning'
                                      }
                                      size="sm"
                                    >
                                      {meal.mealType}
                                    </Badge>
                                    <p className="text-xs">{meal.mealName}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">No meals</span>
                            )}
                          </td>
                          <td className="px-3 py-2 border-b">
                            {dayWorkDuty.length > 0 ? (
                              <div className="space-y-1">
                                {dayWorkDuty.map(duty => (
                                  <div key={duty.id} className="text-sm">
                                    <p>{duty.time} - {duty.taskName}</p>
                                    <Badge 
                                      variant={duty.isLight ? 'success' : 'warning'} 
                                      size="sm"
                                    >
                                      {duty.isLight ? 'Light' : 'Heavy'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">No duties</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        
        {activeView === 'users' && (
          <div className="space-y-6">
            {/* User Filters */}
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              
              <Select
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'Admin', label: 'Admin' },
                  { value: 'Staff', label: 'Staff' },
                  { value: 'Missionary', label: 'Missionary' },
                  { value: 'Chef', label: 'Chef' },
                  { value: 'WorkDutyManager', label: 'Work Duty Manager' },
                  { value: 'DTS', label: 'DTS' },
                  { value: 'PraiseTeam', label: 'Praise Team' },
                  { value: 'Friend', label: 'Friend' }
                ]}
                value={filterRole}
                onChange={(value) => setFilterRole(value)}
                className="w-40"
              />
            </div>
            
            <Card title={`User Directory (${filteredUsers.length} users)`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profilePhoto ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.profilePhoto}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {user.firstName[0]}{user.lastName[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.gender}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.phoneNumber}</div>
                          {user.email && (
                            <div className="text-sm text-gray-500">{user.email}</div>
                          )}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        
        {activeView === 'schedules' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Meditation Schedule */}
              <Card title="Meditation Schedule">
                <div className="space-y-3">
                  {weekSchedules.meditation.map(schedule => {
                    const leader = systemData.users.find(u => u.id === schedule.userId);
                    return (
                      <div key={schedule.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{formatDate(schedule.date)}</p>
                            <p className="text-sm text-gray-600">{schedule.time}</p>
                            <p className="text-sm text-gray-600">{schedule.bibleVerse}</p>
                          </div>
                          <Badge variant="primary" size="sm">
                            {leader?.firstName} {leader?.lastName}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  
                  {weekSchedules.meditation.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      No meditation sessions this week
                    </p>
                  )}
                </div>
              </Card>
              
              {/* Kitchen Schedule */}
              <Card title="Kitchen Schedule">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {weekSchedules.kitchen.map(meal => {
                    const cook = systemData.users.find(u => u.id === meal.cookId);
                    const washer = systemData.users.find(u => u.id === meal.washerId);
                    
                    return (
                      <div key={meal.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{formatDate(meal.date)}</p>
                            <Badge 
                              variant={
                                meal.mealType === 'Breakfast' ? 'primary' : 
                                meal.mealType === 'Lunch' ? 'success' : 'warning'
                              }
                              size="sm"
                              className="mr-2"
                            >
                              {meal.mealType}
                            </Badge>
                            <p className="text-sm text-gray-600">{meal.mealName}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              <p>Cook: {cook?.firstName} {cook?.lastName}</p>
                              <p>Washer: {washer?.firstName} {washer?.lastName}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {weekSchedules.kitchen.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      No kitchen duties this week
                    </p>
                  )}
                </div>
              </Card>
              
              {/* Work Duty Schedule */}
              <Card title="Work Duty Schedule">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {weekSchedules.workDuty.map(duty => {
                    const assignedUsers = duty.assignedUserIds.map(id => 
                      systemData.users.find(u => u.id === id)
                    ).filter(Boolean);
                    
                    return (
                      <div key={duty.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{formatDate(duty.date)}</p>
                            <p className="text-sm text-gray-600">{duty.time} - {duty.taskName}</p>
                            <Badge 
                              variant={duty.isLight ? 'success' : 'warning'} 
                              size="sm"
                              className="mt-1"
                            >
                              {duty.isLight ? 'Light' : 'Heavy'}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              {assignedUsers.map(user => (
                                <span key={user.id} className="block">
                                  {user.firstName} {user.lastName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {weekSchedules.workDuty.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      No work duties this week
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MissionaryDashboard;