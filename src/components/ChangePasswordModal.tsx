import { useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";
import { getErrorMessage } from "../utils/getErrorMessage";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

const FIELDS = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
    minLength: undefined,
  },
  {
    name: "newPassword",
    label: "New password",
    autoComplete: "new-password",
    minLength: 8,
  },
  {
    name: "confirmPassword",
    label: "Confirm new password",
    autoComplete: "new-password",
    minLength: 8,
  },
] as const;

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    if (submitting) return;
    setForm(EMPTY);
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm(EMPTY);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to change password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Change Password
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              Password changed successfully.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map((f) => (
              <div key={f.name}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {f.label}
                </label>
                <input
                  type="password"
                  name={f.name}
                  required
                  minLength={f.minLength}
                  maxLength={72}
                  autoComplete={f.autoComplete}
                  value={form[f.name]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            {error && (
              <div className="rounded-md bg-red-50 p-2.5 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
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
                {submitting ? "Saving..." : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
