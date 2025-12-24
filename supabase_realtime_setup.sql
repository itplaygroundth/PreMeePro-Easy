-- Enable Realtime for the production jobs table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

begin;
-- Add the table to the 'supabase_realtime' publication
alter publication supabase_realtime add table pari_production_jobs;

-- If you want to enable it for other tables:
-- alter publication supabase_realtime add table pari_production_steps;
-- alter publication supabase_realtime add table pari_production_templates;
commit;