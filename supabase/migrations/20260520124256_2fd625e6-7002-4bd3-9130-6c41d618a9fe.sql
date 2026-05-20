ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS address text;