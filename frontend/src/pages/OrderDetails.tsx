import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, LoadingSpinner, ErrorMessage } from '../components';
import { OrderDetailView, OrderActions } from '../features/orders';
import { useOrderDetails } from '../hooks';
import { useNotificationContext } from '../contexts/NotificationContext';

/**
 * Order Details page component for viewing individual order information
 * Allows users to view detailed order information and cancel orders if status is PLACED
 */
export function OrderDetails() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error, isCancelling, cancelOrder } = useOrderDetails(orderNumber);
  const { setSuccess, handleResult } = useNotificationContext();

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
              <OrderDetailView order={order} />
              <OrderActions 
                status={order.status}
                isCancelling={isCancelling}
                onCancel={handleCancel}
                onBack={() => navigate('/order-history')}
              />
            </>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
