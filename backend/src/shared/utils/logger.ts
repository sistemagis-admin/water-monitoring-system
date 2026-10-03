export interface LogPayload {
  level?: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  event: string;
  message: string;
  request_id?: string;
  site_id?: string;
  device_id?: string;
  asset_id?: string;
  error_code?: string;
  [key: string]: unknown;
}

export const logger = {
  info(payload: LogPayload) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', ...payload }));
  },
  warn(payload: LogPayload) {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', ...payload }));
  },
  error(payload: LogPayload) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', ...payload }));
  },
  debug(payload: LogPayload) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ timestamp: new Date().toISOString(), level: 'debug', ...payload }));
    }
  },
};
