import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { fetchDashboard } from "@/services/adminService";

const ACTIVITIES_PER_PAGE = 10;

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useApiQuery(fetchDashboard, []);
  const [activitiesPage, setActivitiesPage] = useState(1);

  const recentActivities = data?.recentActivities ?? [];
  const totalActivityPages = Math.max(1, Math.ceil(recentActivities.length / ACTIVITIES_PER_PAGE));
  const pageStartIndex = (activitiesPage - 1) * ACTIVITIES_PER_PAGE;
  const pageEndIndex = Math.min(pageStartIndex + ACTIVITIES_PER_PAGE, recentActivities.length);

  const paginatedActivities = useMemo(
    () => recentActivities.slice(pageStartIndex, pageStartIndex + ACTIVITIES_PER_PAGE),
    [pageStartIndex, recentActivities]
  );

  useEffect(() => {
    setActivitiesPage(1);
  }, [recentActivities.length]);

  useEffect(() => {
    if (activitiesPage > totalActivityPages) {
      setActivitiesPage(totalActivityPages);
    }
  }, [activitiesPage, totalActivityPages]);

  if (isLoading) {
    return <p className="text-sm text-slate-300">Loading dashboard...</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-rose-300">Failed to load dashboard.</p>
        <button className="admin-btn-primary" type="button" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const cards = [
    { label: "Total Departments", value: data.stats.totalIdara },
    { label: "Total Leaders", value: data.stats.totalViongozi },
    { label: "Active Announcements", value: data.stats.activeMatangazo },
    { label: "Total Reports", value: data.stats.totalReports },
    { label: "Total Photos", value: data.stats.totalImages },
    { label: "Total Videos", value: data.stats.totalVideos }
  ];

  return (
    <div className="space-y-5">
      <header className="rounded-md bg-white/[0.03] p-4">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-300">Real-time summary of your admin system.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-md bg-[#040b2c]/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-church-300">{card.label}</p>
            <p className="mt-2 text-4xl font-bold text-white">{card.value}</p>
          </article>
        ))}
      </div>

      <article className="rounded-md bg-[#040b2c]/70 p-4">
        <h2 className="text-2xl font-bold text-white">Recent Activities</h2>
        <div className="mt-3 grid gap-2">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-300">No recent activities yet.</p>
          ) : (
            paginatedActivities.map((activity) => (
              <div key={activity.id} className="rounded-md bg-white/[0.04] p-3">
                <p className="font-semibold text-white">
                  {activity.userName} | {activity.action} | {activity.entity}
                </p>
                <p className="text-slate-300">{activity.detail}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {format(new Date(activity.createdAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            ))
          )}
        </div>

        {recentActivities.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
            <p className="text-xs text-slate-400">
              Showing {pageStartIndex + 1}-{pageEndIndex} of {recentActivities.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="admin-btn-ghost px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => setActivitiesPage((prev) => Math.max(1, prev - 1))}
                disabled={activitiesPage === 1}
              >
                Previous
              </button>
              <p className="text-xs font-semibold text-slate-300">
                Page {activitiesPage} / {totalActivityPages}
              </p>
              <button
                type="button"
                className="admin-btn-ghost px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => setActivitiesPage((prev) => Math.min(totalActivityPages, prev + 1))}
                disabled={activitiesPage === totalActivityPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}
