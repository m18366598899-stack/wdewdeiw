"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Link2, Loader2, Ticket } from "lucide-react";
import { createInvitationAction, joinInvitationAction } from "@/app/actions";
import { buildInviteUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BindPanel({ initialCode = "" }: { initialCode?: string }) {
  const [joinCode, setJoinCode] = useState(initialCode);
  const [generatedCode, setGeneratedCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const inviteUrl = useMemo(
    () => (generatedCode ? buildInviteUrl(generatedCode) : ""),
    [generatedCode]
  );

  function generate() {
    startTransition(async () => {
      const result = await createInvitationAction();
      setMessage(result.message);
      if (result.code) {
        setGeneratedCode(result.code);
      }
    });
  }

  function join() {
    startTransition(async () => {
      const result = await joinInvitationAction({ code: joinCode });
      setMessage(result.message);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            生成邀请码
          </CardTitle>
          <CardDescription>你发起邀请后，对方输入邀请码即可绑定到同一个共享积分空间。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" disabled={pending} onClick={generate}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "生成新的邀请码"}
          </Button>

          {generatedCode ? (
            <div className="space-y-3 rounded-2xl bg-muted p-4">
              <div>
                <p className="text-sm text-muted-foreground">邀请码</p>
                <p className="text-3xl font-semibold tracking-[0.3em]">{generatedCode}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm text-muted-foreground">{inviteUrl}</div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedCode);
                    setMessage("邀请码已复制。");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制邀请码
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteUrl);
                    setMessage("邀请链接已复制。");
                  }}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  复制链接
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>输入邀请码</CardTitle>
          <CardDescription>如果对方已经发来了邀请码，你可以直接加入同一空间。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">邀请码</Label>
            <Input
              id="invite-code"
              placeholder="例如：A1B2C3"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
          </div>
          <Button className="w-full" disabled={pending || !joinCode.trim()} onClick={join}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "加入共享空间"}
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
