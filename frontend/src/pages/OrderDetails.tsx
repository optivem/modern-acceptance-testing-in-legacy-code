import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Notification, LoadingSpinner, ErrorMessage } from '../components';
import { useOrderDetails, useNotification } from '../hooks';

/**
 * Order Details page component for viewing individual order information
 * Allows users to view detailed order information and cancel orders if status is PLACED
 */
export function OrderDetails() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error, isCancelling, cancelOrder } = useOrderDetails(orderNumber);
  const { successMessage, error: cancelError, setSuccess, handleResult } = useNotification();

  const handleCancel = useCallback(async () => {
    handleResult(await cancelOrder(), () => {
      setSuccess('Order cancelled successfully!');
    });
  }, [cancelOrder, setSuccess, handleResult]);

  return (
    <Layout
      title="Order Details"
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Order History', path: '/order-history' },
        { label: 'Order Details' }
      ]}
    >
      {(successMessage || cancelError) && (
        <Notification
          successMessage={successMessage}
          error={cancelError}
        />
      )}

      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Order Details</h4>
        </div>
        <div className="card-body">
          {isLoading ? (
            <LoadingSpinner message="Loading order details..." />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : order ? (
            <>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <strong>Order Number:</strong>
                  <p aria-label="Display Order Number">{order.orderNumber}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Order Timestamp:</strong>
                  <p>{new Date(order.orderTimestamp).toLocaleString()}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Status:</strong>
                  <p className={`status-${order.status}`} aria-label="Display Status">{order.status}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>SKU:</strong>
                  <p aria-label="Display SKU">{order.sku}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Country:</strong>
                  <p aria-label="Display Country">{order.country}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Quantity:</strong>
                  <p aria-label="Display Quantity">{order.quantity}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Unit Price:</strong>
                  <p aria-label="Display Unit Price">${order.unitPrice.toFixed(2)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Base Price:</strong>
                  <p aria-label="Display Base Price">${order.basePrice.toFixed(2)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Discount Rate:</strong>
                  <p aria-label="Display Discount Rate">{(order.discountRate * 100).toFixed(2)}%</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Discount Amount:</strong>
                  <p aria-label="Display Discount Amount">${order.discountAmount.toFixed(2)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Subtotal Price:</strong>
                  <p aria-label="Display Subtotal Price">${order.subtotalPrice.toFixed(2)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Tax Rate:</strong>
                  <p aria-label="Display Tax Rate">{(order.taxRate * 100).toFixed(2)}%</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Tax Amount:</strong>
                  <p aria-label="Display Tax Amount">${order.taxAmount.toFixed(2)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Total Price:</strong>
                  <p className="fs-5 fw-bold" aria-label="Display Total Price">${order.totalPrice.toFixed(2)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Applied Coupon:</strong>
                  <p aria-label="Display Applied Coupon">{order.appliedCouponCode || 'None'}</p>
                </div>
              </div>

              <div className="mt-4">
                {order.status === 'PLACED' && (
                  <button 
                    className="btn btn-danger me-2"
                    aria-label="Cancel Order"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/order-history')}
                >
                  Back to Order History
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        .status-PLACED {
          color: #198754;
        }
        .status-CANCELLED {
          color: #dc3545;
        }
      `}</style>
    </Layout>
  );
}
