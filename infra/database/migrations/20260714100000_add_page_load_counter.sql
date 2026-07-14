-- migrate:up
CREATE TABLE site_counters (
  counter_key TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0 CHECK (count >= 0)
);

-- migrate:down
DROP TABLE site_counters;
