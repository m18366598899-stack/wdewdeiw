# 情侣积分管理

一个基于 `Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui 风格组件 + Supabase` 的双人共享积分应用。  
支持邮箱登录、邀请码绑定、双人审批、历史记录、审计日志、实时同步和 PWA 安装。

## 最小启动（Mac，新手）

1. **安装 Node.js 20+**（若终端里还没有 `node`）：打开 [https://nodejs.org](https://nodejs.org) 下载 LTS 安装包，一路下一步即可。
2. **准备 Supabase**：在 [Supabase](https://supabase.com) 新建项目，在 SQL Editor 里执行仓库里的 `supabase/schema.sql`，再在项目设置里复制 **Project URL** 和 **anon public key**。
3. 在项目文件夹里执行下面两条命令（第二条里的三个值换成你的）：

```bash
cd 你的项目目录 && cp .env.example .env.local
```

用文本编辑器打开 `.env.local`，把 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 改成 Supabase 控制台里的真实值（`NEXT_PUBLIC_APP_URL` 本地保持 `http://localhost:3000` 即可）。

```bash
npm install && npm run dev
```

4. 浏览器打开 [http://localhost:3000](http://localhost:3000)。

> 不执行 `schema.sql` 时，注册/登录后可能报数据库相关错误，这是正常现象。

## 1. 项目结构

```text
.
├── app
│   ├── (protected)
│   │   ├── approvals/page.tsx
│   │   ├── audit/page.tsx
│   │   ├── history/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── bind/page.tsx
│   ├── login/page.tsx
│   ├── actions.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── manifest.ts
├── components
│   ├── ui
│   ├── app-shell.tsx
│   ├── approval-list.tsx
│   ├── auth-form.tsx
│   ├── bind-panel.tsx
│   ├── bottom-nav.tsx
│   ├── logout-button.tsx
│   ├── pwa-register.tsx
│   ├── realtime-sync.tsx
│   ├── request-dialog.tsx
│   ├── request-list.tsx
│   └── settings-forms.tsx
├── lib
│   ├── supabase
│   ├── auth.ts
│   ├── data.ts
│   ├── types.ts
│   ├── utils.ts
│   └── validations.ts
├── public
│   ├── icons
│   └── sw.js
├── supabase
│   ├── schema.sql
│   └── seed.sql
├── .env.example
├── components.json
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## 2. 功能说明

- 双人共享同一个积分空间
- 邮箱注册 / 登录
- 邀请码绑定伴侣
- 任意一方可发起加分 / 扣分申请
- 申请必须填写备注
- 只有另一方同意后才正式生效
- 支持拒绝、撤回、审计日志
- 历史记录按状态 / 类型筛选
- 总积分由数据库已生效记录汇总计算
- Supabase Realtime 实时刷新
- 支持移动端底部导航
- 支持 PWA 安装

## 3. 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填写以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. 本地启动

先确保本机已安装：

- Node.js 20+
- npm 10+ 或 pnpm / yarn

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 5. Supabase 配置

### 5.1 新建项目

在 Supabase 控制台创建一个新项目，并获取：

- `Project URL`
- `anon public key`

### 5.2 执行数据库脚本

在 Supabase SQL Editor 中按顺序执行：

1. `supabase/schema.sql`
2. `supabase/seed.sql`（可选，导入测试数据前请先替换用户 UUID）

### 5.3 打开 Realtime

在 Supabase 控制台为以下表开启 Realtime：

- `point_requests`
- `approvals`
- `audit_logs`

## 6. 数据库设计

### `auth.users`

Supabase 内置认证用户表，`public.profiles` 通过触发器自动同步基础信息。

### `profiles`

- `id uuid primary key references auth.users(id)`
- `email text`
- `nickname text`
- `avatar_url text`
- `pair_room_id uuid`
- `created_at timestamptz`
- `updated_at timestamptz`

### `pair_rooms`

- `id uuid primary key`
- `member_a uuid`
- `member_b uuid nullable`
- `unit_name text`
- `status text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `invitations`

- `id uuid primary key`
- `pair_room_id uuid`
- `code text unique`
- `inviter_id uuid`
- `invitee_id uuid nullable`
- `status text`
- `expires_at timestamptz`
- `created_at timestamptz`
- `accepted_at timestamptz nullable`

### `point_requests`

- `id uuid primary key`
- `pair_room_id uuid`
- `request_type text`
- `points integer`
- `note text`
- `initiated_by uuid`
- `status text`
- `correction_for_request_id uuid nullable`
- `effective_at timestamptz nullable`
- `approved_at timestamptz nullable`
- `rejected_at timestamptz nullable`
- `cancelled_at timestamptz nullable`
- `created_at timestamptz`
- `updated_at timestamptz`

### `approvals`

- `id uuid primary key`
- `point_request_id uuid`
- `approver_id uuid`
- `decision text`
- `decided_at timestamptz nullable`
- `created_at timestamptz`
- `updated_at timestamptz`
- `unique(point_request_id, approver_id)`

### `audit_logs`

- `id uuid primary key`
- `pair_room_id uuid`
- `actor_id uuid`
- `action text`
- `target_table text`
- `target_id uuid`
- `metadata jsonb`
- `created_at timestamptz`

### `pair_room_balances` 视图

只统计 `point_requests.status = 'approved'` 的数据，前端不直接维护余额。

## 7. 核心安全设计

- 使用 Supabase RLS 限制数据访问范围
- 只有共享空间内的两位用户能读取房间相关数据
- 审批逻辑通过 PostgreSQL `RPC` 原子执行
- 审批函数使用 `FOR UPDATE` 锁行，避免重复点击和并发审批
- 发起人不能审批自己的记录，因为审批人由数据库自动指定为另一位成员
- 备注必填，数据库和前端双重校验
- 总积分只来源于数据库已通过记录汇总
- 解绑、撤回、审批都会写入审计日志

## 8. 关键业务流

### 邀请绑定

1. 用户 A 注册登录
2. 点击生成邀请码
3. 数据库创建 `pair_room + invitation`
4. 用户 B 登录并输入邀请码
5. 数据库将 B 绑定为 `member_b`
6. 空间变为 `active`

### 发起申请

1. 任意一方提交加分或扣分申请
2. 数据库写入 `point_requests`
3. 自动创建一条 `approvals`
4. 申请状态为 `pending`

### 审批生效

1. 另一方查看待审批列表
2. 点击同意或拒绝
3. `decide_point_request()` 原子更新审批和申请
4. 若同意，记录立即计入余额视图
5. 若拒绝，只保留结果和日志，不影响余额

### 撤回申请

1. 发起人仅能撤回 `pending` 状态记录
2. 数据库同步变更申请状态并关闭审批
3. 审计日志记录撤回动作

## 9. UI 风格

- 柔和暖色：奶油白、浅米黄、淡粉、浅蓝
- 大圆角卡片、轻阴影、更多留白
- 线条小狗风图标和插画气质
- 桌面端左侧导航，移动端底部导航
- 审批、提交等关键动作带二次确认

## 10. 部署到 Vercel

1. 将项目上传到 GitHub
2. 在 Vercel 导入仓库
3. 在 Vercel 项目设置中配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. 部署完成后把 `NEXT_PUBLIC_APP_URL` 更新成线上域名
5. 在 Supabase Auth URL Configuration 中添加：
   - 本地地址 `http://localhost:3000`
   - 线上地址 `https://your-domain.vercel.app`

## 11. 测试建议

### 关键业务流程测试

- 用户 A 注册并登录成功
- 用户 A 生成邀请码成功
- 用户 B 输入邀请码后绑定成功
- 双方首页看到同一余额和同一历史
- A 发起申请后 B 能立即看到待审批项
- B 同意后首页余额正确变化
- B 拒绝后余额不变且历史状态正确
- A 撤回待审批申请后状态更新正确

### 双人审批流程测试场景

- A 发起加分，B 同意
- A 发起扣分，B 拒绝
- B 发起申请，A 同意
- 已生效记录发起修正申请并再次审批

### 并发和重复点击测试

- B 在审批页连续快速点击两次“同意”
- A 和 B 同时刷新页面再重复操作
- 同一申请在一个设备已处理后，另一设备再次点击审批
- 发起人重复提交相同申请，确认数据库是否生成独立记录并保持状态正确

### 权限测试场景

- 非共享空间用户尝试读取别人的房间数据
- 非审批人尝试调用审批 RPC
- 已绑定用户再次加入别的邀请码
- 用户试图通过前端篡改 `pair_room_id`
- 用户尝试修改不属于自己的资料

### 移动端适配检查项

- iPhone / Android 常见宽度下布局不溢出
- 底部导航点击区域足够大
- 弹窗在小屏下完整可滚动
- 表单输入和按钮不会紧贴屏幕边缘
- 审计日志 JSON 区域可横向滚动

## 12. 注意事项

- 本项目默认使用 Supabase 邮箱密码登录
- 如果开启邮箱确认，请完成邮箱验证后再登录
- `seed.sql` 里的 UUID 必须换成你自己项目中的真实用户 ID
- 如需头像上传到 Supabase Storage，可在后续扩展 `storage.objects` 策略和上传组件

## 13. 后续可扩展方向

- 申请详情评论
- 修正申请专用表单
- 审批理由输入
- 通知中心
- 图表统计
- 多主题切换
