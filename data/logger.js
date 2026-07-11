const winston = require('winston');
const { join } = require('path');
const { existsSync, mkdirSync } = require('fs');

const logDir = join(__dirname, '..', 'logs');
if (!existsSync(logDir)) mkdirSync(logDir);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new winston.transports.File({ filename: join(logDir, 'bot.log'), maxsize: 5242880, maxFiles: 3 }),
  ],
});

module.exports = logger;
