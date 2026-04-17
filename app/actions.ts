"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  approvalSchema,
  archiveSchema,
  cancelSchema,
  inviteCodeSchema,
  pointRequestSchema,
  profileSchema,
  roomSettingsSchema
} from "@/lib/validations";

type ActionState = {
  success: boolean;
  message: string;
};

async function getActionSupabase() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("请先登录");
  }

  return { supabase, user };
}

function ok(message: string): ActionState {
  return { success: true, message };
}

function fail(message: string): ActionState {
  return { success: false, message };
}

export async function createInvitationAction(): Promise<ActionState & { code?: string }> {
  try {
    const { supabase } = await getActionSupabase();
    const { data, error } = await supabase.rpc("create_invitation_code");

    if (error || !data?.[0]) {
      return fail(error?.message ?? "邀请码生成失败");
    }

    revalidatePath("/bind");
    return { success: true, message: "邀请码已生成", code: data[0].code };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "邀请码生成失败");
  }
}

export async function joinInvitationAction(input: { code: string }): Promise<ActionState> {
  try {
    const parsed = inviteCodeSchema.parse(input);
    const { supabase } = await getActionSupabase();
    const { error } = await supabase.rpc("join_invitation_code", {
      input_code: parsed.code.toUpperCase()
    });

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/");
    revalidatePath("/bind");
    return ok("绑定成功，你们现在已经共享同一份积分啦。");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "绑定失败");
  }
}

export async function createPointRequestAction(input: {
  pairRoomId: string;
  requestType: "credit" | "debit" | "correction";
  points: number;
  note: string;
  correctionForRequestId?: string | null;
}): Promise<ActionState> {
  try {
    const parsed = pointRequestSchema.parse(input);
    const { supabase } = await getActionSupabase();
    const { error } = await supabase.rpc("create_point_request", {
      input_pair_room_id: parsed.pairRoomId,
      input_request_type: parsed.requestType,
      input_points: parsed.points,
      input_note: parsed.note,
      input_correction_for_request_id: parsed.correctionForRequestId ?? null
    });

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/");
    revalidatePath("/approvals");
    revalidatePath("/history");
    return ok("申请已提交，等待对方确认。");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "提交失败");
  }
}

export async function decidePointRequestAction(input: {
  approvalId: string;
  decision: "approved" | "rejected";
}): Promise<ActionState> {
  try {
    const parsed = approvalSchema.parse(input);
    const { supabase } = await getActionSupabase();
    const { error } = await supabase.rpc("decide_point_request", {
      input_approval_id: parsed.approvalId,
      input_decision: parsed.decision
    });

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/");
    revalidatePath("/approvals");
    revalidatePath("/history");
    revalidatePath("/audit");
    return ok(parsed.decision === "approved" ? "该积分变动已正式生效。" : "已拒绝该申请。");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "审批失败");
  }
}

export async function cancelPointRequestAction(input: { requestId: string }): Promise<ActionState> {
  try {
    const parsed = cancelSchema.parse(input);
    const { supabase } = await getActionSupabase();
    const { error } = await supabase.rpc("cancel_point_request", {
      input_request_id: parsed.requestId
    });

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/");
    revalidatePath("/history");
    revalidatePath("/audit");
    return ok("申请已撤回。");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "撤回失败");
  }
}

export async function updateProfileAction(input: {
  nickname: string;
  avatarUrl?: string;
}): Promise<ActionState> {
  try {
    const parsed = profileSchema.parse(input);
    const { supabase, user } = await getActionSupabase();
    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: parsed.nickname,
        avatar_url: parsed.avatarUrl || null
      })
      .eq("id", user.id);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/settings");
    revalidatePath("/");
    return ok("个人资料已更新。");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新失败");
  }
}

export async function updateRoomSettingsAction(input: {
  pairRoomId: string;
  unitName: string;
}): Promise<ActionState> {
  try {
    const parsed = roomSettingsSchema.parse(input);
    const { supabase } = await getActionSupabase();
    const { error } = await supabase
      .from("pair_rooms")
      .update({
        unit_name: parsed.unitName
      })
      .eq("id", parsed.pairRoomId);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/settings");
    revalidatePath("/");
    return ok("共享空间设置已更新。");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新失败");
  }
}

export async function archivePairRoomAction(input: {
  pairRoomId: string;
  confirmText: string;
}): Promise<ActionState> {
  try {
    const parsed = archiveSchema.parse(input);
    const { supabase } = await getActionSupabase();
    const { error } = await supabase.rpc("archive_pair_room", {
      input_pair_room_id: parsed.pairRoomId
    });

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/");
    revalidatePath("/bind");
    revalidatePath("/settings");
    return ok("共享空间已解绑归档。");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "解绑失败");
  }
}
