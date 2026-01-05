import { Link } from 'react-router-dom';
import { LoadingSpinner, ErrorMessage } from '../../components';
import type { BrowseOrderHistoryItemResponse } from '../../types/api.types';

export interface OrderHistoryTableProps {
  orders: BrowseOrderHistoryItemResponse[];
  filter: string;
  onFilterChange: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/**
 * Order table row component
 */
function OrderRow({ order }: { order: BrowseOrderHistoryItemResponse }) {
  return (
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
  );
}

/**
 * Order history table component for browsing past orders
 * Includes filter input, refresh button, and order listing table
 */
export function OrderHistoryTable({ 
  orders, 
  filter, 
  onFilterChange, 
  isLoading, 
  error, 
  onRefresh 
}: OrderHistoryTableProps) {
  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={9}>
            <LoadingSpinner message="Loading orders..." />
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={9}>
            <ErrorMessage message={error} onRetry={onRefresh} />
          </td>
        </tr>
      );
    }

    if (orders.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="text-center">
            No orders found
          </td>
        </tr>
      );
    }

    return orders.map((order) => <OrderRow key={order.orderNumber} order={order} />);
  };

  return (
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
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Enter order number..."
            />
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button
              className="btn btn-primary w-100"
              aria-label="Search"
              onClick={onRefresh}
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
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
