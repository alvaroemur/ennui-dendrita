/**
 * Manejador de errores para integraciones
 */

export class IntegrationError extends Error {
  constructor(
    public service: string,
    public action: string,
    message: string,
    public originalError?: unknown
  ) {
    super(`[${service}] ${action} - ${message}`);
    this.name = 'IntegrationError';
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(service: string, message: string, originalError?: unknown) {
    super(service, 'Authentication', message, originalError);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends IntegrationError {
  constructor(service: string, retryAfter?: number) {
    super(service, 'RateLimit', `Rate limit exceeded. Retry after ${retryAfter}s`, undefined);
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }

  retryAfter?: number;
}

export function handleApiError(
  service: string,
  action: string,
  error: unknown
): never {
  if (error instanceof IntegrationError) {
    throw error;
  }

  if (error instanceof Error) {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      throw new AuthenticationError(service, 'Invalid or expired credentials', error);
    }

    if (error.message.includes('429') || error.message.includes('Rate limit')) {
      throw new RateLimitError(service);
    }

    throw new IntegrationError(service, action, error.message, error);
  }

  throw new IntegrationError(service, action, String(error), error);
}

export function logSafeError(error: IntegrationError): void {
  // Nunca loguea credenciales o información sensible
  console.error(`❌ Error: ${error.message}`);
  if (error instanceof AuthenticationError) {
    console.error('   Verifica que las credenciales estén correctamente configuradas.');
  }
}
