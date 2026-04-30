ALTER TABLE "public"."company_settings" ADD COLUMN IF NOT EXISTS "quote_validity" text;
ALTER TABLE "public"."invoices" ADD COLUMN IF NOT EXISTS "quote_validity" text;
