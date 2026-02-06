-- Ensure stores.name is unique for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_name_unique ON stores (name);
