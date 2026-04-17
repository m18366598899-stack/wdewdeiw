"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { decidePointRequestAction } from "@/app/actions";
import { PointRequest, Profile } from "@/lib/types";
import { formatPoints, formatRequestType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type PendingApproval = {
  id: string;
  decision: "pending";
  request: PointRequest & {
    initiator: Pick<Profile, "nickname"> | null;
  };
};

export function ApprovalList({
  items,
  unitName
}: {
  items: PendingApproval[];
  unitName: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {formatRequestType(item.request.request_type)} {formatPoints(item.request.points, unitName)}
              </p>
              <p className="text-sm text-muted-foreground">{item.request.note}</p>
              <p className="text-sm text-muted-foreground">
                发起人：{item.request.initiator?.nickname ?? "未知"} · {format(new Date(item.request.created_at), "yyyy-MM-dd HH:mm")}
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">查看并审批</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认这条申请</DialogTitle>
                  <DialogDescription>请完整查看申请信息，再选择同意或拒绝。</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 rounded-2xl bg-muted p-4 text-sm">
                  <p>类型：{formatRequestType(item.request.request_type)}</p>
                  <p>分值：{formatPoints(item.request.points, unitName)}</p>
                  <p>备注：{item.request.note}</p>
                  <p>发起人：{item.request.initiator?.nickname ?? "未知用户"}</p>
                  <p>提交时间：{format(new Date(item.request.created_at), "yyyy-MM-dd HH:mm")}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await decidePointRequestAction({ approvalId: item.id, decision: "rejected" });
                        setMessage(result.message);
                      });
                    }}
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "拒绝"}
                  </Button>
                  <Button
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await decidePointRequestAction({ approvalId: item.id, decision: "approved" });
                        setMessage(result.message);
                      });
                    }}
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "同意并生效"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">目前没有待你确认的申请。</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
