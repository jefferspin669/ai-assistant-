export class AtlasError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
  }
}

export class AuthenticationError extends AtlasError {
  constructor(message = "Authentication required.") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class AuthorizationError extends AtlasError {
  constructor(message = "You do not have access to this resource.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AtlasError {
  constructor(message = "Invalid request.") {
    super(message, 400, "VALIDATION");
  }
}

export class NotFoundError extends AtlasError {
  constructor(message = "Not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AtlasError {
  constructor(message = "Conflict.") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AtlasError {
  constructor(message = "Too many attempts. Try again later.") {
    super(message, 429, "RATE_LIMIT");
  }
}

export function isAtlasError(error: unknown): error is AtlasError {
  return error instanceof AtlasError;
}
