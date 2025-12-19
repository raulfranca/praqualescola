-- Add address column to existing table
ALTER TABLE address_distance_cache
ADD COLUMN address text;

-- Add index for text search (useful for future queries)
CREATE INDEX idx_address_text ON address_distance_cache USING gin(to_tsvector('portuguese', address));