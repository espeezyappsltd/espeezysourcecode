-- MARKETING ORCHESTRATION ENGINE
-- CREATE PLATFORM CONFIG TABLE FOR REAL-TIME TUNING

CREATE TABLE IF NOT EXISTS platform_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS POLICIES
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read the marketing configuration
CREATE POLICY "Public Read Access" 
ON platform_config FOR SELECT 
USING (true);

-- 2. Only Admins can update the orchestration metrics
CREATE POLICY "Admin Control Access" 
ON platform_config FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- INITIAL SEED DATA
INSERT INTO platform_config (key, value, is_active)
VALUES 
    ('main_banner', '{"text": "30% OFF ALL CLEARANCE TIERS", "code": "ELITE30", "expiry": "August 31st"}', true),
    ('global_announcement', '{"title": "Institutional Upgrade", "message": "Espeezy nodes have been upgraded to Bank-Level Security.", "style": "elite"}', false),
    ('promo_logic', '{"discount_percent": 30, "is_global": true}', true)
ON CONFLICT (key) DO NOTHING;
