import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email?: string;
  username?: string;
  phoneNumber: string;
  password: string;
  gender: 'Male' | 'Female';
  university: string;
  course: string;
  dateOfBirth: string;
  roles: string[];
}

class AuthService {
  private refreshTokens: Set<string> = new Set();

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateTokens(user: User): AuthTokens {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    this.refreshTokens.add(refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    };
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    if (!this.refreshTokens.has(refreshToken)) {
      throw new Error('Invalid refresh token');
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
      // In a real app, you'd fetch the user from database
      const user = await this.getUserById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
      };

      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('Invalid refresh token');
    }
  }

  revokeRefreshToken(refreshToken: string): void {
    this.refreshTokens.delete(refreshToken);
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
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

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async getUserById(id: string): Promise<User | null> {
    // This would be replaced with actual database call
    // For now, return mock data
    return {
      id,
      firstName: 'Mock',
      lastName: 'User',
      phoneNumber: '+255123456789',
      gender: 'Male',
      university: 'KIUT',
      course: 'COMPUTER SCIENCE',
      dateOfBirth: '1990-01-01',
      roles: ['Staff'],
      createdAt: new Date().toISOString(),
    };
  }

  hasPermission(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }

  isAdmin(userRoles: string[]): boolean {
    return userRoles.includes('Admin');
  }

  canAccessResource(userRoles: string[], resourceType: string): boolean {
    const permissions = {
      'user-management': ['Admin'],
      'meditation-schedule': ['Admin', 'Missionary'],
      'meal-planning': ['Admin', 'Chef'],
      'work-duty': ['Admin', 'WorkDutyManager'],
      'messages': ['Admin'],
      'reports': ['Admin', 'Missionary', 'Chef', 'WorkDutyManager'],
    };

    const requiredRoles = permissions[resourceType] || [];
    return this.hasPermission(userRoles, requiredRoles);
  }
}

export const authService = new AuthService();