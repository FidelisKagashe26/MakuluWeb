import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/services/adminService";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

export default function AdminChangePasswordPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<PasswordForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast.error("User not found.");
      return;
    }
    if (!form.newPassword.trim()) {
      toast.error("Enter a new password.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser(user.id, {
        password: form.newPassword,
        currentPassword: form.currentPassword
      });
      toast.success("Password updated.");
      setForm(initialForm);
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-church-700 dark:text-church-300">
          Security
        </p>
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Badilisha nenosiri lako la admin kwa usalama zaidi.
        </p>
      </header>

      <article>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Current password
            <div className="relative">
              <input
                className="form-input pr-10"
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                aria-label={showCurrent ? "Hide password" : "Show password"}
                title={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M3 3l18 18" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            New password
            <div className="relative">
              <input
                className="form-input pr-10"
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                aria-label={showNew ? "Hide password" : "Show password"}
                title={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M3 3l18 18" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Confirm new password
            <div className="relative">
              <input
                className="form-input pr-10"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M3 3l18 18" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button className="admin-btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Update Password"}
            </button>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => setForm(initialForm)}
              disabled={isSaving}
            >
              Clear
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
