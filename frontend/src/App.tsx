import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components';
import { Home, Shop, OrderHistory, OrderDetails, AdminCoupons } from './pages';

/**
 * Main application component with routing configuration
 * Wrapped in ErrorBoundary for graceful error handling
 */
export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/order-details/:orderNumber" element={<OrderDetails />} />
          <Route path="/admin-coupons" element={<AdminCoupons />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
