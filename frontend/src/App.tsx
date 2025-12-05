import { Route, Routes, Navigate } from "react-router-dom";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<DocsPage />} path="/docs" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<AboutPage />} path="/about" />
      
      {/* Authentication Routes */}
      <Route 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        path="/login" 
      />
      <Route 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
        path="/register" 
      />
      
      {/* Protected Routes */}
      <Route 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
        path="/dashboard" 
      />
    </Routes>
  );
}

export default App;
