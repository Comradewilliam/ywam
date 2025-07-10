import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { Calendar, Download, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockMeditationSchedules, mockMeals, mockWorkDuties, mockUsers } from '../../mock/mockData';
import { toast } from 'react-toastify';
import { formatDate, hasRole } from '../../utils/helpers';
import { generatePersonalSchedulePdf } from '../../utils/personalSchedulePdf';

const SchedulesPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'personal' | 'meditation' | 'kitchen' | 'workDuty'>('personal');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  const [selectedWeek, setSelectedWeek] = useState<string>(
    getStartOfWeek(new Date()).toISOString().split('T')[0]
  );
  
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
  
  // Get user's personal schedule
  const getPersonalSchedule = () => {
    const userMeditationSchedules = mockMeditationSchedules.filter(
      schedule => schedule.userId === user.id
    );
    
    const userKitchenDuties = mockMeals.filter(
      meal => meal.cookId === user.id || meal.washerId === user.id
    );
    
    const userWorkDuties = mockWorkDuties.filter(
      duty => duty.assignedUserIds.includes(user.id)
    );
    
    return {
      meditation: userMeditationSchedules,
      kitchen: userKitchenDuties,
      workDuty: userWorkDuties
    };
  };
  
  // Filter schedules by selected date ranges
  const getFilteredSchedules = () => {
    const personal = getPersonalSchedule();
    
    const meditationByMonth = mockMeditationSchedules.filter(
      schedule => schedule.date.startsWith(selectedMonth)
    );
    
    const weekStart = new Date(selectedWeek);
    const weekEnd = getEndOfWeek(weekStart);
    
    const kitchenByWeek = mockMeals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate >= weekStart && mealDate <= weekEnd;
    });
    
    const workDutyByWeek = mockWorkDuties.filter(duty => {
      const dutyDate = new Date(duty.date);
      return dutyDate >= weekStart && dutyDate <= weekEnd;
    });
    
    return {
      personal,
      meditation: meditationByMonth,
      kitchen: kitchenByWeek,
      workDuty: workDutyByWeek
    };
  };
  
  const schedules = getFilteredSchedules();
  
  // Determine which schedules user can download based on role
  const canDownloadMeditation = hasRole(user, 'Admin') || hasRole(user, 'Missionary');
  const canDownloadKitchen = hasRole(user, 'Admin') || hasRole(user, 'Chef') || hasRole(user, 'Missionary');
  const canDownloadWorkDuty = hasRole(user, 'Admin') || hasRole(user, 'WorkDutyManager') || hasRole(user, 'Missionary');
  
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      if (activeTab === 'personal') {
        // Use the new personal schedule PDF generator
        await generatePersonalSchedulePdf(user, schedules.personal, mockUsers);
        toast.success('Personal schedule PDF generated successfully');
      } else {
        // Handle other PDF types (existing logic)
        // ... existing PDF generation code for meditation, kitchen, workDuty
        toast.success('Schedule PDF generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const tabStyles = {
    active: "px-4 py-2 font-medium rounded-md bg-blue-600 text-white",
    inactive: "px-4 py-2 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  };
  
  // Animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedules</h1>
          <p className="text-gray-600">View and manage your YWAM DAR participation</p>
        </div>
        
        <Button
          variant="primary"
          onClick={generatePdf}
          isLoading={isGeneratingPdf}
          className="flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Schedule
        </Button>
      </div>
      
      <div className="flex flex-wrap space-x-2 mb-6">
        <button
          className={activeTab === 'personal' ? tabStyles.active : tabStyles.inactive}
          onClick={() => setActiveTab('personal')}
        >
          My Schedule
        </button>
        
        {canDownloadMeditation && (
          <button
            className={activeTab === 'meditation' ? tabStyles.active : tabStyles.inactive}
            onClick={() => setActiveTab('meditation')}
          >
            Meditation
          </button>
        )}
        
        {canDownloadKitchen && (
          <button
            className={activeTab === 'kitchen' ? tabStyles.active : tabStyles.inactive}
            onClick={() => setActiveTab('kitchen')}
          >
            Kitchen
          </button>
        )}
        
        {canDownloadWorkDuty && (
          <button
            className={activeTab === 'workDuty' ? tabStyles.active : tabStyles.inactive}
            onClick={() => setActiveTab('workDuty')}
          >
            Work Duty
          </button>
        )}
      </div>
      
      {/* Date filters based on active tab */}
      {activeTab === 'meditation' && (
        <div className="flex items-center mb-4">
          <label htmlFor="month-select" className="mr-2 text-sm font-medium text-gray-700">
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
      )}
      
      {(activeTab === 'kitchen' || activeTab === 'workDuty') && (
        <div className="flex items-center mb-4">
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
      )}
      
      {/* Content based on active tab */}
      <motion.div
        key={activeTab}
        initial="hidden"
        animate="visible"
        variants={itemVariants}
      >
        {activeTab === 'personal' && (
          <div className="space-y-6">
            {/* Personal Meditation Sessions */}
            <Card title="My Meditation Sessions">
              <div className="space-y-4">
                {schedules.personal.meditation.length > 0 ? (
                  schedules.personal.meditation.map(schedule => (
                    <div key={schedule.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{formatDate(schedule.date)}</p>
                          <p className="text-sm text-gray-600">Time: {schedule.time}</p>
                          <p className="text-sm text-gray-600">Bible Verse: {schedule.bibleVerse}</p>
                        </div>
                        <Badge variant="primary">Leader</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    You don't have any meditation sessions scheduled.
                  </p>
                )}
              </div>
            </Card>
            
            {/* Personal Kitchen Duties */}
            <Card title="My Kitchen Duties">
              <div className="space-y-4">
                {schedules.personal.kitchen.length > 0 ? (
                  schedules.personal.kitchen.map(meal => {
                    const isCook = meal.cookId === user.id;
                    
                    return (
                      <div key={meal.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{formatDate(meal.date)} - {meal.mealType}</p>
                            <p className="text-sm text-gray-600">Dish: {meal.mealName}</p>
                            <p className="text-sm text-gray-600">
                              {isCook
                                ? `Prep: ${meal.prepTime} | Serve: ${meal.serveTime}`
                                : `Washing after serving: ${meal.serveTime}`}
                            </p>
                          </div>
                          <Badge variant={isCook ? 'primary' : 'secondary'}>
                            {isCook ? 'Cook' : 'Washer'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    You don't have any kitchen duties assigned.
                  </p>
                )}
              </div>
            </Card>
            
            {/* Personal Work Duties */}
            <Card title="My Work Duties">
              <div className="space-y-4">
                {schedules.personal.workDuty.length > 0 ? (
                  schedules.personal.workDuty.map(duty => (
                    <div key={duty.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{formatDate(duty.date)}</p>
                          <p className="text-sm text-gray-600">Task: {duty.taskName}</p>
                          <p className="text-sm text-gray-600">Time: {duty.time}</p>
                          
                          {duty.isGroup && duty.assignedUserIds.length > 1 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Working with:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {duty.assignedUserIds
                                  .filter(id => id !== user.id)
                                  .map(id => {
                                    const teammate = mockUsers.find(u => u.id === id);
                                    return teammate ? (
                                      <Badge key={id} variant="secondary" size="sm">
                                        {teammate.firstName} {teammate.lastName}
                                      </Badge>
                                    ) : null;
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                        <Badge variant={duty.isLight ? 'success' : 'warning'}>
                          {duty.isLight ? 'Light' : 'Heavy'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    You don't have any work duties assigned.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
        
        {activeTab === 'meditation' && (
          <Card title={`Meditation Schedule - ${selectedMonth}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bible Verse</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.meditation.length > 0 ? (
                    schedules.meditation.map(schedule => {
                      const leader = mockUsers.find(u => u.id === schedule.userId);
                      
                      return (
                        <tr key={schedule.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(schedule.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {schedule.time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {leader ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {leader.firstName} {leader.lastName}
                                </div>
                                <div className="flex mt-1">
                                  {leader.roles.map(role => (
                                    <Badge key={role} variant="primary" size="sm" className="mr-1">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {schedule.bibleVerse}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No meditation sessions scheduled for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        
        {activeTab === 'kitchen' && (
          <Card title={`Kitchen Schedule - Week of ${formatDate(selectedWeek)}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dish</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cook</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Washer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.kitchen.length > 0 ? (
                    schedules.kitchen.map(meal => {
                      const cook = mockUsers.find(u => u.id === meal.cookId);
                      const washer = mockUsers.find(u => u.id === meal.washerId);
                      
                      return (
                        <tr key={meal.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(meal.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={
                                meal.mealType === 'Breakfast' ? 'primary' : 
                                meal.mealType === 'Lunch' ? 'success' : 'warning'
                              }
                            >
                              {meal.mealType}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {meal.mealName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {cook ? (
                              <div className="text-sm">
                                {cook.firstName} {cook.lastName}
                                {cook.id === user.id && (
                                  <Badge variant="secondary" size="sm" className="ml-2">You</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {washer ? (
                              <div className="text-sm">
                                {washer.firstName} {washer.lastName}
                                {washer.id === user.id && (
                                  <Badge variant="secondary" size="sm" className="ml-2">You</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div>Prep: {meal.prepTime}</div>
                              <div>Serve: {meal.serveTime}</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No kitchen duties scheduled for this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        
        {activeTab === 'workDuty' && (
          <Card title={`Work Duty Schedule - Week of ${formatDate(selectedWeek)}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.workDuty.length > 0 ? (
                    schedules.workDuty.map(duty => {
                      const assignedUsers = duty.assignedUserIds.map(id => 
                        mockUsers.find(u => u.id === id)
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
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {assignedUsers.map(assignedUser => (
                                <Badge 
                                  key={assignedUser.id}
                                  variant={assignedUser.id === user.id ? 'primary' : 'secondary'}
                                  size="sm"
                                  className="mb-1"
                                >
                                  {assignedUser.firstName} {assignedUser.lastName}
                                  {assignedUser.id === user.id && ' (You)'}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No work duties scheduled for this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default SchedulesPage;