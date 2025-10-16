import winston from "winston";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

// Define different log formats
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  // Add colors
  winston.format.colorize({ all: true }),
  // Define format of the message showing the timestamp, the level and the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use to print out messages
const transports = [
  // Console transport
  new winston.transports.Console(),
  // Error log file
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  // All logs file
  new winston.transports.File({ filename: "logs/all.log" }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});
export default logger;
