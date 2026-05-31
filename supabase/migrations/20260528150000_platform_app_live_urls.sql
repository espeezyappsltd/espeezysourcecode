-- Align platform_apps live_url with canonical production hostnames.

UPDATE public.platform_apps
SET live_url = 'https://devlaunch.espeezy.com',
    updated_at = now()
WHERE slug = 'core';

UPDATE public.platform_apps
SET live_url = 'https://studios.espeezy.com',
    tagline = 'Marketplace, jobs, and campus media hub.',
    updated_at = now()
WHERE slug = 'studios';
