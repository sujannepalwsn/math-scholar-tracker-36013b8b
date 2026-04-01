-- Enhance login_page_settings for landing page content
ALTER TABLE public.login_page_settings
ADD COLUMN IF NOT EXISTS background_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS developer_info jsonb DEFAULT '{"name": "Your Company", "website": "https://example.com", "copyright": "© 2024 Your Company. All rights reserved."}',
ADD COLUMN IF NOT EXISTS help_info jsonb DEFAULT '{"text": "Need help?", "link": "#"}',
ADD COLUMN IF NOT EXISTS marketing_title text DEFAULT 'The Ultimate School Management Solution',
ADD COLUMN IF NOT EXISTS marketing_subtitle text DEFAULT 'Streamline your educational institution with our comprehensive ERP platform.',
ADD COLUMN IF NOT EXISTS footer_links jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS section_toggles jsonb DEFAULT '{"show_features": true, "show_packages": true, "show_stats": true, "show_footer": true}';

-- Update existing records with background_urls if background_url exists
UPDATE public.login_page_settings
SET background_urls = ARRAY[background_url]
WHERE background_url IS NOT NULL AND (background_urls IS NULL OR array_length(background_urls, 1) IS NULL);

-- Update existing records with default footer links
UPDATE public.login_page_settings
SET footer_links = '[
  {"title": "Product", "links": [{"label": "Features", "href": "#features"}, {"label": "Pricing", "href": "#packages"}, {"label": "Testimonials", "href": "#"}]},
  {"title": "Support", "links": [{"label": "Help Center", "href": "#"}, {"label": "API Docs", "href": "#"}, {"label": "Security", "href": "#"}]},
  {"title": "Company", "links": [{"label": "About Us", "href": "#about"}, {"label": "Contact", "href": "#"}, {"label": "Privacy", "href": "#"}]}
]'::jsonb
WHERE footer_links IS NULL OR footer_links = '[]'::jsonb;
