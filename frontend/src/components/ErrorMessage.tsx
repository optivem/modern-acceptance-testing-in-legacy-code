interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <div>
        <strong>Error:</strong> {message}
      </div>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
