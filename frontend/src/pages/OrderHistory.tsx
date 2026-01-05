import { Link } from 'react-router-dom';
import { Layout, LoadingSpinner, ErrorMessage } from '../components';
import { useOrders } from '../hooks';

/**
 * Order History page component for browsing past orders
 * Provides filtering by order number and displays order details in a table
 */
export function OrderHistory() {
  const { orders, filter, setFilter, isLoading, error, refresh } = useOrders();

  return (
    <Layout 
      title="Order History" 
      breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Order History' }]}
    >
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Order History</h4>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-8">
              <label htmlFor="orderNumberFilter" className="form-label">
                Filter by Order Number:
              </label>
              <input
                type="text"
                className="form-control"
                id="orderNumberFilter"
                aria-label="Order Number"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Enter order number..."
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                aria-label="Search"
                onClick={refresh}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Order Number</th>
                  <th>Timestamp</th>
                  <th>SKU</th>
                  <th>Country</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Coupon</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9}>
                      <LoadingSpinner message="Loading orders..." />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9}>
                      <ErrorMessage message={error} onRetry={refresh} />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderNumber}>
                      <td>{order.orderNumber}</td>
                      <td>{new Date(order.orderTimestamp).toLocaleString()}</td>
                      <td>{order.sku}</td>
                      <td>{order.country}</td>
                      <td>{order.quantity}</td>
                      <td>${order.totalPrice.toFixed(2)}</td>
                      <td className={`status-${order.status}`}>{order.status}</td>
                      <td>{order.appliedCouponCode || 'None'}</td>
                      <td>
                        <Link to={`/order-details/${encodeURIComponent(order.orderNumber)}`}>
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
