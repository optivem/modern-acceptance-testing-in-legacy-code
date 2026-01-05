import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, Shop, OrderHistory, OrderDetails, AdminCoupons } from './pages';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/order-details/:orderNumber" element={<OrderDetails />} />
        <Route path="/admin-coupons" element={<AdminCoupons />} />
      </Routes>
    </BrowserRouter>
  );
}
