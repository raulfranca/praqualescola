-- Add CHECK constraints for geographic validation
-- Pindamonhangaba center: lat -22.92, lng -45.46
-- 60km radius covers: Taubaté, Tremembé, Guaratinguetá, Roseira, Aparecida, etc.

-- First, add CHECK constraints for coordinate validation
ALTER TABLE address_distance_cache
ADD CONSTRAINT lat_within_region CHECK (lat >= -23.46 AND lat <= -22.38),
ADD CONSTRAINT lng_within_region CHECK (lng >= -46.00 AND lng <= -44.92);

-- Add JSONB structure validation
ALTER TABLE address_distance_cache
ADD CONSTRAINT distances_valid_jsonb CHECK (jsonb_typeof(distances) = 'object');

-- Add index for faster geospatial lookup (if not exists)
CREATE INDEX IF NOT EXISTS idx_address_location ON address_distance_cache(lat, lng);

-- Add GIN index for future JSONB queries
CREATE INDEX IF NOT EXISTS idx_distances_jsonb ON address_distance_cache USING gin(distances);