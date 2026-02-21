-- Run this once in the Supabase SQL Editor for the MyEzz_Restaurants project.
-- Dashboard → SQL Editor → New Query → paste → Run

create table if not exists public.restaurant_applications (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz default now(),

  -- Step 1: Restaurant details
  restaurant_name  text        not null,
  cuisine_type     text        not null,
  address          text        not null,
  primary_contact  text        not null,

  -- Step 2: Owner & contact
  owner_name       text        not null,
  email            text        not null,
  owner_phone      text        not null,
  whatsapp_updates boolean     default true,

  -- Step 3: Document paths inside the 'restaurant-docs' storage bucket
  -- e.g. "1708511234000_pan.pdf"  (use Supabase Storage → restaurant-docs to view files)
  doc_pan          text,
  doc_fssai        text,
  doc_gst          text,
  doc_bank         text,

  -- Application status (pending → approved / rejected by admin)
  status           text        default 'pending'
);

-- Optional: index on email for quick lookups
create index if not exists idx_restaurant_applications_email
  on public.restaurant_applications (email);

-- Row Level Security — expose table to authenticated users / service role only.
-- The anon key used by the registration form can INSERT but not SELECT.
alter table public.restaurant_applications enable row level security;

create policy "Allow anon insert" on public.restaurant_applications
  for insert
  to anon
  with check (true);

create policy "Allow authenticated read" on public.restaurant_applications
  for select
  to authenticated
  using (true);
