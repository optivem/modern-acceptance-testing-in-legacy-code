import type { ApiError } from '../types/error.types';

interface NotificationProps {
  successMessage?: string | null;
  error?: ApiError | null;
}

/**
 * Notification component for displaying success or error messages
 * @param successMessage - Success message string to display
 * @param error - ApiError object with message and optional field-level errors
 */
export function Notification({ successMessage, error }: NotificationProps) {
  // Handle error messages
  if (error) {
    return (
      <div className="notification error" role="alert">
        <div className="error-message">{error.message}</div>
        {error.fieldErrors && error.fieldErrors.map((fieldError, index) => (
          <div key={index} className="field-error">{fieldError}</div>
        ))}
      </div>
    );
  }

  // Handle success messages
  if (successMessage) {
    return (
      <div className="notification success" role="alert">
        {successMessage}
      </div>
    );
  }

  return null;
}
