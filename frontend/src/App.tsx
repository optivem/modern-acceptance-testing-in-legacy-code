import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components';
import { NotificationProvider } from './contexts/NotificationContext';
import { Home, Shop, OrderHistory, OrderDetails, AdminCoupons } from './pages';

/**
 * Main application component with routing configuration
 * Wrapped in ErrorBoundary for graceful error handling
 * NotificationProvider provides global notification state
 */
export function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/order-details/:orderNumber" element={<OrderDetails />} />
            <Route path="/admin-coupons" element={<AdminCoupons />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
