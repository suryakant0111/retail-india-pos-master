
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
import NotFound from "./pages/NotFound";

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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Protected routes */}
              <Route element={<AuthGuard />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/products" element={<Products />} />
                
                {/* Add other protected routes here */}
                <Route path="/customers" element={<div className="p-6"><h1 className="text-3xl font-bold">Customers (Coming Soon)</h1></div>} />
                <Route path="/invoices" element={<div className="p-6"><h1 className="text-3xl font-bold">Invoices (Coming Soon)</h1></div>} />
                <Route path="/transactions" element={<div className="p-6"><h1 className="text-3xl font-bold">Transactions (Coming Soon)</h1></div>} />
              </Route>
              
              {/* Admin routes */}
              <Route element={<AuthGuard requireAdmin={true} />}>
                <Route path="/inventory" element={<div className="p-6"><h1 className="text-3xl font-bold">Inventory (Admin Only)</h1></div>} />
                <Route path="/settings" element={<div className="p-6"><h1 className="text-3xl font-bold">Settings (Admin Only)</h1></div>} />
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
