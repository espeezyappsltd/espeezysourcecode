-- Scale-friendly indexes for hustle tasks & marketplace listings (search + category + cursor pagination)

CREATE INDEX IF NOT EXISTS hustle_tasks_status_created_idx
  ON public.hustle_tasks (status, created_at DESC);

CREATE INDEX IF NOT EXISTS hustle_tasks_category_status_created_idx
  ON public.hustle_tasks (category, status, created_at DESC);

CREATE INDEX IF NOT EXISTS hustle_tasks_poster_created_idx
  ON public.hustle_tasks (poster_id, created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_listings_status_created_idx
  ON public.marketplace_listings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_listings_category_status_created_idx
  ON public.marketplace_listings (category, status, created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_listings_owner_created_idx
  ON public.marketplace_listings (owner_id, created_at DESC);
