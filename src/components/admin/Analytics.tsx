import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { BarChart3, Users, Calendar, MessageSquare, Download, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyticsService, AnalyticsData } from '../../services/analyticsService';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';

const Analytics: React.FC = () => {
  const { users } = useSelector((state: RootState) => state.users);
  const { meditation, meals, workDuties } = useSelector((state: RootState) => state.schedules);
  const { messages } = useSelector((state: RootState) => state.messages);
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const data = analyticsService.generateAnalytics(users, meditation, meals, workDuties, messages);
    setAnalytics(data);
  }, [users, meditation, meals, workDuties, messages]);

  const generateReport = async () => {
    if (!analytics) return;
    
    setIsGeneratingReport(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('YWAM DAR Analytics Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
      doc.text(`Time Range: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, 105, 40, { align: 'center' });
      
      let yPos = 60;
      
      // User Statistics
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('User Statistics', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Users: ${analytics.userStats.totalUsers}`, 14, yPos);
      yPos += 8;
      doc.text(`Active Users: ${analytics.userStats.activeUsers}`, 14, yPos);
      yPos += 8;
      doc.text(`New Users This Month: ${analytics.userStats.newUsersThisMonth}`, 14, yPos);
      yPos += 15;
      
      // Users by Role
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Users by Role:', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      Object.entries(analytics.userStats.usersByRole).forEach(([role, count]) => {
        doc.text(`${role}: ${count}`, 20, yPos);
        yPos += 6;
      });
      yPos += 10;
      
      // Schedule Statistics
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Schedule Statistics', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Meditation Sessions: ${analytics.scheduleStats.totalMeditationSessions}`, 14, yPos);
      yPos += 8;
      doc.text(`Meals Planned: ${analytics.scheduleStats.totalMeals}`, 14, yPos);
      yPos += 8;
      doc.text(`Work Duties: ${analytics.scheduleStats.totalWorkDuties}`, 14, yPos);
      yPos += 8;
      doc.text(`Completion Rate: ${(analytics.scheduleStats.completionRate * 100).toFixed(1)}%`, 14, yPos);
      yPos += 15;
      
      // Message Statistics
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Message Statistics', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Messages Sent: ${analytics.messageStats.totalMessagesSent}`, 14, yPos);
      yPos += 8;
      doc.text(`Delivery Rate: ${(analytics.messageStats.deliveryRate * 100).toFixed(1)}%`, 14, yPos);
      yPos += 15;
      
      // System Performance
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('System Performance', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Average Response Time: ${analytics.systemStats.averageResponseTime}ms`, 14, yPos);
      yPos += 8;
      doc.text(`Error Rate: ${(analytics.systemStats.errorRate * 100).toFixed(2)}%`, 14, yPos);
      yPos += 8;
      doc.text(`System Uptime: ${(analytics.systemStats.uptime / 3600).toFixed(1)} hours`, 14, yPos);
      
      doc.save(`ywam-dar-analytics-report-${timeRange}.pdf`);
      toast.success('Analytics report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!analytics) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">System usage statistics and insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'This Quarter' },
              { value: 'year', label: 'This Year' },
            ]}
            value={timeRange}
            onChange={(value) => setTimeRange(value as any)}
            className="w-40"
          />
          
          <Button
            variant="primary"
            onClick={generateReport}
            isLoading={isGeneratingReport}
            className="flex items-center"
          >
            <Download size={16} className="mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-full">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.userStats.totalUsers}</h3>
              <p className="text-xs text-green-600">
                <TrendingUp size={12} className="inline mr-1" />
                {analytics.userStats.newUsersThisMonth} new this month
              </p>
            </div>
          </div>
        </Card>

        <Card className="h-full">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Calendar size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.userStats.activeUsers}</h3>
              <p className="text-xs text-gray-500">Last hour</p>
            </div>
          </div>
        </Card>

        <Card className="h-full">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <BarChart3 size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {(analytics.scheduleStats.completionRate * 100).toFixed(1)}%
              </h3>
              <p className="text-xs text-gray-500">Schedule adherence</p>
            </div>
          </div>
        </Card>

        <Card className="h-full">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <MessageSquare size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages Sent</p>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.messageStats.totalMessagesSent}</h3>
              <p className="text-xs text-green-600">
                {(analytics.messageStats.deliveryRate * 100).toFixed(1)}% delivered
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card title="Users by Role">
            <div className="space-y-3">
              {Object.entries(analytics.userStats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{role}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / analytics.userStats.totalUsers) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card title="Users by University">
            <div className="space-y-3">
              {Object.entries(analytics.userStats.usersByUniversity)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([university, count]) => (
                <div key={university} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{university}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / analytics.userStats.totalUsers) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* System Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card title="System Performance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.systemStats.averageResponseTime}ms
              </div>
              <div className="text-sm text-gray-600">Average Response Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {(analytics.systemStats.errorRate * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {(analytics.systemStats.uptime / 3600).toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">System Uptime</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Analytics;