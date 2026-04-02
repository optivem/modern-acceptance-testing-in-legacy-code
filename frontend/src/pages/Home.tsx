import { Layout, FeatureCard } from '../components';

/**
 * Home page component displaying the main landing page
 * Provides navigation to key features: New Order, Order History, and Coupon Management
 */
export function Home() {
  return (
    <Layout>
      <div className="jumbotron bg-light p-5 rounded">
        <h1 className="display-4">Welcome to Optivem eShop!</h1>
        <p className="lead">Your modern e-commerce solution</p>
        <hr className="my-4" />
        <div className="row mt-4">
          <FeatureCard
            icon="📦"
            title="New Order"
            description="Place a new order with our easy-to-use interface"
            linkTo="/new-order"
            linkText="New Order"
          />
          <FeatureCard
            icon="📋"
            title="Order History"
            description="View and manage your past orders"
            linkTo="/order-history"
            linkText="View Orders"
          />
          <FeatureCard
            icon="🎟️"
            title="Coupon Management"
            description="Admin panel for managing discount coupons"
            linkTo="/admin-coupons"
            linkText="Manage Coupons"
          />
        </div>
      </div>
    </Layout>
  );
}
