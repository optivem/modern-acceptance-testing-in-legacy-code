import { Layout, Notification, CouponForm, CouponTable } from '../components';
import { useCoupons, useNotification } from '../hooks';

/**
 * Admin Coupons page component for managing promotional coupons
 * Orchestrates coupon creation form and coupon listing table
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

  const handleCouponSubmit = async (formData: any) => {
    const createdCode = formData.code;
    
    handleResult(await submitCoupon(formData), () => {
      setSuccess(`Coupon '${createdCode}' created successfully!`);
    });
  };

  return (
    <Layout
      title="Coupon Management"
      breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Coupon Management' }]}
    >
      <CouponForm 
        onSubmit={handleCouponSubmit}
        isSubmitting={isCreating}
        generateCouponCode={generateCouponCode}
      />

      <Notification successMessage={successMessage} error={error} />

      <CouponTable 
        coupons={coupons}
        isLoading={isLoading}
        getCouponStatus={getCouponStatus}
        onRefresh={refresh}
      />
    </Layout>
  );
}
