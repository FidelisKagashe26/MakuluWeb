type GlobalLoadingOverlayProps = {
  visible: boolean;
};

export default function GlobalLoadingOverlay({ visible }: GlobalLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
      <div className="w-[min(30rem,92vw)] rounded-2xl border border-white/25 bg-slate-950/80 p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-church-300" />
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">
            Inapakia Taarifa...
          </p>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/20" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-white/15" />
          <div className="h-3 w-8/12 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}
