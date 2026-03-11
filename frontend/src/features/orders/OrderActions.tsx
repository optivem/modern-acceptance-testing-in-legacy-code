import { OrderStatus } from '../../types/api.types';

export interface OrderActionsProps {
  status: OrderStatus;
  isCancelling: boolean;
  onCancel: () => void;
  isDelivering: boolean;
  onDeliver: () => void;
  onBack: () => void;
}

/**
 * Order actions component for order management buttons
 * Conditionally displays cancel/deliver buttons based on order status
 */
export function OrderActions({ status, isCancelling, onCancel, isDelivering, onDeliver, onBack }: OrderActionsProps) {
  return (
    <div className="mt-4">
      {status === OrderStatus.PLACED && (
        <>
          <button
            className="btn btn-danger me-2"
            aria-label="Cancel Order"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
          <button
            className="btn btn-warning me-2"
            aria-label="Deliver Order"
            onClick={onDeliver}
            disabled={isDelivering}
          >
            {isDelivering ? 'Delivering...' : 'Deliver Order'}
          </button>
        </>
      )}
      <button
        className="btn btn-secondary"
        onClick={onBack}
      >
        Back to Order History
      </button>
    </div>
  );
}
