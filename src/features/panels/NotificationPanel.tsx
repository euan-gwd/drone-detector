import { useState, type JSX } from 'react';
import { useNotificationStore } from "../../store/notificationStore";

function levelClass(level: string): string {
  if (level === "warning") {
    return "text-amber-300";
  }
  if (level === "error") {
    return "text-rose-300";
  }
  if (level === "success") {
    return "text-emerald-300";
  }
  if (level === "info") {
    return "text-sky-300";
  }
  return "text-slate-200";
}

// Colours only the drone name; ID and remainder stay in default text colour.
// Expected message format: "Drone Name (drn-xxx) rest of message"
function FormattedMessage({ message }: { message: string }): JSX.Element {
  const match = /^([^(]+?)\s(\([^)]+\))\s(.+)$/.exec(message);
  if (match) {
    const [, name, id, rest] = match;
    return (
      <p className="mt-1 text-slate-300">
        <span className="font-medium text-mapGlow">{name}</span>{" "}{id}{" "}{rest}
      </p>
    );
  }
  return <p className="mt-1 text-slate-300">{message}</p>;
}

function NotificationPanel(): JSX.Element {
  const [open, setOpen] = useState(true);
  const items = useNotificationStore((state) => state.items);

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-success">
      <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.91 32.91 0 003.256.508 3.5 3.5 0 006.972 0 32.903 32.903 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zM8.05 14.943a33.54 33.54 0 003.9 0 2 2 0 01-3.9 0z" clipRule="evenodd" />
    </svg>
  );

  return (
    <section className="overflow-hidden rounded-lg border border-slate-600 bg-surfaceAlt shadow-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-[#1a3a22] px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#1f4428]"
      >
        {icon}
        <span className="flex-1">Notifications</span>
        <span className="text-[11px] text-white/50">{items.length}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="max-h-72 space-y-3 overflow-auto px-4 py-3 pr-3">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400">No alerts yet.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="border-b border-slate-700 pb-2 text-xs last:border-none">
                <p className={`font-semibold ${levelClass(item.level)}`}>{item.title}</p>
                <FormattedMessage message={item.message} />
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </p>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default NotificationPanel;
