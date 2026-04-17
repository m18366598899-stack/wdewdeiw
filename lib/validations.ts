import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("请输入正确的邮箱"),
  password: z.string().min(6, "密码至少 6 位")
});

export const pointRequestSchema = z.object({
  pairRoomId: z.string().uuid(),
  requestType: z.enum(["credit", "debit", "correction"]),
  points: z.coerce.number().int().positive("分值必须为正整数"),
  note: z.string().trim().min(2, "请填写备注说明"),
  correctionForRequestId: z.string().uuid().optional().nullable()
});

export const inviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "邀请码至少 6 位")
    .max(12, "邀请码最多 12 位")
});

export const approvalSchema = z.object({
  approvalId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"])
});

export const cancelSchema = z.object({
  requestId: z.string().uuid()
});

export const profileSchema = z.object({
  nickname: z.string().trim().min(1, "昵称不能为空").max(20, "昵称最多 20 个字"),
  avatarUrl: z.string().url("请输入正确的头像地址").optional().or(z.literal(""))
});

export const roomSettingsSchema = z.object({
  pairRoomId: z.string().uuid(),
  unitName: z.string().trim().min(1, "积分单位不能为空").max(12, "建议不超过 12 个字")
});

export const archiveSchema = z.object({
  pairRoomId: z.string().uuid(),
  confirmText: z.literal("UNBIND", {
    errorMap: () => ({ message: "请输入 UNBIND 以确认解绑" })
  })
});
