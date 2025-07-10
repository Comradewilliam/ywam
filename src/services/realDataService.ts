import { User, MeditationSchedule, Meal, WorkDuty, Message } from '../types';

// Real user data for YWAM DAR
export const realUsers: User[] = [
  {
    id: '1',
    firstName: 'YEFTA',
    lastName: 'SUTANTO',
    email: 'yefta@ywamdar.org',
    username: 'sutanto',
    phoneNumber: '+255123456789',
    gender: 'Male',
    university: 'KIUT',
    course: 'COMPUTER SCIENCE',
    dateOfBirth: '1990-01-01',
    roles: ['Admin', 'Staff'],
    createdAt: '2023-01-01',
    profilePhoto: '/YWAM-Logo.png'
  },
  {
    id: '2',
    firstName: 'GRACE',
    lastName: 'MAKOKO',
    email: 'grace@ywamdar.org',
    username: 'makoko',
    phoneNumber: '+255987654321',
    gender: 'Female',
    university: 'UDSM',
    course: 'MEDICINE',
    dateOfBirth: '1992-05-15',
    roles: ['Staff', 'Missionary'],
    createdAt: '2023-01-02',
  },
  {
    id: '3',
    firstName: 'JOHN',
    lastName: 'MBASHA',
    email: 'john@ywamdar.org',
    username: 'mbasha',
    phoneNumber: '+255711223344',
    gender: 'Male',
    university: 'IFM',
    course: 'FINANCE',
    dateOfBirth: '1991-03-20',
    roles: ['Staff', 'Chef'],
    createdAt: '2023-01-03',
  },
  {
    id: '4',
    firstName: 'SARAH',
    lastName: 'KIMARO',
    email: 'sarah@ywamdar.org',
    username: 'kimaro',
    phoneNumber: '+255722334455',
    gender: 'Female',
    university: 'TUDARCO',
    course: 'ARCHITECTURE',
    dateOfBirth: '1993-07-10',
    roles: ['Staff', 'WorkDutyManager'],
    createdAt: '2023-01-04',
  },
  {
    id: '5',
    firstName: 'DAVID',
    lastName: 'MALINGA',
    username: 'malinga',
    phoneNumber: '+255733445566',
    gender: 'Male',
    university: 'NIT',
    course: 'ENGINEERING',
    dateOfBirth: '1994-11-25',
    roles: ['DTS'],
    createdAt: '2023-01-05',
  },
  {
    id: '6',
    firstName: 'MARY',
    lastName: 'SINGANO',
    username: 'singano',
    phoneNumber: '+255744556677',
    gender: 'Female',
    university: 'WATER',
    course: 'ENVIRONMENTAL SCIENCE',
    dateOfBirth: '1995-02-18',
    roles: ['Staff', 'PraiseTeam'],
    createdAt: '2023-01-06',
  },
  {
    id: '7',
    firstName: 'JOSEPH',
    lastName: 'MWANGA',
    phoneNumber: '+255755667788',
    gender: 'Male',
    university: 'DIT',
    course: 'INFORMATION TECHNOLOGY',
    dateOfBirth: '1990-09-30',
    roles: ['Friend'],
    createdAt: '2023-01-07',
  },
  {
    id: '8',
    firstName: 'ELIZABETH',
    lastName: 'JOHN',
    username: 'elizabeth',
    phoneNumber: '+255766778899',
    gender: 'Female',
    university: 'UDSM',
    course: 'EDUCATION',
    dateOfBirth: '1993-03-12',
    roles: ['Staff'],
    createdAt: '2023-01-08',
  },
  {
    id: '9',
    firstName: 'PETER',
    lastName: 'PAUL',
    username: 'peter',
    phoneNumber: '+255777889900',
    gender: 'Male',
    university: 'KIUT',
    course: 'BUSINESS',
    dateOfBirth: '1992-08-20',
    roles: ['DTS'],
    createdAt: '2023-01-09',
  },
  {
    id: '10',
    firstName: 'ANNA',
    lastName: 'MICHAEL',
    username: 'anna',
    phoneNumber: '+255788990011',
    gender: 'Female',
    university: 'NIT',
    course: 'NURSING',
    dateOfBirth: '1994-12-05',
    roles: ['Staff'],
    createdAt: '2023-01-10',
  }
];

