import { redirect } from "next/navigation";
import { BindPanel } from "@/components/bind-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext } from "@/lib/data";

export default async function BindPage({
  searchParams
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { profile, pairRoom } = await getViewerContext();
  const { code = "" } = await searchParams;

  if (profile.pair_room_id && pairRoom?.status === "active") {
    redirect("/");
  }

  const isWaitingForPartner = profile.pair_room_id && pairRoom?.status !== "active";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 md:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="puppy-doodle">
          <CardHeader>
            <CardTitle className="text-3xl">绑定伴侣</CardTitle>
            <CardDescription>
              先生成邀请码，或输入对方的邀请码。绑定完成后，你们会共享同一个积分空间，看到同一份记录和总分。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>1. 邀请方生成邀请码。</p>
            <p>2. 被邀请方输入邀请码加入。</p>
            <p>3. 绑定后双方都可以发起申请，但任何积分变动都必须经由对方确认。</p>
            <p>4. 所有操作都会写入审计日志，避免误会，也方便回看。</p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {isWaitingForPartner ? (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle>等待另一位加入</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                当前共享空间已创建，但尚未完成双人绑定。请生成邀请码并将邀请码发送给对方，或者让对方输入你的邀请码加入。
              </CardContent>
            </Card>
          ) : null}

          <BindPanel initialCode={code} />
        </div>
      </div>
    </main>
  );
}
