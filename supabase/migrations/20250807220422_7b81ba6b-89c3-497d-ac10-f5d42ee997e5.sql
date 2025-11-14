
-- 1) Remove duplicates in app_settings (keep the most recent per category/key)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY category, key
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.app_settings
)
DELETE FROM public.app_settings a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

-- 2) Enforce uniqueness on (category, key)
ALTER TABLE public.app_settings
  ADD CONSTRAINT app_settings_category_key_unique UNIQUE (category, key);

-- 3) Ensure a 'site_branding' row exists for language 'en'
INSERT INTO public.website_content (section, language, content)
SELECT 'site_branding', 'en', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.website_content
  WHERE section = 'site_branding' AND language = 'en'
);

-- 4) Backfill website_content.content.favicon_url from app_settings if empty
UPDATE public.website_content wc
SET content = jsonb_set(COALESCE(wc.content, '{}'::jsonb), '{favicon_url}', app.value, true)
FROM public.app_settings app
WHERE wc.section = 'site_branding'
  AND wc.language = 'en'
  AND app.category = 'branding'
  AND app.key = 'favicon_url'
  AND (wc.content->>'favicon_url' IS NULL OR wc.content->>'favicon_url' = '');
