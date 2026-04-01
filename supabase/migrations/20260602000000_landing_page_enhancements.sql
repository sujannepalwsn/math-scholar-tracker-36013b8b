-- Migration to add footer links and section toggles to login_page_settings
-- Date: 2026-06-02

ALTER TABLE public.login_page_settings
ADD COLUMN IF NOT EXISTS footer_links jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS section_toggles jsonb DEFAULT '{"show_features": true, "show_packages": true, "show_stats": true, "show_footer": true}';

-- Update existing records with default footer links
UPDATE public.login_page_settings
SET footer_links = '[
  {"title": "Product", "links": [{"label": "Features", "href": "#features"}, {"label": "Pricing", "href": "#packages"}, {"label": "Testimonials", "href": "#"}]},
  {"title": "Support", "links": [{"label": "Help Center", "href": "#"}, {"label": "API Docs", "href": "#"}, {"label": "Security", "href": "#"}]},
  {"title": "Company", "links": [{"label": "About Us", "href": "#about"}, {"label": "Contact", "href": "#"}, {"label": "Privacy", "href": "#"}]}
]'::jsonb
WHERE footer_links IS NULL OR footer_links = '[]'::jsonb;
