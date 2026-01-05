import { FormEvent, useCallback } from 'react';
import { Layout, Notification, FormInput } from '../components';
import { useOrderForm } from '../hooks';

/**
 * Shop page component for placing orders
 * Provides a form interface for customers to submit orders with SKU, quantity, country, and optional coupon
 */
export function Shop() {
  const {
    formData,
    updateFormData,
    isSubmitting,
    error,
    success,
    submitOrder
  } = useOrderForm();

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    await submitOrder();
  }, [submitOrder]);

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
                />
                <FormInput
                  label="Country"
                  value={formData.country}
                  onChange={(e) => updateFormData({ country: e.target.value })}
                  placeholder="Enter country code"
                />
                <FormInput
                  label="Coupon Code (Optional)"
                  value={formData.couponCode || ''}
                  onChange={(e) => updateFormData({ couponCode: e.target.value || undefined })}
                  placeholder="Enter coupon code if available"
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

          <Notification
            successMessage={success ? `Success! Order has been created with Order Number ${success.orderNumber}` : null}
            error={error}
          />
        </div>
      </div>
    </Layout>
  );
}
