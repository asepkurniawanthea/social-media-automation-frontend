import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../api/axios";
import axios from "axios";

type ActiveFilter = "all" | "true" | "false";
type ChannelFilter =
  | "all"
  | "hardcode"
  | "ngabring"
  | "1001colors"
  | "kangbadru";

interface Source {
  id: number;
  domain: string;
  name: string;
  channel: ChannelFilter;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Meta {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta: Meta;
}

interface SourceForm {
  domain: string;
  name: string;
  channel: ChannelFilter;
  active: boolean;
}

// Default source baru: hak akses terendah (sama dengan default di database).
const EMPTY_FORM: SourceForm = {
  domain: "",
  name: "",
  channel: "hardcode",
  active: true,
};

// Satu fungsi untuk semua catch. Validasi NestJS mengembalikan `message`
// berupa array string, jadi digabung dulu agar tampil rapi.
const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const msg: unknown = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string" && msg) return msg;
    return fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [formData, setFormData] = useState<SourceForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingSource, setDeletingSource] = useState<Source | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<Source[]>>("/sources", {
        params: {
          page,
          limit,
          // undefined tidak ikut dikirim di query string
          search: debouncedSearch || undefined,
          channel: channelFilter === "all" ? undefined : channelFilter,
          active: activeFilter === "all" ? undefined : activeFilter === "true",
        },
      });
      setSources(response.data.data);
      setMeta(response.data.meta);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error loading data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, channelFilter, activeFilter]);

  const openModal = (source?: Source) => {
    if (source) {
      setEditingSource(source);
      setFormData({
        domain: source.domain,
        name: source.name,
        channel: source.channel,
        active: source.active,
      });
    } else {
      setEditingSource(null);
      setFormData(EMPTY_FORM);
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // <select> selalu menghasilkan string; ubah ke boolean untuk `active`
      [name]: name === "active" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingSource) {
        // Mode Edit
        const payload: Partial<SourceForm> = {
          domain: formData.domain,
          name: formData.name,
          channel: formData.channel,
          active: formData.active,
        };
        await api.patch(`/sources/${editingSource.id}`, payload);
      } else {
        // Mode Add
        await api.post("/sources", formData);
        setPage(1);
      }

      setIsModalOpen(false);
      await fetchSources();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Save source failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (source: Source) => {
    setDeletingSource(source);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setIsDeleteModalOpen(false);
    setDeletingSource(null);
  };

  const handleDelete = async () => {
    if (!deletingSource) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await api.delete(`/sources/${deletingSource.id}`);
      setIsDeleteModalOpen(false);
      setDeletingSource(null);

      // Kalau data di halaman ini habis setelah delete (misal cuma tersisa 1 item lalu dihapus),
      // mundur ke halaman sebelumnya supaya tidak nampilkan halaman kosong
      if (sources.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchSources();
      }
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, "Failed to delete source."));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const thStyle: React.CSSProperties = {
    padding: "12px 16px",
    fontWeight: "600",
    color: "#374151",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Sources Management
          </h2>
          <p className="text-sm text-slate-500">Manage the list of sources.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search domain or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value as ChannelFilter);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="hardcode">Hardcode</option>
            <option value="ngabring">Ngabring</option>
            <option value="1001colors">1001Colors</option>
            <option value="kangbadru">KangBadru</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as ActiveFilter);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Source
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        {/* STATE LOADING */}
        {loading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}
          >
            Loading data...
          </div>
        )}

        {/* STATE ERROR */}
        {error && (
          <div
            style={{
              padding: "12px",
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: "6px",
              border: "1px solid #f87171",
            }}
          >
            {error}
          </div>
        )}

        {/* STATE SUCCESS (TAMPILKAN DATA) */}
        {!loading && !error && (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f9fafb",
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={thStyle}>Domain</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Channel</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      Data not found.
                    </td>
                  </tr>
                ) : (
                  sources.map((source, index) => (
                    <tr
                      key={source.id}
                      style={{
                        borderBottom:
                          index === sources.length - 1
                            ? "none"
                            : "1px solid #e5e7eb",
                        textAlign: "left",
                      }}
                    >
                      <td style={{ padding: "12px 16px", color: "#4b5563" }}>
                        {source.domain}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#4b5563",
                          textTransform: "capitalize",
                        }}
                      >
                        {source.name}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#4b5563",
                          textTransform: "capitalize",
                        }}
                      >
                        {source.channel}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: source.active ? "#d1fae5" : "#fee2e2",
                            color: source.active ? "#065f46" : "#991b1b",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {source.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => openModal(source)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(source)}
                          className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && meta && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <span className="text-sm text-slate-500">
              Page {meta.currentPage} of {meta.totalPages} ({meta.totalItems}{" "}
              data)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                &lt;
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                disabled={page >= meta.totalPages}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ADD / EDIT */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingSource ? "Edit Source" : "Add Source"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  required
                  maxLength={254}
                  value={formData.domain}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={254}
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Channel
                </label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hardcode">Hardcode</option>
                  <option value="ngabring">Ngabring</option>
                  <option value="1001colors">1001colors</option>
                  <option value="kangbadru">Kangbadru</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  name="active"
                  value={String(formData.active)}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {formError && (
                <div
                  style={{
                    padding: "10px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingSource
                      ? "Save Changes"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI DELETE */}
      {isDeleteModalOpen && deletingSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Delete Source
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete the source{" "}
              <span className="font-medium text-slate-800">
                {deletingSource.name}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteSubmitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteSubmitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
