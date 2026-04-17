"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Plus, Sparkles } from "lucide-react";
import { createPointRequestAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RequestMode = "credit" | "debit" | "correction";

export function RequestDialog({
  pairRoomId,
  unitName
}: {
  pairRoomId: string;
  unitName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestType, setRequestType] = useState<RequestMode>("credit");
  const [points, setPoints] = useState("1");
  const [note, setNote] = useState("");
  const [correctionForRequestId, setCorrectionForRequestId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const preview = useMemo(
    () =>
      `${requestType === "credit" ? "加分" : requestType === "debit" ? "扣分" : "修正"} ${points || 0} ${unitName}`,
    [points, requestType, unitName]
  );

  function submit() {
    startTransition(async () => {
      const result = await createPointRequestAction({
        pairRoomId,
        requestType,
        points: Number(points),
        note,
        correctionForRequestId: requestType === "correction" ? correctionForRequestId : null
      });

      setMessage(result.message);

      if (result.success) {
        setConfirmOpen(false);
        setOpen(false);
        setPoints("1");
        setNote("");
        setCorrectionForRequestId("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          发起加减分申请
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>发起申请</DialogTitle>
          <DialogDescription>每一次积分变动都需要备注，并等待对方确认后才会正式生效。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${requestType === "credit" ? "border-primary bg-primary/10" : "border-border bg-white"}`}
              onClick={() => setRequestType("credit")}
            >
              加分
            </button>
            <button
              type="button"
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${requestType === "debit" ? "border-primary bg-primary/10" : "border-border bg-white"}`}
              onClick={() => setRequestType("debit")}
            >
              扣分
            </button>
            <button
              type="button"
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${requestType === "correction" ? "border-primary bg-primary/10" : "border-border bg-white"}`}
              onClick={() => setRequestType("correction")}
            >
              修正
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">分值</Label>
            <Input id="points" min={1} step={1} type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>

          {requestType === "correction" ? (
            <div className="space-y-2">
              <Label htmlFor="correction-id">要修正的原始记录 ID</Label>
              <Input
                id="correction-id"
                placeholder="请填写已生效记录的 ID"
                value={correctionForRequestId}
                onChange={(e) => setCorrectionForRequestId(e.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="note">备注说明</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="比如：主动收拾房间、约会迟到、帮忙买早餐..."
            />
          </div>

          <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-4 w-4" />
              提交预览
            </div>
            <p>{preview}</p>
            <p className="mt-1">备注：{note || "请填写清楚一点，方便对方确认。"}</p>
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                disabled={!note.trim() || (requestType === "correction" && !correctionForRequestId.trim())}
              >
                提交并等待确认
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认提交这条申请吗？</DialogTitle>
                <DialogDescription>提交后不会立刻生效，需要对方明确点“同意”。</DialogDescription>
              </DialogHeader>
              <div className="rounded-2xl bg-muted p-4 text-sm">
                <p>{preview}</p>
                <p className="mt-2 text-muted-foreground">{note}</p>
              </div>
              <div className="flex items-start gap-2 rounded-2xl border border-[#f3dca5] bg-[#fff8e7] p-3 text-sm text-[#7d6131]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>请确认备注内容准确，这条记录会进入历史和审计日志。</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
                  再检查一下
                </Button>
                <Button className="flex-1" disabled={pending} onClick={submit}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "确认提交"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
