import { useState, FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { Notification } from '../components/Notification';
import { orderService } from '../services/order-service';
import type { OrderFormData } from '../types/form.types';

export function Shop() {
  const [formData, setFormData] = useState<OrderFormData>({
    sku: '',
    quantity: 0,
    country: 'US',
    quantityValue: '',
    couponCode: undefined
  });
  const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFormData = (data: OrderFormData): string | null => {
    const errors: string[] = [];
    const quantityTrimmed = data.quantityValue.trim();

    if (!data.sku) {
      errors.push('sku: SKU must not be empty');
    }

    if (quantityTrimmed === '') {
      errors.push('quantity: Quantity must not be empty');
    } else {
      const quantityNum = parseFloat(quantityTrimmed);

      if (isNaN(quantityNum)) {
        errors.push('quantity: Quantity must be an integer');
      } else if (!Number.isInteger(quantityNum)) {
        errors.push('quantity: Quantity must be an integer');
      } else if (quantityNum <= 0) {
        errors.push('quantity: Quantity must be positive');
      }
    }

    if (!data.country) {
      errors.push('country: Country must not be empty');
    }

    if (errors.length > 0) {
      return 'The request contains one or more validation errors\n' + errors.join('\n');
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const validationError = validateFormData(formData);
    if (validationError) {
      setNotification({ message: validationError, isError: true });
      return;
    }

    setIsSubmitting(true);
    const result = await orderService.placeOrder(
      formData.sku,
      formData.quantity,
      formData.country,
      formData.couponCode
    );
    setIsSubmitting(false);

    if (result.success) {
      setNotification({
        message: `Success! Order has been created with Order Number ${result.data.orderNumber}`,
        isError: false
      });
      // Reset form
      setFormData({
        sku: '',
        quantity: 0,
        country: 'US',
        quantityValue: '',
        couponCode: undefined
      });
    } else {
      const errorMessage = result.error.message + 
        (result.error.fieldErrors ? '\n' + result.error.fieldErrors.join('\n') : '');
      setNotification({ message: errorMessage, isError: true });
    }
  };

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
                <div className="mb-3">
                  <label htmlFor="sku" className="form-label">SKU:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="sku"
                    aria-label="SKU"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Enter product SKU"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="quantity" className="form-label">Quantity:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="quantity"
                    aria-label="Quantity"
                    value={formData.quantityValue}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      quantityValue: e.target.value,
                      quantity: parseInt(e.target.value) || 0
                    })}
                    inputMode="numeric"
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="country" className="form-label">Country:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="country"
                    aria-label="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Enter country code"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="couponCode" className="form-label">Coupon Code (Optional):</label>
                  <input
                    type="text"
                    className="form-control"
                    id="couponCode"
                    aria-label="Coupon Code"
                    value={formData.couponCode || ''}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value || undefined })}
                    placeholder="Enter coupon code if available"
                  />
                </div>
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

          {notification && (
            <div className="mt-3">
              <Notification
                message={notification.message}
                isError={notification.isError}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
