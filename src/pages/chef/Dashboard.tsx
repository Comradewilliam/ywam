import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Calendar, ChefHat, Download, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { mockMeals, mockUsers } from '../../mock/mockData';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';

const ChefDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  if (!user) return null;
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Filter meals for today
  const todayMeals = mockMeals.filter(meal => meal.date === today);
  
  // Get upcoming meals for the week (next 7 days)
  const upcomingMeals = mockMeals.filter(meal => {
    const mealDate = new Date(meal.date);
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);
    
    return mealDate >= now && mealDate <= sevenDaysLater && meal.date !== today;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Count total meals and assignments
  const stats = {
    totalMeals: mockMeals.length,
    myAssignments: mockMeals.filter(meal => meal.cookId === user.id || meal.washerId === user.id).length,
    breakfast: mockMeals.filter(meal => meal.mealType === 'Breakfast').length,
    lunchDinner: mockMeals.filter(meal => meal.mealType === 'Lunch' || meal.mealType === 'Dinner').length
  };
  
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('YWAM DAR Kitchen Schedule', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Weekly Meal Plan', 105, 30, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      const date = new Date();
      doc.text(`Generated on: ${date.toLocaleDateString()}`, 105, 40, { align: 'center' });
      
      // Column headers
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Date', 15, 60);
      doc.text('Meal', 65, 60);
      doc.text('Dish', 100, 60);
      doc.text('Cook', 140, 60);
      doc.text('Washer', 180, 60);
      doc.setFont(undefined, 'normal');
      
      // Meal data
      let yPos = 70;
      const nextWeekMeals = [...todayMeals, ...upcomingMeals].slice(0, 21); // Limit to 21 meals (7 days * 3 meals)
      
      // Sort by date and then by meal type (Breakfast, Lunch, Dinner)
      nextWeekMeals.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        const mealTypeOrder = { 'Breakfast': 1, 'Lunch': 2, 'Dinner': 3 };
        return mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType];
      });
      
      let currentDate = '';
      
      nextWeekMeals.forEach(meal => {
        const cook = mockUsers.find(u => u.id === meal.cookId);
        const washer = mockUsers.find(u => u.id === meal.washerId);
        
        // Add date only once per day
        const formattedDate = formatDate(meal.date);
        const displayDate = meal.date === currentDate ? '' : formattedDate;
        if (meal.date !== currentDate) {
          currentDate = meal.date;
        }
        
        doc.setFontSize(10);
        doc.text(displayDate, 15, yPos);
        doc.text(meal.mealType, 65, yPos);
        doc.text(meal.mealName, 100, yPos);
        doc.text(`${cook?.firstName} ${cook?.lastName}`, 140, yPos);
        doc.text(`${washer?.firstName} ${washer?.lastName}`, 180, yPos);
        
        yPos += 10;
        
        // Add a new page if we run out of space
        if (yPos > 280 && nextWeekMeals.indexOf(meal) < nextWeekMeals.length - 1) {
          doc.addPage();
          
          // Add headers to new page
          yPos = 20;
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Date', 15, yPos);
          doc.text('Meal', 65, yPos);
          doc.text('Dish', 100, yPos);
          doc.text('Cook', 140, yPos);
          doc.text('Washer', 180, yPos);
          doc.setFont(undefined, 'normal');
          
          yPos += 10;
        }
      });
      
      // Save PDF
      doc.save('ywam-dar-kitchen-schedule.pdf');
      
      toast.success('Kitchen schedule downloaded successfully!');
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
          <p className="text-gray-600">Manage kitchen duties and meal planning</p>
        </div>
        <Button
          variant="primary"
          onClick={generatePdf}
          isLoading={isGeneratingPdf}
          className="flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download Kitchen Schedule
        </Button>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <ChefHat size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Meals</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalMeals}</h3>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Assignments</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.myAssignments}</h3>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Calendar size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Breakfast Meals</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.breakfast}</h3>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <Calendar size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lunch & Dinner</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.lunchDinner}</h3>
              </div>
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
              {todayMeals.length > 0 ? (
                todayMeals.map(meal => {
                  const cook = mockUsers.find(u => u.id === meal.cookId);
                  const washer = mockUsers.find(u => u.id === meal.washerId);
                  
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
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Cook:</p>
                              <p>{cook?.firstName} {cook?.lastName}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Washer:</p>
                              <p>{washer?.firstName} {washer?.lastName}</p>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            <p>Prep: {meal.prepTime} | Serve: {meal.serveTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No meals scheduled for today.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/chef/meal-plan'}
                    className="mt-4"
                  >
                    Create Meal Plan
                  </Button>
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
          <Card title="Upcoming Meals This Week">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {upcomingMeals.length > 0 ? (
                upcomingMeals.slice(0, 9).map(meal => {
                  const cook = mockUsers.find(u => u.id === meal.cookId);
                  
                  return (
                    <div key={meal.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{formatDate(meal.date)}</p>
                          <div className="flex items-center">
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
                            <p className="font-medium">{meal.mealName}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Cook: {cook?.firstName} {cook?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No upcoming meals scheduled.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/chef/meal-plan'}
                    className="mt-4"
                  >
                    Create Meal Plan
                  </Button>
                </div>
              )}
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
        <Card title="My Kitchen Duties">
          <div className="space-y-4">
            {mockMeals.filter(meal => meal.cookId === user.id || meal.washerId === user.id)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map(meal => {
                const isCook = meal.cookId === user.id;
                
                return (
                  <div key={meal.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(meal.date)}</p>
                        <div className="flex items-center">
                          <Badge 
                            variant={isCook ? 'primary' : 'secondary'}
                            className="mr-2"
                          >
                            {isCook ? 'Cook' : 'Washer'}
                          </Badge>
                          <p className="font-medium">
                            {meal.mealType}: {meal.mealName}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {isCook 
                            ? `Prep: ${meal.prepTime} | Serve: ${meal.serveTime}` 
                            : `After serving: ${meal.serveTime}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {mockMeals.filter(meal => meal.cookId === user.id || meal.washerId === user.id).length === 0 && (
              <div className="py-8 text-center">
                <p className="text-gray-500">You don't have any kitchen duties assigned yet.</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ChefDashboard;