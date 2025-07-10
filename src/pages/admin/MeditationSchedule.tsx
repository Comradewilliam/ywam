import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { fetchSchedulesStart, fetchSchedulesSuccess, fetchSchedulesFailure, addMeditationSchedule } from '../../store/slices/schedulesSlice';
import { mockApi } from '../../mock/mockData';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Calendar, Plus, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { bibleBooks } from '../../utils/bibleData';
import { formatDate, hasRole } from '../../utils/helpers';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const MeditationSchedulePage: React.FC = () => {
  const dispatch = useDispatch();
  const { meditation: schedules, isLoading } = useSelector((state: RootState) => state.schedules);
  const { users } = useSelector((state: RootState) => state.users);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  
  // Weekly schedule form state
  const [weeklySchedule, setWeeklySchedule] = useState({
    startDate: new Date().toISOString().split('T')[0],
    leader: '',
    days: [
      { day: 'Monday', book: 'John', chapter: 1, startVerse: 1, endVerse: 5 },
      { day: 'Tuesday', book: 'John', chapter: 1, startVerse: 6, endVerse: 10 },
      { day: 'Wednesday', book: 'John', chapter: 1, startVerse: 11, endVerse: 15 },
      { day: 'Thursday', book: 'John', chapter: 1, startVerse: 16, endVerse: 20 },
      { day: 'Friday', book: 'John', chapter: 1, startVerse: 21, endVerse: 25 },
      { day: 'Saturday', book: 'John', chapter: 1, startVerse: 26, endVerse: 30 },
      { day: 'Sunday', book: 'John', chapter: 1, startVerse: 31, endVerse: 35 }
    ]
  });
  
  // Get eligible users (Staff and Missionary)
  const eligibleUsers = users.filter(user => 
    hasRole(user, 'Staff') || hasRole(user, 'Missionary')
  );
  
  const handleDayChange = (dayIndex: number, field: string, value: any) => {
    setWeeklySchedule(prev => ({
      ...prev,
      days: prev.days.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };
  
  const generateWeeklySchedule = async () => {
    if (!weeklySchedule.leader) {
      toast.error('Please select a leader for the week');
      return;
    }

    setIsGenerating(true);

    try {
      const startDate = new Date(weeklySchedule.startDate);
      
      // Create meditation sessions for each day
      for (let i = 0; i < 7; i++) {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(startDate.getDate() + i);
        
        const formattedDate = sessionDate.toISOString().split('T')[0];
        const daySchedule = weeklySchedule.days[i];
        
        // Check if session already exists for this date
        const existingSession = schedules.find(s => s.date === formattedDate);
        
        if (!existingSession) {
          const bibleVerse = `${daySchedule.book} ${daySchedule.chapter}:${daySchedule.startVerse}-${daySchedule.endVerse}`;
          
          const sessionData = {
            date: formattedDate,
            time: '06:00',
            userId: weeklySchedule.leader,
            bibleVerse: bibleVerse,
          };
          
          const newSession = await mockApi.createMeditationSchedule(sessionData);
          dispatch(addMeditationSchedule(newSession));
        }
      }
      
      toast.success('Weekly meditation schedule generated successfully');
      
      // Reset form
      setWeeklySchedule(prev => ({
        ...prev,
        startDate: new Date(new Date(prev.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
      
    } catch (error) {
      toast.error('Failed to generate meditation schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMonthlyPdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Create PDF in landscape orientation
      const doc = new jsPDF('landscape');
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('YOUTH WITH A MISSION', 148, 15, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('MEDITATION SCHEDULE', 148, 25, { align: 'center' });
      
      // Month and Year
      const monthYear = new Date(selectedMonth + '-01').toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      doc.text(monthYear, 148, 35, { align: 'center' });
      
      // Generate date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148, 45, { align: 'center' });
      
      // Filter schedules for the month
      const monthlySchedules = schedules.filter(schedule => 
        schedule.date.startsWith(selectedMonth)
      ).sort((a, b) => a.date.localeCompare(b.date));
      
      // Create table data
      const data = monthlySchedules.map(schedule => {
        const date = new Date(schedule.date);
        const leader = users.find(u => u.id === schedule.userId);
        
        return [
          formatDate(schedule.date),
          date.toLocaleDateString('en-US', { weekday: 'long' }),
          schedule.time,
          leader ? `${leader.firstName} ${leader.lastName}` : 'Not assigned',
          schedule.bibleVerse
        ];
      });
      
      if (data.length === 0) {
        data.push(['No meditation sessions scheduled', '', '', '', '']);
      }
      
      // Add table
      (doc as any).autoTable({
        head: [['Date', 'Day', 'Time', 'Leader', 'Bible Verse']],
        body: data,
        startY: 55,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [0, 123, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 50 },
          4: { cellWidth: 'auto' },
        },
        margin: { left: 15, right: 15 }
      });
      
      // Save the PDF
      doc.save(`ywam-dar-meditation-schedule-${selectedMonth}.pdf`);
      toast.success('Monthly meditation schedule PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Meditation Schedule</h1>
          <p className="text-gray-600">Set up weekly meditation sessions with daily Bible verses</p>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          
          <Button
            variant="primary"
            onClick={generateMonthlyPdf}
            isLoading={isGeneratingPdf}
            className="flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download Monthly Schedule
          </Button>
        </div>
      </div>

      <Card title="Create Weekly Meditation Schedule">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Week Starting Date"
              type="date"
              value={weeklySchedule.startDate}
              onChange={(e) => setWeeklySchedule(prev => ({ ...prev, startDate: e.target.value }))}
            />
            
            <Select
              label="Weekly Leader"
              value={weeklySchedule.leader}
              onChange={(value) => setWeeklySchedule(prev => ({ ...prev, leader: value }))}
              options={[
                { value: '', label: 'Select a leader' },
                ...eligibleUsers.map(user => ({
                  value: user.id,
                  label: `${user.firstName} ${user.lastName}`
                }))
              ]}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Daily Bible Verses</h3>
            
            {weeklySchedule.days.map((day, index) => (
              <div key={day.day} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">{day.day}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Select
                    label="Bible Book"
                    value={day.book}
                    onChange={(value) => handleDayChange(index, 'book', value)}
                    options={bibleBooks.map(book => ({
                      value: book.name,
                      label: book.name
                    }))}
                  />
                  
                  <Input
                    label="Chapter"
                    type="number"
                    min={1}
                    max={bibleBooks.find(b => b.name === day.book)?.chapters || 1}
                    value={day.chapter}
                    onChange={(e) => handleDayChange(index, 'chapter', parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Start Verse"
                    type="number"
                    min={1}
                    value={day.startVerse}
                    onChange={(e) => handleDayChange(index, 'startVerse', parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="End Verse"
                    type="number"
                    min={day.startVerse}
                    value={day.endVerse}
                    onChange={(e) => handleDayChange(index, 'endVerse', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  Preview: {day.book} {day.chapter}:{day.startVerse}-{day.endVerse}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={generateWeeklySchedule}
              isLoading={isGenerating}
              className="flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Generate Weekly Schedule
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Current Month's Schedule">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bible Verse</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules
                .filter(schedule => schedule.date.startsWith(selectedMonth))
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(schedule => {
                  const leader = users.find(u => u.id === schedule.userId);
                  const date = new Date(schedule.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

                  return (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{dayName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(schedule.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{schedule.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {leader ? `${leader.firstName} ${leader.lastName}` : 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{schedule.bibleVerse}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MeditationSchedulePage;