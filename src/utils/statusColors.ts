import type { Drone, FlightApproval, NotificationItem } from "../types/drone";

/** Maps drone status values to Tailwind text color classes. */
export function droneStatusColor(
  status: Drone["status"],
  approvalStatus?: FlightApproval["status"],
): string {
  if (approvalStatus === "actionrequired") return "text-rose-300";
  if (status === "offline" && approvalStatus === "pending") return "text-slate-200";
  if (approvalStatus === "pending") return "text-orange-400";
  if (status === "offline" && approvalStatus === "approved") return "text-sky-300";
  if (status === "warning") return "text-yellow-300";
  if (status === "offline") return "text-white";
  return "text-success";
}

/** Maps flight approval status values to Tailwind text color classes. */
export function flightApprovalStatusColor(status: FlightApproval["status"]): string {
  if (status === "approved") return "text-success";
  if (status === "pending") return "text-orange-400";
  if (status === "actionrequired") return "text-rose-300";
  return "text-slate-400";
}

/** Maps notification severity values to Tailwind text color classes. */
export function notificationLevelClass(level: NotificationItem["level"]): string {
  if (level === "warning") return "text-yellow-300";
  if (level === "error") return "text-rose-300";
  if (level === "success") return "text-emerald-300";
  if (level === "info") return "text-sky-300";
  return "text-slate-200";
}
