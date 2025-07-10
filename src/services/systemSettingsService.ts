export interface KitchenRuleSettings {
  excludeRoles: {
    cooking: string[];
    washing: string[];
  };
  dayRestrictions: {
    [role: string]: {
      excludeDays: number[]; // 0=Sunday, 1=Monday, etc.
      excludeMeals: string[]; // 'breakfast', 'lunch', 'dinner'
    };
  };
  publishTime: {
    day: number; // 5 = Friday
    hour: number; // 17
    minute: number; // 45
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: 'welcome' | 'reminder' | 'meeting' | 'general';
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LectureSchedule {
  id: string;
  lecturerName: string;
  courseTitle: string;
  sessionTime: string;
  date: string;
  duration: number; // in minutes
  location?: string;
  month: string; // YYYY-MM format
}

class SystemSettingsService {
  private kitchenRules: KitchenRuleSettings = {
    excludeRoles: {
      cooking: ['Missionary'],
      washing: ['Missionary']
    },
    dayRestrictions: {
      'DTS': {
        excludeDays: [1, 2, 3, 4, 5], // Monday to Friday for washing
        excludeMeals: []
      },
      'PraiseTeam': {
        excludeDays: [6], // Saturday
        excludeMeals: ['lunch'] // Saturday lunch
      }
    },
    publishTime: {
      day: 5, // Friday
      hour: 17,
      minute: 45
    }
  };

  private notificationTemplates: NotificationTemplate[] = [
    {
      id: '1',
      name: 'Welcome Friend',
      title: 'Welcome to YWAM DAR',
      content: 'Welcome to YWAM DAR, {{firstName}}! We\'re excited to have you join our community. Feel free to reach out if you have any questions.',
      type: 'welcome',
      variables: ['firstName'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Login Credentials',
      title: 'Your YWAM DAR Login Details',
      content: 'Hi {{firstName}}, your login credentials are: Username: {{username}}, Password: {{password}}. Please change your password after first login.',
      type: 'welcome',
      variables: ['firstName', 'username', 'password'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Kitchen Duty Reminder',
      title: 'Kitchen Duty Reminder',
      content: 'Hi {{firstName}}, reminder: Your {{role}} duty for {{mealType}} starts in 15 minutes. Menu: {{mealName}}',
      type: 'reminder',
      variables: ['firstName', 'role', 'mealType', 'mealName'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Meeting Reminder',
      title: 'Meeting Reminder',
      content: 'Hi {{firstName}}, reminder: {{meetingTitle}} starts in {{timeUntil}} at {{location}}.',
      type: 'meeting',
      variables: ['firstName', 'meetingTitle', 'timeUntil', 'location'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  private lectureSchedules: LectureSchedule[] = [];

  getKitchenRules(): KitchenRuleSettings {
    return { ...this.kitchenRules };
  }

  updateKitchenRules(rules: Partial<KitchenRuleSettings>): void {
    this.kitchenRules = { ...this.kitchenRules, ...rules };
  }

  canUserBeCook(userRoles: string[], date: string): boolean {
    // Check if user has excluded roles
    if (this.kitchenRules.excludeRoles.cooking.some(role => userRoles.includes(role))) {
      return false;
    }

    const dayOfWeek = new Date(date).getDay();
    
    // Check day restrictions for each role
    for (const role of userRoles) {
      const restrictions = this.kitchenRules.dayRestrictions[role];
      if (restrictions && restrictions.excludeDays.includes(dayOfWeek)) {
        return false;
      }
    }

    return true;
  }

  canUserWashDishes(userRoles: string[], date: string, mealType: string): boolean {
    // Check if user has excluded roles
    if (this.kitchenRules.excludeRoles.washing.some(role => userRoles.includes(role))) {
      return false;
    }

    const dayOfWeek = new Date(date).getDay();
    
    // Check day restrictions for each role
    for (const role of userRoles) {
      const restrictions = this.kitchenRules.dayRestrictions[role];
      if (restrictions) {
        // Check day restrictions
        if (restrictions.excludeDays.includes(dayOfWeek)) {
          // Special case for DTS: only exclude washing Monday-Friday
          if (role === 'DTS' && dayOfWeek >= 1 && dayOfWeek <= 5) {
            return false;
          }
        }
        
        // Check meal restrictions
        if (restrictions.excludeMeals.includes(mealType.toLowerCase()) && dayOfWeek === 6) {
          return false;
        }
      }
    }

    return true;
  }

  isSchedulePublished(): boolean {
    const now = new Date();
    const publishDay = this.kitchenRules.publishTime.day;
    const publishHour = this.kitchenRules.publishTime.hour;
    const publishMinute = this.kitchenRules.publishTime.minute;
    
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If it's past Friday 17:45, schedule is published
    if (currentDay > publishDay) return true;
    if (currentDay === publishDay && currentHour > publishHour) return true;
    if (currentDay === publishDay && currentHour === publishHour && currentMinute >= publishMinute) return true;
    
    return false;
  }

  // Notification Templates
  getNotificationTemplates(): NotificationTemplate[] {
    return [...this.notificationTemplates];
  }

  getNotificationTemplate(id: string): NotificationTemplate | null {
    return this.notificationTemplates.find(t => t.id === id) || null;
  }

  createNotificationTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): NotificationTemplate {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.notificationTemplates.push(newTemplate);
    return newTemplate;
  }

  updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>): NotificationTemplate | null {
    const index = this.notificationTemplates.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    this.notificationTemplates[index] = {
      ...this.notificationTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.notificationTemplates[index];
  }

  deleteNotificationTemplate(id: string): boolean {
    const index = this.notificationTemplates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.notificationTemplates.splice(index, 1);
    return true;
  }

  // Lecture Schedules
  getLectureSchedules(month?: string): LectureSchedule[] {
    if (month) {
      return this.lectureSchedules.filter(l => l.month === month);
    }
    return [...this.lectureSchedules];
  }

  createLectureSchedule(lecture: Omit<LectureSchedule, 'id'>): LectureSchedule {
    const newLecture: LectureSchedule = {
      ...lecture,
      id: this.generateId()
    };
    
    this.lectureSchedules.push(newLecture);
    return newLecture;
  }

  updateLectureSchedule(id: string, updates: Partial<LectureSchedule>): LectureSchedule | null {
    const index = this.lectureSchedules.findIndex(l => l.id === id);
    if (index === -1) return null;
    
    this.lectureSchedules[index] = { ...this.lectureSchedules[index], ...updates };
    return this.lectureSchedules[index];
  }

  deleteLectureSchedule(id: string): boolean {
    const index = this.lectureSchedules.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    this.lectureSchedules.splice(index, 1);
    return true;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const systemSettingsService = new SystemSettingsService();