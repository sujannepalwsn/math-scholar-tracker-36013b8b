/**
 * Standardized logging utility for Math Scholar Tracker.
 * In a production environment, this could be easily swapped to
 * push logs to a service like Sentry, LogRocket, or a custom Edge Function.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  public info(message: string, context?: LogContext) {
    console.info(this.formatMessage('info', message), context || '');
  }

  public warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message), context || '');
  }

  public error(message: string, error?: any, context?: LogContext) {
    const formattedMessage = this.formatMessage('error', message);

    // In production, we would send this to Sentry/LogRocket here
    console.error(formattedMessage, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        ...error
      } : error,
      ...context
    });
  }

  public debug(message: string, context?: LogContext) {
    if (import.meta.env.DEV) {
      console.debug(this.formatMessage('debug', message), context || '');
    }
  }
}

export const logger = Logger.getInstance();
