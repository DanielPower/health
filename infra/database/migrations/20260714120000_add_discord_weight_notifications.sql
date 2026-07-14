-- migrate:up
CREATE TABLE discord_weight_notifications (
  measurement_id UUID PRIMARY KEY REFERENCES scale_measurements(id) ON DELETE CASCADE,
  announced_at TIMESTAMPTZ,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO discord_weight_notifications (measurement_id, checked_at)
SELECT id, now() FROM scale_measurements;

-- migrate:down
DROP TABLE discord_weight_notifications;
