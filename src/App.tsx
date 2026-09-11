// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Unauthorized from "./pages/Unauthorized";
import { MENU_ITEMS } from "./constants/menu.config";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rute Terbuka */}
          <Route path="/login" element={<Login />} />

          {/* Rute Terproteksi (Harus Login) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/unauthorized" element={<Unauthorized />} />
              {MENU_ITEMS.map(
                ({ href, component: Component, allowedRoles }) => (
                  <Route
                    key={href}
                    element={<ProtectedRoute allowedRoles={allowedRoles} />}
                  >
                    <Route path={href} element={<Component />} />
                  </Route>
                ),
              )}
            </Route>
          </Route>

          {/* Redirection untuk URL yang tidak dikenal */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
