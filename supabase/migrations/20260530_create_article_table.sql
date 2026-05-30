-- Migration: Create article table for Supabase
CREATE TABLE IF NOT EXISTS public.article (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  metaTitle text,
  metaDescription text,
  metaImage text,
  authorAvatar text,
  category text,
  tags text[],
  createdAt timestamptz NOT NULL DEFAULT now(),
  updatedAt timestamptz NOT NULL DEFAULT now()
);

-- Index for createdAt (for sorting by latest)
CREATE INDEX IF NOT EXISTS idx_article_createdAt ON public.article(createdAt DESC);

-- Trigger to update updatedAt on row update
CREATE OR REPLACE FUNCTION update_updatedAt_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updatedAt_article ON public.article;
CREATE TRIGGER set_updatedAt_article
BEFORE UPDATE ON public.article
FOR EACH ROW EXECUTE PROCEDURE update_updatedAt_column();
