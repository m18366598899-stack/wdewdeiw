import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getViewerContext = cache(async () => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("未找到当前用户资料，请检查 Supabase 初始化脚本是否已执行。");
  }

  let pairRoom = null;
  let partnerProfile = null;
  let balance = 0;

  if (profile.pair_room_id) {
    const [{ data: room }, { data: total }, { data: members }] = await Promise.all([
      supabase.from("pair_rooms").select("*").eq("id", profile.pair_room_id).single(),
      supabase.from("pair_room_balances").select("*").eq("pair_room_id", profile.pair_room_id).single(),
      supabase.from("profiles").select("*").eq("pair_room_id", profile.pair_room_id)
    ]);

    pairRoom = room;
    balance = total?.total_points ?? 0;
    partnerProfile = members?.find((member) => member.id !== user.id) ?? null;
  }

  return {
    user,
    profile,
    pairRoom,
    partnerProfile,
    balance,
    supabase
  };
});

export async function requirePairRoom() {
  const context = await getViewerContext();

  if (
    !context.profile.pair_room_id ||
    !context.pairRoom ||
    context.pairRoom.status !== "active" ||
    !context.partnerProfile
  ) {
    redirect("/bind");
  }

  return context;
}
