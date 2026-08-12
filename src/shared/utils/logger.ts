/* eslint-disable no-console */
const isDev = __DEV__;

export const logger = {
  info:  (...args: unknown[]): void => { if (isDev) console.log('[INFO]',  ...args); },
  warn:  (...args: unknown[]): void => { if (isDev) console.warn('[WARN]',  ...args); },
  error: (...args: unknown[]): void => { console.error('[ERROR]', ...args); },
  debug: (...args: unknown[]): void => { if (isDev) console.log('[DEBUG]', ...args); },
};
