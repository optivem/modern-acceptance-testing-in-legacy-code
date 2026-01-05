interface NotificationProps {
  message: string | null;
  isError?: boolean;
}

/**
 * Notification component for displaying success or error messages
 * Supports multi-line messages with field-level error formatting
 * @param message - Notification message (can be multi-line with \n separator)
 * @param isError - Whether this is an error (true) or success (false) notification
 */
export function Notification({ message, isError = false }: NotificationProps) {
  // Success notifications now stay visible until the next action

  if (!message) return null;

  // Split message by newlines for proper error formatting
  const lines = message.split('\n').filter(line => line.trim());

  return (
    <div
      className={`notification ${isError ? 'error' : 'success'}`}
      role="alert"
    >
      {lines.length > 1 ? (
        // Multiple lines - format as general message + field errors
        <>
          <div className="error-message">{lines[0]}</div>
          {lines.slice(1).map((line, index) => (
            <div key={index} className="field-error">{line}</div>
          ))}
        </>
      ) : (
        // Single line - display as-is
        message
      )}
    </div>
  );
}
