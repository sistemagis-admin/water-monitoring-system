import { ERROR_CODES } from '../../config/constants.js';

export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code: ErrorCode = 'VALIDATION_ERROR', details?: unknown) {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(message = 'Unauthorized access', code: ErrorCode = 'AUTH_UNAUTHORIZED') {
    return new AppError(code, message, 401);
  }

  static forbidden(message = 'Forbidden action', code: ErrorCode = 'AUTH_FORBIDDEN') {
    return new AppError(code, message, 403);
  }

  static notFound(message = 'Resource not found', code: ErrorCode = 'RESOURCE_NOT_FOUND') {
    return new AppError(code, message, 404);
  }

  static conflict(message: string, code: ErrorCode = 'DUPLICATE_RESOURCE') {
    return new AppError(code, message, 409);
  }

  static internal(message = 'Internal server error', code: ErrorCode = 'INTERNAL_ERROR') {
    return new AppError(code, message, 500);
  }
}
