import { useState, useEffect, FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { Notification } from '../components/Notification';
import { createCoupon, browseCoupons } from '../services/coupon-service';
import type { BrowseCouponsItemResponse } from '../types/api.types';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<BrowseCouponsItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);
  
  // Generate random coupon code on mount
  const generateCouponCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `SAVE${randomNum}`;
  };
  
  const [formData, setFormData] = useState({
    code: generateCouponCode(),
    discountRate: 0.2,
    validFrom: '',
    validTo: '',
    usageLimit: ''
  });

  const loadCoupons = async () => {
    setIsLoading(true);
    const result = await browseCoupons();
    
    if (result.success) {
      setCoupons(result.data.coupons);
    } else {
      setNotification({ message: 'Failed to load coupons', isError: true });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // Convert datetime-local to ISO 8601 string, or null if not provided
    const validFrom = formData.validFrom && formData.validFrom.trim() 
      ? new Date(formData.validFrom).toISOString() 
      : null;
    const validTo = formData.validTo && formData.validTo.trim() 
      ? new Date(formData.validTo).toISOString() 
      : null;

    const result = await createCoupon(
      formData.code,
      formData.discountRate,
      validFrom,
      validTo,
      formData.usageLimit ? parseInt(formData.usageLimit) : null
    );

    if (result.success) {
      const createdCode = formData.code; // Store before resetting form
      setNotification({ 
        message: `Coupon '${createdCode}' created successfully!`, 
        isError: false 
      });
      setFormData({
        code: generateCouponCode(),
        discountRate: 0.2,
        validFrom: '',
        validTo: '',
        usageLimit: ''
      });
      // Small delay to ensure backend transaction is committed before reloading
      setTimeout(async () => {
        await loadCoupons();
      }, 100);
    } else {
      const errorMessage = result.error.message + 
        (result.error.fieldErrors ? '\n' + result.error.fieldErrors.join('\n') : '');
      setNotification({ message: errorMessage, isError: true });
    }
  };

  const getCouponStatus = (coupon: BrowseCouponsItemResponse): string => {
    const now = new Date();
    const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
    const validTo = coupon.validTo ? new Date(coupon.validTo) : null;

    if (validFrom && now < validFrom) {
      return 'Not Yet Valid';
    } else if (validTo && now > validTo) {
      return 'Expired';
    } else if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return 'Limit Reached';
    }
    return 'Active';
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
                <button type="submit" className="btn btn-primary w-100" aria-label="Create Coupon">
                  ✨ Create Coupon
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          isError={notification.isError}
        />
      )}

      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Existing Coupons</h4>
          <button className="btn btn-light btn-sm" onClick={loadCoupons}>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading coupons...</p>
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
