import { useState, FormEvent, useCallback } from 'react';
import { Layout, Notification, LoadingSpinner } from '../components';
import { useCoupons, useNotification } from '../hooks';
import type { BrowseCouponsItemResponse } from '../types/api.types';

/**
 * Coupon table row component
 */
function CouponRow({ coupon, getCouponStatus }: { coupon: BrowseCouponsItemResponse; getCouponStatus: (coupon: BrowseCouponsItemResponse) => string }) {
  return (
    <tr key={coupon.code}>
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

/**
 * Admin Coupons page component for managing promotional coupons
 * Allows administrators to create and view coupons with discount rates, validity periods, and usage limits
 */
export function AdminCoupons() {
  const {
    coupons,
    isLoading,
    isCreating,
    submitCoupon,
    generateCouponCode,
    getCouponStatus,
    refresh
  } = useCoupons();

  const { successMessage, error, setSuccess, handleResult } = useNotification();
  const [formData, setFormData] = useState({
    code: generateCouponCode(),
    discountRate: 0.2,
    validFrom: '',
    validTo: '',
    usageLimit: ''
  });

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    const createdCode = formData.code;
    
    handleResult(await submitCoupon(formData), () => {
      setSuccess(`Coupon '${createdCode}' created successfully!`);
      setFormData({
        code: generateCouponCode(),
        discountRate: 0.2,
        validFrom: '',
        validTo: '',
        usageLimit: ''
      });
    });
  }, [submitCoupon, generateCouponCode, setSuccess, handleResult, formData.code]);

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
    <Layout
      title="Coupon Management"
      breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Coupon Management' }]}
    >
      <div className="card shadow mb-4">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">🎟️ Create New Coupon</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="code" className="form-label">Coupon Code:</label>
                <input
                  type="text"
                  className="form-control"
                  id="code"
                  aria-label="Coupon Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., SUMMER2026"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="discountRate" className="form-label">Discount Rate (0-1):</label>
                <input
                  type="number"
                  className="form-control"
                  id="discountRate"
                  aria-label="Discount Rate"
                  value={formData.discountRate}
                  onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) })}
                  step="0.01"
                  placeholder="e.g., 0.2 for 20% off"
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="validFrom" className="form-label">Valid From (Optional):</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  id="validFrom"
                  aria-label="Valid From"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
                <small className="form-text text-muted">Leave empty for immediate validity</small>
              </div>
              <div className="col-md-6">
                <label htmlFor="validTo" className="form-label">Valid To (Optional):</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  id="validTo"
                  aria-label="Valid To"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                />
                <small className="form-text text-muted">Leave empty for no expiration</small>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="usageLimit" className="form-label">Usage Limit (Optional):</label>
                <input
                  type="number"
                  className="form-control"
                  id="usageLimit"
                  aria-label="Usage Limit"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  aria-label="Create Coupon"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : '✨ Create Coupon'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Notification successMessage={successMessage} error={error} />

      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Existing Coupons</h4>
          <button className="btn btn-light btn-sm" onClick={refresh}>
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
    </Layout>
  );
}