// Current week's meditation schedules
export const realMeditationSchedules: MeditationSchedule[] = [
  {
    id: '1',
    date: '2025-01-20', // Monday
    time: '06:00',
    userId: '2', // Grace
    bibleVerse: 'John 1:1-14',
  },
  {
    id: '2',
    date: '2025-01-21', // Tuesday
    time: '06:00',
    userId: '4', // Sarah
    bibleVerse: 'Psalm 23:1-6',
  },
  {
    id: '3',
    date: '2025-01-22', // Wednesday
    time: '06:00',
    userId: '8', // Elizabeth
    bibleVerse: 'Romans 8:28-39',
  },
  {
    id: '4',
    date: '2025-01-23', // Thursday
    time: '06:00',
    userId: '10', // Anna
    bibleVerse: 'Matthew 5:1-12',
  },
  {
    id: '5',
    date: '2025-01-24', // Friday
    time: '06:00',
    userId: '6', // Mary
    bibleVerse: 'Philippians 4:4-13',
  },
  {
    id: '6',
    date: '2025-01-25', // Saturday
    time: '06:00',
    userId: '3', // John
    bibleVerse: '1 Corinthians 13:1-13',
  },
  {
    id: '7',
    date: '2025-01-26', // Sunday
    time: '06:00',
    userId: '2', // Grace
    bibleVerse: 'Ephesians 2:8-10',
  }
];

// Current week's meals
export const realMeals: Meal[] = [
  // Monday
  {
    id: '1',
    date: '2025-01-20',
    mealType: 'Breakfast',
    mealName: 'Ugali na Maharage',
    cookId: '8',
    washerId: '10',
    prepTime: '06:00',
    serveTime: '07:00',
  },
  {
    id: '2',
    date: '2025-01-20',
    mealType: 'Lunch',
    mealName: 'Wali na Mchuzi wa Kuku',
    cookId: '4',
    washerId: '6',
    prepTime: '10:00',
    serveTime: '12:00',
  },
  {
    id: '3',
    date: '2025-01-20',
    mealType: 'Dinner',
    mealName: 'Chapati na Mchuzi wa Nyama',
    cookId: '3',
    washerId: '8',
    prepTime: '16:00',
    serveTime: '18:00',
  },
  // Tuesday
  {
    id: '4',
    date: '2025-01-21',
    mealType: 'Breakfast',
    mealName: 'Uji na Mkate',
    cookId: '10',
    washerId: '4',
    prepTime: '06:00',
    serveTime: '07:00',
  },
  {
    id: '5',
    date: '2025-01-21',
    mealType: 'Lunch',
    mealName: 'Pilau na Kuku',
    cookId: '6',
    washerId: '8',
    prepTime: '10:00',
    serveTime: '12:00',
  },
  {
    id: '6',
    date: '2025-01-21',
    mealType: 'Dinner',
    mealName: 'Wali wa Nazi na Samaki',
    cookId: '8',
    washerId: '10',
    prepTime: '16:00',
    serveTime: '18:00',
  },
  // Wednesday
  {
    id: '7',
    date: '2025-01-22',
    mealType: 'Breakfast',
    mealName: 'Mandazi na Chai',
    cookId: '4',
    washerId: '6',
    prepTime: '06:00',
    serveTime: '07:00',
  },
  {
    id: '8',
    date: '2025-01-22',
    mealType: 'Lunch',
    mealName: 'Makande na Nyama',
    cookId: '10',
    washerId: '4',
    prepTime: '10:00',
    serveTime: '12:00',
  },
  {
    id: '9',
    date: '2025-01-22',
    mealType: 'Dinner',
    mealName: 'Ugali na Mchuzi wa Mboga',
    cookId: '6',
    washerId: '8',
    prepTime: '16:00',
    serveTime: '18:00',
  },
  // Thursday
  {
    id: '10',
    date: '2025-01-23',
    mealType: 'Breakfast',
    mealName: 'Vitumbua na Maziwa',
    cookId: '8',
    washerId: '10',
    prepTime: '06:00',
    serveTime: '07:00',
  },
  {
    id: '11',
    date: '2025-01-23',
    mealType: 'Lunch',
    mealName: 'Wali na Mchuzi wa Samaki',
    cookId: '4',
    washerId: '6',
    prepTime: '10:00',
    serveTime: '12:00',
  },
  {
    id: '12',
    date: '2025-01-23',
    mealType: 'Dinner',
    mealName: 'Chipsi na Kuku',
    cookId: '10',
    washerId: '4',
    prepTime: '16:00',
    serveTime: '18:00',
  },
  // Friday
  {
    id: '13',
    date: '2025-01-24',
    mealType: 'Breakfast',
    mealName: 'Mkate na Siagi',
    cookId: '6',
    washerId: '8',
    prepTime: '06:00',
    serveTime: '07:00',
  },
  {
    id: '14',
    date: '2025-01-24',
    mealType: 'Lunch',
    mealName: 'Biriani na Kuku',
    cookId: '8',
    washerId: '10',
    prepTime: '10:00',
    serveTime: '12:00',
  },
  {
    id: '15',
    date: '2025-01-24',
    mealType: 'Dinner',
    mealName: 'Wali wa Kaanga na Nyama',
    cookId: '4',
    washerId: '6',
    prepTime: '16:00',
    serveTime: '18:00',
  },
  // Saturday
  {
    id: '16',
    date: '2025-01-25',
    mealType: 'Breakfast',
    mealName: 'Pancakes na Asali',
    cookId: '10',
    washerId: '5', // DTS can wash on Saturday
    prepTime: '06:00',
    serveTime: '07:00',
  },
  {
    id: '17',
    date: '2025-01-25',
    mealType: 'Lunch',
    mealName: 'Wali na Mchuzi wa Mboga',
    cookId: '8',
    washerId: '9', // DTS can wash on Saturday
    prepTime: '10:00',
    serveTime: '12:00',
  },
  {
    id: '18',
    date: '2025-01-25',
    mealType: 'Dinner',
    mealName: 'Ugali na Samaki wa Kaanga',
    cookId: '4',
    washerId: '5',
    prepTime: '16:00',
    serveTime: '18:00',
  },
  // Sunday - Only dinner
  {
    id: '19',
    date: '2025-01-26',
    mealType: 'Dinner',
    mealName: 'Wali wa Nazi na Kuku',
    cookId: '10',
    washerId: '8',
    prepTime: '16:00',
    serveTime: '18:00',
  }
];

