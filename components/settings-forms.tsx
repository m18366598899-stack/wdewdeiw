"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { archivePairRoomAction, updateProfileAction, updateRoomSettingsAction } from "@/app/actions";
import { PairRoom, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForms({
  profile,
  partner,
  pairRoom
}: {
  profile: Profile;
  partner: Profile | null;
  pairRoom: PairRoom;
}) {
  const [profileMessage, setProfileMessage] = useState("");
  const [roomMessage, setRoomMessage] = useState("");
  const [dangerMessage, setDangerMessage] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>我的资料</CardTitle>
          <CardDescription>昵称会显示在申请记录和审批信息里。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(formData) => {
              startTransition(async () => {
                const result = await updateProfileAction({
                  nickname: String(formData.get("nickname") || ""),
                  avatarUrl: String(formData.get("avatarUrl") || "")
                });
                setProfileMessage(result.message);
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="nickname">我的昵称</Label>
              <Input defaultValue={profile.nickname} id="nickname" name="nickname" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">头像链接（可选）</Label>
              <Input defaultValue={profile.avatar_url ?? ""} id="avatarUrl" name="avatarUrl" />
            </div>
            {profileMessage ? <p className="text-sm text-muted-foreground">{profileMessage}</p> : null}
            <Button disabled={pending} type="submit">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存资料"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>共享空间设置</CardTitle>
          <CardDescription>当前与你共享的是 {partner?.nickname ?? "另一位伙伴"}。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(formData) => {
              startTransition(async () => {
                const result = await updateRoomSettingsAction({
                  pairRoomId: pairRoom.id,
                  unitName: String(formData.get("unitName") || "")
                });
                setRoomMessage(result.message);
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="unitName">积分单位名称</Label>
              <Input defaultValue={pairRoom.unit_name} id="unitName" name="unitName" />
            </div>
            {roomMessage ? <p className="text-sm text-muted-foreground">{roomMessage}</p> : null}
            <Button disabled={pending} type="submit">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "更新共享设置"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#f1d3d3]">
        <CardHeader>
          <CardTitle>解绑共享空间</CardTitle>
          <CardDescription>解绑会归档当前空间，历史记录仍保留在数据库中，但双方会退出共享状态。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-[#fff2f2] p-4 text-sm text-[#8a5757]">
            这是高风险操作。请输入 <span className="font-semibold">UNBIND</span> 再点击按钮，避免误触。
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmText">确认口令</Label>
            <Input id="confirmText" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </div>
          {dangerMessage ? <p className="text-sm text-muted-foreground">{dangerMessage}</p> : null}
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await archivePairRoomAction({
                  pairRoomId: pairRoom.id,
                  confirmText
                });
                setDangerMessage(result.message);
              });
            }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "确认解绑"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
