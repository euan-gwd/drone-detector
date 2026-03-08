import type { Drone, FlightApproval, NotificationItem } from "../types/drone";

/** Maps drone status values to Tailwind text color classes. */
export function droneStatusColor(status: Drone["status"]): string {
  if (status === "warning") return "text-amber-300";
  if (status === "offline") return "text-slate-300";
  return "text-success";
}

/** Maps flight approval status values to Tailwind text color classes. */
export function flightApprovalStatusColor(status: FlightApproval["status"]): string {
  if (status === "approved") return "text-success";
  if (status === "pending") return "text-amber-300";
  if (status === "actionrequired") return "text-rose-300";
  return "text-slate-400";
}

/** Maps notification severity values to Tailwind text color classes. */
export function notificationLevelClass(level: NotificationItem["level"]): string {
  if (level === "warning") return "text-amber-300";
  if (level === "error") return "text-rose-300";
  if (level === "success") return "text-emerald-300";
  if (level === "info") return "text-sky-300";
  return "text-slate-200";
}
