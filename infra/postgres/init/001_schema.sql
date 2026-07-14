CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE scale_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bluetooth_address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'ESF-551',
  paired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE scale_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_device_id UUID NOT NULL REFERENCES scale_devices(id) ON DELETE RESTRICT,
  measured_at TIMESTAMPTZ NOT NULL,
  weight_kg NUMERIC(6, 3) NOT NULL CHECK (weight_kg > 0),
  impedance_ohms INTEGER CHECK (impedance_ohms > 0),
  raw_measurement JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scale_device_id, measured_at)
);

CREATE INDEX scale_measurements_measured_at_idx ON scale_measurements (measured_at DESC);
