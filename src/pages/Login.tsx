import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Memanggil endpoint login
      const response = await api.post("/auth/login", { email, password });

      const token = response.data.data.access_token;
      const user = response.data.data.user;

      // Simpan ke Context & LocalStorage
      login(token, user);

      // Pindah ke halaman dashboard
      navigate("/dashboard");
    } catch (err: unknown) {
      // Menangkap pesan error dari HttpExceptionFilter
      const errorMsg =
        typeof err === "object" && err !== null && "response" in err
          ? (
              err.response as {
                data?: { message?: string | string[] };
              }
            ).data?.message || "Gagal terhubung ke server."
          : "Gagal terhubung ke server.";
      // Jika pesan berupa array (dari class-validator), ambil elemen pertama
      setError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            Social Media Automation
          </h1>
          <p className="text-sm text-slate-500">Please sign in to your account</p>
        </div>

        {/* Banner Error */}
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="user@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isLoading ? "Memproses..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
