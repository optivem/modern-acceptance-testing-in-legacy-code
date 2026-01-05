import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Notification, LoadingSpinner, ErrorMessage, DetailField } from '../components';
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
      <Notification successMessage={successMessage} error={cancelError} />

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
                <DetailField label="Order Number" value={order.orderNumber} ariaLabel="Display Order Number" />
                <DetailField label="Order Timestamp" value={new Date(order.orderTimestamp).toLocaleString()} />
                <DetailField 
                  label="Status" 
                  value={order.status} 
                  valueClassName={`status-${order.status}`}
                  ariaLabel="Display Status" 
                />
                <DetailField label="SKU" value={order.sku} ariaLabel="Display SKU" />
                <DetailField label="Country" value={order.country} ariaLabel="Display Country" />
                <DetailField label="Quantity" value={order.quantity} ariaLabel="Display Quantity" />
                <DetailField label="Unit Price" value={`$${order.unitPrice.toFixed(2)}`} ariaLabel="Display Unit Price" />
                <DetailField label="Base Price" value={`$${order.basePrice.toFixed(2)}`} ariaLabel="Display Base Price" />
                <DetailField label="Discount Rate" value={`${(order.discountRate * 100).toFixed(2)}%`} ariaLabel="Display Discount Rate" />
                <DetailField label="Discount Amount" value={`$${order.discountAmount.toFixed(2)}`} ariaLabel="Display Discount Amount" />
                <DetailField label="Subtotal Price" value={`$${order.subtotalPrice.toFixed(2)}`} ariaLabel="Display Subtotal Price" />
                <DetailField label="Tax Rate" value={`${(order.taxRate * 100).toFixed(2)}%`} ariaLabel="Display Tax Rate" />
                <DetailField label="Tax Amount" value={`$${order.taxAmount.toFixed(2)}`} ariaLabel="Display Tax Amount" />
                <DetailField 
                  label="Total Price" 
                  value={`$${order.totalPrice.toFixed(2)}`} 
                  valueClassName="fs-5 fw-bold"
                  ariaLabel="Display Total Price" 
                />
                <DetailField label="Applied Coupon" value={order.appliedCouponCode || 'None'} ariaLabel="Display Applied Coupon" />
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
