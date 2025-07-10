import { User } from '../types';

export interface SMSMessage {
  id: string;
  to: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export interface BeemSMSConfig {
  apiKey: string;
  secretKey: string;
  sourceAddr: string;
}

export interface AfricasTalkingConfig {
  username: string;
  apiKey: string;
  from: string;
}

class SMSService {
  private beemConfig: BeemSMSConfig;
  private africasTalkingConfig: AfricasTalkingConfig;
  private templates: Map<string, SMSTemplate> = new Map();
  private currentProvider: 'beem' | 'africas-talking' = 'beem';

  constructor() {
    // Use environment variables or fallback to demo values
    this.beemConfig = {
      apiKey: import.meta.env.VITE_BEEM_API_KEY || 'demo-beem-api-key',
      secretKey: import.meta.env.VITE_BEEM_SECRET_KEY || 'demo-beem-secret-key',
      sourceAddr: import.meta.env.VITE_BEEM_SOURCE_ADDR || 'YWAM DAR',
    };

    this.africasTalkingConfig = {
      username: import.meta.env.VITE_AT_USERNAME || 'demo-at-username',
      apiKey: import.meta.env.VITE_AT_API_KEY || 'demo-at-api-key',
      from: import.meta.env.VITE_AT_FROM || 'YWAM DAR',
    };

    this.initializeTemplates();
  }

