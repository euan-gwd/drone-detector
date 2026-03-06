import type { Drone, FlightApproval, NotificationItem } from "../types/drone";

/**
 * Maps a drone's operational status to the appropriate Tailwind text colour class.
 *
 * | Status    | Colour class      | Visual  |
 * |-----------|-------------------|---------|
 * | "online"  | text-success      | cyan    |
 * | "warning" | text-amber-300    | amber   |
 * | "offline" | text-slate-300    | muted   |
 */
export function droneStatusColor(status: Drone["status"]): string {
  if (status === "warning") return "text-amber-300";
  if (status === "offline") return "text-slate-300";
  return "text-success"; // "online"
}

/**
 * Maps a flight approval status to the appropriate Tailwind text colour class.
 *
 * | Status           | Colour class   | Visual |
 * |------------------|----------------|--------|
 * | "approved"       | text-success   | cyan   |
 * | "pending"        | text-amber-300 | amber  |
 * | "actionrequired" | text-rose-300  | red    |
 * | "rejected"       | text-slate-400 | muted  |
 */
export function flightApprovalStatusColor(status: FlightApproval["status"]): string {
  if (status === "approved") return "text-success";
  if (status === "pending") return "text-amber-300";
  if (status === "actionrequired") return "text-rose-300";
  return "text-slate-400"; // "rejected" or unknown
}

/**
 * Maps a notification severity level to the appropriate Tailwind text colour class.
 *
 * | Level     | Colour class      | Visual |
 * |-----------|-------------------|--------|
 * | "warning" | text-amber-300    | amber  |
 * | "error"   | text-rose-300     | red    |
 * | "success" | text-emerald-300  | green  |
 * | "info"    | text-sky-300      | blue   |
 * | fallback  | text-slate-200    | white  |
 */
export function notificationLevelClass(level: NotificationItem["level"]): string {
  if (level === "warning") return "text-amber-300";
  if (level === "error") return "text-rose-300";
  if (level === "success") return "text-emerald-300";
  if (level === "info") return "text-sky-300";
  return "text-slate-200";
}
