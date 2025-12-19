-- Drop old table
DROP TABLE IF EXISTS address_distance_cache CASCADE;

-- Create new denormalized table
CREATE TABLE address_distance_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location coordinates (rounded to 7 decimals)
  lat numeric(10,7) NOT NULL,
  lng numeric(10,7) NOT NULL,
  
  -- All schools stored in JSONB (denormalized)
  -- Format: {"1": {"km": 44.31, "min": 41}, "2": {"km": 55.52, "min": 53}, ...}
  distances jsonb NOT NULL,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  access_count integer DEFAULT 1,
  last_accessed_at timestamp with time zone DEFAULT now(),
  
  -- One row per address (unique constraint)
  UNIQUE(lat, lng)
);

-- Index for fast geospatial lookup
CREATE INDEX idx_address_location ON address_distance_cache(lat, lng);

-- Optional: GIN index for JSONB queries (if needed in future)
CREATE INDEX idx_distances_jsonb ON address_distance_cache USING gin(distances);

-- Enable RLS
ALTER TABLE address_distance_cache ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access"
  ON address_distance_cache
  FOR SELECT
  TO public
  USING (true);

-- Public insert access
CREATE POLICY "Public insert access"
  ON address_distance_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Public update access (for access_count increment)
CREATE POLICY "Public update access"
  ON address_distance_cache
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);