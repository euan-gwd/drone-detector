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
  return "text-slate-200";
}

function NotificationPanel(): JSX.Element {
  const items = useNotificationStore((state) => state.items);

  return (
    <section className="rounded-lg border border-slate-600 bg-surfaceAlt p-4 shadow-panel">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Notifications</h2>
        <span className="text-[11px] text-slate-400">{items.length}</span>
      </header>
      <div className="max-h-[38vh] space-y-3 overflow-auto pr-1">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400">No alerts yet.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="border-b border-slate-700 pb-2 text-xs last:border-none">
              <p className={`font-semibold ${levelClass(item.level)}`}>{item.title}</p>
              <p className="mt-1 text-slate-300">{item.message}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                {new Date(item.createdAt).toLocaleTimeString()}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default NotificationPanel;
