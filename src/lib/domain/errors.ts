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

/** Plan limit hit (seat cap, add-on required). */
export class PaymentRequiredError extends AtlasError {
  constructor(message = "Your plan does not include this.") {
    super(message, 402, "PAYMENT_REQUIRED");
  }
}

/**
 * The caller is authenticated but must prove it is still them (password or MFA)
 * before a privileged action runs. Distinct code so clients can open a re-auth prompt.
 */
export class ReauthRequiredError extends AtlasError {
  constructor(message = "Confirm your password to continue.") {
    super(message, 403, "REAUTH_REQUIRED");
  }
}

export class PersistenceError extends AtlasError {
  constructor(message = "Database write failed.") {
    super(message, 503, "PERSISTENCE");
  }
}

/** A third-party provider (Stripe, Twilio, calendar, LLM) failed. */
export class IntegrationError extends AtlasError {
  constructor(message = "Integration request failed.") {
    super(message, 502, "INTEGRATION");
  }
}

/** Wrap a provider failure so routes never leak an opaque 500. */
export function asIntegrationError(error: unknown, fallback = "Integration request failed.") {
  if (isAtlasError(error)) return error;
  return new IntegrationError(error instanceof Error ? error.message : fallback);
}

export function isAtlasError(error: unknown): error is AtlasError {
  return error instanceof AtlasError;
}
