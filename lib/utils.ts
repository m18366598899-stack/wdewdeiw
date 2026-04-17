import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number, unitName = "积分") {
  return `${points} ${unitName}`;
}

export function formatRequestType(type: "credit" | "debit" | "correction") {
  if (type === "credit") return "加分";
  if (type === "debit") return "扣分";
  return "修正";
}

export function formatRequestStatus(status: string) {
  const map: Record<string, string> = {
    pending: "待确认",
    approved: "已通过",
    rejected: "已拒绝",
    cancelled: "已撤回"
  };

  return map[status] ?? status;
}

export function formatApprovalDecision(decision: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    approved: "已同意",
    rejected: "已拒绝"
  };

  return map[decision] ?? decision;
}

export function toSignedPoints(type: string, points: number) {
  return type === "debit" ? -points : points;
}

export function buildInviteUrl(code: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/bind?code=${code}`;
}
