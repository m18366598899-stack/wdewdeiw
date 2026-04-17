import { ApprovalList } from "@/components/approval-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePairRoom } from "@/lib/data";

export default async function ApprovalsPage() {
  const { supabase, user } = await requirePairRoom();

  const { data: approvals } = await supabase
    .from("approvals")
    .select("id, decision, request:point_requests(*, initiator:profiles!point_requests_initiated_by_fkey(nickname))")
    .eq("approver_id", user.id)
    .eq("decision", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>待审批申请</CardTitle>
          <CardDescription>只有你点了同意，这条积分变动才会正式计入总分。</CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovalList items={(approvals as never[]) || []} unitName="积分" />
        </CardContent>
      </Card>
    </div>
  );
}
