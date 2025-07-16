interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
}

class ErrorHandlingService {
  private errors: ErrorLog[] = [];
  private maxErrors = 1000;

  logError(error: Error | string, context?: any, userId?: string): void {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      userId,
    };

    this.errors.unshift(errorLog);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorLog);
    }

    // In production, you might want to send to external logging service
    this.sendToExternalLogger(errorLog);
  }

  logWarning(message: string, context?: any, userId?: string): void {
    const warningLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: 'warning',
      message,
      context,
      userId,
    };

    this.errors.unshift(warningLog);
    
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    if (import.meta.env.DEV) {
      console.warn('Warning logged:', warningLog);
    }
  }

  logInfo(message: string, context?: any, userId?: string): void {
    const infoLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
      userId,
    };

    this.errors.unshift(infoLog);
    
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    if (import.meta.env.DEV) {
      console.info('Info logged:', infoLog);
    }
  }

  getErrors(level?: 'error' | 'warning' | 'info', limit: number = 100): ErrorLog[] {
    let filtered = this.errors;
    
    if (level) {
      filtered = this.errors.filter(error => error.level === level);
    }
    
    return filtered.slice(0, limit);
  }

  clearErrors(): void {
    this.errors = [];
  }

  private sendToExternalLogger(errorLog: ErrorLog): void {
    // In production, implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
    
    // For now, we'll just store locally
    try {
      const existingLogs = JSON.parse(localStorage.getItem('ywam-error-logs') || '[]');
      existingLogs.unshift(errorLog);
      
      // Keep only last 100 errors in localStorage
      const trimmedLogs = existingLogs.slice(0, 100);
      localStorage.setItem('ywam-error-logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to store error log:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Wrapper for async operations with error handling
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: any,
    userId?: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.logError(error as Error, context, userId);
      return null;
    }
  }

  // Global error handler setup
  setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        new Error(`Unhandled promise rejection: ${event.reason}`),
        { type: 'unhandledrejection', reason: event.reason }
      );
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.logError(
        new Error(event.message),
        {
          type: 'uncaught',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });
  }
}

export const errorHandlingService = new ErrorHandlingService();

// Initialize global error handling
errorHandlingService.setupGlobalErrorHandling();