import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { BrowseCouponsItemResponse } from '../../types/api.types';

/**
 * Coupon table row component
 */
function CouponRow({ coupon, getCouponStatus }: { 
  coupon: BrowseCouponsItemResponse; 
  getCouponStatus: (coupon: BrowseCouponsItemResponse) => string;
}) {
  return (
    <tr>
      <td>{coupon.code}</td>
      <td>{(coupon.discountRate * 100).toFixed(2)}%</td>
      <td>
        {coupon.validFrom 
          ? new Date(coupon.validFrom).toLocaleString() 
          : 'Immediate'}
      </td>
      <td>
        {coupon.validTo 
          ? new Date(coupon.validTo).toLocaleString() 
          : 'Never'}
      </td>
      <td>
        {coupon.usageLimit === null || coupon.usageLimit === 2147483647
          ? 'Unlimited'
          : coupon.usageLimit}
      </td>
      <td>{coupon.usedCount}</td>
      <td>{getCouponStatus(coupon)}</td>
    </tr>
  );
}

interface CouponTableProps {
  coupons: BrowseCouponsItemResponse[];
  isLoading: boolean;
  getCouponStatus: (coupon: BrowseCouponsItemResponse) => string;
  onRefresh: () => void;
}

/**
 * Table component for displaying existing coupons
 * Shows coupon details with loading and empty states
 */
export function CouponTable({ coupons, isLoading, getCouponStatus, onRefresh }: CouponTableProps) {
  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={7} className="text-center">
            <LoadingSpinner message="Loading coupons..." />
          </td>
        </tr>
      );
    }

    if (coupons.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="text-center">
            No coupons found
          </td>
        </tr>
      );
    }

    return coupons.map((coupon) => (
      <CouponRow key={coupon.code} coupon={coupon} getCouponStatus={getCouponStatus} />
    ));
  };

  return (
    <div className="card shadow">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Existing Coupons</h4>
        <button className="btn btn-light btn-sm" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover" aria-label="Coupons Table">
            <thead className="table-dark">
              <tr>
                <th>Code</th>
                <th>Discount Rate</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th>Usage Limit</th>
                <th>Used Count</th>
                <th>Status</th>
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
