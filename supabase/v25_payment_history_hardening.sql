-- Migration: v25_payment_history_hardening
-- Description: Add invoice numbers AND ensures last_seen tracking is active.

-- 1. Ensure last_seen column exists for the WhatsApp experience
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Add invoice number to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;

-- 3. Create function to generate professional invoice numbers (e.g., GF-2026-XXXX)
CREATE OR REPLACE FUNCTION generate_invoice_number() 
RETURNS TEXT AS $$
DECLARE
    new_num TEXT;
    done BOOL := false;
BEGIN
    WHILE NOT done LOOP
        new_num := 'GF-' || to_char(now(), 'YYYY') || '-' || LPAD(floor(random() * 1000000)::text, 6, '0');
        done := NOT EXISTS (SELECT 1 FROM public.payments WHERE invoice_number = new_num);
    END LOOP;
    RETURN new_num;
END;
$$ LANGUAGE plpgsql;

-- 4. Update existing payments with invoice numbers
UPDATE public.payments SET invoice_number = generate_invoice_number() WHERE invoice_number IS NULL;

-- 5. Final verification comment 
COMMENT ON COLUMN public.profiles.last_seen IS 'Used for real-time WhatsApp-style presence tracking.';
