import { supabaseService } from './supabaseService';

export interface KitchenRules {
  id: string;
  rule_name: string;
  exclude_roles_cooking: string[];
  exclude_roles_washing: string[];
  day_restrictions: {
    [role: string]: {
      excludeDays: number[];
      excludeMeals: string[];
    };
  };
  publish_day: number;
  publish_hour: number;
  publish_minute: number;
  is_active: boolean;
}

class KitchenRulesService {
  private rules: KitchenRules | null = null;

  async loadRules(): Promise<KitchenRules> {
    if (!this.rules) {
      this.rules = await supabaseService.getKitchenRules();
    }
    return this.rules;
  }

  async updateRules(updates: Partial<KitchenRules>): Promise<KitchenRules> {
    this.rules = await supabaseService.updateKitchenRules(updates);
    return this.rules;
  }

  async canUserCook(userRoles: string[], date: string): Promise<boolean> {
    const rules = await this.loadRules();
    
    // Check if user has excluded roles
    if (rules.exclude_roles_cooking.some(role => userRoles.includes(role))) {
      return false;
    }

    const dayOfWeek = new Date(date).getDay();
    
    // Check day restrictions for each role
    for (const role of userRoles) {
      const restrictions = rules.day_restrictions[role];
      if (restrictions && restrictions.excludeDays.includes(dayOfWeek)) {
        return false;
      }
    }

    return true;
  }

  async canUserWashDishes(userRoles: string[], date: string, mealType: string): Promise<boolean> {
    const rules = await this.loadRules();
    
    // Check if user has excluded roles
    if (rules.exclude_roles_washing.some(role => userRoles.includes(role))) {
      return false;
    }

    const dayOfWeek = new Date(date).getDay();
    
    // Check day restrictions for each role
    for (const role of userRoles) {
      const restrictions = rules.day_restrictions[role];
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

  async isSchedulePublished(): Promise<boolean> {
    return await supabaseService.isSchedulePublished();
  }

  async getPublicationTime(): Promise<{ day: number; hour: number; minute: number }> {
    const rules = await this.loadRules();
    return {
      day: rules.publish_day,
      hour: rules.publish_hour,
      minute: rules.publish_minute,
    };
  }

  async updatePublicationTime(day: number, hour: number, minute: number): Promise<void> {
    await this.updateRules({
      publish_day: day,
      publish_hour: hour,
      publish_minute: minute,
    });
  }

  async autoAssignKitchenDuties(meals: any[], users: any[]): Promise<any[]> {
    const rules = await this.loadRules();
    const updatedMeals = [];

    for (const meal of meals) {
      // Skip Sunday breakfast and lunch user assignments
      const dayOfWeek = new Date(meal.date).getDay();
      if (dayOfWeek === 0 && (meal.meal_type === 'Breakfast' || meal.meal_type === 'Lunch')) {
        updatedMeals.push(meal);
        continue;
      }

      // Get eligible cooks
      const eligibleCooks = [];
      for (const user of users) {
        if (await this.canUserCook(user.roles, meal.date)) {
          eligibleCooks.push(user);
        }
      }

      // Get eligible washers
      const eligibleWashers = [];
      for (const user of users) {
        if (await this.canUserWashDishes(user.roles, meal.date, meal.meal_type)) {
          eligibleWashers.push(user);
        }
      }

      // Randomly assign cook and washer
      let cookId = null;
      let washerId = null;

      if (eligibleCooks.length > 0) {
        const randomCook = eligibleCooks[Math.floor(Math.random() * eligibleCooks.length)];
        cookId = randomCook.id;
      }

      if (eligibleWashers.length > 0) {
        // Ensure washer is different from cook
        const availableWashers = eligibleWashers.filter(w => w.id !== cookId);
        if (availableWashers.length > 0) {
          const randomWasher = availableWashers[Math.floor(Math.random() * availableWashers.length)];
          washerId = randomWasher.id;
        } else if (eligibleWashers.length > 1) {
          // If only one washer available and it's the cook, pick another
          const randomWasher = eligibleWashers[Math.floor(Math.random() * eligibleWashers.length)];
          washerId = randomWasher.id;
        }
      }

      updatedMeals.push({
        ...meal,
        cook_id: cookId,
        washer_id: washerId,
      });
    }

    return updatedMeals;
  }
}

export const kitchenRulesService = new KitchenRulesService();