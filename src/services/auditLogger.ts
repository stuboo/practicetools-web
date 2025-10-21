// Simple logging service for audit trail diagnostics
const LOGGING_ENDPOINT = 'https://tools.ryanstewart.com/logaudit.php';

type EventType = 'create_attempt' | 'create_success' | 'create_failure' | 'lookup_attempt' | 'lookup_success' | 'lookup_failure';

interface LogParams {
  eventType: EventType;
  auditKey?: string;
  error?: string;
  recommendation?: string;
  httpStatus?: number;
  pathSteps?: number;
}

export class AuditLogger {
  static async log(params: LogParams): Promise<void> {
    try {
      const queryParams = new URLSearchParams({
        eventType: params.eventType,
        timestamp: new Date().toISOString(),
        ...(params.auditKey && { auditKey: params.auditKey }),
        ...(params.error && { error: params.error }),
        ...(params.recommendation && { recommendation: params.recommendation }),
        ...(params.httpStatus && { httpStatus: params.httpStatus.toString() }),
        ...(params.pathSteps && { pathSteps: params.pathSteps.toString() }),
      });

      // Fire and forget - don't wait for response, don't block on errors
      fetch(`${LOGGING_ENDPOINT}?${queryParams.toString()}`, {
        method: 'GET',
        mode: 'no-cors', // Avoid CORS preflight
      }).catch(() => {
        // Silently ignore logging errors - never block user workflow
      });
    } catch (error) {
      // Silently ignore any logging errors
    }
  }
}
