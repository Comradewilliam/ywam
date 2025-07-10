import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Download, Calendar, Users, Book, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { mockMeditationSchedules, mockMeals, mockWorkDuties, mockUsers } from '../../mock/mockData';

const AdminDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  if (!user) return null;
  
  const stats = {
    totalUsers: mockUsers.length,
    meditationSessions: mockMeditationSchedules.length,
    mealPlans: mockMeals.length,
    workDuties: mockWorkDuties.length
  };
  
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('YWAM DAR Management System', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Monthly Schedule Report', 105, 30, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      const date = new Date();
      doc.text(`Generated on: ${date.toLocaleDateString()}`, 105, 40, { align: 'center' });
      
      // Meditation Schedule
      doc.setFontSize(12);
      doc.text('Meditation Schedule', 14, 60);
      
      let yPos = 70;
      mockMeditationSchedules.forEach((schedule, index) => {
        const user = mockUsers.find(u => u.id === schedule.userId);
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${new Date(schedule.date).toLocaleDateString()} at ${schedule.time}`, 20, yPos);
        doc.text(`Leader: ${user?.firstName} ${user?.lastName}`, 20, yPos + 5);
        doc.text(`Bible Verse: ${schedule.bibleVerse}`, 20, yPos + 10);
        yPos += 20;
      });
      
      // Save PDF
      doc.save('ywam-dar-monthly-schedule.pdf');
      
      toast.success('Schedule downloaded successfully!');
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
          <p className="text-gray-600">Here's an overview of your YWAM DAR management system</p>
        </div>
        <Button
          variant="primary"
          onClick={generatePdf}
          isLoading={isGeneratingPdf}
          className="flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download Monthly Schedule
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
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
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
                <h3 className="text-2xl font-bold text-gray-900">{stats.meditationSessions}</h3>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <Calendar size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Meal Plans</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.mealPlans}</h3>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <MessageSquare size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Work Duties</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.workDuties}</h3>
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
          <Card title="Upcoming Meditation Schedule">
            <div className="space-y-4">
              {mockMeditationSchedules.slice(0, 3).map(schedule => {
                const leader = mockUsers.find(u => u.id === schedule.userId);
                return (
                  <div key={schedule.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{new Date(schedule.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">{schedule.time} - Leader: {leader?.firstName} {leader?.lastName}</p>
                      </div>
                      <Badge variant="primary">{schedule.bibleVerse}</Badge>
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
          transition={{ delay: 0.1 }}
        >
          <Card title="Today's Meal Plan">
            <div className="space-y-4">
              {mockMeals.slice(0, 3).map(meal => {
                const cook = mockUsers.find(u => u.id === meal.cookId);
                return (
                  <div key={meal.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{meal.mealType}</p>
                        <p className="text-sm text-gray-600">{meal.mealName}</p>
                        <p className="text-xs text-gray-500">Cook: {cook?.firstName} {cook?.lastName} | Serve Time: {meal.serveTime}</p>
                      </div>
                      <Badge 
                        variant={
                          meal.mealType === 'Breakfast' ? 'primary' : 
                          meal.mealType === 'Lunch' ? 'success' : 'warning'
                        }
                      >
                        {meal.mealType}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;