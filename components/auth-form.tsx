"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { authSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    const values = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || "")
    };

    const parsed = authSchema.safeParse(values);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "请检查输入");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword(parsed.data)
        : supabase.auth.signUp({
            ...parsed.data,
            options: {
              emailRedirectTo: `${window.location.origin}/login`
            }
          });

    const { error } = await action;
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(mode === "register" ? "注册成功，请查收邮箱验证链接或直接登录。" : "登录成功，准备跳转中...");
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">情侣积分管理</CardTitle>
        <CardDescription>温柔地记录每一次加分、扣分和认真确认。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          <button
            className={`rounded-2xl px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-white shadow-sm" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            登录
          </button>
          <button
            className={`rounded-2xl px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-white shadow-sm" : ""}`}
            onClick={() => setMode("register")}
            type="button"
          >
            注册
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await handleSubmit(new FormData(event.currentTarget));
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" name="email" placeholder="name@example.com" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" placeholder="至少 6 位" type="password" required />
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "登录并继续" : "注册账号"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
