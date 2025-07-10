import { User, MeditationSchedule, Meal, WorkDuty, Message } from '../types';

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
  lastBackup?: string;
  errors: string[];
}

export interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
    usersByUniversity: Record<string, number>;
  };
  scheduleStats: {
    totalMeditationSessions: number;
    totalMeals: number;
    totalWorkDuties: number;
    completionRate: number;
  };
  messageStats: {
    totalMessagesSent: number;
    deliveryRate: number;
    messagesByType: Record<string, number>;
  };
  systemStats: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

class AnalyticsService {
  private activities: UserActivity[] = [];
  private systemMetrics: SystemHealth = {
    status: 'healthy',
    uptime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    activeUsers: 0,
    errors: [],
  };

  // User Activity Logging
  logActivity(
    userId: string,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): void {
    const activity: UserActivity = {
      id: this.generateId(),
      userId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      details,
      ipAddress,
      userAgent,
    };

    this.activities.push(activity);

    // Keep only last 10000 activities to prevent memory issues
    if (this.activities.length > 10000) {
      this.activities = this.activities.slice(-10000);
    }
  }

  getActivities(
    userId?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): UserActivity[] {
    let filtered = [...this.activities];

    if (userId) {
      filtered = filtered.filter(activity => activity.userId === userId);
    }

    if (startDate) {
      filtered = filtered.filter(activity => activity.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(activity => activity.timestamp <= endDate);
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Analytics and Reporting
  generateAnalytics(
    users: User[],
    meditations: MeditationSchedule[],
    meals: Meal[],
    workDuties: WorkDuty[],
    messages: Message[]
  ): AnalyticsData {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User Statistics
    const usersByRole = users.reduce((acc, user) => {
      user.roles.forEach(role => {
        acc[role] = (acc[role] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const usersByUniversity = users.reduce((acc, user) => {
      acc[user.university] = (acc[user.university] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const newUsersThisMonth = users.filter(
      user => new Date(user.createdAt) >= thisMonth
    ).length;

    const activeUsers = this.getActiveUsersCount();

    // Schedule Statistics
    const totalMeditationSessions = meditations.length;
    const totalMeals = meals.length;
    const totalWorkDuties = workDuties.length;

    // Calculate completion rate (mock calculation)
    const completionRate = 0.85; // 85% completion rate

    // Message Statistics
    const totalMessagesSent = messages.length;
    const deliveryRate = 0.92; // 92% delivery rate

    const messagesByType = messages.reduce((acc, message) => {
      const type = message.schedule ? 'scheduled' : 'immediate';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // System Statistics
    const averageResponseTime = 150; // ms
    const errorRate = 0.02; // 2%
    const uptime = this.systemMetrics.uptime;

    return {
      userStats: {
        totalUsers: users.length,
        activeUsers,
        newUsersThisMonth,
        usersByRole,
        usersByUniversity,
      },
      scheduleStats: {
        totalMeditationSessions,
        totalMeals,
        totalWorkDuties,
        completionRate,
      },
      messageStats: {
        totalMessagesSent,
        deliveryRate,
        messagesByType,
      },
      systemStats: {
        averageResponseTime,
        errorRate,
        uptime,
      },
    };
  }

  // Export functionality
  exportUserData(users: User[], format: 'csv' | 'json' | 'excel'): string {
    if (format === 'json') {
      return JSON.stringify(users, null, 2);
    }

    if (format === 'csv') {
      const headers = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Gender',
        'University', 'Course', 'Date of Birth', 'Roles', 'Created At'
      ];

      const rows = users.map(user => [
        user.id,
        user.firstName,
        user.lastName,
        user.email || '',
        user.phoneNumber,
        user.gender,
        user.university,
        user.course,
        user.dateOfBirth,
        user.roles.join(';'),
        user.createdAt,
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // For Excel format, return CSV for now (would need additional library for true Excel)
    return this.exportUserData(users, 'csv');
  }

  exportScheduleData(
    meditations: MeditationSchedule[],
    meals: Meal[],
    workDuties: WorkDuty[],
    format: 'csv' | 'json'
  ): string {
    const data = {
      meditations,
      meals,
      workDuties,
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // For CSV, create separate sections
    let csv = '';

    // Meditation schedules
    csv += 'MEDITATION SCHEDULES\n';
    csv += 'Date,Time,User ID,Bible Verse\n';
    meditations.forEach(m => {
      csv += `${m.date},${m.time},${m.userId},"${m.bibleVerse}"\n`;
    });

    csv += '\nMEALS\n';
    csv += 'Date,Meal Type,Meal Name,Cook ID,Washer ID,Prep Time,Serve Time\n';
    meals.forEach(m => {
      csv += `${m.date},${m.mealType},"${m.mealName}",${m.cookId},${m.washerId},${m.prepTime},${m.serveTime}\n`;
    });

    csv += '\nWORK DUTIES\n';
    csv += 'Date,Time,Task Name,Is Light,People Count,Assigned User IDs\n';
    workDuties.forEach(w => {
      csv += `${w.date},${w.time},"${w.taskName}",${w.isLight},${w.peopleCount},"${w.assignedUserIds.join(';')}"\n`;
    });

    return csv;
  }

  // Bulk import functionality
  async importUsers(csvData: string): Promise<{ success: User[]; errors: string[] }> {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1);

    const success: User[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const userData: any = {};

        headers.forEach((header, index) => {
          userData[header.toLowerCase().replace(/\s+/g, '')] = values[index];
        });

        // Validate required fields
        if (!userData.firstname || !userData.lastname || !userData.phonenumber) {
          errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        const user: User = {
          id: this.generateId(),
          firstName: userData.firstname.toUpperCase(),
          lastName: userData.lastname.toUpperCase(),
          email: userData.email,
          username: userData.username,
          phoneNumber: userData.phonenumber,
          gender: userData.gender as 'Male' | 'Female',
          university: userData.university,
          course: userData.course?.toUpperCase() || '',
          dateOfBirth: userData.dateofbirth,
          roles: userData.roles ? userData.roles.split(';') : ['Friend'],
          createdAt: new Date().toISOString(),
        };

        success.push(user);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    }

    return { success, errors };
  }

  // System Health Monitoring
  updateSystemHealth(metrics: Partial<SystemHealth>): void {
    this.systemMetrics = { ...this.systemMetrics, ...metrics };
  }

  getSystemHealth(): SystemHealth {
    return { ...this.systemMetrics };
  }

  private getActiveUsersCount(): number {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const activeUserIds = new Set(
      this.activities
        .filter(activity => new Date(activity.timestamp) >= oneHourAgo)
        .map(activity => activity.userId)
    );

    return activeUserIds.size;
  }

  // Advanced Search and Filtering
  searchUsers(
    users: User[],
    query: string,
    filters: {
      roles?: string[];
      universities?: string[];
      gender?: string;
      dateRange?: { start: string; end: string };
    } = {}
  ): User[] {
    let filtered = [...users];

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.phoneNumber.includes(searchTerm) ||
        user.university.toLowerCase().includes(searchTerm) ||
        user.course.toLowerCase().includes(searchTerm)
      );
    }

    // Role filter
    if (filters.roles && filters.roles.length > 0) {
      filtered = filtered.filter(user =>
        user.roles.some(role => filters.roles!.includes(role))
      );
    }

    // University filter
    if (filters.universities && filters.universities.length > 0) {
      filtered = filtered.filter(user =>
        filters.universities!.includes(user.university)
      );
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(user => user.gender === filters.gender);
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(user => {
        const userDate = new Date(user.createdAt);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return userDate >= startDate && userDate <= endDate;
      });
    }

    return filtered;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const analyticsService = new AnalyticsService();