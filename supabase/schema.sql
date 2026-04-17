create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text not null default '新伙伴',
  avatar_url text,
  pair_room_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pair_rooms (
  id uuid primary key default gen_random_uuid(),
  member_a uuid not null references auth.users(id) on delete restrict,
  member_b uuid references auth.users(id) on delete restrict,
  unit_name text not null default '积分',
  status text not null default 'pending_pairing' check (status in ('pending_pairing', 'active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint pair_members_unique check (member_a is distinct from member_b)
);

alter table public.profiles
  add constraint profiles_pair_room_id_fkey
  foreign key (pair_room_id) references public.pair_rooms(id) on delete set null;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  pair_room_id uuid not null references public.pair_rooms(id) on delete cascade,
  code text not null unique,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz
);

create table if not exists public.point_requests (
  id uuid primary key default gen_random_uuid(),
  pair_room_id uuid not null references public.pair_rooms(id) on delete cascade,
  request_type text not null check (request_type in ('credit', 'debit', 'correction')),
  points integer not null check (points > 0),
  note text not null check (char_length(trim(note)) > 0),
  initiated_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  correction_for_request_id uuid references public.point_requests(id) on delete restrict,
  effective_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  point_request_id uuid not null references public.point_requests(id) on delete cascade,
  approver_id uuid not null references auth.users(id) on delete restrict,
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (point_request_id, approver_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  pair_room_id uuid not null references public.pair_rooms(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_table text not null,
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_pair_room_id on public.profiles(pair_room_id);
create index if not exists idx_pair_rooms_members on public.pair_rooms(member_a, member_b);
create index if not exists idx_invitations_pair_room_id on public.invitations(pair_room_id);
create index if not exists idx_invitations_status_expires on public.invitations(status, expires_at desc);
create index if not exists idx_point_requests_pair_room_status on public.point_requests(pair_room_id, status, created_at desc);
create index if not exists idx_point_requests_initiated_by on public.point_requests(initiated_by, created_at desc);
create index if not exists idx_approvals_approver_decision on public.approvals(approver_id, decision, created_at desc);
create index if not exists idx_audit_logs_pair_room_created on public.audit_logs(pair_room_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists pair_rooms_set_updated_at on public.pair_rooms;
create trigger pair_rooms_set_updated_at
before update on public.pair_rooms
for each row execute function public.set_updated_at();

drop trigger if exists point_requests_set_updated_at on public.point_requests;
create trigger point_requests_set_updated_at
before update on public.point_requests
for each row execute function public.set_updated_at();

drop trigger if exists approvals_set_updated_at on public.approvals;
create trigger approvals_set_updated_at
before update on public.approvals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(split_part(new.email, '@', 1), '新伙伴')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.get_current_pair_room_id()
returns uuid
language sql
stable
as $$
  select pair_room_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_pair_member(target_pair_room_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and pair_room_id = target_pair_room_id
  );
$$;

create or replace view public.pair_room_balances as
select
  pair_room_id,
  coalesce(sum(
    case
      when request_type = 'debit' then points * -1
      else points
    end
  ), 0)::integer as total_points
from public.point_requests
where status = 'approved'
group by pair_room_id;

alter table public.profiles enable row level security;
alter table public.pair_rooms enable row level security;
alter table public.invitations enable row level security;
alter table public.point_requests enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_own_or_pair" on public.profiles;
create policy "profiles_select_own_or_pair"
on public.profiles
for select
using (
  id = auth.uid()
  or (
    pair_room_id is not null
    and public.is_pair_member(pair_room_id)
  )
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "pair_rooms_select_members" on public.pair_rooms;
create policy "pair_rooms_select_members"
on public.pair_rooms
for select
using (public.is_pair_member(id));

drop policy if exists "pair_rooms_update_members" on public.pair_rooms;
create policy "pair_rooms_update_members"
on public.pair_rooms
for update
using (public.is_pair_member(id))
with check (public.is_pair_member(id));

drop policy if exists "invitations_select_members" on public.invitations;
create policy "invitations_select_members"
on public.invitations
for select
using (
  inviter_id = auth.uid()
  or invitee_id = auth.uid()
  or public.is_pair_member(pair_room_id)
);

drop policy if exists "point_requests_select_members" on public.point_requests;
create policy "point_requests_select_members"
on public.point_requests
for select
using (public.is_pair_member(pair_room_id));

drop policy if exists "approvals_select_members" on public.approvals;
create policy "approvals_select_members"
on public.approvals
for select
using (
  exists (
    select 1
    from public.point_requests pr
    where pr.id = point_request_id
      and public.is_pair_member(pr.pair_room_id)
  )
);

drop policy if exists "audit_logs_select_members" on public.audit_logs;
create policy "audit_logs_select_members"
on public.audit_logs
for select
using (public.is_pair_member(pair_room_id));

create or replace function public.create_invitation_code()
returns table(code text, invitation_id uuid, pair_room_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
  existing_pair_room_id uuid;
  existing_room public.pair_rooms%rowtype;
  new_pair_room_id uuid;
  new_code text;
  new_invitation_id uuid;
begin
  if viewer_id is null then
    raise exception '请先登录';
  end if;

  select p.pair_room_id into existing_pair_room_id
  from public.profiles p
  where p.id = viewer_id
  for update;

  if existing_pair_room_id is not null then
    select *
    into existing_room
    from public.pair_rooms
    where id = existing_pair_room_id
    for update;

    if existing_room.status = 'active' then
      raise exception '你已经在共享空间中了';
    end if;

    if existing_room.member_a <> viewer_id or existing_room.member_b is not null then
      raise exception '当前绑定状态异常，请先解绑后再试';
    end if;

    update public.invitations
    set status = 'revoked'
    where public.invitations.pair_room_id = existing_pair_room_id
      and status = 'active';

    new_pair_room_id := existing_pair_room_id;
  else
    insert into public.pair_rooms (member_a, status)
    values (viewer_id, 'pending_pairing')
    returning id into new_pair_room_id;

    update public.profiles
    set pair_room_id = new_pair_room_id
    where id = viewer_id;
  end if;

  loop
    new_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
    exit when not exists (
      select 1 from public.invitations where public.invitations.code = new_code and status = 'active'
    );
  end loop;

  insert into public.invitations (pair_room_id, code, inviter_id, expires_at)
  values (new_pair_room_id, new_code, viewer_id, timezone('utc', now()) + interval '7 days')
  returning id into new_invitation_id;

  insert into public.audit_logs (pair_room_id, actor_id, action, target_table, target_id, metadata)
  values (
    new_pair_room_id,
    viewer_id,
    'invitation_created',
    'invitations',
    new_invitation_id,
    jsonb_build_object('code', new_code)
  );

  return query select new_code, new_invitation_id, new_pair_room_id;
end;
$$;

create or replace function public.join_invitation_code(input_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
  viewer_pair_room_id uuid;
  invitation_row public.invitations%rowtype;
begin
  if viewer_id is null then
    raise exception '请先登录';
  end if;

  select public.profiles.pair_room_id into viewer_pair_room_id
  from public.profiles
  where id = viewer_id
  for update;

  if viewer_pair_room_id is not null then
    raise exception '你已经加入了一个共享空间';
  end if;

  select *
  into invitation_row
  from public.invitations
  where public.invitations.code = upper(trim(input_code))
    and status = 'active'
    and expires_at > timezone('utc', now())
  for update;

  if not found then
    raise exception '邀请码无效或已过期';
  end if;

  if invitation_row.inviter_id = viewer_id then
    raise exception '不能输入自己生成的邀请码';
  end if;

  update public.pair_rooms
  set member_b = viewer_id,
      status = 'active'
  where id = invitation_row.pair_room_id
    and member_b is null
    and status = 'pending_pairing';

  if not found then
    raise exception '该邀请码已经被使用或空间状态异常';
  end if;

  update public.profiles
  set pair_room_id = invitation_row.pair_room_id
  where id in (viewer_id, invitation_row.inviter_id);

  update public.invitations
  set status = 'accepted',
      invitee_id = viewer_id,
      accepted_at = timezone('utc', now())
  where id = invitation_row.id;

  insert into public.audit_logs (pair_room_id, actor_id, action, target_table, target_id, metadata)
  values (
    invitation_row.pair_room_id,
    viewer_id,
    'pair_room_joined',
    'pair_rooms',
    invitation_row.pair_room_id,
    jsonb_build_object('invitation_id', invitation_row.id)
  );

  return invitation_row.pair_room_id;
end;
$$;

create or replace function public.create_point_request(
  input_pair_room_id uuid,
  input_request_type text,
  input_points integer,
  input_note text,
  input_correction_for_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
  room_row public.pair_rooms%rowtype;
  approver_id uuid;
  new_request_id uuid;
begin
  if viewer_id is null then
    raise exception '请先登录';
  end if;

  if input_request_type not in ('credit', 'debit', 'correction') then
    raise exception '申请类型不正确';
  end if;

  if input_points is null or input_points <= 0 then
    raise exception '分值必须为正整数';
  end if;

  if char_length(trim(coalesce(input_note, ''))) = 0 then
    raise exception '备注不能为空';
  end if;

  select *
  into room_row
  from public.pair_rooms
  where id = input_pair_room_id
    and status = 'active'
  for update;

  if not found then
    raise exception '共享空间不存在或未完成绑定';
  end if;

  if viewer_id not in (room_row.member_a, room_row.member_b) then
    raise exception '你无权在这个空间发起申请';
  end if;

  approver_id := case when room_row.member_a = viewer_id then room_row.member_b else room_row.member_a end;

  if approver_id is null then
    raise exception '当前空间尚未绑定完成';
  end if;

  if input_request_type = 'correction' and input_correction_for_request_id is null then
    raise exception '修正申请需要关联一条原始记录';
  end if;

  if input_correction_for_request_id is not null then
    perform 1
    from public.point_requests
    where id = input_correction_for_request_id
      and pair_room_id = input_pair_room_id
      and status = 'approved';

    if not found then
      raise exception '修正目标必须是本空间内已生效的记录';
    end if;
  end if;

  insert into public.point_requests (
    pair_room_id,
    request_type,
    points,
    note,
    initiated_by,
    correction_for_request_id
  )
  values (
    input_pair_room_id,
    input_request_type,
    input_points,
    trim(input_note),
    viewer_id,
    input_correction_for_request_id
  )
  returning id into new_request_id;

  insert into public.approvals (point_request_id, approver_id)
  values (new_request_id, approver_id);

  insert into public.audit_logs (pair_room_id, actor_id, action, target_table, target_id, metadata)
  values (
    input_pair_room_id,
    viewer_id,
    'point_request_created',
    'point_requests',
    new_request_id,
    jsonb_build_object(
      'request_type', input_request_type,
      'points', input_points,
      'note', trim(input_note),
      'correction_for_request_id', input_correction_for_request_id
    )
  );

  return new_request_id;
end;
$$;

create or replace function public.decide_point_request(
  input_approval_id uuid,
  input_decision text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
  approval_row public.approvals%rowtype;
  request_row public.point_requests%rowtype;
  new_status text;
begin
  if viewer_id is null then
    raise exception '请先登录';
  end if;

  if input_decision not in ('approved', 'rejected') then
    raise exception '审批结果不正确';
  end if;

  select *
  into approval_row
  from public.approvals
  where id = input_approval_id
  for update;

  if not found then
    raise exception '审批记录不存在';
  end if;

  if approval_row.approver_id <> viewer_id then
    raise exception '你不是这条审批的指定处理人';
  end if;

  if approval_row.decision <> 'pending' then
    raise exception '这条申请已经处理过了，请不要重复点击';
  end if;

  select *
  into request_row
  from public.point_requests
  where id = approval_row.point_request_id
  for update;

  if request_row.status <> 'pending' then
    raise exception '申请状态已变化，请刷新后重试';
  end if;

  update public.approvals
  set decision = input_decision,
      decided_at = timezone('utc', now())
  where id = input_approval_id;

  new_status := case when input_decision = 'approved' then 'approved' else 'rejected' end;

  update public.point_requests
  set status = new_status,
      approved_at = case when input_decision = 'approved' then timezone('utc', now()) else approved_at end,
      effective_at = case when input_decision = 'approved' then timezone('utc', now()) else effective_at end,
      rejected_at = case when input_decision = 'rejected' then timezone('utc', now()) else rejected_at end
  where id = request_row.id;

  insert into public.audit_logs (pair_room_id, actor_id, action, target_table, target_id, metadata)
  values (
    request_row.pair_room_id,
    viewer_id,
    case when input_decision = 'approved' then 'point_request_approved' else 'point_request_rejected' end,
    'point_requests',
    request_row.id,
    jsonb_build_object(
      'approval_id', approval_row.id,
      'initiated_by', request_row.initiated_by,
      'request_type', request_row.request_type,
      'points', request_row.points
    )
  );

  return request_row.id;
end;
$$;

create or replace function public.cancel_point_request(input_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
  request_row public.point_requests%rowtype;
begin
  if viewer_id is null then
    raise exception '请先登录';
  end if;

  select *
  into request_row
  from public.point_requests
  where id = input_request_id
  for update;

  if not found then
    raise exception '申请不存在';
  end if;

  if request_row.initiated_by <> viewer_id then
    raise exception '只有发起人可以撤回自己的申请';
  end if;

  if request_row.status <> 'pending' then
    raise exception '只有待确认的申请才能撤回';
  end if;

  update public.point_requests
  set status = 'cancelled',
      cancelled_at = timezone('utc', now())
  where id = input_request_id;

  update public.approvals
  set decision = 'rejected',
      decided_at = timezone('utc', now())
  where point_request_id = input_request_id
    and decision = 'pending';

  insert into public.audit_logs (pair_room_id, actor_id, action, target_table, target_id, metadata)
  values (
    request_row.pair_room_id,
    viewer_id,
    'point_request_cancelled',
    'point_requests',
    request_row.id,
    jsonb_build_object('status', 'cancelled')
  );

  return request_row.id;
end;
$$;

create or replace function public.archive_pair_room(input_pair_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
begin
  if viewer_id is null then
    raise exception '请先登录';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = viewer_id
      and pair_room_id = input_pair_room_id
  ) then
    raise exception '你无权解绑这个共享空间';
  end if;

  update public.pair_rooms
  set status = 'archived'
  where id = input_pair_room_id;

  update public.profiles
  set pair_room_id = null
  where pair_room_id = input_pair_room_id;

  update public.invitations
  set status = 'revoked'
  where pair_room_id = input_pair_room_id
    and status = 'active';

  insert into public.audit_logs (pair_room_id, actor_id, action, target_table, target_id, metadata)
  values (
    input_pair_room_id,
    viewer_id,
    'pair_room_archived',
    'pair_rooms',
    input_pair_room_id,
    jsonb_build_object('archived_by', viewer_id)
  );

  return true;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on table public.profiles to authenticated;
grant update on table public.profiles to authenticated;
grant select on table public.pair_rooms to authenticated;
grant update on table public.pair_rooms to authenticated;
grant select on table public.invitations to authenticated;
grant select on table public.point_requests to authenticated;
grant select on table public.approvals to authenticated;
grant select on table public.audit_logs to authenticated;
grant select on table public.pair_room_balances to authenticated;
grant execute on function public.create_invitation_code() to authenticated;
grant execute on function public.join_invitation_code(text) to authenticated;
grant execute on function public.create_point_request(uuid, text, integer, text, uuid) to authenticated;
grant execute on function public.decide_point_request(uuid, text) to authenticated;
grant execute on function public.cancel_point_request(uuid) to authenticated;
grant execute on function public.archive_pair_room(uuid) to authenticated;
