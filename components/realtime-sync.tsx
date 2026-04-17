"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RealtimeSync({ pairRoomId }: { pairRoomId?: string | null }) {
  const router = useRouter();

  useEffect(() => {
    if (!pairRoomId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`pair-room-${pairRoomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "point_requests", filter: `pair_room_id=eq.${pairRoomId}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approvals" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs", filter: `pair_room_id=eq.${pairRoomId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairRoomId, router]);

  return null;
}
