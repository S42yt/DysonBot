import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import Logger from './logger.js';

class LogManager {
  private static instance: LogManager;
  private logBuffer: string[] = [];
  private logsDir: string;

  private constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogsDirectoryExists();
    this.setupLogCapture();
    this.registerExitHandlers();
  }

  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  private ensureLogsDirectoryExists(): void {
    if (!existsSync(this.logsDir)) {
      try {
        mkdirSync(this.logsDir, { recursive: true });
        Logger.info(`Created logs directory at: ${this.logsDir}`);
      } catch (error) {
        Logger.error('Failed to create logs directory:', error);
      }
    }
  }

  private setupLogCapture(): void {
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.log = (...args: any[]) => {
      this.captureLog('LOG', args);
      originalConsoleLog.apply(console, args);
    };

    console.info = (...args: any[]) => {
      this.captureLog('INFO', args);
      originalConsoleInfo.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.captureLog('WARN', args);
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.captureLog('ERROR', args);
      originalConsoleError.apply(console, args);
    };
  }

  private captureLog(level: string, args: any[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${args
      .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
      .join(' ')}`;

    this.logBuffer.push(logMessage);
  }

  private registerExitHandlers(): void {
    process.on('exit', () => {
      this.saveLogsToFile();
    });

    process.on('SIGINT', () => {
      Logger.info('Received SIGINT signal, saving logs before exit');
      this.saveLogsToFile();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      Logger.info('Received SIGTERM signal, saving logs before exit');
      this.saveLogsToFile();
      process.exit(0);
    });

    process.on('uncaughtException', error => {
      Logger.error('Uncaught exception, saving logs before exit:', error);
      this.saveLogsToFile();
    });
  }

  public saveLogsToFile(): void {
    try {
      const now = new Date();
      const dateString = now
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      const logFilePath = path.join(this.logsDir, `${dateString}.log`);

      writeFileSync(logFilePath, this.logBuffer.join('\n'), 'utf8');
    } catch (error) {
      console.error('Failed to save logs to file:', error);
    }
  }
}

export default LogManager.getInstance();
