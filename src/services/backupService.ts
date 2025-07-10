import { User, MeditationSchedule, Meal, WorkDuty, Message } from '../types';

export interface BackupData {
  id: string;
  timestamp: string;
  version: string;
  data: {
    users: User[];
    meditations: MeditationSchedule[];
    meals: Meal[];
    workDuties: WorkDuty[];
    messages: Message[];
  };
  metadata: {
    totalUsers: number;
    totalRecords: number;
    createdBy: string;
    description?: string;
  };
}

export interface BackupConfig {
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  includeUserData: boolean;
  includeSchedules: boolean;
  includeMessages: boolean;
}

class BackupService {
  private backups: BackupData[] = [];
  private config: BackupConfig = {
    autoBackup: true,
    backupInterval: 'daily',
    maxBackups: 30,
    includeUserData: true,
    includeSchedules: true,
    includeMessages: true,
  };

  async createBackup(
    data: {
      users: User[];
      meditations: MeditationSchedule[];
      meals: Meal[];
      workDuties: WorkDuty[];
      messages: Message[];
    },
    createdBy: string,
    description?: string
  ): Promise<BackupData> {
    const backup: BackupData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        users: this.config.includeUserData ? data.users : [],
        meditations: this.config.includeSchedules ? data.meditations : [],
        meals: this.config.includeSchedules ? data.meals : [],
        workDuties: this.config.includeSchedules ? data.workDuties : [],
        messages: this.config.includeMessages ? data.messages : [],
      },
      metadata: {
        totalUsers: data.users.length,
        totalRecords: data.users.length + data.meditations.length + data.meals.length + data.workDuties.length + data.messages.length,
        createdBy,
        description,
      },
    };

    this.backups.push(backup);

    // Maintain max backups limit
    if (this.backups.length > this.config.maxBackups) {
      this.backups = this.backups
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.config.maxBackups);
    }

    return backup;
  }

  getBackups(): BackupData[] {
    return this.backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getBackup(id: string): BackupData | null {
    return this.backups.find(backup => backup.id === id) || null;
  }

  async restoreBackup(backupId: string): Promise<BackupData['data']> {
    const backup = this.getBackup(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    // In a real application, this would restore data to the database
    return backup.data;
  }

  deleteBackup(id: string): boolean {
    const index = this.backups.findIndex(backup => backup.id === id);
    if (index !== -1) {
      this.backups.splice(index, 1);
      return true;
    }
    return false;
  }

  exportBackup(backupId: string): string {
    const backup = this.getBackup(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(backupJson: string): Promise<BackupData> {
    try {
      const backup: BackupData = JSON.parse(backupJson);
      
      // Validate backup structure
      if (!backup.id || !backup.timestamp || !backup.data) {
        throw new Error('Invalid backup format');
      }

      // Generate new ID to avoid conflicts
      backup.id = this.generateId();
      backup.timestamp = new Date().toISOString();

      this.backups.push(backup);
      return backup;
    } catch (error) {
      throw new Error('Failed to import backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Auto backup scheduling
  scheduleAutoBackup(
    dataProvider: () => Promise<{
      users: User[];
      meditations: MeditationSchedule[];
      meals: Meal[];
      workDuties: WorkDuty[];
      messages: Message[];
    }>,
    userId: string
  ): void {
    if (!this.config.autoBackup) {
      return;
    }

    const intervals = {
      daily: 24 * 60 * 60 * 1000, // 24 hours
      weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
      monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    const interval = intervals[this.config.backupInterval];

    setInterval(async () => {
      try {
        const data = await dataProvider();
        await this.createBackup(data, userId, `Auto backup - ${this.config.backupInterval}`);
        console.log('Auto backup created successfully');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, interval);
  }

  // Backup validation
  validateBackup(backup: BackupData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!backup.id) errors.push('Missing backup ID');
    if (!backup.timestamp) errors.push('Missing timestamp');
    if (!backup.data) errors.push('Missing data');
    if (!backup.metadata) errors.push('Missing metadata');

    // Validate data structure
    if (backup.data) {
      if (!Array.isArray(backup.data.users)) errors.push('Invalid users data');
      if (!Array.isArray(backup.data.meditations)) errors.push('Invalid meditations data');
      if (!Array.isArray(backup.data.meals)) errors.push('Invalid meals data');
      if (!Array.isArray(backup.data.workDuties)) errors.push('Invalid work duties data');
      if (!Array.isArray(backup.data.messages)) errors.push('Invalid messages data');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Storage size calculation
  getBackupSize(backup: BackupData): number {
    return new Blob([JSON.stringify(backup)]).size;
  }

  getTotalBackupSize(): number {
    return this.backups.reduce((total, backup) => total + this.getBackupSize(backup), 0);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const backupService = new BackupService();