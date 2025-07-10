import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { jsPDF } from 'jspdf';
import { Calendar, Download, RefreshCw, Users, ArrowLeftRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseService } from '../../services/supabaseService';
import { kitchenRulesService } from '../../services/kitchenRulesService';
import { enhancedSmsService } from '../../services/enhancedSmsService';
import { hasRole, formatDate } from '../../utils/helpers';

const EnhancedMealPlanning: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  const [selectedWeek, setSelectedWeek] = useState<string>(
    getStartOfWeek(new Date()).toISOString().split('T')[0]
  );
  
  const [isGeneratingMeals, setIsGeneratingMeals] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [weekMeals, setWeekMeals] = useState<{[key: string]: WeeklyMealPlan}>({});
  const [assignedMeals, setAssignedMeals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeData, setExchangeData] = useState({
    fromMealId: '',
    toMealId: '',
  });
  const [isSchedulePublished, setIsSchedulePublished] = useState(false);

  // Types for meal planning
  type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
  type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  
  interface DayMeals {
    breakfast: string;
    lunch: string;
    dinner: string;
    date: string;
  }
  
  interface WeeklyMealPlan {
    monday: DayMeals;
    tuesday: DayMeals;
    wednesday: DayMeals;
    thursday: DayMeals;
    friday: DayMeals;
    saturday: DayMeals;
    sunday: DayMeals;
  }
  
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
  
  // Initial empty state for a week
  const getInitialWeekState = (startDate: Date): WeeklyMealPlan => {
    const daysOfWeek: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return daysOfWeek.reduce((week, day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);
      
      return {
        ...week,
        [day]: {
          breakfast: '',
          lunch: '',
          dinner: '',
          date: dayDate.toISOString().split('T')[0]
        }
      };
    }, {} as WeeklyMealPlan);
  };
  
  useEffect(() => {
    loadData();
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      // Load users
      const usersData = await supabaseService.getUsers();
      setUsers(usersData);

      // Load meals for the week
      const mealsData = await supabaseService.getMeals();
      setAssignedMeals(mealsData);

      // Check if schedule is published
      const published = await kitchenRulesService.isSchedulePublished();
      setIsSchedulePublished(published);

      // Initialize week meals
      const startDate = new Date(selectedWeek);
      if (!weekMeals[selectedWeek]) {
        setWeekMeals(prev => ({
          ...prev,
          [selectedWeek]: getInitialWeekState(startDate)
        }));
      }

      // Populate existing meals
      populateExistingMeals(mealsData, startDate);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load meal planning data');
    }
  };

  const populateExistingMeals = (meals: any[], startDate: Date) => {
    const weekStart = startDate.toISOString().split('T')[0];
    const weekEnd = getEndOfWeek(startDate).toISOString().split('T')[0];
    
    const weekMealsList = meals.filter(meal => 
      meal.date >= weekStart && meal.date <= weekEnd
    );

    if (weekMealsList.length > 0) {
      const weekPlan = getInitialWeekState(startDate);
      const daysOfWeek: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      weekMealsList.forEach(meal => {
        const mealDate = new Date(meal.date);
        const dayIndex = (mealDate.getDay() + 6) % 7; // Convert to Monday = 0
        const dayName = daysOfWeek[dayIndex];
        
        if (weekPlan[dayName]) {
          weekPlan[dayName][meal.mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner'] = meal.mealName;
        }
      });

      setWeekMeals(prev => ({
        ...prev,
        [selectedWeek]: weekPlan
      }));
    }
  };

  const handleMealChange = (day: DayName, mealType: string, value: string) => {
    setWeekMeals(prev => ({
      ...prev,
      [selectedWeek]: {
        ...prev[selectedWeek],
        [day]: {
          ...prev[selectedWeek][day],
          [mealType]: value
        }
      }
    }));
  };

  const saveWeeklyMeals = async () => {
    if (!hasRole(currentUser, 'Chef') && !hasRole(currentUser, 'Admin')) {
      toast.error('Only chefs can save meal plans');
      return;
    }

    setIsSaving(true);

    try {
      const weekPlan = weekMeals[selectedWeek];
      const daysOfWeek: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];

      for (const day of daysOfWeek) {
        const dayMeals = weekPlan[day];
        const date = dayMeals.date;

        for (const mealType of mealTypes) {
          const mealName = dayMeals[mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner'];
          
          if (!mealName) continue;

          // Check if meal already exists
          const existingMeal = assignedMeals.find(m => 
            m.date === date && m.mealType === mealType
          );

          if (!existingMeal) {
            let prepTime = '', serveTime = '';
            
            if (mealType === 'Breakfast') {
              prepTime = '06:00';
              serveTime = '07:00';
            } else if (mealType === 'Lunch') {
              prepTime = '10:00';
              serveTime = '12:00';
            } else if (mealType === 'Dinner') {
              prepTime = '16:00';
              serveTime = '18:00';
            }

            await supabaseService.createMeal({
              date,
              mealType,
              mealName,
              cookId: '',
              washerId: '',
              prepTime,
              serveTime,
            });
          }
        }
      }

      toast.success('Weekly meal plan saved successfully');
      await loadData(); // Reload data
    } catch (error) {
      toast.error('Failed to save meal plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateKitchenDuties = async () => {
    if (!hasRole(currentUser, 'Chef')) {
      toast.error('Only chefs can generate kitchen duties');
      return;
    }

    setIsGeneratingMeals(true);

    try {
      // Get meals for the week
      const weekStart = new Date(selectedWeek);
      const weekEnd = getEndOfWeek(weekStart);
      
      const weekMealsList = assignedMeals.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= weekStart && mealDate <= weekEnd;
      });

      if (weekMealsList.length === 0) {
        toast.error('Please save the meal plan first before generating kitchen duties');
        setIsGeneratingMeals(false);
        return;
      }

      // Auto-assign users based on kitchen rules
      const updatedMeals = await kitchenRulesService.autoAssignKitchenDuties(weekMealsList, users);

      // Update meals in database
      for (const meal of updatedMeals) {
        if (meal.cook_id || meal.washer_id) {
          await supabaseService.updateMeal(meal.id, {
            cookId: meal.cook_id,
            washerId: meal.washer_id,
          });
        }
      }

      toast.success('Kitchen duties generated successfully');
      await loadData(); // Reload data

      // Schedule SMS reminders
      enhancedSmsService.scheduleKitchenReminders(updatedMeals, users);
    } catch (error) {
      toast.error('Failed to generate kitchen duties');
    } finally {
      setIsGeneratingMeals(false);
    }
  };

  const handleExchangeUsers = async () => {
    if (!exchangeData.fromMealId || !exchangeData.toMealId) {
      toast.error('Please select both meals to exchange');
      return;
    }

    try {
      const fromMeal = assignedMeals.find(m => m.id === exchangeData.fromMealId);
      const toMeal = assignedMeals.find(m => m.id === exchangeData.toMealId);

      if (!fromMeal || !toMeal) {
        toast.error('Selected meals not found');
        return;
      }

      // Exchange users via Supabase service
      await supabaseService.exchangeKitchenUsers(
        exchangeData.fromMealId,
        exchangeData.toMealId,
        fromMeal.cookId,
        toMeal.cookId
      );

      toast.success('Users exchanged successfully');
      setShowExchangeModal(false);
      setExchangeData({ fromMealId: '', toMealId: '' });
      await loadData(); // Reload data
    } catch (error) {
      toast.error('Failed to exchange users');
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
      doc.text('DTS COOKING SCHEDULE', 148, 25, { align: 'center' });
      
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
      doc.text('Morning (6:00-7:00)', 15, yPos);
      yPos += 10;
      
      const morningMeals = weekMeals[selectedWeek];
      const morningData = [
        ['Menu', ...Array(7).fill('').map((_, i) => {
          const day = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
          return morningMeals[day]?.breakfast || '-';
        })],
        ['Cook', ...Array(7).fill('').map((_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const meal = assignedMeals.find(m => 
            m.date === date.toISOString().split('T')[0] && 
            m.mealType === 'Breakfast'
          );
          const cook = meal ? users.find(u => u.id === meal.cookId) : null;
          return cook ? `${cook.firstName} ${cook.lastName}` : '-';
        })],
        ['Washing Dishes', ...Array(7).fill('').map((_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const meal = assignedMeals.find(m => 
            m.date === date.toISOString().split('T')[0] && 
            m.mealType === 'Breakfast'
          );
          const washer = meal ? users.find(u => u.id === meal.washerId) : null;
          return washer ? `${washer.firstName} ${washer.lastName}` : '-';
        })]
      ];
      
      (doc as any).autoTable({
        head: headers,
        body: morningData,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 123, 255] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Afternoon Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Afternoon (12:00-13:30)', 15, yPos);
      yPos += 10;
      
      const afternoonData = [
        ['Menu', ...Array(7).fill('').map((_, i) => {
          const day = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
          return morningMeals[day]?.lunch || '-';
        })],
        ['Cook', ...Array(7).fill('').map((_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const meal = assignedMeals.find(m => 
            m.date === date.toISOString().split('T')[0] && 
            m.mealType === 'Lunch'
          );
          const cook = meal ? users.find(u => u.id === meal.cookId) : null;
          return cook ? `${cook.firstName} ${cook.lastName}` : '-';
        })],
        ['Washing Dishes', ...Array(7).fill('').map((_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const meal = assignedMeals.find(m => 
            m.date === date.toISOString().split('T')[0] && 
            m.mealType === 'Lunch'
          );
          const washer = meal ? users.find(u => u.id === meal.washerId) : null;
          return washer ? `${washer.firstName} ${washer.lastName}` : '-';
        })]
      ];
      
      (doc as any).autoTable({
        head: headers,
        body: afternoonData,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 123, 255] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Evening Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Evening (18:30-20:00)', 15, yPos);
      yPos += 10;
      
      const eveningData = [
        ['Menu', ...Array(7).fill('').map((_, i) => {
          const day = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
          return morningMeals[day]?.dinner || '-';
        })],
        ['Cook', ...Array(7).fill('').map((_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const meal = assignedMeals.find(m => 
            m.date === date.toISOString().split('T')[0] && 
            m.mealType === 'Dinner'
          );
          const cook = meal ? users.find(u => u.id === meal.cookId) : null;
          return cook ? `${cook.firstName} ${cook.lastName}` : '-';
        })],
        ['Washing Dishes', ...Array(7).fill('').map((_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const meal = assignedMeals.find(m => 
            m.date === date.toISOString().split('T')[0] && 
            m.mealType === 'Dinner'
          );
          const washer = meal ? users.find(u => u.id === meal.washerId) : null;
          return washer ? `${washer.firstName} ${washer.lastName}` : '-';
        })]
      ];
      
      (doc as any).autoTable({
        head: headers,
        body: eveningData,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 123, 255] }
      });
      
      doc.save(`ywam-dar-kitchen-schedule-${selectedWeek}.pdf`);
      toast.success('Kitchen schedule PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const canEdit = hasRole(currentUser, 'Chef') && !isSchedulePublished;
  const canGenerate = hasRole(currentUser, 'Chef');

  if (!weekMeals[selectedWeek]) {
    return <div className="text-center py-8">Loading meal plan...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Meal Planning</h1>
          <p className="text-gray-600">
            {hasRole(currentUser, 'Chef') 
              ? 'Create and manage weekly meal plans with automatic user assignment' 
              : 'View meal plans and kitchen assignments'}
          </p>
          {isSchedulePublished && (
            <Badge variant="success" className="mt-2">Schedule Published</Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={saveWeeklyMeals}
              isLoading={isSaving}
              className="flex items-center"
            >
              <Save size={16} className="mr-2" />
              Save Meal Plan
            </Button>
          )}

          {canGenerate && (
            <>
              <Button
                variant="outline"
                onClick={handleGenerateKitchenDuties}
                isLoading={isGeneratingMeals}
                className="flex items-center"
                disabled={!weekMeals[selectedWeek]}
              >
                <RefreshCw size={16} className="mr-2" />
                Generate Kitchen Duties
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowExchangeModal(true)}
                className="flex items-center"
              >
                <ArrowLeftRight size={16} className="mr-2" />
                Exchange Users
              </Button>
            </>
          )}
          
          <Button
            variant="primary"
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
      
      <Card title="Weekly Meal Plan">
        <div className="space-y-6">
          <div className="text-center mb-4">
            <p className="text-gray-700">
              Week of {formatDate(selectedWeek)} to {formatDate(getEndOfWeek(new Date(selectedWeek)).toISOString())}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                  <tr key={day}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(weekMeals[selectedWeek][day as DayName].date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        value={weekMeals[selectedWeek][day as DayName].breakfast}
                        onChange={(e) => handleMealChange(day as DayName, 'breakfast', e.target.value)}
                        placeholder="Breakfast meal"
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        value={weekMeals[selectedWeek][day as DayName].lunch}
                        onChange={(e) => handleMealChange(day as DayName, 'lunch', e.target.value)}
                        placeholder="Lunch meal"
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        value={weekMeals[selectedWeek][day as DayName].dinner}
                        onChange={(e) => handleMealChange(day as DayName, 'dinner', e.target.value)}
                        placeholder="Dinner meal"
                        disabled={!canEdit}
                      />
                    </td>
                  </tr>
                ))}
                
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Sunday</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(weekMeals[selectedWeek].sunday.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      value={weekMeals[selectedWeek].sunday.breakfast}
                      onChange={(e) => handleMealChange('sunday', 'breakfast', e.target.value)}
                      placeholder="Free breakfast (no assignments)"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      value={weekMeals[selectedWeek].sunday.lunch}
                      onChange={(e) => handleMealChange('sunday', 'lunch', e.target.value)}
                      placeholder="Free lunch (no assignments)"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      value={weekMeals[selectedWeek].sunday.dinner}
                      onChange={(e) => handleMealChange('sunday', 'dinner', e.target.value)}
                      placeholder="Dinner meal"
                      disabled={!canEdit}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Kitchen Duty Assignments */}
      {assignedMeals.length > 0 && (
        <Card title="Kitchen Duty Assignments">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-700">
                Assignments for week of {formatDate(selectedWeek)} to {formatDate(getEndOfWeek(new Date(selectedWeek)).toISOString())}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dish</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cook</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Washer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const weekStart = new Date(selectedWeek);
                    const weekEnd = getEndOfWeek(weekStart);
                    
                    const weekMealsList = assignedMeals
                      .filter(meal => {
                        const mealDate = new Date(meal.date);
                        return mealDate >= weekStart && mealDate <= weekEnd;
                      })
                      .sort((a, b) => {
                        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
                        if (dateCompare !== 0) return dateCompare;
                        
                        const mealTypeOrder = { 'Breakfast': 1, 'Lunch': 2, 'Dinner': 3 };
                        return mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType];
                      });
                    
                    if (weekMealsList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                            No assignments generated yet. Save meal plan and click "Generate Kitchen Duties".
                          </td>
                        </tr>
                      );
                    }
                    
                    return weekMealsList.map(meal => {
                      const mealDate = new Date(meal.date);
                      const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(mealDate);
                      
                      const cook = users.find(u => u.id === meal.cookId);
                      const washer = users.find(u => u.id === meal.washerId);
                      
                      return (
                        <tr key={meal.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="font-medium">{dayOfWeek}</div>
                            <div className="text-gray-500">{formatDate(meal.date)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge 
                              variant={
                                meal.mealType === 'Breakfast' ? 'primary' : 
                                meal.mealType === 'Lunch' ? 'success' : 'warning'
                              }
                            >
                              {meal.mealType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {meal.mealName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {cook ? (
                              <div>
                                <div className="font-medium">{cook.firstName} {cook.lastName}</div>
                                <div className="text-xs text-gray-500">{cook.phoneNumber}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {washer ? (
                              <div>
                                <div className="font-medium">{washer.firstName} {washer.lastName}</div>
                                <div className="text-xs text-gray-500">{washer.phoneNumber}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div>Prep: {meal.prepTime}</div>
                            <div>Serve: {meal.serveTime}</div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Exchange Users Modal */}
      <AnimatePresence>
        {showExchangeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-medium mb-4">Exchange Kitchen Assignments</h3>
              
              <div className="space-y-4">
                <Select
                  label="From Meal"
                  value={exchangeData.fromMealId}
                  onChange={(value) => setExchangeData(prev => ({ ...prev, fromMealId: value }))}
                  options={[
                    { value: '', label: 'Select meal' },
                    ...assignedMeals.filter(meal => {
                      const mealDate = new Date(meal.date);
                      const weekStart = new Date(selectedWeek);
                      const weekEnd = getEndOfWeek(weekStart);
                      return mealDate >= weekStart && mealDate <= weekEnd;
                    }).map(meal => ({
                      value: meal.id,
                      label: `${formatDate(meal.date)} - ${meal.mealType}: ${meal.mealName}`
                    }))
                  ]}
                  fullWidth
                />
                
                <Select
                  label="To Meal"
                  value={exchangeData.toMealId}
                  onChange={(value) => setExchangeData(prev => ({ ...prev, toMealId: value }))}
                  options={[
                    { value: '', label: 'Select meal' },
                    ...assignedMeals.filter(meal => {
                      const mealDate = new Date(meal.date);
                      const weekStart = new Date(selectedWeek);
                      const weekEnd = getEndOfWeek(weekStart);
                      return mealDate >= weekStart && mealDate <= weekEnd && meal.id !== exchangeData.fromMealId;
                    }).map(meal => ({
                      value: meal.id,
                      label: `${formatDate(meal.date)} - ${meal.mealType}: ${meal.mealName}`
                    }))
                  ]}
                  fullWidth
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExchangeModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExchangeUsers}
                >
                  Exchange
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedMealPlanning;