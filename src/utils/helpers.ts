import { UserRole, User } from '../types';

export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.roles.includes(role);
};

export const getDashboardForUser = (user: User | null): string => {
  if (!user) return '/login';
  
  if (hasRole(user, 'Admin')) {
    return '/admin';
  }
  
  if (hasRole(user, 'Chef')) {
    return '/chef';
  }
  
  if (hasRole(user, 'WorkDutyManager')) {
    return '/work-duty';
  }
  
  if (hasRole(user, 'Missionary')) {
    return '/missionary';
  }
  
  if (hasRole(user, 'DTS')) {
    return '/dts';
  }
  
  if (hasRole(user, 'Staff')) {
    return '/staff';
  }
  
  return '/login';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
};

export const canAccessSchedule = (user: User | null, scheduleType: 'meditation' | 'cooking' | 'workDuty'): boolean => {
  if (!user) return false;
  
  // Admin can access all schedules
  if (hasRole(user, 'Admin')) return true;
  
  // Chef can access cooking schedule
  if (scheduleType === 'cooking' && hasRole(user, 'Chef')) return true;
  
  // Work Duty Manager can access work duty schedule
  if (scheduleType === 'workDuty' && hasRole(user, 'WorkDutyManager')) return true;
  
  // Missionary can access all schedules
  if (hasRole(user, 'Missionary')) return true;
  
  // Staff can access their own schedules, but for simplicity we'll allow them to view all
  if (hasRole(user, 'Staff')) return true;
  
  // DTS can only view their own specific tasks, but for simplicity we'll show them the schedule
  if (hasRole(user, 'DTS')) return scheduleType !== 'meditation';
  
  return false;
};

export const canCreateSchedule = (user: User | null, scheduleType: 'meditation' | 'cooking' | 'workDuty'): boolean => {
  if (!user) return false;
  
  if (scheduleType === 'meditation') {
    return hasRole(user, 'Admin');
  }
  
  if (scheduleType === 'cooking') {
    return hasRole(user, 'Chef') || hasRole(user, 'Admin');
  }
  
  if (scheduleType === 'workDuty') {
    return hasRole(user, 'WorkDutyManager') || hasRole(user, 'Admin');
  }
  
  return false;
};

export const isMilitaryTime = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

export const convertTo12HourFormat = (time: string): string => {
  if (!isMilitaryTime(time)) return time;
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
};

export const convertTo24HourFormat = (time: string): string => {
  if (isMilitaryTime(time)) return time;
  
  const [timePart, ampm] = time.split(' ');
  let [hours, minutes] = timePart.split(':');
  
  let hour = parseInt(hours);
  
  if (ampm === 'PM' && hour < 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Validate +255 followed by 9 digits
  const phoneRegex = /^\+255\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

export const universityOptions = [
  'KIUT', 'UDSM', 'IFM', 'ISW', 'TUDARCO', 
  'WATER', 'NIT', 'DIT', 'CBE', 'ARDHI'
];

export const canEditSchedule = (user: User | null, scheduleType: 'cooking' | 'workDuty'): boolean => {
  if (!user) return false;
  
  // Only Admin can edit schedules
  if (!hasRole(user, 'Admin')) return false;
  
  // Check if it's before Friday 18:00
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
  const hour = now.getHours();
  
  if (dayOfWeek > 5 || (dayOfWeek === 5 && hour >= 18)) {
    return false;
  }
  
  return true;
};

export const canAssignToKitchenDuty = (user: User, date: string): boolean => {
  const dutyDate = new Date(date);
  const dayOfWeek = dutyDate.getDay(); // 0 = Sunday, 6 = Saturday
  
  // PraiseTeam members can't be assigned on Saturdays
  if (dayOfWeek === 6 && hasRole(user, 'PraiseTeam')) {
    return false;
  }
  
  // DTS members can't be assigned on Saturdays and Sundays
  if ((dayOfWeek === 0 || dayOfWeek === 6) && hasRole(user, 'DTS')) {
    return false;
  }
  
  // Missionaries are never assigned to kitchen duty
  if (hasRole(user, 'Missionary')) {
    return false;
  }
  
  return true;
};

export const shouldSendReminder = (scheduledTime: string): boolean => {
  const now = new Date();
  const scheduled = new Date(scheduledTime);
  const diffMinutes = Math.round((scheduled.getTime() - now.getTime()) / (1000 * 60));
  
  // Return true if we're within the 15-minute reminder window
  return diffMinutes <= 15 && diffMinutes >= 0;
};

export const formatBibleReference = (book: string, chapter: number, startVerse: number, endVerse?: number): string => {
  if (endVerse && endVerse > startVerse) {
    return `${book} ${chapter}:${startVerse}-${endVerse}`;
  }
  return `${book} ${chapter}:${startVerse}`;
};

export const getYWAMLogo = async (): Promise<string> => {
  const logoUrl = 'https://ywamcampusministrytz.org/wp-content/uploads/2023/03/YWAM-Campus-Ministry-Logo.png';
  
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load YWAM logo:', error);
    return '';
  }
};

export const addHeaderToPDF = async (doc: any, title: string, dateRange: string) => {
  try {
    const logo = await getYWAMLogo();
    if (logo) {
      doc.addImage(logo, 'PNG', 15, 10, 30, 30);
    }
    
    doc.setFontSize(20);
    doc.setTextColor(0, 123, 255);
    doc.text('YOUTH WITH A MISSION', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(dateRange, 105, 40, { align: 'center' });
  } catch (error) {
    console.error('Error adding header to PDF:', error);
  }
};