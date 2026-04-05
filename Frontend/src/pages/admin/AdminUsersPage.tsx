import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { createUser, deleteUser, fetchUsers, updateUser } from "@/services/adminService";
import AppDropdown from "@/components/common/AppDropdown";

type UserForm = {
  email: string;
  fullName: string;
  role: "super_admin" | "admin" | "editor";
  password: string;
  status: "active" | "disabled";
};

const initialForm: UserForm = {
  email: "",
  fullName: "",
  role: "editor",
  password: "Admin@123",
  status: "active"
};

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" }
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" }
];

export default function AdminUsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const [form, setForm] = useState<UserForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery(fetchUsers, []);
  const rows = useMemo(() => data ?? [], [data]);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          fullName: form.fullName,
          role: form.role,
          status: form.status
        };
        if (form.password.trim()) payload.password = form.password;
        await updateUser(editingId, payload);
        toast.success("User updated.");
      } else {
        await createUser(form);
        toast.success("User created.");
      }
      setForm(initialForm);
      setEditingId(null);
      await refetch();
    } catch {
      toast.error("Failed to save user.");
    }
  };

  const editRow = (row: any) => {
    setEditingId(row.id);
    setForm({
      email: row.email ?? "",
      fullName: row.fullName ?? "",
      role: row.role ?? "editor",
      password: "",
      status: row.status ?? "active"
    });
  };

  const removeRow = async (row: any) => {
    if (row.id === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(row.id);
      toast.success("User deleted.");
      await refetch();
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">User Management (RBAC)</h1>
        <p className="text-sm text-slate-300">
          Roles: Super Admin, Admin, Editor. Permissions: create, update, delete, view, publish.
        </p>
      </header>

      {hasPermission("create") || hasPermission("update") ? (
        <article className="rounded-md bg-white/[0.03] p-4">
          <h2 className="text-lg font-bold text-white">{editingId ? "Edit User" : "Add User"}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="form-input"
              placeholder="Email"
              value={form.email}
              disabled={Boolean(editingId)}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            />
            <AppDropdown
              value={form.role}
              options={roleOptions}
              onChange={(value) => setForm((p) => ({ ...p, role: value as UserForm["role"] }))}
            />
            <AppDropdown
              value={form.status}
              options={statusOptions}
              onChange={(value) => setForm((p) => ({ ...p, status: value as UserForm["status"] }))}
            />
            <div className="relative md:col-span-2">
              <input
                className="form-input pr-10"
                type={showPassword ? "text" : "password"}
                placeholder={editingId ? "Set new password (optional)" : "Password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
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
          </div>

          <div className="mt-3 flex gap-2">
            <button className="admin-btn-primary" type="button" onClick={() => void handleSubmit()}>
              {editingId ? "Save changes" : "Add user"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </article>
      ) : null}

      {isLoading ? <p className="text-sm text-slate-300">Loading users...</p> : null}
      {error ? <p className="text-sm text-rose-300">Failed to load users.</p> : null}

      <div className="overflow-x-auto rounded-md bg-white/[0.03]">
        <table className="min-w-full text-sm text-slate-100">
          <thead>
            <tr className="bg-white/[0.05] text-left">
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{row.fullName}</td>
                <td className="px-3 py-2">{row.role}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {hasPermission("update") ? (
                      <button className="admin-btn-ghost px-2.5 py-1.5" type="button" onClick={() => editRow(row)}>
                        Edit
                      </button>
                    ) : null}
                    {hasPermission("delete") ? (
                      <button
                        className="admin-btn-danger px-2.5 py-1.5"
                        type="button"
                        onClick={() => void removeRow(row)}
                        disabled={row.id === currentUser?.id}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
