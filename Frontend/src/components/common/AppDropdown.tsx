import { useEffect, useMemo, useRef, useState } from "react";

type DropdownOption = {
  value: string;
  label: string;
};

type AppDropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
};

export default function AppDropdown({
  value,
  options,
  onChange,
  placeholder = "Select option",
  emptyLabel = "No options",
  disabled = false,
  className = ""
}: AppDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasSelectedOption = useMemo(
    () => options.some((entry) => entry.value === value),
    [options, value]
  );

  const selectedLabel = useMemo(() => {
    const selected = options.find((entry) => entry.value === value);
    return selected?.label || placeholder;
  }, [options, placeholder, value]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="form-input flex w-full items-center justify-between text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={hasSelectedOption ? "" : "text-slate-400"}>{selectedLabel}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-300 bg-white p-1 shadow-xl dark:border-white/20 dark:bg-[#0b1743]">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-300">{emptyLabel}</p>
          ) : (
            options.map((entry) => {
              const active = entry.value === value;
              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => {
                    onChange(entry.value);
                    setOpen(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-church-700 text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  {entry.label}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