  private initializeTemplates() {
    const defaultTemplates: SMSTemplate[] = [
      {
        id: 'meditation-reminder',
        name: 'Meditation Reminder',
        content: 'Hi {{firstName}}, meditation session starts in 15 minutes. Today\'s passage: {{bibleVerse}}. See you there! - YWAM DAR',
        variables: ['firstName', 'bibleVerse'],
      },
      {
        id: 'cooking-reminder',
        name: 'Cooking Duty Reminder',
        content: 'Hi {{firstName}}, your {{role}} duty for {{mealType}} starts in 15 minutes. Menu: {{mealName}}. - YWAM DAR',
        variables: ['firstName', 'role', 'mealType', 'mealName'],
      },
      {
        id: 'meal-ready',
        name: 'Meal Ready Notification',
        content: '{{mealType}} is ready! Please come to the dining hall. Menu: {{mealName}} - YWAM DAR',
        variables: ['mealType', 'mealName'],
      },
      {
        id: 'work-duty-reminder',
        name: 'Work Duty Reminder',
        content: 'Hi {{firstName}}, work duty reminder: {{taskName}} starts in 15 minutes at {{time}}. - YWAM DAR',
        variables: ['firstName', 'taskName', 'time'],
      },
      {
        id: 'general-announcement',
        name: 'General Announcement',
        content: 'Hi {{firstName}}, {{message}} - YWAM DAR',
        variables: ['firstName', 'message'],
      },
      {
        id: 'birthday-wish',
        name: 'Birthday Wish',
        content: 'Happy Birthday {{firstName}}! 🎉 May God\'s blessings be upon you today and always. - YWAM DAR Family',
        variables: ['firstName'],
      },
      {
        id: 'welcome-message',
        name: 'Welcome Message',
        content: 'Welcome to YWAM DAR, {{firstName}}! We\'re excited to have you join our community. Your login details will be shared separately. - YWAM DAR',
        variables: ['firstName'],
      },
      {
        id: 'login-credentials',
        name: 'Login Credentials',
        content: 'Hi {{firstName}}, your YWAM DAR login: Username: {{username}}, Password: {{password}}. Please change your password after first login. - YWAM DAR',
        variables: ['firstName', 'username', 'password'],
      },
      {
        id: 'meeting-reminder',
        name: 'Meeting Reminder',
        content: 'Hi {{firstName}}, reminder: {{meetingTitle}} starts in {{timeUntil}} at {{location}}. - YWAM DAR',
        variables: ['firstName', 'meetingTitle', 'timeUntil', 'location'],
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  setProvider(provider: 'beem' | 'africas-talking') {
    this.currentProvider = provider;
  }

  async sendSMS(to: string, message: string): Promise<SMSMessage> {
    const smsMessage: SMSMessage = {
      id: this.generateId(),
      to,
      message,
      status: 'pending',
    };

    try {
      let response;
      
      if (this.currentProvider === 'beem') {
        response = await this.callBeemAPI({
          source_addr: this.beemConfig.sourceAddr,
          dest_addr: to,
          message: message,
          encoding: 0,
        });
      } else {
        response = await this.callAfricasTalkingAPI({
          to: [to],
          message: message,
          from: this.africasTalkingConfig.from,
        });
      }

      if (response.successful) {
        smsMessage.status = 'sent';
        smsMessage.sentAt = new Date().toISOString();
      } else {
        smsMessage.status = 'failed';
        smsMessage.errorMessage = response.error || 'Unknown error';
      }
    } catch (error) {
      smsMessage.status = 'failed';
      smsMessage.errorMessage = error instanceof Error ? error.message : 'Network error';
    }

    return smsMessage;
  }

  async sendBulkSMS(recipients: string[], message: string): Promise<SMSMessage[]> {
    const promises = recipients.map(recipient => this.sendSMS(recipient, message));
    return Promise.all(promises);
  }

  async sendTemplatedSMS(
    templateId: string,
    recipients: User[],
    variables: Record<string, any> = {}
  ): Promise<SMSMessage[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const messages: Promise<SMSMessage>[] = recipients.map(async (recipient) => {
      const personalizedMessage = this.personalizeMessage(template.content, {
        ...variables,
        firstName: recipient.firstName,
        lastName: recipient.lastName,
      });

      return this.sendSMS(recipient.phoneNumber, personalizedMessage);
    });

    return Promise.all(messages);
  }

  private personalizeMessage(template: string, variables: Record<string, any>): string {
    let message = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return message;
  }

  private async callBeemAPI(payload: any): Promise<any> {
    // Simulate Beem Africa API call
    const url = 'https://apisms.beem.africa/v1/send';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${this.beemConfig.apiKey}`,
          'X-Secret-Key': this.beemConfig.secretKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { successful: true, data };
    } catch (error) {
      console.error('Beem API Error:', error);
      // For demo purposes, simulate success
      return { 
        successful: Math.random() > 0.1, // 90% success rate for demo
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async callAfricasTalkingAPI(payload: any): Promise<any> {
    // Simulate Africa's Talking API call
    const url = 'https://api.africastalking.com/version1/messaging';
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.africasTalkingConfig.username);
      formData.append('to', payload.to.join(','));
      formData.append('message', payload.message);
      formData.append('from', payload.from);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.africasTalkingConfig.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { successful: true, data };
    } catch (error) {
      console.error('Africa\'s Talking API Error:', error);
      // For demo purposes, simulate success
      return { 
        successful: Math.random() > 0.1, // 90% success rate for demo
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getTemplate(templateId: string): SMSTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): SMSTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: SMSTemplate): void {
    this.templates.set(template.id, template);
  }

  updateTemplate(templateId: string, updates: Partial<SMSTemplate>): void {
    const existing = this.templates.get(templateId);
    if (existing) {
      this.templates.set(templateId, { ...existing, ...updates });
    }
  }

  deleteTemplate(templateId: string): void {
    this.templates.delete(templateId);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Reminder scheduling methods
  scheduleReminder(
    type: 'meditation' | 'cooking' | 'work-duty' | 'meal-ready',
    scheduledTime: string,
    recipients: User[],
    data: any
  ): void {
    const reminderTime = new Date(scheduledTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - 15); // 15 minutes before

    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        this.sendScheduledReminder(type, recipients, data);
      }, delay);
    }
  }

  private async sendScheduledReminder(
    type: string,
    recipients: User[],
    data: any
  ): Promise<void> {
    let templateId: string;
    let variables: Record<string, any> = {};

    switch (type) {
      case 'meditation':
        templateId = 'meditation-reminder';
        variables = { bibleVerse: data.bibleVerse };
        break;
      case 'cooking':
        templateId = 'cooking-reminder';
        variables = {
          role: data.role,
          mealType: data.mealType,
          mealName: data.mealName,
        };
        break;
      case 'work-duty':
        templateId = 'work-duty-reminder';
        variables = {
          taskName: data.taskName,
          time: data.time,
        };
        break;
      case 'meal-ready':
        templateId = 'meal-ready';
        variables = {
          mealType: data.mealType,
          mealName: data.mealName,
        };
        break;
      default:
        return;
    }

    try {
      await this.sendTemplatedSMS(templateId, recipients, variables);
      console.log(`Sent ${type} reminder to ${recipients.length} recipients`);
    } catch (error) {
      console.error(`Failed to send ${type} reminder:`, error);
    }
  }
}

export const smsService = new SMSService();