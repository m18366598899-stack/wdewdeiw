import Link from "next/link";
import { RequestList } from "@/components/request-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePairRoom } from "@/lib/data";

const statuses = [
  { key: "all", label: "全部状态" },
  { key: "pending", label: "待确认" },
  { key: "approved", label: "已通过" },
  { key: "rejected", label: "已拒绝" },
  { key: "cancelled", label: "已撤回" }
];

const types = [
  { key: "all", label: "全部类型" },
  { key: "credit", label: "加分" },
  { key: "debit", label: "扣分" },
  { key: "correction", label: "修正" }
];

export default async function HistoryPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status = "all", type = "all" } = await searchParams;
  const { supabase, profile, pairRoom } = (await requirePairRoom()) as any;

  const { data: requests } = await supabase
    .from("point_requests")
    .select("*, initiator:profiles!point_requests_initiated_by_fkey(id, nickname), approvals(id, decision, approver:profiles!approvals_approver_id_fkey(nickname))")
    .eq("pair_room_id", pairRoom.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
          <CardDescription>这里保留全部申请、结果与时间，不会静默丢失。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {statuses.map((item) => (
              <Link key={item.key} href={`/history?status=${item.key}&type=${type}`}>
                <Badge variant={status === item.key ? "accent" : "default"}>{item.label}</Badge>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {types.map((item) => (
              <Link key={item.key} href={`/history?status=${status}&type=${item.key}`}>
                <Badge variant={type === item.key ? "accent" : "default"}>{item.label}</Badge>
              </Link>
            ))}
          </div>
          <RequestList
            requests={(requests as never[]) || []}
            currentUserId={profile.id}
            status={status}
            type={type}
            unitName={pairRoom.unit_name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
