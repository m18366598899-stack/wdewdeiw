"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, History, LayoutGrid, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: LayoutGrid },
  { href: "/approvals", label: "审批", icon: HeartHandshake },
  { href: "/history", label: "记录", icon: History },
  { href: "/audit", label: "日志", icon: ScrollText },
  { href: "/settings", label: "设置", icon: Settings }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 rounded-3xl border border-border bg-white/95 p-2 shadow-soft backdrop-blur">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
