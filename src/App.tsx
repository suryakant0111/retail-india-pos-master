
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";
import Invoices from "./pages/Invoices";
import AdminPage from "./pages/Admin";
import ShopPage from "./pages/Shop";
import SignupPage from "./pages/Signup";
import GSTFiling from "./pages/GSTFiling";
import MobileScanner from "./pages/MobileScanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/mobile-scanner" element={<MobileScanner />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Cashier routes */}
              <Route element={<AuthGuard />}>
                <Route path="/pos" element={<POS />} />
                <Route path="/products" element={<Products />} />
                <Route path="/customers" element={<Customers />} />
              </Route>
              
              {/* Manager routes */}
              <Route element={<AuthGuard requireManager={true} />}>
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/invoices" element={<Invoices />} />
              </Route>
              
              {/* Admin routes */}
              <Route element={<AuthGuard requireAdmin={true} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/gst-filing" element={<GSTFiling />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
