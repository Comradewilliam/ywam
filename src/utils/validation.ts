// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FormValidator {
  private rules: Record<string, ValidationRule> = {};
  
  addRule(field: string, rule: ValidationRule): FormValidator {
    this.rules[field] = rule;
    return this;
  }
  
  validate(data: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    
    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rule);
      errors.push(...fieldErrors);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  validateField(field: string, value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];
    const fieldName = this.formatFieldName(field);
    
    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${fieldName} is required`);
      return errors; // Skip other validations if required field is empty
    }
    
    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return errors;
    }
    
    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldName} must be no more than ${rule.maxLength} characters long`);
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }
    }
    
    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }
    
    return errors;
  }
  
  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

// Pre-defined validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+255\d{9}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  university: /^[A-Z]{2,10}$/,
  course: /^[A-Z\s]{2,100}$/,
};

// Common validation rules
export const CommonRules = {
  required: { required: true },
  
  email: {
    required: true,
    pattern: ValidationPatterns.email,
    maxLength: 100
  },
  
  phone: {
    required: true,
    pattern: ValidationPatterns.phone,
    custom: (value: string) => {
      if (!ValidationPatterns.phone.test(value)) {
        return 'Phone number must be in format +255XXXXXXXXX';
      }
      return null;
    }
  },
  
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: ValidationPatterns.username,
    custom: (value: string) => {
      if (!ValidationPatterns.username.test(value)) {
        return 'Username can only contain letters, numbers, and underscores';
      }
      return null;
    }
  },
  
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      const errors: string[] = [];
      
      if (!/[A-Z]/.test(value)) {
        errors.push('at least one uppercase letter');
      }
      if (!/[a-z]/.test(value)) {
        errors.push('at least one lowercase letter');
      }
      if (!/\d/.test(value)) {
        errors.push('at least one number');
      }
      if (!/[@$!%*?&]/.test(value)) {
        errors.push('at least one special character (@$!%*?&)');
      }
      
      if (errors.length > 0) {
        return `Passwor must contain ${errors.join(', ')}`;
      }
      
      return null;
    }
  },
  
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: ValidationPatterns.name,
    custom: (value: string) => {
      if (!ValidationPatterns.name.test(value)) {
        return 'Name can only contain letters and spaces';
      }
      return null;
    }
  },
  
  university: {
    required: true,
    minLength: 2,
    maxLength: 10,
    pattern: ValidationPatterns.university,
    custom: (value: string) => {
      if (!ValidationPatterns.university.test(value)) {
        return 'University code must be uppercase letters only';
      }
      return null;
    }
  },
  
  course: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: ValidationPatterns.course,
    custom: (value: string) => {
      if (!ValidationPatterns.course.test(value)) {
        return 'Course must be uppercase letters and spaces only';
      }
      return null;
    
    }
  },
  
  dateOfBirth: {
    required: true,
    custom: (value: string) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      
      if (age < 16) {
        return 'Must be at least 16 years old';
      }
      if (age > 100) {
        return 'Please enter a valid date of birth';
      }
      
      return null;
    }
  }
};

// Utility functions for specific validations
export const validatePhoneNumber = (phone: string): boolean => {
  return ValidationPatterns.phone.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return ValidationPat terns.email.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};