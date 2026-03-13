import { Activity, useState, type JSX } from 'react';
import { Bell, ChevronDown, X } from 'lucide-react';
import { useNotificationStore } from "../../store/notificationStore";
import { notificationLevelClass } from "../../utils/statusColors";

/**
 * Renders the body of a notification, highlighting the drone name in cyan.
 * Uses structured `droneName`/`droneId` when present, with a regex fallback
 * for older plain-text messages.
 */
function FormattedMessage({
  message,
  droneName,
  droneId
}: {
  message: string;
  droneName?: string;
  droneId?: string;
}): JSX.Element {
  if (droneName && droneId) {
    return (
      <p className="mt-1 text-slate-300">
        <span className="font-medium text-mapGlow">{droneName}</span>{" "}
        ({droneId}){" "}{message}
      </p>
    );
  }

  // TODO(notification-legacy-format): remove after all producers send structured fields.
  // Legacy input format: "Drone Name (drn-xxx) rest of message".
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
  const clearNotification = useNotificationStore((state) => state.clearNotification);

  const icon = <Bell className="h-4 w-4 text-success" />;

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
        <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <Activity mode={open ? "visible" : "hidden"}>
        <div className="max-h-72 space-y-3 overflow-auto px-4 py-3 pr-3">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400">No alerts yet.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="relative border-b border-slate-700 pb-2 text-xs last:border-none">
                <button
                  type="button"
                  onClick={() => clearNotification(item.id)}
                  className="absolute right-0 top-0 text-slate-500 hover:text-slate-300"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                  <p className={`font-semibold ${notificationLevelClass(item.level)}`}>{item.title}</p>
                  <FormattedMessage message={item.message} droneName={item.droneName} droneId={item.droneId} />
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </p>
              </article>
            ))
          )}
        </div>
      </Activity>
    </section>
  );
}

export default NotificationPanel;
