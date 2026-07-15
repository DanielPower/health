-- migrate:up
ALTER TABLE scale_devices ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- migrate:down
ALTER TABLE scale_devices DROP COLUMN is_active;
