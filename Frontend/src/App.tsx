import { lazy, Suspense, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/hero/Navbar";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSkeleton from "@/components/common/PageSkeleton";
import GlobalLoadingOverlay from "@/components/common/GlobalLoadingOverlay";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AdminLayout from "@/layouts/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { getPendingApiRequestsCount, subscribePendingApiRequests } from "@/lib/api";

const HomePage = lazy(() => import("./pages/HomePage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminSiteSettingsPage = lazy(() => import("./pages/admin/AdminSiteSettingsPage"));
const AdminDepartmentsPage = lazy(() => import("./pages/admin/AdminDepartmentsPage"));
const AdminLeadersPage = lazy(() => import("./pages/admin/AdminLeadersPage"));
const AdminGroupsPage = lazy(() => import("./pages/admin/AdminGroupsPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminAnnouncementsPage = lazy(() => import("./pages/admin/AdminAnnouncementsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminMediaPage = lazy(() => import("./pages/admin/AdminMediaPage"));
const AdminAccountPage = lazy(() => import("./pages/admin/AdminAccountPage"));
const AdminChangePasswordPage = lazy(() => import("./pages/admin/AdminChangePasswordPage"));
const DepartmentsPage = lazy(() => import("./pages/DepartmentsPage"));
const DepartmentDetailPage = lazy(() => import("./pages/DepartmentDetailPage"));
const LeadersPage = lazy(() => import("./pages/LeadersPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const MediaPage = lazy(() => import("./pages/MediaPage"));
const ChurchMapPage = lazy(() => import("./pages/church/ChurchMapPage"));
const ChurchContactsPage = lazy(() => import("./pages/church/ChurchContactsPage"));
const ChurchAboutPage = lazy(() => import("./pages/church/ChurchAboutPage"));
const ChurchLibraryPage = lazy(() => import("./pages/church/ChurchLibraryPage"));

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">404</h1>
      <p className="text-slate-600 dark:text-slate-300">Page not found.</p>
      <Link className="font-semibold text-church-700 dark:text-church-300" to="/">
        Back to home
      </Link>
    </section>
  );
}

export default function App() {
  const { isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const isAdminPanel = location.pathname.startsWith("/admin");
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  const isMediaPage = location.pathname === "/media";
  const isAnnouncementsPage = location.pathname === "/matangazo";
  const isChurchPage = location.pathname.startsWith("/kanisa");
  const shouldConstrainPublicContent = isChurchPage || (!isHomePage && !isMediaPage && !isAnnouncementsPage);

  const mainClass = isAdminPanel
    ? "min-h-screen"
    : isHomePage
      ? "flex-1"
      : isMediaPage || isAnnouncementsPage
        ? "flex-1 pt-24"
        : "flex-1 pb-8 pt-24";

  const [pendingApiRequests, setPendingApiRequests] = useState<number>(
    getPendingApiRequestsCount()
  );
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  useEffect(() => {
    return subscribePendingApiRequests((count) => {
      setPendingApiRequests(count);
    });
  }, []);

  useEffect(() => {
    if (isInitialLoadComplete) return;
    if (isAuthLoading || pendingApiRequests > 0) return;

    const readyTimer = window.setTimeout(() => {
      setIsInitialLoadComplete(true);
    }, 120);

    return () => window.clearTimeout(readyTimer);
  }, [isAuthLoading, isInitialLoadComplete, pendingApiRequests]);

  const showGlobalLoadingOverlay =
    !isInitialLoadComplete && (isAuthLoading || pendingApiRequests > 0);

  const routes = (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/idara" element={<DepartmentsPage />} />
        <Route path="/idara/:departmentId" element={<DepartmentDetailPage />} />
        <Route path="/viongozi" element={<LeadersPage />} />
        <Route path="/vikundi" element={<GroupsPage />} />
        <Route path="/matangazo" element={<AnnouncementsPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/kanisa/ramani" element={<ChurchMapPage />} />
        <Route path="/kanisa/contacts" element={<ChurchContactsPage />} />
        <Route path="/kanisa/kuhusu" element={<ChurchAboutPage />} />
        <Route path="/kanisa/maktaba" element={<ChurchLibraryPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute permission="view">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="account"
            element={
              <ProtectedRoute permission="view">
                <AdminAccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="change-password"
            element={
              <ProtectedRoute permission="view">
                <AdminChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute permission="update">
                <AdminSiteSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="maktaba"
            element={
              <ProtectedRoute permission="update">
                <AdminSiteSettingsPage forcedTab="library" />
              </ProtectedRoute>
            }
          />
          <Route
            path="idara"
            element={
              <ProtectedRoute permission="view">
                <AdminDepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="viongozi"
            element={
              <ProtectedRoute permission="view">
                <AdminLeadersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="vikundi"
            element={
              <ProtectedRoute permission="view">
                <AdminGroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute permission="view">
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="matangazo"
            element={
              <ProtectedRoute permission="view">
                <AdminAnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute permission="view">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="media"
            element={
              <ProtectedRoute permission="view">
                <AdminMediaPage />
              </ProtectedRoute>
            }
          />
          <Route path="media/:category" element={<Navigate to="/admin/media" replace />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );

  return (
    <div className={isAdminPanel ? "min-h-screen w-full" : "min-h-screen w-full flex flex-col"}>
      {!isAdminPanel ? <Navbar forceScrolled={isHomePage ? undefined : true} brightness="dark" /> : null}

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={mainClass}
      >
        {isAdminPanel ? (
          routes
        ) : shouldConstrainPublicContent ? (
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{routes}</div>
        ) : (
          routes
        )}
      </motion.main>

      {!isAdminPanel ? <SiteFooter /> : null}
      <GlobalLoadingOverlay visible={showGlobalLoadingOverlay} />
    </div>
  );
}
