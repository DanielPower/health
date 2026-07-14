-- migrate:up
ALTER TABLE scale_devices
  ADD COLUMN display_unit TEXT NOT NULL DEFAULT 'kg'
  CHECK (display_unit IN ('kg', 'lb'));

-- migrate:down
ALTER TABLE scale_devices DROP COLUMN display_unit;
