import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { orderService } from '../services/order-service';
import type { BrowseOrderHistoryItemResponse } from '../types/api.types';

export function OrderHistory() {
  const [orders, setOrders] = useState<BrowseOrderHistoryItemResponse[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async (filterValue: string = '') => {
    setIsLoading(true);
    setError(null);
    
    const result = await orderService.browseOrderHistory(filterValue);
    
    if (result.success) {
      setOrders(result.data.orders);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders(filter);
  }, [filter]);

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
                onClick={() => loadOrders(filter)}
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
                    <td colSpan={9} className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading orders...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="text-center text-danger">
                      Failed to load orders: {error}
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
