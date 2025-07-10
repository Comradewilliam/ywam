import { supabase } from '../lib/supabase';
import { User, MeditationSchedule, Meal, WorkDuty, Message } from '../types';

export class SupabaseService {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      email: user.email,
      phoneNumber: user.phone_number,
      gender: user.gender,
      university: user.university,
      course: user.course,
      dateOfBirth: user.date_of_birth,
      roles: user.roles,
      profilePhoto: user.profile_photo,
      createdAt: user.created_at,
    }));
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        username: userData.username,
        email: userData.email,
        phone_number: userData.phoneNumber,
        gender: userData.gender,
        university: userData.university,
        course: userData.course,
        date_of_birth: userData.dateOfBirth,
        roles: userData.roles,
        profile_photo: userData.profilePhoto,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      email: data.email,
      phoneNumber: data.phone_number,
      gender: data.gender,
      university: data.university,
      course: data.course,
      dateOfBirth: data.date_of_birth,
      roles: data.roles,
      profilePhoto: data.profile_photo,
      createdAt: data.created_at,
    };
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const updateData: any = {};
    
    if (userData.firstName) updateData.first_name = userData.firstName;
    if (userData.lastName) updateData.last_name = userData.lastName;
    if (userData.username) updateData.username = userData.username;
    if (userData.email) updateData.email = userData.email;
    if (userData.phoneNumber) updateData.phone_number = userData.phoneNumber;
    if (userData.gender) updateData.gender = userData.gender;
    if (userData.university) updateData.university = userData.university;
    if (userData.course) updateData.course = userData.course;
    if (userData.dateOfBirth) updateData.date_of_birth = userData.dateOfBirth;
    if (userData.roles) updateData.roles = userData.roles;
    if (userData.profilePhoto) updateData.profile_photo = userData.profilePhoto;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      email: data.email,
      phoneNumber: data.phone_number,
      gender: data.gender,
      university: data.university,
      course: data.course,
      dateOfBirth: data.date_of_birth,
      roles: data.roles,
      profilePhoto: data.profile_photo,
      createdAt: data.created_at,
    };
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Meditation Schedules
  async getMeditationSchedules(): Promise<MeditationSchedule[]> {
    const { data, error } = await supabase
      .from('meditation_schedules')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return data.map(schedule => ({
      id: schedule.id,
      date: schedule.date,
      time: schedule.time,
      userId: schedule.user_id || '',
      bibleVerse: schedule.bible_verse,
    }));
  }

  async createMeditationSchedule(scheduleData: Omit<MeditationSchedule, 'id'>): Promise<MeditationSchedule> {
    const { data, error } = await supabase
      .from('meditation_schedules')
      .insert({
        date: scheduleData.date,
        time: scheduleData.time,
        user_id: scheduleData.userId,
        bible_verse: scheduleData.bibleVerse,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      time: data.time,
      userId: data.user_id || '',
      bibleVerse: data.bible_verse,
    };
  }

  // Meals
  async getMeals(): Promise<Meal[]> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return data.map(meal => ({
      id: meal.id,
      date: meal.date,
      mealType: meal.meal_type,
      mealName: meal.meal_name,
      cookId: meal.cook_id || '',
      washerId: meal.washer_id || '',
      prepTime: meal.prep_time,
      serveTime: meal.serve_time,
    }));
  }

  async createMeal(mealData: Omit<Meal, 'id'>): Promise<Meal> {
    const { data, error } = await supabase
      .from('meals')
      .insert({
        date: mealData.date,
        meal_type: mealData.mealType,
        meal_name: mealData.mealName,
        cook_id: mealData.cookId || null,
        washer_id: mealData.washerId || null,
        prep_time: mealData.prepTime,
        serve_time: mealData.serveTime,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      mealType: data.meal_type,
      mealName: data.meal_name,
      cookId: data.cook_id || '',
      washerId: data.washer_id || '',
      prepTime: data.prep_time,
      serveTime: data.serve_time,
    };
  }

  async updateMeal(id: string, mealData: Partial<Meal>): Promise<Meal> {
    const updateData: any = {};
    
    if (mealData.date) updateData.date = mealData.date;
    if (mealData.mealType) updateData.meal_type = mealData.mealType;
    if (mealData.mealName) updateData.meal_name = mealData.mealName;
    if (mealData.cookId) updateData.cook_id = mealData.cookId;
    if (mealData.washerId) updateData.washer_id = mealData.washerId;
    if (mealData.prepTime) updateData.prep_time = mealData.prepTime;
    if (mealData.serveTime) updateData.serve_time = mealData.serveTime;

    const { data, error } = await supabase
      .from('meals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      mealType: data.meal_type,
      mealName: data.meal_name,
      cookId: data.cook_id || '',
      washerId: data.washer_id || '',
      prepTime: data.prep_time,
      serveTime: data.serve_time,
    };
  }

  // Work Duties
  async getWorkDuties(): Promise<WorkDuty[]> {
    const { data, error } = await supabase
      .from('work_duties')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return data.map(duty => ({
      id: duty.id,
      taskName: duty.task_name,
      isLight: duty.is_light,
      isGroup: duty.is_group,
      peopleCount: duty.people_count,
      date: duty.date,
      time: duty.time,
      assignedUserIds: duty.assigned_user_ids,
    }));
  }

  async createWorkDuty(dutyData: Omit<WorkDuty, 'id'>): Promise<WorkDuty> {
    const { data, error } = await supabase
      .from('work_duties')
      .insert({
        task_name: dutyData.taskName,
        is_light: dutyData.isLight,
        is_group: dutyData.isGroup,
        people_count: dutyData.peopleCount,
        date: dutyData.date,
        time: dutyData.time,
        assigned_user_ids: dutyData.assignedUserIds,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      taskName: data.task_name,
      isLight: data.is_light,
      isGroup: data.is_group,
      peopleCount: data.people_count,
      date: data.date,
      time: data.time,
      assignedUserIds: data.assigned_user_ids,
    };
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    if (this.isDemoMode()) {
      return realDataService.getMessages();
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(message => ({
      id: message.id,
      content: message.content,
      recipients: message.recipients,
      sentAt: message.sent_at || message.created_at,
      sentBy: message.sender_id || '',
      schedule: message.scheduled_for ? {
        startDate: message.scheduled_for,
        frequency: 'once' as const,
      } : undefined,
    }));
  }

  async sendMessage(messageData: Omit<Message, 'id' | 'sentAt'>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: messageData.content,
        recipients: messageData.recipients,
        sender_id: messageData.sentBy,
        scheduled_for: messageData.schedule?.startDate,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      content: data.content,
      recipients: data.recipients,
      sentAt: data.sent_at || data.created_at,
      sentBy: data.sender_id || '',
      schedule: data.scheduled_for ? {
        startDate: data.scheduled_for,
        frequency: 'once' as const,
      } : undefined,
    };
  }

  // Notification Templates
  async getNotificationTemplates() {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createNotificationTemplate(template: any) {
    const { data, error } = await supabase
      .from('notification_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNotificationTemplate(id: string, updates: any) {
    const { data, error } = await supabase
      .from('notification_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNotificationTemplate(id: string) {
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Lecture Schedules
  async getLectureSchedules(month?: string) {
    let query = supabase
      .from('lecture_schedules')
      .select('*')
      .order('date', { ascending: true });

    if (month) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async createLectureSchedule(lecture: any) {
    const { data, error } = await supabase
      .from('lecture_schedules')
      .insert(lecture)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLectureSchedule(id: string, updates: any) {
    const { data, error } = await supabase
      .from('lecture_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLectureSchedule(id: string) {
    const { error } = await supabase
      .from('lecture_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Kitchen Rules
  async getKitchenRules() {
    const { data, error } = await supabase
      .from('kitchen_rules')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  async updateKitchenRules(rules: any) {
    const { data, error } = await supabase
      .from('kitchen_rules')
      .update(rules)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // System Settings
  async getSystemSetting(key: string) {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) throw error;
    return data?.setting_value;
  }

  async updateSystemSetting(key: string, value: any) {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Schedule Publication
  async isSchedulePublished(): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_schedule_published');
    if (error) throw error;
    return data;
  }

  async publishSchedules(): Promise<void> {
    const { error } = await supabase.rpc('auto_publish_schedules');
    if (error) throw error;
  }

  // User Exchange for Kitchen Duties
  async exchangeKitchenUsers(fromMealId: string, toMealId: string, fromUserId: string, toUserId: string): Promise<void> {
    // Get both meals
    const { data: fromMeal, error: fromError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', fromMealId)
      .single();

    const { data: toMeal, error: toError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', toMealId)
      .single();

    if (fromError || toError) throw fromError || toError;

    // Determine what to exchange
    const fromUpdates: any = {};
    const toUpdates: any = {};

    if (fromMeal.cook_id === fromUserId) {
      fromUpdates.cook_id = toMeal.cook_id;
      toUpdates.cook_id = fromMeal.cook_id;
    }

    if (fromMeal.washer_id === fromUserId) {
      fromUpdates.washer_id = toMeal.washer_id;
      toUpdates.washer_id = fromMeal.washer_id;
    }

    // Update both meals
    const { error: updateError1 } = await supabase
      .from('meals')
      .update(fromUpdates)
      .eq('id', fromMealId);

    const { error: updateError2 } = await supabase
      .from('meals')
      .update(toUpdates)
      .eq('id', toMealId);

    if (updateError1 || updateError2) throw updateError1 || updateError2;
  }
}

export const supabaseService = new SupabaseService();