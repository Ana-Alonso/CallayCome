create table if not exists public.recipe_suggestion_votes (
  suggestion_id bigint references public.recipe_suggestions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vote text check (vote in ('like', 'dislike')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (suggestion_id, user_id)
);

alter table public.recipe_suggestion_votes disable row level security;
