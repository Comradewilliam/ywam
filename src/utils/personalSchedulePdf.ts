import { jsPDF } from 'jspdf';
import { User, MeditationSchedule, Meal, WorkDuty } from '../types';
import { formatDate } from './helpers';

interface PersonalScheduleData {
  meditation: MeditationSchedule[];
  kitchen: Meal[];
  workDuty: WorkDuty[];
}

export const generatePersonalSchedulePdf = async (
  user: User,
  scheduleData: PersonalScheduleData,
  allUsers: User[]
): Promise<void> => {
  // Create PDF in landscape orientation
  const doc = new jsPDF('landscape');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 123, 255);
  doc.text('YOUTH WITH A MISSION', 148, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Personal Weekly Participation Schedule', 148, 25, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`For: ${user.firstName} ${user.lastName}`, 148, 35, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148, 45, { align: 'center' });
  
  let yPos = 60;
  
  // Meditation Section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80); // #2c3e50
  doc.text('Meditation (06:00 - 07:00)', 14, yPos);
  yPos += 10;
  
  // Meditation table
  const meditationHeaders = [['Day', 'Bible Verse', 'Leader']];
  const meditationData = [];
  
  // Get current week's meditation schedule
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const meditation = scheduleData.meditation.find(m => m.date === dateStr);
    const leader = meditation ? allUsers.find(u => u.id === meditation.userId) : null;
    
    meditationData.push([
      daysOfWeek[i],
      meditation ? meditation.bibleVerse : '-',
      leader ? (leader.id === user.id ? 'you' : `${leader.firstName} ${leader.lastName}`) : '-'
    ]);
  }
  
  (doc as any).autoTable({
    head: meditationHeaders,
    body: meditationData,
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Cooking Section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Cooking Duties', 14, yPos);
  yPos += 10;
  
  const cookingHeaders = [['Day', 'Time', 'Menu', 'Cook', 'Washing Dishes']];
  const cookingData = [];
  
  // Filter user's cooking duties
  const userKitchenDuties = scheduleData.kitchen.filter(meal => 
    meal.cookId === user.id || meal.washerId === user.id
  );
  
  userKitchenDuties.forEach(meal => {
    const mealDate = new Date(meal.date);
    const dayName = mealDate.toLocaleDateString('en-US', { weekday: 'long' });
    const cook = allUsers.find(u => u.id === meal.cookId);
    const washer = allUsers.find(u => u.id === meal.washerId);
    
    cookingData.push([
      dayName,
      meal.mealType,
      meal.mealName,
      cook ? (cook.id === user.id ? 'you' : `${cook.firstName} ${cook.lastName}`) : '...',
      washer ? (washer.id === user.id ? 'you' : `${washer.firstName} ${washer.lastName}`) : '...'
    ]);
  });
  
  if (cookingData.length === 0) {
    cookingData.push(['-', '-', 'No cooking duties assigned', '-', '-']);
  }
  
  (doc as any).autoTable({
    head: cookingHeaders,
    body: cookingData,
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Work Duties Section
  if (yPos > 150) {
    doc.addPage('landscape');
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Work Duties', 14, yPos);
  yPos += 10;
  
  const workDutyHeaders = [['Day', 'Time', 'Task', 'Participants']];
  const workDutyData = [];
  
  // Filter user's work duties
  const userWorkDuties = scheduleData.workDuty.filter(duty => 
    duty.assignedUserIds.includes(user.id)
  );
  
  userWorkDuties.forEach(duty => {
    const dutyDate = new Date(duty.date);
    const dayName = dutyDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const participants = duty.assignedUserIds.map(id => {
      if (id === user.id) return 'you';
      const participant = allUsers.find(u => u.id === id);
      return participant ? `${participant.firstName} ${participant.lastName}` : '...';
    }).join(', ');
    
    workDutyData.push([
      dayName,
      duty.time,
      duty.taskName,
      participants
    ]);
  });
  
  if (workDutyData.length === 0) {
    workDutyData.push(['-', '-', 'No work duties assigned', '-']);
  }
  
  (doc as any).autoTable({
    head: workDutyHeaders,
    body: workDutyData,
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });
  
  // Save the PDF
  doc.save(`personal-weekly-schedule-${user.firstName}-${user.lastName}.pdf`);
};