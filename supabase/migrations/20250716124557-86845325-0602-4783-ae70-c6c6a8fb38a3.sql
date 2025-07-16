-- Update hero_image content to include video settings
UPDATE public.website_content 
SET content = jsonb_set(
  content,
  '{video_enabled}',
  'false'
) || jsonb_build_object(
  'video_url', '',
  'video_poster', '/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png'
)
WHERE section = 'hero_image';