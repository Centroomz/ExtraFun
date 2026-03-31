-- MoreFun - Supabase Schema
-- Run this in Supabase SQL Editor

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  latitude numeric,
  longitude numeric,
  preferences jsonb,
  verified boolean default false,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Public profiles are viewable" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Places (venues)
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text,
  address text,
  city text,
  latitude numeric,
  longitude numeric,
  rating numeric,
  price_range text,
  photos text[],
  opening_hours jsonb,
  website text,
  phone text,
  verified boolean default false,
  emoji text,
  created_at timestamptz default now()
);
alter table places enable row level security;
create policy "Places are publicly viewable" on places for select using (true);

-- Articles
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  content text,
  description text,
  category text,
  reading_time integer,
  published boolean default false,
  created_at timestamptz default now()
);
alter table articles enable row level security;
create policy "Published articles are viewable" on articles for select using (published = true);

-- Dictionary terms
create table if not exists dictionary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  definition text,
  examples text[],
  category text,
  created_at timestamptz default now()
);
alter table dictionary_terms enable row level security;
create policy "Dictionary is public" on dictionary_terms for select using (true);

-- Forum threads
create table if not exists forum_threads (
  id uuid primary key default gen_random_uuid(),
  category text,
  title text not null,
  content text,
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  author_emoji text,
  upvotes integer default 0,
  reply_count integer default 0,
  sticky boolean default false,
  city text,
  created_at timestamptz default now()
);
alter table forum_threads enable row level security;
create policy "Forum threads are public" on forum_threads for select using (true);
create policy "Authenticated users can create threads" on forum_threads for insert with check (auth.uid() = author_id);

-- Forum replies
create table if not exists forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references forum_threads(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  content text not null,
  upvotes integer default 0,
  created_at timestamptz default now()
);
alter table forum_replies enable row level security;
create policy "Forum replies are public" on forum_replies for select using (true);
create policy "Authenticated users can reply" on forum_replies for insert with check (auth.uid() = author_id);

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participants uuid[],
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table conversations enable row level security;
create policy "Participants can view conversations" on conversations for select using (auth.uid() = any(participants));
create policy "Authenticated users can create conversations" on conversations for insert with check (auth.uid() = any(participants));

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "Conversation participants can view messages" on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id and auth.uid() = any(c.participants)
  ));
create policy "Authenticated users can send messages" on messages for insert
  with check (auth.uid() = sender_id);

-- Classifieds
create table if not exists classifieds (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  author_emoji text,
  type text,
  title text not null,
  description text,
  photos text[],
  city text,
  latitude numeric,
  longitude numeric,
  preferences jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz
);
alter table classifieds enable row level security;
create policy "Classifieds are public" on classifieds for select using (true);
create policy "Authenticated users can post classifieds" on classifieds for insert with check (auth.uid() = author_id);
create policy "Authors can update classifieds" on classifieds for update using (auth.uid() = author_id);

-- Enable realtime for forum_threads, forum_replies, messages
alter publication supabase_realtime add table forum_threads;
alter publication supabase_realtime add table forum_replies;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table classifieds;
