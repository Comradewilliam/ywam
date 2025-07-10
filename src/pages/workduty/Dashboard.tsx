import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Calendar, Briefcase, Download, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { mockWorkDuties, mockUsers } from '../../mock/mockData';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';

const WorkDutyDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  if (!user) return null;
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Filter duties for today
  const todayDuties = mockWorkDuties.filter(duty => duty.date === today);
  
  // Get upcoming duties for the week (next 7 days)
  const upcomingDuties = mockWorkDuties.filter(duty => {
    const dutyDate = new Date(duty.date);
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);
    
    return dutyDate >= now && dutyDate <= sevenDaysLater && duty.date !== today;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Count stats
  const stats = {
    totalDuties: mockWorkDuties.length,
    myAssignments: mockWorkDuties.filter(duty => duty.assignedUserIds.includes(user.id)).length,
    lightDuties: mockWorkDuties.filter(duty => duty.isLight).length,
    heavyDuties: mockWorkDuties.filter(duty => !duty.isLight).length
  };
  
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('YWAM DAR Work Duty Schedule', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Weekly Work Duty Assignment', 105, 30, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      const date = new Date();
      doc.text(`Generated on: ${date.toLocaleDateString()}`, 105, 40, { align: 'center' });
      
      // Column headers
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Date', 15, 60);
      doc.text('Time', 55, 60);
      doc.text('Task', 85, 60);
      doc.text('Type', 150, 60);
      doc.text('Assigned To', 180, 60);
      doc.setFont(undefined, 'normal');
      
      // Work duty data
      let yPos = 70;
      const nextWeekDuties = [...todayDuties, ...upcomingDuties].slice(0, 15); // Limit to 15 duties
      
      // Sort by date
      nextWeekDuties.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      nextWeekDuties.forEach(duty => {
        doc.setFontSize(10);
        doc.text(formatDate(duty.date), 15, yPos);
        doc.text(duty.time, 55, yPos);
        doc.text(duty.taskName, 85, yPos);
        doc.text(duty.isLight ? 'Light' : 'Heavy', 150, yPos);
        
        // Get assigned users' names
        const assignedUsers = duty.assignedUserIds.map(id => {
          const user = mockUsers.find(u => u.id === id);
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
        });
        
        // Handle multiple assignees with line breaks if needed
        if (assignedUsers.join(', ').length > 25) {
          let lineYPos = yPos;
          assignedUsers.forEach(name => {
            doc.text(name, 180, lineYPos);
            lineYPos += 5;
          });
          
          // Update yPos for next duty based on number of assignees
          yPos = lineYPos + 3;
        } else {
          doc.text(assignedUsers.join(', '), 180, yPos);
          yPos += 10;
        }
        
        // Add a new page if we run out of space
        if (yPos > 280 && nextWeekDuties.indexOf(duty) < nextWeekDuties.length - 1) {
          doc.addPage();
          
          // Add headers to new page
          yPos = 20;
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Date', 15, yPos);
          doc.text('Time', 55, yPos);
          doc.text('Task', 85, yPos);
          doc.text('Type', 150, yPos);
          doc.text('Assigned To', 180, yPos);
          doc.setFont(undefined, 'normal');
          
          yPos += 10;
        }
      });
      
      // Save PDF
      doc.save('ywam-dar-work-duty-schedule.pdf');
      
      toast.success('Work duty schedule downloaded successfully!');
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
          <p className="text-gray-600">Manage work duties and task assignments</p>
        </div>
        <Button
          variant="primary"
          onClick={generatePdf}
          isLoading={isGeneratingPdf}
          className="flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download Work Duty Schedule
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
                <Briefcase size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Duties</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalDuties}</h3>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
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
                <p className="text-sm font-medium text-gray-600">Light Duties</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.lightDuties}</h3>
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
                <p className="text-sm font-medium text-gray-600">Heavy Duties</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.heavyDuties}</h3>
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
          <Card title="Today's Work Duties">
            <div className="space-y-4">
              {todayDuties.length > 0 ? (
                todayDuties.map(duty => {
                  const assignedUsers = duty.assignedUserIds.map(id => 
                    mockUsers.find(u => u.id === id)
                  ).filter(Boolean);
                  
                  return (
                    <div key={duty.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <Badge 
                              variant={duty.isLight ? 'success' : 'warning'}
                              className="mr-2"
                            >
                              {duty.isLight ? 'Light' : 'Heavy'}
                            </Badge>
                            <p className="font-medium">{duty.taskName}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Time: {duty.time}</p>
                          
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Assigned to:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {assignedUsers.map(user => (
                                <Badge key={user?.id} variant="secondary" size="sm">
                                  {user?.firstName} {user?.lastName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No work duties scheduled for today.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/work-duty/tasks'}
                    className="mt-4"
                  >
                    Create Work Duties
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
          <Card title="Upcoming Work Duties">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {upcomingDuties.length > 0 ? (
                upcomingDuties.slice(0, 9).map(duty => {
                  return (
                    <div key={duty.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{formatDate(duty.date)}</p>
                          <div className="flex items-center">
                            <Badge 
                              variant={duty.isLight ? 'success' : 'warning'}
                              size="sm"
                              className="mr-2"
                            >
                              {duty.isLight ? 'Light' : 'Heavy'}
                            </Badge>
                            <p className="font-medium">{duty.taskName}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Time: {duty.time} | People: {duty.peopleCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No upcoming work duties scheduled.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/work-duty/tasks'}
                    className="mt-4"
                  >
                    Create Work Duties
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
        <Card title="My Work Duty Assignments">
          <div className="space-y-4">
            {mockWorkDuties.filter(duty => duty.assignedUserIds.includes(user.id))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map(duty => {
                const otherAssignees = duty.assignedUserIds
                  .filter(id => id !== user.id)
                  .map(id => mockUsers.find(u => u.id === id))
                  .filter(Boolean);
                
                return (
                  <div key={duty.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(duty.date)}</p>
                        <div className="flex items-center">
                          <Badge 
                            variant={duty.isLight ? 'success' : 'warning'}
                            className="mr-2"
                          >
                            {duty.isLight ? 'Light' : 'Heavy'}
                          </Badge>
                          <p className="font-medium">{duty.taskName}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Time: {duty.time}</p>
                        
                        {otherAssignees.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Working with:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {otherAssignees.map(user => (
                                <Badge key={user?.id} variant="secondary" size="sm">
                                  {user?.firstName} {user?.lastName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {mockWorkDuties.filter(duty => duty.assignedUserIds.includes(user.id)).length === 0 && (
              <div className="py-8 text-center">
                <p className="text-gray-500">You don't have any work duties assigned yet.</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default WorkDutyDashboard;