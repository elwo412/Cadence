import {
  Home,
  CalendarRange,
  ListChecks,
  NotebookText,
  Timer,
  BarChart2,
  Settings,
} from "lucide-react";

export type View = "home" | "calendar" | "tasks" | "notes" | "focus" | "insights" | "settings";

const NAV = [
  { to: "home", label: "Home", icon: Home },
  { to: "calendar", label: "Calendar", icon: CalendarRange },
  { to: "tasks", label: "Tasks", icon: ListChecks },
  { to: "notes", label: "Notes", icon: NotebookText },
  { to: "focus", label: "Focus", icon: Timer },
  { to: "insights", label: "Insights", icon: BarChart2 },
  { to: "settings", label: "Settings", icon: Settings },
];

export function LeftNav({
  active,
  setActive,
}: {
  active: string;
  setActive: (view: View) => void;
}) {
  return (
    <aside className="w-[72px] bg-black/10 border-r border-white/10 py-4 flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center text-white/90 mb-2">
        ⟲
      </div>
      {NAV.map(({ to, label, icon: Icon }) => (
        <button
          key={to}
          onClick={() => setActive(to as View)}
          title={label}
          className={`group relative mt-1 flex h-11 w-11 items-center justify-center rounded-xl transition-colors
                      ${
                        active === to
                          ? "bg-white/10 border border-white/20 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/10"
                      }`}
        >
          <Icon size={20} />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 rounded-md bg-black/80 px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {label}
          </span>
        </button>
      ))}
    </aside>
  );
}
