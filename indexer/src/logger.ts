import winston from 'winston';
import { LOG_LEVEL, NODE_ENV } from './config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} ${level} ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: NODE_ENV === 'development' ? consoleFormat : logFormat,
  defaultMeta: { service: 'proofpay-indexer' },
  transports: [
    new winston.transports.Console(),
    // Add file transports for production
    ...(NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ] : [])
  ],
});

// Helper methods for structured logging
export const createLogger = (module: string) => {
  return {
    debug: (message: string, meta?: any) => logger.debug(message, { module, ...meta }),
    info: (message: string, meta?: any) => logger.info(message, { module, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { module, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { module, ...meta }),
    
    // Specialized logging methods
    logEvent: (eventType: string, taskId: string, txHash: string, meta?: any) => {
      logger.info(`Event processed: ${eventType}`, {
        module,
        eventType,
        taskId,
        txHash,
        ...meta
      });
    },
    
    logCronJob: (action: string, count: number, meta?: any) => {
      logger.info(`Cron job: ${action}`, {
        module,
        action,
        count,
        ...meta
      });
    },
    
    logWebSocket: (action: string, meta?: any) => {
      logger.info(`WebSocket: ${action}`, {
        module,
        action,
        ...meta
      });
    }
  };
};

export default logger;