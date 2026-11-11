import { Plus, X, Pencil, Trash2, Eye, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../api/axios";
import axios from "axios";

type StatusFilter = "all" | "pending" | "processed" | "failed";

const STATUS_STYLE: Record<
  StatusFilter,
  { label: string; background: string; color: string }
> = {
  all: { label: "All", background: "#e5e7eb", color: "#374151" }, // abu-abu
  pending: { label: "Pending", background: "#fef3c7", color: "#92400e" }, // kuning
  processed: { label: "Processed", background: "#d1fae5", color: "#065f46" }, // hijau
  failed: { label: "Failed", background: "#fee2e2", color: "#991b1b" }, // merah
};

const FALLBACK_STYLE = {
  label: "Unknown",
  background: "#e5e7eb",
  color: "#374151",
};

type ChannelFilter =
  | "all"
  | "hardcode"
  | "ngabring"
  | "1001colors"
  | "kangbadru";

interface Article {
  id: number;
  sources_id: number;
  url: string;
  title: string;
  raw_content: string;
  author: string;
  published_at: Date;
  scraped_at: Date;
  status: StatusFilter;
  created_at: Date;
  updated_at: Date;
  sources: {
    domain: string;
    channel: ChannelFilter;
    active: boolean;
  };
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

interface ArticleForm {
  url: string;
  title: string;
  sources_id: number;
}

// Default source baru: hak akses terendah (sama dengan default di database).
const EMPTY_FORM: ArticleForm = {
  url: "",
  title: "",
  sources_id: 0,
};

type SourceOption = {
  id: number;
  domain: string;
};

interface SourceMeta<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface ScrapeResult {
  id: number;
  status: StatusFilter;
  error: string | null;
}

const truncate = (text: string | null | undefined, max: number): string => {
  if (!text) return "-";
  return text.length > max ? text.slice(0, max) + "..." : text;
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

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<ArticleForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [sources, setSources] = useState<SourceOption[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [scrapingId, setScrapingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<Article[]>>("/articles", {
        params: {
          page,
          limit,
          // undefined tidak ikut dikirim di query string
          search: debouncedSearch || undefined,
          channel: channelFilter === "all" ? undefined : channelFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });
      setArticles(response.data.data);
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
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, channelFilter, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await api.get<SourceMeta<SourceOption[]>>(
          "/sources/options",
          {
            signal: controller.signal,
          },
        );
        setSources(data.data);
      } catch (e) {
        if (!axios.isCancel(e)) setSourcesError("Failed to load source list");
      } finally {
        if (!controller.signal.aborted) setSourcesLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const openModal = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        url: article.url,
        title: article.title,
        sources_id: article.sources_id,
      });
    } else {
      setEditingArticle(null);
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sources_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingArticle) {
        // Mode Edit
        const payload: Partial<ArticleForm> = {
          url: formData.url,
          title: formData.title,
          sources_id: formData.sources_id,
        };
        await api.patch(`/articles/${editingArticle.id}`, payload);
      } else {
        // Mode Add
        await api.post("/articles", formData);
        setPage(1);
      }

      setIsModalOpen(false);
      await fetchArticles();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Save article failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (article: Article) => {
    setDeletingArticle(article);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setIsDeleteModalOpen(false);
    setDeletingArticle(null);
  };

  const handleDelete = async () => {
    if (!deletingArticle) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await api.delete(`/articles/${deletingArticle.id}`);
      setIsDeleteModalOpen(false);
      setDeletingArticle(null);

      // Kalau data di halaman ini habis setelah delete (misal cuma tersisa 1 item lalu dihapus),
      // mundur ke halaman sebelumnya supaya tidak nampilkan halaman kosong
      if (articles.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchArticles();
      }
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, "Failed to delete article."));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleScrape = async (article: Article) => {
    setScrapingId(article.id);
    setNotice(null);

    try {
      // timeout dinaikkan: scraping satu halaman bisa sampai ~15 detik
      const res = await api.post<{ data: ScrapeResult }>(
        `/scraper/articles/${article.id}`,
        null,
        { timeout: 30000 },
      );
      const result = res.data.data;

      if (result.status === "processed") {
        setNotice({
          type: "success",
          text: `Scraping succeeded: ${article.title ?? article.url}`,
        });
      } else {
        setNotice({
          type: "error",
          text: `Scraping failed: ${result.error ?? "unknown error"}`,
        });
      }
      await fetchArticles();
    } catch (err: unknown) {
      setNotice({
        type: "error",
        text: getErrorMessage(err, "Scraping request failed."),
      });
    } finally {
      setScrapingId(null);
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
            Articles Management
          </h2>
          <p className="text-sm text-slate-500">Manage the list of articles.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search url or title..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Article
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        {notice && (
          <div
            className={`flex items-start justify-between rounded-lg border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} className="ml-4">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
                  <th style={thStyle}>Url</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Author</th>
                  <th style={thStyle}>Published</th>
                  <th style={thStyle}>Scraped</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
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
                  articles.map((article, index) => (
                    <tr
                      key={article.id}
                      style={{
                        borderBottom:
                          index === articles.length - 1
                            ? "none"
                            : "1px solid #e5e7eb",
                        textAlign: "left",
                      }}
                    >
                      <td style={{ padding: "12px 16px", color: "#4b5563" }}>
                        {article.sources.domain}
                      </td>
                      <td
                        style={{ padding: "12px 16px", color: "#4b5563" }}
                        title={article.url} // teks lengkap muncul saat kursor diarahkan
                      >
                        {truncate(article.url, 40)}
                      </td>
                      <td
                        style={{ padding: "12px 16px", color: "#4b5563" }}
                        title={article.title} // teks lengkap muncul saat kursor diarahkan
                      >
                        {truncate(article.title, 40)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#4b5563",
                        }}
                      >
                        {article.author}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#4b5563",
                        }}
                      >
                        {article.published_at
                          ? new Date(article.published_at).toLocaleString()
                          : "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#4b5563",
                        }}
                      >
                        {article.scraped_at
                          ? new Date(article.scraped_at).toLocaleString()
                          : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {(() => {
                          const s =
                            STATUS_STYLE[article.status as StatusFilter] ??
                            FALLBACK_STYLE;
                          return (
                            <span
                              style={{
                                background: s.background,
                                color: s.color,
                                padding: "4px 8px",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {s.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div className="grid w-max grid-cols-2 gap-2">
                          <button
                            onClick={() => setViewingArticle(article)}
                            title="View content"
                            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleScrape(article)}
                            disabled={scrapingId !== null}
                            title="Scrape now"
                            className="rounded-md border border-blue-200 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${scrapingId === article.id ? "animate-spin" : ""}`}
                            />
                          </button>

                          <button
                            onClick={() => openModal(article)}
                            title="Edit"
                            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(article)}
                            title="Delete"
                            className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
                {editingArticle ? "Edit Article" : "Add Article"}
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
                  Source
                </label>
                <select
                  name="sources_id"
                  required
                  value={formData.sources_id || ""}
                  onChange={handleFormChange}
                  disabled={sourcesLoading || !!sourcesError}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {sourcesLoading ? "Loading..." : "Select source"}
                  </option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.domain}
                    </option>
                  ))}
                </select>
                {sourcesError && (
                  <p className="mt-1 text-xs text-red-600">{sourcesError}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Url
                </label>
                <textarea
                  name="url"
                  required
                  rows={3}
                  maxLength={254}
                  value={formData.url}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <textarea
                  name="title"
                  required
                  rows={3}
                  maxLength={254}
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                    : editingArticle
                      ? "Save Changes"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW RAW CONTENT */}
      {viewingArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setViewingArticle(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-800">
                  {viewingArticle.title ?? "(No title)"}
                </h3>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {viewingArticle.url}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {viewingArticle.author ?? "-"} ·{" "}
                  {viewingArticle.published_at
                    ? new Date(viewingArticle.published_at).toLocaleString()
                    : "-"}
                </p>
              </div>
              <button
                onClick={() => setViewingArticle(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
              {viewingArticle.raw_content ? (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-700">
                  {viewingArticle.raw_content}
                </pre>
              ) : (
                <p className="text-sm text-slate-500">
                  Content is not available yet. Click the scrape button to fetch
                  it.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI DELETE */}
      {isDeleteModalOpen && deletingArticle && (
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
                Delete Article
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete the article{" "}
              <span className="font-medium text-slate-800">
                {deletingArticle.title}
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
