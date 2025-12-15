import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { getDashboardPath } from "./components/auth/ProtectedRoute";
import ToastContainer from "./components/ui/toast/ToastContainer";

// Dashboard Pages
import DashboardAdmin from "./pages/Dashboard/Admin/Index";
import DashboardSDM from "./pages/Dashboard/SDM/Index"; // Used as generic dashboard for regular users
import UserProfiles from "./pages/UserProfiles";
import OrgUnits from "./pages/OrgUnits";
import Users from "./pages/Users";

// Root redirect component - redirects to user's dashboard based on role
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Redirect to user's dashboard based on role
  return <Navigate to={getDashboardPath(user!.role)} replace />;
}

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <ToastContainer />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Root redirects to appropriate dashboard */}
            <Route index path="/" element={<RootRedirect />} />

            {/* Dashboard Routes - Role Protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <DashboardSDM />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org-units"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <OrgUnits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            {/* Profile Route - Accessible to all authenticated users */}
            <Route
              path="/profile"
              element={<UserProfiles />}
            />
          </Route>

          {/* Auth Layout - Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
