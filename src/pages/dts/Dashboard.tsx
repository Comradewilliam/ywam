import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Download, Calendar, ChefHat, Briefcase, BookOpen, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { mockMeals, mockWorkDuties } from '../../mock/mockData';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';

const DTSDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  if (!user) return null;
  
  // Get user's personal schedule
  const getPersonalSchedule = () => {
    // Kitchen duties (cooking or washing) - DTS can have kitchen duty except on weekends
    const userKitchenDuties = mockMeals.filter(meal => {
      const dayOfWeek = new Date(meal.date).getDay();
      // Filter out Saturday (6) and Sunday (0) kitchen duties
      if (dayOfWeek === 6 || dayOfWeek === 0) return false;
      
      return meal.cookId === user.id || meal.washerId === user.id;
    });
    
    // Work duties assigned to user
    const userWorkDuties = mockWorkDuties.filter(
      duty => duty.assignedUserIds.includes(user.id)
    );
    
    return {
      kitchen: userKitchenDuties,
      workDuty: userWorkDuties
    };
  };
  
  // Get upcoming schedule
  const getUpcomingSchedule = () => {
    const today = new Date();
    const userSchedule = getPersonalSchedule();
    
    // Filter and sort upcoming events
    const upcomingKitchen = userSchedule.kitchen
      .filter(item => new Date(item.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    
    const upcomingWorkDuty = userSchedule.workDuty
      .filter(item => new Date(item.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    
    // Get today's meals (regardless of assignment)
    const todayMeals = mockMeals.filter(meal => {
      const mealDate = new Date(meal.date);
      const today = new Date();
      return mealDate.toDateString() === today.toDateString();
    }).sort((a, b) => {
      // Sort by meal type (Breakfast, Lunch, Dinner)
      const mealTypeOrder = { 'Breakfast': 1, 'Lunch': 2, 'Dinner': 3 };
      return mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType];
    });
    
    return {
      kitchen: upcomingKitchen,
      workDuty: upcomingWorkDuty,
      todayMeals
    };
  };
  
  const upcomingSchedule = getUpcomingSchedule();
  
  // Get weekly schedule summary
  const getWeeklySummary = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Sunday
    
    const weeklyKitchen = mockMeals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate >= startOfWeek && mealDate <= endOfWeek;
    });
    
    const weeklyWorkDuty = mockWorkDuties.filter(duty => {
      const dutyDate = new Date(duty.date);
      return dutyDate >= startOfWeek && dutyDate <= endOfWeek;
    });
    
    return {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
      kitchen: weeklyKitchen,
      workDuty: weeklyWorkDuty
    };
  };
  
  const weeklySummary = getWeeklySummary();
  
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
      
      // Date range
      doc.text(`For the week of: ${formatDate(weeklySummary.startDate)} to ${formatDate(weeklySummary.endDate)}`, 105, 50, { align: 'center' });
      
      let yPos = 70;
      
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
      doc.save(`ywam-dar-dts-schedule-${user.lastName}.pdf`);
      
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
          <p className="text-gray-600">Your DTS dashboard at YWAM DAR</p>
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
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="h-full">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <GraduationCap size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-bold text-gray-900">DTS Weekly Schedule</h2>
                <p className="text-sm text-gray-600">
                  {formatDate(weeklySummary.startDate)} - {formatDate(weeklySummary.endDate)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mt-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                // Calculate date for this day
                const startOfWeek = new Date(weeklySummary.startDate);
                const thisDay = new Date(startOfWeek);
                thisDay.setDate(startOfWeek.getDate() + index);
                
                const formattedDate = thisDay.toISOString().split('T')[0];
                
                // Check if there are duties for this day
                const hasKitchen = weeklySummary.kitchen.some(m => m.date === formattedDate && (m.cookId === user.id || m.washerId === user.id));
                const hasWorkDuty = weeklySummary.workDuty.some(w => w.date === formattedDate && w.assignedUserIds.includes(user.id));
                
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
                      
                      {/* DTS classes are every weekday */}
                      {index < 5 && (
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span>
                          <span className="text-xs text-blue-600">Classes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card title="My Duties" className="h-full">
            <div className="divide-y">
              {upcomingSchedule.kitchen.length > 0 && (
                <div className="pb-4">
                  <h3 className="flex items-center text-md font-medium mb-2">
                    <ChefHat size={18} className="mr-2 text-amber-600" />
                    Kitchen Duties
                  </h3>
                  
                  <div className="space-y-2">
                    {upcomingSchedule.kitchen.slice(0, 3).map(meal => {
                      const isCook = meal.cookId === user.id;
                      
                      return (
                        <div key={meal.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{formatDate(meal.date)}</p>
                            <p className="text-xs text-gray-600">
                              {meal.mealType}: {meal.mealName}
                            </p>
                          </div>
                          <Badge 
                            variant={isCook ? 'primary' : 'secondary'} 
                            size="sm"
                          >
                            {isCook ? 'Cook' : 'Washer'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {upcomingSchedule.workDuty.length > 0 && (
                <div className="py-4">
                  <h3 className="flex items-center text-md font-medium mb-2">
                    <Briefcase size={18} className="mr-2 text-green-600" />
                    Work Duties
                  </h3>
                  
                  <div className="space-y-2">
                    {upcomingSchedule.workDuty.slice(0, 3).map(duty => (
                      <div key={duty.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{formatDate(duty.date)}</p>
                          <p className="text-xs text-gray-600">{duty.taskName}</p>
                        </div>
                        <Badge 
                          variant={duty.isLight ? 'success' : 'warning'} 
                          size="sm"
                        >
                          {duty.time}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {upcomingSchedule.kitchen.length === 0 && upcomingSchedule.workDuty.length === 0 && (
                <div className="py-4 text-center text-gray-500">
                  No upcoming duties assigned to you.
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Card title="Today's Meals">
            <div className="space-y-4">
              {upcomingSchedule.todayMeals.length > 0 ? (
                upcomingSchedule.todayMeals.map(meal => {
                  return (
                    <div key={meal.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <Badge 
                              variant={
                                meal.mealType === 'Breakfast' ? 'primary' : 
                                meal.mealType === 'Lunch' ? 'success' : 'warning'
                              }
                              className="mr-2"
                            >
                              {meal.mealType}
                            </Badge>
                            <p className="font-medium">{meal.mealName}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Serving time: {meal.serveTime}</p>
                        </div>
                        
                        {(meal.cookId === user.id || meal.washerId === user.id) && (
                          <Badge variant="secondary">
                            {meal.cookId === user.id ? 'You are cooking' : 'You are washing'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No meals scheduled for today.</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Card title="DTS Class Schedule">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Monday - Friday</h3>
                    <p className="text-sm text-gray-600">08:30 - 12:30</p>
                  </div>
                  <Badge variant="primary">Morning Session</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Bible study, worship, and teaching sessions in the main hall.
                </p>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Monday, Wednesday, Friday</h3>
                    <p className="text-sm text-gray-600">14:00 - 16:00</p>
                  </div>
                  <Badge variant="secondary">Afternoon Session</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Small group discussions and practical applications.
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Tuesday, Thursday</h3>
                    <p className="text-sm text-gray-600">14:00 - 17:00</p>
                  </div>
                  <Badge variant="success">Community Outreach</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Local ministry and community service activities.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card title="Important Announcements">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mb-4">
            <h3 className="font-medium text-blue-800">DTS Group Meeting</h3>
            <p className="text-blue-700 mt-1">
              DTS students will have a special group meeting this Friday at 19:00 to discuss the upcoming outreach opportunities.
            </p>
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
            <h3 className="font-medium text-amber-800">Assignment Due Date</h3>
            <p className="text-amber-700 mt-1">
              Remember that your written reflections on this week's teaching are due by Thursday at 16:00.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default DTSDashboard;