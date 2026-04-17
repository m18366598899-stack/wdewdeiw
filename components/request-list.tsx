"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { cancelPointRequestAction } from "@/app/actions";
import type { ApprovalDecision, PointRequest, Profile, RequestStatus } from "@/lib/types";
import { formatApprovalDecision, formatPoints, formatRequestStatus, formatRequestType } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type RequestRow = PointRequest & {
  initiator: Pick<Profile, "id" | "nickname"> | null;
  approvals: {
    id: string;
    decision: ApprovalDecision;
    approver: Pick<Profile, "nickname"> | null;
  }[];
};

function statusVariant(status: RequestStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "cancelled") return "accent";
  return "warning";
}

export function RequestList({
  requests,
  currentUserId,
  unitName,
  status,
  type
}: {
  requests: RequestRow[];
  currentUserId: string;
  unitName: string;
  status?: string;
  type?: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = status && status !== "all" ? request.status === status : true;
      const matchesType = type && type !== "all" ? request.request_type === type : true;
      return matchesStatus && matchesType;
    });
  }, [requests, status, type]);

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {filtered.map((request) => {
        const canCancel = request.initiated_by === currentUserId && request.status === "pending";
        return (
          <Card key={request.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(request.status)}>{formatRequestStatus(request.status)}</Badge>
                    <Badge>{formatRequestType(request.request_type)}</Badge>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatPoints(request.points, unitName)} {request.request_type === "debit" ? "扣减申请" : "变动申请"}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{format(new Date(request.created_at), "yyyy-MM-dd HH:mm")}</p>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">备注</p>
                  <p>{request.note}</p>
                  <p className="mt-1 text-xs">记录 ID：{request.id}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">发起人</p>
                  <p>{request.initiator?.nickname ?? "未知用户"}</p>
                  {request.correction_for_request_id ? (
                    <p className="mt-1 text-xs">修正目标：{request.correction_for_request_id}</p>
                  ) : null}
                </div>
                <div>
                  <p className="font-medium text-foreground">审批状态</p>
                  <p>
                    {request.approvals[0]?.approver?.nickname ?? "对方"}：
                    {formatApprovalDecision(request.approvals[0]?.decision ?? "pending")}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">生效时间</p>
                  <p>{request.effective_at ? format(new Date(request.effective_at), "yyyy-MM-dd HH:mm") : "尚未生效"}</p>
                </div>
              </div>

              {canCancel ? (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await cancelPointRequestAction({ requestId: request.id });
                      setMessage(result.message);
                    });
                  }}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "撤回申请"}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">当前筛选条件下还没有记录。</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