// Current week's work duties
export const realWorkDuties: WorkDuty[] = [
  {
    id: '1',
    taskName: 'Clean Main Hall',
    isLight: true,
    isGroup: true,
    peopleCount: 2,
    date: '2025-01-20',
    time: '09:00',
    assignedUserIds: ['8', '10'],
  },
  {
    id: '2',
    taskName: 'Garden Maintenance',
    isLight: false,
    isGroup: false,
    peopleCount: 1,
    date: '2025-01-20',
    time: '14:00',
    assignedUserIds: ['4'],
  },
  {
    id: '3',
    taskName: 'Office Cleaning',
    isLight: true,
    isGroup: false,
    peopleCount: 1,
    date: '2025-01-21',
    time: '08:00',
    assignedUserIds: ['6'],
  },
  {
    id: '4',
    taskName: 'Move Furniture',
    isLight: false,
    isGroup: true,
    peopleCount: 3,
    date: '2025-01-21',
    time: '15:00',
    assignedUserIds: ['3', '8', '10'],
  },
  {
    id: '5',
    taskName: 'Clean Dormitories',
    isLight: true,
    isGroup: true,
    peopleCount: 2,
    date: '2025-01-22',
    time: '10:00',
    assignedUserIds: ['4', '6'],
  },
  {
    id: '6',
    taskName: 'Kitchen Deep Clean',
    isLight: false,
    isGroup: true,
    peopleCount: 2,
    date: '2025-01-23',
    time: '16:00',
    assignedUserIds: ['8', '10'],
  },
  {
    id: '7',
    taskName: 'Compound Cleaning',
    isLight: true,
    isGroup: true,
    peopleCount: 3,
    date: '2025-01-24',
    time: '09:00',
    assignedUserIds: ['4', '6', '8'],
  },
  {
    id: '8',
    taskName: 'Prepare for Weekend Event',
    isLight: false,
    isGroup: true,
    peopleCount: 4,
    date: '2025-01-25',
    time: '08:00',
    assignedUserIds: ['3', '4', '8', '10'],
  }
];

// Recent messages
export const realMessages: Message[] = [
  {
    id: '1',
    content: 'Welcome to YWAM DAR, {{firstName}}! We\'re excited to have you join our community.',
    recipients: ['7'],
    sentAt: '2025-01-15T10:00:00',
    sentBy: '1',
  },
  {
    id: '2',
    content: 'Hi {{firstName}}, reminder: Community meeting tonight at 7PM in the main hall.',
    recipients: ['2', '3', '4', '5', '6', '8', '9', '10'],
    sentAt: '2025-01-19T16:00:00',
    sentBy: '1',
  },
  {
    id: '3',
    content: 'Good morning {{firstName}}, have a blessed day! Remember to check your schedule.',
    recipients: ['2', '3', '4', '5', '6', '8', '9', '10'],
    schedule: {
      startDate: '2025-01-20T06:00:00',
      frequency: 'daily',
    },
    sentAt: '2025-01-20T06:00:00',
    sentBy: '1',
  }
];

class RealDataService {
  getUsers(): User[] {
    return [...realUsers];
  }

  getMeditationSchedules(): MeditationSchedule[] {
    return [...realMeditationSchedules];
  }

  getMeals(): Meal[] {
    return [...realMeals];
  }

  getWorkDuties(): WorkDuty[] {
    return [...realWorkDuties];
  }

  getMessages(): Message[] {
    return [...realMessages];
  }

  // Generate realistic data for future weeks
  generateFutureData(weeksAhead: number = 4) {
    // This would generate realistic schedules for upcoming weeks
    // Implementation would be similar to existing mock data but with proper rotation
  }
}

export const realDataService = new RealDataService();