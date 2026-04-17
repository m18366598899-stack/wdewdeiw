import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section className="hidden rounded-[2rem] border border-border bg-white/70 p-10 shadow-soft lg:block">
          <p className="mb-4 text-sm text-muted-foreground">温柔、清楚、共同确认</p>
          <h1 className="text-5xl font-semibold leading-tight">把每一次加分和扣分，都认真记录下来。</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            这是一个为两个人设计的共享积分空间。每条变动都需要备注，每次生效都需要双方确认，实时同步，也保留完整审计轨迹。
          </p>
        </section>

        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}
