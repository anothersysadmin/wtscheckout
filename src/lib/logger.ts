const isDevelopment = import.meta.env.DEV;

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (isDevelopment) {
      switch (level) {
        case 'info':
          console.log(logMessage, ...args);
          break;
        case 'warn':
          console.warn(logMessage, ...args);
          break;
        case 'error':
          console.error(logMessage, ...args);
          break;
      }
    } else {
      // In production, we could send logs to a service or store them
      // For now, we'll only log errors
      if (level === 'error') {
        console.error(logMessage, ...args);
      }
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }
}

export default new Logger();
