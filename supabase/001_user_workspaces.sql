-- GrowthPlan tahap 5: satu workspace tervalidasi pada aplikasi per pemilik akun.
-- Jalankan melalui Supabase SQL Editor sekali untuk project baru (atau migration CLI).
create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version bigint not null default 1 check (version > 0),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);

create index if not exists user_workspaces_updated_idx on public.user_workspaces (updated_at desc);
alter table public.user_workspaces enable row level security;

-- Browser hanya menerima publishable key; tidak ada akses anonim.
revoke all on table public.user_workspaces from anon, authenticated;
grant select, insert, update on table public.user_workspaces to authenticated;

create policy "owner_select_workspace"
  on public.user_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner_insert_workspace"
  on public.user_workspaces for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "owner_update_workspace"
  on public.user_workspaces for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Tidak menambahkan DELETE policy untuk client: penghapusan data dilakukan
-- dengan menyimpan workspace kosong, bukan menghapus row milik pengguna.
