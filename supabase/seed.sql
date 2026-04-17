-- 先在 Supabase Auth 中创建两个测试账号，再把下面的 UUID 替换成真实 auth.users.id
-- 示例邮箱：
-- tester-a@example.com
-- tester-b@example.com

begin;

insert into public.profiles (id, email, nickname)
values
  ('11111111-1111-1111-1111-111111111111', 'tester-a@example.com', '小满'),
  ('22222222-2222-2222-2222-222222222222', 'tester-b@example.com', '阿秋')
on conflict (id) do update
set email = excluded.email,
    nickname = excluded.nickname;

insert into public.pair_rooms (id, member_a, member_b, unit_name, status)
values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '小红花', 'active')
on conflict (id) do nothing;

update public.profiles
set pair_room_id = '33333333-3333-3333-3333-333333333333'
where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

insert into public.point_requests (id, pair_room_id, request_type, points, note, initiated_by, status, approved_at, effective_at)
values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'credit', 5, '主动整理了客厅和餐桌', '11111111-1111-1111-1111-111111111111', 'approved', timezone('utc', now()) - interval '2 day', timezone('utc', now()) - interval '2 day'),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'debit', 2, '约会迟到十分钟', '22222222-2222-2222-2222-222222222222', 'pending', null, null)
on conflict (id) do nothing;

insert into public.approvals (id, point_request_id, approver_id, decision, decided_at)
values
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'approved', timezone('utc', now()) - interval '2 day'),
  ('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'pending', null)
on conflict (point_request_id, approver_id) do nothing;

insert into public.audit_logs (pair_room_id, actor_id, action, target_table, target_id, metadata)
values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'point_request_created', 'point_requests', '44444444-4444-4444-4444-444444444444', '{"request_type":"credit","points":5}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'point_request_approved', 'point_requests', '44444444-4444-4444-4444-444444444444', '{"approval_id":"66666666-6666-6666-6666-666666666666"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'point_request_created', 'point_requests', '55555555-5555-5555-5555-555555555555', '{"request_type":"debit","points":2}'::jsonb)
on conflict do nothing;

commit;
