import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AuthRequestError } from "@/services/authService";
import { useTheme } from "@/context/ThemeContext";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginForm = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const form = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "superadmin@makulu.org",
      password: "Admin@123"
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setLockoutSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [lockoutSeconds]);

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values);
      toast.success("Logged in successfully.");
      navigate("/admin", { replace: true });
    } catch (err) {
      let message = err instanceof Error ? err.message : "Login failed. Please try again.";

      if (err instanceof AuthRequestError) {
        if (err.retryAfterSeconds && err.retryAfterSeconds > 0) {
          setLockoutSeconds((prev) => Math.max(prev, err.retryAfterSeconds || 0));
        }

        if (err.remainingAttempts && err.remainingAttempts > 0) {
          message = `${message} Baki na jaribio ${err.remainingAttempts}.`;
        }
      }

      toast.error(message);
    }
  };

  const isLockedOut = lockoutSeconds > 0;
  const lockoutMinutes = Math.floor(lockoutSeconds / 60);
  const lockoutRemainSeconds = lockoutSeconds % 60;

  return (
    <>
      <Helmet>
        <title>Admin Login | DODOMA MAKULU SDA CHURCH</title>
      </Helmet>

      <section
        className={`min-h-screen px-4 sm:px-6 flex items-center justify-center ${
          isDark
            ? "admin-theme-dark bg-gradient-to-b from-[#090f2f] via-[#060d2a] to-[#050920]"
            : "admin-theme-light bg-gradient-to-b from-slate-100 via-white to-slate-100"
        }`}
      >
        <div className="w-full max-w-md">
          <article
            className={`w-full rounded-md border p-5 shadow-soft backdrop-blur sm:p-6 ${
              isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/90"
            }`}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                className="admin-topbar-btn"
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
              >
                {isDark ? "Light" : "Dark"}
              </button>
            </div>
            <div className="mb-5 flex flex-col items-center text-center">
              <img
                src="/adventistLogo.png"
                alt="Adventist logo"
                className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-300 dark:ring-white/40 sm:h-20 sm:w-20"
                loading="eager"
                decoding="async"
              />
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Admin Login</h2>
            </div>

            <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
                <input
                  className="form-input"
                  type="email"
                  placeholder="admin@makulu.org"
                  disabled={isLockedOut}
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <small className="text-xs text-rose-300">{form.formState.errors.email.message}</small>
                ) : null}
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Password
                <div className="relative">
                  <input
                    className="form-input pr-10"
                    type={showPassword ? "text" : "password"}
                    disabled={isLockedOut}
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
                {form.formState.errors.password ? (
                  <small className="text-xs text-rose-300">{form.formState.errors.password.message}</small>
                ) : null}
              </label>

              {isLockedOut ? (
                <p className="text-center text-xs font-semibold text-amber-500 dark:text-amber-300">
                  Jaribu tena baada ya {lockoutMinutes}:{String(lockoutRemainSeconds).padStart(2, "0")}
                </p>
              ) : null}

              <button
                className="admin-btn-primary mt-2 w-full sm:w-fit sm:justify-self-center"
                type="submit"
                disabled={form.formState.isSubmitting || isLoading || isLockedOut}
              >
                {isLockedOut
                  ? "Temporarily locked"
                  : form.formState.isSubmitting
                    ? "Signing in..."
                    : "Sign in"}
              </button>
            </form>
          </article>
        </div>
      </section>
    </>
  );
}
