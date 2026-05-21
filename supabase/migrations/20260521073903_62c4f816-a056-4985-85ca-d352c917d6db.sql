-- Add separate address columns
ALTER TABLE public.invoices
  ADD COLUMN client_street text,
  ADD COLUMN client_suburb text,
  ADD COLUMN client_city text,
  ADD COLUMN client_postal_code text;

-- Migrate existing client_address data (split by newlines)
UPDATE public.invoices
SET
  client_street = split_part(client_address, E'\n', 1),
  client_suburb = split_part(client_address, E'\n', 2),
  client_city = split_part(client_address, E'\n', 3),
  client_postal_code = split_part(client_address, E'\n', 4)
WHERE client_address IS NOT NULL AND client_address <> '';

-- Drop the old combined column
ALTER TABLE public.invoices DROP COLUMN client_address;