import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

class EnhancedAuthService {
  private refreshTokens: Map<string, RefreshTokenData> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  // Rate limiting for authentication attempts
  private checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(identifier);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxAttempts) {
      return false;
    }

    limit.count++;
    return true;
  }

  async login(credentials: { email?: string; username?: string; password: string }): Promise<{ user: User; tokens: AuthTokens }> {
    const identifier = credentials.email || credentials.username || '';
    
    if (!this.checkRateLimit(identifier)) {
      throw new Error('Too many login attempts. Please try again later.');
    }

    try {
      let authResult;
      
      if (credentials.email) {
        authResult = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
      } else {
        // For username login, we need to find the user first
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', credentials.username)
          .single();

        if (userError || !userData) {
          throw new Error('Invalid credentials');
        }

        authResult = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: credentials.password,
        });
      }

      if (authResult.error) {
        throw new Error(authResult.error.message);
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authResult.data.user.id)
        .single();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const user: User = {
        id: userProfile.id,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        username: userProfile.username,
        email: userProfile.email,
        phoneNumber: userProfile.phone_number,
        gender: userProfile.gender,
        university: userProfile.university,
        course: userProfile.course,
        dateOfBirth: userProfile.date_of_birth,
        roles: userProfile.roles,
        profilePhoto: userProfile.profile_photo,
        createdAt: userProfile.created_at,
      };

      const tokens = this.generateTokens(authResult.data.session);

      // Clear rate limit on successful login
      this.rateLimits.delete(identifier);

      return { user, tokens };
    } catch (error) {
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const tokenData = this.refreshTokens.get(refreshToken);
    
    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw new Error(error.message);
      }

      return this.generateTokens(data.session);
    } catch (error) {
      this.refreshTokens.delete(refreshToken);
      throw error;
    }
  }

  async logout(refreshToken?: string): Promise<void> {
    try {
      await supabase.auth.signOut();
      
      if (refreshToken) {
        this.refreshTokens.delete(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private generateTokens(session: any): AuthTokens {
    const refreshToken = this.generateRefreshToken();
    const expiresIn = 24 * 60 * 60 * 1000; // 24 hours

    this.refreshTokens.set(refreshToken, {
      userId: session.user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    });

    return {
      accessToken: session.access_token,
      refreshToken,
      expiresIn,
    };
  }

  private generateRefreshToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async validatePassword(password: string): Promise<{ isValid: boolean; errors: string[] }> {
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

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_permission', {
        p_user_id: userId,
        p_resource: resource,
        p_action: action,
      });

      if (error) {
        console.error('Permission check error:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }
}

export const enhancedAuthService = new EnhancedAuthService();