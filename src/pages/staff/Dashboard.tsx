import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Download, Calendar, Book, ChefHat, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { mockMeditationSchedules, mockMeals, mockWorkDuties } from '../../mock/mockData';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';

const StaffDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  if (!user) return null;
  
  // Get user's upcoming schedule
  const getPersonalSchedule = () => {
    // Meditation schedules led by user
    const userMeditationSchedules = mockMeditationSchedules.filter(
      schedule => schedule.userId === user.id
    );
    
    // Kitchen duties (cooking or washing)
    const userKitchenDuties = mockMeals.filter(
      meal => meal.cookId === user.id || meal.washerId === user.id
    );
    
    // Work duties assigned to user
    const userWorkDuties = mockWorkDuties.filter(
      duty => duty.assignedUserIds.includes(user.id)
    );
    
    return {
      meditation: userMeditationSchedules,
      kitchen: userKitchenDuties,
      workDuty: userWorkDuties
    };
  };
  
  // Get the most recent 5 upcoming items for each category
  const getUpcomingSchedule = () => {
    const today = new Date();
    const userSchedule = getPersonalSchedule();
    
    // Filter and sort upcoming events
    const upcomingMeditation = userSchedule.meditation
      .filter(item => new Date(item.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    
    const upcomingKitchen = userSchedule.kitchen
      .filter(item => new Date(item.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    
    const upcomingWorkDuty = userSchedule.workDuty
      .filter(item => new Date(item.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    
    return {
      meditation: upcomingMeditation,
      kitchen: upcomingKitchen,
      workDuty: upcomingWorkDuty
    };
  };
  
  const upcomingSchedule = getUpcomingSchedule();
  
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('YWAM DAR Personal Schedule', 105, 20, { align: 'center' });
      
      // User info
      doc.setFontSize(14);
      doc.text(`Schedule for ${user.firstName} ${user.lastName}`, 105, 30, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      const date = new Date();
      doc.text(`Generated on: ${date.toLocaleDateString()}`, 105, 40, { align: 'center' });
      
      let yPos = 60;
      
      // Personal Meditation Schedule
      if (upcomingSchedule.meditation.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Your Meditation Sessions', 15, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Date', 15, yPos);
        doc.text('Time', 70, yPos);
        doc.text('Bible Verse', 110, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        upcomingSchedule.meditation.forEach(schedule => {
          doc.setFontSize(10);
          doc.text(formatDate(schedule.date), 15, yPos);
          doc.text(schedule.time, 70, yPos);
          doc.text(schedule.bibleVerse, 110, yPos);
          
          yPos += 8;
        });
        
        yPos += 10;
      }
      
      // Personal Kitchen Duties
      if (upcomingSchedule.kitchen.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Your Kitchen Duties', 15, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Date', 15, yPos);
        doc.text('Meal', 55, yPos);
        doc.text('Role', 90, yPos);
        doc.text('Dish', 120, yPos);
        doc.text('Time', 180, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        upcomingSchedule.kitchen.forEach(meal => {
          const role = meal.cookId === user.id ? 'Cook' : 'Washer';
          const time = meal.cookId === user.id ? meal.prepTime : meal.serveTime;
          
          doc.setFontSize(10);
          doc.text(formatDate(meal.date), 15, yPos);
          doc.text(meal.mealType, 55, yPos);
          doc.text(role, 90, yPos);
          doc.text(meal.mealName, 120, yPos);
          doc.text(time, 180, yPos);
          
          yPos += 8;
          
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
        
        yPos += 10;
      }
      
      // Personal Work Duties
      if (upcomingSchedule.workDuty.length > 0) {
        // Check if we need a new page
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Your Work Duties', 15, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Date', 15, yPos);
        doc.text('Time', 55, yPos);
        doc.text('Task', 85, yPos);
        doc.text('Type', 170, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 10;
        
        upcomingSchedule.workDuty.forEach(duty => {
          doc.setFontSize(10);
          doc.text(formatDate(duty.date), 15, yPos);
          doc.text(duty.time, 55, yPos);
          doc.text(duty.taskName, 85, yPos);
          doc.text(duty.isLight ? 'Light' : 'Heavy', 170, yPos);
          
          yPos += 8;
        });
      }
      
      // Save PDF
      doc.save(`ywam-dar-personal-schedule-${user.lastName}.pdf`);
      
      toast.success('Personal schedule downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download schedule. Please try again.');
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.firstName}!</h1>
          <p className="text-gray-600">Here's your upcoming schedule at YWAM DAR</p>
        </div>
        <Button
          variant="primary"
          onClick={generatePdf}
          isLoading={isGeneratingPdf}
          className="flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download My Schedule
        </Button>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Book size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Meditation</h3>
                  <p className="text-sm text-gray-600">Your leadership sessions</p>
                </div>
              </div>
              
              <div className="flex-grow">
                {upcomingSchedule.meditation.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSchedule.meditation.map((schedule) => (
                      <div key={schedule.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <p className="font-medium">{formatDate(schedule.date)}</p>
                        <p className="text-sm text-gray-600">Time: {schedule.time}</p>
                        <p className="text-sm text-gray-600">Bible: {schedule.bibleVerse}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-500">
                    No upcoming meditation sessions.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <ChefHat size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Kitchen Duty</h3>
                  <p className="text-sm text-gray-600">Your cooking & washing duties</p>
                </div>
              </div>
              
              <div className="flex-grow">
                {upcomingSchedule.kitchen.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSchedule.kitchen.map((meal) => {
                      const isCook = meal.cookId === user.id;
                      
                      return (
                        <div key={meal.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{formatDate(meal.date)}</p>
                            <Badge variant={isCook ? 'primary' : 'secondary'} size="sm">
                              {isCook ? 'Cook' : 'Washer'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{meal.mealType}: {meal.mealName}</p>
                          <p className="text-sm text-gray-600">
                            {isCook
                              ? `Prep: ${meal.prepTime} | Serve: ${meal.serveTime}`
                              : `After serving: ${meal.serveTime}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-500">
                    No upcoming kitchen duties.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Briefcase size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Work Duty</h3>
                  <p className="text-sm text-gray-600">Your assigned tasks</p>
                </div>
              </div>
              
              <div className="flex-grow">
                {upcomingSchedule.workDuty.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSchedule.workDuty.map((duty) => (
                      <div key={duty.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{formatDate(duty.date)}</p>
                          <Badge variant={duty.isLight ? 'success' : 'warning'} size="sm">
                            {duty.isLight ? 'Light' : 'Heavy'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{duty.taskName}</p>
                        <p className="text-sm text-gray-600">Time: {duty.time}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-500">
                    No upcoming work duties.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card title="Weekly Calendar">
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              // Calculate date for this day
              const currentDate = new Date();
              const startOfWeek = new Date(currentDate);
              const firstDayOfWeek = currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1);
              startOfWeek.setDate(firstDayOfWeek);
              
              const thisDay = new Date(startOfWeek);
              thisDay.setDate(startOfWeek.getDate() + index);
              
              const formattedDate = thisDay.toISOString().split('T')[0];
              
              // Check if there are duties for this day
              const hasMeditation = upcomingSchedule.meditation.some(s => s.date === formattedDate);
              const hasKitchen = upcomingSchedule.kitchen.some(m => m.date === formattedDate);
              const hasWorkDuty = upcomingSchedule.workDuty.some(w => w.date === formattedDate);
              
              const isToday = new Date().toDateString() === thisDay.toDateString();
              
              return (
                <div 
                  key={day} 
                  className={`p-2 min-h-24 border rounded-md ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{day}</span>
                    <span className={`text-sm ${isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                      {thisDay.getDate()}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {hasMeditation && (
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span>
                        <span className="text-xs text-blue-600">Meditation</span>
                      </div>
                    )}
                    
                    {hasKitchen && (
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                        <span className="text-xs text-amber-600">Kitchen</span>
                      </div>
                    )}
                    
                    {hasWorkDuty && (
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-600 mr-1"></span>
                        <span className="text-xs text-green-600">Work Duty</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card title="Important Announcements">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mb-4">
            <h3 className="font-medium text-blue-800">Weekly Community Meeting</h3>
            <p className="text-blue-700 mt-1">
              Please remember that we have our weekly community meeting every Sunday at 7:00 PM in the main hall.
            </p>
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
            <h3 className="font-medium text-amber-800">Upcoming Outreach Program</h3>
            <p className="text-amber-700 mt-1">
              Our next outreach program to the local community will be held this Saturday. 
              Please check with your team leaders for specific assignments and timing.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default StaffDashboard;