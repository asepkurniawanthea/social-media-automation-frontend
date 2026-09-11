import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../constants/menu.config";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuth();

  // 1. Jika belum login (tidak ada token)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Jika rute membutuhkan role spesifik dan user tidak memilikinya
  //    (termasuk kasus user null meski token ada), lempar ke dashboard utama
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Jika lolos semua pemeriksaan, tampilkan komponen anak (Outlet)
  return <Outlet />;
}
