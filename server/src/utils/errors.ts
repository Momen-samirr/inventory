export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(401, message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(403, message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = "ConflictError";
  }
}

