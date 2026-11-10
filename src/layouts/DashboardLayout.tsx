import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MENU_ITEMS } from "../constants/menu.config";
import ChangePasswordModal from "../components/ChangePasswordModal";
import {
  LogOut,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
  KeyRound,
} from "lucide-react";

const SIDEBAR_KEY = "sidebar-open";

// Nilai awal: pakai pilihan tersimpan; kalau belum ada, terbuka di layar
// lebar dan tertutup di layar kecil. localStorage bisa gagal (mode privat),
// jadi dibungkus try/catch.
const getInitialSidebarOpen = (): boolean => {
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved !== null) return saved === "true";
  } catch {
    // abaikan, pakai default
  }
  return window.innerWidth >= 768;
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    getInitialSidebarOpen,
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        // abaikan
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Daftar menu navigasi
  const filteredMenus = MENU_ITEMS.filter(
    (item) =>
      user?.role &&
      item.allowedRoles.includes(
        user.role as (typeof item.allowedRoles)[number],
      ),
  );

  return (
    <div className="flex h-screen bg-slate-100">
      {/* --- SIDEBAR (KIRI) --- */}
      <aside
        aria-hidden={!sidebarOpen}
        className={`shrink-0 overflow-hidden bg-slate-900 text-slate-300 transition-[width,visibility] duration-300 ${
          sidebarOpen ? "w-64 visible" : "w-0 invisible"
        }`}
      >
        {/* Lebar tetap w-64 agar isi tidak "terjepit" saat animasi */}
        <div className="flex h-full w-64 flex-col justify-between">
          <div>
            {/* Header Sidebar */}
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white tracking-wide">
                Social Media Automation
              </h2>
            </div>

            {/* Menu Navigasi */}
            <nav className="p-4 space-y-1">
              {filteredMenus.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer Sidebar (Tombol Logout) */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* --- AREA KONTEN UTAMA (KANAN) --- */}
      <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
        {/* Header Atas */}
        <header className="bg-white border-b border-slate-200 px-4 py-4 sm:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </button>

            {/* Judul muncul di sini hanya saat sidebar disembunyikan */}
            {!sidebarOpen && (
              <h2 className="hidden truncate text-xl font-bold tracking-wide text-slate-800 sm:block">
                Social Media Automation
              </h2>
            )}
          </div>

          {/* Info Profile & Badge Role */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-full">
              <UserIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">
                {user?.email}
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-2">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                  {user?.role}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  title="Change password"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <KeyRound className="h-3 w-3" />
                  <span className="hidden sm:inline">Change password</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Area Isi Halaman Dinamis */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
