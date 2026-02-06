-- Add store_id to store_profiles if missing (legacy installs)
ALTER TABLE store_profiles
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_profiles_store_platform_handle
  ON store_profiles (store_id, platform, handle);
