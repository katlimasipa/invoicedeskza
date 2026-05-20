ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_address text;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS address;
ALTER TABLE public.company_settings DROP COLUMN IF EXISTS address;