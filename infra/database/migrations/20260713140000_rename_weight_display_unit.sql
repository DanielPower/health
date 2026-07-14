-- migrate:up
ALTER TABLE scale_devices RENAME COLUMN display_unit TO weight_display_unit;

-- migrate:down
ALTER TABLE scale_devices RENAME COLUMN weight_display_unit TO display_unit;
