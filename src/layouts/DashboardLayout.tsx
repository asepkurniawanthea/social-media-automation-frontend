import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MENU_ITEMS } from "../constants/menu.config";
import { LogOut, User as UserIcon } from "lucide-react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between">
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
      </aside>

      {/* --- AREA KONTEN UTAMA (KANAN) --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Atas */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-slate-800"></h1>

          {/* Info Profile & Badge Role */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-full">
              <UserIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">
                {user?.email}
              </p>
              <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Area Isi Halaman Dinamis */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
