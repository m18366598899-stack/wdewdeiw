import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { RealtimeSync } from "@/components/realtime-sync";
import { requirePairRoom } from "@/lib/data";

export default async function ProtectedLayout({
  children
}: {
  children: ReactNode;
}) {
  const { profile, partnerProfile, pairRoom } = await requirePairRoom();

  return (
    <>
      <RealtimeSync pairRoomId={pairRoom?.id} />
      <AppShell profile={profile} partnerName={partnerProfile?.nickname}>
        {children}
      </AppShell>
      <BottomNav />
    </>
  );
}
