/**
 * Structured Data Logger
 * Outputs logs in JSON format for easy parsing by Datadog, CloudWatch, Vercel, etc.
 * Zero dependencies.
 */

const os = require('os');
const hostname = os.hostname();
const env = process.env.NODE_ENV || 'development';

function formatLog(level, data, message) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    env,
    hostname,
  };

  if (typeof data === 'string') {
    payload.message = data;
  } else {
    Object.assign(payload, data);
    if (message) payload.message = message;
  }

  return JSON.stringify(payload);
}

module.exports = {
  info: (data, message) => console.log(formatLog('info', data, message)),
  warn: (data, message) => console.warn(formatLog('warn', data, message)),
  error: (data, message) => {
    // Extract error stack if passing an Error object
    if (data instanceof Error) {
      data = { error_message: data.message, stack: data.stack };
    } else if (data && data.error instanceof Error) {
      data.error_message = data.error.message;
      data.stack = data.error.stack;
      delete data.error;
    }
    console.error(formatLog('error', data, message));
  },
  debug: (data, message) => {
    if (env === 'development') {
      console.debug(formatLog('debug', data, message));
    }
  }
};
