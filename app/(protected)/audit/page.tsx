import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePairRoom } from "@/lib/data";

export default async function AuditPage() {
  const { supabase, pairRoom } = await requirePairRoom();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, actor:profiles!audit_logs_actor_id_fkey(nickname)")
    .eq("pair_room_id", pairRoom.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>审计日志</CardTitle>
          <CardDescription>发起、同意、拒绝、撤回、解绑等操作都会记录在这里。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs?.map((log) => (
            <div key={log.id} className="rounded-2xl bg-muted/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{log.actor?.nickname ?? "未知用户"} · {log.action}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                目标：{log.target_table} / {log.target_id}
              </p>
              <pre className="mt-2 overflow-auto rounded-2xl bg-white p-3 text-xs text-muted-foreground">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
