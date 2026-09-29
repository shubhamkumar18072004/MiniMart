import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { CartProvider } from "./CartContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import Vendor from "./pages/Vendor";
import Cart from "./pages/Cart";
import VerifyOTP from "./pages/VerifyOTP";

// ⭐ User Profile Page
import User from "./pages/User";
import ComplaintForm from "./pages/ComplaintForm";
import MyComplaints from "./pages/MyComplaints";

// ⭐ Vendor Auth Page
import VendorAuth from "./pages/VendorAuth";
import DeliveryLogin from "./pages/DeliveryLogin";
import DeliveryDashboard from "./pages/DeliveryDashboard";

// 🆕 Category Page
import CategoryPage from "./pages/CategoryPage";

// --- 🔄 Scroll To Top Logic ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />

        <Routes>
          {/* ✅ HOME ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />

          {/* USER AUTH & PROFILE */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* ⭐ USER PROFILE SECTION  */}
          <Route path="/user" element={<User />} />
          <Route path="/complaint-form" element={<ComplaintForm />} />
          <Route path="/my-complaints" element={<MyComplaints />} />

          {/* ADMIN & VENDOR SECTION */}
          <Route path="/admin-auth" element={<AdminAuth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/vendor-auth" element={<VendorAuth />} />
          <Route path="/vendor" element={<Vendor />} />
          <Route path="/vendor-dashboard" element={<Vendor />} />

          <Route path="/delivery-login" element={<DeliveryLogin />} />
          <Route path="/delivery" element={<DeliveryDashboard />} />

          {/* SHOPPING SECTION */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />

          {/* SAFETY REDIRECTS -  /profile  /user  */}
          <Route path="/profile" element={<Navigate to="/user" replace />} />

          {/*  URL  Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
