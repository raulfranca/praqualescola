-- Create table for shared distance cache
CREATE TABLE public.address_distance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  school_id INTEGER NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one entry per address-school combination
  CONSTRAINT address_distance_cache_unique UNIQUE (lat, lng, school_id)
);

-- Index for location lookups (optimizes nearby cache search)
CREATE INDEX idx_address_distance_cache_location ON public.address_distance_cache (lat, lng);

-- Index for school_id lookups
CREATE INDEX idx_address_distance_cache_school ON public.address_distance_cache (school_id);

-- Enable Row Level Security
ALTER TABLE public.address_distance_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (anonymous users can read cached distances)
CREATE POLICY "Anyone can read cached distances"
ON public.address_distance_cache
FOR SELECT
USING (true);

-- Public insert access (anonymous users can save calculated distances)
CREATE POLICY "Anyone can insert cached distances"
ON public.address_distance_cache
FOR INSERT
WITH CHECK (true);

-- Add comment explaining the table purpose
COMMENT ON TABLE public.address_distance_cache IS 'Shared cache for distance calculations between addresses and schools to reduce Google Distance Matrix API costs';