import { Heart, PawPrint, Sparkles } from "lucide-react";
import { RequestDialog } from "@/components/request-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePairRoom } from "@/lib/data";
import { formatPoints, formatRequestStatus, formatRequestType } from "@/lib/utils";

export default async function DashboardPage() {
  const { supabase, profile, partnerProfile, pairRoom, balance } = (await requirePairRoom()) as any;

  const [{ data: requests }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("point_requests")
      .select("*, initiator:profiles!point_requests_initiated_by_fkey(id, nickname)")
      .eq("pair_room_id", pairRoom.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("approver_id", profile.id)
      .eq("decision", "pending")
  ]);

  return (
    <div className="space-y-6">
      <section className="puppy-card puppy-doodle overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div className="space-y-4">
            <Badge variant="accent" className="w-fit">线条小狗风共享积分</Badge>
            <div>
              <p className="text-sm text-muted-foreground">和 {partnerProfile?.nickname ?? "另一位伙伴"} 一起认真记录</p>
              <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{formatPoints(balance, pairRoom.unit_name)}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                所有积分变动都要经过双方确认，记录会实时同步、完整留痕，既温柔也清清楚楚。
              </p>
            </div>
            <RequestDialog pairRoomId={pairRoom.id} unitName={pairRoom.unit_name} />
          </div>

          <div className="grid gap-3">
            <Card className="bg-white/80">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">待你确认</p>
                  <p className="mt-1 text-2xl font-semibold">{pendingCount ?? 0}</p>
                </div>
                <Heart className="h-6 w-6 text-[#de8da1]" />
              </CardContent>
            </Card>
            <Card className="bg-white/80">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">共享单位</p>
                  <p className="mt-1 text-2xl font-semibold">{pairRoom.unit_name}</p>
                </div>
                <PawPrint className="h-6 w-6 text-primary" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>最近记录</CardTitle>
            <CardDescription>最近几条申请和状态变化会优先展示在这里。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests?.map((request) => (
              <div key={request.id} className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    {formatRequestType(request.request_type)} {formatPoints(request.points, pairRoom.unit_name)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{request.note}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{request.initiator?.nickname ?? "未知"}</Badge>
                  <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : request.status === "cancelled" ? "accent" : "warning"}>
                    {formatRequestStatus(request.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              今日小贴士
            </CardTitle>
            <CardDescription>让每条记录都更清楚，也更容易被对方理解和确认。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl bg-muted p-4">备注尽量写清楚“发生了什么”，避免只有“加 5 分”这种模糊说明。</div>
            <div className="rounded-2xl bg-muted p-4">如果历史已生效记录需要更改，请发起一条新的修正申请，不要直接改旧数据。</div>
            <div className="rounded-2xl bg-muted p-4">审批前先看完整信息，点下“同意”后，这次积分变化会立即计入总分。</div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
