import { ApiError } from '../api';

/** User-facing message for failed API/network calls. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof TypeError) {
    return `${fallback} Check that the backend is running.`;
  }
  return fallback;
}

export function isNotFoundError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export function getFieldErrorMessages(err: unknown): string[] {
  if (err instanceof ApiError) {
    return err.errors.map((item) => item.message);
  }
  return [];
}
