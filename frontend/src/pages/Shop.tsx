import { FormEvent, useCallback } from 'react';
import { Layout, FormInput } from '../components';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useOrderForm } from '../hooks';

/**
 * Shop page component for placing orders
 * Provides a form interface for customers to submit orders with SKU, quantity, country, and optional coupon
 */
export function Shop() {
  const { setSuccess, handleResult } = useNotificationContext();
  const {
    formData,
    updateFormData,
    isSubmitting,
    submitOrder
  } = useOrderForm();

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    handleResult(await submitOrder(), (data) => {
      setSuccess(`Success! Order has been created with Order Number ${data.orderNumber}`);
    });
  }, [submitOrder, handleResult, setSuccess]);

  return (
    <Layout title="Shop" breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Shop' }]}>
      <div className="row">
        <div className="col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Place Your Order</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <FormInput
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => updateFormData({ sku: e.target.value })}
                  placeholder="Enter product SKU"
                  ariaLabel="SKU"
                />
                <FormInput
                  label="Quantity"
                  value={formData.quantityValue}
                  onChange={(e) => updateFormData({ 
                    quantityValue: e.target.value,
                    quantity: parseInt(e.target.value) || 0
                  })}
                  inputMode="numeric"
                  placeholder="Enter quantity"
                  ariaLabel="Quantity"
                />
                <FormInput
                  label="Country"
                  value={formData.country}
                  onChange={(e) => updateFormData({ country: e.target.value })}
                  placeholder="Enter country code"
                  ariaLabel="Country"
                />
                <FormInput
                  label="Coupon Code (Optional)"
                  value={formData.couponCode || ''}
                  onChange={(e) => updateFormData({ couponCode: e.target.value || undefined })}
                  placeholder="Enter coupon code if available"
                  ariaLabel="Coupon Code"
                />
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    aria-label="Place Order"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
