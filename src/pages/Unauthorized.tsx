import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="h-16 w-16 text-red-500" />
      <h1 className="text-2xl font-semibold">Akses Ditolak</h1>
      <p className="max-w-md text-muted-foreground">
        {user
          ? `Akun kamu (${user.email}) dengan role ${user.role} tidak memiliki izin untuk mengakses halaman ini.`
          : "Kamu tidak memiliki izin untuk mengakses halaman ini."}
      </p>

      <div className="flex gap-3">
        <Link
          to="/dashboard"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Kembali ke Dashboard
        </Link>
        <button
          onClick={logout}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
