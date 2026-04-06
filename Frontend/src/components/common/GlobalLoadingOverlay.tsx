type GlobalLoadingOverlayProps = {
  visible: boolean;
};

export default function GlobalLoadingOverlay({ visible }: GlobalLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/25 bg-slate-950/75 px-8 py-7 shadow-2xl">
        <div className="relative h-36 w-36">
          <div className="absolute inset-0 rounded-full border-4 border-white/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-church-300 border-r-church-400" />
          <div className="absolute inset-[10px] overflow-hidden rounded-full border border-white/35 bg-white/95 p-2 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]">
            <img
              src="/adventistLogo.png"
              alt="Adventist Logo"
              className="h-full w-full rounded-full object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
          Inapakia...
        </p>
      </div>
    </div>
  );
}
