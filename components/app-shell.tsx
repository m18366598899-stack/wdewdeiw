"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HeartHandshake, History, LayoutGrid, ScrollText, Settings } from "lucide-react";
import { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
  { href: "/", label: "首页", icon: LayoutGrid },
  { href: "/approvals", label: "审批", icon: HeartHandshake },
  { href: "/history", label: "记录", icon: History },
  { href: "/audit", label: "日志", icon: ScrollText },
  { href: "/settings", label: "设置", icon: Settings }
];

export function AppShell({
  children,
  profile,
  partnerName
}: {
  children: ReactNode;
  profile: Profile;
  partnerName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 pb-28 pt-4 md:px-6 md:pb-8">
      <aside className="hidden w-72 shrink-0 md:block">
        <div className="sticky top-4 puppy-card puppy-doodle overflow-hidden p-5">
          <div className="mb-8 flex items-center gap-3">
            <Avatar className="puppy-ring h-14 w-14">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.nickname} />
              <AvatarFallback>{profile.nickname.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">今天也一起认真记录</p>
              <p className="text-xl font-semibold">{profile.nickname}</p>
              {partnerName ? <p className="text-sm text-muted-foreground">和 {partnerName} 共享中</p> : null}
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
