import { Plus } from "lucide-react";

export default function Posts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Post</h2>
          <p className="text-sm text-slate-500">
            Kelola daftar admin, editor, dan scheduler.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        {/* Tempat tabel data user dari backend Nest.js nantinya */}
        Data tabel pengguna akan dimuat di sini...
      </div>
    </div>
  );
}
