import { getLogFilePath } from "../utilities/getLogFilePath";
import * as dotenv from "dotenv";
dotenv.config();

const winston = require('winston');

const LOG_LEVEL = process.env.LOG_LEVEL || 'error';

export const dbLogger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.label({ label: 'DB_QUERY' }),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: getLogFilePath("db_queries"),
            level: LOG_LEVEL,
        }),
    ],
});

const LOGGER = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.json(),
    defaultMeta: { timestamp: new Date() },
    transports: [
        // Log errors to `error.log`
        new winston.transports.File({
            filename: getLogFilePath(LOG_LEVEL),
            level: LOG_LEVEL,
        }),
        // Log all general information to `combined.log`
        // new winston.transports.File({
        //     filename: getLogFilePath("info"),
        //     level: 'info',
        // }),
    ],
});

if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'development') {
    LOGGER.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.colorize(),
            winston.format.printf((info: { timestamp: any; level: any; message: any; }) => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
        level: LOG_LEVEL,
    }));
}

export default LOGGER;
